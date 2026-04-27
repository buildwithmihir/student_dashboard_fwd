const load = k => JSON.parse(localStorage.getItem(k) || (/todos|notes/.test(k) ? '[]' : '{}'));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const el   = id => document.getElementById(id);

function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav li').forEach(l => l.classList.remove('active'));
  el(id).classList.add('active');
  event.currentTarget.classList.add('active');
}

function toggleTheme() {
  const dark = document.body.classList.toggle('dark');
  save('theme', dark ? 'dark' : 'light');
  el('theme-label').textContent = dark ? 'Light Mode' : 'Dark Mode';
  document.querySelector('.toggle-icon').textContent = dark ? '☀️' : '🌙';
}

window.onload = () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    el('theme-label').textContent = 'Light Mode';
    document.querySelector('.toggle-icon').textContent = '☀️';
  }
  renderTodos();
  renderGPA();
  renderAttendance();
  renderNotes();
  const today = new Date().toISOString().split('T')[0];
  const alerted = load('todo-alerted');
  load('todos').forEach((t, i) => {
    if (t.date === today && !t.completed && !alerted[i]) {
      alert('📌 Due today: ' + t.text);
      alerted[i] = true;
    }
  });
  save('todo-alerted', alerted);
};

function renderTodos() {
  const tasks = load('todos');
  el('todo-list').innerHTML = tasks.map((t, i) => `
    <li>
      <div onclick="toggleTodo(${i})">
        <input type="checkbox" ${t.completed ? 'checked' : ''}>
        <span class="${t.completed ? 'done' : ''}">${t.text}</span>
        ${t.date ? `<small>${t.date}</small>` : ''}
      </div>
      <button onclick="deleteTodo(${i})">✕</button>
    </li>`).join('') || '<p class="empty">No tasks.</p>';
  const rem = tasks.filter(t => !t.completed).length;
  el('task-count').textContent = rem + ' remaining';
  el('dash-task-count').textContent = rem + ' Pending';
}

function addTodo() {
  const i = el('todo-input'), d = el('todo-date');
  if (!i.value.trim()) return;
  const tasks = load('todos');
  tasks.push({ text: i.value.trim(), completed: false, date: d.value });
  save('todos', tasks);
  i.value = d.value = '';
  renderTodos();
}

function toggleTodo(i) {
  const t = load('todos');
  t[i].completed = !t[i].completed;
  save('todos', t);
  renderTodos();
}

function deleteTodo(i) {
  const t = load('todos');
  t.splice(i, 1);
  save('todos', t);
  renderTodos();
}

function clearAllTodos() {
  if (confirm('Delete all?')) { save('todos', []); renderTodos(); }
}

const SUBJECTS = [
  {n:'DLD',c:4},{n:'DS',c:4},{n:'ENG',c:3},{n:'LAO',c:3},{n:'PHY',c:4},{n:'PP',c:4},{n:'FWD',c:3}
];
const gp = m => m>=90?10:m>=80?9:m>=70?8:m>=60?7:m>=50?6:0;

function renderGPA() {
  const marks = load('gpa-marks');
  if (!el('gpa-subjects').children.length)
    el('gpa-subjects').innerHTML = SUBJECTS.map(s => `
      <div class="gpa-row">
        <span>${s.n} <small>(${s.c}cr)</small></span>
        <input id="gpa-${s.n}" type="number" min="0" max="100" placeholder="Marks"
          value="${marks[s.n] ?? ''}" oninput="saveMarksLive('${s.n}', this.value)">
        <span id="gp-${s.n}">GP: <b>${marks[s.n] != null ? gp(marks[s.n]) : '—'}</b></span>
      </div>`).join('');
  updateGPA(marks);
}

function saveMarksLive(name, raw) {
  const marks = load('gpa-marks');
  if (raw === '') {
    delete marks[name];
  } else {
    const n = Math.min(100, Math.max(0, +raw));
    marks[name] = n;
    el('gp-' + name).innerHTML = 'GP: <b>' + gp(n) + '</b>';
  }
  save('gpa-marks', marks);
  updateGPA(marks);
}

function updateGPA(marks) {
  let pts = 0, cr = 0;
  SUBJECTS.forEach(s => {
    if (marks[s.n] != null) { pts += gp(marks[s.n]) * s.c; cr += s.c; }
  });
  const val = cr ? (pts / cr).toFixed(2) : '0.00';
  el('gpa-display').textContent = el('dash-gpa').textContent = val;
}

function addSubject() {
  const e = el('subject-name');
  if (!e.value.trim()) return;
  const att = load('attendance');
  if (!att[e.value.trim()]) att[e.value.trim()] = { present: 0, total: 0 };
  save('attendance', att);
  e.value = '';
  renderAttendance();
}

function markPresent(i) { markClass(i, true); }
function markAbsent(i)  { markClass(i, false); }

function markClass(i, present) {
  const att = load('attendance'), key = Object.keys(att)[i];
  if (!key) return;
  if (present) att[key].present++;
  att[key].total++;
  save('attendance', att);
  renderAttendance();
}

function deleteSubject(i) {
  const att = load('attendance');
  delete att[Object.keys(att)[i]];
  save('attendance', att);
  renderAttendance();
}

function renderAttendance() {
  const att = load('attendance'), keys = Object.keys(att);
  let op = 0, ot = 0;
  el('attendance-list').innerHTML = keys.map((sub, i) => {
    const d = att[sub];
    const pct = d.total ? ((d.present / d.total) * 100).toFixed(1) : 0;
    const col = pct >= 75 ? '#30D158' : pct >= 60 ? '#FF9F0A' : '#FF453A';
    const lbl = pct >= 75 ? 'On Track' : pct >= 60 ? 'At Risk' : 'Low';
    op += d.present; ot += d.total;
    return `<div class="card">
      <div class="att-header">
        <h3>${sub}</h3>
        <span class="badge" style="background:${col}22;color:${col}">${lbl}</span>
      </div>
      <p>${d.present}/${d.total} · <b>${pct}%</b></p>
      <div class="bar"><div style="width:${pct}%;background:${col}"></div></div>
      <div class="att-actions">
        <button onclick="markPresent(${i})">✓ Present</button>
        <button onclick="markAbsent(${i})">✗ Absent</button>
        <button class="del" onclick="deleteSubject(${i})">✕</button>
      </div>
    </div>`;
  }).join('') || '<p class="empty">No subjects.</p>';
  const ov = (ot ? ((op / ot) * 100).toFixed(1) : 0) + '%';
  el('dash-attendance').textContent = el('overall-attendance').textContent = ov;
}

function saveNote() {
  const t = el('note-title').value.trim(), d = el('note-desc').value.trim();
  if (!t) return;
  const notes = load('notes-v2');
  notes.unshift({ id: Date.now(), title: t, desc: d });
  save('notes-v2', notes);
  el('note-title').value = el('note-desc').value = '';
  renderNotes();
}

function deleteNote(id) {
  save('notes-v2', load('notes-v2').filter(n => n.id !== id));
  renderNotes();
}

function openNoteModal(id) {
  const n = load('notes-v2').find(n => n.id === id);
  if (!n) return;
  el('modal-title').textContent = n.title;
  el('modal-body').textContent  = n.desc || '(No description)';
  el('note-modal').classList.add('open');
}

function closeNoteModal() {
  el('note-modal').classList.remove('open');
}

function renderNotes() {
  el('notes-list').innerHTML = load('notes-v2').map(n => `
    <div class="note-card" onclick="openNoteModal(${n.id})">
      <div class="note-head">
        <b>${n.title}</b>
        <button onclick="event.stopPropagation();deleteNote(${n.id})">✕</button>
      </div>
      <p>${(n.desc || '(No description)').slice(0, 80)}${n.desc?.length > 80 ? '…' : ''}</p>
    </div>`).join('') || '<p class="empty">No notes.</p>';
}