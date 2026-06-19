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
La calificación máxima absoluta está limitada a un máximo de 3/5 puntos si la respuesta del estudiante no demuestra fehacientemente haber leído y aplicado los conceptos y autores del material de estudio según la actividad específica:

- ACTIVIDAD 1: Debe enumerar al menos 3 de los 5 objetivos comunes de la formación (Págs. 2-3: a. Mejorar desempeño, b. Incrementar satisfacción/motivación, c. Reducir rotación, d. Atraer/retener, e. Adaptarse a cambios) y explicar que el "desarrollo" se enfoca en el crecimiento a largo plazo y asunción de roles avanzados, a diferencia de la "formación" centrada en el puesto actual.
- ACTIVIDAD 2: Debe mencionar que según el reporte de LinkedIn (2020), el 94% de los empleados permanecería más tiempo si se invierte en su desarrollo, y citar formalmente el estudio de HUSELID (1995) sobre el rendimiento organizacional (Pág. 3).
- ACTIVIDAD 3: Debe proponer al menos DOS herramientas de DNC del texto en adición a encuestas/cuestionarios (Pág. 4: observación directa en el trabajo y revisión de registros de desempeño) e involucrar activamente a empleados, supervisores y gerentes (Pág. 5).
- ACTIVIDAD 4: Debe redactar un objetivo comercial de capacitación que siga estrictamente la metodología SMART (Pág. 5), explicando explícitamente sus siglas en español (Específico, Medible, Alcanzable, Relevante, Limitado en el tiempo) y mencionar metodologías de la Pág. 6 para adaptarse a estilos de aprendizaje.
- ACTIVIDAD 5: Debe enumerar y detallar secuencialmente los SEIS pasos del proceso de evaluación descritos en el material (Págs. 6-7: 1. Establecer criterios, 2. Recopilar datos valiosos, 3. Analizar datos/insights, 4. Interpretar resultados, 5. Ajustes y mejoras, 6. Retroalimentación clara).
- ACTIVIDAD 6: Debe definir conceptualmente el "microaprendizaje" y el "aprendizaje colaborativo" según el texto (Pág. 8) e identificar que la evaluación de 360 grados se define como un "espejo que refleja una imagen completa" de feedback (Pág. 8).
- ACTIVIDAD 7: Debe definir los programas de sucesión como un "semillero de futuros líderes" (Pág. 8) y detallar los pasos de preparación post-identificación (entrenamiento intensivo, proyectos desafiantes, mentorías y rotación de áreas - Pág. 9).
- ACTIVIDAD 8: Debe explicar que se debe fomentar una mentalidad de experimentar y aprender de los errores sin temor a castigos (Pág. 9) y listar herramientas tecnológicas de la Pág. 10 (plataformas e-learning, videos tutoriales, podcasts, bases de conocimiento internas, redes sociales corporativas).
- ACTIVIDAD 9: Debe enumerar las 3 habilidades blandas que promueve Google (liderazgo, colaboración y comunicación efectiva - Pág. 10) y explicar que su progreso se evalúa mediante observaciones, autoevaluaciones y retroalimentación de colegas/supervisores.

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
