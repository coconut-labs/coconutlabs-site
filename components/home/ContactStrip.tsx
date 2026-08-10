import { EmailLink } from "@/components/primitives/EmailLink";

const EMAIL = "info@coconutlabs.org";

export function ContactStrip() {
  return (
    <section className="content-band">
      <div className="content-inner border-y border-rule py-16 text-center">
        <p className="mx-auto max-w-[30ch] text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
          Building something at this layer? Write us.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailLink className="font-mono text-sm" email={EMAIL} />
        </div>
      </div>
    </section>
  );
}
