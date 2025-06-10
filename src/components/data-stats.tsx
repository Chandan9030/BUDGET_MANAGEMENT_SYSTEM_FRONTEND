interface DataRow {
  [key: string]: string | number
}

interface DataStatsProps {
  data: DataRow[]
  selectedColumn: string
  darkMode: boolean
}

export function DataStats({ data, selectedColumn, darkMode }: DataStatsProps) {
  if (!data.length || !selectedColumn) return null

  const numericValues = data.map((row) => Number(row[selectedColumn])).filter((val) => !isNaN(val))

  if (!numericValues.length) return null

  const sum = numericValues.reduce((a, b) => a + b, 0)
  const avg = sum / numericValues.length
  const min = Math.min(...numericValues)
  const max = Math.max(...numericValues)
  const median = (() => {
    const sorted = [...numericValues].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  })()

  return (
    <div
      className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-white"} border ${darkMode ? "border-gray-600" : "border-gray-200"} shadow-sm`}
    >
      <h3 className={`font-medium mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>
        Statistics for {selectedColumn}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className={`text-xs uppercase font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Average
          </div>
          <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{avg.toFixed(2)}</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className={`text-xs uppercase font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Sum
          </div>
          <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{sum.toFixed(2)}</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className={`text-xs uppercase font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Min
          </div>
          <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{min.toFixed(2)}</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className={`text-xs uppercase font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Max
          </div>
          <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{max.toFixed(2)}</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
          <div className={`text-xs uppercase font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Median
          </div>
          <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {median.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
