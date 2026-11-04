    (() => {
      const menuToggle = document.querySelector(".menu-toggle");
      const navLinks = document.getElementById("primary-navigation");
      const mobileMenuQuery = window.matchMedia("(max-width: 899px)");
      const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const setMenuOpen = (isOpen) => {
        navLinks.hidden = !isOpen;
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      };
      const syncMenuForViewport = () => {
        const isMobile = mobileMenuQuery.matches;
        menuToggle.hidden = !isMobile;
        setMenuOpen(!isMobile);
      };

      // Collapse navigation on small screens and keep its state in sync on resize.
      syncMenuForViewport();
      mobileMenuQuery.addEventListener("change", syncMenuForViewport);
      menuToggle.addEventListener("click", () => {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
      });
      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          if (mobileMenuQuery.matches) {
            setMenuOpen(false);
          }
        });
      });

      const motionTargets = document.querySelectorAll([
        ".site-header .navigation",
        "#home .hero-content",
        "#home .hero-photo-frame",
        "#about .about-heading",
        "#about .about-copy",
        "#skills .section-heading",
        "#skills .info-card",
        ".tools-band .container",
        "#certifications .section-heading",
        "#certifications .certification-card",
        "#projects .section-heading",
        "#projects .project-card",
        "#contact .contact-content",
        ".site-footer .footer-bottom",
      ].join(", "));

      if (reducedMotionQuery.matches || typeof IntersectionObserver !== "function") {
        motionTargets.forEach((target) => target.classList.add("motion-visible"));
      } else {
        document.documentElement.classList.add("motion-ready");

        document.querySelectorAll(".skills-grid, .certifications-grid, .projects-grid").forEach((grid) => {
          Array.from(grid.children).forEach((card, index) => {
            card.style.setProperty("--motion-delay", `${Math.min(index * 100, 300)}ms`);
          });
        });

        const motionObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("motion-visible");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

        motionTargets.forEach((target) => {
          target.classList.add("motion-reveal");
          motionObserver.observe(target);
        });

        window.setTimeout(() => {
          motionTargets.forEach((target) => {
            const bounds = target.getBoundingClientRect();
            if (
              bounds.bottom > 0
              && bounds.top < window.innerHeight
              && bounds.right > 0
              && bounds.left < window.innerWidth
            ) {
              target.classList.add("motion-visible");
            }
          });
        }, 120);
      }

      // Auto-advance mobile skill and certificate cards while their sections are visible.
      const carouselQuery = window.matchMedia("(max-width: 600px)");
      document.querySelectorAll(".skills-grid, .certifications-grid").forEach((grid) => {
        const cards = Array.from(grid.children);
        if (cards.length < 2) {
          return;
        }

        let currentIndex = 0;
        let isVisible = false;
        let isHovered = false;
        let hasFocus = false;
        let isInteracting = false;
        let advanceTimer = null;
        let interactionTimer = null;

        const stopAdvancing = () => {
          window.clearTimeout(advanceTimer);
          advanceTimer = null;
        };
        const scheduleAdvance = () => {
          stopAdvancing();
          if (
            !carouselQuery.matches
            || reducedMotionQuery.matches
            || !isVisible
            || isHovered
            || hasFocus
            || isInteracting
            || document.hidden
          ) {
            return;
          }

          advanceTimer = window.setTimeout(() => {
            currentIndex = (currentIndex + 1) % cards.length;
            grid.scrollTo({
              left: cards[currentIndex].offsetLeft - grid.offsetLeft,
              behavior: "smooth",
            });
            scheduleAdvance();
          }, 3500);
        };
        const pauseForInteraction = () => {
          isInteracting = true;
          window.clearTimeout(interactionTimer);
          stopAdvancing();
          interactionTimer = window.setTimeout(() => {
            isInteracting = false;
            scheduleAdvance();
          }, 7000);
        };

        grid.addEventListener("scroll", () => {
          const scrollLeft = grid.scrollLeft;
          currentIndex = cards.reduce((nearestIndex, card, index) => (
            Math.abs(card.offsetLeft - grid.offsetLeft - scrollLeft)
              < Math.abs(cards[nearestIndex].offsetLeft - grid.offsetLeft - scrollLeft)
              ? index
              : nearestIndex
          ), 0);
        }, { passive: true });
        grid.addEventListener("pointerdown", pauseForInteraction, { passive: true });
        grid.addEventListener("wheel", pauseForInteraction, { passive: true });
        grid.addEventListener("mouseenter", () => {
          isHovered = true;
          stopAdvancing();
        });
        grid.addEventListener("mouseleave", () => {
          isHovered = false;
          scheduleAdvance();
        });
        grid.addEventListener("focusin", () => {
          hasFocus = true;
          stopAdvancing();
        });
        grid.addEventListener("focusout", (event) => {
          if (!grid.contains(event.relatedTarget)) {
            hasFocus = false;
            scheduleAdvance();
          }
        });

        if (typeof IntersectionObserver === "function") {
          const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            scheduleAdvance();
          }, { threshold: 0.2 });
          observer.observe(grid);
        } else {
          isVisible = true;
        }

        const syncCarousel = () => {
          if (!carouselQuery.matches) {
            currentIndex = 0;
            grid.scrollLeft = 0;
          }
          scheduleAdvance();
        };
        carouselQuery.addEventListener("change", syncCarousel);
        reducedMotionQuery.addEventListener("change", syncCarousel);
        document.addEventListener("visibilitychange", scheduleAdvance);
        syncCarousel();
      });

      // Cache the lightbox elements and the link to restore focus after closing.
      const lightbox = document.getElementById("certificate-lightbox");
      const stage = document.getElementById("lightbox-stage");
      const closeButton = document.getElementById("lightbox-close");
      const zoomOutButton = document.getElementById("lightbox-zoom-out");
      const zoomInButton = document.getElementById("lightbox-zoom-in");
      const finishClosing = () => {
        if (!lightbox.classList.contains("is-closing")) {
          return;
        }
        lightbox.hidden = true;
        lightbox.classList.remove("is-closing");
        stage.replaceChildren();
        document.body.classList.remove("lightbox-open");
        lastFocusedLink?.focus();
      };
      let zoom = 1;
      let lastFocusedLink = null;

      // Apply the current zoom level to the open image or PDF preview.
      const updateZoom = () => {
        const preview = stage.firstElementChild;
        if (preview) {
          preview.style.setProperty("--lightbox-zoom", zoom);
        }
      };

      // Hide the preview, restore page scrolling, and return keyboard focus.
      const closeLightbox = () => {
        if (lightbox.hidden || lightbox.classList.contains("is-closing")) {
          return;
        }

        lightbox.classList.remove("is-open");
        lightbox.classList.add("is-closing");
        lightbox.setAttribute("aria-hidden", "true");

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          finishClosing();
          return;
        }

        window.setTimeout(finishClosing, 350);
      };

      // Open certificate previews in the centered overlay.
      document.querySelectorAll(".certificate-image-link").forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          lastFocusedLink = link;
          zoom = 1;

          const isPdf = /\.pdf(?:[?#]|$)/i.test(link.href);
          const preview = document.createElement(isPdf ? "iframe" : "img");
          preview.src = isPdf ? `${link.href}#toolbar=0&navpanes=0&scrollbar=0&view=Fit` : link.href;
          preview.className = "lightbox-preview";
          preview.style.setProperty("--lightbox-zoom", zoom);

          if (isPdf) {
            preview.title = link.getAttribute("aria-label") || "Document preview";
            lightbox.setAttribute("aria-label", "Certificate preview");
          } else {
            preview.alt = link.querySelector("img")?.alt || "Certificate preview";
            lightbox.setAttribute("aria-label", "Certificate preview");
          }

          stage.replaceChildren(preview);
          lightbox.hidden = false;
          lightbox.setAttribute("aria-hidden", "false");
          document.body.classList.add("lightbox-open");
          lightbox.classList.remove("is-closing");
          requestAnimationFrame(() => {
            lightbox.classList.add("is-open");
          });
          closeButton.focus();
        });
      });

      // Remove the overlay after its fade; reduced-motion users close immediately.
      lightbox.addEventListener("transitionend", (event) => {
        if (event.target === lightbox && event.propertyName === "opacity") {
          finishClosing();
        }
      });

      // Keep zoom controls bounded and allow closing with either control or Escape.
      closeButton.addEventListener("click", closeLightbox);
      zoomOutButton.addEventListener("click", () => {
        zoom = Math.max(0.6, zoom - 0.2);
        updateZoom();
      });
      zoomInButton.addEventListener("click", () => {
        zoom = Math.min(2.4, zoom + 0.2);
        updateZoom();
      });
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
          closeLightbox();
        }
      });
      lightbox.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          closeLightbox();
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !lightbox.hidden) {
          closeLightbox();
        }
      });

      const projectModal = document.getElementById("project-modal");
      const projectModalClose = document.getElementById("project-modal-close");
      const projectModalTitle = document.getElementById("project-modal-title");
      const projectModalContent = document.getElementById("project-modal-content");
      const projectModalPdf = document.getElementById("project-modal-pdf");
      const projectCarouselFrame = document.querySelector(".project-carousel-frame");
      const carouselImage = document.getElementById("project-carousel-image");
      const carouselError = document.getElementById("project-carousel-error");
      const carouselDots = document.getElementById("project-carousel-dots");
      const carouselPrevious = document.getElementById("project-carousel-previous");
      const carouselNext = document.getElementById("project-carousel-next");
      let projectImages = [];
      let projectPdfPreview = null;
      let projectSlideCount = 0;
      let currentProjectSlide = 0;
      let lastProjectCard = null;
      let projectCloseTimer;

      const showProjectSlide = (index) => {
        currentProjectSlide = (index + projectSlideCount) % projectSlideCount;
        if (projectImages.length) {
          carouselImage.src = projectImages[currentProjectSlide];
          carouselImage.alt = `${projectModalTitle.textContent} screenshot ${currentProjectSlide + 1}`;
          carouselImage.hidden = false;
          carouselError.hidden = true;
        } else if (projectPdfPreview) {
          const pdfUrl = new URL(projectPdfPreview.dataset.pdfPath, document.baseURI);
          pdfUrl.hash = `toolbar=0&navpanes=0&scrollbar=0&page=${currentProjectSlide + 1}&view=Fit`;
          projectPdfPreview.src = pdfUrl.href;
        }
        carouselDots.querySelectorAll("button").forEach((dot, dotIndex) => {
          dot.setAttribute("aria-pressed", String(dotIndex === currentProjectSlide));
        });
      };

      const openProjectModal = (card) => {
        lastProjectCard = card;
        projectModal.classList.toggle("project-modal-market", card.classList.contains("project-card-market"));
        projectModalTitle.textContent = card.querySelector(".project-content h3").textContent;
        projectModalContent.replaceChildren(
          ...[...card.querySelectorAll(".project-description, .project-detail")].map((item) => item.cloneNode(true))
        );
        projectImages = (card.dataset.projectImages || "").split(",").map((path) => path.trim()).filter(Boolean);
        const projectPdfPages = Number.parseInt(card.dataset.projectPdfPages || "0", 10);
        projectSlideCount = projectImages.length || (Number.isInteger(projectPdfPages) ? projectPdfPages : 0);
        currentProjectSlide = 0;
        carouselDots.replaceChildren();
        projectPdfPreview?.remove();
        projectPdfPreview = null;
        for (let index = 0; index < projectSlideCount; index += 1) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "project-carousel-dot";
          dot.setAttribute("aria-label", `Show screenshot ${index + 1}`);
          dot.addEventListener("click", () => showProjectSlide(index));
          carouselDots.append(dot);
        }
        carouselPrevious.hidden = projectSlideCount < 2;
        carouselNext.hidden = projectSlideCount < 2;
        if (projectImages.length) {
          carouselImage.hidden = false;
          carouselError.hidden = true;
          showProjectSlide(0);
        } else {
          carouselImage.hidden = true;
          carouselError.hidden = true;
          if (card.dataset.projectPdf) {
            projectPdfPreview = document.createElement("iframe");
            projectPdfPreview.className = "project-carousel-pdf";
            projectPdfPreview.dataset.pdfPath = card.dataset.projectPdf;
            projectPdfPreview.title = `${projectModalTitle.textContent} screenshot preview`;
            projectCarouselFrame.append(projectPdfPreview);
            if (projectSlideCount > 0) {
              showProjectSlide(0);
            } else {
              carouselError.textContent = "No project screenshots have been added yet.";
              carouselError.hidden = false;
            }
          } else {
            carouselError.textContent = "No project screenshots have been added yet.";
            carouselError.hidden = false;
          }
        }

        if (card.dataset.projectPdf) {
          projectModalPdf.href = card.dataset.projectPdf;
          projectModalPdf.hidden = false;
        } else {
          projectModalPdf.hidden = true;
          projectModalPdf.removeAttribute("href");
        }

        window.clearTimeout(projectCloseTimer);
        projectModal.classList.remove("is-closing");
        projectModal.hidden = false;
        projectModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("project-modal-open");
        requestAnimationFrame(() => projectModal.classList.add("is-open"));
        projectModalClose.focus();
      };

      const closeProjectModal = () => {
        if (projectModal.hidden || projectModal.classList.contains("is-closing")) {
          return;
        }
        projectModal.classList.remove("is-open");
        projectModal.classList.add("is-closing");
        projectModal.setAttribute("aria-hidden", "true");
        const finishClose = () => {
          projectModal.hidden = true;
          projectModal.classList.remove("is-closing");
          projectModal.classList.remove("project-modal-market");
          document.body.classList.remove("project-modal-open");
          lastProjectCard?.focus();
        };
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          finishClose();
        } else {
          projectCloseTimer = window.setTimeout(finishClose, 300);
        }
      };

      document.querySelectorAll(".project-card-clickable").forEach((card) => {
        card.addEventListener("click", (event) => {
          if (event.target.closest("a")) {
            return;
          }
          openProjectModal(card);
        });
        card.addEventListener("keydown", (event) => {
          if (event.target !== card) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProjectModal(card);
          }
        });
      });
      projectModalClose.addEventListener("click", closeProjectModal);
      carouselPrevious.addEventListener("click", () => showProjectSlide(currentProjectSlide - 1));
      carouselNext.addEventListener("click", () => showProjectSlide(currentProjectSlide + 1));
      const openProjectScreenshot = () => {
        if (carouselImage.hidden) {
          return;
        }

        const preview = document.createElement("img");
        preview.src = carouselImage.src;
        preview.alt = carouselImage.alt;
        preview.className = "lightbox-preview";
        preview.style.setProperty("--lightbox-zoom", 1);
        stage.replaceChildren(preview);
        lastFocusedLink = carouselImage;
        lightbox.setAttribute("aria-label", "Full-screen project screenshot preview");
        lightbox.hidden = false;
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("lightbox-open");
        lightbox.classList.remove("is-closing");
        requestAnimationFrame(() => {
          lightbox.classList.add("is-open");
        });
        closeButton.focus();
      };
      carouselImage.addEventListener("click", openProjectScreenshot);
      carouselImage.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProjectScreenshot();
        }
      });
      carouselImage.addEventListener("error", () => {
        carouselImage.hidden = true;
        carouselError.textContent = `Screenshot not found: ${projectImages[currentProjectSlide]}`;
        carouselError.hidden = false;
      });
      projectModal.addEventListener("click", (event) => {
        if (event.target === projectModal) {
          closeProjectModal();
        }
      });
      let swipeStartX = 0;
      let swipeStartY = 0;
      projectCarouselFrame.addEventListener("touchstart", (event) => {
        const touch = event.changedTouches[0];
        if (!touch) {
          return;
        }
        swipeStartX = touch.clientX;
        swipeStartY = touch.clientY;
      }, { passive: true });
      projectCarouselFrame.addEventListener("touchend", (event) => {
        if (projectSlideCount < 2) {
          return;
        }
        const touch = event.changedTouches[0];
        if (!touch) {
          return;
        }
        const deltaX = touch.clientX - swipeStartX;
        const deltaY = touch.clientY - swipeStartY;
        if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
          showProjectSlide(currentProjectSlide + (deltaX < 0 ? 1 : -1));
        }
      }, { passive: true });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !projectModal.hidden && lightbox.hidden) {
          closeProjectModal();
        }
      });
    })();
