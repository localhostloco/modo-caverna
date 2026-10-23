# Engineering standard: build to scale, not to demo

**Binding on every new feature in this repo, and on every new project started from it.**
Agents and subagents read this before their first change.

## Why this exists

AI makes an impressive vertical slice cheap. Scaling that slice into a complete,
coherent product is where cost goes up exponentially: architecture, dependencies,
shared state, integration, performance, regression testing and technical debt. A
change that was trivial early on ends up touching dozens of connected parts, and
every generation that ignored structure makes the next one more expensive. Token
spend shifts from building features to fixing what earlier generations broke.

The countermeasure is ordinary software engineering, applied **all the time**:
modular structure, managed context, automated tests, kept-current specs, and
refactoring *before* the debt compounds. Looking good in a demo is not the bar.
Coherent, maintainable, performant and verified is.

## The gate: before adding any feature

1. **Find where it belongs.** Name the module that owns it. If no module owns it
   cleanly, settle ownership first. That is a design decision, so record it.
2. **Read the shape of the area you will touch.** Refactor first, in its own
   commits with tests green before and after, if the feature would:
   - land in a file or function already past the size signals below;
   - need copy-paste of existing logic;
   - reach into another module's internals;
   - add new shared mutable state, or a second writer to existing state;
   - be hard to test in the current structure.
3. **Write the plan down** (spec, plan doc or task) for anything that spans more
   than one module, before writing code.
4. **Then build the feature**, test-first where practical.

**Refactoring has no budget cap.** Refactor as much as needed, for as long as
needed, so that the next change is cheap. That is the work, not a detour from it.
Two conditions apply:

- Behaviour-preserving refactors and behaviour changes go in **separate commits**,
  so that a regression can be bisected to one of them.
- A refactor is protected by tests that exist **before** it starts. If the area has
  no tests, writing characterization tests is the first step.

## Structure

- **Modules by domain, each with one public surface.** Other code imports only that
  surface, never a module's internals.
- **Dependencies point one way:** UI → application/domain → infrastructure (DB,
  network, filesystem, framework). Domain logic is pure where possible: no I/O and
  no framework calls, so it can be tested in isolation and reused.
- **One owner and one writer per piece of state** (table, store key, cache, global).
  Shared mutable state is a recorded decision, never an accident.
- **The second copy triggers extraction.** Logic does not exist in two places.
- **Config, constants and secrets live in one place.** Nothing is hard-coded deep in
  a module.
- **A dependency must pay for itself.** Note in the commit why it was added.
- **Size signals** (these prompt a split, they are not laws): a file over ~400
  lines, a function over ~60 lines, a UI component with more than one concern, or
  nesting deeper than 3 levels. Split before extending, not after.

## Tests and regressions

- Every behaviour change ships with a test that **fails without the change**.
- Every bug fix starts with a regression test that reproduces the bug.
- Test at the seam that matters. Unit-test pure logic. Write integration tests
  across real boundaries (a real database where the repo has one, not a mock of
  it). Keep at least one end-to-end path for each critical user journey.
- The fast suite runs locally **and in CI on every push**. A red main branch is
  fixed before any new feature starts.
- Never skip, disable or loosen a test to get green.

## Performance

- No I/O inside loops (N+1): batch or join instead.
- Know the expected data size and design for 10× it. Measure before optimizing,
  and keep the measurement (a benchmark, a test or a number in the commit).

## Context management (for humans and agents)

- **Small, well-named modules are context management.** An agent should be able to
  change one feature by reading one module plus its public dependencies.
- **What is not written down does not exist for the next session.** Keep the
  README, this file, the spec and the agent instructions current. Update them in
  the **same commit** as the change, never "later".
- **Record decisions with their rationale** (spec, decision log or ADR), so they
  are not re-litigated or silently reversed.
- **Debt you notice but do not fix goes into the backlog below** (or the repo's task
  tracker) in the same session. It does not live only in a conversation.
- **When coordinating multiple agents:** give each one a narrow scope with explicit
  file ownership, point it at this file, and verify its output (tests run, output
  read) before you integrate it.

## Definition of done (in addition to the repo's own)

- [ ] Tests, typecheck, lint and build pass, and you ran them and read the output.
- [ ] No module boundary crossed and no new file past the size signals, or the
      exception is justified in the commit.
- [ ] Docs, spec and agent instructions reflect the change.
- [ ] Any debt you noticed is written in the backlog below.

## Starting a new project

Do these before the first feature, then copy this file into the new repo:

1. A module layout decision, written down.
2. A test runner with one passing test, plus typecheck/lint where the language
   has them.
3. CI that runs all of the above on every push.
4. A README with the run, test and deploy commands, and `CLAUDE.md`/`AGENTS.md`
   pointing to this file.
5. A spec or plan for the first slice. Build the first vertical slice **on**
   that skeleton, not instead of it.

## This repo: current state and refactor backlog

_Measured 2026-10-23. Update this list whenever an item is fixed or a new one is found._

This is the textbook vertical-slice prototype: the whole app (markup, styles,
state, logic and persistence) is one 1589-line `index.html` with a single inline
`<script>`, and there are **no tests**. Before the next feature, refactor first:

1. **Extract the domain logic** (cycles, goals, exception days, progress
   calculations) into plain ES modules (`<script type="module">`, no build step
   needed) with no DOM access.
2. **Put persistence behind one module.** `localStorage` is read and written in
   several places today. Version the stored schema there so backup/import and
   future migrations stay safe.
3. **Separate rendering from state**, one module per screen/tab.
4. **Add tests** for the domain modules (for example `node --test`, which needs no
   dependencies) and a CI workflow that runs them on every push.
5. **Update `sw.js`'s cache list** whenever files are added, so the installed PWA
   does not serve a stale or partial app.
