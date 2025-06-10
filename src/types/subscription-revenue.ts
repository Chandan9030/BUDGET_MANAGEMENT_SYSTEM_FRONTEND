export interface SubscriptionRevenueItem {
  id: string
  revenueSource: string
  subscriptionsAvailed: number
  projectedMonthlyRevenue: number
  projectedAnnualRevenue: number
  subscribed: string
  profit: number
}

export interface SubscriptionRevenueData {
  items: SubscriptionRevenueItem[]
}
