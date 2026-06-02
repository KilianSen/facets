# Phase 1 — "Feels Accurate" QA

Take the test deliberately as each persona and confirm the result reads true. Run with `npm run dev` and open the local URL.

- [ ] **Vault run:** answer the closeness question all-in-for-close / cold-for-distant; answer every other backbone the SAME across its cases. Expect archetype **THE VAULT**; top "tell" mentions closeness + warmth.
- [ ] **Clutch run:** vary only the stakes question (decisive when it matters); flat elsewhere. Expect **THE CLUTCH**.
- [ ] **Constant run:** answer every case of every backbone identically. Expect **THE CONSTANT**; signature map shows the consistency message.
- [ ] **Mixed run:** answer naturally. Confirm the archetype + tells feel plausible and non-random; note any contingency sentence that reads awkwardly (content-tuning follow-up).
- [ ] **Readability:** every contingency sentence is grammatical with the current axis/dim labels (e.g. "When it's someone close, you get warm; when it's a stranger, you stay cool.").
- [ ] **Persistence:** refresh mid-quiz → progress resumes. "Take it again" → returns to landing and clears saved answers.

## Automated coverage already proving the core
- Engine unit tests (rules, signature, match, scoring) + the `golden personas` regression tests assert vault/clutch/constant map to the right archetype end-to-end.
- `validateContent(CONTENT)` is asserted clean (every axis covered, all refs valid).
- `npm test` → 56 passing. `npm run build` → succeeds.

## Notes for future tuning
- Archetype catalog is 6 (vault, constant, performer, clutch, operator, spark); expand toward the spec's 12–16 by adding entries to `src/content/archetypes.ts` and matching golden personas.
- Question bank is 8 (6 backbone + 2 flavor); add more `kind:'flavor'` (or backbone) questions in `src/content/questions.ts` — `validateContent` + golden tests guard correctness.
