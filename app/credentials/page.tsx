import Image from "next/image";
import { CREDENTIALS_BY_DATE, credentialDate } from "@/lib/credentials";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Credentials · Coconut Labs",
  description:
    "Certifications with issuer, date, credential number, and a verification path where the issuer publishes one.",
  path: "/credentials",
});

export default function CredentialsPage() {
  return (
    <section className="content-band">
      <div className="content-inner">
        <p className="font-mono text-xs uppercase text-ink-2">credentials</p>
        <h1 className="mt-5 text-[clamp(30px,4vw,46px)] leading-[1.05] tracking-[-0.03em]">
          Certifications, with the numbers to check them.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-1">
          Every row carries its issuer, its date, and the credential number the issuer uses to
          look it up. Where an issuer publishes no public verification, the row says so instead of
          implying one. A completion is labelled a completion.
        </p>

        <div className="mt-14 divide-y divide-[var(--rule)] border-y border-rule">
          {CREDENTIALS_BY_DATE.map((c) => (
            <article
              className="grid gap-4 py-7 md:grid-cols-[128px_1fr] md:gap-8"
              key={c.title}
            >
              <div className="flex items-start gap-4 md:block">
                {c.badge ? (
                  <Image
                    alt=""
                    className="h-auto w-[92px] md:w-[112px]"
                    height={112}
                    src={c.badge}
                    width={112}
                  />
                ) : null}
                <p className="font-mono text-[11px] uppercase leading-6 text-ink-2 md:mt-2">
                  {credentialDate(c.issued)}
                </p>
              </div>

              <div className="min-w-0">
                <h2 className="text-[19px] font-semibold leading-snug tracking-[-0.01em]">
                  {c.title}
                </h2>
                <p className="mt-1.5 font-mono text-[12px] text-ink-1">{c.issuer}</p>

                {c.note ? (
                  <p className="mt-3 max-w-[68ch] border-l border-rule pl-4 text-sm leading-6 text-ink-2">
                    {c.note}
                  </p>
                ) : null}

                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11.5px] text-ink-2">
                  <div className="flex gap-2">
                    <dt className="uppercase tracking-[0.1em]">valid</dt>
                    <dd className="text-ink-1">
                      {c.expires ? `through ${credentialDate(c.expires)}` : "does not expire"}
                    </dd>
                  </div>
                  {c.id ? (
                    <div className="flex min-w-0 gap-2">
                      <dt className="uppercase tracking-[0.1em]">no.</dt>
                      <dd className="break-all text-ink-1">{c.id}</dd>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <dt className="uppercase tracking-[0.1em]">verify</dt>
                    <dd>
                      {c.verify ? (
                        <a
                          className="focus-ring rounded-sm text-accent underline decoration-1 underline-offset-2"
                          href={c.verify}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {c.issuer} lookup
                        </a>
                      ) : (
                        <span className="text-ink-2">
                          no public lookup published by {c.issuer}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-2xl font-mono text-[11.5px] leading-[1.8] text-ink-2">
          Degree certificates, identity documents, and employer-issued certificates are
          deliberately not here. This page is the professional record, not a document wallet.
        </p>
      </div>
    </section>
  );
}
