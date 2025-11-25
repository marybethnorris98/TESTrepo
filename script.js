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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER",
  appId: "YOUR_APP_ID"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------
// ADMIN STATE
// -----------------------------
let isAdmin = localStorage.getItem("admin") === "true";

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
// CATEGORIES
// -----------------------------
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

// -----------------------------
// STATE VARIABLES
// -----------------------------
let recipes = [];
let drafts = [];
let editingDraftId = null;
let editingRecipeId = null;

// -----------------------------
// DOM ELEMENTS
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

  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");

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
  // FIRESTORE FETCH RECIPES
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
    const snapshot = await getDocs(draftsCol);
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

    editingRecipeId = recipe.id;

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
        populateAddModalFromDraft(recipe);
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
    addBtn.onclick = () => { editingDraftId = null; clearAddModal(); addRecipeModal.classList.remove("hidden"); };

    const draftsBtn = document.createElement("button");
    draftsBtn.textContent = "Drafts";
    Object.assign(draftsBtn.style, { background:"#ff3ebf", color:"white", padding:"12px 16px", borderRadius:"14px", border:"none", fontSize:"16px", cursor:"pointer", fontFamily:"Poppins, sans-serif", boxShadow:"0 8px 20px rgba(0,0,0,0.15)" });
    draftsBtn.onclick = openDraftsModal;

    container.appendChild(addBtn);
    container.appendChild(draftsBtn);
    document.body.appendChild(container);

    addLogoutButton();
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
    ingredientsList.innerHTML=""; instructionsList.innerHTML=""; editingDraftId=null; editingRecipeId=null;
  }

  function populateAddModalFromDraft(d) {
    clearAddModal();
    newTitle.value=d.title||""; newCategory.value=d.category||CATEGORIES[0]; newImage.value=d.image||""; newDesc.value=d.description||"";
    (d.ingredients||[]).forEach(i => { const r=makeRowInput("Ingredient"); r.querySelector("input").value=i; ingredientsList.appendChild(r); });
    (d.instructions||[]).forEach(s => { const r=makeRowInput("Step"); r.querySelector("input").value=s; instructionsList.appendChild(r); });
    editingRecipeId = d.id;
  }

  addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
  addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Step")));

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

    if (editingRecipeId) {
      await setDoc(doc(db,"recipes",editingRecipeId), data);
    } else {
      const newDoc = doc(collection(db,"recipes"));
      await setDoc(newDoc, data);
    }

    clearAddModal(); addRecipeModal.classList.add("hidden"); await loadRecipes();
  });

  // -----------------------------
  // DRAFTS MODAL
  // -----------------------------
  async function openDraftsModal() {
    await loadDrafts();
    // similar to previous drafts modal UI code, but now uses Firestore drafts collection
    // implement UI exactly as before, replacing localStorage with Firestore calls
  }

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  await loadRecipes();

}); // end DOMContentLoaded
