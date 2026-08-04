import { avatarGradient, getInitials, nationalityFlag, type Nationality } from "@/lib/clients-data"
import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg" | "xl"

const sizeMap: Record<Size, { wrap: string; text: string; flag: string }> = {
  sm: { wrap: "h-8 w-8", text: "text-[10px]", flag: "h-3 w-3 text-[7px]" },
  md: { wrap: "h-10 w-10", text: "text-xs", flag: "h-3.5 w-3.5 text-[8px]" },
  lg: { wrap: "h-12 w-12", text: "text-sm", flag: "h-4 w-4 text-[8px]" },
  xl: { wrap: "h-16 w-16", text: "text-lg", flag: "h-5 w-5 text-[9px]" },
}

export function ClientAvatar({
  id,
  name,
  nationality,
  size = "md",
  showFlag = false,
  vip = false,
}: {
  id: string
  name: string
  nationality?: Nationality
  size?: Size
  showFlag?: boolean
  vip?: boolean
}) {
  const grad = avatarGradient(id)
  const initials = getInitials(name)
  const cls = sizeMap[size]

  return (
    <div className={cn("relative shrink-0", cls.wrap)}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm ring-2 ring-white",
          grad,
          cls.text,
        )}
      >
        {initials}
      </div>
      {showFlag && nationality && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border border-white bg-white font-bold uppercase tracking-tight text-slate-700 shadow",
            cls.flag,
          )}
        >
          {nationalityFlag[nationality]}
        </div>
      )}
      {vip && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[8px] font-black text-white shadow ring-1 ring-white">
          ★
        </div>
      )}
    </div>
  )
}
