import Link from "next/link";
import { CREDENTIALS_BY_DATE, credentialDate } from "@/lib/credentials";

// Four newest credentials as mono rows, same shape as the evidence strip.
// Issuer and date only here; the numbers and verification paths live on the
// page, because a home strip is an index, not a record.
export function CredentialsStrip() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">credentials</p>
            <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-0.03em]">
              Certified, and checkable
            </h2>
          </div>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-xs text-accent" href="/credentials">
            All credentials
          </Link>
        </div>
        <div className="divide-y divide-[var(--rule)] border-y border-rule">
          {CREDENTIALS_BY_DATE.slice(0, 4).map((c) => (
            <div className="grid gap-2 py-5 md:grid-cols-[120px_1fr] md:gap-6" key={c.title}>
              <p className="font-mono text-[11px] uppercase leading-6 text-ink-2">
                {credentialDate(c.issued)}
              </p>
              <div>
                <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">{c.title}</h3>
                <p className="mt-1 font-mono text-[11.5px] text-ink-2">{c.issuer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
