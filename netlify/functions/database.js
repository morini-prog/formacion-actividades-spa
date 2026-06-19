const https = require('https');

// Fallback in-memory database if GitHub API is not configured
let localInMemoryDB = {
  students: [],
  submissions: []
};

const FILE_PATH = 'db.json';

function githubRequest(repo, token, path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Netlify-Serverless-Database',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => { reject(err); });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function getDB(repo, token) {
  if (!repo || !token) {
    return { db: localInMemoryDB, sha: null, isMock: true };
  }

  const path = `/repos/${repo}/contents/${FILE_PATH}`;
  const res = await githubRequest(repo, token, path, 'GET');
  
  if (res.statusCode === 404) {
    const initialDB = { students: [], submissions: [] };
    return {
      db: initialDB,
      sha: null,
      isMock: false
    };
  }
  
  if (res.statusCode !== 200) {
    console.error(`Error al leer de GitHub API. Código: ${res.statusCode}. Body: ${res.body}`);
    return { db: localInMemoryDB, sha: null, isMock: true, error: true };
  }
  
  const fileInfo = JSON.parse(res.body);
  const content = Buffer.from(fileInfo.content, 'base64').toString('utf-8');
  return {
    db: JSON.parse(content),
    sha: fileInfo.sha,
    isMock: false
  };
}

async function saveDB(repo, token, db, sha) {
  if (!repo || !token) {
    localInMemoryDB = db;
    return;
  }

  const path = `/repos/${repo}/contents/${FILE_PATH}`;
  const contentB64 = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
  
  const body = {
    message: 'Update educational activities database from Netlify',
    content: contentB64
  };
  
  if (sha) {
    body.sha = sha;
  }
  
  const res = await githubRequest(repo, token, path, 'PUT', body);
  if (res.statusCode !== 200 && res.statusCode !== 201) {
    throw new Error(`Error al guardar en GitHub: ${res.body}`);
  }
}

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const GITHUB_TOKEN = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // p.ej. "usuario/nombre-repositorio"

  try {
    const { db, sha, isMock } = await getDB(GITHUB_REPO, GITHUB_TOKEN);

    if (event.httpMethod === 'GET') {
      const action = event.queryStringParameters ? event.queryStringParameters.action : null;
      
      if (action === 'teacher') {
        const password = event.queryStringParameters ? event.queryStringParameters.password : null;
        if (password !== '2228') {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Acceso no autorizado' }) };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ db, isMock })
        };
      } else {
        // Consultar el progreso de un alumno específico por su mail
        const email = event.queryStringParameters ? event.queryStringParameters.email : null;
        if (!email) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta el parámetro de email' }) };
        }
        
        const cleanEmail = email.trim().toLowerCase();
        const student = db.students.find(s => s.email === cleanEmail);
        const studentSubmissions = db.submissions.filter(s => s.student_email === cleanEmail);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            student: student || null,
            submissions: studentSubmissions,
            isMock
          })
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { type } = body;

      if (type === 'auth') {
        const { email, first_name, last_name } = body.student;
        if (!email || !first_name || !last_name) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan campos del estudiante' }) };
        }

        const cleanEmail = email.trim().toLowerCase();
        let student = db.students.find(s => s.email === cleanEmail);

        if (student) {
          student.first_name = first_name.trim();
          student.last_name = last_name.trim();
        } else {
          student = {
            email: cleanEmail,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            created_at: new Date().toISOString()
          };
          db.students.push(student);
        }

        await saveDB(GITHUB_REPO, GITHUB_TOKEN, db, sha);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ student, isMock })
        };
      }

      if (type === 'submit_activity') {
        const { student_email, submission } = body;
        if (!student_email || !submission || submission.activityIndex === undefined) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan campos de la entrega' }) };
        }

        const cleanEmail = student_email.trim().toLowerCase();
        
        // Buscar si ya existe entrega para esta actividad de este alumno
        let existingSub = db.submissions.find(
          s => s.student_email === cleanEmail && s.activityIndex === submission.activityIndex
        );

        if (existingSub) {
          existingSub.q1 = submission.q1;
          existingSub.q2 = submission.q2;
          existingSub.score = Number(submission.score);
          existingSub.feedback = submission.feedback;
          existingSub.submitted_at = new Date().toISOString();
        } else {
          db.submissions.push({
            student_email: cleanEmail,
            activityIndex: submission.activityIndex,
            q1: submission.q1,
            q2: submission.q2,
            score: Number(submission.score),
            feedback: submission.feedback,
            submitted_at: new Date().toISOString()
          });
        }

        await saveDB(GITHUB_REPO, GITHUB_TOKEN, db, sha);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, isMock })
        };
      }

      if (type === 'clear_database') {
        const { password } = body;
        if (password !== '2228') {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Acceso no autorizado' }) };
        }

        db.students = [];
        db.submissions = [];

        await saveDB(GITHUB_REPO, GITHUB_TOKEN, db, sha);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, isMock })
        };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acción inválida' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no soportado' }) };

  } catch (err) {
    console.error('Error en base de datos:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error del servidor al acceder a base de datos: ' + err.message })
    };
  }
};
