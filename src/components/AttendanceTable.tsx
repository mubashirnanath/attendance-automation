import React, { useState } from "react";
import {
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import { AttendanceData, AttendanceRecord } from "../types/attendance";

interface AttendanceTableProps {
  data: AttendanceData[];
  onDataUpdate: (data: AttendanceData[]) => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  data,
  onDataUpdate,
}) => {
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(
    new Set()
  );

  const toggleEmployee = (employeeId: number) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTotalHoursForEmployee = (attendances: AttendanceRecord[]) => {
    const toMinutes = (time?: string) => {
      const match = time?.match(/(\d+):(\d+)/);
      return match ? +match[1] * 60 + +match[2] : 0;
    };

    const toHM = (mins: number) =>
      `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")} hrs`;

    const totalMinutes = attendances.reduce(
      (sum, r) => sum + toMinutes(r.grandTotal),
      0
    );
    const workedMinutes = attendances.reduce(
      (sum, r) => sum + toMinutes(r.totalWorkedHours),
      0
    );

    const totalBalance = attendances.reduce(
      (sum, r) => sum + (r?.balance ?? 0),
      0
    );

    const totalOvertime = attendances.reduce(
      (sum, r) => sum + (r?.overTime ?? 0),
      0
    );

    const totalLateMinutes = attendances.reduce(
      (sum, r) => sum + parseInt(r.lateMinutes || "0"),
      0
    );

    return {
      totalHours: toHM(totalMinutes),
      totalWorkedHours: toHM(workedMinutes),
      totalBalance,
      totalOvertime,
      totalLateMinutes,
    };
  };

  const calculateAttendancePercentage = (date: string, totalHours: string) => {
    // Convert hours string ("158:44 hrs") to total minutes
    const match = totalHours.match(/(\d+):(\d+)/);
    if (!match) return 0;

    const actualMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);

    const d = new Date(date);
    const month = d.getMonth() + 1; // 1-12
    const daysInMonth = new Date(d.getFullYear(), month, 0).getDate();

    // Define working days rule
    const workingDays = month === 2 ? 26 : daysInMonth === 30 ? 26 : 27;

    const expectedMinutes = workingDays * (8 * 60 + 30); // 8:30 hrs

    const percentage = ((actualMinutes / expectedMinutes) * 100).toFixed(2);

    return `${percentage}%`;
  };

  const handleOverTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    employee: any,
    index: number
  ) => {
    console.log(employee, index);
    if (e.target.value) {
      const newAttendances = [...employee.attendances];
      newAttendances[index].overTime = parseInt(e.target.value);
      console.log(newAttendances, "newAttendances");
      const updatedArr = data.map((item) =>
        item.id === employee.id
          ? { ...item, attendances: newAttendances }
          : item
      );
      onDataUpdate(updatedArr);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="space-y-2">
        {data.map((employee, index) => {
          const isExpanded = expandedEmployees.has(employee.id);
          const {
            totalHours,
            totalWorkedHours,
            totalBalance,
            totalOvertime,
            totalLateMinutes,
          } = getTotalHoursForEmployee(employee.attendances);

          return (
            <div
              key={employee.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Employee Header - Clickable Row */}
              <div
                className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 cursor-pointer hover:from-blue-50 hover:to-blue-100 transition-all duration-200 border-b border-gray-200"
                onClick={() => toggleEmployee(employee.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <p>{index + 1}</p>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 transition-transform duration-200" />
                      )}
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {employee.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">ID:</span> {employee.id}
                        </span>
                        {employee.department && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {employee.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-gray-500">Percentage</p>
                      <p className="font-semibold text-gray-900">
                        {calculateAttendancePercentage(
                          employee?.attendances[0]?.date,
                          totalWorkedHours
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total Records</p>
                      <p className="font-semibold text-gray-900">
                        {employee.attendances.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total Late Minutes</p>
                      <p className="font-semibold text-gray-900">
                        {totalLateMinutes}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total Overtime Minutes</p>
                      <p className="font-semibold text-gray-900">
                        {totalOvertime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total Balance</p>
                      <p
                        className={`font-semibold ${
                          totalOvertime - totalLateMinutes > 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {totalOvertime - totalLateMinutes}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total Hours</p>
                      <p className="font-semibold text-blue-600">
                        {totalHours}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Details - Expandable */}
              {isExpanded && (
                <div className="bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Date
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Punches
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actual Start
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actual End
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              Over Time
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              Late Minutes
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              Total Hours Worked
                            </div>
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Total Hours
                            </div>
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Grand Total
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              Overtime
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              Balance
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {employee.attendances.map((record, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex flex-col">
                                <span>{formatDate(record.date)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ">
                                {(record?.punches?.length &&
                                  record?.punches.join("-")) ||
                                  "..."}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {record.actualStart || "Not recorded"}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-gray-800">
                                {record.updatedStart || "Not recorded"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {record.actualEnd || "Not recorded"}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-gray-800">
                                {record.updatedEnd || "Not recorded"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  record.extraMinutes > 0
                                    ? "text-green-600"
                                    : "text-gray-500"
                                } `}
                              >
                                {record.extraMinutes || 0}
                              </span>
                             
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  record.lateMinutes > 0
                                    ? "text-red-500"
                                    : "text-gray-500"
                                } `}
                              >
                                {record.lateMinutes || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-emerald-800">
                                {record.totalWorkedHours || 0} hrs
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium  text-emerald-800">
                                {record.totalHours || "..."}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                                {record.grandTotal || "..."} hrs
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {record.overTime >=0 ? (<input
                                type="text"
                                defaultValue={record.overTime || 0}
                                onChange={(e) =>
                                  handleOverTimeChange(e, employee, idx)
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />)
                             : ( <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  record.overTime > 0
                                    ? "text-emerald-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {record.overTime}
                              </span>)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  record.balance > 0
                                    ? "text-emerald-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {record.balance > 0 ? "+" + record.balance : 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No attendance data available</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
