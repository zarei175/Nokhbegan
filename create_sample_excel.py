#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import xlsxwriter
from datetime import datetime

def create_national_ids_sample():
    """ایجاد فایل نمونه Excel برای کدهای ملی مجاز"""
    
    # ایجاد workbook
    workbook = xlsxwriter.Workbook('sample_national_ids.xlsx')
    worksheet = workbook.add_worksheet('کدهای ملی مجاز')
    
    # تعریف فرمت‌ها
    header_format = workbook.add_format({
        'bold': True,
        'font_size': 12,
        'bg_color': '#4472C4',
        'font_color': 'white',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1
    })
    
    data_format = workbook.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'border': 1
    })
    
    # تنظیم عرض ستون‌ها
    worksheet.set_column('A:A', 12)  # کد ملی
    worksheet.set_column('B:B', 20)  # نام دانش آموز  
    worksheet.set_column('C:C', 10)  # کلاس
    
    # نوشتن هدرها
    headers = ['کد ملی', 'نام دانش آموز', 'کلاس']
    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)
    
    # داده‌های نمونه (کدهای ملی ساختگی اما معتبر)
    sample_data = [
        ['0123456789', 'علی احمدی', '۸۰۱'],
        ['1234567890', 'فاطمه رضایی', '۸۰۲'],
        ['2345678901', 'محمد حسینی', '۸۰۳'],
        ['3456789012', 'زهرا محمدی', '۸۰۴'],
        ['4567890123', 'حسن علوی', '۸۰۵'],
        ['5678901234', 'مریم کریمی', '۸۰۶'],
        ['6789012345', 'رضا احمدزاده', '۸۰۷'],
        ['7890123456', 'سارا موسوی', '۷۰۱'],
        ['8901234567', 'امیر کاظمی', '۷۰۲'],
        ['9012345678', 'نرگس زارعی', '۷۰۳'],
    ]
    
    # نوشتن داده‌ها
    for row, data in enumerate(sample_data, 1):
        for col, value in enumerate(data):
            worksheet.write(row, col, value, data_format)
    
    # اضافه کردن راهنما
    worksheet.merge_range('E1:G1', 'راهنمای استفاده:', header_format)
    guide_format = workbook.add_format({'text_wrap': True, 'valign': 'top'})
    
    guide_text = """
1. ستون "کد ملی" اجباری است و باید 10 رقم باشد
2. ستون "نام دانش آموز" اختیاری است
3. ستون "کلاس" اختیاری است
4. کدهای ملی باید از نظر ریاضی معتبر باشند
5. هر کد ملی تنها یک بار قابل استفاده است
    """
    
    worksheet.merge_range('E2:G8', guide_text, guide_format)
    
    # اضافه کردن تاریخ ایجاد
    date_format = workbook.add_format({'italic': True, 'font_size': 10})
    worksheet.write('E10', f'تاریخ ایجاد: {datetime.now().strftime("%Y/%m/%d %H:%M")}', date_format)
    
    workbook.close()
    print("✅ فایل sample_national_ids.xlsx با موفقیت ایجاد شد!")

def create_students_sample():
    """ایجاد فایل نمونه Excel برای دانش‌آموزان مورد انتظار"""
    
    workbook = xlsxwriter.Workbook('sample_expected_students.xlsx')
    worksheet = workbook.add_worksheet('دانش آموزان مورد انتظار')
    
    # تعریف فرمت‌ها
    header_format = workbook.add_format({
        'bold': True,
        'font_size': 12,
        'bg_color': '#70AD47',
        'font_color': 'white',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1
    })
    
    data_format = workbook.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'border': 1
    })
    
    # تنظیم عرض ستون‌ها
    worksheet.set_column('A:A', 15)  # نام
    worksheet.set_column('B:B', 15)  # نام خانوادگی
    worksheet.set_column('C:C', 10)  # کلاس
    
    # نوشتن هدرها
    headers = ['نام', 'نام خانوادگی', 'کلاس']
    for col, header in enumerate(headers):
        worksheet.write(0, col, header, header_format)
    
    # داده‌های نمونه
    sample_data = [
        ['علی', 'احمدی', '۸۰۱'],
        ['فاطمه', 'رضایی', '۸۰۲'],
        ['محمد', 'حسینی', '۸۰۳'],
        ['زهرا', 'محمدی', '۸۰۴'],
        ['حسن', 'علوی', '۸۰۵'],
        ['مریم', 'کریمی', '۸۰۶'],
        ['رضا', 'احمدزاده', '۸۰۷'],
        ['سارا', 'موسوی', '۷۰۱'],
        ['امیر', 'کاظمی', '۷۰۲'],
        ['نرگس', 'زارعی', '۷۰۳'],
    ]
    
    # نوشتن داده‌ها
    for row, data in enumerate(sample_data, 1):
        for col, value in enumerate(data):
            worksheet.write(row, col, value, data_format)
    
    workbook.close()
    print("✅ فایل sample_expected_students.xlsx با موفقیت ایجاد شد!")

if __name__ == "__main__":
    create_national_ids_sample()
    create_students_sample()
    print("\n🎉 همه فایل‌های نمونه ایجاد شدند!")
    print("📁 فایل‌های ایجاد شده:")
    print("   - sample_national_ids.xlsx (برای آپلود کدهای ملی مجاز)")
    print("   - sample_expected_students.xlsx (برای آپلود دانش‌آموزان مورد انتظار)")