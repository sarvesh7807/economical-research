# AI Multi-Agent Research System Phase 2 — Implementation Plan (Revised)

## Goal
Implement the **Deep Research Report Engine** with:
1. **Visible AI Thinking Process**: A step-by-step actual progress indicator.
2. **Streaming Report Generation**: Incremental UI updates as each agent completes.
3. **21-Section Report JSON**: Exhaustive analysis divided into facts vs predictions.
4. **Interactive components**: Collapsible panels, copying, bookmarking, and sharing.
5. **Smart Tables & Dynamic Charts**: Multi-type ECharts and TV Candlestick charts.
6. **Audience Reading Modes**: On-demand text adaptations.
7. **Research Version History**: Save versions, compare differences, restore old versions, and resume research.

---

## Architecture Additions

```
client/src/
├── ai/
│   └── agents/
│       ├── WritingAgent.js          ← generates structured 21-section JSON
│       └── Orchestrator.js          ← streams results incrementally via callbacks
│
├── research/
│   └── ResearchMemory.js            ← manages multi-version report structures in Firestore
│
├── components/
│   ├── research/
│   │   ├── ThinkingProcessPanel.jsx ← actual animated steps
│   │   ├── InteractiveSection.jsx   ← collapsible, copy, share, library save actions
│   │   ├── SmartTable.jsx           ← sortable grid data
│   │   ├── ReadingModeSelector.jsx  ← student, investor, executive, beginner, etc.
│   │   ├── ConfidenceDashboard.jsx  ← metrics & freshness score
│   │   ├── VersionHistoryPanel.jsx  ← NEW: compare versions, restore, view change history
│   │   └── LibraryManager.jsx       ← saves/manages reports
│   └── ...
```

---

## Proposed Changes

### 1. Streaming Report Generation
Instead of waiting for the full 7-agent pipeline to finish, the orchestrator will update the React state incrementally:
- **Planner complete** → Yields plan. UI shows the query intent and planned tasks.
- **Research complete** → Yields raw stats. UI renders *Historical Background*, *Current Situation*, and *Key Stats* tables immediately.
- **Finance complete** → Yields market signals. UI renders *Financial Analysis*, *Sector Impact*, and *Risk Assessment*.
- **Chart complete** → Yields chart parameters. UI renders ECharts/TradingView charts.
- **FactCheck complete** → Yields claim audits. UI renders fact check meters.
- **Citation complete** → Yields links. UI renders source tables.
- **Writing complete** → Yields the fully synthesized 21-section final document.

This creates a progressive, streaming research flow that grows in real time.

### 2. Research Version History
We will store report versions in Firestore:
`research_memory/{userId}/reports/{reportId}/versions/{versionId}`

Features implemented:
- **Save Version**: Every time a report is edited or refreshed, it saves a new version incrementing `reportVersion`.
- **Compare Versions**: `VersionHistoryPanel.jsx` allows selecting any two versions and showing a side-by-side textual delta.
- **Restore Version**: Replaces the active report with the contents of the chosen older version.
- **Continue Research**: Loads the selected version's query and plan parameters back into the active console, allowing users to tweak details and re-run the orchestrator.

### 3. Visible AI Thinking Process
`ThinkingProcessPanel.jsx` will animate live events emitted by `Orchestrator.js`. Every step represents actual, non-faked backend agent completions.

---

## Verification & Safety Rules

- **Zero regression**: Authentication, subscriptions, existing chatbots, RSS feeds, and admin panel remain untouched.
- **Vite bundle split**: Heavy new libraries are isolated inside chunked builds.
- **Build Pass**: `npm run build` is run and must complete with zero errors before pushing.
