'use client'

const TABS = ['All', 'Draft', 'Sent', 'Viewed', 'Overdue', 'Paid'] as const
export type FilterTab = typeof TABS[number]

export default function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active: FilterTab
  counts: Record<FilterTab, number>
  onChange: (tab: FilterTab) => void
}) {
  return (
    <div className="flex gap-1">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
          }`}
        >
          {tab}
          <span className={`rounded-full px-1.5 py-0.5 text-xs ${
            active === tab ? 'bg-indigo-500 text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {counts[tab]}
          </span>
        </button>
      ))}
    </div>
  )
}
