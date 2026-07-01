# AI Multi-Agent Research System Phase 2.1 — Implementation Plan

## Goal
Implement:
1. **Shareable Research URLs**: Path-based router support (`/research/{slug}`) mapping to a public Firestore collection.
2. **Academic Citation Export**:APA, MLA, Chicago, and Harvard formatter with individual copy/download actions.
3. **Smart Report Refresh**: Delta-updates for outdated sections while preserving bookmarks, user notes, and version history.

---

## Architecture Review & Additions

```
client/src/
├── utils/
│   └── CitationsFormatter.js   ← NEW: APA, MLA, Chicago, Harvard format compiler
│
├── research/
│   └── ResearchMemory.js       ← UPDATE: savePublicReport() and getPublicReport()
│
├── components/
│   ├── research/
│   │   ├── CitationsPanel.jsx  ← NEW: allows APA/MLA/Chicago/Harvard copying and exporting
│   │   └── RefreshButton.jsx   ← NEW: triggers delta refreshes for stale sections
│   └── ...
```

---

## Proposed Changes

### 1. Shareable Research URLs
- **Routing**: In `App.jsx`, add path-matching support:
  ```js
  } else if (path.startsWith('/research/')) {
    const slug = path.split('/').pop();
    // Fetch from public Firestore collection, set report in state, and route to er-research
  }
  ```
- **Public Storage**: In `ResearchMemory.js`, add `savePublicReport` and `getPublicReport` targeting the collection `research_memory_public/shared/reports/{slug}`.
- **Copy & Share Actions**: When a user clicks "Share", we upload the report payload to the public collection and construct the URL path `/research/{slug}`.

### 2. Academic Citations
- **Formatter**: `CitationsFormatter.js` compiles the four academic formats:
  - **APA**: Title (Date). Retrieved from URL
  - **MLA**: "Title." Date, URL.
  - **Chicago**: "Title." Date. URL.
  - **Harvard**: Title (Date), Available at: URL.
- **UI Integration**: Render a citation modal/tab within `SourceReliabilityPanel` enabling easy copying or downloading of `.txt` reference files.

### 3. Smart Report Refresh
- **Data Freshness**: Reports will display a `dataFreshness` indicator based on age:
  - `< 6 hours` → *Optimal Freshness*
  - `> 6 hours` → *Stale data check triggered. "New data is available for this research." banner shown.*
- **Delta-Updates**: Clicking "Refresh" triggers `Orchestrator.js` to re-run only the `research` (for current news) and `finance` (for rates) agents, leaving the `historical_bg` and custom user notes intact, merging the result, and saving it as a new version.

---

## Verification & Safety Rules

- **Zero regression**: Billing, outcome trackers, search, and existing chatbots remain functional.
- **Build Pass**: `npm run build` must complete with zero errors before pushing.
