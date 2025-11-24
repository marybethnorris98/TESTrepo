// --------------------------------------------------
// IMPORT FIREBASE MODULES
// --------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --------------------------------------------------
// FIREBASE CONFIG
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC95ggTgS2Ew1MavuzEZrIvq6itTyxVdhA",
  authDomain: "recipeapp-248a1.firebaseapp.com",
  projectId: "recipeapp-248a1",
  storageBucket: "recipeapp-248a1.firebasestorage.app",
  messagingSenderId: "1:629558122940:web:65dcca8ea0c572ccdf33b9",
  appId: "G-7W26GEB9WX"
};

// --------------------------------------------------
// INITIALIZE FIREBASE + FIRESTORE
// --------------------------------------------------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --------------------------------------------------
// MODAL HANDLERS
// --------------------------------------------------
const addRecipeModal = document.getElementById("addRecipeModal");
document.getElementById("openAddRecipeModal").addEventListener("click", () => {
  addRecipeModal.classList.remove("hidden");
});
document.getElementById("closeAddModal").addEventListener("click", () => {
  addRecipeModal.classList.add("hidden");
});

// --------------------------------------------------
// FORM HANDLER
// --------------------------------------------------
const recipeForm = document.getElementById("recipeForm");
recipeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const newRecipe = {
      title: document.getElementById("title").value.trim(),
      category: document.getElementById("category").value.trim() || "Uncategorized",
      image: document.getElementById("image").value.trim(),
      description: document.getElementById("description").value.trim(),
      ingredients: document.getElementById("ingredients").value
                     .split(",").map(s => s.trim()).filter(s => s),
      instructions: document.getElementById("instructions").value
                     .split(",").map(s => s.trim()).filter(s => s),
      credits: document.getElementById("credits").value.trim(),
      tags: document.getElementById("tags").value
             .split(",").map(s => s.trim()).filter(s => s),
      hidden: document.getElementById("hidden").checked,
      draft: document.getElementById("draft").checked,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDoc(collection(db, "recipes"), newRecipe);

    recipeForm.reset();
    addRecipeModal.classList.add("hidden");
    renderRecipes();

  } catch (error) {
    console.error("Error saving recipe:", error);
    alert("Error saving recipe: " + error);
  }
});

// --------------------------------------------------
// RENDER RECIPES
// --------------------------------------------------
const recipeGrid = document.getElementById("recipeGrid");

async function renderRecipes() {
  try {
    const querySnapshot = await getDocs(collection(db, "recipes"));
    let recipes = [];
    querySnapshot.forEach(doc => recipes.push({ id: doc.id, ...doc.data() }));

    recipeGrid.innerHTML = ""; // clear existing cards

    recipes.forEach(r => {
      const card = document.createElement("div");
      card.className = "card";
      if (r.hidden) card.classList.add("hidden-recipe");

      card.innerHTML = `
        <img src="${r.image || 'https://via.placeholder.com/300x180'}" alt="${r.title}" />
        <div class="card-title">${r.title}</div>
        <div class="card-category">${r.category}</div>
        <div class="card-desc">${r.description}</div>
        <div class="card-info-icon">i</div>
        <div class="card-info-tooltip">
          <strong>Ingredients:</strong> ${r.ingredients.join(", ")}<br>
          <strong>Instructions:</strong> ${r.instructions.join(", ")}<br>
          <strong>Credits:</strong> ${r.credits || "N/A"}<br>
          <strong>Tags:</strong> ${r.tags.join(", ")}
        </div>
      `;

      // Tooltip hover
      const infoIcon = card.querySelector(".card-info-icon");
      const tooltip = card.querySelector(".card-info-tooltip");
      infoIcon.addEventListener("mouseenter", () => tooltip.classList.add("visible"));
      infoIcon.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));

      recipeGrid.appendChild(card);
    });

  } catch (error) {
    console.error("Error rendering recipes:", error);
  }
}

// Initial render
renderRecipes();
