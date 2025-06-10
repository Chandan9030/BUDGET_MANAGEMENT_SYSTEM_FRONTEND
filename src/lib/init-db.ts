import { getDb } from "./mongodb";
import { initialBudgetData } from "../data/initial-budget-data";
import { initialProjectData } from "../data/initial-project-data";
import { initialProjectTrackingData } from "../data/initial-project-tracking-data";
import { initialSubscriptionRevenueData } from "../data/initial-subscription-revenue-data";
import { initialSubscriptionModelData } from "../data/initial-subscription-model-data";
import { initialFinancialSummaryData } from "../data/initial-financial-summary-data";

export async function initializeDatabase() {
  try {
    console.log("Starting database initialization...");
    const db = await getDb();

    // Initialize collections with default data
    const collections = [
      { name: "budgetSections", data: initialBudgetData },
      { name: "projects", data: { items: initialProjectData } },
      { name: "projectTracking", data: { items: initialProjectTrackingData } },
      { name: "subscriptionRevenue", data: { items: initialSubscriptionRevenueData } },
      { name: "subscriptionModels", data: { items: initialSubscriptionModelData } },
      { name: "financialSummary", data: { items: initialFinancialSummaryData } }
    ];

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      if (count === 0) {
        if (Array.isArray(collection.data)) {
          await db.collection(collection.name).insertMany(collection.data);
        } else {
          await db.collection(collection.name).insertOne(collection.data);
        }
        console.log(`Initialized ${collection.name} collection`);
      }
    }

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
