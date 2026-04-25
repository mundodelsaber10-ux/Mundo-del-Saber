// ============================================================
// js/modules/supabase.js
// Cliente Supabase — importar en todas las páginas que necesiten DB
// ============================================================
//
// CONFIGURACIÓN: Reemplaza los valores de abajo con los de tu proyecto.
// Los encuentras en: Supabase Dashboard → Settings → API
//
// IMPORTANTE: Estas claves son "anon keys" (públicas por diseño).
// La seguridad real la dan las políticas RLS del schema SQL.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';   // ← reemplazar
const SUPABASE_KEY  = 'TU_ANON_KEY_AQUI';                  // ← reemplazar

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
  },
});

// ── HELPERS DE AUTENTICACIÓN ──────────────────────────────

/** Devuelve el usuario activo o null */
export async function getUsuario() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Devuelve el perfil completo del usuario activo */
export async function getPerfil(userId = null) {
  const id = userId ?? (await getUsuario())?.id;
  if (!id) return null;

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) { console.error('Error al obtener perfil:', error); return null; }
  return data;
}

/** Registra un adulto (padre / docente) con email+contraseña */
export async function registrarAdulto({ email, password, nombre, rol, codigoSalon }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, rol, codigo_salon: codigoSalon ?? null },
    },
  });
  return { data, error };
}

/** Login adulto */
export async function loginAdulto(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

/**
 * Registro de estudiante (sin email real).
 * Genera un email ficticio a partir del apodo + código de salón.
 * El PIN se hashea con SHA-256 antes de guardarse.
 */
export async function registrarEstudiante({ apodo, pin, avatar, codigoSalon }) {
  const emailFicticio = `${apodo.toLowerCase().replace(/\s+/g, '')}_${codigoSalon}@mimundo.edu`;
  const pinHash = await sha256(pin);

  // Primero registrar en auth con contraseña derivada del pin
  const { data, error } = await supabase.auth.signUp({
    email:    emailFicticio,
    password: `${pin}_${codigoSalon}_mimundo`,
    options: {
      data: {
        nombre:       apodo,
        apodo:        apodo,
        rol:          'estudiante',
        avatar:       avatar,
        pin_hash:     pinHash,
        codigo_salon: codigoSalon,
      },
    },
  });

  return { data, error };
}

/**
 * Login de estudiante por apodo + PIN + código de salón.
 * Reconstruye el email ficticio para autenticar.
 */
export async function loginEstudiante(apodo, pin, codigoSalon) {
  const emailFicticio = `${apodo.toLowerCase().replace(/\s+/g, '')}_${codigoSalon}@mimundo.edu`;
  const password      = `${pin}_${codigoSalon}_mimundo`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    emailFicticio,
    password: password,
  });

  return { data, error };
}

/** Cierra sesión */
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

/** Guarda puntos de actividad en la tabla progreso */
export async function guardarProgreso({ materia, actividad, puntos, datos_extra = {} }) {
  const usuario = await getUsuario();
  if (!usuario) return { error: 'No autenticado' };

  const { data, error } = await supabase
    .from('progreso')
    .insert({
      estudiante_id: usuario.id,
      materia,
      actividad,
      puntos,
      completado: true,
      datos_extra,
    });

  return { data, error };
}

/** Obtiene el progreso total del estudiante activo */
export async function getProgreso() {
  const usuario = await getUsuario();
  if (!usuario) return [];

  const { data } = await supabase
    .from('progreso')
    .select('materia, puntos, actividad, created_at')
    .eq('estudiante_id', usuario.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}

// ── UTILIDADES ────────────────────────────────────────────

/** Hash SHA-256 (para PINs) */
async function sha256(texto) {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(texto)
  );
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
