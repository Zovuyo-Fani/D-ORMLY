import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { escapeHtml, coverPhoto, photoList, FALLBACK_IMAGE } from "./utils.js";

const container = document.getElementById("propertyContainer");

async function loadProperties() {

    container.innerHTML = "";

    try {

        const snapshot = await getDocs(collection(db, "properties"));

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="loading">
                    No properties have been uploaded yet.
                </div>
            `;

            return;

        }

        let html = "";

        snapshot.forEach((doc) => {

            const property = doc.data();

            const photoCount = photoList(property).length;

            html += `

            <div class="card">

                <img
                    src="${escapeHtml(coverPhoto(property))}"
                    alt="${escapeHtml(property.propertyName)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">

                <div class="content">

                    <h2>${escapeHtml(property.propertyName)}</h2>

                    <div class="price">
                        R${escapeHtml(property.rent)} / month
                    </div>

                    <div class="info">

                        📍 ${escapeHtml(property.address)}<br>

                        🎓 ${escapeHtml(property.university)}<br>

                        🛏 ${escapeHtml(property.rooms)} Room(s)<br>

                        🚿 ${escapeHtml(property.bathrooms)} Bathroom(s)<br>

                        📶 Wi-Fi: ${escapeHtml(property.wifi)}<br>

                        🚗 Parking: ${escapeHtml(property.parking)}${photoCount > 1 ? `<br>

                        📷 ${photoCount} photos` : ""}

                    <button
                        class="viewBtn"
                        onclick="viewProperty('${escapeHtml(doc.id)}')">

                        View Property

                    </button>

                    </div>

                </div>

            </div>

            `;

        });

        container.innerHTML = html;

    }
    catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                Failed to load properties.
            </div>
        `;

    }

}

loadProperties();

window.viewProperty = function(propertyId){

    window.location.href =
        `property.html?id=${encodeURIComponent(propertyId)}`;

}
