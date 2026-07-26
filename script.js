const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

async function loadLessons() {
  const list = document.getElementById("lessons-list");
  const empty = document.getElementById("empty-state");

  let data;
  try {
    const res = await fetch("content/lessons.json", { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    data = { lessons: [] };
  }

  const lessons = (data.lessons || []).slice().sort((a, b) => {
    // Sort by date within each surah (newest last = chronological order)
    return new Date(a.date || 0) - new Date(b.date || 0);
  });

  if (lessons.length === 0) {
    empty.hidden = false;
    return;
  }

  // Group by surah, preserving first-appearance order of surahs
  const surahMap = new Map();
  lessons.forEach(lesson => {
    const key = lesson.surah || "Без сури";
    if (!surahMap.has(key)) surahMap.set(key, []);
    surahMap.get(key).push(lesson);
  });

  surahMap.forEach((surahLessons, surahName) => {
    list.appendChild(renderSurahGroup(surahName, surahLessons));
  });
}

function renderSurahGroup(surahName, lessons) {
  const section = document.createElement("section");
  section.className = "surah-group";

  const header = document.createElement("div");
  header.className = "surah-header";
  header.innerHTML = `
    <span class="surah-header__icon" aria-hidden="true">📖</span>
    <h2 class="surah-header__title">${escapeHtml(surahName)}</h2>
    <span class="surah-header__count">${lessons.length} ${lessonWord(lessons.length)}</span>
  `;
  section.appendChild(header);

  const lessonList = document.createElement("div");
  lessonList.className = "lessons__list";
  lessons.forEach((lesson, i) => lessonList.appendChild(renderLesson(lesson, i)));
  section.appendChild(lessonList);

  return section;
}

function lessonWord(n) {
  if (n === 1) return "урок";
  if (n >= 2 && n <= 4) return "уроки";
  return "уроків";
}

function renderLesson(lesson, index) {
  const card = document.createElement("article");
  card.className = "lesson";
  card.dataset.open = "false";

  const dateLabel = lesson.date
    ? new Date(lesson.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  card.innerHTML = `
    <button class="lesson__head" type="button" aria-expanded="false">
      <span class="lesson__title-wrap">
        <p class="lesson__title">${escapeHtml(lesson.title || "Урок")}</p>
        <p class="lesson__meta">${dateLabel}</p>
      </span>
      <span class="lesson__chevron">▾</span>
    </button>
    <div class="lesson__body">
      ${lesson.description ? `<p class="lesson__description">${escapeHtml(lesson.description)}</p>` : ""}
      ${lesson.audio ? renderPlayer(lesson.audio) : ""}
      ${lesson.pdf ? renderTafsir(lesson.pdf) : ""}
    </div>
  `;

  const head = card.querySelector(".lesson__head");
  head.addEventListener("click", () => {
    const isOpen = card.dataset.open === "true";
    card.dataset.open = isOpen ? "false" : "true";
    head.setAttribute("aria-expanded", String(!isOpen));
  });

  const audioEl = card.querySelector("audio");
  if (audioEl) attachSpeedControls(card, audioEl);

  return card;
}

function renderPlayer(src) {
  const id = "player-" + Math.random().toString(36).slice(2, 8);
  return `
    <div class="player">
      <audio id="${id}" controls preload="none" src="${src}"></audio>
      <div class="player__controls" data-audio-target="${id}">
        <button class="rewind-btn" type="button" data-seek="-10">« 10 с</button>
        ${SPEEDS.map(s => `<button class="speed-btn" type="button" data-speed="${s}" data-active="${s === 1}">${s}x</button>`).join("")}
      </div>
    </div>
  `;
}

function renderTafsir(pdfUrl) {
  return `
    <div class="tafsir">
      <p class="tafsir__label">Тафсір</p>
      <iframe src="${pdfUrl}" title="Тафсір, PDF" loading="lazy"></iframe>
      <a class="tafsir__download" href="${pdfUrl}" download>Завантажити PDF</a>
    </div>
  `;
}

function attachSpeedControls(card, audioEl) {
  const controls = card.querySelector(".player__controls");
  controls.querySelectorAll(".speed-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const speed = parseFloat(btn.dataset.speed);
      audioEl.playbackRate = speed;
      controls.querySelectorAll(".speed-btn").forEach(b => b.dataset.active = "false");
      btn.dataset.active = "true";
    });
  });

  const rewindBtn = controls.querySelector(".rewind-btn");
  rewindBtn.addEventListener("click", () => {
    audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadLessons();
