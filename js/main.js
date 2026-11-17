(function () {
  "use strict";
  var cfg = window.RB_CONFIG || {};
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Selector de paleta (misma página, distinto color) ---------- */
  var buttons = document.querySelectorAll("[data-set]");
  var bgOf = { champan: "#0C0B0A", burdeos: "#0D0B0B", acero: "#050505", oliva: "#0B0C0A" };

  function paintButtons(p) {
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.set === p)); });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = bgOf[p];
  }

  function setPalette(p) {
    var cur = root.dataset.palette || "champan";
    if (!bgOf[p] || cur === p) return;
    if (!reduce) root.classList.add("theming");
    if (p === "champan") delete root.dataset.palette; else root.dataset.palette = p;
    paintButtons(p);
    setTimeout(function () { root.classList.remove("theming"); }, 450);
    var url = new URL(location.href);
    if (p === "champan") url.searchParams.delete("p"); else url.searchParams.set("p", p);
    history.replaceState(null, "", url);
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { setPalette(b.dataset.set); });
  });
  paintButtons(root.dataset.palette || "champan");

  /* ---------- Fachada de YouTube ---------- */
  var yt = document.querySelector("[data-yt]");
  if (yt) {
    yt.querySelector("button").addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + (cfg.youtubeId || "0SsaJCqrwPs") + "?autoplay=1&rel=0&modestbranding=1";
      f.title = cfg.youtubeTitle || "Vídeo de Rodrigo Bermejo";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      yt.appendChild(f);
      yt.closest(".hero").classList.add("is-playing");
      f.focus();
    }, { once: true });
  }

  /* ---------- Regla de 90 días ---------- */
  var svg = document.querySelector(".ruler__svg");
  if (svg) {
    var NS = "http://www.w3.org/2000/svg";
    var x = function (d) { return 6 + (d / 90) * 348; };
    var add = function (g, tag, attrs) {
      var el = document.createElementNS(NS, tag);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      svg.querySelector(g).appendChild(el);
      return el;
    };
    for (var d = 5; d < 90; d += 5) add(".r-minor", "line", { x1: x(d), x2: x(d), y1: 27, y2: 33 });
    [14, 28, 42, 56, 70, 84].forEach(function (d) { add(".r-check", "circle", { cx: x(d), cy: 30, r: 4 }); });
    [30, 60, 90].forEach(function (d) { add(".r-review", "rect", { x: x(d) - 2, y: 18, width: 4, height: 24 }); });
    [[0, "Día 0"], [30, "30"], [60, "60"], [90, "90"]].forEach(function (p) {
      var t = add(".r-labels", "text", { x: x(p[0]), y: 60, "text-anchor": p[0] === 0 ? "start" : p[0] === 90 ? "end" : "middle" });
      t.textContent = p[1];
    });
  }

  /* ---------- Contadores (el momento de movimiento de la página) ---------- */
  var fmt = new Intl.NumberFormat("es-ES", { useGrouping: "always" }); // es-ES no agrupa 4 cifras por defecto
  function count(el) {
    var end = +el.dataset.count, t0 = null, dur = 1400;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(2, -10 * p); // ease-out exponencial
      el.textContent = fmt.format(Math.round(end * (p === 1 ? 1 : e)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { count(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    var below = [].filter.call(counters, function (c) { return c.getBoundingClientRect().top > innerHeight; });
    below.forEach(function (c) { c.textContent = "0"; });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    var groups = [".creds__list li", ".figure", ".method__head > *", ".ruler", ".phase", ".incl__star", ".incl__list li",
      ".ba", ".quote", ".vid", ".modes__row", ".modes__photo", ".phone", ".faq details", ".apply__head"];
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    // Primero se leen todas las posiciones y después se escribe: así el navegador calcula el diseño una sola vez.
    var pending = [];
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.getBoundingClientRect().top >= innerHeight) pending.push([el, i % 4]); // lo que ya se ve no se esconde
      });
    });
    pending.forEach(function (p) {
      p[0].style.setProperty("--i", p[1]);
      p[0].classList.add("rv");
      rio.observe(p[0]);
    });
  }

  /* ---------- Vídeos del canal: el iframe solo se carga al pulsar ---------- */
  document.querySelectorAll("[data-video]").forEach(function (box) {
    var btn = box.querySelector("button");
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + box.dataset.video + "?autoplay=1&rel=0&modestbranding=1";
      f.title = btn.getAttribute("aria-label").replace("Ver vídeo: ", "");
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      box.appendChild(f);
      btn.remove();
      f.focus();
    }, { once: true });
  });

  /* ---------- Antes y después ---------- */
  var ba = document.querySelector("[data-ba]");
  if (ba) {
    var range = ba.querySelector("input"), frame = ba.querySelector(".ba__frame");
    range.addEventListener("input", function () { frame.style.setProperty("--pos", range.value + "%"); });
  }

  /* ---------- Solicitud por WhatsApp (sin servidor: el mensaje se arma aquí y lo envía el usuario) ---------- */
  var form = document.querySelector("[data-form]");
  if (form) {
    var number = String(cfg.whatsapp || "34620607472").replace(/\D/g, "");
    form.action = "https://wa.me/" + number;
    var steps = [].slice.call(form.querySelectorAll("[data-step]"));
    var stepNo = form.querySelector("[data-step-no]"), bar = form.querySelector("[data-progress]");
    var err = form.querySelector("[data-error]");
    var back = form.querySelector("[data-back]"), next = form.querySelector("[data-next]"), send = form.querySelector("[data-submit]");
    var cur = 0;
    form.classList.add("is-stepped");

    var show = function (i, focus) {
      cur = i;
      steps.forEach(function (s, j) { s.classList.toggle("is-current", j === i); });
      stepNo.textContent = "Paso " + (i + 1) + " de " + steps.length;
      bar.style.width = ((i + 1) / steps.length) * 100 + "%";
      back.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      send.hidden = !next.hidden;
      err.textContent = "";
      if (focus) {
        var top = form.getBoundingClientRect().top;
        if (top < 0) window.scrollBy({ top: top - 16, behavior: reduce ? "instant" : "smooth" });
        var first = steps[i].querySelector("input:checked") || steps[i].querySelector("input");
        if (first) first.focus({ preventScroll: true });
      }
    };

    var labelOf = function (el) {
      var l = el.closest("label");
      return l && l.querySelector("span") ? l.querySelector("span").textContent.toLowerCase() : "este dato";
    };
    var check = function (i) {
      var inputs = [].slice.call(steps[i].querySelectorAll("input"));
      inputs.forEach(function (el) { el.removeAttribute("aria-invalid"); });
      for (var k = 0; k < inputs.length; k++) {
        var el = inputs[k];
        if (el.checkValidity()) continue;
        if (el.type === "radio") err.textContent = "Elige una opción para continuar.";
        else if (el.validity.valueMissing) err.textContent = "Falta tu " + labelOf(el).replace(/ \(.*\)/, "") + ".";
        else err.textContent = "Revisa tu " + labelOf(el).replace(/ \(.*\)/, "") + ": parece que no es correcto.";
        if (el.type !== "radio") el.setAttribute("aria-invalid", "true");
        el.focus();
        return false;
      }
      err.textContent = "";
      return true;
    };

    next.addEventListener("click", function () { if (check(cur)) show(cur + 1, true); });
    back.addEventListener("click", function () { show(cur - 1, true); });
    // Al elegir una opción en un paso de una sola pregunta, avanza solo.
    form.addEventListener("change", function (e) {
      if (e.target.type !== "radio" || cur === steps.length - 1) return;
      if (steps[cur].querySelectorAll("input:not([type=radio])").length) return;
      setTimeout(function () { if (check(cur)) show(cur + 1, true); }, 220);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (cur < steps.length - 1) { if (check(cur)) show(cur + 1, true); return; } // Intro en un campo = siguiente
      for (var i = 0; i < steps.length; i++) if (!check(i)) { show(i, true); check(i); return; }
      var v = function (n) { var el = form.elements[n]; return (el.value || "").trim(); };
      var text = [
        "Hola Rodrigo, quiero solicitar plaza en el Plan Fitness 90 Días.",
        "",
        "Nombre: " + v("nombre"),
        "Edad: " + v("edad"),
        "Objetivo: " + v("objetivo"),
        "Peso: " + v("peso").replace(".", ",") + " kg · Altura: " + v("altura") + " cm",
        "Experiencia: " + v("experiencia"),
        "Días disponibles: " + v("dias") + " por semana",
        "Modalidad: " + v("modalidad")
      ].join("\n");
      var url = "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
      var w = window.open(url, "_blank");
      if (w) w.opener = null; else location.href = url;
    });

    show(0, false);
  }

  /* ---------- Objetos 3D: flotan y giran un poco según su paso por la pantalla ---------- */
  var floats = document.querySelectorAll("[data-float]");
  if (!reduce && floats.length) {
    var fTick = false;
    var paintFloats = function () {
      var rects = [].map.call(floats, function (el) { return el.getBoundingClientRect(); });
      floats.forEach(function (el, i) {
        var r = rects[i];
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        var p = (r.top + r.height / 2) / innerHeight - 0.5; // -0.5 arriba … 0.5 abajo
        var dir = i % 2 ? -1 : 1;
        el.style.setProperty("--fy", (p * -90).toFixed(1) + "px");
        el.style.setProperty("--fr", (p * 14 * dir).toFixed(2) + "deg");
      });
      fTick = false;
    };
    addEventListener("scroll", function () { if (!fTick) { fTick = true; requestAnimationFrame(paintFloats); } }, { passive: true });
    paintFloats();
  }

  /* ---------- Parallax suave de la foto de portada ---------- */
  var heroYt = document.querySelector(".hero .yt");
  if (!reduce && heroYt) {
    var ticking = false;
    addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(scrollY, innerHeight);
        heroYt.style.setProperty("--py", (y * 0.18).toFixed(1) + "px");
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Botón fijo: aparece cuando el de la portada sale de pantalla ---------- */
  var heroCta = document.querySelector("[data-hero-cta]");
  var dockCta = document.querySelector("[data-dock-cta]");
  var applySec = document.getElementById("solicitud");
  if (heroCta && dockCta) {
    var onScroll = function () {
      var a = applySec ? applySec.getBoundingClientRect() : null;
      var inApply = a && a.top < innerHeight * 0.85 && a.bottom > 0; // en la solicitud sobra
      dockCta.hidden = heroCta.getBoundingClientRect().bottom > 0 || inApply;
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
