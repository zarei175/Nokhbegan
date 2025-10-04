// کلاس مدیریت خطاهای پیشرفته
class EnhancedErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }

    // تشخیص نوع خطا
    categorizeError(error) {
        if (!error) {
            return 'unknown';
        }

        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';

        // خطاهای شبکه
        if (errorMessage.includes('network') || 
            errorMessage.includes('fetch') || 
            errorMessage.includes('timeout') ||
            errorCode === 'NETWORK_ERROR') {
            return 'network';
        }

        // خطاهای پایگاه داده
        if (errorCode.startsWith('PGRST') || 
            errorMessage.includes('permission denied') ||
            errorMessage.includes('database') ||
            errorMessage.includes('relation') ||
            errorMessage.includes('does not exist')) {
            return 'database';
        }

        // خطاهای اعتبارسنجی
        if (errorMessage.includes('duplicate') || 
            errorMessage.includes('invalid') ||
            errorMessage.includes('required') ||
            errorMessage.includes('validation') ||
            errorCode === '23505') { // PostgreSQL unique violation
            return 'validation';
        }

        // خطاهای دسترسی
        if (error.status === 401 || 
            error.status === 403 || 
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('forbidden')) {
            return 'permission';
        }

        return 'unknown';
    }

    // ارائه پیام کاربرپسند
    getUserFriendlyMessage(error) {
        const category = this.categorizeError(error);
        const errorMessage = error.message || '';

        switch (category) {
            case 'network':
                return 'مشکل در اتصال به اینترنت. لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.';

            case 'database':
                if (errorMessage.includes('does not exist')) {
                    return 'جداول پایگاه داده هنوز ایجاد نشده‌اند. لطفاً با مدیر سیستم تماس بگیرید.';
                }
                if (errorMessage.includes('permission denied')) {
                    return 'دسترسی به پایگاه داده وجود ندارد. لطفاً با مدیر سیستم تماس بگیرید.';
                }
                return 'خطا در ارتباط با پایگاه داده. لطفاً دوباره تلاش کنید.';

            case 'validation':
                if (errorMessage.includes(MESSAGES.ERROR.DUPLICATE_NATIONAL_ID)) {
                    return MESSAGES.ERROR.DUPLICATE_NATIONAL_ID;
                }
                if (errorMessage.includes(MESSAGES.ERROR.NATIONAL_ID_NOT_ALLOWED)) {
                    return MESSAGES.ERROR.NATIONAL_ID_NOT_ALLOWED;
                }
                if (errorMessage.includes(MESSAGES.ERROR.NATIONAL_ID_ALREADY_USED)) {
                    return MESSAGES.ERROR.NATIONAL_ID_ALREADY_USED;
                }
                return errorMessage || 'اطلاعات وارد شده معتبر نیست.';

            case 'permission':
                return 'شما دسترسی لازم برای انجام این عملیات را ندارید.';

            default:
                return errorMessage || MESSAGES.ERROR.GENERAL;
        }
    }

    // لاگ‌گذاری تفصیلی
    logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            category: this.categorizeError(error),
            message: error.message || 'Unknown error',
            code: error.code || null,
            status: error.status || null,
            context: context,
            stack: error.stack || null
        };

        // اضافه کردن به لاگ
        this.errorLog.push(errorEntry);

        // محدود کردن اندازه لاگ
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // لاگ در کنسول
        console.error('🔴 خطا رخ داد:', {
            دسته: errorEntry.category,
            پیام: errorEntry.message,
            کد: errorEntry.code,
            زمان: errorEntry.timestamp,
            جزئیات: context
        });

        // ذخیره در localStorage برای عیب‌یابی
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog.slice(-20)));
        } catch (e) {
            console.warn('نمی‌توان لاگ را در localStorage ذخیره کرد');
        }

        return errorEntry;
    }

    // بررسی قابلیت retry
    isRetryable(error) {
        const category = this.categorizeError(error);
        const retryableCategories = ['network', 'database'];
        const errorCode = error.code || '';

        // برخی خطاهای پایگاه داده قابل retry نیستند
        if (category === 'database') {
            const nonRetryableCodes = ['23505', '23503', '23502']; // unique, foreign key, not null violations
            if (nonRetryableCodes.includes(errorCode)) {
                return false;
            }
        }

        return retryableCategories.includes(category);
    }

    // دریافت لاگ‌های اخیر
    getRecentErrors(count = 10) {
        return this.errorLog.slice(-count);
    }

    // پاک کردن لاگ‌ها
    clearLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('errorLog');
        } catch (e) {
            console.warn('نمی‌توان لاگ را از localStorage پاک کرد');
        }
    }

    // بازیابی لاگ‌های قبلی از localStorage
    restoreLog() {
        try {
            const savedLog = localStorage.getItem('errorLog');
            if (savedLog) {
                this.errorLog = JSON.parse(savedLog);
                console.log('✅ لاگ‌های قبلی بازیابی شد:', this.errorLog.length, 'مورد');
            }
        } catch (e) {
            console.warn('نمی‌توان لاگ را از localStorage بازیابی کرد');
        }
    }
}

// ایجاد instance سراسری
const errorHandler = new EnhancedErrorHandler();

// بازیابی لاگ‌های قبلی
errorHandler.restoreLog();
