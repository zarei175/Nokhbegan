// متغیرهای سراسری
let currentSection = 'registration';

// مقداردهی اولیه هنگام لود شدن صفحه
document.addEventListener('DOMContentLoaded', async function() {
    // مقداردهی Supabase
    if (!initializeSupabase()) {
        return;
    }

    // ایجاد جداول
    await db.createTables();

    // تنظیم event listeners
    setupEventListeners();

    // بارگذاری داده‌ها
    await loadInitialData();

    console.log('Application initialized successfully');
});

// تنظیم event listeners
function setupEventListeners() {
    // دکمه‌های ناوبری
    document.getElementById('registrationBtn').addEventListener('click', () => switchSection('registration'));
    document.getElementById('dashboardBtn').addEventListener('click', () => switchSection('dashboard'));

    // فرم ثبت نام
    document.getElementById('studentForm').addEventListener('submit', handleStudentRegistration);

    // فیلدهای جستجو و فیلتر
    document.getElementById('searchInput').addEventListener('input', debounce(filterStudents, 300));
    document.getElementById('classFilter').addEventListener('change', filterStudents);

    // دکمه‌های داشبورد
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('importExpected').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', handleFileImport);
    document.getElementById('showRemaining').addEventListener('click', toggleRemainingStudents);
    
    // دکمه‌های مدیریت کدهای ملی
    document.getElementById('importNationalIds').addEventListener('click', () => document.getElementById('nationalIdsFileInput').click());
    document.getElementById('nationalIdsFileInput').addEventListener('change', handleNationalIdsImport);
    document.getElementById('exportNationalIds').addEventListener('click', exportAllowedNationalIds);
    
    // دکمه خروج از پنل مدیریت
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('آیا مطمئن هستید که می‌خواهید از پنل مدیریت خارج شوید؟')) {
            authManager.logout();
            showMessage('با موفقیت از پنل مدیریت خارج شدید', 'success');
        }
    });

    // اعتبارسنجی فیلدهای شماره تلفن
    setupPhoneValidation();

    // اعتبارسنجی کد ملی
    setupNationalIdValidation();
    
    // تنظیم رویدادهای احراز هویت
    authManager.setupAuthEvents();
}

// تنظیم اعتبارسنجی شماره تلفن
function setupPhoneValidation() {
    const phoneFields = ['fatherPhone', 'motherPhone', 'studentPhone'];
    
    phoneFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, ''); // حذف کاراکترهای غیر عددی
                
                if (value.length > 11) {
                    value = value.slice(0, 11);
                }
                
                e.target.value = value;
            });

            field.addEventListener('blur', function(e) {
                const value = e.target.value;
                if (value && !value.match(/^09[0-9]{9}$/)) {
                    e.target.setCustomValidity('شماره تلفن باید به صورت 09xxxxxxxxx باشد');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }
    });
}

// تنظیم اعتبارسنجی کد ملی
function setupNationalIdValidation() {
    const nationalIdField = document.getElementById('nationalId');
    
    nationalIdField.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // حذف کاراکترهای غیر عددی
        
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        
        e.target.value = value;
    });

    nationalIdField.addEventListener('blur', function(e) {
        const value = e.target.value;
        if (value && !isValidNationalId(value)) {
            e.target.setCustomValidity('کد ملی وارد شده معتبر نیست');
        } else {
            e.target.setCustomValidity('');
        }
    });
}

// اعتبارسنجی کد ملی
function isValidNationalId(nationalId) {
    if (!/^[0-9]{10}$/.test(nationalId)) {
        return false;
    }

    const check = parseInt(nationalId[9]);
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
        sum += parseInt(nationalId[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    
    if (remainder < 2) {
        return check === remainder;
    } else {
        return check === 11 - remainder;
    }
}

// تعویض بخش‌ها
function switchSection(section) {
    // بررسی احراز هویت برای پنل مدیریت
    if (section === 'dashboard' && !authManager.requireAuth()) {
        authManager.showLoginModal();
        return;
    }

    // حذف کلاس active از همه دکمه‌ها
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // مخفی کردن همه بخش‌ها
    document.getElementById('registrationSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'none';

    // نمایش بخش انتخاب شده
    if (section === 'registration') {
        document.getElementById('registrationSection').style.display = 'block';
        document.getElementById('registrationBtn').classList.add('active');
    } else if (section === 'dashboard') {
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('dashboardBtn').classList.add('active');
        loadDashboardData();
    }

    currentSection = section;
}

// مدیریت ثبت نام دانش آموز
async function handleStudentRegistration(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    
    // تبدیل داده‌های فرم
    const studentData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        fatherName: formData.get('fatherName'),
        nationalId: formData.get('nationalId'),
        className: formData.get('className'),
        address: formData.get('address'),
        medicalConditions: formData.get('medicalConditions'),
        fatherJob: formData.get('fatherJob'),
        motherJob: formData.get('motherJob'),
        fatherPhone: formData.get('fatherPhone'),
        motherPhone: formData.get('motherPhone'),
        studentPhone: formData.get('studentPhone')
    };

    try {
        showLoading(true);

        // ثبت دانش آموز
        await db.registerStudent(studentData);

        showMessage(MESSAGES.SUCCESS.STUDENT_REGISTERED, 'success');
        
        // پاک کردن فرم
        form.reset();

        // به‌روزرسانی داشبورد اگر در حال نمایش است
        if (currentSection === 'dashboard') {
            await loadDashboardData();
        }

    } catch (error) {
        console.error('Registration error:', error);
        
        let errorMessage = MESSAGES.ERROR.GENERAL;
        if (error.message === MESSAGES.ERROR.DUPLICATE_NATIONAL_ID) {
            errorMessage = error.message;
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// بارگذاری داده‌های اولیه
async function loadInitialData() {
    try {
        // بارگذاری آمار
        await updateStatistics();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// بارگذاری داده‌های داشبورد
async function loadDashboardData() {
    try {
        showLoading(true);

        // بارگذاری آمار
        await updateStatistics();

        // بارگذاری لیست دانش آموزان
        await loadStudentsList();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage(MESSAGES.ERROR.GENERAL, 'error');
    } finally {
        showLoading(false);
    }
}

// به‌روزرسانی آمار
async function updateStatistics() {
    try {
        const stats = await db.getStatistics();

        document.getElementById('totalStudents').textContent = stats.registered;
        document.getElementById('expectedStudents').textContent = stats.expected;
        document.getElementById('allowedStudents').textContent = stats.allowed;
        document.getElementById('remainingStudents').textContent = Math.max(0, stats.remaining);

    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// بارگذاری لیست دانش آموزان
async function loadStudentsList(filters = {}) {
    try {
        const students = await db.getRegisteredStudents(filters);
        displayStudentsList(students);
    } catch (error) {
        console.error('Error loading students list:', error);
        showMessage(MESSAGES.ERROR.GENERAL, 'error');
    }
}

// نمایش لیست دانش آموزان
function displayStudentsList(students) {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px; color: #6c757d;">
                    هیچ دانش آموزی یافت نشد
                </td>
            </tr>
        `;
        return;
    }

    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.class_name}</td>
            <td>${student.national_id}</td>
            <td>${student.father_name}</td>
            <td>${student.father_phone}</td>
            <td>${formatDate(student.created_at)}</td>
            <td>
                <button class="view-btn" onclick="viewStudentDetails(${student.id})">مشاهده</button>
                <button class="delete-btn" onclick="deleteStudent(${student.id})">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// فیلتر کردن دانش آموزان
async function filterStudents() {
    const search = document.getElementById('searchInput').value.trim();
    const className = document.getElementById('classFilter').value;

    const filters = {};
    if (search) filters.search = search;
    if (className) filters.className = className;

    await loadStudentsList(filters);
}

// نمایش جزئیات دانش آموز
function viewStudentDetails(studentId) {
    // پیاده‌سازی نمایش جزئیات در مودال
    showMessage('قابلیت مشاهده جزئیات به زودی اضافه خواهد شد', 'info');
}

// حذف دانش آموز
async function deleteStudent(studentId) {
    if (!confirm('آیا از حذف این دانش آموز اطمینان دارید؟')) {
        return;
    }

    try {
        showLoading(true);
        
        await db.deleteStudent(studentId);
        
        showMessage(MESSAGES.SUCCESS.STUDENT_DELETED, 'success');
        
        // به‌روزرسانی لیست و آمار
        await loadDashboardData();

    } catch (error) {
        console.error('Error deleting student:', error);
        showMessage(MESSAGES.ERROR.GENERAL, 'error');
    } finally {
        showLoading(false);
    }
}

// نمایش/مخفی کردن دانش آموزان بدون ثبت نام
async function toggleRemainingStudents() {
    const section = document.getElementById('remainingStudentsSection');
    
    if (section.style.display === 'none' || !section.style.display) {
        try {
            showLoading(true);
            
            const unregisteredStudents = await db.getUnregisteredStudents();
            const listContainer = document.getElementById('remainingStudentsList');
            
            if (unregisteredStudents.length === 0) {
                listContainer.innerHTML = '<p style="color: #28a745; font-weight: 500;">🎉 همه دانش آموزان مورد انتظار ثبت نام کرده‌اند!</p>';
            } else {
                listContainer.innerHTML = unregisteredStudents
                    .map(student => `
                        <div class="remaining-student-item">
                            ${student.first_name} ${student.last_name}
                            ${student.class_name ? `- کلاس ${student.class_name}` : ''}
                        </div>
                    `).join('');
            }
            
            section.style.display = 'block';
        } catch (error) {
            console.error('Error loading unregistered students:', error);
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        } finally {
            showLoading(false);
        }
    } else {
        section.style.display = 'none';
    }
}

// نمایش پیام
function showMessage(text, type = 'info') {
    const container = document.getElementById('messageContainer');
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    container.appendChild(message);
    
    // حذف خودکار پیام
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, UI_CONFIG.MESSAGE_DURATION);
}

// نمایش/مخفی کردن loading
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// فرمت کردن تاریخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

// تابع debounce برای بهینه‌سازی جستجو
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}