# سامانه مدیریت دانش آموزان - مدرسه هیات امنایی نخبگان

## نمای کلی پروژه

این اپلیکیشن تحت وب برای مدیریت اطلاعات دانش آموزان مدرسه هیات امنایی نخبگان در سال تحصیلی ۱۴۰۵-۱۴۰۴ طراحی شده است. سیستم امکان ثبت نام آنلاین دانش آموزان، مدیریت اطلاعات، و تولید گزارشات را فراهم می‌کند.

## ویژگی‌های پیاده‌سازی شده

### ✅ قابلیت‌های فعلی:

#### 1. فرم ثبت نام دانش آموز
- ثبت اطلاعات کامل دانش آموز شامل:
  - نام و نام خانوادگی
  - نام پدر
  - شغل پدر و مادر
  - کد ملی (با اعتبارسنجی)
  - آدرس منزل
  - بیماری خاص
  - شماره تلفن پدر، مادر و دانش آموز (با اعتبارسنجی)
  - انتخاب کلاس از لیست: ۷۰۱، ۷۰۲، ۷۰۳، ۸۰۱، ۸۰۲، ۸۰۳، ۸۰۴، ۸۰۵، ۸۰۶، ۸۰۷

#### 2. داشبورد مدیریتی
- نمایش آمار کلی (تعداد ثبت شده، مورد انتظار، باقی مانده)
- لیست کامل دانش آموزان ثبت شده
- امکان جستجو و فیلتر بر اساس نام، کد ملی، کلاس
- مشاهده جزئیات کامل هر دانش آموز در مودال
- حذف دانش آموزان (با تأیید)

#### 3. مدیریت فایل‌های اکسل
- خروجی اکسل دانش آموزان ثبت شده (شامل آمار تفصیلی)
- آپلود لیست دانش آموزان مورد انتظار از فایل اکسل
- نمایش دانش آموزان بدون ثبت نام
- دانلود فایل نمونه برای آپلود

#### 4. طراحی و رابط کاربری
- طراحی کاملاً فارسی و راست به چپ (RTL)
- نمایش لوگوی مدرسه
- شعار مدرسه: "با دانش و ایمان، فاتح میدان باش ..."
- طراحی Responsive برای موبایل و تبلت
- انیمیشن‌ها و اثرات بصری مدرن

#### 5. پایگاه داده
- اتصال به Supabase
- جداول students و expected_students
- مدیریت کامل CRUD operations
- اعتبارسنجی داده‌ها

## ساختار فایل‌های پروژه

```
project/
├── index.html              # صفحه اصلی اپلیکیشن
├── css/
│   └── style.css          # استایل‌های کامل responsive
├── js/
│   ├── config.js          # تنظیمات و پیکربندی
│   ├── supabase.js        # مدیریت پایگاه داده
│   ├── main.js            # منطق اصلی اپلیکیشن
│   ├── dashboard.js       # مدیریت داشبورد
│   └── excel.js           # عملیات اکسل
└── README.md              # مستندات پروژه
```

## مسیرهای دسترسی

### صفحات اصلی:
- **صفحه اصلی**: `/` - فرم ثبت نام دانش آموز
- **داشبورد مدیریت**: کلیک روی دکمه "پنل مدیریت"

### API Endpoints (Supabase):
- **Base URL**: `https://btvksaocmjufgfshyqfb.supabase.co`
- **جدول دانش آموزان**: `students`
- **جدول مورد انتظار**: `expected_students`

## تنظیمات پایگاه داده

### اطلاعات Supabase:
- **Project ID**: `btvksaocmjufgfshyqfb`
- **URL**: `https://btvksaocmjufgfshyqfb.supabase.co`
- **Anon Key**: تنظیم شده در `js/config.js`

### ساختار جداول:

#### جدول students:
```sql
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
```

#### جدول expected_students:
```sql
CREATE TABLE expected_students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(10),
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ویژگی‌های در حال توسعه

### 🔄 قابلیت‌هایی که می‌توانند اضافه شوند:
1. **گزارشات پیشرفته**
   - نمودار آماری توزیع دانش آموزان بر اساس کلاس
   - گزارش بیماری‌های خاص
   - آمار والدین بر اساس شغل

2. **مدیریت کاربران**
   - سیستم ورود برای مدیران
   - سطوح دسترسی مختلف
   - لاگ تغییرات

3. **اعلانات و پیامک**
   - ارسال پیامک تأیید ثبت نام
   - یادآوری به والدین برای تکمیل اطلاعات

4. **بهینه‌سازی‌ها**
   - صفحه‌بندی جدول دانش آموزان
   - جستجوی پیشرفته
   - فیلترهای بیشتر

## نحوه استفاده

### برای دانش آموزان:
1. وارد کردن اطلاعات در فرم ثبت نام
2. کلیک روی دکمه "ثبت اطلاعات"
3. دریافت پیام تأیید

### برای مدیران:
1. کلیک روی "پنل مدیریت"
2. مشاهده آمار و لیست دانش آموزان
3. استفاده از امکانات جستجو و فیلتر
4. خروجی گرفتن از اطلاعات
5. آپلود لیست دانش آموزان مورد انتظار

## آماده‌سازی برای آپلود به GitHub

پروژه آماده آپلود به مخزن GitHub زیر است:
- **Repository**: `https://github.com/zarei176/students_data`
- **Personal Access Token**: تنظیم شده برای عملیات GitHub

## تکنولوژی‌های استفاده شده

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL)
- **Libraries**:
  - Supabase Client
  - XLSX (برای عملیات اکسل)
  - Vazir Font (فونت فارسی)
- **Styling**: CSS Grid, Flexbox, Gradient Backgrounds
- **Responsive**: Mobile-first design

## مجوز و کپی‌رایت

این پروژه برای مدرسه هیات امنایی نخبگان طراحی شده است.
سال تحصیلی: ۱۴۰۵-۱۴۰۴

---

**آخرین به‌روزرسانی**: ${new Date().toLocaleDateString('fa-IR')}
**وضعیت**: آماده برای استفاده
**نسخه**: 1.0.0