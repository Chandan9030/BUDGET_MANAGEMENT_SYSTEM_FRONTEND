"use client"

import { X } from "lucide-react"
import type { BudgetSection } from "../types/budget"
import { formatCurrency } from "../lib/format-utils"

interface ExcelViewModalProps {
  isOpen: boolean
  onClose: () => void
  data: BudgetSection[]
  currentMonth: string
}

export function ExcelViewModal({ isOpen, onClose, data, currentMonth }: ExcelViewModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Excel View</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-4 py-2 text-left">SR.NO</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Expense Category</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Employee</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Monthly Cost (INR)</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Quarterly Cost</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Half-Yearly Cost</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">Annual Cost</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">{currentMonth}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((section) => (
                  <>
                    <tr key={section.id} className="bg-yellow-100 font-semibold">
                      <td className="border border-gray-200 px-4 py-2"></td>
                      <td className="border border-gray-200 px-4 py-2" colSpan={2}>
                        {section.name}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatCurrency(section.items.reduce((sum, item) => sum + item.monthlyCost, 0))}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatCurrency(section.items.reduce((sum, item) => sum + item.quarterlyCost, 0))}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatCurrency(section.items.reduce((sum, item) => sum + item.halfYearlyCost, 0))}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatCurrency(section.items.reduce((sum, item) => sum + item.annualCost, 0))}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatCurrency(section.items.reduce((sum, item) => sum + item.monthlyCost, 0))}
                      </td>
                    </tr>
                    {section.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-200 px-4 py-2">{item.srNo}</td>
                        <td className="border border-gray-200 px-4 py-2">{item.category}</td>
                        <td className="border border-gray-200 px-4 py-2">{item.employee}</td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {formatCurrency(item.monthlyCost)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {formatCurrency(item.quarterlyCost)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {formatCurrency(item.halfYearlyCost)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {formatCurrency(item.annualCost)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {formatCurrency(item.monthlyCost)}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-200 px-4 py-2"></td>
                  <td className="border border-gray-200 px-4 py-2" colSpan={2}>
                    OVERALL TOTAL
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatCurrency(
                      data.reduce(
                        (sum, section) =>
                          sum + section.items.reduce((sectionSum, item) => sectionSum + item.monthlyCost, 0),
                        0,
                      ),
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatCurrency(
                      data.reduce(
                        (sum, section) =>
                          sum + section.items.reduce((sectionSum, item) => sectionSum + item.quarterlyCost, 0),
                        0,
                      ),
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatCurrency(
                      data.reduce(
                        (sum, section) =>
                          sum + section.items.reduce((sectionSum, item) => sectionSum + item.halfYearlyCost, 0),
                        0,
                      ),
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatCurrency(
                      data.reduce(
                        (sum, section) =>
                          sum + section.items.reduce((sectionSum, item) => sectionSum + item.annualCost, 0),
                        0,
                      ),
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right">
                    {formatCurrency(
                      data.reduce(
                        (sum, section) =>
                          sum + section.items.reduce((sectionSum, item) => sectionSum + item.monthlyCost, 0),
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
