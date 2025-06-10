"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart, LineChart, PieChart, Users } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import type { SubscriptionRevenueItem } from "../types/subscription-revenue"
import { formatCurrency } from "../lib/format-utils"
import Chart from "chart.js/auto"

interface SubscriptionRevenueVisualizationProps {
  data: SubscriptionRevenueItem[]
}

export function SubscriptionRevenueVisualization({ data }: SubscriptionRevenueVisualizationProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar")
  const [viewBy, setViewBy] = useState<"monthly" | "annual" | "profit">("monthly")
  const [analysisType, setAnalysisType] = useState<"total" | "perSubscription" | "margin">("total")
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Initialize with all revenue sources selected
  useEffect(() => {
    if (data.length > 0 && selectedSources.length === 0) {
      const sources = Array.from(new Set(data.map(item => item.revenueSource || "Unknown")))
      setSelectedSources(sources)
    }
  }, [data, selectedSources.length])

  // Filter data based on selected sources
  const filteredData = data.filter(item => selectedSources.includes(item.revenueSource || "Unknown"))

  const toggleSource = (source: string) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        return prev.filter(s => s !== source)
      } else {
        return [...prev, source]
      }
    })
  }

  const selectAllSources = () => {
    const sources = Array.from(new Set(data.map(item => item.revenueSource || "Unknown")))
    setSelectedSources(sources)
  }

  const deselectAllSources = () => {
    setSelectedSources([])
  }

  // Calculate filtered totals
  const filteredTotals = {
    subscriptionsAvailed: filteredData.reduce((sum, item) => sum + (item.subscriptionsAvailed || 0), 0),
    projectedMonthlyRevenue: filteredData.reduce((sum, item) => sum + (item.projectedMonthlyRevenue || 0), 0),
    projectedAnnualRevenue: filteredData.reduce((sum, item) => sum + (item.projectedAnnualRevenue || 0), 0),
    profit: filteredData.reduce((sum, item) => sum + (item.profit || 0), 0),
    subscribed: filteredData.reduce((sum, item) => sum + (Number(item.subscribed) || 0), 0)
  };

  // Chart rendering
  useEffect(() => {
    if (!chartRef.current) return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    let chartData: { 
      labels: string[], 
      datasets: { 
        label: string, 
        data: number[], 
        backgroundColor: string | string[], 
        borderColor: string | string[],
        borderWidth: number 
      }[] 
    }

    // Sort data based on analysis type and view
    const sortedData = [...filteredData].sort((a, b) => {
      if (viewBy === "monthly") {
        if (analysisType === "total") {
          return (b.projectedMonthlyRevenue || 0) - (a.projectedMonthlyRevenue || 0)
        } else if (analysisType === "perSubscription") {
          const perSubA = a.subscribed ? (a.projectedMonthlyRevenue || 0) / Number(a.subscribed) : 0
          const perSubB = b.subscribed ? (b.projectedMonthlyRevenue || 0) / Number(b.subscribed) : 0
          return perSubB - perSubA
        } else {
          const marginA = a.projectedMonthlyRevenue ? (a.profit || 0) / a.projectedMonthlyRevenue * 100 : 0
          const marginB = b.projectedMonthlyRevenue ? (b.profit || 0) / b.projectedMonthlyRevenue * 100 : 0
          return marginB - marginA
        }
      } else if (viewBy === "annual") {
        if (analysisType === "total") {
          return (b.projectedAnnualRevenue || 0) - (a.projectedAnnualRevenue || 0)
        } else if (analysisType === "perSubscription") {
          const perSubA = a.subscribed ? (a.projectedAnnualRevenue || 0) / Number(a.subscribed) : 0
          const perSubB = b.subscribed ? (b.projectedAnnualRevenue || 0) / Number(b.subscribed) : 0
          return perSubB - perSubA
        } else {
          const marginA = a.projectedAnnualRevenue ? (a.profit || 0) * 12 / a.projectedAnnualRevenue * 100 : 0
          const marginB = b.projectedAnnualRevenue ? (b.profit || 0) * 12 / b.projectedAnnualRevenue * 100 : 0
          return marginB - marginA
        }
      } else {
        if (analysisType === "total") {
          return (b.profit || 0) - (a.profit || 0)
        } else if (analysisType === "perSubscription") {
          const perSubA = a.subscribed ? (a.profit || 0) / Number(a.subscribed) : 0
          const perSubB = b.subscribed ? (b.profit || 0) / Number(b.subscribed) : 0
          return perSubB - perSubA
        } else {
          const marginA = a.projectedMonthlyRevenue ? (a.profit || 0) / a.projectedMonthlyRevenue * 100 : 0
          const marginB = b.projectedMonthlyRevenue ? (b.profit || 0) / b.projectedMonthlyRevenue * 100 : 0
          return marginB - marginA
        }
      }
    })

    // Take top 10 items for better visualization
    const topItems = sortedData.slice(0, 10)
    const labels = topItems.map(item => item.revenueSource || "Unnamed Source")

    // Generate color scale
    const generateColors = (count: number) => {
      const colors = []
      for (let i = 0; i < count; i++) {
        const hue = (i * 137) % 360 // Golden angle approximation for good distribution
        colors.push(`hsl(${hue}, 70%, 60%)`)
      }
      return colors
    }

    const backgroundColors = generateColors(topItems.length)
    const borderColors = backgroundColors.map(color => color.replace("60%", "50%"))

    if (viewBy === "monthly") {
      if (analysisType === "total") {
        const values = topItems.map(item => item.projectedMonthlyRevenue || 0)
        chartData = {
          labels,
          datasets: [{
            label: "Monthly Revenue",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(34, 197, 94, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(34, 197, 94, 1)",
            borderWidth: 1
          }]
        }
      } else if (analysisType === "perSubscription") {
        const values = topItems.map(item => 
          item.subscribed ? (item.projectedMonthlyRevenue || 0) / Number(item.subscribed) : 0
        )
        chartData = {
          labels,
          datasets: [{
            label: "Revenue per Subscription",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(59, 130, 246, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(59, 130, 246, 1)",
            borderWidth: 1
          }]
        }
      } else {
        const values = topItems.map(item => 
          item.projectedMonthlyRevenue ? (item.profit || 0) / item.projectedMonthlyRevenue * 100 : 0
        )
        chartData = {
          labels,
          datasets: [{
            label: "Profit Margin (%)",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(139, 92, 246, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(139, 92, 246, 1)",
            borderWidth: 1
          }]
        }
      }
    } else if (viewBy === "annual") {
      if (analysisType === "total") {
        const values = topItems.map(item => item.projectedAnnualRevenue || 0)
        chartData = {
          labels,
          datasets: [{
            label: "Annual Revenue",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(16, 185, 129, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(16, 185, 129, 1)",
            borderWidth: 1
          }]
        }
      } else if (analysisType === "perSubscription") {
        const values = topItems.map(item => 
          item.subscribed ? (item.projectedAnnualRevenue || 0) / Number(item.subscribed) : 0
        )
        chartData = {
          labels,
          datasets: [{
            label: "Annual Revenue per Subscription",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(59, 130, 246, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(59, 130, 246, 1)",
            borderWidth: 1
          }]
        }
      } else {
        const values = topItems.map(item => 
          item.projectedAnnualRevenue ? (item.profit || 0) * 12 / item.projectedAnnualRevenue * 100 : 0
        )
        chartData = {
          labels,
          datasets: [{
            label: "Annual Profit Margin (%)",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(139, 92, 246, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(139, 92, 246, 1)",
            borderWidth: 1
          }]
        }
      }
    } else {
      if (analysisType === "total") {
        const values = topItems.map(item => item.profit || 0)
        chartData = {
          labels,
          datasets: [{
            label: "Profit",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(236, 72, 153, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(236, 72, 153, 1)",
            borderWidth: 1
          }]
        }
      } else if (analysisType === "perSubscription") {
        const values = topItems.map(item => 
          item.subscribed ? (item.profit || 0) / Number(item.subscribed) : 0
        )
        chartData = {
          labels,
          datasets: [{
            label: "Profit per Subscription",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(236, 72, 153, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(236, 72, 153, 1)",
            borderWidth: 1
          }]
        }
      } else {
        const values = topItems.map(item => 
          item.projectedMonthlyRevenue ? (item.profit || 0) / item.projectedMonthlyRevenue * 100 : 0
        )
        chartData = {
          labels,
          datasets: [{
            label: "Profit Margin (%)",
            data: values,
            backgroundColor: chartType === "pie" ? backgroundColors : "rgba(139, 92, 246, 0.7)",
            borderColor: chartType === "pie" ? borderColors : "rgba(139, 92, 246, 1)",
            borderWidth: 1
          }]
        }
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
            position: "top",
            labels: {
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || "";
                const value = context.raw as number;
                
                if (analysisType === "margin") {
                  return `${label}: ${value.toFixed(1)}%`;
                } else if (analysisType === "perSubscription") {
                  return `${label}: ${formatCurrency(value, false)}/subscription`;
                } else {
                  return `${label}: ${formatCurrency(value, false)}`;
                }
              }
            }
          }
        },
        scales: chartType !== "pie" ? {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (analysisType === "margin") {
                  return `${value}%`;
                } else {
                  return formatCurrency(value as number, false);
                }
              }
            }
          }
        } : undefined
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredData, chartType, viewBy, analysisType]);

  // Calculate revenue per subscription and average profit margin for selected data
  const avgRevenuePerSubscription = filteredTotals.subscribed > 0 
    ? filteredTotals.projectedMonthlyRevenue / filteredTotals.subscribed 
    : 0;
  
  const avgProfitMargin = filteredTotals.projectedMonthlyRevenue > 0 
    ? (filteredTotals.profit / filteredTotals.projectedMonthlyRevenue) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">Subscription Revenue Visualization</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
              className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700"
            >
              <BarChart className="h-4 w-4" />
              <span>Bar</span>
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
              className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700"
            >
              <LineChart className="h-4 w-4" />
              <span>Line</span>
            </Button>
            <Button
              variant={chartType === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("pie")}
              className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700"
            >
              <PieChart className="h-4 w-4" />
              <span>Pie</span>
            </Button>
          </div>

          <Select value={viewBy} onValueChange={(value: "monthly" | "annual" | "profit") => setViewBy(value)}>
            <SelectTrigger className="w-32 md:w-40 bg-emerald-600 text-white hover:bg-emerald-700">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent className="w-32 md:w-40 bg-white">
              <SelectItem value="monthly">Monthly Revenue</SelectItem>
              <SelectItem value="annual">Annual Revenue</SelectItem>
              <SelectItem value="profit">Profit Analysis</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={analysisType} 
            onValueChange={(value: "total" | "perSubscription" | "margin") => setAnalysisType(value)}
          >
            <SelectTrigger className="w-32 md:w-40 bg-emerald-600 text-white hover:bg-emerald-700">
              <SelectValue placeholder="Analysis Type" />
            </SelectTrigger>
            <SelectContent className="w-32 md:w-40 bg-white">
              <SelectItem value="total">Total</SelectItem>
              <SelectItem value="perSubscription">Per Subscription</SelectItem>
              <SelectItem value="margin">Profit Margin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span>Filter by Source</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllSources} className="text-xs py-1 h-8 bg-green-200">
                  All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllSources} className="text-xs py-1 h-8 bg-red-200">
                  None
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto">
            <div className="space-y-3">
              {Array.from(new Set(data.map(item => item.revenueSource || "Unknown"))).map(source => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`source-${source}`} 
                    checked={selectedSources.includes(source)}
                    onCheckedChange={() => toggleSource(source)}
                  />
                  <Label htmlFor={`source-${source}`} className="cursor-pointer">
                    {source}
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
                <CardTitle className="text-sm font-medium text-gray-500">Total Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredTotals.subscriptionsAvailed}</div>
                <p className="text-xs text-gray-500 mt-1">Available subscription plans</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Subscribed Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredTotals.subscribed}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {avgRevenuePerSubscription > 0 
                    ? `${formatCurrency(avgRevenuePerSubscription, false)}/subscription` 
                    : '0/subscription'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.projectedMonthlyRevenue, false)}</div>
                <p className="text-xs text-gray-500 mt-1">Projected monthly revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(filteredTotals.profit, false)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {avgProfitMargin > 0 
                    ? `${avgProfitMargin.toFixed(1)}% margin` 
                    : '0% margin'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {viewBy === "monthly" 
                  ? analysisType === "total" 
                    ? "Monthly Revenue Analysis" 
                    : analysisType === "perSubscription" 
                      ? "Revenue per Subscription" 
                      : "Monthly Profit Margin"
                  : viewBy === "annual" 
                    ? analysisType === "total" 
                      ? "Annual Revenue Analysis" 
                      : analysisType === "perSubscription" 
                        ? "Annual Revenue per Subscription" 
                        : "Annual Profit Margin"
                    : analysisType === "total" 
                      ? "Profit Analysis" 
                      : analysisType === "perSubscription" 
                        ? "Profit per Subscription" 
                        : "Profit Margin Analysis"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {filteredData.length > 0 ? (
                  <canvas ref={chartRef}></canvas>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Please select at least one source to display chart</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">Subscription Details</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="mr-1 h-4 w-4" />
            <span>{filteredData.length} sources</span>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-2 text-left">Revenue Source</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Subscriptions</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Monthly Revenue</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Annual Revenue</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Profit</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => {
                      // Default sort by monthly revenue
                      return (b.projectedMonthlyRevenue || 0) - (a.projectedMonthlyRevenue || 0);
                    })
                    .map((item) => {
                      const profitMargin = item.projectedMonthlyRevenue 
                        ? (item.profit || 0) / item.projectedMonthlyRevenue * 100 
                        : 0;
                      
                      const revenuePerSubscription = item.subscribed 
                        ? (item.projectedMonthlyRevenue || 0) / item.subscribed 
                        : 0;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{item.revenueSource}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <div className="flex flex-col">
                              <span className="text-sm">{item.subscribed || 0} subscribed</span>
                              <span className="text-xs text-gray-500">of {item.subscriptionsAvailed || 0} available</span>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">
                            <div className="flex flex-col">
                              <span>{formatCurrency(item.projectedMonthlyRevenue || 0, false)}</span>
                              <span className="text-xs text-gray-500">
                                {formatCurrency(revenuePerSubscription, false)}/subscription
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">
                            {formatCurrency(item.projectedAnnualRevenue || 0, false)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">
                            <span className={item.profit >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(item.profit || 0, false)}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              profitMargin >= 30 ? "bg-green-100 text-green-800" :
                              profitMargin >= 15 ? "bg-blue-100 text-blue-800" :
                              profitMargin >= 0 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {profitMargin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Please select at least one source to display subscription details</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue and Profit Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-4 py-2 text-left">Revenue Source</th>
                  <th className="border border-gray-200 px-4 py-2 text-center" colSpan={2}>Monthly</th>
                  <th className="border border-gray-200 px-4 py-2 text-center" colSpan={2}>Annual</th>
                  <th className="border border-gray-200 px-4 py-2 text-center" colSpan={2}>Efficiency</th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2"></th>
                  <th className="border border-gray-200 px-4 py-2 text-center">Revenue</th>
                  <th className="border border-gray-200 px-4 py-2 text-center">Profit</th>
                  <th className="border border-gray-200 px-4 py-2 text-center">Revenue</th>
                  <th className="border border-gray-200 px-4 py-2 text-center">Profit</th>
                  <th className="border border-gray-200 px-4 py-2 text-center">Per Subscription</th>
                  <th className="border border-gray-200 px-4 py-2 text-center">Margin</th>
                </tr>
              </thead>
              <tbody>
                {filteredData
                  .sort((a, b) => (b.projectedMonthlyRevenue || 0) - (a.projectedMonthlyRevenue || 0))
                  .map((item) => {
                    const monthlyProfit = item.profit || 0;
                    const annualProfit = (item.profit || 0) * 12;
                    const profitMargin = item.projectedMonthlyRevenue 
                      ? (monthlyProfit / item.projectedMonthlyRevenue) * 100 
                      : 0;
                    const revenuePerSub = item.subscribed 
                      ? (item.projectedMonthlyRevenue || 0) / (Number(item.subscribed) || 1)
                      : 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">{item.revenueSource}</td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          {formatCurrency(item.projectedMonthlyRevenue || 0, false)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <span className={monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(monthlyProfit, false)}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          {formatCurrency(item.projectedAnnualRevenue || 0, false)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <span className={annualProfit >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(annualProfit, false)}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          {formatCurrency(revenuePerSub, false)}/subscription
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            profitMargin >= 30 ? "bg-green-100 text-green-800" :
                            profitMargin >= 15 ? "bg-blue-100 text-blue-800" :
                            profitMargin >= 0 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {profitMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};