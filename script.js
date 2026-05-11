"use strict";

const SECRET_CODE = "Linda1976";
const RELATIONSHIP_START = new Date(2026, 0, 19, 20, 0, 0);
const BIRTHDAY_MONTH_INDEX = 9;
const BIRTHDAY_DAY = 2;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const numberFormatter = new Intl.NumberFormat("nb-NO");
const dateTimeFormatter = new Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
const shortDateTimeFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
});

const milestoneDefinitions = [
  { label: "1 uke", days: 7 },
  { label: "1 m\u00E5ned", months: 1 },
  { label: "3 m\u00E5neder", months: 3 },
  { label: "6 m\u00E5neder", months: 6 },
  { label: "9 m\u00E5neder", months: 9 },
  { label: "1 \u00E5r", months: 12 },
  { label: "18 m\u00E5neder", months: 18 },
  { label: "2 \u00E5r", months: 24 },
  { label: "3 \u00E5r", months: 36 },
  { label: "4 \u00E5r", months: 48 },
  { label: "5 \u00E5r", months: 60 }
];

const milestones = milestoneDefinitions.map((milestone) => ({
  label: milestone.label,
  date: typeof milestone.days === "number"
    ? addDays(RELATIONSHIP_START, milestone.days)
    : addMonths(RELATIONSHIP_START, milestone.months)
}));

const elements = {
  relationshipStartText: document.getElementById("relationship-start-text"),
  relationshipStatus: document.getElementById("relationship-status"),
  relationshipDays: document.getElementById("relationship-days"),
  relationshipHours: document.getElementById("relationship-hours"),
  relationshipMinutes: document.getElementById("relationship-minutes"),
  relationshipSeconds: document.getElementById("relationship-seconds"),
  secretButton: document.getElementById("secret-button"),
  modal: document.getElementById("secret-modal"),
  modalClose: document.getElementById("modal-close"),
  unlockView: document.getElementById("unlock-view"),
  secretView: document.getElementById("secret-view"),
  secretForm: document.getElementById("secret-form"),
  secretInput: document.getElementById("secret-code"),
  secretError: document.getElementById("secret-error"),
  birthdayDate: document.getElementById("birthday-date"),
  birthdayDays: document.getElementById("birthday-days"),
  birthdayHours: document.getElementById("birthday-hours"),
  birthdayMinutes: document.getElementById("birthday-minutes"),
  birthdaySeconds: document.getElementById("birthday-seconds"),
  birthdayNote: document.getElementById("birthday-note"),
  anniversaryName: document.getElementById("anniversary-name"),
  anniversaryDate: document.getElementById("anniversary-date"),
  anniversaryRemaining: document.getElementById("anniversary-remaining"),
  flowerName: document.getElementById("flower-name"),
  flowerDate: document.getElementById("flower-date"),
  flowerRemaining: document.getElementById("flower-remaining"),
  milestoneList: document.getElementById("milestone-list")
};

elements.relationshipStartText.textContent = shortDateTimeFormatter.format(RELATIONSHIP_START);

function addDays(date, days) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}

function addMonths(date, months) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function splitDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / SECOND_MS));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatCount(value) {
  return numberFormatter.format(value);
}

function pluralize(value, singular, plural) {
  return value === 1 ? singular : plural;
}

function formatRemaining(durationMs) {
  const duration = splitDuration(durationMs);
  const parts = [];

  if (duration.days > 0) {
    parts.push(duration.days + " " + pluralize(duration.days, "dag", "dager"));
  }

  if (duration.hours > 0 || parts.length > 0) {
    parts.push(duration.hours + " " + pluralize(duration.hours, "time", "timer"));
  }

  if (duration.minutes > 0 || parts.length > 0) {
    parts.push(duration.minutes + " " + pluralize(duration.minutes, "minutt", "minutter"));
  }

  if (parts.length === 0) {
    parts.push(duration.seconds + " " + pluralize(duration.seconds, "sekund", "sekunder"));
  }

  return parts.slice(0, 3).join(", ");
}

function daysBetween(fromDate, toDate) {
  const fromUtc = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const toUtc = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((toUtc - fromUtc) / DAY_MS);
}

function setCounterValues(targets, duration) {
  targets.days.textContent = formatCount(duration.days);
  targets.hours.textContent = pad(duration.hours);
  targets.minutes.textContent = pad(duration.minutes);
  targets.seconds.textContent = pad(duration.seconds);
}

function getBirthdayInfo(now) {
  const today = startOfDay(now);
  const birthdayThisYear = new Date(today.getFullYear(), BIRTHDAY_MONTH_INDEX, BIRTHDAY_DAY);

  if (today.getTime() === birthdayThisYear.getTime()) {
    return {
      date: birthdayThisYear,
      remainingMs: 0,
      isToday: true
    };
  }

  if (now.getTime() < birthdayThisYear.getTime()) {
    return {
      date: birthdayThisYear,
      remainingMs: birthdayThisYear.getTime() - now.getTime(),
      isToday: false
    };
  }

  const nextBirthday = new Date(today.getFullYear() + 1, BIRTHDAY_MONTH_INDEX, BIRTHDAY_DAY);
  return {
    date: nextBirthday,
    remainingMs: nextBirthday.getTime() - now.getTime(),
    isToday: false
  };
}

function getNextMilestone(now) {
  return milestones.find((milestone) => milestone.date.getTime() > now.getTime()) || null;
}

function getMonthlyFlowerReminder(today) {
  let candidate = new Date(today.getFullYear(), today.getMonth(), 19);

  if (today.getTime() > candidate.getTime()) {
    candidate = new Date(today.getFullYear(), today.getMonth() + 1, 19);
  }

  return candidate;
}

function getNextBirthdayReminder(today, offsetDays) {
  let candidate = new Date(today.getFullYear(), BIRTHDAY_MONTH_INDEX, BIRTHDAY_DAY + offsetDays);

  if (today.getTime() > candidate.getTime()) {
    candidate = new Date(today.getFullYear() + 1, BIRTHDAY_MONTH_INDEX, BIRTHDAY_DAY + offsetDays);
  }

  return candidate;
}

function getNextAnnualAnniversary(today) {
  let year = Math.max(today.getFullYear(), RELATIONSHIP_START.getFullYear() + 1);
  let candidate = new Date(year, RELATIONSHIP_START.getMonth(), RELATIONSHIP_START.getDate());

  if (today.getTime() > candidate.getTime()) {
    candidate = new Date(year + 1, RELATIONSHIP_START.getMonth(), RELATIONSHIP_START.getDate());
  }

  return candidate;
}

function getNextAnniversaryReminder(today, daysBefore) {
  let anniversary = getNextAnnualAnniversary(today);
  let reminder = new Date(
    anniversary.getFullYear(),
    anniversary.getMonth(),
    anniversary.getDate() - daysBefore
  );

  if (today.getTime() > reminder.getTime()) {
    anniversary = new Date(
      anniversary.getFullYear() + 1,
      anniversary.getMonth(),
      anniversary.getDate()
    );
    reminder = new Date(
      anniversary.getFullYear(),
      anniversary.getMonth(),
      anniversary.getDate() - daysBefore
    );
  }

  return reminder;
}

function getNextFlowerReminder(now) {
  const today = startOfDay(now);
  const candidates = [
    {
      label: "Hver m\u00E5ned den 19.",
      date: getMonthlyFlowerReminder(today),
      priority: 4
    },
    {
      label: "1 uke f\u00F8r bursdagen hennes",
      date: getNextBirthdayReminder(today, -7),
      priority: 1
    },
    {
      label: "P\u00E5 bursdagen hennes",
      date: getNextBirthdayReminder(today, 0),
      priority: 0
    },
    {
      label: "1 uke f\u00F8r \u00E5rsdag",
      date: getNextAnniversaryReminder(today, 7),
      priority: 2
    },
    {
      label: "P\u00E5 \u00E5rsdag",
      date: getNextAnniversaryReminder(today, 0),
      priority: 1
    }
  ];

  candidates.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }

    return a.priority - b.priority;
  });

  return candidates[0];
}

function renderMilestones(now, nextMilestone) {
  elements.milestoneList.innerHTML = "";

  milestones.forEach((milestone) => {
    const isPast = now.getTime() >= milestone.date.getTime();
    const isNext = Boolean(nextMilestone) && nextMilestone.label === milestone.label;
    const item = document.createElement("li");

    item.className = "timeline-item" + (isNext ? " is-next" : "") + (isPast ? " is-past" : "");
    item.innerHTML =
      '<div class="timeline-item-copy">' +
      "<strong>" + milestone.label + "</strong>" +
      "<span>" + dateTimeFormatter.format(milestone.date) + "</span>" +
      "</div>" +
      '<span class="timeline-badge">' + (isNext ? "Neste" : isPast ? "Feiret" : "Senere") + "</span>";

    elements.milestoneList.appendChild(item);
  });
}

function updateRelationship(now) {
  const elapsed = now.getTime() - RELATIONSHIP_START.getTime();

  if (elapsed < 0) {
    setCounterValues(
      {
        days: elements.relationshipDays,
        hours: elements.relationshipHours,
        minutes: elements.relationshipMinutes,
        seconds: elements.relationshipSeconds
      },
      splitDuration(0)
    );
    elements.relationshipStatus.textContent = "Forholdet starter om " + formatRemaining(-elapsed) + ".";
    return;
  }

  setCounterValues(
    {
      days: elements.relationshipDays,
      hours: elements.relationshipHours,
      minutes: elements.relationshipMinutes,
      seconds: elements.relationshipSeconds
    },
    splitDuration(elapsed)
  );
  elements.relationshipStatus.textContent = "Sammen siden " + dateTimeFormatter.format(RELATIONSHIP_START) + ".";
}

function updateBirthday(now) {
  const birthdayInfo = getBirthdayInfo(now);

  setCounterValues(
    {
      days: elements.birthdayDays,
      hours: elements.birthdayHours,
      minutes: elements.birthdayMinutes,
      seconds: elements.birthdaySeconds
    },
    splitDuration(birthdayInfo.remainingMs)
  );

  elements.birthdayDate.textContent = dateFormatter.format(birthdayInfo.date);
  elements.birthdayNote.textContent = birthdayInfo.isToday
    ? "Det er bursdagen hennes i dag."
    : formatRemaining(birthdayInfo.remainingMs) + " igjen til neste bursdag.";
}

function updateAnniversary(now) {
  const nextMilestone = getNextMilestone(now);

  if (!nextMilestone) {
    elements.anniversaryName.textContent = "Alle milep\u00E6ler er feiret";
    elements.anniversaryDate.textContent = "De planlagte jubileumene til og med 5 \u00E5r er passert.";
    elements.anniversaryRemaining.textContent = "Legg til flere milep\u00E6ler i koden hvis du vil.";
    renderMilestones(now, null);
    return;
  }

  elements.anniversaryName.textContent = nextMilestone.label;
  elements.anniversaryDate.textContent = dateTimeFormatter.format(nextMilestone.date);
  elements.anniversaryRemaining.textContent =
    formatRemaining(nextMilestone.date.getTime() - now.getTime()) + " igjen.";

  renderMilestones(now, nextMilestone);
}

function updateFlowerReminder(now) {
  const today = startOfDay(now);
  const nextFlower = getNextFlowerReminder(now);
  const daysRemaining = daysBetween(today, nextFlower.date);

  elements.flowerName.textContent = nextFlower.label;
  elements.flowerDate.textContent = dateFormatter.format(nextFlower.date);
  elements.flowerRemaining.textContent = daysRemaining === 0
    ? "Blomster passer perfekt i dag."
    : daysRemaining + " " + pluralize(daysRemaining, "dag", "dager") + " igjen.";
}

function resetSecretState() {
  elements.secretForm.reset();
  elements.secretError.hidden = true;
  elements.unlockView.hidden = false;
  elements.secretView.hidden = true;
}

function openModal() {
  resetSecretState();
  elements.modal.classList.add("is-open");
  elements.modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  window.setTimeout(() => {
    elements.secretInput.focus();
  }, 20);
}

function closeModal() {
  elements.modal.classList.remove("is-open");
  elements.modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
  resetSecretState();
}

function unlockSecret(inputCode) {
  if (inputCode.trim() !== SECRET_CODE) {
    elements.secretError.hidden = false;
    elements.secretInput.select();
    return;
  }

  elements.secretError.hidden = true;
  elements.unlockView.hidden = true;
  elements.secretView.hidden = false;
}

function updatePage() {
  const now = new Date();
  updateRelationship(now);
  updateBirthday(now);
  updateAnniversary(now);
  updateFlowerReminder(now);
}

elements.secretButton.addEventListener("click", openModal);
elements.modalClose.addEventListener("click", closeModal);
elements.secretForm.addEventListener("submit", (event) => {
  event.preventDefault();
  unlockSecret(elements.secretInput.value);
});
elements.modal.addEventListener("click", (event) => {
  if (event.target === elements.modal) {
    closeModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.modal.classList.contains("is-open")) {
    closeModal();
  }
});

updatePage();
window.setInterval(updatePage, 1000);
