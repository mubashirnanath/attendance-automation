import { useEffect, useState } from "react";
import { Upload, Download, Calendar, Clock, Users, LogOut } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import FileUpload from "./components/FileUpload";
import AttendanceTable from "./components/AttendanceTable";
import { AttendanceData } from "./types/attendance";
import { exportToExcel } from "./utils/excelUtils";
import { useNavigate } from "react-router-dom";
import { GOOGLE_SCRIPT_URL, monthNames } from "./utils/constants";
import { format, parseISO } from "date-fns";

function App() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [month, setMonth] = useState<string>("");
  const [rawData, setRawData] = useState<any>([]);
  const [userData, setUserData] = useState<any>([]);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const overTimeData = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${month}`);
        const results = await overTimeData.json();
        const result = results?.data?.slice(1).map((row: any) => ({
          date: row[3],
          userId: row[1],
          minutes: row[7],
        }));
        const userData = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Users`);
        const users = await userData.json();

        const userList = users?.data?.slice(1).map((row: any) => ({
          id: row[0],
          name: row[1],
          department: row[2],
          work_start: row[3],
          work_end: row[4],
        }));

        setUserData(userList);

        const convertedData = convertData(rawData, result);
        console.log(convertedData, "convertedData");

        setAttendanceData(convertedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:-1", error);
        setIsLoading(false);
      }
    })();
  }, [month, rawData]);

  console.log(rawData, "rawData");
  console.log(attendanceData, "attendanceData");

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        // Read file as binary
        const data = new Uint8Array(event.target.result);
        const wb = XLSX.read(data, { type: "array" });

        // Get first sheet
        const ws = wb.Sheets[wb.SheetNames[2]];
        const excelData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setRawData(excelData);
        const currDate = excelData[2][2].split(" ")[0];
        const currentMonth = monthNames[new Date(currDate).getMonth()];
        setMonth(currentMonth);

        toast.success("File upload successfully");
      } catch (err) {
        console.error("Error processing file:", err);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
    };

    // ✅ Correct way for xlsx
    reader.readAsArrayBuffer(file);
  };

  if (userData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  const date = { startDate: "", endDate: "" };

  // Helper function to detect if a row contains attendance time data
  function isAttendanceDataRow(row: any[]): boolean {
    if (!Array.isArray(row) || row.length === 0) return false;

    // Check if row contains time-formatted strings (HH:MM or HH:MMHH:MM pattern)
    const timePattern = /^\d{2}:\d{2}/;
    let timeEntryCount = 0;

    for (const cell of row) {
      if (cell && typeof cell === "string" && timePattern.test(cell)) {
        timeEntryCount++;
      }
    }

    // If at least 3 cells contain time data, consider it an attendance row
    // This handles cases where some days might be empty/null
    return timeEntryCount >= 3;
  }

  function convertData(datas, overTimeData) {
    const result = [];
    let currentEmployee = null;
    let attendanceData = null;

    for (let i = 0; i < datas.length; i++) {
      const row = datas[i];

      // Skip empty rows and header rows
      if (!row || row.length === 0 || row[0] === "Attendance Record Report") {
        continue;
      }

      if (row.includes("Att. Time")) {
        const date_val = row[2].split(" ");
        date.startDate = date_val[0];
        date.endDate = date_val[2];
      }
      // Check if this row contains employee information (ID, Name, Dept)
      if (
        Array.isArray(row) &&
        row.includes("ID:") &&
        row.includes("Name:") &&
        row.includes("Dept.:")
      ) {
        // Save previous employee if exists
        if (currentEmployee && attendanceData) {
          const workHours = userData?.find(
            (user) => user.id === currentEmployee?.id,
          );
          const userOverTime = overTimeData?.filter(
            (item) => item.userId === currentEmployee.id,
          );
          currentEmployee.attendances = parseAttendances(
            attendanceData,
            userOverTime,
            {
              work_start: workHours?.work_start,
              work_end: workHours?.work_end,
            },
          );
          result.push(currentEmployee);
        }

        // Extract employee info
        const idIndex = row.indexOf("ID:");
        const nameIndex = row.indexOf("Name:");
        const deptIndex = row.indexOf("Dept.:");

        currentEmployee = {
          id: parseInt(row[idIndex + 2]) || 0,
          name: row[nameIndex + 2] || "",
          department: row[deptIndex + 2] || "",
          attendances: [],
        };

        attendanceData = null;
      }
      // Check if this row contains attendance times
      // Support variable month lengths (19 days, 31 days, etc.)
      else if (
        Array.isArray(row) &&
        row.length >= 10 &&
        currentEmployee &&
        !row.includes("ID:") &&
        isAttendanceDataRow(row)
      ) {
        attendanceData = row;
      }
    }
    console.log(currentEmployee, "currentEmployee");
    console.log(attendanceData, "attendanceData");

    // Don't forget the last employee
    if (currentEmployee && attendanceData) {
      const workHours = userData?.find(
        (user) => user.id === currentEmployee?.id,
      );
      const userOverTime = overTimeData?.filter(
        (item) => item.userId === currentEmployee.id,
      );
      currentEmployee.attendances = parseAttendances(
        attendanceData,
        userOverTime,
        { work_start: workHours?.work_start, work_end: workHours?.work_end },
      );
      result.push(currentEmployee);
    }
    console.log(result, "finalResult");

    return result;
  }

  const parseAttendances = (timeData, overTimeData, workHours) => {
    const attendances = [];
    const baseDate = new Date(date?.startDate);

    for (let day = 0; day < timeData.length && day < 31; day++) {
      const timeEntry = timeData[day];

      if (
        timeEntry &&
        timeEntry !== "" &&
        timeEntry !== "empty" &&
        timeEntry !== null &&
        timeEntry !== undefined
      ) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(day + 1);
        const dateStr = currentDate.toISOString().split("T")[0];

        const {
          actualStart,
          actualEnd,
          updatedStart,
          updatedEnd,
          totalHours,
          totalWorkedHours,
          extraMinutes,
          lateMinutes,
          punches,
          balance,
          overTime,
          grandTotal,
        } = processAttendance(timeEntry, overTimeData, dateStr, workHours);

        if (updatedStart) {
          attendances.push({
            date: dateStr,
            actualStart,
            actualEnd,
            updatedStart,
            updatedEnd,
            totalHours,
            totalWorkedHours,
            extraMinutes,
            lateMinutes,
            punches,
            balance,
            overTime,
            grandTotal,
          });
        }
      }
    }
    return attendances;
  };

  function processAttendance(
    entry: any,
    overTimeData: any,
    dateStr: string,
    workHours: any,
  ) {
    console.log(workHours, "workHours");

    const officeStart = workHours?.work_start || "09:00";
    const officeEnd = workHours?.work_end || "18:00";
    // const officeStart = "09:00";
    // const officeEnd = "17:30";

    const parseTime = (t: any) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m; // total minutes
    };

    const formatTime = (mins: any) => {
      const h = String(Math.floor(mins / 60)).padStart(2, "0");
      const m = String(mins % 60).padStart(2, "0");
      return `${h}:${m}`;
    };

    if (!entry || entry.trim() === "") {
      return {
        actualStart: "",
        actualEnd: "",
        updatedStart: "",
        updatedEnd: "",
        totalHours: "",
      };
    }

    // Split into 5-char chunks "HH:MM"
    const punches = entry.match(/.{1,5}/g) || [];

    if (punches.length === 0) {
      return {
        actualStart: "",
        actualEnd: "",
        updatedStart: "",
        updatedEnd: "",
        totalHours: "",
      };
    }

    const actualStart = punches[0];
    const actualEnd = punches.length > 1 ? punches[punches.length - 1] : "";

    const actualStartParseTime = parseTime(actualStart);
    const actualEndParseTime = parseTime(actualEnd);

    // Adjusted values
    const start = Math.max(actualStartParseTime, parseTime(officeStart));
    const end = actualEnd
      ? Math.min(actualEndParseTime, parseTime(officeEnd))
      : null;

    // If only start available
    if (!actualEnd) {
      return {
        actualStart,
        actualEnd: "",
        updatedStart: actualStart,
        updatedEnd: "",
        totalHours: "",
      };
    }

    // Prevent negative time
    if (end < start) {
      return {
        actualStart,
        actualEnd,
        updatedStart: formatTime(start),
        updatedEnd: formatTime(end),
        totalHours: "",
      };
    }

    const totalMinutes = end - start;
    const totalHours = `${Math.floor(totalMinutes / 60)}:${String(
      totalMinutes % 60,
    ).padStart(2, "0")} hrs`;
    const totalWorkedMinutes = actualEndParseTime - actualStartParseTime;
    const standardMinutes = 8 * 60 + 30; // 8 hrs 30 mins = 510 mins
    const lateMinutes = standardMinutes - totalMinutes;
    const extraMinutes = totalWorkedMinutes - standardMinutes;

    const overtime = (overTimeData || []).reduce((sum, entry) => {
      const entryDate = format(parseISO(entry.date), "yyyy-MM-dd");
      if (entryDate === dateStr) {
        return sum + (entry.minutes || 0);
      }
      return sum;
    }, 0);

    return {
      actualStart,
      actualEnd,
      updatedStart: formatTime(start),
      updatedEnd: formatTime(end),
      totalHours,
      totalWorkedHours: formatTime(totalWorkedMinutes),
      extraMinutes: extraMinutes > 0 ? extraMinutes : 0,
      lateMinutes: lateMinutes > 0 ? String(lateMinutes) : "0",
      punches,
      balance:
        overtime + totalMinutes >= 510 ? overtime + totalMinutes - 510 : 0,
      overTime: overtime,
      grandTotal:
        overtime + totalMinutes >= 510
          ? formatTime(510)
          : formatTime(overtime + totalMinutes),
    };
  }

  const handleDataUpdate = (updatedData: AttendanceData[]) => {
    setAttendanceData(updatedData);
  };

  const handleDownload = () => {
    if (attendanceData.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      exportToExcel(attendanceData, fileName);
      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Error exporting file:", error);
      toast.error("Error exporting file");
    }
  };

  const totalEmployees = attendanceData.length;
  const totalRecords = attendanceData.reduce(
    (sum, emp) => sum + emp.attendances.length,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          {/* Left Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Attendance Management
              </h1>
            </div>
            <p className="text-gray-600 text-sm">
              Upload Excel files to manage employee attendance data
            </p>
          </div>

          {/* Right Section - Signout */}
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/update-attendance");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-500 text-white font-medium rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-all duration-200"
          >
            Add OverTime
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/sign-in");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {/* Stats Cards */}
        {attendanceData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalEmployees}
                  </p>
                  <p className="text-gray-600">Employees</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalRecords}
                  </p>
                  <p className="text-gray-600">Attendance Records</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3">
                <Upload className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileName}
                  </p>
                  <p className="text-gray-600">Current File</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        {attendanceData.length === 0 && (
          <div className="mb-8">
            <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          </div>
        )}

        {/* Data Table */}
        {attendanceData.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Attendance Data
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAttendanceData([]);
                    setFileName("");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload New File
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </button>
              </div>
            </div>

            <AttendanceTable
              data={attendanceData}
              onDataUpdate={handleDataUpdate}
            />
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
