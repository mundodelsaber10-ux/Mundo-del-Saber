// ============================================================
// js/utils.js
// Utilidades globales — se incluye en todas las páginas
// ============================================================

// ── NAVEGACIÓN ────────────────────────────────────────────
window.irA = function(url) {
  window.location.href = url;
};

window.volver = function() {
  if (history.length > 1) history.back();
  else window.location.href = '/index.html';
};

// ── TOAST ─────────────────────────────────────────────────
(function() {
  const contenedor = document.createElement('div');
  contenedor.id = 'toast-container';
  document.body.appendChild(contenedor);

  window.toast = function(mensaje, tipo = 'info', duracion = 3000) {
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.textContent = mensaje;
    contenedor.appendChild(el);

    setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 350);
    }, duracion);
  };
})();

// ── LOADER ────────────────────────────────────────────────
window.mostrarLoader = function(texto = 'Cargando...') {
  let loader = document.getElementById('loader-global');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loader-global';
    loader.className = 'loader-pantalla';
    loader.innerHTML = `
      <div class="spinner"></div>
      <p class="text-muted text-sm" id="loader-texto">${texto}</p>
    `;
    document.body.appendChild(loader);
  } else {
    document.getElementById('loader-texto').textContent = texto;
    loader.classList.remove('oculto');
  }
};

window.ocultarLoader = function() {
  const loader = document.getElementById('loader-global');
  if (loader) {
    loader.classList.add('oculto');
  }
};

// ── PARÁMETROS DE URL ─────────────────────────────────────
window.getParam = function(nombre) {
  return new URLSearchParams(window.location.search).get(nombre);
};

// ── FORMATEO DE FECHA ─────────────────────────────────────
window.formatearFecha = function(iso) {
  const d = new Date(iso);
  const ahora = new Date();
  const diff  = Math.floor((ahora - d) / 1000);

  if (diff < 60)   return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)return `Hace ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

// ── ANIMACIONES ESCALONADAS ───────────────────────────────
window.animarEscalonado = function(selector, retrasoPorItem = 80) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.animationDelay = `${i * retrasoPorItem}ms`;
  });
};

// ── DEBOUNCE ──────────────────────────────────────────────
window.debounce = function(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// ── VIBRACIÓN TÁCTIL (feedback en móvil) ──────────────────
window.vibrar = function(patron = [10]) {
  if ('vibrate' in navigator) navigator.vibrate(patron);
};

// ── DETECTAR CONEXIÓN ─────────────────────────────────────
window.estaOnline = function() {
  return navigator.onLine;
};

window.addEventListener('offline', () => {
  toast('Sin conexión — modo offline activo', 'info', 4000);
});
window.addEventListener('online', () => {
  toast('Conexión restaurada', 'ok', 2500);
});

// ── GUARDAR / LEER LOCAL (fallback offline) ───────────────
window.guardarLocal = function(clave, datos) {
  try {
    localStorage.setItem(`mimundo_${clave}`, JSON.stringify(datos));
  } catch(e) { console.warn('localStorage no disponible'); }
};

window.leerLocal = function(clave, porDefecto = null) {
  try {
    const val = localStorage.getItem(`mimundo_${clave}`);
    return val ? JSON.parse(val) : porDefecto;
  } catch(e) { return porDefecto; }
};
