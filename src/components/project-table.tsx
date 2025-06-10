"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Save, Trash2, Plus, AlertCircle } from "lucide-react"
import { cn } from "../lib/utils"
import { formatCurrency } from "../lib/format-utils"
import { useProject } from "../hooks/use-project-data"
import { ProjectItem } from "../types/project"

// Types for better type safety
interface EditingCell {
  itemIndex: number;
  columnId: string;
  originalValue: string | number;
}

export function ProjectTable() {
  // Get all data and methods from context
  const {
    projectData: data,
    totals,
    loading,
    error,
    submitStatus,
    updateCellValue,
    addRow,
    removeRow,
    submitData,
  } = useProject()

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [tempValue, setTempValue] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [flashingSave, setFlashingSave] = useState(false)
  const [removingRows, setRemovingRows] = useState<Set<number>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell) {
      if (editingCell.columnId === "status" && selectRef.current) {
        selectRef.current.focus()
      } else if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
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

  const startEditing = useCallback((itemIndex: number, columnId: string) => {
    if (columnId === "yetToBeRecovered") return; // Don't allow editing calculated field

    if (
      editingCell?.itemIndex === itemIndex &&
      editingCell?.columnId === columnId
    ) {
      return; // Prevent re-triggering if already editing this cell
    }

    if (editingCell) {
      handleBlur(); // Save current edit before starting a new one
    }

    const item = data[itemIndex];
    if (!item) return;

    const currentValue = item[columnId as keyof ProjectItem] || "";
    setEditingCell({ itemIndex, columnId, originalValue: currentValue });
    setTempValue(String(currentValue));
    setValidationError("");
  }, [editingCell, data]);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
    setTempValue("");
    setValidationError("");
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setTempValue(value);

    // Real-time validation for numeric fields
    if (editingCell && ["dev", "extra", "invest", "gettingAmount"].includes(editingCell.columnId)) {
      if (value && !validateNumber(value)) {
        setValidationError("Please enter a valid positive number");
      } else {
        setValidationError("");
      }
    }
  }, [editingCell, validateNumber]);

  const handleBlur = useCallback(async () => {
    if (!editingCell) return;

    const { itemIndex, columnId, originalValue } = editingCell;
    let finalValue: string | number = tempValue;

    // Process the value based on column type
    if (["dev", "extra", "invest", "gettingAmount"].includes(columnId)) {
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
        await updateCellValue(itemIndex, columnId as keyof ProjectItem, finalValue);
      } catch (error) {
        console.error("Error updating cell value:", error);
        setValidationError("Failed to update cell value");
      }
    }

    stopEditing();
  }, [editingCell, tempValue, validateNumber, updateCellValue, stopEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!validationError) {
        handleBlur();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      stopEditing();
      setTempValue("");
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
    } catch (error) {
      console.error('Error submitting project data:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [submitData]);

  const handleAddRow = useCallback(async () => {
    setIsAddingRow(true);
    try {
      await addRow();
    } catch (error) {
      console.error('Error adding row:', error);
    } finally {
      setIsAddingRow(false);
    }
  }, [addRow]);

  const handleRemoveRow = useCallback(async (itemIndex: number) => {
    setRemovingRows(prev => new Set(prev).add(itemIndex));
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Delay for animation
      await removeRow(itemIndex);
    } catch (error) {
      console.error('Error removing row:', error);
    } finally {
      setRemovingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemIndex);
        return newSet;
      });
    }
  }, [removeRow]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "In Progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "On Hold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderEditableCell = useCallback((
    item: ProjectItem,
    itemIndex: number,
    columnId: string,
    isNumeric: boolean = false,
    isSelect: boolean = false,
    textAlign: string = "left"
  ) => {
    const isEditing = editingCell?.itemIndex === itemIndex && editingCell?.columnId === columnId;
    const isReadonly = columnId === "yetToBeRecovered";

    if (isEditing && !isReadonly) {
      if (isSelect) {
        return (
          <div className="relative animate-fadeIn">
            <select
              ref={selectRef}
              value={tempValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full p-2 border-2 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500",
                "transition-all duration-200 transform focus:scale-105 shadow-sm",
                validationError ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50" : "border-indigo-300 bg-white"
              )}
            >
              <option value="">Select Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            {validationError && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-600 whitespace-nowrap z-10 shadow-lg animate-slideIn">
                <AlertCircle className="inline h-3 w-3 mr-1" />
                {validationError}
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="relative animate-fadeIn">
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
              "w-full p-2 border-2 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500",
              "transition-all duration-200 transform focus:scale-105 shadow-sm",
              textAlign === "right" && "text-right",
              validationError ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50" : "border-indigo-300 bg-white"
            )}
          />
          {validationError && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-600 whitespace-nowrap z-10 shadow-lg animate-slideIn">
              <AlertCircle className="inline h-3 w-3 mr-1" />
              {validationError}
            </div>
          )}
        </div>
      );
    }

    const displayValue = isNumeric
      ? formatCurrency(Number(item[columnId as keyof ProjectItem]) || 0, false)
      : (item[columnId as keyof ProjectItem]?.toString() || (isSelect ? "Click to select status" : "Click to edit"));

    if (columnId === "status" && item.status) {
      return (
        <div
          className={cn(
            "inline-flex px-3 py-1 rounded-full text-sm font-semibold",
            "cursor-pointer transition-all duration-200 transform hover:scale-105",
            "hover:shadow-md",
            !isReadonly && "hover:bg-gray-200/50",
            getStatusColor(item.status)
          )}
          onClick={() => !isReadonly && startEditing(itemIndex, columnId)}
          title="Edit status"
        >
          {displayValue}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "min-h-[2rem] p-2 rounded-lg flex items-center",
          "transition-all duration-200 transform",
          !isReadonly && [
            "cursor-pointer",
            "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50",
            "hover:shadow-md hover:scale-105",
            "border border-transparent hover:border-blue-200"
          ],
          isReadonly && "bg-gray-200/50 text-gray-600",
          textAlign === "right" && "justify-end text-right",
          textAlign === "center" && "justify-center text-center"
        )}
        onClick={() => !isReadonly && startEditing(itemIndex, columnId)}
        title={isReadonly ? "Read-only" : "Click to edit"}
      >
        <span className="transition-all duration-200">{displayValue}</span>
      </div>
    );
  }, [editingCell, tempValue, validationError, handleInputChange, handleBlur, handleKeyDown, startEditing]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-fadeIn">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">Loading project data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Action buttons and status section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-4 animate-slideDown">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitStatus === "loading" || isSubmitting}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform",
              submitStatus === "loading" || isSubmitting
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : flashingSave
                ? "bg-green-500 text-white shadow-lg animate-pulse"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            )}
          >
            <Save className={cn(
              "h-4 w-4 transition-transform duration-200",
              (submitStatus === "loading" || isSubmitting) && "animate-spin"
            )} />
            {submitStatus === "loading" || isSubmitting ? "Saving..." : "Save Projects"}
          </button>

          <button
            onClick={handleAddRow}
            disabled={isAddingRow}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform",
              isAddingRow
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
            )}
          >
            <Plus className={cn(
              "h-4 w-4 transition-transform duration-200",
              isAddingRow && "animate-spin"
            )} />
            {isAddingRow ? "Adding..." : "Add Project"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {submitStatus === "success" && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg border border-green-200 animate-slideIn transition-all duration-300">
              ✓ Projects saved successfully!
            </div>
          )}

          {submitStatus === "error" && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-lg border border-red-200 animate-slideIn transition-all duration-300">
              ✗ Failed to save projects. Please try again.
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
                Project Name
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Status
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Dev Cost
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Extra Cost
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Investment
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Revenue
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider transition-colors duration-200 hover:bg-yellow-400">
                Yet to be Recovered
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20 transition-colors duration-200 hover:bg-yellow-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, itemIndex) => (
              <tr
                key={item.id}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  "hover:bg-blue-50 hover:shadow-md transform hover:scale-[1.002]",
                  removingRows.has(itemIndex) && [
                    "opacity-0 scale-95 -translate-x-4",
                    "bg-red-50 border-red-200"
                  ],
                  !removingRows.has(itemIndex) && [
                    itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                  ]
                )}
                style={{ animationDelay: `${itemIndex * 100}ms` }}
              >
                <td className="border border-gray-300 px-4 py-3 sticky left-0 z-10 bg-inherit font-medium text-gray-600 text-center">
                  {itemIndex + 1}
                </td>
                <td className="border border-gray-300 px-4 py-3 sticky left-12 z-10 bg-inherit">
                  {renderEditableCell(item, itemIndex, "name", false, false, "left")}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  {renderEditableCell(item, itemIndex, "status", false, true, "left")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, itemIndex, "dev", true, false, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, itemIndex, "extra", true, false, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, itemIndex, "invest", true, false, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, itemIndex, "gettingAmount", true, false, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  {renderEditableCell(item, itemIndex, "yetToBeRecovered", true, false, "right")}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">
                  <button
                    onClick={() => handleRemoveRow(itemIndex)}
                    disabled={removingRows.has(itemIndex)}
                    className={cn(
                      "text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-red-500 hover:shadow-md hover:scale-110 active:scale-95 transform",
                      removingRows.has(itemIndex) && "text-gray-400 cursor-not-allowed"
                    )}
                    title="Remove project"
                    aria-label={`Remove project ${itemIndex + 1}`}
                  >
                    <Trash2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {data.length === 0 && (
              <tr className="animate-fadeIn">
                <td colSpan={9} className="border border-gray-300 px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3 animate-bounce">
                    <div className="text-gray-400 transition-transform duration-300 hover:scale-110">
                      <Plus className="h-12 w-12" />
                    </div>
                    <div className="animate-pulse">
                      <div className="font-medium">No projects found</div>
                      <div className="text-sm">Click "Add Project" to add your first project</div>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {/* Total Row */}
            {data.length > 0 && (
              <tr
                className={cn(
                  "bg-gradient-to-r from-green-100 to-emerald-200 font-bold sticky bottom-0 animate-slideUp shadow-lg"
                )}>
                <td className="border border-gray-300 px-4 py-4 sticky left-0 z-10 bg-gradient-to-r from-green-100 to-emerald-200"></td>
                <td
                  className="border border-gray-300 px-4 py-4 sticky left-12 z-10 bg-gradient-to-r from-green-100 to-emerald-200 text-lg font-semibold"
                  colSpan={2}>
                  Total
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.dev, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.extra, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.invest, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.gettingAmount, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="font-mono text-lg">{formatCurrency(totals.yetToBeRecovered, false)}</span>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200">
                  <span className="text-lg font-semibold text-green-800"></span>
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
  );
}