# Putting Dormly live

> **Upload the WHOLE folder, not just the .html files.** The `css`, `js` and `images` folders must sit next to the HTML files, or the site shows up plain and login/sign-up do nothing.
> Firebase project: `d-ormly`. Add your live address under Authentication -> Settings -> Authorized domains.
> Hosting: for a real launch use Firebase Hosting (Option B below) or Cloudflare Pages, not GitHub Pages (its terms don't allow running a business on it).

## 1. Lock down your data (do this BEFORE going live)
Your website talks straight to Firebase, so the rules below are what actually keep private data safe.

**Firestore rules**
1. Firebase console -> Build -> Firestore Database -> Rules
2. Delete what is there, paste in everything from `firestore.rules`, click **Publish**.

**Storage rules** (proof-of-payment files AND property photos)
1. Build -> Storage -> Rules
2. Paste in everything from `storage.rules`, click **Publish**.
   (If Storage says "Get started", click it first and choose a location, e.g. `africa-south1`.)
3. Property photo uploads are rejected until these rules are published. Landlords can add up to 10 photos per property; they are shrunk in the browser before upload.

**Make yourself an admin** (so you can review payment submissions)
1. Sign up on the site with your own email.
2. Firestore -> Authentication tab: copy your User UID.
3. Firestore Database -> Start collection `admins` -> Document ID = your UID (add any field, e.g. `note: owner`).

## 1b. Landlord verification (new)
Landlords must now upload their **ID** and **accreditation letter** when they sign up. An admin approves or rejects them, and only approved landlords can add properties.

**What was added**
- `signup.html`: landlords see an upload section (accrediting body, reference number, ID, accreditation letter).
- `landlord-dashboard.html`: a status card (not submitted / under review / approved / rejected with the reason). A rejected landlord can upload again from here.
- `add-property.html`: landlords can fill this in while waiting. Until they are approved the property is saved as a private draft (`propertyDrafts`), not a live listing.
- `admin.html`: the review page (see below).
- `firestore.rules` and `storage.rules`: **you must publish both again** (`firebase deploy --only firestore,storage`). Until they are published, uploads are refused and landlords cannot list.

**Firestore structure**
```
landlordVerifications/{landlordUid}
    landlordId, landlordName, landlordEmail
    accreditor            "NSFAS" | "University" | "Other"
    accreditationNumber   optional text
    idDocPath, letterPath paths in Storage (private, not public links)
    status                "pending" | "approved" | "rejected"
    submittedAt
    reviewedAt, reviewedBy, rejectionReason     (set by an admin only)
Storage: verificationDocs/{landlordUid}/{timestamp}-id.ext and -letter.ext

propertyDrafts/{id}     same fields as a property (ownerId, imageUrls, ...) but private to the landlord + admins
```
**Drafts go live on approval:** when you press **Approve** on `admin.html`, the page saves the approval and copies every draft of that landlord into `properties` in one all-or-nothing step (the card shows "N draft listings will go live when you approve" first). Rejecting leaves the drafts untouched. Photos for drafts are uploaded straight away, so they are in Storage already.

**Reviewing landlords**
1. Make yourself an admin first (the `admins` collection step in section 1).
2. Log in and open `https://YOUR-SITE/admin.html` (there is no link to it for other users).
3. Open each landlord's ID and letter, then press **Approve**, or **Reject** with a reason the landlord will see.
4. Anyone who is not in `admins` just sees "No access" there, and the rules block them from the data as well.

**Landlords who signed up before this update** have no verification record, so they must upload documents from their dashboard like everyone else. If you would rather approve them without documents, create a document in `landlordVerifications` with the landlord's UID as the ID and these fields: `landlordId` (their UID), `landlordName`, `landlordEmail`, `accreditor` = `Other`, `idDocPath` = `manual`, `letterPath` = `manual`, `status` = `approved`.

## 1c. Bookings, deposits and the booking fee (new)

**Owners are asked about a deposit** on the add-property form ("Do you want a deposit paid?"). Yes means they enter an amount, which the student pays directly to the owner (Dormly does not collect it). No means the student pays a **booking fee of 10% of the monthly rent**, added at the end of their summary. Existing properties have no answer yet, so they work exactly as before until the owner answers; the dashboard shows a "please tell us if you want a deposit" nudge and a **Deposit** button on each listing.

**What a student pays Dormly** (see `js/pricing.js`, the only place the maths lives)
| Owner's answer | Student transfers to Dormly |
|---|---|
| Deposit required | 10% commission (deposit paid to owner separately) |
| No deposit | 10% commission **+ 10% booking fee** |
| Not answered yet | 10% commission (as before) |

To make the booking fee **replace** the commission for no-deposit properties instead of adding to it, set `BOOKING_FEE_REPLACES_COMMISSION = true` in `js/pricing.js`. Change `BOOKING_FEE_RATE` to change the percentage.

**Booking requests:** when a student presses "Proceed to Payment" a record is saved in `bookings/{studentUid}_{propertyId}` and appears under **Booking Requests** on the owner's dashboard (student name, email, move-in date, study period, special requests, status). Owners see: Awaiting student payment, Payment being verified by Dormly, Confirmed. They never see proof of payment or bank details. Students see the same status on their dashboard.

**Confirming payments:** open `admin.html` and the **Payments to check** tab. View the proof, check the money arrived with the matching reference, then **Confirm payment received** (booking becomes Confirmed for the owner and student) or **Reject** with a reason (the student can pay again). Rules: `bookings` is new, so **publish `firestore.rules` again**.

**Not changed:** listings that already exist stay visible to students. Only publishing new properties is gated.

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
firebase hosting:channel:deploy test     (optional: a private preview link to test first)
firebase deploy                          (publishes the site AND the Firestore/Storage rules)
```
Your site will be at `https://d-ormly.web.app` (add that to Authorized domains too).
To publish only the site and the Storage rules: `firebase deploy --only hosting,storage`

## 4. Test with two accounts
0. Check your inbox: signing up should send a verification email. Click the link, then press "I've verified my email".
1. Sign up as a **Student** -> should land on the student dashboard.
2. Sign up as a **Landlord** (different email) -> should land on the landlord dashboard; add a property.
3. As the student, open Listings and check the property shows, send a message, try a payment upload.
3b. Landlord verification: sign up as a landlord with a test ID and letter, check the dashboard says "under review", then add a property and confirm it appears under **Drafts** (and not in Listings for a student). Approve it on `admin.html` and confirm the draft is now a live listing. Reject another test account and confirm the reason shows and re-upload works.
3c. Bookings: as an owner set one property to "No deposit" and another to a deposit. As a student book each and check the summary (booking fee at the end for no deposit, deposit line for the other). Check the booking shows on the owner's dashboard, then confirm the payment on `admin.html` and see it turn Confirmed.
4. Confirm a student cannot open `landlord-dashboard.html` and a landlord cannot open `booking.html`.

If something says "Missing or insufficient permissions", a rule is blocking it. Open the browser console (F12) to see which one.
