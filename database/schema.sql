-- ============================================
-- COMPLETE DATABASE SCHEMA FOR CBT PLATFORM
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS & PROFILES (Student Management)
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vin_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  
  -- Student specific fields
  student_class TEXT CHECK (student_class IN ('JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3')),
  student_category TEXT CHECK (student_category IN ('junior', 'senior-science', 'senior-arts')),
  admission_number TEXT UNIQUE,
  cbt_access_id TEXT UNIQUE,
  
  -- Personal Information
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  
  -- Guardian Information
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  guardian_relationship TEXT,
  
  -- Teacher specific fields
  teacher_department TEXT,
  teacher_qualification TEXT,
  hire_date DATE,
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CLASSES & SECTIONS
-- ============================================

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('junior', 'senior-science', 'senior-arts')),
  level TEXT CHECK (level IN ('JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3')),
  capacity INTEGER DEFAULT 40,
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('active', 'transferred', 'graduated', 'dropped')) DEFAULT 'active',
  UNIQUE(class_id, student_id, academic_year)
);

-- ============================================
-- 3. SUBJECTS & CURRICULUM
-- ============================================

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('junior', 'senior-science', 'senior-arts')),
  description TEXT,
  credit_hours INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects by class
CREATE TABLE class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  is_compulsory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, subject_id)
);

-- ============================================
-- 4. EXAMS & ASSESSMENTS
-- ============================================

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  class_id UUID REFERENCES classes(id),
  category TEXT CHECK (category IN ('junior', 'senior-science', 'senior-arts')),
  duration INTEGER NOT NULL, -- in minutes
  total_questions INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  passing_score INTEGER DEFAULT 50,
  instructions TEXT,
  
  -- Exam Settings
  status TEXT CHECK (status IN ('draft', 'published', 'archived', 'scheduled')) DEFAULT 'draft',
  exam_type TEXT CHECK (exam_type IN ('practice', 'mock', 'main', 'retake')) DEFAULT 'main',
  is_practice BOOLEAN DEFAULT false,
  requires_access_code BOOLEAN DEFAULT false,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  negative_marking BOOLEAN DEFAULT false,
  negative_marking_value DECIMAL(3,2) DEFAULT 0,
  
  -- Scheduling
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. QUESTIONS & ANSWERS
-- ============================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('objective', 'theory', 'true-false', 'matching')) DEFAULT 'objective',
  
  -- Options for objective questions
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  option_e TEXT,
  
  -- Correct answer(s)
  correct_answer TEXT,
  correct_answer_explanation TEXT,
  
  -- Question metadata
  points INTEGER DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. EXAM ATTEMPTS & SUBMISSIONS
-- ============================================

CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES profiles(id),
  
  -- Answers & Scoring
  answers JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  grade TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent INTEGER, -- in seconds
  
  -- Security
  tab_switches INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  is_auto_submitted BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT CHECK (status IN ('in-progress', 'submitted', 'grading', 'graded')) DEFAULT 'in-progress',
  
  -- Unique constraint: one attempt per exam per student
  UNIQUE(exam_id, student_id)
);

-- Theory Answers (for manual grading)
CREATE TABLE theory_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  answer_text TEXT,
  points_awarded INTEGER DEFAULT 0,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  feedback TEXT
);

-- ============================================
-- 7. ASSIGNMENTS & HOMEWORK
-- ============================================

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  class_id UUID REFERENCES classes(id),
  
  -- Assignment details
  instructions TEXT,
  total_points INTEGER DEFAULT 100,
  due_date TIMESTAMPTZ,
  
  -- Files
  file_url TEXT,
  attachment_urls TEXT[],
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  file_url TEXT,
  submission_text TEXT,
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id),
  UNIQUE(assignment_id, student_id)
);

-- ============================================
-- 8. NOTIFICATIONS & MESSAGES
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('exam_published', 'exam_reminder', 'submission_received', 'result_ready', 'grading_completed', 'assignment_uploaded', 'assignment_graded', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. ACCESS CODES (for restricted exams)
-- ============================================

CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id),
  code VARCHAR(20) NOT NULL,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, code)
);

-- ============================================
-- 10. ANALYTICS & LOGS
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Generate VIN ID (Vincollins Identification Number)
CREATE OR REPLACE FUNCTION generate_vin_id()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_vin_id TEXT;
  year_prefix TEXT;
BEGIN
  -- Get current academic year
  year_prefix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(vin_id FROM 9) AS INTEGER)), 0) + 1 
  INTO next_number
  FROM profiles 
  WHERE vin_id LIKE 'VIN-' || year_prefix || '-%';
  
  -- Format: VIN-24-0001
  new_vin_id := 'VIN-' || year_prefix || '-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.vin_id := new_vin_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate CBT Access ID
CREATE OR REPLACE FUNCTION generate_cbt_access_id()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_access_id TEXT;
BEGIN
  -- Get next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(cbt_access_id FROM 9) AS INTEGER)), 0) + 1 
  INTO next_number
  FROM profiles 
  WHERE cbt_access_id LIKE 'CBT-%';
  
  -- Format: CBT-0001
  new_access_id := 'CBT-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.cbt_access_id := new_access_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate Admission Number
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_admission TEXT;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(admission_number FROM 7) AS INTEGER)), 0) + 1 
  INTO next_number
  FROM profiles 
  WHERE admission_number LIKE 'ADM-' || year_prefix || '-%';
  
  new_admission := 'ADM-' || year_prefix || '-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.admission_number := new_admission;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_vin_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'student')
  EXECUTE FUNCTION generate_vin_id();

CREATE TRIGGER set_cbt_access_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'student')
  EXECUTE FUNCTION generate_cbt_access_id();

CREATE TRIGGER set_admission_number
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'student')
  EXECUTE FUNCTION generate_admission_number();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Teachers can view students in their class"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_subjects cs
      JOIN classes c ON cs.class_id = c.id
      WHERE c.teacher_id = auth.uid()
      AND profiles.role = 'student'
    )
  );

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Exams policies
CREATE POLICY "Students can view published exams for their level"
  ON exams FOR SELECT
  USING (
    status = 'published' 
    AND (
      scheduled_start IS NULL 
      OR scheduled_start <= NOW()
    )
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND student_category = category
    )
  );

CREATE POLICY "Teachers can manage their exams"
  ON exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
      AND (created_by = auth.uid() OR role = 'admin')
    )
  );

-- Exam attempts policies
CREATE POLICY "Students can view their own attempts"
  ON exam_attempts FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can create attempts"
  ON exam_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their exams"
  ON exam_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_id
      AND e.created_by = auth.uid()
    )
  );

-- ============================================
-- INSERT INITIAL DATA
-- ============================================

-- Insert subjects for Junior Secondary
INSERT INTO subjects (name, code, category) VALUES
('Mathematics', 'MAT-JSS', 'junior'),
('English Studies', 'ENG-JSS', 'junior'),
('Basic Science', 'BSC-JSS', 'junior'),
('Basic Technology', 'BTE-JSS', 'junior'),
('Social Studies', 'SST-JSS', 'junior'),
('Civic Education', 'CIV-JSS', 'junior'),
('CRS', 'CRS-JSS', 'junior'),
('IRS', 'IRS-JSS', 'junior'),
('Agricultural Science', 'AGR-JSS', 'junior'),
('Home Economics', 'HEC-JSS', 'junior'),
('Business Studies', 'BUS-JSS', 'junior'),
('French', 'FRE-JSS', 'junior'),
('Computer Studies', 'CSC-JSS', 'junior'),
('Physical & Health Education', 'PHE-JSS', 'junior'),
('Cultural & Creative Arts', 'CCA-JSS', 'junior'),
('History', 'HIS-JSS', 'junior'),
('Music', 'MUS-JSS', 'junior');

-- Insert subjects for Senior Science
INSERT INTO subjects (name, code, category) VALUES
('Mathematics', 'MAT-SCI', 'senior-science'),
('English', 'ENG-SCI', 'senior-science'),
('Physics', 'PHY-SCI', 'senior-science'),
('Chemistry', 'CHE-SCI', 'senior-science'),
('Biology', 'BIO-SCI', 'senior-science'),
('Further Mathematics', 'FMA-SCI', 'senior-science'),
('Technical Drawing', 'TDR-SCI', 'senior-science'),
('Computer Science', 'CSC-SCI', 'senior-science'),
('Agricultural Science', 'AGR-SCI', 'senior-science'),
('Economics', 'ECO-SCI', 'senior-science');

-- Insert subjects for Senior Arts
INSERT INTO subjects (name, code, category) VALUES
('English', 'ENG-ART', 'senior-arts'),
('Literature in English', 'LIT-ART', 'senior-arts'),
('Government', 'GOV-ART', 'senior-arts'),
('History', 'HIS-ART', 'senior-arts'),
('Economics', 'ECO-ART', 'senior-arts'),
('CRS', 'CRS-ART', 'senior-arts'),
('IRS', 'IRS-ART', 'senior-arts'),
('French', 'FRE-ART', 'senior-arts'),
('Geography', 'GEO-ART', 'senior-arts'),
('Civic Education', 'CIV-ART', 'senior-arts');

-- Insert classes
INSERT INTO classes (name, category, level, capacity) VALUES
('JSS 1A', 'junior', 'JSS1', 40),
('JSS 1B', 'junior', 'JSS1', 40),
('JSS 2A', 'junior', 'JSS2', 40),
('JSS 2B', 'junior', 'JSS2', 40),
('JSS 3A', 'junior', 'JSS3', 40),
('JSS 3B', 'junior', 'JSS3', 40),
('SS 1 Science A', 'senior-science', 'SS1', 40),
('SS 1 Science B', 'senior-science', 'SS1', 40),
('SS 1 Arts A', 'senior-arts', 'SS1', 40),
('SS 1 Arts B', 'senior-arts', 'SS1', 40),
('SS 2 Science A', 'senior-science', 'SS2', 40),
('SS 2 Science B', 'senior-science', 'SS2', 40),
('SS 2 Arts A', 'senior-arts', 'SS2', 40),
('SS 2 Arts B', 'senior-arts', 'SS2', 40),
('SS 3 Science A', 'senior-science', 'SS3', 40),
('SS 3 Science B', 'senior-science', 'SS3', 40),
('SS 3 Arts A', 'senior-arts', 'SS3', 40),
('SS 3 Arts B', 'senior-arts', 'SS3', 40);