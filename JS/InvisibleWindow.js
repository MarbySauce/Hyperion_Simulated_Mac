/*			Libraries					*/

const ipc = require("electron").ipcRenderer;
const centroid = require("../build/Release/centroid");

//
/*			Event Listeners				*/
//

window.onload = function () {
	Startup();
};

//
/*			Centroid variables			*/
//

let centroidLoopBool = false;

let LVImage = new Array(768 * 768 * 4).fill(0);
// Fill black
for (let i = 0; i < 768 * 768; i++) {
	LVImage[4 * i + 3] = 255;
}
let LVBuffer = Buffer.from(LVImage);

//
/*			Centroid functions			*/
//

// Startup
function Startup() {
	// Set centroiding values
	centroid.setGenImageSize(0);
	centroid.setDelayTime(20); //50);
	//centroid.useHybrid();

	// Initialize image buffer
	centroid.init(LVBuffer, LVBuffer.length, 768, 768);
}

// Main loop
function CentroidLoop(resolvedValue) {
	if (centroidLoopBool) {
		Centroid().then(CentroidLoop).then(sendData).catch(handleFailure);
	}
	return resolvedValue;
}

function Centroid() {
	return new Promise((resolve, reject) => {
		centroid.centroid_async(function (err, results) {
			if (err) {
				reject(err);
			} else {
				resolve(results);
			}
		});
	});
}

function sendData(resolvedValue) {
	// Turn data into an object
	CentroidData = {
		imageBuffer: LVBuffer,
		calcCenters: resolvedValue,
	};

	// Send to main process
	ipc.send("LVImageUpdate", CentroidData);
}

function handleFailure(rejectedValue) {
	console.log("Failure");
	console.log(rejectedValue);
}

//
/*			Messengers				*/
//

ipc.on("StartCentroiding", function (event, arg) {
	centroidLoopBool = true;
	CentroidLoop();
});

ipc.on("StopCentroiding", function (event, arg) {
	centroidLoopBool = false;
});

// Turn on / off hybrid method
ipc.on("HybridMethod", function (event, message) {
	centroid.useHybrid(message);
});
