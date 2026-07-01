/**
 * Logger — structured logging utility.
 * Current impl: browser console in dev.
 * Future swap: replace _send() to ship to DataDog / LogRocket / Sentry.
 */
const isDev = import.meta.env.DEV;

class Logger {
  _send(level, agent, message, context = {}) {
    const ts = new Date().toISOString();
    const entry = { ts, level, agent, message, ...context };
    if (level === 'error') {
      console.error(`[ER-AI ${ts}] [${agent}]`, message, context);
    } else if (level === 'warn') {
      console.warn(`[ER-AI ${ts}] [${agent}]`, message, context);
    } else if (isDev) {
      console.log(`[ER-AI ${ts}] [${agent}]`, message, context);
    }
    // Future: analyticsAdapter.captureEvent(level, entry)
    return entry;
  }

  info(agent, message, context)  { return this._send('info',  agent, message, context); }
  warn(agent, message, context)  { return this._send('warn',  agent, message, context); }
  error(agent, message, context) { return this._send('error', agent, message, context); }
}

export default new Logger();
