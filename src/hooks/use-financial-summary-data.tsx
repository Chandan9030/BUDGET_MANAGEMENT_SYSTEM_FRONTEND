"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { FinancialSummaryItem, FinancialSummaryData } from "../types/financial-summary"
import { initialFinancialSummaryData } from "../data/initial-financial-summary-data"

// Backend API URL
const API_URL = "http://localhost:5000/api"
export function useFinancialSummaryData() {
  const [data, setData] = useState<FinancialSummaryData>(initialFinancialSummaryData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  // Load data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/financial-summary`)

        if (!response.ok) {
          throw new Error(`Failed to fetch financial summary data: ${response.statusText}`)
        }

        const result = await response.json()

        if (result && result.length > 0) {
          setData({ items: result })
        } else {
          // If no data from API, use initial data
          setData(initialFinancialSummaryData)
        }

        setError(null)
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load financial summary data. Using local data instead.")

        // Fallback to localStorage
        try {
          const savedData = localStorage.getItem("financialSummaryData")
          if (savedData) {
            setData(JSON.parse(savedData))
          }
        } catch (localErr) {
          console.error("Error loading from localStorage:", localErr)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Also save data to localStorage as a backup
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem("financialSummaryData", JSON.stringify(data))
      } catch (error) {
        console.error("Error saving financial summary data to localStorage:", error)
      }
    }
  }, [data, loading])

  // Update any cell value
  const updateCellValue = (itemIndex: number, columnId: string, value: string | number) => {
    if (!data) return; // Guard clause to avoid modifying null data
    
    setData((prevData) => {
      if (!prevData) return prevData; // Additional check
      
      const newData = { ...prevData }
      const newItems = [...newData.items]

      // Update the specified cell
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        [columnId]: value,
      }

      // Calculate profit
      if (columnId === "amount" && (itemIndex === 0 || itemIndex === 1 || itemIndex === 2 || itemIndex === 3)) {
        // Total Profit = Monthly Expenses - Total Expenses Annual - Development Cost - April25 Expenses
        const totalExpensesAnnual = newItems[0].amount || 0
        const monthlyExpenses = newItems[1].amount || 0
        const developmentCost = newItems[2].amount || 0
        const april25Expenses = newItems[3].amount || 0

        // Update April25 Profit
        newItems[4].amount = monthlyExpenses - april25Expenses

        // Update Total Profit 2025
        newItems[5].amount = monthlyExpenses - totalExpensesAnnual - developmentCost - april25Expenses
      }

      newData.items = newItems
      return newData
    })
  }

  // Add a new row
  const addRow = (newRow: Partial<FinancialSummaryItem>) => {
    if (!data) return; // Guard clause
    
    setData((prevData) => {
      if (!prevData) return prevData; // Additional check
      
      const newData = { ...prevData }
      const newItems = [...newData.items]

      const item: FinancialSummaryItem = {
        id: uuidv4(),
        category: newRow.category || "",
        amount: newRow.amount || 0,
      }

      newItems.push(item)
      newData.items = newItems
      return newData
    })
  }

  // Remove a row
  const removeRow = (itemIndex: number) => {
    if (!data) return; // Guard clause
    
    if (window.confirm("Are you sure you want to remove this item?")) {
      setData((prevData) => {
        if (!prevData) return prevData; // Additional check
        
        const newData = { ...prevData }
        const newItems = newData.items.filter((_, index) => index !== itemIndex)
        newData.items = newItems
        return newData
      })
    }
  }

  // Update financial summary with budget totals
  const updateWithBudgetTotals = (annualTotal: number, monthlyTotal: number) => {
    if (!data) return; // Guard clause
    
    setData((prevData) => {
      if (!prevData) return prevData; // Additional check
      
      const newData = { ...prevData }
      const newItems = [...newData.items]

      // Find the indices of the Total Expenses Annual and Total Expenses Month items
      const totalExpensesAnnualIndex = newItems.findIndex((item) => item.category === "Total Expenses Annual")
      const totalExpensesMonthIndex = newItems.findIndex((item) => item.category === "Total Expenses Month")

      // Update the amounts if the items exist
      if (totalExpensesAnnualIndex !== -1) {
        newItems[totalExpensesAnnualIndex] = {
          ...newItems[totalExpensesAnnualIndex],
          amount: annualTotal,
        }
      }

      if (totalExpensesMonthIndex !== -1) {
        newItems[totalExpensesMonthIndex] = {
          ...newItems[totalExpensesMonthIndex],
          amount: monthlyTotal,
        }
      }

      // Recalculate profits
      const totalExpensesAnnual = newItems[0].amount || 0
      const monthlyExpenses = newItems[1].amount || 0
      const developmentCost = newItems[2].amount || 0
      const april25Expenses = newItems[3].amount || 0

      // Update April25 Profit
      if (newItems[4]) {
        newItems[4].amount = monthlyExpenses - april25Expenses
      }

      // Update Total Profit 2025
      if (newItems[5]) {
        newItems[5].amount = monthlyExpenses - totalExpensesAnnual - developmentCost - april25Expenses
      }

      newData.items = newItems
      return newData
    })
  }

  // Return null or loading state until data is actually loaded
  if (data === null) {
    return {
      data: initialFinancialSummaryData,
      updateCellValue: () => {},
      addRow: () => {},
      removeRow: () => {},
      updateWithBudgetTotals: () => {},
      isLoading: true,
    };
  }

  // Submit data to backend
  const submitData = async () => {
    try {
      setSubmitStatus("loading")

      const response = await fetch(`${API_URL}/financial-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.items),
      })

      if (!response.ok) {
        throw new Error(`Failed to save financial summary data: ${response.statusText}`)
      }

      setSubmitStatus("success")

      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle")
      }, 3000)
    } catch (err) {
      console.error("Error saving data:", err)
      setSubmitStatus("error")
      setError("Failed to save financial summary data to the server.")

      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle")
      }, 3000)
    }
  }

  return {
    data,
    updateCellValue,
    addRow,
    removeRow,
    updateWithBudgetTotals,
    isLoading: false,
    submitData,
    submitStatus,
    error,
  }
}