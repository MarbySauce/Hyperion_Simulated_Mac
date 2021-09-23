#include <nan.h>
#include <iostream>
#include <vector>
#include <unistd.h>
#include "CImg.h"
#include "CentroidFunctions.h"

using namespace Nan;
using namespace v8;
using namespace cimg_library;
using namespace std;

// Global variables {
//
// Buffer stuff
char *buffer;
unsigned int bufferSize;
unsigned int imageWidth;
unsigned int imageHeight;

// Centroiding stuff
Centroid Img(0, 0);					   // Image class used to centroid
CImgList<unsigned long> GenImages(10); // List of generated images to centroid
float delayTime = 50;				   // Time in ms between each frame (e.g. = 50 for 20Hz rep, = 10 for 100Hz rep)
int genImageIndex = 0;				   // Cycles through with image to centroid

// Timers
Timer executeTime;
Timer latencyTime;
Timer innerTime;

// Counters
int frameCount;
int missedFrameCount;

// Whether to print to terminal
bool printToTerm = false;

//
// } End global variables

// Async worker class
// inherit public AsyncWorker properties from Nan
class CentroidWorker : public AsyncWorker
{
public:
	CentroidWorker(Callback *callback)
		: AsyncWorker(callback)
	{
	}
	// Executes in worker thread
	void Execute();

	// Executes in event loop (overriding AsyncWorkers function here)
	void HandleOKCallback();

private:
};

// Actual centroiding work (in separate thread)
void CentroidWorker::Execute()
{
	// Enter a while loop until "trigger" is received
	while (true)
	{
		executeTime.end();
		if (fmod(executeTime.time, delayTime) < 0.01) // Receiving the "trigger"
		{
			if (printToTerm) {
				cout << endl;
				latencyTime.endPrint("Latency Time");
			}

			if (latencyTime.time > delayTime + 2)
			{
				// Update how many frames were missed
				int missedFrames = latencyTime.time / delayTime;
				missedFrameCount += missedFrames;
			
				frameCount++; // Update number of frames received

				latencyTime.start(); // Reset the latency timer

				cout << "Missed frames: " << missedFrameCount << "\t Total frames: " << frameCount << endl;

				innerTime.start();
			}
			/*
			Img.Image = GenImages[genImageIndex]; // Copy generated image to Centroid class
			genImageIndex++;
			genImageIndex %= GenImages.size(); // Increment index counter
			*/
			unsigned int randint = 1000 * executeTime.time;
			//srand(randint);

			int numOfSpots = (rand() % 10) + 15;

			vector<float> radii = {30, 50, 90, 120, 170};
			Img.addSpots(numOfSpots, radii, randint);

			Img.centroid(buffer); // Centroid + update image Buffer

			if (printToTerm) {
				innerTime.endPrint("Create image + centroid");
			}

			break; // Leave loop
		}
	}
}

// Called in event loop when centroiding completes
// Return calculated centers to JS
void CentroidWorker::HandleOKCallback()
{
	// Returned array will be 3D array
	// First element is CCL Centers, Second element is Hybrid Centers
	Local<Array> calculatedCenters = New<Array>(2); // Array that will be returned
	for (int centerArray = 0; centerArray < 2; centerArray++)
	{
		Local<Array> centersList = New<Array>(); // Temp array that will be appended to calculatedCenters

		// Add centers if value is not 0
		int centerCounter = 0; // Keep track of how many centers were found
		for (int centerIndex = 0; centerIndex < Img.Centroids[centerArray].width(); centerIndex++)
		{
			if (Img.Centroids(centerArray, centerIndex, 0) > 0)
			{
				Local<Array> spot = New<Array>(2); // Temp array of the spot center

				float xCenter = Img.Centroids(centerArray, centerIndex, 0);
				float yCenter = Img.Centroids(centerArray, centerIndex, 1);
				Nan::Set(spot, 0, Nan::New(xCenter));
				Nan::Set(spot, 1, Nan::New(yCenter));

				// Add spot to centersList
				Nan::Set(centersList, centerCounter, spot);
				centerCounter++; // Increment center counter
			}
		}

		// Add centersList to calculatedCenters
		Nan::Set(calculatedCenters, centerArray, centersList);
	}

	Local<Value> argv[] = {Null(), calculatedCenters};
	callback->Call(2, argv);
}

// Class for context-aware addons
class AddonData
{
public:
	explicit AddonData(Isolate *isolate) : call_count(0)
	{
		// Ensure this per-addon-instance data is deleted at environment cleanup.
		node::AddEnvironmentCleanupHook(isolate, DeleteInstance, this);
	}

	// Per-addon data.
	int call_count;

	static void DeleteInstance(void *data)
	{
		delete static_cast<AddonData *>(data);
	}
};

NAN_METHOD(Method)
{
	// Retrieve the per-addon-instance data.
	AddonData *data =
		reinterpret_cast<AddonData *>(info.Data().As<External>()->Value());
	data->call_count++;
	info.GetReturnValue().Set((double)data->call_count);
}

NAN_METHOD(InitImage)
{
	// Args: Buffer, Buffer length, Image width, Image height
	// Returns 0 if successful, 1 if wrong number of args, 2 if wrong arg types

	// Make sure there is only 1 argument
	if (info.Length() != 4)
	{
		info.GetReturnValue().Set(Nan::New(1));
		return;
	}
	// Idk how to check if it's a buffer...
	// Make sure the last three arguments are numbers
	if (!info[1]->IsNumber() || !info[2]->IsNumber() || !info[3]->IsNumber())
	{
		info.GetReturnValue().Set(Nan::New(2));
		return;
	}

	// Get buffer information
	buffer = (char *)node::Buffer::Data(To<Object>(info[0]).ToLocalChecked());
	bufferSize = To<unsigned int>(info[1]).FromJust();
	imageWidth = To<unsigned int>(info[2]).FromJust();
	imageHeight = To<unsigned int>(info[3]).FromJust();

	// Fill GenImages
	vector<float> radii = {10, 30, 50, 90, 120};
	Img.Image.assign(imageWidth, imageHeight);
	for (unsigned int i = 0; i < GenImages.size(); i++)
	{
		Img.addSpots(30, radii);
		GenImages[i] = Img.Image;
		if (printToTerm) {
			cout << "Written " << i << "th image" << endl;
		}
		// Sleep for a second
		sleep(1);
	}
	if (printToTerm) {
		cout << "Finished writing!" << endl;
		cout << endl;
	}

	// Reset frame counters;
	frameCount = 0;
	missedFrameCount = 0;

	// Return success
	info.GetReturnValue().Set(Nan::New(0));
}

NAN_METHOD(CentroidAsync)
{
	// Args: Callback function
	// Returns 0 if successful, 1 if wrong number of args, 2 if wrong arg types

	// Make sure there is only 1 argument
	if (info.Length() != 1)
	{
		info.GetReturnValue().Set(Nan::New(1));
		return;
	}
	// Make sure the argument is a number
	if (!info[0]->IsFunction())
	{
		info.GetReturnValue().Set(Nan::New(2));
		return;
	}

	// Get Callback
	Callback *callback = new Callback(info[0].As<Function>());

	// Start AsyncWorker on new thread
	AsyncQueueWorker(new CentroidWorker(callback));

	// Reset latency time if this is the first time executing in loop
	if (frameCount == 0)
	{
		latencyTime.start();
	}

	// Return success
	info.GetReturnValue().Set(Nan::New(0));
}

NAN_METHOD(SetDelayTime)
{
	// args: (float) delay time
	// Returns 0 if successful, 1 if wrong number of args, 2 if wrong arg types

	// Make sure there is only 1 argument
	if (info.Length() != 1)
	{
		info.GetReturnValue().Set(Nan::New(1));
		return;
	}
	// Make sure the argument is a number
	if (!info[0]->IsNumber())
	{
		info.GetReturnValue().Set(Nan::New(2));
		return;
	}

	// Update delay time
	delayTime = To<double>(info[0]).FromJust();

	// Return success
	info.GetReturnValue().Set(Nan::New(0));
}

NAN_METHOD(SetGenImageSize)
{
	// args: (int) number of images to generate
	// Returns 0 if successful, 1 if wrong number of args, 2 if wrong arg types

	// Make sure there is only 1 argument
	if (info.Length() != 1)
	{
		info.GetReturnValue().Set(Nan::New(1));
		return;
	}
	// Make sure the argument is a number
	if (!info[0]->IsNumber())
	{
		info.GetReturnValue().Set(Nan::New(2));
		return;
	}

	// Update GenImages size
	int genImageSize = To<int>(info[0]).FromJust();
	GenImages.assign(genImageSize);

	// Return success
	info.GetReturnValue().Set(Nan::New(0));
}

NAN_METHOD(UseHybrid)
{
	// args: (bool) whether to use hybrid centroiding method
	// if no args, assumes bool = true
	// Returns 0 if successful, 1 if wrong number of args, 2 if wrong arg types

	// Make sure there is only 1 argument
	if (info.Length() != 1)
	{
		// Assume true
		// Update method
		Img.UseHybridMethod = true;

		// Return success
		info.GetReturnValue().Set(Nan::New(0));
		return;
	}
	// Make sure the argument is a bool
	if (!info[0]->IsBoolean())
	{
		info.GetReturnValue().Set(Nan::New(2));
		return;
	}

	// Update method
	bool useHybrid = To<bool>(info[0]).FromJust();
	Img.UseHybridMethod = useHybrid;

	// Return success
	info.GetReturnValue().Set(Nan::New(0));
}

NODE_MODULE_INIT(/* exports, module, context */)
{
	Isolate *isolate = context->GetIsolate();

	// Create a new instance of `AddonData` for this instance of the addon and
	// tie its life cycle to that of the Node.js environment.
	AddonData *data = new AddonData(isolate);

	// Wrap the data in a `v8::External` so we can pass it to the method we expose.
	Local<External> external = New<External>(data);

	Nan::Set(exports, New<String>("method").ToLocalChecked(),
			 GetFunction(New<FunctionTemplate>(Method, external)).ToLocalChecked());

	Nan::Set(exports, New<String>("centroid_async").ToLocalChecked(),
			 GetFunction(New<FunctionTemplate>(CentroidAsync, external)).ToLocalChecked());

	Nan::Set(exports, New<String>("init").ToLocalChecked(),
			 GetFunction(New<FunctionTemplate>(InitImage, external)).ToLocalChecked());

	Nan::Set(exports, New<String>("setDelayTime").ToLocalChecked(),
			 GetFunction(New<FunctionTemplate>(SetDelayTime, external)).ToLocalChecked());

	Nan::Set(exports, New<String>("setGenImageSize").ToLocalChecked(),
			 GetFunction(New<FunctionTemplate>(SetGenImageSize, external)).ToLocalChecked());

	Nan::Set(exports, New<String>("useHybrid").ToLocalChecked(),
			 GetFunction(New<FunctionTemplate>(UseHybrid, external)).ToLocalChecked());
}
