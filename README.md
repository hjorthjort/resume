# Markdown Resume Template

Edit [`resume.md`](/Users/hjort/code/CV/resume.md) and rebuild the site.

## Commands

```bash
npm install
npm run build
npm run preview
```

The build writes:

- `dist/index.html`
- `dist/resume.md`
- `dist/resume.pdf`

PDF generation uses Google Chrome in headless mode. If Chrome is installed somewhere else, set `CHROME_PATH` before running `npm run build`.
