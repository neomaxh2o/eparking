# Caja / Turnos MVP - Technical Specification

Version: 1.0
Author: planner-agent (for builder-agent)

## Overview
Small cashier & shift management (Caja/Turnos) MVP for PoS-style workflows: open/close shifts, create tickets (sales), register cash movements (payments/corrections), and basic reporting. Focus: backend-first, REST API, MongoDB (Mongoose models), JWT-based auth with role checks.

Goals:
- Allow users with role `cashier` to open/close shifts and create tickets.
- Allow users with role `manager` to view reports and force-close shifts.
- Persist Shift, Ticket, CashMovement entities with audit fields.

Non-goals:
- No payment gateway integration
- No multi-currency or tax engine
- No refunds beyond negative Ticket lines or CashMovement adjustments

---

## Data Models (High level)
Entities: Shift, Ticket, CashMovement
- Shift: represents a cashier session (opened/closed), totals snapshot, user reference, state
- Ticket: a sale or transaction recorded within a Shift
- CashMovement: manual cash adjustments (cash-ins, cash-outs), reconciliation entries

All models must include: createdAt, updatedAt (timestamps) and createdBy (userId) and optional notes.

---

## DB Schema (fields exactly to implement)
See INSTALL/specs/caja-models.json (Mongoose-ready) for exact types and validations. Quick summary:

Shift
- _id: ObjectId
- storeId: ObjectId (index)
- openedBy: ObjectId (user)
- openedAt: Date
- closedBy: ObjectId (user) | null
- closedAt: Date | null
- status: String enum: ["open","closed","suspended"]
- startingCash: Number (cents)
- expectedCash: Number (cents) // computed or supplied at close
- actualCash: Number (cents) | null
- ticketsCount: Number (default 0)
- ticketsTotal: Number (cents, default 0)
- cashMovementsTotal: Number (cents, default 0)
- notes: String

Ticket
- _id
- shiftId: ObjectId (index)
- storeId: ObjectId
- createdBy: ObjectId (user)
- createdAt: Date
- status: String enum: ["pending","paid","voided"]
- total: Number (cents)
- items: [ { sku: String, name: String, qty: Number, unitPrice: Number (cents), totalPrice: Number (cents) } ]
- paymentMethod: String enum ["cash","card","other"]
- payments: [ { method: String, amount: Number (cents), reference: String } ]
- notes: String

CashMovement
- _id
- shiftId: ObjectId | null
- storeId: ObjectId
- createdBy: ObjectId
- createdAt: Date
- type: String enum ["in","out","adjustment"]
- amount: Number (cents, positive)
- direction: String enum ["in","out"]  // redundant but explicit
- reason: String
- reference: String (optional)

---

## API Contract (human readable)
See INSTALL/specs/caja-api.json for machine-readable endpoint list. Below are key endpoints and examples.

Authentication: JWT bearer token. Token must include `userId` and `roles` array. Role checks described per-endpoint.

Headers: Authorization: Bearer <token>

Common query params: storeId required on multi-store setups (prefer in body for POST/PUT).

Endpoints (summary):
- POST /api/shifts/open - Open a shift (role: cashier)
- POST /api/shifts/:id/close - Close shift (role: cashier)
- GET /api/shifts?storeId=...&status=open - List shifts (role: cashier|manager)
- GET /api/shifts/:id - Get shift by id
- POST /api/tickets - Create ticket under open shift (role: cashier)
- GET /api/tickets/:id - Get ticket
- POST /api/cash-movements - Create cash movement (role: cashier)
- GET /api/reports/shift/:id - Shift summary (role: cashier|manager)

Sample: Open shift
Request: { "storeId": "...", "startingCash": 10000 }
Response: 201 { "_id":"...", "storeId":"...","openedBy":"...", "openedAt":"...","status":"open","startingCash":10000 }

Validations (high-level):
- startingCash >= 0
- Only one open shift per store per user (configurable: default single open per store)
- Ticket total must equal sum(items) and >= 0
- CashMovement.amount > 0

---

## Auth & Authorization Rules
Roles: cashier, manager, admin
- cashier: can open/close shifts they own, create tickets, create cash movements in their open shift, view their shifts and tickets
- manager: can view all shifts/tickets for store, force-close any shift, view reports
- admin: full access

Ownership: Non-admins may only act on shifts/tickets for which they are the `openedBy` or `createdBy`, except managers.

---

## UI Flows (for frontend implementation)
Design minimal screens: Login, Shift List, Shift Details, Open Shift, Close Shift, New Ticket, Cash Movement, Shift Report

Key flows:
1) Open Shift
- UI: input startingCash (required), notes (optional)
- Call POST /api/shifts/open -> on success navigate to Shift Details

2) Create Ticket
- UI: select items, qty, calculate totals, choose payment method, submit
- Call POST /api/tickets with shiftId of the currently open shift

3) Close Shift
- UI: prompt to enter actualCash (counted cash), optional notes
- Call POST /api/shifts/:id/close with actualCash -> response includes reconciliation and differences

---

## Acceptance Tests (examples)
1) Open Shift
- Given user with role `cashier` and no open shift for store S
- When they call POST /api/shifts/open with startingCash 10000
- Then response 201 and Shift.status == "open" and startingCash==10000 and openedBy==userId

2) Prevent duplicate open
- Given user with open shift for store S
- When they call POST /api/shifts/open
- Then response 409 Conflict

3) Create Ticket applies to open shift
- Given open shift for store S
- When POST /api/tickets with items totaling 5000
- Then response 201 with ticket.total==5000 and shift.ticketsCount incremented and shift.ticketsTotal increased

4) Close shift recalculates totals
- Given shift with tickets and cash movements
- When POST /api/shifts/:id/close with actualCash
- Then Shift.status == "closed" and closedAt set and actualCash stored and expectedCash compared and difference computed

---

## Notes for Builder
- Use mongoose transactions for close-shift flows that update multiple documents (tickets, cashmovements totals, shift summary).
- Store monetary values as integer cents (Number) to avoid floats.
- All endpoints must validate user roles and resource ownership.
- Provide clear error codes: 400 validation, 401 auth, 403 forbidden, 404 not found, 409 conflict, 500 server error.


---

End of spec. See generated machine files for exact schemas and endpoints.
