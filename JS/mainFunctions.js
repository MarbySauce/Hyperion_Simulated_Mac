/*
	This is a list of all functions used in main window Renderer

	For some reason it's necessary to wrap .onclick and .oninput functions with function(){}
*/

/*


*/
/*			Event Listeners			*/
/*


*/

// Startup
window.onload = function () {
	Startup();
};

// Tabs
document.getElementById("NormalMode").onclick = function () {
	// Normal mode tab
	SwitchTabs(0);
};
document.getElementById("IRMode").onclick = function () {
	// IR mode tab
	SwitchTabs(1);
};
document.getElementById("EMonitor").onclick = function () {
	// e- monitor tab
	SwitchTabs(2);
};
document.getElementById("PostProcess").onclick = function () {
	// Post processing tab
	SwitchTabs(3);
};
document.getElementById("Settings").onclick = function () {
	// Settings tab
	SwitchTabs(4);
};

/*		Normal Mode		*/

// Scan Controls
document.getElementById("StartSave").onclick = function () {
	// Start/Save scan button
	StartSaveScan();
};
document.getElementById("Pause").onclick = function () {
	// Pause scan button
	// Change Pause button text
	ChangePauseButtonText(scanInfo.running);
	// Enable/disable Single Shot button
	ChangeSSButtonStatus(scanInfo.running);
	// Toggle scan (e.g. if scan is running, stop it)
	scanInfo.toggleScan();
};
document.getElementById("SingleShot").onclick = function () {
	// Single shot button
	console.log("Executed SS");
};

// Save Controls
document.getElementById("I0NCounterDown").onclick = function () {
	// Decrease file increment
	I0NCounterDown();
};
document.getElementById("I0NCounterUp").onclick = function () {
	// Increase file increment
	I0NCounterUp();
};
document.getElementById("WavelengthMode").oninput = function () {
	// Detachment laser setup dropdown menu
	ConvertWavelengthInput();
};
document.getElementById("CurrentWavelength").oninput = function () {
	// Detachment laser wavelength input section
	ConvertWavelengthInput();
};
document.getElementById("ChangeSaveDirectory").onclick = function () {
	// Change Save Directory button
	// Send message to main process to update directory
	ipc.send("UpdateSaveDirectory", null);
};

// Display

// Control slider's display
document.getElementById("DisplaySlider1").onmouseover = function () {
	MainSliderMouseOverFn();
};
document.getElementById("DisplaySlider1").onmouseout = function () {
	MainSliderMouseOutFn();
};
document.getElementById("DisplaySlider1").oninput = function () {
	MainDisplaySliderFn(); // Update image contrast
	SliderMouseOverFn(0);
};

// Electron Counters
document.getElementById("ResetCounters").onclick = function () {
	// Reset counters button
	scanCounters.reset();
	UpdateScanCountDisplays();
};

/*		e- Monitor		*/

// Buttons
document.getElementById("eChartStartStop").onclick = function () {
	// Start/Stop button for e- chart
	eChartStartStop();
};
document.getElementById("eChartReset").onclick = function () {
	// Reset button for e- chart
	eChartData.reset();
	eChartData.updateChart(eChart);
};

// Axes Controls
document.getElementById("eChartYAxisUp").onclick = function () {
	// Increase e- chart y (vertical) axis scale
	eChartData.zoomAxis("Y", "increase");
	eChartData.updateChart(eChart);
	eChartUpdateAxisLabels();
};
document.getElementById("eChartYAxisDown").onclick = function () {
	// Decrease e- chart y (vertical) axis scale
	eChartData.zoomAxis("Y", "decrease");
	eChartData.updateChart(eChart);
	eChartUpdateAxisLabels();
};
document.getElementById("eChartXAxisUp").onclick = function () {
	// Increase e- chart x (horizontal) axis scale
	eChartData.zoomAxis("X", "increase");
	eChartData.updateChart(eChart);
	eChartUpdateAxisLabels();
};
document.getElementById("eChartXAxisDown").onclick = function () {
	// Decrease e- chart x (horizontal) axis scale
	eChartData.zoomAxis("X", "decrease");
	eChartData.cleaveData(); // Get rid of extra data points in chart
	eChartData.updateChart(eChart);
	eChartUpdateAxisLabels();
};

/*		Settings		*/

document.getElementById("SaveSettingsButton").onclick = function () {
	// Save settings button
	SaveSettings();
};

/*


*/
/*			Event Listener Functions			*/
/*


*/

/*		Startup		*/

// Execute various functions on application startup
function Startup() {
	const currentFile = document.getElementById("CurrentFileName");
	const saveDirectory = document.getElementById("SaveDirectory");
	const mainDisplay = document.getElementById("Display");
	const mainDisplayContext = mainDisplay.getContext("2d");
	let mainDisplayData;

	SwitchTabs();

	// Get the settings from file
	ReadSettingsFromFileSync();

	// Apply the settings
	ApplySettings();

	// Go to Normal Mode tab (ID = 0)
	SwitchTabs(0);

	// Get todays date (formatted)
	//todaysDate = getFormattedDate();

	// Update CurrentFile and CurrentDirectory displays
	currentFile.value = getCurrentFileName(settingsList.saveDirectory.currentScan, getFormattedDate());
	saveDirectory.value = settingsList.saveDirectory.currentScan;

	// Find today's previous files JSON file and read
	//tartupReadRecentFiles();

	// Fill display and get image data
	mainDisplayContext.fillstyle = "black";
	mainDisplayContext.fillRect(0, 0, accumulatedImage.width, accumulatedImage.height);
	mainDisplayData = mainDisplayContext.getImageData(0, 0, accumulatedImage.width, accumulatedImage.height);

	// Update eChart axis labels
	eChartUpdateAxisLabels;

	// Start centroiding
	ipc.send("StartCentroiding", null);
}

/*		Tabs		*/

// Depress all of the buttons (to behave like a radio button)
// and then activate the tab 'Tab'
function SwitchTabs(Tab) {
	// Tab name should be an integer corresponding to the index of tabList
	// e.g. NormalMode = 0, IRMode = 1, EMonitor = 2, PostProcess = 3, Settings = 4
	//
	// If you only want to hide all tabs and show nothing,
	// call the function with no parameters

	// List of each tab section
	const tabList = [
		document.getElementById("NormalMode"),
		document.getElementById("IRMode"),
		document.getElementById("EMonitor"),
		document.getElementById("PostProcess"),
		document.getElementById("Settings"),
	];

	// Content corresponding to each tab
	const contentList = [
		document.getElementById("NormalModeContent"),
		document.getElementById("IRModeContent"),
		document.getElementById("EMonitorContent"),
		document.getElementById("PostProcessContent"),
		document.getElementById("SettingsContent"),
	];

	// Set all tabs to be deactivated
	for (let i = 0; i < tabList.length; i++) {
		tabList[i].classList.remove("pressed-tab");
		contentList[i].style.display = "none";
	}

	// Activate selected tab
	if (isNaN(Tab) || Tab >= tabList.length || Tab < 0) {
		// If no arguments were passed, Tab is not a number,
		// Tab is too large, or Tab is negative,
		// do not activate any tabs
		return;
	} else {
		// Otherwise activate the selected tab
		tabList[Tab].classList.add("pressed-tab");
		contentList[Tab].style.display = "grid";
		return;
	}
}

/*		Normal Mode		*/

// Scan Controls

// Start a scan or save it if scan is already started
function StartSaveScan() {
	// Change start/save button values
	ChangeStartSaveButtonText(scanInfo.running);

	// Disable/enable Pause and SingleShot buttons
	ChangePauseButtonStatus(scanInfo.running);
	ChangeSSButtonStatus(scanInfo.running);

	if (!scanInfo.running) {
		// Button press indicates a new scan should be started
		console.log("Started");

		// Reset counters
		scanInfo.reset();
		UpdateScanCountDisplays();

		// Reset accumulated image
		accumulatedImage.reset();

		// Start centroiding
		scanInfo.startScan();
	} else {
		// Button press indicates the current scan should be stopped and saved

		// Stop the scan
		scanInfo.stopScan();

		// Save the scan information
		SaveScanInformation();

		// Tick up increment counter
		I0NCounterUp();

		// Make sure pause button says "Pause"
		ChangePauseButtonText(false);
	}
}

// Change text of Start/Save Button
// false scan status means text should change from "Start" to "Save"
function ChangeStartSaveButtonText(scanStatus) {
	const startButtonImg = document.getElementById("StartButtonImg");
	const startButtonText = document.getElementById("StartButtonText");

	if (!scanStatus) {
		// Scan has just been started, change button to "Save"
		startButtonText.innerText = "Save";
		startButtonImg.src = "../ImageSrc/Save.png";
	} else {
		// Scan has just been saved
		startButtonText.innerText = "Start";
		startButtonImg.src = "../ImageSrc/Play.png";
	}
}

// Change Pause button text
// true scan status means text should change from "Pause" to "Resume"
function ChangePauseButtonText(scanStatus) {
	const pauseButtonImg = document.getElementById("PauseButtonImg");
	const pauseButtonText = document.getElementById("PauseButtonText");

	if (scanStatus) {
		// Scan was running, pause button has just been pressed
		// Change text to "Resume"
		pauseButtonText.innerText = "Resume";
		pauseButtonImg.src = "../ImageSrc/Play.png";
	} else {
		// Scan has resumed (or been saved), change text back to "Pause"
		pauseButtonText.innerText = "Pause"; // Reset pause button text & image
		pauseButtonImg.src = "../ImageSrc/Pause.png";
	}
}

// Enable/disable Pause button
function ChangePauseButtonStatus(scanStatus) {
	const pause = document.getElementById("Pause");

	// If scan has been started (scanStatus = false), enable button
	// if scan has been saved (scanStatus = true), disable button
	pause.disabled = scanStatus;
}

// Enable/disable Single Shot button
function ChangeSSButtonStatus(scanStatus) {
	const singleShot = document.getElementById("SingleShot");

	// If scan has been started (scanStatus = false), disable button
	// if scan has been saved (scanStatus = true), enable button
	singleShot.disabled = !scanStatus;
}

// Save the scan information
function SaveScanInformation() {
	const currentFile = document.getElementById("CurrentFile");
	const wavelengthMode = document.getElementById("WavelengthMode");
	const currentWavelength = document.getElementById("CurrentWavelength");
	const convertedWavelength = document.getElementById("ConvertedWavelength");
	const currentWavenumber = document.getElementById("CurrentWavenumber");
	let saveFile; // Object describing important information about current scan
	let currentWL; // current wavelength being used (as float), taken from user input
	let prevFilesJSON; // JSON string to save recent files

	// Save scan information
	saveFile = {
		fileName: currentFile.value,
		mode: wavelengthMode.selectedIndex,
		wavelength: currentWavelength.value,
		converted: convertedWavelength.value,
		wavenumber: currentWavenumber.value,
		totalFrames: scanInfo.getFrames(),
		totalECount: scanInfo.getTotalCount(),
	};
	// If photon energies are out of bounds, don't save
	currentWL = parseFloat(currentWavelength.value);
	if (100 > currentWL || currentWL > 20000) {
		saveFile.wavelength = "";
	}

	// Append to prevFiles
	previousScans.push(saveFile);

	// Update Recent File Section
	updateRecentFiles(saveFile);

	prevFilesJSON = JSON.stringify(previousScans);

	// Update Recent Files JSON file
	/*fs.writeFile(prevFileSaveDir + "/" + todaysDate + "prevFiles.json", prevFilesJSON, function (err) {
		if (err) {
			console.log(err);
		}
	});*/
}

// Update Recent Files Section with recent scan
function updateRecentFiles(saveFile) {
	const recentScansSection = document.getElementById("RecentScansSection");
	let currentMode = saveFile.mode;
	let tag; // tag and text used for appending <p> elements
	let text;

	for (let key in saveFile) {
		if (currentMode == 0) {
			// If standard detachment setup, only write the inputed value
			// (i.e. use current wavelength, skip converted wavelength)
			if (key == "converted") {
				continue;
			}
		} else {
			// If not standard setup, only write the converted value
			// (i.e. use converted wavelength, skip current wavelength)
			if (key == "wavelength") {
				continue;
			}
		}

		// Skip writing the mode
		if (key == "mode") {
			continue;
		}

		tag = document.createElement("p");
		text = document.createTextNode(saveFile[key].toString());
		tag.appendChild(text);
		recentScansSection.appendChild(tag);
	}
}

// Save Controls

// Decrease file counter increment by one
function I0NCounterDown() {
	const currentFile = document.getElementById("CurrentFile");
	const i0NCounter = document.getElementById("I0NCounter");
	let currentCount = parseInt(i0NCounter.value);

	if (currentCount > 1) {
		currentCount -= 1;
	}
	i0NCounter.value = currentCount;
	currentFile.value = getCurrentFileName(currentCount);
}

// Increase file counter increment by one
function I0NCounterUp() {
	const currentFile = document.getElementById("CurrentFile");
	const i0NCounter = document.getElementById("I0NCounter");
	let currentCount = parseInt(i0NCounter.value);

	currentCount++;
	i0NCounter.value = currentCount;
	currentFile.value = getCurrentFileName(currentCount);
}

// Convert photon energy based on detachment laser setup
function ConvertWavelengthInput() {
	const wavelengthMode = document.getElementById("WavelengthMode");
	const currentWavelength = document.getElementById("CurrentWavelength");
	const convertedWavelength = document.getElementById("ConvertedWavelength");
	const currentWavenumber = document.getElementById("CurrentWavenumber");
	let mode = wavelengthMode.selectedIndex; // Laser setup mode
	let WL = parseFloat(currentWavelength.value); // current wavelength (nm) as float
	let NewWL; // What the converted wavelength (nm) will be
	let WN; // What the converted energy (cm^-1) will be

	if (currentWavelength.value === "") {
		// No wavelength is entered, so no need to do the rest
		return;
	}

	// 0 is Standard, 1 is Doubled, 2 is Raman Shifter, 3 is IR-DFG
	switch (mode) {
		case 0:
			// Standard setup, no need to convert wavelengths
			NewWL = WL;
			break;

		case 1:
			// Doubled setup, λ' = λ/2
			NewWL = WL / 2;
			break;

		case 2:
			// Raman Shifter, λ' (cm^-1) = λ (cm^-1) - 4155.201 cm^-1
			WN = convertNMtoWN(WL); // Convert to cm^-1
			WN -= 4055.201; // Red-shift
			NewWL = convertWNtoNM(WN); // Convert back to nm
			break;

		case 3:
			// IR-DFG, 1/λ' = 1/λ - 1/1064
			NewWL = 1 / (1 / WL - 1 / 1064);
			break;
	}

	// Convert to wavenumbers
	if (100 < NewWL && NewWL < 20000 && mode !== 0) {
		convertedWavelength.value = NewWL.toFixed(3);
		currentWavenumber.value = convertNMtoWM(NewWL).toFixed(2);
	} else if (100 < NewWL && NewWL < 20000 && mode === 0) {
		// Standard laser setup, no need to convert wavelengths
		convertedWavelength.value = "";
		currentWavenumber.value = convertNMtoWM(NewWL).toFixed(2);
	} else {
		// Photon energy input is out of reasonable bounds
		// Blank the converted energy text boxes
		convertedWavelength.value = "";
		currentWavenumber.value = "";
	}
}

/*
Probably useful to create a unitConversions.js file to do all of these
*/

// Convert wavelength in nm to wavenumbers
function convertNMtoWN(wavelength) {
	return Math.pow(10, 7) / wavelength;
}

// Convert wavenumbers to wavelength in nm
function convertWNtoNM(wavenumber) {
	// It's the same as NMtoWN, but I think it's easier to read the code this way
	return Math.pow(10, 7) / wavenumber;
}

// Update Accumulated Image contrast
function MainDisplaySliderFn() {
	// Could change this to be a switch statement for
	// 0 - main display, 1 - IR off, 2 - IR on, 3 - difference
	// Same for MouseOver and MouseOut
	const mainDisplayWidth = 1024; // !! Need to make these changeable
	const mainDisplayHeight = 1024;
	const mainDisplay = document.getElementById("Display");
	// !!! Should probably change this ID to MainDisplay
	const mainDisplayContext = mainDisplay.getContext("2d");
	const mainDisplayData = mainDisplayContext.getImageData(mainDisplayWidth, mainDisplayHeight, 0, 0);
	const mainDisplaySlider = document.getElementById("DisplaySlider1");
	let contrastValue = parseFloat(mainDisplaySlider.value);
	let contrastIncrement = contrastValue * 100;
	let accPixValue;

	for (let Y = 0; Y < mainDisplayHeight; Y++) {
		for (let X = 0; X < mainDisplayWidth; X++) {
			accPixValue = 255 - mainAccumulatedImage[Y][X] * contrastIncrement;
			if (accPixValue > 0) {
				mainDisplayData.data[4 * (mainDisplayWidth * Y + X) + 3] = AccPixValue;
			} else {
				mainDisplayData.data[4 * (mainDisplayWidth * Y + X) + 3] = 0;
			}
		}
	}
	mainDisplayContext.putImageData(mainDisplayData, 0, 0);
}

// Create hover color change for sliders
function MainSliderMouseOverFn() {
	const mainDisplaySlider = document.getElementById("DisplaySlider1");
	const backgroundBlue = "hsla(225, 50%, 65%, 1)";
	let sliderValue = (100 * (mainDisplaySlider.value - mainDisplaySlider.min)) / (mainDisplaySlider.max - mainDisplaySlider.min);

	mainDisplaySlider.style.background = `linear-gradient(to right, ${backgroundBlue} 0%, ${backgroundBlue} ${sliderValue}%, hsla(225, 20%, 25%, 1) 0%)`;
}

function MainSliderMouseOutFn() {
	const mainDisplaySlider = document.getElementById("DisplaySlider1");

	mainDisplaySlider.style.background = "hsla(225, 20%, 25%, 1)";
}

/*		e- Monitor		*/

/*

Should try adding an eChartData object that does all the update processing,
and then say 'eChart.data.labels = eChartData.labels' or something

*/

// Start/stop the electron counter chart
function eChartStartStop() {
	const eChartStartButtonText = document.getElementById("eChartStartButtonText");
	const eChartStartButtonImg = document.getElementById("eChartStartButtonImg");

	if (!eChartData.running) {
		// Start chart
		eChartData.start();

		// Change Button text and image
		eChartStartButtonText.innerText = "Stop";
		eChartStartButtonImg.src = "../ImageSrc/Pause.png";
	} else {
		// Stop chart
		eChartData.stop();

		// Change button text and image
		eChartStartButtonText.innerText = "Start";
		eChartStartButtonImg.src = "../ImageSrc/Play.png";
	}
}

// Update the displayed max values for each axis
function eChartUpdateAxisLabels() {
	const xAxis = document.getElementById("eChartXAxis");
	const yAxis = document.getElementById("eChartYAxis");
	const xAxisUp = document.getElementById("eChartXAxisUp");
	const xAxisDown = document.getElementById("eChartXAxisDown");
	const yAxisUp = document.getElementById("eChartYAxisUp");
	const yAxisDown = document.getElementById("eChartYAxisDown");

	// Write current max axis values
	xAxis.value = eChartData.xAxisMax;
	yAxis.value = eChartData.yAxisMax;

	// Disable/enable buttons appropriately
	xAxisUp.disabled = eChartData.xAxisUpDisabled;
	xAxisDown.disabled = eChartData.xAxisDownDisabled;
	yAxisUp.disabled = eChartData.yAxisUpDisabled;
	yAxisDown.disabled = eChartData.yAxisDownDisabled;
}

/*		Settings		*/

// Save the settings to SettingsList & Write to JSON file
function SaveSettingsButtonFn() {
	SettingsList.Camera.AoIx = parseFloat(AoIx.value);
	SettingsList.Camera.AoIy = parseFloat(AoIy.value);
	SettingsList.Camera.xOffset = parseFloat(xOffset.value);
	SettingsList.Camera.yOffset = parseFloat(yOffset.value);
	SettingsList.Camera.ExposureTime = parseFloat(ExposureTime.value);
	SettingsList.Camera.Gain = parseFloat(Gain.value);
	SettingsList.Camera.GainBoost = GainBoost.checked;
	if (InternalTrigger.checked) {
		SettingsList.Camera.Trigger = "Internal Trigger";
	} else if (RisingEdge.checked) {
		SettingsList.Camera.Trigger = "Rising Edge";
	} else if (FallingEdge.checked) {
		SettingsList.Camera.Trigger = "Falling Edge";
	}
	SettingsList.Camera.TriggerDelay = parseFloat(TriggerDelay.value);

	if (RawAccumulation.checked) {
		SettingsList.Centroid.Accumulation = "Raw";
	} else if (CentroidAccumulation.checked) {
		SettingsList.Centroid.Accumulation = "Centroid";
	}
	SettingsList.Centroid.HybridMethod = HybridMethod.checked;
	SettingsList.Centroid.BinSize = parseFloat(CentroidBinSize.value);

	SettingsList.eChart.MaxYAxis = eChartMaxYAxis;
	SettingsList.eChart.MaxXAxis = eChartMaxXAxis;

	let SettingsListJSON = JSON.stringify(SettingsList);

	fs.writeFile("./Settings/SettingsList.JSON", SettingsListJSON, function () {
		console.log("Settings Saved!");
	});

	// Apply the settings
	ApplySettings();
}

// Get Settings from SettingsList.JSON and update values
function ReadSettingsFromFileSync() {
	// Read data from file
	try {
		// Check if the settings file exists
		let JSONdata = fs.readFileSync("./Settings/SettingsList.JSON");
		let data = JSON.parse(JSONdata);
		SettingsList = data;

		AoIx.value = SettingsList.Camera.AoIx;
		AoIy.value = SettingsList.Camera.AoIy;
		xOffset.value = SettingsList.Camera.xOffset;
		yOffset.value = SettingsList.Camera.yOffset;
		ExposureTime.value = SettingsList.Camera.ExposureTime;
		Gain.value = SettingsList.Camera.Gain;
		GainBoost.checked = SettingsList.Camera.GainBoost;
		if (SettingsList.Camera.Trigger === "Internal Trigger") {
			InternalTrigger.checked = true;
		} else if (SettingsList.Camera.Trigger === "Rising Edge") {
			RisingEdge.checked = true;
		} else if (SettingsList.Camera.Trigger === "Falling Edge") {
			FallingEdge.checked = true;
		}
		TriggerDelay.value = SettingsList.Camera.TriggerDelay;

		if (SettingsList.Centroid.Accumulation === "Raw") {
			RawAccumulation.checked = true;
		} else if (SettingsList.Centroid.Accumulation === "Centroid") {
			CentroidAccumulation.checked = true;
		}
		HybridMethod.checked = SettingsList.Centroid.HybridMethod;
		CentroidBinSize.value = SettingsList.Centroid.BinSize;

		eChartMaxYAxis = SettingsList.eChart.MaxYAxis;
		eChartMaxXAxis = SettingsList.eChart.MaxXAxis;
	} catch {
		// If the settings file doesn't exist, use version from mainDefinitions.js
	}
}

// Apply the settings after reading
function ApplySettings() {
	// Turn hybrid method on/off
	ipc.send("HybridMethod", SettingsList.Centroid.HybridMethod);
	// More stuff for camera control to come
}

/*


*/
/*			IPC Messages			*/
/*


*/

// Receive message with centroid data
ipc.on("LVImageUpdate", function (event, obj) {
	// Will return with object containing:
	//		imageBuffer
	//		calcCenters

	// Update average number of electrons
	averageCount.update(obj.calcCenters);
	UpdateAverageCountDisplays();

	// Only update these if currently taking a scan
	if (scanInfo.running) {
		// Update number of electrons
		scanInfo.update(obj.calcCenters);
		UpdateScanCountDisplays();

		// Update Accumulated View
		accumulatedImage.update(obj.calcCenters);
	}

	// Update eChart if it's running
	if (eChartData.running) {
		eChartData.updateData(obj.calcCenters);
		eChartData.updateChart(eChart);
	}
});

// Update the average counters on the e- monitor page
function UpdateAverageCountDisplays() {
	const totalAverage = document.getElementById("AvgECount");
	const cclAverage = document.getElementById("eChartCCLAvg");
	const hybridAverage = document.getElementById("eChartHybridAvg");
	const eChartTotalAverage = document.getElementById("eChartTotalAvg");

	totalAverage.value = averageCount.getTotalAverage();
	cclAverage.value = averageCount.getCCLAverage();
	hybridAverage.value = averageCount.getHybridAverage();
	eChartTotalAverage.value = averageCount.getTotalAverage();

	// Need to add bit about updating calc time
}

// Update the total frames and electron counters
function UpdateScanCountDisplays() {
	const totalFrames = document.getElementById("TotalFrames");
	const totalElectrons = document.getElementById("TotalECount");

	totalFrames.value = scanInfo.frameCount;
	totalElectrons.value = scanInfo.getTotalCount();
}

// Receive message about changing Current File Save Directory
ipc.on("NewSaveDirectory", function (event, arg) {
	SaveDirectory.value = arg.toString();
});

/* When update e- counters on main page, also update on e- Monitor page
	and add in an if statement whether to add to chart
	And have addon send over calc time data */

/*


*/
/*			Various Functions			*/
/*


*/

/* Should move functions to the most related section */

// Format current date as MMDDYY
function getFormattedDate() {
	let today = new Date();
	let formattedDay = ("0" + today.getDate()).slice(-2);
	let formattedMonth = ("0" + (today.getMonth() + 1)).slice(-2);
	let formattedYear = today.getFullYear().toString().slice(-2);
	return formattedMonth + formattedDay + formattedYear;
}

// Format file name as MMDDYY_iXX_1024.i0N
function getCurrentFileName(ionCounter) {
	let todaysDate = getFormattedDate();
	// Slice here makes sure 0 is not included if ionCounter > 9
	let increment = ("0" + ionCounter).slice(-2);
	let fileString = `${todaysDate}i${increment}_1024.i0N`;
	let checked = checkCurrentFile(settingsList.saveDirectory.currentScan, fileString);

	// Make Alert system it's own function
	fileTakenAlert = document.getElementById("FileTakenAlert");
	if (checked) {
		fileTakenAlert.classList.remove("noHover");
		fileTakenAlert.style.visibility = "visible";
	} else {
		fileTakenAlert.classList.add("noHover");
		fileTakenAlert.style.visibility = "hidden";
	}
	return fileString;
}

// Check if file in Current File exists
function checkCurrentFile(current_dir, file_string) {
	let currentFile = current_dir + file_string;
	if (fs.existsSync(currentFile)) {
		return true;
	} else {
		return false;
	}
}

// On startup, check if there is already a json file for today and read it
function startupReadRecentFiles() {
	let fileName = prevFileSaveDir + "/" + todaysDate + "prevFiles.json";
	let incValue = parseFloat(I0NCounter.value);
	// Check if that file exists
	fs.stat(fileName, function (err, stats) {
		if (err) {
			console.log(err);
		} else {
			// Read it
			fs.readFile(fileName, function (err, JSONdata) {
				let data = JSON.parse(JSONdata);
				// Update I0NCounter
				incValue += data.length;
				I0NCounter.value = incValue;
				CurrentFile.value = getCurrentFileName(currentFileSaveDir, todaysDate);
				// Make wavelength mode and wavelength the one previously used
				let currentMode = data[data.length - 1].mode;
				WavelengthMode.selectedIndex = currentMode;
				let CWL = data[data.length - 1].wavelength;
				CurrentWavelength.value = CWL;
				WavelengthInputFn();
				// Update prevFiles
				for (let i = 0; i < data.length; i++) {
					previousScans.push(data[i]);
					updateRecentFiles(RecentScansSection, data[i]);
				}
			});
		}
	});
}

// Update accumulated image
function updateAccumulatedImage(calcCenters) {
	let contrastValue = parseFloat(DisplaySlider.value);
	let contrastIncrement = contrastValue * 100;
	for (let k = 0; k < 2; k++) {
		for (let i = 0; i < calcCenters[0].length; i++) {
			let xCenter = Math.round((calcCenters[0][i][0] * 4.0) / 3.0);
			let yCenter = Math.round((calcCenters[0][i][1] * 4.0) / 3.0);
			AccumulatedImage[yCenter][xCenter]++;

			// Update image
			let AccPixValue = 255 - AccumulatedImage[yCenter][xCenter] * contrastIncrement;
			if (AccPixValue > 0) {
				DisplayData.data[4 * (1024 * yCenter + xCenter) + 3] = AccPixValue;
			} else {
				DisplayData.data[4 * (1024 * yCenter + xCenter) + 3] = 0;
			}
		}
	}
	// Send updated image to screen
	DisplayContext.putImageData(DisplayData, 0, 0);
}

function resetAccumulatedImage() {
	// Reset accumulated image
	AccumulatedImage = Array.from(Array(1024), () => new Array(1024).fill(0));

	// Reset accumulated image display
	for (let i = 0; i < 1024 * 1024; i++) {
		DisplayData.data[4 * i + 3] = 255;
	}
	DisplayContext.putImageData(DisplayData, 0, 0);
}

// Update total electron counter
function updateECount(calcCenters) {
	let CCLCount = calcCenters[0].length;
	let HybridCount = calcCenters[1].length;
	let eCount = CCLCount + HybridCount;
	totalECount += eCount;
	TotalECount.value = getSciNot(totalECount); // Push current total electron count to normal mode screen
}

// Update average electron counter
function updateAvgECount(calcCenters) {
	// Get electron counts
	let CCLCount = calcCenters[0].length;
	let HybridCount = calcCenters[1].length;
	let eCount = CCLCount + HybridCount;

	// Add to respective arrays
	PreviousCCLCounts.push(CCLCount);
	PreviousHybridCounts.push(HybridCount);
	PreviousElectronCounts.push(eCount);

	// Make sure arrays are only 10 frames long
	if (PreviousCCLCounts.length > 10) {
		PreviousCCLCounts.shift();
	}
	if (PreviousHybridCounts.length > 10) {
		PreviousHybridCounts.shift();
	}
	if (PreviousElectronCounts.length > 10) {
		PreviousElectronCounts.shift();
	}

	// Update averages if avgUpdateCounter is large enough
	if (avgUpdateCounter === 5) {
		// Get averages and push to counters
		let avgCCLECount = getAvg(PreviousCCLCounts).toFixed(2);
		let avgHybridECount = getAvg(PreviousHybridCounts).toFixed(2);
		let avgTotalECount = getAvg(PreviousElectronCounts).toFixed(2);
		eChartCCLAvg.value = avgCCLECount;
		eChartHybridAvg.value = avgHybridECount;
		eChartTotalAvg.value = avgTotalECount;
		AvgECount.value = avgTotalECount;

		// Reset avgUpdateCounter
		avgUpdateCounter = 0;
	}

	// Add electron counts to eChart if started
	if (eChartBool) {
		eChart.data.labels.push(frameCounter);
		eChart.data.datasets[0].data.push(CCLCount); // Add single spot count
		eChart.data.datasets[1].data.push(CCLCount + HybridCount); // Add overlapping spot count
		frameCounter++;

		// Make sure chart only contains certain number of data points
		while (eChart.data.datasets[0].data.length > eChartMaxXAxis) {
			eChart.data.labels.shift(); // Delete first data point from array
			eChart.data.datasets[0].data.shift();
			eChart.data.datasets[1].data.shift();
		}

		eChart.update("none"); // Update chart
	}

	// Update average update counter
	avgUpdateCounter++;
}

function doit() {
	let xxx = [
		[10, 20],
		[30, 40],
		[50, 60],
		[70, 80],
		[90, 100],
		[10, 20],
		[30, 40],
		[50, 60],
		[70, 80],
		[90, 100],
	];
	console.time("timer");
	const display = document.getElementById("Display");
	const displayContext = display.getContext("2d");
	let displayData = displayContext.getImageData(0, 0, 1024, 1024);
	for (let i = 0; i < xxx.length; i++) {
		let pixValue = 255 - 50;
		displayData.data[4 * (1024 * xxx[1] + xxx[0]) + 3] = pixValue;
	}
	displayContext.putImageData(displayData, 0, 0);
	console.timeEnd("timer");
}

function doit2() {
	console.time("timer");
	const display = document.getElementById("Display");
	const displayContext = display.getContext("2d");
	let displayData = displayContext.getImageData(0, 0, 1024, 1024);
	for (let Y = 0; Y < 1024; Y++) {
		for (let X = 0; X < 1024; X++) {
			if (accumulatedImage.normal[Y][X]) {
				let pixValue = 255 - 50;
				displayData.data[4 * (1024 * Y + X) + 3] = pixValue;
			}
		}
	}
	displayContext.putImageData(displayData, 0, 0);
	console.timeEnd("timer");
}
