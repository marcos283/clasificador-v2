import React from 'react';
import { Play, Trash2, Upload, Clock } from 'lucide-react';
import type { AudioRecording } from '../types';

interface RecordingsListProps {
  recordings: AudioRecording[];
  onDeleteRecording: (id: string) => void;
  onProcessRecording: (recording: AudioRecording) => void;
  isProcessing: boolean;
}

export function RecordingsList({ 
  recordings, 
  onDeleteRecording, 
  onProcessRecording,
  isProcessing 
}: RecordingsListProps) {
  if (recordings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay grabaciones aún</p>
        <p className="text-sm mt-1">Graba tu primera nota de voz para comenzar</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Grabaciones ({recordings.length})
      </h3>
      
      {recordings.map((recording) => (
        <div 
          key={recording.id}
          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {formatDuration(recording.duration)}
              </div>
              <div className="text-sm text-gray-500">
                {formatTimestamp(recording.timestamp)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const audio = new Audio(URL.createObjectURL(recording.blob));
                  audio.play();
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Reproducir"
              >
                <Play className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onProcessRecording(recording)}
                disabled={isProcessing}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                title="Procesar y enviar a Google Sheets"
              >
                <Upload className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onDeleteRecording(recording.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}