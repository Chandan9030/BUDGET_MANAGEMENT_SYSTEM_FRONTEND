"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { PieChart, BarChart, GitBranch, Layers } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import type { ProjectItem } from "../types/project"
import { formatCurrency } from "../lib/format-utils"
import Chart from "chart.js/auto"

interface ProjectVisualizationProps {
  data: ProjectItem[]
}

export function ProjectVisualization({ data }: ProjectVisualizationProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")
  const [viewBy, setViewBy] = useState<"status" | "project" | "month">("project")
  const [costType, setCostType] = useState<"dev" | "extra" | "combined" | "recovery">("combined")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Initialize with all statuses selected
  useEffect(() => {
    if (data.length > 0 && selectedStatuses.length === 0) {
      const statuses = Array.from(new Set(data.map(item => item.status || "Unknown")))
      setSelectedStatuses(statuses)
    }
  }, [data, selectedStatuses.length])

  // Filter data based on selected statuses
  const filteredData = data.filter(item => selectedStatuses.includes(item.status || "Unknown"))

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const selectAllStatuses = () => {
    const statuses = Array.from(new Set(data.map(item => item.status || "Unknown")))
    setSelectedStatuses(statuses)
  }

  const deselectAllStatuses = () => {
    setSelectedStatuses([])
  }

  const costTypeOptions = useMemo(() => ({
    dev: { id: "dev", label: "Development Cost" },
    extra: { id: "extra", label: "Extra Cost" },
    combined: { id: "combined", label: "Combined Cost" },
    recovery: { id: "recovery", label: "Recovery Status" }
  }), []);

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    let chartData: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[] | string; borderColor: string[] | string; borderWidth: number }[] }

    if (viewBy === "project") {
      // Prepare data by project
      const sortedData = [...filteredData].sort((a, b) => {
        let valueA = 0;
        let valueB = 0;

        if (costType === "dev") {
          valueA = a.dev || 0;
          valueB = b.dev || 0;
        } else if (costType === "extra") {
          valueA = a.extra || 0;
          valueB = b.extra || 0;
        } else if (costType === "combined") {
          valueA = (a.dev || 0) + (a.extra || 0);
          valueB = (b.dev || 0) + (b.extra || 0);
        } else if (costType === "recovery") {
          valueA = a.yetToBeRecovered || 0;
          valueB = b.yetToBeRecovered || 0;
        }

        return valueB - valueA;
      });

      // Take top 10 projects for better visualization
      const topProjects = sortedData.slice(0, 10);
      const labels = topProjects.map(item => item.projectName);
      
      let values;
      if (costType === "dev") {
        values = topProjects.map(item => item.dev || 0);
      } else if (costType === "extra") {
        values = topProjects.map(item => item.extra || 0);
      } else if (costType === "combined") {
        values = topProjects.map(item => (item.dev || 0) + (item.extra || 0));
      } else {
        values = topProjects.map(item => item.yetToBeRecovered || 0);
      }

      chartData = {
        labels,
        datasets: [
          {
            label: `${costTypeOptions[costType].label} by Project`,
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
    } else if (viewBy === "status") {
      // Prepare data by status
      const statusMap = new Map<string, number>();

      filteredData.forEach(item => {
        const status = item.status || "Unknown";
        let value = 0;

        if (costType === "dev") {
          value = item.dev || 0;
        } else if (costType === "extra") {
          value = item.extra || 0;
        } else if (costType === "combined") {
          value = (item.dev || 0) + (item.extra || 0);
        } else {
          value = item.yetToBeRecovered || 0;
        }

        statusMap.set(status, (statusMap.get(status) || 0) + value);
      });

      // Sort statuses by value
      const sortedStatuses = [...statusMap.entries()].sort((a, b) => b[1] - a[1]);
      const labels = sortedStatuses.map(([status]) => status);
      const values = sortedStatuses.map(([, value]) => value);

      chartData = {
        labels,
        datasets: [
          {
            label: `${costTypeOptions[costType].label} by Status`,
            data: values,
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
              "rgba(153, 102, 255, 0.7)",
              "rgba(255, 159, 64, 0.7)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      }
    } else {
      // View by month (assuming projectName includes date info that can be parsed)
      // This is a placeholder - you would need actual date data in your projects
      const monthMap = new Map<string, number>();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Simulate monthly data (in a real app, you'd extract this from actual dates)
      filteredData.forEach((item, index) => {
        // This is just for demonstration - in real code you'd parse actual dates
        const monthIndex = index % 12;
        const month = months[monthIndex];
        
        let value = 0;
        if (costType === "dev") {
          value = item.dev || 0;
        } else if (costType === "extra") {
          value = item.extra || 0;
        } else if (costType === "combined") {
          value = (item.dev || 0) + (item.extra || 0);
        } else {
          value = item.yetToBeRecovered || 0;
        }
        
        monthMap.set(month, (monthMap.get(month) || 0) + value);
      });
      
      // Sort by month order
      const sortedMonths = months.filter(month => monthMap.has(month));
      const values = sortedMonths.map(month => monthMap.get(month) || 0);
      
      chartData = {
        labels: sortedMonths,
        datasets: [
          {
            label: `${costTypeOptions[costType].label} by Month`,
            data: values,
            backgroundColor: "rgba(75, 192, 192, 0.7)",
            borderColor: "rgba(75, 192, 192, 1)",
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
                const label = context.label || "";
                const value = context.raw as number;
                return `${label}: ${formatCurrency(value, false)}`;
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
                    callback: (value) => formatCurrency(value as number, false),
                  },
                },
              }
            : undefined,
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredData, chartType, viewBy, costType, costTypeOptions]);

  // Calculate totals for filtered data
  const filteredTotals = {
    dev: filteredData.reduce((sum, item) => sum + (item.dev || 0), 0),
    extra: filteredData.reduce((sum, item) => sum + (item.extra || 0), 0),
    combined: filteredData.reduce((sum, item) => sum + (item.dev || 0) + (item.extra || 0), 0),
    yetToBeRecovered: filteredData.reduce((sum, item) => sum + (item.yetToBeRecovered || 0), 0),
    recovered: filteredData.reduce((sum, item) => {
      const total = (item.dev || 0) + (item.extra || 0);
      const yetToRecover = item.yetToBeRecovered || 0;
      return sum + (total - yetToRecover);
    }, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">Project Visualization</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("pie")}
              className="flex items-center gap-1 bg-amber-600 text-white hover:bg-amber-700"
            >
              <PieChart className="h-4 w-4" />
              <span>Pie</span>
            </Button>
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
              className="flex items-center gap-1 bg-amber-600 text-white hover:bg-amber-700"
            >
              <BarChart className="h-4 w-4" />
              <span>Bar</span>
            </Button>
          </div>

          <Select value={viewBy} onValueChange={(value: "status" | "project" | "month") => setViewBy(value)}>
            <SelectTrigger className="w-32 md:w-40 bg-orange-600 text-white hover:bg-orange-700">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent className="w-32 md:w-40 bg-white">
              <SelectItem value="project">By Project</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="month">By Month</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={costType}
            onValueChange={(value: "dev" | "extra" | "combined" | "recovery") => setCostType(value)}
          >
            <SelectTrigger className="w-32 md:w-40 bg-orange-600 text-white hover:bg-orange-700">
              <SelectValue placeholder="Cost Type" />
            </SelectTrigger>
            <SelectContent className="w-32 md:w-40 bg-white">
              <SelectItem value="dev">Dev Cost</SelectItem>
              <SelectItem value="extra">Extra Cost</SelectItem>
              <SelectItem value="combined">Combined Cost</SelectItem>
              <SelectItem value="recovery">Recovery Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span>Filter by Status</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllStatuses} className="text-xs py-1 h-8 bg-green-200">
                  All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllStatuses} className="text-xs py-1 h-8 bg-red-200">
                  None
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto">
            <div className="space-y-3">
              {Array.from(new Set(data.map(item => item.status || "Unknown"))).map(status => (
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Dev Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.dev, false)}</div>
                <p className="text-xs text-gray-500 mt-1">Selected projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Extra Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.extra, false)}</div>
                <p className="text-xs text-gray-500 mt-1">Selected projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Recovered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.recovered, false)}</div>
                <p className="text-xs text-gray-500 mt-1">Amount already recovered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Yet to be Recovered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.yetToBeRecovered, false)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {((filteredTotals.yetToBeRecovered / filteredTotals.combined) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {viewBy === "project" 
                  ? `Project Cost Breakdown (${costTypeOptions[costType].label})`
                  : viewBy === "status" 
                    ? `Status Cost Breakdown (${costTypeOptions[costType].label})`
                    : `Monthly Cost Breakdown (${costTypeOptions[costType].label})`
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {filteredData.length > 0 ? (
                  <canvas ref={chartRef}></canvas>
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

      {viewBy === "project" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">Project Cost Details</CardTitle>
            <div className="flex items-center text-sm text-gray-500">
              <GitBranch className="mr-1 h-4 w-4" />
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
                      <th className="border border-gray-200 px-4 py-2 text-right">Dev Cost</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Extra Cost</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Total Cost</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Yet to be Recovered</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Recovery %</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData
                      .sort((a, b) => {
                        const totalA = (a.dev || 0) + (a.extra || 0);
                        const totalB = (b.dev || 0) + (b.extra || 0);
                        return totalB - totalA;
                      })
                      .map((item) => {
                        const totalCost = (item.dev || 0) + (item.extra || 0);
                        const recoveryPercentage = totalCost === 0 ? 0 : 
                          ((totalCost - (item.yetToBeRecovered || 0)) / totalCost) * 100;

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">{item.projectName}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {formatCurrency(item.dev || 0, false)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {formatCurrency(item.extra || 0, false)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {formatCurrency(totalCost, false)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {formatCurrency(item.yetToBeRecovered || 0, false)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {recoveryPercentage.toFixed(1)}%
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.status === "Completed" ? "bg-green-100 text-green-800" :
                                item.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                                item.status === "On Hold" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {item.status || "Unknown"}
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
      )}

      {viewBy === "status" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">Status Summary</CardTitle>
            <div className="flex items-center text-sm text-gray-500">
              <Layers className="mr-1 h-4 w-4" />
              <span>{selectedStatuses.length} statuses</span>
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Projects</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Total Dev Cost</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Total Extra Cost</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Combined Cost</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Yet to be Recovered</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Recovery %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const statusMap = new Map<
                        string,
                        {
                          count: number
                          dev: number
                          extra: number
                          yetToBeRecovered: number
                        }
                      >();

                      filteredData.forEach((item) => {
                        const status = item.status || "Unknown";
                        const current = statusMap.get(status) || { count: 0, dev: 0, extra: 0, yetToBeRecovered: 0 };

                        statusMap.set(status, {
                          count: current.count + 1,
                          dev: current.dev + (item.dev || 0),
                          extra: current.extra + (item.extra || 0),
                          yetToBeRecovered: current.yetToBeRecovered + (item.yetToBeRecovered || 0),
                        });
                      });

                      return [...statusMap.entries()]
                        .sort((a, b) => {
                          const totalA = a[1].dev + a[1].extra;
                          const totalB = b[1].dev + b[1].extra;
                          return totalB - totalA;
                        })
                        .map(([status, stats]) => {
                          const totalCost = stats.dev + stats.extra;
                          const recoveryPercentage = totalCost === 0 ? 0 : 
                            ((totalCost - stats.yetToBeRecovered) / totalCost) * 100;

                          return (
                            <tr key={status} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-4 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  status === "Completed" ? "bg-green-100 text-green-800" :
                                  status === "In Progress" ? "bg-blue-100 text-blue-800" :
                                  status === "On Hold" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {status}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">{stats.count}</td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {formatCurrency(stats.dev, false)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {formatCurrency(stats.extra, false)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {formatCurrency(stats.dev + stats.extra, false)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {formatCurrency(stats.yetToBeRecovered, false)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {recoveryPercentage.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        });
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">Please select at least one status to display summary</p>
            )}
          </CardContent>
        </Card>
      )}

      {viewBy === "month" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold">Monthly Summary (Simulated Data)</CardTitle>
            <div className="flex items-center text-sm text-gray-500">
              <span>* This view uses simulated data for demonstration</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 mb-4">
              Note: In a production application, you would use actual date information from your project data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}