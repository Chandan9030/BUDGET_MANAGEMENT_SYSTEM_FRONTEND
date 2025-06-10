"use client"

import { useEffect, useRef } from "react"
import { LineChart, BarChart, PieChart, ScatterChart } from "lucide-react"
import Chart from "chart.js/auto"

interface DataRow {
  [key: string]: string | number
}

interface DataChartProps {
  data: DataRow[]
  selectedColumn: string
  compareColumn: string
  chartType: "line" | "bar" | "pie" | "scatter"
  onChartTypeChange: (type: "line" | "bar" | "pie" | "scatter") => void
  darkMode: boolean
}

export function DataChart({
  data,
  selectedColumn,
  compareColumn,
  chartType,
  onChartTypeChange,
  darkMode,
}: DataChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || !data.length || !selectedColumn) return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    const filteredData = data.filter((row) => {
      const value = Number(row[selectedColumn])
      return !isNaN(value)
    })

    if (!filteredData.length) return

    const labels = filteredData.map((row, index) => {
      // Try to find a label column (often the first column or one with "name", "label", "id" in it)
      const labelColumns = Object.keys(row).filter(
        (key) =>
          key.toLowerCase().includes("name") ||
          key.toLowerCase().includes("label") ||
          key.toLowerCase().includes("id") ||
          key.toLowerCase().includes("date"),
      )

      if (labelColumns.length > 0) {
        return String(row[labelColumns[0]])
      }

      // If no good label column is found, use the index
      return `Item ${index + 1}`
    })

    const primaryValues = filteredData.map((row) => Number(row[selectedColumn]))

    const datasets = [
      {
        label: selectedColumn,
        data: primaryValues,
        backgroundColor: darkMode ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.7)",
        borderColor: darkMode ? "rgba(99, 102, 241, 0.8)" : "rgba(99, 102, 241, 1)",
        borderWidth: 2,
        tension: 0.3,
      },
    ]

    // Add compare column if selected
    if (compareColumn) {
      const compareValues = filteredData.map((row) => {
        const value = Number(row[compareColumn])
        return isNaN(value) ? 0 : value
      })

      datasets.push({
        label: compareColumn,
        data: compareValues,
        backgroundColor: darkMode ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.7)",
        borderColor: darkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(239, 68, 68, 1)",
        borderWidth: 2,
        tension: 0.3,
      })
    }

    // For scatter chart, we need x and y coordinates
    let scatterData: { x: number; y: number }[] = []
    if (chartType === "scatter" && compareColumn) {
      scatterData = filteredData.map((row) => ({
        x: Number(row[selectedColumn]),
        y: Number(row[compareColumn]),
      }))
    }

    const chartConfig = {
      type: chartType === "scatter" ? "scatter" : chartType,
      data: {
        labels: chartType === "scatter" ? undefined : labels,
        datasets:
          chartType === "scatter" && compareColumn
            ? [
                {
                  label: `${selectedColumn} vs ${compareColumn}`,
                  data: scatterData,
                  backgroundColor: darkMode ? "rgba(99, 102, 241, 0.7)" : "rgba(99, 102, 241, 0.7)",
                  borderColor: darkMode ? "rgba(99, 102, 241, 1)" : "rgba(99, 102, 241, 1)",
                  borderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                },
              ]
            : datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top" as const,
            labels: {
              color: darkMode ? "#e5e7eb" : "#374151",
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
            backgroundColor: darkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.8)",
            titleColor: darkMode ? "#e5e7eb" : "#111827",
            bodyColor: darkMode ? "#e5e7eb" : "#374151",
            borderColor: darkMode ? "rgba(75, 85, 99, 0.2)" : "rgba(203, 213, 225, 0.8)",
            borderWidth: 1,
          },
        },
        scales:
          chartType !== "pie"
            ? {
                x: {
                  ticks: {
                    color: darkMode ? "#9ca3af" : "#4b5563",
                  },
                  grid: {
                    color: darkMode ? "rgba(75, 85, 99, 0.2)" : "rgba(203, 213, 225, 0.5)",
                  },
                },
                y: {
                  ticks: {
                    color: darkMode ? "#9ca3af" : "#4b5563",
                  },
                  grid: {
                    color: darkMode ? "rgba(75, 85, 99, 0.2)" : "rgba(203, 213, 225, 0.5)",
                  },
                  beginAtZero: true,
                },
              }
            : undefined,
      },
    }

    chartInstance.current = new Chart(ctx, chartConfig)

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, selectedColumn, compareColumn, chartType, darkMode])

  if (!data.length || !selectedColumn) return null

  return (
    <div
      className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-white"} border ${darkMode ? "border-gray-600" : "border-gray-200"} shadow-sm`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          Chart: {selectedColumn} {compareColumn ? `vs ${compareColumn}` : ""}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onChartTypeChange("line")}
            className={`p-2 rounded-lg ${
              chartType === "line"
                ? "bg-indigo-600 text-white"
                : darkMode
                  ? "bg-gray-600 text-gray-200"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            <LineChart className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChartTypeChange("bar")}
            className={`p-2 rounded-lg ${
              chartType === "bar"
                ? "bg-indigo-600 text-white"
                : darkMode
                  ? "bg-gray-600 text-gray-200"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            <BarChart className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChartTypeChange("pie")}
            className={`p-2 rounded-lg ${
              chartType === "pie"
                ? "bg-indigo-600 text-white"
                : darkMode
                  ? "bg-gray-600 text-gray-200"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            <PieChart className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChartTypeChange("scatter")}
            className={`p-2 rounded-lg ${
              chartType === "scatter"
                ? "bg-indigo-600 text-white"
                : darkMode
                  ? "bg-gray-600 text-gray-200"
                  : "bg-gray-100 text-gray-800"
            } ${!compareColumn ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!compareColumn}
            title={!compareColumn ? "Select a comparison column to use scatter plot" : ""}
          >
            <ScatterChart className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="h-80">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  )
}
