# Guía: Migración a Transcripción y Procesamiento Privado de Audio

## Objetivo del Proyecto

Migrar una aplicación web que actualmente:
1. **Graba audio** → Transcribe con Whisper API (OpenAI)
2. **Procesa texto** → Extrae datos con OpenAI API (nombre, apellidos, fecha nacimiento, etc.)
3. **Almacena datos** → Envía a Google Sheets

**Meta**: Eliminar dependencias externas para proteger la privacidad de datos sensibles, manteniendo la misma funcionalidad.

---

## Arquitectura Actual vs Nueva

### 🔴 **Arquitectura Actual (Problemática)**
```
Audio → Whisper API (OpenAI) → Texto → OpenAI API → Datos → Google Sheets
       [❌ Privacidad]              [❌ Privacidad]
```

### 🟢 **Arquitectura Nueva (Privada)**
```
Audio → Whisper Local → Texto → Extracción Local → Datos → Google Sheets
       [✅ 100% Local]         [✅ 100% Local]
```

---

## Implementación Técnica

### 1. **Transcripción de Audio (Reemplazar Whisper API)**

#### Opción A: Transformers.js + Whisper (Recomendada)
```javascript
import { pipeline } from '@xenova/transformers';

// Configurar transcriptor una sola vez
const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
    quantized: true,  // Reduce tamaño del modelo
    device: 'webgpu', // Usa GPU si está disponible
    language: 'es'    // Español
});

// Función de transcripción
async function transcribeAudio(audioBlob) {
    try {
        const result = await transcriber(audioBlob);
        return result.text;
    } catch (error) {
        console.error('Error en transcripción:', error);
        return null;
    }
}
```

#### Opción B: Web Speech API (Más rápida, menos precisa)
```javascript
function setupSpeechRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'es-ES';
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        processExtractedText(transcript);
    };
    
    recognition.onerror = function(event) {
        console.error('Error de reconocimiento:', event.error);
    };
    
    return recognition;
}
```

### 2. **Extracción de Datos (Reemplazar OpenAI API)**

#### Opción A: Patrones Regex (Más eficiente para datos estructurados)
```javascript
function extractPersonalData(text) {
    const patterns = {
        // Nombres
        nombre: /(?:me llamo|soy|mi nombre es)\s+([A-ZÁÉÍÓÚÜ][a-záéíóúü]+(?:\s+[A-ZÁÉÍÓÚÜ][a-záéíóúü]+)*)/gi,
        
        // Apellidos
        apellidos: /apellidos?\s+(?:son?\s+)?([A-ZÁÉÍÓÚÜ][a-záéíóúü]+(?:\s+[A-ZÁÉÍÓÚÜ][a-záéíóúü]+)*)/gi,
        
        // Fecha de nacimiento (múltiples formatos)
        fechaNacimiento: /(?:nací|nacido|fecha de nacimiento|cumpleaños).*?(\d{1,2}[\s\/\-](?:de\s+)?\w+[\s\/\-]\d{4}|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/gi,
        
        // Teléfono
        telefono: /(?:teléfono|móvil|celular).*?(\+?\d{1,3}[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3})/gi,
        
        // Email
        email: /(?:email|correo).*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
        
        // DNI/NIE
        dni: /(?:dni|nie|documento).*?([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])/gi
    };
    
    const extracted = {};
    
    for (const [field, pattern] of Object.entries(patterns)) {
        const match = pattern.exec(text);
        extracted[field] = match ? match[1].trim() : null;
        pattern.lastIndex = 0; // Reset regex
    }
    
    return extracted;
}
```

#### Opción B: NER con Transformers.js (Para casos más complejos)
```javascript
import { pipeline } from '@xenova/transformers';

// Configurar modelo de reconocimiento de entidades nombradas
const nerPipeline = await pipeline('token-classification', 'Davlan/bert-base-multilingual-cased-ner-hrl');

async function extractWithNER(text) {
    try {
        const entities = await nerPipeline(text);
        
        const extracted = {
            nombres: [],
            fechas: [],
            organizaciones: []
        };
        
        entities.forEach(entity => {
            if (entity.entity.includes('PER')) {
                extracted.nombres.push(entity.word);
            } else if (entity.entity.includes('DATE')) {
                extracted.fechas.push(entity.word);
            } else if (entity.entity.includes('ORG')) {
                extracted.organizaciones.push(entity.word);
            }
        });
        
        return extracted;
    } catch (error) {
        console.error('Error en NER:', error);
        return null;
    }
}
```

### 3. **Integración Completa**

```javascript
class PrivateSpeechProcessor {
    constructor() {
        this.transcriber = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        if (!this.isInitialized) {
            console.log('Cargando modelo de transcripción...');
            this.transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
                quantized: true,
                device: 'webgpu'
            });
            this.isInitialized = true;
            console.log('Modelo cargado exitosamente');
        }
    }
    
    async processAudio(audioBlob) {
        await this.initialize();
        
        // 1. Transcribir audio localmente
        const transcript = await this.transcriber(audioBlob);
        console.log('Transcripción:', transcript.text);
        
        // 2. Extraer datos localmente
        const extractedData = extractPersonalData(transcript.text);
        console.log('Datos extraídos:', extractedData);
        
        // 3. Enviar solo datos procesados a Google Sheets
        await this.sendToGoogleSheets(extractedData);
        
        return extractedData;
    }
    
    async sendToGoogleSheets(data) {
        // Implementar envío a Google Sheets
        // Solo se envían datos ya procesados, no el audio ni texto original
        try {
            const response = await fetch('TU_WEBHOOK_GOOGLE_SHEETS', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (error) {
            console.error('Error enviando a Google Sheets:', error);
            return false;
        }
    }
}
```

---

## Consideraciones de Rendimiento

### **Tamaños de Modelo Whisper**
| Modelo | Tamaño | Precisión | Velocidad | Recomendación |
|--------|--------|-----------|-----------|---------------|
| tiny   | 39MB   | Básica    | Muy rápida | Prototipado |
| base   | 74MB   | Buena     | Rápida    | **Recomendada** |
| small  | 244MB  | Muy buena | Media     | Calidad alta |
| medium | 769MB  | Excelente | Lenta     | Solo si es crítico |

### **Optimizaciones**
```javascript
// Precarga del modelo en el inicio de la app
window.addEventListener('load', async () => {
    const processor = new PrivateSpeechProcessor();
    await processor.initialize(); // Carga el modelo una sola vez
});

// Usar Web Workers para no bloquear UI
const worker = new Worker('speech-worker.js');
worker.postMessage({ audio: audioBlob });
```

---

## Plan de Migración

### **Fase 1: Preparación**
1. ✅ Configurar Transformers.js en el proyecto
2. ✅ Implementar función de transcripción local
3. ✅ Crear patrones de extracción específicos para tu dominio
4. ✅ Configurar tests con audios de ejemplo

### **Fase 2: Implementación**
1. ✅ Integrar transcripción local en paralelo con API actual
2. ✅ Comparar resultados y ajustar patrones
3. ✅ Implementar fallback a API si falla local
4. ✅ Optimizar rendimiento y UX

### **Fase 3: Migración Completa**
1. ✅ Desactivar llamadas a OpenAI API
2. ✅ Monitorear métricas de precisión
3. ✅ Ajustar modelos basado en feedback real
4. ✅ Documentar para mantenimiento

---

## Código de Ejemplo Completo

### **HTML Base**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Transcripción Privada</title>
</head>
<body>
    <button id="recordBtn">🎤 Grabar</button>
    <button id="stopBtn" disabled>⏹️ Parar</button>
    <div id="status">Listo</div>
    <div id="results"></div>
    
    <script type="module" src="app.js"></script>
</body>
</html>
```

### **JavaScript Principal (app.js)**
```javascript
import { PrivateSpeechProcessor } from './speech-processor.js';

const processor = new PrivateSpeechProcessor();
let mediaRecorder;
let audioChunks = [];

// Configurar interfaz
document.getElementById('recordBtn').onclick = startRecording;
document.getElementById('stopBtn').onclick = stopRecording;

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioChunks = [];
        
        document.getElementById('status').textContent = 'Procesando...';
        const results = await processor.processAudio(audioBlob);
        
        document.getElementById('results').innerHTML = `
            <h3>Datos Extraídos:</h3>
            <pre>${JSON.stringify(results, null, 2)}</pre>
        `;
        document.getElementById('status').textContent = 'Completado';
    };
    
    mediaRecorder.start();
    document.getElementById('recordBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('status').textContent = 'Grabando...';
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('recordBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}
```

---

## Ventajas de la Nueva Arquitectura

### 🔒 **Privacidad Total**
- Audio nunca sale del dispositivo del usuario
- Datos personales se procesan localmente
- Solo datos estructurados van a Google Sheets

### 💰 **Cero Costos de API**
- Elimina gastos de OpenAI Whisper API (~$0.006/minuto)
- Elimina gastos de OpenAI Text Processing API
- Solo mantiene Google Sheets (gratis hasta límites)

### ⚡ **Mejor Rendimiento**
- Sin latencia de red para procesamiento
- Funciona offline una vez cargado
- Control total sobre optimizaciones

### 🛡️ **Cumplimiento Regulatorio**
- GDPR compliant by design
- Sin transferencia de datos personales
- Auditable y transparente

---

## Preguntas para Claude Code

1. **¿Qué campos específicos extraes actualmente?** (para crear patrones más precisos)
2. **¿En qué framework está construida tu app?** (React, Vue, vanilla JS)
3. **¿Qué navegadores necesitas soportar?** (para compatibilidad de WebAssembly)
4. **¿Cuál es el volumen de uso esperado?** (para optimizaciones de performance)
5. **¿Hay algún formato específico requerido para Google Sheets?**

---

**Nota**: Esta implementación garantiza que los datos sensibles nunca salgan del dispositivo del usuario, cumpliendo con regulaciones de privacidad mientras mantiene la funcionalidad original.