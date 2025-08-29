import { useRunTracker } from './useRunTracker';

export default function App() {
  const { state, formattedStats, start, pause, resume, end, discard } = useRunTracker();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
            FytS Fitness
          </h1>
          <div className="text-lg font-medium text-gray-300">Status: 
            <span className={`ml-2 font-bold ${
              state === 'running' ? 'text-green-400' : 
              state === 'paused' ? 'text-yellow-400' : 
              state === 'stationary' ? 'text-orange-400' :
              state === 'ended' ? 'text-blue-400' : 'text-gray-400'
            }`}>
              {state === 'stationary' ? 'Stationary' : state.charAt(0).toUpperCase() + state.slice(1)}
            </span>
          </div>
          {state === 'stationary' && (
            <div className="text-sm text-orange-300 mt-2">
              Move to resume tracking
            </div>
          )}
        </div>

        {/* Main Distance Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            {formattedStats.distance}
          </div>
          <div className="text-lg text-gray-400 uppercase tracking-wider">Distance</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
            <div className="text-xl font-bold text-blue-400">{formattedStats.duration}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Time</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
            <div className="text-xl font-bold text-purple-400">{formattedStats.pace}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Pace</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
            <div className="text-xl font-bold text-orange-400">{formattedStats.currentSpeed}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">Speed</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-4">
          {state === 'idle' && (
            <button 
              onClick={start}
              className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transform transition-all duration-200 border-4 border-green-400/30"
            >
              <div className="text-center">
                <div className="text-2xl mb-1">▶</div>
                <div className="text-sm font-bold">START</div>
              </div>
            </button>
          )}
          
          {(state === 'running' || state === 'stationary') && (
            <div className="flex gap-4">
              <button 
                onClick={pause}
                className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transform transition-all duration-200 border-4 border-yellow-400/30"
              >
                <div className="text-center">
                  <div className="text-xl mb-1">⏸</div>
                  <div className="text-xs font-bold">PAUSE</div>
                </div>
              </button>
              <button 
                onClick={end}
                className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transform transition-all duration-200 border-4 border-red-400/30"
              >
                <div className="text-center">
                  <div className="text-xl mb-1">⏹</div>
                  <div className="text-xs font-bold">STOP</div>
                </div>
              </button>
            </div>
          )}
          
          {state === 'paused' && (
            <div className="flex gap-4">
              <button 
                onClick={resume}
                className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transform transition-all duration-200 border-4 border-green-400/30"
              >
                <div className="text-center">
                  <div className="text-xl mb-1">▶</div>
                  <div className="text-xs font-bold">RESUME</div>
                </div>
              </button>
              <button 
                onClick={end}
                className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transform transition-all duration-200 border-4 border-red-400/30"
              >
                <div className="text-center">
                  <div className="text-xl mb-1">⏹</div>
                  <div className="text-xs font-bold">STOP</div>
                </div>
              </button>
            </div>
          )}
          
          {state === 'ended' && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 border border-blue-400/30">
                <div className="text-xl font-bold mb-2">Run Complete!</div>
                <div className="text-sm text-blue-200">Great job on your workout</div>
              </div>
              <button 
                onClick={discard}
                className="w-28 h-28 bg-gradient-to-r from-gray-600 to-slate-700 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transform transition-all duration-200 border-4 border-gray-500/30"
              >
                <div className="text-center">
                  <div className="text-xl mb-1">+</div>
                  <div className="text-xs font-bold">NEW RUN</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}