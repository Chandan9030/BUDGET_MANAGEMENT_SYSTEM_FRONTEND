import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Only run this middleware once on app startup
  if (process.env.NODE_ENV === "development" && !global.__dbInitialized) {
    try {
      // Initialize the database
      await fetch(`${request.nextUrl.origin}/api/init-db`)
      global.__dbInitialized = true
    } catch (error) {
      console.error("Failed to initialize database:", error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/",
}
