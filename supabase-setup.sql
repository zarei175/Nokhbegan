-- اسکریپت راه‌اندازی پایگاه داده برای سیستم مدیریت دانش‌آموزان
-- مدرسه هیات امنایی نخبگان
-- سال تحصیلی ۱۴۰۵-۱۴۰۴

-- حذف جداول در صورت وجود (برای راه‌اندازی مجدد)
DROP TABLE IF EXISTS expected_students;
DROP TABLE IF EXISTS students;

-- جدول دانش‌آموزان ثبت شده
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100) NOT NULL,
    national_id VARCHAR(10) UNIQUE NOT NULL,
    class_name VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    medical_conditions TEXT,
    father_job VARCHAR(100) NOT NULL,
    mother_job VARCHAR(100) NOT NULL,
    father_phone VARCHAR(11) NOT NULL,
    mother_phone VARCHAR(11) NOT NULL,
    student_phone VARCHAR(11),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول دانش‌آموزان مورد انتظار
CREATE TABLE expected_students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(10),
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ایجاد ایندکس برای بهبود عملکرد
CREATE INDEX idx_students_national_id ON students(national_id);
CREATE INDEX idx_students_class_name ON students(class_name);
CREATE INDEX idx_students_created_at ON students(created_at);
CREATE INDEX idx_expected_students_class_name ON expected_students(class_name);
CREATE INDEX idx_expected_students_is_registered ON expected_students(is_registered);

-- تنظیم Row Level Security (RLS) - فعال‌سازی امنیت سطر
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_students ENABLE ROW LEVEL SECURITY;

-- ایجاد سیاست‌های دسترسی (Policies)
-- همه کاربران می‌توانند داده‌ها را بخوانند و اضافه کنند
CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON students FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON students FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON expected_students FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON expected_students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON expected_students FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON expected_students FOR DELETE USING (true);

-- اضافه کردن trigger برای به‌روزرسانی خودکار updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- اضافه کردن داده‌های نمونه (اختیاری)
-- INSERT INTO expected_students (first_name, last_name, class_name) VALUES 
-- ('علی', 'احمدی', '۷۰۱'),
-- ('فاطمه', 'رضایی', '۷۰۲'),
-- ('محمد', 'علیزاده', '۸۰۱');

-- نمایش اطلاعات جداول ایجاد شده
SELECT 'جداول با موفقیت ایجاد شدند!' as message;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('students', 'expected_students') 
ORDER BY table_name, ordinal_position;