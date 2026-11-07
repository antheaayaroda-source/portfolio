(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const mobileMenu = window.matchMedia("(max-width: 700px)");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  const updateThemeButton = () => {
    const darkMode = root.dataset.theme === "dark";
    const label = darkMode ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.title = label;
    themeColor.content = darkMode ? "#202a25" : "#faf7f0";
  };

  updateThemeButton();
  themeToggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("portfolio-theme", root.dataset.theme);
    updateThemeButton();
  });

  const setMenuOpen = (open) => {
    if (!mobileMenu.matches) {
      navLinks.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      return;
    }
    navLinks.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  mobileMenu.addEventListener("change", () => setMenuOpen(false));

  const track = document.querySelector(".certifications-track");
  if (track) {
    const originalCards = Array.from(track.children);
    const originalGroup = document.createElement("div");
    const duplicateGroup = document.createElement("div");
    originalGroup.className = "certification-group";
    duplicateGroup.className = "certification-group";
    originalCards.forEach((card) => originalGroup.append(card));
    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button, [tabindex]").forEach((control) => {
        control.setAttribute("tabindex", "-1");
      });
      duplicateGroup.append(clone);
    });
    track.append(originalGroup, duplicateGroup);

    const setMarqueePace = () => {
      track.style.setProperty("--marquee-duration", `${Math.max(20, track.scrollWidth / 2 / 35)}s`);
    };

    setMarqueePace();
    window.addEventListener("resize", setMarqueePace);
    motionPreference.addEventListener("change", setMarqueePace);
  }

  const year = document.getElementById("current-year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const sections = document.querySelectorAll("main section[id]");
  const pageLinks = document.querySelectorAll(".nav-links a");
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        pageLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => navObserver.observe(section));
  }
})();
