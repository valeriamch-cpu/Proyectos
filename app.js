const users = {
  maria: {
    password: '1234',
    name: 'María López',
    team: 'Operaciones',
    authorizedTeamMembers: ['María López', 'Juan Pérez', 'Ana Torres'],
  },
  juan: {
    password: '1234',
    name: 'Juan Pérez',
    team: 'Operaciones',
    authorizedTeamMembers: ['Juan Pérez', 'María López'],
  },
};

const teamProcesses = [
  {
    owner: 'María López',
    title: 'Validar contrato proveedor A',
    dueDate: '2026-04-16',
    status: 'proceso',
    scope: 'me',
    processId: 'proc-01',
  },
  {
    owner: 'María López',
    title: 'Enviar reporte de incidentes',
    dueDate: '2026-04-18',
    status: 'completado',
    scope: 'me',
    processId: 'proc-02',
  },
  {
    owner: 'Juan Pérez',
    title: 'Cerrar auditoría interna',
    dueDate: '2026-04-17',
    status: 'proceso',
    scope: 'team',
    processId: 'proc-03',
  },
  {
    owner: 'Ana Torres',
    title: 'Actualizar plan de contingencia',
    dueDate: '2026-04-22',
    status: 'bloqueado',
    scope: 'team',
    processId: 'proc-04',
  },
];

const processChat = {
  'proc-01': [
    { author: 'María López', text: 'Estoy validando cláusulas con legal.' },
    { author: 'Legal', text: 'Listo, pasamos observaciones hoy.' },
  ],
  'proc-02': [{ author: 'María López', text: 'Reporte enviado y aprobado.' }],
  'proc-03': [{ author: 'Juan Pérez', text: 'Falta evidencia del área de calidad.' }],
  'proc-04': [{ author: 'Ana Torres', text: 'Bloqueado por espera de presupuesto.' }],
};

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const welcomeTitle = document.getElementById('welcome-title');
const calendarGrid = document.getElementById('calendar-grid');
const teamList = document.getElementById('team-list');
const selectedPersonTitle = document.getElementById('selected-person-title');
const taskList = document.getElementById('task-list');
const chatThread = document.getElementById('chat-thread');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;
let currentProcessId = null;

function formatDate(dateISO) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getAccessibleProcesses() {
  if (!currentUser) return [];
  return teamProcesses.filter((process) =>
    currentUser.authorizedTeamMembers.includes(process.owner)
  );
}

function renderCalendar() {
  calendarGrid.innerHTML = '';

  getAccessibleProcesses().forEach((process) => {
    const item = document.createElement('article');
    item.className = `calendar-item ${process.scope}`;
    item.innerHTML = `
      <strong>${formatDate(process.dueDate)}</strong>
      <p>${process.title}</p>
      <small>${process.owner}</small>
    `;
    calendarGrid.appendChild(item);
  });
}

function renderPeopleList() {
  teamList.innerHTML = '';

  const people = [...new Set(getAccessibleProcesses().map((process) => process.owner))];

  people.forEach((person) => {
    const pending = getAccessibleProcesses().filter(
      (process) => process.owner === person && process.status !== 'completado'
    ).length;

    const li = document.createElement('li');
    li.className = 'person-item';
    li.textContent = `${person} · ${pending} pendiente(s)`;

    li.addEventListener('click', () => {
      [...teamList.children].forEach((item) => item.classList.remove('active'));
      li.classList.add('active');
      renderTasksForPerson(person);
    });

    teamList.appendChild(li);
  });
}

function renderTasksForPerson(person) {
  selectedPersonTitle.textContent = `Tareas de ${person}`;
  taskList.innerHTML = '';

  const tasks = getAccessibleProcesses().filter((process) => process.owner === person);

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <strong>${task.title}</strong>
      <p>Fecha: ${formatDate(task.dueDate)}</p>
      <p>Estado: <span class="status ${task.status}">${task.status}</span></p>
    `;

    li.addEventListener('click', () => {
      currentProcessId = task.processId;
      renderChat();
    });

    taskList.appendChild(li);
  });

  if (tasks.length) {
    currentProcessId = tasks[0].processId;
    renderChat();
  }
}

function renderChat() {
  chatThread.innerHTML = '';

  const messages = processChat[currentProcessId] || [];
  messages.forEach((message) => {
    const row = document.createElement('div');
    row.className = 'chat-message';
    row.innerHTML = `<b>${message.author}</b><span>${message.text}</span>`;
    chatThread.appendChild(row);
  });

  if (!messages.length) {
    chatThread.innerHTML = '<p class="muted">No hay mensajes en este proceso.</p>';
  }
}

function renderDashboard() {
  welcomeTitle.textContent = `Hola, ${currentUser.name}`;
  renderCalendar();
  renderPeopleList();

  const myself = currentUser.name;
  renderTasksForPerson(myself);

  const firstRow = [...teamList.children].find((node) => node.textContent.includes(myself));
  if (firstRow) firstRow.classList.add('active');
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = event.target.username.value.trim().toLowerCase();
  const password = event.target.password.value.trim();

  const found = users[username];
  if (!found || found.password !== password) {
    loginError.textContent = 'Usuario o contraseña inválidos.';
    return;
  }

  currentUser = found;
  loginError.textContent = '';
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  renderDashboard();
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!currentProcessId || !chatInput.value.trim()) return;

  processChat[currentProcessId] = processChat[currentProcessId] || [];
  processChat[currentProcessId].push({
    author: currentUser.name,
    text: chatInput.value.trim(),
  });

  chatInput.value = '';
  renderChat();
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  currentProcessId = null;
  loginForm.reset();
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
});
