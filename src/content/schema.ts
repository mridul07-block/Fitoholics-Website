/**
 * Structured data for search, built from the same copy the page renders.
 *
 * Injected as JSON-LD by tools/prerender.mjs. The FAQ is read through live()
 * so it lists exactly the questions the build shows: a drafted answer is
 * never published to search from a production build. No AggregateRating and
 * no review markup: nothing verified supports them yet, and inventing
 * ratings is the one thing search penalises harder than omitting them.
 */
import { COPY } from './copy'
import { live } from './drafts'

export function jsonLd(siteUrl: string | null): readonly Record<string, unknown>[] {
  const url = siteUrl ? `${siteUrl}/` : undefined
  const image = siteUrl ? `${siteUrl}/og.jpg` : undefined

  const business = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': url ? `${url}#business` : undefined,
    name: COPY.meta.siteName,
    alternateName: 'fitoholix Fitness & Nutrition',
    description: COPY.meta.description,
    url,
    image,
    telephone: COPY.footer.contact.phone,
    email: COPY.footer.contact.email,
    areaServed: 'IN',
    sameAs: COPY.footer.social.map((s) => s.href),
    founder: {
      '@type': 'Person',
      name: COPY.footer.name,
      jobTitle: 'Transformation Coach',
      sameAs: [COPY.footer.social[0].href],
    },
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: COPY.product.name,
        serviceType: 'Fitness and nutrition coaching',
        description: COPY.method.lead,
        provider: { '@type': 'Organization', name: COPY.meta.siteName },
      },
    },
  }

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: live(COPY.trust.faq).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return [business, faq]
}
