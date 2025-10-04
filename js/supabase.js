// ایجاد کلاینت Supabase
let supabase;

// تابع مقداردهی اولیه Supabase
function initializeSupabase() {
    try {
        console.log('🚀 در حال راه‌اندازی Supabase...');
        
        // بررسی وجود تنظیمات
        if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
            throw new Error('تنظیمات Supabase یافت نشد');
        }

        // بررسی فرمت URL
        if (!SUPABASE_CONFIG.url.startsWith('https://')) {
            throw new Error('URL پایگاه داده نامعتبر است');
        }

        // بررسی وجود کتابخانه Supabase
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            throw new Error('کتابخانه Supabase بارگذاری نشده است');
        }

        // ایجاد کلاینت
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: {
                persistSession: false
            },
            global: {
                headers: {
                    'x-client-info': 'student-registration-system'
                }
            }
        });

        console.log('✅ Supabase با موفقیت راه‌اندازی شد');
        console.log('📍 URL:', SUPABASE_CONFIG.url);
        console.log('🆔 Project ID:', SUPABASE_CONFIG.projectId);
        
        return true;
        
    } catch (error) {
        console.error('❌ خطا در راه‌اندازی Supabase:', error);
        errorHandler.logError(error, { operation: 'initializeSupabase' });
        
        const userMessage = errorHandler.getUserFriendlyMessage(error);
        showMessage(userMessage, 'error');
        
        return false;
    }
}

// تست اتصال به Supabase
async function testSupabaseConnection() {
    try {
        console.log('🔍 در حال تست اتصال به پایگاه داده...');
        
        const isConnected = await connectionManager.testConnection();
        
        if (!isConnected) {
            console.error('❌ تست اتصال ناموفق بود');
            return false;
        }

        // بررسی وجود جداول
        await connectionManager.verifyTables();
        
        return true;
        
    } catch (error) {
        console.error('❌ خطا در تست اتصال:', error);
        errorHandler.logError(error, { operation: 'testSupabaseConnection' });
        return false;
    }
}

// کلاس مدیریت پایگاه داده
class DatabaseManager {
    
    // ایجاد جداول مورد نیاز
    async createTables() {
        try {
            // ایجاد جدول دانش آموزان ثبت شده
            const studentsTableSQL = `
                CREATE TABLE IF NOT EXISTS students (
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
            `;
            
            // ایجاد جدول دانش آموزان مورد انتظار
            const expectedStudentsTableSQL = `
                CREATE TABLE IF NOT EXISTS expected_students (
                    id SERIAL PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    class_name VARCHAR(10),
                    is_registered BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `;

            console.log('Tables creation initiated');
            return true;
        } catch (error) {
            console.error('Error creating tables:', error);
            return false;
        }
    }

    // ثبت دانش آموز جدید
    async registerStudent(studentData) {
        try {
            console.log('📝 شروع فرآیند ثبت نام دانش آموز...');
            
            // بررسی تکراری بودن کد ملی
            console.log('🔍 بررسی تکراری بودن کد ملی...');
            const { data: existingStudent, error: checkError } = await supabase
                .from(TABLES.STUDENTS)
                .select('id')
                .eq('national_id', studentData.nationalId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('❌ خطا در بررسی کد ملی:', checkError);
                errorHandler.logError(checkError, { operation: 'checkDuplicateNationalId' });
                throw new Error('خطا در بررسی کد ملی. لطفاً دوباره تلاش کنید.');
            }

            if (existingStudent) {
                console.warn('⚠️ کد ملی تکراری است');
                throw new Error(MESSAGES.ERROR.DUPLICATE_NATIONAL_ID);
            }

            console.log('✅ کد ملی تکراری نیست');

            // بررسی مجاز بودن کد ملی
            console.log('🔍 بررسی مجاز بودن کد ملی...');
            const allowedNationalId = await this.checkNationalIdAllowed(studentData.nationalId);
            
            if (!allowedNationalId) {
                console.warn('⚠️ کد ملی در لیست مجاز نیست');
                throw new Error(MESSAGES.ERROR.NATIONAL_ID_NOT_ALLOWED);
            }

            // اگر bypass فعال نیست، بررسی استفاده شدن
            if (!allowedNationalId.bypass && allowedNationalId.is_used) {
                console.warn('⚠️ کد ملی قبلاً استفاده شده است');
                throw new Error(MESSAGES.ERROR.NATIONAL_ID_ALREADY_USED);
            }

            console.log('✅ کد ملی مجاز است');

            // تبدیل داده‌ها به فرمت پایگاه داده
            const dbData = {
                first_name: studentData.firstName,
                last_name: studentData.lastName,
                father_name: studentData.fatherName,
                national_id: studentData.nationalId,
                class_name: studentData.className,
                address: studentData.address,
                medical_conditions: studentData.medicalConditions || null,
                father_job: studentData.fatherJob,
                mother_job: studentData.motherJob,
                father_phone: studentData.fatherPhone,
                mother_phone: studentData.motherPhone,
                student_phone: studentData.studentPhone || null
            };

            console.log('💾 در حال ذخیره اطلاعات در پایگاه داده...');
            const { data, error } = await supabase
                .from(TABLES.STUDENTS)
                .insert([dbData])
                .select();

            if (error) {
                console.error('❌ خطا در ذخیره اطلاعات:', error);
                errorHandler.logError(error, { operation: 'insertStudent' });
                throw error;
            }

            console.log('✅ اطلاعات با موفقیت ذخیره شد');

            // به‌روزرسانی وضعیت ثبت نام در جدول دانش آموزان مورد انتظار
            await this.updateExpectedStudentStatus(studentData.firstName, studentData.lastName);

            // به‌روزرسانی وضعیت کد ملی به استفاده شده (فقط اگر bypass نباشد)
            if (!allowedNationalId.bypass) {
                await this.markNationalIdAsUsed(studentData.nationalId);
            }

            console.log('✅ فرآیند ثبت نام با موفقیت تکمیل شد');
            return data[0];
            
        } catch (error) {
            console.error('❌ خطا در ثبت نام دانش آموز:', error);
            errorHandler.logError(error, { operation: 'registerStudent', studentData });
            throw error;
        }
    }

    // دریافت تمام دانش آموزان ثبت شده
    async getRegisteredStudents(filters = {}) {
        try {
            let query = supabase
                .from(TABLES.STUDENTS)
                .select('*')
                .order('created_at', { ascending: false });

            // اعمال فیلترها
            if (filters.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,national_id.ilike.%${filters.search}%`);
            }

            if (filters.className) {
                query = query.eq('class_name', filters.className);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    }

    // حذف دانش آموز
    async deleteStudent(studentId) {
        try {
            const { error } = await supabase
                .from(TABLES.STUDENTS)
                .delete()
                .eq('id', studentId);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    }

    // آپلود لیست دانش آموزان مورد انتظار
    async uploadExpectedStudents(studentsData) {
        try {
            // پاک کردن داده‌های قبلی
            await supabase
                .from(TABLES.EXPECTED_STUDENTS)
                .delete()
                .neq('id', 0);

            // درج داده‌های جدید
            const { data, error } = await supabase
                .from(TABLES.EXPECTED_STUDENTS)
                .insert(studentsData);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error uploading expected students:', error);
            throw error;
        }
    }

    // دریافت دانش آموزان مورد انتظار
    async getExpectedStudents() {
        try {
            const { data, error } = await supabase
                .from(TABLES.EXPECTED_STUDENTS)
                .select('*')
                .order('first_name', { ascending: true });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching expected students:', error);
            throw error;
        }
    }

    // به‌روزرسانی وضعیت ثبت نام دانش آموز مورد انتظار
    async updateExpectedStudentStatus(firstName, lastName) {
        try {
            const { error } = await supabase
                .from(TABLES.EXPECTED_STUDENTS)
                .update({ is_registered: true })
                .eq('first_name', firstName)
                .eq('last_name', lastName);

            if (error) {
                console.warn('Warning updating expected student status:', error);
            }
        } catch (error) {
            console.warn('Warning updating expected student status:', error);
        }
    }

    // دریافت دانش آموزان بدون ثبت نام
    async getUnregisteredStudents() {
        try {
            console.log('🔍 بارگذاری دانش آموزان بدون ثبت نام...');
            
            // ابتدا از جدول expected_students بگیریم
            const { data: expectedData, error: expectedError } = await supabase
                .from(TABLES.EXPECTED_STUDENTS)
                .select('*')
                .eq('is_registered', false)
                .order('class_name', { ascending: true });

            if (expectedError && expectedError.code !== 'PGRST116') {
                console.warn('⚠️ خطا در بارگذاری از expected_students:', expectedError);
            }

            let unregisteredList = expectedData || [];
            console.log(`📋 ${unregisteredList.length} دانش آموز از expected_students`);

            // سپس از جدول allowed_national_ids بگیریم
            const tableStatus = await connectionManager.verifyTables();
            
            if (tableStatus[TABLES.ALLOWED_NATIONAL_IDS]) {
                try {
                    const { data: allowedData, error: allowedError } = await supabase
                        .from(TABLES.ALLOWED_NATIONAL_IDS)
                        .select('*')
                        .eq('is_used', false)
                        .order('class_name', { ascending: true });

                    if (allowedError) {
                        console.warn('⚠️ خطا در بارگذاری از allowed_national_ids:', allowedError);
                    } else if (allowedData && allowedData.length > 0) {
                        console.log(`📋 ${allowedData.length} دانش آموز از allowed_national_ids`);
                        
                        // تبدیل به فرمت یکسان
                        const formattedAllowed = allowedData.map(item => ({
                            first_name: item.student_name ? item.student_name.split(' ')[0] : '',
                            last_name: item.student_name ? item.student_name.split(' ').slice(1).join(' ') : '',
                            class_name: item.class_name,
                            national_id: item.national_id,
                            is_registered: false
                        }));
                        
                        // ترکیب دو لیست (بدون تکرار)
                        const existingNationalIds = new Set(unregisteredList.map(s => s.national_id).filter(Boolean));
                        
                        formattedAllowed.forEach(student => {
                            if (!existingNationalIds.has(student.national_id)) {
                                unregisteredList.push(student);
                            }
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ خطا در بارگذاری کدهای ملی مجاز:', error);
                }
            }

            // مرتب‌سازی نهایی
            unregisteredList.sort((a, b) => {
                const classA = a.class_name || 'zzz';
                const classB = b.class_name || 'zzz';
                if (classA !== classB) {
                    return classA.localeCompare(classB, 'fa');
                }
                const nameA = `${a.first_name} ${a.last_name}`;
                const nameB = `${b.first_name} ${b.last_name}`;
                return nameA.localeCompare(nameB, 'fa');
            });

            console.log(`✅ مجموع ${unregisteredList.length} دانش آموز بدون ثبت نام`);
            return unregisteredList;
            
        } catch (error) {
            console.error('❌ خطا در بارگذاری دانش آموزان بدون ثبت نام:', error);
            errorHandler.logError(error, { operation: 'getUnregisteredStudents' });
            throw error;
        }
    }

    // دریافت آمار
    async getStatistics() {
        try {
            // تعداد دانش آموزان ثبت شده
            const { count: registeredCount, error: registeredError } = await supabase
                .from(TABLES.STUDENTS)
                .select('*', { count: 'exact', head: true });

            if (registeredError) {
                throw registeredError;
            }

            // تعداد دانش آموزان مورد انتظار
            const { count: expectedCount, error: expectedError } = await supabase
                .from(TABLES.EXPECTED_STUDENTS)
                .select('*', { count: 'exact', head: true });

            if (expectedError) {
                throw expectedError;
            }

            // تعداد کدهای ملی مجاز
            const { count: allowedCount, error: allowedError } = await supabase
                .from(TABLES.ALLOWED_NATIONAL_IDS)
                .select('*', { count: 'exact', head: true });

            if (allowedError) {
                console.warn('Error fetching allowed national IDs count:', allowedError);
            }

            return {
                registered: registeredCount || 0,
                expected: expectedCount || 0,
                allowed: allowedCount || 0,
                remaining: Math.max(0, (allowedCount || expectedCount || 0) - (registeredCount || 0))
            };
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return {
                registered: 0,
                expected: 0,
                allowed: 0,
                remaining: 0
            };
        }
    }

    // بررسی مجاز بودن کد ملی
    async checkNationalIdAllowed(nationalId) {
        try {
            // بررسی وجود جدول
            const tableStatus = await connectionManager.verifyTables();
            
            if (!tableStatus[TABLES.ALLOWED_NATIONAL_IDS]) {
                console.warn('⚠️ جدول allowed_national_ids موجود نیست - بررسی کد ملی نادیده گرفته می‌شود');
                // اگر جدول وجود ندارد، اجازه ثبت نام می‌دهیم
                return { national_id: nationalId, is_used: false, bypass: true };
            }

            const { data, error } = await supabase
                .from(TABLES.ALLOWED_NATIONAL_IDS)
                .select('*')
                .eq('national_id', nationalId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('❌ خطا در بررسی کد ملی:', error);
                errorHandler.logError(error, { operation: 'checkNationalIdAllowed', nationalId });
                throw error;
            }

            if (!data) {
                console.warn('⚠️ کد ملی در لیست مجاز نیست:', nationalId);
            } else {
                console.log('✅ کد ملی در لیست مجاز است:', nationalId);
            }

            return data;
            
        } catch (error) {
            console.error('❌ خطا در بررسی کد ملی:', error);
            errorHandler.logError(error, { operation: 'checkNationalIdAllowed', nationalId });
            
            // اگر خطای جدول نبود است، اجازه ثبت نام می‌دهیم
            if (error.message?.includes('does not exist')) {
                console.warn('⚠️ جدول موجود نیست - بررسی کد ملی نادیده گرفته می‌شود');
                return { national_id: nationalId, is_used: false, bypass: true };
            }
            
            return null;
        }
    }

    // علامت‌گذاری کد ملی به عنوان استفاده شده
    async markNationalIdAsUsed(nationalId) {
        try {
            const { error } = await supabase
                .from(TABLES.ALLOWED_NATIONAL_IDS)
                .update({ 
                    is_used: true, 
                    used_at: new Date().toISOString() 
                })
                .eq('national_id', nationalId);

            if (error) {
                console.warn('Warning updating national ID status:', error);
            }
        } catch (error) {
            console.warn('Warning marking national ID as used:', error);
        }
    }

    // آپلود لیست کدهای ملی مجاز
    async uploadAllowedNationalIds(nationalIdsData) {
        try {
            // پاک کردن داده‌های قبلی
            await supabase
                .from(TABLES.ALLOWED_NATIONAL_IDS)
                .delete()
                .neq('id', 0);

            // درج داده‌های جدید
            const { data, error } = await supabase
                .from(TABLES.ALLOWED_NATIONAL_IDS)
                .insert(nationalIdsData);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error uploading allowed national IDs:', error);
            throw error;
        }
    }

    // دریافت لیست کدهای ملی مجاز
    async getAllowedNationalIds() {
        try {
            const { data, error } = await supabase
                .from(TABLES.ALLOWED_NATIONAL_IDS)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching allowed national IDs:', error);
            throw error;
        }
    }
}

// ایجاد نمونه از مدیریت پایگاه داده
const db = new DatabaseManager();