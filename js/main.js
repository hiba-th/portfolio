// Portfolio home: badge flip (Multimedia <-> IT) and mouse tilt.
(function () {
  var root = document.documentElement;
  var badge = document.getElementById('badge');
  var stage = document.getElementById('stage');
  var segs = document.querySelectorAll('.seg');
  var panels = document.querySelectorAll('[data-panel]');

  function setSide(side) {
    var it = side === 'it';
    root.setAttribute('data-side', side);
    badge.setAttribute('aria-label', it ? 'Flip badge to the multimedia side' : 'Flip badge to the IT side');
    segs.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.side === side)); });
    // Every [data-panel] block (hero text, Work section) shows only for its side.
    panels.forEach(function (p) { p.hidden = p.dataset.panel !== side; });
  }

  badge.addEventListener('click', function () {
    setSide(root.getAttribute('data-side') === 'it' ? 'mm' : 'it');
  });
  segs.forEach(function (b) {
    b.addEventListener('click', function () { setSide(b.dataset.side); });
  });

  // Tilt the badge toward the cursor; glare and shadow move the opposite way.
  function tilt(mx, my) {
    root.style.setProperty('--tilt-t', 'rotateX(' + (-my * 16) + 'deg) rotateY(' + (mx * 22) + 'deg)');
    root.style.setProperty('--shadow-t', 'translate(' + (7 - mx * 26) + 'px,' + (11 - my * 18) + 'px) rotateZ(-2deg)');
    root.style.setProperty('--glare-x', (50 - mx * 110) + '%');
    root.style.setProperty('--glare-xb', (50 + mx * 110) + '%');
    root.style.setProperty('--glare-y', (30 - my * 90) + '%');
  }
  stage.addEventListener('mousemove', function (e) {
    var r = stage.getBoundingClientRect();
    tilt((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top - r.height * 0.35) / r.height - 0.3);
  });
  stage.addEventListener('mouseleave', function () { tilt(0, 0); });
  // The page moves under a still mouse while scrolling, so straighten the badge.
  window.addEventListener('scroll', function () { tilt(0, 0); }, { passive: true });

  setSide('mm');

  // Flip-peek: on a first visit the badge half-turns and swings back, so
  // visitors see it can be flipped. Stops once they have flipped it (remembered).
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var flippedBefore = false;
  try { flippedBefore = !!localStorage.getItem('badgeFlipped'); } catch (e) {}
  function flippedByUser() {
    flippedBefore = true;
    try { localStorage.setItem('badgeFlipped', '1'); } catch (e) {}
  }
  badge.addEventListener('click', flippedByUser);
  segs.forEach(function (b) { b.addEventListener('click', flippedByUser); });
  function peek() {
    if (calm || flippedBefore || root.getAttribute('data-side') !== 'mm') return;
    badge.classList.remove('peek');
    void badge.offsetWidth; // restart the animation even if the last one never ended
    badge.classList.add('peek');
    badge.addEventListener('animationend', function () { badge.classList.remove('peek'); }, { once: true });
  }
  setTimeout(peek, 1900);  // right after the badge lands from the intro
  setTimeout(peek, 7000);

  // Intro animation (class added in <head>): drop it once everything has landed.
  setTimeout(function () { root.classList.remove('intro'); }, 2800);

  // Work folders: the tabs stay in their order like real folder tabs.
  // The open tab takes the panel colour; the panel shows its content.
  var folders = Array.prototype.slice.call(document.querySelectorAll('.folder'));
  var folderPanel = document.querySelector('.folder-panel');
  var FOLDER_SHADES = ['#CF7FA2', '#D98DAD', '#E29CBA', '#E7A8C3'];
  var FOLDER_OPEN = '#F1BED3';
  function openFolder(open) {
    folders.forEach(function (f, i) {
      var isOpen = f === open;
      var body = document.getElementById(f.querySelector('.folder-tab').getAttribute('aria-controls'));
      f.style.setProperty('--c', isOpen ? FOLDER_OPEN : FOLDER_SHADES[Math.min(i, FOLDER_SHADES.length - 1)]);
      f.classList.toggle('is-front', isOpen);
      f.querySelector('.folder-tab').setAttribute('aria-expanded', String(isOpen));
      body.hidden = !isOpen;
    });
    if (folderPanel) folderPanel.style.setProperty('--panel', FOLDER_OPEN);
  }
  folders.forEach(function (f) {
    f.querySelector('.folder-tab').addEventListener('click', function () { openFolder(f); });
  });
  if (folders.length) openFolder(folders[0]);

  // IT projects: a row opens (or closes) its summary underneath.
  document.querySelectorAll('.proj--acc').forEach(function (row) {
    var head = row.querySelector('.proj-head');
    var detail = row.querySelector('.proj-detail');
    head.addEventListener('click', function () {
      var open = !row.classList.contains('is-open');
      row.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      detail.inert = !open;
    });
  });

  // Work lightbox: a card opens its video (with sound) or photo in a dialog.
  var lightbox = document.querySelector('.lightbox');
  if (lightbox && lightbox.showModal) {
    var lbMedia = lightbox.querySelector('.lightbox-media');
    var lbTitle = lightbox.querySelector('.lightbox-caption strong');
    var lbMeta = lightbox.querySelector('.lightbox-caption span');
    var openLightbox = function (card) {
      var el;
      if (card.dataset.media === 'video') {
        el = document.createElement('video');
        el.src = card.getAttribute('href');
        var thumb = card.querySelector('img');
        el.poster = card.dataset.poster || (thumb ? thumb.getAttribute('src') : '');
        el.controls = true; el.autoplay = true; el.playsInline = true;
      } else {
        el = document.createElement('img');
        el.src = card.getAttribute('href');
        el.alt = card.dataset.title;
      }
      lbMedia.replaceChildren(el);
      lbTitle.textContent = card.dataset.title;
      lbMeta.textContent = card.dataset.meta;
      lightbox.showModal();
    };
    document.querySelectorAll('a[data-media]').forEach(function (card) {
      card.addEventListener('click', function (e) { e.preventDefault(); openLightbox(card); });
    });
    // stop the video and empty the viewer, whichever way it is closed
    var clearLightbox = function () {
      var v = lbMedia.querySelector('video');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      lbMedia.replaceChildren();
    };
    var closeLightbox = function () { clearLightbox(); if (lightbox.open) lightbox.close(); };
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    // click on the dimmed backdrop closes it too
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    lightbox.addEventListener('close', clearLightbox); // Esc key
  }

  // Page background: feed scroll position (parallax) and cursor position (glow) to CSS.
  // Set on .page-bg only, so the rest of the page is not restyled on every scroll.
  var bg = document.querySelector('.page-bg');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false, mx = null, my = null;
  function paint() {
    ticking = false;
    if (!reduceMotion) bg.style.setProperty('--sy', String(window.scrollY));
    if (mx !== null) {
      bg.style.setProperty('--mx', mx + 'px');
      bg.style.setProperty('--my', my + 'px');
    }
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', request, { passive: true });

  // Fixed header: reserve its height above the hero, and switch to the
  // frosted bar once the page has scrolled a little.
  var header = document.querySelector('.site-header');
  function sizeHeader() {
    if (!header.classList.contains('is-scrolled')) {
      root.style.setProperty('--header-h', header.getBoundingClientRect().height + 'px');
    }
  }
  function onScrollHeader() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  window.addEventListener('resize', sizeHeader);
  sizeHeader();
  if (document.fonts) document.fonts.ready.then(sizeHeader); // logo font changes the height
  onScrollHeader();

  // Underline the nav link of the section currently on screen.
  if ('IntersectionObserver' in window) {
    var navLinks = document.querySelectorAll('.nav a');
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'work', 'about', 'contact'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navIO.observe(el);
    });
  }
  window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; request(); });
  paint();

  // Scroll reveal: content fades up as it enters the viewport and fades out
  // as it leaves (upward through the top, downward through the bottom).
  // Items in the same group (cards, rows) come in one after another.
  if ('IntersectionObserver' in window) {
    root.classList.add('js');
    var groups = [
      '.role-col', // the badge is left out on purpose: it always stays visible
      '.sec-head', '.sub-title', '.about-text',
      '.folders', '.tools-line', '.stack-card', '.proj', '.facts > div',
      '.contact > *', '.site-footer'
    ];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          el.classList.add('is-in');
          el.classList.remove('is-above');
        } else if (e.rootBounds) {
          el.classList.remove('is-in');
          el.classList.toggle('is-above', e.boundingClientRect.top < e.rootBounds.top);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.setProperty('--delay', Math.min(i, 5) * 0.08 + 's');
        el.classList.add('reveal');
        io.observe(el);
      });
    });
  }
})();
