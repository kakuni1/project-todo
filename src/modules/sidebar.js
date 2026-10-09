import { loadContent } from "./database.js";
import { createListItem } from "./dom.js";
import { createButton, getIcon } from "./icons.js";

export function createSidebar(sectionNames) {
  const side = document.createElement("div");
  side.id = "sidebar";
  side.dataset.sidebar = "show";

  const button = document.createElement("button");
  button.className = "button-sidebar";
  button.setAttribute("aria-label", "Hide sidebar");
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-controls", "sidebar");
  createButton(button, "icon-sidebar-hide");

  const items = loadContent();
  const sideContent = document.createElement("div");
  sideContent.id = "side-content";

  // build out the sections (Tasks, Projects)
  for (const section of sectionNames) {
    const h2 = document.createElement("h2");
    h2.textContent = section;
    h2.id = section.toLowerCase();
    const list = document.createElement("ul");
    list.id = `${section.toLowerCase()}-list`;
    // build out the items (Today, This week, etc.)
    // Projects, extra icon for optional delete
    for (const item of items) {
      if (item.parent === section)
        list.appendChild(createListItem(item.icon, item.name, { deletable: section === "Projects" }));
    }

    const header = document.createElement("div");
    header.id = "header-section";
    header.append(h2);

    if (section === "Projects") {
      const buttonAdd = document.createElement("button");
      createButton(buttonAdd, "icon-plus");
      buttonAdd.className = "button-plus";
      buttonAdd.setAttribute("aria-label", "Add project");
      header.appendChild(buttonAdd);
    }
    sideContent.append(header, list);
  }
  side.append(button, sideContent);
  return { button, side };
}
export function sideButtonSwap(sideArea, sideButton) {
  const sideState = sideArea.dataset.sidebar === "show" ? "hide" : "show";
  sideArea.dataset.sidebar = sideState;
  localStorage.setItem("sidebar-state", sideState);
  sideButton.innerHTML = getIcon(`icon-sidebar-${sideState}`);
  sideButton.setAttribute("aria-label", sideState === "show" ? "Hide sidebar" : "Show sidebar");
  sideButton.setAttribute("aria-expanded", sideState === "show" ? "true" : "false");
}
