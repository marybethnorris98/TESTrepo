// --------------------------------------------------
// IMPORT FIREBASE MODULES
// --------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --------------------------------------------------
// FIREBASE CONFIG - replace with your own values
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC95ggTgS2Ew1MavuzEZrIvq6itTyxVdhA",
  authDomain: "recipeapp-248a1.firebaseapp.com",
  projectId: "recipeapp-248a1",
  storageBucket: "recipeapp-248a1.firebasestorage.app",
  messagingSenderId: "629558122940",
  appId: "1:629558122940:web:65dcca8ea0c572ccdf33b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("FULL admin + viewer Firebase script loaded");

// -----------------------------
// ADMIN STATE
// -----------------------------
let isAdmin = localStorage.getItem("admin") === "true";
document.addEventListener("keydown", e => {
  const key = e.key?.toLowerCase();
  const mac = navigator.userAgent.includes("Mac");
  if ((mac && e.metaKey && e.shiftKey && key === "m") || (!mac && e.ctrlKey && e.shiftKey && key === "m")) {
    openLoginModal();
  }
});


// -----------------------------
// CATEGORIES
// -----------------------------
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

// -----------------------------
// STATE
// -----------------------------
let recipes = [];
let drafts = [];
let editingRecipeIndex = null;
let editingDraftId = null;

// -----------------------------
// DOM ELEMENTS
// -----------------------------
const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const addRecipeModal = document.getElementById("addRecipeModal");
const newTitle = document.getElementById("newTitle");
const newCategory = document.getElementById("newCategory");
const newImage = document.getElementById("newImage");
const newDesc = document.getElementById("newDesc");
const newCredits = document.getElementById("newCredits");
const ingredientsList = document.getElementById("ingredientsList");
const instructionsList = document.getElementById("instructionsList");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const addInstructionBtn = document.getElementById("addInstructionBtn");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");

const viewer = document.getElementById("recipeModal");
const closeViewerBtn = document.getElementById("closeViewerBtn");

// -----------------------------
// FIREBASE FUNCTIONS
// -----------------------------
async function loadRecipesFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, "recipes"));
    recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRecipes();
  } catch (err) {
    console.error("Error loading recipes:", err);
    alert("Failed to load recipes from Firebase");
  }
}

async function saveRecipeToFirebase(recipe) {
  try {
    if (recipe.id) {
      await setDoc(doc(db, "recipes", recipe.id), recipe);
    } else {
      const docRef = await addDoc(collection(db, "recipes"), recipe);
      recipe.id = docRef.id;
    }
    return recipe;
  } catch (err) {
    console.error("Error saving recipe:", err);
    alert("Failed to save recipe");
  }
}

async function deleteRecipeFromFirebase(recipeId) {
  try {
    await deleteDoc(doc(db, "recipes", recipeId));
  } catch (err) {
    console.error("Error deleting recipe:", err);
    alert("Failed to delete recipe");
  }
}

async function loadDraftsFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, "drafts"));
    drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error loading drafts:", err);
    alert("Failed to load drafts from Firebase");
  }
}

async function saveDraftToFirebase(draft) {
  try {
    const draftRef = draft.id ? doc(db, "drafts", draft.id) : doc(collection(db, "drafts"));
    await setDoc(draftRef, { ...draft, timestamp: serverTimestamp() });
    draft.id = draftRef.id;
    return draft;
  } catch (err) {
    console.error("Error saving draft:", err);
    return draft;
  }
}

async function deleteDraftFromFirebase(draftId) {
  try {
    await deleteDoc(doc(db, "drafts", draftId));
    drafts = drafts.filter(d => d.id !== draftId);
  } catch (err) {
    console.error("Error deleting draft:", err);
  }
}

// -----------------------------
// RENDER FUNCTIONS
// -----------------------------
function populateCategorySelects() {
  [newCategory, categoryFilter].forEach(select => {
    if (!select) return;
    select.innerHTML = "";
    if (select === categoryFilter) {
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "All";
      select.appendChild(allOption);
    }
    CATEGORIES.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  });
}

function renderRecipes() {
  if (!recipeGrid) return;

  const searchTerm = (searchInput?.value || "").toLowerCase();
  const selectedCategory = categoryFilter?.value || "all";

  const filtered = recipes.filter(r => {
    if (!isAdmin && r.hidden) return false;
    const matchesSearch = (r.title || "").toLowerCase().includes(searchTerm) ||
                          (r.description || "").toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  recipeGrid.innerHTML = "";
  filtered.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "card";
    if (recipe.hidden && isAdmin) card.classList.add("hidden-recipe-admin");

    const img = document.createElement("img");
    img.src = recipe.image || "";
    img.alt = recipe.title || "";

    const content = document.createElement("div");
    content.className = "card-content";

    const titleDiv = document.createElement("div");
    titleDiv.className = "card-title";
    titleDiv.textContent = recipe.title || "";

    const catDiv = document.createElement("div");
    catDiv.className = "card-category";
    catDiv.textContent = recipe.category || "";

    const descDiv = document.createElement("div");
    descDiv.className = "card-desc";
    descDiv.textContent = recipe.description || "";

    content.append(titleDiv, catDiv, descDiv);
    card.append(img, content);

    const infoIcon = document.createElement("div");
    infoIcon.className = "card-info-icon";
    infoIcon.textContent = "i";
    const tooltip = document.createElement("div");
    tooltip.className = "card-info-tooltip";
    tooltip.textContent = recipe.credits || "No credits added.";
    infoIcon.addEventListener("click", e => {
      e.stopPropagation();
      tooltip.classList.toggle("visible");
    });
    document.addEventListener("click", () => tooltip.classList.remove("visible"));
    card.append(infoIcon, tooltip);

    card.addEventListener("click", () => openRecipeModal(recipe));
    recipeGrid.appendChild(card);
  });
}

// -----------------------------
// MODAL FUNCTIONS
// -----------------------------
function makeRowInput(placeholder = "") {
  const row = document.createElement("div");
  row.className = "admin-row";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "✖";
  removeBtn.style = "margin-left:8px;background:transparent;border:none;color:#ff3ebf;font-weight:700;font-size:18px;cursor:pointer;";
  removeBtn.addEventListener("click", () => row.remove());
  row.append(input, removeBtn);
  return row;
}

function clearAddModal() {
  newTitle.value = "";
  newCategory.value = CATEGORIES[0];
  newImage.value = "";
  newDesc.value = "";
  newCredits.value = "";
  ingredientsList.innerHTML = "";
  instructionsList.innerHTML = "";
  editingRecipeIndex = null;
  editingDraftId = null;
}

function populateAddModalFromRecipe(recipe) {
  clearAddModal();
  newTitle.value = recipe.title || "";
  newCategory.value = recipe.category || CATEGORIES[0];
  newImage.value = recipe.image || "";
  newDesc.value = recipe.description || "";
  newCredits.value = recipe.credits || "";

  (recipe.ingredients || []).forEach(ing => ingredientsList.appendChild(makeRowInput(ing)));
  (recipe.instructions || []).forEach(step => instructionsList.appendChild(makeRowInput(step)));
}

function openRecipeModal(recipe) {
  if (!viewer || !recipe) return;

  const modalImg = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalCategory = document.getElementById("modalCategory");
  const modalDesc = document.getElementById("modalDescription");
  const modalIngredients = document.getElementById("modalIngredients");
  const modalInstructions = document.getElementById("modalInstructions");
  const modalEditBtn = document.getElementById("modalEditBtn");
  const modalDeleteBtn = document.getElementById("modalDeleteBtn");
  const hideBtn = document.getElementById("modalHideBtn");

  editingRecipeIndex = recipes.findIndex(r => r.id === recipe.id);

  if (modalImg) { modalImg.src = recipe.image; modalImg.alt = recipe.title; }
  if (modalTitle) modalTitle.textContent = recipe.title;
  if (modalCategory) modalCategory.textContent = recipe.category;
  if (modalDesc) modalDesc.textContent = recipe.description;

  if (modalIngredients) {
    modalIngredients.innerHTML = "";
    (recipe.ingredients || []).forEach(ing => {
      const li = document.createElement("li");
      li.textContent = ing;
      modalIngredients.appendChild(li);
    });
  }

  if (modalInstructions) {
    modalInstructions.innerHTML = "";
    (recipe.instructions || []).forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      modalInstructions.appendChild(li);
    });
  }

  // Admin buttons
  if (modalEditBtn) {
    modalEditBtn.style.display = (isAdmin && editingRecipeIndex !== null) ? "inline-block" : "none";
    modalEditBtn.onclick = () => {
      populateAddModalFromRecipe(recipes[editingRecipeIndex]);
      addRecipeModal.classList.remove("hidden");
      viewer.style.display = "none";
    };
  }

  if (modalDeleteBtn) {
    modalDeleteBtn.style.display = (isAdmin && editingRecipeIndex !== null) ? "inline-block" : "none";
    modalDeleteBtn.onclick = async () => {
      if (!confirm(`Delete "${recipes[editingRecipeIndex].title}"?`)) return;
      await deleteRecipeFromFirebase(recipes[editingRecipeIndex].id);
      recipes.splice(editingRecipeIndex, 1);
      viewer.style.display = "none";
      renderRecipes();
    };
  }

  if (hideBtn) {
    hideBtn.style.display = (isAdmin && editingRecipeIndex !== null) ? "inline-block" : "none";
    hideBtn.textContent = recipes[editingRecipeIndex]?.hidden ? "Unhide" : "Hide";
    hideBtn.onclick = async e => {
      e.stopPropagation();
      const r = recipes[editingRecipeIndex];
      r.hidden = !r.hidden;
      await saveRecipeToFirebase(r);
      hideBtn.textContent = r.hidden ? "Unhide" : "Hide";
      renderRecipes();
    };
  }

  viewer.style.display = "flex";
}

// -----------------------------
// ADMIN LOGIN
// -----------------------------
const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join("");

function openLoginModal() {
  const loginModal = document.getElementById("loginModal");
  const loginError = document.getElementById("loginError");
  if (!loginModal || !loginError) return;
  loginError.style.display = "none";
  loginModal.classList.remove("hidden");
}

document.getElementById("loginBtn")?.addEventListener("click", () => {
  const entered = document.getElementById("adminPassword")?.value || "";
  if (entered.split("").reverse().join("") === ADMIN_PASSWORD_HASH) {
    isAdmin = true;
    localStorage.setItem("admin", "true");
    document.getElementById("loginModal")?.classList.add("hidden");
    injectAdminUI();
    renderRecipes();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
});

document.addEventListener("keydown", e => {
  const key = e.key?.toLowerCase();
  const mac = navigator.userAgent.includes("Mac");
  if ((mac && e.metaKey && e.shiftKey && key === "m") || (!mac && e.ctrlKey && e.shiftKey && key === "m")) {
    openLoginModal();
  }
});

// -----------------------------
// ADMIN UI
// -----------------------------
// -----------------------------
// ADMIN UI
// -----------------------------
function injectAdminUI() {
  // Remove old container if exists
  const oldContainer = document.getElementById("adminContainer");
  if (oldContainer) oldContainer.remove();

  const container = document.createElement("div");
  container.id = "adminContainer";
  container.style.display = "flex";
  container.style.gap = "10px";
  container.style.margin = "20px 0";

  // Add buttons
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add Recipe";
  addBtn.style.cssText = "background:#ff3ebf;color:white;padding:12px 16px;border-radius:14px;border:none;font-size:16px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.15)";
  addBtn.addEventListener("click", () => {
    editingDraftId = null;
    clearAddModal();
    addRecipeModal.classList.remove("hidden");
  });

  const draftsBtn = document.createElement("button");
  draftsBtn.textContent = "Drafts";
  draftsBtn.style.cssText = addBtn.style.cssText;
  draftsBtn.addEventListener("click", openDraftsModal);

  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Logout";
  logoutBtn.style.cssText = addBtn.style.cssText;
  logoutBtn.addEventListener("click", () => {
    isAdmin = false;
    localStorage.removeItem("admin");
    document.getElementById("adminContainer")?.remove();
    renderRecipes();
  });

  container.append(addBtn, draftsBtn, logoutBtn);
  document.body.prepend(container);
}

// -----------------------------
// DRAFTS MODAL
// -----------------------------
async function openDraftsModal() {
  await loadDraftsFromFirebase();
  let draftsModal = document.getElementById("draftsModal");
  if (!draftsModal) {
    draftsModal = document.createElement("div");
    draftsModal.id = "draftsModal";
    draftsModal.className = "modal";
    draftsModal.style.zIndex = 1300;
    draftsModal.innerHTML = `
      <div class="modal-content" style="max-width:520px;position:relative;">
        <button id="closeDraftsBtn" style="position:absolute;right:18px;top:12px;border:none;background:none;font-size:22px;cursor:pointer;">✖</button>
        <h2 style="margin-top:0;">My Drafts</h2>
        <div id="draftsList" style="display:flex;flex-direction:column;gap:10px;margin-top:12px;"></div>
      </div>
    `;
    document.body.appendChild(draftsModal);
    document.getElementById("closeDraftsBtn").addEventListener("click", () => draftsModal.classList.add("hidden"));
    draftsModal.addEventListener("click", e => { if (e.target === draftsModal) draftsModal.classList.add("hidden"); });
  }

  const listContainer = draftsModal.querySelector("#draftsList");
  listContainer.innerHTML = "";
  if (!drafts.length) {
    const p = document.createElement("div");
    p.textContent = "No drafts yet.";
    listContainer.appendChild(p);
  } else {
    drafts.forEach(d => {
      const row = document.createElement("div");
      row.style = "display:flex;justify-content:space-between;padding:8px;border-radius:10px;border:1px solid #ffe7f5;background:#fff9fc;";
      const titleDiv = document.createElement("div");
      titleDiv.textContent = d.title || "Untitled Draft";
      const actions = document.createElement("div");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.style = "background:#ff3ebf;color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;";
      editBtn.addEventListener("click", () => {
        editingDraftId = d.id;
        populateAddModalFromRecipe(d);
        addRecipeModal.classList.remove("hidden");
        draftsModal.classList.add("hidden");
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style = "background:transparent;color:#b20050;border:2px solid #ffd1e8;padding:6px 10px;border-radius:8px;cursor:pointer;";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Delete draft "${d.title}"?`)) return;
        await deleteDraftFromFirebase(d.id);
        openDraftsModal();
      });
      actions.append(editBtn, deleteBtn);
      row.append(titleDiv, actions);
      listContainer.appendChild(row);
    });
  }

  draftsModal.classList.remove("hidden");
}

// -----------------------------
// SAVE RECIPE
// -----------------------------
saveRecipeBtn?.addEventListener("click", async () => {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || CATEGORIES[0];
  const image = (newImage.value || "").trim();
   const description = (newDesc.value || "").trim();
  const credits = (newCredits.value || "").trim();

  const ingredients = Array.from(ingredientsList.querySelectorAll("input"))
    .map(i => i.value.trim())
    .filter(i => i);

  const instructions = Array.from(instructionsList.querySelectorAll("input"))
    .map(i => i.value.trim())
    .filter(i => i);

  if (!title) {
    alert("Title is required");
    return;
  }

  const recipeData = {
    title,
    category,
    image,
    description,
    credits,
    ingredients,
    instructions,
    hidden: false
  };

  // If editing an existing recipe
  if (editingRecipeIndex !== null) {
    recipeData.id = recipes[editingRecipeIndex].id;
    recipes[editingRecipeIndex] = recipeData;
    await saveRecipeToFirebase(recipeData);
  } 
  // If saving a draft
  else if (editingDraftId) {
    recipeData.id = editingDraftId;
    await saveDraftToFirebase(recipeData);
    editingDraftId = null;
  } 
  // New recipe
  else {
    const savedRecipe = await saveRecipeToFirebase(recipeData);
    recipes.push(savedRecipe);
  }

  addRecipeModal.classList.add("hidden");
  clearAddModal();
  renderRecipes();
});

// -----------------------------
// ADD INGREDIENT/INSTRUCTION
// -----------------------------
addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Instruction")));

// -----------------------------
// SEARCH & FILTER
// -----------------------------
searchInput?.addEventListener("input", renderRecipes);
categoryFilter?.addEventListener("change", renderRecipes);

// -----------------------------
// CLOSE VIEWER
// -----------------------------
closeViewerBtn?.addEventListener("click", () => viewer.style.display = "none");

// -----------------------------
// INIT
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  populateCategorySelects();
  await loadRecipesFromFirebase();
  if (isAdmin) injectAdminUI();
});

