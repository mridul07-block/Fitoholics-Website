/**
 * The complete copy deck, §5 of docs/BUILD_PROMPT.md, verbatim.
 * Every string on the page lives here. No string literals in JSX components.
 * Bracketed values are client placeholders: they render visibly and
 * tools/check-placeholders.mjs blocks production builds while any remain.
 */

export const COPY = {
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
      { value: '[CLIENT COUNT]', label: 'Transformations', countTo: null, suffix: '' },
      { value: '0', label: 'Fad diets, ever', countTo: 0, suffix: '' },
    ],
    clientCount: '[CLIENT COUNT]',
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
    testimonials: [
      {
        quote: '[TESTIMONIAL 1 QUOTE]',
        name: '[NAME 1]',
        profession: '[PROFESSION 1]',
        duration: '[DURATION 1]',
      },
      {
        quote: '[TESTIMONIAL 2 QUOTE]',
        name: '[NAME 2]',
        profession: '[PROFESSION 2]',
        duration: '[DURATION 2]',
      },
      {
        quote: '[TESTIMONIAL 3 QUOTE]',
        name: '[NAME 3]',
        profession: '[PROFESSION 3]',
        duration: '[DURATION 3]',
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

  footer: {
    name: 'Ikram Ansari',
    role: 'Transformation Coach · Entrepreneur · Educator',
    contact: {
      email: '[EMAIL]',
      instagram: '[INSTAGRAM]',
      phone: '[PHONE]',
    },
    copyright: '© 2026 Ikram Ansari. All rights reserved.',
  },

  chrome: {
    skipLink: 'Skip to booking',
    frameLabel: 'FRAME',
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
