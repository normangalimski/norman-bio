const revealItems = document.querySelectorAll("[data-reveal]");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => observer.observe(item));

const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-nav.prev");
const lightboxNext = document.querySelector(".lightbox-nav.next");
const lightboxTriggers = document.querySelectorAll(".lightbox-trigger");

if (lightbox && lightboxImage && lightboxClose) {
  const images = Array.from(lightboxTriggers)
    .map((trigger) => trigger.getAttribute("data-src"))
    .filter(Boolean);
  let currentIndex = 0;

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
  };

  const showImage = (index) => {
    if (!images.length) return;
    currentIndex = (index + images.length) % images.length;
    lightboxImage.src = images[currentIndex];
  };

  lightboxTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const src = trigger.getAttribute("data-src");
      if (!src) return;
      const index = images.indexOf(src);
      currentIndex = index >= 0 ? index : 0;
      lightboxImage.src = src;
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  lightboxClose.addEventListener("click", closeLightbox);

  if (lightboxPrev && lightboxNext) {
    lightboxPrev.addEventListener("click", () => showImage(currentIndex - 1));
    lightboxNext.addEventListener("click", () => showImage(currentIndex + 1));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
    if (event.key === "ArrowLeft") {
      showImage(currentIndex - 1);
    }
    if (event.key === "ArrowRight") {
      showImage(currentIndex + 1);
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  lightbox.addEventListener(
    "touchstart",
    (event) => {
      if (!lightbox.classList.contains("open")) return;
      const touch = event.changedTouches[0];
      touchStartX = touch.screenX;
      touchStartY = touch.screenY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchmove",
    (event) => {
      if (!lightbox.classList.contains("open")) return;
      const touch = event.changedTouches[0];
      touchEndX = touch.screenX;
      touchEndY = touch.screenY;
    },
    { passive: true }
  );

  lightbox.addEventListener("touchend", () => {
    if (!lightbox.classList.contains("open")) return;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        showImage(currentIndex - 1);
      } else {
        showImage(currentIndex + 1);
      }
    } else if (Math.abs(deltaY) > 60) {
      if (deltaY > 0) {
        showImage(currentIndex - 1);
      } else {
        showImage(currentIndex + 1);
      }
    } else {
      // Treat a tap as "next" on mobile.
      showImage(currentIndex + 1);
    }
  });
}
