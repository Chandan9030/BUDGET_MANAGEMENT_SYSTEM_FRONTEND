export interface ProjectItem {
  id?: string | number
  srNo: number
  projectName: string
  status: string
  dev: number
  extra: number
  invest: number
  gettingAmount: number
  yetToBeRecovered: number
}

export interface ProjectTotals {
  dev: number
  extra: number
  invest: number
  gettingAmount: number
  yetToBeRecovered: number
}

export type SubmitStatus = "idle" | "loading" | "success" | "error"

export interface ProjectContextType {
  data: ProjectItem[]
  totals: ProjectTotals
  submitStatus: SubmitStatus
  editingCell: { itemIndex: number; columnId: string } | null
  updateCellValue: (itemIndex: number, columnId: string, value: string | number) => void
  removeRow: (itemIndex: number) => void
  startEditing: (itemIndex: number, columnId: string) => void
  stopEditing: () => void
  handleSubmit: () => Promise<void>
  calculateTotals: () => ProjectTotals
}