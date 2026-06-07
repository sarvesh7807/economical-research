# Implementation Plan - Notifications System

We will build a comprehensive notifications infrastructure covering Browser Push permissions, Firebase Cloud Messaging tokens, in-app notification dropdown ledger, email alert dispatches, and granular settings preferences.

---

## Proposed Changes

### 1. Backend Server Services
#### [NEW] [server/routes/notifications.js](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/server/routes/notifications.js)
* Initialize endpoints:
  * `POST /register-token`: Save FCM token mapping per user uid in temporary memory ledger.
  * `POST /send-broadcast`: Send notification payload to all registered tokens (for Breaking News alerts).
  * `POST /send-user`: Send notification to a specific user.
  * `POST /dispatch-email`: Log simulated email dispatches (Welcome, Receipt, Reset, Digests) in terminal output.

#### [MODIFY] [server/index.js](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/server/index.js)
* Import and mount `/api/notifications` routing middleware.

### 2. Frontend Auth Context & Sync
#### [MODIFY] [client/src/contexts/AuthContext.jsx](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/client/src/contexts/AuthContext.jsx)
* Expand default user `settings` schema:
  * `emailAlerts`: true
  * `pushAlerts`: true
  * `favTopicAlerts`: true
  * `quietHours`: { enabled: false, start: "22:00", end: "07:00" }
  * `alertFrequency`: "Instant"
* Manage client-side `notifications` ledger state (limit 30):
  * `notifications`: array of objects `{ id, type, title, text, timestamp, read, url }` loaded/saved locally or via Firestore.
  * Methods: `addNotification(type, title, text, url)`, `markAsRead(id)`, `markAllRead()`, `clearAllNotifications()`.
* Setup FCM token registration hook (`registerFcmToken(token)`) syncing with backend.

### 3. Header in-app Bell Panel
#### [MODIFY] [client/src/components/Header.jsx](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/client/src/components/Header.jsx)
* Render a Bell icon in the sub-header (top-right side) with a pulsing red badge count.
* Clicking the bell toggles a floating dropdown panel displaying notification history.
* Render interactive actions (Mark read, clear, close) and clickable list items redirecting to articles or relevant pages.
* Integrate browser push permission prompt (`Notification.requestPermission()`) on the user's first visit.

### 4. Granular Settings Toggle view
#### [MODIFY] [client/src/components/Settings.jsx](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/client/src/components/Settings.jsx)
* Redesign the settings layout with a dedicated **"Notification Preferences"** segment.
* Provide switches for:
  * Breaking News alerts (Push & Email)
  * New Articles in Favorite category
  * Subscription reminders
  * Email notification toggles
  * Push alerts permission toggle
  * Quiet hours range selectors (start/end times)
  * Delivery frequency (`Instant`, `Daily`, `Weekly`)

### 5. FCM Push Service Worker
#### [NEW] [client/public/firebase-messaging-sw.js](file:///C:/Users/sarve/.gemini/antigravity/scratch/economical-research/client/public/firebase-messaging-sw.js)
* Create public folder service worker registering the background message listener to intercept push payloads.

---

## Verification Plan
1. **Permission prompts**: Verify a browser notification prompt is generated on mounting.
2. **In-App Bell Dropdown**: Send a mock breaking news alert, ensure the count badge updates, the dropdown lists the notification with timestamp/icon, and clicking marks it as read.
3. **Preferences save**: Change notification switches, toggle quiet hours, adjust frequency, save, and reload to verify firestore/localStorage sync.
4. **Mock Emails log**: Register a new account, check Express server console logs to verify the `Welcome email dispatched` message.
