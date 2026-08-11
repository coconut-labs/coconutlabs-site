# coconutlabs.org v1 launch checklist

## Functional

- [x] Home renders all planned strips.
- [x] Research index and post route exist.
- [x] Work, papers, podcasts, project, join, about, contact, and colophon pages exist.
- [x] RSS, sitemap, robots, humans, and 404 exist.

## Performance

- [x] Capture final production bundle table.
- [ ] Run Lighthouse desktop and mobile on production.

## Accessibility

- [x] Run axe-core on all routes.
- [ ] Manual keyboard pass.
- [x] Reduced-motion automated pass.

## SEO + Structured Data

- [x] Canonical metadata helper.
- [x] ScholarlyArticle JSON-LD on research posts.
- [x] Atom feed route.
- [x] OG image route.

## Cross-browser

- [x] Chromium smoke.
- [x] Firefox smoke.
- [x] WebKit smoke.
- [ ] iOS Safari/WebGL check.

## Infrastructure

- [ ] Vercel production deploy.
- [ ] Cloudflare DNS confirmation.
- [ ] Pick the primary Vercel host: apex 307s to www while canonicals, OG, and sitemap mint apex.
- [ ] GitHub `GITHUB_PAT` secret for live signals, if private/rate-limit-proof fetches are needed.

## Content sign-off

- [ ] Replace placeholder founder photo.
- [ ] Replace placeholder about/project copy if desired.
- [ ] Confirm social links.

## Final

- [ ] Production smoke test.
- [ ] 24-hour post-ship monitoring report.
