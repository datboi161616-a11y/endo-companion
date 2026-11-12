# Endo Companion

A personal endometriosis symptom diary built with Expo / React Native. Original implementation based on the requested tracking features; no Endolog code or branding is included. No REA analysis was performed because the original binary was unavailable.

## Included

- Daily pain score, flow, symptoms, mood, sleep, medication/relief, and notes
- Previous-day editing, calendar, history, and average pain over the latest 30 recorded days
- Local persistence, delete individual entries, CSV export, JSON backup and merge import
- iPhone/iPad configuration and EAS cloud build profiles
- Runnable web build in `dist/`

## Try it on an iPhone

Install Node.js LTS on your computer, unzip this project, and run:

```sh
npm ci
npx expo start --tunnel
```

Install **Expo Go** on the iPhone and scan the terminal QR code using Camera. Expo Go must support this project's Expo SDK 58; if the store version does not yet support it, use the signed build route below. The computer must remain available while using the development server. No Apple developer membership is needed for Expo Go. For a standalone app, build the IPA.

## Build an installable iPhone app (cloud)

Use your own Expo account. A paid Apple Developer Program membership is normally needed for EAS internal device distribution.

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli device:create
npx eas-cli build --platform ios --profile preview
```

Register your wife's iPhone through the device registration link before building. Follow EAS's Apple authentication/signing prompts locally. EAS builds on a hosted Mac and provides an installation link for registered devices. Set a unique `expo.ios.bundleIdentifier` in `app.json` if necessary. Install the resulting app from the EAS link; Developer Mode may be required depending on the signing method. Do not share account passwords in chat.

For TestFlight, use `--profile production`, then submit through App Store Connect (requires membership and setup). If you only have a free Apple account, building/signing via Xcode on a Mac is the practical alternative, with Apple's free provisioning limits. Sideloadly can re-sign a compatible IPA, but cannot compile this source project. No IPA has been compiled or signed in this Linux workspace.

## Development and verification

```sh
npm run typecheck
npm test
npx expo export --platform web
npx expo export --platform ios --output-dir dist-ios
npm run web
```

The iOS export checks Metro bundling, not native compilation or device operation. Native file sharing/import still needs a real-device check.

## Data

Entries use AsyncStorage, without app-level encryption. There is no application backend or analytics. Device/cloud backups can include app storage. Uninstalling or clearing storage can delete records: save JSON backups through Settings. CSV and JSON exports contain sensitive health information. JSON imports merge by date, replacing matching dates with the imported record. Web storage belongs to the current browser and origin. This is a diary, not a diagnostic or cycle prediction tool.
