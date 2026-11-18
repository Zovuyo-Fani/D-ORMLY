import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { escapeHtml, photoList, FALLBACK_IMAGE } from "./utils.js";

const container = document.getElementById("propertyDetails");

// Get property ID from the URL
const params = new URLSearchParams(window.location.search);
const propertyId = params.get("id");

async function loadProperty() {

    if (!propertyId) {

        container.innerHTML = `
            <div class="loading">
                Property not found.
            </div>
        `;

        return;
    }

    try {

        const docRef = doc(db, "properties", propertyId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {

            container.innerHTML = `
                <div class="loading">
                    Property not found.
                </div>
            `;

            return;
        }

        const property = docSnap.data();

        const photos = photoList(property);
        const mainPhoto = photos.length ? photos[0] : FALLBACK_IMAGE;

        const thumbs = photos.length > 1
            ? `<div class="gallery-thumbs">` +
              photos.map((url, i) => `
                <img
                    class="gallery-thumb${i === 0 ? " active" : ""}"
                    src="${escapeHtml(url)}"
                    alt="Photo ${i + 1} of ${photos.length}"
                    data-full="${escapeHtml(url)}"
                    tabindex="0"
                    loading="lazy">
              `).join("") +
              `</div>`
            : "";

        container.innerHTML = `

            <img
                class="property-image"
                id="mainPhoto"
                src="${escapeHtml(mainPhoto)}"
                alt="${escapeHtml(property.propertyName)}"
                onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">

            ${thumbs}

            <div class="details">

                <h1>${escapeHtml(property.propertyName)}</h1>

                <div class="price">
                    R${escapeHtml(property.rent)} / month
                </div>

                <div class="info">

                    📍 <strong>Address:</strong> ${escapeHtml(property.address)}<br><br>

                    🎓 <strong>University:</strong> ${escapeHtml(property.university)}<br><br>

                    🛏 <strong>Rooms:</strong> ${escapeHtml(property.rooms)}<br><br>

                    🚿 <strong>Bathrooms:</strong> ${escapeHtml(property.bathrooms)}<br><br>

                    📶 <strong>Wi-Fi:</strong> ${escapeHtml(property.wifi)}<br><br>

                    🚗 <strong>Parking:</strong> ${escapeHtml(property.parking)}<br><br>

                    📞 <strong>Contact:</strong> ${escapeHtml(property.phone)}

                </div>

                <div class="description">

                    <h2>Description</h2>

                    <br>

                    ${escapeHtml(property.description)}

                </div>

                <button
                    class="bookBtn"
                    onclick="bookProperty()">

                    Book Now

                </button>

            </div>

        `;

        setupGallery();

    }
    catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                Failed to load property.
            </div>
        `;

    }

}

// Click (or press Enter on) a small photo to show it big.
function setupGallery() {

    const main = document.getElementById("mainPhoto");
    const thumbs = container.querySelectorAll(".gallery-thumb");

    function show(thumb) {
        main.src = thumb.dataset.full;
        thumbs.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
    }

    thumbs.forEach((thumb) => {
        thumb.addEventListener("click", () => show(thumb));
        thumb.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                show(thumb);
            }
        });
    });

}

loadProperty();


// =========================
// BOOK PROPERTY
// =========================

window.bookProperty = function () {

    if (!propertyId) {

        alert("Property information could not be found.");
        return;

    }

    // Send the selected property ID to the booking page
    window.location.href = `booking.html?id=${encodeURIComponent(propertyId)}`;

};
