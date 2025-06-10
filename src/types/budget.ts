export interface BudgetItem {
  id: string
  srNo: number
  category: string
  employee: string
  monthlyCost: number
  quarterlyCost: number
  halfYearlyCost: number
  annualCost: number
  [key: string]: string | number | boolean | undefined // Allow for dynamic columns with specific types
}

export interface BudgetSection {
  id: string
  name: string
  items: BudgetItem[]
  total?: number
}

export interface TableColumn {
  id: string
  name: string
}