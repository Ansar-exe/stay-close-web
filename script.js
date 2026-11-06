'use strict';

const KEYS = {
  contacts: 'stay_close_contacts',
  tasks: 'stay_close_tasks',
  events: 'stay_close_events',
  messages: 'stay_close_messages',
  selected: 'stay_close_selected',
};

function load(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    toast('Не удалось сохранить данные в браузере');
  }
}

let contacts = load(KEYS.contacts);
let tasks = load(KEYS.tasks);
let events = load(KEYS.events);
let messages = load(KEYS.messages);

let selectedId = null;
try { selectedId = localStorage.getItem(KEYS.selected); } catch (e) {}

const LIMITS = { name: 50, notes: 1000, phoneMin: 10, phoneMax: 15, todo: 100, event: 60, message: 500 };

function validateName(value) {
  const text = value.trim();
  if (!text) return 'Введите имя';
  if (text.length > LIMITS.name) return 'Имя слишком длинное — максимум ' + LIMITS.name + ' символов';
  if (!/\p{L}/u.test(text)) return 'Имя должно содержать буквы';
  return '';
}

function validatePhone(value) {
  const text = value.trim();
  if (!text) return '';
  if (!/^\+?[0-9\s\-()]+$/.test(text)) return 'Номер может содержать только цифры, пробелы, «+», «-» и скобки';
  const digits = text.replace(/\D/g, '').length;
  if (digits < LIMITS.phoneMin || digits > LIMITS.phoneMax) {
    return 'В номере должно быть от ' + LIMITS.phoneMin + ' до ' + LIMITS.phoneMax + ' цифр';
  }
  return '';
}

function validateNotes(value) {
  const len = value.trim().length;
  if (len > LIMITS.notes) return 'Заметка слишком длинная: ' + len + ' из ' + LIMITS.notes;
  return '';
}

function validateLast(value) {
  if (!value) return '';
  const d = parseDate(value);
  if (isNaN(d) || d.getFullYear() < 1900) return 'Проверьте дату';
  if (d > startOfDay(new Date())) return 'Дата общения не может быть в будущем';
  return '';
}

function validateBirthday(value) {
  if (!value) return '';
  const d = parseDate(value);
  if (isNaN(d) || d.getFullYear() < 1900) return 'Проверьте дату';
  if (d > startOfDay(new Date())) return 'Дата рождения не может быть в будущем';
  return '';
}

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, cls, handler) {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', handler);
  return b;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

let toastTimer;
function toast(message) {
  const t = $('toast');
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

const ICONS = {
  star: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  cake: '<path d="M12 4.5v3.5"/><path d="M4 11.5c1-1.3 2-1.3 3 0s2 1.3 3 0 2-1.3 3 0 2 1.3 3 0 2-1.3 3 0"/><path d="M4 11.5v6.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5"/><path d="M4 15h16"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  dots: '<circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.5 0 4.5 2 4.5 4.5"/>',
};

function icon(name, size, filled) {
  const span = el('span', 'icon');
  span.setAttribute('aria-hidden', 'true');
  const fill = filled ? 'currentColor' : 'none';
  span.innerHTML = '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="' + fill +
    '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
  return span;
}

function iconButton(name, label, cls, handler, filled) {
  const b = el('button', 'icon-btn ' + (cls || ''));
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.title = label;
  b.appendChild(icon(name, 22, filled));
  b.addEventListener('click', handler);
  return b;
}

const DAY = 86400000;
const MONTHS_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function parseDate(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function isoToDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function dateToIso(str) {
  const d = parseDate(str);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function daysSince(iso) {
  if (!iso) return null;
  return Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY);
}

function daysUntil(str) {
  return Math.round((parseDate(str) - startOfDay(new Date())) / DAY);
}

function shortDate(str) {
  const d = parseDate(str);
  return d.getDate() + ' ' + MONTHS_FULL[d.getMonth()];
}

function plural(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

function spanText(n) {
  if (n < 14) return n + ' ' + plural(n, ['день', 'дня', 'дней']);
  if (n < 60) {
    const w = Math.floor(n / 7);
    return w + ' ' + plural(w, ['неделя', 'недели', 'недель']);
  }
  const m = Math.floor(n / 30);
  return m + ' ' + plural(m, ['месяц', 'месяца', 'месяцев']);
}

function lastPhrase(iso) {
  const d = daysSince(iso);
  if (d === null) return 'ещё не отмечали';
  if (d <= 0) return 'сегодня';
  if (d === 1) return 'вчера';
  return spanText(d) + ' назад';
}

function when(str) {
  const u = daysUntil(str);
  if (u === 0) return 'сегодня';
  if (u === 1) return 'завтра';
  if (u === -1) return 'вчера';
  if (u > 1 && u <= 7) return 'через ' + u + ' ' + plural(u, ['день', 'дня', 'дней']);
  return shortDate(str);
}

function cap(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function clockTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso) {
  const d = daysSince(iso);
  if (d === 0) return 'Сегодня';
  if (d === 1) return 'Вчера';
  const date = new Date(iso);
  return date.getDate() + ' ' + MONTHS_FULL[date.getMonth()];
}

function birthdayIn(c) {
  if (!c.birthday) return null;
  const [, m, d] = c.birthday.split('-').map(Number);
  const today = startOfDay(new Date());
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next - today) / DAY);
}

function birthdayText(c) {
  const n = birthdayIn(c);
  const [, m, d] = c.birthday.split('-').map(Number);
  const left = n === 0 ? 'сегодня' : n === 1 ? 'завтра' : 'через ' + n + ' ' + plural(n, ['день', 'дня', 'дней']);
  return d + ' ' + MONTHS_FULL[m - 1] + ' · ' + left;
}

const RHYTHM_LABEL = { 7: 'Писать раз в неделю', 14: 'Писать раз в 2 недели', 30: 'Писать раз в месяц' };

function isOverdue(c) {
  const d = daysSince(c.lastContactAt);
  if (d === null) return false;
  return d > (Number(c.rhythm) || 14) - (c.rhythm ? 0 : 1);
}

function contactSub(c) {
  const b = birthdayIn(c);
  if (b === 0) return { text: 'День рождения сегодня' };
  if (b === 1) return { text: 'День рождения завтра' };
  const soon = eventsOf(c.id)
    .filter((e) => daysUntil(e.date) >= 0 && daysUntil(e.date) <= 7)
    .sort((a, b2) => a.date.localeCompare(b2.date))[0];
  if (soon) return { text: cap(soon.title) + ' ' + shortDate(soon.date) };
  const d = daysSince(c.lastContactAt);
  if (d === null) return { text: 'Ещё не отмечали общение' };
  if (isOverdue(c)) return { text: 'Не писали ' + spanText(d), warm: true };
  return { text: cap(lastPhrase(c.lastContactAt)) };
}

const eventsOf = (id) => events.filter((e) => e.contactId === id);
const tasksOf = (id) => tasks.filter((t) => t.contactId === id);
const messagesOf = (id) => messages.filter((m) => m.contactId === id).sort((a, b) => a.at.localeCompare(b.at));
const findContact = (id) => contacts.find((c) => c.id === id);

function current() {
  let c = findContact(selectedId);
  if (!c && contacts.length) {
    c = contacts[0];
    selectedId = c.id;
  }
  return c || null;
}

function selectContact(id) {
  selectedId = id;
  try { localStorage.setItem(KEYS.selected, id); } catch (e) {}
}

function saveContacts() { save(KEYS.contacts, contacts); }
function saveTasks() { save(KEYS.tasks, tasks); }
function saveEvents() { save(KEYS.events, events); }
function saveMessages() { save(KEYS.messages, messages); }

function buildTips() {
  const tips = [];
  contacts.forEach((c) => {
    const b = birthdayIn(c);
    if (b !== null && b <= 3) {
      const text = 'День рождения: ' + c.name + ' — ' + (b === 0 ? 'сегодня' : b === 1 ? 'завтра' : 'через ' + b + ' дн.');
      tips.push({ id: c.id, icon: 'cake', text, action: 'Поздравить', prio: 0 });
    }
    eventsOf(c.id).forEach((e) => {
      const u = daysUntil(e.date);
      if (u < 0 && u >= -3) {
        tips.push({ id: c.id, icon: 'calendar', text: c.name + ': спросить, как прошло — ' + e.title, action: 'Написать', prio: 1 });
      } else if (u >= 0 && u <= 3) {
        tips.push({ id: c.id, icon: 'calendar', text: c.name + ': ' + e.title + ' — ' + when(e.date), action: 'Написать', prio: 2 });
      }
    });
    tasksOf(c.id).forEach((t) => {
      if (!t.done && t.due && daysUntil(t.due) <= 1) {
        tips.push({ id: c.id, icon: 'check', text: c.name + ': ' + t.text + ' — ' + when(t.due), action: 'Написать', prio: 3 });
      }
    });
    if (isOverdue(c)) {
      tips.push({ id: c.id, icon: 'clock', text: c.name + ': не писали ' + spanText(daysSince(c.lastContactAt)), action: 'Написать', prio: 4 });
    }
  });
  return tips.sort((a, b) => a.prio - b.prio).slice(0, 6);
}

function firstFragment(notes) {
  const part = (notes || '').trim().split(/[.!?\n]/)[0].trim();
  return part.length > 90 ? part.slice(0, 87).trim() + '…' : part;
}

function draftVariants(c) {
  const v = [];
  const b = birthdayIn(c);
  if (b === 0) {
    v.push(c.name + ', с днём рождения! Желаю тепла, хорошего настроения и радостных людей рядом. Обнимаю!');
    v.push('Привет, ' + c.name + '! Поздравляю с днём рождения. Пусть этот год будет добрым к тебе. Как будешь отмечать?');
  } else if (b !== null && b <= 3) {
    v.push('Привет, ' + c.name + '! Скоро твой день рождения — хочу заранее сказать, что ты классный человек. Как планируешь отмечать?');
  }
  eventsOf(c.id).forEach((e) => {
    const u = daysUntil(e.date);
    if (u < 0 && u >= -7) v.push('Привет, ' + c.name + '! Как всё прошло: ' + e.title + '? Мне правда интересно.');
    else if (u >= 0 && u <= 7) v.push('Привет, ' + c.name + '! Помню, скоро у тебя важное дело — ' + e.title + '. Как подготовка?');
  });
  const frag = firstFragment(c.notes);
  if (frag) v.push('Привет, ' + c.name + '! Вспомнил(а) про тебя: «' + frag + '». Как там сейчас?');
  tasksOf(c.id).filter((t) => !t.done).slice(0, 1).forEach((t) => {
    v.push('Привет, ' + c.name + '! Не забыл(а): ' + t.text.toLowerCase() + '. Как тебе удобнее?');
  });
  if (isOverdue(c)) v.push('Привет, ' + c.name + '! Давно не болтали — как у тебя дела? Хочется услышать новости.');
  v.push('Привет, ' + c.name + '! Подумал(а) о тебе — как ты? Что нового?');
  v.push(c.name + ', привет! Есть минутка? Расскажи, как твои дела.');
  return Array.from(new Set(v));
}

const draftIndex = {};

const PAGES = ['home', 'contacts', 'chat', 'about'];
let lastPage = null;
let focusDraft = false;

function showPage() {
  const raw = (location.hash || '#home').slice(1);
  const name = PAGES.includes(raw) ? raw : 'home';
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === 'page-' + name));
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.page === name));
  $('cta-open').hidden = name === 'contacts' || name === 'chat';
  $('cta-add').hidden = name !== 'contacts';
  $('cta-back').hidden = name !== 'chat';
  if (name === 'contacts') renderApp();
  if (name === 'chat') renderChat();
  if (lastPage !== null && lastPage !== name) window.scrollTo(0, 0);
  lastPage = name;
}
window.addEventListener('hashchange', showPage);

document.querySelectorAll('[data-scroll]').forEach((b) => {
  b.addEventListener('click', () => {
    const target = $(b.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

function openChat(id, withDraft) {
  selectContact(id);
  focusDraft = !!withDraft;
  if (location.hash === '#chat') renderChat();
  else location.hash = '#chat';
}

let view = 'list';
let query = '';

function renderTips() {
  const box = $('tips');
  box.textContent = '';
  const tips = buildTips();
  box.hidden = !tips.length;
  tips.forEach((t) => {
    const card = el('div', 'tip');
    const row = el('div', 'tip-text');
    row.appendChild(icon(t.icon, 18));
    row.appendChild(el('div', '', t.text));
    card.appendChild(row);
    card.appendChild(button(t.action, '', () => openChat(t.id, true)));
    box.appendChild(card);
  });
}

function pickContact(id) {
  selectContact(id);
  renderApp();
  if (window.innerWidth <= 900) $('detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderList(shown) {
  const list = $('contact-list');
  list.textContent = '';
  if (contacts.length && !shown.length) list.appendChild(el('li', 'list-note', 'Ничего не найдено'));
  const cur = current();
  shown.forEach((c) => {
    const li = el('li');
    const row = el('button', 'row' + (cur && cur.id === c.id ? ' on' : ''));
    row.type = 'button';
    row.addEventListener('click', () => pickContact(c.id));
    row.appendChild(el('div', 'avatar', c.name.trim().charAt(0).toUpperCase()));
    const body = el('div', 'row-body');
    body.appendChild(el('div', 'row-name', c.name));
    const sub = contactSub(c);
    body.appendChild(el('div', 'row-sub' + (sub.warm ? ' warm' : ''), sub.text));
    row.appendChild(body);
    if (c.important) {
      const s = el('span', 'star');
      s.setAttribute('aria-label', 'Важно сейчас');
      s.appendChild(icon('star', 18, true));
      row.appendChild(s);
    }
    li.appendChild(row);
    list.appendChild(li);
  });
}

const ORBIT_CX = 190;
const ORBIT_CY = 192;
const orbitSpin = [0, 0, 0];
let orbitFrame = 0;
let orbitSuppress = false;
const ORBIT_AUTO = [14, -9, 6];
let orbitAuto = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function syncOrbitToggle() {
  const b = $('orbit-toggle');
  b.textContent = orbitAuto ? 'Остановить вращение' : 'Запустить вращение';
  b.setAttribute('aria-pressed', String(orbitAuto));
}

function renderOrbit(shown) {
  const box = $('orbit');
  box.textContent = '';
  [[128, 130, 124], [75, 77, 230], [25, 27, 330]].forEach(([x, y, size]) => {
    const ring = el('div', 'ring');
    ring.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px';
    box.appendChild(ring);
  });
  box.appendChild(el('div', 'orbit-me-small', 'Я'));

  const rings = [[], [], []];
  shown.forEach((c) => {
    const d = daysSince(c.lastContactAt);
    rings[d !== null && d <= 3 ? 0 : d !== null && d <= 14 ? 1 : 2].push(c);
  });
  const radius = [62, 115, 165];
  const cur = current();
  cancelAnimationFrame(orbitFrame);
  const placed = [[], [], []];
  const place = (ri) => {
    placed[ri].forEach(({ b, base }) => {
      const angle = ((base + orbitSpin[ri]) * Math.PI) / 180;
      b.style.left = Math.round(ORBIT_CX + radius[ri] * Math.cos(angle) - 32) + 'px';
      b.style.top = Math.round(ORBIT_CY + radius[ri] * Math.sin(angle) - 18) + 'px';
    });
  };
  rings.forEach((group, ri) => {
    group.forEach((c, i) => {
      const b = el('button', 'orbit-btn' + (cur && cur.id === c.id ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('aria-label', c.name);
      placed[ri].push({ b, base: -90 + ri * 40 + (i * 360) / group.length });
      const av = el('div', 'o-av' + (c.lastContactAt && daysSince(c.lastContactAt) <= 3 ? ' ring-on' : ''), c.name.trim().charAt(0).toUpperCase());
      if (c.important) {
        const s = el('span', 'o-star');
        s.appendChild(icon('star', 12, true));
        av.appendChild(s);
      }
      b.appendChild(av);
      b.appendChild(el('div', 'o-name', c.name));
      b.addEventListener('click', () => pickContact(c.id));
      box.appendChild(b);
    });
    place(ri);
  });

  const inertia = [0, 0, 0];
  let drag = null;
  let hover = false;
  let lastTime = performance.now();
  const tick = (now) => {
    if (!box.isConnected || box.offsetParent === null) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    for (let ri = 0; ri < 3; ri++) {
      if (!placed[ri].length) continue;
      if (drag && drag.moved && drag.ring === ri) {
        inertia[ri] = 0;
        continue;
      }
      let d = inertia[ri] * dt;
      inertia[ri] *= Math.pow(0.046, dt);
      if (Math.abs(inertia[ri]) < 1) inertia[ri] = 0;
      if (orbitAuto && !hover && !drag) d += ORBIT_AUTO[ri] * dt;
      if (d) {
        orbitSpin[ri] += d;
        place(ri);
      }
    }
    orbitFrame = requestAnimationFrame(tick);
  };
  orbitFrame = requestAnimationFrame(tick);
  syncOrbitToggle();
  const pointerAngle = (e) => {
    const r = box.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + ORBIT_CY), e.clientX - (r.left + ORBIT_CX)) * 180) / Math.PI;
  };
  const ringAt = (e) => {
    const r = box.getBoundingClientRect();
    const d = Math.hypot(e.clientX - (r.left + ORBIT_CX), e.clientY - (r.top + ORBIT_CY));
    return d < 88 ? 0 : d < 140 ? 1 : 2;
  };
  const wrap = (deg) => ((deg + 540) % 360) - 180;

  box.onpointerdown = (e) => {
    if (e.button !== 0 || !rings.some((g) => g.length)) return;
    drag = { id: e.pointerId, ring: ringAt(e), last: pointerAngle(e), x: e.clientX, y: e.clientY, v: 0, t: performance.now(), moved: false };
  };
  box.onpointermove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
      drag.moved = true;
      orbitSuppress = true;
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
      box.classList.add('spinning');
      drag.last = pointerAngle(e);
    }
    const a = pointerAngle(e);
    const delta = wrap(a - drag.last);
    const now = performance.now();
    drag.v = delta / Math.max(now - drag.t, 1);
    drag.t = now;
    drag.last = a;
    orbitSpin[drag.ring] += delta;
    place(drag.ring);
  };
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { ring, moved, v, t } = drag;
    drag = null;
    box.classList.remove('spinning');
    setTimeout(() => { orbitSuppress = false; }, 0);
    if (moved && performance.now() - t <= 80) inertia[ring] = Math.max(-720, Math.min(720, v * 1000));
  };
  box.onpointerenter = () => { hover = true; };
  box.onpointerleave = () => { hover = false; };
  box.onpointerup = endDrag;
  box.onpointercancel = endDrag;
}

function renderEmpty() {
  const box = $('side-empty');
  box.textContent = '';
  const ic = el('div', 'empty-icon');
  ic.appendChild(icon('people', 36));
  box.appendChild(ic);
  box.appendChild(el('p', '', 'Пока никого нет. Добавь первого человека, с кем хочешь не терять связь.'));
  box.appendChild(button('Добавить человека', 'btn', () => openForm(null)));
  box.appendChild(button('Загрузить демо-данные', 'btn btn-outline', loadDemo));
  box.appendChild(el('p', 'small', 'Демо-данные вымышленные — они нужны, чтобы посмотреть, как всё выглядит.'));
}

function renderSide() {
  const q = query.trim().toLowerCase();
  const shown = contacts.filter((c) => c.name.toLowerCase().includes(q));
  const none = !contacts.length;

  $('view-orbit').classList.toggle('on', view === 'orbit');
  $('view-list').classList.toggle('on', view === 'list');
  $('view-orbit').setAttribute('aria-pressed', String(view === 'orbit'));
  $('view-list').setAttribute('aria-pressed', String(view === 'list'));

  document.querySelector('.search-wrap').hidden = none;
  $('list-view').hidden = none || view !== 'list';
  $('orbit-view').hidden = none || view !== 'orbit';
  $('side-empty').hidden = !none;
  if (none) renderEmpty();
  else if (view === 'list') renderList(shown);
  else renderOrbit(shown);
}

let addOpen = null;

function markMessaged(id) {
  const c = findContact(id);
  if (!c) return;
  c.lastContactAt = new Date().toISOString();
  saveContacts();
}

function toggleImportant(id) {
  const c = findContact(id);
  if (!c) return;
  c.important = !c.important;
  saveContacts();
  renderApp();
}

function addForm(kind, c) {
  const isTask = kind === 'task';
  const form = el('form', 'inline-form');
  form.noValidate = true;
  const text = el('input');
  text.type = 'text';
  text.maxLength = 200;
  text.autocomplete = 'off';
  text.placeholder = isTask ? 'Что не забыть' : 'Что за событие';
  text.setAttribute('aria-label', text.placeholder);
  const date = el('input');
  date.type = 'date';
  date.setAttribute('aria-label', isTask ? 'Срок (необязательно)' : 'Дата события');
  const submit = el('button', 'btn btn-small', 'Добавить');
  submit.type = 'submit';
  const err = el('div', 'error');
  form.append(text, date, submit, err);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = text.value.trim();
    const limit = isTask ? LIMITS.todo : LIMITS.event;
    if (!value) { err.textContent = 'Напишите, что именно'; return; }
    if (value.length > limit) { err.textContent = 'Слишком длинно — максимум ' + limit + ' символов'; return; }
    if (!isTask && !date.value) { err.textContent = 'Укажите дату события'; return; }
    if (isTask) {
      tasks.push({ id: newId(), contactId: c.id, text: value, due: date.value || '', done: false });
      saveTasks();
    } else {
      events.push({ id: newId(), contactId: c.id, title: value, date: date.value });
      saveEvents();
    }
    addOpen = null;
    toast(isTask ? 'Дело добавлено' : 'Событие добавлено');
    renderApp();
  });
  return form;
}

function renderDetail() {
  const box = $('detail');
  box.textContent = '';
  const c = current();
  if (!c) {
    box.appendChild(el('p', 'muted', 'Здесь появится карточка выбранного человека.'));
    return;
  }

  const inner = el('div', 'detail-inner');

  const head = el('div', 'detail-head');
  head.appendChild(el('div', 'avatar', c.name.trim().charAt(0).toUpperCase()));
  head.appendChild(el('h1', '', c.name));
  head.appendChild(iconButton('star', c.important ? 'Убрать из важных' : 'Важно сейчас', 'btn-star', () => toggleImportant(c.id), c.important));
  head.appendChild(iconButton('edit', 'Редактировать', '', () => openForm(c)));
  head.appendChild(iconButton('trash', 'Удалить', '', () => askDelete(c)));
  inner.appendChild(head);

  const meta = el('div', 'meta');
  meta.appendChild(el('div', '', c.phone || 'Телефон не указан'));
  meta.appendChild(el('div', 'meta-line', 'Последний раз: ' + lastPhrase(c.lastContactAt)));
  if (c.birthday) {
    const line = el('div', 'meta-line');
    line.appendChild(icon('calendar', 16));
    line.appendChild(el('span', '', birthdayText(c)));
    meta.appendChild(line);
  }
  inner.appendChild(meta);

  const actions = el('div', 'row-gap');
  actions.style.marginTop = '24px';
  actions.appendChild(button('Написал(а)', 'btn', () => {
    markMessaged(c.id);
    toast('Отмечено: написал(а)');
    renderApp();
  }));
  actions.appendChild(button('Открыть чат', 'btn btn-outline', () => openChat(c.id, false)));
  actions.appendChild(button('Помочь с сообщением', 'btn btn-outline', () => openChat(c.id, true)));
  inner.appendChild(actions);

  inner.appendChild(el('div', 'divider'));

  inner.appendChild(el('div', 'sec-title first', 'Что нужно помнить'));
  inner.appendChild(el('div', 'text-block', c.notes || 'Пока пусто'));

  inner.appendChild(el('div', 'sec-title', 'О чём говорили в прошлый раз'));
  const log = messagesOf(c.id).slice(-3);
  if (log.length) {
    log.forEach((m) => {
      inner.appendChild(el('div', 'text-block', (m.from === 'me' ? 'Вы: ' : c.name + ': ') + m.text));
    });
    inner.appendChild(el('div', 'caption', 'Из журнала переписки · ' + dayLabel(log[log.length - 1].at).toLowerCase()));
  } else {
    inner.appendChild(el('div', 'text-block muted', 'Пока нет записей. Их можно вести в разделе «Чат».'));
  }

  inner.appendChild(el('div', 'sec-title', 'Не забыть'));
  tasksOf(c.id).sort((a, b) => Number(a.done) - Number(b.done)).forEach((t) => {
    const row = el('div', 'todo' + (t.done ? ' done' : ''));
    const tick = el('button', 'tick' + (t.done ? ' on' : ''));
    tick.type = 'button';
    tick.setAttribute('aria-label', t.done ? 'Вернуть в список' : 'Отметить выполненным');
    tick.appendChild(icon(t.done ? 'check' : 'circle', 22));
    tick.addEventListener('click', () => { t.done = !t.done; saveTasks(); renderApp(); });
    row.appendChild(tick);
    row.appendChild(el('div', 'todo-text', t.text));
    if (t.due && !t.done) {
      row.appendChild(el('div', 'todo-due' + (daysUntil(t.due) < 0 ? ' warm' : ''), when(t.due)));
    }
    const del = el('button', 'mini-del');
    del.type = 'button';
    del.setAttribute('aria-label', 'Удалить дело');
    del.appendChild(icon('close', 16));
    del.addEventListener('click', () => { tasks = tasks.filter((x) => x.id !== t.id); saveTasks(); renderApp(); });
    row.appendChild(del);
    inner.appendChild(row);
  });
  if (addOpen === 'task') inner.appendChild(addForm('task', c));
  else inner.appendChild(button('+ Добавить', 'link-btn', () => { addOpen = 'task'; renderDetail(); focusInline(); }));

  inner.appendChild(el('div', 'sec-title', 'Впереди'));
  if (c.birthday) {
    const row = el('div', 'event');
    row.appendChild(icon('cake', 22));
    const body = el('div', 'event-body');
    const b = birthdayIn(c);
    body.appendChild(el('div', 'event-title', 'День рождения · ' + (b === 0 ? 'сегодня' : shortDate(dateStr(b)))));
    row.appendChild(body);
    inner.appendChild(row);
  }
  eventsOf(c.id).sort((a, b) => a.date.localeCompare(b.date)).forEach((e) => {
    const row = el('div', 'event');
    row.appendChild(icon('calendar', 22));
    const body = el('div', 'event-body');
    body.appendChild(el('div', 'event-title', shortDate(e.date) + ' · ' + e.title));
    const u = daysUntil(e.date);
    if (u >= 0) body.appendChild(el('div', 'caption', 'напомню спросить ' + shortDate(dateStr(u + 1))));
    else body.appendChild(el('div', 'caption', 'уже прошло — можно спросить, как всё было'));
    row.appendChild(body);
    const del = el('button', 'mini-del');
    del.type = 'button';
    del.setAttribute('aria-label', 'Удалить событие');
    del.appendChild(icon('close', 16));
    del.addEventListener('click', () => { events = events.filter((x) => x.id !== e.id); saveEvents(); renderApp(); });
    row.appendChild(del);
    inner.appendChild(row);
  });
  if (addOpen === 'event') inner.appendChild(addForm('event', c));
  else inner.appendChild(button('+ Добавить', 'link-btn', () => { addOpen = 'event'; renderDetail(); focusInline(); }));

  if (c.rhythm) {
    const r = el('div', 'rhythm');
    r.appendChild(icon('clock', 18));
    r.appendChild(el('span', '', RHYTHM_LABEL[c.rhythm] || 'Писать раз в ' + c.rhythm + ' дн.'));
    inner.appendChild(r);
  }

  box.appendChild(inner);
}

function focusInline() {
  const input = document.querySelector('.inline-form input');
  if (input) input.focus();
}

function renderApp() {
  renderTips();
  renderSide();
  renderDetail();
}

$('orbit').addEventListener('click', (e) => {
  if (orbitSuppress) {
    e.stopPropagation();
    e.preventDefault();
  }
}, true);
$('orbit-toggle').addEventListener('click', () => { orbitAuto = !orbitAuto; syncOrbitToggle(); });
$('view-orbit').addEventListener('click', () => { view = 'orbit'; renderSide(); });
$('view-list').addEventListener('click', () => { view = 'list'; renderSide(); });
$('search').addEventListener('input', (e) => { query = e.target.value; renderSide(); });

const form = $('contact-form');
const contactDialog = $('contact-dialog');

function clearErrors() {
  ['name', 'phone', 'birthday', 'last', 'notes'].forEach((f) => {
    $('err-' + f).textContent = '';
    $('f-' + f).classList.remove('invalid');
  });
}

function showError(field, message) {
  $('err-' + field).textContent = message;
  $('f-' + field).classList.toggle('invalid', !!message);
}

function openForm(contact) {
  clearErrors();
  $('form-title').textContent = contact ? 'Изменить контакт' : 'Новый контакт';
  $('f-id').value = contact ? contact.id : '';
  $('f-name').value = contact ? contact.name : '';
  $('f-phone').value = contact ? contact.phone || '' : '';
  $('f-birthday').value = contact ? contact.birthday || '' : '';
  $('f-rhythm').value = contact && contact.rhythm ? String(contact.rhythm) : '';
  $('f-notes').value = contact ? contact.notes || '' : '';
  $('f-last').value = contact ? isoToDate(contact.lastContactAt) : '';
  $('f-last').dataset.orig = $('f-last').value;
  $('f-last').max = dateStr(0);
  $('f-birthday').max = dateStr(0);
  if (!contactDialog.open) contactDialog.showModal();
  $('f-name').focus();
}

function closeForm() {
  if (contactDialog.open) contactDialog.close();
  form.reset();
  clearErrors();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('f-name').value;
  const phone = $('f-phone').value;
  const birthday = $('f-birthday').value;
  const notes = $('f-notes').value;
  const last = $('f-last').value;

  const errors = { name: validateName(name), phone: validatePhone(phone), birthday: validateBirthday(birthday), last: validateLast(last), notes: validateNotes(notes) };
  Object.keys(errors).forEach((k) => showError(k, errors[k]));
  if (Object.values(errors).some(Boolean)) return;

  const rhythm = Number($('f-rhythm').value) || null;
  const id = $('f-id').value;
  if (id) {
    const c = findContact(id);
    c.name = name.trim();
    c.phone = phone.trim();
    c.birthday = birthday;
    c.rhythm = rhythm;
    c.notes = notes.trim();
    if (last !== $('f-last').dataset.orig) c.lastContactAt = last ? dateToIso(last) : null;
    toast('Изменения сохранены');
  } else {
    const c = {
      id: newId(),
      name: name.trim(),
      phone: phone.trim(),
      birthday,
      rhythm,
      notes: notes.trim(),
      important: false,
      lastContactAt: last ? dateToIso(last) : null,
      createdAt: new Date().toISOString(),
    };
    contacts.push(c);
    selectContact(c.id);
    toast('Контакт «' + c.name + '» добавлен');
  }
  saveContacts();
  closeForm();
  renderApp();
});

$('cta-add').addEventListener('click', () => openForm(null));
$('btn-cancel').addEventListener('click', closeForm);
contactDialog.addEventListener('cancel', () => { form.reset(); clearErrors(); });

const confirmDialog = $('confirm-dialog');
let onConfirm = null;

function askConfirm(title, text, yesLabel, handler) {
  $('confirm-title').textContent = title;
  $('confirm-text').textContent = text;
  $('confirm-yes').textContent = yesLabel;
  onConfirm = handler;
  confirmDialog.showModal();
}

function askDelete(contact) {
  askConfirm('Удалить контакт?', '«' + contact.name + '» и все заметки, дела и переписка с этим человеком будут удалены.', 'Удалить', () => {
    contacts = contacts.filter((c) => c.id !== contact.id);
    tasks = tasks.filter((t) => t.contactId !== contact.id);
    events = events.filter((e) => e.contactId !== contact.id);
    messages = messages.filter((m) => m.contactId !== contact.id);
    saveContacts(); saveTasks(); saveEvents(); saveMessages();
    if (selectedId === contact.id) selectedId = null;
    toast('Контакт «' + contact.name + '» удалён');
    renderApp();
  });
}

$('confirm-no').addEventListener('click', () => { onConfirm = null; confirmDialog.close(); });
$('confirm-yes').addEventListener('click', () => {
  const run = onConfirm;
  onConfirm = null;
  confirmDialog.close();
  if (run) run();
});
confirmDialog.addEventListener('cancel', () => { onConfirm = null; });

let chatMode = 'me';

function renderChat() {
  const root = $('chat-root');
  const prev = $('msg');
  const prevValue = prev ? prev.value : '';
  const hadFocus = prev && document.activeElement === prev;
  root.textContent = '';

  const c = current();
  if (!c) {
    const none = el('div', 'chat-none');
    none.appendChild(el('h1', '', 'Чат'));
    none.appendChild(el('p', '', 'Сначала добавьте человека в разделе «Контакты» — тогда здесь можно будет вести журнал переписки.'));
    const go = el('a', 'btn', 'Перейти к контактам');
    go.href = '#contacts';
    none.appendChild(go);
    root.appendChild(none);
    return;
  }

  const chat = el('section', 'chat');
  const head = el('div', 'chat-head');
  head.appendChild(el('div', 'avatar', c.name.trim().charAt(0).toUpperCase()));
  head.appendChild(el('h1', '', c.name));
  head.appendChild(iconButton('dots', 'Очистить переписку', '', () => {
    if (!messagesOf(c.id).length) { toast('Переписка пуста'); return; }
    askConfirm('Очистить переписку?', 'Все записи журнала с «' + c.name + '» будут удалены.', 'Очистить', () => {
      messages = messages.filter((m) => m.contactId !== c.id);
      saveMessages();
      toast('Переписка очищена');
      renderChat();
    });
  }));
  chat.appendChild(head);

  const open = tasksOf(c.id).filter((t) => !t.done);
  const next = eventsOf(c.id).filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (open.length || next) {
    const banner = el('div', 'chat-banner');
    if (open.length) banner.appendChild(el('div', '', 'Не забыть: ' + open[0].text + (open[0].due ? ' — ' + when(open[0].due) : '')));
    if (next) banner.appendChild(el('div', '', 'Впереди: ' + next.title + ' — ' + shortDate(next.date)));
    chat.appendChild(banner);
  }
  chat.appendChild(el('div', 'chat-hint', 'Журнал переписки: записывайте, что написали вы и что ответили вам. Сообщения никуда не отправляются.'));

  const list = el('div', 'messages');
  list.id = 'messages';
  const log = messagesOf(c.id);
  if (!log.length) {
    list.appendChild(el('div', 'chat-empty', 'Пока нет записей. Напишите человеку в своём мессенджере и отметьте это здесь — так вы вспомните, о чём говорили.'));
  }
  let lastDay = '';
  log.forEach((m) => {
    const label = dayLabel(m.at);
    if (label !== lastDay) {
      list.appendChild(el('div', 'day', label));
      lastDay = label;
    }
    const wrap = el('div', 'msg ' + m.from);
    wrap.appendChild(el('div', 'bubble', m.text));
    const meta = el('div', 'msg-meta');
    meta.appendChild(el('span', '', clockTime(m.at)));
    const del = el('button');
    del.type = 'button';
    del.setAttribute('aria-label', 'Удалить сообщение');
    del.appendChild(icon('close', 14));
    del.addEventListener('click', () => { messages = messages.filter((x) => x.id !== m.id); saveMessages(); renderChat(); });
    meta.appendChild(del);
    wrap.appendChild(meta);
    list.appendChild(wrap);
  });
  chat.appendChild(list);

  const composer = el('form', 'composer');
  composer.noValidate = true;
  const seg = el('div', 'seg');
  seg.setAttribute('role', 'group');
  seg.setAttribute('aria-label', 'Кто пишет');
  const input = el('input');
  const setMode = (mode) => {
    chatMode = mode;
    meBtn.classList.toggle('on', mode === 'me');
    themBtn.classList.toggle('on', mode === 'them');
    input.placeholder = mode === 'me' ? 'Что вы написали' : 'Что ответил(а) ' + c.name;
  };
  const meBtn = button('Я написал(а)', '', () => setMode('me'));
  const themBtn = button('Мне ответили', '', () => setMode('them'));
  seg.append(meBtn, themBtn);
  composer.appendChild(seg);

  const row = el('div', 'composer-row');
  input.id = 'msg';
  input.type = 'text';
  input.autocomplete = 'off';
  input.maxLength = LIMITS.message + 100;
  input.setAttribute('aria-label', 'Сообщение');
  const send = el('button', 'send');
  send.type = 'submit';
  send.setAttribute('aria-label', 'Добавить в журнал');
  send.appendChild(icon('send', 22));
  row.append(input, send);
  composer.appendChild(row);
  const err = el('div', 'error');
  composer.appendChild(err);
  setMode(chatMode);

  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) { err.textContent = 'Введите сообщение'; return; }
    if (text.length > LIMITS.message) { err.textContent = 'Слишком длинно: ' + text.length + ' из ' + LIMITS.message; return; }
    messages.push({ id: newId(), contactId: c.id, from: chatMode, text, at: new Date().toISOString() });
    saveMessages();
    if (chatMode === 'me') markMessaged(c.id);
    input.value = '';
    renderChat();
    $('msg').focus();
  });
  chat.appendChild(composer);
  root.appendChild(chat);

  const side = el('aside', 'chat-side');
  const variants = draftVariants(c);
  const idx = (draftIndex[c.id] || 0) % variants.length;
  const draft = el('div', 'draft');
  const title = el('div', 'draft-title');
  title.appendChild(icon('chat', 20));
  title.appendChild(el('span', '', 'Черновик сообщения'));
  draft.appendChild(title);
  draft.appendChild(el('div', 'draft-text', variants[idx]));
  draft.appendChild(el('div', 'draft-note', 'Черновик собран по шаблону из заметок и событий — проверьте и поправьте перед отправкой.'));
  const dActions = el('div', 'row-gap');
  dActions.appendChild(button('Скопировать', 'btn', async () => {
    toast((await copyText(variants[idx])) ? 'Скопировано' : 'Не удалось скопировать');
  }));
  dActions.appendChild(button('В поле ввода', 'btn btn-outline', () => {
    const field = $('msg');
    field.value = variants[idx];
    field.focus();
  }));
  if (variants.length > 1) {
    dActions.appendChild(button('Другой вариант', 'btn btn-outline', () => {
      draftIndex[c.id] = idx + 1;
      renderChat();
    }));
  }
  draft.appendChild(dActions);
  side.appendChild(draft);

  const note = el('div', 'note-card');
  note.appendChild(el('div', 'sec-title', 'Что нужно помнить'));
  note.appendChild(el('div', 'text-block', c.notes || 'Пока пусто'));
  const toCard = el('a', 'link-btn', 'Открыть карточку');
  toCard.href = '#contacts';
  note.appendChild(toCard);
  side.appendChild(note);
  root.appendChild(side);

  if (prevValue) input.value = prevValue;
  if (hadFocus) input.focus();
  list.scrollTop = list.scrollHeight;
  if (focusDraft) {
    focusDraft = false;
    draft.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
}

function atDays(offset, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function loadDemo() {
  const mk = (name, extra) => Object.assign({
    id: newId(), name, phone: '', birthday: '', rhythm: null, notes: '', important: false,
    lastContactAt: null, createdAt: new Date().toISOString(),
  }, extra);
  const alexey = mk('Алексей', {
    phone: '+7 707 123 45 67', important: true, rhythm: 14, lastContactAt: atDays(-1, 10, 5), birthday: '1999-' + dateStr(17).slice(5),
    notes: 'Готовится к собеседованию в четверг — потом узнать, как прошло. Недавно переехал в новую квартиру, ищет советы по мебели. Любит, когда пишут первым, сам стесняется.',
  });
  const marat = mk('Марат', { important: true, rhythm: 7, lastContactAt: atDays(-9, 12, 0), notes: 'Занимается скалолазанием, спросить про соревнования.' });
  const dana = mk('Дана', { phone: '+7 701 555 22 11', birthday: '2000-' + dateStr(0).slice(5), lastContactAt: atDays(-5, 18, 30) });
  const timur = mk('Тимур', { important: true, lastContactAt: atDays(-2, 9, 15) });
  const zhanna = mk('Жанна', { lastContactAt: atDays(-1, 20, 0) });
  const aigerim = mk('Айгерим');
  contacts = [alexey, marat, dana, timur, zhanna, aigerim];
  tasks = [
    { id: newId(), contactId: alexey.id, text: 'Скинуть конспекты', due: dateStr(1), done: false },
    { id: newId(), contactId: alexey.id, text: 'Вернуть зарядку', due: '', done: true },
  ];
  events = [{ id: newId(), contactId: alexey.id, title: 'экзамен', date: dateStr(2) }];
  messages = [
    { id: newId(), contactId: alexey.id, from: 'me', text: 'Привет! Ну как, готовишься к собеседованию?', at: atDays(-1, 10, 2) },
    { id: newId(), contactId: alexey.id, from: 'them', text: 'Да, в четверг. Немного волнуюсь.', at: atDays(-1, 10, 4) },
    { id: newId(), contactId: alexey.id, from: 'me', text: 'Всё получится! Потом расскажешь.', at: atDays(-1, 10, 5) },
  ];
  saveContacts(); saveTasks(); saveEvents(); saveMessages();
  selectContact(alexey.id);
  toast('Демо-данные загружены');
  renderApp();
}

showPage();
