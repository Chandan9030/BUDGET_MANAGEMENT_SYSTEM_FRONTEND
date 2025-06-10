interface TooltipProps {
  content: string
  x: number
  y: number
  darkMode: boolean
}

export function Tooltip({ content, x, y, darkMode }: TooltipProps) {
  return (
    <div
      className={`fixed z-50 px-2 py-1 text-xs rounded shadow-lg pointer-events-none ${
        darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
      }`}
      style={{
        left: `${x + 10}px`,
        top: `${y + 10}px`,
      }}
    >
      {content}
    </div>
  )
}
