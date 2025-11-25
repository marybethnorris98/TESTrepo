console.log("FULL admin + viewer script loaded");

// -----------------------------
// FIREBASE IMPORTS
// -----------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// -----------------------------
// FIREBASE CONFIG
// -----------------------------
const firebaseConfig = {
 apiKey: "AIzaSyC95ggTgS2Ew1MavuzEZrIvq6itTyxVdhA",
  authDomain: "recipeapp-248a1.firebaseapp.com",
  projectId: "recipeapp-248a1",
  storageBucket: "recipeapp-248a1.firebasestorage.app",
  messagingSenderId: "629558122940",
  appId: "1:629558122940:web:65dcca8ea0c572ccdf33b9",
  measurementId: "G-7W26GEB9WX"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------
// ADMIN STATE
// -----------------------------
let isAdmin = localStorage.getItem("admin") === "true";

// -----------------------------
// DEFAULT RECIPES (Unused, kept for reference)
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
// CATEGORIES
// -----------------------------
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

// -----------------------------
// STATE VARIABLES
// -----------------------------
let recipes = [];
let drafts = [];
let editingDraftId = null; // ID of the draft being edited/loaded
let editingRecipeId = null; // ID of the recipe being edited/loaded

// -----------------------------
// DOM ELEMENTS (Declared globally or in the event listener scope)
// -----------------------------
let recipeGrid, searchInput, categoryFilter;
let addRecipeModal, newTitle, newCategory, newImage, newDesc, ingredientsList, instructionsList, saveRecipeBtn, addIngredientBtn, addInstructionBtn, saveDraftBtn;
let viewer, closeBtn;
let loginModal, loginBtn, loginError;
let draftsModal, draftsList, closeDraftsBtn;

document.addEventListener("DOMContentLoaded", async () => {
  // --- DOM ELEMENT Assignments ---
  recipeGrid = document.getElementById("recipeGrid");
  searchInput = document.getElementById("searchInput");
  categoryFilter = document.getElementById("categoryFilter");

  addRecipeModal = document.getElementById("addRecipeModal");
  newTitle = document.getElementById("newTitle");
  newCategory = document.getElementById("newCategory");
  newImage = document.getElementById("newImage");
  newDesc = document.getElementById("newDesc");
  ingredientsList = document.getElementById("ingredientsList");
  instructionsList = document.getElementById("instructionsList");
  saveRecipeBtn = document.getElementById("saveRecipeBtn");
  addIngredientBtn = document.getElementById("addIngredientBtn");
  addInstructionBtn = document.getElementById("addInstructionBtn");
  saveDraftBtn = document.getElementById("saveDraftBtn"); // Added 'saveDraftBtn'

  viewer = document.getElementById("recipeModal");
  closeBtn = document.getElementById("closeViewerBtn");

  loginModal = document.getElementById("loginModal");
  loginBtn = document.getElementById("loginBtn");
  loginError = document.getElementById("loginError");

  draftsModal = document.getElementById("draftsModal"); // Added 'draftsModal'
  draftsList = document.getElementById("draftsList"); // Added 'draftsList'
  closeDraftsBtn = document.getElementById("closeDraftsBtn"); // Added 'closeDraftsBtn'
  
  // -----------------------------
  // CATEGORY DROPDOWN
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
  populateCategorySelects();

  // -----------------------------
  // FIRESTORE FETCH RECIPES & DRAFTS
  // -----------------------------
  async function loadRecipes() {
    const recipesCol = collection(db, "recipes");
    const q = query(recipesCol, orderBy("title"));
    const snapshot = await getDocs(q);
    recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderRecipes();
  }

  async function loadDrafts() {
    const draftsCol = collection(db, "drafts");
    const q = query(draftsCol, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // -----------------------------
  // RENDER RECIPES
  // -----------------------------
  function renderRecipes() {
    if (!recipeGrid) return;
    const searchTerm = (searchInput?.value || "").toLowerCase();
    const selectedCategory = categoryFilter?.value || "all";

    recipeGrid.innerHTML = "";

    recipes.forEach(recipe => {
      if (!isAdmin && recipe.hidden) return;

      if (selectedCategory !== "all" && recipe.category !== selectedCategory) return;
      if (!recipe.title.toLowerCase().includes(searchTerm) &&
          !recipe.description.toLowerCase().includes(searchTerm)) return;

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

      content.appendChild(titleDiv);
      content.appendChild(catDiv);
      content.appendChild(descDiv);
      card.appendChild(img);
      card.appendChild(content);

      // Info icon
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
      card.appendChild(infoIcon);
      card.appendChild(tooltip);

      card.addEventListener("click", () => openRecipeModal(recipe));

      recipeGrid.appendChild(card);
    });
  }

  // -----------------------------
  // OPEN RECIPE MODAL
  // -----------------------------
  function openRecipeModal(recipe) {
    if (!recipe || !viewer) return;

    const modalImg = document.getElementById("modalImage");
    const modalTitle = document.getElementById("modalTitle");
    const modalCategory = document.getElementById("modalCategory");
    const modalDesc = document.getElementById("modalDescription");
    const modalIngredients = document.getElementById("modalIngredients");
    const modalInstructions = document.getElementById("modalInstructions");
    const modalEditBtn = document.getElementById("modalEditBtn");
    const modalDeleteBtn = document.getElementById("modalDeleteBtn");
    const hideBtn = document.getElementById("modalHideBtn");

    editingRecipeId = recipe.id; // Set editingRecipeId for the recipe being viewed

    if (modalImg) {
      modalImg.src = recipe.image || "";
      modalImg.alt = recipe.title || "";
    }
    if (modalTitle) modalTitle.textContent = recipe.title || "";
    if (modalCategory) modalCategory.textContent = recipe.category || "";
    if (modalDesc) modalDesc.textContent = recipe.description || "";

    if (modalIngredients) {
      modalIngredients.innerHTML = "";
      (recipe.ingredients || []).forEach(i => {
        const li = document.createElement("li");
        li.textContent = i;
        modalIngredients.appendChild(li);
      });
    }

    if (modalInstructions) {
      modalInstructions.innerHTML = "";
      (recipe.instructions || []).forEach(s => {
        const li = document.createElement("li");
        li.textContent = s;
        modalInstructions.appendChild(li);
      });
    }

    if (isAdmin) {
      modalEditBtn.style.display = "inline-block";
      modalDeleteBtn.style.display = "inline-block";
      hideBtn.style.display = "inline-block";

      modalEditBtn.onclick = () => {
        // When editing a final recipe, set both IDs
        editingRecipeId = recipe.id;
        editingDraftId = null; // Clear draft ID
        populateAddModalFromRecipeOrDraft(recipe);
        addRecipeModal.classList.remove("hidden");
        viewer.style.display = "none";
      };

      modalDeleteBtn.onclick = async () => {
        if (!confirm(`Delete "${recipe.title}"?`)) return;
        await deleteDoc(doc(db, "recipes", recipe.id));
        await loadRecipes();
        viewer.style.display = "none";
      };

      hideBtn.textContent = recipe.hidden ? "Unhide" : "Hide";
      hideBtn.onclick = async e => {
        e.stopPropagation();
        await updateDoc(doc(db, "recipes", recipe.id), { hidden: !recipe.hidden });
        await loadRecipes();
        viewer.style.display = "none";
      };
    } else {
      modalEditBtn.style.display = "none";
      modalDeleteBtn.style.display = "none";
      hideBtn.style.display = "none";
    }

    viewer.style.display = "flex";
  }

  // -----------------------------
  // CLOSE MODAL
  // -----------------------------
  if (closeBtn) {
    closeBtn.addEventListener("click", () => { viewer.style.display = "none"; });
    viewer.addEventListener("click", e => { if (e.target === viewer) viewer.style.display = "none"; });
  }

  // -----------------------------
  // SEARCH & FILTER
  // -----------------------------
  searchInput?.addEventListener("input", renderRecipes);
  categoryFilter?.addEventListener("change", renderRecipes);

  // -----------------------------
  // ADMIN LOGIN
  // -----------------------------
  const ADMIN_PASSWORD_HASH = "pinkrecipes".split("").reverse().join("");
  function openLoginModal() { loginModal?.classList.remove("hidden"); loginError.style.display = "none"; }

  loginBtn?.addEventListener("click", () => {
    const entered = document.getElementById("adminPassword")?.value || "";
    if (entered.split("").reverse().join("") === ADMIN_PASSWORD_HASH) {
      isAdmin = true;
      localStorage.setItem("admin", "true");
      injectAdminUI();
      renderRecipes();
      loginModal.classList.add("hidden");
    } else loginError.style.display = "block";
  });

  document.addEventListener("keydown", e => {
    const key = e.key?.toLowerCase();
    const mac = navigator.userAgent.includes("Mac");
    if ((mac && e.metaKey && e.shiftKey && key === "m") || (!mac && e.ctrlKey && e.shiftKey && key === "m")) openLoginModal();
  });

  if (isAdmin) injectAdminUI();

  // -----------------------------
  // ADMIN UI
  // -----------------------------
  function injectAdminUI() {
    if (document.getElementById("adminControlsContainer")) return;

    const container = document.createElement("div");
    container.id = "adminControlsContainer";
    container.style = "position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:1200;";

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add Recipe";
    Object.assign(addBtn.style, { background:"#ff3ebf", color:"white", padding:"12px 16px", borderRadius:"14px", border:"none", fontSize:"16px", cursor:"pointer", fontFamily:"Poppins, sans-serif", boxShadow:"0 8px 20px rgba(0,0,0,0.15)" });
    addBtn.onclick = () => { editingDraftId = null; editingRecipeId = null; clearAddModal(); addRecipeModal.classList.remove("hidden"); }; // Clear both IDs for new recipe

    const draftsBtn = document.createElement("button");
    draftsBtn.textContent = "Drafts";
    Object.assign(draftsBtn.style, { background:"#ff3ebf", color:"white", padding:"12px 16px", borderRadius:"14px", border:"none", fontSize:"16px", cursor:"pointer", fontFamily:"Poppins, sans-serif", boxShadow:"0 8px 20px rgba(0,0,0,0.15)" });
    draftsBtn.onclick = openDraftsModal;

    container.appendChild(addBtn);
    container.appendChild(draftsBtn);
    document.body.appendChild(container);

    addLogoutButton();
    // Add Save Draft Button to the Add Recipe Modal (assuming a placeholder element exists)
    if (addRecipeModal) {
      const draftButton = document.createElement("button");
      draftButton.id = "saveDraftBtn";
      draftButton.textContent = "Save Draft";
      draftButton.type = "button";
      Object.assign(draftButton.style, { background:"#ff3ebf", color:"white", padding:"14px 18px", borderRadius:"12px", border:"none", fontSize:"18px", fontFamily= "Poppins, San-Serif", cursor:"pointer", fontFamily:"Poppins, sans-serif", marginTop:"10px" });
      const containerInModal = addRecipeModal.querySelector(".modal-buttons") || saveRecipeBtn.parentElement;
      if (containerInModal) containerInModal.prepend(draftButton); // Add before save button
      saveDraftBtn = document.getElementById("saveDraftBtn");
      saveDraftBtn.addEventListener("click", saveDraft);
    }
  }

  function addLogoutButton() {
    if (!document.getElementById("adminControlsContainer")) return;
    if (document.getElementById("logoutBtn")) return;

    const logoutBtn = document.createElement("button");
    logoutBtn.id = "logoutBtn";
    logoutBtn.textContent = "Logout";
    Object.assign(logoutBtn.style, { background:"#ff3ebf", color:"white", padding:"12px 16px", borderRadius:"14px", border:"none", fontSize:"16px", cursor:"pointer", fontFamily:"Poppins, sans-serif", boxShadow:"0 8px 20px rgba(0,0,0,0.15)" });
    logoutBtn.onclick = () => { isAdmin=false; localStorage.removeItem("admin"); location.reload(); };

    document.getElementById("adminControlsContainer").appendChild(logoutBtn);
  }

  // -----------------------------
  // MODAL HELPERS
  // -----------------------------
  function makeRowInput(placeholder="") {
    const row = document.createElement("div");
    row.className = "admin-row";
    const input = document.createElement("input");
    input.type="text"; input.placeholder=placeholder; input.value="";
    const removeBtn = document.createElement("button");
    removeBtn.type="button"; removeBtn.textContent="✖";
    removeBtn.style="margin-left:8px;background:transparent;border:none;color:#ff3ebf;font-weight:700;font-size:18px;cursor:pointer;";
    removeBtn.onclick = () => row.remove();
    row.appendChild(input); row.appendChild(removeBtn);
    return row;
  }

  function clearAddModal() {
    newTitle.value=""; newCategory.value=CATEGORIES[0]; newImage.value=""; newDesc.value="";
    ingredientsList.innerHTML=""; instructionsList.innerHTML="";

  function populateAddModalFromRecipeOrDraft(d) {
    clearAddModal();
    newTitle.value=d.title||""; newCategory.value=d.category||CATEGORIES[0]; newImage.value=d.image||""; newDesc.value=d.description||"";
    (d.ingredients||[]).forEach(i => { const r=makeRowInput("Ingredient"); r.querySelector("input").value=i; ingredientsList.appendChild(r); });
    (d.instructions||[]).forEach(s => { const r=makeRowInput("Step"); r.querySelector("input").value=s; instructionsList.appendChild(r); });
    // If loading from a draft, set its ID for saving later
    if (d.id && drafts.some(draft => draft.id === d.id)) {
        editingDraftId = d.id;
        editingRecipeId = d.forRecipeId || null; // Carry over if editing an existing recipe
    } else {
        editingDraftId = null;
        editingRecipeId = d.id; // If loading from a final recipe
    }
  }

  addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
  addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Step")));

  // -----------------------------
  // SAVE DRAFT
  // -----------------------------
  async function saveDraft() {
    const title = newTitle.value.trim() || `Draft: ${new Date().toLocaleTimeString()}`;
    const category = newCategory.value || CATEGORIES[0];
    const image = newImage.value.trim();
    const description = newDesc.value.trim();

    const ingredients = [...ingredientsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
    const instructions = [...instructionsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);

    const data = {
      title,
      category,
      image,
      description,
      ingredients,
      instructions,
      timestamp: serverTimestamp(),
      forRecipeId: editingRecipeId || null, // Preserve the ID of the recipe being edited
    };

    let docRef;
    if (editingDraftId) {
      docRef = doc(db, "drafts", editingDraftId);
      await updateDoc(docRef, data);
      alert(`Draft "${title}" updated!`);
    } else {
      docRef = doc(collection(db, "drafts"));
      await setDoc(docRef, data);
      editingDraftId = docRef.id; // Set ID for potential future updates
      alert(`Draft "${title}" saved!`);
    }

    await loadDrafts();
  }

  // -----------------------------
  // SAVE RECIPE
  // -----------------------------
  saveRecipeBtn?.addEventListener("click", async () => {
    const title=newTitle.value.trim(), category=newCategory.value||CATEGORIES[0],
              image=newImage.value.trim(), description=newDesc.value.trim();
    if (!title || !image || !description) return alert("Fill title, image, description.");

    const ingredients=[...ingredientsList.querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean);
    const instructions=[...instructionsList.querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean);

    const data={ title, category, image, description, ingredients, instructions, hidden:false, credits:"" };

    let recipeDocId = editingRecipeId;
    if (editingRecipeId) {
      await setDoc(doc(db,"recipes",editingRecipeId), data);
    } else {
      const newDoc = doc(collection(db,"recipes"));
      await setDoc(newDoc, data);
      recipeDocId = newDoc.id;
    }

    // After successfully saving/updating the recipe, delete the associated draft if one exists
    if (editingDraftId) {
      await deleteDoc(doc(db, "drafts", editingDraftId));
      await loadDrafts(); // Update drafts list
    }

    clearAddModal();
    editingRecipeId = null; // Clear all IDs
    editingDraftId = null;
    addRecipeModal.classList.add("hidden");
    await loadRecipes();
  });

  // -----------------------------
  // DRAFTS MODAL
  // -----------------------------
  async function openDraftsModal() {
    if (!draftsModal) return;

    await loadDrafts();
    draftsList.innerHTML = ""; // Clear existing list

    if (drafts.length === 0) {
      draftsList.innerHTML = "<p>No drafts saved.</p>";
    } else {
      const ul = document.createElement("ul");
      ul.className = "drafts-list";
      drafts.forEach(draft => {
        const li = document.createElement("li");
        li.className = "draft-item";
        li.innerHTML = `
          <div class="draft-title-container">
            <span>${draft.title || 'Untitled Draft'}</span>
            ${draft.timestamp ? `<small class="draft-timestamp">(${new Date(draft.timestamp.seconds * 1000).toLocaleString()})</small>` : ''}
          </div>
          <div class="draft-actions">
            <button class="load-draft-btn" data-id="${draft.id}">Load</button>
            <button class="delete-draft-btn" data-id="${draft.id}">Delete</button>
          </div>
        `;
        ul.appendChild(li);

        li.querySelector(".load-draft-btn").addEventListener("click", () => {
          editingDraftId = draft.id;
          editingRecipeId = draft.forRecipeId || null;
          populateAddModalFromRecipeOrDraft(draft);
          draftsModal.classList.add("hidden");
          addRecipeModal.classList.remove("hidden");
        });

        li.querySelector(".delete-draft-btn").addEventListener("click", async () => {
          if (!confirm(`Are you sure you want to delete the draft: ${draft.title}?`)) return;
          await deleteDoc(doc(db, "drafts", draft.id));
          await openDraftsModal(); // Reload drafts modal
        });
      });
      draftsList.appendChild(ul);
    }

    draftsModal.classList.remove("hidden");
  }

  // Close Drafts Modal functionality
  if (closeDraftsBtn) {
    closeDraftsBtn.addEventListener("click", () => { draftsModal.classList.add("hidden"); });
  }
  if (draftsModal) {
    draftsModal.addEventListener("click", e => { if (e.target === draftsModal) draftsModal.classList.add("hidden"); });
  }

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  await loadRecipes();

}); // end DOMContentLoaded
