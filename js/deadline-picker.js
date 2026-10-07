export function makeDeadline(dateText, hourText, minuteText, period) {
  if (!dateText || !hourText || minuteText === "") return null;
  if (period !== "AM" && period !== "PM") return null;
  const [year, month, day] = dateText.split("-").map(Number);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || hour < 1 || hour > 12) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  const hours = hour % 12 + (period === "PM" ? 12 : 0);
  const date = new Date(year, month - 1, day, hours, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (date.getHours() !== hours || date.getMinutes() !== minute) return null;
  return date;
}

export function setupDeadlinePicker() {
  const days = document.getElementById("calendar-days");
  const heading = document.getElementById("calendar-month");
  const previous = document.getElementById("previous-month");
  const next = document.getElementById("next-month");
  const hour = document.getElementById("deadline-hour");
  const minute = document.getElementById("deadline-minute");
  const period = document.getElementById("deadline-period");
  const summary = document.getElementById("deadline-summary");
  const hourHand = document.getElementById("clock-hour-hand");
  const minuteHand = document.getElementById("clock-minute-hand");
  let displayedMonth = new Date();
  displayedMonth.setDate(1);
  let selectedDate = "";

  function getDeadline() {
    return makeDeadline(selectedDate, hour.value, minute.value, period.value);
  }

  function updateSummary() {
    const deadline = getDeadline();
    if (deadline) {
      const dateText = deadline.toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "short",
      });
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      summary.textContent = `Due ${dateText} (${timeZone}).`;
      if (deadline <= new Date()) summary.textContent += " Choose a future deadline.";
    } else {
      summary.textContent = "Choose a date, hour and minute for submission.";
    }
    const hourAngle = (Number(hour.value) % 12) * 30 + Number(minute.value) / 2;
    hourHand.style.transform = `translateX(-50%) rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${Number(minute.value) * 6}deg)`;
  }

  function renderCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    heading.textContent = displayedMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    previous.disabled = year === today.getFullYear() && month === today.getMonth();
    next.disabled = false;
    days.replaceChildren();
    for (let blank = 0; blank < new Date(year, month, 1).getDay(); blank += 1) {
      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      days.append(spacer);
    }
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      const dateValue = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const label = document.createElement("label");
      label.className = "calendar-day";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "dueDate";
      input.value = dateValue;
      input.checked = selectedDate === dateValue;
      input.disabled = date < today;
      input.setAttribute(
        "aria-label",
        date.toLocaleDateString(undefined, { dateStyle: "full" }),
      );
      if (date.getTime() === today.getTime()) input.setAttribute("aria-current", "date");
      input.addEventListener("change", () => {
        selectedDate = input.value;
        updateSummary();
      });
      const number = document.createElement("span");
      number.textContent = day;
      label.append(input, number);
      days.append(label);
    }
  }

  previous.addEventListener("click", () => {
    displayedMonth.setMonth(displayedMonth.getMonth() - 1);
    renderCalendar();
  });
  next.addEventListener("click", () => {
    displayedMonth.setMonth(displayedMonth.getMonth() + 1);
    renderCalendar();
  });
  [hour, minute, period].forEach((input) =>
    input.addEventListener("change", updateSummary),
  );

  function reset() {
    selectedDate = "";
    displayedMonth = new Date();
    displayedMonth.setDate(1);
    hour.value = "";
    minute.value = "";
    period.value = "AM";
    renderCalendar();
    updateSummary();
  }
  reset();
  return { getDeadline, reset };
}
