'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format, addDays } from 'date-fns'
import Navbar from '@/components/Navbar'
import ClientSelector from '@/components/invoice/ClientSelector'
import LineItemsEditor, { LineItem } from '@/components/invoice/LineItemsEditor'
import PricingSummary, { Pricing } from '@/components/invoice/PricingSummary'
import InvoicePreview from '@/components/invoice/InvoicePreview'

type Client = { id: string; name: string; email: string | null; company: string | null }
type UserProfile = {
  business_name: string | null
  business_address: string | null
  default_payment_terms: number
  default_tax_rate: number
  default_notes: string | null
  payment_details: Record<string, string>
  invoice_prefix: string
  next_invoice_number: number
}

const defaultPricing: Pricing = { subtotal: 0, discountType: null, discountValue: 0, taxRate: 0, taxAmount: 0, total: 0 }

function NewInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [items, setItems] = useState<LineItem[]>([{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }])
  const [pricing, setPricing] = useState<Pricing>(defaultPricing)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        setInvoiceNumber(`${p.invoice_prefix}-${String(p.next_invoice_number).padStart(4, '0')}`)
        setDueDate(format(addDays(new Date(), p.default_payment_terms || 30), 'yyyy-MM-dd'))
        setNotes(p.default_notes ?? '')
        setPaymentDetails(p.payment_details ?? {})
        setPricing(prev => ({ ...prev, taxRate: p.default_tax_rate ?? 0 }))
      }

      const preselectedClient = searchParams.get('client')
      if (preselectedClient) {
        const { data: c } = await supabase.from('clients').select('id, name, email, company').eq('id', preselectedClient).single()
        if (c) setClient(c as Client)
      }
    })
  }, [router, searchParams])

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0)

  const handlePricingChange = useCallback((p: Pricing) => setPricing(p), [])

  async function save(status: 'draft' | 'sent') {
    if (!client) { alert('Please select a client'); return }
    setSaving(true)

    const supabase = createClient()
    const { data: inv, error } = await supabase.from('invoices').insert({
      user_id: userId,
      client_id: client.id,
      invoice_number: invoiceNumber,
      status,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal: pricing.subtotal,
      discount_type: pricing.discountType,
      discount_value: pricing.discountValue,
      tax_rate: pricing.taxRate,
      tax_amount: pricing.taxAmount,
      total: pricing.total,
      notes: notes || null,
      payment_details: paymentDetails,
    }).select('id').single()

    if (error || !inv) { alert(error?.message ?? 'Failed to save'); setSaving(false); return }

    if (items.length > 0) {
      await supabase.from('invoice_items').insert(
        items.map((item, i) => ({
          invoice_id: inv.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          sort_order: i,
        }))
      )
    }

    await supabase.from('users').update({ next_invoice_number: (profile?.next_invoice_number ?? 1) + 1 }).eq('id', userId)
    await supabase.from('activity_log').insert({ user_id: userId, invoice_id: inv.id, action: 'created' })

    router.push(`/invoices/${inv.id}`)
  }

  if (!profile) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-32 text-sm text-zinc-400">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900">New Invoice</h1>

        <div className="flex gap-6 items-start">
          {/* Left: Form */}
          <div className="flex-[55] flex flex-col gap-5 min-w-0">

            {/* Section 1: Client */}
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Client</h2>
              <ClientSelector value={client} onChange={setClient} />
            </section>

            {/* Section 2: Line Items */}
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Line Items</h2>
              <LineItemsEditor items={items} onChange={setItems} />
            </section>

            {/* Section 3: Pricing */}
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Pricing</h2>
              <PricingSummary subtotal={subtotal} defaultTaxRate={profile.default_tax_rate ?? 0} onChange={handlePricingChange} />
            </section>

            {/* Section 4: Details */}
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">Invoice number</label>
                  <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
                </div>
                <div />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">Issue date</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">Due date
                    <span className="ml-1 text-xs font-normal text-zinc-400">(Net {profile.default_payment_terms})</span>
                  </label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Notes</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Payment terms, thank you message, etc."
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none" />
              </div>
            </section>

            {/* Section 5: Payment Details */}
            <section className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Payment Details</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'bank_name', label: 'Bank name' },
                  { key: 'account_holder', label: 'Account holder' },
                  { key: 'account_number', label: 'Account number' },
                  { key: 'ifsc_code', label: 'IFSC / Routing' },
                  { key: 'upi_id', label: 'UPI ID' },
                  { key: 'paypal_email', label: 'PayPal email' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">{label}</label>
                    <input type="text" value={paymentDetails[key] ?? ''}
                      onChange={e => setPaymentDetails(prev => ({ ...prev, [key]: e.target.value }))}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4">
              <button type="button" onClick={() => router.back()}
                className="text-sm text-zinc-500 hover:text-zinc-700">Cancel</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => save('draft')} disabled={saving}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60">
                  Save as Draft
                </button>
                <button type="button" onClick={() => save('sent')} disabled={saving}
                  className="rounded-lg bg-[#FFD230] px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-[#e6bc1a] disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save & Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="flex-[45] sticky top-20 min-w-0">
            <p className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Preview</p>
            <InvoicePreview
              invoiceNumber={invoiceNumber}
              issueDate={issueDate}
              dueDate={dueDate}
              businessName={profile.business_name ?? ''}
              businessAddress={profile.business_address ?? ''}
              client={client}
              items={items}
              pricing={pricing}
              notes={notes}
              paymentDetails={paymentDetails}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50"><Navbar /><div className="flex items-center justify-center py-32 text-sm text-zinc-400">Loading…</div></div>}>
      <NewInvoiceForm />
    </Suspense>
  )
}
