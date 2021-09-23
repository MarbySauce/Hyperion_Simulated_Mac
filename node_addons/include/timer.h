#include <chrono>
#include <string>
#include <iostream>

/*

Timer is a class that makes it easy to add in stopwatch functionality

The timer is started upon initialization, as well as with start()
The time is ended with end() and returns the time in ms as a float
print() prints the elapsed time to console
	print(std::string PrintString) prints the PrintString before the time 
endPrint() ends the timer and prints to console

Note: ending timer does not reset start time
	therefore timer can be stopped multiple times

*/

class Timer
{
public:
	std::chrono::high_resolution_clock::time_point timeStart;
	std::chrono::high_resolution_clock::time_point timeEnd;
	float time;

	Timer()
	{ // Creating the class also starts the timer
		timeStart = std::chrono::high_resolution_clock::now();
	}

	void start()
	{ // Start the timer
		timeStart = std::chrono::high_resolution_clock::now();
	}

	float end()
	{ // End the timer and return elapsed time
		timeEnd = std::chrono::high_resolution_clock::now();
		std::chrono::duration<double, std::milli> time_span = timeEnd - timeStart;
		time = time_span.count();
		return time;
	}

	void print()
	{ // Print the elapsed time
		std::cout << time << " ms" << std::endl;
	}

	void print(std::string PrintString)
	{ // Prints elapsed time with string in front to differentiate
		std::cout << PrintString << ": " << time << " ms" << std::endl;
	}

	void endPrint()
	{ // ends timer & prints
		end();
		print();
	}

	void endPrint(std::string PrintString)
	{
		end();
		print(PrintString);
	}
};