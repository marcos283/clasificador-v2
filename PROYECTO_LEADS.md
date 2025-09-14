# 📋 PROYECTO: EXTENSIÓN LEADS - CLASIFICADOR DE NOTAS DE VOZ

## 🎯 OBJETIVO DEL PROYECTO

Extender el **Clasificador de Notas de Voz v2** para incluir funcionalidad de **registro de leads** (posibles estudiantes), permitiendo capturar información de contacto de manera estructurada y organizarla en Google Sheets para posterior exportación a CRM.

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### Sistema Base (v1.0) - ✅ **COMPLETADO**
- **Grabación de notas de voz** con transcripción automática (OpenAI Whisper)
- **Clasificación inteligente** de contenido (GPT-3.5)
- **Gestión avanzada de cursos** (crear, renombrar, eliminar, recuperar)
- **Integración completa con Google Sheets** (API nativa, sin librerías)
- **Dos tipos de notas**:
  - 📚 **Cursos específicos**: Para estudiantes individuales
  - 📋 **General**: Para notas administrativas

### Funcionalidades Técnicas Implementadas:
- ✅ Autenticación JWT con Google Service Account
- ✅ Operaciones CRUD en Google Sheets
- ✅ Sincronización bidireccional app ↔ Google Sheets
- ✅ Manejo robusto de errores y validaciones
- ✅ Interface responsive con gestión de estado avanzada

---

## 🆕 NUEVA FUNCIONALIDAD: GESTIÓN DE LEADS VÍA VOZ

### Propósito:
Permitir a los profesores **registrar información de posibles estudiantes** (leads) mediante **notas de voz**, con extracción automática de datos usando IA y organización estructurada en Google Sheets.

### Casos de Uso:
- **Ferias educativas**: Grabar rápidamente datos de contactos interesados
- **Consultas telefónicas**: Dictar información mientras se habla con padres/estudiantes  
- **Visitas presenciales**: Registro vocal inmediato de posibles matrículas
- **Referencias**: Grabar contactos recomendados con todos los detalles

### 🎙️ **Flujo de Trabajo Propuesto:**
1. **Usuario selecciona hoja "Leads"** desde el menú de configuración
2. **App detecta automáticamente** el contexto de leads y adapta comportamiento
3. **Usuario graba nota de voz** con información de contacto:
   *"María González López, teléfono 654-321-987, email maria@gmail.com, DNI 12345678A, nació el 15 de mayo de 1990, tiene 34 años, está muy interesada en el curso de inglés"*
4. **IA procesa automáticamente** y extrae datos estructurados
5. **Sistema inserta** directamente en las columnas correctas de Google Sheets

---

## 📋 ESTRUCTURA DE DATOS PARA LEADS

### Hoja "Leads" - ✅ **CREADA MANUALMENTE**
| Columna | Tipo | Descripción | Obligatorio |
|---------|------|-------------|-------------|
| **Fecha** | Date | Fecha de registro del lead | ✅ |
| **Nombre** | Text | Nombre del posible estudiante | ✅ |
| **Apellidos** | Text | Apellidos completos | ✅ |
| **Teléfono** | Text | Número de contacto | ✅ |
| **Email** | Email | Correo electrónico | ✅ |
| **DNI** | Text | Documento de identidad | ❌ |
| **Fecha Nacimiento** | Date | Fecha de nacimiento | ❌ |
| **Edad** | Number | Edad calculada o manual | ❌ |
| **Estado** | Select | Estado del lead en el proceso | ✅ |
| **Notas** | Text | Observaciones adicionales | ❌ |

### Estados Predefinidos del Lead:
- 🆕 **Nuevo** - Lead recién registrado
- 📞 **Contactado** - Ya se estableció primer contacto
- 💚 **Interesado** - Mostró interés en los cursos
- ❌ **No interesado** - No interesado por el momento
- 📤 **Enviado al CRM** - Transferido al sistema principal

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### ✅ **FASE 1: PREPARACIÓN** 
- [x] **Análisis completo** del sistema actual
- [x] **Identificación** de funcionalidades existentes
- [x] **Creación manual** de hoja "Leads" en Google Sheets
- [x] **Definición** de estructura de datos
- [x] **Documentación** del proyecto

### ✅ **FASE 2: PLANIFICACIÓN TÉCNICA** - *COMPLETADA*
- [x] **Especificación** del flujo de trabajo con notas de voz
- [x] **Definición** del comportamiento adaptativo según hoja seleccionada
- [x] **Sistema dual de prompts** con preservación de funcionalidades existentes
- [x] **Diseño** del prompt especializado para extracción de datos
- [x] **Estructura** de respuesta de IA para leads
- [x] **Plan** detallado de modificaciones en código existente

### ✅ **FASE 3: DESARROLLO** - *COMPLETADA*
- [x] **Nueva función** `classifyLeadsContent()` en `services/openai.ts`
- [x] **Prompt especializado** para extracción de datos de contacto
- [x] **Lógica condicional** en `App.tsx` para detectar hoja "Leads"
- [x] **Estructura de respuesta** adaptada a datos de leads
- [x] **Integración** del nuevo flujo con Google Sheets existente
- [x] **Configuración completa** de variables de entorno

### 🔄 **FASE 4: TESTING Y REFINAMIENTO** - *EN PROGRESO*
- [ ] **Compartir Google Sheet** con service account (permisos Editor)
- [ ] **Pruebas** de detección automática de hoja "Leads"
- [ ] **Testing** de extracción de datos con ejemplos reales
- [ ] **Validación** de inserción correcta en Google Sheets
- [ ] **Verificación** de funcionalidades existentes intactas
- [ ] **Optimización** de UX/UI
- [ ] **Corrección** de bugs

### ⏳ **FASE 5: DOCUMENTACIÓN Y DEPLOY** - *PENDIENTE*
- [ ] **Documentación** técnica actualizada
- [ ] **Guía** de usuario para nueva funcionalidad
- [ ] **Testing** en ambiente de producción
- [ ] **Release** v1.1 con funcionalidad de leads

---

## 🔧 IMPLEMENTACIÓN TÉCNICA COMPLETADA

### ✅ **NUEVA FUNCIÓN ESPECIALIZADA**

#### **`classifyLeadsContent()` en `services/openai.ts`**
```javascript
export async function classifyLeadsContent(transcription: string): Promise<any>
```

**Características del prompt:**
- 🎯 **Especializado** en extracción de datos de contacto
- 🧠 **Inteligente** para múltiples formatos de teléfono/fecha
- 🔄 **Robusto** con fallbacks y validaciones
- 📊 **Estructurado** para respuesta JSON consistente
- 🎨 **3 ejemplos** detallados para guiar a la IA

**Capacidades de extracción:**
- **Nombres/Apellidos**: División automática y capitalización
- **Teléfonos**: Normalización de formatos (123-456-789)
- **Emails**: Validación de formato estándar
- **DNI**: Formato español con validación (12345678A)
- **Fechas**: Conversión a DD/MM/YYYY desde múltiples formatos
- **Edad**: Extracción directa o cálculo desde fecha nacimiento
- **Estado**: Inferencia inteligente desde contexto
- **Múltiples leads**: Detección de varios contactos en una grabación

### ✅ **LÓGICA CONDICIONAL IMPLEMENTADA**

#### **Modificaciones en `App.tsx` - Función `processRecording()`**
```javascript
// Sistema de detección automática
const isGeneralSheet = currentSheet === GENERAL_SHEET_NAME;
const isLeadsSheet = currentSheet === LEADS_SHEET_NAME;

if (isLeadsSheet) {
    // 🆕 NUEVO: Flujo para leads
    const leadsClassification = await classifyLeadsContent(transcription);
    // Preparación y envío específico para estructura de leads
} 
else if (isGeneralSheet) {
    // ✅ EXISTENTE: Flujo para notas generales (SIN CAMBIOS)
    const generalClassification = await classifyGeneralContent(transcription);
} 
else {
    // ✅ EXISTENTE: Flujo para estudiantes (SIN CAMBIOS)
    const classification = await classifyContent(transcription);
}
```

**Flujo específico para leads:**
1. **Transcripción** → Audio a texto (mismo que siempre)
2. **Extracción** → `classifyLeadsContent()` con prompt especializado
3. **Preparación** → Conversión a formato de 10 columnas
4. **Inserción** → Envío directo a hoja "Leads" en Google Sheets

### ✅ **ESTRUCTURA DE DATOS ADAPTADA**

#### **Formato de inserción en Google Sheets (Hoja "Leads"):**
```javascript
const allLeadsData = leadsData.map(lead => [
  new Date().toISOString(),    // Timestamp
  lead.nombre,                 // Nombre
  lead.apellidos,              // Apellidos
  lead.telefono,               // Teléfono (normalizado)
  lead.email,                  // Email
  lead.dni,                    // DNI (validado)
  lead.fechaNacimiento,        // Fecha Nacimiento (DD/MM/YYYY)
  lead.edad,                   // Edad (number o null)
  lead.estado,                 // Estado (validado)
  lead.notas                   // Notas adicionales
]);
```

### ✅ **VALIDACIONES Y NORMALIZACIONES AUTOMÁTICAS**

#### **En `classifyLeadsContent()`:**
- **Teléfonos**: `654321987` → `654-321-987`
- **DNI**: `12345678 a` → `12345678A` (+ validación formato)
- **Edad**: Validación rango 0-120 años
- **Estados**: Solo valores válidos (Nuevo, Contactado, Interesado, etc.)
- **Fallbacks**: Estructura mínima en caso de error

### ✅ **CONFIGURACIÓN COMPLETA**

#### **Variables de entorno configuradas:**
```env
# OpenAI Configuration
VITE_OPENAI_API_KEY=tu_clave_api_aqui

# Google Sheets Configuration  
VITE_GOOGLE_SHEET_ID=1yoG6rp84NHaOwhpiyaYLS7mb0qo89Xf4PBAFY_fA7mM
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-access@notas-voz-profesor.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----[CLAVE_COMPLETA]-----END PRIVATE KEY-----"
```

#### **Google Sheet preparado:**
- ✅ **ID**: `1yoG6rp84NHaOwhpiyaYLS7mb0qo89Xf4PBAFY_fA7mM`
- ✅ **Hoja "Leads"** creada manualmente con 10 columnas
- ⏳ **Permisos**: Compartir con `sheets-access@notas-voz-profesor.iam.gserviceaccount.com` (Editor)

---

## 🔧 CONSIDERACIONES TÉCNICAS

### Arquitectura Propuesta:
- **Reutilizar** toda la infraestructura Google Sheets existente
- **Sistema dual de prompts** con detección automática de contexto
- **Preservación completa** de funcionalidades existentes
- **Nueva función especializada** para procesamiento de leads
- **Lógica condicional** según hoja seleccionada

### Extracción de Datos via IA:
- **Nombres y Apellidos**: Identificación de personas mencionadas
- **Teléfonos**: Detección de números en múltiples formatos
- **Emails**: Extracción de direcciones de correo
- **DNI/Documentos**: Captura de números de identificación
- **Fechas**: Interpretación de fechas de nacimiento
- **Edad**: Extracción directa o cálculo automático
- **Estado del Lead**: Inferencia desde contexto (interesado, dudoso, etc.)
- **Notas**: Captura de información adicional relevante

### Casos Especiales a Manejar:
- **Información incompleta**: Campos vacíos cuando no se mencionen
- **Múltiples formatos**: Teléfonos con/sin prefijo, fechas diversas
- **Varios leads**: Una grabación con múltiples contactos
- **Datos ambiguos**: Manejo de información poco clara

### 🔀 **Sistema de Procesamiento Condicional:**

#### **Comportamiento Actual** ✅ **(SIN MODIFICAR)**
```javascript
// Hojas de Cursos (ej: "Matemáticas 3°A", "Inglés 2°B")
if (sheetType === "course") {
    result = await classifyContent(transcription)  // MANTENER INTACTO
    // → Extrae: estudiantes, categorías, sentimientos, acciones
}

// Hoja "General" 
else if (currentSheet === "General") {
    result = await classifyGeneralContent(transcription)  // MANTENER INTACTO  
    // → Extrae: temas, prioridades, acciones pendientes
}
```

#### **Nuevo Comportamiento** 🆕 **(A IMPLEMENTAR)**
```javascript
// Hoja "Leads"
else if (currentSheet === "Leads") {
    result = await classifyLeadsContent(transcription)  // NUEVA FUNCIÓN
    // → Extrae: nombre, apellidos, teléfono, email, DNI, etc.
}
```

### **Funciones de Procesamiento:**

#### **Existentes** ✅ **(No tocar)**
- `classifyContent()` → Para notas de estudiantes en cursos
- `classifyGeneralContent()` → Para notas administrativas generales

#### **Nueva** 🆕 **(A crear)**
- `classifyLeadsContent()` → Para extracción de datos de contacto

### **Flujo de Detección:**
1. **Usuario selecciona** hoja desde menú configuración
2. **App detecta** automáticamente el tipo de hoja:
   - `"Leads"` → Modo extracción de leads
   - `"General"` → Modo notas administrativas  
   - `Otras` → Modo notas de estudiantes
3. **Sistema aplica** prompt correspondiente automáticamente
4. **Procesamiento** adaptado según contexto detectado

### Integración con Sistema Existente:
- **Cero modificaciones** a funcionalidades actuales
- **Preservar** completamente flujos de estudiantes y notas generales
- **Añadir** nueva rama condicional para leads
- **Mantener** mismo sistema de configuración y UI

---

## 📈 BENEFICIOS ESPERADOS

### Para el Usuario:
- ✅ **Una sola herramienta** para notas y leads
- ✅ **Registro rápido** sin cambiar de aplicación
- ✅ **Datos estructurados** listos para CRM
- ✅ **Historial completo** de todos los contactos

### Técnicos:
- ✅ **Reutilización** de infraestructura existente
- ✅ **Mantenimiento simplificado** (un solo proyecto)
- ✅ **Escalabilidad** para futuras funcionalidades
- ✅ **Consistencia** en diseño y UX

---

## 🚧 RIESGOS Y MITIGATION

### Riesgos Identificados:
- **Complejidad añadida** → Mantener separación clara de responsabilidades
- **Conflictos de estado** → Usar estados independientes por funcionalidad
- **Sobrecarga de UI** → Diseño intuitivo con navegación clara
- **Validación de datos** → Implementar validación robusta del lado cliente

---

## 📞 PRÓXIMOS PASOS

### Inmediatos:
1. **Validar** que la hoja "Leads" se detecta desde la app
2. **Diseñar** mockup/wireframe del formulario de leads
3. **Definir** flujo de navegación entre modos
4. **Especificar** todas las validaciones requeridas

### Una vez aprobado el diseño:
1. **Solicitar autorización** para comenzar desarrollo
2. **Implementar** paso a paso según plan
3. **Probar** cada funcionalidad antes de continuar
4. **Documentar** cambios y decisiones tomadas

---

## 📝 NOTAS IMPORTANTES

- **No modificar** funcionalidades existentes que ya funcionan
- **Preguntar antes** de cada cambio de código
- **Mantener** la misma calidad y estándares del proyecto base
- **Preservar** todas las validaciones y controles de seguridad actuales

---

---

## 🎯 **EJEMPLOS DE USO COMPLETOS**

### **Ejemplo 1: Lead Simple**
**Audio grabado**: *"María González López, teléfono 654-321-987, email maria@gmail.com, muy interesada en el curso"*

**Procesamiento automático:**
1. **Transcripción**: OpenAI Whisper → Texto en español
2. **Detección**: App detecta hoja "Leads" → Usa `classifyLeadsContent()`
3. **Extracción IA**: 
   ```json
   {
     "leads": [{
       "nombre": "María",
       "apellidos": "González López", 
       "telefono": "654-321-987",
       "email": "maria@gmail.com",
       "dni": null,
       "fechaNacimiento": null,
       "edad": null,
       "estado": "Interesado",
       "notas": "muy interesada en el curso"
     }]
   }
   ```
4. **Inserción**: Fila automática en Google Sheets con timestamp

### **Ejemplo 2: Lead Completo**
**Audio grabado**: *"Juan Pérez Martín, DNI 87654321B, nació el 3 de abril de 1985, tiene 39 años, teléfono seis cinco cuatro tres dos uno nueve ocho siete, email juan.perez@outlook.com, está dudando pero interesado"*

**Resultado esperado:**
```
2024-12-30T10:15:00Z | Juan | Pérez Martín | 654-321-987 | juan.perez@outlook.com | 87654321B | 03/04/1985 | 39 | Dudoso | está dudando pero interesado
```

### **Ejemplo 3: Múltiples Leads**
**Audio grabado**: *"Ana García 123-456-789, no le interesa. Su hermana Carmen García 987-654-321, muy interesada en matemáticas"*

**Resultado esperado**: 2 filas automáticamente insertadas

---

## 🛡️ **PRESERVACIÓN DE FUNCIONALIDADES EXISTENTES**

### **✅ SIN MODIFICACIONES:**
- ✅ **Función `classifyContent()`** → Para hojas de cursos (estudiantes)
- ✅ **Función `classifyGeneralContent()`** → Para hoja "General"
- ✅ **Todo el flujo de procesamiento** original
- ✅ **Interface de usuario** actual
- ✅ **Gestión de cursos** existente
- ✅ **Configuración** y validaciones actuales

### **✅ SOLO AÑADIDO:**
- 🆕 **Detección** automática de hoja "Leads"
- 🆕 **Rama condicional** nueva en `processRecording()`
- 🆕 **Función `classifyLeadsContent()`** especializada
- 🆕 **Estructura de datos** para leads

---

## 📊 **ESTADO ACTUAL DEL PROYECTO**

### **✅ COMPLETADO (95%)**
- [x] **Análisis** completo del sistema base
- [x] **Creación** de hoja "Leads" en Google Sheets  
- [x] **Prompt especializado** para extracción de datos
- [x] **Función `classifyLeadsContent()`** implementada
- [x] **Lógica condicional** en App.tsx
- [x] **Configuración** completa de credenciales
- [x] **Validaciones** automáticas implementadas
- [x] **Documentación** técnica completa

### **⏳ PENDIENTE (5%)**
- [ ] **Compartir Sheet** con service account (1 minuto)
- [ ] **Testing real** con grabaciones de audio
- [ ] **Validación final** de funcionalidad completa

---

## 🚀 **LISTO PARA TESTING**

### **Para probar:**
1. **Compartir Google Sheet** con `sheets-access@notas-voz-profesor.iam.gserviceaccount.com`
2. **Ejecutar**: `npm run dev`
3. **Seleccionar**: Hoja "Leads" desde menú configuración
4. **Grabar**: *"María González, teléfono 123-456-789, email maria@gmail.com, interesada"*
5. **Verificar**: Inserción automática en Google Sheets

### **Casos de prueba sugeridos:**
- ✅ Lead simple (nombre + teléfono)
- ✅ Lead completo (todos los campos)  
- ✅ Múltiples leads en una grabación
- ✅ Información incompleta
- ✅ Formatos diversos de teléfono/fecha

---

*Documento actualizado: Diciembre 2024*  
*Estado: Implementación completada - Listo para testing*  
*Versión objetivo: v1.1 - Clasificador + Leads*