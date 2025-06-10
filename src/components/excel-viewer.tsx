"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  FileSpreadsheet,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Table2,
  Filter,
  TrendingUp,
  TrendingDown,
  CalculatorIcon,
  RefreshCw,
  Trash2,
  FileJson,
  FileSpreadsheetIcon as FileCsv,
  Moon,
  Sun,
  PlusCircle,
  HelpCircle,
  Settings,
} from "lucide-react"
import { DataStats } from "./data-stats"
import { DataChart } from "./data-chart"
import { Calculator } from "./calculator"
import { Tooltip } from "./tooltip"
import { DataTable } from "./data-table"
import { FileUploader } from "./file-uploader"
import { SettingsPanel } from "./settings-panel"
import { DataGrouping } from "./data-grouping"
import { HelpPanel } from "./help-panel"
import { DateRangeFilter } from "./data-range-filter"
import { useExcelData } from "../hooks/use-excel-data"
import { useUserPreferences } from "../hooks/use-user-preferences"

export default function ExcelViewer() {
  const {
    sheets,
    currentSheetIndex,
    setCurrentSheetIndex,
    error,
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
    currentData,
    currentHeaders,
    currentSheet,
    totalPages,
    lastSaved,
  } = useExcelData()

  const { darkMode, setDarkMode, rowsPerPage, setRowsPerPage, chartType, setChartType } = useUserPreferences()

  const [showCalculator, setShowCalculator] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showTooltip, setShowTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  })

  const handleShowTooltip = (content: string, event: React.MouseEvent) => {
    setShowTooltip({
      visible: true,
      content,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const handleHideTooltip = () => {
    setShowTooltip((prev) => ({ ...prev, visible: false }))
  }

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }, [darkMode])

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-50 to-indigo-50"} p-4 md:p-8`}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} rounded-xl shadow-xl p-4 md:p-8 border transition-colors duration-300`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div
                className={`${darkMode ? "bg-indigo-900" : "bg-indigo-100"} p-2 rounded-lg transition-colors duration-300`}
              >
                <Table2 className={`w-8 h-8 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 text-transparent bg-clip-text">
                Excel Data Viewer
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`flex items-center px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                  darkMode
                    ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
                onMouseEnter={(e) => handleShowTooltip("Toggle dark mode", e)}
                onMouseLeave={handleHideTooltip}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onMouseEnter={(e) => handleShowTooltip("Settings", e)}
                onMouseLeave={handleHideTooltip}
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`flex items-center px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onMouseEnter={(e) => handleShowTooltip("Help", e)}
                onMouseLeave={handleHideTooltip}
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowCalculator(true)}
                className={`flex items-center px-4 py-2 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                  darkMode ? "bg-purple-700 hover:bg-purple-600" : "bg-purple-600 hover:bg-purple-700"
                }`}
                onMouseEnter={(e) => handleShowTooltip("Open calculator", e)}
                onMouseLeave={handleHideTooltip}
              >
                <CalculatorIcon className="w-4 h-4 mr-2" />
                Calculator
              </button>

              <FileUploader
                isLoading={isLoading}
                handleFileUpload={handleFileUpload}
                darkMode={darkMode}
                handleShowTooltip={handleShowTooltip}
                handleHideTooltip={handleHideTooltip}
              />

              {sheets.length > 0 && (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport("xlsx")}
                      className={`flex items-center px-4 py-2 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                        darkMode ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"
                      }`}
                      onMouseEnter={(e) => handleShowTooltip("Export as Excel", e)}
                      onMouseLeave={handleHideTooltip}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      XLSX
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className={`flex items-center px-4 py-2 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                        darkMode ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"
                      }`}
                      onMouseEnter={(e) => handleShowTooltip("Export as CSV", e)}
                      onMouseLeave={handleHideTooltip}
                    >
                      <FileCsv className="w-4 h-4 mr-2" />
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className={`flex items-center px-4 py-2 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                        darkMode ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"
                      }`}
                      onMouseEnter={(e) => handleShowTooltip("Export as JSON", e)}
                      onMouseLeave={handleHideTooltip}
                    >
                      <FileJson className="w-4 h-4 mr-2" />
                      JSON
                    </button>
                  </div>
                  <button
                    onClick={handleReset}
                    className={`flex items-center px-4 py-2 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                      darkMode ? "bg-red-700 hover:bg-red-600" : "bg-red-600 hover:bg-red-700"
                    }`}
                    onMouseEnter={(e) => handleShowTooltip("Reset all data", e)}
                    onMouseLeave={handleHideTooltip}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <SettingsPanel
              darkMode={darkMode}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              chartType={chartType}
              setChartType={setChartType}
              handleSaveState={handleSaveState}
              handleLoadState={handleLoadState}
              lastSaved={lastSaved}
              setShowSettings={setShowSettings}
            />
          )}

          {/* Help Panel */}
          {showHelp && <HelpPanel darkMode={darkMode} setShowHelp={setShowHelp} />}

          {sheets.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {sheets.map((sheet, index) => (
                  <button
                    key={sheet.name}
                    onClick={() => setCurrentSheetIndex(index)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      index === currentSheetIndex
                        ? darkMode
                          ? "bg-indigo-700 text-white shadow-md transform -translate-y-0.5"
                          : "bg-indigo-600 text-white shadow-md transform -translate-y-0.5"
                        : darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200 hover:shadow transform hover:-translate-y-0.5"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow transform hover:-translate-y-0.5"
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
                <button
                  onClick={handleCreateNewSheet}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  } hover:shadow transform hover:-translate-y-0.5`}
                  onMouseEnter={(e) => handleShowTooltip("Create new sheet", e)}
                  onMouseLeave={handleHideTooltip}
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Search, Filter, and Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Search
                    </label>
                    <div className="relative">
                      <Search
                        className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"} pointer-events-none`}
                      />
                      <input
                        type="text"
                        placeholder="Type to search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 shadow-sm ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative min-w-[200px]">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Filter by Column
                    </label>
                    <div className="relative">
                      <Filter
                        className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"} pointer-events-none`}
                      />
                      <select
                        value={selectedColumn}
                        onChange={(e) => setSelectedColumn(e.target.value)}
                        className={`w-full pl-10 pr-8 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 shadow-sm ${
                          darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {currentSheet.headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                      <div
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? "text-gray-400" : "text-gray-400"}`}
                      >
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Compare Column Dropdown */}
                  <div className="relative min-w-[200px]">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Compare With (Optional)
                    </label>
                    <div className="relative">
                      <select
                        value={compareColumn}
                        onChange={(e) => setCompareColumn(e.target.value)}
                        className={`w-full pl-4 pr-8 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all duration-200 shadow-sm ${
                          darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="">No Comparison</option>
                        {currentSheet.headers
                          .filter((h) => h !== selectedColumn)
                          .map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                      </select>
                      <div
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? "text-gray-400" : "text-gray-400"}`}
                      >
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setValueFilter(valueFilter === "highest" ? "none" : "highest")}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                      valueFilter === "highest"
                        ? darkMode
                          ? "bg-green-700 text-white hover:bg-green-600 shadow-md"
                          : "bg-green-600 text-white hover:bg-green-700 shadow-md"
                        : darkMode
                          ? "bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-200 hover:shadow"
                          : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 hover:shadow"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Highest Values
                  </button>
                  <button
                    onClick={() => setValueFilter(valueFilter === "lowest" ? "none" : "lowest")}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                      valueFilter === "lowest"
                        ? darkMode
                          ? "bg-red-700 text-white hover:bg-red-600 shadow-md"
                          : "bg-red-600 text-white hover:bg-red-700 shadow-md"
                        : darkMode
                          ? "bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-200 hover:shadow"
                          : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 hover:shadow"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Lowest Values
                  </button>

                  <button
                    onClick={() => {
                      setValueFilter("none")
                      setSearchQuery("")
                      setDateFilter(null)
                      setGroupBy("")
                      setSortConfig(null)
                    }}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                      darkMode
                        ? "bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-200 hover:shadow"
                        : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 hover:shadow"
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </button>
                </div>
              </div>

              {sheets.length > 0 ? (
                <DataTable
                  currentData={currentData}
                  currentHeaders={currentHeaders}
                  darkMode={darkMode}
                  handleSort={handleSort}
                  sortConfig={sortConfig}
                  selectedColumn={selectedColumn}
                  handleEdit={handleEdit}
                  min={Math.min(
                    ...currentSheet.data.map((row) => Number(row[selectedColumn])).filter((val) => !isNaN(val)),
                  )}
                  max={Math.max(
                    ...currentSheet.data.map((row) => Number(row[selectedColumn])).filter((val) => !isNaN(val)),
                  )}
                />
              ) : null}

              {/* Date Range Filter */}
              <DateRangeFilter darkMode={darkMode} dateFilter={dateFilter} setDateFilter={setDateFilter} />

              {/* Data Grouping */}
              <DataGrouping darkMode={darkMode} groupBy={groupBy} setGroupBy={setGroupBy} currentSheet={currentSheet} />

              <DataStats
                data={currentSheet.data}
                selectedColumn={selectedColumn}
                headers={currentSheet.headers}
                darkMode={darkMode}
              />

              <DataChart
                data={currentSheet.data}
                selectedColumn={selectedColumn}
                compareColumn={compareColumn}
                chartType={chartType}
                onChartTypeChange={setChartType}
                darkMode={darkMode}
              />
            </div>
          )}

          {error && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-2 border animate-fadeIn ${
                darkMode ? "bg-red-900/30 text-red-300 border-red-800" : "bg-red-50 text-red-700 border-red-100"
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {sheets.length === 0 && (
            <div
              className={`text-center py-16 rounded-lg border-2 border-dashed ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
              }`}
            >
              <FileSpreadsheet className={`w-16 h-16 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                No Data Available
              </h3>
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                Upload an Excel file to view and edit its contents
              </p>
            </div>
          )}

          {sheets.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className={`flex items-center px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow ${
                  darkMode
                    ? "bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-200"
                    : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900"
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </button>
              <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className={`flex items-center px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow ${
                  darkMode
                    ? "bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-200"
                    : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900"
                }`}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {showCalculator && <Calculator onClose={() => setShowCalculator(false)} darkMode={darkMode} />}

          {showTooltip.visible && (
            <Tooltip content={showTooltip.content} x={showTooltip.x} y={showTooltip.y} darkMode={darkMode} />
          )}
        </div>
      </div>
    </div>
  )
}
