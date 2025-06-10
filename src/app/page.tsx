import BudgetDashboard from "../components/budget-dashboard";
import ErrorBoundary from "../components/error/ErrorBoundary";
import { BudgetProvider } from "../hooks/use-budget-data";
import { ProjectProvider } from "../hooks/use-project-data";
import { ProjectTrackingProvider } from "../hooks/use-project-tracking-data";
import { SubscriptionModelProvider } from "../hooks/use-subscription-model-data";
import { SubscriptionRevenueProvider } from "../hooks/use-subscription-revenue-data";

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <ErrorBoundary>
        <ProjectProvider>
          <BudgetProvider>
      <ProjectTrackingProvider>
        <SubscriptionRevenueProvider>
          <SubscriptionModelProvider>


              <h1 className="text-2xl md:text-3xl font-bold mb-6">Budget Management Dashboard</h1>
              <BudgetDashboard />
          </SubscriptionModelProvider>
        </SubscriptionRevenueProvider>
        </ProjectTrackingProvider>
            </BudgetProvider>

          </ProjectProvider>


      </ErrorBoundary>
    </main>
  )
}
