"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"

// Type definition for subscription revenue item
export interface SubscriptionRevenueItem {
  id: string
  revenueSource: string
  subscriptionsAvailed: number
  projectedMonthlyRevenue: number
  projectedAnnualRevenue: number
  subscribed: number
  profit: number
}

type SubmitStatus = "idle" | "loading" | "success" | "error"

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

interface SubscriptionRevenueContextType {
  subscriptionData: SubscriptionRevenueItem[]
  totals: SubscriptionRevenueTotals
  loading: boolean
  error: Error | null
  submitStatus: SubmitStatus
  addItem: (item: Partial<SubscriptionRevenueItem>) => Promise<void>
  addRow: () => Promise<void> // Alias for table component
  updateItem: (id: string, updates: Partial<SubscriptionRevenueItem>) => Promise<void>
  updateItemByIndex: (rowIndex: number, columnId: keyof SubscriptionRevenueItem, value: string | number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  removeRow: (rowIndex: number) => Promise<void> // Alias for table component
  submitData: () => Promise<void>
}

interface SubscriptionRevenueTotals {
  subscriptionsAvailed: number
  projectedMonthlyRevenue: number
  projectedAnnualRevenue: number
  profit: number
  subscribed: number
}

const SubscriptionRevenueContext = createContext<SubscriptionRevenueContextType | undefined>(undefined)
const API_URL = "http://localhost:5000/api"

export function SubscriptionRevenueProvider({ children }: { children: React.ReactNode }) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionRevenueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")

  // Calculate totals
  const calculateTotals = useCallback(() => {
    return subscriptionData.reduce(
      (acc, item) => ({
        subscriptionsAvailed: acc.subscriptionsAvailed + (Number(item.subscriptionsAvailed) || 0),
        projectedMonthlyRevenue: acc.projectedMonthlyRevenue + (Number(item.projectedMonthlyRevenue) || 0),
        projectedAnnualRevenue: acc.projectedAnnualRevenue + (Number(item.projectedAnnualRevenue) || 0),
        profit: acc.profit + (Number(item.profit) || 0),
        subscribed: acc.subscribed + (Number(item.subscribed) || 0),
      }),
      { subscriptionsAvailed: 0, projectedMonthlyRevenue: 0, projectedAnnualRevenue: 0, profit: 0, subscribed: 0 }
    )
  }, [subscriptionData])

  const totals = calculateTotals()

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/subscription-revenue`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      // Handle both flat array and nested structure
      const items = Array.isArray(data) ? data : (data.items || [])
      setSubscriptionData(items)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load data"))
      // Set empty array on error so table can still function
      setSubscriptionData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // CRUD Operations
  const addItem = useCallback(async (item: Partial<SubscriptionRevenueItem>) => {
    try {
      const newItem: SubscriptionRevenueItem = {
        id: generateId(),
        revenueSource: item.revenueSource || "New Revenue Source",
        subscriptionsAvailed: Number(item.subscriptionsAvailed) || 0,
        projectedMonthlyRevenue: Number(item.projectedMonthlyRevenue) || 0,
        projectedAnnualRevenue: Number(item.projectedAnnualRevenue) || (Number(item.projectedMonthlyRevenue) || 0) * 12,
        subscribed: Number(item.subscribed) || 0,
        profit: Number(item.profit) || 0,
      }

      const response = await fetch(`${API_URL}/subscription-revenue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      })

      if (!response.ok) throw new Error("Failed to add item")
      
      // Update local state immediately for better UX
      setSubscriptionData(prev => [...prev, newItem])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add item"))
      throw err
    }
  }, [])

  // Alias for table component
  const addRow = useCallback(async () => {
    await addItem({})
  }, [addItem])

  const updateItem = useCallback(async (id: string, updates: Partial<SubscriptionRevenueItem>) => {
    try {
      // Auto-calculate annual revenue if monthly revenue is updated
      if (updates.projectedMonthlyRevenue !== undefined) {
        updates.projectedAnnualRevenue = Number(updates.projectedMonthlyRevenue) * 12
      }

      const response = await fetch(`${API_URL}/subscription-revenue/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error("Failed to update item")
      
      setSubscriptionData(prev =>
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update item"))
      throw err
    }
  }, [])

  // Helper function for table component to update by row index
  const updateItemByIndex = useCallback(async (
    rowIndex: number, 
    columnId: keyof SubscriptionRevenueItem, 
    value: string | number
  ) => {
    const item = subscriptionData[rowIndex]
    if (!item) throw new Error("Item not found")
    
    await updateItem(item.id, { [columnId]: value })
  }, [subscriptionData, updateItem])

  const removeItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/subscription-revenue/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete item")
      
      setSubscriptionData(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete item"))
      throw err
    }
  }, [])

  // Alias for table component
  const removeRow = useCallback(async (rowIndex: number) => {
    const item = subscriptionData[rowIndex]
    if (!item) throw new Error("Item not found")
    
    await removeItem(item.id)
  }, [subscriptionData, removeItem])

  const submitData = useCallback(async () => {
    setSubmitStatus("loading")
    try {
      const response = await fetch(`${API_URL}/subscription-revenue/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: subscriptionData })
      })

      if (!response.ok) throw new Error("Failed to save data")
      setSubmitStatus("success")
    } catch (err) {
      setSubmitStatus("error")
      setError(err instanceof Error ? err : new Error("Failed to save data"))
    } finally {
      setTimeout(() => setSubmitStatus("idle"), 3000)
    }
  }, [subscriptionData])

  // Initial load
  useEffect(() => { 
    fetchData() 
  }, [fetchData])

  const contextValue = {
    subscriptionData,
    totals,
    loading,
    error,
    submitStatus,
    addItem,
    addRow,
    updateItem,
    updateItemByIndex,
    removeItem,
    removeRow,
    submitData
  }

  return (
    <SubscriptionRevenueContext.Provider value={contextValue}>
      {children}
    </SubscriptionRevenueContext.Provider>
  )
}

export function useSubscriptionRevenue() {
  const context = useContext(SubscriptionRevenueContext)
  if (!context) throw new Error("useSubscriptionRevenue must be used within a SubscriptionRevenueProvider")
  return context
}