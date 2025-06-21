"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import * as XLSX from "xlsx"
import Papa from "papaparse"

interface DataRow {
  [key: string]: string | number
}

interface SheetData {
  name: string
  data: DataRow[]
  headers: string[]
}

interface SortConfig {
  column: string
  direction: "asc" | "desc"
}

export function useExcelData() {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0)
  const [error, setError] = useState<string>("")
  const [selectedColumn, setSelectedColumn] = useState<string>("")
  const [compareColumn, setCompareColumn] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [valueFilter, setValueFilter] = useState<"none" | "highest" | "lowest">("none")
  const [isLoading, setIsLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string } | null>(null)
  const [groupBy, setGroupBy] = useState<string>("")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError("")
    setIsLoading(true)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: "binary" })
          const newSheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json<DataRow>(worksheet)
            return {
              name: sheetName,
              data: jsonData,
              headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
            }
          }).filter((sheet) => sheet.data.length > 0)

          if (newSheets.length > 0) {
            setSheets(newSheets)
            setCurrentSheetIndex(0)
            setSelectedColumn(newSheets[0].headers[0])
            setCompareColumn("")
            setCurrentPage(1)
            setValueFilter("none")
            setSearchQuery("")
            setSortConfig(null)
            setGroupBy("")
            setDateFilter(null)

            // Show success notification
            showNotification("File loaded successfully!", "success")
          } else {
            setError("No valid data found in the Excel file")
          }
        } catch {
          setError("Error reading the Excel file. Please make sure it is a valid Excel file.")
        } finally {
          setIsLoading(false)
        }
      }
      reader.onerror = () => {
        setError("Error reading the file")
        setIsLoading(false)
      }
      reader.readAsBinaryString(file)
    }
  }

  const handleEdit = (rowIndex: number, column: string, value: string | number) => {
    setSheets((prevSheets) => {
      const newSheets = [...prevSheets]
      const currentSheet = { ...newSheets[currentSheetIndex] }
      const newData = [...currentSheet.data]
      newData[rowIndex] = { ...newData[rowIndex], [column]: value }
      currentSheet.data = newData
      newSheets[currentSheetIndex] = currentSheet
      return newSheets
    })
  }

  const handleExport = (format: "xlsx" | "csv" | "json") => {
    if (sheets.length === 0) {
      setError("No data available to export.")
      return
    }

    try {
      const currentData = sheets[currentSheetIndex].data
      const fileName = `exported_data_${Date.now()}`

      let csv
      let wb: XLSX.WorkBook

      switch (format) {
        case "xlsx":
          wb = XLSX.utils.book_new()
          sheets.forEach((sheet) => {
            const ws = XLSX.utils.json_to_sheet(sheet.data)
            XLSX.utils.book_append_sheet(wb, ws, sheet.name)
          })
          XLSX.writeFile(wb, `${fileName}.xlsx`)
          break

        case "csv": {
          // We should be consistent with what we're exporting
          // Either export just the current sheet for all formats
          // Or export all sheets for all formats
          // This change exports just the current sheet name in the filename
          const sheetName = sheets[currentSheetIndex].name
          csv = Papa.unparse(currentData)
          const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
          const csvUrl = URL.createObjectURL(csvBlob)
          const csvLink = document.createElement("a")
          csvLink.href = csvUrl
          csvLink.setAttribute("download", `${fileName}_${sheetName}.csv`)
          document.body.appendChild(csvLink)
          csvLink.click()
          document.body.removeChild(csvLink)
          break
        }

        case "json": {
          // Add sheet name to the JSON export as well for consistency
          const sheetName = sheets[currentSheetIndex].name
          const jsonBlob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" })
          const jsonUrl = URL.createObjectURL(jsonBlob)
          const jsonLink = document.createElement("a")
          jsonLink.href = jsonUrl
          jsonLink.setAttribute("download", `${fileName}_${sheetName}.json`)
          document.body.appendChild(jsonLink)
          jsonLink.click()
          document.body.removeChild(jsonLink)
          break
        }
      }

      showNotification(`Data exported as ${format.toUpperCase()} successfully!`, "success")
    } catch {
      setError("Error exporting data. Please try again.")
    }
  }

  const handleReset = () => {
    setSheets([])
    setCurrentSheetIndex(0)
    setSelectedColumn("")
    setCompareColumn("")
    setSearchQuery("")
    setCurrentPage(1)
    setValueFilter("none")
    setError("")
    setSortConfig(null)
    setGroupBy("")
    setDateFilter(null)
  }

  const handleSort = useCallback((column: string) => {
    setSortConfig((prev) => ({
      column,
      direction: prev?.column === column && prev?.direction === "asc" ? "desc" : "asc",
    }))
  }, [])

  const handleCreateNewSheet = () => {
    if (sheets.length === 0) {
      setError("Please upload a file first to create additional sheets.")
      return
    }

    const newSheetName = `Sheet ${sheets.length + 1}`
    const newSheet: SheetData = {
      name: newSheetName,
      data: [],
      headers: sheets[currentSheetIndex].headers,
    }

    setSheets((prev) => [...prev, newSheet])
    setCurrentSheetIndex(sheets.length)
    showNotification("New sheet created!", "success")
  }

  const handleSaveState = () => {
    try {
      const appState = {
        sheets,
        currentSheetIndex,
        selectedColumn,
        compareColumn,
        sortConfig,
      }

      localStorage.setItem("excelViewerState", JSON.stringify(appState))
      setLastSaved(new Date())
      showNotification("Current state saved successfully!", "success")
    } catch {
      setError("Error saving state. Please try again.")
    }
  }

  const handleLoadState = () => {
    try {
      const savedState = localStorage.getItem("excelViewerState")
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setSheets(parsedState.sheets)
        setCurrentSheetIndex(parsedState.currentSheetIndex)
        setSelectedColumn(parsedState.selectedColumn)
        setCompareColumn(parsedState.compareColumn)
        setSortConfig(parsedState.sortConfig)
        showNotification("Saved state loaded successfully!", "success")
      } else {
        setError("No saved state found.")
      }
    } catch {
      setError("Error loading saved state. Please try again.")
    }
  }

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    const notification = document.createElement("div")
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-500 transform translate-y-0 opacity-100 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
          ? "bg-red-500 text-white"
          : "bg-blue-500 text-white"
    }`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("opacity-0", "translate-y-10")
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 500)
    }, 3000)
  }

  // Apply date filtering if needed
  const applyDateFilter = useCallback(
    (data: DataRow[]) => {
      if (!dateFilter || !dateFilter.start || !dateFilter.end) return data

      const currentSheet = sheets[currentSheetIndex] || { headers: [] }
      // Try to find a date column
      const dateColumns = currentSheet.headers.filter(
        (header) => header.toLowerCase().includes("date") || header.toLowerCase().includes("time"),
      )

      if (dateColumns.length === 0) return data

      const dateColumn = dateColumns[0]
      const startDate = new Date(dateFilter.start)
      const endDate = new Date(dateFilter.end)

      return data.filter((row) => {
        try {
          const rowDate = new Date(row[dateColumn] as string)
          return rowDate >= startDate && rowDate <= endDate
        } catch {
          return true // If we can't parse the date, include the row
        }
      })
    },
    [dateFilter, currentSheetIndex, sheets],
  )

  // Apply grouping if needed
  const applyGrouping = useCallback(
    (data: DataRow[]) => {
      if (!groupBy) return data

      const groupedData: Record<string, DataRow[]> = {}

      data.forEach((row) => {
        const groupValue = String(row[groupBy] || "Unknown")
        if (!groupedData[groupValue]) {
          groupedData[groupValue] = []
        }
        groupedData[groupValue].push(row)
      })

      const currentSheet = sheets[currentSheetIndex] || { headers: [] }

      // Convert grouped data back to array format
      return Object.entries(groupedData).map(([groupValue, rows]) => {
        const aggregatedRow: DataRow = { [groupBy]: groupValue }

        // Calculate aggregates for numeric columns
        currentSheet.headers.forEach((header) => {
          if (header === groupBy) return

          const values = rows.map((r) => Number(r[header])).filter((v) => !isNaN(v))
          if (values.length > 0) {
            aggregatedRow[`${header} (Sum)`] = values.reduce((a, b) => a + b, 0)
            aggregatedRow[`${header} (Avg)`] = values.reduce((a, b) => a + b, 0) / values.length
            aggregatedRow[`${header} (Count)`] = values.length
          }
        })

        return aggregatedRow
      })
    },
    [groupBy, currentSheetIndex, sheets],
  )

  const filteredAndSortedData = useMemo(() => {
    const currentSheet = sheets[currentSheetIndex] || { data: [], headers: [] }
    let result = currentSheet.data.filter((row) => {
      const matchesSearch = currentSheet.headers.some((header) =>
        row[header]?.toString().toLowerCase().includes(searchQuery.toLowerCase()),
      )

      if (!matchesSearch) return false

      if (valueFilter === "none") return true

      const value = Number(row[selectedColumn])
      if (isNaN(value)) return false

      const values = currentSheet.data.map((r) => Number(r[selectedColumn])).filter((v) => !isNaN(v))

      const max = Math.max(...values)
      const min = Math.min(...values)

      return valueFilter === "highest" ? value === max : value === min
    })

    // Apply date filtering
    result = applyDateFilter(result)

    // Apply grouping
    if (groupBy) {
      result = applyGrouping(result)
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.column]
        const bVal = b[sortConfig.column]

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal
        }

        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        return sortConfig.direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      })
    }

    return result
  }, [
    sheets,
    currentSheetIndex,
    searchQuery,
    valueFilter,
    selectedColumn,
    sortConfig,
    applyDateFilter,
    applyGrouping,
    groupBy,
  ])

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const currentData = filteredAndSortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  // Get the headers for the current view (may be different if grouping is applied)
  const currentHeaders = currentData.length > 0 ? Object.keys(currentData[0]) : sheets[currentSheetIndex]?.headers || []
  const currentSheet = sheets[currentSheetIndex] || { data: [], headers: [], name: "" }

  return {
    sheets,
    currentSheetIndex,
    setCurrentSheetIndex,
    error,
    setError,
    selectedColumn,
    setSelectedColumn,
    compareColumn,
    setCompareColumn,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    valueFilter,
    setValueFilter,
    isLoading,
    sortConfig,
    setSortConfig,
    dateFilter,
    setDateFilter,
    groupBy,
    setGroupBy,
    handleFileUpload,
    handleEdit,
    handleExport,
    handleReset,
    handleSort,
    handleCreateNewSheet,
    handleSaveState,
    handleLoadState,
    filteredAndSortedData,
    currentData,
    currentHeaders,
    currentSheet,
    totalPages,
    lastSaved,
    setLastSaved,
    showNotification,
    rowsPerPage,
    setRowsPerPage,
  }
}