/**
 * The complete copy deck. Every string on the page lives here. No string
 * literals in JSX components.
 *
 * Two kinds of unfinished value exist and are handled differently:
 *
 *   · A row flagged `draft: true` is written to look finished (a case study,
 *     a testimonial, a price, a program length) so the section can be judged
 *     as it will actually appear, but describes something the client has not
 *     supplied. src/content/drafts.ts omits every drafted row from production;
 *     previews show them with a visible tag. To finish one: replace the
 *     content with what the client actually said or supplied, and delete the
 *     flag, together. Never keep a drafted value next to a real name.
 *
 *   · A bracketed [VALUE] or a TBC renders as itself and blocks a production
 *     build (tools/check-placeholders.mjs). There should be none left.
 *
 * Voice: no em dashes, en dashes or hyphens in prose anywhere in the UI.
 */

/**
 * Where every "Book a consultation" on the page goes.
 *
 * A WhatsApp chat rather than a form or a scroll to the closing section: the
 * consultation is a conversation, and this is the line Ikram actually answers.
 * Declared once, above COPY, so the masthead, the hero, the close and the
 * footer cannot drift apart.
 *
 * wa.me wants the number in E.164 with no plus, spaces or dashes. It is the
 * same line as footer.contact.phone. Change both together.
 *
 * The prefilled message is a courtesy: the chat opens with the reason for
 * writing already typed, so the visitor is not left facing an empty box and
 * Ikram can tell where the message came from. It is editable before sending.
 */
const PRODUCT_NAME = 'The Total Transformation Protocol'

const BOOKING_HREF = `https://wa.me/919738720404?text=${encodeURIComponent(
  `Hi Ikram, I'd like to book a consultation about ${PRODUCT_NAME}.`,
)}`

export const COPY = {
  product: {
    name: PRODUCT_NAME,
  },

  /**
   * The document head. Written into dist/index.html by tools/prerender.mjs
   * and mirrored statically in index.html for the dev server. The title
   * leads with the business, which is what people search for and share.
   */
  meta: {
    siteName: 'Fitoholix',
    title: 'Fitoholix | Personalised Transformation Coaching for Busy Professionals',
    description:
      'The Total Transformation Protocol by Ikram Ansari: personalised nutrition, training and weekly coaching for busy professionals who are done with quick fixes. Ten plus years. Zero fad diets.',
    ogImageAlt: 'Fitoholix. Fit for life.',
    locale: 'en_IN',
  },

  booking: {
    href: BOOKING_HREF,
    /**
     * The accessible name. The link opens WhatsApp in a new tab, which a
     * sighted visitor infers from context and a screen reader user cannot, so
     * it is said. It still begins with the visible label, as WCAG 2.5.3 (Label
     * in Name) requires.
     */
    a11y: 'Book a consultation on WhatsApp (opens in a new tab)',
    /**
     * What the click commits a visitor to. The audit's first question before
     * the button was "is it free, how long, is it a call". Only what the
     * button verifiably does is stated here: it opens WhatsApp, and Ikram is
     * the person on the other end. Whether it is free and how long it runs
     * are his to confirm and live in close.details, flagged until he does.
     */
    detail: {
      line: 'A conversation on WhatsApp, with Ikram himself. No obligation.',
    },
  },

  entrance: {
    eyebrow: 'THE TOTAL TRANSFORMATION PROTOCOL · COACHING FOR BUSY PROFESSIONALS',
    heroLines: [
      "Don't just lose weight.",
      'Become the kind of person',
      'who never needs to start over.',
    ],
    lead: 'A decade of coaching busy professionals through transformations that hold, long after the coaching ends.',
    cta1: 'Book a consultation',
    cta2: 'See the method',
    scroll: 'SCROLL',
  },

  problem: {
    index: '01',
    eyebrow: 'WHY IT KEEPS FAILING',
    h1Lines: ['Most people do not fail', 'because they lack willpower.'],
    body1:
      'They fail because nobody taught them how their body, their habits and their environment actually work together.',
    body2:
      'Quick fixes, copy paste diet plans and fear based marketing can produce short term results. They almost never produce lasting change.',
    listLabel: 'WHAT THIS USUALLY LOOKS LIKE',
    list: [
      'Repeated failed attempts with restrictive diets',
      'No time for complicated prep or two hour sessions',
      'Conflicting fitness information online',
      'Intimidation around gyms as a beginner',
      'Losing weight, then regaining it',
      'Low energy and poor sleep from a demanding career',
    ],
  },

  credibility: {
    index: '02',
    eyebrow: 'THE COACH',
    quote:
      'For busy professionals tired of failed diets and unsustainable routines, Ikram Ansari builds lifelong habits, not temporary fixes, because he treats every client as a unique case, not a template.',
    /**
     * Only claims with evidence behind them. The transformation count is the
     * figure the client supplied on 2026-09-12, replacing the "TBC" the audit
     * flagged as its P0 release blocker; the rest are facts about the
     * practice. If the number is ever questioned, the answer is Ikram's own
     * client records, so it is stated as "100+" rather than to a false
     * precision nobody can defend.
     */
    stats: [
      { value: '10+', label: 'Years coaching', countTo: 10, suffix: '+' },
      { value: '100+', label: 'Transformations', countTo: 100, suffix: '+' },
      { value: '8', label: 'Steps, every client', countTo: 8, suffix: '' },
      { value: '0', label: 'Fad diets, ever', countTo: 0, suffix: '' },
    ],
    credentialsLabel: 'CREDENTIALS',
    credentials: [
      { text: 'Founder of fitoholix Fitness & Nutrition' },
      { text: 'Ten plus years coaching working professionals, in person and online' },
      { text: 'Certified in personal training and sports nutrition' },
    ],
    foot: 'Calm authority in a loud market. No shortcuts promised, none needed.',
  },

  transformations: {
    index: '03',
    eyebrow: 'RESULTS',
    h1Lines: ['Results that outlast', 'the coaching.'],
    lead: 'Not a highlight reel. Ordinary weeks, real timelines, and what stayed changed afterwards.',
    /**
     * The station's own argument, and the one that does not wait on anybody.
     *
     * This industry sells on before and after photos, a great many of which
     * belong to nobody. Saying plainly that nothing goes up without the
     * client's written consent is both true and the strongest thing this
     * section can say while the consented material is still being gathered:
     * it turns the thin spot into the brand's position rather than an
     * apology for it. Every line here is supported by copy the client has
     * already approved (the eight steps, the brand brief's claims rule).
     */
    policy: {
      label: 'HOW RESULTS ARE SHOWN HERE',
      title: 'Nothing on this page belongs to a stranger.',
      body: 'Every transformation you will see here was published because the client read it and agreed to it. That takes longer than lifting photographs off the internet, and it means there is less to show than on most coaching sites. It also means what is here is real.',
      points: [
        'Measured every week: weight, measurements, photos, strength, energy, hunger and adherence',
        'Judged a year later, not at the end of the coaching',
        'References available at the consultation, from clients who offered',
      ],
    },
    casesLabel: 'CASE STUDIES',
    beforeLabel: 'Before',
    afterLabel: 'After',
    /**
     * DRAFTS. Not real clients, and not shippable as they stand. Each row
     * needs a photo pair, written consent to publish, and the client's own
     * numbers. `consent` must be true on every row that reaches production.
     */
    cases: [
      {
        name: 'R. S.',
        age: 34,
        profession: 'Software engineer',
        timeframe: '6 months',
        result: 'Down 14 kg, blood pressure back in range, and still training three mornings a week two years on.',
        before: null,
        after: null,
        alt: 'R. S. before and after six months of coaching',
        consent: false,
        draft: true,
      },
      {
        name: 'Meera K.',
        age: 41,
        profession: 'Marketing director',
        timeframe: '8 months',
        result: 'Lost 9 kg without giving up family dinners, and gained the energy for a job that used to empty her by four.',
        before: null,
        after: null,
        alt: 'Meera K. before and after eight months of coaching',
        consent: false,
        draft: true,
      },
      {
        name: 'A. and P.',
        age: 38,
        profession: 'Consultants, a couple',
        timeframe: '5 months',
        result: 'Two plans, one kitchen. 21 kg between them, and a shared routine that survived a house move and a new baby.',
        before: null,
        after: null,
        alt: 'A. and P. before and after five months of coaching',
        consent: false,
        draft: true,
      },
    ],
    /** production, while the consented case studies are still being gathered */
    emptyNote: 'The first consented case studies are being prepared now.',
    testimonialsLabel: 'IN THEIR WORDS',
    /**
     * DRAFTS. Not real client words. Written at true length, in the register a
     * real client would use, so the section can be judged as a design. To
     * finish: replace the quote with what the client actually said, the name
     * and profession with who they actually are, and delete the flag.
     */
    testimonials: [
      {
        quote:
          'I had done three crash diets before this and put all of it back on every time. What was different here was being made to understand why they failed. Two years later I am still eating the way we set up.',
        name: 'Priya Nair',
        profession: 'Chartered Accountant',
        duration: '6 months',
        draft: true,
      },
      {
        quote:
          'Twelve kilos down and my blood work is back in range. The real result is that I stopped negotiating with myself every morning. Training is just a thing I do now, not a decision I have to win.',
        name: 'Aditya Menon',
        profession: 'Product Manager',
        duration: '8 months',
        draft: true,
      },
      {
        quote:
          'I was sceptical that coaching across time zones could work, and the check ins turned out sharper than anything I had in person. I travel most weeks and the plan was built around that rather than ignoring it.',
        name: 'James Whitfield',
        profession: 'Management Consultant',
        duration: '5 months',
        draft: true,
      },
    ],
    attributionSuffix: 'with Ikram',
    videosLabel: 'IN THEIR OWN VOICE',
    /**
     * Short client clips: the starting problem and what changed. Hosted
     * elsewhere and embedded on tap; a video file never enters this repo.
     * `embed` is the player URL (YouTube or Vimeo embed form), `poster` a
     * still under public/proof/.
     */
    videos: [] as readonly { readonly title: string; readonly embed: string; readonly poster: string; readonly draft?: boolean }[],
    playLabel: 'Play',
  },

  receive: {
    index: '04',
    eyebrow: 'WHAT YOU RECEIVE',
    h1Lines: ['Everything included', 'in your transformation.'],
    lead: 'Not a plan sent as a PDF. A coach, a method and a weekly rhythm, built around your calendar rather than competing with it.',
    /**
     * The basic delivery model the audit found missing. Length and price are
     * the client's to state; the rest is how the protocol already works.
     *
     * There is no app, and no app block. The audit assumed one ("App access
     * with exercise guidance", "How does the app work?") on the strength of a
     * tablet appearing in the footage; the client confirmed on 2026-09-12
     * that none exists. Coaching runs on WhatsApp, which is where the check
     * ins already happen, so nothing on this page offers a product that
     * would have to be built to keep the promise.
     */
    facts: [
      { label: 'Program length', value: '12 weeks', draft: true },
      { label: 'Check ins', value: 'Weekly' },
      { label: 'Training', value: 'Home or gym' },
      { label: 'Investment', value: 'Shared at the consultation' },
    ],
    items: [
      {
        label: 'Personalised nutrition',
        body: 'Calories, protein and meals built around your food, your budget, your travel and your family routine. No banned foods.',
      },
      {
        label: 'Customised training',
        body: 'A program for your experience, your equipment and your recovery, at home or in a gym, with progression planned over months.',
      },
      {
        label: 'Weekly check ins',
        body: 'Weight, measurements, photos, strength, energy, hunger and adherence, reviewed every week and the plan adjusted against them.',
      },
      {
        label: 'Habits that compound',
        body: 'Sleep, steps, hydration, stress and meal timing, one at a time, until they run without you thinking about them.',
      },
      {
        label: 'Travel, eating out and maintenance',
        body: 'What to order, how to train on the road, and how to hold the result once the coaching ends.',
      },
      {
        label: 'Education throughout',
        body: 'Reading labels, managing cravings, understanding your own numbers, so you can run this yourself for life.',
      },
    ],
  },

  pathways: {
    index: '05',
    eyebrow: 'WHO IT IS FOR',
    h1Lines: ['Built for people whose', 'calendars do not negotiate.'],
    body: 'Working professionals, entrepreneurs and corporate employees, men and women, generally between 25 and 45, who are done with quick fixes and ready for something built around a demanding real life.',
    /**
     * Three entry points to one promise. The corporate path is the practice
     * as it stands. The others are drafted until the client confirms what the
     * service can responsibly support; the couple path renders only when
     * `offered` is true, because the audit is explicit that a path must not
     * be promoted unless it exists.
     */
    paths: [
      {
        key: 'corporate',
        title: 'The corporate professional',
        who: 'Long days, travel weeks, a desk, and a diet history.',
        connects: 'Time pressure and low energy are the starting point, not a personal failing.',
        gets: 'About four hours a week, split how your calendar allows. Home or gym. A plan that travels with you.',
        offered: true,
      },
      // Not a second service: the same protocol, described for the reader the
      // brief already names ("men and women, 25 to 45"). Every line traces to
      // approved copy — family routine and budget are in step 03, schedule and
      // equipment in step 04, and the brand brief forbids before and after
      // body talk outright. Nothing clinical is claimed, because nothing
      // clinical has been confirmed.
      {
        key: 'woman',
        title: 'The working woman',
        who: 'A career, a household, and no room for a plan that assumes you have neither.',
        connects: 'Nutrition built around family meals, a real budget and the week you actually have.',
        gets: 'Training that fits the time and the equipment you have, at home or in a gym, and no before and after body talk, ever.',
        offered: true,
      },
      {
        key: 'couple',
        title: 'The couple',
        who: 'Two people, one kitchen, and a shared reason to change.',
        connects: 'Individual plans, because two bodies are never one case, with the accountability shared.',
        gets: 'Separate assessments, one consultation, and a household routine that holds for both of you.',
        offered: false,
        draft: true,
      },
    ],
    aspirationsLabel: 'WHAT YOU ACTUALLY WANT',
    aspirations: [
      'A transformation that finally lasts',
      'More energy, confidence and control',
      'A plan that fits your career instead of competing with it',
      'To understand fitness well enough to manage it yourself',
      'To feel strong and consistent, not restricted',
      'A coach who treats you as a person, not a client number',
    ],
  },

  method: {
    index: '06',
    eyebrow: 'THE METHOD',
    h1: PRODUCT_NAME,
    lead: 'Eight steps. Each one builds on the last, so no plan is ever built on an assumption.',
    steps: [
      {
        n: '01',
        title: 'Deep Assessment',
        body: 'A full life audit before any plan exists. Weight, body composition, measurements, medical history and injuries, blood work where available, occupation, daily schedule, sleep quality, stress, food preferences, gym experience, diet history, goals and motivation.',
      },
      {
        n: '02',
        title: 'Goal Mapping',
        body: 'Turning ambition into realistic, trackable milestones. A weight target, muscle gain, better blood markers, more energy, more confidence, or simply habits that finally stick.',
      },
      {
        n: '03',
        title: 'Personalized Nutrition',
        body: 'A plan built around calories, protein, lifestyle, food preferences, budget, travel, eating habits and family routine, with no unnecessary restriction.',
      },
      {
        n: '04',
        title: 'Customized Training',
        body: 'A program shaped by experience level, available equipment, injuries, time and recovery capacity, with progressive overload planned deliberately over months.',
      },
      {
        n: '05',
        title: 'Habit Building',
        body: 'Systematic focus on the daily behaviours that compound. Hydration, sleep, daily movement, step count, stress reduction, meal timing and routine.',
      },
      {
        n: '06',
        title: 'Weekly Accountability',
        body: 'Structured check ins on weight, measurements, photos, strength, energy, hunger and adherence, with the plan adjusted continuously against real progress.',
      },
      {
        n: '07',
        title: 'Education Throughout',
        body: 'Ongoing teaching on nutrition fundamentals, reading labels, eating out intelligently, managing cravings, navigating travel and social events, and long term maintenance.',
      },
      {
        n: '08',
        title: 'Lifestyle Transformation',
        body: 'The real measure of success. Clients who are not just lighter, but healthier, stronger, more confident, more disciplined and more consistent for life.',
      },
    ],
  },

  nutrition: {
    index: '07',
    eyebrow: 'NUTRITION',
    h1Lines: ['No food is off the table.', 'Some of it is just on a different day.'],
    body: 'Every plan is built around a real life, not an ideal one. Work schedules, travel, family meals, budget and taste all go into it before a single number does. Understanding, not restriction, is what makes a plan survive a bad week.',
    mythsLabel: 'WHAT WE ARE UNLEARNING',
    myths: [
      {
        strike: 'Extreme diets are the fastest path to lasting results',
        truth: 'Sustainable habits beat aggressive timelines every time',
      },
      {
        strike: 'More restriction always means more progress',
        truth: 'Restriction you cannot maintain is progress you will reverse',
      },
      {
        strike: 'Fitness needs hours you do not have',
        truth: 'A plan that fits a real calendar is the only one that works',
      },
      {
        strike: 'One meal plan and one workout split works for everybody',
        truth: 'Every body, schedule and goal is different, so the plan is too',
      },
    ],
  },

  close: {
    index: '08',
    eyebrow: 'NEXT STEP',
    hero: 'Start once. Properly.',
    lead: 'A short consultation. A real assessment. No pressure, no template and no promises anyone should not make.',
    /**
     * The four answers a visitor wants before the click. Format, length and
     * cost are the client's to confirm; what happens afterwards describes the
     * protocol's own first step and stands.
     */
    details: [
      // Format and what it covers describe what the button does and what the
      // protocol's own first step is, so both stand. Length and cost are
      // commercial terms only Ikram can set, and they wait for him.
      { label: 'Format', value: 'A chat on WhatsApp, with Ikram himself' },
      { label: 'Length', value: 'About 15 minutes', draft: true },
      { label: 'Cost', value: 'Free', draft: true },
      { label: 'What it covers', value: 'Your goal, your schedule, your history, and whether this is the right fit.' },
      { label: 'Afterwards', value: 'If it fits, the deep assessment. If it does not, you leave with a straight answer.' },
    ],
    cta: 'Book a consultation',
    note: 'Usually a reply within one working day.',
  },

  /**
   * The trust floor, after the film ends: the questions a visitor has before
   * they message, and the small print under every claim on the page.
   */
  trust: {
    eyebrow: 'BEFORE YOU ASK',
    title: 'Questions people ask before they message.',
    faq: [
      {
        q: 'How long does the program run?',
        a: 'Twelve weeks to start, and most clients continue on a maintenance plan after that. The consultation confirms the right length for your goal.',
        draft: true,
      },
      {
        q: 'What does it cost?',
        a: 'The investment is shared at the consultation, once the assessment shows what your plan needs. There is no template price because there is no template plan.',
      },
      {
        q: 'Do I need a gym?',
        a: 'No. Training is built for the equipment you have, at home, in a hotel or in a gym, and it changes when your week does.',
      },
      {
        q: 'How often do we check in?',
        a: 'Every week. Weight, measurements, photos, strength, energy, hunger and adherence, reviewed together, and the plan adjusted against them.',
      },
      {
        q: 'I travel most weeks. Does that work?',
        a: 'It is designed for it. Travel, eating out and hotel training are part of the plan from day one, not an exception to it.',
      },
      {
        q: 'Is the consultation free?',
        a: 'Yes. About 15 minutes on WhatsApp, a call or a chat, and no obligation either way.',
        draft: true,
      },
      {
        q: 'What happens after I message?',
        a: 'Ikram replies himself, usually within one working day, to arrange the consultation. If it fits, the next step is the deep assessment. If it does not, you leave with a straight answer.',
      },
      {
        q: 'Can my partner and I do this together?',
        a: 'Yes. Two assessments and two plans, because two bodies are never one case, with the accountability shared and one consultation for both of you.',
        draft: true,
      },
      {
        q: 'I have a medical condition. Can I still be coached?',
        a: 'Tell Ikram at the assessment. Medical history, injuries and blood work where available are part of it, and the plan works around them. Coaching is not medical advice, and where your doctor’s clearance is needed, it comes first.',
      },
      {
        q: 'Can I cancel, or get a refund?',
        a: 'The terms are in the refunds and cancellations policy linked below, and Ikram walks you through them before anything is paid.',
      },
    ],
    legalLabel: 'THE SMALL PRINT',
    legalLead:
      'How your details are handled, what the coaching does and does not promise, and how cancellations work.',
    legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Refunds and cancellations', href: '/refunds' },
    ],
    disclaimer:
      'Individual results vary. Every plan follows an assessment of the person it is for, and nothing on this page is medical advice.',
  },

  nav: {
    brand: 'Ikram Ansari',
    /**
     * The masthead logo's accessible name: the words the logo itself sets, so
     * a screen reader hears what a sighted visitor reads rather than a
     * description of the picture. It is also the link's accessible name, since
     * the anchor has no text of its own.
     */
    brandAlt: 'Fitoholix, fit for life',
    links: [
      { label: 'Results', href: '#results' },
      { label: 'What you get', href: '#receive' },
      { label: 'The method', href: '#method' },
      { label: 'Nutrition', href: '#nutrition' },
    ],
    cta: 'Book a consultation',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
  },

  footer: {
    name: 'Ikram Ansari',
    role: 'Transformation Coach · Entrepreneur · Educator',
    tagline: 'Coaching busy professionals through transformations that hold, long after the coaching ends.',
    linksLabel: 'EXPLORE',
    links: [
      { label: 'The coach', href: '#coach' },
      { label: 'Results', href: '#results' },
      { label: 'What you get', href: '#receive' },
      { label: 'Who it is for', href: '#pathways' },
      { label: 'The method', href: '#method' },
      { label: 'Nutrition', href: '#nutrition' },
      // the one outbound entry in this column; SiteFooter marks it up as external
      { label: 'Book a consultation', href: BOOKING_HREF },
    ],
    contactLabel: 'CONTACT',
    // Both are Ikram's real details and both reach him: the number dials and
    // the address receives.
    contact: {
      email: 'ikramansari@gmail.com',
      phone: '+91 97387 20404',
    },
    followLabel: 'FOLLOW',
    // Two accounts, because they are two different things: the coach and the
    // business. Both are live.
    social: [
      { label: '@iamikramansari', href: 'https://www.instagram.com/iamikramansari/' },
      { label: '@fitoholix.in', href: 'https://www.instagram.com/fitoholix.in/' },
    ],
    legalLabel: 'LEGAL',
    legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Refunds', href: '/refunds' },
      { label: 'Questions', href: '#faq' },
    ],
    // The agency credit, stated beside the copyright where a credit belongs,
    // rather than competing with the client's own contact details.
    credits: [
      {
        prefix: 'Designed and developed by',
        name: 'VelyxLabs',
        href: 'https://www.velyxlabs.in/',
      },
    ],
    copyright: '© 2026 Ikram Ansari. All rights reserved.',
  },

  chrome: {
    skipLink: 'Skip to content',
    /** the tag on a drafted row, on builds that show drafts */
    draft: 'Draft',
    /** the analytics line, only on builds where analytics are configured */
    notice: {
      text: 'This site uses analytics cookies to see what gets read.',
      link: 'Privacy',
      dismiss: 'OK',
    },
  },

  a11y: {
    /** one accessible name per station, keyed as src/stations/geometry.ts is */
    stations: {
      hero: 'Introduction',
      problem: 'The problem with quick fixes',
      credibility: 'The coach',
      transformations: 'Client results',
      receive: 'What you receive',
      pathways: 'Who this coaching is for',
      method: 'The Total Transformation Protocol',
      nutrition: 'Nutrition philosophy',
      close: 'Book a consultation',
    },
    trust: 'Questions and the small print',
  },
} as const

export type Copy = typeof COPY
