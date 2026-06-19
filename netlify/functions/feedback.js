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
          feedback: `[MODO MOCK - Sin API Key] Evaluamos tus respuestas de reflexión de la Actividad ${activityIndex}. Has realizado una excelente conexión personal con el tema y tu análisis laboral es muy atinado.`,
          isMock: true
        })
      };
    }

    // Build standard prompt for Gemini
    const prompt = `Actuás como un docente evaluador de nivel de posgrado / senior para el módulo de "Formación y Desarrollo de Empleados". Evaluás la entrega de la Actividad N° ${activityIndex}.
Tu tono debe ser sumamente profesional, constructivo, exigente y reflexivo, utilizando español rioplatense (argentino) formal (usando vos y conjugaciones como "debés", "tené en cuenta", "analizás").

ESTRUCTURA DE PREGUNTAS POR ACTIVIDAD (ENFOQUE EN REFLEXIÓN PERSONAL Y CONEXIÓN LABORAL):
El estudiante ha respondido dos preguntas diseñadas para vincular la teoría del módulo con su propia reflexión personal y su conexión con su trabajo actual o el de otra persona:

- ACTIVIDAD 1 (Concepto y Objetivos):
  * Pregunta 1: Aspectos más descuidados en los lugares de trabajo actuales respecto a los objetivos de formación y desarrollo (experiencia propia o de un colega).
  * Pregunta 2: Diferencia práctica entre espacio de "formación para el puesto" y de "desarrollo a largo plazo" aplicada a su empleo actual o conocido, con ejemplo concreto.

- ACTIVIDAD 2 (Importancia y Retención):
  * Pregunta 1: Relato sobre si permaneció o se fue de un empleo debido a la presencia o ausencia de oportunidades de aprendizaje en su trayectoria laboral o la de alguien cercano.
  * Pregunta 2: Impacto de la falta de capacitación en la motivación diaria de un equipo de trabajo (el propio o uno observado).

- ACTIVIDAD 3 (DNC):
  * Pregunta 1: Cuál de las herramientas de DNC (observación, registros, encuestas) considerás que sería más aceptada y efectiva en su entorno, y por qué.
  * Pregunta 2: Cómo involucraría a distintos roles (compañeros, supervisores, gerentes) para un diagnóstico honesto y no punitivo.

- ACTIVIDAD 4 (Diseño SMART):
  * Pregunta 1: Estructuración de un objetivo personal de aprendizaje bajo criterios SMART (Específico, Medible, Alcanzable, Relevante, Temporal) para sus metas profesionales.
  * Pregunta 2: Formato de capacitación que mejor se adapta a su propio estilo de aprendizaje y cómo cree que impacta en su rendimiento diario.

- ACTIVIDAD 5 (Evaluación):
  * Pregunta 1: Cómo mediría, a nivel personal, si un taller o curso que tomó realmente valió la pena y cambió su forma de trabajar.
  * Pregunta 2: Mecanismos de retroalimentación (feedback) que funcionan mejor en su entorno laboral para realizar mejoras, y cuáles generan rechazo.

- ACTIVIDAD 6 (Herramientas y Técnicas):
  * Pregunta 1: Cómo podría incorporar "píldoras de aprendizaje" de forma autónoma en su rutina laboral diaria para mantenerse actualizado sin saturarse.
  * Pregunta 2: Miedos o beneficios que surgirían si en su equipo se implementara una evaluación de 360 grados.

- ACTIVIDAD 7 (Sucesión):
  * Pregunta 1: En qué habilidades blandas o técnicas sentiría que necesita más entrenamiento o mentoría si fuera propuesto para suceder a un cargo clave.
  * Pregunta 2: Cómo impacta la falta de un plan de sucesión claro en la estabilidad y clima de trabajo de un área específica cuando se va un líder clave (caso real o hipotético).

- ACTIVIDAD 8 (Aprendizaje Continuo):
  * Pregunta 1: Cómo reacciona su entorno laboral ante un error operativo. ¿Fomenta el aprendizaje o el castigo? Reflexión crítica.
  * Pregunta 2: Cuál de las tecnologías/canales sugeridos (redes corporativas, e-learning, bases de conocimiento) se adaptaría mejor a su equipo para compartir conocimiento cotidiano.

- ACTIVIDAD 9 (Habilidades Blandas):
  * Pregunta 1: Cuál de las 3 habilidades (liderazgo, colaboración, comunicación efectiva) es su mayor fortaleza y en cuál necesita desarrollo intencional.
  * Pregunta 2: Cómo afecta al equipo tener un compañero con excelente capacidad técnica pero serias deficiencias en habilidades blandas (caso real o hipotético).

Respuestas del alumno para evaluar:
- Respuesta Pregunta 1: "${q1.replace(/"/g, '\\"')}"
- Respuesta Pregunta 2: "${q2.replace(/"/g, '\\"')}"

CRITERIO DE EVALUACIÓN Y CALIFICACIÓN (1 a 5 puntos):
No busques respuestas de memoria o literales del texto. Evaluá la profundidad, honestidad, autocrítica y conexión real del estudiante con el mundo del trabajo.

- 1 a 2 puntos: Respuestas extremadamente superficiales, vagas, de uno o dos renglones, o respuestas genéricas que no muestran reflexión personal ni dan detalles o ejemplos de un entorno laboral real.
- 3 puntos: El alumno responde ambas preguntas y describe su entorno, pero de forma descriptiva o superficial, sin un análisis crítico profundo del impacto en las personas o la organización.
- 4 puntos: Muestra un análisis crítico muy bueno. Conecta claramente los conceptos teóricos con su experiencia laboral (o de un colega), aportando ejemplos bien argumentados sobre aciertos, miedos o dinámicas de trabajo.
- 5 puntos: Trabajo excelente. La reflexión es profunda, honesta, demuestra una autocrítica valiosa y un entendimiento maduro de cómo las personas y los procesos se interconectan en el ámbito laboral. Aporta ejemplos ricos en contexto de su trabajo o de terceros.

Debés estructurar tu feedback explicando al estudiante:
1. En qué acertó o qué puntos de su reflexión personal son los más valiosos y rescatables.
2. En qué erró, qué quedó incompleto o qué aspectos podría haber profundizado más en su análisis laboral o autocrítico.
3. El motivo detallado de la calificación final asignada de acuerdo a su nivel de profundidad y argumentación.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin caracteres de escape de markdown ni explicaciones externas), respetando esta estructura:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<evaluación docente detallada en español rioplatense explicando los aciertos reflexivos, las áreas de mejora y cómo se determinó la nota>"
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
