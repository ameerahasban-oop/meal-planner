const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs"); 
const path = require("path");

const dataPath = path.join(__dirname, "itineraries.json");

//var to store window references
let mainWin = null;
let plannerWin = null;

//ensure JSON file exists
function ensureFile() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "[]", "utf-8");
  }
}

//read meals from JSON file
function readMeals() {
  ensureFile(); 
  const raw = fs.readFileSync(dataPath, "utf-8");
  try {
    return JSON.parse(raw || "[]"); //convert JSON string to array
  } catch {
    // if file corrupted, reset it
    fs.writeFileSync(dataPath, "[]", "utf-8");
    return [];
  }
}

//write updated meals back to JSON file
function writeMeals(meals) {
  ensureFile();
  fs.writeFileSync(dataPath, JSON.stringify(meals, null, 2), "utf-8"); //convert array into formatted JSON string
}


function createMainWindow() {
  mainWin = new BrowserWindow({ //create new browser window
    width: 1000,
    height: 700,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  mainWin.loadFile(path.join(__dirname, "public", "index.html")); //load homepage
  mainWin.on("closed", () => (mainWin = null)); //clear references when window is closed
}

function openPlannerWindow() {
  //if reference got destroyed,reset it
  if (plannerWin && plannerWin.isDestroyed()) {
    plannerWin = null;
  }

  // if it still exists,show it again
  if (plannerWin) {
    if (plannerWin.isMinimized()) plannerWin.restore();
    plannerWin.show();
    plannerWin.focus();
    return;
  }

  // otherwise create a new planner window
  plannerWin = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false, // wait until ready
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  //load planner page
  plannerWin.loadFile(path.join(__dirname, "public", "planner.html"));

  // show window when fullly ready
  plannerWin.once("ready-to-show", () => {
    plannerWin.show();
    plannerWin.focus();
  });

  //clear reference when user closes it
  plannerWin.on("closed", () => {
    plannerWin = null;
  });
}

app.whenReady().then(() => { //when electron app is ready
  ensureFile(); //make sure JSON file exists
  createMainWindow(); //open main window
});

//open second window
ipcMain.on("open-planner-window", () => {
  openPlannerWindow();
});

//loads meals from file
ipcMain.handle("load-meals", () => {
  return readMeals();
});

//save meals to file
ipcMain.on("save-meals", (event, meals) => {
  writeMeals(Array.isArray(meals) ? meals : []);
});