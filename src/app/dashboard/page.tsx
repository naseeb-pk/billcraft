'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import MetricCards from '@/components/dashboard/MetricCards'
import FilterTabs, { FilterTab } from '@/components/dashboard/FilterTabs'
import InvoiceTable, { Invoice } from '@/components/dashboard/InvoiceTable'
import { Search } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      supabase
        .from('invoices')
        .select('id, invoice_number, status, issue_date, due_date, total, notes, clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setInvoices((data as unknown as Invoice[]) ?? [])
          setLoading(false)
        })
    })
  }, [router])

  const metrics = useMemo(() => {
    const outstanding = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status))
    const overdue = invoices.filter(i => i.status === 'overdue')
    const now = new Date()
    const paidThisMonth = invoices.filter(i => {
      if (i.status !== 'paid') return false
      const d = new Date(i.issue_date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const drafts = invoices.filter(i => i.status === 'draft')

    const sum = (arr: Invoice[]) => arr.reduce((acc, i) => acc + Number(i.total), 0)
    const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })

    return [
      { label: 'Total Outstanding', value: fmt(sum(outstanding)), count: outstanding.length },
      { label: 'Overdue', value: fmt(sum(overdue)), count: overdue.length, variant: 'red' as const },
      { label: 'Paid This Month', value: fmt(sum(paidThisMonth)), count: paidThisMonth.length, variant: 'green' as const },
      { label: 'Draft', value: fmt(sum(drafts)), count: drafts.length },
    ]
  }, [invoices])

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { All: invoices.length, Draft: 0, Sent: 0, Viewed: 0, Overdue: 0, Paid: 0 }
    invoices.forEach(i => { c[i.status.charAt(0).toUpperCase() + i.status.slice(1) as FilterTab]++ })
    return c
  }, [invoices])

  const filtered = useMemo(() => {
    let list = activeTab === 'All' ? invoices : invoices.filter(i => i.status === activeTab.toLowerCase())
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.invoice_number.toLowerCase().includes(q) ||
        i.clients?.name?.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q)
      )
    }
    return list
  }, [invoices, activeTab, search])

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32 text-zinc-400 text-sm">Loading…</div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Metric cards */}
            <MetricCards metrics={metrics} />

            {/* Invoice list */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-zinc-900">All invoices</h2>
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search invoices…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 w-48"
                    />
                  </div>
                  <FilterTabs active={activeTab} counts={counts} onChange={setActiveTab} />
                </div>
              </div>

              <InvoiceTable invoices={filtered} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
