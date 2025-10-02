# راهنمای راه‌اندازی پایگاه داده Supabase

## اطلاعات پروژه جدید

**Project ID**: `svnckawzrvalodsvctuh`
**URL**: `https://svnckawzrvalodsvctuh.supabase.co`
**API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bmNrYXd6cnZhbG9kc3ZjdHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTYzMDAsImV4cCI6MjA3NDk5MjMwMH0.hrWFjO8d8HHBs3zJc1TR8gsgkTWggoKVDph19hDdrNI`

## مراحل راه‌اندازی

### قدم ۱: ورود به پنل Supabase
1. به آدرس [https://supabase.com/dashboard](https://supabase.com/dashboard) مراجعه کنید
2. وارد حساب کاربری خود شوید
3. پروژه با ID `svnckawzrvalodsvctuh` را انتخاب کنید

### قدم ۲: ایجاد جداول
1. در پنل Supabase روی **SQL Editor** کلیک کنید
2. محتویات فایل `supabase-setup.sql` را کپی کرده و در ادیتور قرار دهید
3. روی **Run** کلیک کنید تا جداول ایجاد شوند

### قدم ۳: بررسی جداول ایجاد شده
پس از اجرای اسکریپت، باید ۲ جدول ایجاد شده باشد:

#### جدول `students` (دانش‌آموزان ثبت شده)
- `id`: شناسه یکتا
- `first_name`: نام
- `last_name`: نام خانوادگی
- `father_name`: نام پدر
- `national_id`: کد ملی (یکتا)
- `class_name`: کلاس
- `address`: آدرس
- `medical_conditions`: بیماری خاص
- `father_job`: شغل پدر
- `mother_job`: شغل مادر
- `father_phone`: تلفن پدر
- `mother_phone`: تلفن مادر
- `student_phone`: تلفن دانش آموز
- `created_at`: تاریخ ثبت
- `updated_at`: تاریخ آخرین ویرایش

#### جدول `expected_students` (دانش‌آموزان مورد انتظار)
- `id`: شناسه یکتا
- `first_name`: نام
- `last_name`: نام خانوادگی
- `class_name`: کلاس
- `is_registered`: وضعیت ثبت نام
- `created_at`: تاریخ اضافه شدن

### قدم ۴: تنظیم دسترسی‌ها (RLS)
اسکریپت به طور خودکار:
- Row Level Security (RLS) را فعال می‌کند
- Policy های لازم برای دسترسی عمومی ایجاد می‌کند
- Index هایی برای بهبود عملکرد ایجاد می‌کند

### قدم ۵: تست عملکرد
پس از راه‌اندازی:
1. فایل `index.html` را در مرورگر باز کنید
2. سعی کنید یک دانش‌آموز ثبت کنید
3. وارد پنل مدیریت شوید و بررسی کنید که داده‌ها ثبت شده‌اند

## نکات مهم

### امنیت
- API Key ارائه شده از نوع `anon` است و برای استفاده عمومی مناسب است
- تمام دسترسی‌های لازم از طریق RLS Policy ها تنظیم شده است

### پشتیبان‌گیری
- حتماً از داده‌های مهم پشتیبان‌گیری کنید
- می‌توانید از قسمت Database > Backups در پنل Supabase استفاده کنید

### نظارت
- وضعیت پایگاه داده را از قسمت Settings > Database مشاهده کنید
- برای مشاهده لاگ‌ها از قسمت Logs استفاده کنید

## عیب‌یابی

### مشکلات متداول:

1. **خطای اتصال**: بررسی کنید URL و API Key صحیح وارد شده باشد
2. **خطای دسترسی**: مطمئن شوید RLS Policy ها درست تنظیم شده‌اند
3. **خطای داده‌ها**: ساختار جداول را با فایل SQL مطابقت دهید

### کدهای تست سریع:

```javascript
// تست اتصال در Console مرورگر
console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_CONFIG.url);
console.log('Project ID:', SUPABASE_CONFIG.projectId);
```

## تماس و پشتیبانی

در صورت بروز مشکل، موارد زیر را بررسی کنید:
- لاگ‌های مرورگر (F12 > Console)
- وضعیت سرویس Supabase
- تنظیمات شبکه و فایروال

---

**تاریخ آخرین به‌روزرسانی**: ${new Date().toLocaleDateString('fa-IR')}
**نسخه پایگاه داده**: 1.0.0