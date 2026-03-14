'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Plus, Search, ChevronRight } from 'lucide-react'
import AddClientModal from '@/components/invoice/AddClientModal'

type Client = {
  id: string
  name: string
  email: string | null
  company: string | null
  phone: string | null
  invoice_count?: number
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('clients')
      .select('id, name, email, company, phone')
      .eq('user_id', user.id)
      .order('name')

    setClients((data ?? []) as Client[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Clients</h1>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#FFD230] px-3.5 py-2 text-sm font-semibold text-zinc-900 hover:bg-[#e6bc1a] transition-colors">
            <Plus size={15} /> Add client
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search clients…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-zinc-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-20 text-center">
            <p className="font-medium text-zinc-900">No clients yet</p>
            <p className="mt-1 text-sm text-zinc-500">Add your first client to get started</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-4 rounded-lg bg-[#FFD230] px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-[#e6bc1a] transition-colors">
              + Add client
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {filtered.map((c, i) => (
              <Link key={c.id} href={`/clients/${c.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors ${i > 0 ? 'border-t border-zinc-100' : ''}`}>
                <div>
                  <p className="font-medium text-zinc-900">{c.name}</p>
                  <p className="text-sm text-zinc-500">{c.company ? `${c.company} · ` : ''}{c.email ?? ''}</p>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
              </Link>
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <AddClientModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load() }} />
      )}
    </div>
  )
}
