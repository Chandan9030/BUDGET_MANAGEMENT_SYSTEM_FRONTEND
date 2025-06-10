"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Save, Trash2, Plus, AlertCircle } from "lucide-react"
import { cn } from "../lib/utils"
import { formatCurrency } from "../lib/format-utils"
import { useSubscriptionRevenue, SubscriptionRevenueItem } from "../hooks/use-subscription-revenue-data"

// Types for better type safety
interface EditingCell {
  rowIndex: number;
  columnId: string;
  originalValue: string | number;
}

export function SubscriptionRevenueTable() {
  const {
    subscriptionData = [],
    totals = {
      subscriptionsAvailed: 0,
      projectedMonthlyRevenue: 0,
      projectedAnnualRevenue: 0,
      subscribed: 0,
      profit: 0,
    },
    loading,
    error,
    submitStatus,
    updateItemByIndex,
    addRow,
    removeRow,
    submitData,
  } = useSubscriptionRevenue()

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [tempValue, setTempValue] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingRow, setIsAddingRow] = useState(false)
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
  const validateNumber = useCallback((value: string): boolean => {
    if (value === "") return true; // Allow empty values
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }, []);

  const startEditing = useCallback((rowIndex: number, columnId: string) => {
    if (
      editingCell?.rowIndex === rowIndex &&
      editingCell?.columnId === columnId
    ) {
      return; // Prevent re-triggering if already editing this cell
    }

    if (editingCell) {
      handleBlur(); // Save current edit before starting a new one
    }

    const item = subscriptionData[rowIndex];
    if (!item) return;

    const currentValue = item[columnId as keyof SubscriptionRevenueItem] || "";
    setEditingCell({ rowIndex, columnId, originalValue: currentValue });
    setTempValue(String(currentValue));
    setValidationError("");
  }, [editingCell, subscriptionData]);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
    setTempValue("");
    setValidationError("");
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempValue(value);

    // Real-time validation for numeric fields
    if (editingCell && editingCell.columnId !== "revenueSource") {
      if (value && !validateNumber(value)) {
        setValidationError("Please enter a valid positive number");
      } else {
        setValidationError("");
      }
    }
  }, [editingCell, validateNumber]);

  const handleBlur = useCallback(async () => {
    if (!editingCell) return;

    const { rowIndex, columnId, originalValue } = editingCell;
    let finalValue: string | number = tempValue;

    // Process the value based on column type
    if (columnId !== "revenueSource") {
      if (tempValue === "" || tempValue === "0") {
        finalValue = 0;
      } else if (!validateNumber(tempValue)) {
        setValidationError("Invalid number format");
        return;
      } else {
        finalValue = Math.round(parseFloat(tempValue) * 100) / 100; // Round to 2 decimal places
      }
    } else {
      finalValue = tempValue.trim();
    }

    // Only update if value actually changed
    if (finalValue !== originalValue) {
      try {
        await updateItemByIndex(rowIndex, columnId as keyof SubscriptionRevenueItem, finalValue);
      } catch (err) {
        console.error("Error updating cell:", err);
        setValidationError("Failed to update cell value");
      }
    }

    stopEditing();
  }, [editingCell, tempValue, validateNumber, updateItemByIndex, stopEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!validationError) {
        handleBlur();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      stopEditing();
    } else if (e.key === "Tab") {
      if (!validationError) {
        handleBlur();
      }
    }
  }, [validationError, handleBlur, stopEditing]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await submitData();
    } catch (err) {
      console.error("Error submitting data:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [submitData]);

  const handleAddRow = useCallback(async () => {
    setIsAddingRow(true);
    try {
      await addRow();
    } catch (err) {
      console.error("Error adding row:", err);
    } finally {
      setIsAddingRow(false);
    }
  }, [addRow]);

  const handleRemoveRow = useCallback(async (rowIndex: number) => {
    setRemovingRows(prev => new Set(prev).add(rowIndex));
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Delay for animation
      await removeRow(rowIndex);
    } catch (err) {
      console.error("Error removing row:", err);
    } finally {
      setRemovingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowIndex);
        return newSet;
      });
    }
  }, [removeRow]);

  const renderEditableCell = useCallback(
    (
      item: SubscriptionRevenueItem,
      rowIndex: number,
      columnId: string,
      isNumeric: boolean = false,
      textAlign: string = "left"
    ) => {
      const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnId === columnId;

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
                "w-full p-2 border-2 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-blue-600",
                "transition-all duration-200 transform focus:scale-105 shadow-sm",
                textAlign === "right" && "text-right",
                validationError ? "border-red-500 focus:ring-red-500 bg-red-50" : "border-blue-600 bg-white"
              )}
            />
            {validationError && (
              <div className="absolute top-full left-0 mt-2 p-0 bg-gray-100 border-t border-blue-400 rounded-lg">
                <div className="relative animate-in">
                  <p className="text-red-600 text-sm">
                    <AlertCircle className="inline h-3 w-3 mr-2" />
                    {validationError}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }

      const displayValue = isNumeric
        ? formatCurrency(Number(item[columnId as keyof SubscriptionRevenueItem]) || 0, false)
        : (item[columnId as keyof SubscriptionRevenueItem]?.toString() || "Click to edit");

      return (
        <div
          className={cn(
            "min-h-[2rem] p-2 rounded-lg transition-all duration-200 all",
            "cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50",
            "hover:shadow-md hover:scale-105 border border-transparent hover:border-blue-400",
            textAlign === "right" && "text-right"
          )}
          onClick={() => startEditing(rowIndex, columnId)}
          title="Click to edit"
        >
          <span className="transition-all duration-200">{displayValue}</span>
        </div>
      );
    }, [editingCell, tempValue, validationError, handleInputChange, handleBlur, handleKeyDown, startEditing]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-lg text-gray-600">Loading subscription revenue data...</div>
          </div>
        </div>
      );
    } else if (error && subscriptionData.length === 0) {
      return (
        <div className="flex justify-center items-center h-64 animate-pulse">
          <div className="text-center">
            <div className="text-red-600 font-medium mb-4">Error: Failed to load data!</div>
            <div className="text-gray-600">{error.message}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      );
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
              "px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-110 active:scale-95 transform",
              isSubmitting || submitStatus === "loading"
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : flashingSave
                  ? "bg-green-500 text-white shadow-lg animate-pulse"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover-blue-800 shadow-md hover:shadow-lg"
            )}
          >
            <Save className={cn(
              "h-4 w-4 transition-transform duration-300",
              (isSubmitting || submitStatus === "loading") && "animate-spin"
            )} />
            {isSubmitting || submitStatus === "loading" ? "Saving..." : "Save Data"}
          </button>

          <button
            onClick={handleAddRow}
            disabled={isAddingRow}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-110 active:scale-95 transform",
              isAddingRow
                ? "bg-gray-400 text-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
            )}
            title="Add Revenue Source"
          >
            <Plus className={cn(
              "h-4 w-4 transition-transform duration-200",
              isAddingRow && "animate-spin"
            )} />
            {isAddingRow ? "Adding..." : "Add Revenue Source"}
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

          {error && subscriptionData.length > 0 && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-lg border border-red-200 animate-slideIn transition-all duration-300">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Warning: {error.message}
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-200 animate-slideUp transition-all duration-300 hover:shadow-3xl">
        <table className="w-full min-w-[800px] border-collapse bg-white">
          <thead className="sticky top-0 bg-gradient-to-r from-yellow-200 to-yellow-300 z-20 shadow-md">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 z-30 bg-gradient-to-r from-yellow-200 to-yellow-300 transition-colors duration-200 hover:bg-yellow-400">
                Revenue Source
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Subscriptions Availed
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Monthly Revenue (INR)
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Annual Revenue (INR)
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Subscribed
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Profit
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 transition-colors duration-200 hover:bg-yellow-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Data Rows */}
            {subscriptionData.map((item, index) => (
              <tr
                key={item.id}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  "hover:bg-blue-50 hover:shadow-md transform hover:scale-[1.002]",
                  removingRows.has(index) && [
                    "opacity-0 scale-95 -translate-x-4",
                    "bg-red-50 border-red-200",
                  ],
                  !removingRows.has(index) && [
                    index % 2 === 0 ? "bg-white" : "bg-gray-50",
                  ]
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <td className="border border-gray-300 px-4 py-3 sticky left-0 z-10 bg-inherit">
                  {renderEditableCell(item, index, "revenueSource", false, "left")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, index, "subscriptionsAvailed", true, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, index, "projectedMonthlyRevenue", true, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, index, "projectedAnnualRevenue", true, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, index, "subscribed", true, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, index, "profit", true, "right")}
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
            {subscriptionData.length === 0 && (
              <tr className="animate-fadeIn">
                <td colSpan={7} className="border border-gray-300 px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3 animate-bounce">
                    <div className="text-gray-400 transition-transform duration-300 hover:scale-110">
                      <Plus className="h-12 w-12" />
                    </div>
                    <div className="animate-pulse">
                      <div className="font-medium">No revenue sources found</div>
                      <div className="text-sm">Click "Add Revenue Source" to add your first entry</div>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Totals Row */}
            {subscriptionData.length > 0 && (
              <tr className="bg-gradient-to-r from-green-100 to-emerald-200 font-bold sticky bottom-0 animate-slideUp shadow-lg">
                <td className="border border-gray-300 px-4 py-4 sticky left-0 z-10 bg-gradient-to-r from-green-100 to-emerald-200 text-lg font-semibold bg-clip-text text-transparent">
                  Total
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{totals.subscriptionsAvailed.toLocaleString()}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.projectedMonthlyRevenue, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.projectedAnnualRevenue, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{totals.subscribed.toLocaleString()}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.profit, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4"></td>
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