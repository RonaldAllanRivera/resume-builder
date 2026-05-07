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
    { source: '/experience', destination: '/#experience', permanent: true },
    { source: '/education', destination: '/#education', permanent: true },
    { source: '/certifications', destination: '/#certifications', permanent: true },
    { source: '/search', destination: '/', permanent: true },
    { source: '/pricing', destination: '/services', permanent: true },
  ]

  const redirects = [internetExplorerRedirect, ...consolidatedRoutes]

  return redirects
}

export default redirects
