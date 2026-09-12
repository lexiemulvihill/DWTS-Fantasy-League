# DWTS Fantasy League — standalone PWA

This is the same app you had in Claude, rebuilt to run on its own — no Claude
account needed, installable to a phone's home screen like a real app.

## What you need to do (about 10 minutes, one time)

### 1. Create a free Firebase project
1. Go to https://console.firebase.google.com → **Add project** → give it any
   name (e.g. "dwts-fantasy") → you can skip Google Analytics.
2. In your new project, click the **</>** (web) icon to register a web app.
   Give it any nickname. Firebase will show you a config object that looks
   like this:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "dwts-fantasy.firebaseapp.com",
     projectId: "dwts-fantasy",
     storageBucket: "dwts-fantasy.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
   };
   ```
   Copy that whole object.
3. Paste it into `src/firebase.js` in this project, replacing the placeholder
   values.

### 2. Turn on the two Firebase features this app uses
Both are on the free "Spark" plan — no credit card required.
1. **Authentication** → Get started → enable the **Anonymous** sign-in
   method. (This just gives each device a private ID — nobody sees a login
   screen or enters a password.)
2. **Firestore Database** → Create database → start in **production mode** →
   pick any region.
3. In Firestore, go to the **Rules** tab and paste in the contents of
   `firestore.rules` from this project, then click **Publish**.

### 3. Run it locally to confirm it works
```bash
npm install
npm run dev
```
Open the printed `localhost` URL. Try creating a league — if it works, your
Firebase config and rules are correct.

### 4. Deploy it so your league can actually reach it
Easiest path is Vercel or Netlify — both have free tiers that are plenty for
this:
```bash
npm run build
```
This produces a `dist/` folder. Drag that folder onto
https://app.netlify.com/drop for an instant URL, or connect this project's
Git repo to Vercel/Netlify for a URL that updates whenever you push changes.

### 5. Install it like an app
Open the deployed URL on a phone:
- **iOS (Safari):** Share button → *Add to Home Screen*
- **Android (Chrome):** ⋮ menu → *Install app* (or *Add to Home Screen*)

It'll launch full-screen with its own icon from then on.

## What's different from the Claude version

- **Real accounts, not an honor system.** Each device gets its own private
  Firebase identity automatically — no visible login, but it's a real
  backend now instead of a Claude-only storage API.
- **The AI score-lookup feature is disabled.** It called Claude's API
  directly using credentials that only exist inside Claude's sandbox. The
  button now tells the person to enter scores manually. Wiring up a real
  version of this would mean adding your own AI API key behind a small
  server function — ask me if you want that built.
- **Sync is still polling-based** (checks every few seconds), not instant
  push. Firestore does support real-time listeners if you want to upgrade
  that later.

## Project structure
- `src/App.jsx` — the whole app (same one from Claude, storage calls swapped)
- `src/storage.js` — Firestore-backed replacement for the old `window.storage`
- `src/firebase.js` — **put your config here**
- `firestore.rules` — paste into the Firebase console
- `public/icon-*.png` — app icons used by the PWA manifest
