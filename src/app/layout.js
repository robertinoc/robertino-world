import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const font = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const SITE_URL = 'https://www.robertino.world'
const TITLE = 'Robertino Calcaterra | Growth & Marketing for B2B tech · Founder · DJ'
const DESCRIPTION =
  'Robertino Calcaterra: AI-driven growth and marketing for B2B tech at Migbirds, founder of StageLink and EnergyCurve, DJ as ROBERTINOC. Based in Argentina.'
const OG_IMAGE = { url: '/images/og.jpg', width: 1200, height: 630, alt: 'robertino.world — Robertino Calcaterra' }

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'robertino.world',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
}

// JSON-LD Person schema — keeps search engines aligned with the headline above.
const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Robertino Calcaterra',
  url: SITE_URL,
  image: `${SITE_URL}/images/og.jpg`,
  jobTitle: 'Growth & Product Marketing',
  description:
    'AI-driven Growth & Marketing at Migbirds. Helping B2B platforms grow through content, community & DevEx. Founder of StageLink and EnergyCurve. Ex-Auth0/Okta.',
  worksFor: { '@type': 'Organization', name: 'Migbirds', url: 'https://migbirds.com' },
  address: { '@type': 'PostalAddress', addressLocality: 'Corrientes', addressCountry: 'AR' },
  sameAs: [
    'https://www.linkedin.com/in/robertinocalcaterra',
    'https://www.instagram.com/robertinook',
    'https://stagelink.art/es/robertinoc',
    'https://resume.robertino.world',
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
        {children}
      </body>
    </html>
  )
}
