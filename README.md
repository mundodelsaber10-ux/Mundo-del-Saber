# 🌟 Storyboard Interactivo — Guía de inicio

## Estructura del proyecto

```
storyboard/
├── index.html                  ← Pantalla de inicio (selección de rol)
├── css/
│   └── styles.css              ← Sistema de estilos global
├── js/
│   └── supabase.js             ← Cliente y utilidades compartidas
├── pages/
│   ├── login-estudiante.html   ← Login/Registro de niños
│   ├── login-adulto.html       ← Login/Registro de padres y docentes
│   ├── heladeria.html          ← (Próximo módulo)
│   ├── cafe.html               ← (Próximo módulo)
│   └── docente.html            ← (Próximo módulo)
└── supabase-schema.sql         ← Base de datos completa
```

---

## ⚙️ Pasos de configuración (hazlo una sola vez)

### 1. Crear cuenta en Supabase (gratis)
1. Ve a [supabase.com](https://supabase.com) → **Start for free**
2. Crea un proyecto nuevo (elige nombre y contraseña de DB)
3. Espera ~2 minutos a que el proyecto inicie

### 2. Ejecutar el schema SQL
1. En tu proyecto de Supabase → **SQL Editor** → **New query**
2. Pega TODO el contenido de `supabase-schema.sql`
3. Haz clic en **Run**
4. Verifica en **Table Editor** que aparecen las tablas: `profiles`, `students`, `classes`, etc.

### 3. Conectar el proyecto web
1. En Supabase → **Project Settings** → **API**
2. Copia:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **anon public** key (la llave larga)
3. Abre `js/supabase.js` y reemplaza:
   ```js
   const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';
   const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';
   ```

### 4. Cambiar el código institucional (opcional)
En `pages/login-adulto.html`, línea ~180:
```js
const CODIGO_INSTITUCIONAL = 'STORYBOARD2024';
```
Cámbialo por un código secreto que solo la dirección de la escuela sepa.

### 5. Activar confirmación de email (recomendado)
En Supabase → **Authentication** → **Email** → Desactiva **Confirm email** si quieres que los padres puedan entrar sin confirmar (más fácil para empezar).

---

## 🚀 Cómo abrir el proyecto localmente

**Opción A — Live Server (recomendado):**
- Instala la extensión **Live Server** en VS Code
- Clic derecho en `index.html` → **Open with Live Server**

**Opción B — Python:**
```bash
python -m http.server 8000
# Abre: http://localhost:8000
```

**Opción C — Abrir directamente:**
- Solo arrastra `index.html` al navegador
- ⚠️ Supabase puede fallar con `file://`, mejor usa Live Server

---

## 🌐 Deploy gratuito en Vercel

1. Crea cuenta en [vercel.com](https://vercel.com)
2. Sube la carpeta del proyecto a GitHub
3. En Vercel → **Add New Project** → importa tu repo
4. Deploy en 1 clic → obtienes una URL pública tipo `storyboard.vercel.app`

---

## 📋 Módulos completados y próximos

| Módulo                  | Estado       |
|-------------------------|--------------|
| Sistema de estilos      | ✅ Listo     |
| Pantalla de inicio      | ✅ Listo     |
| Login estudiantes       | ✅ Listo     |
| Login adultos           | ✅ Listo     |
| Schema de base de datos | ✅ Listo     |
| **La Heladería**        | 🔜 Siguiente |
| El Café (padres)        | 🔜 Pendiente |
| Espacio Creativo        | 🔜 Pendiente |
| Panel Docente           | 🔜 Pendiente |
| Juegos educativos       | 🔜 Pendiente |

---

## 🔒 Nota de seguridad

El PIN de los niños se guarda codificado con `btoa()` (Base64). Esto es suficiente para una plataforma escolar básica, pero en una versión de producción avanzada se debería usar un hash real como `bcrypt`. Por ahora es funcional y suficiente para el proyecto.
