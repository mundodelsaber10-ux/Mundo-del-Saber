/* ============================================
   supabase.js — Configuración y cliente
   INSTRUCCIÓN: Reemplaza los valores de
   SUPABASE_URL y SUPABASE_ANON_KEY con los
   de tu proyecto en supabase.com
   ============================================ */

// ⚠️ CAMBIA ESTOS DOS VALORES con los tuyos de supabase.com → Project Settings → API
const SUPABASE_URL      = 'https://ikrxhfxbwjsklezxzrtt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcnhoZnhid2pza2xlenh6cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzQ3MjAsImV4cCI6MjA5MjcxMDcyMH0._yhufHn5_oTLIIO5e6vkay94f1RVMRj9JY5TMuYodHk';

// Inicializa el cliente de Supabase (cargado via CDN en cada HTML)
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================
   UTILIDADES GLOBALES
   ============================================ */

/** Muestra un toast de notificación */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/** Oculta el loader de página inicial */
function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.add('hidden');
}

/** Muestra/oculta spinner en un botón */
function setButtonLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner"></div>`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

/** Redirige según el rol guardado en sesión */
async function redirectByRole() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    // Sin sesión de adulto → puede ser un niño (sesión local)
    const kidSession = getKidSession();
    if (kidSession) {
      window.location.href = 'pages/heladeria.html';
      return;
    }
    window.location.href = 'index.html';
    return;
  }

  // Sesión de adulto activa
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile) { window.location.href = 'index.html'; return; }

  switch (profile.role) {
    case 'parent':   window.location.href = 'pages/cafe.html';   break;
    case 'teacher':  window.location.href = 'pages/docente.html'; break;
    case 'specialist': window.location.href = 'pages/cafe.html'; break;
    default:         window.location.href = 'index.html';
  }
}

/* ============================================
   SESIÓN DE NIÑOS (localStorage — sin cuenta)
   ============================================ */

const KID_KEY = 'sb_kid_session';

function saveKidSession(data) {
  localStorage.setItem(KID_KEY, JSON.stringify(data));
}

function getKidSession() {
  try {
    return JSON.parse(localStorage.getItem(KID_KEY));
  } catch { return null; }
}

function clearKidSession() {
  localStorage.removeItem(KID_KEY);
}

/* ============================================
   AVATARES DISPONIBLES PARA NIÑOS
   ============================================ */
const AVATARS = [
  { id: 'oso',      emoji: '🐻', label: 'Osito' },
  { id: 'zorro',    emoji: '🦊', label: 'Zorrito' },
  { id: 'rana',     emoji: '🐸', label: 'Ranita' },
  { id: 'leon',     emoji: '🦁', label: 'León' },
  { id: 'pinguino', emoji: '🐧', label: 'Pingüino' },
  { id: 'pulpo',    emoji: '🐙', label: 'Pulpito' },
  { id: 'unicornio',emoji: '🦄', label: 'Unicornio' },
  { id: 'dragon',   emoji: '🐲', label: 'Dragón' },
  { id: 'robot',    emoji: '🤖', label: 'Robotín' },
];
