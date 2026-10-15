# QuietLetter

New Hack Apertus Track 2B prototype, started 14 October 2026.

Work from **track_2b/**; its name and template layout are preserved.
Read [the project guide](track_2b/docs/RUN.md) for native Windows and Docker instructions.

QuietLetter selects requests and ambiguous passages from ordinary letters using
Apertus 1.5, then resolves every selection to an exact source quote. A separate
date scanner displays literal date expressions. It does not infer legal deadlines,
give legal advice, contact a sender, or save letters on the server.

Application: Apache-2.0, see LICENSE. Report/docs: CC-BY-4.0.
Original fictional evaluation dataset and associated recorded data: CDLA-Permissive-2.0,
see track_2b/data/LICENSE. Earlier CC-BY-4.0 permissions for original fictional text
are preserved; the contest data grant is additional. The model/runtime keep their upstream licences.
Upstream template: https://github.com/HackApertus/project-template

Status: official Track 2B submission received on 15 October 2026.
The repository's report revision 2 supplements the original submitted PDF;
the official form attachment has not been replaced and no duplicate was sent.
English demo: https://youtu.be/w3ckIATcLJ8 (116.27 seconds, edited real captures
with disclosed synthetic narration). Technical report: track_2b/QuietLetter_Report.pdf.
The exact `make run`
passed on a clean public Ubuntu runner, including the Docker build, 12 tests and
one real local Apertus review: [verification run](https://github.com/jacman1988-super/quietletter/actions/runs/38594216006).
Read track_2b/docs/VERIFICATION.txt for actual evidence and remaining limitations.

## Further evaluation (15 October)

Twelve additional fictional PL/EN cases were annotated before their first model
call. The prompt/runtime stayed fixed. Raw model: 8 true request selections,
4 false selections and 2 missed requests; keyword baseline: 2 true, 1 false,
8 missed. The existing display filter reduced model false request selections
to 2. For uncertainty the model found all 8 expected quotes but also selected
8 incorrect ones. This is an AI-assisted development set deliberately covering
words outside the small keyword baseline, not an independent accuracy benchmark.

Reproduce with the local app running: `node track_2b/src/evaluate-expanded.mjs`.
Cases, protocol hashes, raw outputs and all errors are in
`track_2b/data/live-evaluation-expanded.json`. The evaluation tools now score raw
model, final display and raw baseline separately. The historical six-case run
is preserved. Three evaluator regression tests are separate from the original
twelve container checks; run `node --test track_2b/src/*.test.mjs` for all fifteen.
