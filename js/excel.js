// مدیریت عملیات اکسل (خروجی و ورودی)

class ExcelManager {
    constructor() {
        this.expectedStudentsData = [];
    }

    // خروجی اکسل دانش آموزان ثبت شده
    async exportRegisteredStudents() {
        try {
            showLoading(true);

            // دریافت داده‌های دانش آموزان ثبت شده
            const students = await db.getRegisteredStudents();

            if (students.length === 0) {
                showMessage('هیچ دانش آموزی برای خروجی یافت نشد!', 'info');
                return;
            }

            // تبدیل داده‌ها به فرمت مناسب برای اکسل
            const excelData = this.prepareStudentsDataForExport(students);

            // ایجاد فایل اکسل
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // تنظیم عرض ستون‌ها
            const columnWidths = [
                { wch: 5 },   // ردیف
                { wch: 15 },  // نام
                { wch: 15 },  // نام خانوادگی
                { wch: 15 },  // نام پدر
                { wch: 12 },  // کد ملی
                { wch: 8 },   // کلاس
                { wch: 30 },  // آدرس
                { wch: 20 },  // بیماری خاص
                { wch: 15 },  // شغل پدر
                { wch: 15 },  // شغل مادر
                { wch: 12 },  // شماره پدر
                { wch: 12 },  // شماره مادر
                { wch: 12 },  // شماره دانش آموز
                { wch: 15 }   // تاریخ ثبت
            ];
            worksheet['!cols'] = columnWidths;

            // اضافه کردن worksheet به workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'دانش آموزان ثبت شده');

            // اضافه کردن شیت آمار
            const statsSheet = this.createStatsSheet(students);
            XLSX.utils.book_append_sheet(workbook, statsSheet, 'آمار کلی');

            // تولید نام فایل با تاریخ
            const fileName = this.generateFileName('students_registered');

            // دانلود فایل
            XLSX.writeFile(workbook, fileName);

            showMessage(MESSAGES.SUCCESS.DATA_EXPORTED, 'success');

        } catch (error) {
            console.error('Error exporting to Excel:', error);
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        } finally {
            showLoading(false);
        }
    }

    // آماده‌سازی داده‌های دانش آموزان برای خروجی
    prepareStudentsDataForExport(students) {
        return students.map((student, index) => ({
            'ردیف': index + 1,
            'نام': student.first_name,
            'نام خانوادگی': student.last_name,
            'نام پدر': student.father_name,
            'کد ملی': student.national_id,
            'کلاس': student.class_name,
            'آدرس': student.address,
            'بیماری خاص': student.medical_conditions || 'ندارد',
            'شغل پدر': student.father_job,
            'شغل مادر': student.mother_job,
            'شماره همراه پدر': student.father_phone,
            'شماره همراه مادر': student.mother_phone,
            'شماره همراه دانش آموز': student.student_phone || 'وارد نشده',
            'تاریخ ثبت': this.formatDateForExcel(student.created_at)
        }));
    }

    // ایجاد شیت آمار
    createStatsSheet(students) {
        // آمار کلی
        const totalCount = students.length;
        
        // آمار بر اساس کلاس
        const classCounts = {};
        students.forEach(student => {
            const className = student.class_name;
            classCounts[className] = (classCounts[className] || 0) + 1;
        });

        // آمار بر اساس بیماری خاص
        const medicalConditionsCount = students.filter(s => s.medical_conditions && s.medical_conditions.trim() !== '').length;

        // آمار بر اساس شماره دانش آموز
        const studentPhoneCount = students.filter(s => s.student_phone && s.student_phone.trim() !== '').length;

        // ساخت داده‌های آماری
        const statsData = [
            { 'شرح': 'کل دانش آموزان ثبت شده', 'تعداد': totalCount },
            { 'شرح': '', 'تعداد': '' }, // سطر خالی
            { 'شرح': 'آمار بر اساس کلاس:', 'تعداد': '' },
        ];

        // اضافه کردن آمار هر کلاس
        Object.entries(classCounts).sort().forEach(([className, count]) => {
            statsData.push({
                'شرح': `کلاس ${className}`,
                'تعداد': count
            });
        });

        statsData.push(
            { 'شرح': '', 'تعداد': '' }, // سطر خالی
            { 'شرح': 'آمار اضافی:', 'تعداد': '' },
            { 'شرح': 'دانش آموزان با بیماری خاص', 'تعداد': medicalConditionsCount },
            { 'شرح': 'دانش آموزان با شماره همراه', 'تعداد': studentPhoneCount },
            { 'شرح': '', 'تعداد': '' }, // سطر خالی
            { 'شرح': 'تاریخ تولید گزارش', 'تعداد': new Date().toLocaleDateString('fa-IR') }
        );

        const worksheet = XLSX.utils.json_to_sheet(statsData);
        
        // تنظیم عرض ستون‌ها
        worksheet['!cols'] = [{ wch: 30 }, { wch: 10 }];

        return worksheet;
    }

    // آپلود فایل اکسل دانش آموزان مورد انتظار
    async importExpectedStudents(file) {
        try {
            showLoading(true);

            if (!file) {
                showMessage(MESSAGES.ERROR.INVALID_FILE, 'error');
                return;
            }

            // خواندن فایل اکسل
            const workbook = await this.readExcelFile(file);
            
            if (!workbook) {
                showMessage(MESSAGES.ERROR.FILE_READ_ERROR, 'error');
                return;
            }

            // دریافت نام شیت اول
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // تبدیل داده‌ها به JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                showMessage('فایل خالی است یا فرمت آن صحیح نمی‌باشد!', 'error');
                return;
            }

            // اعتبارسنجی و تمیز کردن داده‌ها
            const cleanedData = this.validateAndCleanExpectedStudentsData(jsonData);

            if (cleanedData.length === 0) {
                showMessage('هیچ داده معتبری در فایل یافت نشد!', 'error');
                return;
            }

            // آپلود داده‌ها به پایگاه داده
            await db.uploadExpectedStudents(cleanedData);

            showMessage(`${cleanedData.length} دانش آموز مورد انتظار با موفقیت آپلود شد!`, 'success');

            // به‌روزرسانی آمار
            if (typeof updateStatistics === 'function') {
                await updateStatistics();
            }

        } catch (error) {
            console.error('Error importing expected students:', error);
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        } finally {
            showLoading(false);
        }
    }

    // خواندن فایل اکسل
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    resolve(workbook);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('خطا در خواندن فایل'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // اعتبارسنجی و تمیز کردن داده‌های دانش آموزان مورد انتظار
    validateAndCleanExpectedStudentsData(jsonData) {
        const cleanedData = [];
        
        jsonData.forEach((row, index) => {
            // تلاش برای یافتن ستون‌های نام و نام خانوادگی
            const firstName = this.findValueInRow(row, ['نام', 'name', 'first_name', 'firstName']);
            const lastName = this.findValueInRow(row, ['نام خانوادگی', 'نام_خانوادگی', 'last_name', 'lastName', 'family']);
            const className = this.findValueInRow(row, ['کلاس', 'class', 'class_name', 'className']);

            // بررسی وجود حداقل نام و نام خانوادگی
            if (firstName && lastName) {
                const cleanedRow = {
                    first_name: firstName.toString().trim(),
                    last_name: lastName.toString().trim(),
                    class_name: className ? className.toString().trim() : null,
                    is_registered: false
                };

                // بررسی اینکه نام کلاس در لیست مجاز باشد
                if (cleanedRow.class_name && !SCHOOL_CLASSES.includes(cleanedRow.class_name)) {
                    cleanedRow.class_name = null;
                }

                cleanedData.push(cleanedRow);
            } else {
                console.warn(`Row ${index + 1}: Missing required fields (نام، نام خانوادگی)`);
            }
        });

        return cleanedData;
    }

    // یافتن مقدار در سطر بر اساس نام‌های مختلف ستون
    findValueInRow(row, possibleNames) {
        for (const name of possibleNames) {
            if (row.hasOwnProperty(name) && row[name] !== null && row[name] !== undefined && row[name] !== '') {
                return row[name];
            }
        }
        return null;
    }

    // خروجی اکسل دانش آموزان بدون ثبت نام
    async exportUnregisteredStudents() {
        try {
            showLoading(true);

            const unregisteredStudents = await db.getUnregisteredStudents();

            if (unregisteredStudents.length === 0) {
                showMessage('همه دانش آموزان مورد انتظار ثبت نام کرده‌اند! 🎉', 'info');
                return;
            }

            // تبدیل داده‌ها برای اکسل
            const excelData = unregisteredStudents.map((student, index) => ({
                'ردیف': index + 1,
                'نام': student.first_name,
                'نام خانوادگی': student.last_name,
                'کلاس': student.class_name || 'مشخص نشده',
                'وضعیت': 'ثبت نام نشده'
            }));

            // ایجاد فایل اکسل
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // تنظیم عرض ستون‌ها
            worksheet['!cols'] = [
                { wch: 5 },   // ردیف
                { wch: 15 },  // نام
                { wch: 15 },  // نام خانوادگی
                { wch: 10 },  // کلاس
                { wch: 15 }   // وضعیت
            ];

            XLSX.utils.book_append_sheet(workbook, worksheet, 'دانش آموزان بدون ثبت نام');

            // تولید نام فایل
            const fileName = this.generateFileName('students_unregistered');

            // دانلود فایل
            XLSX.writeFile(workbook, fileName);

            showMessage(`لیست ${unregisteredStudents.length} دانش آموز بدون ثبت نام دانلود شد!`, 'success');

        } catch (error) {
            console.error('Error exporting unregistered students:', error);
            showMessage(MESSAGES.ERROR.GENERAL, 'error');
        } finally {
            showLoading(false);
        }
    }

    // تولید نام فایل با تاریخ
    generateFileName(prefix) {
        const now = new Date();
        const persianDate = now.toLocaleDateString('fa-IR').replace(/\//g, '-');
        const time = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
        
        return `${prefix}_${persianDate}_${time}.xlsx`;
    }

    // فرمت تاریخ برای اکسل
    formatDateForExcel(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    }

    // ایجاد فایل نمونه برای آپلود
    createSampleFile() {
        const sampleData = [
            { 'نام': 'محمد', 'نام خانوادگی': 'احمدی', 'کلاس': '۸۰۱' },
            { 'نام': 'فاطمه', 'نام خانوادگی': 'محمدی', 'کلاس': '۸۰۲' },
            { 'نام': 'علی', 'نام خانوادگی': 'رضایی', 'کلاس': '۷۰۱' }
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        
        // تنظیم عرض ستون‌ها
        worksheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }];
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'نمونه');

        // دانلود فایل نمونه
        XLSX.writeFile(workbook, 'sample_expected_students.xlsx');
        
        showMessage('فایل نمونه دانلود شد!', 'success');
    }
}

// ایجاد نمونه مدیر اکسل
const excelManager = new ExcelManager();

// تابع خروجی اکسل (برای استفاده در HTML)
async function exportToExcel() {
    await excelManager.exportRegisteredStudents();
}

// تابع مدیریت آپلود فایل (برای استفاده در HTML)
async function handleFileImport(event) {
    const file = event.target.files[0];
    if (file) {
        await excelManager.importExpectedStudents(file);
        // پاک کردن مقدار input برای امکان آپلود مجدد همان فایل
        event.target.value = '';
    }
}

// تابع دانلود فایل نمونه
function downloadSampleFile() {
    excelManager.createSampleFile();
}

// رویداد آپلود فایل
document.addEventListener('DOMContentLoaded', function() {
    // اضافه کردن دکمه دانلود فایل نمونه
    const importBtn = document.getElementById('importExpected');
    if (importBtn) {
        // ایجاد دکمه نمونه
        const sampleBtn = document.createElement('button');
        sampleBtn.className = 'action-btn';
        sampleBtn.style.background = 'linear-gradient(135deg, #6c757d 0%, #495057 100%)';
        sampleBtn.innerHTML = '<span>📋</span>دانلود فایل نمونه';
        sampleBtn.addEventListener('click', downloadSampleFile);
        
        // اضافه کردن دکمه بعد از دکمه آپلود
        importBtn.parentNode.insertBefore(sampleBtn, importBtn.nextSibling);
    }
});