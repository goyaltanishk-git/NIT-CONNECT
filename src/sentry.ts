import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Don't init in development unless DSN is explicitly set
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "production" or "development"

    // Capture 100% of errors, 10% of performance traces
    tracesSampleRate: 0.1,

    // Capture replays only when an error happens (0% normal, 100% on error)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text/inputs so no user PII is recorded
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],

    // Don't send errors from ad blockers blocking Razorpay analytics
    ignoreErrors: [
      "ERR_BLOCKED_BY_CLIENT",
      "Non-Error promise rejection captured",
      "ResizeObserver loop limit exceeded",
    ],

    // Don't send noise from Razorpay/third-party scripts
    denyUrls: [
      /lumberjack\.razorpay\.com/,
      /browser\.sentry-cdn\.com/,
      /api\.sardine\.ai/,
      /extensions\//i,
      /^chrome:\/\//i,
    ],
  });
}

// Call this to attach a user identity to all future errors
export function setSentryUser(email: string) {
  Sentry.setUser({ email });
}

// Call this on logout
export function clearSentryUser() {
  Sentry.setUser(null);
}
