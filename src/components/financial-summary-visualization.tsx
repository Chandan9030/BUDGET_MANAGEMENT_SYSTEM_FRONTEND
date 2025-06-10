"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Button } from "../components/ui/button"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import { BarChart, LineChart, PieChart, DollarSign, TrendingUp, Filter } from "lucide-react"
import { formatCurrency } from "../lib/format-utils"
import type { FinancialSummaryItem } from "../types/financial-summary"
import Chart from "chart.js/auto"

interface FinancialSummaryVisualizationProps {
  data: FinancialSummaryItem[]
}

export function FinancialSummaryVisualization({ data }: FinancialSummaryVisualizationProps) {
  const [activeTab, setActiveTab] = useState("breakdown")
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("pie")
  const [viewMode, setViewMode] = useState<"amount" | "percentage">("amount")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [timePeriod, setTimePeriod] = useState<"monthly" | "quarterly" | "annual">("monthly")
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  // Initialize with all categories selected
  useEffect(() => {
    if (data.length > 0 && selectedCategories.length === 0) {
      const categories = Array.from(new Set(data.map(item => item.category)))
      setSelectedCategories(categories)
    }
  }, [data, selectedCategories.length])

  // Filter data based on selected categories
  const filteredData = data.filter(item => selectedCategories.includes(item.category))

  // Separate expenses and income
  const expenses = filteredData.filter((item) => item.amount < 0).map((item) => ({ ...item, amount: Math.abs(item.amount) }))
  const income = filteredData.filter((item) => item.amount >= 0)

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)

  // Calculate net profit/loss
  const netAmount = totalIncome - totalExpenses
  const isProfit = netAmount >= 0

  // Sort data for charts
  const sortedExpensesByAmount = [...expenses].sort((a, b) => b.amount - a.amount)
  const sortedIncomeByAmount = [...income].sort((a, b) => b.amount - a.amount)
  const sortedByAmount = [...filteredData].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

  // Top categories for various views
  const topExpenses = sortedExpensesByAmount.slice(0, 8)
  const topIncome = sortedIncomeByAmount.slice(0, 8)
  const topCategories = sortedByAmount.slice(0, 10)

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(t => t !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const selectAllCategories = () => {
    const categories = Array.from(new Set(data.map(item => item.category)))
    setSelectedCategories(categories)
  }

  const deselectAllCategories = () => {
    setSelectedCategories([])
  }

  // Filter by type (income or expense)
  const selectOnlyIncome = () => {
    const incomeCategories = Array.from(new Set(income.map(item => item.category)))
    setSelectedCategories(incomeCategories)
  }

  const selectOnlyExpenses = () => {
    const expenseCategories = Array.from(new Set(expenses.map(item => item.category)))
    setSelectedCategories(expenseCategories)
  }

  // Chart rendering for expense breakdown
  useEffect(() => {
    if (!chartRef.current || activeTab !== "breakdown") return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

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
      'rgba(239, 68, 68, 0.7)',   // red
      'rgba(249, 115, 22, 0.7)',  // orange
      'rgba(245, 158, 11, 0.7)',  // amber
      'rgba(132, 204, 22, 0.7)',  // lime
      'rgba(16, 185, 129, 0.7)',  // emerald
      'rgba(20, 184, 166, 0.7)',  // teal
      'rgba(59, 130, 246, 0.7)',  // blue
      'rgba(139, 92, 246, 0.7)',  // purple
    ]
    
    const baseBorderColors = [
      'rgba(239, 68, 68, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(132, 204, 22, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(20, 184, 166, 1)',
      'rgba(59, 130, 246, 1)',
      'rgba(139, 92, 246, 1)',
    ]

    // Prepare chart data
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

    const labels = topExpenses.map(item => item.category)
    const values = viewMode === "amount" 
      ? topExpenses.map(item => item.amount)
      : topExpenses.map(item => (item.amount / totalExpenses) * 100)
    
    const backgroundColors = generateColors(labels.length, baseBackgroundColors)
    const borderColors = generateColors(labels.length, baseBorderColors)
    
    chartData = {
      labels,
      datasets: [{
        label: viewMode === "amount" ? "Expense Amount" : "Expense Percentage",
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
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
            display: chartType === "pie",
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
                
                if (viewMode === "amount") {
                  return `${label}: ${formatCurrency(value)}`;
                } else {
                  return `${label}: ${value.toFixed(1)}%`;
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
                if (viewMode === "amount") {
                  return formatCurrency(value as number);
                } else {
                  return `${value}%`;
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
  }, [filteredData, chartType, activeTab, viewMode, topExpenses, totalExpenses]);

  // Chart rendering for Income vs Expenses
  useEffect(() => {
    if (!chartRef.current || activeTab !== "comparison") return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Prepare chart data based on view mode
    let chartData: { 
      labels: string[], 
      datasets: { 
        label: string, 
        data: number[], 
        backgroundColor: string, 
        borderColor: string,
        borderWidth: number 
      }[] 
    }

    if (chartType === "pie") {
      // For pie chart, show income vs expense distribution
      chartData = {
        labels: ["Income", "Expenses"],
        datasets: [{
          label: "Amount",
          data: [totalIncome, totalExpenses],
          backgroundColor: [
            'rgba(34, 197, 94, 0.7)', // green for income
            'rgba(239, 68, 68, 0.7)', // red for expenses
          ],
          borderColor: 'rgba(34, 197, 94, 1)', // Use a single color for border
          borderWidth: 1
        }]
      }
    } else {
      // For bar/line chart, compare top income vs expense categories
      const incomeLabels = topIncome.slice(0, 5).map(item => item.category)
      const expenseLabels = topExpenses.slice(0, 5).map(item => item.category)
      
      // Use a set to remove duplicates, then convert back to array
      const allLabels = Array.from(new Set([...incomeLabels, ...expenseLabels]))
      
      const incomeValues = allLabels.map(category => {
        const item = income.find(i => i.category === category)
        return item ? item.amount : 0
      })
      
      const expenseValues = allLabels.map(category => {
        const item = expenses.find(i => i.category === category)
        return item ? -item.amount : 0 // Negative for visual clarity
      })
      
      chartData = {
        labels: allLabels,
        datasets: [
          {
            label: "Income",
            data: incomeValues,
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1
          },
          {
            label: "Expenses",
            data: expenseValues,
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          }
        ]
      }
    }

    // Create chart
    chartInstance.current = new Chart(ctx, {
      type: chartType === "line" ? "line" : (chartType === "pie" ? "pie" : "bar"),
      data: chartData,
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
                const value = Math.abs(context.raw as number);
                return `${label}: ${formatCurrency(value)}`;
              }
            }
          }
        },
        scales: chartType !== "pie" ? {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return formatCurrency(Math.abs(value as number));
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
  }, [filteredData, chartType, activeTab, topIncome, topExpenses, totalIncome, totalExpenses, expenses, income]);

  // Chart rendering for top categories
  useEffect(() => {
    if (!chartRef.current || activeTab !== "categories") return

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    const labels = topCategories.map(item => item.category)
    const values = topCategories.map(item => item.amount)
    
    // Generate dynamic colors based on whether it's income or expense
    const backgroundColors = topCategories.map(item => 
      item.amount >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
    )
    
    const borderColors = topCategories.map(item => 
      item.amount >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
    )
    
    const chartData = {
      labels,
      datasets: [{
        label: "Amount",
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
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
            display: chartType === "pie"
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || "";
                const value = context.raw as number;
                const formattedValue = formatCurrency(Math.abs(value));
                return `${label}: ${value >= 0 ? '+' : '-'}${formattedValue}`;
              }
            }
          }
        },
        scales: chartType !== "pie" ? {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return formatCurrency(Math.abs(value as number));
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
  }, [filteredData, chartType, activeTab, topCategories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">Financial Summary Visualization</h2>
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

          {activeTab === "breakdown" && (
            <Select value={viewMode} onValueChange={(value: "amount" | "percentage") => setViewMode(value)}>
              <SelectTrigger className="w-32 md:w-40 bg-emerald-600 text-white hover:bg-emerald-700">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent className="w-32 md:w-40 bg-white">
                <SelectItem value="amount">By Amount</SelectItem>
                <SelectItem value="percentage">By Percentage</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={timePeriod} onValueChange={(value: "monthly" | "quarterly" | "annual") => setTimePeriod(value)}>
            <SelectTrigger className="w-32 md:w-40 bg-purple-600 text-white hover:bg-purple-700">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent className="w-32 md:w-40 bg-white">
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-gray-500 mt-1">{income.length} income categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-gray-500 mt-1">{expenses.length} expense categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net {isProfit ? "Profit" : "Loss"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(Math.abs(netAmount))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isProfit ? "Profit margin" : "Loss ratio"}:{" "}
              {totalIncome > 0 ? ((Math.abs(netAmount) / totalIncome) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span>Filter Categories</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllCategories} className="text-xs py-1 h-8 bg-blue-200">
                  All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllCategories} className="text-xs py-1 h-8 bg-red-200">
                  None
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Button size="sm" variant="outline" onClick={selectOnlyIncome} className="text-xs py-1 h-8 bg-green-200">
                Income Only
              </Button>
              <Button size="sm" variant="outline" onClick={selectOnlyExpenses} className="text-xs py-1 h-8 bg-red-200">
                Expenses Only
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {Array.from(new Set(data.map(item => item.category))).map(category => {
                // Find if this is an income or expense category
                const isIncome = income.some(item => item.category === category);
                
                return (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category}`} 
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <Label htmlFor={`category-${category}`} className="cursor-pointer flex items-center">
                      <span className={`w-2 h-2 rounded-full ${isIncome ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                      {category}
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-4">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="breakdown" className="flex gap-1 items-center">
                <PieChart className="h-4 w-4" />
                <span>Expense Breakdown</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex gap-1 items-center">
                <TrendingUp className="h-4 w-4" />
                <span>Income vs Expenses</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex gap-1 items-center">
                <Filter className="h-4 w-4" />
                <span>Top Categories</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Expense Breakdown
                    {viewMode === "percentage" && " (% of Total Expenses)"}
                  </CardTitle>
                  <CardDescription>
                    Analysis of top expense categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {expenses.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No expense data available or selected</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses Comparison</CardTitle>
                  <CardDescription>
                    {chartType === "pie" 
                      ? "Overall income versus expense distribution" 
                      : "Comparison of top income and expense categories"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {filteredData.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">Please select at least one category to display chart</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Financial Categories</CardTitle>
                  <CardDescription>Highest impact financial categories (income and expenses)</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {filteredData.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">Please select at least one category to display chart</p>
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
          <CardTitle className="text-xl font-bold">Financial Details</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <DollarSign className="mr-1 h-4 w-4" />
            <span>{filteredData.length} items</span>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-2 text-left">Category</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Amount</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">% of Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                    .map((item, index) => {
                      const isIncome = item.amount >= 0;
                      const percentage = isIncome 
                        ? totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0
                        : totalExpenses > 0 ? (Math.abs(item.amount) / totalExpenses) * 100 : 0;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{item.category}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              isIncome ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {isIncome ? "Income" : "Expense"}
                            </span>
                          </td>
                          <td className={`border border-gray-200 px-4 py-2 text-right ${
                            isIncome ? "text-green-600 font-medium" : "text-red-600 font-medium"
                          }`}>
                            {isIncome ? "+" : "-"}{formatCurrency(Math.abs(item.amount))}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            {percentage.toFixed(1)}%
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {item.description || "N/A"}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-bold">Total</td>
                    <td className="border border-gray-200 px-4 py-2"></td>
                    <td className="border border-gray-200 px-4 py-2 text-right">
                      <div className="flex flex-col">
                        <span className="text-green-600 font-bold">+{formatCurrency(totalIncome)}</span>
                        <span className="text-red-600 font-bold">-{formatCurrency(totalExpenses)}</span>
                        <div className="border-t border-gray-300 mt-1 pt-1">
                          <span className={`font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                            {isProfit ? "+" : "-"}{formatCurrency(Math.abs(netAmount))}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2"></td>
                    <td className="border border-gray-200 px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}