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

    function setLastClickedButton(btn) {
      // remove active click state from all buttons
      const allButtons = [prev, next, ...indicators];
      allButtons.forEach(b => b?.classList.remove('clicked'));
      // add it to the clicked button
      if (btn) btn.classList.add('clicked');
    }

    // attach controls
    if (next) next.addEventListener('click', () => { pauseAuto(); nextSlide(); setLastClickedButton(next); });
    if (prev) prev.addEventListener('click', () => { pauseAuto(); prevSlide(); setLastClickedButton(prev); });
    indicators.forEach((btn, i) => btn.addEventListener('click', () => { pauseAuto(); showSlide(i); setLastClickedButton(btn); }));

    // keyboard
    jumbo.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { pauseAuto(); nextSlide(); }
      if (e.key === 'ArrowLeft') { pauseAuto(); prevSlide(); }
    });

    // auto play with pause on focus only (not on hover)
    function startAuto() {
      if (autoTimer) return;
      autoTimer = setInterval(nextSlide, AUTO_DELAY);
    }
    function pauseAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

    // only pause on keyboard focus, not on mouse hover
    jumbo.addEventListener('focusin', pauseAuto);
    jumbo.addEventListener('focusout', startAuto);

    // initial
    showSlide(0);
    startAuto();
  }

  /* ---------------- Parallax for first_box_1/2/3 ---------------- */
  (function initParallax(){
    const containers = Array.from(document.querySelectorAll('.first_box_1, .first_box_2, .first_box_3'))
      .map(el => ({ el, img: el.querySelector('img'), texts: el.querySelectorAll('.parallax-text') }))
      .filter(x => x.img || x.texts.length > 0);
    if (!containers.length) return;

    let ticking = false;

    const defaultV = 0.0; // default vertical movement (0 since we'll favor horizontal)
    const defaultH = 0.6; // stronger horizontal movement so images slide left→right

    function update() {
      const vh = window.innerHeight;
      containers.forEach(({el, img, texts}) => {
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

        if (img) {
          img.style.transform = `translate(-50%, -50%) translateX(${tx}px) translateY(${ty}px)`;
        }

        // apply parallax to all text elements with clamping to stop at center
        texts.forEach((text, index) => {
          const textSH = parseFloat(text.dataset.parallaxStrengthX);
          const textStrengthH = Number.isFinite(textSH) ? textSH : 1.2;
          let textTx = Math.round(distance * textStrengthH);
          // clamp the text so it stops at the center (0)
          textTx = Math.min(textTx, 0);
          text.style.setProperty('--parallax-x', `${textTx}px`);
          
          // Reverse order opacity: last text disappears first when scrolling up
          const reversedIndex = texts.length - 1 - index;
          // Map distance to opacity: negative distance (scrolling up) reduces opacity
          // Distance goes from positive (below) to negative (above)
          // We want: when scrolling up, opacity decreases in reverse order
          const opacityThreshold = reversedIndex * 150; // Each text needs more scroll up to disappear
          const opacity = Math.max(0, Math.min(1, (distance + opacityThreshold) / 150));
          text.style.opacity = opacity;
        });
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

  /* ---------------- Jumbotron fade on scroll ---------------- */
  (function initJumbotronFade(){
    const jumboEl = document.querySelector('.jumbotron');
    if (!jumboEl) return;

    // smooth opacity transitions when updating
    jumboEl.style.transition = 'opacity 200ms linear';

    let ticking = false;

    function update() {
      const pageScroll = window.scrollY || window.pageYOffset;
      const jumboTop = jumboEl.offsetTop;
      const jumboHeight = jumboEl.offsetHeight;

      // relative scroll inside the jumbotron (0 .. jumboHeight)
      const relative = Math.min(Math.max(pageScroll - jumboTop, 0), jumboHeight);

      // start fade at 80% of the jumbotron height
      const fadeStart = jumboHeight * 0.8;

      let progress = 0;
      if (relative <= fadeStart) progress = 0;
      else progress = (relative - fadeStart) / (jumboHeight - fadeStart);
      progress = Math.min(Math.max(progress, 0), 1);

      // set opacity from 1 -> 0 as progress goes 0 -> 1
      jumboEl.style.opacity = String(1 - progress);
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // set initial
    update();
  })();

});

/* ---------------- Active nav links + Contact form handler ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  // mark active nav links (header + footer)
  try {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const links = Array.from(document.querySelectorAll('.nav-list a, .footer-links a'));
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href === path || (href === 'index.html' && path === '')) {
        a.classList.add('active-nav');
        a.setAttribute('aria-current', 'page');
      }
    });
  } catch (e) {
    // ignore
  }

  // contact form: compose mailto and open mail client
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = encodeURIComponent(form.name.value.trim());
      const email = encodeURIComponent(form.email.value.trim());
      const message = encodeURIComponent(form.message.value.trim());
      const subject = encodeURIComponent('Contact from portfolio: ' + (form.name.value.trim() || '')); 
      const body = encodeURIComponent(`Name: ${form.name.value}\nEmail: ${form.email.value}\n\n${form.message.value}`);
      // open mail client
      window.location.href = `mailto:you@example.com?subject=${subject}&body=${body}`;
    });
  }
});

/* ---------------- Project modal behavior ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  const overlay = modal.querySelector('.modal-overlay');
  const dialog = modal.querySelector('.modal-dialog');
  const imgEl = modal.querySelector('.modal-image');
  const titleEl = modal.querySelector('#project-modal-title');
  const descEl = modal.querySelector('.modal-desc');
  const linkEl = modal.querySelector('.modal-link');
  const closeButtons = modal.querySelectorAll('[data-action="close"]');

  function openModal(data) {
    imgEl.src = data.image || '';
    imgEl.alt = data.title || '';
    titleEl.textContent = data.title || '';
    descEl.textContent = data.desc || '';
    linkEl.href = data.link || '#';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    // focus close button for accessibility
    const btn = modal.querySelector('.modal-close');
    if (btn) btn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // attach click openers for project links and plain .card elements
  const linkNodes = Array.from(document.querySelectorAll('.project-link'));
  const cardNodes = Array.from(document.querySelectorAll('.card'))
    .filter(c => !c.closest('a') && c.querySelector('.card-body h3'));

  // make non-link cards keyboard-focusable
  cardNodes.forEach(c => {
    if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
    if (!c.getAttribute('role')) c.setAttribute('role', 'button');
  });

  const openers = [...linkNodes, ...cardNodes];
  openers.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const title = el.dataset.title || el.querySelector('.card-body h3')?.textContent || '';
      const desc = el.dataset.desc || el.querySelector('.card-body p')?.textContent || '';
      const image = el.dataset.image || el.querySelector('img')?.src || '';
      const link = el.dataset.link || el.getAttribute('href') || '#';
      const data = { title, desc, image, link };
      openModal(data);
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  // close handlers
  overlay.addEventListener('click', closeModal);
  closeButtons.forEach(b => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
});

// Consolidate everything into a single initialization flow
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Run immediate UI effects (Navbar, Parallax, Jumbotron)
  // These don't depend on external data
  initNavbarScrollToggle();
  initJumbotronCarousel();
  initParallaxEffects();
  initJumbotronFade();
  initActiveNavLinks();
  initContactForm();

  // 2. Handle Data Injection
  // We check if the current page has a carousel track (index) or a projects grid (projects)
  const dataContainer = document.querySelector(".track") || document.querySelector(".projects-grid");
  
  if (dataContainer) {
    fetchAkiyaData(dataContainer);
  } else {
    // If we're on a page with no data (like 'About'), just init the modal for static elements
    initProjectModal();
  }
});

/* ---------------- API DATA FETCHING ---------------- */
async function fetchAkiyaData(container) {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/houses');
    if (!response.ok) throw new Error("Backend offline");
    
    const houses = await response.json();

    // Preserve your exact CSS card structure
    container.innerHTML = houses.map(house => `
      <article class="card" 
               data-title="${house.title}" 
               data-desc="${house.description}" 
               data-image="${house.image_url}" 
               data-link="#" 
               role="button" 
               tabindex="0">
          <img src="${house.image_url}" alt="${house.title}" />
          <div class="card-body">
              <h3>${house.title}</h3>
              <p><strong>$${house.price_usd.toLocaleString()} USD</strong></p>
              <p>${house.location}</p>
          </div>
      </article>
    `).join('');

    // CRITICAL: Re-run carousel & modal logic AFTER cards are added to the DOM
    initCarouselControls(); 
    initProjectModal();

  } catch (error) {
    console.warn("Backend not detected. Keeping original static design.");
    // Fallback: Init the carousel and modal for the hardcoded HTML cards
    initCarouselControls();
    initProjectModal();
  }
}

/* ---------------- REFACTORED INTERACTION LOGIC ---------------- */
// (I have renamed these to avoid conflicts with your original event listeners)

function initCarouselControls() {
  const carousel = document.querySelector(".carousel");
  if (!carousel) return;
  const track = carousel.querySelector(".track");
  const prevBtn = carousel.querySelector(".prev");
  const nextBtn = carousel.querySelector(".next");

  // Re-attach your scrollByPage logic here...
  nextBtn.onclick = () => { /* Your scrollByPage(1) logic */ };
  prevBtn.onclick = () => { /* Your scrollByPage(-1) logic */ };
}

function initProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  // We use event delegation so it works for cards added via API
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;

    const data = {
      title: card.dataset.title || card.querySelector('h3').textContent,
      desc: card.dataset.desc || card.querySelector('p').textContent,
      image: card.dataset.image || card.querySelector('img').src,
      link: card.dataset.link || '#'
    };

    modal.querySelector('.modal-image').src = data.image;
    modal.querySelector('#project-modal-title').textContent = data.title;
    modal.querySelector('.modal-desc').textContent = data.desc;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  // Close handlers (Overlay and Close buttons)
  modal.querySelectorAll('[data-action="close"]').forEach(btn => {
    btn.onclick = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };
  });
}

// ... Keep all your original Parallax, Jumbotron, and Navbar functions below ...

