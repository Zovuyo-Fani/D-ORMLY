// =====================================================
// DORMLY PHOTO PICKER (Add Property page)
// Lets a landlord choose up to 10 photos, shows small previews,
// and lets them remove a photo or pick which one is the cover.
// The chosen files are handed to uploadProperty() in script.js.
// =====================================================

const MAX_PHOTOS = 10;
const MAX_FILE_MB = 15;          // photos are shrunk before upload, so phone photos are fine
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

const input = document.getElementById("photos");
const preview = document.getElementById("photoPreview");
const counter = document.getElementById("photoCount");
const note = document.getElementById("photoNote");

// Each entry: { file, url }  (url is a temporary preview address)
let chosen = [];

function sameFile(a, b) {
    return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

function showNote(text) {
    if (!note) return;
    note.textContent = text || "";
    note.style.display = text ? "block" : "none";
}

function render() {

    if (!preview) return;

    preview.innerHTML = "";

    chosen.forEach((item, index) => {

        const tile = document.createElement("div");
        tile.className = "photo-tile";

        const img = document.createElement("img");
        img.src = item.url;
        img.alt = "Selected photo " + (index + 1);
        tile.appendChild(img);

        if (index === 0) {
            const badge = document.createElement("span");
            badge.className = "photo-cover";
            badge.textContent = "Cover";
            tile.appendChild(badge);
        } else {
            const cover = document.createElement("button");
            cover.type = "button";
            cover.className = "photo-action photo-make-cover";
            cover.textContent = "Make cover";
            cover.addEventListener("click", () => {
                chosen.unshift(chosen.splice(index, 1)[0]);
                render();
            });
            tile.appendChild(cover);
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "photo-action photo-remove";
        remove.setAttribute("aria-label", "Remove photo " + (index + 1));
        remove.textContent = "✕";
        remove.addEventListener("click", () => {
            URL.revokeObjectURL(item.url);
            chosen.splice(index, 1);
            showNote("");
            render();
        });
        tile.appendChild(remove);

        preview.appendChild(tile);

    });

    if (counter) {
        counter.textContent = chosen.length
            ? chosen.length + " of " + MAX_PHOTOS + " photos selected (the first one is the cover photo)"
            : "No photos selected yet";
    }

}

if (input) {

    input.addEventListener("change", () => {

        const problems = [];

        Array.from(input.files).forEach((file) => {

            if (chosen.length >= MAX_PHOTOS) {
                if (!problems.some((p) => p.startsWith("You can add up to"))) {
                    problems.push("You can add up to " + MAX_PHOTOS + " photos. The extra ones were skipped.");
                }
                return;
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                problems.push(file.name + " was skipped. Only JPG or PNG photos can be used.");
                return;
            }

            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                problems.push(file.name + " was skipped because it is larger than " + MAX_FILE_MB + " MB.");
                return;
            }

            if (chosen.some((item) => sameFile(item.file, file))) {
                return; // already added
            }

            chosen.push({ file: file, url: URL.createObjectURL(file) });

        });

        // Clear the box so the same photo can be chosen again after removing it
        input.value = "";

        showNote(problems.join(" "));
        render();

    });

}

// Used by uploadProperty() in script.js
window.getSelectedPhotos = function () {
    return chosen.map((item) => item.file);
};

window.clearSelectedPhotos = function () {
    chosen.forEach((item) => URL.revokeObjectURL(item.url));
    chosen = [];
    showNote("");
    render();
};

render();
