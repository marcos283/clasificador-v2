import React, { useState, useEffect } from 'react';
import { AudioRecorder } from './components/AudioRecorder';
import { RecordingsList } from './components/RecordingsList';
import { ProcessingStatus } from './components/ProcessingStatus';
import { SettingsMenu } from './components/SettingsMenu';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { transcribeAudio, classifyContent, classifyGeneralContent, classifyLeadsContent } from './services/openai';
import { appendToGoogleSheet, appendToAlumnosSheet, listGoogleSheetsTabs, createGoogleSheetTab, renameGoogleSheetTab } from './services/googleSheets';
import type { AudioRecording } from './types';
import { BookOpen, ChevronDown, AlertTriangle } from 'lucide-react';

type ProcessingStatus = 'idle' | 'transcribing' | 'classifying' | 'uploading' | 'success' | 'error';

const GENERAL_SHEET_NAME = 'General';
const LEADS_SHEET_NAME = 'Leads';

function App() {
  const { isRecording, recordings, startRecording, stopRecording, deleteRecording } = useAudioRecorder();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingError, setProcessingError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [currentSheet, setCurrentSheet] = useState<string>('Sheet1');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
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
    console.log('- GOOGLE_SHEET_ID:', import.meta.env.VITE_GOOGLE_SHEET_ID ? 'CONFIGURADA' : 'NO CONFIGURADA');
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
      setExtractedData(null); // Limpiar datos previos

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
      const isLeadsSheet = currentSheet === LEADS_SHEET_NAME;
      
      if (isLeadsSheet) {
        // 🆕 NUEVA: Clasificación para leads
        setDebugInfo('Extrayendo datos de leads con IA...');
        console.log('🎯 Paso 2: Extrayendo datos de leads...');
        const leadsClassification = await classifyLeadsContent(transcription);
        
        // Guardar datos extraídos para mostrar en pantalla
        setExtractedData({
          type: 'leads',
          transcription: transcription,
          data: leadsClassification.leads || []
        });
        
        setDebugInfo(`✅ Extracción de leads completada: ${leadsClassification.leads?.length || 0} lead(s) detectado(s)`);

        // 3. Preparar datos para hoja Leads
        const leadsData = leadsClassification.leads || [];
        
        if (leadsData.length === 0) {
          // Fallback si no se detectaron leads
          const leadSheetData = [
            null, // Nombre
            null, // Apellidos
            null, // DNI
            null, // Fecha nacimiento
            null, // Teléfono
            null, // Email
            null, // ID de Contacto
            null, // Situación laboral
            null, // Curso Terminado
            null, // Interés
            null, // Disponibilidad
            transcription.substring(0, 200) + (transcription.length > 200 ? '...' : ''), // Notas
            null, // Whatsapp
            null, // Registro ED
            new Date().toLocaleDateString('en-GB') // Fecha (DD/MM/YYYY)
          ];
          
          setDebugInfo('Preparando datos para Google Sheets (sin leads detectados)...');
          console.log('📊 Datos preparados (sin leads):', leadSheetData);
          
          setProcessingStatus('uploading');
          setDebugInfo(`Enviando a Google Sheets (${currentSheet})...`);
          await appendToGoogleSheet([leadSheetData], currentSheet);

          // También enviar a la hoja Alumnos si estamos en Leads
          if (currentSheet === LEADS_SHEET_NAME) {
            setDebugInfo(`Enviando también a hoja Alumnos...`);
            await appendToAlumnosSheet([leadSheetData]);
          }
        } else {
          // Crear una fila por cada lead
          const allLeadsData = leadsData.map(lead => [
            lead.nombre,
            lead.apellidos,
            lead.dni,
            lead.fechaNacimiento,
            lead.telefono,
            lead.email,
            lead.idContacto || '',
            lead.situacionLaboral || '',
            lead.cursoTerminado || '',
            lead.interes || '',
            lead.disponibilidad || '',
            lead.notas,
            lead.whatsapp || '',
            lead.registroED || '',
            new Date().toLocaleDateString('en-GB') // Timestamp (DD/MM/YYYY) ahora en última posición
          ]);
          
          setDebugInfo(`Preparando datos para ${leadsData.length} lead(s)...`);
          console.log('📊 Datos preparados (múltiples leads):', allLeadsData);
          
          setProcessingStatus('uploading');
          setDebugInfo(`Enviando ${leadsData.length} lead(s) a Google Sheets (${currentSheet})...`);
          await appendToGoogleSheet(allLeadsData, currentSheet);

          // También enviar a la hoja Alumnos si estamos en Leads
          if (currentSheet === LEADS_SHEET_NAME) {
            setDebugInfo(`Enviando ${leadsData.length} lead(s) también a hoja Alumnos...`);
            await appendToAlumnosSheet(allLeadsData);
          }
        }
        
        setProcessingStatus('success');
        const message = currentSheet === LEADS_SHEET_NAME
          ? `✅ ¡Leads procesados! ${leadsData.length || 1} registro(s) añadido(s) a ${currentSheet} y hoja Alumnos.`
          : `✅ ¡Leads procesados! ${leadsData.length || 1} registro(s) añadido(s) a ${currentSheet}.`;
        setDebugInfo(message);
      } else if (isGeneralSheet) {
        // Clasificación para notas generales
        setDebugInfo('Clasificando nota general con IA...');
        console.log('🤖 Paso 2: Clasificando contenido general...');
        const generalClassification = await classifyGeneralContent(transcription);
        setDebugInfo(`✅ Clasificación general completada: ${generalClassification.topic}`);

        // 3. Preparar datos para hoja General
        const generalSheetData = [
          new Date().toLocaleDateString('es-ES'),
          new Date().toLocaleTimeString('es-ES'),
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
            new Date().toLocaleDateString('es-ES'),
            new Date().toLocaleTimeString('es-ES'),
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
            new Date().toLocaleDateString('es-ES'),
            new Date().toLocaleTimeString('es-ES'),
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

  const getSheetDisplayName = (sheetName: string) => {
    if (sheetName === GENERAL_SHEET_NAME) {
      return 'General';
    }
    return sheetName;
  };

  const getSheetColor = (sheetName: string) => {
    if (sheetName === GENERAL_SHEET_NAME) {
      return 'text-purple-600 bg-purple-50';
    }
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Clasificador de Notas de Voz
                </h1>
              </div>
            </div>
            
            {/* Settings Menu Button */}
            <div className="relative">
              <button
                data-settings-button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Configuración</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSettingsMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showSettingsMenu && (
                <div className="fixed inset-0 z-40 sm:relative sm:inset-auto">
                  {/* Overlay para móvil */}
                  <div className="fixed inset-0 bg-black bg-opacity-25 sm:hidden" onClick={() => setShowSettingsMenu(false)}></div>
                  
                  {/* Menú */}
                  <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:right-0 sm:top-full sm:left-auto sm:bottom-auto sm:mt-2 sm:w-96">
                    <SettingsMenu
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
                      configStatus={configStatus}
                      onClose={() => setShowSettingsMenu(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Configuration Warning */}
      {hasConfigIssues && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-2xl mx-auto flex">
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Current Course Display */}
        <div className="mb-6">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${getSheetColor(currentSheet)}`}>
            <div className={`w-2 h-2 rounded-full ${currentSheet === GENERAL_SHEET_NAME ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
            <span className="text-sm font-medium">
              Curso activo: {getSheetDisplayName(currentSheet)}
            </span>
          </div>
        </div>

        {/* Recording Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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

            {/* Extracted Data Display */}
            {extractedData && (
              <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Datos Extraídos</h3>
                
                {/* Transcription */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">🎙️ Transcripción:</h4>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded border italic">
                    "{extractedData.transcription}"
                  </p>
                </div>

                {/* Leads Data */}
                {extractedData.type === 'leads' && extractedData.data.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">👤 Leads Detectados ({extractedData.data.length}):</h4>
                    {extractedData.data.map((lead: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border mb-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Nombre:</strong> {lead.nombre || '(no especificado)'}</div>
                          <div><strong>Apellidos:</strong> {lead.apellidos || '(no especificado)'}</div>
                          <div><strong>Teléfono:</strong> {lead.telefono || '(no especificado)'}</div>
                          <div><strong>Email:</strong> {lead.email || '(no especificado)'}</div>
                          <div><strong>DNI:</strong> {lead.dni || '(no especificado)'}</div>
                          <div><strong>F. Nacimiento:</strong> {lead.fechaNacimiento || '(no especificado)'}</div>
                          <div><strong>Edad:</strong> {lead.edad || '(no calculada)'}</div>
                          <div><strong>Estado:</strong> <span className="font-semibold text-blue-600">{lead.estado}</span></div>
                          <div className="col-span-2"><strong>Notas:</strong> {lead.notas}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recordings List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <RecordingsList
            recordings={recordings}
            onDeleteRecording={deleteRecording}
            onProcessRecording={processRecording}
            isProcessing={isProcessing}
          />
        </div>
      </main>
    </div>
  );
}

export default App;