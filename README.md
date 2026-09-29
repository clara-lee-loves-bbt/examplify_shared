# Examplify clone — CS1010E practice

A self-contained clone of the Examplify exam interface for practising CS1010E
mid-term questions. It reproduces the window chrome, dark header with the
countdown, FILTER rail, FLAG QUESTION pill, rounded answer rows, the
`Answers: A - E` / `Answers 1 - 3` blocks, and the Previous / Next / Finish
footer from the reference screenshots.

## Open it

Double-click **`examplify.html`**. That is the whole app — one file, no server,
no install, no network access.

If you would rather edit the source and reload, open `index.html` instead; it
loads `styles.css`, `app.js` and the `data/` files separately.

## Papers

One paper is bundled.

| Exam in the picker | Where it comes from |
|---|---|
| `MID-TERM EXAM (Semester 1 : AY 2025/26)` | `cs1010e_2526S1_midterm.pdf` — the real past paper |

The paper is named exactly as it is titled inside its PDF, so the card always
matches the document it came from.

The PDFs themselves are **not committed** — they are matched by `*.pdf` in
`.gitignore` and stay on the machine that owns them. Everything the app needs
is already transcribed into `data/`, so a fresh clone runs fine without them.

## What the clone does

- **Two question types.** Multiple choice rows show the letter, the option
  text and a mark on the right; fill-in-the-blank questions render `{{n}}`
  markers in the code as circled numbers (the `( ① )` in the screenshots) and
  give you one numbered input per blank, exactly like the paper.
- **Eliminating options.** The mark on the right of a choice strikes it
  through so you can rule answers out; clicking it again undoes the mark. It
  never reveals the key. Eliminated options stay selectable, and your marks
  are kept per question, surviving a reload.
- **The `Answers:` header tracks your choice.** It reads `Answers: A - E`
  until you pick one, then names the letter you selected —
  `Answers: A - E   —   selected: C` — so the choice stays visible even if
  you have scrolled or struck the option out. Fill-in questions keep the plain
  `Answers 1 - 2` header, and their rows carry no elimination mark because
  there is nothing to rule out.
- **Grading.** MCQs are right or wrong. Fill-in questions follow the paper's
  own rule: **every** blank must be correct, there is no partial credit. Text
  answers ignore whitespace and quote style, so `acc + (x,)` and `acc+(x,)`
  both count.
- **Results screen.** Score ring, marks earned, correct / incorrect / skipped
  counts, then a card per question with your answer, the correct answer and a
  short explanation. "Open this question" jumps back into the interface with
  the key overlaid in green and red.
- **Nothing locks you out.** Submitting only shows the key — **Continue this
  paper** puts you straight back into the editable paper with every answer
  intact. **Retake paper** is the only thing that clears answers, and it is
  never automatic.
- **Timer.** Counts down from 90 minutes in `MM:SS` and turns red under five
  minutes. It is a prompt, not a gate: at zero the header switches to
  `TIME OVER +MM:SS` in amber and warns you once, while the paper stays fully
  editable so you can work at your own pace.
- **Answers are saved** to this browser's `localStorage` after every keystroke,
  so you can close the tab mid-paper and resume later, or reload by accident
  without losing anything. The picker shows "In progress — n of 31 answered" or
  your score for a finished paper.
- **Filter**, **flag**, **jump-to-question**, and keyboard shortcuts
  (`←` / `→` to move, `F` to flag, `Esc` to close menus).

## Layout

```
examplify.html          built single-file app — open this
index.html              same app, multi-file version
styles.css
app.js
build.js                inlines index.html + css + js -> examplify.html
data/registry.js        registerExam() helper
data/exam-midterm.js    the bundled paper
tools/extract-pdfs.py   re-extract the PDFs to text (needs pymupdf)
tools/validate-data.js  sanity-check the question data
```

## Rebuilding and checking

After editing `index.html`, `styles.css`, `app.js` or anything in `data/`:

```bash
node build.js              # rebuild examplify.html
node tools/validate-data.js   # verify every paper's data
```

`validate-data.js` checks that question numbers run 1..n without gaps, that
every MCQ's key is one of its own options, that the `{{n}}` markers in each
stem line up one-for-one with the declared blanks, and that the section ranges
cover every question.

To regenerate the extracted text from the PDFs:

```bash
pip install pymupdf
python tools/extract-pdfs.py    # writes tools/text/*.txt
```

## Adding a paper

Create `data/exam-mine.js`, then add a `<script src="data/exam-mine.js"></script>`
line to `index.html` before `app.js`, and rebuild. The shape is:

```js
registerExam({
  id: 'mine',
  title: 'MID-TERM PRACTICE EXAMINATION (AY 2027/2028)',  // name the card
  headerName: 'MID-TERM PRACTICE EXAMINATION (AY 2027/2028)',  // shown in the header
  source: 'my-paper.pdf',
  duration: 90,                                 // minutes
  sections: [{ name: 'Section A', from: 1, to: 12, marks: 1 }],
  questions: [
    {
      n: 1, marks: 1, type: 'mcq',
      stem: [ { p: 'What is returned?' }, { code: '>>> 2 ** 3 ** 2 % 5' } ],
      options: [ { l: 'A', t: '4' }, { l: 'B', t: '512' } ],
      answer: 'C',
      explanation: '** is right-associative, so 2 ** (3 ** 2) = 512 and 512 % 5 = 2.'
    },
    {
      n: 2, marks: 3, type: 'fib',
      stem: [
        { p: 'Complete `rev(t)`, which reverses a tuple.' },
        { code: 'def rev(t):\n    if not t:\n        return ()\n    return {{1}} + {{2}}' }
      ],
      blanks: [ { n: 1, answer: 'rev(t[1:])' }, { n: 2, answer: '(t[0],)' } ],
      explanation: 'The head must land at the end, so the recursive call goes first.'
    }
  ]
});
```

Text inside backticks in a `p` block renders as inline code. Use `{{1}}`,
`{{2}}` … inside a `code` block to place a numbered blank chip. A question with
a single blank and no marker gets one free-standing answer box, which is what
the "Answer: ____" items use. Add `freeform: true` to a blank when any
non-empty answer should be accepted.

## Notes on the keys

`cs1010e_2526S1_midterm.pdf` is the question paper only, so every answer for
that paper was worked out by hand. Some items are worth knowing about:
  - **Mid-Term Q8** asks which expression returns `(1, 3, 5, 7, 2, 4)`-style
    concatenation; the correct result is not listed, so the key is **E**.
    Likewise **Q12** returns 3, which is not listed, so the key is **E**.
  - **Mid-Term Q21** (`r = x % y % z`) is ambiguous: `r < y` and `r < z` are
    both always true, so the item has three valid options. **E** is recorded as
    the key and the explanation says why.
