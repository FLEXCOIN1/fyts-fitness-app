
import { useRunTracker } from './useRunTracker';

function App() {
  const runTracker = useRunTracker();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏃‍♂️ FytS Fitness</h1>
          <p className="text-gray-300">Run for Your Wealth</p>
        </div>

        {/* Run Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold">
              Status: {runTracker.state}
            </div>
            <div className="text-lg text-gray-300">
              Distance: {(runTracker.stats.distanceMeters / 1000).toFixed(2)} km
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {runTracker.state === 'idle' && (
              <button
                onClick={runTracker.start}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Start Run
              </button>
            )}
            
            {runTracker.state === 'running' && (
              <>
                <button
                  onClick={runTracker.pause}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg"
                >
                  Pause
                </button>
                <button
                  onClick={runTracker.end}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg"
                >
                  End
                </button>
              </>
            )}
            
            {runTracker.state === 'paused' && (
              <>
                <button
                  onClick={() => runTracker.start()}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg"
                >
                  Resume
                </button>
                <button
                  onClick={runTracker.end}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg"
                >
                  End
                </button>
              </>
            )}
            
            {runTracker.state === 'ended' && (
              <button
                onClick={runTracker.discard}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                New Run
              </button>
            )}
          </div>
        </div>

        <div className="text-center text-gray-400">
          <p>GPS tracking coming next! 🚀</p>
        </div>
      </div>
    </div>
  );
}

export default App;