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
// YOUR FIREBASE CONFIG (replace with your own)
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
// BUTTON HANDLERS
// --------------------------------------------------
const recipeForm = document.getElementById("recipeForm");
const output = document.getElementById("output");

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

    const docRef = await addDoc(collection(db, "recipes"), newRecipe);
    output.textContent = `Recipe saved! ID: ${docRef.id}`;

    recipeForm.reset();
  } catch (error) {
    output.textContent = `Error saving recipe: ${error}`;
  }
});
