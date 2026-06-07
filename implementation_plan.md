# Implementation Plan - Stripe Payment Integration

We will integrate Stripe payment processing into the Economical Research platform using Stripe Checkout. This will replace the "Coming Soon" waitlist panel with real Stripe billing flows.

---

## Proposed Changes

### 1. Environment Config
#### [MODIFY] [server/.env](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/server/.env)
* Add `STRIPE_KEY=sk_test_...[REDACTED]`

#### [NEW] [client/.env](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/client/.env)
* Add `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Tff8Q2Lndfzgson86z7O1cCDjJZGpQHtmxWJjWMiddNofYxLqSX1NG3yYaDA2A4w8Nt5ptCcGCo25ieBMpU5rJ000MxIIjOoV`

### 2. Backend Routing
#### [MODIFY] [server/routes/billing.js](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/server/routes/billing.js)
* Change success redirect URL to point to the base path with session parameters:
  `success_url: ${req.headers.origin}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`
* Change cancel redirect URL to point to base path with view parameter:
  `cancel_url: ${req.headers.origin}?view=billing&cancelled=true`

### 3. Frontend App Routing & Upgrades
#### [MODIFY] [client/src/App.jsx](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/client/src/App.jsx)
* Add a `useEffect` hook on mount to intercept query parameters (`session_id`, `view`).
* Redirect the active view to `'billing'` if `session_id` is present to ensure that the billing component is mounted and handles verification.

#### [MODIFY] [client/src/components/Billing.jsx](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/client/src/components/Billing.jsx)
* Update checkout verification `useEffect` hook: call `/api/billing/session-status?session_id=...` to verify session completion before calling `upgradeToPro(plan)`.

---

## Verification Plan
1. **Billing page load**: Ensure waitlist form is gone when `isStripeConfigured` is true.
2. **Upgrade trigger**: Confirm clicking "Upgrade to PRO" redirects to Stripe-hosted Checkout session.
3. **Redirection & Verification**: Complete test payment, ensure redirection lands back on base URL, mounts Billing console, verifies with backend, and displays the "Upgrade successful! PRO Press" status.
