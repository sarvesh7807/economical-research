/**
 * MonitoringAdapter — error and event capture.
 * Current impl: browser console + basic tracking.
 * Future swap: Sentry SDK / DataDog RUM — replace _send methods.
 * All AIRouter, Orchestrator, ResearchMemory errors go through here.
 */
class MonitoringAdapter {
  captureError(error, context = {}) {
    console.error('[ER-Monitor] Error:', error?.message || error, context);
    // Future: Sentry.captureException(error, { extra: context });
  }

  captureEvent(name, properties = {}) {
    if (import.meta.env.DEV) {
      console.log(`[ER-Monitor] Event: ${name}`, properties);
    }
    // Future: datadogRum.addAction(name, properties);
    // Or: analytics.logEvent(name, properties);
  }

  setUser(userId) {
    // Future: Sentry.setUser({ id: userId });
    void userId;
  }
}

export default new MonitoringAdapter();
