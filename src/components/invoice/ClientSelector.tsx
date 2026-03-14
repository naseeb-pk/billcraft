'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, Plus } from 'lucide-react'
import AddClientModal from './AddClientModal'

type Client = { id: string; name: string; email: string | null; company: string | null }

type Props = {
  value: Client | null
  onChange: (client: Client) => void
}

export default function ClientSelector({ value, onChange }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createClient().from('clients').select('id, name, email, company')
      .then(({ data }) => setClients((data ?? []) as Client[]))
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.email?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <div ref={ref} className="relative">
        <button type="button" onClick={() => setOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-left hover:border-zinc-300 transition-colors">
          {value ? (
            <span className="font-medium text-zinc-900">{value.name}{value.company ? ` · ${value.company}` : ''}</span>
          ) : (
            <span className="text-zinc-400">Select a client…</span>
          )}
          <ChevronDown size={14} className="text-zinc-400" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-zinc-200 bg-white shadow-lg">
            <div className="p-2 border-b border-zinc-100">
              <input autoFocus type="text" placeholder="Search clients…" value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-md px-3 py-1.5 text-sm outline-none bg-zinc-50 focus:bg-white border border-transparent focus:border-zinc-200" />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(c => (
                <button key={c.id} type="button"
                  onClick={() => { onChange(c); setOpen(false); setQuery('') }}
                  className="flex w-full flex-col items-start px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors">
                  <span className="font-medium text-zinc-900">{c.name}</span>
                  {(c.company || c.email) && <span className="text-xs text-zinc-400">{c.company ?? c.email}</span>}
                </button>
              ))}
              {filtered.length === 0 && <p className="px-3 py-3 text-sm text-zinc-400">No clients found</p>}
            </div>
            <div className="border-t border-zinc-100 p-2">
              <button type="button" onClick={() => { setOpen(false); setShowAdd(true) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                <Plus size={14} /> Add new client
              </button>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onAdded={(c) => {
            setClients(prev => [...prev, { ...c, company: null }])
            onChange({ ...c, company: null })
            setShowAdd(false)
          }}
        />
      )}
    </>
  )
}
