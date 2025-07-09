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