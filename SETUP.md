# Guía de Configuración - Clasificador de Notas de Voz

## 📋 Requisitos Previos

- Cuenta de OpenAI con API key
- Cuenta de Google (para Google Sheets API)
- Cuenta de Supabase (gratuita)

## 🔑 1. Configurar OpenAI API

1. Ve a [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Copia la key (empieza con `sk-`)

## 📊 2. Configurar Google Sheets

### Crear la Hoja de Cálculo

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nómbrala "Notas de Voz - Estudiantes" (o el nombre que prefieras)
4. **Importante**: No necesitas crear encabezados manualmente
5. Los encabezados se añaden automáticamente al crear cursos desde la aplicación
6. Si quieres añadir encabezados manualmente, usa esta estructura:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Duración (seg) | Transcripción | Estudiantes | Categoría | Sentimiento | Resumen | Acciones |

7. Copia el ID de la hoja (está en la URL):
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```

### Configurar Google Cloud API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto:
   - Haz clic en "Nuevo Proyecto"
   - Nombre: "Notas-Voz-Profesor"
   - Haz clic en "Crear"

3. Habilitar Google Sheets API:
   - Ve a "APIs y servicios" → "Biblioteca"
   - Busca "Google Sheets API"
   - Haz clic en "Habilitar"

4. Crear Service Account:
   - Ve a "APIs y servicios" → "Credenciales"
   - Haz clic en "Crear credenciales" → "Cuenta de servicio"
   - Nombre: "sheets-access"
   - Descripción: "Acceso a Google Sheets para notas de voz"
   - Haz clic en "Crear y continuar"
   - Rol: "Editor" (o "Propietario")
   - Haz clic en "Continuar" → "Listo"

5. Generar clave privada:
   - En la lista de cuentas de servicio, haz clic en la que acabas de crear
   - Ve a la pestaña "Claves"
   - Haz clic en "Agregar clave" → "Crear nueva clave"
   - Selecciona "JSON"
   - Se descargará un archivo JSON

6. Extraer credenciales del archivo JSON:
   ```json
   {
     "client_email": "sheets-access@tu-proyecto.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```

7. Compartir la hoja de cálculo:
   - Abre tu Google Sheet
   - Haz clic en "Compartir"
   - Añade el `client_email` del service account
   - Dale permisos de "Editor"
   - Haz clic en "Enviar"

## 🗄️ 3. Configurar Supabase

1. Haz clic en "Connect to Supabase" en la esquina superior derecha de la aplicación
2. Sigue las instrucciones para crear tu proyecto
3. Las variables de entorno se configurarán automáticamente

## ⚙️ 4. Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto:

```bash
# OpenAI API Key
VITE_OPENAI_API_KEY=sk-tu-api-key-aqui

# Google Sheets Configuration
VITE_GOOGLE_SHEET_ID=tu-sheet-id-aqui
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-access@tu-proyecto.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-clave-privada-aqui\n-----END PRIVATE KEY-----\n"

# Supabase (se configurará automáticamente)
VITE_SUPABASE_URL=tu-supabase-url
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
```

**⚠️ Importante**: 
- La clave privada debe estar entre comillas dobles
- Mantén los `\n` en la clave privada
- No compartas este archivo (está en .gitignore)

## 🚀 5. Ejecutar la Aplicación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

## ✅ 6. Probar la Configuración

1. Abre la aplicación en tu navegador
2. **Crear un curso de prueba:**
   - Haz clic en "Nuevo" en la sección de Gestión de Cursos
   - Ingresa "Curso de Prueba"
   - Verifica que se cree una nueva pestaña en Google Sheets
3. **Probar grabación:**
   - Graba una nota de voz de prueba: "Hola, esto es una prueba con el estudiante Juan Pérez sobre su buen comportamiento en clase"
   - Haz clic en procesar
   - Verifica que aparezca una nueva fila en la pestaña del curso
4. **Probar gestión de cursos:**
   - Renombra el curso a "Prueba Completada"
   - Elimina el curso de la interfaz
   - Usa "Recuperar" para volver a añadirlo

## 🔧 Solución de Problemas

### Error: "API key not found"
- Verifica que `VITE_OPENAI_API_KEY` esté correctamente configurada
- Asegúrate de que la API key sea válida y tenga créditos

### Error: "Google Sheets access denied"
- Verifica que el service account tenga acceso a la hoja
- Comprueba que el `VITE_GOOGLE_SHEET_ID` sea correcto
- Asegúrate de que la clave privada esté correctamente formateada

### Error: "Microphone access denied"
- Permite el acceso al micrófono en tu navegador
- Usa HTTPS (la aplicación debe estar en un dominio seguro)

### La transcripción no es precisa
- Habla más despacio y claro
- Reduce el ruido de fondo
- Asegúrate de que el micrófono funcione correctamente

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisa que todos los pasos se hayan seguido correctamente
2. Verifica que todas las variables de entorno estén configuradas
3. Comprueba la consola del navegador para errores específicos
4. Abre un issue en GitHub con detalles del problema

## 🔒 Seguridad

- Nunca compartas tu archivo `.env`
- Revisa regularmente el uso de tu API de OpenAI
- Considera rotar las claves periódicamente
- Mantén actualizadas las dependencias