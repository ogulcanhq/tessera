# Preview capture

Website previews are **real recordings** of a component running in the iOS Simulator, captured from the Showcase app's capture mode. Never substitute mockups, renders or placeholder images.

Recording is scripted: a UI test performs real touches on the component while `simctl` records the screen, and ffmpeg trims, crops and encodes the result. Verified on Xcode 26.2 with the iPhone 17 Pro simulator on iOS 26.2.

## Requirements

- Xcode 26.2 with the iOS 26.2 runtime and an **iPhone 17 Pro** simulator. Use this device for every preview so all previews match.
- ffmpeg (`brew install ffmpeg`) and python3 (ships with macOS developer tools)

## 1. Add capture scenarios and interactions

1. In the component's Showcase demo (`apps/showcase/TesseraShowcase/Demos/<Name>/`), add a `CaptureScenario` per preview. Scenarios must be deterministic: fixed labels, timing and outcomes. Give the component `.accessibilityIdentifier("<registry id>")` so the UI test can find it.
2. In `apps/showcase/TesseraShowcaseUITests/PreviewCaptureTests.swift`, add the interaction for each scenario to `interactions`. It must start and end at rest so the clip loops cleanly, and must wait until any result has cleared.

## 2. Record

```bash
scripts/previews/capture.sh <component-id> <scenario-id> light
scripts/previews/capture.sh <component-id> <scenario-id> dark
```

For each run the script:

1. boots the simulator and builds the Showcase for testing;
2. starts `xcrun simctl io recordVideo`, then runs `PreviewCaptureTests` in capture mode (status bar and home indicator hidden, stage color matching the website);
3. finds the first touch as the end of the resting stretch before it, because the recorder's timeline doesn't line up exactly with wall-clock time;
4. converts the variable-frame-rate recording to 30 fps (the Simulator emits no frames while the screen is still), trims it, crops the centered square and scales it to 900 × 900;
5. writes `registry/components/<id>/previews/<scenario>-<scheme>.mp4` and a poster from the last frame, `<scenario>-<scheme>-poster.png`.

Keep the component inside the middle 60% of the stage: the website crops recordings to 4:3, on cards and on the component page. Budgets, enforced by `npm run registry:check`: images ≤ 400 KB, videos ≤ 1.5 MB. A typical clip is 25–35 KB.

Set `KEEP_DIR=<dir>` to keep the raw recording and logs when a capture looks wrong.

## 3. Record metadata

Add each scenario to `component.json`, with the current source hash:

```bash
npm run registry:hash -- <component-id>
```

```jsonc
"previews": [
  {
    "id": "success",
    "title": "Loading to success",
    "media": [
      { "kind": "video", "scheme": "light", "file": "previews/success-light.mp4", "poster": "previews/success-light-poster.png", "width": 900, "height": 900 },
      { "kind": "video", "scheme": "dark", "file": "previews/success-dark.mp4", "poster": "previews/success-dark-poster.png", "width": 900, "height": 900 }
    ],
    "capture": {
      "method": "automated",
      "device": "iPhone 17 Pro",
      "os": "iOS 26.2",
      "xcode": "26.2",
      "capturedAt": "2026-10-25",
      "sourceHash": "<output of registry:hash>"
    }
  }
]
```

`sourceHash` fingerprints the component's source. When the source changes later, `registry:check` warns that the preview may be stale: recapture, or update the hash if the change isn't visual.

## Manual fallback

If the scripted run isn't possible, record by hand with the same capture mode:

```bash
DEVICE="iPhone 17 Pro"
xcodebuild build -project apps/showcase/TesseraShowcase.xcodeproj -scheme TesseraShowcase \
  -destination "platform=iOS Simulator,name=$DEVICE,OS=26.2" -derivedDataPath .build/xcode -quiet
xcrun simctl boot "$DEVICE"; open -a Simulator
xcrun simctl install booted .build/xcode/Build/Products/Debug-iphonesimulator/TesseraShowcase.app
xcrun simctl launch --terminate-running-process booted dev.tessera.Showcase \
  -tessera-capture <component-id> -tessera-scenario <scenario-id> -tessera-scheme dark

# Start, interact in the Simulator, then press Ctrl-C.
xcrun simctl io booted recordVideo --codec=h264 --force /tmp/raw.mov
```

Encode with the same settings as the script: convert to 30 fps before trimming (`-vf "fps=30,trim=start=…:duration=…,setpts=PTS-STARTPTS,crop=iw:iw,scale=900:900"`), and create the poster with accurate BT.709 conversion (`scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int`) so it matches the stage color. Use `"method": "manual"` in the metadata.
