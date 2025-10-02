// مدیریت احراز هویت برای پنل مدیریت

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.credentials = {
            username: 'admin',
            password: 'iran@1404'
        };
        
        // بررسی وضعیت ورود از localStorage
        this.checkAuthStatus();
    }

    // بررسی وضعیت احراز هویت
    checkAuthStatus() {
        const authStatus = localStorage.getItem('adminAuthenticated');
        const authTime = localStorage.getItem('adminAuthTime');
        
        if (authStatus === 'true' && authTime) {
            const currentTime = new Date().getTime();
            const loginTime = parseInt(authTime);
            
            // بررسی اینکه آیا 24 ساعت از زمان ورود گذشته یا نه
            if (currentTime - loginTime < 24 * 60 * 60 * 1000) {
                this.isAuthenticated = true;
                return true;
            } else {
                // پاک کردن اطلاعات احراز هویت منقضی شده
                this.logout();
            }
        }
        
        return false;
    }

    // تابع ورود
    async login(username, password) {
        return new Promise((resolve, reject) => {
            // شبیه‌سازی تأخیر شبکه
            setTimeout(() => {
                if (username.trim() === this.credentials.username && 
                    password === this.credentials.password) {
                    
                    this.isAuthenticated = true;
                    
                    // ذخیره وضعیت در localStorage
                    localStorage.setItem('adminAuthenticated', 'true');
                    localStorage.setItem('adminAuthTime', new Date().getTime().toString());
                    
                    resolve({
                        success: true,
                        message: 'ورود با موفقیت انجام شد'
                    });
                } else {
                    reject({
                        success: false,
                        message: 'نام کاربری یا رمز عبور اشتباه است'
                    });
                }
            }, 1000);
        });
    }

    // تابع خروج
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminAuthTime');
        
        // بازگشت به بخش ثبت نام
        switchSection('registration');
    }

    // بررسی دسترسی به پنل مدیریت
    requireAuth() {
        if (!this.isAuthenticated) {
            return false;
        }
        return true;
    }

    // نمایش مودال ورود
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // فوکس روی فیلد نام کاربری
            setTimeout(() => {
                const usernameInput = document.getElementById('username');
                if (usernameInput) {
                    usernameInput.focus();
                }
            }, 100);
        }
    }

    // مخفی کردن مودال ورود
    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // پاک کردن فیلدها
            const form = document.getElementById('loginForm');
            if (form) {
                form.reset();
            }
        }
    }

    // تنظیم رویدادهای احراز هویت
    setupAuthEvents() {
        // رویداد فرم ورود
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e);
            });
        }

        // رویداد بستن مودال
        const closeModal = document.getElementById('closeLoginModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }

        // رویداد دکمه انصراف
        const cancelLogin = document.getElementById('cancelLogin');
        if (cancelLogin) {
            cancelLogin.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }

        // بستن مودال با کلیک خارج از آن
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideLoginModal();
                }
            });
        }

        // بستن مودال با کلید ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideLoginModal();
            }
        });
    }

    // مدیریت فرآیند ورود
    async handleLogin(event) {
        const formData = new FormData(event.target);
        const username = formData.get('username');
        const password = formData.get('password');

        // نمایش لودینگ
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'در حال ورود...';
        submitBtn.disabled = true;

        try {
            const result = await this.login(username, password);
            
            // نمایش پیام موفقیت
            showMessage(result.message, 'success');
            
            // مخفی کردن مودال
            this.hideLoginModal();
            
            // نمایش پنل مدیریت
            switchSection('dashboard');
            
        } catch (error) {
            // نمایش پیام خطا
            showMessage(error.message, 'error');
        } finally {
            // بازگردانی دکمه
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// ایجاد instance سراسری
const authManager = new AuthManager();