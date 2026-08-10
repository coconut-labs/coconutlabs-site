/* Direction A footer: a recessed --bg-2 band with a --rule top border and two
   mono 11px items spaced apart. Padding is the handoff's asymmetric 26/34. */
export function Footer() {
  return (
    <footer className="border-t border-rule bg-bg-2 px-[var(--space-page-x)] pb-[34px] pt-[26px]">
      <div className="flex flex-wrap justify-between gap-4 font-mono text-[11px] text-ink-2">
        <p>Coconut Labs · one lab, several surfaces</p>
        <a
          className="focus-ring rounded-sm transition hover:underline hover:underline-offset-[3px]"
          href="mailto:info@coconutlabs.org"
        >
          info@coconutlabs.org
        </a>
      </div>
    </footer>
  );
}
