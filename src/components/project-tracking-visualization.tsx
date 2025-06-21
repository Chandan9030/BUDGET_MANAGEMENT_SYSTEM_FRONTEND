"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { BarChart, LineChart, Package } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import type { ProjectTrackingItem } from "../types/project-tracking"
import { formatCurrency } from "../lib/format-utils"

interface ProjectTrackingVisualizationProps {
  data: ProjectTrackingItem[]
}

export function ProjectTrackingVisualization({ data }: ProjectTrackingVisualizationProps) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [viewBy, setViewBy] = useState<"profit" | "cost" | "timeline">("profit")
  const [analysisType, setAnalysisType] = useState<"profitAmount" | "profitPercent" | "efficiency">("profitAmount")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  console.log("ProjectTrackingVisualization data:", data)

  // Initialize with all statuses selected
  useEffect(() => {
    if (data.length > 0 && selectedStatuses.length === 0) {
      const statuses = Array.from(new Set(data.map((item) => item.docStatus || "Unknown")))
      setSelectedStatuses(statuses)
    }
  }, [data, selectedStatuses.length])

  // Filter data based on selected statuses
  const filteredData = data.filter((item) => selectedStatuses.includes(item.docStatus || "Unknown"))

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const selectAllStatuses = () => {
    const statuses = Array.from(new Set(data.map((item) => item.docStatus || "Unknown")))
    setSelectedStatuses(statuses)
  }

  const deselectAllStatuses = () => {
    setSelectedStatuses([])
  }

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"
      return date.toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  // Calculate filtered totals
  const filteredTotals = {
    projectCost: filteredData.reduce((sum, item) => sum + (item.projectCost || 0), 0),
    collectAmount: filteredData.reduce((sum, item) => sum + (item.collectAmount || 0), 0),
    profitForProject: filteredData.reduce((sum, item) => sum + (item.profitForProject || 0), 0),
    daysInvolved: filteredData.reduce((sum, item) => sum + (item.daysInvolved || 0), 0),
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    const sortedData = [...filteredData].sort((a, b) => {
      if (analysisType === "profitAmount") {
        return (b.profitForProject || 0) - (a.profitForProject || 0)
      } else if (analysisType === "profitPercent") {
        const percentA = a.projectCost ? ((a.profitForProject || 0) / a.projectCost) * 100 : 0
        const percentB = b.projectCost ? ((b.profitForProject || 0) / b.projectCost) * 100 : 0
        return percentB - percentA
      } else {
        const efficiencyA = a.daysInvolved ? (a.profitForProject || 0) / a.daysInvolved : 0
        const efficiencyB = b.daysInvolved ? (b.profitForProject || 0) / b.daysInvolved : 0
        return efficiencyB - efficiencyA
      }
    })

    return sortedData.slice(0, 10).map((item) => ({
      name: item.projectWork || "Unnamed Project",
      projectCost: item.projectCost || 0,
      collectAmount: item.collectAmount || 0,
      profit: item.profitForProject || 0,
      profitPercent: item.projectCost ? ((item.profitForProject || 0) / item.projectCost) * 100 : 0,
      efficiency: item.daysInvolved ? (item.profitForProject || 0) / item.daysInvolved : 0,
      daysInvolved: item.daysInvolved || 0,
    }))
  }, [filteredData, analysisType])

  // Draw chart using Canvas API
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || chartData.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Chart dimensions
    const padding = 60
    const chartWidth = rect.width - padding * 2
    const chartHeight = rect.height - padding * 2

    // Get values based on view type
    let values: number[] = []
    const labels: string[] = chartData.map((item) => item.name)
    let colors: string[] = []

    if (viewBy === "profit") {
      if (analysisType === "profitAmount") {
        values = chartData.map((item) => item.profit)
        colors = values.map((v) => (v >= 0 ? "#22c55e" : "#ef4444"))
      } else if (analysisType === "profitPercent") {
        values = chartData.map((item) => item.profitPercent)
        colors = values.map((v) => (v >= 0 ? "#3b82f6" : "#ef4444"))
      } else {
        values = chartData.map((item) => item.efficiency)
        colors = values.map((v) => (v >= 0 ? "#8b5cf6" : "#ef4444"))
      }
    } else if (viewBy === "cost") {
      values = chartData.map((item) => item.projectCost)
      colors = new Array(values.length).fill("#3b82f6")
    } else {
      values = chartData.map((item) => item.daysInvolved)
      colors = new Array(values.length).fill("#8b5cf6")
    }

    if (values.length === 0) return

    const maxValue = Math.max(...values)
    const minValue = Math.min(...values, 0)
    const valueRange = maxValue - minValue || 1

    // Draw axes
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, padding + chartHeight)
    ctx.stroke()

    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding + chartHeight)
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.stroke()

    // Draw chart based on type
    if (chartType === "bar") {
      const barWidth = (chartWidth / values.length) * 0.8
      const barSpacing = (chartWidth / values.length) * 0.2

      values.forEach((value, index) => {
        const barHeight = (Math.abs(value - minValue) / valueRange) * chartHeight
        const x = padding + index * (barWidth + barSpacing) + barSpacing / 2
        const y = value >= 0 ? padding + chartHeight - barHeight : padding + chartHeight

        ctx.fillStyle = colors[index]
        ctx.fillRect(x, y, barWidth, barHeight)

        // Draw value labels
        ctx.fillStyle = "#374151"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        const labelY = value >= 0 ? y - 5 : y + barHeight + 15
        ctx.fillText(formatCurrency(value, false), x + barWidth / 2, labelY)
      })
    } else {
      // Line chart
      ctx.strokeStyle = colors[0] || "#3b82f6"
      ctx.lineWidth = 2
      ctx.beginPath()

      values.forEach((value, index) => {
        const x = padding + (index / (values.length - 1)) * chartWidth
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Draw points
        ctx.fillStyle = colors[0] || "#3b82f6"
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
      ctx.stroke()
    }

    // Draw labels
    ctx.fillStyle = "#374151"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "center"
    labels.forEach((label, index) => {
      const x = padding + (index / Math.max(labels.length - 1, 1)) * chartWidth
      const truncatedLabel = label.length > 10 ? label.substring(0, 10) + "..." : label
      ctx.fillText(truncatedLabel, x, padding + chartHeight + 20)
    })
  }, [chartData, chartType, viewBy, analysisType])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">Project Tracking Visualization</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
              className="flex items-center gap-1 bg-amber-600 text-white hover:bg-amber-700"
            >
              <BarChart className="h-4 w-4" />
              <span>Bar</span>
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
              className="flex items-center gap-1 bg-amber-600 text-white hover:bg-amber-700"
            >
              <LineChart className="h-4 w-4" />
              <span>Line</span>
            </Button>
          </div>

          <Select value={viewBy} onValueChange={(value: "profit" | "cost" | "timeline") => setViewBy(value)}>
            <SelectTrigger className="w-32 md:w-40 bg-orange-600 text-white hover:bg-orange-700">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent className="w-32 md:w-40 bg-white">
              <SelectItem value="profit">Profit Analysis</SelectItem>
              <SelectItem value="cost">Cost vs Collection</SelectItem>
              <SelectItem value="timeline">Timeline View</SelectItem>
            </SelectContent>
          </Select>

          {viewBy === "profit" && (
            <Select
              value={analysisType}
              onValueChange={(value: "profitAmount" | "profitPercent" | "efficiency") => setAnalysisType(value)}
            >
              <SelectTrigger className="w-32 md:w-40 bg-orange-600 text-white hover:bg-orange-700">
                <SelectValue placeholder="Analysis Type" />
              </SelectTrigger>
              <SelectContent className="w-32 md:w-40 bg-white">
                <SelectItem value="profitAmount">Profit Amount</SelectItem>
                <SelectItem value="profitPercent">Profit Percentage</SelectItem>
                <SelectItem value="efficiency">Profit per Day</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span>Filter by Status</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllStatuses}
                  className="text-xs py-1 h-8 bg-green-200"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deselectAllStatuses}
                  className="text-xs py-1 h-8 bg-red-200"
                >
                  None
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto">
            <div className="space-y-3">
              {Array.from(new Set(data.map((item) => item.docStatus || "Unknown"))).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <Label htmlFor={`status-${status}`} className="cursor-pointer">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Project Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.projectCost, false)}</div>
                <p className="text-xs text-gray-500 mt-1">Selected projects</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Collection Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.collectAmount, false)}</div>
                <p className="text-xs text-gray-500 mt-1">Selected projects</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.profitForProject, false)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTotals.projectCost > 0
                    ? `${((filteredTotals.profitForProject / filteredTotals.projectCost) * 100).toFixed(1)}% margin`
                    : "0% margin"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredTotals.daysInvolved}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTotals.daysInvolved > 0
                    ? `${formatCurrency(filteredTotals.profitForProject / filteredTotals.daysInvolved, false)}/day`
                    : "0/day"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {viewBy === "profit"
                  ? analysisType === "profitAmount"
                    ? "Project Profit Analysis"
                    : analysisType === "profitPercent"
                      ? "Project Profit Percentage"
                      : "Project Profit Efficiency (per day)"
                  : viewBy === "cost"
                    ? "Project Cost vs Collection"
                    : "Project Timeline Analysis"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 relative">
                {filteredData.length > 0 ? (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full border border-gray-200 rounded-lg"
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Please select at least one status to display chart</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">Project Details</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <Package className="mr-1 h-4 w-4" />
            <span>{filteredData.length} projects</span>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-2 text-left">Project</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Developer</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Timeline</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Cost</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Collection</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Profit</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => {
                      return (b.profitForProject || 0) - (a.profitForProject || 0)
                    })
                    .map((item) => {
                      const profitPercentage = item.projectCost
                        ? ((item.profitForProject || 0) / item.projectCost) * 100
                        : 0

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{item.projectWork}</td>
                          <td className="border border-gray-200 px-4 py-2">{item.devName || "N/A"}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <div className="flex flex-col">
                              <span className="text-xs">
                                {formatDate(item.startDate)} - {formatDate(item.endedDate)}
                              </span>
                              <span className="text-xs text-gray-500">{item.daysInvolved || 0} days</span>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">
                            {formatCurrency(item.projectCost || 0, false)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">
                            {formatCurrency(item.collectAmount || 0, false)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">
                            <div className="flex flex-col">
                              <span className={item.profitForProject >= 0 ? "text-green-600" : "text-red-600"}>
                                {formatCurrency(item.profitForProject || 0, false)}
                              </span>
                              <span className="text-xs text-gray-500">{profitPercentage.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.docStatus === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : item.docStatus === "In Progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.docStatus === "On Hold"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {item.docStatus || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Please select at least one status to display projects</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
