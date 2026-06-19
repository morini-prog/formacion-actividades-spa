// ==========================================================================
// SPA CORE LOGIC & STATE MANAGEMENT
// ==========================================================================

const ACTIVITIES = {
  1: {
    title: "DNC y Criterio de Retorno Inversión (Págs. 3-5)",
    instruction: "Caso: PyME comercial argentina con alta rotación y resistencia al cambio en el proceso de digitalización. Diseñá el proceso de DNC proponiendo al menos DOS herramientas del material (encuestas, cuestionarios, observación directa, registros de desempeño) y cómo involucrarás activamente al personal (Pág. 5). Además, debés justificar teóricamente la inversión en capacitación citando formalmente a HUSELID (1995) o el informe de LINKEDIN (2020) sobre la retención de talento (Pág. 3)."
  },
  2: {
    title: "Planificación Pedagógica, Habilidades Blandas y Metodologías (Págs. 5-8, 10)",
    instruction: "Para la PyME comercial, redactá un objetivo de capacitación comercial para el equipo utilizando estrictamente la metodología SMART (Pág. 5). Luego, diseñá la estrategia pedagógica combinando al menos DOS metodologías del material (Pág. 7-8) y detallando cómo desarrollarás las habilidades blandas basándote en el enfoque implementado por GOOGLE (Pág. 10)."
  },
  3: {
    title: "Proceso de Evaluación e Innovación Cultural (Págs. 6-7, 9)",
    instruction: "Estructurá el plan de evaluación del programa de capacitación de la PyME comercial. Debés seguir y fundamentar los SEIS pasos clave descritos en la Pág. 6-7 del material (establecer criterios, recolectar datos, buscar insights, interpretar resultados, ajustar y retroalimentar). Finalmente, proponé cómo construirás una cultura de aprendizaje continuo basada en la experimentación y la tolerancia al error (Pág. 9)."
  }
};

// Global App State
let state = {
  currentStudent: null,   // { email, first_name, last_name }
  submissions: [],        // Submissions for logged in student
  activeView: 'view-auth', // 'view-auth' | 'view-student' | 'view-teacher'
  teacherAuthenticated: false,
  allStudents: [],        // loaded only for teacher panel
  allSubmissions: [],     // loaded only for teacher panel
  currentActivityIndex: null
};

// Base URL for Serverless APIs
const API_BASE = window.location.origin + '/.netlify/functions';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initAuthForm();
  initActivityForm();
  initTeacherPanel();
  checkSavedSession();
});

// ==========================================================================
// THEME MANAGER (Light/Dark Mode)
// ==========================================================================
function initTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('pt_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-theme');
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  themeBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('pt_theme', 'light');
      themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
      document.body.classList.add('dark-theme');
      localStorage.setItem('pt_theme', 'dark');
      themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  });
}

// ==========================================================================
// SPA ROUTER / VIEW NAVIGATION
// ==========================================================================
function initNavigation() {
  const teacherBtn = document.getElementById('teacher-access-btn');
  const logoutBtn = document.getElementById('logout-btn');

  teacherBtn.addEventListener('click', () => {
    switchView('view-teacher');
  });

  logoutBtn.addEventListener('click', () => {
    logoutStudent();
  });
}

function switchView(viewId) {
  state.activeView = viewId;
  
  // Hide all sections
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show target section
  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Adjust header buttons visibility
  const logoutBtn = document.getElementById('logout-btn');
  const teacherBtn = document.getElementById('teacher-access-btn');

  if (viewId === 'view-student') {
    logoutBtn.style.display = 'inline-flex';
    teacherBtn.style.display = 'inline-flex';
    teacherBtn.classList.remove('btn-primary');
    teacherBtn.classList.add('btn-outline');
  } else if (viewId === 'view-teacher') {
    logoutBtn.style.display = 'none';
    teacherBtn.style.display = 'inline-flex';
    teacherBtn.classList.add('btn-primary');
    teacherBtn.classList.remove('btn-outline');
  } else {
    // view-auth
    logoutBtn.style.display = 'none';
    teacherBtn.style.display = 'inline-flex';
    teacherBtn.classList.remove('btn-primary');
    teacherBtn.classList.add('btn-outline');
  }
}

// ==========================================================================
// STUDENT AUTHENTICATION FLOW
// ==========================================================================
function initAuthForm() {
  const form = document.getElementById('auth-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Registrando...';

    const first_name = document.getElementById('student-name').value.trim();
    const last_name = document.getElementById('student-lastname').value.trim();
    const email = document.getElementById('student-email').value.trim().toLowerCase();

    try {
      // Upsert Student Profile in database
      const res = await fetch(`${API_BASE}/database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'auth',
          student: { email, first_name, last_name }
        })
      });

      if (!res.ok) throw new Error('Error al registrar estudiante');
      const data = await res.json();
      
      state.currentStudent = data.student;
      localStorage.setItem('pt_student_email', email);
      
      // Load student progress
      await fetchStudentProgress(email);
      switchView('view-student');
      
    } catch (err) {
      console.error(err);
      alert('Hubo un inconveniente al conectarse con el servidor. Reintentá en unos momentos.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

async function fetchStudentProgress(email) {
  try {
    const res = await fetch(`${API_BASE}/database?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Error al obtener progreso');
    const data = await res.json();
    
    state.submissions = data.submissions || [];
    renderStudentDashboard();
  } catch (err) {
    console.error('Error cargando progreso:', err);
  }
}

function checkSavedSession() {
  const savedEmail = localStorage.getItem('pt_student_email');
  if (savedEmail) {
    // Fill form and automatically login
    document.getElementById('student-email').value = savedEmail;
    // To make it seamless, we fetch progress using the saved email
    fetch(`${API_BASE}/database?email=${encodeURIComponent(savedEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data.student) {
          state.currentStudent = data.student;
          state.submissions = data.submissions || [];
          document.getElementById('student-name').value = data.student.first_name;
          document.getElementById('student-lastname').value = data.student.last_name;
          renderStudentDashboard();
          switchView('view-student');
        }
      })
      .catch(err => console.error('Error al recuperar sesión:', err));
  }
}

function logoutStudent() {
  localStorage.removeItem('pt_student_email');
  state.currentStudent = null;
  state.submissions = [];
  document.getElementById('auth-form').reset();
  switchView('view-auth');
}

// ==========================================================================
// STUDENT DASHBOARD RENDERER & GAMIFICATION
// ==========================================================================
function calculateBadge(score) {
  if (score >= 3 && score <= 6) {
    return { name: "Aprendiz de Formación 🛡️", color: "#6b7280" };
  } else if (score >= 7 && score <= 11) {
    return { name: "Especialista en Desarrollo 🚀", color: "#004bff" };
  } else if (score >= 12 && score <= 15) {
    return { name: "Líder de Aprendizaje 👑", color: "#10b981" };
  }
  return { name: "Pendiente de Calificación", color: "var(--text-secondary)" };
}

function renderStudentDashboard() {
  if (!state.currentStudent) return;

  // Name displays
  const fullName = `${state.currentStudent.first_name} ${state.currentStudent.last_name}`;
  document.getElementById('student-fullname-display').innerText = fullName;
  document.getElementById('student-email-display').innerText = state.currentStudent.email;
  
  // Avatar initials
  const initials = `${state.currentStudent.first_name.charAt(0)}${state.currentStudent.last_name.charAt(0)}`.toUpperCase();
  document.getElementById('student-avatar').innerText = initials;

  // Update Activity Cards status
  let totalScoreSum = 0;
  let completedCount = 0;

  for (let idx = 1; idx <= 3; idx++) {
    const submission = state.submissions.find(s => s.activityIndex === idx);
    const card = document.getElementById(`card-act-${idx}`);
    const dot = document.getElementById(`dot-act-${idx}`);
    const pill = document.getElementById(`pill-act-${idx}`);
    const scoreBadge = document.getElementById(`score-act-${idx}`);

    if (submission) {
      completedCount++;
      totalScoreSum += submission.score;
      
      card.classList.add('completed');
      pill.innerText = "Aprobado";
      scoreBadge.innerText = `${submission.score}/5 pts`;
      scoreBadge.style.display = 'inline-block';
    } else {
      card.classList.remove('completed');
      pill.innerText = "Pendiente";
      scoreBadge.style.display = 'none';
    }
  }

  // Update overall progress bar
  const progressPct = Math.round((completedCount / 3) * 100);
  document.getElementById('progress-percentage').innerText = `${progressPct}% completado`;
  document.getElementById('progress-bar-fill').style.width = `${progressPct}%`;

  // Update Stats & Gamification Badge
  document.getElementById('total-score').innerText = `${totalScoreSum} / 15`;
  const badgeInfo = calculateBadge(totalScoreSum);
  const badgeTag = document.getElementById('current-badge');
  badgeTag.innerText = badgeInfo.name;
  badgeTag.style.borderColor = badgeInfo.color;
  badgeTag.style.color = badgeInfo.color === "var(--text-secondary)" ? "inherit" : badgeInfo.color;

  // Finalization Certificate Check
  const certCard = document.getElementById('certificate-unlock-card');
  if (completedCount === 3) {
    certCard.style.display = 'flex';
    
    // Fill in certificate information
    document.getElementById('cert-student-name').innerText = fullName;
    document.getElementById('cert-score').innerText = `${totalScoreSum} / 15 Puntos`;
    document.getElementById('cert-badge').innerText = badgeInfo.name;
    
    // Format current date in Argentine Spanish
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-AR', options);
    document.getElementById('cert-date').innerText = dateStr;
    
    // Init download button
    document.getElementById('download-cert-btn').onclick = downloadCertificate;
  } else {
    certCard.style.display = 'none';
  }
}

// ==========================================================================
// ACTIVITY PANEL (MODAL INTERACTION & SUBMISSION)
// ==========================================================================
window.openActivity = function(activityIndex) {
  state.currentActivityIndex = activityIndex;
  const activityData = ACTIVITIES[activityIndex];
  
  // Fill text in Modal
  document.getElementById('modal-act-num').innerText = `Actividad 0${activityIndex}`;
  document.getElementById('modal-act-title').innerText = activityData.title;
  document.getElementById('modal-act-instruction').innerText = activityData.instruction;

  // Reset form
  const form = document.getElementById('activity-form');
  form.reset();

  // Check if student already submitted this
  const existingSub = state.submissions.find(s => s.activityIndex === activityIndex);
  
  const feedbackPlaceholder = document.getElementById('feedback-placeholder');
  const feedbackContent = document.getElementById('feedback-content');

  if (existingSub) {
    document.getElementById('act-reflection').value = existingSub.reflection;
    document.getElementById('act-url').value = existingSub.url;
    document.getElementById('act-justification').value = existingSub.justification;

    // Display existing feedback
    feedbackPlaceholder.style.display = 'none';
    feedbackContent.style.display = 'flex';
    document.getElementById('feedback-score-display').innerText = existingSub.score;
    document.getElementById('feedback-text-display').innerText = existingSub.feedback;
  } else {
    // Show empty placeholder
    feedbackPlaceholder.style.display = 'flex';
    feedbackContent.style.display = 'none';
  }

  // Open Modal overlay
  document.getElementById('panel-activity').classList.add('active');
};

window.closeActivity = function() {
  document.getElementById('panel-activity').classList.remove('active');
  state.currentActivityIndex = null;
};

function initActivityForm() {
  const form = document.getElementById('activity-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idx = state.currentActivityIndex;
    if (!idx || !state.currentStudent) return;

    const submitBtn = document.getElementById('btn-submit-eval');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader-inline');

    // Lock UI during call
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'inline-flex';

    const reflection = document.getElementById('act-reflection').value.trim();
    const url = document.getElementById('act-url').value.trim();
    const justification = document.getElementById('act-justification').value.trim();

    try {
      // 1. Fetch AI Feedback from Google Gemini Function
      const feedbackRes = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflection,
          url,
          justification,
          activityIndex: idx
        })
      });

      if (!feedbackRes.ok) throw new Error('Error al llamar a la evaluación por IA');
      const evalResult = await feedbackRes.json(); // { score, feedback }

      // 2. Save submission results to Database
      const dbRes = await fetch(`${API_BASE}/database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'submit_activity',
          student_email: state.currentStudent.email,
          submission: {
            activityIndex: idx,
            reflection,
            url,
            justification,
            score: evalResult.score,
            feedback: evalResult.feedback
          }
        })
      });

      if (!dbRes.ok) throw new Error('Error al guardar datos de la actividad');
      
      // Update local state
      const subIdx = state.submissions.findIndex(s => s.activityIndex === idx);
      const newSubData = {
        student_email: state.currentStudent.email,
        activityIndex: idx,
        reflection,
        url,
        justification,
        score: evalResult.score,
        feedback: evalResult.feedback,
        submitted_at: new Date().toISOString()
      };

      if (subIdx >= 0) {
        state.submissions[subIdx] = newSubData;
      } else {
        state.submissions.push(newSubData);
      }

      // Render new evaluation in sidebar
      document.getElementById('feedback-placeholder').style.display = 'none';
      document.getElementById('feedback-content').style.display = 'flex';
      document.getElementById('feedback-score-display').innerText = evalResult.score;
      document.getElementById('feedback-text-display').innerText = evalResult.feedback;

      // Refresh Student dashboard stats
      renderStudentDashboard();
      
    } catch (err) {
      console.error(err);
      alert('Se produjo un error al procesar tu entrega. Por favor, verificá tu conexión.');
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      loader.style.display = 'none';
    }
  });
}

// ==========================================================================
// CERTIFICATE GENERATION (html2canvas capture)
// ==========================================================================
function downloadCertificate() {
  const certContainer = document.getElementById('completion-certificate');
  const downloadBtn = document.getElementById('download-cert-btn');
  const originalText = downloadBtn.innerHTML;
  
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando archivo de imagen...';

  // Specific html2canvas options to render correctly in high definition
  const options = {
    scale: 2, // Double quality size
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  };

  html2canvas(certContainer, options).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    
    const fileName = `Certificado_Formacion_Desarrollo_${state.currentStudent.first_name}_${state.currentStudent.last_name}.png`.replace(/\s+/g, '_');
    link.download = fileName;
    link.href = imgData;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    downloadBtn.disabled = false;
    downloadBtn.innerHTML = originalText;
  }).catch(err => {
    console.error('Error al generar certificado:', err);
    alert('No se pudo generar la imagen del certificado. Reintentá nuevamente.');
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = originalText;
  });
}

// ==========================================================================
// TEACHER PANEL CONTROL & DATA MANAGEMENT
// ==========================================================================
function initTeacherPanel() {
  const loginForm = document.getElementById('teacher-login-form');
  const exitBtn = document.getElementById('btn-exit-teacher');
  const refreshBtn = document.getElementById('btn-refresh-teacher');
  const exportBtn = document.getElementById('btn-export-csv');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('teacher-password').value;
    const errorMsg = document.getElementById('teacher-password-error');
    
    if (password !== '2228') {
      errorMsg.style.display = 'block';
      return;
    }

    errorMsg.style.display = 'none';
    state.teacherAuthenticated = true;
    
    // Switch views in auth card
    document.getElementById('teacher-login').style.display = 'none';
    document.getElementById('teacher-dashboard').style.display = 'block';
    
    await loadTeacherData();
  });

  exitBtn.addEventListener('click', () => {
    // Reset login fields
    document.getElementById('teacher-password').value = '';
    document.getElementById('teacher-password-error').style.display = 'none';
    document.getElementById('teacher-login').style.display = 'block';
    document.getElementById('teacher-dashboard').style.display = 'none';
    state.teacherAuthenticated = false;

    // Go back to previous view
    if (state.currentStudent) {
      switchView('view-student');
    } else {
      switchView('view-auth');
    }
  });

  refreshBtn.addEventListener('click', async () => {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = '<tr><td colspan="9" class="table-loading"><i class="fa-solid fa-sync fa-spin"></i> Actualizando registros...</td></tr>';
    await loadTeacherData();
  });

  exportBtn.addEventListener('click', () => {
    exportDataToCSV();
  });
}

async function loadTeacherData() {
  try {
    const res = await fetch(`${API_BASE}/database?action=teacher&password=2228`);
    if (!res.ok) throw new Error('Contraseña o autenticación docente errónea');
    const data = await res.json();
    
    state.allStudents = data.db.students || [];
    state.allSubmissions = data.db.submissions || [];
    
    renderTeacherTable();
  } catch (err) {
    console.error(err);
    alert('Error al descargar base de datos docente. Verifique conexión.');
    switchView('view-auth');
  }
}

function renderTeacherTable() {
  const tableBody = document.getElementById('students-table-body');
  tableBody.innerHTML = '';

  if (state.allStudents.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" class="table-loading">No se encontraron estudiantes registrados.</td></tr>';
    return;
  }

  state.allStudents.forEach(student => {
    const email = student.email;
    const subs = state.allSubmissions.filter(s => s.student_email === email);
    
    // Scores for each activity
    const s1 = subs.find(s => s.activityIndex === 1)?.score || 0;
    const s2 = subs.find(s => s.activityIndex === 2)?.score || 0;
    const s3 = subs.find(s => s.activityIndex === 3)?.score || 0;
    const totalScore = s1 + s2 + s3;

    // Badges based on scores
    const completedAll = subs.length === 3;
    const badgeInfo = completedAll ? calculateBadge(totalScore) : { name: "Pendiente", color: "#6b7280" };

    const regDate = new Date(student.created_at).toLocaleDateString('es-AR');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight:700;">${student.first_name} ${student.last_name}</td>
      <td style="color:var(--text-secondary);">${student.email}</td>
      <td>${s1 > 0 ? s1 + '/5' : '—'}</td>
      <td>${s2 > 0 ? s2 + '/5' : '—'}</td>
      <td>${s3 > 0 ? s3 + '/5' : '—'}</td>
      <td style="font-weight:900;">${totalScore > 0 ? totalScore + '/15' : '—'}</td>
      <td>
        <span class="badge-pill" style="border-color:${badgeInfo.color}; color:${badgeInfo.color}; font-size:0.75rem;">
          ${badgeInfo.name}
        </span>
      </td>
      <td>${regDate}</td>
      <td>
        <div class="cell-actions">
          <button class="btn btn-outline" style="padding:0.35rem 0.6rem; font-size:0.75rem;" onclick="viewStudentDetail('${student.email}')">
            <i class="fa-solid fa-eye"></i> Detalle
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ==========================================================================
// STUDENT DETAILS (Teacher View Detail Overlay)
// ==========================================================================
window.viewStudentDetail = function(studentEmail) {
  const student = state.allStudents.find(s => s.email === studentEmail);
  if (!student) return;

  const subs = state.allSubmissions.filter(s => s.student_email === studentEmail);

  document.getElementById('detail-student-name').innerText = `${student.first_name} ${student.last_name}`;
  document.getElementById('detail-student-email').innerText = student.email;

  const container = document.getElementById('detail-submissions-container');
  container.innerHTML = '';

  for (let idx = 1; idx <= 3; idx++) {
    const activityData = ACTIVITIES[idx];
    const sub = subs.find(s => s.activityIndex === idx);

    const actBox = document.createElement('div');
    actBox.className = 'detail-act-box';

    if (sub) {
      actBox.innerHTML = `
        <div class="detail-act-header">
          <h4>Actividad 0${idx}: ${activityData.title}</h4>
          <span class="score-badge">${sub.score}/5 pts</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Reflexión y Análisis:</span>
          <p class="detail-text">${escapeHTML(sub.reflection)}</p>
        </div>
        <div class="detail-field">
          <span class="detail-label">Recurso de Investigación:</span>
          <p class="detail-text"><a href="${escapeHTML(sub.url)}" target="_blank">${escapeHTML(sub.url)} <i class="fa-solid fa-up-right-from-square"></i></a></p>
        </div>
        <div class="detail-field">
          <span class="detail-label">Justificación del Recurso:</span>
          <p class="detail-text">${escapeHTML(sub.justification)}</p>
        </div>
        <div class="detail-field" style="border-top:1px dashed var(--border-color); padding-top:0.75rem; margin-top:0.75rem;">
          <span class="detail-label" style="color:var(--accent);">Feedback de la IA:</span>
          <p class="detail-text" style="font-style:italic;">${escapeHTML(sub.feedback)}</p>
        </div>
      `;
    } else {
      actBox.innerHTML = `
        <div class="detail-act-header">
          <h4>Actividad 0${idx}: ${activityData.title}</h4>
          <span class="badge-pill" style="border-color:var(--danger); color:var(--danger);">Sin Entregar</span>
        </div>
        <p style="color:var(--text-secondary); font-style:italic;">El estudiante aún no ha completado esta actividad.</p>
      `;
    }
    container.appendChild(actBox);
  }

  document.getElementById('panel-student-detail').classList.add('active');
};

window.closeStudentDetail = function() {
  document.getElementById('panel-student-detail').classList.remove('active');
};

// Simple HTML Escape Helper
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// EXPORT TO CSV LOGIC (Rioplatense Spanish Encoded)
// ==========================================================================
function exportDataToCSV() {
  if (state.allStudents.length === 0) {
    alert("No hay datos cargados para exportar.");
    return;
  }

  // CSV Columns Definitions
  const headers = [
    "Nombre",
    "Apellido",
    "Email",
    "Fecha Registro",
    "Act 1 Puntaje",
    "Act 1 Reflexion",
    "Act 1 URL",
    "Act 1 Justificacion",
    "Act 1 Feedback",
    "Act 2 Puntaje",
    "Act 2 Reflexion",
    "Act 2 URL",
    "Act 2 Justificacion",
    "Act 2 Feedback",
    "Act 3 Puntaje",
    "Act 3 Reflexion",
    "Act 3 URL",
    "Act 3 Justificacion",
    "Act 3 Feedback",
    "Puntaje Total",
    "Insignia"
  ];

  const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",")];

  state.allStudents.forEach(student => {
    const email = student.email;
    const subs = state.allSubmissions.filter(s => s.student_email === email);
    
    // Extract info for all 3 activities
    const actData = [];
    let totalScore = 0;

    for (let idx = 1; idx <= 3; idx++) {
      const s = subs.find(sub => sub.activityIndex === idx);
      if (s) {
        actData.push(s.score.toString());
        actData.push(s.reflection);
        actData.push(s.url);
        actData.push(s.justification);
        actData.push(s.feedback);
        totalScore += s.score;
      } else {
        // empty values
        actData.push("0", "", "", "", "");
      }
    }

    const completedAll = subs.length === 3;
    const badgeInfo = completedAll ? calculateBadge(totalScore) : { name: "Pendiente", color: "#666" };

    const rowData = [
      student.first_name,
      student.last_name,
      student.email,
      student.created_at,
      ...actData,
      totalScore.toString(),
      badgeInfo.name
    ];

    // Escape double quotes and join with commas
    const escapedRow = rowData.map(val => {
      const cleanVal = (val || "").replace(/"/g, '""');
      return `"${cleanVal}"`;
    }).join(",");

    csvRows.push(escapedRow);
  });

  const csvString = csvRows.join("\n");
  
  // Create Blob with UTF-8 BOM to ensure accents render properly in Excel
  const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Reporte_Alumnos_Formacion_Desarrollo.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
