let releases = [];

async function fetchCMSData() {
  try {
    // Pobieramy plik JSON wygenerowany przez CMS
    const response = await fetch('../data/releases.json');
    const data = await response.json();
    
    // Mapujemy dane z CMS na format, który rozumie Twoja wyszukiwarka
    releases = data.map(track => ({
      title: track.title,
      artists: "Xarowo", // Domyślny artysta
      date: `${track.year}-01-01`, // Tworzymy pełną datę z samego roku
      status: "active",
      cover: track.cover_image,
      spotify: track.spotify_link
    }));

    // Uruchamiamy Twoją oryginalną funkcję renderującą (zabezpieczenie przed błędem, jeśli nie ma jej na podstronie)
    if (typeof renderCatalog === 'function') {
      renderCatalog(releases);
    }
  } catch (error) {
    console.error("Błąd ładowania danych CMS do wyszukiwarki:", error);
  }
}

// Odpalamy pobieranie danych na starcie
document.addEventListener("DOMContentLoaded", fetchCMSData);

const root = document.documentElement;
const storedTheme = localStorage.getItem("xarowo_theme");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function setTheme(mode, persist = true) {
  root.classList.toggle("dark", mode === "dark");
  document.querySelectorAll("[data-theme-icon]").forEach((node) => {
    node.textContent = mode === "dark" ? "D" : "L";
  });
  if (persist) localStorage.setItem("xarowo_theme", mode);
}

setTheme(storedTheme || (systemDark ? "dark" : "light"), false);

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(root.classList.contains("dark") ? "light" : "dark");
  });
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.dataset.active = link.dataset.page === document.body.dataset.page ? "true" : "false";
});

document.querySelectorAll(".ticker-track").forEach((track) => {
  const original = track.innerHTML;
  track.innerHTML = Array.from({ length: 8 }, () => original).join("");
});

const catalogList = document.querySelector("#catalog-list");
const yearFilter = document.querySelector("#year-filter");
const statusFilter = document.querySelector("#status-filter");
const searchInput = document.querySelector("#search-input");
const dateFormatter = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" });

if (catalogList && yearFilter && statusFilter && searchInput) {
  [...new Set(releases.map((release) => release.date.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a))
    .forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });

  function renderCatalog() {
    const year = yearFilter.value;
    const status = statusFilter.value;
    const query = searchInput.value.trim().toLowerCase();
    const rows = releases.filter((release) => {
      const haystack = `${release.title} ${release.artists}`.toLowerCase();
      return (year === "all" || release.date.startsWith(year)) && (status === "all" || release.status === status) && haystack.includes(query);
    });

    catalogList.innerHTML = rows
      .map((release, index) => {
        const paused = release.status === "paused";
        return `
          <article class="catalog-row grid gap-4 border-b border-[color:var(--hairline)] px-0 py-6 last:border-b-0 md:grid-cols-[90px_1fr_auto] md:items-center">
            <span class="text-sm font-black text-electric">${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3 class="font-display text-2xl font-black uppercase leading-tight text-[color:var(--fg)]">${release.title}</h3>
              <p class="mt-1 text-sm font-bold text-[color:var(--soft-fg)]">${release.artists} / ${dateFormatter.format(new Date(`${release.date}T12:00:00`))}</p>
              </div>
            <span class="w-fit border ${paused ? "border-electric text-electric" : "border-[color:var(--hairline)] text-[color:var(--soft-fg)]"} px-3 py-2 text-xs font-black uppercase">
              ${paused ? "Paused / Exclusive Work" : "Released"}
            </span>
          </article>
        `;
      })
      .join("");

    if (!rows.length) {
      catalogList.innerHTML = '<p class="py-10 text-lg font-black uppercase text-electric">No matching releases.</p>';
    }
  }

  [yearFilter, statusFilter, searchInput].forEach((control) => {
    control.addEventListener("input", renderCatalog);
  });
  renderCatalog();
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
  revealObserver.observe(element);
});

const canvas = document.querySelector("#grain-canvas");
const ctx = canvas?.getContext("2d", { alpha: true });
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  if (!canvas) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}

function drawGrain() {
  if (!canvas || !ctx) return;
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const isDark = root.classList.contains("dark");
  for (let i = 0; i < data.length; i += 4) {
    const value = isDark ? 210 + Math.random() * 45 : Math.random() * 70;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = isDark ? Math.random() * 18 : Math.random() * 10;
  }
  ctx.putImageData(imageData, 0, 0);
  if (!prefersReduced) window.setTimeout(() => requestAnimationFrame(drawGrain), 86);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawGrain();

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const subject = encodeURIComponent(`Xarowo inquiry: ${data.get("subject") || "Collaboration"}`);
    const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`);
    window.location.href = `mailto:xarowobusiness@gmail.com?subject=${subject}&body=${body}`;
  });
}

const cookieBanner = document.querySelector("#cookie-banner");
const acceptCookies = document.querySelector("#accept-cookies");
const declineCookies = document.querySelector("#decline-cookies");

function initTrackingScripts() {
  console.info("Xarowo optional analytics placeholder initialized.");
}

function hideCookieBanner() {
  if (!cookieBanner) return;
  cookieBanner.classList.add("cookie-hidden");
  window.setTimeout(() => {
    cookieBanner.style.display = "none";
  }, 520);
}

function showCookieBanner() {
  if (!cookieBanner) return;
  window.setTimeout(() => {
    cookieBanner.style.display = "block";
    requestAnimationFrame(() => cookieBanner.classList.remove("cookie-hidden"));
  }, 1500);
}

const consent = localStorage.getItem("xarowo_privacy_consent");
if (consent === "accepted") {
  if (cookieBanner) cookieBanner.style.display = "none";
  initTrackingScripts();
} else if (consent === "declined") {
  if (cookieBanner) cookieBanner.style.display = "none";
} else {
  showCookieBanner();
}

acceptCookies?.addEventListener("click", () => {
  localStorage.setItem("xarowo_privacy_consent", "accepted");
  initTrackingScripts();
  hideCookieBanner();
});

declineCookies?.addEventListener("click", () => {
  localStorage.setItem("xarowo_privacy_consent", "declined");
  hideCookieBanner();
});
