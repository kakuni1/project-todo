import { loadTasks, saveTasks } from "./database.js";
import { thisDay, thisWeek } from "./date.js";
import { createTaskItem } from "./dom.js";
import { initOverview } from "./events.js";
import { createButton, getIcon } from "./icons.js";

export function createMain() {
  const main = document.createElement("div");
  main.id = "main";
  return main;
}

export function closeMain() {
  const main = document.querySelector("#main");
  main.replaceChildren();
  main.dataset.main = "hide";
  main.setAttribute("aria-expanded", "false");
  localStorage.setItem("main-state", "hide");
}

export function sectionClick(folder) {
  const main = document.querySelector("#main");
  const overview = document.createElement("div");
  overview.className = "folder-overview";

  const headerRow = document.createElement("div");
  headerRow.className = "overview-header";

  const header = document.createElement("h2");
  header.textContent = folder.name;
  headerRow.appendChild(header);

  const closeButton = document.createElement("button");
  closeButton.className = "overview-close-button";
  closeButton.setAttribute("aria-label", "Close overview");
  createButton(closeButton, "icon-close");
  initOverview(closeButton);
  headerRow.appendChild(closeButton);
  overview.appendChild(headerRow);

  const taskList = document.createElement("ul");
  taskList.className = "task-list";

  if (folder.parent === "Projects") {
    const addRow = document.createElement("div");
    addRow.className = "add-task-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Add task";
    input.id = "add-text-input";

    const dueInput = document.createElement("input");
    dueInput.type = "date";
    dueInput.id = "add-date-input";

    const dateRow = document.createElement("div");
    dateRow.className = "add-date-row";
    dateRow.hidden = true;

    const dateClear = document.createElement("button");
    dateClear.type = "button";
    dateClear.className = "add-date-clear";
    dateClear.setAttribute("aria-label", "Clear date");
    dateClear.innerHTML = getIcon("icon-close");

    dateRow.append(dueInput, dateClear);

    const calendarButton = document.createElement("button");
    calendarButton.type = "button";
    calendarButton.className = "add-calendar-button";
    calendarButton.setAttribute("aria-label", "Set due date");
    createButton(calendarButton, "icon-calendar-today");

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-submit-button";
    addButton.setAttribute("aria-label", "Add task");
    createButton(addButton, "icon-plus");

    addRow.append(input, calendarButton, addButton);

    // show/hide
    calendarButton.addEventListener("click", () => {
      dateRow.hidden = !dateRow.hidden;
      calendarButton.classList.toggle("active", !dateRow.hidden);
      if (!dateRow.hidden) dueInput.focus();
    });

    // clear
    dateClear.addEventListener("click", () => {
      dueInput.value = "";
      dateRow.hidden = true;
      calendarButton.classList.remove("active");
      input.focus();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTask(input, dueInput, folder, taskList, dateRow, calendarButton);
    });

    dueInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTask(input, dueInput, folder, taskList, dateRow, calendarButton);
    });

    addButton.addEventListener("click", () => {
      addTask(input, dueInput, folder, taskList, dateRow, calendarButton);
    });

    overview.append(taskList, dateRow, addRow);
  } else {
    overview.append(taskList);
  }

  // clear previous
  main.replaceChildren();
  main.appendChild(overview);
  main.dataset.main = "show";
  main.setAttribute("aria-expanded", "true");
  localStorage.setItem("main-state", "show");
  localStorage.setItem("main-folder", folder.name);
  renderTasks(taskList, folder);
}

function addTask(input, dueInput, folder, taskList, dateRow, calendarButton) {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  const tasks = loadTasks();
  const newTask = {
    parent: folder.parent,
    folder: folder.name,
    id: crypto.randomUUID(),
    text,
    done: false,
  };
  if (dueInput.value) {
    newTask.dueDate = dueInput.value;
  }
  tasks.push(newTask);
  saveTasks(tasks);

  // reset
  input.value = "";
  dueInput.value = "";
  dateRow.hidden = true;
  calendarButton.classList.remove("active");
  input.focus();

  renderTasks(taskList, folder);
}

function renderTasks(ul, folder) {
  ul.replaceChildren();

  const allTasks = loadTasks();
  let filteredTasks;

  switch (folder.name) {
    case "Today": {
      filteredTasks = allTasks.filter((t) => thisDay(t.dueDate) && !t.done);
      break;
    }
    case "This week": {
      filteredTasks = allTasks.filter((t) => thisWeek(t.dueDate) && !t.done);
      break;
    }
    case "Planned": {
      filteredTasks = allTasks.filter((t) => t.dueDate && !t.done);
      break;
    }
    case "Complete": {
      filteredTasks = allTasks.filter((t) => t.done);
      break;
    }
    default:
      filteredTasks = allTasks.filter((t) => t.parent === folder.parent && t.folder === folder.name);
      break;
  }

  for (const t of filteredTasks) {
    ul.appendChild(
      createTaskItem(t, {
        onToggle: (task) => {
          const tasks = loadTasks();
          const found = tasks.find((t) => t.id === task.id);
          // if in array, flip state
          if (found) found.done = !found.done;
          saveTasks(tasks);
          renderTasks(ul, folder);
        },
        onDelete: (task) => {
          // find and delete task
          const remaining = loadTasks().filter((t) => t.id !== task.id);
          saveTasks(remaining);
          renderTasks(ul, folder);
        },
      }),
    );
  }
}
