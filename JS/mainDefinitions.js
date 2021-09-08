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

const eChart = new Chart(document.getElementById("eChart").getContext("2d"), {
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

const eChartData = {
	running: false,
	xAxisMax: 30,
	yAxisMax: 20,
	xAxisUpDisabled: false,
	xAxisDownDisabled: false,
	yAxisUpDisabled: false,
	yAxisDownDisabled: false,
	labels: [],
	cclData: [],
	hybridData: [],
	frameCount: 0,
	start: function () {
		this.running = true;
	},
	stop: function () {
		this.running = false;
	},
	reset: function () {
		this.labels = [];
		this.cclData = [];
		this.hybridData = [];
		this.frameCount = 0;
	},
	updateData: function (calculatedCenters) {
		this.labels.push(this.frameCount);
		this.cclData.push(calculatedCenters[0].length);
		this.hybridData.push(calculatedCenters[0].length + calculatedCenters[1].length);
		this.frameCount++;
		this.cleaveData();
	},
	cleaveData: function () {
		// Make sure chart has fewer data points than xAxisMax
		// By deleting the first point from each array
		while (this.labels.length > this.xAxisMax) {
			this.labels.shift();
		}
		while (this.cclData.length > this.xAxisMax) {
			this.cclData.shift();
		}
		while (this.hybridData.length > this.xAxisMax) {
			this.hybridData.shift();
		}
	},
	updateChart: function (echart) {
		// Update chart vertical max value
		echart.options.scales.y.max = this.yAxisMax;
		// Update chart data
		echart.data.labels = this.labels;
		echart.data.datasets[0].data = this.cclData;
		echart.data.datasets[1].data = this.hybridData;
		echart.update("none");
	},
	zoomAxis: function (axis, zoomString) {
		// axis can be either "X" or "Y"
		// zoomString can be either "increase" or "decrease"
		let currentValue;
		let disableUp = false;
		let disableDown = false; // Check if we need to disable buttons
		// Get current value for given axis
		if (axis === "X") {
			currentValue = this.xAxisMax;
			disableUp = this.xAxisUpDisabled;
			disableDown = this.xAxisDownDisabled;
		} else if (axis === "Y") {
			currentValue = this.yAxisMax;
			disableUp = this.yAxisUpDisabled;
			disableDown = this.yAxisDownDisabled;
		}
		// Change value accordingly
		if (zoomString === "increase") {
			// Enable down button if disabled
			if (disableDown) {
				disableDown = false;
			}
			// Increase by 1 from 1 to 5
			if (currentValue < 5) {
				currentValue += 1;
			}
			// Increase by 5 from 5 to 20
			else if (currentValue < 20) {
				currentValue += 5;
			}
			// Increase by 10 from 20 to 100
			else if (currentValue < 100) {
				currentValue += 10;
			}
			// Increase by 25 from 100 to 300
			else if (currentValue < 300) {
				currentValue += 25;
			}
			// Increase by 100 from 300 to 1000
			else if (currentValue < 1000) {
				currentValue += 100;
			}
			// Make sure it's not more than 1000
			else {
				currentValue = 1000;
			}
			// Disable up button if value is max'd
			if (currentValue === 1000) {
				disableUp = true;
			}
		} else if (zoomString === "decrease") {
			// Enable up button if disabled
			if (disableUp) {
				disableUp = false;
			}
			// Make sure it's not less than 1
			if (currentValue <= 1) {
				currentValue = 1;
			}
			// Decrease by 1 from 5 to 1
			else if (currentValue <= 5) {
				currentValue -= 1;
			}
			// Decrease by 5 from 20 to 5
			else if (currentValue <= 20) {
				currentValue -= 5;
			}
			// Decrease by 10 from 100 to 20
			else if (currentValue <= 100) {
				currentValue -= 10;
			}
			// Decrease by 25 from 300 to 100
			else if (currentValue <= 300) {
				currentValue -= 25;
			}
			// Decrease by 100 from 1000 to 300
			else if (currentValue <= 1000) {
				currentValue -= 100;
			}
			// Disable down button if value is min'd
			if (currentValue === 1) {
				disableDown = true;
			}
		}
		// Apply new values
		if (axis === "X") {
			this.xAxisMax = currentValue;
			this.xAxisUpDisabled = disableUp;
			this.xAxisDownDisabled = disableDown;
		} else if (axis === "Y") {
			this.yAxisMax = currentValue;
			this.yAxisUpDisabled = disableUp;
			this.yAxisDownDisabled = disableDown;
		}
	},
};

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
		xAxisMax: 30,
		yAxisMax: 20,
	},
	saveDirectory: {
		currentScan: "../Images",
		previousScans: "./PreviousScans",
	},
};

const scanInfo = {
	running: false,
	method: "normal", // Can be "normal", "irOff", or "irOn"
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
	toggleScan: function () {
		this.running = !this.running;
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
		// Returns frame count as "X k" (e.g. 11 k for 11,000 frames)
		// unless frame count is below 1,000
		let frameString;
		if (this.frameCount >= 1000) {
			frameString = Math.round(this.frameCount / 1000) + " k";
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
	normal: [],
	irOff: [],
	irOn: [],
	irDifference: [],
	differenceFrequency: 20, // Number of frames before the difference image is calculated
	differenceCounter: 0, // Counter of number of frames since last diff image calculation
	newFunction: function () {
		console.log(this.normal);
	},
	update: function (calculatedCenters) {
		let numberOfCenters;
		let xCenter;
		let yCenter;
		for (let centroidMethod = 0; centroidMethod < 2; centroidMethod++) {
			numberOfCenters = calculatedCenters[centroidMethod].length;
			for (let center = 0; center < numberOfCenters; center++) {
				xCenter = calculatedCenters[centroidMethod][center][0];
				yCenter = calculatedCenters[centroidMethod][center][1];
				// Expand image to correct bin size and round
				xCenter = Math.round((xCenter * this.originalWidth) / this.width);
				yCenter = Math.round((yCenter * this.originalWidth) / this.width);
				// Use switch statement to decide which image to add spots to
				switch (scanInfo.method) {
					case "normal":
						// Add to normal mode image
						this.normal[yCenter][xCenter]++;
						break;

					case "irOff":
						// Add to IR off image
						this.irOff[yCenter][xCenter]++;
						break;

					case "irOn":
						// Add to IR on image
						this.irOn[yCenter][xCenter]++;
						break;
				}
			}
		}
	},
	getDifference: function () {
		// Calculates the difference image for IR
		// i.e. IR on image - IR off image
		let pixelDifference;
		if (this.differenceCounter === this.differenceFrequency) {
			// Reset difference image
			this.irDifference = Array.from(Array(this.height), () => new Array(this.width).fill(0));
			// Calculate each pixel
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
		// calling with no argument resets all three
		switch (image) {
			case "normal":
				// Reset normal image
				this.normal = Array.from(Array(this.height), () => new Array(this.width).fill(0));
				break;

			case "irOff":
				// Reset IR off
				this.irOff = Array.from(Array(this.height), () => new Array(this.width).fill(0));
				break;

			case "irOn":
				// Reset IR on
				this.irOn = Array.from(Array(this.height), () => new Array(this.width).fill(0));
				break;

			default:
				this.normal = Array.from(Array(this.height), () => new Array(this.width).fill(0));
				this.irOff = Array.from(Array(this.height), () => new Array(this.width).fill(0));
				this.irOn = Array.from(Array(this.height), () => new Array(this.width).fill(0));
				break;
		}

		// Reset the difference counter
		this.differenceCounter = 0;
	},
	setOriginalSize: function (width, height) {
		// Changes the size parameters of the captured image
		if (isNaN(width) || isNaN(height)) {
			// If arguments aren't numbers, do nothing
			return;
		}
		this.originalWidth = width;
		this.originalHeight = height;
	},
	setSize: function (width, height) {
		// Changes the size parameters of the accumulated image
		if (isNaN(width) || isNaN(height)) {
			// If arguments aren't numbers, do nothing
			return;
		}
		this.width = width;
		this.height = height;
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
		while (this.prevCCLCounts.length > 10) {
			this.prevCCLCounts.shift();
		}
		while (this.prevHybridCounts.length > 10) {
			this.prevHybridCounts.shift();
		}
		while (this.prevTotalCounts.length > 10) {
			this.prevTotalCounts.shift();
		}
	},
	increaseUpdateCounter: function () {
		// Not a necessary function but I think it makes the code more readable
		this.updateCounter++;
	},
	getAverage: function (arr) {
		// Calculates the average value of the arrays
		const sum = arr.reduce((accumulator, currentValue) => {
			return accumulator + currentValue;
		});
		return sum / arr.length;
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
