export interface SubscriptionModelItem {
  id: string
  revenueSource: string
  solpType: string
  subscriptionsAvailed: number
  projectedMonthlyRevenue: number
  projectedAnnualRevenue: number
  getSubscriptionDate: number
}

export interface SubscriptionModelData {
  items: SubscriptionModelItem[]
}
