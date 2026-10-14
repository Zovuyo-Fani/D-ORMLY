import { auth, db } from "./firebase.js";

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

    setBusy("signupForm", true, "Creating account...");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

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

window.uploadProperty = async function () {

    const user = auth.currentUser;

    if (!user) {

        alert("Please log in first.");
        window.location.href = "login.html";
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

        ownerId: user.uid,

        createdAt: serverTimestamp()

    };

    try{

        await addDoc(
            collection(db,"properties"),
            property
        );

        alert("Property uploaded successfully!");

        document.getElementById("propertyForm").reset();

    }
    catch(error){

        console.error(error);

        alert(error.message);

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