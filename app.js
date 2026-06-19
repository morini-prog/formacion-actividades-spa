// ==========================================================================
// SPA CORE LOGIC & STATE MANAGEMENT
// ==========================================================================

const ACTIVITIES = {
  1: {
    title: "1. Concepto y Objetivos (Págs. 2-3)",
    questions: [
      "1) Según el texto (Págs. 2-3), ¿cuáles son los 5 objetivos comunes de la formación y cuál es la diferencia clave entre 'formación' y 'desarrollo' a largo plazo?",
      "2) De estos objetivos, ¿cuál considerás que es el más descuidado en tu puesto actual (o en el de un colega) y qué importancia le asignás a que se trabaje activamente en la empresa?"
    ]
  },
  2: {
    title: "2. Importancia y Retención de Talento (Págs. 3-4)",
    questions: [
      "1) Citando el texto (Págs. 3-4), ¿qué porcentaje de empleados retendría una empresa según el reporte de LinkedIn (2020) y a qué autor se cita para demostrar el impacto en el rendimiento organizacional?",
      "2) Pensando en tu experiencia (o la de alguien cercano), ¿alguna vez decidiste permanecer o irte de un empleo debido a la presencia o ausencia de planes de capacitación? Explicá los motivos."
    ]
  },
  3: {
    title: "3. Diagnóstico de Necesidades - DNC (Págs. 4-5)",
    questions: [
      "1) De acuerdo con la Pág. 4, además de encuestas, ¿qué otras dos herramientas específicas se describen para realizar un Diagnóstico de Necesidades de Capacitación (DNC)?",
      "2) Si tuvieras que hacer un DNC en tu área de trabajo, ¿cuál de estas herramientas creés que sería la más aceptada por tus compañeros para evitar que se sienta como una evaluación punitiva?"
    ]
  },
  4: {
    title: "4. Diseñando Programas - Metodología SMART (Págs. 5-6)",
    questions: [
      "1) Según la Pág. 5 del material, ¿cuáles son los criterios de la metodología SMART para diseñar objetivos de capacitación y qué formatos prácticos de contenido menciona la Pág. 6?",
      "2) Redactá un objetivo de capacitación para tu puesto de trabajo actual (o para un rol conocido) usando el formato SMART y explicá por qué considerás importante medirlo."
    ]
  },
  5: {
    title: "5. El Poder de la Evaluación (Págs. 6-7)",
    questions: [
      "1) Detallá secuencialmente los 6 pasos descritos en el material (Págs. 6-7) para llevar a cabo una evaluación de efectividad de la formación.",
      "2) ¿Cómo reacciona tu entorno laboral (o el de un tercero) ante las evaluaciones de desempeño? ¿Considerás que se da un feedback constructivo y útil para tu día a día, o genera rechazo?"
    ]
  },
  6: {
    title: "6. Herramientas y Técnicas de Formación (Págs. 7-8)",
    questions: [
      "1) Definí conceptualmente 'microaprendizaje' y 'aprendizaje colaborativo' basándote en la Pág. 8 del texto, e identificá a qué técnica se refiere como 'un espejo'.",
      "2) ¿Cómo podrías incorporar 'píldoras de microaprendizaje' de manera autónoma en tu rutina diaria, y qué valor creés que aportaría a tu desarrollo profesional?"
    ]
  },
  7: {
    title: "7. Programas de Sucesión de Liderazgo (Págs. 8-9)",
    questions: [
      "1) ¿Cómo define el documento a los programas de sucesión de talento (Pág. 8) y cuáles son los 4 pasos prácticos detallados en la Pág. 9 para preparar a los futuros líderes?",
      "2) En tu experiencia u opinión, ¿como afecta al clima laboral y al equipo cuando no existe un plan de sucesión claro y un líder clave renuncia o es promovido?"
    ]
  },
  8: {
    title: "8. Aprendizaje Organizacional y Cultura Continua (Págs. 9-10)",
    questions: [
      "1) ¿Qué mentalidad sugiere fomentar el texto respecto a los errores operativos (Pág. 9) y qué herramientas tecnológicas se listan en la Pág. 10 para apoyar esta cultura?",
      "2) ¿Cómo responde tu jefe o equipo de trabajo ante un error o equivocación en las tareas diarias? ¿Se fomenta el aprendizaje o predomina el castigo y la culpa?"
    ]
  },
  9: {
    title: "9. Aprendizaje Basado en Habilidades Blandas (Pág. 10)",
    questions: [
      "1) ¿Cuáles son las 3 habilidades blandas que destaca el texto que promueve Google (Pág. 10) y qué métodos se detallan para evaluar su progreso?",
      "2) Entre el liderazgo, la colaboración y la comunicación efectiva, ¿cuál es tu mayor fortaleza personal y en cuál sentís que necesitás capacitarte más para tu puesto actual?"
    ]
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

window.openAuthModal = function() {
  document.getElementById('modal-student-auth').classList.add('active');
};

window.closeAuthModal = function() {
  document.getElementById('modal-student-auth').classList.remove('active');
};

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

  // Adjust header buttons and landing navigation visibility
  const logoutBtn = document.getElementById('logout-btn');
  const teacherBtn = document.getElementById('teacher-access-btn');
  const landingNav = document.getElementById('landing-nav');
  const landingLoginBtn = document.getElementById('landing-login-btn');

  if (viewId === 'view-student') {
    logoutBtn.style.display = 'inline-flex';
    teacherBtn.style.display = 'inline-flex';
    teacherBtn.classList.remove('btn-primary');
    teacherBtn.classList.add('btn-outline');
    landingNav.style.display = 'none';
    landingLoginBtn.style.display = 'none';
  } else if (viewId === 'view-teacher') {
    logoutBtn.style.display = 'none';
    teacherBtn.style.display = 'inline-flex';
    teacherBtn.classList.add('btn-primary');
    teacherBtn.classList.remove('btn-outline');
    landingNav.style.display = 'none';
    landingLoginBtn.style.display = 'none';
  } else {
    // view-auth (Landing page)
    logoutBtn.style.display = 'none';
    teacherBtn.style.display = 'inline-flex';
    teacherBtn.classList.remove('btn-primary');
    teacherBtn.classList.add('btn-outline');
    landingNav.style.display = 'flex';
    landingLoginBtn.style.display = 'inline-flex';
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
      closeAuthModal();
      
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
  if (score >= 9 && score <= 20) {
    return { name: "Aprendiz de Formación 🛡️", color: "#6b7280" };
  } else if (score >= 21 && score <= 35) {
    return { name: "Especialista en Desarrollo 🚀", color: "#004bff" };
  } else if (score >= 36 && score <= 45) {
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

  for (let idx = 1; idx <= 9; idx++) {
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
  const progressPct = Math.round((completedCount / 9) * 100);
  document.getElementById('progress-percentage').innerText = `${progressPct}% completado`;
  document.getElementById('progress-bar-fill').style.width = `${progressPct}%`;

  // Update Stats & Gamification Badge
  document.getElementById('total-score').innerText = `${totalScoreSum} / 45`;
  const badgeInfo = calculateBadge(totalScoreSum);
  const badgeTag = document.getElementById('current-badge');
  badgeTag.innerText = badgeInfo.name;
  badgeTag.style.borderColor = badgeInfo.color;
  badgeTag.style.color = badgeInfo.color === "var(--text-secondary)" ? "inherit" : badgeInfo.color;

  // Finalization Certificate Check
  const certCard = document.getElementById('certificate-unlock-card');
  if (completedCount === 9) {
    certCard.style.display = 'flex';
    
    // Fill in certificate information
    document.getElementById('cert-student-name').innerText = fullName;
    document.getElementById('cert-score').innerText = "9 / 9 Actividades";
    document.getElementById('cert-badge').innerText = "Calificación pendiente";
    
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
  document.getElementById('modal-act-instruction').innerText = "Leé atentamente el material teórico y respondé las siguientes preguntas de reflexión y aplicación:";

  // Set Question Labels dynamically
  document.getElementById('lbl-act-q1').innerText = activityData.questions[0];
  document.getElementById('lbl-act-q2').innerText = activityData.questions[1];

  // Reset form
  const form = document.getElementById('activity-form');
  form.reset();

  // Check if student already submitted this
  const existingSub = state.submissions.find(s => s.activityIndex === activityIndex);
  const feedbackAlertBox = document.getElementById('feedback-alert-box');
  
  if (existingSub) {
    feedbackAlertBox.style.display = 'flex';
    document.getElementById('feedback-card-score').innerText = `${existingSub.score}/5 pts`;
    document.getElementById('feedback-card-text').innerText = existingSub.feedback;
    
    document.getElementById('act-q1').value = existingSub.q1 || existingSub.reflection || '';
    document.getElementById('act-q2').value = existingSub.q2 || existingSub.url || '';
  } else {
    feedbackAlertBox.style.display = 'none';
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

    const q1 = document.getElementById('act-q1').value.trim();
    const q2 = document.getElementById('act-q2').value.trim();

    try {
      // 1. Fetch AI Feedback from Google Gemini Function
      const feedbackRes = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q1,
          q2,
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
            q1,
            q2,
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
        q1,
        q2,
        score: evalResult.score,
        feedback: evalResult.feedback,
        submitted_at: new Date().toISOString()
      };

      if (subIdx >= 0) {
        state.submissions[subIdx] = newSubData;
      } else {
        state.submissions.push(newSubData);
      }

      // Refresh Student dashboard stats
      renderStudentDashboard();
      
      // Close Modal immediately
      closeActivity();
      
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
  const clearBtn = document.getElementById('btn-clear-db');

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

  clearBtn.addEventListener('click', async () => {
    const password = prompt('Por favor, confirme ingresando la contraseña docente:');
    if (!password) return;
    if (password !== '2228') {
      alert('Contraseña incorrecta.');
      return;
    }
    
    if (!confirm('¿Está absolutamente seguro de que desea eliminar TODOS los registros de estudiantes y entregas? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      clearBtn.disabled = true;
      clearBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Limpiando...';

      const res = await fetch(`${API_BASE}/database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'clear_database',
          password: password
        })
      });

      if (!res.ok) {
        throw new Error('Error al limpiar base de datos.');
      }

      alert('Base de datos limpiada con éxito.');
      await loadTeacherData();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al limpiar los registros: ' + err.message);
    } finally {
      clearBtn.disabled = false;
      clearBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Limpiar Registros';
    }
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
    tableBody.innerHTML = '<tr><td colspan="7" class="table-loading">No se encontraron estudiantes registrados.</td></tr>';
    return;
  }

  state.allStudents.forEach(student => {
    const email = student.email;
    const subs = state.allSubmissions.filter(s => s.student_email === email);
    
    // Sum of all grades
    const totalScore = subs.reduce((sum, s) => sum + s.score, 0);

    // Badges based on scores
    const completedAll = subs.length === 9;
    const badgeInfo = completedAll ? calculateBadge(totalScore) : { name: "Pendiente", color: "#6b7280" };

    const regDate = new Date(student.created_at).toLocaleDateString('es-AR');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight:700;">${student.first_name} ${student.last_name}</td>
      <td style="color:var(--text-secondary);">${student.email}</td>
      <td style="font-weight:600;">${subs.length} / 9</td>
      <td style="font-weight:900;">${totalScore > 0 ? totalScore + ' / 45' : '—'}</td>
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

  for (let idx = 1; idx <= 9; idx++) {
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
          <span class="detail-label">${escapeHTML(activityData.questions[0])}</span>
          <p class="detail-text">${escapeHTML(sub.q1 || sub.reflection || '')}</p>
        </div>
        <div class="detail-field">
          <span class="detail-label">${escapeHTML(activityData.questions[1])}</span>
          <p class="detail-text">${escapeHTML(sub.q2 || sub.url || '')}</p>
        </div>
        <div class="detail-field" style="border-top:1px dashed var(--border-color); padding-top:0.75rem; margin-top:0.75rem;">
          <span class="detail-label" style="color:var(--accent);">Devolución de la IA:</span>
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

  // CSV Columns Definitions for 9 activities
  const headers = [
    "Nombre",
    "Apellido",
    "Email",
    "Fecha Registro"
  ];

  for (let i = 1; i <= 9; i++) {
    headers.push(`Act ${i} Puntaje`);
    headers.push(`Act ${i} Pregunta 1`);
    headers.push(`Act ${i} Pregunta 2`);
    headers.push(`Act ${i} Devolucion`);
  }

  headers.push("Puntaje Total");
  headers.push("Insignia");

  const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",")];

  state.allStudents.forEach(student => {
    const email = student.email;
    const subs = state.allSubmissions.filter(s => s.student_email === email);
    
    // Extract info for all 9 activities
    const actData = [];
    let totalScore = 0;

    for (let idx = 1; idx <= 9; idx++) {
      const s = subs.find(sub => sub.activityIndex === idx);
      if (s) {
        actData.push(s.score.toString());
        actData.push(s.q1 || s.reflection || "");
        actData.push(s.q2 || s.url || "");
        actData.push(s.feedback || "");
        totalScore += s.score;
      } else {
        // empty values
        actData.push("0", "", "", "");
      }
    }

    const completedAll = subs.length === 9;
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
