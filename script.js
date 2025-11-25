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
// FIREBASE CONFIG
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC95ggTgS2Ew1MavuzEZrIvq6itTyxVdhA",
  authDomain: "recipeapp-248a1.firebaseapp.com",
  projectId: "recipeapp-248a1",
  storageBucket: "recipeapp-248a1.appspot.com",
  messagingSenderId: "629558122940",
  appId: "1:629558122940:web:65dcca8ea0c572ccdf33b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------
// GLOBAL STATE
// -----------------------------
let recipes = [];
let drafts = [];
let isAdmin = localStorage.getItem("admin") === "true";
let editingRecipeIndex = null;
let editingDraftId = null;

const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

// -----------------------------
// FIRESTORE HELPERS
// -----------------------------
async function loadRecipesFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, "recipes"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error loading recipes:", err);
    return [];
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

async function deleteRecipeFromFirebase(id) {
  try {
    await deleteDoc(doc(db, "recipes", id));
  } catch (err) {
    console.error("Error deleting recipe:", err);
  }
}

async function loadDraftsFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, "drafts"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error loading drafts:", err);
    return [];
  }
}

async function saveDraftToFirebase(draft) {
  try {
    const ref = draft.id ? doc(db, "drafts", draft.id) : doc(collection(db, "drafts"));
    await setDoc(ref, { ...draft, timestamp: serverTimestamp() });
    draft.id = ref.id;
    return draft;
  } catch (err) {
    console.error("Error saving draft:", err);
    return draft;
  }
}

async function deleteDraftFromFirebase(id) {
  try {
    await deleteDoc(doc(db, "drafts", id));
    drafts = drafts.filter(d => d.id !== id);
  } catch (err) {
    console.error("Error deleting draft:", err);
  }
}

// -----------------------------
// DOM + MODALS
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const recipeGrid = document.getElementById("recipeGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  const addRecipeModal = document.getElementById("addRecipeModal");
  const newTitle = document.getElementById("newTitle");
  const newCategory = document.getElementById("newCategory");
  const newImage = document.getElementById("newImage");
  const newDesc = document.getElementById("newDesc");
  const ingredientsList = document.getElementById("ingredientsList");
  const instructionsList = document.getElementById("instructionsList");
  const saveRecipeBtn = document.getElementById("saveRecipeBtn");
  const addIngredientBtn = document.getElementById("addIngredientBtn");
  const addInstructionBtn = document.getElementById("addInstructionBtn");

  const viewer = document.getElementById("recipeModal");
  const closeBtn = document.getElementById("closeViewerBtn");

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  recipes = await loadRecipesFromFirebase();
  drafts = await loadDraftsFromFirebase();
  renderRecipes();

  // -----------------------------
  // RENDER RECIPES
  // -----------------------------
  function renderRecipes() {
    if (!recipeGrid) return;

    const term = (searchInput?.value || "").toLowerCase();
    const category = categoryFilter?.value || "all";

    recipeGrid.innerHTML = "";

    recipes
      .filter(r => (isAdmin || !r.hidden))
      .filter(r => r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term))
      .filter(r => category === "all" || r.category === category)
      .forEach(recipe => {
        const card = document.createElement("div");
        card.className = "card";

        if (recipe.hidden && isAdmin) card.classList.add("hidden-recipe-admin");
        else if (recipe.hidden) return;

        card.innerHTML = `
          <img src="${recipe.image}" alt="${recipe.title}" />
          <div class="card-content">
            <div class="card-title">${recipe.title}</div>
            <div class="card-category">${recipe.category}</div>
            <div class="card-desc">${recipe.description}</div>
          </div>
        `;

        card.addEventListener("click", () => openRecipeModal(recipe));
        recipeGrid.appendChild(card);
      });
  }

  // -----------------------------
  // OPEN RECIPE MODAL
  // -----------------------------
  function openRecipeModal(recipe) {
    if (!viewer) return;

    viewer.querySelector("#modalTitle").textContent = recipe.title;
    viewer.querySelector("#modalCategory").textContent = recipe.category;
    viewer.querySelector("#modalDescription").textContent = recipe.description;
    const modalImg = viewer.querySelector("#modalImage");
    modalImg.src = recipe.image;

    const modalIngredients = viewer.querySelector("#modalIngredients");
    modalIngredients.innerHTML = "";
    (recipe.ingredients || []).forEach(i => {
      const li = document.createElement("li"); li.textContent = i; modalIngredients.appendChild(li);
    });

    const modalInstructions = viewer.querySelector("#modalInstructions");
    modalInstructions.innerHTML = "";
    (recipe.instructions || []).forEach(s => {
      const li = document.createElement("li"); li.textContent = s; modalInstructions.appendChild(li);
    });

    viewer.style.display = "flex";
  }

  if (closeBtn) closeBtn.addEventListener("click", () => viewer.style.display = "none");

  // -----------------------------
  // SEARCH & FILTER
  // -----------------------------
  searchInput?.addEventListener("input", renderRecipes);
  categoryFilter?.addEventListener("change", renderRecipes);

  // -----------------------------
  // MODAL HELPERS
  // -----------------------------
  function makeRowInput(value = "") {
    const row = document.createElement("div");
    const input = document.createElement("input");
    input.value = value;
    row.appendChild(input);
    const btn = document.createElement("button"); btn.textContent = "✖"; btn.type = "button";
    btn.addEventListener("click", () => row.remove());
    row.appendChild(btn);
    return row;
  }

  addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput()));
  addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput()));

  // -----------------------------
  // SAVE RECIPE
  // -----------------------------
  saveRecipeBtn?.addEventListener("click", async () => {
    const recipeData = {
      title: newTitle.value,
      category: newCategory.value,
      image: newImage.value,
      description: newDesc.value,
      ingredients: [...ingredientsList.querySelectorAll("input")].map(i => i.value).filter(Boolean),
      instructions: [...instructionsList.querySelectorAll("input")].map(i => i.value).filter(Boolean),
      hidden: false
    };

    if (editingRecipeIndex !== null) {
      recipeData.id = recipes[editingRecipeIndex].id;
      recipes[editingRecipeIndex] = recipeData;
    } else {
      recipes.push(recipeData);
    }

    await saveRecipeToFirebase(recipeData);

    if (editingDraftId) {
      await deleteDraftFromFirebase(editingDraftId);
      editingDraftId = null;
    }

    renderRecipes();
    addRecipeModal.classList.add("hidden");
    newTitle.value = ""; newImage.value = ""; newDesc.value = "";
    ingredientsList.innerHTML = ""; instructionsList.innerHTML = "";
  });

  // -----------------------------
  // DRAFTS
  // -----------------------------
  async function openDraftsModal() {
    let draftsModal = document.getElementById("draftsModal");
    if (!draftsModal) {
      draftsModal = document.createElement("div");
      draftsModal.id = "draftsModal"; draftsModal.className = "modal";
      draftsModal.innerHTML = `<div id="draftsList"></div><button id="closeDraftsBtn">Close</button>`;
      document.body.appendChild(draftsModal);
      draftsModal.querySelector("#closeDraftsBtn").addEventListener("click", () => draftsModal.classList.add("hidden"));
    }

    const list = draftsModal.querySelector("#draftsList");
    list.innerHTML = "";
    drafts = await loadDraftsFromFirebase();

    drafts.forEach(d => {
      const row = document.createElement("div");
      row.textContent = d.title || "Untitled";
      const editBtn = document.createElement("button"); editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        editingDraftId = d.id;
        newTitle.value = d.title; newCategory.value = d.category; newImage.value = d.image;
        newDesc.value = d.description; ingredientsList.innerHTML = ""; instructionsList.innerHTML = "";
        (d.ingredients || []).forEach(i => ingredientsList.appendChild(makeRowInput(i)));
        (d.instructions || []).forEach(s => instructionsList.appendChild(makeRowInput(s)));
        addRecipeModal.classList.remove("hidden");
        draftsModal.classList.add("hidden");
      });

      const delBtn = document.createElement("button"); delBtn.textContent = "Delete";
      delBtn.addEventListener("click", async () => { await deleteDraftFromFirebase(d.id); openDraftsModal(); });

      row.appendChild(editBtn); row.appendChild(delBtn); list.appendChild(row);
    });

    draftsModal.classList.remove("hidden");
  }

});
