# shellcheck shell=bash
# The ticket reader: which tickets a feature has, what each one says, and which
# one the loop works next. Sourced by run-ralph-tickets.sh and by the tests, so
# it defines functions and nothing else. Every rule here is in
# .scratch/ralph-ui/research/02-ticket-formats.md, and server/tickets.ts
# follows the same rules. tests/tickets-agree.test.ts checks that they agree.
#
# Reads three globals the caller sets: ISSUES_DIR (the ticket dir), ONLY_SET
# (--only, space-fenced) and ORDER_LIST (--order). The last two may be unset.
#
# A ticket file looks like:
#   # 22 — The Activity tab
#   **Blocked by:** 03 — Extract `activityMerge.ts`; 11 — The Activity trail; 21 — Node settings
#   and the Result tab.
#   **Status:** ready-for-agent
#
# Note the Blocked-by line WRAPS. We read from the marker to the end of the
# field, split it, and take the leading two-digit number of each segment, so
# prose like "§15" or "React 18" inside a title can never be mistaken for a
# blocker.

in_only() {  # $1 = NN -> 0 when this ticket is in scope for this run
  [[ -z "${ONLY_SET:-}" ]] && return 0
  [[ "$ONLY_SET" == *" $1 "* ]]
}

ticket_files() {
  # Emits "NN<TAB>path", numerically sorted, skipping 00-index.md.
  local f base
  for f in "$ISSUES_DIR"/[0-9][0-9]-*.md; do
    base="$(basename "$f")"
    [[ "$base" == 00-index.md ]] && continue
    printf '%s\t%s\n' "${base:0:2}" "$f"
  done | sort -n
}

ordered_ticket_files() {
  # The same rows as ticket_files, in the order the frontier should read them:
  # everything --order names first, in that order, then the rest by number.
  # Without --order it IS ticket_files, so the default board order is unchanged.
  if [[ -z "${ORDER_LIST:-}" ]]; then ticket_files; return 0; fi
  local n num path
  for n in $ORDER_LIST; do
    while IFS=$'\t' read -r num path; do
      [[ "$num" == "$n" ]] && printf '%s\t%s\n' "$num" "$path"
    done < <(ticket_files)
  done
  while IFS=$'\t' read -r num path; do
    [[ " $ORDER_LIST " == *" $num "* ]] || printf '%s\t%s\n' "$num" "$path"
  done < <(ticket_files)
}

path_for() {  # $1 = NN
  local f; f=$(ls "$ISSUES_DIR"/"$1"-*.md 2>/dev/null | head -1)
  [[ -n "$f" ]] || { echo "No ticket file for $1" >&2; return 1; }
  printf '%s\n' "$f"
}

# The raw `**Status:**` value, for display. This is the line set_status writes,
# so it is the only status a build ticket the loop runs can have.
status_of() {  # $1 = path
  field_of '\*\*Status:\*\*' "$1"
}

# The first value of one field, trimmed. $1 is a sed pattern for the label.
field_of() {  # $1 = label pattern, $2 = path
  sed -n "s/^$1[[:space:]]*//p" "$2" | head -1 | tr -d '\r' \
    | sed -e 's/[[:space:]]*$//'
}

# The status key: the value cut at the first ",", "." or " — ". The rest is a
# note for a human ("completed, closed by hand"). Every comparison uses the key.
key_of() {  # $1 = raw status value
  local k="$1"
  k="${k%%[,.]*}"
  k="${k%% — *}"
  printf '%s\n' "$k" | sed -e 's/[[:space:]]*$//'
}

status_key_of() {  # $1 = path
  key_of "$(status_of "$1")"
}

# A blocker's status: `**Status:**` first, then plain `Status:`. A wayfinder
# ticket in the plain block format has only the plain line, and a build ticket
# can still be blocked by it.
blocker_status_key_of() {  # $1 = path
  local st; st="$(status_of "$1")"
  [[ -n "$st" ]] || st="$(field_of 'Status:' "$1")"
  key_of "$st"
}

# `completed` is what the loop writes. `resolved` is what a wayfinder ticket
# says when its question is answered. `done` is what a ticket closed by hand
# says. All three mean the work is done.
is_done_key() {  # $1 = status key
  [[ "$1" == completed || "$1" == resolved || "$1" == done ]]
}

# A wayfinder ticket asks a question rather than asking for code. It has a plain
# `Type:` line or a `## Question` heading. A bold `**Type:**` alone is not
# enough: build tickets carry `**Type:** task` too.
is_wayfinder() {  # $1 = path
  grep -qE '^Type:|^##[[:space:]]+Question[[:space:]]*$' "$1"
}

# Work only a human can do: `-hitl-` in the file name, or `ready-for-human`.
is_human() {  # $1 = path
  [[ "$(basename "$1")" == *-hitl-* ]] && return 0
  [[ "$(status_key_of "$1")" == ready-for-human ]]
}

title_of() {  # $1 = path -> heading with its leading "NN — " or "NN. " stripped
  sed -n '1s/^#[[:space:]]*//p' "$1" | sed -E 's/^[0-9][0-9][[:space:]]*(—|\.)[[:space:]]*//'
}

slug_of() {  # $1 = path -> "boot-plan" part of 02-extract-boot-plan.md
  local b; b="$(basename "$1" .md)"; printf '%s\n' "${b:3}"
}

blockers_of() {  # $1 = path -> space-separated NN list ("" if none)
  # All in one awk: BSD sed has no `\?` in BRE, so the segment match lives here.
  #
  # The list is written by hand, by a human or by a /to-tickets run, so it arrives
  # punctuated however felt natural on the day:
  #   **Blocked by:** 03 - Extract `activityMerge.ts`; 11 - The Activity trail
  #   **Blocked by:** 01, 02, 03, 04, 05, 06, 07 - every ticket in this spec.
  #   **Blocked by:** 02 & 05, plus 11 and 12
  #   **Blocked by:** [02 — May the Card hold a claim?](02-may-the-card.md), now resolved.
  #   **Blocked by:** ticket 03, which is resolved.
  # Splitting on ";" alone read the second of those as ONE segment, so only 01
  # counted and the ticket ran with six blockers unfinished. Every plausible list
  # punctuation is therefore normalised to one delimiter before the split.
  #
  # The field is the first `**Blocked by:**` or plain `Blocked by:` line, plus
  # the lines after it up to a blank line, a heading, or the next `Label:` line.
  # The plain block format puts `Resolved by: ...` on the very next line, so a
  # plain field stops at a plain `Label:` line too. A bold field stops only at a
  # bold one: its wrapped titles can start a line with "Capture: ...".
  awk '
    /^\*\*[A-Z][A-Za-z -]*:\*\*/ { label = 1 }
    plain && /^[A-Z][A-Za-z -]*:([[:space:]]|$)/ { label = 1 }
    grab && (/^[[:space:]]*$/ || /^#/ || label) { exit }
    grab { line = line " " $0; next }
    /^(\*\*Blocked by:\*\*|Blocked by:)/ { grab = 1; plain = /^Blocked by:/; line = $0 }
    { label = 0 }
    END {
      gsub(/\r/, "", line)
      sub(/^(\*\*Blocked by:\*\*|Blocked by:)[[:space:]]*/, "", line)
      # "none", "None. It can start immediately." and "nothing" mean no
      # blockers, whatever prose follows. That prose names tickets on purpose
      # ("none. Related to ticket 06 and not blocked by it"), so it is not read.
      if (line ~ /^([Nn]one|[Nn]othing)([^A-Za-z]|$)/) exit
      # A markdown link counts as its text: [02 — Title](02-x.md) is "02 — Title".
      while (match(line, /\[[^]]*\]\([^)]*\)/)) {
        m = substr(line, RSTART, RLENGTH)
        line = substr(line, 1, RSTART - 1) substr(m, 2, index(m, "](") - 2) \
          substr(line, RSTART + RLENGTH)
      }
      # The word separators first, while the whitespace around them survives.
      gsub(/[[:space:]]+([Aa]nd|[Pp]lus|[Ww]ith)[[:space:]]+/, ";", line)
      # Then the punctuation ones. Deliberately NOT the dash of any width
      # (- – —): a dash divides a blocker NUMBER from its TITLE
      # ("02 - A node prompt"), so treating it as a separator would let a title
      # beginning with two digits be read as one more blocker.
      gsub(/[,;&+|\/\\]|[[:space:]]{2,}/, ";", line)
      n = split(line, seg, /;+/)
      for (i = 1; i <= n; i++) {
        s = seg[i]
        sub(/^[[:space:]]+/, "", s)
        sub(/^[Tt]icket[[:space:]]+/, "", s)
        # Only a two-digit number at the START of a segment counts, so prose
        # like "§15" or "React 18" in a blocker title is never mistaken for one.
        # Accepted cost of the wider split: prose that FOLLOWS a separator and
        # opens with two digits ("..., 22 chars") reads as blocker 22. That is
        # the direction to err in - a phantom blocker leaves the ticket sitting
        # at `blocked` where a human sees it, while a MISSED blocker starts a
        # ticket on top of unfinished work and says nothing.
        # A number named twice is one blocker.
        if (match(s, /^[0-9][0-9]([^0-9]|$)/) && !seen[substr(s, 1, 2)]++)
          printf "%s ", substr(s, 1, 2)
      }
    }
  ' "$1"
}

# 0 when every blocker of the ticket exists and is done.
blockers_met() {  # $1 = path
  local b bpath
  for b in $(blockers_of "$1"); do
    bpath="$(path_for "$b" 2>/dev/null)" || return 1
    is_done_key "$(blocker_status_key_of "$bpath")" || return 1
  done
  return 0
}

# A ticket an agent may start: not a wayfinder, and not work for a human.
agent_may_take() {  # $1 = path
  ! is_wayfinder "$1" && ! is_human "$1"
}

# The frontier: the ticket to work next.
#   1. Any ticket already `in-progress`. A previous round died partway through it.
#   2. Otherwise the first `ready-for-agent` ticket whose every blocker is
#      done. First means lowest-numbered, unless --order was given, in which
#      case it means first in the order you wrote.
# Neither pass ever takes a wayfinder ticket or a human one, even one left
# `in-progress`: an agent must not start on human work.
# Echoes "NN" or nothing.
#
# --only filters both passes and nothing else. It narrows what may be picked and
# changes no rule about what is eligible: a ticket in the set still waits for its
# blockers, and a ticket outside it is never taken even when it is the only thing
# left. That includes the `in-progress` pass, so a ticket parked outside the set
# is left parked rather than dragged back in past the boundary you drew.
next_ticket() {
  local num path
  while IFS=$'\t' read -r num path; do
    in_only "$num" || continue
    [[ "$(status_key_of "$path")" == "in-progress" ]] || continue
    agent_may_take "$path" && { printf '%s\n' "$num"; return 0; }
  done < <(ordered_ticket_files)

  while IFS=$'\t' read -r num path; do
    in_only "$num" || continue
    [[ "$(status_key_of "$path")" == "ready-for-agent" ]] || continue
    agent_may_take "$path" || continue
    blockers_met "$path" && { printf '%s\n' "$num"; return 0; }
  done < <(ordered_ticket_files)
  return 0
}
