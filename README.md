# Dewy

A skincare companion app for building routines, tracking products, and keeping your daily rituals beautifully organized.

**[Download the Android APK](https://github.com/JStanoeva/dewy/releases/latest/download/dewy.apk)**

Your phone must allow installing apps from the browser or file manager you open the APK with (Android asks the first time). The APK talks to the hosted Dewy backend, so you can create an account and try it with no setup.

## About

Dewy keeps a shelf of the skincare products you own and the ones on your wishlist. What it does today:

- Sign up and log in with email and password. The session survives app restarts.
- Keep your products on a shelf with Owned and Wishlist sides, category filters and pull to refresh.
- Open a product to see its shelf life, key actives and notes.
- Add, edit, favourite and delete products, move wishlist products to your shelf, and put a product that is running out on your wishlist for the next bottle.
- Track shelf life: the opened date and the "use within" period show how long each opened product has left.
- Take or choose a product photo, stored privately for your account.
- Optionally fill in a new product's name, brand, type, packaging, size and key actives from the label in its photo.
- Give a product its size to see about how many uses it has left as you tick it off, with products running low flagged on the Shelf.
- Build morning and evening routines from the products you own: pick each step's days, time and wait, then drag steps into a new order, edit them, or swipe them away with Undo on the Routines tab.
- Tick off today's morning or evening steps on the Today tab. Ticks are saved per day, so they survive a restart and start fresh the next morning.
- See ritual tips made from your products' key actives, such as "Skip exfoliating acids tonight" next to a retinoid, on Today and on each product's page.

## Tech stack

- Expo SDK 58 with React Native 0.88 and React 19
- TypeScript in strict mode
- React Navigation 7 (native stack and bottom tabs)
- TanStack Query 5 for server state
- React Hook Form 7 with Zod 4 validation
- Supabase: Auth, Postgres with row level security, Storage and Edge Functions
- expo-image-picker and expo-image-manipulator for product photos, expo-image to display them
- aes-js and expo-crypto to encrypt the session, expo-secure-store for its key and AsyncStorage for the ciphertext; AsyncStorage also remembers whether Today's tips are folded
- react-native-svg for the bottle drawings and the progress arc
- Reanimated 4 and Gesture Handler 3 for dragging routine steps into a new order and swiping them away
- @react-native-community/datetimepicker and @react-native-community/slider for the opened date and a step's time
- Jest with jest-expo, ESLint and Prettier

## Prerequisites

- [Node.js](https://nodejs.org/) 22 (22.13 or later), 24 (24.3 or later), or 26 and newer (the versions Expo SDK 58 supports), with npm
- The Expo Go app on an Android phone, updated to a version that supports SDK 58
- A [Supabase](https://supabase.com/) project of your own

## Install

```bash
npm install
```

On Windows, if PowerShell refuses to run `npm` or `npx` because running scripts is disabled, type `npm.cmd` and `npx.cmd` instead (for example `npx.cmd expo start`), or use Command Prompt.

## Backend setup

1. Create a new project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open the SQL Editor and run these files from `supabase/migrations`, one at a time and in this order:
   1. `001_profiles.sql`
   2. `002_products.sql`
   3. `003_product_photos_storage.sql`
   4. `004_more_categories.sql`
   5. `005_routine_steps.sql`
   6. `006_routine_completions.sql`
   7. `007_step_note_important.sql`
   8. `008_product_packaging.sql`
   9. `009_product_amount_actives.sql`
   10. `010_product_uses.sql`
   11. `011_add_routine_steps.sql`
   12. `012_product_client_id.sql`
   13. `013_onboarding_backfill.sql`
   14. `014_finish_onboarding.sql`

   Run each file once, before anyone signs up. `003_product_photos_storage.sql` creates the private `product-photos` bucket itself, so don't create it by hand.

3. Go to **Authentication → Sign In / Providers → Email**, turn off **Confirm email** and save. New accounts then sign in straight away. With it on, sign-up creates the account but the app stays on the sign-up screen.
4. Open the project's **Connect** dialog. It shows the project URL and the publishable key. The publishable key is also listed under **Settings → API Keys**.

## Environment setup

Copy the example file.

macOS or Linux:

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Windows (Command Prompt):

```bat
copy .env.example .env
```

Then open `.env` and replace both placeholders with your project URL and publishable key:

- `EXPO_PUBLIC_SUPABASE_URL`: your project URL, like `https://abcd1234.supabase.co`
- `EXPO_PUBLIC_SUPABASE_KEY`: your publishable key

The app accepts only a publishable key (`sb_publishable_...`). A secret key or a legacy `anon` key is rejected. If a value is missing or invalid, the app shows a configuration-error screen that lists the problem instead of crashing.

## Run

```bash
npx expo start
```

Scan the QR code with Expo Go on your Android phone. Your phone and computer must be on the same network.

If you aren't logged in to an Expo account, the terminal asks you to log in when your phone connects. Choose **Proceed anonymously**, and the app finishes loading.

## Optional: reading labels from photos

When you add a photo to a new product, Dewy can read the product's name, brand, type, packaging, size in ml and key actives from its label and fill in the fields that are still empty. The key actives come only from a visible ingredient list, so a photo of the back fills the most; a second photo fills only what is still empty. This uses a Supabase Edge Function that calls Anthropic's Claude API. The app works fully without it: the fields simply stay empty for you to fill in.

To turn it on for your own Supabase project, you need an [Anthropic API key](https://console.anthropic.com/). Then run these commands from the repository root, one at a time:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase functions deploy read-product-label --no-verify-jwt
npx supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
```

The deploy and secrets commands ask for confirmation, so type `y` when prompted. The function checks the signed-in user itself, which is why it is deployed with `--no-verify-jwt`.

**Privacy:** with this turned on, a product photo is sent to Anthropic's Claude API right after you pick it in New product, only to read the label. Nothing is saved until you tap Save, and the function doesn't store or log the photo. See [Anthropic's Privacy Center](https://privacy.claude.com/) for how Anthropic handles API data.

## Scripts and tests

```bash
npm test
npm run typecheck
npm run lint
npm run format
```

- `npm test` runs the unit tests with Jest.
- `npm run typecheck` checks types with the TypeScript compiler.
- `npm run lint` runs ESLint.
- `npm run format` formats the code with Prettier.

## Building the APK

The `preview` profile in `eas.json` builds an installable Android APK. `app.config.ts` points at the original author's Expo project, so set up your own first:

1. Log in to your Expo account:

   ```bash
   npx eas-cli login
   ```

2. In `app.config.ts`, set `owner` to your Expo username and delete `extra.eas.projectId`.
3. Create your own EAS project:

   ```bash
   npx eas-cli init
   ```

   Confirm when it asks to create the project. It prints the new project ID, then stops with an error because it can't edit `app.config.ts` itself. That is expected: paste the printed ID into `extra.eas.projectId`.

4. EAS doesn't upload your `.env` file. Create `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` in the EAS **preview** environment, with plain text visibility:

   ```bash
   npx eas-cli env:set --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://your-project-ref.supabase.co --visibility plaintext
   npx eas-cli env:set --environment preview --name EXPO_PUBLIC_SUPABASE_KEY --value your-publishable-key --visibility plaintext
   ```

5. Build the APK:

   ```bash
   npx eas-cli build -p android --profile preview
   ```

## Functional Guide

### Project Overview

- **Application Name:** Dewy
- **Application Category / Topic:** Health and beauty: a personal skincare companion.
- **Main Purpose:** Dewy helps people keep track of their skincare products. Users keep a shelf of the products they own and a wishlist of the ones they want. For each opened product, Dewy shows how long it has left before it should be replaced. Owned products make up a morning and an evening routine, with each step's days, time and wait, and Dewy turns the products' key actives into ritual tips on Today. A daily checklist on the Today tab lets users tick off each step.

### User Access & Permissions

#### Guest (Not Authenticated)

- A guest sees only the Auth screen. It has a Sign up / Log in switch. Like every screen, its colours follow the time of day: peach in the morning, plum in the evening.
- Sign up asks for a name, email and password. Log in asks for email and password.
- There is no guest browsing. Every other screen requires a signed-in user.
- The backend enforces this too. Guests have no access to the database tables or the photo storage, and the label-reading function rejects requests without a signed-in user.

#### Authenticated User

- **Onboarding:** a new account first sees "Start your shelf" instead of the tabs. "Add a product" opens the New product form for an owned product, and each saved product joins the list under it, oldest first, with × to remove it at once. Continue opens "Your first rituals", where Dewy has placed each product in the morning, the evening or both: a retinoid or exfoliating acids go to the evening, vitamin C to the morning, and otherwise the type decides (SPF in the morning, a mask in the evening, a cleanser in both). Each row has a sun and a moon toggle to flip that, and a product with both off "Stays on your shelf only". A plum card under the list sums up each ritual as the toggles change ("Morning · 3 steps · about 3 min") with a small bottle per step. Continue there saves both rituals and opens Today; Back keeps the flips. "Skip for now" (while step 1's list is empty) or Skip at the top finishes onboarding without any ritual steps. Products added here stay on the shelf. An account only sees onboarding until it finishes or skips it, on any device.
- **Main sections:** four bottom tabs (Today, Shelf, Routines, Me) and a raised centre "+" button that opens the New product form.
  - **Today:** the date, a "Good morning" or "Good evening" greeting with the user's name, a Morning / Evening switch, a progress arc with one dot per step and a sun or moon where the progress ends ("2 of 5 steps done · 4 min to go"), and the checklist of that routine's steps for today's weekday. Above the list, banners show the routine's tips for today, made from the listed products' key actives: a retinoid gets "Skip exfoliating acids tonight", vitamin C in the morning gets "Follow with SPF, they protect better together" when the morning routine has an SPF, and products that don't mix (such as vitamin C and a retinoid) get a gentle reminder to split them. Each banner starts with its product's name. With two or more banners, "Hide tips" folds them into one line ("3 tips for today" with a Show link); they stay folded until Show is tapped, and open again by themselves when a day shows a tip that wasn't there when they were folded. Tapping a step ticks or unticks it; a long press opens its product. Once every step is ticked, the arc reads "All done — go glow" (or "All done — sweet dreams" in the evening). Pulling down refreshes the list. The switch picks which ritual Today lists, and the pick holds until the other half of the day. The app's colours and the greeting follow the clock instead: light morning colours from 05:00 to 16:59, plum evening colours from 17:00 to 04:59. The day turns over at 05:00, so evening steps ticked after midnight count for that evening.
  - **Shelf:** the user's products in a two-column grid, with Owned and Wishlist sides and category chips. Products in a routine carry an AM, PM or AM · PM tag, and products with 5 or fewer uses left say so ("≈ 5 uses left").
  - **Routines:** "Your rituals" with Morning and Evening. It opens on the routine Today shows, then keeps its own choice; its switch changes only its list, not the colours. Each routine shows a week strip, the number of steps and the time they take, and the ordered steps with their days and waits. A step looks the same here as on Today: "Step 3 · Treat", the product's name and its time, with its days at the end of the time row. Every card is the same height: a long name ends in "…". Dragging a step by its dotted handle moves it: the other steps slide out of the way, the list scrolls by itself near its top and bottom edges, and the new order is saved when the step is dropped. Tapping a step opens the step editor, and "Add a step from your shelf" adds one. Pulling down refreshes the list.
  - **Me:** the user's initial, name, "Glowing with Dewy since" with the month and year they joined ("Nov 2026"), and Log out.
- **Details screen:** Product details, opened by tapping a product card on the Shelf, by a long press on a step on Today, or by "View it" after adding a product to the wishlist. For an owned product with a size it shows how many uses are left ("≈ 42 uses"), a bar of how full the bottle is, and how long that lasts at the product's routine days ("30 ml · about 6 weeks at 1 use a day"). "Feels off? Adjust" restarts the count from how full it is now.
- **Create:** add a product, with an optional photo, add an owned product to the wishlist as a new unopened copy, or add a routine step.
- **Edit:** edit a product, mark it as a favourite, or move a wishlist product to the shelf. Edit a routine step, or move it up or down.
- **Delete:** delete a product after a confirmation step (its photo is removed too), or remove a routine step from Edit step or with a swipe and Undo.
- Each user sees and changes only their own data. Row level security in Postgres and storage policies enforce this on the server.

### Authentication & Session Handling

#### Authentication Flow

1. **When the app starts**, the splash screen stays up while the fonts load and the environment values are checked. If the Supabase URL or key is missing or invalid, a configuration-error screen is shown instead of the app.
2. **Auth status** comes from Supabase Auth. The app listens to `onAuthStateChange` and keeps the splash screen up until the stored session has been read, for at most 5 seconds. It then shows the signed-in screens if there is a session, and the Auth screen if there isn't.
3. **On successful login or registration**, Supabase emits the new session and the navigator loads the user's profile, showing a loader meanwhile. It then switches to onboarding if the account hasn't finished it, and to the tabs otherwise. The screen doesn't navigate by itself. A database trigger creates the user's profile row with their name at sign-up. When the app starts with a stored session, the splash screen also waits for the profile, for at most 5 seconds.
4. **On logout**, the Me tab's Log out button signs out this device. The stored session and its encryption key are deleted, the cached data and cached product photos are cleared, and the app returns to the Auth screen.

#### Session Persistence

- The session is encrypted with a random AES-256 key (AES-CTR). The key is stored in expo-secure-store, which Android Keystore encrypts. For the session, AsyncStorage holds only the ciphertext, no token is stored in plaintext, and neither is included in Android backups. Apart from the session, AsyncStorage keeps one display setting for the phone: whether Today's tips are folded.
- **Automatic login:** on the next launch, Supabase reads and decrypts the stored session. If it is still valid, or the token can be refreshed, the user goes straight to the tabs without logging in again. Tokens refresh automatically while the app is in the foreground.

### Navigation Structure

#### Root Navigation Logic

- One root native stack inside a `NavigationContainer`.
- Its screens depend on the session:
  - **Signed out:** only `Auth`.
  - **Signed in, profile still loading or failed:** only `ProfileGate`, a loader or an error with Try again and Log out.
  - **Signed in, onboarding not finished:** `ShelfStep` ("Start your shelf"), `RitualsStep` ("Your first rituals") and the `ProductForm` modal, opened with `{ status: 'owned', lockStatus: true }` so it saves owned products only. The toggles flipped on `RitualsStep` live in a small context above the stack, so going back to `ShelfStep` and returning keeps them.
  - **Signed in and onboarded:** `Main` (the tabs), `ProductDetails`, and two modals: `ProductForm` and `RoutineStepForm` (the step editor, with `{ period, stepId? }` params).
- Only one group is rendered at a time, so a guest can't reach app screens, a signed-in user never sees Auth, and finishing onboarding swaps the group without a `navigate` call.

#### Main Navigation

- A bottom tab navigator with four tabs: Today, Shelf, Routines and Me.
- A custom tab bar adds a raised "+" button between Shelf and Routines. It isn't a tab: it opens the New product form.

#### Nested Navigation

- Shelf, Routines and Me each have their own native stack. For now each stack holds one screen: Shelf, Routines and Profile.
- Product details, the product form and the step editor sit on the root stack, so they cover the tab bar.
- A routine chip on Product details returns to the tabs with `popTo` and opens the Routines tab on that routine through nested params (`RoutinesTab` → `Routines { period }`).
- On Today, "Edit" opens the Routines tab on the shown routine through the same nested params (`RoutinesTab` → `Routines { period }`), with a plain `navigate` because Today is already inside the tabs. A long press on a step opens `ProductDetails`, and the empty states open the step editor or the product form.
- "View it" after adding a product to the wishlist opens the new copy with `navigation.push('ProductDetails', …)`, so Back returns to the original product.
- The More options menu on Product details is a modal sheet, not a separate route.

### List → Details Flow

#### List / Overview Screen

- The Shelf lists the user's products, newest first, in a two-column grid.
- Each card shows the photo or, without one, a drawing of the product's packaging (dropper, pump, jar, tube or spray), the brand, the name and a status line. For owned products that line is the shelf life (for example "5 months left", or "Unopened"), and an opened product also shows a bar of the shelf life left. With 30 days or fewer left, the bar and the line turn the warning colour ("Use within 3 weeks", "Expires today"). An owned product with 5 or fewer uses left shows "≈ 5 uses left" in the warning colour instead, with a bar of how full it is, unless it has expired ("Expired" always wins). For wishlist products it is the date the product was saved.
- Under the title, a summary counts the owned products and how many of them are expiring or running low, leaving out any part that is 0 ("7 products · 1 expiring · 1 running low"). On the Wishlist side it reads "3 products you have your eye on", and the Owned / Wishlist switch shows each side's count.
- A tag on the picture shows which routines an owned product is in ("AM", "PM" or "AM · PM"). Wishlist products show "Wish".
- The user switches between Owned and Wishlist, filters by category (Cleanser, Exfoliant, Toner, Mist, Serum, Moisturizer, SPF, Mask) and pulls down to refresh.

#### Details Screen

- Tapping a card calls `navigation.navigate('ProductDetails', { productId })`.
- The screen receives only `productId` through route params. It shows the cached product at once, then loads the latest version of it from Supabase.
- It shows the photo, category and brand, a shelf-life card, key actives, ritual tips and notes, plus the favourite and More options buttons.
- A chip for each routine the product is in shows its place there, for example "Morning · step 1". Tapping it opens the Routines tab on that routine.

### Data Source & Backend

#### Backend Type

- A real backend: Supabase, used through `@supabase/supabase-js`.
- **Supabase Auth** handles email and password accounts.
- **Postgres** holds five tables, `profiles`, `products`, `routine_steps`, `routine_completions` (one row per ticked step and day, which also records the step's product) and `ritual_days` (one row per finished routine and day). Row level security limits every row to its owner, a routine step can only point to its owner's own product, and a tick can only point to its owner's own step. Ticks and finished-routine rows can be added or removed only for days around today, so past days stay as they were.
- **Storage** holds product photos in a private bucket, one folder per user. Photos are shown through signed links that expire after an hour.
- **Edge Functions** run the optional label reading, which calls Anthropic's Claude API.

### Data Operations (CRUD)

#### Read (GET)

- The Shelf fetches all of the user's products with TanStack Query and shows them in the grid. It also reads the use counts from `product_uses()` to flag products running low; pull to refresh fetches them again.
- Product details fetches one product by its id, and every product's use count in one call to the database function `product_uses()` (its ticks since the count started).
- Routines fetches the user's routine steps for both routines, each with its product. The Shelf tags and the Product details chips use the same cached list.
- Edit step fetches one step by its id.
- Today reads the cached routine steps and the day's ticks, and keeps only the steps whose days include today's weekday. It also reads the products, which it uses to tell an empty shelf from an empty routine.
- Today and Me read the user's profile for the name and the join date. The root navigator reads the same profile to decide between onboarding and the tabs (`onboarding_completed_at`).
- "Start your shelf" reads the cached products and lists the owned ones, oldest first. "Your first rituals" lists the same products in ritual order (cleanser, exfoliant, toner, mist, serum, moisturizer, SPF, mask, then by name).

#### Create (POST)

- The user taps "+" (or "Add a product" on an empty screen), fills in the New product form and taps "Save to shelf" or "Save to wishlist".
- A chosen photo is uploaded to Storage first, then the product row is inserted. The new card goes straight to the top of the shelf and the form closes.
- **Add to wishlist:** on an owned product, More options → "Add to wishlist". Dewy first reads the wishlist from the server. If it already has a product with the same name and brand, nothing is added and a dialog says "Already on your wishlist" with "View it". Otherwise the photo is copied to its own file in Storage, a new wishlist product is inserted with the name, brand, type, packaging and key actives (no notes, dates, size or heart), and a dialog says "Added to your wishlist" with "View it". The owned product doesn't change.
- On Routines, "Add a step from your shelf" opens "Add to your routine". The user picks an owned product that isn't in both routines yet (one already in a routine is tagged "In AM" or "In PM"). They tick Morning, Evening or both, set its days, time and wait, and tap "Add to both rituals", "Add to morning" or "Add to evening". One database function adds the step to the end of each ticked routine, so both are saved or neither is.
- On Today, ticking a step inserts a completion for that step and day. The tick shows at once and is saved in the background; a tick already saved from another device is ignored instead of failing. Once every step of a routine due today is saved as ticked, Today also saves a row for that finished routine and day.

#### Update / Delete (Mutation)

- **Finish onboarding:** Continue on "Your first rituals" sends every step in ritual order (the morning's, then the evening's, each with its type's default time) to one database function, `finish_onboarding`. It adds the steps one by one to the end of each routine, skips any that are already there, and sets the profile's `onboarding_completed_at`, all in one transaction, so a failed save leaves nothing half-done and a retry never adds a step twice. "Skip for now" and Skip only set `onboarding_completed_at`. Either way the saved value goes straight into the cached profile, so the app switches to the tabs. Accounts made before onboarding existed were marked as finished by `013_onboarding_backfill.sql`.
- **Remove from "Start your shelf":** × deletes the product at once, photo included, using the same delete as Product details.
- **Edit product:** saves the changes, then puts the saved product straight into the cached details and list. A replaced or removed photo is deleted from Storage.
- **Favourite:** the heart updates at once and rolls back if saving fails.
- **Move to shelf:** turns a wishlist product into an owned, unopened one.
- **Adjust the amount:** on Product details, "Feels off? Adjust" opens "How full is it now?". Picking Full, ¾, ½ or ¼ saves it and restarts the use count from today; the tiles are disabled while it saves, and an error shows under them if it fails.
- **Delete product:** after confirmation, the product disappears from the shelf at once and comes back if the delete fails. Its photo is removed from Storage.
- **Edit step:** tapping a step on Routines opens Edit step to change its days, time and wait. "Move up" and "Move down" reorder the routine through a database function. "Remove step" removes it after a confirmation step; the product stays on the shelf.
- **Swipe to remove:** swiping a step left on Routines uncovers "Remove". Letting go past halfway takes the step away at once and shows "{name} removed" with Undo for about 5 seconds; letting go sooner slides the card back. The delete is sent only when that bar goes (the time runs out, another step is removed, the routine or tab changes, a step opens, a drag starts or Dewy goes to the background), so Undo just shows the step again. If the delete fails, the step comes back with an alert. Removals and reorders save one at a time, so a drag right after a removal is saved after the delete.
- **Reorder:** dropping a dragged step on Routines, or "Move up" and "Move down" in Edit step, saves the whole routine's order through one database function. The new order shows at once and the old one comes back if saving fails (Routines also says so in an alert). Orders save one at a time, so a quick second drag can't be overtaken by the first.
- **Untick:** tapping a ticked step on Today deletes that day's completion, and the routine's finished row for that day if it had one. If saving a tick or an untick fails, only that step flips back and an error explains why.
- After each change, the product, routine and completion queries are refreshed so every screen shows the latest data. Removing a step keeps its ticks, so its product keeps its use count; deleting a product deletes its steps and ticks. A finished routine's row stays either way.

### Forms & Validation

#### Forms Used

- **Auth form** (Sign up / Log in): name (sign-up only), email and password.
- **Product form** (New product / Edit product): status (I own it / Wishlist, new products only), photo, product name, brand, type, packaging (five tiles: dropper, pump, jar, tube and spray; a new product takes its type's usual bottle until one is tapped), opened on, use within, size in ml and how full it is (owned products only; a card estimates the uses it holds as you type), key actives (any of Retinoid, Vitamin C, AHA / BHA and Benzoyl peroxide; Dewy makes the ritual tips from them) and notes.
- **Adjust** (Product details): "How full is it now?" with the four fullness tiles.
- **Step form** (New step / Edit step): product and ritual (two Morning and Evening checkbox tiles; new steps only), days (seven day buttons), time (a slider from 10 seconds to 10 minutes), wait before the next step.

#### Validation Rules

The auth, product and step forms use React Hook Form with Zod schemas. Adjust needs no validation: it saves the tile that was tapped.

- **Email:** required and must be a valid email address.
- **Sign-up password:** required, at least 8 characters and at most 72 bytes (multiple rules).
- **Name (sign-up):** required, up to 40 characters.
- **Product name:** required, at least 2 and up to 80 characters (multiple rules).
- **Brand:** optional, up to 60 characters.
- **Type:** one of the eight categories must be picked.
- **Packaging:** one of the five bottles; a new product without a pick saves its type's usual one.
- **Opened on:** for owned products, a date from 2000 onward and not in the future.
- **Use within:** required once an opened date is set.
- **Size:** optional; for owned products, a whole number of ml from 1 to 1000 (multiple rules: "Whole numbers only", "From 1 to 1000 ml"). A wishlist product saves no size.
- **How full is it?:** one of Full, ¾, ½ or ¼. When editing a product that already has a size, no tile is picked: leaving it keeps the count, and picking one restarts it from today.
- **Key actives:** any of the four, each at most once.
- **Notes:** up to 500 characters.
- **Step product:** one of your owned products must be picked.
- **Step ritual:** at least one ticked ritual must be able to take the product ("Pick where this step goes."). A ritual that already has the picked product shows "Already in" and doesn't count (a rule across two fields).
- **Days:** at least one day must be ticked.

Database CHECK constraints back up the product rules on the server: name 2–80 characters, brand up to 60, one of the eight types, one of the five packagings (filled from the type when an older app version doesn't send one), an opened date from 2000 on (with one day of slack for time zones), "Use within" required once an opened date is set, key actives from the four offered (each once), a size of 1 to 1000 ml, a fullness of full, ¾, ½ or ¼, a count start date from 2000 on, and notes up to 500. The profile name is capped at 40 characters. A routine step needs at least one day (Monday to Sunday), a time of 10 seconds to 30 minutes, a wait of 1 to 60 minutes or none, and one of the same user's products, at most once per routine. A tick belongs to one of the same user's steps, at most once per day. Supabase Auth checks the email and password.

### Native Device Features

#### Used Native Feature(s)

- Camera and photo library (expo-image-picker)
- Image resizing and JPEG conversion (expo-image-manipulator)
- Secure key storage (expo-secure-store)
- The Android date picker dialog (@react-native-community/datetimepicker)

#### Usage Description

- In the product form, "Take photo" opens the camera and "Choose photo" opens the photo library. Both crop the photo to a square.
- Camera permission is requested when the user taps "Take photo", never at startup. If it is denied, the app explains how to turn it on and offers to open Settings.
- Each photo is resized and saved as a JPEG, then uploaded to the user's private Storage folder when the product is saved.
- In New product, a new photo can also be used to fill in the name, brand, type, packaging, size and key actives from its label (see the optional label reading section). Anything already typed, tapped or ticked stays as it is.
- The "Opened on" field opens the Android date dialog.
- expo-secure-store holds the key that encrypts the saved session.

### Typical User Flow

1. Open Dewy, choose Sign up, enter your name, email and password, and tap "Create account".
2. Dewy opens "Start your shelf", the first step of onboarding. Tap "Add a product" to open New product.
3. Tap "Take photo" or "Choose photo". If label reading is set up, empty fields are filled in from the label.
4. Check the name and brand, pick a type, keep today as the opened date, pick a "Use within" period, type the size in ml and watch the estimate card, tick its key actives, add notes, then tap "Save to shelf".
5. The product joins the list on "Start your shelf" (× would remove it). Tap Continue: "Your first rituals" shows where Dewy placed it. Make sure only Morning is on (a filled sun, an outlined moon) and watch the plum card follow, then tap Continue: you land on Today, which greets you by name, with the product as the morning's first step.
6. Open the Shelf tab. The new card shows the photo and how long the product has left. Try the category chips and pull to refresh.
7. Open the Routines tab: the morning already lists the product. Pick Evening and tap "Add a step". Pick the product (tagged "In AM"), keep every day ticked and tap "Add to evening". Back on the Shelf, the card now carries an "AM · PM" tag. Tap it: its details show "Morning · step 1" and "Evening · step 1", and each chip opens that ritual on the Routines tab.
8. Tap the centre "+" and save a second owned product, a serum with Retinoid ticked under Key actives. On the Routines tab, switch to Evening, tap "Add a step from your shelf", pick that serum (Evening is already ticked), leave only Monday, Wednesday and Friday ticked, slide the time, and tap "Add to evening". Drag the serum by its dotted handle above the first step and let go: the order is saved. Tap it to change its days.
9. Open the Today tab and pick Evening, then Morning: the list changes ritual, while the colours and the greeting stay with the time of day. On a Monday, Wednesday or Friday evening the serum from step 8 brings two tips above the steps, "Skip exfoliating acids tonight" and "Wear SPF tomorrow morning"; "Hide tips" folds them and "Show" opens them again. Its product page lists the same tips under Ritual tips. Tap a step to tick it off: the arc, its dot, the count and the minutes left update. Close and reopen Dewy, and the tick is still there.
10. Add a product with "Wishlist" selected. It appears on the Wishlist side.
11. Tap a card to open its details, and tap the heart to mark it as a favourite.
12. Open More options to edit the product, move a wishlist product to your shelf, add an owned product to your wishlist, or delete a product. Deleting a product also removes its routine steps and their ticks.
13. On the Me tab, tap Log out.

### Error & Edge Case Handling

- **Authentication errors** are shown on the right field or above the button in plain language: wrong email or password, an email that already has an account, an invalid email, a weak password, too many attempts, no connection, and a general fallback.
- **Network or data errors:** screens that load data (Shelf, Product details, Edit product, Routines, New step, Edit step, Today, Me, "Start your shelf" and "Your first rituals") show "Something went wrong" with a "Try again" button. Data that is already loaded stays visible.
- **Profile errors after sign-in:** if the profile can't be loaded, Dewy shows "We couldn't load your profile" with "Try again" and "Log out", so it never waits on a loader forever. Finishing onboarding offline shows "Couldn't reach Dewy. Check your connection and try again." above the button and stays on the step; on "Your first rituals" a failed Continue says "We couldn't save your rituals", nothing is saved, and the button tries again.
- **Slow or stalled connections:** every request to the backend gives up if the server hasn't answered within 15 seconds (a photo upload within 60, a label read within 20), so a spinner never runs forever. A screen retries its data once before it shows the error, and a save shows its error instead.
- **Saves that may have landed:** if a new product was saved but the answer never arrived, saving again finds that product instead of adding a second copy.
- **Failed saves:** the product form shows an error above the Save button. A failed favourite shows "Couldn't save your favourite" and the heart flips back. A failed move, add to wishlist or delete shows its error in the More options sheet, and a failed delete puts the product back on the shelf. A photo that can't be used shows "Couldn't use that photo". The step form shows its own errors: a failed save above its button, a failed move under the Move buttons, and a failed remove in its confirmation sheet. If another device added the product to a ticked routine first, nothing is saved: that routine shows "Already in" with a message, and one more tap adds the rest. A failed tick on Today flips back and shows "Couldn't save this step" (asking to check the phone's date and time when the server refuses that day); a step removed on another device says it is no longer in your routine.
- **Duplicate taps:** buttons are disabled while a request is running, so a form or action can't be sent twice, even with two quick taps. The product form's fields are locked while it saves. On Today, a step ignores taps while its tick is saving. On "Start your shelf", × ignores a second tap that follows a removal within a moment, so the row sliding up under the finger isn't removed too, and the button waits for the product list before it picks Continue or "Skip for now". On "Your first rituals" the toggles, Back and Skip are locked while Continue saves.
- **Empty states:** "Start your shelf" with no products suggests a cleanser, a moisturizer and SPF, and its button becomes a quiet "Skip for now". An empty Shelf or category shows "Nothing here yet" with an "Add a product" button. Today asks for a product first, offers "Add a step" when the routine has no steps, and says "Nothing this morning" (or evening) when none of its steps fall on today. Routines asks for a product first, or, when there are products but no steps in that routine, offers "Add a step". New step says when every owned product is already in both routines.
- **Missing data:** a product that was deleted elsewhere shows "This product is no longer on your shelf" with a Back button (Close in Edit product), and a removed step shows "This step is no longer in your routine" with a Close button.
- **Photos:** if a photo can't load, the Shelf card and Product details show a bottle illustration instead, and the product form shows an empty photo frame.
- **Malformed data:** products, routine steps and ticks from the server are checked with Zod before use, so a malformed row (such as an impossible date) shows the screen's error state instead of crashing it.
- **Unexpected screen errors:** if a screen fails while drawing, Dewy shows "Something went wrong" and "Dewy couldn't show this screen." with a "Try again" button instead of closing. Try again starts again from Today and keeps the data already loaded.
- **Configuration:** missing or invalid environment values show a setup screen instead of a crash.

## License

[MIT](LICENSE)
