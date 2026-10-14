# Putting Dormly live

## 1. Lock down your data (do this BEFORE going live)
Your website talks straight to Firebase, so the rules below are what actually keep private data safe.

**Firestore rules**
1. Firebase console -> Build -> Firestore Database -> Rules
2. Delete what is there, paste in everything from `firestore.rules`, click **Publish**.

**Storage rules** (proof-of-payment files)
1. Build -> Storage -> Rules
2. Paste in everything from `storage.rules`, click **Publish**.
   (If Storage says "Get started", click it first and choose a location, e.g. `africa-south1`.)

**Make yourself an admin** (so you can review payment submissions)
1. Sign up on the site with your own email.
2. Firestore -> Authentication tab: copy your User UID.
3. Firestore Database -> Start collection `admins` -> Document ID = your UID (add any field, e.g. `note: owner`).

## 2. Allow your website address to log in
Authentication -> Settings -> Authorized domains -> **Add domain**:
- `YOUR-USERNAME.github.io` (if using GitHub Pages)
- or your own domain later. `localhost` is already allowed for testing.

## 2b. Email verification (new)
New accounts must click a link in a verification email before they can use the site.
- Firebase sends it automatically (Authentication -> Sign-in method: Email/Password must be enabled).
- Customise the wording: Authentication -> Templates -> Email address verification.
- The first emails often land in spam, so tell people to check there.
- Accounts made before this update will be asked to verify the next time they log in.

## 3. Publish the site
**Option A - GitHub Pages (free)**
1. Create a GitHub repo (e.g. `dormly`) and upload everything in this folder so `index.html` is at the top level.
2. Repo -> Settings -> Pages -> Deploy from a branch -> `main` / `(root)` -> Save.
3. Live at `https://YOUR-USERNAME.github.io/dormly/` after 1-2 minutes.

**Option B - Firebase Hosting (free tier, same project)**
```
npm install -g firebase-tools
firebase login
firebase deploy
```
That publishes the site AND the Firestore/Storage rules from this folder. Your site will be at
`https://dormly-ffc9a.web.app` (add that to Authorized domains too).

## 4. Test with two accounts
0. Check your inbox: signing up should send a verification email. Click the link, then press "I've verified my email".
1. Sign up as a **Student** -> should land on the student dashboard.
2. Sign up as a **Landlord** (different email) -> should land on the landlord dashboard; add a property.
3. As the student, open Listings and check the property shows, send a message, try a payment upload.
4. Confirm a student cannot open `landlord-dashboard.html` and a landlord cannot open `booking.html`.

If something says "Missing or insufficient permissions", a rule is blocking it. Open the browser console (F12) to see which one.
