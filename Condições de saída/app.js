const NAME_LIMIT = 60;

const conditions = [
  {
    id: "preco",
    name: "Mencionar preço ou orçamento",
    description:
      'Acionar caso o cliente pergunte sobre orçamento, queira saber o preço, passe uma lista de itens e queira saber o valor. Ex: "Quero um orçamento para esses itens"',
    updated: "13/11/2026 às 23:45",
    editor: "Cláudia",
    flows: ["Atendimento especializado", "Compra de produtos"],
  },
  {
    id: "compra",
    name: "Houver intenção de compra",
    description:
      "Se o contato mandar mensagens que demonstre interesse em fazer negociação. Utilize palavras similiares a comprar ou falar com o vendedor, comercial.",
    updated: "13/02/2025 às 18:00",
    editor: "Gilson",
    flows: ["Atendimento especializado"],
  },
];

const body = document.querySelector("#conditions");
const empty = document.querySelector("#empty");
const search = document.querySelector("#search");
const menu = document.querySelector("#row-menu");
const flowsDrawer = document.querySelector("#drawer-flows");
const createDrawer = document.querySelector("#drawer-create");
const flowsIntro = document.querySelector("#flows-intro");
const flowList = document.querySelector("#flow-list");
const nameInput = document.querySelector("#condition-name");
const descriptionInput = document.querySelector("#condition-description");
const counter = document.querySelector("#name-counter");
const saveButton = document.querySelector("#save-condition");
const form = document.querySelector("#condition-form");
const overlay = document.querySelector("#overlay");
const deleteDialog = document.querySelector("#delete-dialog");

let query = "";
let menuConditionId = null;
let menuTrigger = null;
let drawerTrigger = null;
let editingId = null;
let flowsConditionId = null;
let deleteConditionId = null;
let deleteTrigger = null;

function formatNow() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function visibleConditions() {
  const term = query.trim().toLowerCase();
  if (!term) return conditions;
  return conditions.filter((condition) => condition.name.toLowerCase().includes(term));
}

function render() {
  const rows = visibleConditions();
  body.replaceChildren();

  rows.forEach((condition) => {
    const row = document.createElement("tr");
    row.dataset.id = condition.id;
    row.innerHTML = `
      <td>
        <div class="condition-copy">
          <strong></strong>
          <span></span>
        </div>
      </td>
      <td></td>
      <td></td>
      <td>
        <button class="icon-btn" type="button" data-action="edit" aria-label="Editar condição">
          <img src="assets/pen.svg" width="24" height="24" alt="" />
        </button>
      </td>
      <td>
        <button class="icon-btn" type="button" data-action="menu" aria-haspopup="menu" aria-expanded="false" aria-label="Mais ações">
          <img src="assets/kebab.svg" width="24" height="24" alt="" />
        </button>
      </td>
    `;
    row.querySelector("strong").textContent = condition.name;
    row.querySelector(".condition-copy span").textContent = condition.description;
    row.children[1].textContent = condition.updated;
    row.children[2].textContent = condition.editor;
    body.append(row);
  });

  empty.hidden = rows.length > 0;
  const table = body.closest("table");
  table.hidden = rows.length === 0;

  if (menuTrigger && !menu.hidden) {
    const stillThere = body.querySelector(`[data-action="menu"][aria-expanded="true"]`);
    if (!stillThere) closeMenu();
  }
}

function openMenu(trigger, conditionId) {
  closeMenu();
  menuConditionId = conditionId;
  menuTrigger = trigger;
  trigger.setAttribute("aria-expanded", "true");
  menu.hidden = false;
  const triggerRect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let top = triggerRect.bottom + 4;
  if (top + menuRect.height > window.innerHeight - 8) {
    top = Math.max(8, triggerRect.top - menuRect.height - 4);
  }
  menu.style.top = `${top}px`;
  menu.style.left = `${Math.max(8, triggerRect.right - menuRect.width)}px`;
  menu.querySelector("[data-menu='flows']").focus();
}

function closeMenu() {
  menu.hidden = true;
  if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
  menuTrigger = null;
  menuConditionId = null;
}

function syncOverlay() {
  const drawerOpen = flowsDrawer.classList.contains("is-open") || createDrawer.classList.contains("is-open");
  const modalOpen = !deleteDialog.hidden;
  overlay.classList.toggle("is-visible", drawerOpen || modalOpen);
  overlay.classList.toggle("is-modal", modalOpen);
}

function openDrawer(drawer, trigger) {
  drawerTrigger = trigger || document.activeElement;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  drawer.removeAttribute("inert");
  syncOverlay();
}

function closeDrawer(drawer) {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  drawer.setAttribute("inert", "");
  syncOverlay();
  if (drawerTrigger && document.contains(drawerTrigger)) drawerTrigger.focus();
  drawerTrigger = null;
}

function openDelete(condition, trigger) {
  deleteConditionId = condition.id;
  deleteTrigger = trigger;
  deleteDialog.hidden = false;
  syncOverlay();
  deleteDialog.querySelector("[data-dialog-close]").focus();
}

function closeDelete() {
  deleteDialog.hidden = true;
  deleteConditionId = null;
  syncOverlay();
  if (deleteTrigger && document.contains(deleteTrigger)) deleteTrigger.focus();
  deleteTrigger = null;
}

function confirmDelete() {
  const conditionId = deleteConditionId;
  const index = conditions.findIndex((item) => item.id === conditionId);
  closeDelete();
  if (index < 0) return;
  conditions.splice(index, 1);
  if (editingId === conditionId) {
    editingId = null;
    closeDrawer(createDrawer);
  }
  if (flowsConditionId === conditionId) {
    flowsConditionId = null;
    closeDrawer(flowsDrawer);
  }
  render();
}

function openFlows(condition, trigger) {
  closeDrawer(createDrawer);
  flowsIntro.replaceChildren();
  const lead = document.createElement("span");
  const name = document.createElement("strong");
  const tail = document.createElement("span");
  lead.textContent = "A condição ";
  name.textContent = condition.name;
  tail.textContent = condition.flows.length
    ? " está sendo usada atualmente nas seguintes automações de conversas:"
    : " ainda não está sendo usada em nenhuma automação de conversas.";
  flowsIntro.append(lead, name, tail);

  flowList.replaceChildren();
  condition.flows.forEach((flowName) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = flowName;
    const button = document.createElement("button");
    button.className = "icon-btn";
    button.type = "button";
    button.setAttribute("aria-label", `Editar fluxo ${flowName}`);
    button.innerHTML = '<img src="assets/pen.svg" width="24" height="24" alt="" />';
    item.append(label, button);
    flowList.append(item);
  });

  flowsConditionId = condition.id;
  openDrawer(flowsDrawer, trigger);
  flowsDrawer.querySelector("[data-close]").focus();
}

function updateSaveState() {
  const ready = nameInput.value.trim().length > 0 && descriptionInput.value.trim().length > 0;
  saveButton.disabled = !ready;
}

function updateCounter() {
  counter.textContent = String(NAME_LIMIT - nameInput.value.length);
}

function openCreate(condition, trigger) {
  flowsConditionId = null;
  closeDrawer(flowsDrawer);
  editingId = condition ? condition.id : null;
  nameInput.value = condition ? condition.name : "";
  descriptionInput.value = condition ? condition.description : "";
  updateCounter();
  updateSaveState();
  openDrawer(createDrawer, trigger);
  nameInput.focus();
}

body.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const row = button.closest("tr");
  const condition = conditions.find((item) => item.id === row.dataset.id);
  if (!condition) return;

  if (button.dataset.action === "menu") {
    if (button.getAttribute("aria-expanded") === "true") closeMenu();
    else openMenu(button, condition.id);
    return;
  }

  if (button.dataset.action === "edit") {
    closeMenu();
    openCreate(condition, button);
  }
});

menu.addEventListener("click", (event) => {
  const action = event.target.closest("[data-menu]");
  if (!action) return;
  const condition = conditions.find((item) => item.id === menuConditionId);
  const trigger = menuTrigger;
  closeMenu();
  if (!condition) return;

  if (action.dataset.menu === "flows") {
    openFlows(condition, trigger);
    return;
  }

  openDelete(condition, trigger);
});

document.querySelector("#create-condition").addEventListener("click", (event) => {
  closeMenu();
  openCreate(null, event.currentTarget);
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    closeDrawer(button.dataset.close === "flows" ? flowsDrawer : createDrawer);
    if (button.dataset.close === "create") editingId = null;
    else flowsConditionId = null;
  });
});

search.addEventListener("input", () => {
  query = search.value;
  closeMenu();
  render();
});

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  search.focus();
});

nameInput.addEventListener("input", () => {
  updateCounter();
  updateSaveState();
});

descriptionInput.addEventListener("input", updateSaveState);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!name || !description) return;

  if (editingId) {
    const condition = conditions.find((item) => item.id === editingId);
    if (condition) {
      condition.name = name;
      condition.description = description;
      condition.updated = formatNow();
      condition.editor = "Cláudia";
    }
  } else {
    conditions.unshift({
      id: `condicao-${Date.now()}`,
      name,
      description,
      updated: formatNow(),
      editor: "Cláudia",
      flows: [],
    });
  }

  editingId = null;
  closeDrawer(createDrawer);
  render();
});

document.addEventListener("click", (event) => {
  if (menu.hidden) return;
  if (menu.contains(event.target) || event.target.closest("[data-action='menu']")) return;
  closeMenu();
});

overlay.addEventListener("click", () => {
  if (!deleteDialog.hidden) {
    closeDelete();
    return;
  }
  if (createDrawer.classList.contains("is-open")) {
    editingId = null;
    closeDrawer(createDrawer);
    return;
  }
  if (flowsDrawer.classList.contains("is-open")) {
    flowsConditionId = null;
    closeDrawer(flowsDrawer);
  }
});

document.querySelectorAll("[data-dialog-close]").forEach((button) => {
  button.addEventListener("click", closeDelete);
});

document.querySelector("#confirm-delete").addEventListener("click", confirmDelete);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!deleteDialog.hidden) {
    closeDelete();
    return;
  }
  if (!menu.hidden) {
    const trigger = menuTrigger;
    closeMenu();
    trigger?.focus();
    return;
  }
  if (createDrawer.classList.contains("is-open")) {
    editingId = null;
    closeDrawer(createDrawer);
    return;
  }
  if (flowsDrawer.classList.contains("is-open")) {
    flowsConditionId = null;
    closeDrawer(flowsDrawer);
  }
});

window.addEventListener("resize", () => {
  if (!menu.hidden && menuTrigger) openMenu(menuTrigger, menuConditionId);
});

render();
