
function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.currentTarget.classList.add('active');
}


function renderTodos() {
  const list = document.getElementById('todo-list');
  const tasks = JSON.parse(localStorage.getItem('todos') || '[]');
  list.innerHTML = '';

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    const dateTag = task.date ? `<span class="todo-date">${task.date}</span>` : '';
    li.innerHTML = `
      <div class="todo-content" onclick="toggleTodo(${index})">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="todo-text ${task.completed ? 'completed' : ''}">${task.text}</span>
        ${dateTag}
      </div>
      <button class="delete-btn" onclick="deleteTodo(${index})">Remove</button>
    `;
    list.appendChild(li);
  });

  const remaining = tasks.filter(t => !t.completed).length;
  document.getElementById('task-count').innerText = `${remaining} tasks remaining`;
  document.getElementById('dash-task-count').innerText = `${remaining} Pending`;
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const dateInput = document.getElementById('todo-date');
  if (!input.value.trim()) return;

  const tasks = JSON.parse(localStorage.getItem('todos') || '[]');
  tasks.push({ text: input.value.trim(), completed: false, date: dateInput.value || '' });
  localStorage.setItem('todos', JSON.stringify(tasks));
  input.value = '';
  dateInput.value = '';
  renderTodos();
}

function toggleTodo(index) {
  const tasks = JSON.parse(localStorage.getItem('todos'));
  tasks[index].completed = !tasks[index].completed;
  localStorage.setItem('todos', JSON.stringify(tasks));
  renderTodos();
}

function deleteTodo(index) {
  const tasks = JSON.parse(localStorage.getItem('todos'));
  tasks.splice(index, 1);
  localStorage.setItem('todos', JSON.stringify(tasks));
  renderTodos();
}

function clearAllTodos() {
  if (confirm("Are you sure you want to delete all tasks?")) {
    localStorage.setItem('todos', JSON.stringify([]));
    renderTodos();
  }
}

function checkTodoDueDates() {
  const tasks = JSON.parse(localStorage.getItem('todos') || '[]');
  const alerted = JSON.parse(localStorage.getItem('todo-alerted') || '{}');
  const today = new Date().toISOString().split('T')[0];

  tasks.forEach((task, index) => {
    if (task.date === today && !task.completed && !alerted[index]) {
      alert(`📌 Task due today: "${task.text}"`);
      alerted[index] = true;
    }
  });
  localStorage.setItem('todo-alerted', JSON.stringify(alerted));
}


const SUBJECTS = [
  { name: 'DLD',  credits: 4 },
  { name: 'DS',   credits: 4 },
  { name: 'ENG',  credits: 3 },
  { name: 'LAO',  credits: 3 },
  { name: 'PHY',  credits: 4 },
  { name: 'PP',   credits: 4 },
  { name: 'FWD',  credits: 3 },
];

function marksToGradePoint(marks) {
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  return 0;
}

function renderGPA() {
  const savedMarks = JSON.parse(localStorage.getItem('gpa-marks') || '{}');
  const container = document.getElementById('gpa-subjects');
  // Only rebuild DOM if rows don't exist yet (avoid focus loss)
  if (!container.querySelector('.gpa-row')) {
    container.innerHTML = SUBJECTS.map(sub => {
      const val = savedMarks[sub.name] !== undefined ? savedMarks[sub.name] : '';
      const gp = val !== '' ? marksToGradePoint(Number(val)) : '—';
      return `
        <div class="gpa-row">
          <span class="gpa-sub-name">${sub.name} <small>(${sub.credits} cr)</small></span>
          <input type="number" min="0" max="100" placeholder="Marks"
            value="${val}" id="gpa-input-${sub.name}"
            oninput="saveMarksLive('${sub.name}', this.value)">
          <span class="gpa-gp" id="gpa-gp-${sub.name}">GP: <strong>${gp}</strong></span>
        </div>
      `;
    }).join('');
  } else {
    SUBJECTS.forEach(sub => {
      const el = document.getElementById(`gpa-input-${sub.name}`);
      if (el && document.activeElement !== el) {
        el.value = savedMarks[sub.name] !== undefined ? savedMarks[sub.name] : '';
      }
      const gpEl = document.getElementById(`gpa-gp-${sub.name}`);
      if (gpEl) {
        const v = savedMarks[sub.name];
        gpEl.innerHTML = `GP: <strong>${v !== undefined ? marksToGradePoint(v) : '—'}</strong>`;
      }
    });
  }
  updateGPADisplay(savedMarks);
}

function saveMarksLive(subName, rawVal) {
  const marks = JSON.parse(localStorage.getItem('gpa-marks') || '{}');
  if (rawVal === '') {
    delete marks[subName];
  } else {
    const num = Math.min(100, Math.max(0, Number(rawVal)));
    marks[subName] = num;
    const gpEl = document.getElementById(`gpa-gp-${subName}`);
    if (gpEl) gpEl.innerHTML = `GP: <strong>${marksToGradePoint(num)}</strong>`;
  }
  localStorage.setItem('gpa-marks', JSON.stringify(marks));
  updateGPADisplay(marks);
}

function updateGPADisplay(marks) {
  let totalCredits = 0, totalPoints = 0;
  SUBJECTS.forEach(sub => {
    if (marks[sub.name] !== undefined) {
      totalPoints += marksToGradePoint(marks[sub.name]) * sub.credits;
      totalCredits += sub.credits;
    }
  });
  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  document.getElementById('gpa-display').innerText = gpa;
  document.getElementById('dash-gpa').innerText = gpa;
}


function addSubject() {
  const name = document.getElementById('subject-name').value.trim();
  if (!name) return;
  const attendance = JSON.parse(localStorage.getItem('attendance') || '{}');
  if (!attendance[name]) attendance[name] = { present: 0, total: 0 };
  localStorage.setItem('attendance', JSON.stringify(attendance));
  document.getElementById('subject-name').value = '';
  renderAttendance();
}

function markPresent(idx) {
  const attendance = JSON.parse(localStorage.getItem('attendance') || '{}');
  const key = Object.keys(attendance)[idx];
  if (!key) return;
  attendance[key].present++;
  attendance[key].total++;
  localStorage.setItem('attendance', JSON.stringify(attendance));
  renderAttendance();
}

function markAbsent(idx) {
  const attendance = JSON.parse(localStorage.getItem('attendance') || '{}');
  const key = Object.keys(attendance)[idx];
  if (!key) return;
  attendance[key].total++;
  localStorage.setItem('attendance', JSON.stringify(attendance));
  renderAttendance();
}

function deleteSubject(idx) {
  const attendance = JSON.parse(localStorage.getItem('attendance') || '{}');
  const key = Object.keys(attendance)[idx];
  if (!key) return;
  delete attendance[key];
  localStorage.setItem('attendance', JSON.stringify(attendance));
  renderAttendance();
}

function renderAttendance() {
  const attendance = JSON.parse(localStorage.getItem('attendance') || '{}');
  const container = document.getElementById('attendance-list');
  if (!container) return;
  const keys = Object.keys(attendance);
  let overallPresent = 0, overallTotal = 0;

  if (!keys.length) {
    container.innerHTML = '<p class="empty-state">No subjects added yet.</p>';
  } else {
    container.innerHTML = keys.map((subject, idx) => {
      const data = attendance[subject];
      const percent = data.total === 0 ? 0 : ((data.present / data.total) * 100).toFixed(1);
      overallPresent += data.present;
      overallTotal += data.total;
      const color = percent >= 75 ? '#30D158' : percent >= 60 ? '#FF9F0A' : '#FF453A';
      const label = percent >= 75 ? 'On Track' : percent >= 60 ? 'At Risk' : 'Low';

      return `
        <div class="card attendance-card">
          <div class="att-header">
            <h3>${subject}</h3>
            <span class="att-badge" style="background:${color}22; color:${color}">${label}</span>
          </div>
          <p class="att-stat">${data.present} / ${data.total} classes &nbsp;·&nbsp; <strong>${percent}%</strong></p>
          <div class="progress-track">
            <div class="progress-fill" style="width:${percent}%; background:${color};"></div>
          </div>
          <div class="att-actions">
            <button class="present-btn" onclick="markPresent(${idx})">✓ Present</button>
            <button class="absent-btn" onclick="markAbsent(${idx})">✗ Absent</button>
            <button class="delete-btn" onclick="deleteSubject(${idx})">Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  const overall = overallTotal === 0 ? 0 : ((overallPresent / overallTotal) * 100).toFixed(1);
  document.getElementById('dash-attendance').innerText = overall + '%';
  const overallBox = document.getElementById('overall-attendance');
  if (overallBox) overallBox.innerText = overall + '%';
}


function saveNote() {
  const title = document.getElementById('note-title').value.trim();
  const desc = document.getElementById('note-desc').value.trim();
  if (!title) return;

  const notes = JSON.parse(localStorage.getItem('notes-v2') || '[]');
  notes.unshift({ id: Date.now(), title, desc });
  localStorage.setItem('notes-v2', JSON.stringify(notes));
  document.getElementById('note-title').value = '';
  document.getElementById('note-desc').value = '';
  renderNotes();
}

function deleteNote(id) {
  let notes = JSON.parse(localStorage.getItem('notes-v2') || '[]');
  notes = notes.filter(n => n.id !== id);
  localStorage.setItem('notes-v2', JSON.stringify(notes));
  renderNotes();
}

function openNoteModal(id) {
  const notes = JSON.parse(localStorage.getItem('notes-v2') || '[]');
  const note = notes.find(n => n.id === id);
  if (!note) return;
  document.getElementById('modal-title').innerText = note.title;
  document.getElementById('modal-body').innerText = note.desc || '(No description)';
  document.getElementById('note-modal').classList.add('open');
}

function closeNoteModal() {
  document.getElementById('note-modal').classList.remove('open');
}

function renderNotes() {
  const notes = JSON.parse(localStorage.getItem('notes-v2') || '[]');
  const container = document.getElementById('notes-list');
  if (!notes.length) {
    container.innerHTML = '<p class="empty-state">No notes yet. Add one above.</p>';
    return;
  }
  container.innerHTML = notes.map(note => {
    const preview = note.desc ? (note.desc.slice(0, 80) + (note.desc.length > 80 ? '…' : '')) : '(No description)';
    return `
      <div class="note-card" onclick="openNoteModal(${note.id})">
        <div class="note-card-header">
          <strong>${note.title}</strong>
          <button class="delete-btn" onclick="event.stopPropagation(); deleteNote(${note.id})">✕</button>
        </div>
        <p class="note-preview">${preview}</p>
      </div>
    `;
  }).join('');
}


function addReminder() {
  const text = document.getElementById('rem-text').value.trim();
  const date = document.getElementById('rem-date').value;
  if (!text || !date) return;

  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
  reminders.push({ id: Date.now(), text, date, alerted: false });
  localStorage.setItem('reminders', JSON.stringify(reminders));
  document.getElementById('rem-text').value = '';
  document.getElementById('rem-date').value = '';
  renderReminders();
}

function deleteReminder(id) {
  let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
  reminders = reminders.filter(r => r.id !== id);
  localStorage.setItem('reminders', JSON.stringify(reminders));
  renderReminders();
}

function renderReminders() {
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
  const list = document.getElementById('reminder-list');
  if (!reminders.length) {
    list.innerHTML = '<p class="empty-state">No reminders set.</p>';
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  list.innerHTML = reminders.map(r => {
    const isPast = r.date < today;
    const isToday = r.date === today;
    return `
      <li class="reminder-item ${isToday ? 'reminder-today' : isPast ? 'reminder-past' : ''}">
        <span class="rem-dot"></span>
        <div>
          <strong>${r.text}</strong>
          <small>${r.date}${isToday ? ' — Today!' : ''}</small>
        </div>
        <button class="delete-btn" onclick="deleteReminder(${r.id})">✕</button>
      </li>
    `;
  }).join('');
}

function checkReminders() {
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
  const today = new Date().toISOString().split('T')[0];
  let changed = false;

  reminders.forEach(r => {
    if (r.date === today && !r.alerted) {
      alert(`🔔 Reminder: ${r.text}`);
      r.alerted = true;
      changed = true;
    }
  });
  if (changed) localStorage.setItem('reminders', JSON.stringify(reminders));
}


window.onload = () => {
  renderTodos();
  renderGPA();
  renderAttendance();
  renderNotes();
  renderReminders();
  checkTodoDueDates();
  checkReminders();
};