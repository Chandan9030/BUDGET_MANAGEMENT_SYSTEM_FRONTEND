"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp, Trash2, Save, Plus, AlertCircle, Download } from "lucide-react"
import { cn } from "../lib/utils"
import { formatCurrency } from "../lib/format-utils"
import { useBudget } from "../hooks/use-budget-data"
import { BudgetSection } from "../types/budget"
import * as XLSX from "xlsx"

// Types for better type safety
interface EditingCell {
  sectionIndex: number;
  itemIndex: number;
  columnId: string;
  originalValue: string | number;
}

interface ColumnConfig {
  id: string;
  label: string;
  type: 'text' | 'number';
  align?: 'left' | 'right' | 'center';
}

export function BudgetTable() {
  // Get all data and methods from context
  const {
    budgetData: data,
    columns,
    currentMonth,
    updateCellValue,
    removeRow,
    removeSection,
    submitData,
    submitStatus = "idle",
    error,
  } = useBudget()

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [tempValue, setTempValue] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")
  const [flashingSave, setFlashingSave] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Column configuration for export
  const exportColumns: ColumnConfig[] = [
    { id: 'category', label: 'Expense Category', type: 'text', align: 'left' },
    { id: 'employee', label: 'Employee', type: 'text', align: 'left' },
    ...columns.map((col) => ({
      id: col.id,
      label: col.name,
      type: 'number' as const,
      align: 'right' as const,
    })),
    { id: 'monthlyCost', label: currentMonth, type: 'number', align: 'right' },
  ]

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Flash save button on successful save
  useEffect(() => {
    if (submitStatus === "success") {
      setFlashingSave(true)
      const timer = setTimeout(() => setFlashingSave(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [submitStatus])

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }, [])

  // Validation function for numbers
  const validateNumber = useCallback((value: string): boolean => {
    if (value === "") return true // Allow empty values
    const num = parseFloat(value)
    return !isNaN(num) && num >= 0
  }, [])

  // Excel download handler
  const handleDownloadExcel = useCallback(() => {
    const exportData: Record<string, string | number>[] = []
    let rowIndex = 1

    // Add data for each section
    data.forEach((section) => {
      // Add section header as a row
      exportData.push({
        'SL No.': `Section: ${section.name}`,
        'Expense Category': '',
        'Employee': '',
        ...columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {}),
        [currentMonth]: '',
      })

      // Add items for the section
      section.items.forEach((item) => {
        const row: Record<string, string | number> = {
          'SL No.': rowIndex++,
          'Expense Category': String(item.category || ''),
          'Employee': String(item.employee || ''),
        }
        columns.forEach((col) => {
          row[col.name] = Number(item[col.id]) || 0
        })
        row[currentMonth] = Number(item.monthlyCost) || 0
        exportData.push(row)
      })

      // Add section total
      const sectionTotal: Record<string, string | number> = {
        'SL No.': `Total for ${section.name}`,
        'Expense Category': '',
        'Employee': '',
      }
      columns.forEach((col) => {
        sectionTotal[col.name] = calculateSectionTotal(section, col.id)
      })
      sectionTotal[currentMonth] = calculateSectionTotal(section, 'monthlyCost')
      exportData.push(sectionTotal)
    })

    // Add overall total
    const overallTotal: Record<string, string | number> = {
      'SL No.': 'Overall Total',
      'Expense Category': '',
      'Employee': '',
    }
    columns.forEach((col) => {
      overallTotal[col.name] = calculateOverallTotal(col.id)
    })
    overallTotal[currentMonth] = calculateOverallTotal('monthlyCost')
    exportData.push(overallTotal)

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    const colWidths = [
      { wch: 10 }, // SL No.
      { wch: 20 }, // Expense Category
      { wch: 15 }, // Employee
      ...columns.map(() => ({ wch: 15 })), // Other columns
      { wch: 15 }, // Current Month
    ]
    worksheet['!cols'] = colWidths

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget')

    // Download file
    XLSX.writeFile(workbook, 'budget.xlsx')
  }, [data, columns, currentMonth])

  const stopEditing = useCallback(() => {
    setEditingCell(null)
    setTempValue("")
    setValidationError("")
  }, [])

  const handleBlur = useCallback(async () => {
    if (!editingCell) return

    const { sectionIndex, itemIndex, columnId, originalValue } = editingCell
    let finalValue: string | number = tempValue

    // Process the value based on column type
    if (["monthlyCost", "quarterlyCost", "halfYearlyCost", "annualCost"].includes(columnId)) {
      if (tempValue === "" || tempValue === "0") {
        finalValue = 0
      } else if (!validateNumber(tempValue)) {
        setValidationError("Invalid number format")
        return
      } else {
        finalValue = Math.round(parseFloat(tempValue) * 100) / 100 // Round to 2 decimal places
      }
    } else {
      finalValue = tempValue.trim()
    }

    // Only update if value actually changed
    if (finalValue !== originalValue) {
      try {
        await updateCellValue(sectionIndex, itemIndex, columnId, finalValue)
      } catch (error) {
        console.error("Error updating cell value:", error)
        setValidationError("Failed to update cell value")
      }
    }

    stopEditing()
  }, [editingCell, tempValue, validateNumber, updateCellValue, stopEditing])

  const startEditing = useCallback(
    (sectionIndex: number, itemIndex: number, columnId: string) => {
      if (
        editingCell?.sectionIndex === sectionIndex &&
        editingCell?.itemIndex === itemIndex &&
        editingCell?.columnId === columnId
      ) {
        return // Prevent re-triggering if already editing this cell
      }

      if (editingCell) {
        handleBlur() // Save current edit before starting a new one
      }

      const item = data[sectionIndex]?.items[itemIndex]
      if (!item) return

      const rawValue = item[columnId]
      const currentValue =
        typeof rawValue === "string" || typeof rawValue === "number" ? rawValue : ""
      setEditingCell({ sectionIndex, itemIndex, columnId, originalValue: currentValue })
      setTempValue(String(currentValue))
      setValidationError("")
    },
    [editingCell, data, handleBlur]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setTempValue(value)

      // Real-time validation for numeric fields
      if (editingCell) {
        const isNumeric = ["monthlyCost", "quarterlyCost", "halfYearlyCost", "annualCost"].includes(
          editingCell.columnId
        )
        if (isNumeric && value && !validateNumber(value)) {
          setValidationError("Please enter a valid positive number")
        } else {
          setValidationError("")
        }
      }
    },
    [editingCell, validateNumber]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (!validationError) {
          handleBlur()
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        stopEditing()
      } else if (e.key === "Tab") {
        if (!validationError) {
          handleBlur()
        }
      }
    },
    [validationError, handleBlur, stopEditing]
  )

  // Calculate section totals for each column
  const calculateSectionTotal = useCallback(
    (section: BudgetSection, columnId: string) => {
      return section.items.reduce((total, item) => {
        return total + (Number(item[columnId]) || 0)
      }, 0)
    },
    []
  )

  // Calculate overall totals for each column
  const calculateOverallTotal = useCallback(
    (columnId: string) => {
      return data.reduce((sum: number, section: BudgetSection) => {
        return sum + calculateSectionTotal(section, columnId)
      }, 0)
    },
    [data, calculateSectionTotal]
  )

  const handleSubmit = useCallback(async () => {
    try {
      await submitData()
    } catch (error) {
      console.error("Error submitting budget:", error)
    }
  }, [submitData])

  const renderEditableCell = useCallback(
    (
      item: Record<string, unknown>,
      sectionIndex: number,
      itemIndex: number,
      columnId: string,
      isNumeric: boolean = false,
      textAlign: string = "left"
    ) => {
      const isEditing =
        editingCell?.sectionIndex === sectionIndex &&
        editingCell?.itemIndex === itemIndex &&
        editingCell?.columnId === columnId

      if (isEditing) {
        return (
          <div className="relative animate-slideIn">
            <input
              ref={inputRef}
              type={isNumeric ? "number" : "text"}
              min={isNumeric ? "0" : undefined}
              step={isNumeric ? "0.01" : undefined}
              value={tempValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full p-2 border-2 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-200 transform focus:scale-105 shadow-sm",
                textAlign === "right" && "text-right",
                textAlign === "center" && "text-center",
                validationError
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50"
                  : "border-indigo-300 bg-white"
              )}
            />
            {validationError && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-600 whitespace-nowrap z-10 shadow-lg animate-slideIn">
                <AlertCircle className="inline h-3 w-3 mr-1" />
                {validationError}
              </div>
            )}
          </div>
        )
      }

      const displayValue = isNumeric
        ? formatCurrency(Number(item[columnId]) || 0, false)
        : typeof item[columnId] === "string" || typeof item[columnId] === "number"
        ? item[columnId]
        : "Click to edit"

      return (
        <div
          className={cn(
            "min-h-[2rem] p-2 rounded-lg transition-all duration-200 transform hover:scale-105",
            "cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md",
            "hover:border-indigo-200 border border-transparent",
            textAlign === "right" && "text-right",
            textAlign === "center" && "text-center"
          )}
          onClick={() => startEditing(sectionIndex, itemIndex, columnId)}
          title="Click to edit"
        >
          <span className="transition-all duration-200">{displayValue}</span>
        </div>
      )
    },
    [editingCell, tempValue, validationError, handleInputChange, handleBlur, handleKeyDown, startEditing]
  )

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Action buttons and status section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-4 animate-slideDown">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitStatus === "loading"}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform",
              submitStatus === "loading"
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : flashingSave
                ? "bg-green-500 text-white shadow-lg animate-pulse"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            )}
          >
            <Save
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                submitStatus === "loading" && "animate-spin"
              )}
            />
            {submitStatus === "loading" ? "Saving..." : "Save to MongoDB"}
          </button>

          <button
            onClick={() => {
              /* Implement addSection if available */
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform"
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Add Section
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform"
          >
            <Download className="h-4 w-4 transition-transform duration-200" />
            Download Excel
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {submitStatus === "success" && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg border border-green-200 animate-slideIn transition-all duration-300">
              ✓ Budget saved successfully!
            </div>
          )}

          {submitStatus === "error" && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-lg border border-red-200 animate-slideIn transition-all duration-300">
              ✗ Failed to save budget. Please try again.
            </div>
          )}

          {error && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-lg border border-red-200 animate-slideIn transition-all duration-300">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Error: {error.message}
            </div>
          )}
        </div>
      </div>

      {/* Table container with improved scrolling */}
      <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-200 animate-slideUp transition-all duration-300 hover:shadow-3xl">
        <table className="w-full min-w-[800px] border-collapse bg-white">
          <thead className="sticky top-0 bg-gradient-to-r from-yellow-200 to-yellow-300 z-20 shadow-md">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16 transition-colors duration-200 hover:bg-yellow-400 sticky left-0 z-30 bg-gradient-to-r from-yellow-200 to-yellow-300">
                SR.NO
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-12 z-30 bg-gradient-to-r from-yellow-200 to-yellow-300 transition-colors duration-200 hover:bg-yellow-400">
                Expense Category
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Employee
              </th>
              {columns.map((column, index) => (
                <th
                  key={column.id}
                  className={cn(
                    "border border-gray-300 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider transition-all duration-200 hover:bg-yellow-400",
                    "text-right"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {column.name}
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                {currentMonth}
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 transition-colors duration-200 hover:bg-yellow-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((section, sectionIndex) => (
              <>
                {/* Section Header Row */}
                <tr
                  key={section.id}
                  className={cn(
                    "bg-gradient-to-r from-yellow-100 to-yellow-200",
                    "hover:from-yellow-200 hover:to-yellow-300",
                    "transition-all duration-300 ease-in-out"
                  )}
                >
                  <td className="border border-gray-300 px-4 py-4 sticky left-0 z-10 bg-gradient-to-r from-yellow-100 to-yellow-200"></td>
                  <td
                    className="border border-gray-300 px-4 py-4 font-semibold text-gray-900 sticky left-12 z-10 bg-gradient-to-r from-yellow-100 to-yellow-200"
                    colSpan={2}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className={cn(
                          "p-1 rounded-full transition-all duration-200",
                          "hover:bg-yellow-300/50 hover:scale-110",
                          "active:scale-95"
                        )}
                      >
                        {collapsedSections[section.id] ? (
                          <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                        ) : (
                          <ChevronUp className="h-5 w-5 transition-transform duration-200" />
                        )}
                      </button>
                      <span className="font-bold">{section.name}</span>
                    </div>
                  </td>
                  {columns.map((column, index) => (
                    <td
                      key={column.id}
                      className="border border-gray-300 px-4 py-4 text-right font-bold text-gray-900 transition-all duration-200 hover:bg-yellow-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="font-mono text-lg">
                        {formatCurrency(calculateSectionTotal(section, column.id), false)}
                      </span>
                    </td>
                  ))}
                  <td className="border border-gray-300 px-4 py-4 text-right font-bold text-gray-900 transition-all duration-200 hover:bg-yellow-200">
                    <span className="font-mono text-lg">
                      {formatCurrency(calculateSectionTotal(section, "monthlyCost"), false)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-4 text-center">
                    <button
                      onClick={() => removeSection(sectionIndex)}
                      className={cn(
                        "text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:shadow-md hover:scale-110 active:scale-95 transform"
                      )}
                      title="Remove section"
                      aria-label={`Remove section ${section.name}`}
                    >
                      <Trash2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                    </button>
                  </td>
                </tr>

                {/* Section Items with smooth collapse animation */}
                <tr
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    collapsedSections[section.id] && "max-h-0 opacity-0"
                  )}
                >
                  <td colSpan={100} className="p-0">
                    <div
                      className={cn(
                        "transition-all duration-300 ease-in-out",
                        collapsedSections[section.id]
                          ? "max-h-0 opacity-0 transform -translate-y-4"
                          : "max-h-[2000px] opacity-100 transform translate-y-0"
                      )}
                    >
                      <table className="w-full">
                        <tbody>
                          {section.items.map((item, itemIndex) => (
                            <tr
                              key={item.id}
                              className={cn(
                                "hover:bg-blue-50 transition-all duration-200 hover:shadow-md transform hover:scale-[1.002]",
                                itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                              )}
                              style={{ animationDelay: `${itemIndex * 100}ms` }}
                            >
                              <td className="border border-gray-300 px-4 py-3 sticky left-0 z-10 bg-inherit font-medium text-gray-600 text-center">
                                {itemIndex + 1}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 sticky left-12 z-10 bg-inherit">
                                {renderEditableCell(item, sectionIndex, itemIndex, "category", false, "left")}
                              </td>
                              <td className="border border-gray-300 px-4 py-3">
                                {renderEditableCell(item, sectionIndex, itemIndex, "employee", false, "left")}
                              </td>
                              {columns.map((column) => (
                                <td
                                  key={column.id}
                                  className="border border-gray-300 px-4 py-3 text-right"
                                >
                                  {renderEditableCell(item, sectionIndex, itemIndex, column.id, true, "right")}
                                </td>
                              ))}
                              <td className="border border-gray-300 px-4 py-3 text-right">
                                {renderEditableCell(item, sectionIndex, itemIndex, "monthlyCost", true, "right")}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <button
                                  onClick={() => removeRow(sectionIndex, itemIndex)}
                                  className={cn(
                                    "text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:shadow-md hover:scale-110 active:scale-95 transform"
                                  )}
                                  title="Remove row"
                                  aria-label={`Remove row ${itemIndex + 1}`}
                                >
                                  <Trash2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </>
            ))}

            {/* Empty state */}
            {data.length === 0 && (
              <tr className="animate-fadeIn">
                <td
                  colSpan={columns.length + 4}
                  className="border border-gray-300 px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3 animate-bounce">
                    <div className="text-gray-400 transition-transform duration-300 hover:scale-110">
                      <Plus className="h-12 w-12" />
                    </div>
                    <div className="animate-pulse">
                      <div className="font-medium">No budget data found</div>
                      <div className="text-sm">Click "Add Section" to add your first entry</div>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Overall Total Row */}
            <tr
              className={cn(
                "bg-gradient-to-r from-green-100 to-emerald-200 font-bold sticky bottom-0 animate-slideUp shadow-lg"
              )}
            >
              <td className="border border-gray-300 px-4 py-4 sticky left-0 z-10 bg-gradient-to-r from-green-100 to-emerald-200"></td>
              <td
                className="border border-gray-300 px-4 py-4 sticky left-12 z-10 bg-gradient-to-r from-green-100 to-emerald-200 text-lg font-semibold bg-clip-text text-transparent"
                colSpan={2}
              >
                Total
              </td>
              {columns.map((column, index) => (
                <td
                  key={column.id}
                  className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="font-mono text-lg">
                    {formatCurrency(calculateOverallTotal(column.id), false)}
                  </span>
                </td>
              ))}
              <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                <span className="font-mono text-lg">
                  {formatCurrency(calculateOverallTotal("monthlyCost"), false)}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  )
}