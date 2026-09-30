import Universe from '@/components/Universe'

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100dvh', background: '#020408' }}>
      {/* Crawlable, screen-reader-only intro: the 3D scene renders no indexable text. */}
      <section className="sr-only" aria-label="About Robertino Calcaterra">
        <p>
          <strong>Robertino Calcaterra.</strong> AI-driven Growth &amp; Marketing at Migbirds,
          helping B2B platforms grow through content, community &amp; DevEx. Founder of{' '}
          <a href="https://stagelink.art">StageLink</a> and{' '}
          <a href="https://energycurve.app">EnergyCurve</a>. Ex-Auth0/Okta. Also: yoga teacher
          and host of ROBERTINOTALK, DJ and producer as ROBERTINOC.
        </p>
        <ul>
          <li><a href="https://resume.robertino.world">Resume — Growth &amp; Product Marketing</a></li>
          <li><a href="https://stagelink.art/es/robertinoc">ROBERTINOC — DJ &amp; producer</a></li>
          <li><a href="https://robertinotalk.robertino.world">ROBERTINOTALK — yoga, wellness &amp; talks</a></li>
          <li><a href="https://apps.robertino.world">Apps — tools &amp; marketplace</a></li>
        </ul>
      </section>
      <Universe />
    </main>
  )
}
