/**
 * The complete copy deck, §5 of docs/BUILD_PROMPT.md, verbatim.
 * Every string on the page lives here. No string literals in JSX components.
 * Bracketed values are client placeholders: they render visibly and
 * tools/check-placeholders.mjs blocks production builds while any remain.
 */

/**
 * Where every "Book a consultation" on the page goes.
 *
 * A WhatsApp chat rather than a form or a scroll to the closing section: the
 * consultation is a conversation, and this is the line Ikram actually answers.
 * Declared once, above COPY, so the masthead, the hero, the close and the
 * footer cannot drift apart — and so the footer's own links array can point at
 * it without an object having to reference itself while it is being built.
 *
 * wa.me wants the number in E.164 with no plus, spaces or dashes. It is the
 * same line as footer.contact.phone — change both together.
 *
 * The prefilled message is a courtesy: the chat opens with the reason for
 * writing already typed, so the visitor is not left facing an empty box and
 * Ikram can tell where the message came from. It is editable before sending.
 */
const BOOKING_HREF = `https://wa.me/919738720404?text=${encodeURIComponent(
  "Hi Ikram, I'd like to book a consultation.",
)}`

export const COPY = {
  booking: {
    href: BOOKING_HREF,
    /**
     * The accessible name. The link opens WhatsApp in a new tab, which a
     * sighted visitor infers from context and a screen reader user cannot — so
     * it is said. It still begins with the visible label, as WCAG 2.5.3 (Label
     * in Name) requires.
     */
    a11y: 'Book a consultation on WhatsApp (opens in a new tab)',
  },

  entrance: {
    eyebrow: 'TRANSFORMATION COACH · TEN PLUS YEARS',
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

  positioning: {
    index: '02',
    eyebrow: 'THE POSITION',
    quote:
      'For busy professionals tired of failed diets and unsustainable routines, Ikram Ansari builds lifelong habits, not temporary fixes, because he treats every client as a unique case, not a template.',
    stats: [
      { value: '10+', label: 'Years coaching', countTo: 10, suffix: '+' },
      { value: 'TBC', label: 'Transformations', countTo: null, suffix: '' },
      { value: '0', label: 'Fad diets, ever', countTo: 0, suffix: '' },
    ],
    clientCount: 'TBC',
    foot: 'Calm authority in a loud market. No shortcuts promised, none needed.',
  },

  protocol: {
    index: '03',
    eyebrow: 'THE METHOD',
    h1: 'The Total Transformation Protocol',
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

  table: {
    index: '04',
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

  fit: {
    index: '05',
    eyebrow: 'THE FIT',
    h1Lines: ['Built for people whose', 'calendars do not negotiate.'],
    body: 'Working professionals, entrepreneurs and corporate employees, generally between 25 and 45, who are done with quick fixes and ready for something built around a demanding real life.',
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

  proof: {
    index: '06',
    eyebrow: 'IN THEIR WORDS',
    h1Lines: ['Results that outlast', 'the coaching.'],
    /**
     * DRAFTS. Not real client words, and not shippable as they stand.
     *
     * The quotes are written at true length, in the register a real client
     * would use, so the section can be judged as a design — three lines, one
     * concrete change, one thing that outlasted the coaching, which is what
     * this station is arguing. Two Indian clients and one international, to
     * show the practice is both.
     *
     * The names and professions are invented too, so the section can be judged
     * as it will actually look. That is exactly why every row carries
     * `draft: true`: a bracketed name announced itself as unfinished, and a
     * plausible one does not. A visitor cannot tell "Priya Nair, Chartered
     * Accountant" from a real client, and an invented endorsement on a real
     * coaching business is a fake review.
     *
     * The flag is the safety catch that the brackets used to be.
     * check-placeholders.mjs fails any production build while a single
     * `draft: true` remains, so these cannot reach the public site by
     * accident. Preview deploys still build, which is where they are meant to
     * be looked at.
     *
     * To finish: replace the quote with what the client actually said, the
     * name and profession with who they actually are, and delete the flag —
     * all three together, per row. Never keep a drafted quote next to a real
     * name.
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
          'Twelve kilos down and my blood work is back in range. The real result is that I stopped negotiating with myself every morning — training is just a thing I do now, not a decision I have to win.',
        name: 'Aditya Menon',
        profession: 'Product Manager',
        duration: '8 months',
        draft: true,
      },
      {
        quote:
          'I was sceptical that coaching across time zones could work, and the check-ins turned out sharper than anything I had in person. I travel most weeks and the plan was built around that rather than ignoring it.',
        name: 'James Whitfield',
        profession: 'Management Consultant',
        duration: '5 months',
        draft: true,
      },
    ],
    attributionSuffix: 'with Ikram',
  },

  close: {
    index: '07',
    eyebrow: 'NEXT STEP',
    hero: 'Start once. Properly.',
    lead: 'A short consultation. A real assessment. No pressure, no template and no promises anyone should not make.',
    cta: 'Book a consultation',
    note: 'Usually a reply within one working day.',
  },

  nav: {
    brand: 'Ikram Ansari',
    /**
     * The masthead logo's accessible name — the words the logo itself sets, so
     * a screen reader hears what a sighted visitor reads rather than a
     * description of the picture. It is also the link's accessible name, since
     * the anchor has no text of its own.
     */
    brandAlt: 'Fitoholix — fit for life',
    links: [
      { label: 'The method', href: '#protocol' },
      { label: 'Nutrition', href: '#nutrition' },
      { label: 'Who it is for', href: '#fit' },
      { label: 'Results', href: '#proof' },
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
      { label: 'The method', href: '#protocol' },
      { label: 'Nutrition', href: '#nutrition' },
      { label: 'Who it is for', href: '#fit' },
      { label: 'Results', href: '#proof' },
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
    // The agency credits, stated beside the copyright where a credit belongs,
    // rather than competing with the client's own contact details. Two of them
    // now, and they are peers: an array rather than one named field and one
    // bolted on, so neither reads as the sole author of the work.
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
    skipLink: 'Skip to booking',
  },

  a11y: {
    stations: [
      'Introduction',
      'The problem with quick fixes',
      'Positioning and credibility',
      'The Total Transformation Protocol',
      'Nutrition philosophy',
      'Who this coaching is for',
      'Client testimonials',
      'Book a consultation',
    ],
  },
} as const

export type Copy = typeof COPY
