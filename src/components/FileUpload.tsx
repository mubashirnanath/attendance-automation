import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isExcelFile(file)) {
        setSelectedFile(file);
      } else {
        alert('Please select an Excel file (.xlsx, .xls)');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isExcelFile(file)) {
        setSelectedFile(file);
      } else {
        alert('Please select an Excel file (.xlsx, .xls)');
      }
    }
  };

  const isExcelFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-8">
      <div className="text-center mb-6">
        <FileSpreadsheet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Excel File</h2>
        <p className="text-gray-600">Drag and drop your attendance Excel file or browse to select</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <div className="text-center">
            <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {dragActive ? 'Drop your file here' : 'Select your Excel file'}
            </p>
            <p className="text-gray-500 mb-4">Supports .xlsx and .xls formats</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              Browse Files
            </label>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8 text-green-600 mr-3" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={clearFile}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Process
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* <div className="mt-6 text-sm text-gray-500">
        <p className="font-medium mb-2">Expected Excel format:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Columns: ID, Name, Department, Date, Actual Start, Actual End, etc.</li>
          <li>Time format: HH:MM (24-hour format)</li>
          <li>Date format: YYYY-MM-DD</li>
        </ul>
      </div> */}
    </div>
  );
};

export default FileUpload;