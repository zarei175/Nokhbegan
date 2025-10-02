// تنظیمات Supabase
const SUPABASE_CONFIG = {
    url: 'https://btvksaocmjufgfshyqfb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dmtzYW9jbWp1Zmdmc2h5cWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODczMDEsImV4cCI6MjA3NDY2MzMwMX0.YdY465d7i8HRn5JV9dc8vZ5CRDTs_Og3DfZwzuxRU1o',
    projectId: 'btvksaocmjufgfshyqfb'
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