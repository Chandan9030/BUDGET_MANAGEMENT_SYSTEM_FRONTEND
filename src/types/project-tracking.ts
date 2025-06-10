export interface ProjectTrackingItem {
  id: string
  slNo: number
  projectWork: string
  uiUx: string
  devName: string
  docStatus: string
  startDate: string
  endedDate: string
  resources: string
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

export interface ProjectTrackingData {
  items: ProjectTrackingItem[]
}
