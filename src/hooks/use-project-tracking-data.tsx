"use client"

import { useState, useEffect, useCallback, createContext, useContext, useMemo, useRef } from "react"
import type { ProjectTrackingItem } from "../types/project-tracking"

export type SubmitStatus = "idle" | "loading" | "success" | "error";

export type ProjectTrackingTotals = {
  salary: number
  daysInvolved: number
  hoursDays: number
  perDayAmount: number
  investDayAmount: number
  perHrsAmount: number
  projectCost: number
  collectAmount: number
  pendingAmount: number
  profitForProject: number
}

interface ProjectTrackingContextType {
  projectTrackingData: ProjectTrackingItem[]
  totals: ProjectTrackingTotals
  loading: boolean
  error: Error | null
  submitStatus: SubmitStatus
  editingCell: { itemIndex: number; columnId: string } | null
  updateCellValue: (
    itemIndex: number,
    columnId: keyof ProjectTrackingItem,
    value: string | number
  ) => Promise<void>
  addRow: (newItem?: Partial<ProjectTrackingItem>) => Promise<void>
  removeRow: (itemIndex: number) => Promise<void>
  startEditing: (itemIndex: number, columnId: string) => void
  stopEditing: () => void
  submitData: () => Promise<void>
  retryConnection: () => Promise<boolean>
  calculateTotals: () => ProjectTrackingTotals
}

const ProjectTrackingContext = createContext<ProjectTrackingContextType | undefined>(undefined)

const API_URL = "http://localhost:5000/api"

function useDebounce<T extends (...args: unknown[]) => unknown>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

export function ProjectTrackingProvider({ children }: { children: React.ReactNode }) {
  const [projectTrackingData, setProjectTrackingData] = useState<ProjectTrackingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")
  const [editingCell, setEditingCell] = useState<{ itemIndex: number; columnId: string } | null>(null)
  
  const updateQueueRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const checkBackendConnection = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${API_URL}/project-tracking/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }, [])

  const dateParseCache = useRef<Map<string, Date | null>>(new Map())
  
  const parseDateDDMMYYYY = useCallback((dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    if (dateParseCache.current.has(dateStr)) {
      return dateParseCache.current.get(dateStr)!;
    }
    
    if (dateStr.trim() === '') {
      dateParseCache.current.set(dateStr, null);
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        dateParseCache.current.set(dateStr, date);
        return date;
      }
    }

    const parts = dateStr.trim().split("/");
    if (parts.length !== 3) {
      dateParseCache.current.set(dateStr, null);
      return null;
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      dateParseCache.current.set(dateStr, null);
      return null;
    }
    
    const date = new Date(year, month - 1, day);
    
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      dateParseCache.current.set(dateStr, null);
      return null;
    }
    
    dateParseCache.current.set(dateStr, date);
    return date;
  }, []);

  const calculationCache = useRef<Map<string, {
    daysInvolved: number
    perDayAmount: number
    investDayAmount: number
    perHrsAmount: number
    hoursDays: number
    pendingAmount: number
    profitForProject: number
  }>>(new Map())
  
  const calculateItemFields = useCallback((item: Partial<ProjectTrackingItem>) => {
    const cacheKey = JSON.stringify({
      salary: item.salary,
      startDate: item.startDate,
      endedDate: item.endedDate,
      resources: item.resources,
      projectCost: item.projectCost,
      collectAmount: item.collectAmount
    })
    
    if (calculationCache.current.has(cacheKey)) {
      return calculationCache.current.get(cacheKey)
    }
    
    const salary = Number(item.salary) || 0
    const projectCost = Number(item.projectCost) || 0
    const collectAmount = Number(item.collectAmount) || 0
    const resources = Number(item.resources) || 1

    let daysInvolved = 0
    const start = parseDateDDMMYYYY(item.startDate || "")
    const end = parseDateDDMMYYYY(item.endedDate || "")

    if (start && end && end >= start) {
      const timeDiff = end.getTime() - start.getTime()
      daysInvolved = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1
    }

    const perDayAmount = salary / 30 || 0
    const investDayAmount = perDayAmount * daysInvolved
    const hoursDays = daysInvolved * 8 * resources
    const perHrsAmount = parseFloat(((perDayAmount / 8) * resources).toFixed(2))
    const pendingAmount = projectCost - collectAmount
    const profitForProject = collectAmount - investDayAmount

    const result = {
      daysInvolved,
      perDayAmount: parseFloat(perDayAmount.toFixed(2)),
      investDayAmount: parseFloat(investDayAmount.toFixed(2)),
      perHrsAmount,
      hoursDays,
      pendingAmount: parseFloat(pendingAmount.toFixed(2)),
      profitForProject: parseFloat(profitForProject.toFixed(2)),
    }
    
    calculationCache.current.set(cacheKey, result)
    return result
  }, [parseDateDDMMYYYY])

  const totals = useMemo((): ProjectTrackingTotals => {
    return projectTrackingData.reduce(
      (acc, item) => ({
        salary: acc.salary + (Number(item.salary) || 0),
        daysInvolved: acc.daysInvolved + (Number(item.daysInvolved) || 0),
        hoursDays: acc.hoursDays + (Number(item.hoursDays) || 0),
        perDayAmount: acc.perDayAmount + (Number(item.perDayAmount) || 0),
        investDayAmount: acc.investDayAmount + (Number(item.investDayAmount) || 0),
        perHrsAmount: acc.perHrsAmount + (Number(item.perHrsAmount) || 0),
        projectCost: acc.projectCost + (Number(item.projectCost) || 0),
        collectAmount: acc.collectAmount + (Number(item.collectAmount) || 0),
        pendingAmount: acc.pendingAmount + (Number(item.pendingAmount) || 0),
        profitForProject: acc.profitForProject + (Number(item.profitForProject) || 0),
      }),
      {
        salary: 0,
        daysInvolved: 0,
        hoursDays: 0,
        perDayAmount: 0,
        investDayAmount: 0,
        perHrsAmount: 0,
        projectCost: 0,
        collectAmount: 0,
        pendingAmount: 0,
        profitForProject: 0,
      }
    )
  }, [projectTrackingData])

  const calculateTotals = useCallback(() => totals, [totals])

  const fetchProjectTrackingData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const isBackendAvailable = await checkBackendConnection()
      
      if (isBackendAvailable) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(`${API_URL}/project-tracking`, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            const processData = () => {
              const calculatedData = data.map(item => ({
                ...item,
                ...calculateItemFields(item)
              }))
              setProjectTrackingData(calculatedData)
              try {
                localStorage.setItem("projectTrackingData", JSON.stringify(calculatedData))
              } catch (e) {
                console.warn("Failed to save to localStorage:", e)
              }
            }
            
            if (window.requestIdleCallback) {
              window.requestIdleCallback(processData)
            } else {
              setTimeout(processData, 0)
            }
            return
          }
        }
      }

      const storedData = localStorage.getItem("projectTrackingData")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        const calculatedData = parsedData.map((item: ProjectTrackingItem) => ({
          ...item,
          ...calculateItemFields(item)
        }))
        setProjectTrackingData(calculatedData)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err instanceof Error ? err : new Error("Failed to load project tracking data"))
        console.error("Error loading project tracking data:", err)
      }
      
      try {
        const storedData = localStorage.getItem("projectTrackingData")
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          const calculatedData = parsedData.map((item: ProjectTrackingItem) => ({
            ...item,
            ...calculateItemFields(item)
          }))
          setProjectTrackingData(calculatedData)
        }
      } catch (e) {
        console.warn("Failed to load from localStorage:", e)
      }
    } finally {
      setLoading(false)
    }
  }, [checkBackendConnection, calculateItemFields])

  useEffect(() => {
    fetchProjectTrackingData()
  }, [fetchProjectTrackingData])

  const debouncedSave = useDebounce(
    ((data: ProjectTrackingItem[]) => {
      try {
        localStorage.setItem("projectTrackingData", JSON.stringify(data))
      } catch (e) {
        console.warn("Failed to save to localStorage:", e)
      }
    }) as (...args: unknown[]) => unknown,
    1000
  )

  useEffect(() => {
    if (!loading && projectTrackingData.length > 0) {
      debouncedSave(projectTrackingData)
    }
  }, [projectTrackingData, loading, debouncedSave])

  const debouncedBackendSync = useDebounce(
    (async (item: ProjectTrackingItem, operation: 'update' | 'add' | 'delete') => {
      try {
        const isBackendAvailable = await checkBackendConnection()
        if (!isBackendAvailable) return

        let response: Response
        
        switch (operation) {
          case 'update':
            response = await fetch(`${API_URL}/project-tracking/${item._id || item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item)
            })
            break
          case 'add':
            response = await fetch(`${API_URL}/project-tracking/item`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item)
            })
            
            if (response.ok) {
              const result = await response.json()
              const newItem = result.data
              
              setProjectTrackingData(prevData => {
                return prevData.map(existingItem => 
                  existingItem._id === item._id ? newItem : existingItem
                )
              })
            }
            break
          case 'delete':
            response = await fetch(`${API_URL}/project-tracking/${item._id || item.id}`, {
              method: "DELETE"
            })
            break
        }

        if (!response.ok) {
          throw new Error(`Failed to ${operation} item on server`)
        }
      } catch (err) {
        console.error(`Error syncing ${operation}:`, err)
      }
    }) as (...args: unknown[]) => unknown,
    500
  )

  const submitData = useCallback(async () => {
    setSubmitStatus("loading")
    
    try {
      const isBackendAvailable = await checkBackendConnection()
      
      if (!isBackendAvailable) {
        throw new Error("Backend is not available")
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${API_URL}/project-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectTrackingData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || response.statusText)
      }
      
      setSubmitStatus("success")
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setSubmitStatus("error")
        setError(err instanceof Error ? err : new Error("Failed to save data"))
        console.error("Submit error:", err)
      }
    } finally {
      setTimeout(() => setSubmitStatus("idle"), 3000)
    }
  }, [projectTrackingData, checkBackendConnection])

  const updateCellValue = useCallback(async (
    itemIndex: number,
    columnId: keyof ProjectTrackingItem,
    value: string | number
  ) => {
    try {
      setProjectTrackingData(prevData => {
        const newData = [...prevData]
        
        if (itemIndex < 0 || itemIndex >= newData.length) {
          throw new Error("Invalid item index")
        }

        const item = { ...newData[itemIndex] }
        
        if (columnId in item) {
          if (columnId === 'startDate' || columnId === 'endedDate') {
            if (typeof value === 'string') {
              const parsedDate = parseDateDDMMYYYY(value.trim());
              if (parsedDate || value.trim() === '') {
                item[columnId] = value as never;
              } else {
                throw new Error(`Invalid date format for ${columnId}: ${value}. Expected DD/MM/YYYY format.`)
              }
            } else {
              item[columnId] = value as never;
            }
          } else {
            item[columnId] = value as never;
          }
        }

        const inputFields = ["salary", "startDate", "endedDate", "resources", "projectCost", "collectAmount"]
        if (inputFields.includes(columnId)) {
          const calculatedFields = calculateItemFields(item)
          Object.assign(item, calculatedFields)
        }

        newData[itemIndex] = item
        return newData
      })

      const item = projectTrackingData[itemIndex]
      const updatedItem = {
        ...item,
        [columnId]: value,
      }
      
      const calculatedFields = calculateItemFields(updatedItem)
      const finalItem = { ...updatedItem, ...calculatedFields }
      
      debouncedBackendSync(finalItem, 'update')
      
    } catch (err) {
      console.error("Error updating cell:", err)
      setError(err instanceof Error ? err : new Error("Failed to update cell"))
      throw err
    }
  }, [projectTrackingData, calculateItemFields, parseDateDDMMYYYY, debouncedBackendSync])

  const addRow = useCallback(async (newItem: Partial<ProjectTrackingItem> = {}) => {
    const tempId = `temp_${Date.now()}`;
    try {
      // Ensure required fields are present
      const defaultItem: ProjectTrackingItem = {
        _id: tempId,
        slNo: 0,
        projectWork: newItem.projectWork || "New Project",
        uiUx: newItem.uiUx || "",
        devName: newItem.devName || "New Developer",
        docStatus: newItem.docStatus || "In Progress",
        startDate: newItem.startDate || "",
        endedDate: newItem.endedDate || "",
        resources: newItem.resources || "",
        salary: newItem.salary || 0,
        daysInvolved: newItem.daysInvolved || 0,
        hoursDays: newItem.hoursDays || 0,
        perDayAmount: newItem.perDayAmount || 0,
        investDayAmount: newItem.investDayAmount || 0,
        perHrsAmount: newItem.perHrsAmount || 0,
        projectCost: newItem.projectCost || 0,
        collectAmount: newItem.collectAmount || 0,
        pendingAmount: newItem.pendingAmount || 0,
        profitForProject: newItem.profitForProject || 0,
      }

      // Validate required fields
      if (!defaultItem.projectWork.trim() || !defaultItem.devName.trim()) {
        throw new Error("Missing required fields: projectWork and devName are required");
      }

      const calculatedFields = calculateItemFields(defaultItem)
      const finalItem = { ...defaultItem, ...calculatedFields }

      // Log the item being sent
      console.log("Adding new item:", JSON.stringify(finalItem, null, 2));

      // Optimistic update
      setProjectTrackingData(prevData => {
        const newData = [...prevData]
        finalItem.slNo = newData.length + 1
        newData.push(finalItem)
        return newData
      })

      // Sync with backend
      const isBackendAvailable = await checkBackendConnection()
      if (!isBackendAvailable) {
        console.warn("Backend not available, keeping optimistic update");
        return; // Keep optimistic update
      }

      const response = await fetch(`${API_URL}/project-tracking/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalItem)
      })

      // Log raw response
      console.log("POST response status:", response.status);
      const responseData = await response.json();
      console.log("POST response data:", JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to add project: ${response.statusText}`);
      }

      // Handle response flexibly
      let savedItem: ProjectTrackingItem;
      if (responseData.success && responseData.data) {
        savedItem = responseData.data;
      } else if (responseData._id) {
        // Fallback for unexpected response format
        savedItem = responseData;
        console.warn("Unexpected response format, using raw response as saved item");
      } else {
        console.error("Invalid response format, triggering data refresh");
        await fetchProjectTrackingData(); // Fallback: refresh data
        return; // Keep optimistic update
      }

      // Update _id
      setProjectTrackingData(prevData => {
        return prevData.map(item => 
          item._id === tempId ? { ...item, _id: savedItem._id.toString() } : item
        )
      })

    } catch (err) {
      console.error("Error adding row:", err);
      setError(err instanceof Error ? err : new Error(err.message || "Failed to add project"));
      // Keep optimistic update and refresh data
      console.warn("Keeping optimistic update due to error, refreshing data");
      await fetchProjectTrackingData();
      throw err;
    }
  }, [calculateItemFields, checkBackendConnection, fetchProjectTrackingData])

  const removeRow = useCallback(async (itemIndex: number) => {
    try {
      if (!window.confirm("Are you sure you want to remove this project?")) return

      const item = projectTrackingData[itemIndex]
      
      setProjectTrackingData(prevData => {
        const newData = [...prevData]
        newData.splice(itemIndex, 1)
        return newData.map((item, index) => ({ ...item, slNo: index + 1 }))
      })

      debouncedBackendSync(item, 'delete')
      
    } catch (err) {
      console.error("Error removing row:", err)
      setError(err instanceof Error ? err : new Error("Failed to remove row"))
      throw err
    }
  }, [projectTrackingData, debouncedBackendSync])

  const startEditing = useCallback((itemIndex: number, columnId: string) => {
    const calculatedFields = ["slNo", "daysInvolved", "perDayAmount", "investDayAmount", "perHrsAmount", "hoursDays", "pendingAmount", "profitForProject"]
    if (!calculatedFields.includes(columnId)) {
      setEditingCell({ itemIndex, columnId })
    }
  }, [])

  const stopEditing = useCallback(() => {
    setEditingCell(null)
  }, [])

  const retryConnection = useCallback(async () => {
    try {
      const isAvailable = await checkBackendConnection()
      if (isAvailable) {
        await fetchProjectTrackingData()
        setError(null)
      }
      return isAvailable
    } catch (err) {
      console.error("Retry connection error:", err)
      return false
    }
  }, [checkBackendConnection, fetchProjectTrackingData])

  useEffect(() => {
    const updateQueue = updateQueueRef.current;
    const dateCache = dateParseCache.current;
    const calcCache = calculationCache.current;
    return () => {
      updateQueue.forEach(timeout => clearTimeout(timeout))
      updateQueue.clear()
      
      dateCache.clear()
      calcCache.clear()
    }
  }, [])

  const contextValue = useMemo(() => ({
    projectTrackingData,
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
    retryConnection,
    calculateTotals,
  }), [
    projectTrackingData,
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
    retryConnection,
    calculateTotals,
  ])

  return (
    <ProjectTrackingContext.Provider value={contextValue}>
      {children}
    </ProjectTrackingContext.Provider>
  )
}

export function useProjectTracking() {
  const context = useContext(ProjectTrackingContext)
  if (context === undefined) {
    throw new Error("useProjectTracking must be used within a ProjectTrackingProvider")
  }
  return context
}