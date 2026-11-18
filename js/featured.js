// =====================================================
// DORMLY HOMEPAGE - latest REAL listings
// Shows the newest available properties from the database.
// Listings are only readable by signed-in people (see firestore.rules),
// so visitors who are not logged in are invited to sign up instead.
// =====================================================
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { escapeHtml, coverPhoto, FALLBACK_IMAGE } from "./utils.js";

const box = document.getElementById("featuredCards");

const HOW_MANY = 3;

function showNote(html) {
    box.innerHTML = '<div class="featured-note">' + html + "</div>";
}

function formatRent(rent) {
    const number = Number(rent);
    return Number.isFinite(number) ? number.toLocaleString("en-ZA") : escapeHtml(rent);
}

function cardHtml(id, property) {
    return `
        <div class="card">

            <img
                src="${escapeHtml(coverPhoto(property))}"
                alt="${escapeHtml(property.propertyName)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">

            <div class="card-content">

                <h3>${escapeHtml(property.propertyName)}</h3>

                <div class="price">R${formatRent(property.rent)}/month</div>

                <p>
                    🎓 ${escapeHtml(property.university)}<br>
                    🛏 ${escapeHtml(property.rooms)} room(s) · 🚿 ${escapeHtml(property.bathrooms)} bathroom(s)<br>
                    📶 Wi-Fi: ${escapeHtml(property.wifi)} · 🚗 Parking: ${escapeHtml(property.parking)}
                </p>

                <br>

                <button onclick="location.href='property.html?id=${encodeURIComponent(id)}'">
                    View Details
                </button>

            </div>

        </div>
    `;
}

async function loadLatest() {

    try {

        // Newest first; a few extra are fetched so occupied ones can be skipped
        const snapshot = await getDocs(
            query(collection(db, "properties"), orderBy("createdAt", "desc"), limit(12))
        );

        const available = [];

        snapshot.forEach((docSnap) => {
            const property = docSnap.data();
            if (property.status !== "Occupied" && available.length < HOW_MANY) {
                available.push(cardHtml(docSnap.id, property));
            }
        });

        if (!available.length) {
            showNote(
                "<h3>Listings coming soon</h3>" +
                "Landlords are adding verified student accommodation. Check back shortly."
            );
            return;
        }

        box.innerHTML = available.join("");

    } catch (error) {

        console.error(error);
        showNote("We could not load the latest listings right now. Please try again in a moment.");

    }

}

onAuthStateChanged(auth, (user) => {

    if (!user) {

        showNote(
            "<h3>Browse verified student accommodation</h3>" +
            "Create a free account or log in to see the latest listings, photos and prices." +
            '<div class="featured-actions">' +
            '<a class="green" href="signup.html">Sign Up</a>' +
            '<a class="outline" href="login.html">Log In</a>' +
            "</div>"
        );
        return;

    }

    loadLatest();

});
