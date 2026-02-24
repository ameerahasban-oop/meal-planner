const { ipcRenderer } = require("electron"); //import ipcRenderer from Electron

//get reference to HTML elements from index.html
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const mealResultsDiv = document.getElementById("mealResults");
const mealDetailsDiv = document.getElementById("mealDetails");

// button to open second window
const openPlannerBtn = document.getElementById("openPlannerBtn");
openPlannerBtn.onclick = () => {
  ipcRenderer.send("open-planner-window");
};

let currentMeals = [];
let currentMeal = null; //stores currently selected meal

// user clicks search button
searchBtn.addEventListener("click", () => { //search keyword
  const keyword = searchInput.value.trim();
  if (!keyword) return alert("Please enter a meal name"); // appears when input empty
  
  // send request the TheMealDB
  fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${keyword}`)
    .then((r) => r.json()) // convert to JSON
    .then((data) => {
      currentMeals = data.meals || []; //stores meals returned from API
      renderMealList(currentMeals); //displays meals on page

      //shows first meal first
      if (currentMeals.length > 0) showMealDetails(0);
      else mealDetailsDiv.innerHTML = "<p>No meals found.</p>";
    })
    .catch(() => alert("Failed to fetch meals."));
});

function renderMealList(meals) {
  mealResultsDiv.innerHTML = ""; //clear previous result

  //if no meals found
  if (!meals || meals.length === 0) {
    mealResultsDiv.innerHTML = "<p>No meals found.</p>";
    return;
  }

  meals.forEach((meal, index) => { //loop through each meal
    //add meal card to the page
    mealResultsDiv.innerHTML += `
      <div class="mealCard">
        <div class="mealCardRow">
          <img class="thumb" src="${meal.strMealThumb}" alt="${meal.strMeal}">
          <div class="mealMeta">
            <div class="mealName">${meal.strMeal}</div>
            <div class="mealCat">${meal.strCategory}</div>
          </div>
        </div>

        <div class="mealActions">
          <button class="smallBtn" onclick="viewMeal(${index})">View</button>
          <button class="smallBtn" onclick="addMeal(${index})">Add</button>
        </div>
      </div>
    `;
  });
}

window.viewMeal = (index) => showMealDetails(index); //click view button
window.addMeal = (index) => addToPlan(currentMeals[index]); //add button

function showMealDetails(index) {
  currentMeal = currentMeals[index]; //get selected meal
  if (!currentMeal) return;

  let ingredientsHTML = "";
  for (let i = 1; i <= 20; i++) { // loop from ingredient1 to ingredient20
    const ing = currentMeal[`strIngredient${i}`];
    const meas = currentMeal[`strMeasure${i}`];
    //only display if ingredient is not empty
    if (ing && ing.trim() !== "") {
      ingredientsHTML += `<li>${ing}${meas && meas.trim() ? " - " + meas : ""}</li>`;
    }
  }

  //display full recipe details
  mealDetailsDiv.innerHTML = `
    <h2>${currentMeal.strMeal}</h2>
    <p><strong>Category:</strong> ${currentMeal.strCategory}</p>
    <img class="detailImg" src="${currentMeal.strMealThumb}" alt="${currentMeal.strMeal}">

    <h4>Ingredients</h4>
    <ul>${ingredientsHTML}</ul>

    <h4>Instructions</h4>
    <p class="instructions">${currentMeal.strInstructions}</p>

    <button id="addFromDetailsBtn">Add to My Meal Plan</button>
  `;

  //add event to button after it is created
  document.getElementById("addFromDetailsBtn").onclick = () => addToPlan(currentMeal);
}

async function addToPlan(meal) {
  if (!meal) return;

  //load current saved meals from JSON
  const plans = await ipcRenderer.invoke("load-meals");

  //create new meal object
  const newMeal = {
    name: meal.strMeal,
    category: meal.strCategory,
    vegetarian: false,
    calories: 0,
    note: ""
  };

  //check if meal already exist
  const exists = plans.some(m => m.name === newMeal.name && m.category === newMeal.category);
  if (exists) {
    alert("This meal is already in your plan.");
    return;
  }

  //add meal to array
  plans.push(newMeal);
  //save updated array back to JSON file
  ipcRenderer.send("save-meals", plans);

  alert("Meal added to your plan!");
}

//load featured meals 
window.addEventListener("DOMContentLoaded", () => {
  loadFeaturedMeals();
});

async function loadFeaturedMeals() {
  mealResultsDiv.innerHTML = "<p>Loading featured meals...</p>";

  let featured = [];

  //fetch 6 random meals
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    const data = await res.json();
    if (data.meals) featured.push(data.meals[0]);
  }

  currentMeals = featured;
  renderMealList(currentMeals);
}