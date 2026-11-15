"use strict";

const records = window.directoryData;
const byId = new Map(records.map(record => [record.id, record]));
const form = document.querySelector("#filters");
const search = document.querySelector("#search");
const region = document.querySelector("#region");
const sector = document.querySelector("#sector");
const scope = document.querySelector("#scope");
const output = document.querySelector("#results");
const count = document.querySelector("#count");
const clear = document.querySelector("#clear");
const profile = document.querySelector("#profile");
const profileContent = document.querySelector("#profile-content");
const views = [...document.querySelectorAll("[data-view]")];
let view = "cards";

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(label, url) {
  const anchor = element("a", label);
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  return anchor;
}

function normalise(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function matches(record) {
  const isLead = record.status === "Research lead";
  if (scope.value === "directory" && isLead) return false;
  if (scope.value === "leads" && !isLead) return false;
  if (region.value && region.value !== record.region) return false;
  if (sector.value && sector.value !== record.sector) return false;
  const description = normalise([
    record.name, record.city, record.area, record.region, record.sector,
    record.kind, record.description, ...record.founders
  ].join(" "));
  return normalise(search.value).trim().split(/\s+/).every(term => description.includes(term));
}

function formatLocation(record) {
  return record.city === record.area ? record.city : record.area + " · " + record.city;
}

function founders(record) {
  return record.founders.join(", ") || "Unverified";
}

function logo(record) {
  const mark = element("div", undefined, "logo");
  const initials = record.name.split(/\s+/).slice(0, 2).map(word => word[0]).join("");
  const fallback = element("span", initials);
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", "Initials for " + record.name);
  mark.append(fallback);
  if (record.logo) {
    const image = element("img");
    image.alt = record.name + " logo";
    fallback.hidden = true;
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    });
    image.src = record.logo;
    mark.append(image);
  }
  return mark;
}

function badge(record) {
  const type = record.status === "Research lead" ? " lead" :
    record.status === "Ownership under review" ? " review" : "";
  return element("span", record.status, "status" + type);
}

function detail(label, value) {
  const field = element("div");
  field.append(element("dt", label), element("dd", value));
  return field;
}

function profileButton(record, label) {
  const button = element("button", label, "profile-button");
  button.type = "button";
  button.dataset.profile = record.id;
  button.setAttribute("aria-label", "View profile for " + record.name);
  const arrow = element("span", "↗");
  arrow.setAttribute("aria-hidden", "true");
  button.append(arrow);
  return button;
}

function cover(record, className) {
  const image = element("img", undefined, className);
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";
  image.src = record.coverUrl;
  return image;
}

function card(record) {
  const article = element("article", undefined, "card");
  const header = element("div", undefined, "card-top");
  const labels = element("div", undefined, "card-labels");
  labels.append(logo(record), badge(record));
  if (record.coverUrl) {
    header.classList.add("with-cover");
    const image = cover(record, "card-cover");
    image.addEventListener("error", () => {
      image.remove();
      header.classList.remove("with-cover");
    });
    header.append(image);
  }
  header.append(labels);
  const list = element("dl");
  list.append(detail("Location", formatLocation(record)), detail("Founders", founders(record)));
  article.append(header, element("h3", record.name),
    element("p", record.sector + " / " + record.kind, "sector"),
    element("p", record.description, "description"), list, profileButton(record, "View profile"));
  return article;
}

function renderTable(filtered) {
  const wrapper = element("div", undefined, "table-wrap");
  wrapper.tabIndex = 0;
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", "Scrollable business directory table");
  const table = element("table");
  const head = table.createTHead().insertRow();
  for (const label of ["Business", "Location", "Founders", "Sector / type", "Ownership evidence"]) {
    const heading = element("th", label);
    heading.scope = "col";
    head.append(heading);
  }
  const body = table.createTBody();
  for (const record of filtered) {
    const row = body.insertRow();
    const name = element("th");
    name.scope = "row";
    name.append(profileButton(record, record.name));
    row.append(name);
    row.insertCell().textContent = formatLocation(record);
    row.insertCell().textContent = founders(record);
    row.insertCell().textContent = record.sector + " / " + record.kind;
    row.insertCell().append(badge(record));
  }
  wrapper.append(table);
  return wrapper;
}

function showProfile(record) {
  const heading = element("h2", record.name);
  heading.id = "profile-title";
  const details = element("dl");
  details.append(detail("Founders", founders(record)),
    detail("Ownership and control", record.owner), detail("Where it operates", record.operations));
  const sources = element("ul");
  for (const source of record.sources) {
    const entry = element("li");
    entry.append(link(source.label, source.url));
    sources.append(entry);
  }
  profileContent.replaceChildren(logo(record), badge(record), heading,
    element("p", record.description, "description"), details,
    element("h3", "Sources"), sources, link(record.website.startsWith("https://ratings.food.gov.uk/") ? "View business record ↗" : "Visit website ↗", record.website),
    element("p", "Checked " + new Date(record.checked + "T00:00:00Z").toLocaleDateString(
      "en-GB", {day:"numeric", month:"long", year:"numeric", timeZone:"UTC"}
    ), "checked"));
  if (record.coverUrl) {
    const image = cover(record, "profile-cover");
    image.addEventListener("error", () => image.remove());
    profileContent.prepend(image);
    if (record.coverSource) {
      const credit = element("li");
      credit.append(link("Cover image source", record.coverSource));
      sources.append(credit);
    }
  }
  profile.showModal();
}

function render() {
  const filtered = records.filter(matches);
  count.textContent = filtered.length + (filtered.length === 1 ? " business" : " businesses");
  clear.hidden = !search.value && !region.value && !sector.value && scope.value === "all";
  if (!filtered.length) {
    output.replaceChildren(element("p", "No businesses match these filters. Try another location, sector or listing scope.", "empty"));
    return;
  }
  if (view === "table") {
    output.replaceChildren(renderTable(filtered));
    return;
  }
  const cards = element("div", undefined, "cards");
  cards.append(...filtered.map(card));
  output.replaceChildren(cards);
}

for (const name of [...new Set(records.map(record => record.sector))].sort()) {
  sector.append(new Option(name, name));
}
form.addEventListener("submit", event => event.preventDefault());
form.addEventListener("input", render);
clear.addEventListener("click", () => {
  form.reset();
  render();
  search.focus();
});
for (const button of views) {
  button.addEventListener("click", () => {
    view = button.dataset.view;
    for (const option of views) option.setAttribute("aria-pressed", String(option === button));
    render();
  });
}
output.addEventListener("click", event => {
  const button = event.target.closest("[data-profile]");
  if (button) showProfile(byId.get(button.dataset.profile));
});
document.querySelector("#close-profile").addEventListener("click", () => profile.close());
profile.addEventListener("click", event => {
  if (event.target === profile) profile.close();
});
render();
