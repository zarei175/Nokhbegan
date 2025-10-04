// متغیرهای سراسری
let currentSection = 'registration';

// مقداردهی اولیه هنگام لود شدن صفحه
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // مقداردهی Supabase
        if (!initializeSupabase()) {
            showMessage('خطا در اتصال به پایگاه داده', 'error');
            return;
        }

        // تست اتصال به Supabase
        const connectionTest = await testSupabaseConnection();
        if (!connectionTest) {
            showMessage('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.', 'error');
            return;
        }

        // ایجاد جداول
        await db.createTables();

        // تنظیم event listeners
        setupEventListeners();

        // بارگذاری داده‌ها
        await loadInitialData();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showMessage('خطا در راه‌اندازی برنامه. لطفاً صفحه را رفرش کنید.', 'error');
    }
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

// اعتبارسنجی داده‌های دانش آموز
function validateStudentData(data) {
    // بررسی فیلدهای اجباری
    const requiredFields = [
        { field: 'firstName', name: 'نام' },
        { field: 'lastName', name: 'نام خانوادگی' },
        { field: 'fatherName', name: 'نام پدر' },
        { field: 'nationalId', name: 'کد ملی' },
        { field: 'className', name: 'کلاس' },
        { field: 'address', name: 'آدرس' },
        { field: 'fatherJob', name: 'شغل پدر' },
        { field: 'motherJob', name: 'شغل مادر' },
        { field: 'fatherPhone', name: 'شماره همراه پدر' },
        { field: 'motherPhone', name: 'شماره همراه مادر' }
    ];

    for (const { field, name } of requiredFields) {
        if (!data[field] || data[field].length === 0) {
            return {
                isValid: false,
                error: `لطفاً ${name} را وارد کنید.`
            };
        }
    }

    // اعتبارسنجی کد ملی
    if (!isValidNationalId(data.nationalId)) {
        return {
            isValid: false,
            error: 'کد ملی وارد شده معتبر نیست.'
        };
    }

    // اعتبارسنجی شماره تلفن‌ها
    const phonePattern = /^09[0-9]{9}$/;
    if (!phonePattern.test(data.fatherPhone)) {
        return {
            isValid: false,
            error: 'شماره همراه پدر باید به صورت 09xxxxxxxxx باشد.'
        };
    }

    if (!phonePattern.test(data.motherPhone)) {
        return {
            isValid: false,
            error: 'شماره همراه مادر باید به صورت 09xxxxxxxxx باشد.'
        };
    }

    if (data.studentPhone && !phonePattern.test(data.studentPhone)) {
        return {
            isValid: false,
            error: 'شماره همراه دانش آموز باید به صورت 09xxxxxxxxx باشد.'
        };
    }

    return { isValid: true };
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

    console.log('📋 شروع فرآیند ثبت نام...');

    const form = event.target;
    const formData = new FormData(form);
    
    // تبدیل داده‌های فرم
    const studentData = {
        firstName: formData.get('firstName')?.trim(),
        lastName: formData.get('lastName')?.trim(),
        fatherName: formData.get('fatherName')?.trim(),
        nationalId: formData.get('nationalId')?.trim(),
        className: formData.get('className')?.trim(),
        address: formData.get('address')?.trim(),
        medicalConditions: formData.get('medicalConditions')?.trim(),
        fatherJob: formData.get('fatherJob')?.trim(),
        motherJob: formData.get('motherJob')?.trim(),
        fatherPhone: formData.get('fatherPhone')?.trim(),
        motherPhone: formData.get('motherPhone')?.trim(),
        studentPhone: formData.get('studentPhone')?.trim()
    };

    console.log('📝 داده‌های فرم:', { ...studentData, nationalId: '***' }); // مخفی کردن کد ملی در لاگ

    // اعتبارسنجی داده‌های ورودی
    console.log('🔍 اعتبارسنجی داده‌ها...');
    const validationResult = validateStudentData(studentData);
    if (!validationResult.isValid) {
        console.warn('⚠️ اعتبارسنجی ناموفق:', validationResult.error);
        showMessage(validationResult.error, 'error');
        return;
    }

    console.log('✅ اعتبارسنجی موفق');

    try {
        showLoading(true);

        // ثبت دانش آموز با retry
        console.log('💾 شروع ثبت در پایگاه داده...');
        
        await connectionManager.executeWithRetry(
            async () => await db.registerStudent(studentData),
            'ثبت نام دانش آموز'
        );

        console.log('✅ ثبت نام با موفقیت انجام شد');
        showMessage(MESSAGES.SUCCESS.STUDENT_REGISTERED, 'success');
        
        // پاک کردن فرم
        form.reset();
        console.log('🧹 فرم پاک شد');

        // به‌روزرسانی داشبورد اگر در حال نمایش است
        if (currentSection === 'dashboard') {
            console.log('🔄 به‌روزرسانی داشبورد...');
            await loadDashboardData();
        }

    } catch (error) {
        console.error('❌ خطا در ثبت نام:', error);
        
        // لاگ‌گذاری خطا
        errorHandler.logError(error, { 
            operation: 'handleStudentRegistration',
            studentName: `${studentData.firstName} ${studentData.lastName}`
        });
        
        // دریافت پیام کاربرپسند
        const errorMessage = errorHandler.getUserFriendlyMessage(error);
        
        showMessage(errorMessage, 'error');
        
        // نمایش راهنمایی اضافی برای خطاهای خاص
        if (errorHandler.categorizeError(error) === 'database') {
            console.log('💡 راهنمایی: لطفاً مطمئن شوید که:');
            console.log('   1. اتصال اینترنت برقرار است');
            console.log('   2. جداول پایگاه داده ایجاد شده‌اند');
            console.log('   3. دسترسی‌های لازم تنظیم شده‌اند');
        }
        
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
            console.log('🔍 بارگذاری دانش آموزان بدون ثبت نام...');
            
            const unregisteredStudents = await db.getUnregisteredStudents();
            const listContainer = document.getElementById('remainingStudentsList');
            
            if (unregisteredStudents.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #28a745;">
                        <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                        <h3>عالی!</h3>
                        <p style="font-weight: 500;">همه دانش آموزان مورد انتظار ثبت نام کرده‌اند!</p>
                    </div>
                `;
            } else {
                // گروه‌بندی بر اساس کلاس
                const byClass = groupStudentsByClass(unregisteredStudents);
                
                let html = `
                    <div class="remaining-header">
                        <h4>دانش آموزان بدون ثبت نام (${unregisteredStudents.length} نفر)</h4>
                        <button class="export-remaining-btn" onclick="exportRemainingStudentsToExcel()">
                            📊 خروجی اکسل
                        </button>
                    </div>
                `;
                
                // نمایش به تفکیک کلاس
                Object.keys(byClass).sort().forEach(className => {
                    const students = byClass[className];
                    html += `
                        <div class="class-group">
                            <div class="class-group-header">
                                <h5>کلاس ${className} (${students.length} نفر)</h5>
                                <button class="export-class-btn" onclick="exportClassToExcel('${className}', ${JSON.stringify(students).replace(/"/g, '&quot;')})">
                                    📥 خروجی این کلاس
                                </button>
                            </div>
                            <div class="class-group-body">
                                ${students.map((student, index) => `
                                    <div class="remaining-student-item">
                                        <span class="student-number">${index + 1}</span>
                                        <span class="student-name">${student.first_name} ${student.last_name}</span>
                                        ${student.national_id ? `<span class="student-national-id">${student.national_id}</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
                
                listContainer.innerHTML = html;
                console.log('✅ دانش آموزان بدون ثبت نام نمایش داده شد');
            }
            
            section.style.display = 'block';
        } catch (error) {
            console.error('❌ خطا در بارگذاری دانش آموزان بدون ثبت نام:', error);
            errorHandler.logError(error, { operation: 'toggleRemainingStudents' });
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        } finally {
            showLoading(false);
        }
    } else {
        section.style.display = 'none';
    }
}

// گروه‌بندی دانش آموزان بر اساس کلاس
function groupStudentsByClass(students) {
    const grouped = {};
    
    students.forEach(student => {
        const className = student.class_name || 'نامشخص';
        if (!grouped[className]) {
            grouped[className] = [];
        }
        grouped[className].push(student);
    });
    
    return grouped;
}

// خروجی اکسل همه دانش آموزان بدون ثبت نام
async function exportRemainingStudentsToExcel() {
    try {
        console.log('📊 شروع خروجی اکسل دانش آموزان بدون ثبت نام...');
        showLoading(true);
        
        const unregisteredStudents = await db.getUnregisteredStudents();
        
        if (unregisteredStudents.length === 0) {
            showMessage('هیچ دانش آموز بدون ثبت نامی وجود ندارد', 'info');
            return;
        }
        
        // گروه‌بندی بر اساس کلاس
        const byClass = groupStudentsByClass(unregisteredStudents);
        
        // ایجاد workbook
        const wb = XLSX.utils.book_new();
        
        // ایجاد sheet خلاصه
        const summaryData = [
            ['گزارش دانش آموزان بدون ثبت نام'],
            ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
            ['تعداد کل:', unregisteredStudents.length],
            [],
            ['کلاس', 'تعداد']
        ];
        
        Object.keys(byClass).sort().forEach(className => {
            summaryData.push([className, byClass[className].length]);
        });
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'خلاصه');
        
        // ایجاد sheet برای هر کلاس
        Object.keys(byClass).sort().forEach(className => {
            const students = byClass[className];
            const classData = [
                [`دانش آموزان بدون ثبت نام - کلاس ${className}`],
                [],
                ['ردیف', 'نام', 'نام خانوادگی', 'کد ملی']
            ];
            
            students.forEach((student, index) => {
                classData.push([
                    index + 1,
                    student.first_name,
                    student.last_name,
                    student.national_id || ''
                ]);
            });
            
            const classSheet = XLSX.utils.aoa_to_sheet(classData);
            
            // تنظیم عرض ستون‌ها
            classSheet['!cols'] = [
                { wch: 8 },
                { wch: 15 },
                { wch: 15 },
                { wch: 12 }
            ];
            
            XLSX.utils.book_append_sheet(wb, classSheet, `کلاس ${className}`);
        });
        
        // ایجاد sheet لیست کامل
        const allData = [
            ['لیست کامل دانش آموزان بدون ثبت نام'],
            [],
            ['ردیف', 'نام', 'نام خانوادگی', 'کلاس', 'کد ملی']
        ];
        
        unregisteredStudents.forEach((student, index) => {
            allData.push([
                index + 1,
                student.first_name,
                student.last_name,
                student.class_name || 'نامشخص',
                student.national_id || ''
            ]);
        });
        
        const allSheet = XLSX.utils.aoa_to_sheet(allData);
        allSheet['!cols'] = [
            { wch: 8 },
            { wch: 15 },
            { wch: 15 },
            { wch: 10 },
            { wch: 12 }
        ];
        
        XLSX.utils.book_append_sheet(wb, allSheet, 'لیست کامل');
        
        // دانلود فایل
        const fileName = `دانش_آموزان_بدون_ثبت_نام_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log('✅ فایل اکسل با موفقیت ایجاد شد');
        showMessage('فایل اکسل با موفقیت دانلود شد', 'success');
        
    } catch (error) {
        console.error('❌ خطا در ایجاد فایل اکسل:', error);
        errorHandler.logError(error, { operation: 'exportRemainingStudentsToExcel' });
        showMessage('خطا در ایجاد فایل اکسل', 'error');
    } finally {
        showLoading(false);
    }
}

// خروجی اکسل یک کلاس خاص
function exportClassToExcel(className, studentsJson) {
    try {
        console.log(`📊 خروجی اکسل کلاس ${className}...`);
        
        const students = typeof studentsJson === 'string' ? JSON.parse(studentsJson) : studentsJson;
        
        // ایجاد workbook
        const wb = XLSX.utils.book_new();
        
        // داده‌های sheet
        const data = [
            [`دانش آموزان بدون ثبت نام - کلاس ${className}`],
            [`تاریخ: ${new Date().toLocaleDateString('fa-IR')}`],
            [`تعداد: ${students.length} نفر`],
            [],
            ['ردیف', 'نام', 'نام خانوادگی', 'کد ملی']
        ];
        
        students.forEach((student, index) => {
            data.push([
                index + 1,
                student.first_name,
                student.last_name,
                student.national_id || ''
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // تنظیم عرض ستون‌ها
        ws['!cols'] = [
            { wch: 8 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, `کلاس ${className}`);
        
        // دانلود فایل
        const fileName = `کلاس_${className}_بدون_ثبت_نام_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log('✅ فایل اکسل کلاس با موفقیت ایجاد شد');
        showMessage(`فایل اکسل کلاس ${className} دانلود شد`, 'success');
        
    } catch (error) {
        console.error('❌ خطا در ایجاد فایل اکسل کلاس:', error);
        errorHandler.logError(error, { operation: 'exportClassToExcel', className });
        showMessage('خطا در ایجاد فایل اکسل', 'error');
    }
}

// نمایش پیام
function showMessage(text, type = 'info') {
    const container = document.getElementById('messageContainer');
    
    // ایجاد پیام جدید
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    // اضافه کردن آیکون بر اساس نوع پیام
    const icon = document.createElement('span');
    icon.className = 'message-icon';
    
    let iconText = 'ℹ';
    switch (type) {
        case 'success':
            iconText = '✓';
            break;
        case 'error':
            iconText = '✗';
            break;
        case 'warning':
            iconText = '⚠';
            break;
        case 'info':
            iconText = 'ℹ';
            break;
    }
    icon.textContent = iconText;
    
    // اضافه کردن متن پیام
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    message.appendChild(icon);
    message.appendChild(textSpan);
    
    // اضافه کردن دکمه بستن
    const closeBtn = document.createElement('button');
    closeBtn.className = 'message-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => {
        message.classList.add('fade-out');
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    };
    message.appendChild(closeBtn);
    
    // اضافه کردن به container
    container.appendChild(message);
    
    // انیمیشن ورود
    setTimeout(() => {
        message.classList.add('show');
    }, 10);
    
    // حذف خودکار پیام
    const duration = type === 'error' ? UI_CONFIG.MESSAGE_DURATION * 2 : UI_CONFIG.MESSAGE_DURATION;
    setTimeout(() => {
        if (message.parentNode) {
            message.classList.add('fade-out');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }
    }, duration);
    
    // لاگ کردن پیام
    console.log(`📢 پیام [${type}]:`, text);
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