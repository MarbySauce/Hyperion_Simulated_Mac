(function () {
	const ipc = require("electron").ipcRenderer;

	function startup() {
		var LVView = document.getElementById("LiveVideoView");
		var LVCtx = LVView.getContext("2d");

		//LVView.style.width = "384px";
		//LVVIew.style.height = "384px";

		// Making the displays black
		LVCtx.fillstyle = "black";
		LVCtx.fillRect(0, 0, 768, 768);

		imgData = LVCtx.getImageData(0, 0, 768, 768);

		// Receive message with centroid data
		ipc.on("LVImageUpdate", function (event, obj) {
			// Will return with object containing:
			//		imageBuffer
			//		calcCenters

			imgData.data.set(obj.imageBuffer);
			LVCtx.putImageData(imgData, 0, 0);
		});
	}

	window.addEventListener("load", startup, false);
})();
