import { v4 as uuidv4 } from "uuid"
import type { SubscriptionRevenueData } from "../types/subscription-revenue"

export const initialSubscriptionRevenueData: SubscriptionRevenueData = {
  items: [
    {
      id: uuidv4(),
      revenueSource: "Basic Plan",
      subscriptionsAvailed: 0,
      projectedMonthlyRevenue: 2999,
      projectedAnnualRevenue: 0,
      subscribed: "",
      profit: 0,
    },
  ],
}
