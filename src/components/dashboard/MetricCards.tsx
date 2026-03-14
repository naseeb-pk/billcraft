type Metric = {
  label: string
  value: string
  count: number
  variant?: 'default' | 'red' | 'green'
}

export default function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">{m.label}</p>
          <p className={`mt-1.5 text-2xl font-bold ${
            m.variant === 'red' ? 'text-red-600' :
            m.variant === 'green' ? 'text-green-600' :
            'text-zinc-900'
          }`}>
            {m.value}
          </p>
          <p className="mt-1 text-xs text-zinc-400">{m.count} invoice{m.count !== 1 ? 's' : ''}</p>
        </div>
      ))}
    </div>
  )
}
