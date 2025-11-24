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
document.getElementById("saveBtn").addEventListener("click", async () => {
  try {
    const docRef = await addDoc(collection(db, "testCollection"), {
      message: "Hello Firestore!",
      timestamp: new Date()
    });

    document.getElementById("output").textContent = 
      "Saved! Doc ID: " + docRef.id;
  } catch (error) {
    document.getElementById("output").textContent = 
      "Error saving: " + error;
  }
});

document.getElementById("readBtn").addEventListener("click", async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "testCollection"));
    let results = [];

    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });

    document.getElementById("output").textContent = 
      JSON.stringify(results, null, 2);
  } catch (error) {
    document.getElementById("output").textContent = 
      "Error reading: " + error;
  }
});
