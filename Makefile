# Tessera task runner. `make verify` runs everything CI runs.
#
# Override the simulator if yours differs:
#   make test-swift DEST='platform=iOS Simulator,name=iPhone 16 Pro'

DEST ?= platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2
DERIVED_DATA := .build/xcode
XCODEBUILD := xcodebuild -derivedDataPath $(DERIVED_DATA) -destination '$(DEST)' -quiet
SHOWCASE := -project apps/showcase/TesseraShowcase.xcodeproj -scheme TesseraShowcase
SWIFT_PATHS := Package.swift Sources Tests apps/showcase

.PHONY: help bootstrap format lint-swift test-swift build-showcase test-showcase swift \
        registry standalone test-scripts web verify clean

help:
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-16s %s\n", $$1, $$2}'

bootstrap: ## Install JavaScript dependencies
	npm ci

format: ## Format Swift sources in place
	swift format --in-place --recursive $(SWIFT_PATHS)

lint-swift: ## Check Swift formatting
	swift format lint --strict --recursive $(SWIFT_PATHS)

test-swift: ## Build and test the Swift package on the iOS Simulator
	$(XCODEBUILD) test -scheme Tessera

build-showcase: ## Build the Showcase app
	$(XCODEBUILD) build $(SHOWCASE)

test-showcase: ## Run Showcase UI tests (launch modes + accessibility audit)
	$(XCODEBUILD) test $(SHOWCASE)

swift: lint-swift test-swift test-showcase ## All Swift checks

registry: ## Validate the registry
	npm run registry:check

standalone: ## Typecheck copy-paste source as a plain app target would
	npm run registry -w web
	npm run standalone:check

test-scripts: ## Test registry tooling
	npm run test:scripts

web: ## Typecheck, lint and build the website
	npm run typecheck
	npm run lint
	npm run build:web

verify: swift registry standalone test-scripts web ## Everything CI runs

clean: ## Remove build output
	rm -rf .build apps/web/.next apps/web/out apps/web/.generated apps/web/public/previews
