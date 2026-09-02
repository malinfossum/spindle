# Spindle — brand

What Spindle looks and sounds like, and why. This describes what is already
built; the values live in `CSS/style.css` and `View/Universal/icons.js`, and this
file is the reasoning behind them.

Spindle's brand is not in the shared design system on purpose. The design system
is the foundation under every project; one product's identity does not belong in
it. What is generic here — the icon module, the file-picker pattern, the light
palette — can be promoted separately.

## The name

A spindle is the post at the centre of a turntable, and the hole at the centre of
a record. It names the thing the collection turns on without naming the
collection. It is short, spellable, and not a music-streaming word.

## Voice

Plain, specific, and true. Spindle keeps someone's private library on their own
device, so overclaiming is not a style problem, it is a trust problem.

- **Say what actually happens.** The About page once opened with "No account, no
  cloud" while the app was creating a password-protected profile. Half of that
  was true. It now says the true half.
- **No marketing register.** No "seamlessly", no "effortlessly", no exclamation
  marks in system text. The empty library says "No albums yet. Add your first
  one!" — one exclamation mark, in the one place that is an invitation rather
  than a statement.
- **Name the control, not the icon.** "Tick Wishlist on an album", not "mark it
  with a star" — the star is decoration, the checkbox is the control.
- **Errors say what to do next.** "The storage is full. Export your library,
  then delete old cover images or albums."
- **Norwegian is the source language.** English mirrors it key for key. Norwegian
  uses «», English uses "".

## Colour

Two themes, dark first. Every value is a custom property on `:root`, with the
light theme overriding the same names under `html[data-theme="light"]` — nothing
in the stylesheet writes a raw colour.

| Role | Dark | Light |
|---|---|---|
| Page | `#111111` | `#eef1f6` |
| Card / surface | `#1e1e1e` / `#1c1c1c` | `#ffffff` |
| Raised surface | `#252525` | `#e4e7ea` |
| Border | `#2e2e2e` | `#d6d9dd` |
| Text | `#e8e8e8` | `#16181b` |
| Muted text | `#888888` | `#5e6266` |
| Accent | `#4a80d4` | `#2563eb` |
| Tag | `#1e3050` on `#7aabf0` | `#dbeafe` on `#1d4ed8` |

Rules that produced those numbers:

- **The light greys are near-neutral, with at most a slight cool cast.** An
  earlier version of this rule said the opposite — that near-neutral greys read
  pink on a wide-gamut screen, so every light grey leaned blue: +8 on the page,
  +12 on the raised surface, +14 on the border, +19 on the muted text. What is
  settled is that the pink is not a property of the greys: two materially
  different ramps — the old blue-leaning one and this near-neutral one, side by
  side — read the same salmon cast on the reference monitor (an AW3425DW), and
  a fault that survives the palette cannot be caused by it. A screenshot of the
  same screen is neutral on a phone, so the framebuffer is right and the display
  pipeline is wrong. **The cause of that pipeline fault is still open** — an
  earlier note here claimed it was a stale scanout colour state cleared by
  toggling HDR; the salmon came back, so that explanation does not hold and is
  not a reason for anything in this table. Treat the reference display as
  suspect and the numbers below as measured, not eyeballed. What the current
  direction rests on instead: the shared design system pins cool-cast greys
  (R ≤ G ≤ B, no grey more than 8 points bluer than red) as of DS 3.4.0
  ([workbench PR #22](https://github.com/malinfossum/workbench/pull/22)),
  Spindle follows the shared rule so the two do not drift, and the retune
  raised contrast at every step rather than trading it away. The page keeps
  `#eef1f6` (+8, at the budget's edge); white is still white.
- **Three values flip with the theme rather than being shared**: `--error-text`,
  `--success-text` and `--danger-text`. No single red or green clears 4.5:1 on
  both a `#1e1e1e` card and a white one.
- **Muted text is darker than it looks like it needs to be.** `#5e6266` is 6.15:1
  on white and 5.43:1 on the page. The obvious `#777777` is 4.48:1 on white,
  which is under the floor — secondary text is still body text.
- **The accent is the only saturated colour.** Everything else is grey. A
  collection app is full of album art, and the interface should not compete with
  it.

## Type

`"Segoe UI", system-ui, sans-serif` at a 16px root. No web font: a font file is a
network request, and Spindle makes none.

- Page titles 1.1rem / 700 · brand 1.05rem / 700
- Body 1rem · secondary text 0.875rem · captions and tags 0.72–0.85rem
- Field labels are uppercase and muted: 0.77rem at 0.05em in forms, 0.72rem at
  0.04em over the library's filter controls

## Shape and space

- Radius: 6px for controls, 8px for small panels — the cover slot, the
  suggestion list, the mobile menu — and 10px for cards and the dialog. The
  storage bar is the one pill in the app; nothing else is fully round.
- The content column is 880px, centred, with 1rem of page padding on mobile and
  1.5rem from the tablet breakpoint up.
- Mobile-first, always: base styles target 375px, and layers go up at
  `min-width: 768px` and `min-width: 1024px`.

## Icons

Inline SVG from `View/Universal/icons.js`. No icon font, no sprite sheet, no
dependency.

- One 24-unit grid, `fill: none`, `stroke: currentColor`, round caps and joins.
- 1.75 stroke at 20px and below, 1.25 at 40px and above, so a large icon does not
  read as a heavy one.
- Every icon is decorative: `aria-hidden="true"`, `focusable="false"`. The
  control around it carries the name.
- The disc — three concentric circles — is the app's mark. It stands in for a
  missing cover, and it is the spindle hole.

Emoji are not icons. They render differently on every platform, carry their own
colour into a themed interface, sit on the text baseline instead of the control's
centre, and can be read aloud by name in the middle of a label.

## Floors, not aspirations

These are checked, not hoped for:

- Every target is at least 44×44 CSS px (WCAG 2.5.5, the enhanced level), except
  links inline in a run of text, which the criterion exempts.
- Body text clears 4.5:1; borders and UI edges clear 3:1.
- Focus is always visible, and never removed without something replacing it —
  when the real control is off screen, the ring goes on what the eye can see.
- Nothing conveys meaning by colour alone.
- `prefers-reduced-motion` is respected.

## Assets

There is no logo file, no favicon and no social image yet. The wordmark is the
name set in the interface font at 700. When a mark is drawn, the disc icon is
where it should start.
