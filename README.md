# Clasificador de Notas de Voz para Profesores

Una aplicación web que permite a los profesores grabar notas de voz sobre estudiantes, transcribirlas automáticamente, clasificar el contenido usando IA y organizarlo en Google Sheets.

## 🚀 Características

- **Grabación de Audio**: Interfaz simple para grabar notas de voz
- **Transcripción Automática**: Convierte audio a texto usando OpenAI Whisper
- **Clasificación Inteligente**: Extrae estudiantes, categorías y sentimientos usando GPT-3.5
- **Integración Google Sheets**: Organiza automáticamente los datos
- **Escritura Dual para Leads**: Cuando se usa la hoja "Leads", escribe automáticamente en dos Google Sheets
- **Gestión Avanzada de Cursos**: Crear, renombrar, eliminar y recuperar cursos
- **Sincronización Inteligente**: Mantiene la interfaz sincronizada con Google Sheets
- **Interfaz Moderna**: Diseño responsive y fácil de usar

## 📋 Estructura de Google Sheets

Cada curso se organiza en una pestaña separada de Google Sheets con estas columnas:

### Hojas de Cursos (Estudiantes)
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Fecha | Hora | Duración (seg) | Transcripción | Estudiantes | Categoría | Sentimiento | Resumen | Acciones |

### Hoja General
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Fecha | Hora | Duración (seg) | Transcripción | Tema | Prioridad | Acciones Pendientes | Resumen |

### Hoja Leads (Escritura Dual)
| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Nombre | Apellidos | DNI | Fecha nacimiento | Teléfono | Email | ID de Contacto | Situación laboral | Curso Terminado | Interés | Disponibilidad | Notas | Whatsapp | Registro ED | Fecha |

**⚡ Funcionalidad Especial**: Cuando se usa la hoja "Leads", los datos se escriben automáticamente en:
1. **Sheet Principal**: Tu Google Sheet configurado en `.env`
2. **Sheet Alumnos**: Google Sheet adicional para centralizar leads

**Nota**: Los encabezados se añaden automáticamente al crear nuevos cursos.

### Categorías Disponibles:
- Comportamiento
- Rendimiento  
- Participación
- Asistencia
- Social
- Otro

### Sentimientos:
- Positivo
- Neutral
- Negativo

## 🎓 Gestión de Cursos

### Funcionalidades Disponibles

#### 📚 Crear Nuevo Curso
- Haz clic en el botón **"Nuevo"** (verde con icono +)
- Ingresa el nombre del curso (ej: "Matemáticas 5A", "Historia 2B")
- El sistema creará automáticamente una nueva pestaña en Google Sheets
- Los encabezados se añaden automáticamente
- El curso se selecciona automáticamente como activo

#### ✏️ Renombrar Curso
- Haz clic en el menú de opciones (⋮) junto al nombre del curso
- Selecciona **"Renombrar curso"**
- Ingresa el nuevo nombre
- El cambio se aplica tanto en la interfaz como en Google Sheets

#### 🗑️ Eliminar de la Interfaz
- Haz clic en el menú de opciones (⋮) junto al nombre del curso
- Selecciona **"Eliminar de la interfaz"**
- **Importante**: Esto solo elimina el curso de la interfaz local
- Los datos en Google Sheets permanecen intactos
- Puedes recuperar el curso más tarde

#### 🔄 Actualizar Lista
- Haz clic en el botón **"Actualizar"** (azul con icono de refresh)
- Sincroniza la interfaz con el estado actual de Google Sheets
- Útil cuando trabajas desde múltiples dispositivos
- Detecta cambios realizados directamente en Google Sheets

#### 🔍 Recuperar Cursos Existentes
- Haz clic en el botón **"Recuperar"** (naranja con icono de búsqueda)
- El sistema escanea todas las pestañas en Google Sheets
- Muestra cursos que existen en Google Sheets pero no en la interfaz
- Haz clic en **"Recuperar"** junto al curso deseado
- El curso aparece inmediatamente en la interfaz

### Casos de Uso Comunes

**Cambio de Dispositivo:**
1. Abre la aplicación en el nuevo dispositivo
2. Haz clic en "Recuperar cursos existentes"
3. Selecciona los cursos que necesitas

**Eliminación Accidental:**
1. Si eliminaste un curso de la interfaz por error
2. Usa "Recuperar cursos existentes"
3. El curso aparecerá en la lista para recuperar

**Trabajo Colaborativo:**
1. Si otro profesor creó cursos en la misma hoja
2. Usa "Actualizar" para sincronizar
3. O "Recuperar" para añadir cursos específicos

**Organización de Cursos:**
1. Crea cursos por materia y grado (ej: "Matemáticas 5A")
2. Renombra cursos al cambiar de período escolar
3. Elimina de la interfaz cursos de períodos anteriores
4. Recupera cursos cuando los necesites nuevamente

## 🛠️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# OpenAI API Key
VITE_OPENAI_API_KEY=tu_api_key_de_openai

# Google Sheets Configuration
VITE_GOOGLE_SHEET_ID=id_de_tu_google_sheet
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=email_de_service_account
VITE_GOOGLE_PRIVATE_KEY=clave_privada_del_service_account

# Supabase (se configurará automáticamente)
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 2. Configurar Google Sheets API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Google Sheets API
4. Crea credenciales (Service Account):
   - Ve a "Credenciales" → "Crear credenciales" → "Cuenta de servicio"
   - Descarga el archivo JSON con las credenciales
   - Extrae el `client_email` y `private_key`
5. Comparte tu Google Sheet con el email del service account (con permisos de edición)

### ⚡ Configuración Adicional para Escritura Dual

**Para que funcione la escritura dual en la hoja "Leads":**

1. **Comparte también el Google Sheet de Alumnos** con el mismo service account
   - Ve al Google Sheet de Alumnos: https://docs.google.com/spreadsheets/d/1OSUQABQTG6WHSUPVMRGyMgZpq-APb0tkHzldj0pAASo/
   - Haz clic en "Compartir"
   - Agrega el mismo email del service account (el de tu archivo `.env`)
   - Dale permisos de "Editor"

2. **Crear pestaña "Alumnos"** en el Google Sheet adicional:
   - El sistema creará automáticamente la pestaña si no existe
   - Los encabezados se añaden automáticamente con la estructura de Leads

### 3. Configurar Supabase

1. Haz clic en "Connect to Supabase" en la esquina superior derecha
2. Sigue las instrucciones para configurar tu proyecto Supabase
3. Las variables de entorno se configurarán automáticamente

## 🚀 Instalación y Uso

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📱 Cómo Usar

1. **Seleccionar Curso**: Desde el menú de configuración, elige el tipo de hoja:
   - **Cursos específicos**: Para notas sobre estudiantes
   - **General**: Para notas y tareas generales
   - **Leads**: Para datos de contacto (⚡ escritura dual automática)

2. **Grabar**: Haz clic en el botón del micrófono para grabar tu nota de voz

3. **Procesar**: Haz clic en el botón de subida para procesar la grabación

4. **Revisar**: Los datos se enviarán automáticamente:
   - **Hojas normales**: Solo al Google Sheet principal
   - **Hoja "Leads"**: Al Google Sheet principal Y al Sheet de Alumnos

### Consejos para Mejores Resultados:

**Para notas de estudiantes:**
- Menciona claramente los nombres de los estudiantes
- Describe específicamente el comportamiento o situación

**Para leads (datos de contacto):**
- Dicta claramente nombres, apellidos y datos de contacto
- Incluye información como: "María González, teléfono 123-456-789, email maria@gmail.com"
- Menciona el estado del lead: "está interesada", "no le interesa", "lo va a pensar"

**General:**
- Habla de forma clara y pausada
- Evita ruido de fondo

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Tailwind CSS
- **Transcripción**: OpenAI Whisper API
- **Clasificación**: OpenAI GPT-3.5-turbo
- **Base de Datos**: Supabase (para futuras funcionalidades)
- **Almacenamiento**: Google Sheets
- **Deploy**: Netlify

## 🔒 Seguridad

- Las API keys se manejan como variables de entorno
- No se almacenan audios permanentemente (solo transcripciones)
- Autenticación a través de service accounts de Google

## 🛣️ Roadmap

Ver [TODO.md](./TODO.md) para la lista completa de funcionalidades planificadas.

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas, abre un issue en GitHub.