# Markdown Resume Template

Edit [`resume.md`](/Users/hjort/code/CV/resume.md) and rebuild the site.

## Commands

```bash
npm install
npm run build
npm run preview
```

`npm run preview` now watches [`resume.md`](/Users/hjort/code/CV/resume.md), `src/`, and `scripts/`, rebuilds on change, and reloads the browser from `dist/`.

If you want a plain static server without rebuild/reload behavior, use:

```bash
npm run serve
```

The build writes:

- `dist/index.html`
- `dist/resume.md`
- `dist/resume.pdf`

PDF generation uses Google Chrome in headless mode. If Chrome is installed somewhere else, set `CHROME_PATH` before running `npm run build`.

## Third-Party Assets

This template self-hosts a small set of open-source fonts. Their license texts are included in [`LICENSES/`](/Users/hjort/code/CV/LICENSES) and mapped to the tracked files in [`THIRD_PARTY_NOTICES.md`](/Users/hjort/code/CV/THIRD_PARTY_NOTICES.md).
