// =====================================================
// DORMLY ACCESS GUARD
// - Reads <body data-require="student|landlord|any"> and
//   sends people to the right page if they are not allowed.
// - Updates the navigation for logged-in people.
// Note: this keeps honest users on the right pages. The REAL
// protection of private data is in firestore.rules / storage.rules.
// =====================================================
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const need = document.body.dataset.require || "";
const HOME = { student: "dashboard.html", landlord: "landlord-dashboard.html" };

async function logoutAndLeave(event) {
    event.preventDefault();
    await signOut(auth);
    window.location.href = "login.html";
}

function updateNav(user, role) {
    const list = document.querySelector("nav ul");
    if (!list || !user) return;

    // Hide Login / Sign Up once signed in
    list.querySelectorAll('a[href="login.html"], a[href="signup.html"]').forEach((a) => {
        const li = a.closest("li");
        if (li) li.remove();
    });

    // Landlords get their own dashboard link; hide links meant for the other role
    list.querySelectorAll('a[href="dashboard.html"]').forEach((a) => {
        if (role === "landlord") a.setAttribute("href", HOME.landlord);
    });
    const hide = role === "landlord"
        ? ['a[href="booking.html"]', 'a[href="payment.html"]']
        : ['a[href="add-property.html"]', 'a[href="landlord-dashboard.html"]'];
    list.querySelectorAll(hide.join(",")).forEach((a) => {
        const li = a.closest("li");
        if (li) li.remove();
    });

    // Make sure there is a Dashboard link and a Logout link
    if (!list.querySelector('a[href="' + HOME[role] + '"]')) {
        const li = document.createElement("li");
        li.innerHTML = '<a href="' + HOME[role] + '">Dashboard</a>';
        list.appendChild(li);
    }
    if (!list.querySelector('a[onclick*="logout"], a[data-logout]')) {
        const li = document.createElement("li");
        li.innerHTML = '<a href="#" data-logout class="nav-btn outline">Logout</a>';
        list.appendChild(li);
    }
    document.querySelectorAll('a[onclick*="logout"], a[data-logout]').forEach((a) => {
        a.onclick = logoutAndLeave;
    });
}

function showGuardError(error) {
    console.error(error);
    const box = document.getElementById("guard-notice");
    if (box) {
        box.className = "error";
        box.innerHTML = "This page could not load: <b></b><br><br>" +
            'Please <a href="login.html">log in again</a>. If it keeps happening, check your Firebase rules and authorized domains.';
        box.querySelector("b").textContent = error && error.message ? error.message : String(error);
    }
}

onAuthStateChanged(auth, async (user) => {
  try {
    let role = null;

    if (user) {
        role = "student"; // accounts made before roles existed count as students
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists() && snap.data().role) role = snap.data().role;
        } catch (error) {
            console.error("Could not read role:", error);
        }
    }

    if (need && !user) {
        window.location.replace("login.html");
        return;
    }

    // Everyone must confirm their email address first
    if (need && user && !user.emailVerified) {
        window.location.replace("verify-email.html");
        return;
    }

    if ((need === "student" || need === "landlord") && role !== need) {
        window.location.replace(HOME[role] || "dashboard.html");
        return;
    }

    updateNav(user, role);
    document.body.classList.add("auth-ready");
  } catch (error) {
    showGuardError(error);
  }
}, showGuardError);
