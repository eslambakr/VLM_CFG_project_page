/* Contrastive Decoding Is Classifier-Free Guidance - project page behaviour.
   Math rendering, the model tabs of the main table, table-of-contents
   scroll-spy, reading progress, figure lightbox and BibTeX copy. No
   dependencies beyond KaTeX, which is optional: the page works without it. */
(function () {
  'use strict';

  /* ---------- math ---------- */
  if (window.renderMathInElement) {
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  }

  /* ---------- placeholder links (paper / code not out yet) ---------- */
  document.querySelectorAll('.is-pending').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- model tabs: one <tbody> per model ---------- */
  document.querySelectorAll('.tabs[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[k]) panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { select(k); });
    });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
    });

    var start = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    select(start < 0 ? 0 : start);
  });

  /* ---------- table of contents: scroll-spy ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc ol a[href^="#"]'));
  var targets = tocLinks.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });
  var bar = document.getElementById('progress-bar');
  var ticking = false;

  function update() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';

    var idx = -1;
    var line = Math.min(160, window.innerHeight * 0.3);
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].getBoundingClientRect().top - line <= 0) idx = i;
    }
    if (max > 0 && window.scrollY >= max - 2) idx = targets.length - 1;

    tocLinks.forEach(function (a, i) { a.classList.toggle('active', i === idx); });
    var activeLink = tocLinks[idx];
    document.querySelectorAll('.toc li').forEach(function (li) {
      li.classList.toggle('open', !!activeLink && li.contains(activeLink));
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* ---------- mobile table of contents ---------- */
  var toc = document.getElementById('toc');
  var toggle = document.getElementById('toc-toggle');
  var scrim = document.getElementById('scrim');
  function setToc(open) {
    toc.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    scrim.hidden = !open;
  }
  if (toc && toggle && scrim) {
    toggle.addEventListener('click', function () { setToc(!toc.classList.contains('open')); });
    scrim.addEventListener('click', function () { setToc(false); });
    toc.addEventListener('click', function (e) {
      if (e.target.closest('a') && toc.classList.contains('open')) setToc(false);
    });
  }

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = lb && lb.querySelector('img');
  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('img.zoomable').forEach(function (img) {
    img.addEventListener('click', function () {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lightbox-close').focus();
    });
  });
  if (lb) lb.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeLightbox();
    if (toc && toc.classList.contains('open')) setToc(false);
  });

  /* ---------- BibTeX copy ---------- */
  var copyBtn = document.getElementById('copy-bib');
  var bibText = document.getElementById('bib-text');
  if (copyBtn && bibText) {
    copyBtn.addEventListener('click', function () {
      var text = bibText.textContent;
      function done() {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1600);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var range = document.createRange();
        range.selectNodeContents(bibText);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try { document.execCommand('copy'); done(); } catch (e) { /* leave it selected */ }
      }
    });
  }
})();
