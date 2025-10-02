// تنظیمات Supabase
const SUPABASE_CONFIG = {
    url: 'https://svnckawzrvalodsvctuh.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bmNrYXd6cnZhbG9kc3ZjdHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTYzMDAsImV4cCI6MjA3NDk5MjMwMH0.hrWFjO8d8HHBs3zJc1TR8gsgkTWggoKVDph19hDdrNI',
    projectId: 'svnckawzrvalodsvctuh'
};

// نام جداول
const TABLES = {
    STUDENTS: 'students',
    EXPECTED_STUDENTS: 'expected_students'
};

// کلاس‌های مدرسه
const SCHOOL_CLASSES = [
    '۷۰۱', '۷۰۲', '۷۰۳',
    '۸۰۱', '۸۰۲', '۸۰۳', '۸۰۴', '۸۰۵', '۸۰۶', '۸۰۷'
];

// پیام‌های سیستم
const MESSAGES = {
    SUCCESS: {
        STUDENT_REGISTERED: 'اطلاعات دانش آموز با موفقیت ثبت شد!',
        DATA_EXPORTED: 'فایل اکسل با موفقیت دانلود شد!',
        DATA_IMPORTED: 'فایل اکسل با موفقیت آپلود شد!',
        STUDENT_DELETED: 'دانش آموز با موفقیت حذف شد!'
    },
    ERROR: {
        GENERAL: 'خطایی رخ داده است. لطفاً دوباره تلاش کنید.',
        NETWORK: 'خطا در اتصال به شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.',
        DUPLICATE_NATIONAL_ID: 'این کد ملی قبلاً ثبت شده است!',
        INVALID_FILE: 'فایل انتخاب شده معتبر نیست!',
        FILE_READ_ERROR: 'خطا در خواندن فایل!'
    },
    INFO: {
        LOADING: 'در حال بارگذاری...',
        PROCESSING: 'در حال پردازش...'
    }
};

// تنظیمات UI
const UI_CONFIG = {
    MESSAGE_DURATION: 4000, // مدت زمان نمایش پیام (میلی ثانیه)
    ANIMATION_DURATION: 300, // مدت زمان انیمیشن (میلی ثانیه)
    PAGE_SIZE: 50 // تعداد رکورد در هر صفحه
};