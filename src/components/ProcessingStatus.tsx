import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  status: 'idle' | 'transcribing' | 'classifying' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function ProcessingStatus({ status, error }: ProcessingStatusProps) {
  if (status === 'idle') return null;

  const getStatusInfo = () => {
    switch (status) {
      case 'transcribing':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
          text: 'Transcribiendo audio...',
          bgColor: 'bg-blue-50 border-blue-200'
        };
      case 'classifying':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-purple-500" />,
          text: 'Analizando estudiantes y contenido...',
          bgColor: 'bg-purple-50 border-purple-200'
        };
      case 'uploading':
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-green-500" />,
          text: 'Organizando datos por estudiante...',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: '¡Procesado y enviado correctamente!',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: error || 'Error al procesar',
          bgColor: 'bg-red-50 border-red-200'
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <div className={`rounded-lg border p-4 ${statusInfo.bgColor}`}>
      <div className="flex items-center space-x-3">
        {statusInfo.icon}
        <span className="text-sm font-medium">{statusInfo.text}</span>
      </div>
    </div>
  );
}