import * as XLSX from "xlsx"
import type { BudgetSection, TableColumn } from "../types/budget"

export const exportToExcel = (data: BudgetSection[], columns: TableColumn[], fileName: string) => {
  // Flatten the data structure for Excel
  const rows: any[] = []

  // Add each section with its items
  data.forEach((section) => {
    // Add section header
    const sectionRow: Record<string, any> = {
      "SR.NO": "",
      "Expense Category": section.name,
      Employee: "",
    }

    // Add values for each column
    columns.forEach((column) => {
      sectionRow[column.name] = section.items.reduce((sum, item) => sum + (Number(item[column.id]) || 0), 0)
    })

    // Add monthly investment column
    sectionRow["Monthly Investment"] = section.items.reduce((sum, item) => sum + (Number(item.monthlyCost) || 0), 0)

    rows.push(sectionRow)

    // Add section items
    section.items.forEach((item, index) => {
      const itemRow: Record<string, any> = {
        "SR.NO": index + 1,
        "Expense Category": item.category,
        Employee: item.employee,
      }

      // Add values for each column
      columns.forEach((column) => {
        itemRow[column.name] = Number(item[column.id]) || 0
      })

      // Add monthly investment column
      itemRow["Monthly Investment"] = Number(item.monthlyCost) || 0

      rows.push(itemRow)
    })
  })

  // Add overall total
  const totalRow: Record<string, any> = {
    "SR.NO": "",
    "Expense Category": "OVERALL TOTAL",
    Employee: "",
  }

  // Add values for each column
  columns.forEach((column) => {
    totalRow[column.name] = data.reduce(
      (sum, section) =>
        sum + section.items.reduce((sectionSum, item) => sectionSum + (Number(item[column.id]) || 0), 0),
      0,
    )
  })

  // Add monthly investment column
  totalRow["Monthly Investment"] = data.reduce(
    (sum, section) => sum + section.items.reduce((sectionSum, item) => sectionSum + (Number(item.monthlyCost) || 0), 0),
    0,
  )

  rows.push(totalRow)

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  const columnWidths = [
    { wch: 6 }, // SR.NO
    { wch: 25 }, // Expense Category
    { wch: 20 }, // Employee
  ]

  // Add widths for dynamic columns
  columns.forEach(() => {
    columnWidths.push({ wch: 15 })
  })

  // Add width for monthly investment column
  columnWidths.push({ wch: 15 })

  worksheet["!cols"] = columnWidths

  // Apply styles to header rows and section headers
  // Note: XLSX doesn't support full styling like colors in the browser export
  // For full styling, a server-side solution with a library like exceljs would be needed

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Data")

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
