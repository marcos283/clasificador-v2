import React, { useState } from 'react';
import { Plus, BookOpen, Loader2, Check, X, Edit2, Trash2, MoreVertical, RefreshCw, Search } from 'lucide-react';

interface CourseManagerProps {
  availableSheets: string[];
  currentSheet: string;
  onSheetChange: (sheetName: string) => void;
  onCreateSheet: (sheetName: string) => Promise<void>;
  onRenameSheet: (oldName: string, newName: string) => Promise<void>;
  onDeleteSheet: (sheetName: string) => void;
  onRecoverSheet: (sheetName: string) => void;
  onRefreshSheets: () => Promise<void>;
  isLoading: boolean;
}

export function CourseManager({
  availableSheets,
  currentSheet,
  onSheetChange,
  onCreateSheet,
  onRenameSheet,
  onDeleteSheet,
  onRecoverSheet,
  onRefreshSheets,
  isLoading
}: CourseManagerProps) {
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

    try {
      setIsCreatingSheet(true);
      setCreateError('');
      await onCreateSheet(newSheetName.trim());
      setNewSheetName('');
      setIsCreating(false);
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
    if (confirm(`¿Estás seguro de que quieres eliminar el curso "${sheetName}" de la interfaz?\n\nNota: Los datos en Google Sheets se mantendrán intactos.`)) {
      onDeleteSheet(sheetName);
      setActiveMenu(null);
    }
  };

  const toggleMenu = (sheetName: string) => {
    setActiveMenu(activeMenu === sheetName ? null : sheetName);
  };

  // Cerrar menú al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Gestión de Cursos
            </h2>
            <p className="text-sm text-gray-600">
              Selecciona, crea o edita cursos
            </p>
          </div>
        </div>
        
        {!isCreating && !showRecovery && (
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshSheets}
              disabled={isLoading || isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              title="Actualizar lista de cursos"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleShowRecovery}
              disabled={isLoading || isRecovering}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              title="Recuperar cursos existentes"
            >
              <Search className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsCreating(true)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </div>
        )}
      </div>

      {/* Current Course Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-blue-800">Curso Activo:</span>
          <span className="text-sm text-blue-700 font-semibold">{currentSheet}</span>
        </div>
      </div>

      {/* Create New Sheet Form */}
      {isCreating && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-medium text-gray-800 mb-3">Crear Nuevo Curso</h3>
          
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Nombre del curso (ej: Matemáticas 5A)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isCreatingSheet}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSheet()}
              />
              {createError && (
                <p className="text-sm text-red-600 mt-1">{createError}</p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCreateSheet}
                disabled={isCreatingSheet || !newSheetName.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isCreatingSheet ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isCreatingSheet ? 'Creando...' : 'Crear'}</span>
              </button>
              
              <button
                onClick={handleCancel}
                disabled={isCreatingSheet}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Mode */}
      {showRecovery && (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-orange-800">Recuperar Cursos Existentes</h3>
            <button
              onClick={handleCancelRecovery}
              className="text-orange-600 hover:text-orange-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {isRecovering ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              <span className="ml-2 text-orange-700">Buscando cursos en Google Sheets...</span>
            </div>
          ) : recoverable.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-orange-700">No hay cursos adicionales para recuperar</p>
              <p className="text-sm text-orange-600 mt-1">
                Todos los cursos de Google Sheets ya están en la interfaz
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-orange-700 mb-3">
                Cursos encontrados en Google Sheets que no están en la interfaz:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {recoverable.map((sheetName) => (
                  <div
                    key={sheetName}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-gray-700">{sheetName}</span>
                    </div>
                    <button
                      onClick={() => handleRecoverSheet(sheetName)}
                      className="flex items-center space-x-2 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Recuperar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available Sheets List */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">Cursos Disponibles ({availableSheets.length})</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Cargando cursos...</span>
          </div>
        ) : availableSheets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay cursos disponibles</p>
            <p className="text-sm mt-1">Crea tu primer curso para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {availableSheets.map((sheetName) => (
              <div
                key={sheetName}
                className={`
                  relative rounded-lg border transition-all
                  ${currentSheet === sheetName
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                {editingSheet === sheetName ? (
                  // Modo edición
                  <div className="p-3">
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
                      onClick={() => onSheetChange(sheetName)}
                      className="flex-1 p-3 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          currentSheet === sheetName ? 'text-blue-800' : 'text-gray-700'
                        }`}>
                          {sheetName}
                        </span>
                        {currentSheet === sheetName && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                    
                    {/* Menú de opciones */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(sheetName);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeMenu === sheetName && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(sheetName);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Renombrar curso</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(sheetName);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar de la interfaz</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Instrucciones:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Cada curso tendrá su propia pestaña en Google Sheets</li>
          <li>• Las grabaciones se guardarán en el curso seleccionado</li>
          <li>• Puedes renombrar cursos (actualiza Google Sheets)</li>
          <li>• Eliminar solo quita el curso de la interfaz, no de Google Sheets</li>
          <li>• Usa "Recuperar" para añadir cursos existentes de Google Sheets</li>
          <li>• El botón "Actualizar" sincroniza con Google Sheets</li>
          <li>• Los encabezados se añaden automáticamente a nuevos cursos</li>
        </ul>
      </div>
    </div>
  );
}