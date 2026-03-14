'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import StatusBadge from './StatusBadge'

export type Invoice = {
  id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string
  total: number
  clients: { name: string } | null
  notes: string | null
}

function ActionsMenu({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg text-sm">
            <Link href={`/invoices/${invoiceId}`} onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-zinc-700 hover:bg-zinc-50">View</Link>
            <Link href={`/invoices/${invoiceId}/edit`} onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-zinc-700 hover:bg-zinc-50">Edit</Link>
            <button className="block w-full text-left px-3.5 py-2 text-zinc-700 hover:bg-zinc-50">Duplicate</button>
            <button className="block w-full text-left px-3.5 py-2 text-zinc-700 hover:bg-zinc-50">Download PDF</button>
            <div className="my-1 border-t border-zinc-100" />
            <button className="block w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </>
      )}
    </div>
  )
}

export default function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-20 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-2xl">📄</div>
        <p className="font-medium text-zinc-900">No invoices yet</p>
        <p className="mt-1 text-sm text-zinc-500">Create your first invoice to get started</p>
        <Link href="/invoices/new"
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          + Create Invoice
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Invoice</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Client</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Issued</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Due</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Amount</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
              <td className="px-4 py-3.5">
                <Link href={`/invoices/${inv.id}`} className="font-medium text-indigo-600 hover:underline">
                  {inv.invoice_number}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-medium text-zinc-900">{inv.clients?.name ?? '—'}</p>
                {inv.notes && <p className="text-xs text-zinc-400 truncate max-w-[180px]">{inv.notes}</p>}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={inv.status} />
              </td>
              <td className="px-4 py-3.5 text-zinc-600">
                {format(new Date(inv.issue_date), 'MMM d')}
              </td>
              <td className="px-4 py-3.5 text-zinc-600">
                {format(new Date(inv.due_date), 'MMM d')}
              </td>
              <td className="px-4 py-3.5 text-right font-semibold text-zinc-900">
                ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3.5">
                <ActionsMenu invoiceId={inv.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
