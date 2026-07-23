import Script from 'next/script'

/**
 * GA4, loaded only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 *
 * Gating on the env var means local dev and preview deploys stay out of the
 * production property with no extra config, and no measurement ID is committed
 * to git.
 *
 * `afterInteractive` keeps the tag off the critical path. Core Web Vitals are
 * a ranking factor, so the analytics tag must not cost us LCP — which would
 * make it a net negative for the very thing it is meant to measure.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
