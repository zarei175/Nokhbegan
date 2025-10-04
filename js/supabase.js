// ایجاد کلاینت Supabase
let supabase;

// تابع مقداردهی اولیه Supabase
function initializeSupabase() {
    try {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        showMessage('خطا در اتصال به پایگاه داده', 'error');
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
            // بررسی تکراری بودن کد ملی
            const { data: existingStudent, error: checkError } = await supabase
                .from(TABLES.STUDENTS)
                .select('id')
                .eq('national_id', studentData.nationalId)
                .single();

            if (existingStudent) {
                throw new Error(MESSAGES.ERROR.DUPLICATE_NATIONAL_ID);
            }

            // بررسی مجاز بودن کد ملی
            const allowedNationalId = await this.checkNationalIdAllowed(studentData.nationalId);
            if (!allowedNationalId) {
                throw new Error(MESSAGES.ERROR.NATIONAL_ID_NOT_ALLOWED);
            }

            if (allowedNationalId.is_used) {
                throw new Error(MESSAGES.ERROR.NATIONAL_ID_ALREADY_USED);
            }

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

            const { data, error } = await supabase
                .from(TABLES.STUDENTS)
                .insert([dbData])
                .select();

            if (error) {
                throw error;
            }

            // به‌روزرسانی وضعیت ثبت نام در جدول دانش آموزان مورد انتظار
            await this.updateExpectedStudentStatus(studentData.firstName, studentData.lastName);

            // به‌روزرسانی وضعیت کد ملی به استفاده شده
            await this.markNationalIdAsUsed(studentData.nationalId);

            return data[0];
        } catch (error) {
            console.error('Error registering student:', error);
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
            const { data, error } = await supabase
                .from(TABLES.EXPECTED_STUDENTS)
                .select('*')
                .eq('is_registered', false)
                .order('first_name', { ascending: true });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching unregistered students:', error);
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
            const { data, error } = await supabase
                .from(TABLES.ALLOWED_NATIONAL_IDS)
                .select('*')
                .eq('national_id', nationalId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error checking national ID:', error);
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