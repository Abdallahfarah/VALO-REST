Purpose
Defines the technical architecture.
Contents
Multi-tenant SaaS
Restaurant isolation
Shared PostgreSQL
Express architecture
Prisma architecture
Supabase integration
Frontend architecture
Backend architecture
Realtime architecture
Folder structure
Repository strategy
Deployment topology
Scaling strategy
Future architecture
# VALO-REST — Unified Restaurant Currency Architecture

## Objective

Implement a single-source-of-truth currency architecture for every restaurant without breaking the existing multi-tenant SaaS system.

This is an application integration update only.

Do NOT redesign the architecture.

Do NOT duplicate currency values.

Do NOT introduce user-level currencies.

Maintain complete backward compatibility.

---

# Problem

The system currently allows currency inconsistencies.

Example:

Restaurant
Currency = ETB

Restaurant Admin
ETB

Cashier
USD ❌

POS
USD ❌

Reports
ETB

Dashboard
ETB

This must never happen.

A restaurant can only operate using ONE operational currency.

---

# Correct Architecture

The currency belongs ONLY to the Restaurant (Tenant).

NOT the user.

NOT the staff.

NOT individual modules.

The tenant is the single source of truth.

Example

Tenant
├── Currency = ETB
│
├── Admin
├── Waiter
├── Cashier
└── Kitchen Staff

Every user automatically uses ETB.

OR

Tenant
├── Currency = USD
│
├── Admin
├── Waiter
├── Cashier
└── Kitchen Staff

Every user automatically uses USD.

---

# Single Source Of Truth

The only place currency should exist is:

Restaurant (Tenant)

Example

tenant.currency_code

tenant.currency_symbol

No other table should maintain its own currency.

Users table must NOT have currency.

Orders must NOT have currency.

Receipts must NOT have currency unless storing a historical snapshot for completed transactions.

All live screens must read from the tenant.

---

# Restaurant Creation

When creating a new restaurant (registration or Platform Owner provisioning), include:

Restaurant Name

Owner Name

Email

Password

Subscription Plan

Currency

Options

• ETB (Ethiopian Birr)

• USD (US Dollar)

When submitted:

Save ONLY to the tenant record.

Example

currency_code = ETB

currency_symbol = ETB

OR

currency_code = USD

currency_symbol = $

Do not save currency anywhere else.

---

# Login Flow

After login:

User

↓

Load user

↓

Get tenant_id

↓

Load tenant

↓

Read tenant.currency_code

↓

Store inside RestaurantContext

↓

Every screen consumes RestaurantContext.currency

This happens automatically.

---

# Application Rule

Every restaurant module must display the tenant currency automatically.

This includes:

- Dashboard
- POS
- Kitchen Display
- Cashier
- Orders
- Receipts
- Reports
- Analytics
- AI Assistant
- Customer Bills
- Payment Summary
- Revenue Cards
- Charts
- Exports
- PDFs
- Print Receipts

No module may choose a different currency.

---

# Platform Owner Changes

If the Platform Owner edits a restaurant:

Restaurant

↓

Currency

↓

Save

↓

Update tenant.currency only

Immediately after saving:

Restaurant Admin

↓

ETB

Waiter

↓

ETB

Kitchen

↓

ETB

Cashier

↓

ETB

POS

↓

ETB

Reports

↓

ETB

Receipts

↓

ETB

Everything updates automatically because every screen reads from the tenant.

---

# Restaurant Admin

Restaurant Admin cannot create another currency.

Restaurant Admin can only:

View current currency.

If business rules allow editing, update the tenant currency only.

Never create a second currency value.

---

# Engineering Rules

Do NOT break authentication.

Do NOT modify tenant isolation.

Do NOT modify subscriptions.

Do NOT modify RBAC.

Do NOT duplicate currency fields.

Do NOT hardcode ETB or USD anywhere in the UI.

Every monetary display must use RestaurantContext.currency.

---

# Validation Checklist

✓ New restaurant selects ETB

→ Entire restaurant displays ETB.

✓ New restaurant selects USD

→ Entire restaurant displays USD.

✓ Platform Owner changes restaurant currency

→ Entire restaurant updates automatically.

✓ Restaurant Admin logs in

→ Uses tenant currency.

✓ Waiter logs in

→ Uses tenant currency.

✓ Cashier logs in

→ Uses tenant currency.

✓ Kitchen Staff logs in

→ Uses tenant currency.

✓ POS

→ Uses tenant currency.

✓ Dashboard

→ Uses tenant currency.

✓ Reports

→ Uses tenant currency.

✓ Receipts

→ Uses tenant currency.

✓ AI Assistant

→ Uses tenant currency.

No user should ever see a different currency from the restaurant they belong to.

---

# Expected Result

One Restaurant

↓

One Tenant

↓

One Currency

↓

One Source of Truth

↓

Every User

↓

Every Screen

↓

Every Calculation

↓

Every Report

↓

Every Receipt

Uses exactly the same currency with zero inconsistencies.