# Pizon Khan — monogram assets (direction 1C "Stack")

## Files
- pk-stack-ink.svg / pk-stack-light.svg — the mark alone, transparent background. Ink version for light surfaces, light version for dark.
- pk-avatar-dark.svg / pk-avatar-light.svg — square tile, safe margins built in. Use for GitHub org / project avatars.
- pk-avatar-round-dark.svg — circle-cropped variant.
- pk-lockup-ink.svg / pk-lockup-light.svg — mark + PIZON KHAN + descriptor.
- pk-favicon-16.svg — P only. Below ~20px the two-letter stack fills in; use this instead.
- png/ — rasterized avatars at 512 / 180 / 64 / 32 / 16 and a transparent mark.

## Color
- Ink #0B0C0E — the letterforms
- Graphite #6E7478 — the dividing rule only
- Paper #F6F6F4 — light surfaces and the knockout letterforms on dark

Two tones only. No accent, no gradient, no shadow.

## Construction
Letterforms are pure vector paths — no font dependency, they render identically everywhere.
Uniform stroke weight 20 units on a 100-unit cap height. Rule is 4 units thick with 14 units
of air above and below.

The lockup SVGs set the name in Archivo (Google Fonts, weight 600 / 400, tracked +0.16em).
That text is live type, not outlines — install Archivo, or convert the text to outlines before
sending to a printer.

## Clear space
Keep clear space equal to the stem width (20 units / one fifth of the P height) on all sides.

## Don't
- Don't re-tint the letterforms; don't color the rule anything but graphite.
- Don't stretch, rotate, outline, or add effects.
- Don't set the mark below 24px tall with both letters — switch to pk-favicon-16.svg.
