# Endo Companion

A local iPhone diary built in Expo and React Native. The iOS version uses the calendar and logging flow structure observed in Endolog 1.3.10. The implementation runs independently and stores logs on the device.

## Install on iPhone

Use the unsigned IPA from the **Build Sideloadly IPA** GitHub Actions workflow. Connect and unlock the iPhone, load the IPA into Sideloadly, and sign it with your Apple Account. To update the previous Endo Companion build in place, use the same signing account and bundle identifier. Export a diary backup before reinstalling. The app requires iOS 16.4 or later.

## Diary

The Today calendar shows the selected day's logs. You can create multiple entries per day, edit or delete entries, and filter the list by type. The Year view shows pain and period activity by month. The Health view summarizes the last 30 days.

Log pain, period flow, food and reactions, bowel movements, heating pad sessions, TENS sessions, and daily notes. A food entry can include a photo selected from Files. Customize pain locations, descriptors, symptoms, food, and medications in Settings.

The PDF report contains a date-filtered summary and daily entries. Use Settings to export or import a JSON diary backup. Imports merge by entry ID. Logs from the previous Endo Companion build load automatically when the new diary has no saved data. JSON backups and PDF reports contain the data you choose to export.

## Develop

```sh
npm ci
npm test
npm run typecheck
npm run web
```
