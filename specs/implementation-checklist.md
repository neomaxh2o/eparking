# Implementation Checklist - Caja / Turnos MVP

Estimated total: 40-56 hours (depending on test coverage and polish)

1) Project setup (2h)
- Create routes folder: /routes/caja
- Create controllers: shifts, tickets, cashMovements, reports
- Add middleware: auth (JWT), role-checker, errorHandler
- Install deps: mongoose, express, joi/ajv, jsonwebtoken

2) Models (3h)
- Implement Mongoose models using INSTALL/specs/caja-models.json
- Add indexes (storeId, shiftId)
- Add helper methods: Shift.incrementTotals(ticketTotal, cashMovementAmount)

3) Auth & RBAC (4h)
- JWT middleware to set req.user = { id, roles }
- Role middleware: ensureRole([...])
- Ownership check helper (isOwnerOrRole)

4) Shifts controller (6-8h)
- POST /shifts/open: validate, ensure no conflicting open shift, create shift
- GET /shifts and GET /shifts/:id
- POST /shifts/:id/close: transactionally compute expectedCash (startingCash + ticketsTotal + cashMovementsTotal), set actualCash, set status closed, set closedBy/closedAt
- Unit tests for edge cases (409 on duplicate open, 400 invalid actualCash)

5) Tickets controller (6-8h)
- POST /tickets: validate items, compute totals, ensure shift is open, create ticket, update shift.ticketsCount and shift.ticketsTotal (atomic/transaction)
- GET /tickets/:id
- Tests: item sum mismatch, no open shift

6) CashMovements controller (4-6h)
- POST /cash-movements: validate, attach to shift if provided and open, update shift.cashMovementsTotal
- Tests: negative amount rejection, shift closed rejection

7) Reports endpoint (2-3h)
- GET /reports/shift/:id: returns shift, related tickets, cashMovements, and summary (expected, actual, difference)

8) Validation & Error handling (2h)
- Central error handler, standard HTTP codes, validation via Joi or AJV

9) Transactions & Concurrency (4h)
- Use mongoose session for multi-doc updates (ticket creation + shift update, close shift)
- Test concurrent ticket creations (race conditions)

10) Acceptance tests / E2E (4-6h)
- Automated tests hitting API flows: open -> create ticket -> cash movement -> close and report

11) README & docs (1-2h)
- Document env vars, migrations, run instructions, sample JWT generation

Optional polish (UI stubs or Postman collection) (2-4h)

---

Notes:
- Time estimates assume developer familiar with Node/Express/Mongoose.
- Prioritize transactional integrity for financial flows.

