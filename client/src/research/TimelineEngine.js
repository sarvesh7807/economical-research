/**
 * TimelineEngine — generates structured timeline objects from research data.
 * No AI call required — derives timeline from research + finance agent outputs.
 */
class TimelineEngine {
  /**
   * @param {object} research   ResearchAgent output
   * @param {object} finance    FinanceAgent output
   * @param {object} plan       PlannerAgent output
   * @returns {object} timeline
   */
  generate(research, finance, plan) {
    const horizon = plan?.timeHorizon || 'last 5 years + 12-month outlook';
    const keyStats = research?.keyStats || [];
    const risks    = finance?.keyWatchPoints || [];

    return {
      historical: this._buildHistorical(research, keyStats),
      current:    this._buildCurrent(research, finance),
      forecast:   this._buildForecast(finance, risks),
      horizon,
      generatedAt: new Date().toISOString(),
    };
  }

  _buildHistorical(research, keyStats) {
    const events = [];
    const developments = research?.recentDevelopments || [];

    // Extract years from key stats dates
    keyStats.slice(0, 3).forEach((s, i) => {
      if (s.date) {
        events.push({
          date: s.date,
          label: s.label,
          description: `${s.label}: ${s.value}${s.unit || ''}`,
          impact: s.trend === 'up' ? 'positive' : s.trend === 'down' ? 'negative' : 'neutral',
          magnitude: 2,
          type: 'factual',
          confidence: 100,
        });
      }
    });

    // Add developments as historical events
    developments.slice(0, 3).forEach((d, i) => {
      events.push({
        date: this._extractDate(d) || `2025-${String(12 - i).padStart(2, '0')}`,
        label: d.length > 60 ? d.slice(0, 57) + '...' : d,
        description: d,
        impact: 'neutral',
        magnitude: 2,
        type: 'factual',
        confidence: 90,
      });
    });

    return events;
  }

  _buildCurrent(research, finance) {
    const current = [];
    if (research?.currentSituation) {
      current.push({
        date: new Date().toISOString().slice(0, 7),
        label: 'Current Analysis',
        description: research.currentSituation.slice(0, 200),
        impact: finance?.riskLevel === 'HIGH' || finance?.riskLevel === 'CRITICAL' ? 'negative' : 'neutral',
        magnitude: 3,
        type: 'factual',
        confidence: 100,
      });
    }
    return current;
  }

  _buildForecast(finance, risks) {
    const forecast = [];
    const now = new Date();

    if (finance?.shortTermOutlook) {
      forecast.push({
        date: new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 7),
        label: '3-Month Outlook',
        description: finance.shortTermOutlook.slice(0, 200),
        impact: 'positive',
        magnitude: 2,
        type: 'ai_prediction',
        confidence: 65,
        confidenceBand: { low: 40, base: 65, high: 80 },
      });
    }

    if (finance?.longTermOutlook) {
      forecast.push({
        date: new Date(now.getTime() + 365 * 86400000).toISOString().slice(0, 7),
        label: '12-Month Outlook',
        description: finance.longTermOutlook.slice(0, 200),
        impact: 'positive',
        magnitude: 3,
        type: 'ai_prediction',
        confidence: 50,
        confidenceBand: { low: 25, base: 50, high: 70 },
      });
    }

    risks.slice(0, 2).forEach((r, i) => {
      forecast.push({
        date: new Date(now.getTime() + (i + 1) * 120 * 86400000).toISOString().slice(0, 7),
        label: `Risk: ${r.slice(0, 40)}`,
        description: r,
        impact: 'negative',
        magnitude: 2,
        type: 'ai_prediction',
        confidence: 45,
        confidenceBand: { low: 20, base: 45, high: 65 },
      });
    });

    return forecast;
  }

  _extractDate(str) {
    const m = str.match(/\b(20\d{2})(?:[-/](\d{1,2}))?\b/);
    if (!m) return null;
    return m[2] ? `${m[1]}-${String(m[2]).padStart(2, '0')}` : m[1];
  }
}

export default new TimelineEngine();
