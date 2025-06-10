import { NextResponse } from "next/server"
import { getDb } from "../../../lib/mongodb"

export async function GET() {
  try {
    console.log("Fetching budget data from MongoDB...")
    
    const db = await getDb()
    const budgetSections = await db.collection("budgetSections").find({}).toArray()
    console.log(`Retrieved ${budgetSections.length} budget sections`)
    return NextResponse.json(budgetSections)
  } catch (error) {
    console.error("Error fetching budget data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch budget data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("Saving budget data to MongoDB...")
    const body = await request.json()
    const db = await getDb()

    // Clear existing data
    const deleteResult = await db.collection("budgetSections").deleteMany({})
    console.log(`Deleted ${deleteResult.deletedCount} existing budget sections`)

    // Insert new data
    const result = await db.collection("budgetSections").insertMany(body)
    console.log(`Inserted ${result.insertedCount} budget sections`)

    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    })
  } catch (error) {
    console.error("Error saving budget data:", error)
    return NextResponse.json(
      {
        error: "Failed to save budget data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
