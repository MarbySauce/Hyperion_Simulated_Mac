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

const eChartData 

const settingsList = {
	camera: {
		xAoI: 0,
		yAoI: 0,
		xOffset: 0,
		yOffset: 0,
		exposureTime: 0,
		gain: 0,
		gainBoost: false,
		trigger: "Rising Edge",
		triggerDelay: 0,
	},
	Centroid: {
		accumulation: "Centroid",
		hybridMethod: true,
		binSize: 100,
	},
	eChart: {
		yAxisMax: 20,
		xAxisMax: 30,
	},
	saveDirectory: {
		currentScan: "../Images",
		previousScans: "./PreviousScans",
	},
};

const scanInfo = {
	running: false,
	frameCount: 0,
	cclCount: 0,
	hybridCount: 0,
	totalCount: 0,
	startScan: function () {
		this.running = true;
	},
	stopScan: function () {
		this.running = false;
	},
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

const accumulatedImage = {
	originalWidth: 768, // Size of captured image (px)
	originalHeight: 768,
	width: 1024, // Size of accumulated image (px)
	height: 1024,
	normal: Array.from(Array(this.height), () => new Array(this.width).fill(0)),
	irOff: Array.from(Array(this.height), () => new Array(this.width).fill(0)),
	irOn: Array.from(Array(this.height), () => new Array(this.width).fill(0)),
	irDifference: Array.from(Array(this.height), () => new Array(this.width).fill(0)),
	differenceFrequency: 20, // Number of frames before the difference image is calculated
	differenceCounter: 0, // Counter of number of frames since last diff image calculation
	update: function (image, calculatedCenters) {
		// image is an index indicating which accumulated image to add to
		// 0 = normal mode, 1 = IR off, 2 = IR on
		let numberOfCenters;
		let xCenter;
		let yCenter;
		for (let centroidMethod = 0; centroidMethod < 2; centroidMethod++) {
			numberOfCenters = calculatedCenters[centroidMethod].length;
			for (let center = 0; center < numberOfCenters; center++) {
				xCenter = calculatedCenters[centroidMethod][centroidMethod][0];
				yCenter = calculatedCenters[centroidMethod][centroidMethod][1];
				// Expand image to correct bin size and round
				xCenter = Math.round((xCenter * this.originalWidth) / this.width);
				yCenter = Math.round((yCenter * this.originalWidth) / this.width);
				// Use switch to decide which image to add spots to
				switch (image) {
					case 0:
						// Add to normal mode image
						this.normal[yCenter][xCenter]++;
						break;
					
					case 1:
						// Add to IR off image
						this.irOff[yCenter][xCenter]++;
						break;
					
					case 2:
						// Add to IR on image
						this.irOn[yCenter][xCenter]++;
						break;
				}
			}
		}
	},
	getDifference: function() {
		// Calculates the difference image for IR 
		// i.e. IR on image - IR off image
		let pixelDifference;
		if (this.differenceCounter === this.differenceFrequency) {
			for (let Y = 0; Y < this.height; Y++) {
				for (let X = 0; X < this.height; X++) {
					pixelDifference = this.irOn[Y][X] - this.irOff[Y][X];
					this.irDifference[Y][X] = pixelDifference;
				}
			}
			// Reset difference counter
			this.differenceCounter = 0;
		} else {
			// Tick the difference counter by 1 frame
			this.differenceCounter++;
		}
	},
	reset: function (image) {
		// Resets the selected accumulated image
		// image => 0 = normal mode, 1 = IR off, 2 = IR on
		// calling with no argument resets all three
		for (let Y = 0; Y < this.height; Y++) {
			switch (image) {
				case 0:
					// Reset normal image
					this.normal[Y].fill(0);
					break;
				
				case 1:
					// Reset IR off
					this.irOff[Y].fill(0);
					break;
				
				case 2:
					// Reset IR on
					this.irOn[Y].fill(0);
					break;
				
				default:
					this.normal[Y].fill(0);
					this.irOff[Y].fill(0);
					this.irOn[Y].fill(0);
					break;
			}
		}
		// Reset the difference counter
		this.differenceCounter = 0;
	},
	setOriginalSize: function(width, height) {
		// Changes the size parameters of the captured image
		if (isNaN(width) || isNaN(height)) {
			// If arguments aren't numbers, do nothing
			return;
		}
		this.originalWidth = width;
		this.originalHeight = height;
	},
	setSize: function(width, height) {
		// Changes the size parameters of the accumulated image
		if (isNaN(width) || isNaN(height)) {
			// If arguments aren't numbers, do nothing
			return;
		}
		this.width = width;
		this.height = height;
	}
}

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

//let prevFiles = [];
let previousScans = [];

// File information
// !!! These should be under settingsList
//let currentFileSaveDir = "../Images";
//let prevFileSaveDir = "./PreviousFiles";

// Scanning variables
let mainAccumulatedImage = Array.from(Array(1024), () => new Array(1024).fill(0)); // Accumulated Image array

// eChart variables
let eChartBool = false;
let frameCounter = 0;
let avgUpdateCounter = 0;
let eChartMaxYAxis = 20;
let eChartMaxXAxis = 30;
