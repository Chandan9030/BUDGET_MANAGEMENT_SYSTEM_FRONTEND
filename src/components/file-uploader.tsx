"use client"

import type React from "react"
import { Upload, RefreshCw } from "lucide-react"

interface FileUploaderProps {
  isLoading: boolean
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  darkMode: boolean
  handleShowTooltip: (content: string, event: React.MouseEvent) => void
  handleHideTooltip: () => void
}

export function FileUploader({
  isLoading,
  handleFileUpload,
  darkMode,
  handleShowTooltip,
  handleHideTooltip,
}: FileUploaderProps) {
  return (
    <label
      htmlFor="file-upload"
      className={`flex items-center px-4 py-2 text-white rounded-lg cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
        darkMode ? "bg-indigo-700 hover:bg-indigo-600" : "bg-indigo-600 hover:bg-indigo-700"
      }`}
      onMouseEnter={(e) => handleShowTooltip("Upload Excel file", e)}
      onMouseLeave={handleHideTooltip}
    >
      {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
      Upload Excel
      <input
        id="file-upload"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isLoading}
      />
    </label>
  )
}
