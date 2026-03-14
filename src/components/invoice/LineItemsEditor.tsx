'use client'

import { Trash2, Plus } from 'lucide-react'

export type LineItem = {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

type Props = {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }
}

export default function LineItemsEditor({ items, onChange }: Props) {
  function update(id: string, field: keyof LineItem, value: string | number) {
    onChange(items.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'rate') {
        updated.amount = Number(updated.quantity) * Number(updated.rate)
      }
      return updated
    }))
  }

  function remove(id: string) {
    onChange(items.filter(i => i.id !== id))
  }

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_100px_90px_32px] gap-2 px-1 text-xs font-medium text-zinc-400 uppercase tracking-wide">
        <span>Description</span>
        <span>Qty</span>
        <span>Rate</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {/* Rows */}
      {items.map(item => (
        <div key={item.id} className="grid grid-cols-[1fr_80px_100px_90px_32px] gap-2 items-center">
          <input type="text" placeholder="Description" value={item.description}
            onChange={e => update(item.id, 'description', e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
          <input type="number" min="0" step="any" value={item.quantity}
            onChange={e => update(item.id, 'quantity', parseFloat(e.target.value) || 0)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 text-center" />
          <input type="number" min="0" step="any" value={item.rate}
            onChange={e => update(item.id, 'rate', parseFloat(e.target.value) || 0)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-right text-zinc-700 font-medium">
            ${item.amount.toFixed(2)}
          </div>
          <button type="button" onClick={() => remove(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => onChange([...items, newItem()])}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors">
          <Plus size={14} /> Add item
        </button>
        <div className="text-sm text-zinc-600">
          Subtotal: <span className="font-semibold text-zinc-900">${subtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
