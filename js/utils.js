// =====================================================
// DORMLY SHARED HELPERS (used by listings, property page, homepage)
// =====================================================

export const FALLBACK_IMAGE = "images/default-property.jpg";

// Property details are typed in by landlords, so they are escaped before
// being placed into the page. This stops someone from sneaking code into a listing.
export function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// All photo web addresses saved on a property (only secure https addresses).
export function photoList(property) {
    const urls = property && Array.isArray(property.imageUrls) ? property.imageUrls : [];
    return urls.filter((u) => typeof u === "string" && u.startsWith("https://"));
}

// The cover photo: the first uploaded photo, or the placeholder if there are none.
export function coverPhoto(property) {
    const photos = photoList(property);
    return photos.length ? photos[0] : FALLBACK_IMAGE;
}
