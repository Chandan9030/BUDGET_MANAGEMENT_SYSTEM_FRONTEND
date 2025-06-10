export interface FinancialSummaryItem {
  id: string
  category: string
  amount: number
}

export interface FinancialSummaryData {
  items: FinancialSummaryItem[]
}
