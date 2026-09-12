# What the site still needs from Ikram

The September 2026 audit rated the site 8.5/10 on brand and 4/10 on proof.
Everything a developer can do about that has been built: the page now has a
place for each missing thing. What follows is the list of those things, in
the order they matter, and exactly what form each has to arrive in.

Every item below currently shows a drafted stand-in on preview builds
(tagged DRAFT) and nothing at all in production. The moment a real value
arrives it replaces the draft in `src/content/copy.ts` or
`src/content/legal.ts`, the `draft: true` flag on that row is deleted, and the
next deploy shows it. `node tools/check-placeholders.mjs` counts what is left.

## 1. The consultation (blocks the most clicks)

The button says "Book a consultation" and the page cannot yet say what that
is. Confirm, in one line each:

- Is it free?
- How long is it? (the draft says about 15 minutes)
- Is it a call, a chat, or the visitor's choice? Always on WhatsApp?
- What happens afterwards? (the draft says: if it fits, the deep assessment;
  if not, a straight answer)

Goes into `booking.detail`, `close.details` and two FAQ answers.

## 2. The program itself

- **Length.** Is there a standard term (the draft says 12 weeks)? A named
  plan (the audit mentions a 100 day plan)? If it has a name, it goes on the
  hero, the "what you receive" facts and the WhatsApp message.
- **Price.** Stated on the page, or shared at the consultation? The page
  currently says "shared at the consultation", which is honest and stays
  unless you want a figure shown.

## Received on 12 September 2026, and now live

- **100+ transformations.** Replaces the "TBC" card the audit called its P0
  release blocker. Stated as "100+" rather than an exact figure so it can be
  defended from client records without arguing about a precise number.
- **Certified in personal training and sports nutrition.** If the issuing
  bodies are worth naming (NASM, ISSA, ACE, K11), send them and the line gets
  more specific, which is worth more than the general claim.
- **There is no app.** The audit assumed one from a tablet in the footage and
  asked for an app walkthrough. Every mention has been removed rather than
  promised. If one is ever built, the section comes back with real screens.

## 4. Case studies (the audit wants six)

For each client, all of the following, or the case does not go up:

- Written consent to publish, naming what is published (photos, first name or
  initials, age, profession, result). An email or WhatsApp message saying so
  is enough; keep it.
- A before photo and an after photo, same pose, same distance, portrait,
  at least 1200px tall. Originals, not screenshots.
- First name or initials (their choice), age, profession, how many months of
  coaching.
- One measurable result in their words or Ikram's: kilos, a blood marker, a
  lift, an event completed.

Spread across the audience if possible: a corporate man, a working woman, a
frequent traveller, and a couple if couples are coached.

There is a ready-to-send message for asking past clients for all of this at
the end of this document.

## 5. Testimonials (three drafts on the page now)

The client's own words, as sent, with name, profession and months of
coaching, and the same consent as above. Two or three lines each is right;
the page does not need more.

## 6. Video (optional, strong)

Short clips, 30 to 60 seconds, phone is fine: the starting problem and what
changed. Upload to YouTube (unlisted is fine) or Instagram and send the
link. Never send the file to the repo.

## 7. Credentials

Certifications, by name and issuing body, and anything else that supports
"ten plus years" (year the practice started, the gym's registration name).
One line each.

## 8. Who the coaching is for

- **Women.** Is there anything specific the coaching supports (postnatal,
  PCOS, menopause) and, just as important, anything it should not claim to?
  The draft path promises nothing clinical.
- **Couples.** Are couples coached as a pair? If not, say so and the couple
  path stays off. If yes: two plans, one consultation, shared check ins, and
  is there a couple price?

## 9. The legal pages

Three drafts are written (`/privacy`, `/terms`, `/refunds`). Read them; tell
us what is wrong, particularly the refund terms (7 days before the
assessment, 14 days after, a 4 week pause) which were invented as a starting
point. Once approved, the "Draft for review" band comes off.

## 10. Later

- Which city, if any, should appear (for search)? The site currently names
  none.
- A domain, if there is one: it sets the canonical link and the share card
  URL (`docs/DEPLOY.md`, `SITE_URL`).
- Google Analytics and Meta Pixel IDs, if measurement is wanted
  (`docs/ANALYTICS.md`).

---

## Appendix: how to collect items 4, 5 and 6 in one evening

Items 4, 5 and 6 are the only ones on this list that cannot be answered from
memory, and they are the ones the audit scored 4/10. They do not need new
clients. With 100+ transformations behind him, Ikram needs roughly ten people
to reply to get six usable case studies.

Pick ten past clients who finished, whose result held, and who parted on good
terms. Send the message below on WhatsApp, one at a time, not a broadcast.
Six replies is a full page; three is enough to publish.

### The message

> Hi [name] — hope you are doing well.
>
> I am putting together a new website, and I want the results on it to belong
> to actual clients rather than being stock photos like most coaching sites
> use. Yours is one I would be proud to show.
>
> Would you be okay with me putting up:
>
> • your before and after photos
> • your first name (or just initials, your choice)
> • your age and what you do for work
> • how many months we worked together
> • one line about what changed
>
> If any of that is too much, tell me which parts to leave out and I will use
> only the rest. And if you would rather not at all, that is completely fine —
> say no and it changes nothing between us.
>
> If yes, please reply with the words "Yes, you can publish this on your
> website" so I have it in writing, along with the two photos and a couple of
> lines in your own words about what was different this time.
>
> Thank you either way.

### What to keep

- **The reply itself.** Screenshot it, or export the chat. That message saying
  "yes, you can publish this" is the consent record. Keep it as long as the
  photo is on the site, and take the photo down if they ever ask.
- **The photos as sent**, not screenshots of them. Portrait, at least 1200px
  tall. Same pose and distance in both if possible; if not, use them anyway
  and do not retouch either one.
- **Their words as sent.** Fix spelling, nothing else. A quote that reads like
  marketing copy will be read as marketing copy.

### Anyone who says no to photos

Ask for just the quote instead (item 5). A named testimonial with no photo is
worth more than a photo pair with an invented name, and several clients who
refuse photos will happily give a line.

### What happens next

Send whatever comes back. Each case study is a five-minute change: the row in
`src/content/copy.ts` is replaced with the real values, `consent` is set to
true, `draft: true` is deleted, the photo pair is derived into WebP, and it is
live on the next deploy. There is no need to wait until all six have arrived —
they can go up one at a time.
