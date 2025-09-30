export interface AttendanceRecord {
  date: string;
  actualStart: string;
  actualEnd: string;
  updatedStart: string;
  updatedEnd: string;
  totalHours: string;
  totalWorkedHours: string,
  extraMinutes: number,
  lateMinutes: string,
  punches: string[],
  grandTotal: string,
  balance: number,
  overTime: number,
}

export interface AttendanceData {
  id: number;
  name: string;
  department: string;
  attendances: AttendanceRecord[];
}