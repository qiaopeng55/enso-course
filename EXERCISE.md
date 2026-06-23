# Ensō — the `broken-gate` exercise

A leash is only as good as its gate. This exercise makes that visceral: you're given a gate that *looks*
right and *passes*, but quietly lets slop through. Find the hole.

## The setup

```bash
git checkout 6-tests        # the floor, working
node gate.mjs && node --test # green
```

Now introduce a subtly weakened gate (or check out `broken-gate` if your repo ships it). The weakened gate
still passes on the clean file — but it has a hole. Your job: **find the slop it lets through, then fix the gate.**

## The hunt

1. **Write a failing case first.** Add a test to `test/` that asserts the gate blocks the bad input you suspect
   (an emoji in a tricky spot, a `#FFF` inside a longer token, a second `<script>` block, a `COLUMNS`
   look-alike in a comment). Run `node --test` — does it fail the way you expect?
2. **Read the gate as an adversary.** For each check, ask: *what input satisfies the regex but violates the
   intent?* The classic holes:
   - the emoji range misses a block (e.g. supplemental symbols);
   - the color check matches `#fff` but not `#FFF0` / `rgb(255,255,255)`;
   - the JS check only parses the **first** `<script>` — a second one is unchecked;
   - the `COLUMNS` check substring-scans instead of asserting the array really declares all three.
3. **Fix the gate so your failing test passes** — and confirm the clean file still passes. Generator ≠
   evaluator: you wrote the test (the evaluator) *before* trusting the fix (the generator).

## The lesson

A gate is a *floor*, not a *ceiling*. It catches the slop you thought to check for — no more. That's exactly
why the stack is layered: the deterministic gate is fast and cheap, `node --test` proves behavior, and the
release gate (smoke + an independent receipt) audits what no regex can. **When you trust a leash, you are
trusting whoever wrote the gate.** Make that person careful — and never let the thing being checked grade its
own check.

> Falsifiable done: a new test that fails on the weakened gate and passes on your fixed gate; the clean file
> still green; and you can name, in one sentence, the class of slop the original hole allowed.
