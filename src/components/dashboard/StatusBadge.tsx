const styles: Record<string, string> = {
  draft:   'bg-zinc-100 text-zinc-600',
  sent:    'bg-blue-50 text-blue-700',
  viewed:  'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  paid:    'bg-green-50 text-green-700',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  )
}
