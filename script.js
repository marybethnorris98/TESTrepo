// -----------------------------
// FIREBASE
// -----------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC95ggTgS2Ew1MavuzEZrIvq6itTyxVdhA",
  authDomain: "recipeapp-248a1.firebaseapp.com",
  projectId: "recipeapp-248a1",
  storageBucket: "recipeapp-248a1.firebasestorage.app",
  messagingSenderId: "629558122940",
  appId: "1:629558122940:web:65dcca8ea0c572ccdf33b9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------
// STATE
// -----------------------------
let isAdmin = false;
const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];
let recipes = [];
let drafts = [];

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
const ingredientsList = document.getElementById("ingredientsList");
const instructionsList = document.getElementById("instructionsList");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const addInstructionBtn = document.getElementById("addInstructionBtn");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const creditsInput = document.getElementById("credits");
const tagsInput = document.getElementById("tags");
const hiddenInput = document.getElementById("hidden");
const draftInput = document.getElementById("draft");

const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const viewer = document.getElementById("recipeModal");
const closeBtn = document.getElementById("closeViewerBtn");
const modalEditBtn = document.getElementById("modalEditBtn");
const modalDeleteBtn = document.getElementById("modalDeleteBtn");
const hideBtn = document.getElementById("modalHideBtn");

// -----------------------------
// HELPER FUNCTIONS
// -----------------------------
function makeRowInput(placeholder) {
  const div = document.createElement("div");
  const input = document.createElement("input");
  input.placeholder = placeholder;
  const btn = document.createElement("button");
  btn.textContent = "✖";
  btn.type = "button";
  btn.addEventListener("click", ()=>div.remove());
  div.append(input,btn);
  return div;
}

function clearAddModal() {
  newTitle.value=""; newCategory.value=CATEGORIES[0]; newImage.value="";
  newDesc.value=""; creditsInput.value=""; tagsInput.value="";
  hiddenInput.checked=false; draftInput.checked=false;
  ingredientsList.innerHTML=""; instructionsList.innerHTML="";
}

function renderCategorySelects() {
  [categoryFilter,newCategory].forEach(sel=>{
    if(!sel) return;
    sel.innerHTML="";
    if(sel===categoryFilter){ const allOpt = document.createElement("option"); allOpt.value="all"; allOpt.textContent="All"; sel.appendChild(allOpt);}
    CATEGORIES.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o);});
  });
}

// -----------------------------
// FIRESTORE FUNCTIONS
// -----------------------------
async function loadRecipes() {
  const snapshot = await getDocs(collection(db,"recipes"));
  recipes = snapshot.docs.map(d=>({id:d.id,...d.data()}));
  renderRecipes();
}

async function saveRecipe(recipe){
  if(recipe.id){
    await updateDoc(doc(db,"recipes",recipe.id),recipe);
  }else{
    await addDoc(collection(db,"recipes"),recipe);
  }
  await loadRecipes();
}

async function deleteRecipe(id){
  await deleteDoc(doc(db,"recipes",id));
  await loadRecipes();
}

// -----------------------------
// RENDER
// -----------------------------
function renderRecipes(){
  const term=(searchInput.value||"").toLowerCase();
  const cat=categoryFilter.value||"all";
  recipeGrid.innerHTML="";
  recipes.filter(r=>{
    if(!isAdmin && r.hidden) return false;
    return (r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)) &&
           (cat==="all"||r.category===cat);
  }).forEach(r=>{
    const card=document.createElement("div"); card.className="card";
    const img=document.createElement("img"); img.src=r.image||""; img.alt=r.title||"";
    const c=document.createElement("div"); c.className="card-content";
    const t=document.createElement("div"); t.className="card-title"; t.textContent=r.title;
    const ca=document.createElement("div"); ca.className="card-category"; ca.textContent=r.category;
    const d=document.createElement("div"); d.className="card-desc"; d.textContent=r.description;
    c.append(t,ca,d); card.append(img,c);
    card.addEventListener("click",()=>openRecipeModal(r));
    recipeGrid.appendChild(card);
  });
}

// -----------------------------
// OPEN MODAL
// -----------------------------
function openRecipeModal(r){
  if(!r) return;
  document.getElementById("modalImage").src=r.image||"";
  document.getElementById("modalTitle").textContent=r.title||"";
  document.getElementById("modalCategory").textContent=r.category||"";
  document.getElementById("modalDescription").textContent=r.description||"";
  const ing=document.getElementById("modalIngredients"); ing.innerHTML="";
  (r.ingredients||[]).forEach(i=>{const li=document.createElement("li"); li.textContent=i; ing.appendChild(li);});
  const ins=document.getElementById("modalInstructions"); ins.innerHTML="";
  (r.instructions||[]).forEach(i=>{const li=document.createElement("li"); li.textContent=i; ins.appendChild(li);});
  modalEditBtn.onclick=()=>{ populateAddModalFromRecipe(r); addRecipeModal.classList.remove("hidden"); viewer.style.display="none"; };
  modalDeleteBtn.onclick=()=>{ if(confirm(`Delete ${r.title}?`)) deleteRecipe(r.id); viewer.style.display="none"; };
  hideBtn.onclick=()=>{ r.hidden=!r.hidden; saveRecipe(r); viewer.style.display="none"; };
  viewer.style.display="flex";
}

// -----------------------------
// ADD / EDIT MODAL HELPERS
// -----------------------------
function populateAddModalFromRecipe(r){
  clearAddModal();
  newTitle.value=r.title||"";
  newCategory.value=r.category||CATEGORIES[0];
  newImage.value=r.image||"";
  newDesc.value=r.description||"";
  creditsInput.value=r.credits||"";
  tagsInput.value=(r.tags||[]).join(",");
  hiddenInput.checked=r.hidden||false;
  draftInput.checked=false;
  (r.ingredients||[]).forEach(i=>ingredientsList.appendChild(makeRowInput(i)));
  (r.instructions||[]).forEach(i=>instructionsList.appendChild(makeRowInput(i)));
}

// -----------------------------
// SAVE BUTTONS
// -----------------------------
saveRecipeBtn.onclick=async()=>{
  const newR = {
    title:newTitle.value.trim(),
    category:newCategory.value,
    image:newImage.value.trim(),
    description:newDesc.value.trim(),
    credits:creditsInput.value.trim(),
    tags: tagsInput.value.split(",").map(s=>s.trim()).filter(Boolean),
    hidden:hiddenInput.checked,
    ingredients:[...ingredientsList.querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean),
    instructions:[...instructionsList.querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean)
  };
  await saveRecipe(newR);
  clearAddModal();
  addRecipeModal.classList.add("hidden");
};

saveDraftBtn.onclick=()=>{
  const draft = {
    id:`draft_${Date.now()}`,
    title:newTitle.value,
    category:newCategory.value,
    image:newImage.value,
    description:newDesc.value,
    credits:creditsInput.value,
    tags: tagsInput.value.split(",").map(s=>s.trim()).filter(Boolean),
    hidden:hiddenInput.checked,
    ingredients:[...ingredientsList.querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean),
    instructions:[...instructionsList.querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean)
  };
  drafts.push(draft);
  alert("Draft saved!");
  clearAddModal();
  addRecipeModal.classList.add("hidden");
};

// -----------------------------
// ADD ROWS
// -----------------------------
addIngredientBtn.onclick=()=>ingredientsList.appendChild(makeRowInput("Ingredient"));
addInstructionBtn.onclick=()=>instructionsList.appendChild(makeRowInput("Step"));

// -----------------------------
// SEARCH / FILTER
// -----------------------------
searchInput.oninput=renderRecipes;
categoryFilter.onchange=renderRecipes;

// -----------------------------
// CLOSE MODAL
// -----------------------------
closeBtn.onclick=()=>viewer.style.display="none";

// -----------------------------
// ADMIN LOGIN
// -----------------------------
loginBtn.onclick=()=>{
  const pwd=document.getElementById("adminPassword").value;
  if(pwd==="pinkrecipes"){ isAdmin=true; loginModal.classList.add("hidden"); renderRecipes(); alert("Admin unlocked");}
  else loginError.style.display="block";
};

// -----------------------------
// INIT
// -----------------------------
renderCategorySelects();
loadRecipes();
