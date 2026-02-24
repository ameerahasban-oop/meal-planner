const { ipcRenderer } = require("electron"); //import ipcRenderer to communicate with main process

const planTable = document.getElementById("planTable"); //table for displaying meals
const resultText = document.getElementById("result"); //area to display message

//buttons
const loadBtn = document.getElementById("loadBtn");
const filterVegBtn = document.getElementById("filterVegBtn");
const totalCalBtn = document.getElementById("totalCalBtn");
const suggestBtn = document.getElementById("suggestBtn");
const saveBtn = document.getElementById("saveEditBtn");

//edit input fields
const editName = document.getElementById("editName");
const editCalories = document.getElementById("editCalories");
const editVegetarian = document.getElementById("editVegetarian");
const editNote = document.getElementById("editNote");

//close button for second window
const closeBtn = document.getElementById("closePlannerBtn");
if (closeBtn) closeBtn.onclick = () => window.close();

let currentEditIndex = null; //stores which meal is currently being edited

//attach button event handlers
loadBtn.onclick = () => loadPlans();
filterVegBtn.onclick = () => showVegetarian();
totalCalBtn.onclick = () => calculateTotalCalories();
suggestBtn.onclick = () => suggestMeal();
saveBtn.onclick = () => saveEdit();

//load meals from JSON files
async function getPlans() {
  return await ipcRenderer.invoke("load-meals");
}

//save updated meals back to JSON file
function savePlans(plans) {
  ipcRenderer.send("save-meals", plans);
}

// load and display meals
async function loadPlans() {
  const plans = await getPlans(); //get all saved meals
  //clear table and result message
  planTable.innerHTML = "";
  resultText.textContent = "";
  //if no meals saved
  if (plans.length === 0) {
    planTable.innerHTML = "<tr><td colspan='6'>No meals saved.</td></tr>";
    return;
  }

  plans.forEach((meal, index) => { //loop through each saved meal
    //add row to table
    planTable.innerHTML += `
      <tr>
        <td>${meal.name}</td>
        <td>${meal.category}</td>
        <td>${meal.vegetarian ? "Yes" : "No"}</td>
        <td>${meal.calories}</td>
        <td>${meal.note}</td>
        <td>
          <button class="editBtn" onclick="editMeal(${index})">Edit</button>
          <button class="deleteBtn" onclick="deleteMeal(${index})">Delete</button>
        </td>
      </tr>
    `;
  });
}

window.editMeal = async (index) => {
  const plans = await getPlans(); //load current meals
  const meal = plans[index]; //get selected meals
  if (!meal) return;

  //file edit from existing data
  editName.value = meal.name;
  editCalories.value = meal.calories;
  editVegetarian.value = String(meal.vegetarian);
  editNote.value = meal.note;

  currentEditIndex = index; //store which meal is being edited
};

//save changes
async function saveEdit() {
  const plans = await getPlans();
  //if no meal selected
  if (currentEditIndex === null) return alert("Click Edit on a meal first.");

  //update values
  plans[currentEditIndex].calories = Number(editCalories.value) || 0;
  plans[currentEditIndex].vegetarian = editVegetarian.value === "true";
  plans[currentEditIndex].note = editNote.value || "";

  //save updated array
  savePlans(plans); 
  alert("Meal updated!");

  //reload table
  loadPlans();
}

//delete
window.deleteMeal = async (index) => {
  const plans = await getPlans();
  //remove one item at given index
  plans.splice(index, 1);

  //save updated array
  savePlans(plans);
  alert("Meal deleted!");
  loadPlans();
};

//filter vegetarian
async function showVegetarian() {
  const plans = await getPlans();
  const vegMeals = plans.filter((m) => m.vegetarian); //filter only vegeterien meals

  planTable.innerHTML = "";

  if (vegMeals.length === 0) {
    resultText.textContent = "No vegetarian meals found.";
    return;
  }

  //display filtered results
  vegMeals.forEach((meal) => {
    planTable.innerHTML += `
      <tr>
        <td>${meal.name}</td>
        <td>${meal.category}</td>
        <td>Yes</td>
        <td>${meal.calories}</td>
        <td>${meal.note}</td>
        <td>-</td>
      </tr>
    `;
  });

  resultText.textContent = "Showing vegetarian meals.";
}

// calculate total calories
async function calculateTotalCalories() {
  const plans = await getPlans();
  let total = 0;
  plans.forEach((m) => (total += Number(m.calories) || 0)); //add all calorie values
  resultText.textContent = "Total estimated calories: " + total;
}

//suggest meal
async function suggestMeal() {
  const plans = await getPlans();

  if (plans.length === 0) {
    resultText.textContent = "No meals to suggest.";
    return;
  }

  let best = plans[0]; //assume first meal is the best
  plans.forEach((m) => { //compare all meals to choose the lowest calorie
    if ((Number(m.calories) || 0) < (Number(best.calories) || 0)) best = m;
  });

  resultText.textContent = `Suggested meal: ${best.name} (${Number(best.calories) || 0} calories)`;
}

//auto load when planner window opens
loadPlans();