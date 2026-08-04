'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface AlertFilterTabsProps {
  categories: Array<{ key: string; label: string; count: number }>
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function AlertFilterTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: AlertFilterTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 flex gap-2 overflow-x-auto bg-white pb-4 pt-2"
    >
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onCategoryChange(cat.key)}
          className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition"
        >
          <span className={activeCategory === cat.key ? 'text-slate-900' : 'text-slate-600'}>
            {cat.label}
          </span>
          {cat.count > 0 && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                activeCategory === cat.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600',
              )}
            >
              {cat.count}
            </span>
          )}
          {activeCategory === cat.key && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 -z-10 rounded-full bg-indigo-50"
              transition={{ type: 'spring', stiffness: 240, damping: 32 }}
            />
          )}
        </button>
      ))}
    </motion.div>
  )
}
