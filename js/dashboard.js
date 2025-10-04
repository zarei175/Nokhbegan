// مدیریت داشبورد و عملیات مدیریتی

// کلاس مدیریت داشبورد
class DashboardManager {
    constructor() {
        this.currentFilters = {};
        this.currentStudents = [];
        this.expectedStudents = [];
    }

    // مقداردهی اولیه داشبورد
    async initialize() {
        try {
            await this.loadAllData();
            this.setupDashboardEvents();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        }
    }

    // بارگذاری تمام داده‌های داشبورد
    async loadAllData() {
        try {
            // بارگذاری آمار
            await this.updateStatistics();
            
            // بارگذاری دانش آموزان ثبت شده
            await this.loadRegisteredStudents();
            
            // بارگذاری دانش آموزان مورد انتظار
            await this.loadExpectedStudents();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            throw error;
        }
    }

    // تنظیم رویدادهای داشبورد
    setupDashboardEvents() {
        // رویداد جستجو
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.applyFilters();
            }, 300));
        }

        // رویداد فیلتر کلاس
        const classFilter = document.getElementById('classFilter');
        if (classFilter) {
            classFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // رویداد صورت کردن صفحات
        this.setupPagination();
    }

    // به‌روزرسانی آمار
    async updateStatistics() {
        try {
            const stats = await db.getStatistics();
            
            // نمایش آمار در کارت‌ها
            const totalElement = document.getElementById('totalStudents');
            const expectedElement = document.getElementById('expectedStudents');
            const remainingElement = document.getElementById('remainingStudents');

            if (totalElement) totalElement.textContent = stats.registered;
            if (expectedElement) expectedElement.textContent = stats.expected;
            if (remainingElement) remainingElement.textContent = Math.max(0, stats.remaining);

            // انیمیشن شمارش
            this.animateNumbers();

        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    // انیمیشن شمارش آمار
    animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(element => {
            const finalValue = parseInt(element.textContent);
            element.textContent = '0';
            
            const increment = finalValue / 20;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= finalValue) {
                    element.textContent = finalValue;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 50);
        });
    }

    // بارگذاری دانش آموزان ثبت شده
    async loadRegisteredStudents(filters = {}) {
        try {
            this.currentStudents = await db.getRegisteredStudents(filters);
            this.displayStudentsList(this.currentStudents);
            return this.currentStudents;
        } catch (error) {
            console.error('Error loading registered students:', error);
            throw error;
        }
    }

    // بارگذاری دانش آموزان مورد انتظار
    async loadExpectedStudents() {
        try {
            this.expectedStudents = await db.getExpectedStudents();
            return this.expectedStudents;
        } catch (error) {
            console.error('Error loading expected students:', error);
            throw error;
        }
    }

    // نمایش لیست دانش آموزان
    displayStudentsList(students) {
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px;">
                        <div style="color: #6c757d;">
                            <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>هیچ دانش آموزی یافت نشد</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        students.forEach((student, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div style="font-weight: 500;">${student.first_name} ${student.last_name}</div>
                    <small style="color: #6c757d;">${student.national_id}</small>
                </td>
                <td><span class="class-badge">${student.class_name}</span></td>
                <td style="direction: ltr; text-align: right;">${student.national_id}</td>
                <td>${student.father_name}</td>
                <td style="direction: ltr; text-align: right;">${student.father_phone}</td>
                <td>${this.formatPersianDate(student.created_at)}</td>
                <td>
                    <div class="action-buttons-cell">
                        <button class="view-btn" onclick="dashboardManager.viewStudentDetails(${student.id})" title="مشاهده جزئیات">
                            👁️
                        </button>
                        <button class="delete-btn" onclick="dashboardManager.deleteStudent(${student.id})" title="حذف">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // اضافه کردن استایل به کلاس badges
        this.addClassBadgeStyles();
    }

    // اضافه کردن استایل به badges کلاس‌ها
    addClassBadgeStyles() {
        if (!document.getElementById('class-badge-styles')) {
            const style = document.createElement('style');
            style.id = 'class-badge-styles';
            style.textContent = `
                .class-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .action-buttons-cell {
                    display: flex;
                    gap: 5px;
                    justify-content: center;
                }
                .view-btn, .delete-btn {
                    padding: 4px 8px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: transform 0.2s ease;
                }
                .view-btn:hover, .delete-btn:hover {
                    transform: scale(1.1);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // اعمال فیلترها
    async applyFilters() {
        const searchValue = document.getElementById('searchInput')?.value.trim() || '';
        const classValue = document.getElementById('classFilter')?.value || '';

        const filters = {};
        if (searchValue) filters.search = searchValue;
        if (classValue) filters.className = classValue;

        this.currentFilters = filters;

        try {
            await this.loadRegisteredStudents(filters);
        } catch (error) {
            console.error('Error applying filters:', error);
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        }
    }

    // نمایش جزئیات دانش آموز
    async viewStudentDetails(studentId) {
        try {
            console.log('📋 نمایش جزئیات دانش آموز:', studentId);
            
            const student = this.currentStudents.find(s => s.id === studentId);
            if (!student) {
                showMessage('دانش آموز یافت نشد', 'error');
                return;
            }

            // ایجاد مودال نمایش جزئیات
            const modal = this.createStudentDetailsModal(student);
            document.body.appendChild(modal);

            // نمایش مودال
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);

            console.log('✅ جزئیات دانش آموز نمایش داده شد');

        } catch (error) {
            console.error('❌ خطا در نمایش جزئیات:', error);
            errorHandler.logError(error, { operation: 'viewStudentDetails', studentId });
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        }
    }

    // ایجاد مودال جزئیات دانش آموز
    createStudentDetailsModal(student) {
        const modal = document.createElement('div');
        modal.className = 'student-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>جزئیات دانش آموز</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="student-info-grid">
                        <div class="info-item">
                            <label>نام و نام خانوادگی:</label>
                            <span>${student.first_name} ${student.last_name}</span>
                        </div>
                        <div class="info-item">
                            <label>نام پدر:</label>
                            <span>${student.father_name}</span>
                        </div>
                        <div class="info-item">
                            <label>کد ملی:</label>
                            <span style="direction: ltr; text-align: right;">${student.national_id}</span>
                        </div>
                        <div class="info-item">
                            <label>کلاس:</label>
                            <span>${student.class_name}</span>
                        </div>
                        <div class="info-item full-width">
                            <label>آدرس:</label>
                            <span>${student.address}</span>
                        </div>
                        <div class="info-item full-width">
                            <label>بیماری خاص:</label>
                            <span>${student.medical_conditions || 'ندارد'}</span>
                        </div>
                        <div class="info-item">
                            <label>شغل پدر:</label>
                            <span>${student.father_job}</span>
                        </div>
                        <div class="info-item">
                            <label>شغل مادر:</label>
                            <span>${student.mother_job}</span>
                        </div>
                        <div class="info-item">
                            <label>شماره پدر:</label>
                            <span style="direction: ltr; text-align: right;">${student.father_phone}</span>
                        </div>
                        <div class="info-item">
                            <label>شماره مادر:</label>
                            <span style="direction: ltr; text-align: right;">${student.mother_phone}</span>
                        </div>
                        <div class="info-item">
                            <label>شماره دانش آموز:</label>
                            <span style="direction: ltr; text-align: right;">${student.student_phone || 'وارد نشده'}</span>
                        </div>
                        <div class="info-item">
                            <label>تاریخ ثبت:</label>
                            <span>${this.formatPersianDate(student.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // اضافه کردن event listeners
        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentElement) {
                    modal.remove();
                }
            }, 300);
        };
        
        overlay.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        
        // بستن با کلید ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // اضافه کردن استایل مودال
        this.addModalStyles();

        return modal;
    }

    // اضافه کردن استایل مودال
    addModalStyles() {
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .student-details-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .student-details-modal.show {
                    opacity: 1;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    position: relative;
                    background: white;
                    border-radius: 15px;
                    max-width: 650px;
                    width: 90%;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
                    z-index: 1;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                .student-details-modal.show .modal-content {
                    transform: scale(1);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 25px;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 15px 15px 0 0;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.3rem;
                    font-weight: 600;
                }
                .modal-close {
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    line-height: 1;
                }
                .modal-close:hover {
                    background-color: rgba(255, 255, 255, 0.3);
                    transform: rotate(90deg);
                }
                .modal-body {
                    padding: 25px;
                    background: #f8f9fa;
                }
                .student-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 18px;
                }
                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .info-item.full-width {
                    grid-column: 1 / -1;
                }
                .info-item label {
                    font-weight: 600;
                    color: #495057;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .info-item label::before {
                    content: '▪';
                    color: #667eea;
                    font-size: 1.2rem;
                }
                .info-item span {
                    padding: 12px 15px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                    color: #2c3e50;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                .info-item span:hover {
                    border-color: #667eea;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
                }
                
                /* Scrollbar styling */
                .modal-content::-webkit-scrollbar {
                    width: 8px;
                }
                .modal-content::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 0 15px 15px 0;
                }
                .modal-content::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                }
                .modal-content::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                }
                
                @media (max-width: 768px) {
                    .student-info-grid {
                        grid-template-columns: 1fr;
                    }
                    .modal-content {
                        width: 95%;
                        max-height: 90vh;
                    }
                    .modal-header {
                        padding: 20px;
                    }
                    .modal-body {
                        padding: 20px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // حذف دانش آموز
    async deleteStudent(studentId) {
        const student = this.currentStudents.find(s => s.id === studentId);
        const studentName = student ? `${student.first_name} ${student.last_name}` : 'این دانش آموز';

        if (!confirm(`آیا از حذف ${studentName} اطمینان دارید؟\nاین عملیات قابل بازگشت نیست.`)) {
            return;
        }

        try {
            showLoading(true);
            
            await db.deleteStudent(studentId);
            
            showMessage(MESSAGES.SUCCESS.STUDENT_DELETED, 'success');
            
            // به‌روزرسانی داده‌ها
            await this.loadAllData();

        } catch (error) {
            console.error('Error deleting student:', error);
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        } finally {
            showLoading(false);
        }
    }

    // تنظیم صفحه‌بندی
    setupPagination() {
        // پیاده‌سازی صفحه‌بندی در آینده
    }

    // فرمت تاریخ فارسی
    formatPersianDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // دریافت خلاصه گزارش
    generateSummaryReport() {
        const totalStudents = this.currentStudents.length;
        const classSummary = {};

        // تجمیع بر اساس کلاس
        this.currentStudents.forEach(student => {
            const className = student.class_name;
            if (!classSummary[className]) {
                classSummary[className] = 0;
            }
            classSummary[className]++;
        });

        return {
            total: totalStudents,
            byClass: classSummary,
            lastUpdate: new Date().toLocaleString('fa-IR')
        };
    }
}

// ایجاد نمونه مدیر داشبورد
const dashboardManager = new DashboardManager();

// رویداد بارگذاری داشبورد
document.addEventListener('DOMContentLoaded', function() {
    // مقداردهی اولیه داشبورد هنگام تعویض به بخش داشبورد
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', async function() {
            setTimeout(async () => {
                if (currentSection === 'dashboard') {
                    await dashboardManager.initialize();
                }
            }, 100);
        });
    }
});