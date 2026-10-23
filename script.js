/* 3D Развал-Схождение — интерактивы без сторонних библиотек */
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");

  // Компактная шапка после начала прокрутки.
  const updateHeader = () => header?.classList.toggle("scrolled", scrollY > 24);
  updateHeader();
  addEventListener("scroll", updateHeader, { passive: true });

  // Мобильное меню.
  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav?.classList.toggle("open", open);
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Открыть меню");
    nav.classList.remove("open");
  }));

  // Появление элементов при прокрутке.
  const revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(item => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -45px" });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  // Доступный аккордеон FAQ: открыт только один ответ.
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const button = item.querySelector("button");
    button?.addEventListener("click", () => {
      const willOpen = !item.classList.contains("open");
      faqItems.forEach(other => {
        other.classList.remove("open");
        other.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Интерактивная схема колёс.
  const wheelTitle = document.querySelector("#wheel-title");
  document.querySelectorAll(".wheel").forEach(wheel => {
    const selectWheel = () => {
      document.querySelectorAll(".wheel").forEach(item => item.classList.remove("active"));
      wheel.classList.add("active");
      if (wheelTitle) wheelTitle.textContent = wheel.dataset.wheel;
    };
    wheel.addEventListener("click", selectWheel);
    wheel.addEventListener("mouseenter", selectWheel);
    wheel.addEventListener("focus", selectWheel);
  });
  document.querySelectorAll(".parameter button").forEach(button => {
    button.addEventListener("click", () => {
      const current = button.closest(".parameter");
      document.querySelectorAll(".parameter").forEach(param => param.classList.remove("active"));
      current?.classList.add("active");
    });
  });

  // Политика конфиденциальности в нативном dialog.
  const modal = document.querySelector("#privacy-modal");
  document.querySelector("[data-modal-open]")?.addEventListener("click", () => modal?.showModal());
  modal?.querySelector(".modal-close")?.addEventListener("click", () => modal.close());
  modal?.addEventListener("click", event => {
    if (event.target === modal) modal.close();
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
});
