import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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

        snapshot.forEach((doc) => {

            const property = doc.data();

            container.innerHTML += `

            <div class="card">

                <img src="images/default-property.jpg" alt="Property">

                <div class="content">

                    <h2>${property.propertyName}</h2>

                    <div class="price">
                        R${property.rent} / month
                    </div>

                    <div class="info">

                        📍 ${property.address}<br>

                        🎓 ${property.university}<br>

                        🛏 ${property.rooms} Room(s)<br>

                        🚿 ${property.bathrooms} Bathroom(s)<br>

                        📶 Wi-Fi: ${property.wifi}<br>

                        🚗 Parking: ${property.parking}

                    <button
                        class="viewBtn"
                        onclick="viewProperty('${doc.id}')">

                        View Property

                    </button>

                </div>

            </div>

            `;

        });

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
        `property.html?id=${propertyId}`;

}