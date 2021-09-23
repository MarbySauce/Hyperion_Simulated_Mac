#include <nan.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <string>

using namespace Nan;
using namespace v8;
using namespace std;

// Async worker class
// inherit public AsyncWorker properties from Nan
class WriterWorker : public AsyncWorker
{
public:
	WriterWorker(Callback *callback, string FileName, unsigned char *AccumulatedImageBuffer, int ImageWidth, int ImageHeight)
		: AsyncWorker(callback), FileName(FileName), AccumulatedImageBuffer(AccumulatedImageBuffer), ImageWidth(ImageWidth), ImageHeight(ImageHeight)
	{
	}
	// Executes in worker thread
	void Execute();

	// Executes in event loop (overriding AsyncWorkers function here)
	void HandleOKCallback();

private:
	string FileName;
	unsigned char *AccumulatedImageBuffer;
	int ImageWidth;
	int ImageHeight;
};

void WriterWorker::Execute()
{

	ofstream ImageFile;
	ImageFile.open(FileName);

	for (int Y = 0; Y < ImageHeight; Y++)
	{
		for (int X = 0; X < ImageWidth; X++)
		{
			int Value = AccumulatedImageBuffer[ImageWidth * Y + X];
			ImageFile << Value << " ";
		}
		ImageFile << endl;
	}

	ImageFile.close();
}

void WriterWorker::HandleOKCallback()
{
	Local<Value> argv[] = {Null(), Nan::New(0)};
	callback->Call(1, argv);
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

NAN_METHOD(SaveFile)
{
	// Args: (String) File name, (Buffer) Accumulated image buffer, (int) Buffer length, (int) Image width, (int) Image height, Callback function
	// Returns 0 if successful, 1 if wrong number of args, 2 if wrong arg types

	// Make sure there are 6 arguments
	if (info.Length() != 6)
	{
		info.GetReturnValue().Set(Nan::New(1));
		return;
	}
	// Idk how to check if it's a buffer...
	// Make sure the last three arguments are numbers
	if (!info[2]->IsNumber() || !info[3]->IsNumber() || !info[4]->IsNumber())
	{
		info.GetReturnValue().Set(Nan::New(2));
		return;
	}

	// Get file name
	Local<String> tempString = Nan::To<String>(info[0]).ToLocalChecked();
	Nan::Utf8String val(tempString);
	string FileName(*val);

	// Get buffer information
	unsigned char *AccumulatedImageBuffer = (unsigned char *)node::Buffer::Data(To<Object>(info[1]).ToLocalChecked());
	int BufferSize = To<unsigned int>(info[2]).FromJust();
	int ImageWidth = To<unsigned int>(info[3]).FromJust();
	int ImageHeight = To<unsigned int>(info[4]).FromJust();

	// Check that buffer size is right
	if (ImageWidth * ImageHeight > BufferSize)
	{
		info.GetReturnValue().Set(Nan::New(3));
		return;
	}

	// Get Callback
	Callback *callback = new Callback(info[5].As<Function>());

	// Start AsyncWorker on new thread
	AsyncQueueWorker(new WriterWorker(callback, FileName, AccumulatedImageBuffer, ImageWidth, ImageHeight));

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

	Nan::Set(exports, New<String>("save").ToLocalChecked(),
			 GetFunction(New<FunctionTemplate>(SaveFile, external)).ToLocalChecked());
}