const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

const observeReveal = (el) => {
  if (el) {
    revealObserver.observe(el);
  }
};

document.querySelectorAll("[data-reveal]").forEach((item) => observeReveal(item));

let imageCache = null;

const loadImages = async () => {
  if (imageCache) return imageCache;
  const response = await fetch("data/images.json");
  if (!response.ok) {
    throw new Error("Failed to load image data");
  }
  imageCache = await response.json();
  return imageCache;
};

const createStreamItem = (img) => {
  const figure = document.createElement("figure");
  figure.className = "stream-item";
  figure.setAttribute("data-reveal", "");

  const image = document.createElement("img");
  image.src = img.src;
  image.alt = img.alt || "Gallery image";
  image.loading = "lazy";
  image.width = 1200;
  image.height = 900;

  figure.appendChild(image);
  return figure;
};

const createGalleryItem = (img) => {
  const figure = document.createElement("figure");
  figure.className = "gallery-card";
  figure.setAttribute("data-reveal", "");

  const button = document.createElement("button");
  button.className = "lightbox-trigger";
  button.setAttribute("data-src", img.src);
  button.setAttribute("aria-label", `Open image ${img.alt || "Gallery image"}`);

  const image = document.createElement("img");
  image.src = img.src;
  image.alt = img.alt || "Gallery image";
  image.loading = "lazy";
  image.width = 1200;
  image.height = 900;

  button.appendChild(image);
  figure.appendChild(button);
  return figure;
};

const initHomeStream = async () => {
  const stream = document.getElementById("home-stream");
  const loading = document.getElementById("home-stream-loading");
  const sentinel = document.getElementById("home-stream-sentinel");

  if (!stream || !loading || !sentinel) return;

  const images = await loadImages();
  if (!images.length) return;

  const batchSize = 12;
  let index = 0;

  const appendBatch = () => {
    loading.classList.add("is-visible");
    for (let i = 0; i < batchSize; i += 1) {
      const img = images[index];
      index = (index + 1) % images.length;
      const item = createStreamItem(img);
      stream.insertBefore(item, sentinel);
      observeReveal(item);
    }
    setTimeout(() => loading.classList.remove("is-visible"), 200);
  };

  appendBatch();

  const sentinelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          appendBatch();
        }
      });
    },
    { root: stream, rootMargin: "0px 300px 0px 300px" }
  );

  sentinelObserver.observe(sentinel);
};

const initGallery = async () => {
  const feature = document.getElementById("gallery-feature");
  const grid = document.getElementById("gallery-grid");

  if (!feature || !grid) return;

  const images = await loadImages();
  if (!images.length) return;

  const featureImage = images[0];
  feature.innerHTML = "";
  const featureButton = document.createElement("button");
  featureButton.className = "lightbox-trigger feature-trigger";
  featureButton.setAttribute("data-src", featureImage.src);
  featureButton.setAttribute("aria-label", "Open featured image");

  const featureImg = document.createElement("img");
  featureImg.src = featureImage.src;
  featureImg.alt = featureImage.alt || "Featured gallery image";
  featureImg.loading = "lazy";
  featureImg.width = 1600;
  featureImg.height = 1000;

  featureButton.appendChild(featureImg);
  feature.appendChild(featureButton);
  observeReveal(feature);

  grid.innerHTML = "";
  images.slice(1).forEach((img) => {
    const item = createGalleryItem(img);
    grid.appendChild(item);
    observeReveal(item);
  });

  initLightbox(images);
};

const initLightbox = (images) => {
  const lightbox = document.querySelector(".lightbox");
  const lightboxImage = document.querySelector(".lightbox-image");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxPrev = document.querySelector(".lightbox-nav.prev");
  const lightboxNext = document.querySelector(".lightbox-nav.next");
  const lightboxTriggers = document.querySelectorAll(".lightbox-trigger");

  if (!lightbox || !lightboxImage || !lightboxClose) return;

  let currentIndex = 0;

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
  };

  const showImage = (index) => {
    if (!images.length) return;
    currentIndex = (index + images.length) % images.length;
    lightboxImage.src = images[currentIndex].src;
  };

  lightboxTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const src = trigger.getAttribute("data-src");
      if (!src) return;
      const index = images.findIndex((img) => img.src === src);
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
  let touchOnControl = false;

  lightbox.addEventListener(
    "touchstart",
    (event) => {
      if (!lightbox.classList.contains("open")) return;
      const touch = event.changedTouches[0];
      touchStartX = touch.screenX;
      touchStartY = touch.screenY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
      touchOnControl = Boolean(event.target.closest(".lightbox-nav, .lightbox-close"));
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
    if (touchOnControl) return;
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
      showImage(currentIndex + 1);
    }
  });
};

const initPage = async () => {
  try {
    await Promise.all([initHomeStream(), initGallery()]);
  } catch (error) {
    console.error(error);
  }
};

initPage();
