"use client"

import { useState, useEffect } from "react"
import { Download, FileSpreadsheet, Info, Plus, PlusCircle, BarChart3, Target, TrendingUp, Table } from "lucide-react"
import { Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import { BudgetTable } from "./budget-table"
import { BudgetVisualization } from "./budget-visualization"
import { BudgetForecasting } from "./budget-forecasting"
import { BudgetGoals } from "./budget-goals"
import { ProjectTable } from "./project-table"
import { ProjectVisualization } from "./project-visualization"
import { ProjectTrackingTable } from "./project-tracking-table"
import { SubscriptionRevenueTable } from "./subscription-revenue-table"
import { SubscriptionModelTable } from "./subscription-model-table"
import { FinancialSummaryTable } from "./financial-summary-table"
import { Notification } from "./notification"
import { exportToExcel } from "../lib/excel-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import type { BudgetSection, TableColumn } from "../types/budget"
import { useProjectTracking } from "../hooks/use-project-tracking-data"
// import { useSubscriptionModelData } from "../hooks/use-subscription-model-data"
import { useFinancialSummaryData } from "../hooks/use-financial-summary-data"
// import { ProjectTrackingVisualization } from "./project-tracking-visualization"
// import { SubscriptionRevenueVisualization } from "./subscription-revenue-visualization"
import { SubscriptionModelVisualization } from "./subscription-model-visualization"
import { FinancialSummaryVisualization } from "./financial-summary-visualization"
import { useProject } from "../hooks/use-project-data"

interface BudgetViewerProps {
  budgetData: BudgetSection[]
  updateCellValue: (sectionIndex: number, itemIndex: number, columnId: string, value: string | number | boolean) => void
  addRow: (sectionId: string, newRow: { category: string; employee: string; monthlyCost: number }) => void
  addColumn: (columnId: string, columnName: string) => void
  addSection: (sectionName: string) => void
  removeRow: (sectionIndex: number, itemIndex: number) => void
  removeSection: (sectionIndex: number) => void
  removeColumn: (columnId: string) => void
  columns: TableColumn[]
  currentMonth: string
  setCurrentMonth: (value: string) => void
}

export default function BudgetViewer({
  budgetData,
  updateCellValue,
  addRow,
  addColumn,
  addSection,
  removeRow,
  removeSection,
  removeColumn,
  columns,
  currentMonth,
  setCurrentMonth,
}: BudgetViewerProps) {
  const [newColumnId, setNewColumnId] = useState("")
  const [newColumnName, setNewColumnName] = useState("")
  const [newSectionName, setNewSectionName] = useState("")
  const [newRowData, setNewRowData] = useState<{ category: string; employee: string; monthlyCost: number }>({
    category: "",
    employee: "",
    monthlyCost: 0,
  })
  const [selectedSectionId, setSelectedSectionId] = useState("")
  const [selectedColumnId, setSelectedColumnId] = useState("")
  const [customMonthName, setCustomMonthName] = useState(currentMonth)
  const [notification, setNotification] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<"table1" | "table2" | "table3" | "table4" | "table5" | "table6">(
    "table1",
  )
  const [activeTab, setActiveTab] = useState<"table" | "visualization" | "forecasting" | "goals">("table")

  // Calculate Table 1 totals
  const calculateBudgetTotals = () => {
    let annualTotal = 0
    let monthlyTotal = 0

    budgetData.forEach((section) => {
      section.items.forEach((item) => {
        annualTotal += Number(item.annualCost) || 0
        monthlyTotal += Number(item.monthlyCost) || 0
      })
    })

    return { annualTotal, monthlyTotal }
  }

  // Project data state and functions
  const { projectData, updateProjectCellValue, addProjectRow, removeProjectRow, calculateTotals } = useProject()

  // Project tracking data state and functions
  const {
    data: projectTrackingData,
    updateCellValue: updateProjectTrackingCellValue,
    addRow: addProjectTrackingRow,
    removeRow: removeProjectTrackingRow,
    calculateTotals: calculateProjectTrackingTotals,
  } = useProjectTracking()

  // Subscription revenue data state and functions
  // const {
  //   data: subscriptionRevenueData,
  //   updateCellValue: updateSubscriptionRevenueCellValue,
  //   addRow: addSubscriptionRevenueRow,
  //   removeRow: removeSubscriptionRevenueRow,
  //   calculateTotals: calculateSubscriptionRevenueTotals,
  // } = useSubscriptionRevenue()

  // Subscription model data state and functions
  // const {
  //   data: subscriptionModelData,
  //   updateCellValue: updateSubscriptionModelCellValue,
  //   addRow: addSubscriptionModelRow,
  //   removeRow: removeSubscriptionModelRow,
  //   calculateTotals: calculateSubscriptionModelTotals,
  // } = useSubscriptionModelData()

  // Financial summary data state and functions
  const {
    data: financialSummaryData,
    updateCellValue: updateFinancialSummaryCellValue,
    addRow: addFinancialSummaryRow,
    removeRow: removeFinancialSummaryRow,
  } = useFinancialSummaryData()

  const [newProjectData, setNewProjectData] = useState({
    projectName: "",
    status: "In Progress",
    dev: 0,
    extra: 0,
    invest: 0,
    gettingAmount: 0,
    yetToBeRecovered: 0,
  })

  const [newProjectTrackingData, setNewProjectTrackingData] = useState({
    projectWork: "",
    uiUx: "Done (Jiten)",
    devName: "",
    docStatus: "In Progress",
    startDate: "",
    endedDate: "",
    resources: "",
    daysInvolved: 0,
    hoursDays: 0,
    investDayAmount: 0,
    projectCost: 0,
    collectAmount: 0,
    profitForProject: 0,
  })

  const [newSubscriptionRevenueData, setNewSubscriptionRevenueData] = useState({
    revenueSource: "",
    subscriptionsAvailed: 0,
    projectedMonthlyRevenue: 0,
    projectedAnnualRevenue: 0,
    subscribed: "",
    profit: 0,
  })

  const [newSubscriptionModelData, setNewSubscriptionModelData] = useState({
    revenueSource: "",
    solpType: "Online",
    subscriptionsAvailed: 0,
    projectedMonthlyRevenue: 0,
    projectedAnnualRevenue: 0,
    getSubscriptionDate: "",
  })

  const [newFinancialSummaryData, setNewFinancialSummaryData] = useState({
    category: "",
    amount: 0,
  })

  // Update financial summary with budget totals whenever budget data changes
  useEffect(() => {
    const { annualTotal, monthlyTotal } = calculateBudgetTotals()
    // Make sure we're using the function from the hook
    updateFinancialSummaryCellValue(0, "amount", annualTotal)
    updateFinancialSummaryCellValue(1, "amount", monthlyTotal)
  }, [budgetData]);

  const handleExportToExcel = () => {
    if (selectedTable === "table1") {
      exportToExcel(budgetData, columns, "Budget_Data")
    } else if (selectedTable === "table2") {
      exportToExcel(projectData.items, [], "Project_Data")
    } else if (selectedTable === "table3") {
      exportToExcel(projectTrackingData.items, [], "Project_Tracking_Data")
    } else if (selectedTable === "table4") {
      exportToExcel(subscriptionRevenueData.items, [], "Subscription_Revenue_Data")
    } else if (selectedTable === "table5") {
      exportToExcel(subscriptionModelData.items, [], "Subscription_Model_Data")
    } else if (selectedTable === "table6") {
      exportToExcel(financialSummaryData.items, [], "Financial_Summary_Data")
    }
    showNotification("Excel file exported successfully!")
  }

  const handleAddColumn = () => {
    if (newColumnId && newColumnName) {
      addColumn(newColumnId, newColumnName)
      setNewColumnId("")
      setNewColumnName("")
      showNotification(`New column "${newColumnName}" added successfully!`)
    }
  }

  const handleAddSection = () => {
    if (newSectionName) {
      addSection(newSectionName)
      setNewSectionName("")
      showNotification(`New section "${newSectionName}" added successfully!`)
    }
  }

  const handleAddRow = () => {
    if (selectedTable === "table1") {
      if (selectedSectionId) {
        addRow(selectedSectionId, newRowData)
        setNewRowData({
          category: "",
          employee: "",
          monthlyCost: 0,
        })
        showNotification("New row added successfully!")
      }
    } else if (selectedTable === "table2") {
      addProjectRow(newProjectData)
      setNewProjectData({
        projectName: "",
        status: "In Progress",
        dev: 0,
        extra: 0,
        invest: 0,
        gettingAmount: 0,
        yetToBeRecovered: 0,
      })
      showNotification("New project added successfully!")
    } else if (selectedTable === "table3") {
      addProjectTrackingRow(newProjectTrackingData)
      setNewProjectTrackingData({
        projectWork: "",
        uiUx: "Done (Jiten)",
        devName: "",
        docStatus: "In Progress",
        startDate: "",
        endedDate: "",
        resources: "",
        //salary: 0,
        daysInvolved: 0,
        hoursDays: 0,
        investDayAmount: 0,
        projectCost: 0,
        collectAmount: 0,
        profitForProject: 0,
      })
      showNotification("New project tracking item added successfully!")
    } else if (selectedTable === "table4") {
      addSubscriptionRevenueRow(newSubscriptionRevenueData)
      setNewSubscriptionRevenueData({
        revenueSource: "",
        subscriptionsAvailed: 0,
        projectedMonthlyRevenue: 0,
        projectedAnnualRevenue: 0,
        subscribed: 0,
        profit: 0,
      })
      showNotification("New subscription revenue item added successfully!")
    } else if (selectedTable === "table5") {
      addSubscriptionModelRow(newSubscriptionModelData)
      setNewSubscriptionModelData({
        revenueSource: "",
        solpType: "Online",
        subscriptionsAvailed: 0,
        projectedMonthlyRevenue: 0,
        projectedAnnualRevenue: 0,
        getSubscriptionDate: "",
      })
      showNotification("New subscription model item added successfully!")
    } else if (selectedTable === "table6") {
      addFinancialSummaryRow(newFinancialSummaryData)
      setNewFinancialSummaryData({
        category: "",
        amount: 0,
      })
      showNotification("New financial summary item added successfully!")
    }
  }

  const handleUpdateMonthName = () => {
    if (customMonthName) {
      setCurrentMonth(customMonthName)
      showNotification(`Month name updated to "${customMonthName}"!`)
    }
  }

  const showNotification = (message: string) => {
    setNotification(message)
  }

  const handleUpdateCellValue = (sectionIndex: number, itemIndex: number, columnId: string, value: any) => {
    updateCellValue(sectionIndex, itemIndex, columnId, value)

    if (columnId === "monthlyCost") {
      showNotification("Monthly cost updated! Quarterly, Half-Yearly, and Annual costs recalculated.")
    }
  }

  // Calculate totals
  const projectTotals = calculateTotals()
  const projectTrackingTotals = calculateProjectTrackingTotals()
  // const subscriptionRevenueTotals = calculateSubscriptionRevenueTotals()
  // const subscriptionModelTotals = calculateSubscriptionModelTotals()

  return (
    <div>
      <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Budget Planner
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your budget with editable cells and dynamic rows/columns
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"
                    onClick={handleExportToExcel}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download Excel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download as Excel file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="table"
        className="w-full"
        value={activeTab}
        onValueChange={(value: "table" | "visualization" | "forecasting" | "goals") => setActiveTab(value)}
      >
        <div className="px-4 pt-4 border-b">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 gap-2 bg-gray-100 rounded-lg p-2">
            <TabsTrigger value="table" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200">
              <Table className="h-4 w-4" />
              <span>Table View</span>
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200">
              <BarChart3 className="h-4 w-4" />
              <span>Visualization</span>
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200">
              <TrendingUp className="h-4 w-4" />
              <span>Forecasting</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200">
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table" className="p-4">
          <div className="mb-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Select Table View</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setSelectedTable("table1")}
                  className={`flex items-center gap-2 ${selectedTable === "table1"
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {selectedTable === "table1" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                      Table 1
                    </span>
                  ) : (
                    "Table 1"
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedTable("table2")}
                  className={`flex items-center gap-2 ${selectedTable === "table2"
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {selectedTable === "table2" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                      Table 2
                    </span>
                  ) : (
                    "Table 2"
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedTable("table3")}
                  className={`flex items-center gap-2 ${selectedTable === "table3"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {selectedTable === "table3" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                      Table 3
                    </span>
                  ) : (
                    "Table 3"
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedTable("table4")}
                  className={`flex items-center gap-2 ${selectedTable === "table4"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {selectedTable === "table4" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                      Table 4
                    </span>
                  ) : (
                    "Table 4"
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedTable("table5")}
                  className={`flex items-center gap-2 ${selectedTable === "table5"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {selectedTable === "table5" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                      Table 5
                    </span>
                  ) : (
                    "Table 5"
                  )}
                </Button>
                <Button
                  onClick={() => setSelectedTable("table6")}
                  className={`flex items-center gap-2 ${selectedTable === "table6"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {selectedTable === "table6" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                      Table 6
                    </span>
                  ) : (
                    "Table 6"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {selectedTable === "table1" && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Column</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="column-id">Column ID</Label>
                        <Input
                          id="column-id"
                          value={newColumnId}
                          onChange={(e) => setNewColumnId(e.target.value)}
                          placeholder="e.g., biMonthly"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="column-name">Column Name</Label>
                        <Input
                          id="column-name"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          placeholder="e.g., Bi-Monthly Cost"
                        />
                      </div>
                      <Button
                        onClick={handleAddColumn}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                      >
                        Add Column
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Section</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="section-name">Section Name</Label>
                        <Input
                          id="section-name"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="e.g., Marketing Expenses"
                        />
                      </div>
                      <Button
                        onClick={handleAddSection}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                      >
                        Add Section
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Row
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Row</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="section-select">Select Section</Label>
                        <select
                          id="section-select"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={selectedSectionId}
                          onChange={(e) => setSelectedSectionId(e.target.value)}
                        >
                          <option value="">Select a section</option>
                          {budgetData.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Expense Category</Label>
                        <Input
                          id="category"
                          value={newRowData.category}
                          onChange={(e) => setNewRowData({ ...newRowData, category: e.target.value })}
                          placeholder="e.g., Software License"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="employee">Employee</Label>
                        <Input
                          id="employee"
                          value={newRowData.employee}
                          onChange={(e) => setNewRowData({ ...newRowData, employee: e.target.value })}
                          placeholder="e.g., John Doe or N/A"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="monthly-cost">Monthly Cost</Label>
                        <Input
                          id="monthly-cost"
                          type="number"
                          value={newRowData.monthlyCost}
                          onChange={(e) => setNewRowData({ ...newRowData, monthlyCost: Number(e.target.value) })}
                          placeholder="e.g., 5000"
                        />
                      </div>
                      <Button
                        onClick={handleAddRow}
                        disabled={!selectedSectionId}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                      >
                        Add Row
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Column</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="column-select">Select Column to Remove</Label>
                        <select
                          id="column-select"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={selectedColumnId}
                          onChange={(e) => setSelectedColumnId(e.target.value)}
                        >
                          <option value="">Select a column</option>
                          {columns.map((column) => (
                            <option key={column.id} value={column.id}>
                              {column.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={() => {
                          if (selectedColumnId) {
                            removeColumn(selectedColumnId)
                            setSelectedColumnId("")
                            showNotification(`Column removed successfully!`)
                          }
                        }}
                        disabled={!selectedColumnId || columns.length <= 1}
                        variant="destructive"
                      >
                        Remove Column
                      </Button>
                      {columns.length <= 1 && (
                        <p className="text-sm text-red-500">You must have at least one column.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Edit Month Name
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Current Month Name</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="month-name">Month Name</Label>
                        <Input
                          id="month-name"
                          value={customMonthName}
                          onChange={(e) => setCustomMonthName(e.target.value)}
                          placeholder="e.g., April25 Invest"
                        />
                      </div>
                      <Button
                        onClick={handleUpdateMonthName}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                      >
                        Update Month Name
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-auto">
                <div className="p-2 bg-blue-50 border-y border-blue-200 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Table 1: All cells are editable. Click on any cell to edit its value. This table has the same
                    functionality as Table 2.
                  </p>
                </div>

                <BudgetTable

                />
              </div>
            </>
          )}

          {selectedTable === "table2" && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 hover:from-orange-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Project</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                          id="project-name"
                          value={newProjectData.projectName}
                          onChange={(e) => setNewProjectData({ ...newProjectData, projectName: e.target.value })}
                          placeholder="e.g., New Web Project"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newProjectData.status}
                          onChange={(e) => setNewProjectData({ ...newProjectData, status: e.target.value })}
                        >
                          <option value="Completed, In Progress, On Hold">Completed, In Progress, On Hold</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dev-cost">Development Cost</Label>
                        <Input
                          id="dev-cost"
                          type="number"
                          value={newProjectData.dev}
                          onChange={(e) => setNewProjectData({ ...newProjectData, dev: Number(e.target.value) })}
                          placeholder="e.g., 360000"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="extra-cost">Extra Cost</Label>
                        <Input
                          id="extra-cost"
                          type="number"
                          value={newProjectData.extra}
                          onChange={(e) => setNewProjectData({ ...newProjectData, extra: Number(e.target.value) })}
                          placeholder="e.g., 22000"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="invest">Invest</Label>
                        <Input
                          id="invest"
                          type="number"
                          value={newProjectData.invest}
                          onChange={(e) => setNewProjectData({ ...newProjectData, invest: Number(e.target.value) })}
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="getting-amount">Getting Amount</Label>
                        <Input
                          id="getting-amount"
                          type="number"
                          value={newProjectData.gettingAmount}
                          onChange={(e) =>
                            setNewProjectData({ ...newProjectData, gettingAmount: Number(e.target.value) })
                          }
                          placeholder="e.g., 2000"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="yet-to-recover">Yet to be Recovered</Label>
                        <Input
                          id="yet-to-recover"
                          type="number"
                          value={newProjectData.yetToBeRecovered}
                          onChange={(e) =>
                            setNewProjectData({ ...newProjectData, yetToBeRecovered: Number(e.target.value) })
                          }
                          placeholder="e.g., 380000"
                        />
                      </div>
                      <Button
                        onClick={handleAddRow}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 hover:from-orange-600 hover:via-pink-600 hover:to-red-600 shadow-md"
                      >
                        Add Project
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-auto">
                <div className="p-2 bg-yellow-50 border-y border-yellow-200 flex items-center gap-2">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Table 2: Project tracking table. All cells are editable. Click on any cell to edit its value.
                  </p>
                </div>

                <ProjectTable
                
                />
              </div>
            </>
          )}

          {selectedTable === "table3" && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Project Tracking
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Project Tracking</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project-work">Project Work</Label>
                        <Input
                          id="project-work"
                          value={newProjectTrackingData.projectWork}
                          onChange={(e) =>
                            setNewProjectTrackingData({ ...newProjectTrackingData, projectWork: e.target.value })
                          }
                          placeholder="e.g., Simple Accounting Web"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ui-ux">UI/UX</Label>
                        <Input
                          id="ui-ux"
                          value={newProjectTrackingData.uiUx}
                          onChange={(e) =>
                            setNewProjectTrackingData({ ...newProjectTrackingData, uiUx: e.target.value })
                          }
                          placeholder="e.g., Done (Jiten)"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dev-name">Dev Name</Label>
                        <Input
                          id="dev-name"
                          value={newProjectTrackingData.devName}
                          onChange={(e) =>
                            setNewProjectTrackingData({ ...newProjectTrackingData, devName: e.target.value })
                          }
                          placeholder="e.g., Ji"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="doc-status">Doc Status</Label>
                        <Input
                          id="doc-status"
                          value={newProjectTrackingData.docStatus}
                          onChange={(e) =>
                            setNewProjectTrackingData({ ...newProjectTrackingData, docStatus: e.target.value })
                          }
                          placeholder="e.g., In Progress"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          value={newProjectTrackingData.startDate}
                          onChange={(e) =>
                            setNewProjectTrackingData({ ...newProjectTrackingData, startDate: e.target.value })
                          }
                          placeholder="e.g., 01/04/2025"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ended-date">Ended Date</Label>
                        <Input
                          id="ended-date"
                          value={newProjectTrackingData.endedDate}
                          onChange={(e) =>
                            setNewProjectTrackingData({ ...newProjectTrackingData, endedDate: e.target.value })
                          }
                          placeholder="e.g., 10/04/2025"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-cost">Project Cost</Label>
                        <Input
                          id="project-cost"
                          type="number"
                          value={newProjectTrackingData.projectCost}
                          onChange={(e) =>
                            setNewProjectTrackingData({
                              ...newProjectTrackingData,
                              projectCost: Number(e.target.value),
                            })
                          }
                          placeholder="e.g., 50000"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="collect-amount">Collect Amount</Label>
                        <Input
                          id="collect-amount"
                          type="number"
                          value={newProjectTrackingData.collectAmount}
                          onChange={(e) =>
                            setNewProjectTrackingData({
                              ...newProjectTrackingData,
                              collectAmount: Number(e.target.value),
                              profitForProject: Number(e.target.value) - newProjectTrackingData.projectCost,
                            })
                          }
                          placeholder="e.g., 60000"
                        />
                      </div>
                      <Button
                        onClick={handleAddRow}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 shadow-md"
                      >
                        Add Project Tracking
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-auto">
                <div className="p-2 bg-yellow-50 border-y border-yellow-200 flex items-center gap-2">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Table 3: Project tracking with detailed information. All cells are editable.
                  </p>
                </div>

                <ProjectTrackingTable

                />
              </div>
            </>
          )}

          {selectedTable === "table4" && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-green-500 via-sky-500 to-blue-500 hover:from-green-600 hover:via-sky-600 hover:to-blue-600 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Subscription Revenue
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subscription Revenue</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="revenue-source">Revenue Source</Label>
                        <Input
                          id="revenue-source"
                          value={newSubscriptionRevenueData.revenueSource}
                          onChange={(e) =>
                            setNewSubscriptionRevenueData({
                              ...newSubscriptionRevenueData,
                              revenueSource: e.target.value,
                            })
                          }
                          placeholder="e.g., Basic Plan"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="subscriptions-availed">Subscriptions Availed</Label>
                        <Input
                          id="subscriptions-availed"
                          type="number"
                          value={newSubscriptionRevenueData.subscriptionsAvailed}
                          onChange={(e) =>
                            setNewSubscriptionRevenueData({
                              ...newSubscriptionRevenueData,
                              subscriptionsAvailed: Number(e.target.value),
                            })
                          }
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="projected-monthly-revenue">Projected Monthly Revenue</Label>
                        <Input
                          id="projected-monthly-revenue"
                          type="number"
                          value={newSubscriptionRevenueData.projectedMonthlyRevenue}
                          onChange={(e) =>
                            setNewSubscriptionRevenueData({
                              ...newSubscriptionRevenueData,
                              projectedMonthlyRevenue: Number(e.target.value),
                              projectedAnnualRevenue: Number(e.target.value) * 12,
                            })
                          }
                          placeholder="e.g., 2999"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="subscribed">Subscribed</Label>
                        <Input
                          id="subscribed"
                          value={newSubscriptionRevenueData.subscribed}
                          onChange={(e) =>
                            setNewSubscriptionRevenueData({
                              ...newSubscriptionRevenueData,
                              subscribed: e.target.value,
                            })
                          }
                          placeholder="e.g., 4/25"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="profit">Profit</Label>
                        <Input
                          id="profit"
                          type="number"
                          value={newSubscriptionRevenueData.profit}
                          onChange={(e) =>
                            setNewSubscriptionRevenueData({
                              ...newSubscriptionRevenueData,
                              profit: Number(e.target.value),
                            })
                          }
                          placeholder="e.g., 1500"
                        />
                      </div>
                      <Button
                        onClick={handleAddRow}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-green-500 via-sky-500 to-blue-500 hover:from-green-600 hover:via-sky-600 hover:to-blue-600 shadow-md"
                      >
                        Add Subscription Revenue
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-auto">
                <div className="p-2 bg-green-50 border-y border-green-200 flex items-center gap-2">
                  <Info className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800">
                    Table 4: Subscription revenue tracking. All cells are editable.
                  </p>
                </div>

                <SubscriptionRevenueTable
                />
              </div>
            </>
          )}

          {selectedTable === "table5" && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-blue-500 via-sky-500 to-green-500 hover:from-blue-600 hover:via-sky-600 hover:to-green-600 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Subscription Model
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subscription Model</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="revenue-source">Revenue Source</Label>
                        <Input
                          id="revenue-source"
                          value={newSubscriptionModelData.revenueSource}
                          onChange={(e) =>
                            setNewSubscriptionModelData({
                              ...newSubscriptionModelData,
                              revenueSource: e.target.value,
                            })
                          }
                          placeholder="e.g., Basic Plan"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="solp-type">SOLP - Online/Offline</Label>
                        <select
                          id="solp-type"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={newSubscriptionModelData.solpType}
                          onChange={(e) =>
                            setNewSubscriptionModelData({ ...newSubscriptionModelData, solpType: e.target.value })
                          }
                        >
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="subscriptions-availed">Subscriptions Availed</Label>
                        <Input
                          id="subscriptions-availed"
                          type="number"
                          value={newSubscriptionModelData.subscriptionsAvailed}
                          onChange={(e) =>
                            setNewSubscriptionModelData({
                              ...newSubscriptionModelData,
                              subscriptionsAvailed: Number(e.target.value),
                            })
                          }
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="projected-monthly-revenue">Projected Monthly Revenue</Label>
                        <Input
                          id="projected-monthly-revenue"
                          type="number"
                          value={newSubscriptionModelData.projectedMonthlyRevenue}
                          onChange={(e) =>
                            setNewSubscriptionModelData({
                              ...newSubscriptionModelData,
                              projectedMonthlyRevenue: Number(e.target.value),
                              projectedAnnualRevenue: Number(e.target.value) * 12,
                            })
                          }
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="get-subscription-date">Get Subscription Date</Label>
                        <Input
                          id="get-subscription-date"
                          value={newSubscriptionModelData.getSubscriptionDate}
                          onChange={(e) =>
                            setNewSubscriptionModelData({
                              ...newSubscriptionModelData,
                              getSubscriptionDate: e.target.value,
                            })
                          }
                          placeholder="e.g., April 20"
                        />
                      </div>
                      <Button
                        onClick={handleAddRow}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-blue-500 via-sky-500 to-green-500 hover:from-blue-600 hover:via-sky-600 hover:to-green-600 shadow-md"
                      >
                        Add Subscription Model
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-auto">
                <div className="p-2 bg-yellow-50 border-y border-yellow-200 flex items-center gap-2">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Table 5: Subscription model details. All cells are editable.
                  </p>
                </div>

                <SubscriptionModelTable
             
                />
              </div>
            </>
          )}

          {selectedTable === "table6" && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 via-pink-500 to-purple-300 hover:from-red-600 hover:via-pink-600 hover:to-purple-400 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Financial Summary
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Financial Summary</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={newFinancialSummaryData.category}
                          onChange={(e) =>
                            setNewFinancialSummaryData({
                              ...newFinancialSummaryData,
                              category: e.target.value,
                            })
                          }
                          placeholder="e.g., Total Expenses"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={newFinancialSummaryData.amount}
                          onChange={(e) =>
                            setNewFinancialSummaryData({
                              ...newFinancialSummaryData,
                              amount: Number(e.target.value),
                            })
                          }
                          placeholder="e.g., 22000"
                        />
                      </div>
                      <Button
                        onClick={handleAddRow}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 via-pink-500 to-purple-300 hover:from-red-600 hover:via-pink-600 hover:to-purple-400 shadow-md"
                      >
                        Add Financial Summary
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-auto">
                <div className="p-2 bg-green-50 border-y border-green-200 flex items-center gap-2">
                  <Info className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800">Table 6: Financial summary. All cells are editable.</p>
                </div>

                <FinancialSummaryTable
                  data={financialSummaryData.items}
                  updateCellValue={updateFinancialSummaryCellValue}
                  removeRow={removeFinancialSummaryRow}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="visualization" className="p-4">
          {selectedTable === "table1" && <BudgetVisualization data={budgetData} currentMonth={currentMonth} />}

          {selectedTable === "table2" && <ProjectVisualization data={projectData.items} totals={projectTotals} />}

          {selectedTable === "table3" && (
            <ProjectTrackingTable
              data={projectTrackingData?.items || []}
              updateCellValue={updateProjectTrackingCellValue}
              removeRow={removeProjectTrackingRow}
              totals={projectTrackingTotals}
            />
          )}

          {selectedTable === "table4" && (
            <SubscriptionRevenueTable
            />
          )}

          {selectedTable === "table5" && (
            <SubscriptionModelVisualization />
          )}

          {selectedTable === "table6" && <FinancialSummaryVisualization data={financialSummaryData.items} />}
        </TabsContent>

        <TabsContent value="forecasting" className="p-4">
          <BudgetForecasting data={budgetData} />
        </TabsContent>

        <TabsContent value="goals" className="p-4">
          <BudgetGoals data={budgetData} />
        </TabsContent>
      </Tabs>

      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
    </div>
  )
}