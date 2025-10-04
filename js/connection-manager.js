// کلاس مدیریت اتصال به پایگاه داده
class ConnectionManager {
    constructor() {
        this.isConnected = false;
        this.tablesVerified = false;
        this.lastConnectionTest = null;
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 5000,
            backoffFactor: 2
        };
    }

    // تست اتصال به Supabase
    async testConnection(timeout = 10000) {
        console.log('🔍 در حال تست اتصال به Supabase...');
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const { data, error } = await supabase
                .from(TABLES.STUDENTS)
                .select('count', { count: 'exact', head: true })
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (error) {
                console.error('❌ خطا در تست اتصال:', error);
                this.isConnected = false;
                errorHandler.logError(error, { operation: 'testConnection' });
                return false;
            }

            console.log('✅ اتصال به Supabase موفقیت‌آمیز بود');
            this.isConnected = true;
            this.lastConnectionTest = new Date();
            return true;

        } catch (error) {
            console.error('❌ خطا در تست اتصال:', error);
            this.isConnected = false;
            errorHandler.logError(error, { operation: 'testConnection' });
            return false;
        }
    }

    // بررسی وجود جداول
    async verifyTables() {
        console.log('🔍 در حال بررسی وجود جداول...');
        
        const requiredTables = [
            TABLES.STUDENTS,
            TABLES.EXPECTED_STUDENTS,
            TABLES.ALLOWED_NATIONAL_IDS
        ];

        const tableStatus = {};

        for (const tableName of requiredTables) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .select('count', { count: 'exact', head: true });

                if (error) {
                    console.warn(`⚠️ جدول ${tableName} وجود ندارد یا قابل دسترسی نیست:`, error.message);
                    tableStatus[tableName] = false;
                } else {
                    console.log(`✅ جدول ${tableName} موجود است`);
                    tableStatus[tableName] = true;
                }
            } catch (error) {
                console.error(`❌ خطا در بررسی جدول ${tableName}:`, error);
                tableStatus[tableName] = false;
            }
        }

        this.tablesVerified = Object.values(tableStatus).every(status => status);
        
        if (!this.tablesVerified) {
            console.warn('⚠️ برخی جداول موجود نیستند:', tableStatus);
        } else {
            console.log('✅ همه جداول موجود هستند');
        }

        return tableStatus;
    }

    // اطمینان از وجود جداول
    async ensureTablesExist() {
        console.log('🔧 در حال اطمینان از وجود جداول...');
        
        const tableStatus = await this.verifyTables();
        
        // اگر جدول allowed_national_ids وجود ندارد، سعی می‌کنیم آن را ایجاد کنیم
        if (!tableStatus[TABLES.ALLOWED_NATIONAL_IDS]) {
            console.log('⚠️ جدول allowed_national_ids وجود ندارد');
            console.log('💡 راهنمایی: لطفاً اسکریپت SQL را در پنل Supabase اجرا کنید');
            
            // نمایش پیام به کاربر
            showMessage(
                'جدول کدهای ملی مجاز در پایگاه داده وجود ندارد. سیستم در حالت محدود کار می‌کند. لطفاً با مدیر سیستم تماس بگیرید.',
                'warning'
            );
            
            return false;
        }

        return true;
    }

    // اجرای عملیات با retry
    async executeWithRetry(operation, operationName = 'operation') {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                console.log(`🔄 تلاش ${attempt} از ${this.retryConfig.maxRetries} برای ${operationName}`);
                
                const result = await operation();
                
                if (attempt > 1) {
                    console.log(`✅ ${operationName} در تلاش ${attempt} موفق شد`);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                console.warn(`⚠️ تلاش ${attempt} برای ${operationName} ناموفق بود:`, error.message);
                
                // بررسی قابلیت retry
                if (!errorHandler.isRetryable(error)) {
                    console.error(`❌ خطا قابل retry نیست:`, error.message);
                    throw error;
                }
                
                // اگر آخرین تلاش بود، خطا را پرتاب کن
                if (attempt === this.retryConfig.maxRetries) {
                    console.error(`❌ همه تلاش‌ها برای ${operationName} ناموفق بود`);
                    throw error;
                }
                
                // محاسبه زمان انتظار با exponential backoff
                const delay = Math.min(
                    this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
                    this.retryConfig.maxDelay
                );
                
                console.log(`⏳ انتظار ${delay}ms قبل از تلاش مجدد...`);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    // تابع کمکی برای sleep
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // دریافت وضعیت اتصال
    getStatus() {
        return {
            isConnected: this.isConnected,
            tablesVerified: this.tablesVerified,
            lastConnectionTest: this.lastConnectionTest
        };
    }

    // ریست کردن وضعیت
    reset() {
        this.isConnected = false;
        this.tablesVerified = false;
        this.lastConnectionTest = null;
    }
}

// ایجاد instance سراسری
const connectionManager = new ConnectionManager();
