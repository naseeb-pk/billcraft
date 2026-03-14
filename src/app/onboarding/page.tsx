'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3

const PAYMENT_TERMS_OPTIONS = [
  { label: 'Due on receipt', value: 0 },
  { label: 'Net 15', value: 15 },
  { label: 'Net 30', value: 30 },
  { label: 'Net 45', value: 45 },
  { label: 'Net 60', value: 60 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')

  // Step 2
  const [paymentTerms, setPaymentTerms] = useState(30)
  const [taxRate, setTaxRate] = useState('')
  const [defaultNotes, setDefaultNotes] = useState('')

  // Step 3
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [upiId, setUpiId] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')

  async function handleFinish() {
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase
      .from('users')
      .update({
        business_name: businessName || null,
        business_address: businessAddress || null,
        default_payment_terms: paymentTerms,
        default_tax_rate: taxRate ? parseFloat(taxRate) : 0,
        default_notes: defaultNotes || null,
        payment_details: {
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode,
          account_holder: accountHolder,
          upi_id: upiId,
          paypal_email: paypalEmail,
        },
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-sm">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white text-xl font-bold">
            B
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">Set up your account</h1>
          <p className="text-sm text-zinc-500">Step {step} of 3</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-zinc-900' : 'bg-zinc-200'}`}
            />
          ))}
        </div>

        {/* Step 1: Business details */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-zinc-900">Business details</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Business name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Naseeb Design Co."
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">
                Business address <span className="text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                rows={3}
                placeholder="123 Main St, City, Country"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Invoice defaults */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-zinc-900">Invoice defaults</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Default payment terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(Number(e.target.value))}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 bg-white"
              >
                {PAYMENT_TERMS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">
                Tax rate % <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="e.g. 18"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">
                Default invoice notes <span className="text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={defaultNotes}
                onChange={(e) => setDefaultNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Thank you for your business!"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Payment details */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-zinc-900">Payment details</h2>
            <p className="text-sm text-zinc-500 -mt-2">These appear on your invoices so clients know how to pay you.</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Bank name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Account holder</label>
                <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Your name"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Account number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234567890"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">IFSC / Routing</label>
                <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="HDFC0001234"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@upi"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">PayPal email</label>
                <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="you@paypal.com"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {/* Footer buttons */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              onClick={step === 3 ? handleFinish : () => setStep((s) => (s + 1) as Step)}
              disabled={saving}
              className="rounded-lg bg-[#FFD230] px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-[#e6bc1a] disabled:opacity-60 transition-colors"
            >
              {step === 3 ? (saving ? 'Saving…' : 'Finish setup') : 'Continue'}
            </button>
          </div>
        </div>

        {step < 3 && (
          <p className="mt-4 text-center text-xs text-zinc-400">
            <button
              onClick={step === 3 ? handleFinish : () => setStep((s) => (s + 1) as Step)}
              className="hover:underline"
            >
              Skip for now
            </button>
            {' '}— complete later in settings
          </p>
        )}
      </div>
    </div>
  )
}
