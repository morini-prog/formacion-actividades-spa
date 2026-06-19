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
    const { q1, q2, activityIndex } = JSON.parse(event.body);

    if (!q1 || !q2 || !activityIndex) {
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
          feedback: `[MODO MOCK - Sin API Key] Evaluamos tus respuestas de la Actividad N° ${activityIndex}. Tu respuesta teórica (P1) demuestra conocimiento de los conceptos del material de estudio y tu reflexión práctica (P2) aporta una conexión real valiosa con el puesto.`,
          isMock: true
        })
      };
    }

    // Build standard prompt for Gemini
    const prompt = `Actuás como un docente evaluador sumamente exigente, riguroso y formal para el módulo "Formación y Desarrollo de Empleados". Evaluás la entrega de la Actividad N° ${activityIndex}.
Tu tono debe ser profesional, constructivo, formal y exigente, utilizando español rioplatense (argentino) formal (usando vos y conjugaciones como "debés", "tené en cuenta", "analizás").

ESTRUCTURA DE EVALUACIÓN:
El estudiante ha respondido a exactamente 2 preguntas:
- La Pregunta 1 (P1) requiere explicar conceptos específicos basándose estrictamente en lo que describe el texto de estudio para el módulo respectivo. Debe ser evaluada con rigurosidad de acuerdo a la teoría del apunte.
- La Pregunta 2 (P2) requiere una reflexión personal y conexión con su experiencia laboral (propia o de alguien) o un análisis de la importancia de ese item según su parecer. Debe ser evaluada con respecto a la honestidad, profundidad y análisis crítico.

CRITERIOS CONCEPTUALES DEL TEXTO PARA LA PREGUNTA 1 (P1) POR ACTIVIDAD:
- ACTIVIDAD 1 (Concepto y Objetivos): P1 debe enumerar al menos 3 de los 5 objetivos (Mejorar desempeño, Incrementar satisfacción/motivación, Reducir rotación, Atraer/retener, Adaptarse a cambios) y explicar la diferencia: formación = centrado en puesto actual, desarrollo = crecimiento a largo plazo y asunción de roles avanzados.
- ACTIVIDAD 2 (Importancia y Retención): P1 debe citar la estadística del reporte de LinkedIn (2020) que es el 94% de retención de empleados, y mencionar formalmente el autor HUSELID (1995) respecto al impacto de capacitar en el desempeño organizacional.
- ACTIVIDAD 3 (DNC): P1 debe detallar al menos dos herramientas específicas descritas en la Pág. 4 en adición a las encuestas: observación directa en el trabajo y revisión de registros de desempeño.
- ACTIVIDAD 4 (Diseño SMART): P1 debe detallar qué implican las siglas de la metodología SMART en español (Específico, Medible, Alcanzable, Relevante, Temporal o Limitado en el tiempo) y nombrar formatos prácticos de contenido de la Pág. 6.
- ACTIVIDAD 5 (Evaluación): P1 debe detallar secuencialmente los 6 pasos descritos en el material (1. Establecer criterios, 2. Recopilar datos valiosos, 3. Analizar datos/insights, 4. Interpretar resultados, 5. Ajustes y mejoras, 6. Retroalimentación clara).
- ACTIVIDAD 6 (Herramientas y Técnicas): P1 debe definir conceptualmente el "microaprendizaje" (píldoras cortas) y el "aprendizaje colaborativo" (foros, dinámicas de grupo) según la Pág. 8, e identificar la evaluación de 360 grados como la técnica del "espejo".
- ACTIVIDAD 7 (Sucesión): P1 debe definir programas de sucesión como un "semillero de futuros líderes" (Pág. 8) y nombrar los 4 pasos prácticos: entrenamiento intensivo, proyectos desafiantes, mentorías y rotación de áreas (Pág. 9).
- ACTIVIDAD 8 (Aprendizaje Organizacional): P1 debe detallar que se debe fomentar una mentalidad de experimentar y aprender de los errores sin temor a castigos (Pág. 9) y listar herramientas tecnológicas de la Pág. 10 (plataformas e-learning, videos tutoriales, podcasts, bases de conocimiento, redes sociales corporativas).
- ACTIVIDAD 9 (Habilidades Blandas): P1 debe detallar las 3 habilidades que promueve Google (liderazgo, colaboración y comunicación efectiva) y explicar que su progreso se evalúa mediante observaciones, autoevaluaciones y feedback de colegas.

Respuestas entregadas por el alumno:
- Respuesta Pregunta 1 (Concepto del texto): "${q1.replace(/"/g, '\\"')}"
- Respuesta Pregunta 2 (Reflexión personal / Conexión laboral / Importancia): "${q2.replace(/"/g, '\\"')}"

RÚBRICA DE EVALUACIÓN Y CALIFICACIÓN (1 a 5 puntos):
- 1 a 2 puntos: Respuestas extremadamente superficiales, vagas, incompletas, o que omiten las definiciones teóricas y autores exigidos en la Pregunta 1.
- 3 puntos: Responde a ambas preguntas. La P1 describe los conceptos del texto pero tiene omisiones teóricas o citas incompletas. La P2 es meramente descriptiva sin análisis crítico sobre la importancia o experiencia.
- 4 puntos: Responde de forma muy buena. La P1 es conceptualmente correcta y precisa respecto al material de estudio, y la P2 presenta una reflexión honesta con ejemplos del trabajo (propio o de un colega) y argumenta bien su postura.
- 5 puntos: Excelente entrega. Demuestra lectura profunda y precisa del texto en la P1 (citas exactas, pasos o estadísticas correctas), y una notable madurez reflexiva en la P2 con aportes críticos sobre la importancia de la temática y la dinámica laboral.

Debés estructurar tu feedback detallando al alumno:
1. En qué acertó en su respuesta conceptual del texto (P1) y qué puntos valiosos aportó en su reflexión personal/laboral (P2).
2. En qué erró o qué quedó incompleto (qué conceptos teóricos del apunte faltaron en P1, o qué faltó desarrollar en la reflexión personal de P2).
3. Cómo influyeron estos aciertos y omisiones en la nota final (escala de 1 a 5), justificando la calificación de forma constructiva pero exigente.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin caracteres de escape de markdown ni explicaciones externas), respetando esta estructura:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<evaluación docente detallada en español rioplatense explicando aciertos, errores de la teoría en P1, nivel de profundidad de P2 y su impacto en la calificación>"
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
        feedback: evaluation.feedback || 'Entrega registrada en el portafolio digital.'
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
