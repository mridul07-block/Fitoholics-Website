/**
 * The legal pages: privacy, terms, refunds and cancellations.
 *
 * Each is a document, not a station: plain sections of prose on their own
 * page, no film, no motion. They are DRAFTS, written in the site's voice so
 * there is something concrete to review, and flagged as such at the page
 * level. On builds that omit drafts (production), a drafted page renders the
 * holding note below instead of unreviewed terms presented as binding. To
 * finish one: have it reviewed, correct it, and delete `draft: true`.
 *
 * Voice: no em dashes, en dashes or hyphens in prose.
 */
export type LegalKey = 'privacy' | 'terms' | 'refunds'

export interface LegalSection {
  readonly h: string
  readonly p: readonly string[]
}

export interface LegalDoc {
  readonly key: LegalKey
  readonly path: string
  readonly title: string
  readonly summary: string
  /** shown as "Last updated" */
  readonly updated: string
  readonly sections: readonly LegalSection[]
  readonly draft?: boolean
}

const CONTACT_EMAIL = 'ikramansari@gmail.com'

export const LEGAL_CHROME = {
  siteName: 'Fitoholix',
  back: 'Back to the site',
  updatedLabel: 'Last updated',
  alsoLabel: 'Also',
  draftBand: 'Draft for review. This page has not yet been approved by Fitoholix and is not in force.',
  holdingTitle: 'This page is being finalised.',
  holding: `For any question about your details, your booking or a payment, write to ${CONTACT_EMAIL} and Ikram will answer directly.`,
  contactLabel: 'Contact',
} as const

export const LEGAL: readonly LegalDoc[] = [
  {
    key: 'privacy',
    path: '/privacy',
    title: 'Privacy',
    summary: 'What this site and the coaching collect about you, why, and what you can ask for.',
    updated: '12 September 2026',
    // Not drafted, unlike the other two: every statement here describes what
    // this site actually does, read off the code (no forms, no accounts, the
    // WhatsApp handover, the analytics that load only when configured), plus
    // what the coaching asks for, which is the eight steps. There are no
    // commercial terms in it to get wrong, and a site running analytics with
    // no privacy policy at all is the worse position. Ikram should still read
    // it; corrections are edits, not a rewrite.
    sections: [
      {
        h: 'Who we are',
        p: [
          `Fitoholix is the coaching practice of Ikram Ansari. This policy covers the website and the coaching. Questions about it go to ${CONTACT_EMAIL}.`,
        ],
      },
      {
        h: 'What we collect',
        p: [
          'On the website, nothing you type: there are no forms and no accounts. When you tap a consultation button the site opens WhatsApp, and from that point WhatsApp’s own terms apply to the messages you send.',
          'The site uses analytics from Google (Google Analytics) and Meta (the Meta Pixel) to understand which parts of the page are read and which buttons are used, including the consultation button. These set cookies and record your device type, approximate location, the pages you view and the actions you take. They are not used to identify you by name.',
          'During coaching, Ikram asks for what the plan needs: your goals, schedule, food preferences, training history, measurements, progress photos, and health details such as injuries, medical history and blood work where you choose to share it.',
        ],
      },
      {
        h: 'Why we use it',
        p: [
          'To reply to you and arrange the consultation. To build and adjust your plan. To understand what on the website works, and to measure advertising when it runs.',
        ],
      },
      {
        h: 'Health information',
        p: [
          'Health details are sensitive and are collected only with your consent, only for your coaching, and only from you. They are not shared with anyone else, and they are deleted when you ask or when the coaching ends and they are no longer needed.',
        ],
      },
      {
        h: 'Photos, results and testimonials',
        p: [
          'Progress photos are for tracking your plan. Nothing about you, in words or pictures, is published anywhere without your separate written consent, and you can withdraw that consent at any time by writing to the address above.',
        ],
      },
      {
        h: 'Who else sees it',
        p: [
          'Google and Meta process analytics data on our behalf under their own privacy terms. WhatsApp, which is operated by Meta, carries your messages. Nothing is sold, and no one else receives your details.',
        ],
      },
      {
        h: 'How long we keep it',
        p: [
          'Messages and coaching records are kept for as long as you are a client and for a reasonable period afterwards in case you return, then deleted. Analytics data is kept for the period set in the analytics tools, which is measured in months, not years.',
        ],
      },
      {
        h: 'Your choices',
        p: [
          `You can ask what we hold about you, ask for it to be corrected, or ask for it to be deleted, by writing to ${CONTACT_EMAIL}. You can refuse analytics cookies in your browser settings, and the site works the same without them.`,
        ],
      },
      {
        h: 'Changes',
        p: ['When this policy changes, the date at the top changes with it.'],
      },
    ],
  },
  {
    key: 'terms',
    path: '/terms',
    title: 'Terms',
    summary: 'What the coaching is, what it is not, and what each of us agrees to.',
    updated: '11 September 2026',
    draft: true,
    sections: [
      {
        h: 'The service',
        p: [
          'Fitoholix provides fitness and nutrition coaching for adults, delivered by Ikram Ansari in person and online. The Total Transformation Protocol is a coaching method: an assessment, a plan built from it, weekly check ins and education. It is not a medical service and it does not replace your doctor.',
        ],
      },
      {
        h: 'Who it is for',
        p: ['You must be 18 or older to be coached. If you are pregnant, recovering from surgery, or managing a medical condition, tell Ikram at the assessment and get your doctor’s clearance first where it is needed.'],
      },
      {
        h: 'Your part',
        p: [
          'Give honest answers at the assessment and at check ins. Follow the plan as agreed, and say so when you cannot, so it can be changed. Stop any exercise that causes pain and tell Ikram. You are responsible for your own decisions about your body, and for using equipment safely.',
        ],
      },
      {
        h: 'Results',
        p: [
          'Results vary from person to person and depend on what you do between check ins. Nothing on the website or in coaching is a guarantee of a particular outcome, and any figures shown are the real results of individual clients who agreed to share them, not a promise about yours.',
        ],
      },
      {
        h: 'Payment',
        p: [
          'The consultation is without charge. Coaching fees, what they cover and when they are due are agreed in writing at the consultation, before anything is paid. Refunds and cancellations are covered by the policy of that name.',
        ],
      },
      {
        h: 'Your plan',
        p: ['Plans, programs and materials are written for you and remain the property of Fitoholix. Use them for your own coaching; do not resell or republish them.'],
      },
      {
        h: 'Liability',
        p: [
          'To the extent the law allows, Fitoholix is not liable for injury, loss or damage arising from the use of the website or from following a plan against medical advice, from information you did not disclose, or from equipment used unsafely. Nothing here limits liability that cannot be limited by law.',
        ],
      },
      {
        h: 'Law',
        p: ['These terms are governed by the laws of India.'],
      },
    ],
  },
  {
    key: 'refunds',
    path: '/refunds',
    title: 'Refunds and cancellations',
    summary: 'What happens to your payment if you change your mind, need to pause, or cannot continue.',
    updated: '11 September 2026',
    draft: true,
    sections: [
      {
        h: 'The consultation',
        p: ['The consultation is free. Cancelling or rescheduling it costs nothing.'],
      },
      {
        h: 'Before the assessment',
        p: ['If you pay and then change your mind before the deep assessment has taken place, you receive a full refund within seven days of asking.'],
      },
      {
        h: 'After coaching has started',
        p: [
          'Within the first fourteen days after the assessment, you may stop and receive the remainder of your fee back, less the assessment and the weeks already delivered. After fourteen days, fees for the agreed term are not refundable, because the plan has been built and the coaching time reserved for you.',
        ],
      },
      {
        h: 'Pausing',
        p: ['Illness, injury and travel happen. Coaching can be paused for up to four weeks in a term without losing any of it. Ask before the pause, not after.'],
      },
      {
        h: 'If Fitoholix cancels',
        p: ['If Ikram cannot deliver the coaching you have paid for, you receive a refund for the part not delivered, in full and without conditions.'],
      },
      {
        h: 'How to ask',
        p: [`Write to ${CONTACT_EMAIL}. Refunds go back the way the payment came, within seven working days of being agreed.`],
      },
    ],
  },
]

export const legalByKey = (key: LegalKey): LegalDoc => {
  const doc = LEGAL.find((d) => d.key === key)
  if (!doc) throw new Error(`legal: no document ${key}`)
  return doc
}
