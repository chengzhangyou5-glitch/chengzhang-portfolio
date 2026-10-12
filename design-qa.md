# Project detail pages — visual and functional QA

Date: 2026-10-03 (Asia/Shanghai)
Scope: four project detail pages and necessary shared components only.

## References and interpretation

- Layout sketch: `C:/Users/31954/AppData/Local/Temp/codex-clipboard-ba39e26c-8e66-4fdf-8159-c7646a26a630.png`
- Annotated grid sketch: `C:/Users/31954/AppData/Local/Temp/codex-clipboard-6ec1d5c4-4668-479c-8a5f-433390e22107.png`
- Existing homepage checked in the browser for the dark background, original grid geometry and fonts.
- The sketches specify spatial relationships, not final gray panels or decorative illustrations. Original project covers are used unchanged. Transparent dossier content and subtle blue labels keep the existing site language.
- User authorized CanvasFlow placeholder pages, existing preview cover and hidden project time; three matching real PDF chapters were found and reused. Source mapping and content evidence: `PROJECT-DETAILS.md`.

## Rendered artifacts

Directory: `C:/Users/31954/Documents/skill/output/playwright/project-details-20261003/`

- Four desktop screenshots, all **1707 × 932**, DPR 1:
  - `canvasflow-art-preview-desktop.png`
  - `aigc-design-efficiency-desktop.png`
  - `fliggy-lele-run-desktop.png`
  - `lexin-health-app-desktop.png`
- `four-projects-desktop.png`: overview board containing the four actual browser renders.
- `reference-implementation-comparison.png`: source sketch and actual Lexin render together, with full-page and focused dossier/cover comparisons.
- Each route also has `*-reading-desktop.png`, `*-mobile.png` and `*-mobile-overview.png`.
- `four-projects-mobile.png`: all four mobile overview captures, 390px viewport.
- `browser-run.json`, `interaction-checks.json`: measured layout and interaction results.

## Visual review and iteration

- Full and focused comparison boards were actually opened and inspected. Original covers retain their aspect ratios and are not cropped, recolored or re-created.
- At 1707 × 932: content width 1320px, column widths 502.39px / 753.61px with 64px gap, exactly 40:60. Dossier heights 568–620px; all dossiers and covers fit within the first viewport.
- Initial desktop body size 13px was slightly too small. Increased dossier body and section labels to 14px; metadata values to 13px. Final renders remain balanced and fit without clipping.
- Final dossier bottom positions are 721–747px; covers end at 634–677px. Scroll cue and start of the reading region remain visible below the main content. No large opaque dossier blocks were copied from the sketch.
- Chinese and English use the existing font aliases. Browser platform-font inspection confirmed PingFang SC Regular in Chinese body text and DIN Bold in the CanvasFlow heading on this machine.
- Original grid computation, line widths, colors and cross markers are reused. Grid and dot field are fixed behind the content with pointer events disabled; white/opaque covers and PDF pages cover them normally.
- Mobile becomes a single, normal-flow column. All content wraps, covers retain their proportions, and the bottom navigation stays accessible.

## Actual checks

- `npm run build:projects`: passed, generated all four routes without rewriting homepage files.
- Desktop 1707 × 932: zero horizontal overflow on all four routes.
- Widths 320, 390 and 768px: zero horizontal overflow on all four routes. Mobile cover width at 390px is 350px with 20px margins.
- No failed image loads, failed network requests, console errors or warnings during the four-page render regression.
- No iframe, embed, object or nested vertical scroll containers. The document owns all scrolling.
- Reading cue reaches the page reading anchor on all four routes.
- AIGC / Fliggy / Lexin PDF downloads actually completed with correct suggested filenames and no errors.
- All four next-project links route correctly; returning to homepage preserves the selected project and scroll restoration mechanism.
- CanvasFlow has three labeled placeholder pages. AIGC has 1 real PDF page, Fliggy 5, Lexin 15, in original chapter order. Long PDF pages are split into image tiles solely for rendering, with no internal scrolling.
- Protected homepage HTML, two main app chunks, global stylesheet, `portfolio-fonts.css` and `portfolio-works.css` checked against pre-task SHA-256 hashes: unchanged. Formal GitHub / Netlify repository and read-only reference repository were not changed.

## Remaining asset state

CanvasFlow uses its existing prototype screenshot and explicitly labeled placeholder reading pages, as requested. Three other PDFs are chapters of the existing older portfolio; conflicting old/new Fliggy metrics are omitted from the new dossier rather than guessed. These are asset/content states, not hidden unfinished UI work.

Open P0/P1/P2 visual or functional defects in this scope: none found.

**final result: passed**

---

# Previous work experience QA (preserved)

Date: 2026-10-01
Scope: work experience only, in the independent portfolio prototype.

## Comparison target and evidence

- Source visual truth: `C:/Users/31954/AppData/Local/Temp/codex-clipboard-b04f5450-d1f3-4b55-b1b5-1a8f0755f418.png`.
- Source: 1672 × 941 pixels. Requested desktop viewport: 1707 × 932 CSS pixels.
- Implementation: `http://127.0.0.1:8767/`, reached through the existing 工作经历 navigation.
- Browser: user-authorized Playwright fallback, existing Chromium session.
- Desktop captures: 1707 × 932 pixels at approximately 1 DPR (reported 1.00000003).
- Normalization: uniformly scale source width to 1707 pixels, resulting height approximately 961 pixels; crop its bottom to 932 pixels. Source proportions are preserved. The sketch is a composition reference, not a frozen pixel specification.
- Comparison state: dark theme, first company expanded, other companies collapsed.
- Full combined comparison: `C:/Users/31954/Documents/NetlifyCliData/homepage-qa/experience-hover-comparison-full-final.png`.
- Focused combined comparison: `C:/Users/31954/Documents/NetlifyCliData/homepage-qa/experience-hover-comparison-focused-final.png`. Source and implementation company/body areas are together in one image.
- Final desktop captures: `experience-hover-collapsed-final.png`, `experience-hover-china-final.png`, `experience-hover-fliggy-final.png`, `experience-hover-lexin-final.png`, all in `C:/Users/31954/Documents/NetlifyCliData/homepage-qa/`.
- Responsive captures: `experience-hover-mobile-collapsed.png`, `experience-hover-mobile-china.png`, `experience-hover-mobile-fliggy-final.png` in the same directory, 390 × 844 pixels / CSS viewport.

Both combined source/implementation images and the responsive captures were opened and visually inspected.

## Findings and iterations

1. Initial implementation was compared against the supplied sketch in full and focused images.
   - Transparent module, numbered rows, column alignment, hierarchy, thin dividers, and two-row detail layout match the requested direction.
   - No actionable P0/P1/P2 visual mismatch was found.
   - Existing background grain, drifting elements, navigation, and footer differ from the manually composed sketch; retaining their current implementation is explicitly required by the user.
2. [P2, fixed] Clicking a project tag and then hovering another company produced a browser accessibility warning because the closing panel set `aria-hidden` while its tag retained focus.
   - Fix: remove redundant panel `aria-hidden`; closed panels retain `inert` and CSS visibility, so they cannot receive interaction or appear in the accessibility tree.
   - Rebuilt, reloaded, repeated tag click and company switching, then captured the final full/focused comparison.
   - Final desktop interaction run recorded no new warnings or errors. The existing THREE.Clock deprecation warnings remain outside this module.
3. Early automated measurements sampled CSS transitions before the next rendered frame. Final checks wait for computed colors, arrow transforms, and inactive panel heights to settle. Final geometry below uses settled states.

## Five fidelity surfaces

### Fonts and typography

- Preserve the existing local DIN / PingFang SC font system and fallbacks; no fonts downloaded or bundled.
- Chinese heading and company names use the existing Chinese family; numbers, dates, and English eyebrow use the existing DIN stack. Mixed body text uses the existing mixed stack.
- At 1707 × 932: title 34px / 600; company approximately 38.93px / 500; number 68px / 700; role 20px; date 19px; body 20px / 400 with 33px line height.
- Company names, body text, and project labels are readable without truncation. Mobile retains 21px company names and 16px body text with normal wrapping.

### Spacing and layout rhythm

- Transparent background; no large blue board or extra enclosing frame.
- Root at x64 / y100; width approximately 1579.33px.
- All collapsed: row bottoms approximately 349.17 / 485.83 / 623.17px. All three companies fit comfortably above the fixed footer.
- China expanded: last row bottom approximately 748.50px.
- Fliggy or Lexin expanded: last row bottom approximately 808.83px, still above the desktop footer.
- Details expand inside the row and push subsequent rows. Labels align in a left column, copy and project tags in a right column.
- No project container exists for China, so there is no empty project gap.
- Mobile is a natural vertical layout; expanded content can require scrolling. No horizontal overflow was measured at 390px.

### Colors and tokens

- Use existing theme foreground/background tokens, preserving the site's grid and scene.
- Only expanded number, dash, arrow, and company underline use the blue accent.
- All row dividers remain the same neutral color in every state.
- Inactive number/arrow/underline are neutral or hidden, including after switching and after leaving the module.
- Project tags remain lightweight and gain a blue border/arrow on hover.

### Images and icons

- Existing background and falling elements are unchanged.
- Chevron and project arrow use original Tabler outline geometry, served from a local SVG sprite with 1.75px stroke.
- MIT source references are recorded in `assets/icons/SOURCES.md`; existing `TABLER-LICENSE.txt` applies.
- No placeholder drawings, new raster art, unknown font files, or CDN dependencies were added.

### Copy and content

- All three companies have their correct role and year-level time range, preserving the supplied year precision.
- Each detail panel contains exactly 工作内容 and 工作产出, with the latest user-provided text.
- China has no projects.
- Fliggy shows AIGC 设计提效项目 and 飞猪乐乐跑运营活动.
- Lexin shows 乐心健康 APP 迭代升级项目.
- No 相关项目 heading, 待补充 text, or cross-company content mismatch.
- Project tags have no href or navigation handlers, as explicitly clarified by the user.
- Stable internal identifiers: `aigc-design-efficiency`, `fliggy-lele-run`, `lexin-health-app`.

## Interaction verification

- Desktop whole-row pointer enter opens the correct company.
- Hovering detail text and project tags keeps the company expanded.
- Switching 01 → 02 → 03 leaves exactly one open state.
- The active company alone has the blue number/dash/arrow and extended underline; inactive panels are inert.
- Moving outside the article closes it; leaving the module restores all collapsed states.
- Project tag hover changes the border to the blue accent. Physical click leaves the URL unchanged and the company open.
- Narrow/mobile breakpoint: click opens, a second click closes, and clicking another company switches the single expanded state.
- Mobile settled Fliggy state: panel height approximately 272.66px, other panels 0px; repeated click returns all panel heights to 0px.
- Keyboard Enter opens and Escape closes.
- No React/client errors during verification. Existing THREE.Clock warnings occur on scene initialization and responsive scene recreation; these are unchanged.

## Build and scope verification

- `npm run build:experience`: passed.
- `node --check tools/work-experience-runtime.js`: passed.
- `node --check _next/static/chunks/1ed7a178f7acd3df.js`: passed.
- Repeated build leaves index.html and generated chunk hashes unchanged.
- index.html and the generated main chunk are byte-identical to the pre-task backup outside the work experience markers.
- About, Contact, navigation, font CSS, their editable runtimes, the secondary scene chunk, and the experience build script match pre-task backup hashes.
- Reference repository and formal GitHub/Netlify repository were not edited. No commit, push, or deployment.

## Implementation files

- `tools/work-experience-runtime.js`: content, stable project IDs, whole-row hover and mobile click behavior.
- `portfolio-experience.css`: transparent module, numbered columns, spacing, animated open states, responsive typography.
- `assets/icons/experience-tabler.svg` and `assets/icons/SOURCES.md`: local licensed icons and provenance.
- `index.html` and `_next/static/chunks/1ed7a178f7acd3df.js`: generated experience markup/runtime.
- Previous QA report is retained in `C:/Users/31954/Documents/NetlifyCliData/homepage-qa/experience-hover-before/design-qa.md`.

## Open questions / follow-up

No blocking questions. Real project destinations will be connected when those pages are built, using the retained identifiers. Tags intentionally do not navigate in this iteration.

## Implementation checklist

- [x] Transparent background and restrained dividers
- [x] One-screen desktop collapsed layout
- [x] Whole-row hover with one expanded company
- [x] Two-row company-specific details
- [x] Correct project associations without false links
- [x] Mobile click toggle and no horizontal overflow
- [x] Full and focused visual comparisons
- [x] Build, syntax, repeat-build and scope checks
- [x] Local preview left running

final result: passed
