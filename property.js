import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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

        container.innerHTML = `

            <img
                class="property-image"
                src="images/default-property.jpg"
                alt="Property">

            <div class="details">

                <h1>${property.propertyName}</h1>

                <div class="price">
                    R${property.rent} / month
                </div>

                <div class="info">

                    📍 <strong>Address:</strong> ${property.address}<br><br>

                    🎓 <strong>University:</strong> ${property.university}<br><br>

                    🛏 <strong>Rooms:</strong> ${property.rooms}<br><br>

                    🚿 <strong>Bathrooms:</strong> ${property.bathrooms}<br><br>

                    📶 <strong>Wi-Fi:</strong> ${property.wifi}<br><br>

                    🚗 <strong>Parking:</strong> ${property.parking}<br><br>

                    📞 <strong>Contact:</strong> ${property.phone}

                </div>

                <div class="description">

                    <h2>Description</h2>

                    <br>

                    ${property.description}

                </div>

                <button
                    class="bookBtn"
                    onclick="bookProperty()">

                    Book Now — R70 Booking Fee

                </button>

            </div>

        `;

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
    window.location.href = `booking.html?id=${propertyId}`;

};