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
    // /experience and /education content lives entirely on the homepage now;
    // 308 to anchors so old bookmarks / inbound links land on the right section.
    // /certifications stays a standalone route (full 60+ list deserves its own page).
    { source: '/experience', destination: '/#experience', permanent: true },
    { source: '/education', destination: '/#education', permanent: true },
    { source: '/search', destination: '/', permanent: true },
    { source: '/pricing', destination: '/services', permanent: true },
    { source: '/book/success', destination: '/services', permanent: true },
    { source: '/book/cancel', destination: '/services', permanent: true },
  ]

  const redirects = [internetExplorerRedirect, ...consolidatedRoutes]

  return redirects
}

export default redirects
