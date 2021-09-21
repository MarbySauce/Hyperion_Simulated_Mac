const ipc = require("electron").ipcRenderer;
const Chart = require("chart.js");

// Startup
window.onload = function () {
	Startup();
};

function Startup() {
	const LiveViewContext = document.getElementById("LiveVideoView").getContext("2d");

	LiveViewContext.fillstyle = "black";
	LiveViewContext.fillRect(0, 0, 768, 768);
}

function UpdateAverageDisplays() {
	const avgCountDisplay = document.getElementById("AvgECount");

	if (averageCount.updateCounter === averageCount.updateFrequency) {
		avgCountDisplay.value = averageCount.getTotalAverage();

		averageCount.updateCounter = 0;
	} else {
		averageCount.updateCounter++;
	}
}

// Receive message with centroid data
ipc.on("LVImageUpdate", function (event, obj) {
	// Will return with object containing:
	//		imageBuffer
	//		calcCenters

	const LiveViewContext = document.getElementById("LiveVideoView").getContext("2d");
	const LVData = LiveViewContext.getImageData(0, 0, 768, 768);

	// Put image on display
	LVData.data.set(obj.imageBuffer);
	LiveViewContext.putImageData(LVData, 0, 0);

	// Add counts to chart
	eChartData.updateData(obj.calcCenters);
	eChartData.updateChart(eChart);

	// Update average counters
	averageCount.update(obj.calcCenters);
	UpdateAverageDisplays();
});

const eChart = new Chart(document.getElementById("eChart").getContext("2d"), {
	type: "line",
	data: {
		datasets: [
			{
				//label: "Isolated Spots",
				borderColor: "red",
			},
			{
				//label: "Overlapping Spots",
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
					display: false,
				},
			},
			x: {
				title: {
					text: "Frame Number",
					color: "black",
					display: false,
				},
				display: false,
			},
		},
		aspectRatio: 1.2,
		plugins: {
			legend: {
				display: false,
			},
		},
	},
});

const eChartData = {
	xAxisMax: 30,
	yAxisMax: 30,
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
};

const averageCount = {
	prevCCLCounts: [],
	prevHybridCounts: [],
	prevTotalCounts: [],
	updateCounter: 0, // Used to keep track of how many frames have
	// been processed since the last time avg display was updated
	updateFrequency: 10, // Number of frames before updating display
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
