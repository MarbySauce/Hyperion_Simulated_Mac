/*
	This is a list of all globally defined variables used in Main Window Renderer
*/

// Libraries
const fs = require("fs");
const ipc = require("electron").ipcRenderer;
const Chart = require("chart.js");
// Addon libraries
const centroid = require("../build/Release/centroid");
const autoSaveFile = require("../build/Release/autosavefile");

/*

			DOM Elements			

*/

// Tabs
const NormalMode = document.getElementById("NormalMode");
const IRMode = document.getElementById("IRMode");
const EMonitor = document.getElementById("EMonitor");
const PostProcess = document.getElementById("PostProcess");
const Settings = document.getElementById("Settings");

// Tab content
const NormalModeContent = document.getElementById("NormalModeContent");
const IRModeContent = document.getElementById("IRModeContent");
const EMonitorContent = document.getElementById("EMonitorContent");
const PostProcessContent = document.getElementById("PostProcessContent");
const SettingsContent = document.getElementById("SettingsContent");

/* Normal Mode */

// Scan Controls
const StartSave = document.getElementById("StartSave"); // Button
const Pause = document.getElementById("Pause"); // Button
const SingleShot = document.getElementById("SingleShot"); // Button

const StartButtonImg = document.getElementById("StartButtonImg");
const PauseButtonImg = document.getElementById("PauseButtonImg");

const StartButtonText = document.getElementById("StartButtonText");
const PauseButtonText = document.getElementById("PauseButtonText");

// Save Controls
const CurrentFile = document.getElementById("CurrentFile"); // Text box
const I0NCounter = document.getElementById("I0NCounter"); // Text box
const WavelengthMode = document.getElementById("WavelengthMode"); // Dropdown
const CurrentWavelength = document.getElementById("CurrentWavelength"); // Text box
const ConvertedWavlength = document.getElementById("ConvertedWavelength"); // Text box
const CurrentWavenumber = document.getElementById("CurrentWavenumber"); // Text box
const ChangeSaveDirectory = document.getElementById("ChangeSaveDirectory"); // Text box
const I0NCounterUp = document.getElementById("I0NCounterUp"); // Button
const I0NCounterDown = document.getElementById("I0NCounterDown"); // Button
const SaveDirectory = document.getElementById("SaveDirectory"); // Button
const FileTakenAlert = document.getElementById("FileTakenAlert"); // Div with Image

// Recent Scans
const RecentScansSection = document.getElementById("RecentScansSection"); // Paragraph section

// Display
const Display = document.getElementById("Display"); // Canvas
const DisplayContext = Display.getContext("2d"); // Canvas context
let DisplayData; // Image data
let DisplayBuffer; // Buffer
const DisplaySlider = document.getElementById("DisplaySlider1");
const Sliders = document.getElementsByClassName("DisplaySlider"); // Input ranges

// Electron Counters
const TotalFrames = document.getElementById("TotalFrames"); // Text box
const TotalECount = document.getElementById("TotalECount"); // Text box
const AvgECount = document.getElementById("AvgECount"); // Text box
const ResetCounters = document.getElementById("ResetCounters"); // Button

/* e- Monitor */

// Buttons
const eChartStartStop = document.getElementById("eChartStartStop"); // Button
const eChartStartButtonImg = document.getElementById("eChartStartButtonImg"); // Image
const eChartStartButtonText = document.getElementById("eChartStartButtonText"); // Text (span)
const eChartReset = document.getElementById("eChartReset"); // Button

// Chart Axes Buttons
const eChartYAxisUp = document.getElementById("eChartYAxisUp"); // Button
const eChartYAxis = document.getElementById("eChartYAxis"); // Text box
const eChartYAxisDown = document.getElementById("eChartYAxisDown"); // Button
const eChartXAxisUp = document.getElementById("eChartXAxisUp"); // Button
const eChartXAxis = document.getElementById("eChartXAxis"); // Text box
const eChartXAxisDown = document.getElementById("eChartXAxisDown"); // Button

// Chart
const eChartElement = document.getElementById("eChart");
const eChartContext = eChartElement.getContext("2d");
let eChart = new Chart(eChartContext, {
	type: "line",
	data: {
		datasets: [
			{
				label: "Isolated Spots",
				borderColor: "red",
			},
			{
				label: "Overlapping Spots",
				borderColor: "blue",
			},
		],
	},
	options: {
		scales: {
			y: {
				beginAtZero: true,
				suggestedMax: 10, // Defines starting max value of chart
				title: {
					text: "Electron Count",
					color: "black",
					display: true,
				},
			},
			x: {
				title: {
					text: "Frame Number",
					color: "black",
					display: true,
				},
			},
		},
		aspectRatio: 1.2,
	},
});

// Counters
const eChartCCLAvg = document.getElementById("eChartCCLAvg"); // Text box
const eChartHybridAvg = document.getElementById("eChartHybridAvg"); // Text box
const eChartTotalAvg = document.getElementById("eChartTotalAvg"); // Text box
const eChartCalcTime = document.getElementById("eChartCalcTime"); // Text box

/* Settings */

let SettingsList = {
	Camera: {
		AoIx: 0,
		AoIy: 0,
		xOffset: 0,
		yOffset: 0,
		ExposureTime: 0,
		Gain: 0,
		GainBoost: false,
		Trigger: "Rising Edge",
		TriggerDelay: 0,
	},
	Centroid: {
		Accumulation: "Centroid",
		HybridMethod: true,
		BinSize: 100,
	},
	eChart: {
		MaxYAxis: 20,
		MaxXAxis: 30,
	},
};

// Camera Settings
const AoIx = document.getElementById("AoIx");
const AoIy = document.getElementById("AoIy");
const xOffset = document.getElementById("xOffset");
const yOffset = document.getElementById("yOffset");
const ExposureTime = document.getElementById("ExposureTime");
const Gain = document.getElementById("Gain");
const GainBoost = document.getElementById("GainBoost");
const InternalTrigger = document.getElementById("InternalTrigger");
const RisingEdge = document.getElementById("RisingEdge");
const FallingEdge = document.getElementById("FallingEdge");
const TriggerDelay = document.getElementById("TriggerDelay");

// Centroid Settings
const RawAccumulation = document.getElementById("RawAccumulation");
const CentroidAccumulation = document.getElementById("CentroidAccumulation");
const HybridMethod = document.getElementById("HybridMethod");
const CentroidBinSize = document.getElementById("CentroidBinSize");

// Save button
const SaveSettingsButton = document.getElementById("SaveSettingsButton");

/* 			

		Other global variables 			

*/

let prevFiles = [];

// File information
let todaysDate;
let currentFileSaveDir = "../Images";
let prevFileSaveDir = "./PreviousFiles";

// Electron counter variables
let PreviousElectronCounts = [];
let PreviousCCLCounts = [];
let PreviousHybridCounts = [];

// Scanning variables
let AccumulatedImage = Array.from(Array(1024), () => new Array(1024).fill(0)); // Accumulated Image array
let ScanBool = false;
let totalECount = 0;

// eChart variables
let eChartBool = false;
let frameCounter = 0;
let avgUpdateCounter = 0;
let eChartMaxYAxis = 20;
let eChartMaxXAxis = 30;
