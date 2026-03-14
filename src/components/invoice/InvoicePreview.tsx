import { format } from 'date-fns'
import type { LineItem } from './LineItemsEditor'
import type { Pricing } from './PricingSummary'

type Props = {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  businessName: string
  businessAddress: string
  client: { name: string; email: string | null; company: string | null } | null
  items: LineItem[]
  pricing: Pricing
  notes: string
  paymentDetails: Record<string, string>
}

export default function InvoicePreview({ invoiceNumber, issueDate, dueDate, businessName, businessAddress, client, items, pricing, notes, paymentDetails }: Props) {
  const fmt = (d: string) => { try { return format(new Date(d), 'MMM d, yyyy') } catch { return d } }
  const hasPayment = Object.values(paymentDetails).some(v => v)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-sm font-[family-name:var(--font-schibsted)]" style={{ minHeight: 600 }}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{businessName || 'Your Business'}</h2>
          {businessAddress && <p className="mt-1 text-xs text-zinc-500 whitespace-pre-line">{businessAddress}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-zinc-900">INVOICE</p>
          <p className="mt-1 text-zinc-500">{invoiceNumber || 'INV-0001'}</p>
        </div>
      </div>

      {/* Dates + Client */}
      <div className="mb-8 flex justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Bill To</p>
          <p className="font-semibold text-zinc-900">{client?.name || '—'}</p>
          {client?.company && <p className="text-zinc-500">{client.company}</p>}
          {client?.email && <p className="text-zinc-500">{client.email}</p>}
        </div>
        <div className="text-right">
          <div className="mb-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Issue Date</p>
            <p className="text-zinc-900">{issueDate ? fmt(issueDate) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Due Date</p>
            <p className="text-zinc-900">{dueDate ? fmt(dueDate) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Line items */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-zinc-900">
            <th className="pb-2 text-left text-xs font-semibold text-zinc-900 uppercase tracking-wide">Description</th>
            <th className="pb-2 text-center text-xs font-semibold text-zinc-900 uppercase tracking-wide w-16">Qty</th>
            <th className="pb-2 text-right text-xs font-semibold text-zinc-900 uppercase tracking-wide w-24">Rate</th>
            <th className="pb-2 text-right text-xs font-semibold text-zinc-900 uppercase tracking-wide w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={4} className="py-4 text-zinc-400 text-center text-xs">No items added yet</td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="border-b border-zinc-100">
              <td className="py-2.5 text-zinc-700">{item.description || '—'}</td>
              <td className="py-2.5 text-center text-zinc-600">{item.quantity}</td>
              <td className="py-2.5 text-right text-zinc-600">${Number(item.rate).toFixed(2)}</td>
              <td className="py-2.5 text-right font-medium text-zinc-900">${Number(item.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-56 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span><span>${pricing.subtotal.toFixed(2)}</span>
          </div>
          {pricing.discountType && (
            <div className="flex justify-between text-zinc-600">
              <span>Discount</span><span>-${(pricing.subtotal - (pricing.subtotal - (pricing.discountType === 'percentage' ? pricing.subtotal * pricing.discountValue / 100 : pricing.discountValue))).toFixed(2)}</span>
            </div>
          )}
          {pricing.taxAmount > 0 && (
            <div className="flex justify-between text-zinc-600">
              <span>Tax ({pricing.taxRate}%)</span><span>${pricing.taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-900 pt-2 font-bold text-zinc-900 text-base">
            <span>Total</span><span>${pricing.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-4 rounded-lg bg-zinc-50 p-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-zinc-600 text-xs">{notes}</p>
        </div>
      )}

      {/* Payment details */}
      {hasPayment && (
        <div className="rounded-lg bg-zinc-50 p-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Payment Details</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600">
            {paymentDetails.bank_name && <><span className="text-zinc-400">Bank</span><span>{paymentDetails.bank_name}</span></>}
            {paymentDetails.account_holder && <><span className="text-zinc-400">Account Holder</span><span>{paymentDetails.account_holder}</span></>}
            {paymentDetails.account_number && <><span className="text-zinc-400">Account No.</span><span>{paymentDetails.account_number}</span></>}
            {paymentDetails.ifsc_code && <><span className="text-zinc-400">IFSC</span><span>{paymentDetails.ifsc_code}</span></>}
            {paymentDetails.upi_id && <><span className="text-zinc-400">UPI</span><span>{paymentDetails.upi_id}</span></>}
            {paymentDetails.paypal_email && <><span className="text-zinc-400">PayPal</span><span>{paymentDetails.paypal_email}</span></>}
          </div>
        </div>
      )}
    </div>
  )
}
