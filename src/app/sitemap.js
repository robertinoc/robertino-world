import { SITE_URL } from '@/lib/site'

// Built by hand on purpose: Next derives sitemap entries from this app's own
// routes, but the sitemap also lists the resume and apps subdomains, which
// are separate deployments.
export default function sitemap() {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1.0 },
    { url: 'https://resume.robertino.world/', changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://apps.robertino.world/', changeFrequency: 'monthly', priority: 0.6 },
  ]
}
