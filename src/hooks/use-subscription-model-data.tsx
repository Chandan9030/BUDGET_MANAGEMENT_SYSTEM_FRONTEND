"use client"

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react"

export interface SubscriptionModelItem {
  id: string | null
  solpType: string
  revenueSource: string
  subscriptionsAvailed: number
  projectedMonthlyRevenue: number
  projectedAnnualRevenue: number
  subscribed: number
  profit: number
  getSubscriptionDate: number
}

type SubmitStatus = "idle" | "loading" | "success" | "error"

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

interface SubscriptionModelContextType {
  modelData: SubscriptionModelItem[]
  totals: {
    subscriptionsAvailed: number
    projectedMonthlyRevenue: number
    projectedAnnualRevenue: number
    subscribed: number
    profit: number
  }
  loading: boolean
  error: Error | null
  submitStatus: SubmitStatus
  addItem: (item?: Partial<SubscriptionModelItem>) => Promise<void>
  addRow: () => Promise<void>
  updateItem: (id: string | null, updates: Partial<SubscriptionModelItem>) => Promise<void>
  updateItemByIndex: (rowIndex: number, columnId: keyof SubscriptionModelItem, value: string | number) => Promise<void>
  removeItem: (id: string | null) => Promise<void>
  removeRow: (rowIndex: number) => Promise<void>
  submitData: () => Promise<void>
}

const SubscriptionModelContext = createContext<SubscriptionModelContextType | undefined>(undefined)
const API_URL = "http://localhost:5000/api"

export function SubscriptionModelProvider({ children }: { children: ReactNode }) {
  const [modelData, setModelData] = useState<SubscriptionModelItem[]>([])
  const [totals, setTotals] = useState({
    subscriptionsAvailed: 0,
    projectedMonthlyRevenue: 0,
    projectedAnnualRevenue: 0,
    subscribed: 0,
    profit: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")

  // Calculate totals whenever modelData changes
  useEffect(() => {
    const newTotals = modelData.reduce((acc, item) => {
      return {
        subscriptionsAvailed: acc.subscriptionsAvailed + (item.subscriptionsAvailed || 0),
        projectedMonthlyRevenue: acc.projectedMonthlyRevenue + (item.projectedMonthlyRevenue || 0),
        projectedAnnualRevenue: acc.projectedAnnualRevenue + (item.projectedAnnualRevenue || 0),
        subscribed: acc.subscribed + (item.subscribed || 0),
        profit: acc.profit + (item.profit || 0)
      }
    }, {
      subscriptionsAvailed: 0,
      projectedMonthlyRevenue: 0,
      projectedAnnualRevenue: 0,
      subscribed: 0,
      profit: 0
    })

    setTotals(newTotals)
  }, [modelData])

  // Fetch model data
const fetchData = useCallback(async () => {
  setLoading(true)
  setError(null)
  try {
    const response = await fetch(`${API_URL}/subscription-model`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    // Handle array of objects with items arrays
    const items = Array.isArray(data) 
      ? data.flatMap(item => item.items || []) 
      : []
    
    setModelData(items)
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Failed to load subscription model"))
    setModelData([])
  } finally {
    setLoading(false)
  }
}, [])

const addItem = useCallback(async (item: Partial<SubscriptionModelItem> = {}) => {
  try {
    const newItem: SubscriptionModelItem = {
      id: generateId(),
      solpType: item.solpType || "Online",
      revenueSource: item.revenueSource || "New Plan",
      subscriptionsAvailed: item.subscriptionsAvailed || 0,
      projectedMonthlyRevenue: item.projectedMonthlyRevenue || 0,
      projectedAnnualRevenue: item.projectedAnnualRevenue || 0,
      subscribed: item.subscribed || 0,
      profit: item.profit || 0,
      getSubscriptionDate: item.getSubscriptionDate || Date.now()
    }

    const response = await fetch(`${API_URL}/subscription-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [newItem] }) // Match the expected API format
    })

    if (!response.ok) throw new Error("Failed to add subscription model item")

    setModelData(prev => [...prev, newItem])
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Failed to add item"))
    throw err
  }
}, [])

  const addRow = useCallback(async () => {
    await addItem()
  }, [addItem])

const updateItem = useCallback(async (id: string | null, updates: Partial<SubscriptionModelItem>) => {
  try {
    if (!id) throw new Error("Cannot update item without ID")

    const response = await fetch(`${API_URL}/subscription-model/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    })

    if (!response.ok) throw new Error("Failed to update item")

    setModelData(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    )
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Failed to update item"))
    throw err
  }
}, [])

  const updateItemByIndex = useCallback(async (
    rowIndex: number,
    columnId: keyof SubscriptionModelItem,
    value: string | number
  ) => {
    const item = modelData[rowIndex]
    if (!item) throw new Error("Item not found")

    await updateItem(item.id, { [columnId]: value })
  }, [modelData, updateItem])

  const removeItem = useCallback(async (id: string | null) => {
    try {
      if (!id) throw new Error("Cannot remove item without ID")

      const response = await fetch(`${API_URL}/subscription-model/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete item")

      setModelData(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to delete item"))
      throw err
    }
  }, [])

  const removeRow = useCallback(async (rowIndex: number) => {
    const item = modelData[rowIndex]
    if (!item) throw new Error("Item not found")
    await removeItem(item.id)
  }, [modelData, removeItem])

const submitData = useCallback(async () => {
  setSubmitStatus("loading")
  try {
    const response = await fetch(`${API_URL}/subscription-model/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: modelData }) // Match the expected API format
    })

    if (!response.ok) throw new Error("Failed to save model data")

    setSubmitStatus("success")
  } catch (err) {
    setSubmitStatus("error")
    setError(err instanceof Error ? err : new Error("Failed to submit data"))
  } finally {
    setTimeout(() => setSubmitStatus("idle"), 3000)
  }
}, [modelData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const contextValue = {
    modelData,
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
    <SubscriptionModelContext.Provider value={contextValue}>
      {children}
    </SubscriptionModelContext.Provider>
  )
}

export function useSubscriptionModel() {
  const context = useContext(SubscriptionModelContext)
  if (!context) throw new Error("useSubscriptionModel must be used within a SubscriptionModelProvider")
  return context
}