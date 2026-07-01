# AI Multi-Agent Research System Phase 2 — Implementation Plan

## Goal
Implement the **Deep Research Report Engine** with a visible, real-time AI Thinking Process, an expanded 21-section interactive report structure, smart tables, dynamically chosen charts, a confidence system, audience reading modes, and an AI research library.

---

## Architecture Review & Additions

```
client/src/
├── ai/
│   └── agents/
│       ├── WritingAgent.js          ← UPDATE: generates structured 21-section JSON
│       └── Orchestrator.js          ← UPDATE: yields fine-grained thinking step events
│
├── components/
│   ├── research/
│   │   ├── ThinkingProcessPanel.jsx ← NEW: animated actual progress steps
│   │   ├── InteractiveSection.jsx   ← NEW: collapsible, copy, share, bookmark, save actions
│   │   ├── SmartTable.jsx           ← NEW: renders clean, sortable tabular data
│   │   ├── ReadingModeSelector.jsx  ← NEW: student, investor, executive, beginner, etc.
│   │   ├── ConfidenceDashboard.jsx  ← NEW: displays confidence scores & source freshness
│   │   └── LibraryManager.jsx       ← NEW: saves/manages reports in user's research library
│   └── ...
```

---

## Proposed Changes

### 1. Visible AI Thinking Process
We will replace the loading spinner with a structured, step-by-step progress visualizer (`ThinkingProcessPanel.jsx`). To ensure this progress is **never faked**, the `Orchestrator.js` will send specific events as it completes real tasks:
- `planner_start` → *Understanding Topic...*
- `planner_done` → *Planning Research Strategy...*
- `research_fetch` → *Searching Trusted Sources...*
- `research_parse` → *Reading Research Papers & Reports...*
- `finance_start` → *Collecting Financial Data...*
- `finance_rates` → *Checking Government Reports & Indicators...*
- `factcheck_start` → *Verifying Facts & Claims...*
- `citation_start` → *Attributing Citations...*
- `charts_start` → *Generating Interactive Charts...*
- `timeline_start` → *Generating Forecast Timeline...*
- `writing_start` → *Writing Synthesis Report...*
- `quality_check` → *Checking Quality & Signoffs...*

### 2. 21-Section Report Structure
We will modify the `WritingAgent` to output a structured JSON containing the 21 required sections:
1. Executive Summary
2. Key Findings
3. Historical Background
4. Current Situation
5. Global Perspective
6. Country Comparison
7. Company Comparison (when applicable)
8. Industry Analysis
9. Economic Impact
10. Financial Analysis
11. Market Trends
12. Statistical Analysis
13. AI Insights
14. Opportunities
15. Risks
16. Best Case Scenario
17. Worst Case Scenario
18. Future Outlook
19. Frequently Asked Questions
20. Verified Sources
21. Economical Research AI Final Verdict

Each section will be typed as `factual`, `analysis`, or `prediction` to clearly separate factual context from predictions.

### 3. Interactive Sections
`InteractiveSection.jsx` will wrap each of the 21 sections, adding:
- **Expand / Collapse** toggle
- **Copy** text to clipboard
- **Bookmark / Save to Library** (synced to Firestore under `research_library` collection)
- **Share** (generates a copyable link with local pathing)

### 4. Smart Tables & AI Generated Charts
- **SmartTable.jsx**: A reusable table renderer with sorting capabilities. If a section contains tabular data in its JSON structure (e.g., GDP rankings, inflation rates), the component automatically renders a clean table.
- **Chart Detection**: The `ChartAgent` will automatically classify and output the best chart type (Line, Area, Bar, Pie, Candlestick, Heatmap, Timeline, Treemap, Radar) based on the query.

### 5. Confidence System & Reading Modes
- **ConfidenceDashboard.jsx**: Renders overall indicators for Research, Fact, and Prediction confidence, plus source freshness.
- **ReadingModeSelector.jsx**: Allows the user to select *Student*, *Investor*, *Researcher*, *Executive*, *Journalist*, or *Beginner*.
  - When selected, a lightweight client-side call via `AIRouter` takes the section's core facts and reformats the language style dynamically (keeping data unchanged).

---

## Verification & Safety Rules

- **Zero regression**: Existing widgets, billing, outcome trackers, search, and admin consoles will remain completely untouched.
- **Chunk Isolation**: All new components will be loaded inside the lazy `er-research` chunk.
- **Build Pass**: `npm run build` must complete with zero errors before pushing.
