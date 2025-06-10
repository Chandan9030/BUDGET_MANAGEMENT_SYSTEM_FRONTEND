"use client"
import { X, Upload, Filter, ArrowUpDown, Download, Layers, CalculatorIcon } from "lucide-react"

interface HelpPanelProps {
  darkMode: boolean
  setShowHelp: (value: boolean) => void
}

export function HelpPanel({ darkMode, setShowHelp }: HelpPanelProps) {
  return (
    <div
      className={`mb-6 p-4 rounded-lg border ${
        darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
      } shadow-md transition-all duration-300 animate-fadeIn`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Help & Tips</h3>
        <button
          onClick={() => setShowHelp(false)}
          className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <h4 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <Upload className="w-4 h-4" /> Uploading Files
          </h4>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Click the "Upload Excel" button to import your Excel files. The app supports .xlsx and .xls formats.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <h4 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <Filter className="w-4 h-4" /> Filtering Data
          </h4>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Use the search box to find specific data. Toggle "Highest Values" or "Lowest Values" to filter by extremes.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <h4 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <ArrowUpDown className="w-4 h-4" /> Sorting
          </h4>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Click on any column header to sort by that column. Click again to toggle between ascending and descending
            order.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <h4 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <Download className="w-4 h-4" /> Exporting
          </h4>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Export your data in XLSX, CSV, or JSON format using the export buttons in the toolbar.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <h4 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <Layers className="w-4 h-4" /> Multiple Sheets
          </h4>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Switch between sheets using the sheet tabs. Create new sheets with the "+" button.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <h4 className={`font-medium mb-2 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <CalculatorIcon className="w-4 h-4" /> Calculator
          </h4>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Use the built-in scientific calculator for quick calculations without leaving the app.
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Keyboard shortcuts: Ctrl+S to save, Ctrl+F to search, Esc to close panels
        </p>
      </div>
    </div>
  )
}
