"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { v4 as uuidv4 } from "uuid"
import type { ProjectItem, ProjectTotals, SubmitStatus } from "../types/project"

interface ProjectContextType {
  projectData: ProjectItem[]
  totals: ProjectTotals
  loading: boolean
  error: Error | null
  submitStatus: SubmitStatus
  editingCell: { itemIndex: number; columnId: string } | null
  updateCellValue: (
    itemIndex: number,
    columnId: keyof ProjectItem,
    value: string | number
  ) => Promise<void>
  addRow: (newItem?: Partial<ProjectItem>) => Promise<void>
  removeRow: (itemIndex: number) => Promise<void>
  startEditing: (itemIndex: number, columnId: string) => void
  stopEditing: () => void
  submitData: () => Promise<void>
  retryConnection: () => Promise<boolean>
  calculateTotals: () => ProjectTotals
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

const API_URL = "http://localhost:5000/api"

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectData, setProjectData] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")
  const [editingCell, setEditingCell] = useState<{ itemIndex: number; columnId: string } | null>(null)

  // Check backend connection
  const checkBackendConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/projects/health`, {
        method: 'GET',
        cache: 'no-store'
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  // Calculate totals
  const calculateTotals = useCallback((): ProjectTotals => {
    return projectData.reduce(
      (acc, item) => ({
        dev: acc.dev + (Number(item.dev) || 0),
        extra: acc.extra + (Number(item.extra) || 0),
        invest: acc.invest + (Number(item.invest) || 0),
        gettingAmount: acc.gettingAmount + (Number(item.gettingAmount) || 0),
        yetToBeRecovered: acc.yetToBeRecovered + (Number(item.yetToBeRecovered) || 0),
      }),
      { dev: 0, extra: 0, invest: 0, gettingAmount: 0, yetToBeRecovered: 0 }
    )
  }, [projectData])

  const totals = calculateTotals()

  // Calculate yetToBeRecovered for an item
  const calculateYetToBeRecovered = useCallback((item: Partial<ProjectItem>) => {
    const dev = Number(item.dev) || 0
    const extra = Number(item.extra) || 0
    const invest = Number(item.invest) || 0
    const gettingAmount = Number(item.gettingAmount) || 0
    return dev + extra + invest - gettingAmount
  }, [])

  // Fetch project data from backend
  const fetchProjectData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const isBackendAvailable = await checkBackendConnection()
      
      if (isBackendAvailable) {
        const response = await fetch(`${API_URL}/projects`, {
          headers: { 'Accept': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            // Map _id to id for frontend compatibility
            const mappedData = data.map((item: any) => ({
              ...item,
              id: item._id.toString(), // Ensure _id is a string
              srNo: item.srNo || 0,
              projectName: item.projectName || "",
              status: item.status || "",
              dev: item.dev || 0,
              extra: item.extra || 0,
              invest: item.invest || 0,
              gettingAmount: item.gettingAmount || 0,
              yetToBeRecovered: item.yetToBeRecovered || 0,
            }))
            setProjectData(mappedData)
            localStorage.setItem("projectData", JSON.stringify(mappedData))
            return
          }
        }
        throw new Error("Failed to fetch projects from backend")
      }

      // Fallback to localStorage if backend fails
      const storedData = localStorage.getItem("projectData")
      if (storedData) {
        setProjectData(JSON.parse(storedData))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load project data"))
      console.error("Error loading project data:", err)
      
      // Try to load from localStorage as last resort
      const storedData = localStorage.getItem("projectData")
      if (storedData) {
        setProjectData(JSON.parse(storedData))
      }
    } finally {
      setLoading(false)
    }
  }, [checkBackendConnection])

  // Initial data load
  useEffect(() => {
    fetchProjectData()
  }, [fetchProjectData])

  // Save data to localStorage when it changes
  useEffect(() => {
    if (!loading && projectData.length > 0) {
      localStorage.setItem("projectData", JSON.stringify(projectData))
    }
  }, [projectData, loading])

  // Submit entire project data to backend
  const submitData = useCallback(async () => {
    setSubmitStatus("loading")
    
    try {
      const isBackendAvailable = await checkBackendConnection()
      
      if (!isBackendAvailable) {
        throw new Error("Backend is not available")
      }

      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData.map(item => ({
          ...item,
          // Exclude id to let backend generate _id
          _id: undefined,
        })))
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || response.statusText)
      }
      
      setSubmitStatus("success")
      setError(null)
      await fetchProjectData() // Refresh data after submit
    } catch (err) {
      setSubmitStatus("error")
      setError(err instanceof Error ? err : new Error("Failed to save data"))
      console.error("Submit error:", err)
    } finally {
      setTimeout(() => setSubmitStatus("idle"), 3000)
    }
  }, [projectData, checkBackendConnection, fetchProjectData])

  // Update cell value with optimized backend sync
  const updateCellValue = useCallback(async (
    itemIndex: number,
    columnId: keyof ProjectItem,
    value: string | number
  ) => {
    try {
      let updatedItem: ProjectItem | null = null;
      setProjectData(prevData => {
        if (itemIndex < 0 || itemIndex >= prevData.length) {
          throw new Error("Invalid item index");
        }

        const newData = [...prevData];
        const item = { ...newData[itemIndex] };

        if (columnId in item) {
          (item as ProjectItem)[columnId] = value as never;
        }

        if (columnId !== "projectName" && columnId !== "status" && columnId !== "yetToBeRecovered") {
          item.yetToBeRecovered = calculateYetToBeRecovered(item);
        }

        newData[itemIndex] = item;
        updatedItem = item;
        return newData;
      });

      // Wait for state update to complete before using updatedItem
      // Instead, get the updated item directly from the latest projectData
      const latestItem = {
        ...projectData[itemIndex],
        [columnId]: value,
      };
      if (columnId !== "projectName" && columnId !== "status" && columnId !== "yetToBeRecovered") {
        latestItem.yetToBeRecovered = calculateYetToBeRecovered(latestItem);
      }

      const isBackendAvailable = await checkBackendConnection();
      if (isBackendAvailable) {
        const response = await fetch(`${API_URL}/projects/${latestItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...latestItem,
            // Exclude id to avoid _id conflict
            _id: undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update project in backend");
        }
      }
    } catch (err) {
      console.error("Error updating cell:", err);
      setError(err instanceof Error ? err : new Error("Failed to update cell"));
      throw err;
    }
  }, [projectData, calculateYetToBeRecovered, checkBackendConnection]);

  // Add new row with backend sync
  const addRow = useCallback(async (newItem?: Partial<ProjectItem>) => {
    try {
      const defaultItem: ProjectItem = {
        id: uuidv4(), // Temporary ID for frontend
        srNo: 0,
        projectName: "",
        status: "",
        dev: 0,
        extra: 0,
        invest: 0,
        gettingAmount: 0,
        yetToBeRecovered: 0,
        ...newItem
      }

      defaultItem.yetToBeRecovered = calculateYetToBeRecovered(defaultItem)

      let tempId = defaultItem.id
      setProjectData(prevData => {
        const newData = [...prevData]
        defaultItem.srNo = newData.length + 1
        newData.push(defaultItem)
        return newData
      })

      const isBackendAvailable = await checkBackendConnection()
      if (isBackendAvailable) {
        const response = await fetch(`${API_URL}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...defaultItem,
            id: undefined, // Exclude id to let backend generate _id
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add project in backend")
        }

        const createdProject = await response.json()
        // Update frontend state with backend _id
        setProjectData(prevData => {
          const newData = prevData.map(item => 
            item.id === tempId 
              ? { ...item, id: createdProject.data._id.toString() }
              : item
          )
          return newData
        })
      }
    } catch (err) {
      console.error("Error adding row:", err)
      setError(err instanceof Error ? err : new Error(err.message || "Failed to add row"))
      // Remove the item from state if backend fails
      setProjectData(prevData => prevData.filter(item => item.id !== defaultItem.id))
      throw err
    }
  }, [calculateYetToBeRecovered, checkBackendConnection])

  // Remove row with backend sync
  const removeRow = useCallback(async (itemIndex: number) => {
    try {
      if (!window.confirm("Are you sure you want to remove this project?")) {
        return
      }

      let removedItem: ProjectItem | null = null
      setProjectData(prevData => {
        if (itemIndex < 0 || itemIndex >= prevData.length) {
          throw new Error("Invalid item index")
        }
        const newData = [...prevData]
        removedItem = newData[itemIndex]
        newData.splice(itemIndex, 1)
        return newData.map((item, index) => ({ ...item, srNo: index + 1 }))
      })

      if (!removedItem) throw new Error("Failed to remove item")

      const isBackendAvailable = await checkBackendConnection()
      if (isBackendAvailable) {
        const response = await fetch(`${API_URL}/projects/${removedItem.id}`, {
          method: "DELETE"
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to delete project in backend")
        }
      }
    } catch (err) {
      console.error("Error removing row:", err)
      setError(err instanceof Error ? err : new Error(err.message || "Failed to remove row"))
      // Revert state on failure
      if (removedItem) {
        setProjectData(prevData => {
          const newData = [...prevData]
          newData.splice(itemIndex, 0, removedItem!)
          return newData.map((item, index) => ({ ...item, srNo: index + 1 }))
        })
      }
      throw err
    }
  }, [projectData, checkBackendConnection])

  // Start editing cell
  const startEditing = useCallback((itemIndex: number, columnId: string) => {
    if (columnId !== "yetToBeRecovered") {
      setEditingCell({ itemIndex, columnId })
    }
  }, [])

  // Stop editing cell
  const stopEditing = useCallback(() => {
    setEditingCell(null)
  }, [])

  // Retry connection
  const retryConnection = useCallback(async () => {
    try {
      const isAvailable = await checkBackendConnection()
      if (isAvailable) {
        await fetchProjectData()
        setError(null)
      }
      return isAvailable
    } catch (err) {
      console.error("Retry connection error:", err)
      return false
    }
  }, [checkBackendConnection, fetchProjectData])

  const contextValue = {
    projectData,
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
  }

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}