export interface AudioRecording {
  id: string;
  blob: Blob;
  duration: number;
  timestamp: Date;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
}

export interface ClassificationResult {
  students: StudentClassification[];
  generalSummary?: string;
  generalActions?: string;
}

export interface StudentClassification {
  name: string;
  category: 'Comportamiento' | 'Rendimiento' | 'Participación' | 'Asistencia' | 'Social' | 'Otro';
  sentiment: 'Positivo' | 'Neutral' | 'Negativo';
  summary: string;
  suggestedActions: string;
}

export interface ProcessedNote {
  timestamp: string;
  duration: number;
  transcription: string;
  students: string;
  category: string;
  sentiment: string;
  summary: string;
  suggestedActions: string;
}

export interface GeneralClassification {
  topic: 'Trabajo' | 'Educación' | 'Personal' | 'Administrativo' | 'Reuniones' | 'Proyectos' | 'Recordatorios' | 'Ideas' | 'Tareas' | 'Otro';
  priority: 'Alta' | 'Media' | 'Baja';
  summary: string;
  pendingActions: string;
}

export interface ProcessedGeneralNote {
  timestamp: string;
  duration: number;
  transcription: string;
  topic: string;
  priority: string;
  pendingActions: string;
  summary: string;
}