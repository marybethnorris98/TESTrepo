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
// DEFAULT RECIPES
// -----------------------------
const defaultRecipes = [
  {
    title: "Blueberry Pancakes",
    category: "Breakfast",
    image: "images/pancakes.jpg",
    description: "Fluffy homemade pancakes loaded with fresh blueberries.",
    ingredients: ["1 cup flour","1 cup blueberries","1 egg","1 tbsp sugar","1 cup milk"],
    instructions: ["Mix dry ingredients.","Add egg & milk.","Fold in blueberries.","Cook on skillet until golden."],
    hidden: false
  },
  {
    title: "Chicken Caesar Salad",
    category: "Meals",
    image: "images/salad.jpg",
    description: "Crisp romaine, grilled chicken, parmesan, and creamy dressing.",
    ingredients: ["Romaine lettuce","Grilled chicken","Parmesan","Croutons","Caesar dressing"],
    instructions: ["Chop lettuce.","Slice chicken.","Toss with dressing.","Top with cheese & croutons."],
    hidden: false
  },
  {
    title: "Sample Pasta",
    category: "Snacks",
    image: "https://via.placeholder.com/800x500?text=Recipe+Image",
    description: "A quick sample pasta for testing the modal.",
    ingredients: ["2 cups pasta","1 tbsp olive oil","Salt","Parmesan cheese"],
    instructions: ["Boil pasta until tender.","Drain and toss with olive oil.","Season with salt.","Top with parmesan and serve."],
    hidden: false
  }
];

// -----------------------------
// STORAGE KEYS + CATEGORIES
// -----------------------------
const RECIPES_KEY = "recipes";
const DRAFTS_KEY = "drafts_recipes";
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

let recipes = JSON.parse(localStorage.getItem(RECIPES_KEY)) || defaultRecipes;
let drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];

// -----------------------------
// MAIN INITIALIZATION
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {

  // Grab DOM elements safely
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
  const addIngredientBtn = document.getElementById("addIngredientBtn");
  const addInstructionBtn = document.getElementById("addInstructionBtn");
  const saveRecipeBtn = document.getElementById("saveRecipeBtn");

  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");

  const viewer = document.getElementById("recipeModal");
  const closeBtn = document.getElementById("closeViewerBtn");

  let editingDraftId = null;
  let editingRecipeIndex = null;

  [categoryFilter, newCategory].forEach(select => {
    if (!select) return;
    select.style.fontFamily = "Poppins, sans-serif"; // clean font
    select.style.fontSize = "16px";                // bigger font
    select.style.fontWeight = "bold";              // bold text
    select.style.color = "#f039b1";                // pink/purple text
    select.style.padding = "6px 10px";             // nicer spacing
    select.style.borderRadius = "8px";             // rounded corners
    select.style.border = "2px solid #ffb1db";     // matching border color
  });

  if (searchInput) {
    searchInput.style.fontFamily = "Poppins, sans-serif";
    searchInput.style.fontSize = "16px";
    searchInput.style.color = "#f039b1";  // pink/purple text
    searchInput.style.padding = "6px 10px";
    searchInput.style.borderRadius = "8px";
    searchInput.style.border = "2px solid #ffb1db";
  }

  // -----------------------------
  // POPULATE CATEGORY DROPDOWNS
  // -----------------------------
  function populateCategorySelects() {
    [newCategory, categoryFilter].forEach(select => {
      if (!select) return;
      select.innerHTML = "";

      // Only filter dropdown gets "All"
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

  populateCategorySelects();

  // -----------------------------
  // RENDER RECIPES
  // -----------------------------
  function renderRecipes() {
    if (!recipeGrid) return;

    const searchTerm = (searchInput?.value || "").toLowerCase();
    const selectedCategory = categoryFilter?.value || "all";

    const filtered = recipes.filter(recipe => {
      if (!isAdmin && recipe.hidden) return false;

      const matchesSearch =
        (recipe.title || "").toLowerCase().includes(searchTerm) ||
        (recipe.description || "").toLowerCase().includes(searchTerm);

      const matchesCategory =
        selectedCategory === "all" || recipe.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    recipeGrid.innerHTML = "";

    filtered.forEach(recipe => {
      const card = document.createElement("div");
      card.className = "card";

      if (recipe.hidden) {
  if (isAdmin) {
    card.classList.add("hidden-recipe-admin"); // special class for admin
  } else {
    return; // normal users don't see hidden recipes
  }
} 
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

      content.appendChild(titleDiv);
      content.appendChild(catDiv);
      content.appendChild(descDiv);
      card.appendChild(img);
      card.appendChild(content);

      // --- INFO ICON + TOOLTIP ---
      const infoIcon = document.createElement("div");
      infoIcon.className = "card-info-icon";
      infoIcon.textContent = "i";

      const tooltip = document.createElement("div");
      tooltip.className = "card-info-tooltip";
      tooltip.textContent = recipe.credit || "No credits added.";

      infoIcon.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent opening the modal
        tooltip.classList.toggle("visible");
      });

      // Hide tooltip when clicking anywhere else
      document.addEventListener("click", () => tooltip.classList.remove("visible"));

      // Add to card
      card.appendChild(infoIcon);
      card.appendChild(tooltip);

      card.addEventListener("click", () => openRecipeModal(recipe));

      recipeGrid.appendChild(card);
    });
  }

  renderRecipes();

  // -----------------------------
  // OPEN RECIPE MODAL
  // -----------------------------
 function openRecipeModal(recipe) {
  if (!recipe || !viewer) return;

  const modalEditBtn = document.getElementById("modalEditBtn");
  const modalDeleteBtn = document.getElementById("modalDeleteBtn");
  const hideBtn = document.getElementById("modalHideBtn");

  const modalImg = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalCategory = document.getElementById("modalCategory");
  let modalDesc = document.getElementById("modalDescription");

  if (!modalDesc) {
    modalDesc = document.createElement("div");
    modalDesc.id = "modalDescription";
    modalCategory?.after(modalDesc);
  }

  const modalIngredients = document.getElementById("modalIngredients");
  const modalInstructions = document.getElementById("modalInstructions");

  editingRecipeIndex = recipes.findIndex(r =>
    r.title === recipe.title &&
    r.description === recipe.description &&
    r.image === recipe.image
  );
  if (editingRecipeIndex < 0) editingRecipeIndex = null;

  // ✅ FIXED Image size
  if (modalImg) {
    modalImg.src = recipe.image || "";
    modalImg.alt = recipe.title || "";
    modalImg.style.maxWidth = "100%";
    modalImg.style.maxHeight = window.innerWidth <= 480 ? "200px" : "300px";
    modalImg.style.height = "auto";
    modalImg.style.objectFit = "contain";
    modalImg.style.display = "block";
    modalImg.style.margin = window.innerWidth <= 480 ? "0 auto 15px" : "0 auto 30px";
  }

  if (modalTitle) modalTitle.textContent = recipe.title || "";
  if (modalCategory) modalCategory.textContent = recipe.category || "";
  if (modalDesc) modalDesc.textContent = recipe.description || "";

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
    if (isAdmin && editingRecipeIndex !== null) {
      modalEditBtn.style.display = "inline-block";
      modalEditBtn.onclick = () => {
        populateAddModalFromDraft(recipes[editingRecipeIndex]);
        addRecipeModal.classList.remove("hidden");
        viewer.style.display = "none";
      };
    } else modalEditBtn.style.display = "none";
  }

  if (modalDeleteBtn) {
    if (isAdmin && editingRecipeIndex !== null) {
      modalDeleteBtn.style.display = "inline-block";
      modalDeleteBtn.onclick = () => {
        if (!confirm(`Delete "${recipes[editingRecipeIndex].title}"?`)) return;
        recipes.splice(editingRecipeIndex, 1);
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
        viewer.style.display = "none";
        renderRecipes();
      };
    } else modalDeleteBtn.style.display = "none";
  }

  // ✅ FIXED HIDE/UNHIDE
  if (hideBtn) {
    if (isAdmin && editingRecipeIndex !== null) {
      hideBtn.style.display = "inline-block";
      hideBtn.textContent = recipes[editingRecipeIndex].hidden ? "Unhide" : "Hide";

      hideBtn.onclick = (e) => {
        e.stopPropagation();
        recipes[editingRecipeIndex].hidden = !recipes[editingRecipeIndex].hidden;
        localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
        hideBtn.textContent = recipes[editingRecipeIndex].hidden ? "Unhide" : "Hide";
        renderRecipes();
      };
    } else hideBtn.style.display = "none";
  }

  viewer.style.display = "flex";
  viewer.setAttribute("aria-hidden", "false");
}


  // -----------------------------
  // CLOSE MODAL
  // -----------------------------
  if (closeBtn && viewer) {
    closeBtn.addEventListener("click", () => {
      viewer.style.display = "none";
      viewer.setAttribute("aria-hidden", "true");
    });

    viewer.addEventListener("click", (e) => {
      if (e.target === viewer) {
        viewer.style.display = "none";
        viewer.setAttribute("aria-hidden", "true");
      }
    });
  }

  // -----------------------------
  // SEARCH & FILTER
  // -----------------------------
  if (searchInput) searchInput.addEventListener("input", renderRecipes);
  if (categoryFilter) categoryFilter.addEventListener("change", renderRecipes);

  // -----------------------------
  // ADMIN LOGIN FIXED
  // -----------------------------
  const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join("");

  function openLoginModal() {
    if (!loginModal || !loginError) return;
    loginError.style.display = "none";
    loginModal.classList.remove("hidden");
  }

  loginBtn?.addEventListener("click", () => {
    const entered = document.getElementById("adminPassword")?.value || "";
    if (entered.split("").reverse().join("") === ADMIN_PASSWORD_HASH) {
      isAdmin = true;
      localStorage.setItem("admin", "true"); // persist login
      loginModal.classList.add("hidden");
      injectAdminUI();
      renderRecipes();
    } else {
      if (loginError) loginError.style.display = "block";
    }
  });

  document.addEventListener("keydown", (e) => {
    const key = e.key?.toLowerCase();
    const mac = navigator.userAgent.includes("Mac");
    const shouldOpen =
      (mac && e.metaKey && e.shiftKey && key === "m") ||
      (!mac && e.ctrlKey && e.shiftKey && key === "m");
    if (shouldOpen) openLoginModal();
  });

  // If already logged in, inject admin UI
  if (isAdmin) {
    injectAdminUI();
    renderRecipes();
  }

  // -----------------------------
  // INJECT ADMIN UI
  // -----------------------------
 function injectAdminUI() {
  if (document.getElementById("adminControlsContainer")) return;

  const container = document.createElement("div");
  container.id = "adminControlsContainer";
  container.style = "position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:1200;";

  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add Recipe";
  addBtn.style.background = "#ff3ebf";
  addBtn.style.fontFamily = "Poppins, sans-serif";
  addBtn.style.color = "white";
  addBtn.style.padding="12px 16px";
  addBtn.style.borderRadius="14px";
  addBtn.style.border="none";
  addBtn.style.fontSize= "16px";
  addBtn.style.cursor="pointer";
  addBtn.style.boxShadow="0 8px 20px rgba(0,0,0,0.15)"

  // ✅ FIXED Add Recipe click
  addBtn.addEventListener("click", () => {
    editingDraftId = null;
    ensureAddModalControls();  // make sure modal buttons exist
    clearAddModal();           // start with fresh inputs
    addRecipeModal?.classList.remove("hidden"); // show modal
  });

  const draftsBtn = document.createElement("button");
  draftsBtn.textContent = "Drafts";
  draftsBtn.style.background = "#ff3ebf";
  draftsBtn.style.fontFamily = "Poppins, sans-serif";
  draftsBtn.style.color = "white";
  draftsBtn.style.padding="12px 16px";
  draftsBtn.style.borderRadius="14px";
  draftsBtn.style.border="none";
  draftsBtn.style.fontSize= "16px";
  draftsBtn.style.cursor="pointer";
  draftsBtn.style.boxShadow="0 8px 20px rgba(0,0,0,0.15)"
  draftsBtn.addEventListener("click", openDraftsModal);

  container.appendChild(addBtn);
  container.appendChild(draftsBtn);
  document.body.appendChild(container);

  addLogoutButton();
}


  // -----------------------------
  // LOGOUT BUTTON
  // -----------------------------
  function logoutAdmin() {
    isAdmin = false;
    localStorage.removeItem("admin");
    location.reload(); // reset UI
  }

  function addLogoutButton() {
    if (!document.getElementById("adminControlsContainer")) return;
    if (document.getElementById("logoutBtn")) return;

    const logoutBtn = document.createElement("button");
    logoutBtn.id = "logoutBtn";
    logoutBtn.textContent = "Logout";
    logoutBtn.style.background = "#ff3ebf";
    logoutBtn.style.fontFamily = "Poppins, sans-serif";
    logoutBtn.style.color = "white";
    logoutBtn.style.padding="12px 16px";
    logoutBtn.style.borderRadius="14px";
    logoutBtn.style.border="none";
    logoutBtn.style.fontSize= "16px";
    logoutBtn.style.cursor="pointer";
    logoutBtn.style.boxShadow="0 8px 20px rgba(0,0,0,0.15)"
    logoutBtn.addEventListener("click", logoutAdmin);

    document.getElementById("adminControlsContainer").appendChild(logoutBtn);
  }

  // -----------------------------
  // ADD/EDIT RECIPE MODAL HELPERS
  // -----------------------------
  function makeRowInput(placeholder = "", type = "ingredient") {
    const row = document.createElement("div");
    row.className = "admin-row";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.value = "";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.title = "Remove";
    removeBtn.style = "margin-left:8px;background:transparent;border:none;color:#ff3ebf;font-weight:700;font-size:18px;cursor:pointer;";
    removeBtn.textContent = "✖";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(input);
    row.appendChild(removeBtn);
    return row;
  }

  function clearAddModal() {
    newTitle.value = "";
    newCategory.value = CATEGORIES[0];
    newImage.value = "";
    newDesc.value = "";
    ingredientsList.innerHTML = "";
    instructionsList.innerHTML = "";
    editingDraftId = null;
  }

  function populateAddModalFromDraft(draft) {
    clearAddModal();
    if (!draft) return;

    newTitle.value = draft.title || "";
    newCategory.value = draft.category || CATEGORIES[0];
    newImage.value = draft.image || "";
    newDesc.value = draft.description || "";

    (draft.ingredients || []).forEach(ing => {
      const r = makeRowInput("Ingredient", "ingredient");
      r.querySelector("input").value = ing;
      ingredientsList.appendChild(r);
    });

    (draft.instructions || []).forEach(step => {
      const r = makeRowInput("Step", "step");
      r.querySelector("input").value = step;
      instructionsList.appendChild(r);
    });
  }

  function ensureAddModalControls() {
    if (!addRecipeModal) return;
    const modalContent = addRecipeModal.querySelector(".modal-content");
    if (!modalContent) return;

    if (!modalContent.querySelector("#saveDraftBtn")) {
  const saveDraftBtn = document.createElement("button");
  saveDraftBtn.id = "saveDraftBtn";
  saveDraftBtn.type = "button";
  saveDraftBtn.innerText = "Save Draft";
  saveDraftBtn.style.background= "#ff3ebf";
  saveDraftBtn.style.color= "white";
  saveDraftBtn.style.border= "none";
  saveDraftBtn.style.padding= "14px 18px";
  saveDraftBtn.style.fontSize= "18px";
  saveDraftBtn.style.fontFamily= "Poppins, San-Serif";
  saveDraftBtn.style.borderRadius= "12px";
  saveDraftBtn.style.width= "100%";
  saveDraftBtn.style.cursor= "pointer";
  saveDraftBtn.style.marginBottom = "15px";
  
  // Attach the function (we’ll add this function next)
  saveDraftBtn.addEventListener("click", saveDraftFromModal);

  const saveBtn = modalContent.querySelector("#saveRecipeBtn");
  if (saveBtn) saveBtn.parentNode.insertBefore(saveDraftBtn, saveBtn);
  else modalContent.appendChild(saveDraftBtn);
}

    // Big X close button
    if (!modalContent.querySelector(".add-modal-close-x")) {
      const x = document.createElement("button");
      x.className = "add-modal-close-x";
      x.type = "button";
      x.innerText = "✖";
      x.title = "Close and discard";
      x.style = "position:absolute;right:18px;top:14px;background:transparent;border:none;font-size:22px;cursor:pointer;color:#a00;";
      x.addEventListener("click", () => {
        if (confirm("Discard changes and close?")) {
          clearAddModal();
          addRecipeModal.classList.add("hidden");
        }
      });
      modalContent.style.position = modalContent.style.position || "relative";
      modalContent.appendChild(x);
    }

    // Save Draft button
    if (!modalContent.querySelector("#saveDraftBtn")) {
      const saveDraftBtn = document.createElement("button");
      saveDraftBtn.id = "saveDraftBtn";
      saveDraftBtn.type = "button";
      saveDraftBtn.innerText = "Save Draft";
      saveDraftBtn.style = "background:#ffb6dd;color:#6a003a;padding:10px;border-radius:12px;border:none;margin-top:12px;cursor:pointer;width:100%;";
      saveDraftBtn.addEventListener("click", saveDraftFromModal);

      const saveBtn = modalContent.querySelector("#saveRecipeBtn");
      if (saveBtn) saveBtn.parentNode.insertBefore(saveDraftBtn, saveBtn);
      else modalContent.appendChild(saveDraftBtn);
    }
  }

  addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
  addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Step")));

  // -----------------------------
  // SAVE RECIPE
  // -----------------------------
saveRecipeBtn?.addEventListener("click", () => {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || CATEGORIES[0];
  const image = (newImage.value || "").trim();
  const description = (newDesc.value || "").trim();

  // Validate required fields
  if (!title || !image || !description) {
    return alert("Please fill in title, image, and description.");
  }

  // Gather ingredients and instructions
  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  // Create new recipe object
  const newRecipe = {
    title,
    category,
    image,
    description,
    ingredients,
    instructions,
    credits,
    hidden: false // default to visible
  };

  // -----------------------------
  // Determine whether editing a recipe or adding new
  // -----------------------------
  if (editingRecipeIndex !== null) {
    // Updating an existing recipe
    recipes[editingRecipeIndex] = newRecipe;
    editingRecipeIndex = null;
  } else {
    // Adding a completely new recipe
    recipes.push(newRecipe);
  }

  // -----------------------------
  // Remove draft if one was being edited
  // -----------------------------
  if (editingDraftId) {
    drafts = drafts.filter(d => d.id !== editingDraftId);
    editingDraftId = null;
  }

  // -----------------------------
  // Persist and refresh UI
  // -----------------------------
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

  alert("Recipe saved!");
  clearAddModal();
  addRecipeModal.classList.add("hidden");
  renderRecipes();
});

  function saveDraftFromModal() {
  const title = (newTitle.value || "").trim();
  const category = newCategory.value || CATEGORIES[0];
  const image = (newImage.value || "").trim();
  const description = (newDesc.value || "").trim();

  if (!title && !image && !description) {
    return alert("Please fill at least a title, image, or description to save a draft.");
  }

  const ingredients = [...ingredientsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  const instructions = [...instructionsList.querySelectorAll("input")]
    .map(i => i.value.trim())
    .filter(Boolean);

  const draft = {
    id: editingDraftId || `draft_${Date.now()}`,
    title,
    category,
    image,
    description,
    ingredients,
    instructions
  };

  if (editingDraftId) {
    drafts = drafts.map(d => (d.id === editingDraftId ? draft : d));
  } else {
    drafts.push(draft);
    editingDraftId = draft.id;
  }

  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

  alert("Draft saved!");
  addRecipeModal.classList.add("hidden");
  clearAddModal();
}


  // -----------------------------
  // OPEN ADD RECIPE MODAL
  // -----------------------------
  function openAddRecipeModal() {
    ensureAddModalControls();
    addRecipeModal?.classList.remove("hidden");
    if (editingDraftId) {
      const d = drafts.find(x => x.id === editingDraftId);
      if (d) populateAddModalFromDraft(d);
    }
  }

  // -----------------------------
  // DRAFTS
  // -----------------------------
  async function openDraftsModal() {
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

    try {
      const res = await fetch("/drafts");
      const serverDrafts = await res.json();

      if (!serverDrafts.length) {
        const p = document.createElement("div");
        p.textContent = "No drafts yet.";
        p.style = "color:#666;padding:12px;";
        listContainer.appendChild(p);
      } else {
        serverDrafts.sort((a,b) => (a.title||"").localeCompare(b.title||""));
        serverDrafts.forEach(d => {
          const row = document.createElement("div");
          row.style = "display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:10px;border:1px solid #ffe7f5;background:#fff9fc;";

          const titleDiv = document.createElement("div");
          titleDiv.textContent = d.title || "Untitled Draft";
          titleDiv.style = "font-weight:600;color:#a00064;";

          const actions = document.createElement("div");
          actions.style = "display:flex;gap:8px;";

          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.style = "background:#ff3ebf;color:white;border:none;padding:6px 10px;border-radius:8px;cursor:pointer;";
          editBtn.addEventListener("click", () => {
            editingDraftId = d.id;
            populateAddModalFromDraft(d);
            addRecipeModal.classList.remove("hidden");
            draftsModal.classList.add("hidden");
          });

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.style = "background:transparent;color:#b20050;border:2px solid #ffd1e8;padding:6px 10px;border-radius:8px;cursor:pointer;";
          deleteBtn.addEventListener("click", async () => {
            if (!confirm(`Delete draft "${d.title}"?`)) return;
            await fetch(`/drafts/${d.id}`, { method: "DELETE" });
            openDraftsModal();
          });

          actions.appendChild(editBtn);
          actions.appendChild(deleteBtn);
          row.appendChild(titleDiv);
          row.appendChild(actions);
          listContainer.appendChild(row);
        });
      }
    } catch (err) {
      console.error("Error loading drafts:", err);
      alert("Failed to load drafts from server.");
    }

    draftsModal.classList.remove("hidden");
  }

  ensureAddModalControls();

}); // end DOMContentLoaded
