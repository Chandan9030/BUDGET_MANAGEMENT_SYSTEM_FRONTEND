import { v4 as uuidv4 } from "uuid"
import type { FinancialSummaryData } from "../types/financial-summary"

export const initialFinancialSummaryData: FinancialSummaryData = {
  items: [
    {
      id: uuidv4(),
      category: "Total Expenses Annual",
      amount: 22000,
    },
    {
      id: uuidv4(),
      category: "Total Expenses Month",
      amount: 2000,
    },
    {
      id: uuidv4(),
      category: "Total Development Cost",
      amount: 700,
    },
    {
      id: uuidv4(),
      category: "Development April25 Expenses",
      amount: 0,
    },
    {
      id: uuidv4(),
      category: "April25 Profit",
      amount: 0,
    },
    {
      id: uuidv4(),
      category: "Total Profit 2025",
      amount: 0,
    },
  ],
}
