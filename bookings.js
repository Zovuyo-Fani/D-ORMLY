import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const propertyId = params.get("id");

const propertyName = document.getElementById("propertyName");
const propertyUniversity = document.getElementById("propertyUniversity");
const propertyAddress = document.getElementById("propertyAddress");
const propertyRent = document.getElementById("propertyRent");


// =========================
// LOAD PROPERTY
// =========================

async function loadBookingProperty() {

    if (!propertyId) {

        propertyName.textContent = "Property not found.";
        return;

    }

    try {

        const propertyRef = doc(
            db,
            "properties",
            propertyId
        );

        const propertySnap = await getDoc(propertyRef);

        if (!propertySnap.exists()) {

            propertyName.textContent = "Property not found.";
            return;

        }

        const property = propertySnap.data();

        propertyName.textContent =
            property.propertyName || "Accommodation";

        propertyUniversity.textContent =
            property.university || "Not specified";

        propertyAddress.textContent =
            property.address || "Not specified";

        propertyRent.textContent =
            property.rent || "0";

    }
    catch (error) {

        console.error("PROPERTY ERROR:", error);

        propertyName.textContent =
            "Unable to load property.";

    }

}

loadBookingProperty();

paymentButton.addEventListener("click", function () {

    const user = auth.currentUser;

    if (!user) {
        alert("Please log in before booking accommodation.");
        return;
    }

    const moveInDate =
        document.getElementById("moveInDate").value;

    const studyPeriod =
        document.getElementById("studyPeriod").value;

    const specialRequests =
        document.getElementById("specialRequests").value.trim();


    // Check move-in date
    if (!moveInDate) {
        alert("Please select your move-in date.");
        return;
    }


    // Check study period
    if (!studyPeriod) {
        alert("Please select your study period.");
        return;
    }


    // Check property
    if (!selectedProperty) {
        alert("Property information has not loaded yet. Please try again.");
        return;
    }


    // Create booking information
    const bookingData = {

        propertyId: propertyId,

        propertyName:
            selectedProperty.propertyName || "",

        landlordId:
            selectedProperty.ownerId || "",

        studentId:
            user.uid,

        moveInDate:
            moveInDate,

        studyPeriod:
            studyPeriod,

        specialRequests:
            specialRequests,

        monthlyRent:
            Number(selectedProperty.rent || 0),

        bookingFee:
            70,

        paymentStatus:
            "pending",

        bookingStatus:
            "payment_pending"
    };


    // Save booking information temporarily
    sessionStorage.setItem(
        "dormlyBooking",
        JSON.stringify(bookingData)
    );


    // Go to payment page
    window.location.href = "payment.html";

});
