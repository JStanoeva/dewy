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

## Optional: reading labels from photos

When you add a photo to a new product, Dewy can read the product's name, brand and type from its label and fill in the fields that are still empty. This uses a Supabase Edge Function that calls Anthropic's Claude API. The app works fully without it: the fields simply stay empty for you to fill in.

To turn it on for your own Supabase project, you need an [Anthropic API key](https://console.anthropic.com/). Then run:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase functions deploy read-product-label --no-verify-jwt
npx supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
```

The function checks the signed-in user itself, which is why it is deployed with `--no-verify-jwt`.

**Privacy:** with this turned on, a product photo is sent to Anthropic's Claude API right after you pick it in New product, only to read the label. Nothing is saved until you tap Save, and the function doesn't store or log the photo. See [Anthropic's Privacy Center](https://privacy.claude.com/) for how Anthropic handles API data.

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

## License

[MIT](LICENSE)
