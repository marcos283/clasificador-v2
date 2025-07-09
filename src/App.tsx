import React, { useState, useEffect } from 'react';
import { AudioRecorder } from './components/AudioRecorder';
import { RecordingsList } from './components/RecordingsList';
import { ProcessingStatus } from './components/ProcessingStatus';
import { CourseManager } from './components/CourseManager';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { transcribeAudio, classifyContent, classifyGeneralContent } from './services/openai';
import { appendToGoogleSheet, listGoogleSheetsTabs, createGoogleSheetTab, renameGoogleSheetTab } from './services/googleSheets';
import type { AudioRecording } from './types';
import { BookOpen, Settings, AlertTriangle } from 'lucide-react';

type ProcessingStatus = 'idle' | 'transcribing' | 'classifying' | 'uploading' | 'success' | 'error';

const GENERAL_SHEET_NAME = 'General';

function App() {
  const { isRecording, recordings, startRecording, stopRecording, deleteRecording } = useAudioRecorder();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingError, setProcessingError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [currentSheet, setCurrentSheet] = useState<string>('Sheet1');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [configStatus, setConfigStatus] = useState({
    openai: false,
    googleSheetId: false,
    serviceAccount: false,
    privateKey: false
  });

  // Verificar configuración al cargar
  useEffect(() => {
    console.log('🔍 Verificando configuración completa...');
    
    const status = {
      openai: !!import.meta.env.VITE_OPENAI_API_KEY,
      googleSheetId: !!import.meta.env.VITE_GOOGLE_SHEET_ID,
      serviceAccount: !!import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: !!import.meta.env.VITE_GOOGLE_PRIVATE_KEY
    };

    console.log('Estado de configuración:', status);
    setConfigStatus(status);

    // Mostrar valores (censurados) para debug
    console.log('Variables de entorno:');
    console.log('- OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? `${import.meta.env.VITE_OPENAI_API_KEY.substring(0, 10)}...` : 'NO CONFIGURADA');
    console.log('- GOOGLE_SHEET_ID:', import.meta.env.VITE_GOOGLE_SHEET_ID || 'NO CONFIGURADA');
    console.log('- SERVICE_ACCOUNT_EMAIL:', import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL || 'NO CONFIGURADA');
    console.log('- PRIVATE_KEY:', import.meta.env.VITE_GOOGLE_PRIVATE_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA');
    
    // Cargar hojas disponibles si la configuración está completa
    if (status.googleSheetId && status.serviceAccount && status.privateKey) {
      loadAvailableSheets();
      ensureGeneralSheetExists();
    }
  }, []);

  const ensureGeneralSheetExists = async () => {
    try {
      console.log('🔍 Verificando existencia de hoja General...');
      const sheets = await listGoogleSheetsTabs();
      
      if (!sheets.includes(GENERAL_SHEET_NAME)) {
        console.log('📝 Creando hoja General automáticamente...');
        await createGoogleSheetTab(GENERAL_SHEET_NAME, true);
        console.log('✅ Hoja General creada exitosamente');
      } else {
        console.log('✅ Hoja General ya existe');
      }
    } catch (error) {
      console.error('❌ Error verificando/creando hoja General:', error);
    }
  };

  const loadAvailableSheets = async () => {
    try {
      setIsLoadingSheets(true);
      console.log('📋 Cargando hojas disponibles...');
      const sheets = await listGoogleSheetsTabs();
      
      // Asegurar que la hoja General esté siempre presente
      const sheetsWithGeneral = sheets.includes(GENERAL_SHEET_NAME) 
        ? sheets 
        : [GENERAL_SHEET_NAME, ...sheets];
      
      setAvailableSheets(sheetsWithGeneral);
      
      // Si no hay hoja actual seleccionada o no existe, seleccionar la primera
      if (!currentSheet || !sheetsWithGeneral.includes(currentSheet)) {
        setCurrentSheet(sheetsWithGeneral[0] || GENERAL_SHEET_NAME);
      }
      
      console.log('✅ Hojas cargadas:', sheetsWithGeneral);
    } catch (error) {
      console.error('❌ Error cargando hojas:', error);
      // En caso de error, mantener configuración por defecto
      setAvailableSheets([GENERAL_SHEET_NAME, 'Sheet1']);
      setCurrentSheet(GENERAL_SHEET_NAME);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleCreateSheet = async (sheetName: string) => {
    try {
      console.log('📝 Creando nueva hoja:', sheetName);
      const isGeneral = sheetName === GENERAL_SHEET_NAME;
      await createGoogleSheetTab(sheetName, isGeneral);
      
      // Recargar la lista de hojas
      await loadAvailableSheets();
      
      // Seleccionar la nueva hoja
      setCurrentSheet(sheetName);
      
      console.log('✅ Hoja creada y seleccionada:', sheetName);
    } catch (error) {
      console.error('❌ Error creando hoja:', error);
      throw error; // Re-throw para que el componente pueda manejarlo
    }
  };

  const handleSheetChange = (sheetName: string) => {
    console.log('🔄 Cambiando a hoja:', sheetName);
    setCurrentSheet(sheetName);
  };

  const handleRenameSheet = async (oldName: string, newName: string) => {
    try {
      console.log('✏️ Renombrando hoja:', oldName, '→', newName);
      await renameGoogleSheetTab(oldName, newName);
      
      // Actualizar la lista local de hojas
      setAvailableSheets(prev => 
        prev.map(sheet => sheet === oldName ? newName : sheet)
      );
      
      // Si la hoja renombrada era la actual, actualizar la referencia
      if (currentSheet === oldName) {
        setCurrentSheet(newName);
      }
      
      console.log('✅ Hoja renombrada y estado actualizado');
    } catch (error) {
      console.error('❌ Error renombrando hoja:', error);
      throw error; // Re-throw para que el componente pueda manejarlo
    }
  };

  const handleDeleteSheet = (sheetName: string) => {
    console.log('🗑️ Eliminando hoja de la interfaz:', sheetName);
    
    // No permitir eliminar la hoja General
    if (sheetName === GENERAL_SHEET_NAME) {
      alert('No se puede eliminar la hoja General del sistema');
      return;
    }
    
    // Remover de la lista local (no de Google Sheets)
    const updatedSheets = availableSheets.filter(sheet => sheet !== sheetName);
    setAvailableSheets(updatedSheets);
    
    // Si la hoja eliminada era la actual, seleccionar otra
    if (currentSheet === sheetName) {
      const newCurrentSheet = updatedSheets[0] || GENERAL_SHEET_NAME;
      setCurrentSheet(newCurrentSheet);
      console.log('🔄 Cambiando a hoja:', newCurrentSheet);
    }
    
    console.log('✅ Hoja eliminada de la interfaz (datos en Google Sheets intactos)');
  };

  const handleRecoverSheet = (sheetName: string) => {
    console.log('🔄 Recuperando hoja:', sheetName);
    
    // Añadir a la lista local si no existe
    if (!availableSheets.includes(sheetName)) {
      setAvailableSheets(prev => [...prev, sheetName]);
      console.log('✅ Hoja recuperada y añadida a la interfaz:', sheetName);
    }
  };

  const processRecording = async (recording: AudioRecording) => {
    try {
      console.log('🚀 Iniciando procesamiento de grabación...');
      console.log('Grabación:', {
        id: recording.id,
        duration: recording.duration,
        size: recording.blob.size,
        type: recording.blob.type
      });

      setProcessingStatus('transcribing');
      setProcessingError('');
      setDebugInfo('Iniciando transcripción...');

      // Verificar configuración antes de procesar
      if (!configStatus.openai) {
        throw new Error('API Key de OpenAI no configurada');
      }

      // 1. Transcribir audio
      console.log('📝 Paso 1: Transcribiendo audio...');
      const transcription = await transcribeAudio(recording.blob);
      setDebugInfo(`✅ Transcripción completada: "${transcription.substring(0, 50)}..."`);
      
      // 2. Clasificar contenido según el tipo de hoja
      setProcessingStatus('classifying');
      const isGeneralSheet = currentSheet === GENERAL_SHEET_NAME;
      
      if (isGeneralSheet) {
        // Clasificación para notas generales
        setDebugInfo('Clasificando nota general con IA...');
        console.log('🤖 Paso 2: Clasificando contenido general...');
        const generalClassification = await classifyGeneralContent(transcription);
        setDebugInfo(`✅ Clasificación general completada: ${generalClassification.topic}`);

        // 3. Preparar datos para hoja General
        const generalSheetData = [
          new Date().toLocaleString('es-ES'),
          Math.round(recording.duration),
          transcription,
          generalClassification.topic,
          generalClassification.priority,
          generalClassification.pendingActions,
          generalClassification.summary
        ];
        
        setDebugInfo('Preparando datos para hoja General...');
        console.log('📊 Datos preparados (General):', generalSheetData);
        
        setProcessingStatus('uploading');
        setDebugInfo(`Enviando a Google Sheets (${currentSheet})...`);
        await appendToGoogleSheet([generalSheetData], currentSheet);
        
        setProcessingStatus('success');
        setDebugInfo(`✅ ¡Nota general procesada! Registro añadido a ${currentSheet}.`);
      } else {
        // Clasificación para notas de estudiantes (comportamiento original)
        setDebugInfo('Clasificando contenido con IA...');
        console.log('🤖 Paso 2: Clasificando contenido...');
        const classification = await classifyContent(transcription);
        setDebugInfo(`✅ Clasificación completada: ${classification.students?.length || 0} estudiante(s) detectado(s)`);

        // 3. Preparar datos para Google Sheets
        // Si hay múltiples estudiantes, crear una fila por cada uno
        const studentsData = classification.students || [];
        
        if (studentsData.length === 0) {
          // Fallback si no se detectaron estudiantes
          const sheetData = [
            new Date().toLocaleString('es-ES'),
            Math.round(recording.duration),
            transcription,
            'No detectado',
            'Otro',
            'Neutral',
            classification.generalSummary || transcription.substring(0, 100) + '...',
            classification.generalActions || ''
          ];
          
          setDebugInfo('Preparando datos para Google Sheets (sin estudiantes detectados)...');
          console.log('📊 Datos preparados (sin estudiantes):', sheetData);
          
          setProcessingStatus('uploading');
          setDebugInfo(`Enviando a Google Sheets (${currentSheet})...`);
          await appendToGoogleSheet([sheetData], currentSheet);
        } else {
          // Crear una fila por cada estudiante
          const allSheetData = studentsData.map((student, index) => [
            new Date().toLocaleString('es-ES'),
            Math.round(recording.duration),
            index === 0 ? transcription : `[Continuación] ${transcription}`,
            student.name,
            student.category,
            student.sentiment,
            student.summary + (classification.generalSummary ? ` | General: ${classification.generalSummary}` : ''),
            student.suggestedActions + (classification.generalActions ? ` | General: ${classification.generalActions}` : '')
          ]);
          
          setDebugInfo(`Preparando datos para ${studentsData.length} estudiante(s)...`);
          console.log('📊 Datos preparados (múltiples estudiantes):', allSheetData);
          
          setProcessingStatus('uploading');
          setDebugInfo(`Enviando ${studentsData.length} fila(s) a Google Sheets (${currentSheet})...`);
          await appendToGoogleSheet(allSheetData, currentSheet);
        }
        
        setProcessingStatus('uploading');
        setProcessingStatus('success');
        setDebugInfo(`✅ ¡Proceso completado! ${studentsData.length || 1} registro(s) añadido(s).`);
      }
      
      console.log('🎉 Proceso completado exitosamente!');
      
      // Limpiar el estado después de 3 segundos
      setTimeout(() => {
        setProcessingStatus('idle');
        setDebugInfo('');
        // Opcional: eliminar la grabación procesada
        deleteRecording(recording.id);
      }, 3000);

    } catch (error) {
      console.error('❌ Error processing recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setProcessingError(errorMessage);
      setDebugInfo(`❌ Error: ${errorMessage}`);
      setProcessingStatus('error');
      
      // Limpiar error después de 10 segundos
      setTimeout(() => {
        setProcessingStatus('idle');
        setProcessingError('');
        setDebugInfo('');
      }, 10000);
    }
  };

  const isProcessing = processingStatus !== 'idle' && processingStatus !== 'success' && processingStatus !== 'error';
  const hasConfigIssues = !configStatus.openai || !configStatus.googleSheetId || !configStatus.serviceAccount || !configStatus.privateKey;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Clasificador de Notas de Voz
                </h1>
                <p className="text-sm text-gray-600">
                  Seguimiento inteligente de estudiantes
                </p>
              </div>
            </div>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Configuration Warning */}
      {hasConfigIssues && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-4xl mx-auto flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Configuración incompleta:</strong> Faltan algunas variables de entorno. 
                Revisa el archivo .env y asegúrate de que todas las variables estén configuradas correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Course Management Section */}
          <div className="xl:col-span-1">
            <CourseManager
              availableSheets={availableSheets}
              currentSheet={currentSheet}
              onSheetChange={handleSheetChange}
              onCreateSheet={handleCreateSheet}
              onRenameSheet={handleRenameSheet}
              onDeleteSheet={handleDeleteSheet}
              onRecoverSheet={handleRecoverSheet}
              onRefreshSheets={loadAvailableSheets}
              isLoading={isLoadingSheets}
              generalSheetName={GENERAL_SHEET_NAME}
            />
          </div>
          
          {/* Recording Section */}
          <div className="xl:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              {currentSheet === GENERAL_SHEET_NAME ? 'Grabar Nota General' : 'Grabar Nueva Nota'}
            </h2>
            
            <div className="flex flex-col items-center space-y-6">
              <AudioRecorder
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isProcessing={isProcessing}
              />
              
              <ProcessingStatus 
                status={processingStatus} 
                error={processingError}
              />

              {/* Debug Info */}
              {debugInfo && (
                <div className="w-full p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700 font-mono">{debugInfo}</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Instrucciones:</h3>
              {currentSheet === GENERAL_SHEET_NAME ? (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Describe tu trabajo en el aula o tareas pendientes</li>
                  <li>• Menciona la prioridad y acciones necesarias</li>
                  <li>• Incluye reflexiones sobre metodología o gestión</li>
                  <li>• Habla de forma clara y pausada</li>
                </ul>
              ) : (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Menciona claramente los nombres de los estudiantes</li>
                  <li>• Describe el comportamiento o situación observada</li>
                  <li>• Habla de forma clara y pausada</li>
                  <li>• Cada grabación se procesará automáticamente</li>
                </ul>
              )}
            </div>
          </div>

          {/* Recordings List */}
          <div className="xl:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <RecordingsList
              recordings={recordings}
              onDeleteRecording={deleteRecording}
              onProcessRecording={processRecording}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Configuration Check */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Estado de Configuración</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${configStatus.openai ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">OpenAI API</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${configStatus.googleSheetId ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Google Sheet ID</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${configStatus.serviceAccount ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Service Account</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${configStatus.privateKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Private Key</span>
            </div>
          </div>
          
          {/* Debug Console Reminder */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Para debug detallado:</strong> Abre las herramientas de desarrollador (F12) → pestaña Console para ver logs completos
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Transcripción</h3>
            <p className="text-sm text-gray-600">
              Convierte automáticamente tu voz a texto usando OpenAI Whisper
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">
              {currentSheet === GENERAL_SHEET_NAME ? 'Análisis General' : 'Clasificación IA'}
            </h3>
            <p className="text-sm text-gray-600">
              {currentSheet === GENERAL_SHEET_NAME 
                ? 'Identifica temas, prioridades y acciones pendientes'
                : 'Extrae estudiantes, categorías y sentimientos del contenido'
              }
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Google Sheets</h3>
            <p className="text-sm text-gray-600">
              Organiza automáticamente los datos en tu hoja de cálculo
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;