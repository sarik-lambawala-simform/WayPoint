# 07 — The free dry run is red by construction

**What to build:** `MEMARK_PASS_MODE=auto python -m harness.live` goes green again, so it can do the
one job it exists for.

**Status:** completed

**Reproduces:** every run. It is not a model defect and it has no rate. It reproduces on a clean
checkout with nothing of this phase applied, which is how it was found: the dry run was used to
prove this phase's own wiring and came back red on somebody else's row.

## What happens

```
$ MEMARK_PASS_MODE=auto python -m harness.live
...
Failed: L165
    [FAIL] the new Task says the same errand as the August closure:
           no Card line carries `same-as:: [[people/nikhil-simform#^e330]]`
```

`L165` is phase 10.7's row for the errand that comes round on a schedule. Its check,
`_the_same_as_link_names` at `harness/live/scenarios_p10_7_india.py:132`, reads a `same-as::` link
that a model fills in on a second call.

`auto` answers every schema with the smallest instance it allows. It fills no link. So the check
cannot pass in `auto` and never could.

## Why it matters

The README says what the dry run is for:

> `auto` files nothing and costs nothing. It proves the scenarios are wired before a real call is
> made. A live run that dies on a typo in scenario three has burned the first two for nothing.

A step that is always red proves nothing, and worse, it trains the next person to read past a red
line before spending real calls. The README already names the fix for this exact shape:

> A check that reads what the model wrote is wrapped in `only_when_a_model_answered`, so it is
> scored where one did and prints what it saw where none did.

`_the_same_as_link_names` reads what the model wrote and is not wrapped.

## What to change

Wrap it, the way every other check of its kind is wrapped. The row keeps its force in
`claude-cli` and `live`, which is where it was earning it, and stops failing where no model spoke.

Then check the rest of `harness/live/` for the same shape, because one unwrapped check means nobody
has run the dry run whole for a while. `MEMARK_PASS_MODE=auto python -m harness.live` with no
`--only` is what finds them.

## Done when

- [x] `_the_same_as_link_names` is wrapped in `only_when_a_model_answered`.
- [x] Every other check that reads what a model wrote is wrapped, found by running the whole dry run.
- [x] `MEMARK_PASS_MODE=auto python -m harness.live` reports no failures.
- [x] `L165` still fails in `claude-cli` mode when the link is not filled, so nothing was weakened.
