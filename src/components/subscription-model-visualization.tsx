"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Button } from "../components/ui/button"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import { BarChart, LineChart, PieChart, Users, Calendar, Activity } from "lucide-react"
import { formatCurrency } from "../lib/format-utils"
import type { SubscriptionModelItem } from "../types/subscription-model"
import Chart from "chart.js/auto"

interface SubscriptionModelVisualizationProps {
  data: SubscriptionModelItem[]
}

export function SubscriptionModelVisualization({ data }: SubscriptionModelVisualizationProps) {
  const [activeTab, setActiveTab] = useState("distribution")
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("pie")
  const [currentMonth, setCurrentMonth] = useState<string>("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"count" | "revenue">("count")
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Initialize with all types selected
  useEffect(() => {
    if (data.length > 0 && selectedTypes.length === 0) {
      const types = Array.from(new Set(data.map(item => item.solpType || "Unknown")))
      setSelectedTypes(types)
    }
  }, [data, selectedTypes.length])

  // Filter data based on selected types
  const filteredData = data.filter(item => selectedTypes.includes(item.solpType || "Unknown"))

  // Get current month name
  useEffect(() => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ]
    const currentDate = new Date()
    setCurrentMonth(monthNames[currentDate.getMonth()])
  }, [])

  // Toggle subscription type selection
  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  const selectAllTypes = () => {
    const types = Array.from(new Set(data.map(item => item.solpType || "Unknown")))
    setSelectedTypes(types)
  }

  const deselectAllTypes = () => {
    setSelectedTypes([])
  }

  // Calculate online vs offline distribution
  const onlineSubscriptions = filteredData.filter((item) => item.solpType === "Online")
  const offlineSubscriptions = filteredData.filter((item) => item.solpType === "Offline")

  const onlineTotal = onlineSubscriptions.reduce((sum, item) => sum + item.subscriptionsAvailed, 0)
  const offlineTotal = offlineSubscriptions.reduce((sum, item) => sum + item.subscriptionsAvailed, 0)

  // Removed unused variable 'onlineRevenue'
  // Removed unused variable 'offlineRevenue'

  // Calculate filtered totals
  const filteredTotals = {
    subscriptionsAvailed: filteredData.reduce((sum, item) => sum + item.subscriptionsAvailed, 0),
    projectedMonthlyRevenue: filteredData.reduce((sum, item) => sum + item.projectedMonthlyRevenue, 0),
    projectedAnnualRevenue: filteredData.reduce((sum, item) => sum + item.projectedAnnualRevenue, 0),
    getSubscriptionDate: filteredData.reduce(
      (sum, item) => sum + (typeof item.getSubscriptionDate === "number" ? item.getSubscriptionDate : 0),
      0,
    ),
  }

  // Sort data by projected monthly revenue for charts
  const sortedByRevenue = [...filteredData].sort((a, b) => b.projectedMonthlyRevenue - a.projectedMonthlyRevenue)
  // Removed unused variable 'sortedBySubscriptions'

  // Get top sources
  const topRevenueSources = sortedByRevenue.slice(0, 8)
  // Removed unused variable 'topSubscriptionSources'

  // Calculate percentages for distribution chart
  const totalSubscriptions = filteredTotals.subscriptionsAvailed
  const onlinePercentage = totalSubscriptions > 0 ? (onlineTotal / totalSubscriptions) * 100 : 0
  const offlinePercentage = totalSubscriptions > 0 ? (offlineTotal / totalSubscriptions) * 100 : 0

  // Calculate average revenue per subscription
  const avgRevenuePerSubscription = filteredTotals.subscriptionsAvailed > 0 
    ? filteredTotals.projectedMonthlyRevenue / filteredTotals.subscriptionsAvailed 
    : 0

  // Chart rendering
  useEffect(() => {
    if (!chartRef.current || activeTab !== "distribution") return

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
        backgroundColor: string[], 
        borderColor: string[],
        borderWidth: number 
      }[] 
    }

    // Generate color scale
    const generateColors = (count: number, baseColors: string[]) => {
      if (count <= baseColors.length) {
        return baseColors.slice(0, count)
      }
      
      const colors = [...baseColors]
      for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 137) % 360 // Golden angle approximation
        colors.push(`hsl(${hue}, 70%, 60%)`)
      }
      return colors
    }

    // Base colors for consistency
    const baseBackgroundColors = [
      'rgba(59, 130, 246, 0.7)', // blue
      'rgba(34, 197, 94, 0.7)',  // green
      'rgba(239, 68, 68, 0.7)',  // red
      'rgba(249, 115, 22, 0.7)', // orange
      'rgba(139, 92, 246, 0.7)',  // purple
      'rgba(20, 184, 166, 0.7)',  // teal
    ]
    
    const baseBorderColors = [
      'rgba(59, 130, 246, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(139, 92, 246, 1)',
      'rgba(20, 184, 166, 1)',
    ]

    if (viewMode === "count") {
      // Show distribution by subscription count
      const labels = Array.from(new Set(filteredData.map(item => item.solpType)))
      const counts = labels.map(type => 
        filteredData.filter(item => item.solpType === type)
          .reduce((sum, item) => sum + item.subscriptionsAvailed, 0)
      )
      
      const backgroundColors = generateColors(labels.length, baseBackgroundColors)
      const borderColors = generateColors(labels.length, baseBorderColors)
      
      chartData = {
        labels,
        datasets: [{
          label: "Subscription Count",
          data: counts,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      }
    } else {
      // Show distribution by revenue
      const labels = Array.from(new Set(filteredData.map(item => item.solpType)))
      const revenues = labels.map(type => 
        filteredData.filter(item => item.solpType === type)
          .reduce((sum, item) => sum + item.projectedMonthlyRevenue, 0)
      )
      
      const backgroundColors = generateColors(labels.length, baseBackgroundColors)
      const borderColors = generateColors(labels.length, baseBorderColors)
      
      chartData = {
        labels,
        datasets: [{
          label: "Monthly Revenue",
          data: revenues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
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
                
                if (viewMode === "revenue") {
                  return `${label}: ${formatCurrency(value, false)}`;
                } else {
                  return `${label}: ${value}`;
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
                if (viewMode === "revenue") {
                  return formatCurrency(value as number, false);
                } else {
                  return value;
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
  }, [filteredData, chartType, activeTab, viewMode]);

  // Timeline chart rendering
  useEffect(() => {
    if (!chartRef.current || activeTab !== "timeline") return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Filter items with subscription date
    const itemsWithDate = filteredData.filter(item => 
      typeof item.getSubscriptionDate === "number" && item.getSubscriptionDate > 0
    ).sort((a, b) => {
      const aDate = typeof a.getSubscriptionDate === "number" ? a.getSubscriptionDate : 0
      const bDate = typeof b.getSubscriptionDate === "number" ? b.getSubscriptionDate : 0
      return aDate - bDate
    })

    // Take top 10 items for better visualization
    const displayItems = itemsWithDate.slice(0, 10)
    
    const labels = displayItems.map(item => item.revenueSource || "Unnamed")
    const values = displayItems.map(item => 
      typeof item.getSubscriptionDate === "number" ? item.getSubscriptionDate : 0
    )
    
    // Create color scale based on subscription type
    const backgroundColors = displayItems.map(item => 
      item.solpType === "Online" ? 'rgba(59, 130, 246, 0.7)' : 'rgba(34, 197, 94, 0.7)'
    )
    
    const borderColors = displayItems.map(item => 
      item.solpType === "Online" ? 'rgba(59, 130, 246, 1)' : 'rgba(34, 197, 94, 1)'
    )

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: chartType === "pie" ? "pie" : chartType,
      data: {
        labels,
        datasets: [{
          label: "Subscription Dates",
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            display: chartType === "pie"
          }
        },
        scales: chartType !== "pie" ? {
          y: {
            beginAtZero: true
          }
        } : undefined
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredData, chartType, activeTab]);

  // Revenue chart rendering
  useEffect(() => {
    if (!chartRef.current || activeTab !== "revenue") return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Take top 8 revenue sources
    const labels = topRevenueSources.map(item => item.revenueSource || "Unnamed")
    const monthlyValues = topRevenueSources.map(item => item.projectedMonthlyRevenue)
    const annualValues = topRevenueSources.map(item => item.projectedAnnualRevenue)
    
    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: chartType === "pie" ? "pie" : chartType,
      data: {
        labels,
        datasets: chartType === "pie" ? 
          [{
            label: "Monthly Revenue",
            data: monthlyValues,
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',
              'rgba(34, 197, 94, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(249, 115, 22, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(20, 184, 166, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(236, 72, 153, 0.7)',
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(34, 197, 94, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(249, 115, 22, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(20, 184, 166, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(236, 72, 153, 1)',
            ],
            borderWidth: 1
          }] : 
          [
            {
              label: "Monthly Revenue",
              data: monthlyValues,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            },
            {
              label: "Annual Revenue",
              data: annualValues,
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 1
            }
          ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top"
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || "";
                const value = context.raw as number;
                return `${label}: ${formatCurrency(value, false)}`;
              }
            }
          }
        },
        scales: chartType !== "pie" ? {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value as number, false)
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
  }, [filteredData, chartType, activeTab, topRevenueSources]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">Subscription Model Visualization</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
              className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <BarChart className="h-4 w-4" />
              <span>Bar</span>
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
              className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <LineChart className="h-4 w-4" />
              <span>Line</span>
            </Button>
            <Button
              variant={chartType === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("pie")}
              className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <PieChart className="h-4 w-4" />
              <span>Pie</span>
            </Button>
          </div>

          {activeTab === "distribution" && (
            <Select value={viewMode} onValueChange={(value: "count" | "revenue") => setViewMode(value)}>
              <SelectTrigger className="w-32 md:w-40 bg-emerald-600 text-white hover:bg-emerald-700">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent className="w-32 md:w-40 bg-white">
                <SelectItem value="count">By Count</SelectItem>
                <SelectItem value="revenue">By Revenue</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTotals.subscriptionsAvailed}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Online: {onlineTotal} ({onlinePercentage.toFixed(1)}%)
              <br />
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Offline: {offlineTotal} ({offlinePercentage.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(filteredTotals.projectedMonthlyRevenue, false)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(avgRevenuePerSubscription, false)}/subscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Annual Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(filteredTotals.projectedAnnualRevenue, false)}</div>
            <p className="text-xs text-gray-500 mt-1">Projected based on monthly revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{currentMonth} Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTotals.getSubscriptionDate}</div>
            <p className="text-xs text-gray-500 mt-1">Based on "Get Subscription Date" field</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span>Filter by Type</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllTypes} className="text-xs py-1 h-8 bg-blue-200">
                  All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllTypes} className="text-xs py-1 h-8 bg-red-200">
                  None
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto">
            <div className="space-y-3">
              {Array.from(new Set(data.map(item => item.solpType || "Unknown"))).map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`} 
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-4">
          <Tabs defaultValue={activeTab} onChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="distribution" className="flex gap-1 items-center">
                <PieChart className="h-4 w-4" />
                <span>Distribution</span>
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex gap-1 items-center">
                <Activity className="h-4 w-4" />
                <span>Revenue</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex gap-1 items-center">
                <Calendar className="h-4 w-4" />
                <span>Timeline</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="distribution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {viewMode === "count"
                      ? "Subscription Distribution by Type"
                      : "Revenue Distribution by Type"}
                  </CardTitle>
                  <CardDescription>
                    {viewMode === "count"
                      ? "Distribution of subscriptions by type (Online vs Offline)"
                      : "Distribution of revenue by type (Online vs Offline)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {filteredData.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">Please select at least one type to display chart</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>Monthly and annual revenue by source</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {filteredData.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">Please select at least one type to display chart</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Timeline</CardTitle>
                  <CardDescription>Subscription dates for {currentMonth}</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {filteredData.filter(item => 
                    typeof item.getSubscriptionDate === "number" && item.getSubscriptionDate > 0
                  ).length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No subscription date data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">Subscription Details</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="mr-1 h-4 w-4" />
            <span>{filteredData.length} items</span>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-2 text-left">Revenue Source</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Subscriptions</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Monthly Revenue</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Annual Revenue</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">{currentMonth} Subs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => (b.projectedMonthlyRevenue || 0) - (a.projectedMonthlyRevenue || 0))
                    .map((item) => {
                      const revenuePerSubscription = item.subscriptionsAvailed 
                        ? (item.projectedMonthlyRevenue || 0) / item.subscriptionsAvailed
                        : 0;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{item.revenueSource}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.solpType === "Online" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}>
                              {item.solpType}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            {item.subscriptionsAvailed}
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
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            {typeof item.getSubscriptionDate === "number" ? item.getSubscriptionDate : "N/A"}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-bold">Total</td>
                    <td className="border border-gray-200 px-4 py-2"></td>
                    <td className="border border-gray-200 px-4 py-2 text-center font-bold">
                      {filteredTotals.subscriptionsAvailed}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-bold">
                      {formatCurrency(filteredTotals.projectedMonthlyRevenue, false)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right font-bold">
                      {formatCurrency(filteredTotals.projectedAnnualRevenue, false)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};