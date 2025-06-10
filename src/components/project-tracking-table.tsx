"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Save, Trash2, Plus, AlertCircle } from "lucide-react"
import { cn } from "../lib/utils"
import { formatCurrency } from "../lib/format-utils"
import { useProjectTracking } from "../hooks/use-project-tracking-data"
import { ProjectTrackingItem } from "../types/project-tracking"

// Types for better type safety
interface EditingCell {
  itemIndex: number;
  columnId: string;
}

interface ColumnConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'readonly';
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export function ProjectTrackingTable() {
  // Configuration for table columns
  const columns: ColumnConfig[] = useMemo(() => [
    { id: 'projectWork', label: 'Project Work', type: 'text' },
    { id: 'uiUx', label: 'UI/UX', type: 'text' },
    { id: 'devName', label: 'Dev Name', type: 'text' },
    { id: 'docStatus', label: 'Doc Status', type: 'text' },
    { id: 'startDate', label: 'Start Date', type: 'date' },
    { id: 'endedDate', label: 'Ended Date', type: 'date' },
    { id: 'resources', label: 'Resources', type: 'text' },
    { id: 'salary', label: 'Salary', type: 'number', align: 'right' },
    { id: 'daysInvolved', label: 'Days Involved', type: 'number', align: 'right' },
    { id: 'hoursDays', label: 'Hours Days', type: 'number', align: 'right' },
    { id: 'perDayAmount', label: 'Per Day Amount', type: 'number', align: 'right' },
    { id: 'perHrsAmount', label: 'Per Hrs Amount', type: 'readonly', align: 'right' },
    { id: 'investDayAmount', label: 'Invest Day Amount', type: 'number', align: 'right' },
    { id: 'projectCost', label: 'Project Cost', type: 'number', align: 'right' },
    { id: 'collectAmount', label: 'Collect Amount', type: 'number', align: 'right' },
    { id: 'pendingAmount', label: 'Pending Amount', type: 'number', align: 'right' },
    { id: 'profitForProject', label: 'Profit for Project', type: 'readonly', align: 'right' },
  ], []);

  // Get all data and methods from context
  const {
    projectTrackingData: data,
    totals,
    loading,
    error,
    submitStatus,
    editingCell,
    updateCellValue,
    addRow,
    removeRow,
    startEditing,
    stopEditing,
    submitData,
  } = useProjectTracking()

  const [tempValue, setTempValue] = useState<string>("")
  const [validationError, setValidationError] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Validation functions
  const validateDate = useCallback((dateString: string): boolean => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  }, []);

  const validateNumber = useCallback((value: string): boolean => {
    if (value === "") return true; // Allow empty values
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }, []);

  // Memoized date formatting functions
  const formatDateToISO = useCallback((date: string | Date | null | undefined): string => {
    if (!date) return "";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return "";
    return parsedDate.toISOString().split("T")[0];
  }, []);

  const formatDateToDDMMYYYY = useCallback((value: string | Date | null | undefined): string => {
    if (!value) return "";
    
    // If it's already in DD/MM/YYYY format, validate and return as-is
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      // Validate the date is actually valid
      const [day, month, year] = value.split('/').map(Number);
      const testDate = new Date(year, month - 1, day);
      if (testDate.getDate() === day && testDate.getMonth() === month - 1 && testDate.getFullYear() === year) {
        return value;
      }
    }
    
    let date: Date;
    
    if (typeof value === 'string') {
      // Check if it's in DD/MM/YYYY format and convert to proper Date
      const ddmmyyyyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Try parsing as ISO date string or other formats
        date = new Date(value);
      }
    } else {
      date = new Date(value);
    }
    
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const handleStartEditing = useCallback((itemIndex: number, columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column || column.type === 'readonly') return;

    if (editingCell) {
      // If already editing another cell, save the current edit first
      handleBlur();
    }

    const item = data[itemIndex];
    if (!item) return;

    const currentValue = item[columnId as keyof ProjectTrackingItem] || "";
    
    // For date columns, ensure the value is in DD/MM/YYYY format for editing
    let editValue = String(currentValue);
    if (column.type === 'date' && currentValue) {
      editValue = formatDateToDDMMYYYY(currentValue);
    }
    
    setTempValue(editValue);
    setValidationError("");
    startEditing(itemIndex, columnId);
  }, [editingCell, data, columns, startEditing, formatDateToDDMMYYYY]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempValue(value);
    
    // Real-time validation
    if (editingCell) {
      const column = columns.find(col => col.id === editingCell.columnId);
      if (column) {
        let isValid = true;
        let errorMessage = "";

        switch (column.type) {
          case 'date':
            if (value && !validateDate(value)) {
              isValid = false;
              errorMessage = "Please enter date in DD/MM/YYYY format";
            }
            break;
          case 'number':
            if (value && !validateNumber(value)) {
              isValid = false;
              errorMessage = "Please enter a valid positive number";
            }
            break;
        }

        setValidationError(isValid ? "" : errorMessage);
      }
    }
  }, [editingCell, columns, validateDate, validateNumber]);

  const handleBlur = useCallback(async () => {
    if (!editingCell) return;

    const { itemIndex, columnId } = editingCell;
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    let finalValue: string | number = tempValue;

    // Validate and process the value based on column type
    switch (column.type) {
      case 'number':
        if (tempValue === "") {
          finalValue = 0;
        } else if (!validateNumber(tempValue)) {
          setValidationError("Invalid number format");
          return;
        } else {
          finalValue = Math.round(parseFloat(tempValue) * 100) / 100;
        }
        break;
      
      case 'date':
        if (tempValue && !validateDate(tempValue)) {
          setValidationError("Invalid date format. Use DD/MM/YYYY");
          return;
        }
        // Keep the date in DD/MM/YYYY format as entered by user
        finalValue = tempValue.trim();
        break;
      
      case 'text':
        finalValue = tempValue.trim();
        break;
    }

    try {
      await updateCellValue(itemIndex, columnId as keyof ProjectTrackingItem, finalValue);
      stopEditing();
      setTempValue("");
      setValidationError("");
    } catch (error) {
      console.error("Error updating cell value:", error);
      setValidationError("Failed to update cell value");
    }
  }, [editingCell, tempValue, columns, validateNumber, validateDate, updateCellValue, stopEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!validationError) {
        handleBlur();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      stopEditing();
      setTempValue("");
      setValidationError("");
    } else if (e.key === "Tab") {
      // Allow tab navigation
      if (!validationError) {
        handleBlur();
      }
    }
  }, [validationError, handleBlur, stopEditing]);

  const handleSubmit = useCallback(async () => {
    try {
      await submitData();
    } catch (error) {
      console.error('Error submitting project tracking data:', error);
    }
  }, [submitData]);

  const handleAddRow = useCallback(async () => {
    try {
      await addRow();
    } catch (error) {
      console.error('Error adding row:', error);
    }
  }, [addRow]);

  const handleRemoveRow = useCallback(async (itemIndex: number) => {
    try {
      await removeRow(itemIndex);
    } catch (error) {
      console.error('Error removing row:', error);
    }
  }, [removeRow]);

  const renderEditableCell = useCallback((
    item: ProjectTrackingItem,
    itemIndex: number,
    column: ColumnConfig
  ) => {
    const isEditing = editingCell?.itemIndex === itemIndex && editingCell?.columnId === column.id;
    const isReadonly = column.type === 'readonly';

    if (isEditing && !isReadonly) {
      return (
        <div className="relative animate-fadeIn">
          <input
            ref={inputRef}
            type={column.type === 'number' ? "number" : "text"}
            min={column.type === 'number' ? "0" : undefined}
            step={column.type === 'number' ? "0.01" : undefined}
            value={tempValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full p-2 border-2 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-200 transform focus:scale-105 shadow-sm",
              column.align === "right" && "text-right",
              validationError ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50" : "border-indigo-300 bg-white"
            )}
            placeholder={column.type === 'date' ? "DD/MM/YYYY" : undefined}
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

    // Display value logic
    let displayValue: string;
    const rawValue = item[column.id as keyof ProjectTrackingItem];

    switch (column.type) {
      case 'number':
      case 'readonly':
        displayValue = formatCurrency(Number(rawValue) || 0, false);
        break;
      case 'date':
        displayValue = formatDateToDDMMYYYY(String(rawValue ?? ""));
        break;
      default:
        displayValue = String(rawValue || "Click to edit");
    }

    return (
      <div
        className={cn(
          "min-h-[2rem] p-2 rounded-lg transition-all duration-200 transform hover:scale-105",
          !isReadonly && "cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md",
          isReadonly && "bg-gradient-to-r from-gray-100 to-gray-200 cursor-not-allowed opacity-75",
          column.align === "right" && "text-right",
          column.align === "center" && "text-center",
          !isReadonly && "hover:border-indigo-200 border border-transparent"
        )}
        onClick={() => !isReadonly && handleStartEditing(itemIndex, column.id)}
        title={isReadonly ? "This field is calculated automatically" : "Click to edit"}
      >
        <span className="transition-all duration-200">{displayValue}</span>
      </div>
    );
  }, [editingCell, tempValue, validationError, handleInputChange, handleBlur, handleKeyDown, handleStartEditing, formatDateToDDMMYYYY]);

  // Memoized totals row
  const totalsRow = useMemo(() => {
    if (data.length === 0) return null;

    return (
      <tr className="bg-gradient-to-r from-green-100 to-emerald-200 font-bold sticky bottom-0 animate-slideUp shadow-lg">
        <td className="border border-gray-300 px-4 py-4 transition-colors duration-200" colSpan={8}>
          <span className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Total
          </span>
        </td>
        {columns.filter(col => col.type === 'number' || col.type === 'readonly').map((column, index) => (
          <td key={column.id} className="border border-gray-300 px-4 py-4 text-right transition-all duration-200 hover:bg-green-200" style={{ animationDelay: `${index * 50}ms` }}>
            <span className="font-mono text-lg">
              {formatCurrency(totals[column.id as keyof typeof totals] || 0, false)}
            </span>
          </td>
        ))}
        <td className="border border-gray-300 px-4 py-4"></td>
      </tr>
    );
  }, [data.length, columns, totals]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-fadeIn">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-200 border-t-indigo-600"></div>
          <div className="text-lg text-gray-600 animate-pulse">Loading project tracking data...</div>
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
            disabled={submitStatus === "loading"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform"
          >
            <Save className={cn("h-4 w-4 transition-transform duration-200", submitStatus === "loading" && "animate-spin")} />
            {submitStatus === "loading" ? "Saving..." : "Save to MongoDB"}
          </button>

          <button
            onClick={handleAddRow}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 transform"
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Add Project
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
        <table className="w-full min-w-[1400px] border-collapse bg-white">
          <thead className="sticky top-0 bg-gradient-to-r from-yellow-200 to-yellow-300 z-20 shadow-md">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16 transition-colors duration-200 hover:bg-yellow-400">
                SL No.
              </th>
              {columns.map((column, index) => (
                <th
                  key={column.id}
                  className={cn(
                    "border border-gray-300 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider transition-all duration-200 hover:bg-yellow-400",
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 'text-left',
                    column.width || 'min-w-[120px]'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {column.label}
                  {column.type === 'readonly' && (
                    <span className="ml-1 text-xs text-gray-500 transition-opacity duration-200 hover:opacity-75" title="Automatically calculated">
                      (calc)
                    </span>
                  )}
                </th>
              ))}
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
                  "hover:bg-blue-50 transition-all duration-200 hover:shadow-md transform hover:scale-[1.002]",
                  itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                )}
                style={{ animationDelay: `${itemIndex * 100}ms` }}
              >
                {/* SL No */}
                <td className="border border-gray-300 px-4 py-3 text-center font-medium transition-colors duration-200">
                  {itemIndex + 1}
                </td>

                {/* Dynamic columns */}
                {columns.map(column => (
                  <td
                    key={column.id}
                    className={cn(
                      "border border-gray-300 px-4 py-3 transition-all duration-200",
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center'
                    )}
                  >
                    {renderEditableCell(item, itemIndex, column)}
                  </td>
                ))}

                {/* Actions */}
                <td className="border border-gray-300 px-4 py-3 text-center">
                  <button
                    onClick={() => handleRemoveRow(itemIndex)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 hover:shadow-md hover:scale-110 active:scale-95 transform"
                    title="Remove project tracking"
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
                <td colSpan={columns.length + 2} className="border border-gray-300 px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3 animate-bounce">
                    <div className="text-gray-400 transition-transform duration-300 hover:scale-110">
                      <Plus className="h-12 w-12" />
                    </div>
                    <div className="animate-pulse">
                      <div className="font-medium">No project tracking data found</div>
                      <div className="text-sm">Click "Add Project" to add your first entry</div>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Totals row */}
            {totalsRow}
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