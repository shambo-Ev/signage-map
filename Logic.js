// logic.js
let signs = [];
let currentFloor = 'G-Area A.jpg';
let currentLevel = "G";
let currentBlock = "Area A";
let placingSign = false;
let editingSignId = null;
let selectedUnplaced = null;

const placeBtn = document.getElementById("placeSignBtn");
const titleField = document.getElementById("titleInput");
const descField = document.getElementById("descInput");
const tagField = document.getElementById("tagInput");
const tagSuggest = document.getElementById("tagSuggestions");
const imageField = document.getElementById("imageInput");
const floorplan = document.getElementById("floorplan");
const mapContainer = document.getElementById("map-container");
const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const popupTitle = document.getElementById("popup-title");
const popupDesc = document.getElementById("popup-desc");
const popupTags = document.getElementById("popup-tags");
const popupMeta = document.getElementById("popup-meta");
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");
const tagInput = document.getElementById("tagSearch");
const searchResults = document.getElementById("searchResults");
const searchButton = document.getElementById("searchButton");
const clearButton = document.getElementById("clearButton");

const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("editTitle");
const editDesc = document.getElementById("editDesc");
const editTags = document.getElementById("editTags");
const editImage = document.getElementById("editImage");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

document.getElementById("floorLevelSelect").addEventListener("change", handleDropdownChange);
document.getElementById("floorBlockSelect").addEventListener("change", handleDropdownChange);

function handleDropdownChange() {
  currentLevel = document.getElementById("floorLevelSelect").value;
  currentBlock = document.getElementById("floorBlockSelect").value;
  currentFloor = `${currentLevel}-${currentBlock}.jpg`;
  floorplan.src = currentFloor;
  renderMarkers(signs);
  renderSearchResults(signs);
}

function renderMarkers(filteredSigns) {
  document.querySelectorAll(".marker").forEach(marker => marker.remove());
  filteredSigns.forEach(sign => {
    if (sign.level !== currentLevel || sign.block !== currentBlock) return;
    const marker = document.createElement("div");
    marker.className = "marker";
    marker.style.left = `${sign.x}%`;
    marker.style.top = `${sign.y}%`;
    marker.style.cursor = "pointer";
    marker.addEventListener("click", () => showPopup(sign));
    mapContainer.appendChild(marker);
  });
}

function showPopup(sign) {
  const baseImg = new Image();
  const watermark = new Image();
  baseImg.onload = function () {
    watermark.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(baseImg, 0, 0);
      ctx.globalAlpha = 0.3;
      const patternCanvas = document.createElement('canvas');
      const patternSize = 400;
      patternCanvas.width = patternSize;
      patternCanvas.height = patternSize;
      const pctx = patternCanvas.getContext('2d');
      pctx.drawImage(watermark, 0, 0, patternSize, patternSize);
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      popupImg.src = canvas.toDataURL();
    };
    watermark.src = 'watermark.svg';
  };
  baseImg.src = sign.image;
  popupTitle.textContent = `Title: ${sign.title}`;
  popupDesc.textContent = `Description: ${sign.description}`;
  popupTags.textContent = `Tags: ${sign.tags.join(", ")}`;
  popupMeta.textContent = `Floor: ${sign.level} | Area: ${sign.block}`;
  popup.classList.remove("hidden");
  popup.style.display = "block";
  editingSignId = sign.id;
}

document.getElementById("popup-close").addEventListener("click", () => popup.classList.add("hidden"));
window.addEventListener("click", (e) => {
  if (e.target === popup) popup.classList.add("hidden");
  if (e.target === editModal) {
    editModal.classList.add("hidden");
    editModal.style.display = "none";
  }
});

editBtn.addEventListener("click", () => {
  const sign = signs.find(s => s.id === editingSignId);
  if (!sign) return;
  popup.classList.add("hidden");
  editModal.classList.remove("hidden");
  editModal.style.display = "flex";
  editTitle.value = sign.title;
  editDesc.value = sign.description;
  editTags.value = sign.tags.join(", ");
});

cancelEditBtn.addEventListener("click", () => {
  editModal.classList.add("hidden");
  editModal.style.display = "none";
});

saveEditBtn.addEventListener("click", () => {
  const sign = signs.find(s => s.id === editingSignId);
  if (!sign) return;
  sign.title = editTitle.value;
  sign.description = editDesc.value;
  sign.tags = editTags.value.split(",").map(t => t.trim());
  if (editImage.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      sign.image = evt.target.result;
      completeEdit();
    };
    reader.readAsDataURL(editImage.files[0]);
  } else {
    completeEdit();
  }
});

function completeEdit() {
  saveToServer(signs);
  renderMarkers(signs);
  renderSearchResults(signs);
  updateTagSuggestions();
  editModal.classList.add("hidden");
  editModal.style.display = "none";
}

deleteBtn.addEventListener("click", () => {
  signs = signs.filter(s => s.id !== editingSignId);
  saveToServer(signs);
  renderMarkers(signs);
  renderSearchResults(signs);
  popup.classList.add("hidden");
  popupImg.src = "";
  popupTitle.textContent = "";
  popupDesc.textContent = "";
  popupTags.textContent = "";
  popupMeta.textContent = "";
  editingSignId = null;
});

function updateTagSuggestions() {
  const allTags = new Set(signs.flatMap(sign => sign.tags));
  tagSuggest.innerHTML = "";
  allTags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    tagSuggest.appendChild(opt);
  });
}

function saveToServer(data) {
  fetch('signs.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2)
  }).catch(err => console.error("Failed to save signs.json:", err));
}

function performSearch() {
  const keywords = tagInput.value.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
  const filtered = signs.filter(sign =>
    keywords.some(k => sign.tags.some(tag => tag.toLowerCase().includes(k)))
  );
  renderMarkers(filtered);
  renderSearchResults(filtered);
}

function renderSearchResults(filteredSigns) {
  searchResults.innerHTML = "";
  if (filteredSigns.length === 0) {
    searchResults.innerHTML = "<p>No signs match the tag(s).</p>";
    return;
  }
  filteredSigns.forEach(sign => {
    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #ccc";
    div.style.padding = "5px 0";
    div.innerHTML = `<strong>${sign.title}</strong><br><small>${sign.tags.join(', ')}</small>`;
    div.addEventListener("click", () => showPopup(sign));
    searchResults.appendChild(div);
  });
}

function clearSearch() {
  tagInput.value = "";
  renderMarkers(signs);
  renderSearchResults(signs);
}

searchButton.addEventListener("click", performSearch);
clearButton.addEventListener("click", clearSearch);
tagInput.addEventListener("keydown", (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    performSearch();
  }
});

placeBtn.addEventListener("click", () => {
  placingSign = true;
  editingSignId = null;
  alert("Now click on the map to place your sign.");
});

mapContainer.addEventListener("click", (e) => {
  if (!placingSign || !selectedUnplaced) return;
  placingSign = false;
  const rect = mapContainer.getBoundingClientRect();
  const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
  const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

  selectedUnplaced.x = xPercent;
  selectedUnplaced.y = yPercent;
  selectedUnplaced.level = currentLevel;
  selectedUnplaced.block = currentBlock;
  selectedUnplaced.floor = `${currentLevel}-${currentBlock}.jpg`;
  selectedUnplaced.placed = true;

  signs.push({ ...selectedUnplaced });
  saveToServer(signs);
  renderMarkers(signs);
  renderSearchResults(signs);
  updateTagSuggestions();
  renderUnplacedList();

  selectedUnplaced = null;
});

async function loadSignsFromServer() {
  try {
    const response = await fetch('signs.json');
    if (!response.ok) throw new Error('File not found');
    signs = await response.json();
    handleDropdownChange();
    updateTagSuggestions();
  } catch (err) {
    console.log("No existing signs.json found, starting fresh.");
  }
}

function loadCSVMetadata() {
  Papa.parse('Signage_Tag_List_Final.csv', {
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: function(results) {
      const csvSigns = results.data;

      unplacedSigns = csvSigns
.filter(sign => {
  const filename = sign.Filename?.trim();
  const block = sign.block?.trim();
  const imagePath = `signs/${encodeURIComponent(block)}/${encodeURIComponent(filename)}`;
  return !signs.some(s => s.image === imagePath);
})

        .map(sign => ({
          id: Date.now() + Math.random(),
          title: sign.Title,
          description: sign.Description,
          tags: (sign.Tags || "").split(',').map(t => t.trim()),
          Filename: sign.Filename,
          block: sign.block,
          image: `signs/${encodeURIComponent(sign.block)}/${encodeURIComponent(sign.Filename)}`,
          placed: false,
          level: currentLevel,
          x: null,
          y: null
        }));

      renderUnplacedList();
    },
    error: function(err) {
      console.error("Failed to parse CSV:", err);
    }
  });
}



function renderUnplacedList() {
  const listContainer = document.getElementById("unplacedList");
  if (!listContainer) return;
  listContainer.innerHTML = '';
  unplacedSigns.filter(s => !s.placed).forEach(sign => {
    const li = document.createElement("li");
    li.style.cursor = "pointer";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.marginBottom = "10px";

    const img = document.createElement("img");
    img.src = sign.image;
    img.alt = sign.title;
    img.style.width = "60px";
    img.style.height = "60px";
    img.style.objectFit = "cover";
    img.style.marginRight = "10px";
    img.onerror = () => { img.style.display = 'none'; };

    const text = document.createElement("span");
    text.textContent = `${sign.title} - ${sign.description}`;

    li.appendChild(img);
    li.appendChild(text);

    li.addEventListener("click", () => {
      placingSign = true;
      editingSignId = null;
      selectedUnplaced = sign;
      alert(`Now click on the map to place \"${sign.title}\"`);
    });

    listContainer.appendChild(li);
  });
}

window.addEventListener("load", () => {
  loadSignsFromServer();
  loadCSVMetadata();
});
