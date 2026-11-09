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

  const projectLightbox = document.getElementById("project-lightbox");
  const projectLightboxImage = projectLightbox.querySelector(".project-lightbox-image");
  const projectLightboxClose = projectLightbox.querySelector(".project-lightbox-close");
  let lightboxReturnScrollY = 0;
  let suppressGalleryClick = false;
  document.addEventListener("click", (event) => {
    const link = event.target.closest(".project-image-link, .certificate-image-link");
    if (!link || typeof projectLightbox.showModal !== "function") return;
    event.preventDefault();
    if (suppressGalleryClick) {
      suppressGalleryClick = false;
      return;
    }
    lightboxReturnScrollY = window.scrollY;
    projectLightboxImage.src = link.href;
    projectLightboxImage.alt = link.querySelector("img").alt;
    projectLightbox.showModal();
    projectLightboxClose.focus({ preventScroll: true });
  });
  projectLightboxClose.addEventListener("click", () => projectLightbox.close());
  projectLightbox.addEventListener("click", (event) => {
    if (event.target === projectLightbox) projectLightbox.close();
  });
  projectLightbox.addEventListener("close", () => {
    window.requestAnimationFrame(() => {
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, lightboxReturnScrollY);
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    });
  });

  const projectGalleryFrame = document.querySelector(".project-gallery-frame");
  const projectGallery = projectGalleryFrame?.querySelector(".project-image-gallery");
  if (projectGallery) {
    const slides = Array.from(projectGallery.children);
    if (slides.length > 1) {
      const createClone = (slide) => {
        const clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a, button, [tabindex]").forEach((control) => {
          control.setAttribute("tabindex", "-1");
        });
        return clone;
      };

      projectGallery.prepend(createClone(slides[slides.length - 1]));
      projectGallery.append(createClone(slides[0]));

      let currentSlide = 1;
      let pointerStartX = 0;
      let pointerDeltaX = 0;
      let activePointerId = null;
      let loopResetTimer;

      const setPosition = () => {
        projectGallery.style.transform = `translate3d(${-currentSlide * projectGalleryFrame.clientWidth}px, 0, 0)`;
      };

      const moveToSlide = (slide, animate = true) => {
        currentSlide = slide;
        projectGallery.style.transition = animate ? "" : "none";
        setPosition();
        if (!animate) {
          window.clearTimeout(loopResetTimer);
          projectGallery.getBoundingClientRect();
          projectGallery.style.transition = "";
        } else if (slide === 0 || slide === slides.length + 1) {
          const duration = getComputedStyle(projectGallery).transitionDuration.split(",")[0].trim();
          const durationMs = duration.endsWith("ms") ? parseFloat(duration) : parseFloat(duration) * 1000;
          loopResetTimer = window.setTimeout(resetLoopClone, durationMs + 50);
        }
      };

      const resetLoopClone = () => {
        window.clearTimeout(loopResetTimer);
        if (currentSlide === 0) moveToSlide(slides.length, false);
        if (currentSlide === slides.length + 1) moveToSlide(1, false);
      };

      projectGallery.addEventListener("transitionend", (event) => {
        if (event.target === projectGallery && event.propertyName === "transform") resetLoopClone();
      });

      projectGalleryFrame.querySelector(".project-gallery-next")?.addEventListener("click", () => {
        moveToSlide(currentSlide + 1);
      });

      projectGalleryFrame.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".project-gallery-next")) return;
        activePointerId = event.pointerId;
        pointerStartX = event.clientX;
        pointerDeltaX = 0;
        projectGallery.style.transition = "none";
        projectGalleryFrame.setPointerCapture(event.pointerId);
      });

      projectGalleryFrame.addEventListener("pointermove", (event) => {
        if (event.pointerId !== activePointerId) return;
        pointerDeltaX = event.clientX - pointerStartX;
        projectGallery.style.transform = `translate3d(${-currentSlide * projectGalleryFrame.clientWidth + pointerDeltaX}px, 0, 0)`;
      });

      const finishSwipe = (event) => {
        if (event.pointerId !== activePointerId) return;
        activePointerId = null;
        const swipeThreshold = Math.max(18, projectGalleryFrame.clientWidth * 0.06);
        if (Math.abs(pointerDeltaX) > swipeThreshold) {
          suppressGalleryClick = true;
          window.setTimeout(() => { suppressGalleryClick = false; }, 350);
          moveToSlide(currentSlide + (pointerDeltaX < 0 ? 1 : -1));
        } else {
          moveToSlide(currentSlide);
        }
      };

      projectGalleryFrame.addEventListener("pointerup", finishSwipe);
      projectGalleryFrame.addEventListener("pointercancel", finishSwipe);
      window.addEventListener("resize", () => moveToSlide(currentSlide, false));
      setPosition();
    }
  }

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
    originalGroup.className = "certification-group";
    originalCards.forEach((card) => originalGroup.append(card));
    track.append(originalGroup);

    const setMarqueePace = () => {
      const groupWidth = originalGroup.getBoundingClientRect().width;
      const marqueeWidth = track.parentElement.getBoundingClientRect().width;
      const duplicateCount = Math.max(1, Math.ceil((marqueeWidth + groupWidth) / groupWidth) - 1);
      const duplicateGroups = Array.from(track.querySelectorAll(":scope > .certification-group[aria-hidden='true']"));

      while (duplicateGroups.length > duplicateCount) {
        duplicateGroups.pop().remove();
      }
      while (duplicateGroups.length < duplicateCount) {
        const duplicateGroup = document.createElement("div");
        duplicateGroup.className = "certification-group";
        duplicateGroup.setAttribute("aria-hidden", "true");
        originalCards.forEach((card) => {
          const clone = card.cloneNode(true);
          clone.querySelectorAll("a, button, [tabindex]").forEach((control) => {
            control.setAttribute("tabindex", "-1");
          });
          duplicateGroup.append(clone);
        });
        track.append(duplicateGroup);
        duplicateGroups.push(duplicateGroup);
      }

      track.style.setProperty("--marquee-distance", `${-groupWidth}px`);
      track.style.setProperty("--marquee-duration", `${Math.max(20, groupWidth / 50)}s`);
    };

    setMarqueePace();
    window.addEventListener("resize", setMarqueePace);
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
