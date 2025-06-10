import { v4 as uuidv4 } from "uuid"
import type { SubscriptionModelData } from "../types/subscription-model"

export const initialSubscriptionModelData: SubscriptionModelData = {
  items: [
    {
      id: uuidv4(),
      revenueSource: "Basic Plan",
      solpType: "Online",
      subscriptionsAvailed: 0,
      projectedMonthlyRevenue: 1,
      projectedAnnualRevenue: 100001,
      getSubscriptionDate: 0,
    },
    {
      id: uuidv4(),
      revenueSource: "Standard Plan",
      solpType: "Online",
      subscriptionsAvailed: 0,
      projectedMonthlyRevenue: 1,
      projectedAnnualRevenue: 100002,
      getSubscriptionDate: 0,
    },
  ],
}
