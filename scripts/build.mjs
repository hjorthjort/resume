import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer-core";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(distDir, "assets");
const fontsDir = path.join(assetsDir, "fonts");
const tmpDir = path.join(rootDir, "tmp");

const markdownPath = path.join(rootDir, "resume.md");
const stylesPath = path.join(rootDir, "src", "styles.css");
const sourceFontsDir = path.join(rootDir, "src", "assets", "fonts");

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function renderChips(items) {
  if (!items?.length) {
    return "";
  }

  return `<div class="chips">${items
    .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
    .join("")}</div>`;
}

function renderLinks(links) {
  if (!links?.length) {
    return "";
  }

  return links
    .map(
      (link) => `
        <a class="contact-item" href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">
          <span class="contact-label">${escapeHtml(link.label)}</span>
          <span>${escapeHtml(link.href.replace(/^https?:\/\//, ""))}</span>
        </a>
      `
    )
    .join("");
}

function renderArrayDetails(items) {
  if (!items?.length) {
    return "";
  }

  return `<div class="detail-list">${items
    .map(
      (item) => `
        <div class="detail-item">
          <span class="detail-label">${escapeHtml(item.name)}</span>
          <span>${escapeHtml(item.level)}</span>
        </div>
      `
    )
    .join("")}</div>`;
}

function splitSections(markdown) {
  const blocks = markdown.trim().split(/^## /m).filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split(/\r?\n/);
    const titleLine = index === 0 && !markdown.trim().startsWith("## ")
      ? "Overview"
      : lines.shift();
    const title = titleLine.trim();
    const body = lines.join("\n").trim();

    return {
      id: slugify(title),
      title,
      body
    };
  });
}

async function ensureDirectories() {
  await fs.mkdir(distDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(fontsDir, { recursive: true });
  await fs.mkdir(tmpDir, { recursive: true });
}

async function copyFonts() {
  const fontNames = [
    "Lato-Light.ttf",
    "texgyreheros-regular.otf",
    "texgyreheros-bold.otf"
  ];

  await Promise.all(
    fontNames.map(async (fontName) => {
      const sourcePath = path.join(sourceFontsDir, fontName);
      const targetPath = path.join(fontsDir, fontName);
      await fs.copyFile(sourcePath, targetPath);
    })
  );
}

function buildHtml(data, sections, stylesheet) {
  const contactItems = [
    `
      <div class="contact-item">
        <span class="contact-label">Location</span>
        <span>${escapeHtml(data.location ?? "")}</span>
      </div>
    `,
    `
      <div class="contact-item">
        <span class="contact-label">Phone</span>
        <a href="tel:${escapeHtml((data.phone ?? "").replaceAll(" ", ""))}">${escapeHtml(data.phone ?? "")}</a>
      </div>
    `,
    ...(data.emails ?? []).map(
      (email) => `
        <a class="contact-item" href="mailto:${escapeHtml(email)}">
          <span class="contact-label">Email</span>
          <span>${escapeHtml(email)}</span>
        </a>
      `
    )
  ].join("");

  const sectionLinks = sections
    .map(
      (section) => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`
    )
    .join("");

  const renderedSections = sections
    .map(
      (section) => `
        <section class="resume-section" id="${escapeHtml(section.id)}">
          <h2 class="section-heading">
            <button
              class="section-toggle"
              type="button"
              aria-expanded="true"
              aria-controls="${escapeHtml(`${section.id}-content`)}"
            >
              <span>${escapeHtml(section.title)}</span>
              <span class="section-indicator" aria-hidden="true"></span>
            </button>
          </h2>
          <div class="section-body" id="${escapeHtml(`${section.id}-content`)}">
            ${md.render(section.body)}
          </div>
        </section>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(data.summary ?? "")}" />
    <title>${escapeHtml(data.name)} - Resume</title>
    <style>
${stylesheet}
    </style>
  </head>
  <body>
    <div class="page">
      <header class="hero panel">
        <div class="hero-copy">
          <p class="eyebrow">Resume / CV</p>
          <h1>${escapeHtml(data.name)}</h1>
          <p class="hero-title">${escapeHtml(data.title)}</p>
          <p class="hero-summary">${escapeHtml(data.summary ?? "")}</p>
        </div>
        <div class="hero-actions">
          <a class="button" href="./resume.pdf" download>Download PDF</a>
          <a class="button" href="./resume.md" download>Download Markdown</a>
        </div>
      </header>

      <div class="layout">
        <aside class="sidebar panel">
          <section class="sidebar-group">
            <h2 class="sidebar-title">Contact</h2>
            <div class="contact-list">${contactItems}${renderLinks(data.links)}</div>
          </section>

          <section class="sidebar-group">
            <h2 class="sidebar-title">Skills</h2>
            ${renderChips(data.skills)}
          </section>

          <section class="sidebar-group">
            <h2 class="sidebar-title">Interests</h2>
            ${renderChips(data.interests)}
          </section>

          <section class="sidebar-group">
            <h2 class="sidebar-title">Languages</h2>
            ${renderArrayDetails(data.languages)}
          </section>

          <section class="sidebar-group">
            <h2 class="sidebar-title">Awards</h2>
            ${renderChips(data.awards)}
          </section>

          <section class="sidebar-group">
            <h2 class="sidebar-title">Service</h2>
            ${renderChips(data.extracurricular)}
          </section>

          <nav class="sidebar-group">
            <h2 class="sidebar-title">Jump To</h2>
            <div class="jump-links">${sectionLinks}</div>
          </nav>
        </aside>

        <main class="content panel">
          ${renderedSections}
          <p class="footer-note">Edit <code>resume.md</code> and run <code>npm run build</code> to refresh the site and PDF.</p>
        </main>
      </div>
    </div>
    <script>
      for (const button of document.querySelectorAll(".section-toggle")) {
        button.addEventListener("click", () => {
          const isExpanded = button.getAttribute("aria-expanded") === "true";
          const section = button.closest(".resume-section");
          const body = document.getElementById(button.getAttribute("aria-controls"));

          button.setAttribute("aria-expanded", String(!isExpanded));
          body.hidden = isExpanded;
          section?.classList.toggle("is-collapsed", isExpanded);
        });
      }
    </script>
  </body>
</html>`;
}

async function generatePdf(htmlPath, pdfPath) {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  ].filter(Boolean);

  let chromePath;
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      chromePath = candidate;
      break;
    } catch {}
  }

  if (!chromePath) {
    throw new Error("No Chrome executable found. Set CHROME_PATH to generate the PDF.");
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--allow-file-access-from-files",
      "--no-first-run",
      "--no-default-browser-check"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: "networkidle0"
    });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  await ensureDirectories();
  await copyFonts();

  const [markdownSource, stylesheet] = await Promise.all([
    fs.readFile(markdownPath, "utf8"),
    fs.readFile(stylesPath, "utf8")
  ]);

  const { data, content } = matter(markdownSource);
  const sections = splitSections(content);
  const html = buildHtml(data, sections, stylesheet);

  const indexPath = path.join(distDir, "index.html");
  const pdfPath = path.join(distDir, "resume.pdf");
  const markdownTargetPath = path.join(distDir, "resume.md");

  await Promise.all([
    fs.writeFile(indexPath, html, "utf8"),
    fs.copyFile(markdownPath, markdownTargetPath)
  ]);

  await generatePdf(indexPath, pdfPath);

  console.log(`Built ${path.relative(rootDir, indexPath)}`);
  console.log(`Built ${path.relative(rootDir, pdfPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
