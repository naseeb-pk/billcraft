'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, Building2, FileText, CreditCard, Settings, Users } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            B
          </div>
          <span className="text-base font-semibold text-zinc-900">Billcraft</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            New Invoice
          </Link>

          {/* Profile avatar / dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold hover:bg-indigo-200 transition-colors"
            >
              N
            </button>

            {open && (
              <>
                <div className="fixed inset-0" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                  <Link href="/clients" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                    <Users size={15} className="text-zinc-400" /> Clients
                  </Link>
                  <div className="my-1 border-t border-zinc-100" />
                  <Link href="/settings/profile" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                    <Building2 size={15} className="text-zinc-400" /> Business Profile
                  </Link>
                  <Link href="/settings/invoices" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                    <FileText size={15} className="text-zinc-400" /> Invoice Defaults
                  </Link>
                  <Link href="/settings/payment" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                    <CreditCard size={15} className="text-zinc-400" /> Payment Details
                  </Link>
                  <Link href="/settings/account" onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                    <Settings size={15} className="text-zinc-400" /> Account
                  </Link>
                  <div className="my-1 border-t border-zinc-100" />
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
