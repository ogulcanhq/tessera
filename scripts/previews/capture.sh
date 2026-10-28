#!/usr/bin/env bash
# Records one capture scenario from the Showcase in the iOS Simulator and
# encodes it for the website. Real touches come from PreviewCaptureTests.
#
#   scripts/previews/capture.sh <component-id> <scenario-id> <light|dark>
#
# Writes registry/components/<id>/previews/<scenario>-<scheme>.mp4 and
# <scenario>-<scheme>-poster.png (900×900). Requires Xcode, the pinned
# simulator and ffmpeg. See docs/preview-capture.md.
set -euo pipefail

COMPONENT=${1:?usage: capture.sh <component-id> <scenario-id> <light|dark>}
SCENARIO=${2:?usage: capture.sh <component-id> <scenario-id> <light|dark>}
SCHEME=${3:?usage: capture.sh <component-id> <scenario-id> <light|dark>}
DEVICE=${DEVICE:-iPhone 17 Pro}
OS=${OS:-26.2}

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
OUT="$ROOT/registry/components/$COMPONENT/previews"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
# KEEP_DIR=<dir> keeps the raw recording and logs for debugging.
[[ -n "${KEEP_DIR:-}" ]] && trap 'cp "$WORK"/* "$KEEP_DIR"/; rm -rf "$WORK"' EXIT
DESTINATION="platform=iOS Simulator,name=$DEVICE,OS=$OS"
XCODEBUILD=(xcodebuild -project "$ROOT/apps/showcase/TesseraShowcase.xcodeproj" -scheme TesseraShowcase
  -destination "$DESTINATION" -derivedDataPath "$ROOT/.build/xcode")

now() { python3 -c 'import time; print(time.time())'; }

UDID=$(xcrun simctl list devices available -j | python3 -c "
import json, sys
runtime = 'iOS-' + '$OS'.replace('.', '-')
for key, devices in json.load(sys.stdin)['devices'].items():
    if key.endswith(runtime):
        for d in devices:
            if d['name'] == '$DEVICE':
                print(d['udid']); sys.exit()
sys.exit('No $DEVICE simulator with iOS $OS')")
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b >/dev/null

echo "Building the Showcase for testing…"
"${XCODEBUILD[@]}" -quiet build-for-testing

echo "Recording $COMPONENT/$SCENARIO ($SCHEME)…"
xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$WORK/raw.mov" >"$WORK/record.log" 2>&1 &
RECORDER=$!
for _ in $(seq 1 100); do
  grep -q "Recording started" "$WORK/record.log" 2>/dev/null && break
  sleep 0.1
done
RECORDING_START=$(now)

TEST_RUNNER_TESSERA_CAPTURE_COMPONENT="$COMPONENT" \
  TEST_RUNNER_TESSERA_CAPTURE_SCENARIO="$SCENARIO" \
  TEST_RUNNER_TESSERA_CAPTURE_SCHEME="$SCHEME" \
  "${XCODEBUILD[@]}" test-without-building \
  -only-testing:TesseraShowcaseUITests/PreviewCaptureTests/testCapture >"$WORK/test.log" 2>&1 || {
  kill -INT "$RECORDER" 2>/dev/null || true
  tail -30 "$WORK/test.log"
  exit 1
}

kill -INT "$RECORDER"
wait "$RECORDER" || true

START=$(grep -m1 -o "TESSERA-CAPTURE start [0-9.]*" "$WORK/test.log" | awk '{print $3}')
END=$(grep -m1 -o "TESSERA-CAPTURE end [0-9.]*" "$WORK/test.log" | awk '{print $3}')
[[ -n "$START" && -n "$END" ]] || { echo "No capture markers in the test log." >&2; exit 1; }
# The recorder's timeline doesn't line up exactly with wall-clock time, so
# align on content instead: the first touch is where the 2 s resting stretch
# before it ends. Pick the still segment ending closest to the expected time.
EXPECTED=$(python3 -c "print($START - $RECORDING_START)")
# Detect on the band around the component: across the full frame a press is
# too small a change to register.
ffmpeg -hide_banner -nostats -i "$WORK/raw.mov" -vf "crop=iw:iw*0.4:0:(ih-iw*0.4)/2,freezedetect=n=0.003:d=1" \
  -an -f null - 2>"$WORK/freeze.log" || true
TOUCH=$(python3 - "$WORK/freeze.log" "$EXPECTED" <<'PY'
import re, sys
ends = [float(m) for m in re.findall(r"freeze_end: ([0-9.]+)", open(sys.argv[1]).read())]
if not ends:
    sys.exit("No resting stretch found in the recording.")
print(min(ends, key=lambda t: abs(t - float(sys.argv[2]))))
PY
)
OFFSET=$(python3 -c "print(max(0, $TOUCH - 0.5))")
# Interaction length plus a short rest at the end, matching the 0.5 s lead-in.
DURATION=$(python3 -c "print($END - $START + 0.5)")

mkdir -p "$OUT"
NAME="$SCENARIO-$SCHEME"
# Center square crop of the portrait screen; the component sits in the middle.
# The Simulator records variable frame rate and emits no frames while the
# screen is still, so seeking with -ss would skip the resting frames. Convert
# to a constant rate first, then trim.
ffmpeg -loglevel error -y -i "$WORK/raw.mov" \
  -vf "fps=30,trim=start=$OFFSET:duration=$DURATION,setpts=PTS-STARTPTS,crop=iw:iw,scale=900:900" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an "$OUT/$NAME.mp4"
# Poster from the last frame: at rest, and where the loop restarts.
# Accurate BT.709 conversion matches how browsers decode the video; ffmpeg's
# default (fast) path lands a couple of levels darker than the stage color.
ffmpeg -loglevel error -y -sseof -0.1 -i "$OUT/$NAME.mp4" -frames:v 1 -update 1 \
  -vf "scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int,format=rgb24" "$OUT/$NAME-poster.png"

echo "Wrote $(cd "$ROOT" && realpath --relative-to=. "$OUT/$NAME.mp4" 2>/dev/null || echo "$OUT/$NAME.mp4") ($(du -h "$OUT/$NAME.mp4" | cut -f1)), poster $(du -h "$OUT/$NAME-poster.png" | cut -f1)"
