'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { ArrowLeft } from 'lucide-react'

type Client = { id: string; name: string; email: string | null; company: string | null; address: string | null; phone: string | null }
type Invoice = { id: string; invoice_number: string; status: string; issue_date: string; total: number }

export default function ClientDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      Promise.all([
        supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('invoices').select('id, invoice_number, status, issue_date, total').eq('client_id', id).order('created_at', { ascending: false }),
      ]).then(([{ data: c }, { data: inv }]) => {
        if (!c) { router.push('/clients'); return }
        setClient(c)
        setInvoices((inv ?? []) as Invoice[])
        setLoading(false)
      })
    })
  }, [id, router])

  if (loading) return <div className="min-h-screen bg-zinc-50"><Navbar /><div className="py-20 text-center text-sm text-zinc-400">Loading…</div></div>
  if (!client) return null

  const total = invoices.reduce((sum, i) => sum + Number(i.total), 0)

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/clients" className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft size={14} /> Clients
        </Link>

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">{client.name}</h1>
              {client.company && <p className="text-sm text-zinc-500">{client.company}</p>}
            </div>
            <Link href={`/invoices/new?client=${client.id}`}
              className="rounded-lg bg-[#FFD230] px-3.5 py-2 text-sm font-semibold text-zinc-900 hover:bg-[#e6bc1a] transition-colors">
              + New Invoice
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-zinc-600">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.address && <span>{client.address}</span>}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Invoice history</h2>
          <span className="text-sm text-zinc-500">{invoices.length} invoices · ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} total</span>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
            No invoices yet for this client
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3.5">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-zinc-900 hover:underline">{inv.invoice_number}</Link>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3.5 text-zinc-600">{format(new Date(inv.issue_date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-zinc-900">${Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
