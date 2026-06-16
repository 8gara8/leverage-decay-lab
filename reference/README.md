# reference/

`legacy.html` — the original working single-file prototype — is the documented
source of truth for the simulation math and zh-Hant copy (see `SPEC.md`).

It was **not** included in the materials handed to the scaffold step, so it is not
yet committed here. The simulation core in `src/lib/sim.ts` was therefore ported
**verbatim from SPEC.md §6** (which reproduces the prototype's formulas), and the
golden tests in `src/lib/sim.test.ts` (SPEC.md §6.4) lock that math in place.

When `legacy.html` becomes available, drop it in this directory (read-only) and
reconcile any wording in `src/lib/copy.ts` against it.
