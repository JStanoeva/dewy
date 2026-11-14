# Dewy

A skincare companion app for building routines, tracking products, and keeping your daily rituals beautifully organized.

Keep a shelf of the products you own and the ones on your wishlist, build morning and evening routines, check off today's steps, and track how long each opened product has left.

## Prerequisites

- [Node.js](https://nodejs.org/) 22.13+, 24.3+, or 26 (the versions Expo SDK 58 supports), with npm
- The [Expo Go](https://expo.dev/go) app on your phone, updated to a version that supports SDK 58
- A [Supabase](https://supabase.com/) project of your own

## Install

```bash
npm install
```

## Environment setup

Copy the example file:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholders with your Supabase project URL and publishable key. Both are in your project's Supabase dashboard, under the Connect dialog.

## Run

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Your phone and computer must be on the same network.

## Useful scripts

```bash
npm run typecheck   # check types
npm run lint        # run ESLint
npm run format      # format code with Prettier
```

## Credits

Scanning a barcode fills in product details from [Open Beauty Facts](https://world.openbeautyfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).

## License

[MIT](LICENSE)
