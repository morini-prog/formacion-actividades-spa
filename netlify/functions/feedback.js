const https = require('https');

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { reflection, url, justification, activityIndex } = JSON.parse(event.body);

    if (!reflection || !url || !justification || !activityIndex) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Faltan campos obligatorios en el envío' }) 
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Mock feedback as fallback when API key is missing
      console.warn("GEMINI_API_KEY no está configurada. Usando feedback de simulación.");
      
      const mockScores = [4, 5, 3];
      const mockScore = mockScores[activityIndex % mockScores.length];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          score: mockScore,
          feedback: `[MODO MOCK - Sin API Key] ¡Buen trabajo en la Actividad ${activityIndex}! Tu reflexión sobre el módulo muestra un entendimiento sólido. La justificación de tu recurso es adecuada, aunque podrías profundizar más en cómo se aplica directamente en el ámbito laboral argentino. ¡Seguí así!`,
          isMock: true
        })
      };
    }

    // Build standard prompt for Gemini
    const prompt = `Actuás como un docente evaluador sumamente riguroso y formal para el módulo "Formación y Desarrollo de Empleados". Evaluás la entrega de la Actividad N° ${activityIndex} para un caso de PyME comercial argentina en proceso de digitalización.
Tu tono debe ser profesional, constructivo, pero sumamente exigente, utilizando español rioplatense (argentino) formal (usando vos y conjugaciones como "debés", "tené en cuenta", "analizás").

CRITERIO CRÍTICO DE APROBACIÓN (LECTURA OBLIGATORIA DEL MATERIAL):
La calificación máxima absoluta está limitada a un máximo de 3/5 puntos si la respuesta del estudiante no demuestra fehacientemente haber leído y aplicado los conceptos y autores del material de estudio según la actividad:

- Para la ACTIVIDAD 1: Debe proponer al menos DOS herramientas de DNC listadas en el texto (encuestas, cuestionarios, observación directa, registros de desempeño) y cómo involucrar activamente al empleado (Pág. 5). Además, debe incluir obligatoriamente una cita formal a HUSELID (1995) o al informe de LINKEDIN (2020) sobre retención de talento para fundamentar la inversión (Pág. 3). Si no incluye estas citas y herramientas específicas, calificalo con máximo 2 o 3.
- Para la ACTIVIDAD 2: Debe redactar un objetivo comercial de capacitación estructurado estrictamente según la metodología SMART (Pág. 5). También debe proponer al menos DOS metodologías de aprendizaje del texto (Pág. 7-8: capacitaciones presenciales, e-learning, coaching, mentorías, programas de rotación, evaluación 360, microaprendizaje, aprendizaje colaborativo, aprendizaje móvil, gamificación, personalización). Debe mencionar además el enfoque de habilidades blandas de GOOGLE (Pág. 10). Si no cumple el formato SMART, no incluye las metodologías específicas o no cita a Google, la nota no puede superar 3.
- Para la ACTIVIDAD 3: Debe listar e implementar los SEIS pasos clave del proceso de evaluación descritos en el material (Pág. 6-7: 1. Establecer criterios, 2. Recopilar datos, 3. Analizar datos en busca de insights, 4. Interpretar resultados, 5. Ajustes y mejoras, 6. Retroalimentación clara). Adicionalmente, debe proponer estrategias para crear una cultura de aprendizaje continuo basada en la tolerancia y aprendizaje del error (Pág. 9). Si no fundamenta los seis pasos o el aprendizaje basado en el error, calificalo con máximo 3.

Detalles de la entrega del alumno:
- Reflexión/Análisis: "${reflection.replace(/"/g, '\\"')}"
- Recurso investigado (URL): "${url.replace(/"/g, '\\"')}"
- Justificación del recurso: "${justification.replace(/"/g, '\\"')}"

Rúbrica de Puntuación:
1 a 2 puntos: Respuestas sumamente genéricas, vacías o que omiten casi en su totalidad los conceptos teóricos y citas requeridas del material de estudio.
3 puntos: Cumple con la estructura formal, pero es descriptivo y tiene omisiones parciales de las citas, autores, o pasos teóricos exigidos por el material de estudio. No puede superar este puntaje si falta alguna de las citas/metodologías obligatorias indicadas en el criterio crítico.
4 puntos: Cumple rigurosamente con todas las citas requeridas del material, redacta con pensamiento crítico, utiliza las herramientas del texto, y propone una justificación sólida.
5 puntos: Excelente entrega académica. Aplica con maestría cada concepto teórico y autor del texto, propone soluciones innovadoras adaptadas perfectamente al caso organizacional, y demuestra un análisis crítico profundo.

Debés responder EXCLUSIVAMENTE con un objeto JSON válido (sin caracteres de escape de markdown ni explicaciones externas), respetando esta estructura:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<evaluación detallada en español rioplatense explicando qué conceptos del material aplicó correctamente y qué autores/metodologías del texto omitió o debe profundizar>"
}`;

    const requestBody = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const responseText = await new Promise((resolve, reject) => {
      const req = https.request(
        geminiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
          }
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`Error de la API de Gemini: ${res.statusCode} - ${data}`));
            }
          });
        }
      );

      req.on('error', (err) => { reject(err); });
      req.write(requestBody);
      req.end();
    });

    const parsedGeminiResponse = JSON.parse(responseText);
    const textOutput = parsedGeminiResponse.candidates[0].content.parts[0].text;
    
    // Parse Gemini's internal JSON response
    const evaluation = JSON.parse(textOutput.trim());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        score: Number(evaluation.score) || 3,
        feedback: evaluation.feedback || 'Excelente entrega, tu análisis es consistente con el marco teórico de formación y desarrollo.'
      })
    };

  } catch (err) {
    console.error('Error en feedback function:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor al procesar la evaluación: ' + err.message })
    };
  }
};
