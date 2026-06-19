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
    const { q1, q2, q3, q4, activityIndex } = JSON.parse(event.body);

    if (!q1 || !q2 || !q3 || !q4 || !activityIndex) {
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
          feedback: `[MODO MOCK - Sin API Key] Evaluamos tus 4 respuestas de la Actividad ${activityIndex}. Acertaste en la delimitación conceptual del tema, aunque en la pregunta 3 faltó citar detalles precisos del material. Tu propuesta de aplicación en el trabajo es viable.`,
          isMock: true
        })
      };
    }

    // Build standard prompt for Gemini
    const prompt = `Actuás como un docente evaluador sumamente riguroso y formal para el módulo "Formación y Desarrollo de Empleados". Evaluás la entrega de la Actividad N° ${activityIndex} para un caso de PyME comercial argentina en proceso de digitalización.
Tu tono debe ser profesional, constructivo, pero sumamente exigente, utilizando español rioplatense (argentino) formal (usando vos y conjugaciones como "debés", "tené en cuenta", "analizás").

CRITERIO CRÍTICO DE APROBACIÓN POR ACTIVIDAD (LECTURA OBLIGATORIA DEL MATERIAL):
La calificación máxima absoluta está limitada a un máximo de 3/5 puntos si la respuesta del estudiante en alguna de las 3 preguntas conceptuales es incorrecta, incompleta o no demuestra haber leído el material según las exigencias específicas:

- ACTIVIDAD 1 (Concepto y Objetivos - Págs. 2-3):
  * Pregunta 1: Debe enumerar al menos 3 de los 5 objetivos comunes de la formación (Mejorar desempeño, Incrementar satisfacción/motivación, Reducir rotación, Atraer/retener, Adaptarse a cambios).
  * Pregunta 2: Debe explicar que la "formación" se centra en el puesto actual y el "desarrollo" se enfoca en el crecimiento a largo plazo y asunción de roles avanzados.
  * Pregunta 3: Debe explicar la importancia de la asunción de roles avanzados y el crecimiento a largo plazo.
  * Pregunta 4 (Aplicación): Debe proponer una aplicación de estos conceptos en su trabajo o actividad laboral concreta.

- ACTIVIDAD 2 (Importancia y Retención - Págs. 3-4):
  * Pregunta 1: Debe citar la estadística del reporte de LinkedIn (2020) que es el 94% de los empleados.
  * Pregunta 2: Debe citar formalmente al autor HUSELID (1995) respecto al rendimiento organizacional.
  * Pregunta 3: Debe detallar cómo contribuye a reducir costos de selección y mejorar la retención según el texto.
  * Pregunta 4 (Aplicación): Debe proponer una aplicación de retención de talento mediante formación.

- ACTIVIDAD 3 (DNC - Págs. 4-5):
  * Pregunta 1: Debe proponer al menos DOS herramientas de DNC en adición a encuestas/cuestionarios (observación directa en el trabajo y revisión de registros de desempeño).
  * Pregunta 2: Debe indicar que se debe involucrar activamente a empleados, supervisores y gerentes para garantizar validez.
  * Pregunta 3: Debe justificar por qué es fundamental el diagnóstico previo según el texto.
  * Pregunta 4 (Aplicación): Debe proponer una aplicación de las técnicas de DNC.

- ACTIVIDAD 4 (Diseño SMART - Págs. 5-6):
  * Pregunta 1: Debe redactar un objetivo comercial de ventas SMART y explicar explícitamente sus siglas (Específico, Medible, Alcanzable, Relevante, Limitado en el tiempo).
  * Pregunta 2: Debe mencionar metodologías o formatos descritos en la Pág. 6 para adaptarse a estilos de aprendizaje (ej. e-learning, rotación, etc.).
  * Pregunta 3: Debe explicar cómo influye el diseño en la efectividad y compromiso del colaborador.
  * Pregunta 4 (Aplicación): Debe proponer una aplicación formulando metas SMART.

- ACTIVIDAD 5 (Evaluación - Págs. 6-7):
  * Pregunta 1: Debe detallar secuencialmente los primeros 3 pasos (1. Establecer criterios, 2. Recopilar datos valiosos, 3. Analizar datos/insights).
  * Pregunta 2: Debe detallar secuencialmente los últimos 3 pasos (4. Interpretar resultados, 5. Ajustes y mejoras, 6. Retroalimentación clara).
  * Pregunta 3: Debe explicar por qué la retroalimentación es un paso crítico.
  * Pregunta 4 (Aplicación): Debe proponer cómo evaluar una actividad laboral concreta.

- ACTIVIDAD 6 (Herramientas y Técnicas - Págs. 7-8):
  * Pregunta 1: Debe definir conceptualmente el "microaprendizaje" de forma fiel a la Pág. 8.
  * Pregunta 2: Debe definir conceptualmente el "aprendizaje colaborativo" según la Pág. 8.
  * Pregunta 3: Debe identificar la evaluación de 360 grados como el "espejo que refleja una imagen completa" de feedback.
  * Pregunta 4 (Aplicación): Debe aplicar microaprendizaje o aprendizaje colaborativo a su puesto.

- ACTIVIDAD 7 (Sucesión - Págs. 8-9):
  * Pregunta 1: Debe definir programas de sucesión como un "semillero de futuros líderes" (Pág. 8).
  * Pregunta 2: Debe detallar los 4 pasos post-identificación: entrenamiento intensivo, proyectos desafiantes, mentorías y rotación de áreas (Pág. 9).
  * Pregunta 3: Debe explicar el beneficio estratégico de mitigar riesgos en cargos clave.
  * Pregunta 4 (Aplicación): Debe detallar la preparación para la sucesión en su puesto.

- ACTIVIDAD 8 (Aprendizaje Continuo - Págs. 9-10):
  * Pregunta 1: Debe explicar la mentalidad de experimentar y aprender de los errores sin temor a castigos.
  * Pregunta 2: Debe listar tecnologías sugeridas en la Pág. 10 (e-learning, videos tutoriales, podcasts, bases de conocimiento, redes sociales corporativas).
  * Pregunta 3: Debe explicar cómo impacta esta cultura en la innovación y adaptabilidad.
  * Pregunta 4 (Aplicación): Debe aplicar el fomento de esta cultura en su trabajo.

- ACTIVIDAD 9 (Habilidades Blandas - Pág. 10):
  * Pregunta 1: Debe nombrar las 3 habilidades que promueve Google (liderazgo, colaboración y comunicación efectiva).
  * Pregunta 2: Debe detallar que se evalúa mediante observaciones, autoevaluaciones y feedback de colegas/supervisores.
  * Pregunta 3: Debe explicar por qué son tan críticas como las habilidades técnicas según el material.
  * Pregunta 4 (Aplicación): Debe detallar el desarrollo de habilidades blandas en su trabajo.

Respuestas entregadas por el alumno:
- Respuesta Pregunta 1: "${q1.replace(/"/g, '\\"')}"
- Respuesta Pregunta 2: "${q2.replace(/"/g, '\\"')}"
- Respuesta Pregunta 3: "${q3.replace(/"/g, '\\"')}"
- Respuesta Pregunta 4 (Aplicación): "${q4.replace(/"/g, '\\"')}"

Rúbrica de Puntuación (1 a 5 puntos):
- 1 a 2 puntos: Respuestas sumamente genéricas o incompletas en su mayoría, omitiendo conceptos clave y citas requeridas del material de estudio.
- 3 puntos: Cumple con la estructura de responder a las consignas, pero presenta omisiones o errores parciales en los conceptos teóricos exigidos por el material de estudio, o no cita adecuadamente.
- 4 puntos: Responde de forma correcta y precisa las preguntas conceptuales basadas en el material, citando adecuadamente y proponiendo una aplicación laboral viable y coherente.
- 5 puntos: Excelente entrega académica. Demuestra lectura exhaustiva del material de estudio, responde de forma impecable y detallada cada pregunta conceptual con pensamiento crítico y aporta una propuesta de aplicación sumamente concreta y profesional.

Tu feedback debe detallar explícitamente:
1. En qué acertó el estudiante (qué conceptos del material de estudio describió correctamente).
2. En qué erró o quedó incompleto (qué partes faltaron o son conceptualmente erróneas de acuerdo al apunte teórico).
3. Cómo influyeron estos aciertos y errores en la calificación final asignada.

Debés responder EXCLUSIVAMENTE con un objeto JSON válido (sin caracteres de escape de markdown ni explicaciones externas), respetando esta estructura:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<devolución docente detallada en español rioplatense explicando los aciertos, los errores/omisiones específicos y su impacto en la nota de forma formal y exigente>"
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
