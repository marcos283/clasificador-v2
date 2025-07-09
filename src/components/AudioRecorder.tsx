import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isProcessing?: boolean;
}

export function AudioRecorder({ 
  isRecording, 
  onStartRecording, 
  onStopRecording,
  isProcessing = false 
}: AudioRecorderProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isProcessing}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-200 transform hover:scale-105
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}
        `}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>
      
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">
          {isProcessing 
            ? 'Procesando...' 
            : isRecording 
              ? 'Grabando... (Click para parar)' 
              : 'Click para grabar nota de voz'
          }
        </p>
        {isRecording && (
          <p className="text-sm text-gray-500 mt-1">
            Habla claramente sobre los estudiantes
          </p>
        )}
      </div>
    </div>
  );
}