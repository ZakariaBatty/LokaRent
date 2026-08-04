import { cn } from "@/lib/utils"
import { expenseTypeStyles, type ExpenseType } from "@/lib/expenses-data"

export function ExpenseTypeBadge({ type, size = "md" }: { type: ExpenseType; size?: "sm" | "md" }) {
  const s = expenseTypeStyles[type]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium ring-1 ring-inset",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        s.chip,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}
