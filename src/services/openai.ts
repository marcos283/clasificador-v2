import OpenAI from 'openai';

// Verificar configuración al cargar el módulo
console.log('🔍 Verificando configuración de OpenAI...');
console.log('API Key presente:', !!import.meta.env.VITE_OPENAI_API_KEY);
console.log('API Key (primeros 10 chars):', import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10));

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('🎤 Iniciando transcripción de audio...');
    console.log('Tamaño del blob:', audioBlob.size, 'bytes');
    console.log('Tipo de blob:', audioBlob.type);

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('API Key de OpenAI no configurada');
    }

    if (audioBlob.size === 0) {
      throw new Error('El archivo de audio está vacío');
    }

    const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
    console.log('📁 Archivo creado:', file.name, file.size, 'bytes');
    
    console.log('🌐 Enviando a OpenAI Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'es'
    });

    console.log('✅ Transcripción completada:', transcription.text);
    return transcription.text;
  } catch (error) {
    console.error('❌ Error transcribing audio:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Error de API Key de OpenAI. Verifica tu configuración.');
      } else if (error.message.includes('quota')) {
        throw new Error('Has excedido tu cuota de OpenAI. Verifica tu cuenta.');
      } else if (error.message.includes('network')) {
        throw new Error('Error de conexión. Verifica tu internet.');
      }
    }
    
    throw new Error(`Error al transcribir el audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function classifyContent(transcription: string): Promise<any> {
  try {
    console.log('🤖 Iniciando clasificación con GPT...');
    console.log('Texto a clasificar:', transcription.substring(0, 100) + '...');

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('No hay texto para clasificar');
    }

    const prompt = `
Eres un asistente especializado en analizar notas de voz de profesores sobre estudiantes. 

INSTRUCCIONES CRÍTICAS:
1. Analiza la transcripción e identifica TODOS los estudiantes mencionados
2. Para cada estudiante, extrae información específica sobre él/ella
3. Responde ÚNICAMENTE en formato JSON válido, sin texto adicional
4. Si no se mencionan estudiantes específicos, crea una entrada genérica

FORMATO DE RESPUESTA REQUERIDO:
{
  "students": [
    {
      "name": "Nombre del estudiante o 'Estudiante no identificado'",
      "category": "Comportamiento|Rendimiento|Participación|Asistencia|Social|Otro",
      "sentiment": "Positivo|Neutral|Negativo",
      "summary": "Resumen específico de este estudiante",
      "suggestedActions": "Acciones específicas para este estudiante"
    }
  ],
  "generalSummary": "Resumen general si aplica",
  "generalActions": "Acciones generales si aplica"
}

EJEMPLOS:

Transcripción: "María García interrumpió la clase pero Carlos López ayudó a sus compañeros"
Respuesta:
{
  "students": [
    {
      "name": "María García",
      "category": "Comportamiento",
      "sentiment": "Negativo",
      "summary": "Interrumpió la clase durante la sesión",
      "suggestedActions": "Hablar con ella sobre el respeto en clase"
    },
    {
      "name": "Carlos López",
      "category": "Social",
      "sentiment": "Positivo",
      "summary": "Ayudó a sus compañeros de clase",
      "suggestedActions": "Reconocer su actitud colaborativa"
    }
  ],
  "generalSummary": "Comportamientos contrastantes en la clase",
  "generalActions": "Reforzar normas de convivencia"
}

Transcripción: "Pedro y Luis trabajaron excelente en el proyecto de ciencias"
Respuesta:
{
  "students": [
    {
      "name": "Pedro",
      "category": "Rendimiento",
      "sentiment": "Positivo",
      "summary": "Excelente trabajo en proyecto de ciencias",
      "suggestedActions": "Continuar motivando su participación"
    },
    {
      "name": "Luis",
      "category": "Rendimiento",
      "sentiment": "Positivo",
      "summary": "Excelente trabajo en proyecto de ciencias",
      "suggestedActions": "Continuar motivando su participación"
    }
  ],
  "generalSummary": "Trabajo colaborativo exitoso en ciencias",
  "generalActions": "Replicar metodología en otros proyectos"
}

AHORA ANALIZA ESTA TRANSCRIPCIÓN:
"${transcription}"

RESPONDE SOLO CON EL JSON:`;

    console.log('🌐 Enviando a OpenAI GPT...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    console.log('📝 Respuesta cruda de GPT:', content);
    
    // Limpiar la respuesta para asegurar que sea JSON válido
    let cleanContent = content.trim();
    
    // Remover cualquier texto antes o después del JSON
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd);
    }
    
    console.log('📝 JSON limpio:', cleanContent);
    
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      console.log('Contenido que falló:', cleanContent);
      
      // Fallback: crear estructura básica
      parsed = {
        students: [{
          name: "Estudiante no identificado",
          category: "Otro",
          sentiment: "Neutral",
          summary: transcription.substring(0, 100) + "...",
          suggestedActions: "Revisar nota para más detalles"
        }],
        generalSummary: "Error procesando clasificación",
        generalActions: "Revisar transcripción manualmente"
      };
    }
    
    // Validar estructura
    if (!parsed.students || !Array.isArray(parsed.students)) {
      console.warn('⚠️ Estructura inválida, creando fallback');
      parsed = {
        students: [{
          name: "Estudiante no identificado",
          category: "Otro",
          sentiment: "Neutral",
          summary: transcription.substring(0, 100) + "...",
          suggestedActions: "Revisar nota para más detalles"
        }],
        generalSummary: parsed.generalSummary || "",
        generalActions: parsed.generalActions || ""
      };
    }
    
    // Validar cada estudiante
    parsed.students = parsed.students.map((student: any, index: number) => ({
      name: student.name || `Estudiante ${index + 1}`,
      category: student.category || "Otro",
      sentiment: student.sentiment || "Neutral",
      summary: student.summary || "Sin información específica",
      suggestedActions: student.suggestedActions || "Sin acciones específicas"
    }));
    
    console.log('✅ Clasificación completada y validada:', parsed);
    return parsed;
    
  } catch (error) {
    console.error('❌ Error classifying content:', error);
    
    // Fallback completo en caso de error
    const fallback = {
      students: [{
        name: "Error en clasificación",
        category: "Otro",
        sentiment: "Neutral",
        summary: transcription.substring(0, 100) + "...",
        suggestedActions: "Revisar manualmente"
      }],
      generalSummary: "Error en el procesamiento",
      generalActions: "Intentar nuevamente"
    };
    
    console.log('🔄 Usando fallback:', fallback);
    return fallback;
  }
}

export async function classifyGeneralContent(transcription: string): Promise<any> {
  try {
    console.log('🤖 Iniciando clasificación de nota general con GPT...');
    console.log('Texto a clasificar:', transcription.substring(0, 100) + '...');

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('No hay texto para clasificar');
    }

    const prompt = `
Eres un asistente especializado en analizar notas de voz de profesores sobre su trabajo en el aula y tareas pendientes.

INSTRUCCIONES CRÍTICAS:
1. Analiza la transcripción e identifica el tema principal, prioridad y acciones pendientes
2. Responde ÚNICAMENTE en formato JSON válido, sin texto adicional
3. Clasifica de manera amplia y práctica, no te limites solo a temas educativos

FORMATO DE RESPUESTA REQUERIDO:
{
  "topic": "Trabajo|Educación|Personal|Administrativo|Reuniones|Proyectos|Recordatorios|Ideas|Tareas|Otro",
  "priority": "Alta|Media|Baja",
  "summary": "Resumen conciso de la nota",
  "pendingActions": "Lista de acciones específicas a realizar"
}

CRITERIOS DE CLASIFICACIÓN:

TEMA/ÁREA:
- "Trabajo": Tareas laborales, proyectos profesionales, responsabilidades del trabajo
- "Educación": Clases, estudiantes, evaluaciones, material didáctico, planificación educativa
- "Personal": Reflexiones personales, desarrollo profesional, bienestar, salud
- "Administrativo": Documentos, trámites, reportes, papeleo, gestiones burocráticas
- "Reuniones": Citas, encuentros, conferencias, llamadas programadas
- "Proyectos": Iniciativas específicas, planes a largo plazo, colaboraciones
- "Recordatorios": Cosas que no se deben olvidar, fechas importantes, compromisos
- "Ideas": Pensamientos creativos, propuestas, inspiración, lluvia de ideas
- "Tareas": Actividades específicas por hacer, pendientes concretos
- "Otro": Cualquier tema que no encaje en las categorías anteriores

PRIORIDAD:
- "Alta": Urgente, requiere atención inmediata (deadlines cercanos, problemas críticos)
- "Media": Importante pero no urgente (planificación a mediano plazo)
- "Baja": Puede esperar, ideas para el futuro

EJEMPLOS:

Transcripción: "Tengo que comprar leche, llamar al dentista y no olvidar la reunión del viernes"
Respuesta:
{
  "topic": "Recordatorios",
  "priority": "Media",
  "summary": "Lista de tareas personales y cita médica pendiente",
  "pendingActions": "1. Comprar leche, 2. Llamar al dentista para cita, 3. Confirmar asistencia a reunión del viernes"
}

Transcripción: "Se me ocurrió una idea genial para el proyecto de la empresa, podríamos usar inteligencia artificial"
Respuesta:
{
  "topic": "Ideas",
  "priority": "Baja",
  "summary": "Propuesta de integrar IA en proyecto empresarial",
  "pendingActions": "1. Investigar herramientas de IA disponibles, 2. Preparar propuesta detallada, 3. Programar reunión con equipo"
}

Transcripción: "Necesito terminar el informe para mañana y preparar la presentación para el cliente"
Respuesta:
{
  "topic": "Trabajo",
  "priority": "Alta",
  "summary": "Finalizar informe urgente y preparar presentación para cliente",
  "pendingActions": "1. Completar informe antes de mañana, 2. Crear presentación para cliente, 3. Revisar materiales de apoyo"
}

AHORA ANALIZA ESTA TRANSCRIPCIÓN:
"${transcription}"

RESPONDE SOLO CON EL JSON:`;

    console.log('🌐 Enviando a OpenAI GPT para clasificación general...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 800
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    console.log('📝 Respuesta cruda de GPT (general):', content);
    
    // Limpiar la respuesta para asegurar que sea JSON válido
    let cleanContent = content.trim();
    
    // Remover cualquier texto antes o después del JSON
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd);
    }
    
    console.log('📝 JSON limpio (general):', cleanContent);
    
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Error parsing JSON (general):', parseError);
      console.log('Contenido que falló:', cleanContent);
      
      // Fallback: crear estructura básica para notas generales
      parsed = {
        topic: "Otro",
        priority: "Media",
        summary: transcription.substring(0, 100) + "...",
        pendingActions: "Revisar nota para más detalles"
      };
    }
    
    // Validar y normalizar estructura
    const validTopics = ["Trabajo", "Educación", "Personal", "Administrativo", "Reuniones", "Proyectos", "Recordatorios", "Ideas", "Tareas", "Otro"];
    const validPriorities = ["Alta", "Media", "Baja"];
    
    parsed = {
      topic: validTopics.includes(parsed.topic) ? parsed.topic : "Otro",
      priority: validPriorities.includes(parsed.priority) ? parsed.priority : "Media",
      summary: parsed.summary || transcription.substring(0, 100) + "...",
      pendingActions: parsed.pendingActions || "Sin acciones específicas"
    };
    
    console.log('✅ Clasificación general completada y validada:', parsed);
    return parsed;
    
  } catch (error) {
    console.error('❌ Error classifying general content:', error);
    
    // Fallback completo en caso de error
    const fallback = {
      topic: "Otro",
      priority: "Media",
      summary: transcription.substring(0, 100) + "...",
      pendingActions: "Revisar manualmente"
    };
    
    console.log('🔄 Usando fallback (general):', fallback);
    return fallback;
  }
}

export async function classifyLeadsContent(transcription: string): Promise<any> {
  try {
    console.log('🎯 Iniciando extracción de datos de leads con GPT...');
    console.log('Texto a procesar:', transcription.substring(0, 100) + '...');

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('No hay texto para procesar');
    }

    const prompt = `
Eres un especialista en extraer información de contacto de posibles estudiantes (leads) desde notas de voz dictadas por profesores.

INSTRUCCIONES CRÍTICAS:
1. Analiza la transcripción y extrae TODOS los datos de contacto mencionados
2. Identifica múltiples personas si se mencionan varias en la misma nota
3. Responde ÚNICAMENTE en formato JSON válido, sin texto adicional
4. Si un dato no se menciona, usa null para ese campo
5. Infiere el estado del lead basado en el contexto de la conversación

ESTRUCTURA DE DATOS REQUERIDA:
{
  "leads": [
    {
      "nombre": "string o null",
      "apellidos": "string o null",
      "telefono": "string o null (formato limpio, solo números y guiones)",
      "email": "string o null",
      "dni": "string o null (formato: 12345678A)",
      "fechaNacimiento": "string o null (formato: DD/MM/YYYY)",
      "edad": "number o null",
      "estado": "Nuevo|Contactado|Interesado|No interesado|Dudoso",
      "notas": "string con información adicional relevante"
    }
  ]
}

CRITERIOS DE EXTRACCIÓN:

NOMBRES:
- Extrae nombre y apellidos por separado
- Si solo se menciona un nombre completo, divide en nombre/apellidos
- Capitaliza correctamente (Primera Letra Mayúscula)

TELÉFONOS:
- Acepta formatos: 123456789, 123-456-789, +34 123 456 789, etc.
- Normaliza a formato: 123456789 (9 dígitos sin espacios ni guiones)
- Si tiene prefijo internacional, manténlo pero sin espacios

EMAILS:
- Extrae direcciones completas: usuario@dominio.com
- Verifica que contengan @ y dominio válido

DNI:
- Formato español: 8 números + 1 letra
- Normaliza sin espacios: 12345678A

FECHAS DE NACIMIENTO:
- Convierte a formato DD/MM/YYYY
- Acepta formatos: "15 de mayo de 1990", "15/05/1990", "mayo 15, 1990"

EDAD:
- Si se menciona explícitamente en la transcripción, úsala
- Si hay fecha de nacimiento, calcula la edad actual correctamente (año actual - año nacimiento)
- Si no hay fecha ni edad mencionada, devuelve null
- Redondea a número entero

ESTADO DEL LEAD:
- "Nuevo": Primer contacto, recién conocido
- "Contactado": Ya se habló con ellos anteriormente
- "Interesado": Muestran interés en cursos/servicios
- "No interesado": Rechazaron o no están interesados
- "Dudoso": Indecisos, necesitan más información

EJEMPLOS:

Transcripción: "María González López, teléfono 654-321-987, email maria.gonzalez@gmail.com, DNI 12345678A, nació el 15 de mayo de 1990, está muy interesada en el curso de inglés para adultos"
Respuesta:
{
  "leads": [
    {
      "nombre": "María",
      "apellidos": "González López",
      "telefono": "654321987",
      "email": "maria.gonzalez@gmail.com",
      "dni": "12345678A",
      "fechaNacimiento": "15/05/1990",
      "edad": 35,
      "estado": "Interesado",
      "notas": "Interesada en curso de inglés para adultos"
    }
  ]
}

Transcripción: "Llamó Ana Martín, su número es seis cinco cuatro tres dos uno nueve ocho siete, dice que lo pensará y me llamará la próxima semana"
Respuesta:
{
  "leads": [
    {
      "nombre": "Ana",
      "apellidos": "Martín",
      "telefono": "654321987",
      "email": null,
      "dni": null,
      "fechaNacimiento": null,
      "edad": null,
      "estado": "Dudoso",
      "notas": "Dice que lo pensará y llamará la próxima semana"
    }
  ]
}

Transcripción: "Pedro Ruiz, pedroruiz85@hotmail.com, 28 años, no le interesa por ahora. Su hermana Carmen Ruiz sí está interesada, su teléfono es 987-654-321"
Respuesta:
{
  "leads": [
    {
      "nombre": "Pedro",
      "apellidos": "Ruiz",
      "telefono": null,
      "email": "pedroruiz85@hotmail.com",
      "dni": null,
      "fechaNacimiento": null,
      "edad": 28,
      "estado": "No interesado",
      "notas": "No le interesa por ahora"
    },
    {
      "nombre": "Carmen",
      "apellidos": "Ruiz",
      "telefono": "987654321",
      "email": null,
      "dni": null,
      "fechaNacimiento": null,
      "edad": null,
      "estado": "Interesado",
      "notas": "Hermana de Pedro Ruiz, sí está interesada"
    }
  ]
}

AHORA EXTRAE LOS DATOS DE ESTA TRANSCRIPCIÓN:
"${transcription}"

RECORDATORIO CRÍTICO: Si hay fecha de nacimiento, calcula la edad correctamente usando el año actual (2025). Si se menciona edad explícitamente, usa esa. Si no hay ni fecha ni edad, deja como null.

RESPONDE SOLO CON EL JSON:`;

    console.log('🌐 Enviando a OpenAI GPT para extracción de leads...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1200
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    console.log('📝 Respuesta cruda de GPT (leads):', content);
    
    // Limpiar la respuesta para asegurar que sea JSON válido
    let cleanContent = content.trim();
    
    // Remover cualquier texto antes o después del JSON
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd);
    }
    
    console.log('📝 JSON limpio (leads):', cleanContent);
    
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Error parsing JSON (leads):', parseError);
      console.log('Contenido que falló:', cleanContent);
      
      // Fallback: crear estructura básica para leads
      parsed = {
        leads: [{
          nombre: null,
          apellidos: null,
          telefono: null,
          email: null,
          dni: null,
          fechaNacimiento: null,
          edad: null,
          estado: "Nuevo",
          notas: transcription.substring(0, 200) + (transcription.length > 200 ? "..." : "")
        }]
      };
    }
    
    // Validar y normalizar estructura
    if (!parsed.leads || !Array.isArray(parsed.leads) || parsed.leads.length === 0) {
      console.warn('⚠️ Estructura inválida, creando fallback para leads');
      parsed = {
        leads: [{
          nombre: null,
          apellidos: null,
          telefono: null,
          email: null,
          dni: null,
          fechaNacimiento: null,
          edad: null,
          estado: "Nuevo",
          notas: transcription.substring(0, 200) + (transcription.length > 200 ? "..." : "")
        }]
      };
    }
    
    // Validar y normalizar cada lead
    const validStates = ["Nuevo", "Contactado", "Interesado", "No interesado", "Dudoso"];
    
    parsed.leads = parsed.leads.map((lead: any, index: number) => {
      // Normalizar teléfono
      let cleanPhone = lead.telefono;
      if (cleanPhone && typeof cleanPhone === 'string') {
        // Limpiar teléfono removiendo espacios, guiones y manteniendo solo números y +
        cleanPhone = cleanPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        // Validar formato español (9 dígitos) o internacional (+34...)
        if (cleanPhone.match(/^\d{9}$/)) {
          // Mantener formato sin guiones: 123456789
          cleanPhone = cleanPhone;
        } else if (cleanPhone.match(/^\+\d+$/)) {
          // Mantener prefijo internacional sin espacios
          cleanPhone = cleanPhone;
        }
      }
      
      // Normalizar DNI
      let cleanDNI = lead.dni;
      if (cleanDNI && typeof cleanDNI === 'string') {
        cleanDNI = cleanDNI.replace(/\s+/g, '').toUpperCase();
        // Validar formato básico español
        if (!cleanDNI.match(/^\d{8}[A-Z]$/)) {
          cleanDNI = null; // Si no es válido, mejor null
        }
      }
      
      
      // Normalizar edad
      let cleanAge = lead.edad;
      if (cleanAge !== null && cleanAge !== undefined) {
        cleanAge = parseInt(cleanAge);
        if (isNaN(cleanAge) || cleanAge < 0 || cleanAge > 120) {
          cleanAge = null;
        }
      }
      
      return {
        nombre: lead.nombre || null,
        apellidos: lead.apellidos || null,
        telefono: cleanPhone || null,
        email: lead.email || null,
        dni: cleanDNI || null,
        fechaNacimiento: lead.fechaNacimiento || null,
        edad: cleanAge,
        estado: validStates.includes(lead.estado) ? lead.estado : "Nuevo",
        notas: lead.notas || `Lead ${index + 1} extraído de transcripción`
      };
    });
    
    console.log('✅ Extracción de leads completada y validada:', parsed);
    return parsed;
    
  } catch (error) {
    console.error('❌ Error extracting leads data:', error);
    
    // Fallback completo en caso de error
    const fallback = {
      leads: [{
        nombre: null,
        apellidos: null,
        telefono: null,
        email: null,
        dni: null,
        fechaNacimiento: null,
        edad: null,
        estado: "Nuevo",
        notas: `Error procesando transcripción: ${transcription.substring(0, 100)}...`
      }]
    };
    
    console.log('🔄 Usando fallback (leads):', fallback);
    return fallback;
  }
}