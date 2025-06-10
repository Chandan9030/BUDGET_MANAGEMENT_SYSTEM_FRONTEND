"use client"
import { X, Save, RefreshCw, LineChart, BarChart, PieChart, ScatterChart } from "lucide-react"

interface SettingsPanelProps {
  darkMode: boolean
  rowsPerPage: number
  setRowsPerPage: (value: number) => void
  chartType: "line" | "bar" | "pie" | "scatter"
  setChartType: (type: "line" | "bar" | "pie" | "scatter") => void
  handleSaveState: () => void
  handleLoadState: () => void
  lastSaved: Date | null
  setShowSettings: (value: boolean) => void
}

export function SettingsPanel({
  darkMode,
  rowsPerPage,
  setRowsPerPage,
  chartType,
  setChartType,
  handleSaveState,
  handleLoadState,
  lastSaved,
  setShowSettings,
}: SettingsPanelProps) {
  return (
    <div
      className={`mb-6 p-4 rounded-lg border ${
        darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
      } shadow-md transition-all duration-300 animate-fadeIn`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Settings</h3>
        <button
          onClick={() => setShowSettings(false)}
          className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Rows per page
          </label>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Default chart type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType("line")}
              className={`flex items-center px-3 py-2 rounded-lg ${
                chartType === "line"
                  ? "bg-indigo-600 text-white"
                  : darkMode
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              <LineChart className="w-4 h-4 mr-1" />
              Line
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`flex items-center px-3 py-2 rounded-lg ${
                chartType === "bar"
                  ? "bg-indigo-600 text-white"
                  : darkMode
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              <BarChart className="w-4 h-4 mr-1" />
              Bar
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`flex items-center px-3 py-2 rounded-lg ${
                chartType === "pie"
                  ? "bg-indigo-600 text-white"
                  : darkMode
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              <PieChart className="w-4 h-4 mr-1" />
              Pie
            </button>
            <button
              onClick={() => setChartType("scatter")}
              className={`flex items-center px-3 py-2 rounded-lg ${
                chartType === "scatter"
                  ? "bg-indigo-600 text-white"
                  : darkMode
                    ? "bg-gray-600 text-gray-200"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              <ScatterChart className="w-4 h-4 mr-1" />
              Scatter
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Save/Load State
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSaveState}
              className={`flex items-center px-3 py-2 rounded-lg ${
                darkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button
              onClick={handleLoadState}
              className={`flex items-center px-3 py-2 rounded-lg ${
                darkMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Load
            </button>
          </div>
          {lastSaved && (
            <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Last saved: {lastSaved.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
