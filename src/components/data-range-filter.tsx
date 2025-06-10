"use client"
import { Calendar } from "lucide-react"

interface DateRangeFilterProps {
  darkMode: boolean
  dateFilter: { start: string; end: string } | null
  setDateFilter: (filter: { start: string; end: string } | null) => void
}

export function DateRangeFilter({ darkMode, dateFilter, setDateFilter }: DateRangeFilterProps) {
  return (
    <div
      className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-white"} border ${darkMode ? "border-gray-600" : "border-gray-200"} shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
        <h3 className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Date Range Filter</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Start Date
          </label>
          <input
            type="date"
            value={dateFilter?.start || ""}
            onChange={(e) => setDateFilter((prev) => ({ ...(prev || { end: "" }), start: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            End Date
          </label>
          <input
            type="date"
            value={dateFilter?.end || ""}
            onChange={(e) => setDateFilter((prev) => ({ ...(prev || { start: "" }), end: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          />
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={() => setDateFilter(null)}
          className={`px-3 py-1 text-sm rounded-lg ${
            darkMode ? "bg-gray-600 hover:bg-gray-500 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          Clear Dates
        </button>
      </div>
    </div>
  )
}
