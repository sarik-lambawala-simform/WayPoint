# 02. Each reply line reads back its own piece's line

**Type:** task

**Status:** completed

**What to build:** a `✅` line shows the Card line that came off its own piece, so the day lands
beside the errand that named it.

Spec: [../spec.md](../spec.md), structural finding 2.

## What happens today

`acknowledge.lines` writes `landings[number]` beside the `number`th filed piece. The two lists are
in different orders. `vault/apply.py` builds `landings` one Card at a time, in the order of
`_by_target`'s groups. The pieces are in the order the person typed them.

So when one message files onto two Cards, the reply pairs a piece with another piece's line. A piece
that wrote two lines, or none, shifts every line after it too.

## Reproduction

`claude-cli` mode, `an-indian-household`, Monday 28 Sep 2026 20:00.

    you   kal ka kaam: doodh, bread, bhavesh ko rent ke baare mein call 5th ko, maid ko paise
          dena, AC service 9 oct ko, bijli ka bill
    bot   ✅ Loose Ends: get milk
          ✅ Loose Ends: get bread
          ✅ Loose Ends: pay the maid
          ✅ Loose Ends: service the AC
          ✅ Loose Ends: pay electricity bill, on 09 Oct 2026. First reminder 5 days before.
          ✅ Bhavesh (landlord): call about rent

The cut was right: the piece `AC service 9 oct ko` named the AC edits. The Date File line was
right: `2026-10-09 confirmed: [[Loose Ends]] service the AC`. Only the reply was wrong.

- `L329`: 5 of 5 on `claude-haiku-4-5`, 3 of 3 with `MEMARK_FILING_MODEL=claude-sonnet-5`. It is
  code, so the model does not matter.
- `L371`: the same shift, with `Oct 8th` cut into its own piece.

## What to change

- Each filed piece reads back the landings of the edits it names, by edit position, the way
  `Covered.on_its_day` already finds its day.
- A piece whose edits wrote no line keeps the person's own words, as now.

## Done when

- [ ] A unit test files one message onto two Cards with pieces out of Card order, and every `✅`
      line names its own piece's Card line.
- [ ] The day goes beside the errand whose piece typed it in that test.
- [ ] `L329` shows the day beside the AC line on 5 of 5 runs.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
