"use client"

import { useEffect } from "react"
import { CheckCircle } from "lucide-react"

interface NotificationProps {
  message: string
  onClose: () => void
}

export function Notification({ message, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <CheckCircle className="h-5 w-5" />
      <span>{message}</span>
    </div>
  )
}
