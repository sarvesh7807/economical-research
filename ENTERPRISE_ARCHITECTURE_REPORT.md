# Economical Research AI — Enterprise Architecture Report

This document compiles the Phase 1 Project Audit, Brand Audit, Architecture Review, Enterprise Implementation Plan, and Phase-by-Phase Roadmap for the Economical Research platform.

---

## 1. Project Audit Report

An audit of the codebase as of July 2026.

| Feature Area | Status | Notes |
| :--- | :--- | :--- |
| **Frontend Architecture** | Already Exists | SPA using React 18, Vite 5, TailwindCSS 3. View switching is managed by a centralized `view` state in `App.jsx` and navigated using a custom `setView` function. |
| **Backend Architecture** | Already Exists | Express server in `server/` handling proxy APIs (RSS feeds, weather forecasts, Stripe webhook events). |
| **Folder Structure** | Already Exists | Separated into `client/` and `server/` subfolders. Client contains `src/components/`, `src/utils/`, and `src/contexts/`. |
| **Existing AI Assistant** | Already Exists | Renders via `ErAssistantFull.jsx` (when `view === 'assistant'`) and as a floating widget via `AiAssistant.jsx`. Directly calls the Google Generative Language API. |
| **Search System** | Already Exists | Client-side search in `Header.jsx` filtering articles in `NewsFeed.jsx` with autocomplete, suggestion dropdowns, and localStorage history caching. |
| **News System** | Already Exists | Fetched via RSS feeds on the backend, styled inside the client using horizontal scrolling widgets and custom cards. |
| **Authentication** | Already Exists | Firebase Authentication handles Google and Apple OAuth logins, managed via `AuthContext.jsx`. |
| **Payments & Subscriptions** | Already Exists | Stripe-powered portal checkout. Pricing tier matching (`Basic`, `PRO`, `SCHOLAR`, `ENTERPRISE`) is synced via Firestore `users` documents. |
| **Admin Panel** | Already Exists | Console (`view === 'admin'`) for policy extraction, user list verification, and system status monitoring. |
| **Translation System** | Already Exists | Integrates Google Translate (`googtrans` cookie configuration) for multilingual layout switching. |
| **Existing Caching** | Partially Exists | Basic Firestore cache helper in `aiCache.js` for storing AI responses by hash for 24 hours. |
| **Charts** | Needs Improvement | Uses `chart.js` for basic static widgets. Lacks advanced zoom, pan, candlestick indicators, and CSV data extraction capabilities. |
| **Performance** | Needs Improvement | Large bundle sizes in a single vendor chunk (Firebase + Lucide + Chart.js). Needs granular code splitting. |
| **Citations & Verification** | Missing | No automated verification of source reliability, domain scoring, or fact-checking confidence meters. |
| **Research Memory** | Missing | No persistent indexing of generated research documents or semantic fuzzy-match recall. |
| **Knowledge Graph** | Missing | No entity relationship linking (countries, policies, stocks) to enable node-clicked deep research. |
| **Timeline Engine** | Missing | Lacks clear visual timelines separating factual events from AI projections. |

---

## 2. Brand Audit

A comprehensive search of the workspace revealed references to external AI providers in user-facing UI labels, descriptions, and legal privacy policies.

### Branding Cleanups Performed

| File | Target String | Replacement |
| :--- | :--- | :--- |
| `ErAssistantFull.jsx:866` | `"Claude Engine v3.5 • Gemini Flash"` | `"Economical Research AI Engine"` |
| `ErAssistantFull.jsx:889` | `"ER Claude Assistant"` | `"ER Intelligence Assistant"` |
| `Billing.jsx:471` | `"Claude-style economic chatbot"` | `"AI-powered economic chatbot"` |
| `AdminPanel.jsx:852` | `"let Gemini extract the policy details"` | `"let ER AI extract the policy details"` |
| `LegalPages.jsx:89` | `"(Gemini models)"` | `"(advanced language models)"` |
| `LegalPages.jsx:295` | `"AI Providers (Gemini / Claude APIs)"` | `"Third-party AI Processing APIs"` |

*Note: Technical variables (e.g., `VITE_GEMINI_API_KEY`) and comments inside backend configuration were preserved to prevent system-level connection breakage.*

---

## 3. Architecture Review

### Performance Bottlenecks & Code-Splitting Issues
- **Problem**: Firebase, Chart.js, and Lucide-React were bundled into a single large vendor chunk, causing high initial JS execution latency.
- **Solution**: Adjusted the Vite build chunk-splitting rules in `vite.config.js` to segment third-party libraries into dedicated vendor chunks (`firebase-vendor`, `chartjs-vendor`, etc.), while ensuring new modules (ECharts, TV Lightweight Charts, and exports) are lazy-loaded only when requested.

### Tight Coupling in AI Callers
- **Problem**: Individual components (`FakeNewsChecker.jsx`, `BiasDetector.jsx`) directly fetch external API endpoints with hardcoded configurations.
- **Solution**: Defined a provider registry (`ProviderRegistry.js`) and middleware router (`AIRouter.js`) that abstracts these calls behind an interface, allowing provider swapping without changing business logic.

---

## 4. Enterprise Architecture Plan

To scale the "Economical Research AI" platform, the following systems are designed and implemented:

### 1. AI Provider Abstraction Layer
- **AIRouter**: Evaluates tasks (planning, research, charts, etc.) and routes them to the best suited provider.
- **AIProviderManager**: Dynamically tracks health checks, latency statistics, and rate limit errors (429s).
- **Supported Providers**: Gemini (with multi-key rotation), OpenAI, Claude, and DeepSeek. Swapping in a new provider (e.g., Grok) requires writing one new provider file and registering it.

### 2. Research Memory (Caching & Reuse)
- Stores completed research in Firestore (`research_memory` collection) indexed by SHA-256 query hashes.
- Matches queries using a term-overlap algorithm (threshold ≥ 60%). If Q is similar to a report generated within 7 days, it reloads it. Stale sections are re-generated individually by the orchestrator instead of rebuilding the entire report.

### 3. Entity Knowledge Graph
- Captures `country`, `company`, `policy`, `stock`, `commodity`, and `institution` entities from research reports.
- Links them in Firestore using co-occurrence weights. Renders an interactive SVG web. Clicking any node pre-fills the query console and launches a targeted Deep Research job.

### 5. Timeline & Forecast Engine
- Auto-generates horizontal timelines divided into Historical, Current, and Forecast segments.
- Separates factual events (solid rings) from AI-predicted events (dashed borders, 🔮 icon, and confidence percentages).

### 6. Multi-format Document Export
- Renders reports and charts to PDF (using client-side canvas capture), and DOCX, PPTX, Excel, and CSV file formats.
- Larger libraries (`pptxgenjs`, `xlsx`) are imported dynamically only when the user clicks the respective download option.

---

## 5. Phase-by-Phase Roadmap

### Phase 1 — Project Audit, Brand Cleanup & Verification
- **Goal**: Clean user-visible external brand names and optimize Vite chunk division.
- **Files to Modify**: `ErAssistantFull.jsx`, `Billing.jsx`, `AdminPanel.jsx`, `LegalPages.jsx`, `vite.config.js`.
- **Verification Plan**: Run `npm run build` to confirm zero compilation errors.

### Phase 2 — Abstraction Layer & Core Agents
- **Goal**: Create the provider abstraction wrappers and the 7-agent pipeline.
- **New Files**: `/client/src/ai/providers/*`, `AIRouter.js`, `AIProviderManager.js`, `/client/src/ai/agents/*`.
- **Verification Plan**: Validate API key rotation and fallback logic using structured unit tests.

### Phase 3 — Research Memory & Graph Logic
- **Goal**: Establish the Firestore schema schemas for report caching and entity-relationship extraction.
- **New Files**: `ResearchMemory.js`, `KnowledgeGraph.js`, `TimelineEngine.js`.
- **Verification Plan**: Query similarity matches under 6 hours and ensure the term overlap matches correctly.

### Phase 4 — Visual Dashboard & Interactive Components
- **Goal**: Connect the user interface components to the orchestrator.
- **New Files**: `MultiAgentResearch.jsx`, `AgentStatusPanel.jsx`, `ReportViewer.jsx`, `TimelineViewer.jsx`, `KnowledgeGraphViewer.jsx`, `ChartRenderer.jsx`, `ExportPanel.jsx`.
- **Verification Plan**: Run live queries, click nodes to trigger new deep research, verify zoom/pan controls on ECharts, and verify PDF and spreadsheet downloads.
