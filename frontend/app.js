// Prototyp frontend — dane tylko w pamięci (bez backendu).
const tasks = [
  { id: 1, title: 'Przygotować diagram ERD', description: 'Tabele USERS, TASKS, COMMENTS', status: 'in_progress' },
  { id: 2, title: 'Zrobić makiety ekranów', description: 'Lista, formularz, logowanie', status: 'done' },
  { id: 3, title: 'Skonfigurować PostgreSQL 18', description: 'Port + hasło postgres, baza taskmanager', status: 'todo' },
];

const statusLabel = { todo: 'Do zrobienia', in_progress: 'W trakcie', done: 'Wykonane' };

const list = document.getElementById('taskList');
const emptyMsg = document.getElementById('emptyMsg');
const formSection = document.getElementById('formSection');
const form = document.getElementById('taskForm');
let editingId = null;

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const f = document.getElementById('filter').value;
  list.innerHTML = '';
  const visible = tasks.filter((t) => (f === 'all' || t.status === f) && t.title.toLowerCase().includes(q));
  emptyMsg.classList.toggle('hidden', visible.length > 0);
  visible.forEach((t) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML =
      '<h3>' + t.title + '</h3>' +
      '<p>' + (t.description || '') + '</p>' +
      '<span class="badge ' + t.status + '">' + statusLabel[t.status] + '</span> ' +
      '<div class="row"><button data-edit="' + t.id + '" class="btn btn-ghost">Edytuj</button>' +
      '<button data-del="' + t.id + '" class="btn btn-ghost">Usuń</button></div>';
    list.appendChild(li);
  });
}

document.getElementById('addBtn').addEventListener('click', () => {
  editingId = null;
  document.getElementById('formTitle').textContent = 'Dodaj zadanie';
  document.getElementById('saveBtn').textContent = 'Dodaj zadanie';
  form.reset();
  formSection.classList.remove('hidden');
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  formSection.classList.add('hidden');
});

list.addEventListener('click', (e) => {
  const edit = e.target.getAttribute('data-edit');
  const del = e.target.getAttribute('data-del');
  if (edit) {
    const t = tasks.find((x) => x.id === Number(edit));
    editingId = t.id;
    document.getElementById('formTitle').textContent = 'Edytuj zadanie';
    document.getElementById('saveBtn').textContent = 'Zapisz zmiany';
    document.getElementById('title').value = t.title;
    document.getElementById('description').value = t.description || '';
    document.getElementById('status').value = t.status;
    formSection.classList.remove('hidden');
  }
  if (del) {
    if (confirm('Usunąć zadanie?')) {
      const i = tasks.findIndex((x) => x.id === Number(del));
      tasks.splice(i, 1);
      render();
    }
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const err = document.getElementById('formError');
  if (!title) {
    err.classList.remove('hidden');
    return;
  }
  err.classList.add('hidden');
  var description = document.getElementById('description').value.trim();
  var status = document.getElementById('status').value;
  if (editingId) {
    var t = tasks.find((x) => x.id === editingId);
    t.title = title;
    t.description = description;
    t.status = status;
  } else {
    tasks.push({ id: tasks.length + 1, title: title, description: description, status: status });
  }
  formSection.classList.add('hidden');
  render();
});

document.getElementById('search').addEventListener('input', render);
document.getElementById('filter').addEventListener('change', render);

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  // Prototyp: zawsze pokazujemy błąd, bo brak backendu.
  document.getElementById('loginError').classList.remove('hidden');
});

document.getElementById('logoutBtn').addEventListener('click', () => alert('Prototyp: wylogowanie bez backendu.'));

render();
