DORMLY SITE
-----------
Styled to match the Dormly prototype (navy + green, Inter / Fraunces fonts).

START HERE: read DEPLOY.md to secure the data and put the site live.

Roles:      students -> dashboard.html, landlords -> landlord-dashboard.html (js/guard.js)
Verify:     landlords upload ID + accreditation letter at signup (js/verification.js); admins review at admin.html
Security:   firestore.rules and storage.rules (publish them in the Firebase console)
Colours:    css/style.css, edit the values at the top (:root)
Images:     default-property.jpg (shown only when a listing has no photos), user.png,
            team1-3.jpg live in images/. Property photos are uploaded by landlords
            (up to 10 per property) and stored in Firebase Storage under propertyImages/.
Test locally with:  python -m http.server   then open http://localhost:8000
