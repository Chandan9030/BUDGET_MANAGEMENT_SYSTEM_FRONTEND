import { useState, useEffect, useRef, useMemo } from "react"
import { PieChart, BarChart } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import type { BudgetSection } from "../types/budget"
import { formatCurrency } from "../lib/format-utils"
import Chart from "chart.js/auto"

interface BudgetVisualizationProps {
  data: BudgetSection[]
}

export function BudgetVisualization({ data }: BudgetVisualizationProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")
  const [viewBy, setViewBy] = useState<"section" | "category">("section")
  const [timeFrame, setTimeFrame] = useState<"monthly" | "quarterly" | "halfYearly" | "annual">("monthly")
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Initialize with all sections selected
  useEffect(() => {
    if (data.length > 0 && selectedSections.length === 0) {
      setSelectedSections(data.map(section => section.id))
    }
  }, [data, selectedSections.length])

  const timeFrameOptions = useMemo(() => ({
    monthly: { id: "monthlyCost", label: "Monthly" },
    quarterly: { id: "quarterlyCost", label: "Quarterly" },
    halfYearly: { id: "halfYearlyCost", label: "Half-Yearly" },
    annual: { id: "annualCost", label: "Annual" },
  }), [])

  // Filter data based on selected sections
  const filteredData = data.filter(section => selectedSections.includes(section.id))

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId)
      } else {
        return [...prev, sectionId]
      }
    })
  }

  const selectAllSections = () => {
    setSelectedSections(data.map(section => section.id))
  }

  const deselectAllSections = () => {
    setSelectedSections([])
  }

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    let chartData: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[]; borderColor: string[]; borderWidth: number }[] }

    if (viewBy === "section") {
      // Prepare data by section
      const labels = filteredData.map((section) => section.name)
      const values = filteredData.map((section) =>
        section.items.reduce((sum, item) => sum + (Number(item[timeFrameOptions[timeFrame].id]) || 0), 0),
      )

      chartData = {
        labels,
        datasets: [
          {
            label: `${timeFrameOptions[timeFrame].label} Cost by Section`,
            data: values,
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(153, 102, 255, 0.7)",
              "rgba(255, 159, 64, 0.7)",
              "rgba(199, 199, 199, 0.7)",
              "rgba(83, 102, 255, 0.7)",
              "rgba(40, 159, 64, 0.7)",
              "rgba(210, 199, 199, 0.7)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(199, 199, 199, 1)",
              "rgba(83, 102, 255, 1)",
              "rgba(40, 159, 64, 1)",
              "rgba(210, 199, 199, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
    } else {
      // Prepare data by category (flatten all sections)
      const categoryMap = new Map<string, number>()

      filteredData.forEach((section) => {
        section.items.forEach((item) => {
          const category = item.category
          const value = Number(item[timeFrameOptions[timeFrame].id]) || 0
          categoryMap.set(category, (categoryMap.get(category) || 0) + value)
        })
      })

      // Sort categories by value (descending)
      const sortedCategories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1])

      // Take top 10 categories for better visualization
      const topCategories = sortedCategories.slice(0, 10)
      const labels = topCategories.map(([category]) => category)
      const values = topCategories.map(([, value]) => value)

      chartData = {
        labels,
        datasets: [
          {
            label: `${timeFrameOptions[timeFrame].label} Cost by Category`,
            data: values,
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(153, 102, 255, 0.7)",
              "rgba(255, 159, 64, 0.7)",
              "rgba(199, 199, 199, 0.7)",
              "rgba(83, 102, 255, 0.7)",
              "rgba(40, 159, 64, 0.7)",
              "rgba(210, 199, 199, 0.7)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(199, 199, 199, 1)",
              "rgba(83, 102, 255, 1)",
              "rgba(40, 159, 64, 1)",
              "rgba(210, 199, 199, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
    }

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: chartType === "pie" ? "right" : "top",
            labels: {
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.raw as number
                return `${label}: ${formatCurrency(value)}`
              },
            },
          },
        },
        scales:
          chartType === "bar"
            ? {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => formatCurrency(value as number),
                  },
                },
              }
            : undefined,
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [filteredData, chartType, viewBy, timeFrame, timeFrameOptions])

  // Calculate total budget for filtered sections
  const totalBudget = filteredData.reduce(
    (total, section) =>
      total +
      section.items.reduce(
        (sectionTotal, item) => sectionTotal + (Number(item[timeFrameOptions[timeFrame].id]) || 0),
        0,
      ),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">Budget Visualization</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("pie")}
              className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <PieChart className="h-4 w-4" />
              <span>Pie</span>
            </Button>
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
              className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <BarChart className="h-4 w-4" />
              <span>Bar</span>
            </Button>
          </div>

          <Select value={viewBy} onValueChange={(value: "section" | "category") => setViewBy(value)}>
            <SelectTrigger className="w-32 md:w-40 bg-purple-600 text-white hover:bg-purple-700">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="section">By Section</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={timeFrame}
            onValueChange={(value: "monthly" | "quarterly" | "halfYearly" | "annual") => setTimeFrame(value)}
          >
            <SelectTrigger className="w-32 md:w-40 bg-purple-600 text-white hover:bg-purple-700">
              <SelectValue placeholder="Time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="halfYearly">Half-Yearly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Section selection panel */}
        <div className="md:col-span-3">
        <Card className="h-full md:h-[563px] shadow-lg border-[1.5px] border-black rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                <span>Select Sections</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAllSections} className="text-xs py-1 h-8 bg-green-200">
                    All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAllSections} className="text-xs py-1 h-8 bg-red-200">
                    None
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {data.map(section => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`section-${section.id}`} 
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <Label htmlFor={`section-${section.id}`} className="cursor-pointer">
                      {section.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization area */}
        <div className="md:col-span-9 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Selected Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                <p className="text-xs text-gray-500 mt-1">{timeFrameOptions[timeFrame].label} expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Sections Selected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedSections.length}</div>
                <p className="text-xs text-gray-500 mt-1">of {data.length} total sections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Expense Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.reduce((total, section) => total + section.items.length, 0)}</div>
                <p className="text-xs text-gray-500 mt-1">Individual expenses</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {viewBy === "section" ? "Budget Breakdown by Section" : "Budget Breakdown by Category"} (
                {timeFrameOptions[timeFrame].label})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {filteredData.length > 0 ? (
                  <canvas ref={chartRef}></canvas>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Please select at least one section to display chart</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Details - Moved outside the grid to be full width */}
      {viewBy === "section" && (
        <Card className="mt-4 shadow-lg">
          <CardHeader>
            <CardTitle>Section Details</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-4 py-2 text-left">Section</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Items</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">
                        {timeFrameOptions[timeFrame].label} Cost
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-right">% of Selected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData
                      .map((section) => ({
                        name: section.name,
                        items: section.items.length,
                        cost: section.items.reduce(
                          (sum, item) => sum + (Number(item[timeFrameOptions[timeFrame].id]) || 0),
                          0,
                        ),
                      }))
                      .sort((a, b) => b.cost - a.cost)
                      .map((section) => (
                        <tr key={section.name} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{section.name}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{section.items}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{formatCurrency(section.cost)}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">
                            {totalBudget ? ((section.cost / totalBudget) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">Please select at least one section to display details</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Expense Categories - Also moved outside the grid for consistency */}
      {viewBy === "category" && (
        <Card className="mt-4 shadow-lg">
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-4 py-2 text-left">Category</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">
                        {timeFrameOptions[timeFrame].label} Cost
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-right">% of Selected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const categoryMap = new Map<string, number>()

                      filteredData.forEach((section) => {
                        section.items.forEach((item) => {
                          const category = item.category
                          const value = Number(item[timeFrameOptions[timeFrame].id]) || 0
                          categoryMap.set(category, (categoryMap.get(category) || 0) + value)
                        })
                      })

                      return [...categoryMap.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, cost]) => (
                          <tr key={category} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">{category}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">{formatCurrency(cost)}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {totalBudget ? ((cost / totalBudget) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">Please select at least one section to display categories</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}