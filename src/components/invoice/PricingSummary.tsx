'use client'

import { useState } from 'react'

export type Pricing = {
  subtotal: number
  discountType: 'percentage' | 'flat' | null
  discountValue: number
  taxRate: number
  taxAmount: number
  total: number
}

type Props = {
  subtotal: number
  defaultTaxRate: number
  onChange: (p: Pricing) => void
}

export default function PricingSummary({ subtotal, defaultTaxRate, onChange }: Props) {
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRate, setTaxRate] = useState(defaultTaxRate)
  const [taxEnabled, setTaxEnabled] = useState(defaultTaxRate > 0)

  const discountAmount = showDiscount
    ? discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue
    : 0
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxEnabled ? (taxableAmount * taxRate) / 100 : 0
  const total = taxableAmount + taxAmount

  function emit(overrides: Partial<{ showDiscount: boolean; discountType: 'percentage' | 'flat'; discountValue: number; taxRate: number; taxEnabled: boolean }>) {
    const sd = overrides.showDiscount ?? showDiscount
    const dt = overrides.discountType ?? discountType
    const dv = overrides.discountValue ?? discountValue
    const tr = overrides.taxRate ?? taxRate
    const te = overrides.taxEnabled ?? taxEnabled
    const da = sd ? (dt === 'percentage' ? (subtotal * dv) / 100 : dv) : 0
    const ta = subtotal - da
    const taxAmt = te ? (ta * tr) / 100 : 0
    onChange({
      subtotal,
      discountType: sd ? dt : null,
      discountValue: sd ? dv : 0,
      taxRate: tr,
      taxAmount: taxAmt,
      total: ta + taxAmt,
    })
  }

  // emit on subtotal change
  if (total !== subtotal - discountAmount + taxAmount) emit({})

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
      <div className="flex justify-between text-zinc-600">
        <span>Subtotal</span>
        <span className="font-medium text-zinc-900">${subtotal.toFixed(2)}</span>
      </div>

      {/* Discount */}
      {!showDiscount ? (
        <button type="button" onClick={() => { setShowDiscount(true); emit({ showDiscount: true }) }}
          className="text-left text-zinc-400 hover:text-zinc-600 text-xs">+ Add discount</button>
      ) : (
        <div className="flex items-center gap-2">
          <select value={discountType}
            onChange={e => { const v = e.target.value as 'percentage' | 'flat'; setDiscountType(v); emit({ discountType: v }) }}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs outline-none">
            <option value="percentage">%</option>
            <option value="flat">Flat</option>
          </select>
          <input type="number" min="0" step="any" value={discountValue}
            onChange={e => { const v = parseFloat(e.target.value) || 0; setDiscountValue(v); emit({ discountValue: v }) }}
            className="w-24 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs outline-none" />
          <span className="flex-1 text-zinc-500">
            — ${discountAmount.toFixed(2)}
          </span>
          <button type="button" onClick={() => { setShowDiscount(false); emit({ showDiscount: false }) }}
            className="text-zinc-400 hover:text-red-500 text-xs">Remove</button>
        </div>
      )}

      {/* Tax */}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="tax-toggle" checked={taxEnabled}
          onChange={e => { setTaxEnabled(e.target.checked); emit({ taxEnabled: e.target.checked }) }}
          className="rounded" />
        <label htmlFor="tax-toggle" className="text-zinc-600">Tax</label>
        <input type="number" min="0" max="100" step="0.01" value={taxRate} disabled={!taxEnabled}
          onChange={e => { const v = parseFloat(e.target.value) || 0; setTaxRate(v); emit({ taxRate: v }) }}
          className="w-20 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs outline-none disabled:opacity-40" />
        <span className="text-xs text-zinc-400">%</span>
        {taxEnabled && <span className="ml-auto text-zinc-500">${taxAmount.toFixed(2)}</span>}
      </div>

      <div className="mt-1 border-t border-zinc-200 pt-2 flex justify-between">
        <span className="font-semibold text-zinc-900">Total</span>
        <span className="text-lg font-bold text-zinc-900">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
