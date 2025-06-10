"use client"

import { useState, useEffect } from "react"

interface UserPreferences {
  darkMode: boolean
  rowsPerPage: number
  chartType: "line" | "bar" | "pie" | "scatter"
  lastExportFormat: "xlsx" | "csv" | "json"
}

export function useUserPreferences() {
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [chartType, setChartType] = useState<"line" | "bar" | "pie" | "scatter">("line")

  // Load user preferences from localStorage on initial load
  useEffect(() => {
    const savedPreferences = localStorage.getItem("excelViewerPreferences")
    if (savedPreferences) {
      try {
        const preferences: UserPreferences = JSON.parse(savedPreferences)
        setDarkMode(preferences.darkMode)
        setRowsPerPage(preferences.rowsPerPage)
        setChartType(preferences.chartType)
      } catch (e) {
        console.error("Error loading preferences:", e)
      }
    }
  }, [])

  // Save user preferences when they change
  useEffect(() => {
    const preferences: UserPreferences = {
      darkMode,
      rowsPerPage,
      chartType,
      lastExportFormat: "xlsx",
    }
    localStorage.setItem("excelViewerPreferences", JSON.stringify(preferences))
  }, [darkMode, rowsPerPage, chartType])

  return {
    darkMode,
    setDarkMode,
    rowsPerPage,
    setRowsPerPage,
    chartType,
    setChartType,
  }
}
