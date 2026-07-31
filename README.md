# Ultimate Fitness — member app (proof of concept)

React Native / Expo. One codebase for iOS, Android and web; the demo goes out as a web link.

This is **v0**: the thinnest slice that tells the story — onboarding → today's plan → log a
meal → see a streak → one upsell moment. It is not production-complete, by design.

## Run it

```bash
npm install
npm run web            # or: npm start, npm run ios, npm run android
npm run typecheck
npm run food-coverage  # which foods are mapped, which still need review
```

## Demo-prep checklist

Run through this before standing in front of the gym owner.

1. **`npm run food-coverage`** — must exit 0. It fails if any food in the plans is missing from
   the alias table, because an unmapped food silently gets no macros and no swaps. It also lists
   every group still marked placeholder and every macro still estimated. **Nothing in the food data
   is nutritionist-verified yet — read the report before claiming any number on screen is real.**
2. **`npm run typecheck`** — must exit 0.
3. **Reset the app** (Progress → Demo controls → Reset everything) so the demo starts at onboarding.
4. **Walk the flow**: goal → physique → protein target → Today → log a meal → Replace an item →
   Progress. Then Demo controls → jump to day 8 for the week-2 progression, and toggle
   Nutrition Coaching to show locked vs unlocked.
5. **Check the day** the demo falls on. Classes come from the real weekday, so a Sunday demo shows
   Sunday's four classes, not Tuesday's Zumba.

## What it does

The gym loses beginners who feel lost and quit before anyone can help them. The app guides them
free through their first 90 days so they keep paying the base membership and warm up to paid
coaching. Every feature sits on that chain: **guide → track → nudge → ramp**.

| Job | Where |
|---|---|
| Guide | Today tab: the day's workout, meals and gym classes |
| Track | Tap to log a meal or session |
| Nudge | Streak, "what's new this week", instructor names on classes |
| Ramp | Meal plan is premium — the locked plan *is* the upsell |

## The three content types

They do **not** share a shape, and that is deliberate.

**Nutrition** — `Program → Phase → Day → Meal → MealItem`. Two weeks seeded from the gym's paper
handout. `day` is a calendar day 1–7.

**Workout** — same envelope, but `day` means **session ordinal**, not a calendar day. Phase 1 is
full body for 4 weeks, Phase 2 a lower/upper/full split, both 3×/week. Four days a week have no
session; those render as an explicit rest day, never as an empty screen.

> All exercise content is **placeholder** — a structural stand-in so the app can be demoed. Real
> programming comes from the gym's trainers. Grep `"placeholder": true` for everything outstanding.

**Classes** — a weekly recurrence, not a progression. Zumba is Tuesday 6:30pm regardless of when
you joined, so it gets a flat schedule instead of a per-member grid. Read-only; tap for detail.
No booking.

### Two clocks

Program content is keyed to **program day N** (from the member's start date). Classes are keyed to
the **actual weekday**. A member who starts on a Thursday sees nutrition day 1 next to Thursday's
classes. `src/lib/date.ts` keeps these separate on purpose.

## Week-2 progression highlighting

The headline demo feature: the paper sheet's red pen, digitised.

`src/data/changes.ts` runs a real phase-to-phase **diff** rather than reading the `change` flags,
because week 2 stores only the new value — "chicken 6oz, increased" cannot render as **5 oz → 6 oz**
without looking back at week 1. The diff also catches what no flag can: items that were *dropped*
(both bouillons, the toasted almonds) are simply absent from week 2, and only a set difference
finds them.

Two rules keep it honest:

- **The sheet is authoritative about which meals changed.** If the gym flagged nothing in a meal, we
  do not invent changes from name drift — day 4's shake goes "almond milk" → "unsweetened almond
  milk" and the gym's own note says it's the same shake. Every genuine drop sits in a meal that
  *does* carry flags, so nothing real is lost.
- **Wholesale swaps collapse.** A snack replaced outright would leave six struck-through lines above
  three new ones, which reads as damage rather than progress.

Colour is never the only signal — every change state carries a glyph and a text label too.

## Substitutions and macros

Deterministic. No LLM, no external food database, no network call.

**Macros live on the item, at the serving listed.** `chicken breast 5 oz` and `chicken breast 6 oz`
carry separate values, so week 2's portion bump shows a real macro increase with no arithmetic.
An item with no quantity on the sheet ("celery", "cinnamon") gets no macros — no quantity, no honest
number. Every value is `macrosEstimated: true`.

The numbers come from `scripts/populate-macros.mjs` rather than hand-editing, so there is one
auditable table for the nutritionist to review. Change it and re-run `npm run populate-macros`.

### Food-name matching: an alias table, not string matching

`seed/food-aliases.json` maps each food string to a canonical `foodId`. Lookup is **exact match
after trim + lowercase + whitespace collapse** — no stemming, no plural rules, no token dropping,
no fuzzy distance.

The plans contain both `"pepper"` (cracked black pepper, a seasoning) and `"peppers"` (bell peppers
in a stir fry). Any plural-stemming normalizer merges them, turning a seasoning into a vegetable
inside a number the member is being asked to trust — and it fails *silently*. So the mapping is a
hand-authored table with three outcomes:

| | |
|---|---|
| **mapped** | has a `foodId`; can carry macros and swaps |
| **excluded** (`null`) | reviewed, deliberately not a swap candidate — seasonings, garnishes |
| **unknown** | absent from the table; gets nothing, and fails the coverage report |

`null` being a real answer is the point: a table can say "pepper is a seasoning, deliberately
excluded" in a way a regex cannot, and the nutritionist can audit 100 lines of mapping.

The week-2 progression diff keeps its own looser matching. A mismatch there costs a stray badge;
a mismatch here costs a wrong gram count. Different stakes, different mechanism — deliberately
not unified.

### Swapping

Every group member carries **its own serving size and its own macros at that serving** — never
derived from the food it replaces, which would make the delta circular. Replacing shows the honest
consequence: swapping 6oz chicken for the plant option reads `+60g carbs, −26g protein, −5g fat`.

Substitutions are an **overlay** keyed by date, so the seed is never mutated and the gym's original
is always one tap away. A stale `foodId` (after a seed change) falls back to the original rather
than dropping the item. Once an item is swapped, its week-2 change badge steps aside — `5 oz → 6 oz`
next to a different food would be a lie.

> All 8 groups and every serving are **placeholder, pending nutritionist approval.**

Full macro-target meal planning is explicitly out of scope — v1, nutritionist-configured.

## Layout

```
seed/                     content, as given by the gym — source of truth
  catalog.json            goals + program index; goal availability lives here
  program.json            nutrition program (stay-healthy, premium)
  week1.json week2.json   the paper handout, transcribed, + macros
  workout-*.json          workout program + 2 phases (PLACEHOLDER content)
  classes-schedule.json   the gym's weekly class schedule
  food-aliases.json       food string -> foodId (PLACEHOLDER, needs review)
  substitutions.json      8 swap groups (PLACEHOLDER, needs approval)
app/                      routes only; screens stay thin
src/data/                 loads + resolves seed content
src/lib/                  date + macro arithmetic
src/store/                profile, log, streak, substitutions (AsyncStorage)
src/components/           presentational
scripts/                  populate-macros, food-coverage
```

Screens never touch JSON or AsyncStorage directly. Backend, auth and hosting are undecided per the
brief, so swapping local storage for a real API is a change confined to `src/data` and `src/store`.

## Demo controls

Progress tab → **Demo controls** (collapsed by default, not part of the member experience):

- **Unlock Nutrition Coaching** — flip free ↔ premium to show the locked plan and the full plan
- **Jump to day** — day 8+ shows the week-2 progression without waiting a week
- **Reset everything**

## Known rough edges

- Week 1 is `verified: false` — reconstructed from a blurry photo. The three swapped snacks
  (days 1–3, slot 2) are the spots to spot-check with the gym.
- Meal slot labels are our assumption; the paper grid has no row labels. `labelAssumed: true`.
- Six meal slots per day in the data vs "roughly five" in the brief. Data wins; worth confirming.
- Classes marked *not weekly* (alternating Saturdays, specific dates) are shown with their note
  rather than hidden — we can't compute which Saturday it is, so we don't pretend to.
- Times use the device's local timezone. The gym runs on America/Toronto; a real deployment should
  pin it.
- Past the seeded content (nutrition day 15, workout week 9) the app repeats the last block rather
  than inventing more.
- **No macro value is verified.** Every one is a reference approximation flagged
  `macrosEstimated: true`, including all swap-group servings.
- The plan itself runs high on protein — week 2 day 1 totals ~190g — so the default 100g target is
  cleared well before the day is over. Worth asking the gym what target they'd actually set.
- `egg cups` is written "2-3" on the sheet. Macros use the midpoint, because undercounting a whole
  breakfast is worse than an imprecise one. Flagged estimated like everything else.
- Three swap options (lentils, black beans, tofu) don't appear in the plans at all. They're offered
  as plant alternatives; confirm the gym is happy recommending them.

## Out of scope for v0

Payments and billing, wearables/HealthKit, calorie databases, barcode scanning, photo food
recognition, class booking.
