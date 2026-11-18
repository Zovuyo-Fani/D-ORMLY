// =====================================================
// DORMLY LANDLORD VERIFICATION (shared helpers)
// Used by signup.html (first submission) and landlord-dashboard.html
// (status card, re-upload after a rejection).
//
// Data layout
//   Firestore  landlordVerifications/{landlordUid}
//       landlordId, landlordName, landlordEmail,
//       accreditor ("NSFAS" | "University" | "Other"), accreditationNumber,
//       idDocPath, letterPath      <- Storage paths, NOT public links
//       status   "pending" | "approved" | "rejected"
//       submittedAt
//       reviewedAt, reviewedBy, rejectionReason   <- written by an admin only
//   Storage    verificationDocs/{landlordUid}/{timestamp}-id.ext
//              verificationDocs/{landlordUid}/{timestamp}-letter.ext
// A landlord with no document in landlordVerifications has not applied yet.
// =====================================================
import { db } from "./firebase.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

export const MAX_DOC_BYTES = 5 * 1024 * 1024;   // must match storage.rules

export const DOC_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf"
};

export const ACCEPT_ATTR = Object.keys(DOC_TYPES).join(",");

export const ACCREDITORS = [
    { value: "NSFAS", label: "NSFAS" },
    { value: "University", label: "A university accommodation office" },
    { value: "Other", label: "Other accrediting body" }
];

export function accreditorLabel(value) {
    const found = ACCREDITORS.find((a) => a.value === value);
    return found ? found.label : value || "";
}

// Returns "" if the file is fine, or a friendly message.
export function checkDocFile(file, label) {
    if (!file) return "Please choose your " + label + ".";
    if (!DOC_TYPES[file.type]) {
        return "Your " + label + " must be a PDF, JPG, PNG or WebP file.";
    }
    if (file.size > MAX_DOC_BYTES) {
        return "Your " + label + " is larger than 5 MB. Please upload a smaller file or scan.";
    }
    if (file.size === 0) return "Your " + label + " looks empty. Please choose it again.";
    return "";
}

// The landlord's verification record, or null if they have not applied yet.
export async function getVerification(uid) {
    const snap = await getDoc(doc(db, "landlordVerifications", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Uploads the two documents and writes the "pending" record.
// Works for a first submission and for a re-submission after a rejection
// (the rules only allow an overwrite while the status is rejected or pending).
export async function submitVerification(user, details) {

    const idProblem = checkDocFile(details.idFile, "ID document");
    if (idProblem) throw new Error(idProblem);
    const letterProblem = checkDocFile(details.letterFile, "accreditation letter");
    if (letterProblem) throw new Error(letterProblem);
    if (!ACCREDITORS.some((a) => a.value === details.accreditor)) {
        throw new Error("Please choose who accredited your accommodation.");
    }

    const { getApp } = await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js");
    const storageTools = await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js");
    const storage = storageTools.getStorage(getApp());

    const stamp = Date.now();
    const idPath = "verificationDocs/" + user.uid + "/" + stamp + "-id." + DOC_TYPES[details.idFile.type];
    const letterPath = "verificationDocs/" + user.uid + "/" + stamp + "-letter." + DOC_TYPES[details.letterFile.type];

    const uploaded = [];
    try {
        for (const [path, file] of [[idPath, details.idFile], [letterPath, details.letterFile]]) {
            const fileRef = storageTools.ref(storage, path);
            await storageTools.uploadBytes(fileRef, file, { contentType: file.type });
            uploaded.push(fileRef);
        }

        await setDoc(doc(db, "landlordVerifications", user.uid), {
            landlordId: user.uid,
            landlordName: String(details.name || "").slice(0, 120),
            landlordEmail: user.email,
            accreditor: details.accreditor,
            accreditationNumber: String(details.accreditationNumber || "").trim().slice(0, 60),
            idDocPath: idPath,
            letterPath: letterPath,
            status: "pending",
            submittedAt: serverTimestamp()
        });
    } catch (error) {
        // Don't leave orphaned ID documents behind if the record was not saved
        await Promise.all(uploaded.map((r) => storageTools.deleteObject(r).catch(() => {})));
        throw error;
    }
}

export function friendlyVerificationError(error) {
    const code = error && error.code;
    if (code === "storage/unauthorized" || code === "permission-denied") {
        return "Firebase blocked the upload. Please make sure you are logged in as a landlord. If this keeps happening, contact support@dormly.co.za.";
    }
    if (code && String(code).startsWith("storage/")) {
        return "Your documents could not be uploaded. Please check your internet connection and try again.";
    }
    return (error && error.message) || "Something went wrong. Please try again.";
}
