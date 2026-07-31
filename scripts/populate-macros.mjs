/**
 * One-shot: writes `macros` + `macrosEstimated` into the nutrition seed.
 *
 * Kept in the repo rather than hand-editing the JSON so the numbers have a
 * single auditable source. The nutritionist reviews THIS table, then we re-run.
 *
 *   node scripts/populate-macros.mjs
 *
 * Keys are `food|qty|unit` exactly as they appear on the sheet, because macros
 * are stored per item AS LISTED - "chicken breast 5 oz" and "chicken breast
 * 6 oz" are separate entries. No per-unit arithmetic, so week 2's portion bump
 * shows a real macro increase for free.
 *
 * Every value is a standard reference approximation for the cooked/prepared
 * form. All are flagged macrosEstimated: true. None are verified.
 */
import { readFileSync, writeFileSync } from 'node:fs';

// protein, carbs, fat - grams, at the serving listed in the key
const M = {
  // ---- proteins -------------------------------------------------------
  'chicken breast|5|oz': [44, 0, 5],
  'chicken breast|6|oz': [53, 0, 6],
  'turkey breast|5|oz': [42, 0, 2],
  'turkey breast|6|oz': [51, 0, 2.5],
  'lean steak|5|oz': [41, 0, 11],
  'lean steak|6|oz': [49, 0, 14],
  'lean beef|5|oz': [41, 0, 11],
  'lean beef|6|oz': [49, 0, 14],
  'salmon|5|oz': [36, 0, 18],
  'salmon|6|oz': [43, 0, 22],
  'white fish|5|oz': [33, 0, 1.5],
  'white fish|6|oz': [39, 0, 2],
  'cooked ground turkey|1|cup': [38, 0, 12],
  'tuna|1|can': [26, 0, 2],
  'tuna|0.5|can': [13, 0, 1],
  'turkey bacon|3|slice': [9, 1, 6],
  'turkey bacon, chopped fine|3|slice': [9, 1, 6],
  'plain Greek yogurt|0.75|cup': [17, 6, 0.5],
  'cottage cheese|1|cup': [25, 8, 2.5],
  'protein|1|scoop': [24, 3, 1.5],
  'chocolate protein|1|scoop': [24, 3, 2],

  // ---- eggs -----------------------------------------------------------
  'whole eggs|2|': [12, 1, 10],
  'whole egg|1|': [6, 0.5, 5],
  'eggs|3|': [19, 1, 15],
  'boiled eggs|2|': [12, 1, 10],
  'hard boiled eggs|2|': [12, 1, 10],
  'egg whites|150|ml': [16, 1, 0],
  'egg whites|4|': [14, 1, 0],
  'egg whites|2|': [7, 0.5, 0],
  // The sheet says "2-3". Midpoint, and it is flagged estimated like the rest -
  // undercounting a whole breakfast is worse than an imprecise one.
  'egg cups (turkey bacon, egg, fresh herbs)|2-3|': [18, 2, 13],

  // ---- carbs ----------------------------------------------------------
  'oats|0.5|cup': [5, 27, 3],
  'rye bread|2|slice': [5, 30, 1.5],
  'rye toast|2|slice': [5, 30, 1.5],
  'plain rice cake|1|': [1, 7, 0.3],
  'rice|0.5|cup': [2, 22, 0],
  'yams|3|oz': [1, 23, 0],
  'chick peas|0.5|cup': [7, 22, 2],
  'squash|0.5|cup': [1, 11, 0],
  'carrots|3|oz': [0.8, 8, 0],
  'berries|1|cup': [1, 15, 0.5],
  'pear|1|': [1, 27, 0],

  // ---- vegetables worth counting --------------------------------------
  'green vegetables|2|cup': [4, 10, 0],
  'broccoli|2|cup': [5, 12, 0.6],
  'brussels sprouts|2|cup': [6, 16, 0.6],
  'spinach|1|cup': [1, 1, 0],
  'red peppers|0.5|cup': [0.5, 3, 0],

  // ---- fats + milks (swap groups need these) ---------------------------
  'nut butter|2|tbsp': [7, 7, 16],
  'nut butter|1|tbsp': [3.5, 3.5, 8],
  'peanut butter|1|tbsp': [3.5, 3.5, 8],
  'almonds|10|': [2.5, 2, 6],
  'almonds|5|': [1, 1, 3],
  'toasted almonds|1|tbsp': [1, 1, 4],
  'chopped walnuts|2|tbsp': [2, 2, 10],
  'hemp hearts|1|tbsp': [3, 1, 5],
  'chia seeds|1|tbsp': [2, 5, 4],
  'ground flax|1|tbsp': [1.5, 2, 4],
  'unsweetened almond milk|1|cup': [1, 1, 2.5],
  'unsweetened almond milk|2|cup': [2, 2, 5],
  'almond milk|1|cup': [1, 1, 2.5],
  'almond milk|2|cup': [2, 2, 5],
  'unsweetened coconut milk|1|cup': [0.5, 1, 4.5],
  'unsweetened coconut milk|2|cup': [1, 2, 9],
  'mayo|1|tbsp': [0, 0, 10],
  'mayo|2|tbsp': [0, 0, 20],
  'butter|1|tbsp': [0, 0, 11],
};

const key = (i) => `${i.food}|${i.qty ?? ''}|${i.unit ?? ''}`;

let written = 0;
let skippedNoQty = 0;

for (const file of ['seed/week1.json', 'seed/week2.json']) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const day of data.days) {
    for (const meal of day.meals) {
      meal.items = meal.items.map((item) => {
        const m = M[key(item)];
        if (!m) {
          // No stated quantity means no honest macro. Left blank on purpose.
          if (item.qty === null && M[`${item.food}|`] === undefined) skippedNoQty++;
          return item;
        }
        written++;
        const { food, qty, unit, change, ...rest } = item;
        return {
          food,
          qty,
          unit,
          ...(change ? { change } : {}),
          macros: { protein: m[0], carbs: m[1], fat: m[2] },
          macrosEstimated: true,
          ...rest,
        };
      });
    }
  }
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${file}`);
}

console.log(`\n${written} items given macros`);
console.log(`${skippedNoQty} items left without macros (no quantity on the sheet)`);
