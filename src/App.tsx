import { useRunTracker } from './useRunTracker';

export default function App() {
  const { state, formattedStats, start, pause, resume, end, discard } = useRunTracker();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-400">
          🏃‍♂️ FytS Fitness
        </h1>
        
        <div className="text-center mb-8">
          <div className="text-lg mb-2">Status: 
            <span className={`ml-2 font-semibold ${
              state === 'running' ? 'text-green-400' : 
              state === 'paused' ? 'text-yellow-400' : 
              state === 'stationary' ? 'text-orange-400' :
              state === 'ended' ? 'text-blue-400' : 'text-gray-400'
            }`}>
              {state === 'stationary' ? 'Stationary' : state.charAt(0).toUpperCase() + state.slice(1)}
            </span>
          </div>
          {state === 'stationary' && (
            <div className="text-sm text-orange-300">
              Move 15+ meters to resume tracking
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400">Distance</div>
            <div className="text-xl font-bold text-green-400">{formattedStats.distance}</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400">Duration</div>
            <div className="text-xl font-bold text-blue-400">{formattedStats.duration}</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400">Pace</div>
            <div className="text-xl font-bold text-purple-400">{formattedStats.pace}</div>
          </div>
        </div>

        <div className="space-y-3">
          {state === 'idle' && (
            <button 
              onClick={start}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Start Run
            </button>
          )}
          
          {(state === 'running' || state === 'stationary') && (
            <>
              <button 
                onClick={pause}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                Pause
              </button>
              <button 
                onClick={end}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                End Run
              </button>
            </>
          )}
          
          {state === 'paused' && (
            <>
              <button 
                onClick={resume}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                Resume
              </button>
              <button 
                onClick={end}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                End Run
              </button>
            </>
          )}
          
          {state === 'ended' && (
            <>
              <div className="bg-blue-600 p-3 rounded text-center">
                <p className="font-semibold">Run Complete! 🎉</p>
              </div>
              <button 
                onClick={discard}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                New Run
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}