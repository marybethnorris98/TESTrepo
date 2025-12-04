console.log("FULL admin + viewer script loaded");
const customAlert = (message) => {
    console.log(`[USER ALERT]: ${message}`);
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
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
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

async function openRecipeIndexModal() {
    if (!db || !recipeIndexModal || !recipeIndexList) return;

    recipeIndexList.innerHTML = `<p style="font-family: Poppins, sans-serif; text-align: center; color: #777;">Loading recipes...</p>`;
    
    const recipesCol = collection(db, "recipes");
    const q = query(recipesCol, orderBy("category"), orderBy("title")); 
    
    try {
        const snapshot = await getDocs(q);
        const allRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        recipeIndexList.innerHTML = "";

        if (allRecipes.length === 0) {
            recipeIndexList.innerHTML = `<p style="font-family: Poppins, sans-serif; text-align: center; color: #777;">No recipes found.</p>`;
            recipeIndexModal.classList.remove("hidden");
            document.body.classList.add('modal-open');
            return;
        }
        
        const categorizedRecipes = allRecipes.reduce((acc, recipe) => {
            if (!isAdmin && recipe.hidden) return acc;
            const category = recipe.category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(recipe);
            return acc;
        }, {});

        const sortedCategories = Object.keys(categorizedRecipes).sort();

        sortedCategories.forEach(category => {
            const header = document.createElement("h3");
            header.textContent = category.toUpperCase();
            header.style.cssText = `
                font-family: Poppins, sans-serif;
                font-size: 1.1em;
                font-weight: 700;
                color: ${primaryPink};
                margin-top: 20px;
                margin-bottom: 5px;
                border-bottom: 2px solid ${lightPinkBorder};
                padding-bottom: 4px;
                width: 100%; 
            `;
            recipeIndexList.appendChild(header);
            const categoryContainer = document.createElement("div");
            categoryContainer.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr; /* Two equal columns */
                gap: 5px 15px; /* Vertical and horizontal gap */
                width: 100%;
                margin-bottom: 15px;
            `;
            categorizedRecipes[category].forEach(recipe => {
                const item = document.createElement("a");
                item.textContent = recipe.title || "(Untitled)";
                item.style.cssText = `
                    font-family: Poppins, sans-serif; 
                    font-weight: 400; 
                    font-size: 0.85em; /* Smaller font size */
                    color: #555; 
                    text-decoration: none;
                    padding: 4px 0px; 
                    display: block;
                    white-space: nowrap; /* Prevent wrapping */
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                `;
                item.onmouseover = () => item.style.textDecoration = "underline";
                item.onmouseout = () => item.style.textDecoration = "none";
               
                item.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    recipeIndexModal.classList.add("hidden"); 
                    openRecipeModal(recipe); 
                };

                categoryContainer.appendChild(item);
            });
            
            recipeIndexList.appendChild(categoryContainer);
        });
        
        recipeIndexModal.classList.remove("hidden");
        document.body.classList.add('modal-open');
        
    } catch (e) {
        console.error("Error loading recipe index:", e);
        customAlert("Failed to load recipe index. Check console for details.");
        recipeIndexList.innerHTML = `<p style="font-family: Poppins, sans-serif; text-align: center; color: red;">Failed to load index.</p>`;
    }
}

const firebaseConfig = {
  apiKey: "AIzaSyC95ggTgS2Ew1MavuzEZrIvq6itTyxVdhA",
  authDomain: "recipeapp-248a1.firebaseapp.com",
  projectId: "recipeapp-248a1",
  storageBucket: "recipeapp-248a1.firebasestorage.app",
  messagingSenderId: "629558122940",
  appId: "1:629558122940:web:65dcca8ea0c572ccdf33b9"
};

let app, db, auth, storage;

if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    signInAnonymously(auth).catch(error => {
        console.error("Anonymous sign-in failed:", error);
    });
} else {
    console.error("Firebase config is missing. Data persistence will not work.");
}
let isAdmin = localStorage.getItem("admin") === "true";

const primaryPink = "#ff3ebf";
const mauvePink = "#a00064"; 
const lightPinkBorder = "#ffe7f5"; 
const lightPink = "#ffd1e8"; 
const lighterPinkBg = "#fff9fc"; 
const draftsTitleColor = "#a00064";

const baseDraftButtonStyle = {
    fontFamily: "Poppins, sans-serif",
    fontSize: "14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    minWidth: "75px",
    boxSizing: "border-box",
    flexShrink: 0,
    transition: "background 0.15s ease",
    padding: "6px 10px",
};

const defaultRecipes = [
    {
        title: "Blueberry Pancakes",
        category: "Breakfast",
        image: "images/pancakes.jpg",
        description: "Fluffy homemade pancakes loaded with fresh blueberries.",
        ingredients: ["1 cup flour", "1 cup blueberries", "1 egg", "1 tbsp sugar", "1 cup milk"],
        instructions: ["Mix dry ingredients.", "Add egg & milk.", "Fold in blueberries.", "Cook on skillet until golden."],
        hidden: false
    },
];

const CATEGORIES = ["Breakfast", "Meals", "Snacks", "Sides", "Dessert", "Drinks"];

let recipes = [];
let drafts = [];
let editingDraftId = null; 
let editingRecipeId = null;
let recipeIndexModal, recipeIndexList;

let recipeGrid, searchInput, categoryFilter;
let addRecipeModal, newTitle, newCategory, newImage, newDesc, ingredientsList, instructionsList, saveRecipeBtn, addIngredientBtn, addInstructionBtn, saveDraftBtn;
let newCredits;
let viewer, closeBtn;
let loginModal, loginBtn, loginError;
let draftsModal, draftsList, closeDraftsBtn;

let imageUpload, newImageURL, imageUploadLabel, previewImageTag;

document.addEventListener("DOMContentLoaded", async () => {
    recipeGrid = document.getElementById("recipeGrid");
    searchInput = document.getElementById("searchInput");
    categoryFilter = document.getElementById("categoryFilter");

    const newCreditsInfoIcon = document.getElementById("newCreditsInfoIcon");
    const newCreditsTooltip = document.getElementById("newCreditsTooltip");

    if (newCreditsInfoIcon && newCreditsTooltip) {
        newCreditsInfoIcon.addEventListener("click", e => {
            e.stopPropagation(); 
            newCreditsTooltip.classList.toggle("visible-tooltip");
            newCreditsTooltip.classList.toggle("hidden-tooltip");
        });

        document.addEventListener("click", () => {
            newCreditsTooltip.classList.remove("visible-tooltip");
            newCreditsTooltip.classList.add("hidden-tooltip");
        });
    }
    
    addRecipeModal = document.getElementById("addRecipeModal");
    newTitle = document.getElementById("newTitle");
    newCategory = document.getElementById("newCategory");
    imageUpload = document.getElementById("imageUpload");
    newImageURL = document.getElementById("newImageURL"); 
    imageUploadLabel = document.getElementById("imageUploadLabel");
    previewImageTag = document.getElementById("previewImageTag");
    newDesc = document.getElementById("newDesc");
    newCredits = document.getElementById("newCredits");
    ingredientsList = document.getElementById("ingredientsList");
    instructionsList = document.getElementById("instructionsList");
    saveRecipeBtn = document.getElementById("saveRecipeBtn");
    addIngredientBtn = document.getElementById("addIngredientBtn");
    addInstructionBtn = document.getElementById("addInstructionBtn");
    saveDraftBtn = document.getElementById("saveDraftBtn");

    viewer = document.getElementById("recipeModal");
    closeBtn = document.getElementById("closeViewerBtn");

    loginModal = document.getElementById("loginModal");
    loginBtn = document.getElementById("loginBtn");
    loginError = document.getElementById("loginError");

    imageUpload?.addEventListener("change", () => {
        const file = imageUpload.files[0];
        if (file) {
            
            const reader = new FileReader();
            reader.onload = e => {
                previewImageTag.src = e.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);

            imageUploadLabel.textContent = file.name;

        } else {
            document.getElementById('imagePreview').style.display = 'none';
            imageUploadLabel.textContent = 'Click to Select Image';
        }
    });

    draftsModal = document.getElementById("draftsModal");
    if (!draftsModal) {
        draftsModal = document.createElement("div");
        draftsModal.id = "draftsModal";
        draftsModal.className = "modal hidden";
        draftsModal.style.zIndex = 1300;
        draftsModal.innerHTML = `
            <div class="modal-content" style="max-width:520px; position:relative; padding-top: 30px;">
                <h2 style="margin-top:0; font-family: Poppins, sans-serif;">My Drafts</h2>
                <div id="draftsList" style="display:flex; flex-direction:column; gap:10px; margin-top:12px;"></div>
            </div>
        `;
        document.body.appendChild(draftsModal);
    }
    draftsList = document.getElementById("draftsList");
    recipeIndexModal = document.getElementById("recipeIndexModal");
    if (!recipeIndexModal) {
        recipeIndexModal = document.createElement("div");
        recipeIndexModal.id = "recipeIndexModal";
        recipeIndexModal.className = "modal hidden";
        recipeIndexModal.style.zIndex = 1300; 
        recipeIndexModal.innerHTML = `
            <div class="modal-content" style="max-width:520px; position:relative; padding-top: 30px;">
                <h2 style="margin-top:0; font-family: Poppins, sans-serif;">📖 Full Recipe Index</h2>
                <div id="recipeIndexList" style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
                    <p style="text-align:center;">Loading recipes...</p>
                </div>
                <button class="modal-close-x" id="closeIndexBtn" style="position: absolute; right: 18px; top: 14px; background: transparent; border: none; font-size: 22px; cursor: pointer; color: ${primaryPink};">✖</button>
            </div>
        `;
        document.body.appendChild(recipeIndexModal);
    }
    recipeIndexList = document.getElementById("recipeIndexList");
    const closeIndexBtn = document.getElementById("closeIndexBtn");
    if (closeIndexBtn) {
        closeIndexBtn.addEventListener("click", () => {
            recipeIndexModal.classList.add("hidden");
            document.body.classList.remove('modal-open'); 
        });
    }

    recipeIndexModal?.addEventListener("click", e => {
        if (e.target === recipeIndexModal) {
            recipeIndexModal.classList.add("hidden");
            document.body.classList.remove('modal-open');
        }
    });
    if (recipeGrid) {
        const buttonWrapper = document.createElement("div");
        
        buttonWrapper.style.cssText = `
            width: 100%;
            max-width: 90%; 
            margin: 20px auto; 
            box-sizing: border-box; 
            display: flex;
            justify-content: center;
        `;
        
    const controlsContainer = document.querySelector(".controls");

    if (controlsContainer) {
        controlsContainer.style.display = "flex";
        controlsContainer.style.alignItems = "center";
        controlsContainer.style.gap = "10px";
        controlsContainer.style.flexWrap = "wrap";

        const indexBtn = document.createElement("button");
        indexBtn.textContent = "See All";
        indexBtn.style.fontFamily = "Poppins, sans-serif";
        indexBtn.style.fontSize = "14px";
        indexBtn.style.padding = "8px 12px";
        indexBtn.style.borderRadius = "8px";
        indexBtn.style.cursor = "pointer";
        indexBtn.style.fontWeight = "600";
        indexBtn.style.background = primaryPink;
        indexBtn.style.color = "white";
        indexBtn.style.border = "none";
        indexBtn.style.whiteSpace = "nowrap";

        indexBtn.onmouseenter = () => indexBtn.style.background = mauvePink;
        indexBtn.onmouseleave = () => indexBtn.style.background = primaryPink;

        indexBtn.onclick = openRecipeIndexModal;

        controlsContainer.insertBefore(indexBtn, categoryFilter.nextSibling);
    }
        const inputStyle = {
            fontFamily: "Poppins, sans-serif",
            borderRadius: "8px",
            padding: "10px",
            border: "1px solid #ccc",
            width: "calc(100% - 22px)",
            boxSizing: "border-box",
        };

        const selectStyle = {
            fontFamily: "Poppins, sans-serif",
            borderRadius: "8px",
            padding: "10px",
            border: "1px solid #ccc",
            width: "100%", 
            boxSizing: "border-box",
            appearance: "none", 
        };
        
        if (newTitle) Object.assign(newTitle.style, inputStyle);
        if (newCategory) Object.assign(newCategory.style, inputStyle);
        if (newDesc) Object.assign(newDesc.style, inputStyle, { height: "100px" });

    async function uploadImage() {
        const file = imageUpload.files[0];
        if (!file) {
            return newImageURL.value || null;
        }

        try {
            imageUploadLabel.textContent = "Uploading... please wait.";
            
            const recipeTitle = newTitle.value.trim() || `unnamed-recipe-${Date.now()}`;
            const storageRef = ref(storage, `recipe_images/${recipeTitle}-${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            
            imageUploadLabel.textContent = "✅ Upload successful!";
            return url;

        } catch (e) {
            console.error("Error uploading image:", e);
            imageUploadLabel.textContent = "❌ Upload Failed!";
            return null; 
        }
    }
        
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

        async function loadRecipes() {
            if (!db) return;
            const recipesCol = collection(db, "recipes");
            const q = query(recipesCol, orderBy("title"));
            try {
                const snapshot = await getDocs(q);
                recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderRecipes();
            } catch (e) {
                console.error("Error loading recipes:", e);
            }
        }

        async function loadDrafts() {
            if (!db) return;
            const draftsCol = collection(db, "drafts");
            const q = query(draftsCol, orderBy("timestamp", "desc"));
            try {
                const snapshot = await getDocs(q);
                drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.error("Error loading drafts:", e);
            }
        }
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

                const tooltipContainer = document.createElement("div");
                tooltipContainer.className = "tooltip-container"; 

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
                
                tooltipContainer.appendChild(infoIcon);
                tooltipContainer.appendChild(tooltip);
                
                card.appendChild(tooltipContainer); 
                
                card.addEventListener("click", () => openRecipeModal(recipe));

                recipeGrid.appendChild(card);
            });
        }
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
                modalIngredients.classList.remove("scrollable-list");
                (recipe.ingredients || []).forEach(i => {
                    const li = document.createElement("li");
                    li.textContent = i;
                    modalIngredients.appendChild(li);
                });
            }

            if (modalInstructions) {
                modalInstructions.innerHTML = "";
                modalInstructions.classList.remove("scrollable-list");
                (recipe.instructions || []).forEach(s => {
                    const li = document.createElement("li");
                    li.textContent = s;
                    modalInstructions.appendChild(li);
                });
            }

            if (isAdmin) {
                modalEditBtn.style.display = "inline-block";
                Object.assign(modalEditBtn.style, {
        backgroundColor: "#ff3ebf", 
        color: "white",
        border: "none",
    });
                modalDeleteBtn.style.display = "inline-block";
                Object.assign(modalDeleteBtn.style, {
        backgroundColor: "#ff3ebf", 
        color: "white",
        border: "none",
        });
                    
                modalEditBtn.onclick = () => {
                    editingRecipeId = recipe.id;
                    editingDraftId = null;
                    populateAddModalFromRecipeOrDraft(recipe);
                    ensureAddModalControls();
                    addRecipeModal.classList.remove("hidden");
                    viewer.style.display = "none";
                };

                modalDeleteBtn.onclick = async () => {
                    if (!confirm(`Delete "${recipe.title}"?`)) return;
                    if (db) {
                        await deleteDoc(doc(db, "recipes", recipe.id));
                        await loadRecipes();
                    } else {
                        console.error("Database not initialized.");
                    }
                    viewer.style.display = "none";
                };

                hideBtn.style.display = "inline-block";
                hideBtn.textContent = recipe.hidden ? "Unhide" : "Hide";
                Object.assign(hideBtn.style, {
        backgroundColor: "white", 
        color: "#ff3ebf",
        border: "2px solid #ff3ebf", 
    });
                hideBtn.onclick = async e => {
                    e.stopPropagation();
                    if (db) {
                        await updateDoc(doc(db, "recipes", recipe.id), { hidden: !recipe.hidden });
                        await loadRecipes();
                    } else {
                        console.error("Database not initialized.");
                    }
                    viewer.style.display = "none";
                    document.body.classList.remove('modal-open');
                };
            } else {
                modalEditBtn.style.display = "none";
                modalDeleteBtn.style.display = "none";
                hideBtn.style.display = "none";
            }

            viewer.style.display = "flex";
            document.body.classList.add('modal-open');
        }
        
        if (closeBtn) {
            closeBtn.addEventListener("click", () => { 
                viewer.style.display = "none"; 
                document.body.classList.remove('modal-open');
            });
            
            viewer.addEventListener("click", e => { 
                if (e.target === viewer) {
                    viewer.style.display = "none";
                    document.body.classList.remove('modal-open');
                }
            });
        }
        if (addRecipeModal) {
            addRecipeModal.addEventListener("click", e => {
                if (e.target === addRecipeModal) {
                    if (confirm("Discard unsaved changes and close?")) {
                        clearAddModal();
                        addRecipeModal.classList.add("hidden");
                        document.body.classList.remove('modal-open');
                    }
                }
            });
        }
        searchInput?.addEventListener("input", renderRecipes);
        categoryFilter?.addEventListener("change", renderRecipes);

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
        function ensureAddModalControls() {
            if (!addRecipeModal) return;
            const modalContent = addRecipeModal.querySelector(".modal-content");
            if (!modalContent) return;
        
            let currentSaveBtn = modalContent.querySelector("#saveRecipeBtn");
            if (currentSaveBtn) {
                // Clone and replace save button to ensure listener is clean
                const newSaveBtn = currentSaveBtn.cloneNode(true);
                currentSaveBtn.parentNode.replaceChild(newSaveBtn, currentSaveBtn);
                saveRecipeBtn = newSaveBtn;
                saveRecipeBtn.addEventListener("click", saveRecipe);
            }
          
            let saveDraftBtnElement = modalContent.querySelector("#saveDraftBtn");
            if (saveDraftBtnElement) {
                // Clone and replace draft button to ensure listener is clean
                const newDraftBtn = saveDraftBtnElement.cloneNode(true);
                saveDraftBtnElement.parentNode.replaceChild(newDraftBtn, saveDraftBtnElement);
                saveDraftBtn = newDraftBtn;
                saveDraftBtn.addEventListener("click", saveDraft);
                Object.assign(saveDraftBtn.style, {
                    background: primaryPink,
                    color: "white",
                    border: "none",
                    padding: "14px 18px",
                    fontSize: "18px",
                    fontFamily: "Poppins, San-Serif",
                    borderRadius: "12px",
                    width: "100%",
                    cursor: "pointer",
                    marginBottom: "15px",
                    marginTop: "15px",
                    fontWeight: "bold",
                });
            }


            if (!modalContent.querySelector(".add-modal-close-x")) {
                const x = document.createElement("button");
                x.className = "add-modal-close-x"; 
                x.innerText = "✖";
                x.style.cssText = `
                    position: absolute; 
                    right: 18px; 
                    top: 14px; 
                    background: transparent; 
                    border: none; 
                    font-size: 22px; 
                    cursor: pointer; 
                    color: ${primaryPink};
                `;
                x.addEventListener("click", () => {
                    if (confirm("Discard changes and close?")) { 
                        clearAddModal();
                        addRecipeModal.classList.add("hidden");
                        document.body.classList.remove('modal-open');
                    }
                }); 
                
                modalContent.style.position = modalContent.style.position || "relative";
                modalContent.appendChild(x);
            }
        }

        function injectAdminUI() {
            if (document.getElementById("adminControlsContainer")) return;

            const container = document.createElement("div");
            container.id = "adminControlsContainer";
            container.style = "position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:1200;";

            const addBtn = document.createElement("button");
            addBtn.textContent = "+ Add Recipe";
            Object.assign(addBtn.style, { background: primaryPink, color: "white", padding: "12px 16px", borderRadius: "14px", border: "none", fontSize: "16px", cursor: "pointer", fontFamily: "Poppins, sans-serif", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" });

            addBtn.onclick = () => { 
                editingDraftId = null; 
                editingRecipeId = null; 
                ensureAddModalControls(); 
                clearAddModal(); 
                addRecipeModal.classList.remove("hidden");
                document.body.classList.add('modal-open');
            };

            const draftsBtn = document.createElement("button");
            draftsBtn.textContent = "Drafts";
            Object.assign(draftsBtn.style, { background: primaryPink, color: "white", padding: "12px 16px", borderRadius: "14px", border: "none", fontSize: "16px", cursor: "pointer", fontFamily: "Poppins, sans-serif", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" });
            draftsBtn.onclick = openDraftsModal;

            container.appendChild(addBtn);
            container.appendChild(draftsBtn);
            document.body.appendChild(container);
            addLogoutButton(container);
        }

        function addLogoutButton(containerElement) {
            if (!containerElement) return;
            if (containerElement.querySelector("#logoutBtn")) return;

            const logoutBtn = document.createElement("button");
            logoutBtn.id = "logoutBtn";
            logoutBtn.textContent = "Logout";
            Object.assign(logoutBtn.style, { background: primaryPink, color: "white", padding: "12px 16px", borderRadius: "14px", border: "none", fontSize: "16px", cursor: "pointer", fontFamily: "Poppins, sans-serif", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" });
            logoutBtn.onclick = () => {
                isAdmin = false;
                localStorage.removeItem("admin");
                window.location.href = window.location.href.split('#')[0]; 
            };

            containerElement.appendChild(logoutBtn);
        }
        function makeRowInput(placeholder = "") {
            const row = document.createElement("div");
            row.className = "admin-row";
            row.style.display = "flex"; 
            row.style.alignItems = "center";
            const input = document.createElement("input");
            input.type = "text"; input.placeholder = placeholder; input.value = "";

            Object.assign(input.style, {
                fontFamily: "Poppins, sans-serif",
                borderRadius: "8px",
                padding: "8px 10px",
                border: "1px solid #ccc",
                flexGrow: 1,
                margin: "5px 0",
            });

            const removeBtn = document.createElement("button");
            removeBtn.type = "button"; removeBtn.textContent = "✖";
            Object.assign(removeBtn.style, {
                marginLeft: "8px",
                background: "transparent",
                border: "none",
                color: primaryPink,
                fontWeight: "700",
                fontSize: "18px",
                cursor: "pointer",
                fontFamily: "Poppins, sans-serif",
            });
            removeBtn.onclick = () => row.remove();
            row.appendChild(input); row.appendChild(removeBtn);
            return row;
        }

        function clearAddModal() {
            newTitle.value = ""; 
            newCategory.value = CATEGORIES[0]; 
            newDesc.value = "";
            newCredits.value = "";
            if (imageUpload) imageUpload.value = "";
            if (newImageURL) newImageURL.value = "";
            if (previewImageTag) previewImageTag.src = "";
            
            const previewDiv = document.getElementById('imagePreview');
            if (previewDiv) previewDiv.style.display = 'none';
            if (imageUploadLabel) imageUploadLabel.textContent = 'Click to Select Image';
        
            ingredientsList.innerHTML = ""; 
            instructionsList.innerHTML = "";
            editingDraftId = null; 
            editingRecipeId = null;
        }

        function populateAddModalFromRecipeOrDraft(d) {
            clearAddModal();
            if (!d) return;

            newTitle.value = d.title || ""; 
            newCategory.value = d.category || CATEGORIES[0]; 
            newDesc.value = d.description || "";
            newCredits.value = d.credits || "";

            if (d.image && previewImageTag && newImageURL) {
                newImageURL.value = d.image; 
                previewImageTag.src = d.image;
                document.getElementById('imagePreview').style.display = 'block';
                imageUploadLabel.textContent = 'Image loaded (Click to replace)';
            }
            
            (d.ingredients || []).forEach(i => { const r = makeRowInput("Ingredient"); r.querySelector("input").value = i; ingredientsList.appendChild(r); });
            (d.instructions || []).forEach(s => { const r = makeRowInput("Step"); r.querySelector("input").value = s; instructionsList.appendChild(r); });
          
            if (d.timestamp && d.id) {
                const isDraft = drafts.some(draft => draft.id === d.id);

                if(isDraft) {
                    editingDraftId = d.id;
                    editingRecipeId = d.forRecipeId || null;
                } else {
                    editingDraftId = null;
                    editingRecipeId = d.id;
                }
            } else {
                editingDraftId = null;
                editingRecipeId = d.id;
            }
        }

        addIngredientBtn?.addEventListener("click", () => ingredientsList.appendChild(makeRowInput("Ingredient")));
        addInstructionBtn?.addEventListener("click", () => instructionsList.appendChild(makeRowInput("Step")));
        
    async function saveDraft() {
        if (!db) return customAlert("Cannot save draft: Database not initialized.");

        const finalImageURL = await uploadImage();

        const title = newTitle.value.trim() || `Draft: ${new Date().toLocaleTimeString()}`;
        const category = newCategory.value || CATEGORIES[0];
        const description = newDesc.value.trim();
        const credits = newCredits.value.trim();

        const ingredients = [...ingredientsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
        const instructions = [...instructionsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);

        const data = {
            title,
            category,
            image: finalImageURL,
            description,
            credits,
            ingredients,
            instructions,
            timestamp: serverTimestamp(),
            forRecipeId: editingRecipeId || null,
        };

        try {
            if (editingDraftId) {
                const docRef = doc(db, "drafts", editingDraftId);
                await updateDoc(docRef, data);
                console.log(`Draft "${title}" updated! ID: ${editingDraftId}`);
            } else {
                const docRef = doc(collection(db, "drafts"));
                await setDoc(docRef, data);
                editingDraftId = docRef.id; 
                console.log(`Draft "${title}" saved! New ID: ${editingDraftId}`);
            }

            await loadDrafts();
            const feedback = document.createElement("p");
            feedback.textContent = `✅ Draft "${title}" saved successfully!`;
            feedback.style.cssText = "color: #a00064; font-weight: bold; margin-bottom: 10px; text-align: center; font-family: Poppins, sans-serif; background: #fff9fc; padding: 10px; border-radius: 8px;";
            const saveDraftBtnElement = document.getElementById("saveDraftBtn");
            if (saveDraftBtnElement) {
                saveDraftBtnElement.parentNode.insertBefore(feedback, saveDraftBtnElement);
                setTimeout(() => feedback.remove(), 3000);
            }
            clearAddModal();
            addRecipeModal.classList.add("hidden");
            document.body.classList.remove('modal-open');
            
            
        } catch (e) {
            console.error("Error saving draft:", e);
            customAlert("Failed to save draft. See console for details.");
        }
    } 
    async function saveRecipe() {
        if (!db) return customAlert("Cannot save recipe: Database not initialized.");
        const finalImageURL = await uploadImage();

        const title = newTitle.value.trim();
        if (!title) return customAlert("Recipe title is required.");

        const category = newCategory.value || CATEGORIES[0];
        const description = newDesc.value.trim();
        const credits = newCredits.value.trim();

        const ingredients = [...ingredientsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
        const instructions = [...instructionsList.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);

        const recipeData = {
            title,
            category,
            image: finalImageURL,
            description,
            credits,
            ingredients,
            instructions,
            hidden: false, 
        };

        try {
            let savedRecipeId;

            if (editingRecipeId) {
                const docRef = doc(db, "recipes", editingRecipeId);
                await updateDoc(docRef, recipeData);
                savedRecipeId = editingRecipeId;
                console.log(`Recipe "${title}" updated! ID: ${savedRecipeId}`);

            } else {
                const docRef = doc(collection(db, "recipes"));
                await setDoc(docRef, recipeData);
                savedRecipeId = docRef.id;
                console.log(`Recipe "${title}" saved! New ID: ${savedRecipeId}`);
            }
            if (editingDraftId) {
                await deleteDoc(doc(db, "drafts", editingDraftId));
                console.log(`Associated draft (${editingDraftId}) deleted successfully.`);
            }
            
            await loadRecipes();
            customAlert(`Recipe "${title}" saved successfully!`);
            clearAddModal();
            addRecipeModal.classList.add("hidden");
            document.body.classList.remove('modal-open'); 

        } catch (e) {
            console.error("Error saving recipe:", e);
            customAlert("Failed to save recipe. See console for details.");
        }
    }
    async function openDraftsModal() {
        if (!draftsModal || !draftsList) return;

        await loadDrafts();
        draftsList.innerHTML = "";
        
        const modalContent = draftsModal.querySelector(".modal-content");
        if (modalContent && !modalContent.querySelector(".draft-modal-close-x")) {
            const x = document.createElement("button");
            x.className = "draft-modal-close-x";
            x.type = "button";
            x.innerText = "✖";
            x.title = "Close Drafts";

            Object.assign(x.style, {
                position: "absolute",
                right: "18px",
                top: "14px",
                background: "transparent",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                color: primaryPink,
                zIndex: "100",
            });

            x.addEventListener("click", () => {
                draftsModal.classList.add("hidden");
                document.body.classList.remove('modal-open');
            });
            modalContent.appendChild(x);
        }
        
        if (drafts.length === 0) {
            draftsList.innerHTML = `<p style="font-family: Poppins, sans-serif; text-align: center; color: #777;">You have no saved drafts.</p>`;
        } else {
            drafts.forEach(draft => {
                const draftItem = document.createElement("div");
                draftItem.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:10px 15px; border-radius:8px; border: 1px solid ${lightPinkBorder}; background:${lighterPinkBg};`;

                const title = document.createElement("span");
                title.textContent = draft.title || "(Untitled Draft)";
                title.style.cssText = `font-family: Poppins, sans-serif; font-weight: 600; color: ${draftsTitleColor}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;`;

                const buttonGroup = document.createElement("div");
                buttonGroup.style.cssText = `display:flex; gap:8px; flex-shrink:0;`;

                const loadBtn = document.createElement("button");
                loadBtn.textContent = "Load";
                Object.assign(loadBtn.style, baseDraftButtonStyle, {
                    background: mauvePink,
                    color: "white",
                    border: "none",
                });
                loadBtn.onmouseenter = () => loadBtn.style.background = primaryPink;
                loadBtn.onmouseleave = () => loadBtn.style.background = mauvePink;
                loadBtn.onclick = () => {
                    editingDraftId = draft.id;
                    editingRecipeId = draft.forRecipeId || null;
                    populateAddModalFromRecipeOrDraft(draft);
                    ensureAddModalControls();
                    draftsModal.classList.add("hidden");
                    addRecipeModal.classList.remove("hidden");
                };

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                Object.assign(deleteBtn.style, baseDraftButtonStyle, {
                    background: "white",
                    color: mauvePink,
                    border: `1px solid ${lightPink}`,
                });
                deleteBtn.onmouseenter = () => deleteBtn.style.background = lightPinkBorder;
                deleteBtn.onmouseleave = () => deleteBtn.style.background = "white";
                deleteBtn.onclick = async () => {
                    if (!confirm(`Delete draft: "${draft.title}"?`)) return;
                    try {
                        await deleteDoc(doc(db, "drafts", draft.id));
                        await openDraftsModal(); 
                    } catch (e) {
                        console.error("Error deleting draft:", e);
                        customAlert("Failed to delete draft.");
                    }
                };

                buttonGroup.appendChild(loadBtn);
                buttonGroup.appendChild(deleteBtn);
                draftItem.appendChild(title);
                draftItem.appendChild(buttonGroup);
                draftsList.appendChild(draftItem);
            });
        }
        draftsModal.addEventListener("click", e => {
            if (e.target === draftsModal) {
                draftsModal.classList.add("hidden");
                document.body.classList.remove('modal-open'); 
            }
        }); 

        draftsModal.classList.remove("hidden");
    } 
            
    if (db) {
        await loadRecipes();
        await loadDrafts(); 
    }


    });
}
