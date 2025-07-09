import React, { useState } from 'react';
import { Plus, BookOpen, Loader2, Check, X, Edit2, Trash2, MoreVertical, RefreshCw, Search, Settings, AlertCircle } from 'lucide-react';

interface SettingsMenuProps {
  availableSheets: string[];
  currentSheet: string;
  onSheetChange: (sheetName: string) => void;
  onCreateSheet: (sheetName: string) => Promise<void>;
  onRenameSheet: (oldName: string, newName: string) => Promise<void>;
  onDeleteSheet: (sheetName: string) => void;
  onRecoverSheet: (sheetName: string) => void;
  onRefreshSheets: () => Promise<void>;
  isLoading: boolean;
  generalSheetName: string;
  configStatus: {
    openai: boolean;
    googleSheetId: boolean;
    serviceAccount: boolean;
    privateKey: boolean;
  };
  onClose: () => void;
}

export function SettingsMenu({
  availableSheets,
  currentSheet,
  onSheetChange,
  onCreateSheet,
  onRenameSheet,
  onDeleteSheet,
  onRecoverSheet,
  onRefreshSheets,
  isLoading,
  generalSheetName,
  configStatus,
  onClose
}: SettingsMenuProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [allSheetsFromGoogle, setAllSheetsFromGoogle] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para edición
  const [editingSheet, setEditingSheet] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Estados para menú de opciones
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleRefreshSheets = async () => {
    try {
      setIsRefreshing(true);
      await onRefreshSheets();
    } catch (error) {
      console.error('Error refreshing sheets:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowRecovery = async () => {
    try {
      setIsRecovering(true);
      setShowRecovery(true);
      
      // Obtener todas las hojas desde Google Sheets
      const { listGoogleSheetsTabs } = await import('../services/googleSheets');
      const allSheets = await listGoogleSheetsTabs();
      setAllSheetsFromGoogle(allSheets);
      
    } catch (error) {
      console.error('Error loading sheets for recovery:', error);
      alert('Error al cargar las hojas de Google Sheets');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRecoverSheet = (sheetName: string) => {
    onRecoverSheet(sheetName);
    setShowRecovery(false);
    setAllSheetsFromGoogle([]);
  };

  const handleCancelRecovery = () => {
    setShowRecovery(false);
    setAllSheetsFromGoogle([]);
  };

  // Obtener hojas que existen en Google Sheets pero no en la interfaz
  const recoverable = allSheetsFromGoogle.filter(sheet => !availableSheets.includes(sheet));

  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) {
      setCreateError('El nombre del curso no puede estar vacío');
      return;
    }

    if (availableSheets.includes(newSheetName.trim())) {
      setCreateError('Ya existe un curso con ese nombre');
      return;
    }

    if (newSheetName.trim() === generalSheetName) {
      setCreateError('No puedes crear un curso con el nombre reservado "General"');
      return;
    }

    try {
      setIsCreatingSheet(true);
      setCreateError('');
      await onCreateSheet(newSheetName.trim());
      setNewSheetName('');
      setIsCreating(false);
      onClose();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Error al crear el curso');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewSheetName('');
    setCreateError('');
  };

  const startEditing = (sheetName: string) => {
    // No permitir editar la hoja General
    if (sheetName === generalSheetName) {
      return;
    }
    setEditingSheet(sheetName);
    setEditName(sheetName);
    setEditError('');
    setActiveMenu(null);
  };

  const handleRename = async () => {
    if (!editName.trim()) {
      setEditError('El nombre del curso no puede estar vacío');
      return;
    }

    if (editName.trim() === editingSheet) {
      cancelEditing();
      return;
    }

    if (availableSheets.includes(editName.trim())) {
      setEditError('Ya existe un curso con ese nombre');
      return;
    }

    if (editName.trim() === generalSheetName) {
      setEditError('No puedes usar el nombre reservado "General"');
      return;
    }

    try {
      setIsRenaming(true);
      setEditError('');
      await onRenameSheet(editingSheet!, editName.trim());
      cancelEditing();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Error al renombrar el curso');
    } finally {
      setIsRenaming(false);
    }
  };

  const cancelEditing = () => {
    setEditingSheet(null);
    setEditName('');
    setEditError('');
  };

  const handleDelete = (sheetName: string) => {
    // No permitir eliminar la hoja General
    if (sheetName === generalSheetName) {
      return;
    }
    if (confirm(`¿Estás seguro de que quieres eliminar el curso "${sheetName}" de la interfaz?\n\nNota: Los datos en Google Sheets se mantendrán intactos.`)) {
      onDeleteSheet(sheetName);
      setActiveMenu(null);
    }
  };

  const toggleMenu = (sheetName: string) => {
    setActiveMenu(activeMenu === sheetName ? null : sheetName);
  };

  const handleSheetSelect = (sheetName: string) => {
    onSheetChange(sheetName);
    onClose();
  };

  const getSheetIcon = (sheetName: string) => {
    if (sheetName === generalSheetName) {
      return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>;
    }
    return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
  };

  const getSheetDescription = (sheetName: string) => {
    if (sheetName === generalSheetName) {
      return 'Notas generales del aula';
    }
    return 'Notas de estudiantes';
  };

  // Cerrar menú al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.settings-menu')) {
        onClose();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div className="settings-menu absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Configuración</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3">Estado de Configuración</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${configStatus.openai ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">OpenAI API</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${configStatus.googleSheetId ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">Google Sheet ID</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${configStatus.serviceAccount ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">Service Account</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${configStatus.privateKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">Private Key</span>
          </div>
        </div>
      </div>

      {/* Course Management */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-800">Gestión de Cursos</h4>
          <div className="flex space-x-1">
            <button
              onClick={handleRefreshSheets}
              disabled={isLoading || isRefreshing}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
              title="Actualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleShowRecovery}
              disabled={isLoading || isRecovering}
              className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
              title="Recuperar cursos"
            >
              <Search className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsCreating(true)}
              disabled={isLoading}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Nuevo curso"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create New Sheet Form */}
        {isCreating && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <h5 className="font-medium text-gray-800 mb-2">Crear Nuevo Curso</h5>
            
            <div className="space-y-2">
              <input
                type="text"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Nombre del curso"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isCreatingSheet}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSheet()}
              />
              {createError && (
                <p className="text-xs text-red-600">{createError}</p>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateSheet}
                  disabled={isCreatingSheet || !newSheetName.trim()}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isCreatingSheet ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span>{isCreatingSheet ? 'Creando...' : 'Crear'}</span>
                </button>
                
                <button
                  onClick={handleCancel}
                  disabled={isCreatingSheet}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Mode */}
        {showRecovery && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-orange-800">Recuperar Cursos</h5>
              <button
                onClick={handleCancelRecovery}
                className="text-orange-600 hover:text-orange-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {isRecovering ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span className="ml-2 text-sm text-orange-700">Buscando...</span>
              </div>
            ) : recoverable.length === 0 ? (
              <p className="text-sm text-orange-700">No hay cursos para recuperar</p>
            ) : (
              <div className="space-y-2">
                {recoverable.map((sheetName) => (
                  <div
                    key={sheetName}
                    className="flex items-center justify-between p-2 bg-white rounded border border-orange-200"
                  >
                    <span className="text-sm font-medium text-gray-700">{sheetName}</span>
                    <button
                      onClick={() => handleRecoverSheet(sheetName)}
                      className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Recuperar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Sheets List */}
        <div>
          <h5 className="font-medium text-gray-800 mb-2">Cursos Disponibles ({availableSheets.length})</h5>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-600">Cargando...</span>
            </div>
          ) : availableSheets.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No hay cursos disponibles</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableSheets.map((sheetName) => (
                <div
                  key={sheetName}
                  className={`
                    relative rounded border transition-all
                    ${currentSheet === sheetName
                      ? sheetName === generalSheetName 
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  {editingSheet === sheetName ? (
                    // Modo edición
                    <div className="p-2">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isRenaming}
                          onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                          autoFocus
                        />
                        {editError && (
                          <p className="text-xs text-red-600">{editError}</p>
                        )}
                        <div className="flex space-x-2">
                          <button
                            onClick={handleRename}
                            disabled={isRenaming || !editName.trim()}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {isRenaming ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>{isRenaming ? 'Guardando...' : 'Guardar'}</span>
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isRenaming}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Modo normal
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleSheetSelect(sheetName)}
                        className="flex-1 p-2 text-left"
                      >
                        <div className="flex items-center space-x-2">
                          {getSheetIcon(sheetName)}
                          <div>
                            <span className={`text-sm font-medium ${
                              currentSheet === sheetName 
                                ? sheetName === generalSheetName ? 'text-purple-800' : 'text-blue-800'
                                : 'text-gray-700'
                            }`}>
                              {sheetName}
                            </span>
                            <p className="text-xs text-gray-500">{getSheetDescription(sheetName)}</p>
                          </div>
                        </div>
                      </button>
                      
                      {/* Menú de opciones (solo para cursos, no para General) */}
                      {sheetName !== generalSheetName && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(sheetName);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                          
                          {activeMenu === sheetName && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(sheetName);
                                }}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Renombrar</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(sheetName);
                                }}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-800 mb-2">Instrucciones:</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Cada curso tiene su propia pestaña en Google Sheets</li>
            <li>• "General" es para notas del aula y tareas pendientes</li>
            <li>• Los otros cursos son para notas sobre estudiantes</li>
            <li>• Puedes renombrar cursos (actualiza Google Sheets)</li>
            <li>• "Eliminar" solo quita de la interfaz, no de Google Sheets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}