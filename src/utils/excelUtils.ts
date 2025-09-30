import * as XLSX from 'xlsx';
import { AttendanceData } from '../types/attendance';

export const exportToExcel = (data: AttendanceData[], originalFileName: string) => {
  // Flatten the data for Excel export
  const flattenedData = data.reduce((acc, employee) => {
    employee.attendances.forEach(record => {
      acc.push({
        ID: employee.id,
        Name: employee.name,
        Department: employee.department,
        Date: record.date,
        'Actual Start': record.actualStart,
        'Actual End': record.actualEnd,
        'Updated Start': record.updatedStart,
        'Updated End': record.updatedEnd,
        'Total worked Hours': record.totalWorkedHours,
        'Extra Time': record.extraMinutes,
        'Total Hours': record.totalHours
      });
    });
    return acc;
  }, [] as any[]);

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);

  // Auto-size columns
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  const colWidths = [];
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 0;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        const cellText = cell.v.toString();
        maxWidth = Math.max(maxWidth, cellText.length);
      }
    }
    colWidths[C] = { wch: Math.min(maxWidth + 2, 50) };
  }
  
  worksheet['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const fileName = originalFileName 
    ? `updated_${originalFileName.replace(/\.[^/.]+$/, '')}_${timestamp}.xlsx`
    : `attendance_export_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, fileName);
};