"use strict";

// Backend powinien udostępniać API pod tym samym adresem co frontend.
const API_URL = "/api/tasks";
const MAX_TITLE_LENGTH = 200;
const REQUEST_TIMEOUT = 12000;
const STATUSES = {
  new: { label: "Do zrobienia", className: "status-new" },
  in_progress: { label: "W trakcie", className: "status-in-progress" },
  done: { label: "Wykonane", className: "status-done" }
};

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const statusInput = document.querySelector("#status");
const titleError = document.querySelector("#title-error");
const feedback = document.querySelector("#feedback");
const formHeading = document.querySelector("#form-heading");
const saveButton = document.querySelector("#save-task");
const cancelButton = document.querySelector("#cancel-edit");
const listMessage = document.querySelector("#list-message");
const taskCount = document.querySelector("#task-count");
const taskSection = document.querySelector("#task-section");
const taskColumns = {};

for (const status of Object.keys(STATUSES)) {
  taskColumns[status] = {
    list: document.querySelector("#tasks-" + status),
    count: document.querySelector("#count-" + status),
    empty: document.querySelector("#empty-" + status)
  };
}

let editingId = null;
let busy = false;
let listLoaded = false;

function showFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = type ? "feedback feedback-" + type : "feedback";
}

// Blokada chroni przed wysłaniem tego samego formularza kilka razy.
function setBusy(value) {
  busy = value;
  document.querySelectorAll("button, input, textarea, select").forEach((control) => {
    control.disabled = value;
  });
  form.setAttribute("aria-busy", String(value));
  taskSection.setAttribute("aria-busy", String(value));
}

function showTitleError(message) {
  titleError.textContent = message;
  titleError.hidden = !message;
  titleInput.setAttribute("aria-invalid", String(Boolean(message)));
}

function resetForm() {
  editingId = null;
  form.reset();
  formHeading.textContent = "Dodaj zadanie";
  saveButton.textContent = "Zapisz zadanie";
  cancelButton.hidden = true;
  showTitleError("");
}

function titleValidationMessage(title) {
  if (!title) return "Wpisz tytuł zadania. Same spacje nie wystarczą.";
  if (title.length > MAX_TITLE_LENGTH) return "Tytuł może mieć najwyżej 200 znaków.";
  return "";
}

function httpErrorMessage(status) {
  if (status === 400 || status === 422) return "Nieprawidłowe dane. Sprawdź pola formularza.";
  if (status === 401 || status === 403) return "Nie masz dostępu do tej operacji. Sprawdź swoje uprawnienia.";
  if (status === 413) return "Przesłane dane są za duże. Skróć opis zadania.";
  if (status === 404) return "Nie znaleziono zadania lub adresu API. Odśwież listę i spróbuj ponownie.";
  if (status >= 500) return "Wystąpił błąd serwera. Spróbuj ponownie później.";
  return "Nie udało się wykonać operacji. Spróbuj ponownie.";
}

// GET pobiera dane, a POST, PUT i DELETE zmieniają je na serwerze.
async function apiRequest(method, id = null, data = null) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const url = id === null ? API_URL : API_URL + "/" + encodeURIComponent(id);
  const options = {
    method,
    headers: { Accept: "application/json" },
    signal: controller.signal
  };

  if (data !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(httpErrorMessage(response.status));

    // DELETE może poprawnie zwrócić 204 i pustą odpowiedź.
    if (method !== "GET") return;

    try {
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new Error("Serwer zwrócił nieprawidłową odpowiedź. Nie można odczytać listy zadań.");
    }
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Serwer nie odpowiedział na czas. Spróbuj ponownie.");
    if (error instanceof TypeError) throw new Error("Brak połączenia z serwerem. Sprawdź połączenie i spróbuj ponownie.");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function normalizeTask(task) {
  if (task === null || typeof task !== "object" || Array.isArray(task)) {
    throw new Error("Serwer zwrócił nieprawidłowe dane zadania.");
  }

  const id = typeof task.id === "string" && /^\d+$/.test(task.id) ? Number(task.id) : task.id;
  if (!Number.isSafeInteger(id) || id < 1 || typeof task.title !== "string" ||
      !task.title.trim() || task.title.length > MAX_TITLE_LENGTH ||
      !Object.hasOwn(STATUSES, task.status) ||
      (task.description != null && typeof task.description !== "string")) {
    throw new Error("Serwer zwrócił nieprawidłowe dane zadania.");
  }

  return { id, title: task.title, description: task.description ?? "", status: task.status };
}

function editTask(task) {
  if (busy) return;
  editingId = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description;
  statusInput.value = task.status;
  formHeading.textContent = "Edytuj zadanie";
  saveButton.textContent = "Zapisz zmiany";
  cancelButton.hidden = false;
  showTitleError("");
  showFeedback("Edytujesz wybrane zadanie.");
  titleInput.focus();
}

function createTaskCard(task) {
  const card = document.createElement("li");
  card.className = "task-card";

  const heading = document.createElement("h4");
  heading.className = "task-title";
  heading.textContent = task.title;

  const badge = document.createElement("span");
  badge.className = "task-badge " + STATUSES[task.status].className;
  badge.textContent = STATUSES[task.status].label;
  card.append(heading, badge);

  const description = document.createElement("p");
  const hasDescription = Boolean(task.description.trim());
  description.className = hasDescription ? "task-description" : "task-description task-description-empty";
  description.textContent = hasDescription ? task.description : "brak opisu";
  card.append(description);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "button button-secondary";
  editButton.textContent = "Edytuj";
  editButton.addEventListener("click", () => editTask(task));
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button button-danger";
  deleteButton.textContent = "Usuń";
  deleteButton.addEventListener("click", () => deleteTask(task));
  actions.append(editButton, deleteButton);
  card.append(actions);
  return card;
}

async function loadTasks() {
  const data = await apiRequest("GET");
  if (!Array.isArray(data)) throw new Error("Serwer zwrócił nieprawidłową listę zadań.");

  // Najpierw sprawdzamy całą odpowiedź, dopiero potem zmieniamy widok.
  const tasks = data.map(normalizeTask);
  for (const status of Object.keys(STATUSES)) {
    const columnTasks = tasks.filter((task) => task.status === status);
    const fragment = document.createDocumentFragment();
    columnTasks.forEach((task) => fragment.append(createTaskCard(task)));
    taskColumns[status].list.replaceChildren(fragment);
    taskColumns[status].count.textContent = String(columnTasks.length);
    taskColumns[status].empty.textContent = "Brak zadań.";
    taskColumns[status].empty.hidden = columnTasks.length > 0;
  }
  taskCount.textContent = String(tasks.length);
  listMessage.textContent = "";
  listMessage.hidden = true;
  listLoaded = true;
}

async function refreshTasks() {
  if (busy) return;
  setBusy(true);
  showFeedback("Wczytywanie zadań…");
  try {
    await loadTasks();
    showFeedback("Lista zadań została odświeżona.");
  } catch (error) {
    showFeedback(error.message, "error");
    if (!listLoaded) listMessage.textContent = "Nie udało się wczytać listy. Spróbuj użyć przycisku Odśwież.";
  } finally {
    setBusy(false);
  }
}

// Błąd odświeżenia po zapisie nie oznacza, że sam zapis się nie udał.
async function refreshAfterChange(successMessage) {
  try {
    await loadTasks();
    showFeedback(successMessage, "success");
  } catch (error) {
    showFeedback(successMessage + " Nie udało się odświeżyć listy. " + error.message, "error");
  }
}

async function saveTask(event) {
  event.preventDefault();
  if (busy) return;

  const title = titleInput.value.trim();
  const validationError = titleValidationMessage(title);
  showTitleError(validationError);
  if (validationError) {
    showFeedback("Popraw tytuł zadania przed zapisaniem.", "error");
    titleInput.focus();
    return;
  }
  if (!Object.hasOwn(STATUSES, statusInput.value)) {
    showFeedback("Wybierz prawidłowy status zadania.", "error");
    return;
  }

  const data = { title, description: descriptionInput.value.trim(), status: statusInput.value };
  const isEditing = editingId !== null;
  setBusy(true);
  showFeedback("Zapisywanie zadania…");
  try {
    await apiRequest(isEditing ? "PUT" : "POST", editingId, data);
    resetForm();
    await refreshAfterChange(isEditing ? "Zapisano zmiany w zadaniu." : "Dodano nowe zadanie.");
  } catch (error) {
    // Przy błędzie pozostawiamy wpisane dane w formularzu.
    showFeedback(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteTask(task) {
  if (busy || !window.confirm("Czy na pewno chcesz usunąć wybrane zadanie?")) return;
  setBusy(true);
  showFeedback("Usuwanie zadania…");
  try {
    await apiRequest("DELETE", task.id);
    if (editingId === task.id) resetForm();
    await refreshAfterChange("Usunięto zadanie.");
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", saveTask);
document.querySelector("#refresh-tasks").addEventListener("click", refreshTasks);
document.querySelector("#new-task").addEventListener("click", () => {
  if (busy) return;
  resetForm();
  showFeedback("");
  titleInput.focus();
});
cancelButton.addEventListener("click", () => {
  if (busy) return;
  resetForm();
  showFeedback("Anulowano edycję.");
  titleInput.focus();
});
titleInput.addEventListener("input", () => {
  if (!titleError.hidden) showTitleError(titleValidationMessage(titleInput.value.trim()));
});

refreshTasks();
