/**
 * Food coverage report.
 *
 *   npm run food-coverage
 *
 * Answers three questions before anyone stands in front of the gym owner:
 *   1. Which foods are unmapped? (silently get no macros and no swaps)
 *   2. Which mapped foods still have no macros?
 *   3. Which swap-group foods never appear in the plans, and vice versa?
 *
 * Exits non-zero if anything is UNKNOWN - unmapped is a review task, not a
 * steady state. Deliberately-excluded foods (null in the alias table) are fine
 * and reported separately.
 */
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

const aliases = read('seed/food-aliases.json').aliases;
const subs = read('seed/substitutions.json').groups;
const weeks = [read('seed/week1.json'), read('seed/week2.json')];

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const TABLE = new Map(Object.entries(aliases).map(([k, v]) => [norm(k), v]));

// ---- walk the plans -------------------------------------------------
const seen = new Map(); // normalized food -> { raw, count, withMacros, noQty }
for (const wk of weeks)
  for (const day of wk.days)
    for (const meal of day.meals)
      for (const item of meal.items) {
        const k = norm(item.food);
        const rec = seen.get(k) ?? { raw: item.food, count: 0, withMacros: 0, noQty: 0 };
        rec.count++;
        if (item.macros) rec.withMacros++;
        if (item.qty === null || item.qty === undefined) rec.noQty++;
        seen.set(k, rec);
      }

const mapped = [];
const excluded = [];
const unknown = [];
for (const [k, rec] of seen) {
  if (!TABLE.has(k)) unknown.push(rec);
  else if (TABLE.get(k) === null) excluded.push(rec);
  else mapped.push({ ...rec, foodId: TABLE.get(k) });
}

const sortByCount = (a, b) => b.count - a.count || a.raw.localeCompare(b.raw);

console.log('FOOD COVERAGE\n=============\n');
console.log(`distinct foods in the plans : ${seen.size}`);
console.log(`  mapped to a foodId        : ${mapped.length}`);
console.log(`  deliberately excluded     : ${excluded.length}`);
console.log(`  UNKNOWN                   : ${unknown.length}`);

if (unknown.length) {
  console.log('\n-- UNKNOWN: not in the alias table. No macros, no swaps, no signal to the member.');
  for (const r of unknown.sort(sortByCount)) console.log(`   ×${String(r.count).padStart(2)}  ${r.raw}`);
}

// ---- mapped foods still missing macros ------------------------------
const missing = mapped.filter((r) => r.withMacros === 0).sort(sortByCount);
if (missing.length) {
  console.log('\n-- Mapped but no macros on any occurrence:');
  for (const r of missing) {
    const why = r.noQty === r.count ? 'no quantity on the sheet' : 'not in the macro table';
    console.log(`   ×${String(r.count).padStart(2)}  ${r.raw.padEnd(34)} (${why})`);
  }
}

const partial = mapped.filter((r) => r.withMacros > 0 && r.withMacros < r.count).sort(sortByCount);
if (partial.length) {
  console.log('\n-- Macros on some servings but not others:');
  for (const r of partial) console.log(`   ${r.withMacros}/${r.count}  ${r.raw}`);
}

// ---- swap groups ----------------------------------------------------
const planFoodIds = new Set(mapped.map((r) => r.foodId));
const groupFoodIds = new Set();
const dupes = [];
const ownerOf = new Map();

for (const g of subs)
  for (const m of g.members) {
    groupFoodIds.add(m.foodId);
    if (ownerOf.has(m.foodId)) dupes.push(`${m.foodId} in both ${ownerOf.get(m.foodId)} and ${g.groupId}`);
    else ownerOf.set(m.foodId, g.groupId);
  }

console.log(`\n-- Swap groups: ${subs.length}, ${groupFoodIds.size} distinct foods`);
if (dupes.length) {
  console.log('   BROKEN - a foodId is in two groups, so lookup is ambiguous:');
  for (const d of dupes) console.log(`     ${d}`);
}

const notInPlans = [...groupFoodIds].filter((id) => !planFoodIds.has(id)).sort();
if (notInPlans.length) {
  console.log('   Offered as swaps but never appear in the plans (fine, but confirm with the gym):');
  for (const id of notInPlans) console.log(`     ${id}`);
}

const noGroup = mapped.filter((r) => !groupFoodIds.has(r.foodId)).sort(sortByCount);
if (noGroup.length) {
  console.log('   Mapped foods with no swap group (Replace stays hidden for these):');
  for (const r of noGroup) console.log(`     ${r.raw}`);
}

const placeholderGroups = subs.filter((g) => g.placeholder).length;
if (placeholderGroups) {
  console.log(`\n!! ${placeholderGroups}/${subs.length} swap groups still PLACEHOLDER - pending nutritionist approval.`);
}
console.log('!! Every macro value is macrosEstimated: true. None are nutritionist-verified.');

if (unknown.length || dupes.length) {
  console.log('\nFAIL - resolve the UNKNOWN foods (or mark them null) before the pitch.');
  process.exit(1);
}
console.log('\nOK - every food in the plans is either mapped or deliberately excluded.');
