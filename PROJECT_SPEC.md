# Billcraft — Project Specification
## Freelancer Invoice Generator & Manager

---

## 1. Product Overview

### What is Billcraft?
A web application that helps freelancers create professional invoices, track their status, and manage client relationships — all from a single dashboard.

### Core Value Proposition
"Your first invoice takes 2 minutes. Your tenth takes 15 seconds."

### Target User
Solo freelancers (designers, developers, writers, consultants) earning $30–80K annually who currently use spreadsheets, free PDF generators, or manual methods to invoice clients.

### What This Is NOT (v1 Scope)
- No payment gateway integration (no Stripe/Razorpay)
- No project management features
- No time tracking
- No expense tracking
- No recurring invoices
- No multi-currency support
- No team/collaboration features

### Key User Jobs
1. Create and send a professional invoice quickly
2. Track which invoices are paid, pending, or overdue
3. Follow up on unpaid invoices without awkwardness
4. Know exactly how much money is owed to them right now
5. Maintain a record of all client billing history

---

## 2. Tech Stack

### Frontend + Backend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (pre-built accessible components)

### Database + Auth
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (email + password)
- **File Storage:** Supabase Storage (for logos)

### PDF Generation
- **Library:** @react-pdf/renderer (builds PDFs as React components)

### Email
- **Service:** Resend (simple email API, free tier = 100 emails/day)

### Deployment
- **Platform:** Vercel (auto-deploys from GitHub)
- **Domain:** Custom domain via Vercel

### Package Manager
- **Tool:** pnpm (faster than npm)

---

## 3. Database Schema

### Table: users
Stores freelancer profile and business information.
```
users
├── id                  UUID (primary key, from Supabase Auth)
├── email               TEXT (not null)
├── full_name           TEXT
├── business_name       TEXT
├── business_address    TEXT
├── phone               TEXT
├── tax_id              TEXT (GST number, VAT ID, EIN, etc.)
├── logo_url            TEXT (URL to uploaded logo in Supabase Storage)
├── brand_color         TEXT (hex code, e.g., "#534AB7")
├── default_payment_terms  INTEGER (days, e.g., 30)
├── default_tax_rate    DECIMAL (percentage, e.g., 18.00)
├── default_notes       TEXT (default invoice footer text)
├── payment_details     JSONB (flexible: bank info, UPI, PayPal, etc.)
├── invoice_prefix      TEXT (default: "INV")
├── next_invoice_number INTEGER (default: 1, auto-increments)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

**payment_details JSONB structure example:**
```json
{
  "bank_name": "State Bank of India",
  "account_number": "1234567890",
  "ifsc_code": "SBIN0001234",
  "account_holder": "Naseeb PK",
  "upi_id": "naseeb@upi",
  "paypal_email": ""
}
```

### Table: clients
Stores client information.
```
clients
├── id                  UUID (primary key)
├── user_id             UUID (foreign key → users.id)
├── name                TEXT (not null — person or company name)
├── email               TEXT
├── company             TEXT
├── address             TEXT
├── phone               TEXT
├── tax_id              TEXT
├── payment_terms       INTEGER (client-specific override, nullable)
├── notes               TEXT (internal notes, never shown on invoice)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

### Table: invoices
Stores invoice header information.
```
invoices
├── id                  UUID (primary key)
├── user_id             UUID (foreign key → users.id)
├── client_id           UUID (foreign key → clients.id)
├── invoice_number      TEXT (e.g., "INV-0042")
├── status              TEXT (enum: "draft", "sent", "viewed", "overdue", "paid")
├── issue_date          DATE
├── due_date            DATE
├── subtotal            DECIMAL
├── discount_type       TEXT (nullable: "percentage" or "flat")
├── discount_value      DECIMAL (nullable)
├── tax_rate            DECIMAL
├── tax_amount          DECIMAL
├── total               DECIMAL
├── notes               TEXT (appears on invoice, e.g., "Thank you for your business")
├── payment_details     JSONB (snapshot of payment info at time of invoice)
├── sent_at             TIMESTAMP (nullable)
├── viewed_at           TIMESTAMP (nullable)
├── paid_at             TIMESTAMP (nullable)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

### Table: invoice_items
Stores individual line items for each invoice.
```
invoice_items
├── id                  UUID (primary key)
├── invoice_id          UUID (foreign key → invoices.id)
├── description         TEXT (not null)
├── quantity            DECIMAL (default: 1)
├── rate                DECIMAL (not null)
├── amount              DECIMAL (computed: quantity × rate)
├── sort_order          INTEGER (for maintaining item order)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

### Table: activity_log
Tracks invoice events for the dashboard activity feed.
```
activity_log
├── id                  UUID (primary key)
├── user_id             UUID (foreign key → users.id)
├── invoice_id          UUID (foreign key → invoices.id)
├── action              TEXT (enum: "created", "sent", "viewed", "paid", "reminder_sent")
├── metadata            JSONB (optional extra data)
├── created_at          TIMESTAMP
```

### Row Level Security (RLS)
All tables must have RLS enabled in Supabase so users can only access their own data:
```sql
-- Example policy for invoices table
CREATE POLICY "Users can only see their own invoices"
ON invoices FOR ALL
USING (auth.uid() = user_id);
```
Apply similar policies to all tables.

---

## 4. Application Structure

### App Architecture (Single-Page Focus)
The app is intentionally simple. There is one main screen (the dashboard) and everything else is accessed through modals, slide-overs, or the profile dropdown.

### Navigation
- **Top navbar only** — no sidebar
- **Left side:** Logo ("Billcraft")
- **Right side:** "+ New Invoice" button, Profile avatar
- **Profile dropdown contains:** Clients, Business Profile, Invoice Defaults, Payment Details, Account, Log Out

### Page Routes
```
/                       → Redirect to /dashboard (if logged in) or /login
/login                  → Login page
/signup                 → Signup page
/dashboard              → Main app screen (stats + invoice list)
/invoices/new           → Invoice creation flow (full page or modal)
/invoices/[id]          → Invoice detail view
/invoices/[id]/edit     → Edit existing invoice
/settings/profile       → Business profile settings
/settings/invoices      → Invoice defaults
/settings/payment       → Payment details
/settings/account       → Account settings
/clients                → Client list
/clients/[id]           → Client detail (invoice history)
```

---

## 5. Screen-by-Screen Specification

---

### 5.1 Login & Signup

**Login Page**
- Email + password fields
- "Log in" button
- Link to signup: "Don't have an account? Sign up"
- Simple centered card layout
- Logo at top

**Signup Page**
- Full name, email, password fields
- "Create account" button
- Link to login: "Already have an account? Log in"
- After signup → redirect to onboarding

**Onboarding (First-time only)**
After signup, guide the user through essential setup in 3 steps:
1. **Business details** — Business name, address (optional), logo upload (optional)
2. **Invoice defaults** — Payment terms (dropdown: Net 15 / Net 30 / Net 45 / Net 60 / Due on receipt), Tax rate (optional), Default notes
3. **Payment details** — Bank name, account number, IFSC/routing, UPI ID, PayPal (all optional)

Each step should be skippable. Show a "Complete later in settings" option. The goal is to capture enough defaults so the first invoice creation is fast.

---

### 5.2 Dashboard (Main Screen)

This is the primary screen of the app. Everything lives here.

**Layout: Top to bottom**

**1. Metric Cards Row (4 cards in a grid)**
| Card | Value | Sub-text | Color |
|------|-------|----------|-------|
| Total Outstanding | Sum of all unpaid invoices | "{n} invoices" | Default |
| Overdue | Sum of overdue invoices | "{n} invoices" | Red |
| Paid This Month | Sum of paid invoices this calendar month | "{n} invoices" | Green |
| Draft | Sum of draft invoices | "{n} invoices" | Default |

**2. Overdue Alert Strip**
- Only visible when there are overdue invoices
- Red-tinted horizontal bar
- Shows: "2 invoices overdue — Marcus Chen ($1,800 · 14d) and Bloom Studio ($1,400 · 7d)"
- "View overdue" link that activates the Overdue filter tab

**3. Invoice List Section**

Section header: "All invoices" on left, filter tabs + search on right.

**Filter tabs (pill-shaped):**
All (count), Draft (count), Sent (count), Viewed (count), Overdue (count), Paid (count)

**Search:** Simple text input, searches invoice number, client name, and description.

**Table columns:**
| Column | Content | Notes |
|--------|---------|-------|
| Invoice | Invoice number (e.g., INV-0040) | Purple/brand colored, clickable |
| Client | Client name + description below | Name bold, description in muted text |
| Status | Status badge | Color-coded pill |
| Issued | Issue date | Short format: "Mar 11" |
| Due | Due date | Short format: "Apr 10" |
| Amount | Total amount | Right-aligned, bold |
| Actions | "···" menu | Dropdown: View, Edit, Duplicate, Download PDF, Delete |

**Status badge colors:**
- Draft → Gray background, dark gray text
- Sent → Blue background, dark blue text
- Viewed → Amber/yellow background, dark amber text
- Overdue → Red background, dark red text
- Paid → Green background, dark green text

**Empty state (no invoices yet):**
Centered illustration or icon, "No invoices yet", "Create your first invoice to get started", Primary CTA button: "+ Create Invoice"

**Sorting:** Default sort is by issue date, newest first. Clicking column headers should toggle sort direction.

---

### 5.3 Invoice Creation Flow

**Access:** Clicking "+ New Invoice" opens the creation flow. On desktop, this should be a full-page view with a two-column layout: form on the left, live preview on the right.

**Two-Column Desktop Layout:**
- Left column (55%): Form inputs, stepped sections
- Right column (45%): Live invoice preview that updates as the user fills in the form
- The preview shows exactly what the final PDF will look like

**The form is divided into collapsible/scrollable sections (NOT a stepped wizard on desktop).** All sections are visible and editable. This works better on desktop because users can see the full picture and jump between sections.

#### Section 1: Client
- **Client selector:** Dropdown/combobox that searches existing clients by name or email
- **"+ Add new client" option** at the bottom of the dropdown
- If "Add new client" is selected, expand an inline form:
  - Name (required)
  - Email (required)
  - Company (optional)
  - Address (optional)
- After adding, auto-select the new client
- **For returning clients:** Show last invoice info: "Last invoiced: Mar 1, 2026 — $2,400"
- **"Duplicate last invoice" shortcut:** If client has previous invoices, show a link "Use items from last invoice" that pre-fills line items

#### Section 2: Line Items
- Each line item row:
  - Description (text input, with autocomplete from previous descriptions)
  - Quantity (number input, default: 1)
  - Rate (number input, currency formatted)
  - Amount (auto-calculated: quantity × rate, read-only)
  - Delete button (trash icon)
- "+ Add item" button below the last row
- **Running subtotal** always visible below the items

#### Section 3: Pricing Summary
- Subtotal (auto-calculated from line items)
- Discount toggle: "Add discount" link
  - When expanded: Type selector (% or flat) + value input
  - Shows calculated discount amount
- Tax: Pre-filled from user's default tax rate
  - Percentage input, editable per invoice
  - Toggle to disable tax for this invoice
  - Shows calculated tax amount
- **Total** (bold, large) = Subtotal - Discount + Tax

#### Section 4: Details
- **Invoice number:** Auto-generated (e.g., "INV-0042"), editable
- **Issue date:** Date picker, default: today
- **Due date:** Date picker, auto-calculated from client payment terms (or user default). Shows "(Net 30)" label next to it
- **Notes:** Text area, pre-filled from user defaults. Placeholder: "Payment terms, thank you message, etc."

#### Section 5: Payment Details
- Pre-filled from user settings
- Show all configured payment methods (bank, UPI, PayPal)
- Each field is editable per invoice (in case you use a different account)
- Preview shows how this will appear on the PDF

#### Actions (sticky at bottom of left column):
- **"Download PDF"** — Secondary button. Generates and downloads PDF immediately
- **"Send via Email"** — Primary button. Opens a small modal:
  - To: Pre-filled with client email
  - Subject: "Invoice {INV-0042} from {Business Name}"
  - Message: Short default text (2 lines)
  - "Send" button
  - Sends email with PDF attachment, sets status to "sent"
- **"Save as Draft"** — Tertiary/text button. Saves without sending

---

### 5.4 Invoice Detail View

**Access:** Click any invoice row in the dashboard table.

**Layout:** Two-column on desktop. Left: invoice metadata and actions. Right: PDF preview.

**Left Column — Invoice Info:**

**Status timeline** (vertical):
- Created: {date} ✓
- Sent: {date} ✓ (or "Not yet sent")
- Viewed: {date} ✓ (or "Not yet viewed")
- Paid: {date} ✓ (or "Awaiting payment")

**Invoice summary:**
- Invoice number
- Client name and email
- Issue date / Due date
- Amount

**Actions:**
- "Mark as Paid" — Primary CTA (only if not yet paid). Opens a small confirmation with optional payment date and note
- "Send Reminder" — Secondary button. Sends a follow-up email to client
- "Download PDF" — Secondary button
- "Edit Invoice" — Only available for Draft invoices
- "Duplicate" — Creates a new draft with the same client and line items
- "Delete" — Destructive action with confirmation modal. Only for drafts

**Right Column — PDF Preview:**
- Rendered preview of the invoice PDF
- Matches exactly what the downloaded/emailed PDF looks like

---

### 5.5 Client List

**Access:** Profile dropdown → Clients

**Layout:**
- Page title: "Clients"
- Search bar
- "+ Add Client" button

**Client cards or table rows showing:**
- Client name
- Company
- Email
- Total invoiced (all time)
- Outstanding amount
- Number of invoices
- Last invoice date

**Clicking a client** opens client detail:
- Contact information
- Edit client info
- Invoice history (list of all invoices for this client)
- Payment summary: total invoiced, total paid, total outstanding, average days to pay

---

### 5.6 Settings Pages

All accessed from profile dropdown.

**Business Profile:**
- Logo upload (drag and drop or click to browse)
- Business name
- Business address
- Phone
- Tax ID / GST number
- Brand color picker (used on invoice PDF)
- Save button

**Invoice Defaults:**
- Invoice number prefix (default: "INV")
- Next invoice number (editable)
- Default payment terms (dropdown)
- Default tax rate (percentage input)
- Default notes (textarea)
- Save button

**Payment Details:**
- Bank name
- Account number
- IFSC / Routing number
- Account holder name
- UPI ID
- PayPal email
- Save button
- Note: "These details appear on your invoices. Clients will use them to pay you."

**Account:**
- Email (read-only or changeable)
- Change password
- Delete account (with confirmation)

---

## 6. Invoice PDF Template

The PDF is the product. This is what clients see. It must look professional.

### Layout Structure (A4 page):

```
┌─────────────────────────────────────────────┐
│  [LOGO]                    INVOICE           │
│  Business Name             Invoice #: INV-042│
│  Business Address          Date: Mar 14, 2026│
│  Phone / Email             Due: Apr 13, 2026 │
│                                              │
├─────────────────────────────────────────────┤
│  BILL TO:                                    │
│  Client Name                                 │
│  Client Company                              │
│  Client Address                              │
│  Client Email                                │
│                                              │
├─────────────────────────────────────────────┤
│  Description          Qty    Rate    Amount  │
│  ─────────────────────────────────────────── │
│  Website Design        1    $3,000   $3,000  │
│  Logo Design           1    $800     $800    │
│  Brand Guidelines      1    $1,200   $1,200  │
│                                              │
│                        ──────────────────── │
│                        Subtotal:    $5,000   │
│                        Discount:    -$500    │
│                        Tax (18%):   $810     │
│                        ════════════════════  │
│                        TOTAL:       $5,310   │
│                                              │
├─────────────────────────────────────────────┤
│  PAYMENT DETAILS                             │
│  ┌─────────────────────────────────────────┐ │
│  │  Bank: State Bank of India              │ │
│  │  Account: 1234567890                    │ │
│  │  IFSC: SBIN0001234                      │ │
│  │  UPI: naseeb@upi                        │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Notes:                                      │
│  Thank you for your business. Payment is     │
│  due within 30 days of invoice date.         │
│                                              │
└─────────────────────────────────────────────┘
```

### Design Details:
- Business logo in top-left, max height 60px
- Brand color used as accent (top border line, or heading colors)
- "INVOICE" title in large text, top-right
- Clean table with subtle row separators
- Payment details in a bordered/highlighted box — this must be highly visible
- Total amount should be the most prominent number on the page
- Professional typography: system fonts for compatibility

---

## 7. Email Templates

### Invoice Email (when sending invoice)
**Subject:** Invoice {INV-0042} from {Business Name}
**Body:**
```
Hi {Client Name},

Please find attached invoice {INV-0042} for {Total Amount}.

Payment is due by {Due Date}. Payment details are included in the invoice.

Thank you,
{Freelancer Name}
{Business Name}
```
**Attachment:** Invoice PDF

### Reminder Email (manual trigger)
**Subject:** Reminder: Invoice {INV-0042} — Payment Due
**Body:**
```
Hi {Client Name},

This is a friendly reminder that invoice {INV-0042} for {Total Amount} is {overdue by X days / due on Due Date}.

Payment details are included in the attached invoice.

Thank you,
{Freelancer Name}
{Business Name}
```
**Attachment:** Invoice PDF

---

## 8. Project Folder Structure

```
billcraft/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (navbar, providers)
│   │   ├── page.tsx                  # Redirect to /dashboard or /login
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Main screen: stats + invoice list
│   │   ├── invoices/
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Invoice creation
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Invoice detail
│   │   │       └── edit/
│   │   │           └── page.tsx      # Edit invoice
│   │   ├── clients/
│   │   │   ├── page.tsx              # Client list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Client detail
│   │   ├── settings/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   └── page.tsx
│   │   │   ├── payment/
│   │   │   │   └── page.tsx
│   │   │   └── account/
│   │   │       └── page.tsx
│   │   └── api/                      # API routes
│   │       ├── invoices/
│   │       │   ├── route.ts          # CRUD operations
│   │       │   ├── [id]/
│   │       │   │   ├── route.ts
│   │       │   │   ├── pdf/
│   │       │   │   │   └── route.ts  # PDF generation endpoint
│   │       │   │   └── send/
│   │       │   │       └── route.ts  # Email sending endpoint
│   │       │   └── reminder/
│   │       │       └── route.ts
│   │       └── clients/
│   │           └── route.ts
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProfileDropdown.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCards.tsx
│   │   │   ├── OverdueStrip.tsx
│   │   │   ├── InvoiceTable.tsx
│   │   │   ├── InvoiceRow.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── FilterTabs.tsx
│   │   ├── invoices/
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── ClientSelector.tsx
│   │   │   ├── LineItemsEditor.tsx
│   │   │   ├── PricingSummary.tsx
│   │   │   ├── InvoicePreview.tsx
│   │   │   ├── SendInvoiceModal.tsx
│   │   │   └── InvoiceStatusTimeline.tsx
│   │   ├── clients/
│   │   │   ├── ClientList.tsx
│   │   │   └── ClientCard.tsx
│   │   └── pdf/
│   │       └── InvoiceTemplate.tsx   # @react-pdf/renderer template
│   │
│   ├── lib/                          # Utility functions
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── server.ts             # Server Supabase client
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── utils.ts                  # General helpers
│   │   ├── format.ts                 # Currency, date formatters
│   │   └── constants.ts              # App-wide constants
│   │
│   └── types/                        # TypeScript types
│       ├── database.ts               # Generated from Supabase
│       ├── invoice.ts
│       └── client.ts
│
├── public/                           # Static assets
│   └── logo-placeholder.svg
│
├── supabase/
│   └── migrations/                   # Database migrations
│       └── 001_initial_schema.sql
│
├── .env.local                        # Environment variables (NEVER commit this)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 9. Build Sequence (Step by Step)

Follow this order exactly. Do not skip ahead.

### Phase 1: Project Setup (Day 1-2)

**Step 1: Create Next.js project**
```bash
npx create-next-app@latest billcraft --typescript --tailwind --eslint --app --src-dir
cd billcraft
```

**Step 2: Install dependencies**
```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add @react-pdf/renderer
pnpm add resend
pnpm add date-fns
pnpm add lucide-react
pnpm add -D supabase
```

**Step 3: Set up shadcn/ui**
```bash
npx shadcn@latest init
npx shadcn@latest add button input label card dropdown-menu dialog select textarea badge table tabs popover command separator avatar
```

**Step 4: Set up Supabase**
- Create a project at supabase.com
- Copy the project URL and anon key
- Create `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=your-resend-key (add later)
```

**Step 5: Create database tables**
Run the SQL from Section 3 in Supabase SQL Editor. Enable RLS on all tables.

**Step 6: Set up Supabase client files**
Create `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` following Supabase Next.js docs.

**Step 7: Deploy to Vercel**
- Push code to GitHub
- Connect repo to Vercel
- Add environment variables in Vercel dashboard
- Verify deployment works

### Phase 2: Authentication (Day 3-4)

**Step 8:** Build login page (`/login`)
**Step 9:** Build signup page (`/signup`)
**Step 10:** Set up auth middleware (protect /dashboard and all app routes)
**Step 11:** Build onboarding flow (`/onboarding`) — 3 steps: business info, invoice defaults, payment details
**Step 12:** Test: Sign up → Onboarding → Redirect to dashboard

### Phase 3: Dashboard Shell (Day 5-7)

**Step 13:** Build the Navbar component (logo, "+ New Invoice" button, profile avatar)
**Step 14:** Build the ProfileDropdown component with all menu items
**Step 15:** Build the MetricCards component (4 cards, hardcoded data first)
**Step 16:** Build the InvoiceTable component with StatusBadge (hardcoded data first)
**Step 17:** Build FilterTabs component
**Step 18:** Connect dashboard to real data from Supabase
**Step 19:** Build the OverdueStrip component

### Phase 4: Client Management (Day 8-9)

**Step 20:** Build the Clients page (`/clients`) — list view
**Step 21:** Build "Add Client" form (can be modal or separate page)
**Step 22:** Build Client Detail page (`/clients/[id]`) — info + invoice history
**Step 23:** Test: Add client → See in list → View detail

### Phase 5: Invoice Creation (Day 10-14)

**Step 24:** Build the invoice creation page layout (two-column: form + preview)
**Step 25:** Build ClientSelector component (search existing + add new inline)
**Step 26:** Build LineItemsEditor component (add/remove rows, auto-calculate)
**Step 27:** Build PricingSummary component (subtotal, discount, tax, total)
**Step 28:** Build the Details section (invoice number, dates, notes)
**Step 29:** Build the Payment Details section (pre-filled, editable)
**Step 30:** Build InvoicePreview component (live preview in right column)
**Step 31:** Implement "Save as Draft" functionality
**Step 32:** Test: Create invoice → Save draft → See in dashboard

### Phase 6: PDF Generation (Day 15-17)

**Step 33:** Build InvoiceTemplate with @react-pdf/renderer
**Step 34:** Create API route for PDF generation (`/api/invoices/[id]/pdf`)
**Step 35:** Implement "Download PDF" button
**Step 36:** Test: Create invoice → Download PDF → Verify it looks professional

### Phase 7: Email Sending (Day 18-19)

**Step 37:** Set up Resend account and verify domain
**Step 38:** Create API route for sending invoice email (`/api/invoices/[id]/send`)
**Step 39:** Build SendInvoiceModal (to, subject, message fields)
**Step 40:** Implement send flow: generate PDF → attach to email → send → update status to "sent"
**Step 41:** Build reminder email functionality
**Step 42:** Test: Create invoice → Send → Check email received with PDF

### Phase 8: Invoice Detail & Status Management (Day 20-22)

**Step 43:** Build Invoice Detail page (`/invoices/[id]`)
**Step 44:** Build InvoiceStatusTimeline component
**Step 45:** Implement "Mark as Paid" action
**Step 46:** Implement "Duplicate Invoice" action
**Step 47:** Implement "Delete Invoice" action (drafts only)
**Step 48:** Build Edit Invoice page (`/invoices/[id]/edit`)

### Phase 9: Settings Pages (Day 23-25)

**Step 49:** Build Business Profile settings page
**Step 50:** Build Invoice Defaults settings page
**Step 51:** Build Payment Details settings page
**Step 52:** Build Account settings page
**Step 53:** Implement logo upload to Supabase Storage

### Phase 10: Polish & Launch (Day 26-30)

**Step 54:** Add loading states to all pages (skeletons, spinners)
**Step 55:** Add error handling (toast notifications for success/failure)
**Step 56:** Add empty states for dashboard, client list
**Step 57:** Mobile responsiveness (test all pages on mobile viewport)
**Step 58:** Final testing of complete flow: Signup → Onboard → Create Client → Create Invoice → Download PDF → Send Email → Mark Paid
**Step 59:** Set up custom domain on Vercel
**Step 60:** Launch

---

## 10. Design Tokens

### Colors
```
Brand Primary:       #534AB7 (purple — used for CTAs, links, brand accents)
Brand Primary Hover: #3C3489

Status Colors:
  Draft:    bg #F1EFE8, text #5F5E5A
  Sent:     bg #E6F1FB, text #185FA5
  Viewed:   bg #FAEEDA, text #854F0B
  Overdue:  bg #FCEBEB, text #A32D2D
  Paid:     bg #E1F5EE, text #0F6E56

Text:
  Primary:   #18181B (near-black)
  Secondary: #71717A (muted)
  Tertiary:  #A1A1AA (hints)

Backgrounds:
  Primary:   #FFFFFF
  Secondary: #F4F4F5 (cards, metric boxes)

Borders:      #E4E4E7
```

### Typography (Tailwind classes)
```
Page title:      text-xl font-medium (20px)
Section title:   text-sm font-medium (15px, approximate with Tailwind)
Table header:    text-xs uppercase tracking-wider text-muted-foreground
Body text:       text-sm (14px)
Small/meta:      text-xs (12px)
Metric value:    text-2xl font-medium (22px)
Metric label:    text-xs uppercase tracking-wider
```

### Spacing
```
Page padding:    px-8 py-7 (32px horizontal, 28px vertical)
Card padding:    p-4 (16px)
Card gap:        gap-3 (12px)
Section gap:     mb-7 (28px)
```

### Component Patterns
```
Metric card:     bg-secondary rounded-lg p-4
Status badge:    inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium
Filter tab:      px-3 py-1 text-xs rounded-full border
Profile avatar:  w-8 h-8 rounded-full bg-emerald-50 text-emerald-700
Primary button:  bg-[#534AB7] hover:bg-[#3C3489] text-white rounded-md px-4 py-2 text-sm font-medium
```

---

## 11. Important Implementation Notes

### For Cursor + Claude

1. **Always reference this document** when asking Claude to build a component. Say: "Build the MetricCards component as described in the project spec section 5.2"

2. **Build one component at a time.** Don't ask Claude to build the entire dashboard at once. Ask for MetricCards first, verify it works, then move to InvoiceTable.

3. **Test after every step.** Run `pnpm dev` and check the browser after each component. Don't batch 5 steps and hope they all work.

4. **When you hit errors:** Copy the full error message and paste it to Claude. Say "I got this error when running the app. Here's the relevant file: [paste the file]." Give Claude context.

5. **Use Git commits after each working step.** This way you can always go back to a working state. Learn these 3 commands:
   - `git add .` (stage all changes)
   - `git commit -m "Added MetricCards component"` (save a checkpoint)
   - `git push` (push to GitHub, triggers Vercel deploy)

6. **Don't customize the design early.** Get functionality working with basic shadcn/ui styling first. Polish the design after everything works.

7. **Supabase dashboard is your friend.** You can view and edit data directly in Supabase's table editor. Use it to add test data while building.

---

## 12. Environment Variables Required

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxx

# App
NEXT_PUBLIC_APP_URL=https://billcraft.vercel.app (or your custom domain)
```

Never commit `.env.local` to Git. Add it to `.gitignore`.
