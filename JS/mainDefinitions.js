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

const eChart = new Chart(eChartContext, {
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

const settingsList = {
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

const scanCounters = {
	frameCount: 0,
	cclCount: 0,
	hybridCount: 0,
	totalCount: 0,
	update: function (calculatedCenters) {
		let ccl = calculatedCenters[0].length;
		let hybrid = calculatedCenters[1].length;
		let total = ccl + hybrid;
		// Add to counts
		this.cclCount += ccl;
		this.hybridCount += hybrid;
		this.totalCount += total;
		this.frameCount++;
	},
	reset: function () {
		this.frameCount = 0;
		this.cclCount = 0;
		this.hybridCount = 0;
		this.totalCount = 0;
	},
	getFrames: function () {
		// Returns frame count as Xk (e.g. 11k for 11,000 frames)
		// unless frame count is below 1,000
		let frameString;
		if (this.frameCount >= 1000) {
			frameString = Math.round(this.frameCount / 1000) + "k";
		} else {
			frameString = this.frameCount.toString();
		}
		return frameString;
	},
	getTotalCount: function () {
		// Returns total electron count in scientific notation
		// unless total count is below 10,000
		let countString;
		if (this.totalCount >= 10000) {
			countString = this.totalCount.toExponential(3).toString();
			// Get rid of '+' in exponent
			countString = countString.substr(0, countString.length - 2) + countString.slice(-1);
		} else {
			countString = this.totalCount.toString();
		}
		return countString;
	},
};

const averageCount = {
	prevCCLCounts: [],
	prevHybridCounts: [],
	prevTotalCounts: [],
	updateCounter: 0, // Used to keep track of how many frames have
	// been processed since the last time avg display was updated
	update: function (calculatedCenters) {
		let ccl = calculatedCenters[0].length;
		let hybrid = calculatedCenters[1].length;
		let total = ccl + hybrid;
		// Add to respective arrays
		this.prevCCLCounts.push(ccl);
		this.prevHybridCounts.push(hybrid);
		this.prevTotalCounts.push(total);
		// Make sure arrays are only 10 frames long
		// by removing earliest frame
		while (this.prevCCLCounts > 10) {
			this.prevCCLCounts.shift();
		}
		while (this.prevHybridCounts > 10) {
			this.prevHybridCounts.shift();
		}
		while (this.prevTotalCounts > 10) {
			this.prevTotalCounts.shift();
		}
	},
	increaseUpdateCounter: function () {
		// Not a necessary function but I think it makes
		// the code more readable
		this.updateCounter++;
	},
	getAverage: function (arr) {
		// Calculates the average value of the arrays
		const sum = arr.reduce((accumulator, currentValue) => {
			return accumulator + currentValue;
		});
		return sum;
	},
	getCCLAverage: function () {
		return this.getAverage(this.prevCCLCounts).toFixed(2);
	},
	getHybridAverage: function () {
		return this.getAverage(this.prevHybridCounts).toFixed(2);
	},
	getTotalAverage: function () {
		return this.getAverage(this.prevTotalCounts).toFixed(2);
	},
};

let prevFiles = [];

// File information
// !!! These should be under settingsList
let currentFileSaveDir = "../Images";
let prevFileSaveDir = "./PreviousFiles";

// Scanning variables
let AccumulatedImage = Array.from(Array(1024), () => new Array(1024).fill(0)); // Accumulated Image array
let scanBool = false;
let totalECount = 0;

// eChart variables
let eChartBool = false;
let frameCounter = 0;
let avgUpdateCounter = 0;
let eChartMaxYAxis = 20;
let eChartMaxXAxis = 30;
