"use client"
import { Columns, Info } from "lucide-react"

interface DataRow {
  [key: string]: string | number
}

interface SheetData {
  name: string
  data: DataRow[]
  headers: string[]
}

interface DataGroupingProps {
  darkMode: boolean
  groupBy: string
  setGroupBy: (column: string) => void
  currentSheet: SheetData
}

export function DataGrouping({ darkMode, groupBy, setGroupBy, currentSheet }: DataGroupingProps) {
  return (
    <div
      className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-white"} border ${darkMode ? "border-gray-600" : "border-gray-200"} shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Columns className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
        <h3 className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Data Grouping</h3>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Group By Column
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value="">No Grouping</option>
            {currentSheet.headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={() => setGroupBy("")}
            className={`px-3 py-2 rounded-lg ${
              darkMode ? "bg-gray-600 hover:bg-gray-500 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            disabled={!groupBy}
          >
            Clear Grouping
          </button>
        </div>
      </div>

      {groupBy && (
        <div
          className={`mt-3 p-2 rounded-lg text-sm ${darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-600"}`}
        >
          <div className="flex items-center gap-1">
            <Info className="w-4 h-4" />
            <span>
              Data is grouped by <strong>{groupBy}</strong>. Numeric columns show aggregated values.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
