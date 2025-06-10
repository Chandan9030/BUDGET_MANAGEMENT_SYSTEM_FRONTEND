"use client"
import { ArrowUpDown } from "lucide-react"

interface DataRow {
  [key: string]: string | number
}

interface DataTableProps {
  currentData: DataRow[]
  currentHeaders: string[]
  darkMode: boolean
  handleSort: (column: string) => void
  sortConfig: { column: string; direction: "asc" | "desc" } | null
  selectedColumn: string
  handleEdit: (rowIndex: number, column: string, value: string | number) => void
  min: number
  max: number
}

export function DataTable({
  currentData,
  currentHeaders,
  darkMode,
  handleSort,
  sortConfig,
  selectedColumn,
  handleEdit,
  min,
  max,
}: DataTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border shadow-md mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              {currentHeaders.map((header) => (
                <th
                  key={header}
                  className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <button
                    onClick={() => handleSort(header)}
                    className={`flex items-center gap-1 hover:text-gray-900 transition-colors duration-200 ${
                      darkMode ? "hover:text-gray-100" : "hover:text-gray-900"
                    }`}
                  >
                    {header}
                    <ArrowUpDown
                      className={`w-4 h-4 ${
                        sortConfig?.column === header
                          ? darkMode
                            ? "text-indigo-400"
                            : "text-indigo-600"
                          : darkMode
                            ? "text-gray-500"
                            : "text-gray-400"
                      }`}
                    />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? "bg-gray-900 divide-gray-800" : "bg-white divide-gray-200"}`}>
            {currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`transition-colors duration-150 ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                >
                  {currentHeaders.map((header, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-3 whitespace-nowrap transition-colors duration-200 ${
                        selectedColumn === header && row[header] === max
                          ? darkMode
                            ? "bg-green-900/30"
                            : "bg-green-100"
                          : selectedColumn === header && row[header] === min
                            ? darkMode
                              ? "bg-red-900/30"
                              : "bg-red-100"
                            : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={row[header] !== undefined ? row[header] : ""}
                        onChange={(e) => handleEdit(rowIndex, header, e.target.value)}
                        className={`w-full border-none outline-none focus:ring-2 focus:ring-indigo-200 rounded px-2 py-1 -mx-2 -my-1 transition-all duration-200 ${
                          darkMode
                            ? "bg-transparent text-gray-200 focus:bg-gray-800"
                            : "bg-transparent focus:bg-gray-50"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={currentHeaders.length}
                  className={`px-6 py-4 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  No data matches your current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
