# Run QuietLetter

Code: Apache-2.0. This guide/report: CC-BY-4.0.

## What actually runs

A Node.js 22.19+ application with no npm dependencies, and local llama.cpp
b11552 serving **Colby/apertus-v1.5-8b-text-Q4_K_M-GGUF**.
This is a community text-only quantization of Apertus 1.5, not the official full
multimodal checkpoint. The event FAQ explicitly allows community GGUFs in Track 2.
The model file is 5,059,027,136 bytes; allow at least 8 GB RAM for runtime and
additional RAM for the browser/OS. Tested Windows host has about 16 GB total RAM.

No Qwen or paid API fallback is present. A missing/failing Apertus returns an error.
All application inference URLs are loopback only. The launcher generates a fresh
model API secret in memory for each session; it is not saved or sent to the page.

## On the author's Windows computer

Double click `Uruchom-QuietLetter.cmd` in the repository root. It reuses the
previously installed official llama.cpp runtime from the neighbouring Calm Evening
folder, and the verified model downloaded into the workspace `work/quietletter-model`.
These are development convenience paths, not dependencies included in the source ZIP.
Open http://127.0.0.1:8830/ when the launcher reports ready. Close the launcher or
press Ctrl+C to stop its model and web server. The web page also provides an explicit stop button for this launcher. Do not start multiple copies.
No execution-policy change, service installation or account is needed.

## Fresh native checkout

1. Install Node.js 22.19+ and Python 3.11+ from official sources.
2. In `track_2b`, run `python src/setup-model.py` for the explicit 5.06 GB free
   download (public weights, pinned revision and SHA256 verified).
3. Obtain the official llama.cpp b11552 CPU binary for your platform, or build
   that tag from https://github.com/ggml-org/llama.cpp/releases/tag/b11552.
4. Set `QUIETLETTER_RUNTIME` to the absolute llama-server executable path and
   `QUIETLETTER_MODEL` to the absolute downloaded GGUF path.
5. Run `node src/run-local.mjs` and open the loopback URL above.

The source ZIP contains neither executable binaries nor model weights.

## Docker / mandatory contest entry point

Prerequisites: Docker Engine, GNU make, Python 3.11+, enough storage for weights,
build tooling and image. On a clean checkout run `make run` in the repository
root, or inside `track_2b`. It downloads/verifies weights, builds the official
llama.cpp tag in a container and exposes only http://127.0.0.1:8830/.

The image runs the app and inference in the same container. Model requests remain
on its loopback interface. The model directory is read only, letters remain in
memory, and no external API is used at runtime. This targets **on-premise**
architecture. It does not claim audited air-gap isolation: the default Docker
network has egress even though this code makes no external runtime requests.

The exact `make run` passed from a clean checkout on a standard public Ubuntu
24.04 GitHub runner on 14 October 2026, at commit
`3f21c5fff7b57497bc21535d20bb02b04a765bd7`. The image built, all 12 technical tests
passed inside it, and a real fictional Apertus HTTP review matched the expected
request, uncertainty quote and literal date (28.659 seconds for that inference).
See https://github.com/jacman1988-super/quietletter/actions/runs/38594216006.
The first attempt found missing `make` in the build image; that was fixed.
Docker remains absent on the author's Windows host. This single smoke test does
not establish classifier accuracy. The contest demo and final submission remain pending.

## Input/output contract

The standalone CLI `node src/cli.mjs` reads one JSON object on stdin:

```json
{"text":"Please return your form by 2026-10-20.","language":"en"}
```

Set `LLM_BASE_URL=http://127.0.0.1:8831/v1`, `LLM_NAME` to the Apertus alias and
`LLM_API_KEY` for your separately started local model. This implements the template
environment-variable contract; it does not automatically start another model.
Alternatively `node src/run-local.mjs --cli` starts its own protected model,
accepts the same input, emits one JSON result on stdout, and shuts down.

Output includes source passages with character offsets, grounded quotes selected
as actions/uncertainty, literal dates, independent rule disagreements and the
raw model ID lists. `classificationVerified:false` and `complete:false` are
intentional. Unsupported model IDs or malformed responses fail the whole request.
Input is bounded to 6000 UTF-16 code units / 48 passages. No silent truncation.

The UI supports Polish/English, synthetic examples, source jumps, result clearing,
cancel and a read-only JSON report the user can copy. Editing text invalidates prior results.
Opening the JSON report selects it for manual copying. Copying it elsewhere is a user action. Browser file downloading was attempted but not confirmed; it was replaced with this visible report.

## Verification and evaluation

Run `node --test src/core.test.mjs src/server.test.mjs` from `track_2b`.
Tests use injected model responses and a real temporary loopback HTTP server;
these are distinct from live model evaluation.
With the app running, `node src/evaluate.mjs` evaluates six hand-authored fictional
cases against actual local inference and writes `data/live-evaluation.json`.
That file is not an independent held-out benchmark. One example was used to tune
the prompt; later observed failures informed the independent disagreement rules.
Do not rerun it as a claim of out-of-sample accuracy.

The regex baseline and the date scanner are deliberately limited. They do not
validate dates, calendar meaning, legal due dates or whether a request is valid.
See VERIFICATION.txt and the technical report for actual results and limits.
