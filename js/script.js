import { auth, db, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    setDoc,
    getDoc,
    addDoc,
    collection,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    checkDocFile,
    getVerification,
    submitVerification,
    friendlyVerificationError
} from "./verification.js";

// =========================
// FRIENDLY MESSAGES
// =========================

function showFormMessage(text) {
    const box = document.getElementById("formMessage");
    if (box) {
        box.textContent = text;
        box.style.display = "block";
        box.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        alert(text);
    }
}

function friendlyError(error) {
    const messages = {
        "auth/email-already-in-use": "An account with this email already exists. Please log in instead.",
        "auth/weak-password": "Your password is too weak. Please use at least 6 characters.",
        "auth/invalid-email": "That email address does not look right. Please check it.",
        "auth/missing-password": "Please enter a password.",
        "auth/invalid-credential": "Wrong email or password. Please try again.",
        "auth/user-not-found": "No account found with that email. Please sign up first.",
        "auth/wrong-password": "Wrong email or password. Please try again.",
        "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
        "auth/network-request-failed": "Network problem. Please check your internet connection.",
        "auth/operation-not-allowed": "Email/password sign-in is not switched on in Firebase yet (Authentication > Sign-in method).",
        "auth/unauthorized-domain": "This website address is not authorised in Firebase yet (Authentication > Settings > Authorized domains).",
        "permission-denied": "Firebase blocked saving your details. The Firestore rules may not be published yet."
    };
    return messages[error && error.code] || (error && error.message) || "Something went wrong. Please try again.";
}

function setBusy(formId, busy, label) {
    const button = document.querySelector("#" + formId + " button[type=submit]");
    if (!button) return;
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? label : button.dataset.label;
}

// =========================
// SIGN UP
// =========================

window.signup = async function () {

    const box = document.getElementById("formMessage");
    if (box) box.style.display = "none";

    if (!document.getElementById("role").value) {
        showFormMessage("Please choose whether you are a Student or a Landlord.");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    // Landlords must attach their documents. Check them BEFORE the account is
    // created, so nobody ends up with an account and a failed upload.
    let verification = null;
    if (role === "landlord") {
        verification = {
            name: name,
            accreditor: document.getElementById("accreditor").value,
            accreditationNumber: document.getElementById("accreditationNumber").value,
            idFile: document.getElementById("idDoc").files[0],
            letterFile: document.getElementById("letterDoc").files[0]
        };
        const problem = !verification.accreditor
            ? "Please choose who accredited your accommodation."
            : checkDocFile(verification.idFile, "ID document") ||
              checkDocFile(verification.letterFile, "accreditation letter");
        if (problem) {
            showFormMessage(problem);
            return;
        }
    }

    setBusy("signupForm", true, "Creating account...");

    try {

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await setDoc(doc(db, "users", userCredential.user.uid), {

            name: name,
            email: email,
            role: role,
            createdAt: new Date()

        });

        // Landlords: upload ID + accreditation letter for admin review.
        // If this fails the account still exists, and the landlord dashboard
        // lets them submit the documents again.
        if (verification) {
            try {
                await submitVerification(userCredential.user, verification);
            } catch (uploadError) {
                console.error("Verification upload error:", uploadError);
                try {
                    sessionStorage.setItem("dormlyVerifyUploadFailed", friendlyVerificationError(uploadError));
                } catch (e) { /* storage blocked: the dashboard card still asks for the documents */ }
            }
        }

        // Send the verification email, then ask them to check their inbox
        try {
            await sendEmailVerification(userCredential.user);
        } catch (mailError) {
            console.error("Verification email error:", mailError);
        }

        window.location.href = "verify-email.html";

    } catch(error) {

        console.error(error);
        setBusy("signupForm", false);
        setBusy("loginForm", false);
        showFormMessage(friendlyError(error));

    }

};


// CONNECT SIGNUP FORM

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", function (e) {

        e.preventDefault();

        window.signup();

    });

}

// =========================
// LOGIN
// =========================

window.login = async function () {

    const box = document.getElementById("formMessage");
    if (box) box.style.display = "none";

    setBusy("loginForm", true, "Logging in...");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try{

        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        // Must confirm their email address before using the site
        if (!credential.user.emailVerified) {
            window.location.href = "verify-email.html";
            return;
        }

        // Send landlords and students to their own dashboards
        let role = "student";

        try {
            const userDoc = await getDoc(doc(db, "users", credential.user.uid));
            if (userDoc.exists() && userDoc.data().role) {
                role = userDoc.data().role;
            }
        } catch (roleError) {
            console.error("Could not read role:", roleError);
        }

        window.location.href =
            role === "landlord" ? "landlord-dashboard.html" : "dashboard.html";

    }
    catch(error){

        console.error(error);
        setBusy("signupForm", false);
        setBusy("loginForm", false);
        showFormMessage(friendlyError(error));

    }

};

// =========================
// LOGOUT
// =========================

window.logout = async function(){

    await signOut(auth);

    window.location.href = "login.html";

};

// =========================
// PAGE PROTECTION
// =========================

window.protectPage = function(){

    onAuthStateChanged(auth,(user)=>{

        if(!user){

            window.location.href="login.html";

        }

    });

};

// =========================
// LOAD DASHBOARD
// =========================

window.loadDashboard = function(){

    onAuthStateChanged(auth, async(user)=>{

        if(!user){

            window.location.href="login.html";
            return;

        }

        try{

            const userDoc = await getDoc(doc(db,"users",user.uid));

            if(userDoc.exists()){

                document.getElementById("userName").textContent =
                userDoc.data().name;

            }

        }
        catch(error){

            console.error(error);

        }

    });

};

// =========================
// ADD PROPERTY
// =========================

const MIN_PHOTOS = 1;          // set to 0 if photos should be optional
const MAX_PHOTOS = 10;
const PHOTO_MAX_SIDE = 1600;   // longest side in pixels after shrinking
const PHOTO_QUALITY = 0.82;

function loadImageFile(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(file.name + " could not be read as a photo."));
        };
        img.src = url;
    });
}

// Shrinks a photo in the browser before upload, so listings load fast on
// slow connections and Storage stays cheap. Always returns a JPEG.
async function compressImage(file) {

    const img = await loadImageFile(file);

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, PHOTO_MAX_SIDE / longest);
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";          // PNGs with see-through areas turn white, not black
    context.fillRect(0, 0, width, height);
    context.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error(file.name + " could not be prepared for upload."));
        }, "image/jpeg", PHOTO_QUALITY);
    });

}

window.uploadProperty = async function () {

    const user = auth.currentUser;

    if (!user) {

        alert("Please log in first.");
        window.location.href = "login.html";
        return;

    }

    const photos = (typeof window.getSelectedPhotos === "function"
        ? window.getSelectedPhotos()
        : []).slice(0, MAX_PHOTOS);

    if (photos.length < MIN_PHOTOS) {

        alert("Please add at least " + MIN_PHOTOS + " photo" +
              (MIN_PHOTOS === 1 ? "" : "s") + " of the property.");
        return;

    }

    // Deposit question: yes (with an amount) or no deposit (10% booking fee applies)
    const depositChoice = document.getElementById("depositRequired")
        ? document.getElementById("depositRequired").value
        : "";
    const depositAmountValue = Number(
        document.getElementById("depositAmount")
            ? document.getElementById("depositAmount").value
            : 0
    );

    if (depositChoice !== "yes" && depositChoice !== "no") {
        alert("Please tell us whether you want a deposit paid.");
        return;
    }

    if (depositChoice === "yes" && !(depositAmountValue > 0)) {
        alert("Please enter the deposit amount.");
        return;
    }

    const property = {

        propertyName: document.getElementById("propertyName").value.trim(),

        description: document.getElementById("description").value.trim(),

        rent: Number(document.getElementById("rent").value),

        university: document.getElementById("university").value.trim(),

        address: document.getElementById("address").value.trim(),

        phone: document.getElementById("phone").value.trim(),

        rooms: Number(document.getElementById("rooms").value),

        bathrooms: Number(document.getElementById("bathrooms").value),

        wifi: document.getElementById("wifi").value,

        parking: document.getElementById("parking").value,

        status: document.getElementById("status").value,

        propertyType: document.getElementById("propertyType").value,

        depositRequired: depositChoice === "yes",

        depositAmount: depositChoice === "yes"
            ? Math.round(depositAmountValue * 100) / 100
            : 0,

        ownerId: user.uid,

        createdAt: serverTimestamp()

    };

    const statusBox = document.getElementById("uploadStatus");
    const say = (text) => { if (statusBox) statusBox.textContent = text; };

    setBusy("propertyForm", true, "Uploading...");

    // Not approved yet? Save as a private draft. It goes live automatically
    // when an admin approves the landlord. (If the check fails, a draft is the safe default.)
    let approved = false;
    try {
        const v = await getVerification(user.uid);
        approved = !!(v && v.status === "approved");
    } catch (e) { console.error("Could not check verification:", e); }
    const targetCollection = approved ? "properties" : "propertyDrafts";

    const uploaded = [];      // photo files already in Storage (cleaned up if saving fails)
    let storageTools = null;

    try{

        // Make the property's ID first, so its photos can be filed under it
        const propertyRef = doc(collection(db, targetCollection));
        let imageUrls = [];

        if (photos.length) {

            const { getApp } = await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js");
            storageTools = await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js");
            const storage = storageTools.getStorage(getApp());

            let finished = 0;
            say("Uploading photos (0 of " + photos.length + ")...");

            const results = await Promise.allSettled(photos.map(async (file, index) => {

                const blob = await compressImage(file);

                const fileRef = storageTools.ref(
                    storage,
                    "propertyImages/" + user.uid + "/" + propertyRef.id + "/" + (index + 1) + ".jpg"
                );

                await storageTools.uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
                uploaded.push(fileRef);

                const url = await storageTools.getDownloadURL(fileRef);

                finished++;
                say("Uploading photos (" + finished + " of " + photos.length + ")...");

                return url;

            }));

            const failed = results.find((r) => r.status === "rejected");
            if (failed) throw failed.reason;

            // Promise.allSettled keeps the order, so the cover photo stays first
            imageUrls = results.map((r) => r.value);

        }

        say("Saving property...");

        await setDoc(propertyRef, { ...property, imageUrls: imageUrls });

        say("");

        alert(approved
            ? "Property uploaded successfully!"
            : "Property saved as a draft. It will go live automatically as soon as your verification is approved."); 

        document.getElementById("propertyForm").reset();

        if (typeof window.clearSelectedPhotos === "function") {
            window.clearSelectedPhotos();
        }

    }
    catch(error){

        console.error(error);

        say("");

        // Don't leave photos behind for a property that was never saved
        if (storageTools && uploaded.length) {
            await Promise.all(uploaded.map((fileRef) =>
                storageTools.deleteObject(fileRef).catch(() => {})
            ));
        }

        if (error && typeof error.code === "string" && error.code.startsWith("storage/")) {

            alert(error.code === "storage/unauthorized"
                ? "Firebase blocked the photo upload. Check that the new storage rules are published (firebase deploy --only storage) and that you are logged in as a landlord with a verified email."
                : "Your photos could not be uploaded. Please check your internet connection and try again.");

        } else {

            alert(friendlyError(error));

        }

    }
    finally {

        setBusy("propertyForm", false);

    }

};


// =========================
// FORGOT PASSWORD
// =========================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const emailInput = document.getElementById("resetEmail");
        const resetMessage = document.getElementById("resetMessage");

        const email = emailInput.value.trim();

        if (!email) {
            resetMessage.textContent = "Please enter your email address.";
            return;
        }

        resetMessage.textContent = "Sending reset email...";

        try {

            await sendPasswordResetEmail(auth, email);

            resetMessage.textContent =
                "✅ Password reset email sent! Check your inbox and spam folder.";

        } catch (error) {

            console.error("PASSWORD RESET ERROR:", error);

            resetMessage.textContent =
                "❌ " + error.code + " — " + error.message;
        }
    });
}

const changeEmailBtn = document.getElementById("changeEmailBtn");
if (changeEmailBtn) {
  changeEmailBtn.addEventListener("click", async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const msg = document.getElementById("changeEmailMsg");
    const newEmail = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("currentPassword").value;

    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await verifyBeforeUpdateEmail(user, newEmail);
      msg.textContent = "Check your new inbox and click the link to confirm. Then sign in again with the new email.";
    } catch (e) {
      msg.textContent = e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
        ? "Wrong password."
        : e.code === "auth/email-already-in-use"
        ? "That email already has an account."
        : "Couldn't change email: " + e.code;
    }
  });
}
