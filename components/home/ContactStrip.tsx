import { EmailLink } from "@/components/primitives/EmailLink";

const EMAIL = "info@coconutlabs.org";

export function ContactStrip() {
  return (
    <section className="content-band">
      <div className="content-inner border-y border-rule py-16 text-center">
        <p className="text-[clamp(2.8rem,7vw,7rem)] leading-none">
          Building something at this layer? Write us.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailLink className="font-mono text-sm" email={EMAIL} />
        </div>
      </div>
    </section>
  );
}
