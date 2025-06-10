"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Save, Trash2, Plus, AlertCircle } from "lucide-react"
import { cn } from "../lib/utils"
import type { FinancialSummaryItem } from "../types"
import { formatCurrency } from "../lib/format-utils"

// Interface for editing cell state
interface EditingCell {
  itemIndex: number;
  columnId: string;
  originalValue: string | number;
}

interface FinancialSummaryTableProps {
  data: FinancialSummaryItem[]
  updateCellValue: (itemIndex: number, columnId: string, value: string | number) => void
  removeRow: (itemIndex: number) => void
  submitData?: () => void
  submitStatus?: "idle" | "loading" | "success" | "error"
}

export function FinancialSummaryTable({ 
  data, 
  updateCellValue, 
  removeRow,
  submitData,
  submitStatus = "idle"
}: FinancialSummaryTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [tempValue, setTempValue] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flashingSave, setFlashingSave] = useState(false)
  const [removingRows, setRemovingRows] = useState<Set<number>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Validation function for numbers
  const validateNumber = (value: string): boolean => {
    if (value === "") return true // Allow empty values
    const num = parseFloat(value)
    return !isNaN(num)
  }

  const startEditing = (itemIndex: number, columnId: string) => {
    if (
      editingCell?.itemIndex === itemIndex &&
      editingCell?.columnId === columnId
    ) {
      return // Prevent re-triggering if already editing this cell
    }

    if (editingCell) {
      handleBlur() // Save current edit before starting a new one
    }

    const item = data[itemIndex]
    if (!item) return

    const currentValue = item[columnId as keyof FinancialSummaryItem] || ""
    setEditingCell({ itemIndex, columnId, originalValue: currentValue })
    setTempValue(String(currentValue))
    setValidationError("")
  }

  const stopEditing = () => {
    setEditingCell(null)
    setTempValue("")
    setValidationError("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTempValue(value)

    // Real-time validation for numeric fields
    if (editingCell?.columnId === "amount") {
      if (value && !validateNumber(value)) {
        setValidationError("Please enter a valid number")
      } else {
        setValidationError("")
      }
    }
  }

  const handleBlur = async () => {
    if (!editingCell) return

    const { itemIndex, columnId, originalValue } = editingCell
    let finalValue: string | number = tempValue

    // Process the value based on column type
    if (columnId === "amount") {
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
        updateCellValue(itemIndex, columnId, finalValue)
      } catch (error) {
        console.error("Error updating cell value:", error)
        setValidationError("Failed to update cell value")
      }
    }

    stopEditing()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (submitData) {
        await submitData()
      } else {
        console.log("Default submit function called - saving data to MongoDB")
      }
    } catch (error) {
      console.error("Error submitting data:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveRow = async (itemIndex: number) => {
    setRemovingRows(prev => new Set(prev).add(itemIndex))
    try {
      await new Promise(resolve => setTimeout(resolve, 200)) // Delay for animation
      removeRow(itemIndex)
    } catch (err) {
      console.error("Error removing row:", err)
    } finally {
      setRemovingRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemIndex)
        return newSet
      })
    }
  }

  const getCategoryRowStyle = (category: string) => {
    if (category === "Total Profit 2025") {
      return "bg-red-200 border-red-300"
    } else if (category === "April25 Profit") {
      return "bg-green-200 border-green-300"
    } else if (category === "Total Expenses Annual" || category === "Total Expenses Month") {
      return "bg-blue-200 border-blue-300"
    }
    return ""
  }

  const renderEditableCell = (
    item: FinancialSummaryItem,
    itemIndex: number,
    columnId: string,
    isNumeric: boolean = false,
    textAlign: string = "left"
  ) => {
    const isEditing = editingCell?.itemIndex === itemIndex && editingCell?.columnId === columnId
    const isReadonly = ["Total Expenses Annual", "Total Expenses Month"].includes(item.category) && columnId === "amount"

    if (isEditing && !isReadonly) {
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
              "w-full p-2 border-2 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-blue-600",
              "transition-all duration-200 transform focus:scale-105 shadow-sm",
              textAlign === "right" && "text-right",
              validationError ? "border-red-500 focus:ring-red-500 bg-red-50" : "border-blue-600 bg-white"
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
      ? formatCurrency(Number(item[columnId as keyof FinancialSummaryItem]) || 0, false)
      : (item[columnId as keyof FinancialSummaryItem]?.toString() || "Click to edit")

    return (
      <div
        className={cn(
          "min-h-[2rem] p-2 rounded-lg transition-all duration-200 flex items-center",
          !isReadonly && [
            "cursor-pointer",
            "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50",
            "hover:shadow-md hover:scale-105",
            "border border-transparent hover:border-blue-400"
          ],
          isReadonly && "bg-gray-200/50 text-gray-600",
          textAlign === "right" && "justify-end text-right"
        )}
        onClick={() => !isReadonly && startEditing(itemIndex, columnId)}
        title={isReadonly ? "Read-only (Auto-updated from Table 1)" : "Click to edit"}
      >
        <span className="transition-all duration-200">{displayValue}</span>
        {isReadonly && (
          <span className="ml-2 text-xs text-blue-600 italic">(Auto-updated)</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Action Buttons and Status Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-4 animate-slideDown">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || submitStatus === "loading"}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform",
              isSubmitting || submitStatus === "loading"
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : flashingSave
                ? "bg-green-500 text-white shadow-lg animate-pulse"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            )}
          >
            <Save className={cn(
              "h-4 w-4 transition-transform duration-300",
              (isSubmitting || submitStatus === "loading") && "animate-spin"
            )} />
            {isSubmitting || submitStatus === "loading" ? "Saving to MongoDB..." : "Save to MongoDB"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {submitStatus === "success" && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg border border-green-200 animate-slideIn transition-all duration-300">
              ✓ Data saved successfully!
            </div>
          )}

          {submitStatus === "error" && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-lg border border-red-200 animate-slideIn transition-all duration-300">
              ✗ Failed to save data. Please try again.
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-200 animate-slideUp transition-all duration-300 hover:shadow-3xl">
        <table className="w-full min-w-[500px] border-collapse bg-white">
          <thead className="sticky top-0 bg-gradient-to-r from-yellow-200 to-yellow-300 z-20 shadow-md">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 z-30 bg-gradient-to-r from-yellow-200 to-yellow-300 transition-colors duration-200 hover:bg-yellow-400">
                Category
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Amount (INR)
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 transition-colors duration-200 hover:bg-yellow-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Data rows */}
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  "hover:bg-blue-50 hover:shadow-md transform hover:scale-[1.002]",
                  removingRows.has(index) && [
                    "opacity-0 scale-95 -translate-x-4",
                    "bg-red-50 border-red-200",
                  ],
                  !removingRows.has(index) && [
                    getCategoryRowStyle(item.category),
                    !getCategoryRowStyle(item.category) && (index % 2 === 0 ? "bg-white" : "bg-gray-50"),
                  ]
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="border border-gray-300 px-4 py-3 sticky left-0 z-10 bg-inherit">
                  {renderEditableCell(item, index, "category", false, "left")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, index, "amount", true, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">
                  <button
                    onClick={() => handleRemoveRow(index)}
                    disabled={removingRows.has(index)}
                    className={cn(
                      "text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-red-500 hover:shadow-md hover:scale-110 active:scale-95 transform",
                      removingRows.has(index) && "text-gray-400 cursor-not-allowed"
                    )}
                    title="Remove row"
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Empty State */}
            {data.length === 0 && (
              <tr className="animate-fadeIn">
                <td colSpan={3} className="border border-gray-300 px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3 animate-bounce">
                    <div className="text-gray-400 transition-transform duration-300 hover:scale-110">
                      <Plus className="h-12 w-12" />
                    </div>
                    <div className="animate-pulse">
                      <div className="font-medium">No financial summary items found</div>
                      <div className="text-sm">Add a new entry to get started</div>
                    </div>
                  </div>
                </td>
              </tr>
            )}
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
        
        .animate-in {
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