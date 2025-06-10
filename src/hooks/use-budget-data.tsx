"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { v4 as uuidv4 } from "uuid"
import type { BudgetSection, TableColumn } from "../types/budget"

interface BudgetContextType {
  budgetData: BudgetSection[]
  columns: TableColumn[]
  currentMonth: string
  loading: boolean
  error: Error | null
  submitStatus: "idle" | "loading" | "success" | "error"
  updateCellValue: (
    sectionIndex: number,
    itemIndex: number,
    columnId: string,
    value: string | number
  ) => Promise<void>
  addRow: (sectionId: string, newRow: {
    category?: string
    employee?: string
    monthlyCost?: number
  }) => Promise<void>
  addColumn: (columnId: string, columnName: string) => Promise<void>
  addSection: (sectionName: string) => Promise<void>
  removeRow: (sectionIndex: number, itemIndex: number) => Promise<void>
  removeSection: (sectionIndex: number) => Promise<void>
  removeColumn: (columnId: string) => Promise<void>
  setCurrentMonth: (month: string) => void
  submitData: () => Promise<void>
  retryConnection: () => Promise<boolean>
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

const API_URL = "http://localhost:5000/api"

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgetData, setBudgetData] = useState<BudgetSection[]>([])
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: "monthlyCost", name: "Monthly Cost (INR)" },
    { id: "quarterlyCost", name: "Quarterly Cost" },
    { id: "halfYearlyCost", name: "Half-Yearly Cost" },
    { id: "annualCost", name: "Annual Cost" },
  ])
  const [currentMonth, setCurrentMonth] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  // Check backend connection
  const checkBackendConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/budget/health`, {
        method: 'GET',
        cache: 'no-store'
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  // Set current month
  useEffect(() => {
    const date = new Date()
    const month = date.toLocaleString("default", { month: "long" })
    const year = date.getFullYear().toString().slice(-2)
    setCurrentMonth(`${month}${year} Invest`)
  }, [])

  // Calculate derived values
  const calculateDerivedValues = useCallback((monthlyCost: number) => {
    return {
      quarterlyCost: monthlyCost * 3,
      halfYearlyCost: monthlyCost * 6,
      annualCost: monthlyCost * 12,
    }
  }, [])

  // Fetch budget data from backend
  const fetchBudgetData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const isBackendAvailable = await checkBackendConnection()
      
      if (isBackendAvailable) {
        const response = await fetch(`${API_URL}/budget`, {
          headers: { 'Accept': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setBudgetData(data)
            // Save to localStorage as backup
            localStorage.setItem("budgetData", JSON.stringify(data))
            return
          }
        }
      }

      // Fallback to localStorage if backend fails
      const storedData = localStorage.getItem("budgetData")
      if (storedData) {
        setBudgetData(JSON.parse(storedData))
      }

      const savedColumns = localStorage.getItem("budgetColumns")
      if (savedColumns) {
        setColumns(JSON.parse(savedColumns))
      }

      const savedCurrentMonth = localStorage.getItem("currentMonth")
      if (savedCurrentMonth) {
        setCurrentMonth(savedCurrentMonth)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load budget data"))
      console.error("Error loading budget data:", err)
      
      // Try to load from localStorage as last resort
      const storedData = localStorage.getItem("budgetData")
      if (storedData) {
        setBudgetData(JSON.parse(storedData))
      }
    } finally {
      setLoading(false)
    }
  }, [checkBackendConnection])

  // Initial data load
  useEffect(() => {
    fetchBudgetData()
  }, [fetchBudgetData])

  // Save data to localStorage when it changes
  useEffect(() => {
    if (!loading && budgetData.length > 0) {
      localStorage.setItem("budgetData", JSON.stringify(budgetData))
      localStorage.setItem("budgetColumns", JSON.stringify(columns))
      localStorage.setItem("currentMonth", currentMonth)
    }
  }, [budgetData, columns, currentMonth, loading])

  // Submit entire budget data to backend
  const submitData = useCallback(async () => {
    setSubmitStatus("loading")
    
    try {
      const isBackendAvailable = await checkBackendConnection()
      
      if (!isBackendAvailable) {
        throw new Error("Backend is not available")
      }

      const response = await fetch(`${API_URL}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || response.statusText)
      }
      
      setSubmitStatus("success")
      setError(null)
    } catch (err) {
      setSubmitStatus("error")
      setError(err instanceof Error ? err : new Error("Failed to save data"))
      console.error("Submit error:", err)
    } finally {
      setTimeout(() => setSubmitStatus("idle"), 3000)
    }
  }, [budgetData, checkBackendConnection])

  // Update cell value with optimized backend sync
  const updateCellValue = useCallback(async (
    sectionIndex: number,
    itemIndex: number,
    columnId: string,
    value: string | number
  ) => {
    try {
      setBudgetData(prevData => {
        const newData = [...prevData]
        
        if (
          sectionIndex < 0 || 
          sectionIndex >= newData.length ||
          itemIndex < 0 ||
          itemIndex >= newData[sectionIndex].items.length
        ) {
          throw new Error("Invalid indices")
        }

        const item = { ...newData[sectionIndex].items[itemIndex] }
        item[columnId] = value

        if (columnId === "monthlyCost") {
          const monthlyCost = Number(value) || 0
          const derived = calculateDerivedValues(monthlyCost)
          Object.assign(item, derived)
        }

        newData[sectionIndex].items[itemIndex] = item
        return newData
      })

      // Update specific item in backend
      const isBackendAvailable = await checkBackendConnection()
      if (isBackendAvailable) {
        const section = budgetData[sectionIndex]
        const item = section.items[itemIndex]
        console.log("Updating item:", item)
        
        await fetch(`${API_URL}/budget/section/${section.id}/item/${item._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            [columnId]: value,
            ...(columnId === "monthlyCost" ? calculateDerivedValues(Number(value) || 0) : {})
          })
        })
      }
    } catch (err) {
      console.error("Error updating cell:", err)
      setError(err instanceof Error ? err : new Error("Failed to update cell"))
    }
  }, [budgetData, calculateDerivedValues, checkBackendConnection])

  // Add new row with backend sync
  const addRow = useCallback(async (sectionId: string, newRow: {
    category?: string
    employee?: string
    monthlyCost?: number
  }) => {
    try {
      const monthlyCost = Number(newRow.monthlyCost) || 0
      const derived = calculateDerivedValues(monthlyCost)
      const newItem = {
        id: uuidv4(),
        srNo: 0, // Will be updated below
        category: newRow.category || "",
        employee: newRow.employee || "",
        monthlyCost,
        ...derived
      }

      setBudgetData(prevData => {
        const sectionIndex = prevData.findIndex(s => s.id === sectionId)
        if (sectionIndex === -1) throw new Error("Section not found")

        const newData = [...prevData]
        const section = { ...newData[sectionIndex] }
        
        newItem.srNo = section.items.length + 1
        section.items = [...section.items, newItem]
        newData[sectionIndex] = section
        return newData
      })

      // Add item to backend
      const isBackendAvailable = await checkBackendConnection()
      if (isBackendAvailable) {
        await fetch(`${API_URL}/budget/section/${sectionId}/item`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem)
        })
      }
    } catch (err) {
      console.error("Error adding row:", err)
      setError(err instanceof Error ? err : new Error("Failed to add row"))
    }
  }, [calculateDerivedValues, checkBackendConnection])

  // Add new column
  const addColumn = useCallback(async (columnId: string, columnName: string) => {
    try {
      if (columns.some(c => c.id === columnId)) {
        throw new Error("Column ID already exists")
      }

      setColumns(prev => [...prev, { id: columnId, name: columnName }])
      setBudgetData(prev => prev.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          [columnId]: 0
        }))
      })))

      // Sync entire budget since we're changing structure
      setTimeout(() => submitData(), 100)
    } catch (err) {
      console.error("Error adding column:", err)
      setError(err instanceof Error ? err : new Error("Failed to add column"))
    }
  }, [columns, submitData])

  // Add new section with backend sync
  const addSection = useCallback(async (sectionName: string) => {
    try {
      const newSection = {
        id: uuidv4(),
        name: sectionName,
        items: []
      }

      setBudgetData(prev => [...prev, newSection])

      // Add section to backend
      const isBackendAvailable = await checkBackendConnection()
      if (isBackendAvailable) {
        await fetch(`${API_URL}/budget/section`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSection)
        })
      }
    } catch (err) {
      console.error("Error adding section:", err)
      setError(err instanceof Error ? err : new Error("Failed to add section"))
    }
  }, [checkBackendConnection])

  // Remove row with backend sync
  const removeRow = useCallback(async (sectionIndex: number, itemIndex: number) => {
    try {
      if (!window.confirm("Are you sure you want to remove this row?")) return

      const section = budgetData[sectionIndex]
      const item = section.items[itemIndex]

      setBudgetData(prev => {
        const newData = [...prev]
        newData[sectionIndex] = {
          ...newData[sectionIndex],
          items: newData[sectionIndex].items
            .filter((_, i) => i !== itemIndex)
            .map((item, i) => ({ ...item, srNo: i + 1 }))
        }
        return newData
      })

      // Remove item from backend
      const isBackendAvailable = await checkBackendConnection()
      if (isBackendAvailable) {
        await fetch(`${API_URL}/budget/section/${section.id}/item/${item.id}`, {
          method: "DELETE"
        })
      }
    } catch (err) {
      console.error("Error removing row:", err)
      setError(err instanceof Error ? err : new Error("Failed to remove row"))
    }
  }, [budgetData, checkBackendConnection])

  // Remove section with backend sync
  const removeSection = useCallback(async (sectionIndex: number) => {
    try {
      if (!window.confirm("Are you sure you want to remove this entire section?")) return
      
      const section = budgetData[sectionIndex]
      
      setBudgetData(prev => prev.filter((_, i) => i !== sectionIndex))

      // Remove section from backend
      const isBackendAvailable = await checkBackendConnection()
      if (isBackendAvailable) {
        await fetch(`${API_URL}/budget/section/${section.id}`, {
          method: "DELETE"
        })
      }
    } catch (err) {
      console.error("Error removing section:", err)
      setError(err instanceof Error ? err : new Error("Failed to remove section"))
    }
  }, [budgetData, checkBackendConnection])

  // Remove column
  const removeColumn = useCallback(async (columnId: string) => {
    try {
      const coreColumns = ["monthlyCost", "quarterlyCost", "halfYearlyCost", "annualCost"]
      if (coreColumns.includes(columnId)) {
        throw new Error("Cannot remove core columns")
      }

      if (!window.confirm(`Are you sure you want to remove column ${columnId}?`)) return

      setColumns(prev => prev.filter(c => c.id !== columnId))
      setBudgetData(prev => prev.map(section => ({
        ...section,
        items: section.items.map(item => {
          const newItem = { ...item }
          delete newItem[columnId]
          return newItem
        })
      })))

      // Sync entire budget since we're changing structure
      setTimeout(() => submitData(), 100)
    } catch (err) {
      console.error("Error removing column:", err)
      setError(err instanceof Error ? err : new Error("Failed to remove column"))
    }
  }, [submitData])

  // Retry connection
  const retryConnection = useCallback(async () => {
    try {
      const isAvailable = await checkBackendConnection()
      if (isAvailable) {
        await fetchBudgetData()
        setError(null)
      }
      return isAvailable
    } catch (err) {
      console.error("Retry connection error:", err)
      return false
    }
  }, [checkBackendConnection, fetchBudgetData])

  const contextValue = {
    budgetData,
    columns,
    currentMonth,
    loading,
    error,
    submitStatus,
    updateCellValue,
    addRow,
    addColumn,
    addSection,
    removeRow,
    removeSection,
    removeColumn,
    setCurrentMonth,
    submitData,
    retryConnection,
  }

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBudget() {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider")
  }
  return context
}