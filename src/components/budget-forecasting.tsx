"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { TrendingUp, AlertCircle } from "lucide-react"
import { formatCurrency } from "../lib/format-utils"
import type { BudgetSection } from "../types/budget"

interface BudgetForecastingProps {
  data: BudgetSection[]
}

export function BudgetForecasting({ data }: BudgetForecastingProps) {
  const [forecastMonths, setForecastMonths] = useState(3)
  const [growthRate, setGrowthRate] = useState(5) // Default 5% growth rate
  const [forecastType, setForecastType] = useState<"linear" | "percentage">("percentage")
  const [selectedSections, setSelectedSections] = useState<string[]>([])

  // Calculate current monthly total
  const currentMonthlyTotal = data.reduce(
    (total, section) => total + section.items.reduce((sum, item) => sum + (Number(item.monthlyCost) || 0), 0),
    0,
  )

  // Generate forecast data
  const generateForecast = () => {
    const forecasts = []
    let previousAmount = currentMonthlyTotal

    for (let i = 1; i <= forecastMonths; i++) {
      let forecastedAmount

      if (forecastType === "linear") {
        // Linear growth (fixed amount each month)
        forecastedAmount = currentMonthlyTotal + currentMonthlyTotal * (growthRate / 100) * i
      } else {
        // Percentage growth (compound)
        forecastedAmount = previousAmount * (1 + growthRate / 100)
        previousAmount = forecastedAmount
      }

      forecasts.push({
        month: i,
        amount: forecastedAmount,
      })
    }

    return forecasts
  }

  const forecasts = generateForecast()

  // Calculate section-specific forecasts if sections are selected
  const sectionForecasts = selectedSections
    .map((sectionName) => {
      const section = data.find((s) => s.name === sectionName)
      if (!section) return null

      const sectionTotal = section.items.reduce((sum, item) => sum + (Number(item.monthlyCost) || 0), 0)

      const forecasts = []
      let previousAmount = sectionTotal

      for (let i = 1; i <= forecastMonths; i++) {
        let forecastedAmount

        if (forecastType === "linear") {
          forecastedAmount = sectionTotal + sectionTotal * (growthRate / 100) * i
        } else {
          forecastedAmount = previousAmount * (1 + growthRate / 100)
          previousAmount = forecastedAmount
        }

        forecasts.push({
          month: i,
          amount: forecastedAmount,
        })
      }

      return {
        name: sectionName,
        currentTotal: sectionTotal,
        forecasts,
      }
    })
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Budget Forecasting
        </h2>
        <div className="flex flex-wrap gap-3">
          <div className="w-32">
            <Label htmlFor="forecast-months" className="text-xs">
              Months to Forecast
            </Label>
            <Input
              id="forecast-months"
              type="number"
              min="1"
              max="36"
              value={forecastMonths}
              onChange={(e) => setForecastMonths(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="growth-rate" className="text-xs">
              Growth Rate (%)
            </Label>
            <Input
              id="growth-rate"
              type="number"
              min="-20"
              max="50"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div className="w-40">
            <Label htmlFor="forecast-type" className="text-xs">
              Forecast Type
            </Label>
            <Select value={forecastType} onValueChange={(value: "linear" | "percentage") => setForecastType(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Forecast Type" />
              </SelectTrigger>
              <SelectContent className="w-40 bg-white">
                <SelectItem value="percentage">Compound %</SelectItem>
                <SelectItem value="linear">Linear Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Current Monthly Total</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMonthlyTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quarterly Projection</p>
                <p className="text-xl font-semibold">{formatCurrency(currentMonthlyTotal * 3)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Annual Projection</p>
                <p className="text-xl font-semibold">{formatCurrency(currentMonthlyTotal * 12)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecast Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-select">Forecast Specific Sections (Optional)</Label>
                <select
                  id="section-select"
                  multiple
                  className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedSections}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions, (option) => option.value)
                    setSelectedSections(options)
                  }}
                >
                  {data.map((section) => (
                    <option key={section.id} value={section.name}>
                      {section.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple sections</p>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-blue-700">
                  {forecastType === "percentage"
                    ? "Compound growth applies the rate to each month's new total"
                    : "Linear growth applies the rate to the original amount"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Budget Forecast ({forecastType === "percentage" ? "Compound" : "Linear"} Growth at {growthRate}%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-4 py-2 text-left">Month</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Forecasted Amount</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Change from Current</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">% Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-semibold">Current</td>
                  <td className="border border-gray-200 px-4 py-2 text-right font-semibold">
                    {formatCurrency(currentMonthlyTotal)}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">-</td>
                  <td className="border border-gray-200 px-4 py-2 text-right">-</td>
                </tr>
                {forecasts.map((forecast) => {
                  const change = forecast.amount - currentMonthlyTotal
                  const percentChange = (change / currentMonthlyTotal) * 100

                  return (
                    <tr key={forecast.month} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">Month {forecast.month}</td>
                      <td className="border border-gray-200 px-4 py-2 text-right">{formatCurrency(forecast.amount)}</td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                          {change >= 0 ? "+" : ""}
                          {formatCurrency(change)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        <span className={percentChange >= 0 ? "text-green-600" : "text-red-600"}>
                          {percentChange >= 0 ? "+" : ""}
                          {percentChange.toFixed(2)}%
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

      {selectedSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section-Specific Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sectionForecasts.map((sectionForecast, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-lg">{sectionForecast?.name}</h3>
                  <p className="text-sm text-gray-500">
                    Current Monthly: {formatCurrency(sectionForecast?.currentTotal || 0)}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-200 px-4 py-2 text-left">Month</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Forecasted Amount</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">% Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionForecast?.forecasts.map((forecast) => {
                          const percentChange =
                            ((forecast.amount - (sectionForecast?.currentTotal || 0)) /
                              (sectionForecast?.currentTotal || 1)) *
                            100

                          return (
                            <tr key={forecast.month} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-4 py-2">Month {forecast.month}</td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {formatCurrency(forecast.amount)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                <span className={percentChange >= 0 ? "text-green-600" : "text-red-600"}>
                                  {percentChange >= 0 ? "+" : ""}
                                  {percentChange.toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
