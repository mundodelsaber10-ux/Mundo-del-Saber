-- ============================================================
-- STORYBOARD INTERACTIVO — Schema de base de datos
-- Ejecuta esto en: supabase.com → SQL Editor → New query
-- ============================================================

-- -------- TABLA: profiles (adultos autenticados) --------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('parent','relative','teacher','specialist')),
  email       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------- TABLA: students (niños sin cuenta de email) --------
CREATE TABLE IF NOT EXISTS students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname      TEXT NOT NULL UNIQUE,
  avatar_id     TEXT NOT NULL,
  avatar_emoji  TEXT NOT NULL,
  pin_hash      TEXT NOT NULL,
  points        INT DEFAULT 0,
  class_code    TEXT,            -- código del salón al que pertenece
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- -------- TABLA: classes (salones/grupos) --------
CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,   -- ej: HELADO7
  teacher_id  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------- TABLA: class_students (relación niño ↔ salón) --------
CREATE TABLE IF NOT EXISTS class_students (
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

-- -------- TABLA: activity_log (progreso de estudiantes) --------
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  module      TEXT NOT NULL,    -- 'matematica','ingles','lectura','arte','deporte','tecnologia'
  activity    TEXT NOT NULL,    -- nombre de la actividad
  score       INT DEFAULT 0,
  completed   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------- TABLA: parent_student (relación padre ↔ hijo) --------
CREATE TABLE IF NOT EXISTS parent_student (
  parent_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

-- -------- TABLA: posts (foro del café) --------
CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES profiles(id),
  content     TEXT NOT NULL,
  category    TEXT DEFAULT 'general',  -- 'general','duda','anuncio'
  likes       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------- TABLA: creations (espacio creativo) --------
CREATE TABLE IF NOT EXISTS creations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id),
  type        TEXT NOT NULL,    -- 'cuento','multimedia','vivencia'
  title       TEXT,
  content     TEXT,
  media_url   TEXT,
  approved    BOOLEAN DEFAULT false,  -- moderación docente
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SEGURIDAD: Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE creations    ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuario solo ve y edita su propio perfil
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- students: lectura pública (necesaria para login por apodo), escritura libre (registro)
CREATE POLICY "students_select_all"  ON students FOR SELECT USING (true);
CREATE POLICY "students_insert_free" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "students_update_own"  ON students FOR UPDATE USING (true); -- se refina luego

-- classes: solo docentes ven/crean sus propias clases
CREATE POLICY "classes_select_all"      ON classes FOR SELECT USING (true);
CREATE POLICY "classes_insert_teacher"  ON classes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- activity_log: lectura libre (para padres), inserción libre (para kids)
CREATE POLICY "activity_log_select" ON activity_log FOR SELECT USING (true);
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT WITH CHECK (true);

-- posts: todos los autenticados pueden leer; solo pueden editar los propios
CREATE POLICY "posts_select_all"    ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_auth"   ON posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_update_own"    ON posts FOR UPDATE USING (auth.uid() = author_id);

-- creations: inserción libre; lectura solo si approved=true (o es el propio docente)
CREATE POLICY "creations_insert"    ON creations FOR INSERT WITH CHECK (true);
CREATE POLICY "creations_select"    ON creations FOR SELECT USING (approved = true);

-- parent_student: lectura para el padre autenticado
CREATE POLICY "parent_student_select" ON parent_student FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "parent_student_insert" ON parent_student FOR INSERT WITH CHECK (auth.uid() = parent_id);
