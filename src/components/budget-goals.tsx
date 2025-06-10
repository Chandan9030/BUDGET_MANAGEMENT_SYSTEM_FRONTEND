"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Progress } from "../components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Target, AlertTriangle, CheckCircle, Plus } from "lucide-react"
import { formatCurrency } from "../lib/format-utils"
import type { BudgetSection } from "../types/budget"

interface BudgetGoal {
  id: string
  name: string
  type: "section" | "category" | "overall"
  targetName?: string
  limit: number
  timeframe: "monthly" | "quarterly" | "annual"
}

interface BudgetGoalsProps {
  data: BudgetSection[]
}

export function BudgetGoals({ data }: BudgetGoalsProps) {
  const [goals, setGoals] = useState<BudgetGoal[]>([])
  const [newGoal, setNewGoal] = useState<Omit<BudgetGoal, "id">>({
    name: "",
    type: "overall",
    limit: 0,
    timeframe: "monthly",
  })

  // Load goals from localStorage on initial load
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem("budgetGoals")
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals))
      }
    } catch (error) {
      console.error("Error loading budget goals:", error)
    }
  }, [])

  // Save goals to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("budgetGoals", JSON.stringify(goals))
    } catch (error) {
      console.error("Error saving budget goals:", error)
    }
  }, [goals])

  const timeFrameMap = {
    monthly: "monthlyCost",
    quarterly: "quarterlyCost",
    annual: "annualCost",
  }

  const addGoal = () => {
    if (!newGoal.name || newGoal.limit <= 0) return

    // If type is section or category, ensure targetName is set
    if ((newGoal.type === "section" || newGoal.type === "category") && !newGoal.targetName) return

    setGoals([...goals, { ...newGoal, id: crypto.randomUUID() }])
    setNewGoal({
      name: "",
      type: "overall",
      limit: 0,
      timeframe: "monthly",
    })
  }

  const removeGoal = (id: string) => {
    if (window.confirm("Are you sure you want to remove this budget goal?")) {
      setGoals(goals.filter((goal) => goal.id !== id))
    }
  }

  const calculateProgress = (goal: BudgetGoal) => {
    const costField = timeFrameMap[goal.timeframe]

    if (goal.type === "overall") {
      // Calculate total budget
      const total = data.reduce(
        (sum, section) =>
          sum + section.items.reduce((sectionSum, item) => sectionSum + (Number(item[costField]) || 0), 0),
        0,
      )
      return { current: total, limit: goal.limit, percentage: (total / goal.limit) * 100 }
    } else if (goal.type === "section") {
      // Find the section and calculate its total
      const section = data.find((s) => s.name === goal.targetName)
      if (!section) return { current: 0, limit: goal.limit, percentage: 0 }

      const total = section.items.reduce((sum, item) => sum + (Number(item[costField]) || 0), 0)
      return { current: total, limit: goal.limit, percentage: (total / goal.limit) * 100 }
    } else {
      // category
      // Calculate total for the category across all sections
      let total = 0
      data.forEach((section) => {
        section.items.forEach((item) => {
          if (item.category === goal.targetName) {
            total += Number(item[costField]) || 0
          }
        })
      })
      return { current: total, limit: goal.limit, percentage: (total / goal.limit) * 100 }
    }
  }

  // Get all available sections and categories for dropdowns
  const availableSections = data.map((section) => section.name)
  const availableCategories = Array.from(new Set(data.flatMap((section) => section.items.map((item) => item.category))))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Budget Goals & Limits
        </h2>
        <Dialog>
          <DialogTrigger asChild>
          <Button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
             <Plus className="h-4 w-4 animate-pulse" />
                Add Budget Goal
          </Button>

          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget Goal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  placeholder="e.g., Reduce Marketing Expenses"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="goal-type">Goal Type</Label>
                <select
                  id="goal-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newGoal.type}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, type: e.target.value as "overall" | "section" | "category" })
                  }
                >
                  <option value="overall">Overall Budget</option>
                  <option value="section">Section Budget</option>
                  <option value="category">Category Budget</option>
                </select>
              </div>

              {newGoal.type === "section" && (
                <div className="grid gap-2">
                  <Label htmlFor="section-name">Section</Label>
                  <select
                    id="section-name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newGoal.targetName || ""}
                    onChange={(e) => setNewGoal({ ...newGoal, targetName: e.target.value })}
                  >
                    <option value="">Select a section</option>
                    {availableSections.map((section, index) => (
                      <option key={index} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newGoal.type === "category" && (
                <div className="grid gap-2">
                  <Label htmlFor="category-name">Category</Label>
                  <select
                    id="category-name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newGoal.targetName || ""}
                    onChange={(e) => setNewGoal({ ...newGoal, targetName: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {availableCategories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="goal-timeframe">Time Frame</Label>
                <select
                  id="goal-timeframe"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newGoal.timeframe}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, timeframe: e.target.value as "monthly" | "quarterly" | "annual" })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="goal-limit">Budget Limit</Label>
                <Input
                  id="goal-limit"
                  type="number"
                  min="0"
                  value={newGoal.limit}
                  onChange={(e) => setNewGoal({ ...newGoal, limit: Number(e.target.value) })}
                  placeholder="e.g., 50000"
                />
              </div>

              <Button
                onClick={addGoal}
                disabled={
                  !newGoal.name ||
                  newGoal.limit <= 0 ||
                  ((newGoal.type === "section" || newGoal.type === "category") && !newGoal.targetName)
                }
                className="w-full mt-4 px-4 py-2 text-sm font-semibold tracking-wide bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Add Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              No budget goals have been set. Add a goal to track your budget limits.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal)
            const isOverBudget = progress.current > progress.limit

            return (
              <Card key={goal.id} className={isOverBudget ? "border-red-300" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => removeGoal(goal.id)} className="h-8 w-8 p-0">
                      <span className="sr-only">Remove</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-red-500"
                      >
                        <path d="M18 6L6 18M6 6l12 12"></path>
                      </svg>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {goal.type === "overall"
                          ? "Overall Budget"
                          : goal.type === "section"
                            ? `Section: ${goal.targetName}`
                            : `Category: ${goal.targetName}`}{" "}
                        ({goal.timeframe})
                      </span>
                      <span className="font-medium">
                        {formatCurrency(progress.current)} / {formatCurrency(progress.limit)}
                      </span>
                    </div>

                    <Progress value={Math.min(progress.percentage, 100)} className={isOverBudget ? "bg-red-100" : ""} />

                    <div className="flex items-center gap-2 mt-2">
                      {isOverBudget ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">
                            Over budget by {formatCurrency(progress.current - progress.limit)} (
                            {(progress.percentage - 100).toFixed(1)}%)
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">
                            {progress.percentage < 80 ? "Within budget" : "Approaching limit"} (
                            {progress.percentage.toFixed(1)}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
