# Markdown Resume Template

Start by copying [`resume.md.template`](/Users/hjort/code/CV/resume.md.template) to `resume.md`, then build the site from your local `resume.md`.

## Commands

```bash
npm install
npm run setup
cp resume.md.template resume.md
npm run build
npm run preview
```

`npm run build` and `npm run preview` both read from your local `resume.md`.

`resume.md` is intentionally ignored so you can keep personal data locally.

`npm run setup` configures repo-local Git hooks that block commits and pushes if `resume.md` is ever staged or included.

`npm run preview` watches `resume.md`, `src/`, and `scripts/`, rebuilds on change, and reloads the browser from `dist/`.

If you want a plain static server without rebuild/reload behavior, use:

```bash
npm run serve
```

The build writes:

- `dist/index.html`
- `dist/resume.md`
- `dist/resume.pdf`

PDF generation uses Google Chrome in headless mode. If Chrome is installed somewhere else, set `CHROME_PATH` before running `npm run build`.

If `resume.md` does not exist yet, copy the starter file first:

```bash
cp resume.md.template resume.md
```

## Third-Party Assets

This template self-hosts a small set of open-source fonts. Their license texts are included in [`LICENSES/`](/Users/hjort/code/CV/LICENSES) and mapped to the tracked files in [`THIRD_PARTY_NOTICES.md`](/Users/hjort/code/CV/THIRD_PARTY_NOTICES.md).
