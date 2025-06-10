"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import BudgetViewer from "../components/budget-viewer"
import ExcelViewer from "../components/excel-viewer"
import { useBudget } from "../hooks/use-budget-data";

export default function BudgetDashboard() {
  const {
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
  } = useBudget();

  console.log("Budget Data:", budgetData)

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
      <Tabs defaultValue="budget" className="w-full"> {/* Set defaultValue to "budget" */}
        <div className="px-4 pt-4 border-b bg-slate-50 dark:bg-slate-150">
          <TabsList className="grid w-full max-w-md gap-2 grid-cols-2 bg-slate-100 p-2 rounded-lg shadow-inner transition-all duration-300 mx-auto">
            <TabsTrigger value="excel" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 rounded-md px-4 py-2 transition-all duration-200  hover:bg-gray-200 hover:text-slate-800 data-[state=active]:bg-white data-[state=active]:text-blue-600 shadow-sm">
              📊
              <span>Excel Data Viewer</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 rounded-md px-4 py-2 transition-all duration-200  hover:bg-gray-200 hover:text-slate-800 data-[state=active]:bg-white data-[state=active]:text-blue-600 shadow-sm">
              💰
              <span>Budget Planner</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="excel" className="p-0">
          <ExcelViewer />
        </TabsContent>

        <TabsContent value="budget" className="p-0">
          <BudgetViewer
            budgetData={budgetData}
            updateCellValue={updateCellValue}
            addRow={addRow}
            addColumn={addColumn}
            addSection={addSection}
            removeRow={removeRow}
            removeSection={removeSection}
            removeColumn={removeColumn}
            columns={columns}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
