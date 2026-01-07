// carousel.js

document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector(".carousel");
  if (!carousel) return;

  const track = carousel.querySelector(".track");
  const prevBtn = carousel.querySelector(".prev");
  const nextBtn = carousel.querySelector(".next");

  function updateButtons() {
    // keep nav available since carousel wraps
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  function scrollByCard(dir = 1) {
    const card = track.querySelector(".card");
    const gap = parseFloat(getComputedStyle(track).gap || 0);
    const delta = card ? card.offsetWidth + gap : 300;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (dir > 0) {
      // next: if at (or near) end, wrap to start
      if (track.scrollLeft >= maxScroll - 1) {
        track.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
    } else {
      // prev: if at (or near) start, wrap to end
      if (track.scrollLeft <= 1) {
        track.scrollTo({ left: maxScroll, behavior: "smooth" });
        return;
      }
    }
    track.scrollBy({ left: dir * delta, behavior: "smooth" });
  }

  // Scroll by a full "page" (the number of cards that fit fully in the viewport)
  function scrollByPage(dir = 1) {
    const cards = Array.from(track.querySelectorAll('.card'));
    if (!cards.length) return;

    const trackRect = track.getBoundingClientRect();
    // find first fully (or partially) visible card index
    const firstVisible = cards.findIndex(c => {
      const r = c.getBoundingClientRect();
      return r.right > trackRect.left + 1; // card enters viewport
    });
    const startIndex = firstVisible === -1 ? 0 : firstVisible;

    // count how many cards fit within the track width starting at startIndex
    let visibleCount = 0;
    let accumulated = 0;
    const gap = parseFloat(getComputedStyle(track).gap || 0);
    for (let i = startIndex; i < cards.length; i++) {
      const c = cards[i];
      accumulated += c.getBoundingClientRect().width;
      if (i > startIndex) accumulated += gap; // gap between cards
      if (accumulated <= track.clientWidth + 1) {
        visibleCount++;
      } else {
        break;
      }
    }
    if (visibleCount === 0) visibleCount = 1;

    let targetIndex;
    if (dir > 0) {
      const nextIndex = startIndex + visibleCount;
      // if advancing past the last card, wrap to start
      targetIndex = nextIndex >= cards.length ? 0 : nextIndex;
    } else {
      const prevIndex = startIndex - visibleCount;
      // if going before the first card, wrap to the last page start
      targetIndex = prevIndex < 0 ? Math.max(0, cards.length - visibleCount) : prevIndex;
    }

    const targetCard = cards[targetIndex];
    if (!targetCard) return;

    // scroll so target card aligns at the start
    // account for track padding
    const style = getComputedStyle(track);
    const paddingLeft = parseFloat(style.paddingLeft || 0);
    const scrollLeft = targetCard.offsetLeft - paddingLeft;
    track.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }

  // use page scrolling so each click shows a new set of fully visible cards
  prevBtn.addEventListener("click", () => scrollByPage(-1));
  nextBtn.addEventListener("click", () => scrollByPage(1));
  track.addEventListener("scroll", updateButtons);

  // Initialize button states
  updateButtons();

  /* ---------------- Navbar show/hide on scroll ---------------- */
  (function navbarScrollToggle(){
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // ensure initial visible state
    navbar.classList.add('visible');

    // set body padding to navbar height (in case CSS fallback differs)
    function syncBodyPadding() {
      const h = navbar.offsetHeight;
      document.body.style.paddingTop = h + 'px';
    }
    syncBodyPadding();
    window.addEventListener('resize', syncBodyPadding);

    let lastY = window.scrollY || 0;
    let ticking = false;

    function onScroll() {
      const y = window.scrollY || 0;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (y > lastY && y > navbar.offsetHeight + 10) {
            // scrolling down -> hide
            navbar.classList.add('hidden');
            navbar.classList.remove('visible');
          } else if (y < lastY) {
            // scrolling up -> show
            navbar.classList.remove('hidden');
            navbar.classList.add('visible');
          }
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---------------- Jumbotron carousel (full-screen) ---------------- */
  const jumbo = document.querySelector('.jumbo-carousel');
  if (jumbo) {
    const slides = Array.from(jumbo.querySelectorAll('.jumbo-slide'));
    const prev = jumbo.querySelector('.jumbo-prev');
    const next = jumbo.querySelector('.jumbo-next');
    const indicators = Array.from(jumbo.querySelectorAll('.jumbo-indicators button'));
    let current = 0;
    let autoTimer = null;
    const AUTO_DELAY = 5000;

    function showSlide(idx) {
      slides.forEach(s => s.classList.remove('active'));
      indicators.forEach(i => i.classList.remove('active'));
      const slide = slides[idx];
      if (!slide) return;
      slide.classList.add('active');
      if (indicators[idx]) indicators[idx].classList.add('active');
      current = idx;
    }

    function nextSlide() { showSlide((current + 1) % slides.length); }
    function prevSlide() { showSlide((current - 1 + slides.length) % slides.length); }

    // attach controls
    if (next) next.addEventListener('click', () => { pauseAuto(); nextSlide(); });
    if (prev) prev.addEventListener('click', () => { pauseAuto(); prevSlide(); });
    indicators.forEach((btn, i) => btn.addEventListener('click', () => { pauseAuto(); showSlide(i); }));

    // keyboard
    jumbo.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { pauseAuto(); nextSlide(); }
      if (e.key === 'ArrowLeft') { pauseAuto(); prevSlide(); }
    });

    // auto play with pause on hover/focus
    function startAuto() {
      if (autoTimer) return;
      autoTimer = setInterval(nextSlide, AUTO_DELAY);
    }
    function pauseAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

    jumbo.addEventListener('mouseenter', pauseAuto);
    jumbo.addEventListener('mouseleave', startAuto);
    jumbo.addEventListener('focusin', pauseAuto);
    jumbo.addEventListener('focusout', startAuto);

    // initial
    showSlide(0);
    startAuto();
  }

  /* ---------------- Parallax for first_box_1/2/3 ---------------- */
  (function initParallax(){
    const containers = Array.from(document.querySelectorAll('.first_box_1, .first_box_2, .first_box_3'))
      .map(el => ({ el, img: el.querySelector('img') }))
      .filter(x => x.img);
    if (!containers.length) return;

    let ticking = false;

    const defaultV = 0.0; // default vertical movement (0 since we'll favor horizontal)
    const defaultH = 0.6; // stronger horizontal movement so images slide left→right

    function update() {
      const vh = window.innerHeight;
      containers.forEach(({el, img}) => {
        const rect = el.getBoundingClientRect();
        // element center relative to viewport center
        const elCenter = rect.top + rect.height / 2;
        const distance = (vh / 2) - elCenter;

        // mode: horizontal | vertical | both
        const mode = (el.dataset.parallaxMode || el.dataset.parallaxMode === "") ? el.dataset.parallaxMode : el.dataset.parallaxMode;
        // per-element strength overrides
        const sV = parseFloat(el.dataset.parallaxStrength) ;
        const sH = parseFloat(el.dataset.parallaxStrengthX) ;

        const strengthV = Number.isFinite(sV) ? sV : defaultV;
        const strengthH = Number.isFinite(sH) ? sH : defaultH;

        // compute translations
        const translateY = Math.round(distance * strengthV);
        const translateX = Math.round(distance * strengthH);

        // choose which translation to apply based on data-parallax-mode
        let tx = 0, ty = 0;
        const modeVal = (el.dataset.parallaxMode || 'horizontal').toLowerCase();
        if (modeVal === 'horizontal') {
          tx = translateX;
          ty = 0;
        } else if (modeVal === 'vertical') {
          tx = 0;
          ty = translateY;
        } else if (modeVal === 'both') {
          tx = translateX;
          ty = translateY;
        } else {
          // default to horizontal
          tx = translateX;
        }

        img.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateY(${ty}px)`;
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // initial position
    onScroll();
  })();
});