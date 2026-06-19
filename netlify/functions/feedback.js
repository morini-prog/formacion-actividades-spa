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
    const prompt = `Actuás como un tutor académico de nivel sénior para el módulo "Formación y Desarrollo de Empleados". Evaluás la entrega del estudiante para la Actividad N° ${activityIndex} con tono constructivo, motivador y profesional, utilizando español rioplatense (argentino) de manera natural pero formal (por ejemplo, usando vos y conjugaciones apropiadas como "tené en cuenta", "comprendés", "lograste").

Detalles de la entrega:
- Reflexión/Análisis del estudiante: "${reflection.replace(/"/g, '\\"')}"
- Recurso investigado (URL): "${url.replace(/"/g, '\\"')}"
- Justificación del recurso: "${justification.replace(/"/g, '\\"')}"

Criterios de Evaluación (Escala 1 a 5 puntos):
1 punto: Muy insuficiente. Falta completar campos adecuadamente, o el contenido carece de sentido.
2 puntos: Insuficiente. Reflexión sumamente breve, recurso no relacionado o justificación pobre.
3 puntos: Aceptable. Cumple con los requerimientos mínimos, pero es puramente descriptivo y carece de análisis crítico o conexión práctica.
4 puntos: Destacado. Buen análisis, vincula la teoría con la práctica de forma adecuada, recurso relevante y bien justificado.
5 puntos: Sobresaliente. Análisis profundo y crítico, propuesta de aplicación excelente en contextos organizacionales, recurso de alto valor académico y justificación impecable.

Devolvé obligatoriamente una respuesta en formato JSON estrictamente válido, sin texto adicional alrededor, respetando esta estructura:
{
  "score": <número entero entre 1 y 5>,
  "feedback": "<texto con tu devolución constructiva en español de Argentina de 3 a 5 oraciones, destacando aciertos y sugiriendo mejoras>"
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
