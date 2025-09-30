import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  FileText,
  Check,
  AlertCircle,
  Loader,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GOOGLE_SCRIPT_URL, monthNames } from "../utils/constants";

interface FormErrors {
  employee?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export default function TimesheetForm() {
  const [formData, setFormData] = useState({
    employeeId: "",
    employee: "",
    date: "",
    startTime: "",
    endTime: "",
    note: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.employee) {
      newErrors.employee = "Please select an employee";
    }

    if (!formData.date) {
      newErrors.date = "Please select a date";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Please enter start time";
    }

    if (!formData.endTime) {
      newErrors.endTime = "Please enter end time";
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);

      if (end <= start) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      const user = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=USERS`);
      const results = await user.json();
      
      const result = results?.data?.slice(1).map((row: any) => ({
        id: row[0],
        employee: row[1],
        department: row[2],
      }));
      setData(result);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsClicked(true);
      const currentMonth = monthNames[new Date(formData.date).getMonth()];
      const totalMinutes = getMinutesDiff(formData.startTime, formData.endTime);
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          month: currentMonth,
          row: [
            formData.employeeId,
            formData.employee,
            formData.date,
            formData.startTime,
            formData.endTime,
            formData.note,
            totalMinutes,
          ],
        }),
      });

      const result = await response.json();
      if (result.status == "success") {
        setIsClicked(false);
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            ...formData,
            employee: "",
            employeeId: "",
            note: "",
          });
        }, 1000);
      }
    }
    // insertRow()
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const selectedEmployee = data.find((emp) => emp.id === formData.employeeId);

  const getMinutesDiff = (start, end) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    return endMinutes - startMinutes;
  };

  const calculateHours = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diff = end.getTime() - start.getTime();
      const hours = diff / (1000 * 60 * 60);
      return hours > 0 ? hours.toFixed(1) : "0";
    }
    return "0";
  };

  const navigate = useNavigate()

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Timesheet Submitted!
          </h2>
          <p className="text-gray-600">
            Your timesheet has been successfully recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {/* <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"> */}
            {/* <Building2 className="w-8 h-8 text-white" /> */}
            <img
              src="./LOUD-NEW-SYMBOL1-copy-212x300 (1).webp"
              className="w-16 h-16"
              alt=""
            />
            {/* </div> */}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Employee Timesheet
          </h1>
          <p className="text-gray-600">
            Record your working hours and activities
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Dropdown */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Employee *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full px-4 py-3 text-left bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.employee
                    ? "border-red-300"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {selectedEmployee ? (
                  <div>
                    <span className="font-medium">
                      {selectedEmployee.employee}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({selectedEmployee.department})
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">Select an employee</span>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {data.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => {
                        handleInputChange("employee", employee.employee);
                        handleInputChange("employeeId", employee.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150"
                    >
                      <div className="font-medium">
                        {employee.id}-{employee.employee}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.department}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.employee && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.employee}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                errors.date
                  ? "border-red-300"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.date}
              </p>
            )}
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.startTime
                    ? "border-red-300"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.endTime
                    ? "border-red-300"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Total Hours Display */}
          {formData.startTime && formData.endTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-medium">Total Hours:</span>
                <span className="text-2xl font-bold text-blue-800">
                  {calculateHours()}h
                </span>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Notes
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
              placeholder="Add any additional notes about your work today..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all duration-200 resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#8bc34a] hover:bg-[#7cb342] text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8bc34a] focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex justify-center items-center gap-2"
          >
            {isClicked ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              "Submit Timesheet"
            )}
          </button>
        </form>
      </div>
      <div className="h-full flex justify-end align-top">
      <button
  onClick={() => {
    localStorage.clear();
    navigate("/sign-in");
  }}
  className="fixed top-4 right-4 flex items-center gap-2 px-4 py-2 bg-red-500 
             hover:bg-red-600 text-white font-medium rounded-lg shadow-sm 
             hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 
             focus:ring-offset-1 transition-all duration-200 z-50"
>
  <LogOut className="w-4 h-4" />
  Sign out
</button>
      </div>
    </div>
  );
}
