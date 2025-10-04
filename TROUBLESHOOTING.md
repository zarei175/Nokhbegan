# راهنمای عیب‌یابی - سیستم ثبت اطلاعات دانش آموزان

## مشکلات رایج و راه‌حل‌ها

### 1. خطا در ثبت اطلاعات دانش آموز

#### علل احتمالی:
- **مشکل اتصال به اینترنت**: اتصال اینترنت خود را بررسی کنید
- **خطا در پایگاه داده**: جداول در Supabase ایجاد نشده‌اند
- **کد ملی تکراری**: کد ملی قبلاً ثبت شده است
- **کد ملی غیرمجاز**: کد ملی در لیست مجازها وجود ندارد

#### راه‌حل:
1. فایل `debug-registration.html` را در مرورگر باز کنید
2. تست‌های خودکار را اجرا کنید
3. بر اساس نتایج، مشکل را شناسایی کنید

### 2. خطاهای رایج

#### خطای "خطا در اتصال به پایگاه داده"
```javascript
// بررسی کنید که:
1. اتصال اینترنت برقرار است
2. کلیدهای Supabase صحیح هستند
3. جداول در Supabase ایجاد شده‌اند
```

#### خطای "کد ملی قبلاً ثبت شده است"
```javascript
// این خطا طبیعی است و نشان می‌دهد:
1. سیستم درست کار می‌کند
2. کد ملی قبلاً استفاده شده
3. باید کد ملی جدید وارد کنید
```

#### خطای "کد ملی در لیست مجاز وجود ندارد"
```javascript
// برای رفع این مشکل:
1. ابتدا کدهای ملی مجاز را آپلود کنید
2. یا از پنل مدیریت، کدهای ملی را اضافه کنید
```

### 3. مراحل عیب‌یابی

#### مرحله 1: بررسی اتصال
```bash
# فایل debug-registration.html را باز کنید
# روی "تست اتصال" کلیک کنید
# اگر خطا داشت، اتصال اینترنت را بررسی کنید
```

#### مرحله 2: بررسی جداول
```bash
# روی "بررسی جداول" کلیک کنید
# اگر خطا داشت، جداول را در Supabase ایجاد کنید
```

#### مرحله 3: تست ثبت نام
```bash
# روی "تست ثبت نام" کلیک کنید
# اگر خطا داشت، مشکل در کد ثبت نام است
```

### 4. راه‌حل‌های پیشرفته

#### ایجاد جداول در Supabase
```sql
-- اجرای این کدها در SQL Editor در Supabase
CREATE TABLE IF NOT EXISTS students (
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

CREATE TABLE IF NOT EXISTS expected_students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(10),
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allowed_national_ids (
    id SERIAL PRIMARY KEY,
    national_id VARCHAR(10) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### بررسی لاگ‌های مرورگر
```javascript
// در Developer Tools (F12):
1. Console tab را باز کنید
2. خطاهای قرمز را بررسی کنید
3. Network tab را برای خطاهای HTTP بررسی کنید
```

### 5. تماس با پشتیبانی

اگر مشکل حل نشد:
1. لاگ‌های کامل را کپی کنید
2. تصویر صفحه خطا را بگیرید
3. با مدیریت مدرسه تماس بگیرید

### 6. نکات مهم

- **همیشه از کدهای ملی معتبر استفاده کنید**
- **شماره تلفن‌ها باید با 09 شروع شوند**
- **فیلدهای اجباری را خالی نگذارید**
- **در صورت خطا، صفحه را رفرش کنید**

---
*آخرین به‌روزرسانی: دی ۱۴۰۳*
