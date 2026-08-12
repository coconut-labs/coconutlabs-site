import { CadenceSignup } from "./CadenceSignup";

/* Direction A footer, upgraded to a slim two-row band on the same recessed
   --bg-2 ground. Row 1 is the Steady Cadence letter: pitch line left, live
   signup right. Row 2 keeps the original two mono items and adds the outpost
   links; only surfaces that exist today get real hrefs (GitHub, RSS, email),
   everything else is the honest "outposts: soon" note. id="cadence" is the
   anchor target for the /newsletter and /cadence redirects. */

const footerLinkClass =
  "focus-ring rounded-sm transition hover:underline hover:underline-offset-[3px]";

export function Footer() {
  return (
    <footer
      className="border-t border-rule bg-bg-2 px-[var(--space-page-x)] pb-[34px] pt-[26px]"
      id="cadence"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <p className="max-w-[44ch] font-mono text-[11px] leading-[1.7] text-ink-2">
          Steady Cadence · one letter, measured: what we shipped, measured, and got wrong
        </p>
        <CadenceSignup />
      </div>

      <div className="mt-[20px] flex flex-wrap justify-between gap-x-8 gap-y-3 border-t border-hair pt-[18px] font-mono text-[11px] text-ink-2">
        <p>Coconut Labs · one lab, several surfaces</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a className={footerLinkClass} href="https://github.com/coconut-labs">
            GitHub ↗
          </a>
          <a className={footerLinkClass} href="/rss.xml">
            RSS
          </a>
          <a className={footerLinkClass} href="mailto:info@coconutlabs.org">
            info@coconutlabs.org
          </a>
          <span>outposts: soon</span>
        </div>
      </div>
    </footer>
  );
}
