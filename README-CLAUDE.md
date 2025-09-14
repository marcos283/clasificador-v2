# 📋 DOCUMENTACIÓN TÉCNICA: LEADS CAPTURE - APP MÓVIL FLUTTER

## 📖 **RESUMEN EJECUTIVO**

**Leads Capture** es una aplicación móvil nativa para Android desarrollada en Flutter que permite a profesores y comerciales **registrar información de posibles estudiantes (leads) de forma rápida mediante grabación de voz** mientras están en movimiento (calle, ferias educativas, llamadas telefónicas).

La app prioriza la **privacidad total** - toda la transcripción y extracción de datos ocurre localmente en el dispositivo, sin enviar audio a servicios externos. Los datos estructurados se almacenan localmente y se pueden exportar a Google Sheets para integración con CRM.

### **🎯 DIFERENCIACIÓN CLAVE**
Esta app es específicamente para **captura de leads**, separada del sistema existente de "Notas de Estudiantes" que se usa en aula. El enfoque es **velocidad y privacidad** para uso móvil en entornos dinámicos.

---

## 🎯 **OBJETIVO Y CASOS DE USO**

### **👥 USUARIOS OBJETIVO**
- **Profesores** captando interés en ferias educativas
- **Comerciales educativos** registrando contactos potenciales
- **Coordinadores** documentando consultas telefónicas
- **Personal de marketing** en eventos presenciales

### **📱 CASOS DE USO PRINCIPALES**

**1. Ferias Educativas:**
```
Profesor habla: "María González López, teléfono 654321987, 
email maria@gmail.com, muy interesada en curso de inglés"
↓
App extrae automáticamente y estructura los datos
```

**2. Consultas Telefónicas:**
```
"Llamó Juan Pérez, DNI 12345678A, teléfono 987654321, 
nació el 15 de mayo de 1990, lo va a pensar"
↓
Estado automático: "Dudoso"
```

**3. Referencias:**
```
"Ana recomendó a su hermana Carmen, 
teléfono 111222333, también interesada"
↓
Detecta múltiples leads en una grabación
```

---

## 🏗️ **ARQUITECTURA TÉCNICA**

### **📱 STACK TECNOLÓGICO**
- **Framework**: Flutter (Dart)
- **Transcripción**: Speech-to-text nativo Android (privacidad total)
- **Extracción datos**: Regex patterns locales (sin IA externa)
- **Storage**: SQLite local + SharedPreferences
- **Export**: Google Sheets API
- **UI**: Material Design 3

### **🔒 PRINCIPIOS DE PRIVACIDAD**
1. **Audio nunca sale del dispositivo**
2. **Transcripción local únicamente**
3. **Procesamiento offline-first**
4. **Solo datos estructurados se exportan**
5. **Cumplimiento GDPR por diseño**

### **📊 FLUJO DE DATOS**
```
🎤 Audio grabado
    ↓
📝 Transcripción local (Android Speech API)
    ↓
🔍 Extracción regex (local)
    ↓
💾 Storage SQLite (local)
    ↓
📤 Export opcional Google Sheets
```

---

## 📋 **ESTRUCTURA DE DATOS**

### **🗃️ MODELO LEAD**
```dart
class Lead {
  int? id;
  DateTime timestamp;
  String? nombre;
  String? apellidos; 
  String? telefono;        // Formato: 123456789 (sin guiones)
  String? email;
  String? dni;             // Formato: 12345678A
  String? fechaNacimiento; // Formato: DD/MM/YYYY
  int? edad;
  LeadStatus estado;       // Enum: Nuevo, Contactado, Interesado, NoInteresado, Dudoso
  String? notas;
  String? ubicacion;       // GPS opcional
  String transcripcionOriginal;
}

enum LeadStatus {
  nuevo,
  contactado, 
  interesado,
  noInteresado,
  dudoso
}
```

### **🎯 PATRONES DE EXTRACCIÓN**
```dart
class DataExtractionPatterns {
  static const Map<String, RegExp> patterns = {
    'telefono': r'(?:tel[eé]fono|móvil|celular|número).*?(\+?\d{9,})',
    'email': r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
    'nombre': r'(?:me llamo|soy|nombre|se llama)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)',
    'dni': r'(?:dni|nie|documento).*?([0-9]{8}[A-Z])',
    'edad': r'(?:tiene|tengo|edad).*?(\d{1,2})\s*(?:años?)',
    'fechaNacimiento': r'(?:nació|nacido|cumpleaños).*?(\d{1,2}[\s\/\-](?:de\s+)?\w+[\s\/\-]\d{4}|\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})'
  };
}
```

---

## 🎨 **DISEÑO UI/UX**

### **📱 PANTALLAS PRINCIPALES**

**1. Pantalla Principal - Captura:**
```
┌─────────────────────────┐
│    🎤 GRABAR LEAD       │ ← Botón prominente
│   [●] Grabando... 0:15  │
├─────────────────────────┤
│ 📋 Leads Recientes      │
│                         │
│ [👤] María González     │
│      📞 654321987       │  
│      ✅ Interesada      │
│      🕐 Hace 5 min      │
├─────────────────────────┤
│ [👤] Juan López         │
│      📞 987654321       │
│      ⏳ Dudoso          │
│      🕐 Hace 1 hora     │
├─────────────────────────┤
│ 📤 Exportar (15)        │ ← Export rápido
│ ⚙️ Configuración        │
└─────────────────────────┘
```

**2. Pantalla Detalle Lead:**
```
┌─────────────────────────┐
│ 👤 María González López │
├─────────────────────────┤
│ 📞 654321987           │
│ ✉️ maria@gmail.com     │  
│ 🆔 12345678A           │
│ 🎂 15/05/1990 (35)     │
│ 📊 Interesada          │
├─────────────────────────┤
│ 📝 Notas:              │
│ "Muy interesada en      │
│  curso de inglés"       │
├─────────────────────────┤
│ 🎙️ "María González López,│
│ teléfono 654321987..."  │ ← Transcripción
├─────────────────────────┤
│ ✏️ Editar  🗑️ Eliminar  │
└─────────────────────────┘
```

### **🎨 PRINCIPIOS DE DISEÑO**
- **One-handed operation**: Botones accesibles con pulgar
- **High contrast**: Legible bajo sol directo
- **Large touch targets**: Mínimo 48dp
- **Quick actions**: Swipe gestures para acciones rápidas
- **Offline indicators**: Estado claro de conectividad

---

## ⚙️ **FUNCIONALIDADES DETALLADAS**

### **🎤 GRABACIÓN DE AUDIO**
```dart
class AudioRecordingService {
  // Configuración optimizada móvil
  static const AudioEncoderType encoder = AudioEncoderType.aacLc;
  static const int sampleRate = 16000;  // Óptimo para speech
  static const int bitRate = 128000;
  
  Future<void> startRecording();
  Future<String> stopRecording();
  Stream<Duration> get recordingDuration;
  bool get isRecording;
}
```

### **📝 TRANSCRIPCIÓN LOCAL**
```dart
class SpeechTranscriptionService {
  final SpeechToText _speechToText = SpeechToText();
  
  Future<String> transcribeAudio(String audioPath) async {
    // Configuración español
    final localeId = 'es_ES';
    final result = await _speechToText.listen(
      onResult: _onSpeechResult,
      localeId: localeId,
      cancelOnError: false,
      partialResults: false,
    );
    return result;
  }
}
```

### **🔍 EXTRACCIÓN DE DATOS**
```dart
class LeadDataExtractor {
  static List<Lead> extractFromTranscription(String text) {
    final List<Lead> leads = [];
    
    // Detectar múltiples personas
    final segments = _splitByPersons(text);
    
    for (String segment in segments) {
      final lead = Lead(
        timestamp: DateTime.now(),
        nombre: _extractWithPattern('nombre', segment),
        apellidos: _extractWithPattern('apellidos', segment),
        telefono: _normalizePhone(_extractWithPattern('telefono', segment)),
        email: _extractWithPattern('email', segment),
        dni: _normalizeDNI(_extractWithPattern('dni', segment)),
        estado: _inferStatus(segment),
        transcripcionOriginal: segment,
      );
      
      leads.add(lead);
    }
    
    return leads;
  }
}
```

### **💾 STORAGE LOCAL**
```dart
class LeadsDatabase {
  static const String tableName = 'leads';
  
  Future<Database> get database async {
    return openDatabase(
      'leads.db',
      version: 1,
      onCreate: (db, version) {
        return db.execute('''
          CREATE TABLE leads(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            nombre TEXT,
            apellidos TEXT,
            telefono TEXT,
            email TEXT,
            dni TEXT,
            fecha_nacimiento TEXT,
            edad INTEGER,
            estado TEXT NOT NULL,
            notas TEXT,
            ubicacion TEXT,
            transcripcion_original TEXT NOT NULL
          )
        ''');
      },
    );
  }
}
```

### **📤 EXPORT GOOGLE SHEETS**
```dart
class GoogleSheetsExporter {
  static const List<String> headers = [
    'Fecha', 'Nombre', 'Apellidos', 'Teléfono', 
    'Email', 'DNI', 'Fecha Nacimiento', 'Edad', 
    'Estado', 'Notas'
  ];
  
  Future<void> exportLeads(List<Lead> leads) async {
    final values = leads.map((lead) => [
      lead.timestamp.toIso8601String(),
      lead.nombre ?? '',
      lead.apellidos ?? '',
      lead.telefono ?? '',
      lead.email ?? '',
      lead.dni ?? '',
      lead.fechaNacimiento ?? '',
      lead.edad?.toString() ?? '',
      lead.estado.name,
      lead.notas ?? ''
    ]).toList();
    
    await _sheetsApi.spreadsheets.values.append(
      ValueRange(values: [headers, ...values]),
      spreadsheetId,
      'Leads!A:J',
    );
  }
}
```

---

## 🔧 **CONFIGURACIÓN Y SETUP**

### **📱 DEPENDENCIAS FLUTTER**
```yaml
dependencies:
  flutter:
    sdk: flutter
  speech_to_text: ^6.3.0          # Transcripción local
  sqflite: ^2.3.0                 # Base de datos local  
  shared_preferences: ^2.2.2      # Configuración
  permission_handler: ^11.0.1     # Permisos micrófono
  geolocator: ^9.0.2             # GPS opcional
  google_sheets_update: ^0.2.1    # Export datos
  path_provider: ^2.1.1          # Rutas archivos
  flutter_sound: ^9.2.13         # Grabación audio
  material_design_icons_flutter: ^7.0.7296
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

### **🔐 PERMISOS ANDROID**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

### **⚙️ CONFIGURACIÓN INICIAL**
```dart
class AppConfig {
  static const String appName = 'Leads Capture';
  static const String version = '1.0.0';
  
  // Google Sheets (opcional)
  static const String defaultSheetId = 'tu_sheet_id_aqui';
  static const String serviceAccountEmail = 'tu_service_account@proyecto.iam.gserviceaccount.com';
  
  // Configuración grabación
  static const Duration maxRecordingDuration = Duration(minutes: 5);
  static const Duration autoStopDelay = Duration(seconds: 30); // Si silencio
  
  // Configuración UI
  static const int recentLeadsLimit = 10;
  static const bool enableGeolocation = true;
}
```

---

## 🚀 **ROADMAP DE DESARROLLO**

### **📅 SPRINT 1: CORE FUNCTIONALITY (1-2 semanas)**
- [ ] Setup proyecto Flutter + dependencias
- [ ] Pantalla principal con botón grabación
- [ ] Implementar grabación/reproducción audio
- [ ] Service transcripción local
- [ ] Modelo de datos Lead + SQLite

### **📅 SPRINT 2: DATA EXTRACTION (1 semana)**
- [ ] Patterns regex para extracción datos
- [ ] Lógica inferencia estado lead
- [ ] Validación y normalización datos
- [ ] Detección múltiples leads por grabación

### **📅 SPRINT 3: UI/UX (1 semana)**
- [ ] Lista leads recientes con búsqueda
- [ ] Pantalla detalle lead con edición
- [ ] Swipe actions (editar/eliminar)
- [ ] Indicadores estado y progreso

### **📅 SPRINT 4: EXPORT & POLISH (1 semana)**
- [ ] Integración Google Sheets API
- [ ] Export CSV local como backup
- [ ] Configuración y ajustes
- [ ] Testing dispositivos reales
- [ ] Optimizaciones rendimiento

---

## 🧪 **CASOS DE PRUEBA**

### **✅ CASOS BÁSICOS**
```dart
// Test 1: Lead simple
Input: "María González, teléfono 654321987, interesada"
Expected: {
  nombre: "María",
  apellidos: "González", 
  telefono: "654321987",
  estado: LeadStatus.interesado
}

// Test 2: Lead completo  
Input: "Juan Pérez López, DNI 12345678A, teléfono 987654321, 
        email juan@gmail.com, nació el 15 de mayo de 1990"
Expected: {
  nombre: "Juan",
  apellidos: "Pérez López",
  dni: "12345678A",
  telefono: "987654321", 
  email: "juan@gmail.com",
  fechaNacimiento: "15/05/1990",
  edad: 35
}

// Test 3: Múltiples leads
Input: "Ana Martín 111222333 interesada, su hermana Carmen 444555666 también"
Expected: 2 leads detectados
```

### **🔍 EDGE CASES**
- Audio con ruido de fondo
- Transcripción con errores
- Datos incompletos o ambiguos
- Formatos de teléfono diversos
- Nombres con caracteres especiales

---

## 📊 **MÉTRICAS Y OBJETIVOS**

### **🎯 OBJETIVOS DE RENDIMIENTO**
- **Tiempo grabación → datos**: < 5 segundos
- **Precisión extracción**: > 90% datos básicos
- **Tamaño app**: < 25MB
- **Consumo batería**: < 5% por hora uso
- **Offline capability**: 100% funcional

### **📈 MÉTRICAS DE ÉXITO**
- Leads capturados por día
- Tasa de datos completos vs incompletos  
- Tiempo promedio por lead
- Tasa de errores transcripción
- Satisfacción usuario (1-5)

---

## 🔗 **INTEGRACIÓN CON SISTEMAS EXTERNOS**

### **📊 GOOGLE SHEETS**
- Export automático o manual
- Formato compatible CRM
- Backup de seguridad
- Colaboración en tiempo real

### **📱 POSIBLES INTEGRACIONES FUTURAS**
- CRM específicos (HubSpot, Salesforce)
- WhatsApp Business API
- Email marketing (Mailchimp)
- Analytics (Firebase)

---

## 🎯 **ANDROID SPEECH API - IMPLEMENTACIÓN**

### **📱 CONFIGURACIÓN SPEECH-TO-TEXT**
```dart
import 'package:speech_to_text/speech_to_text.dart' as stt;

class SpeechService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  bool _isAvailable = false;
  String _transcription = '';

  // Inicialización optimizada para español
  Future<void> initialize() async {
    _isAvailable = await _speech.initialize(
      onStatus: _onSpeechStatus,
      onError: _onSpeechError,
      debugLogging: true,
    );
  }

  // Captura optimizada para leads
  Future<void> startListening() async {
    if (_isAvailable && !_isListening) {
      await _speech.listen(
        onResult: _onSpeechResult,
        localeId: 'es_ES',                    // Español España
        cancelOnError: false,                 // Robusto ante errores
        partialResults: true,                 // Feedback tiempo real
        pauseFor: Duration(seconds: 2),       // Pausa natural
        listenFor: Duration(minutes: 3),      // Tiempo para lead completo
        onDevice: true,                       // Preferir procesamiento local
      );
    }
  }

  void _onSpeechResult(result) {
    _transcription = result.recognizedWords;
    if (result.finalResult) {
      _processFinalTranscription(_transcription);
    }
  }
}
```

### **🔧 MANEJO DE ERRORES SPEECH**
```dart
class SpeechErrorHandler {
  static void handleError(SpeechRecognitionError error) {
    switch (error.errorMsg) {
      case 'error_no_match':
        _showUserMessage('No se detectó voz clara. Inténtalo de nuevo.');
        break;
      case 'error_speech_timeout':
        _showUserMessage('Tiempo agotado. Presiona grabar de nuevo.');
        break;
      case 'error_audio':
        _checkMicrophonePermissions();
        break;
      case 'error_insufficient_permissions':
        _requestMicrophonePermission();
        break;
      default:
        _showUserMessage('Error de reconocimiento: ${error.errorMsg}');
    }
  }
}
```

---

**🎯 Esta documentación completa debe permitir a Claude Code en Android Studio entender el proyecto y generar código Dart/Flutter optimizado para cada funcionalidad específica de la aplicación Leads Capture.**