const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");

let mainWin;
let LVWin;
let invisibleWin;

function createMainWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 1000,
		minWidth: 600,
		minHeight: 600,
		x: 1480,
		y: -300,
		//x: -1850,
		//y: -200,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	win.loadFile("HTML/mainWindow.html");
	win.webContents.openDevTools();

	return win;
}

function createLVWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 1000,
		x: 2950,
		y: -300,
		//x: -900,
		//y: 50,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	win.loadFile("HTML/LVWindow.html");
	//win.webContents.openDevTools();

	return win;
}

function createInvisibleWindow() {
	win = new BrowserWindow({
		width: 400,
		height: 400,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	win.loadFile("HTML/InvisibleWindow.html");

	return win;
}

app.whenReady().then(function () {
	invisibleWin = createInvisibleWindow();
	LVWin = createLVWindow();
	mainWin = createMainWindow();

	app.on("activate", function () {
		if (BrowserWindow.getAllWindows().length === 0) {
			invisibleWin = createInvisibleWindow();
			LVWin = createLVWindow();
			mainWin = createMainWindow();
		}
	});

	// Close LV window when main window is closed
	mainWin.on("close", function () {
		app.quit();
	});
});

app.on("window-all-closed", function () {
	app.quit();
});

// Messengers
ipcMain.on("UpdateSaveDirectory", function (event, arg) {
	dialog
		.showOpenDialog({
			title: "Choose Save Directory",
			buttonLabel: "Choose Folder",
			defaultPath: app.getPath("documents"),
			properties: ["openDirectory"],
		})
		.then(function (result) {
			if (!result.canceled) {
				// File explorer was not canceled
				let returnPath = result.filePaths[0];

				// Check if Home directory is included in path
				// If so, remove (to clean up aesthetically)
				let homePath = app.getPath("home");
				if (returnPath.includes(homePath)) {
					returnPath = "~" + returnPath.substr(homePath.length);
				}

				// Send message back with directory path
				event.reply("NewSaveDirectory", returnPath);
			}
		})
		.catch(function (err) {
			console.log(err);
		});
});

// Tell invisible window to start centroiding
ipcMain.on("StartCentroiding", function (event, arg) {
	invisibleWin.webContents.send("StartCentroiding", null);
});

// Tell invisible window to stop centroiding
ipcMain.on("StopCentroiding", function (event, arg) {
	invisibleWin.webContents.send("StopCentroiding", null);
});

// Relay centroid data to visible windows
ipcMain.on("LVImageUpdate", function (event, arg) {
	// arg is an object containing image and calculated centers

	// Send data to main window if it's open
	try {
		mainWin.webContents.send("LVImageUpdate", arg);
	} catch {
		console.log("");
	}

	// Send data to live view window if it's open
	try {
		LVWin.webContents.send("LVImageUpdate", arg);
	} catch {
		console.log("");
	}
});

// Turn hybrid method on and off
ipcMain.on("HybridMethod", function (event, message) {
	// Send message to invisible window
	invisibleWin.webContents.send("HybridMethod", message);
});
