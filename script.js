(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const mobileMenu = window.matchMedia("(max-width: 700px)");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const typingPrefix = document.querySelector(".typing-prefix");
  const typingEmphasis = document.querySelector(".typing-emphasis");
  const resumeLink = document.querySelector(".button-resume");
  const resumeDialog = document.getElementById("resume-dialog");
  const resumeClose = document.querySelector(".resume-close");
  const messageToggle = document.querySelector(".message-toggle");
  const messageCard = document.getElementById("message-card");
  const messageClose = document.querySelector(".message-close");
  const messageForm = document.querySelector(".message-form");

  if (typingPrefix && typingEmphasis) {
    const prefix = "I bring care to the details and curiosity to every ";
    const emphasis = "idea I build.";
    const sentence = prefix + emphasis;
    let characterIndex = 0;
    const typeNextCharacter = () => {
      const visibleText = sentence.slice(0, characterIndex);
      typingPrefix.textContent = visibleText.slice(0, prefix.length);
      typingEmphasis.textContent = visibleText.slice(prefix.length);
      const showCaret = characterIndex > 0 && characterIndex < sentence.length;
      typingPrefix.classList.toggle("is-typing", showCaret && characterIndex <= prefix.length);
      typingEmphasis.classList.toggle("is-typing", showCaret && characterIndex > prefix.length);
      if (characterIndex < sentence.length) {
        characterIndex += 1;
        window.setTimeout(typeNextCharacter, characterIndex === 1 ? 180 : 52);
      } else {
        typingPrefix.classList.remove("is-typing");
        typingEmphasis.classList.remove("is-typing");
      }
    };
    typeNextCharacter();
  }

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

  resumeLink.addEventListener("click", (event) => {
    if (typeof resumeDialog.showModal === "function") {
      event.preventDefault();
      resumeDialog.showModal();
      resumeClose.focus();
    }
  });
  resumeClose.addEventListener("click", () => resumeDialog.close());
  resumeDialog.addEventListener("click", (event) => {
    if (event.target === resumeDialog) resumeDialog.close();
  });

  const setMessageOpen = (open) => {
    messageCard.hidden = !open;
    messageToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      messageCard.querySelector("input").focus();
    } else {
      messageToggle.focus();
    }
  };

  messageToggle.addEventListener("click", () => {
    setMessageOpen(messageCard.hidden);
  });
  messageClose.addEventListener("click", () => setMessageOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !messageCard.hidden) setMessageOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!messageCard.hidden && !event.target.closest(".floating-contact")) {
      messageCard.hidden = true;
      messageToggle.setAttribute("aria-expanded", "false");
    }
  });
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(messageForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const subject = name ? `Portfolio message from ${name}` : "Message from your portfolio";
    const body = [
      message,
      "",
      name ? `From: ${name}` : "",
      email ? `Reply to: ${email}` : "",
    ].filter(Boolean).join("\n");
    window.location.href = `mailto:antheayaroda@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

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
      track.style.setProperty("--marquee-duration", `${Math.max(20, track.scrollWidth / 2 / 50)}s`);
    };

    setMarqueePace();
    window.addEventListener("resize", setMarqueePace);
    motionPreference.addEventListener("change", setMarqueePace);
    track.querySelectorAll("img").forEach((image) => {
      image.addEventListener("load", setMarqueePace, { once: true });
    });
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
