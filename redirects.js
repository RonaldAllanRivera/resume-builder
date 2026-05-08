const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  const consolidatedRoutes = [
    // /experience, /education, /certifications kept as standalone routes
    // (deep links + SEO + full lists). Homepage previews link to them.
    { source: '/search', destination: '/', permanent: true },
    { source: '/pricing', destination: '/services', permanent: true },
  ]

  const redirects = [internetExplorerRedirect, ...consolidatedRoutes]

  return redirects
}

export default redirects
