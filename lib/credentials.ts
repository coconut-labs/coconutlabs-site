/* The credential record. One entry per certification, read from the artifact
   itself rather than from a resume line, so every field here is something a
   reader could check against the issuer.

   Two rules this file exists to enforce:

   1. A credential that cannot be independently verified says so. `verify` is
      null when the issuer publishes no lookup, and the page renders that
      absence rather than implying a link exists.
   2. A completion is not a certification. McKinsey's own certificate carries
      the line "McKinsey is not an accredited education body, and thus
      participants of the Forward program will not receive an accredited
      qualification or credential." That is reproduced in `note` and rendered.

   Excluded on purpose and not to be added: degree and university character
   certificates, anything from the VISA or EAD folders, and the ZF
   Friedrichshafen internship certificate. The first are identity documents.
   The last is an employer artifact, and no employer is listed here beyond
   what the resume already carries. */

export type Credential = {
  title: string;
  issuer: string;
  /** ISO date the credential was issued. */
  issued: string;
  /** ISO date it lapses, or null when the credential does not expire. */
  expires: string | null;
  /** Issuer's own credential number, the thing a verifier asks for. */
  id: string | null;
  /** Public verification URL, or null when the issuer publishes none. */
  verify: string | null;
  /** Badge or certificate image under /public/credentials. */
  badge: string | null;
  /** Anything the artifact itself qualifies. Rendered verbatim. */
  note: string | null;
};

export const CREDENTIALS: Credential[] = [
  {
    title: "NVIDIA Certified Professional: Gen AI LLMs",
    issuer: "NVIDIA",
    issued: "2026-02-16",
    expires: "2028-02-16",
    id: null,
    verify: null,
    badge: "/credentials/nvidia-gen-ai-llms-2026.png",
    note: null,
  },
  {
    title: "Oracle Cloud Infrastructure 2025 Certified Generative AI Professional",
    issuer: "Oracle",
    issued: "2025-10-29",
    expires: "2027-10-29",
    id: "322841772OCI25GAIOCP",
    verify: "https://catalog-education.oracle.com/pls/certview/sharebadge",
    badge: null,
    note: null,
  },
  {
    title: "Oracle Cloud Infrastructure 2025 Certified Data Science Professional",
    issuer: "Oracle",
    issued: "2025-10-29",
    expires: "2027-10-29",
    id: "322982946OCI25DSOCP",
    verify: "https://catalog-education.oracle.com/pls/certview/sharebadge",
    badge: null,
    note: null,
  },
  {
    title: "Oracle Cloud Infrastructure 2025 Certified Multicloud Architect Professional",
    issuer: "Oracle",
    issued: "2025-10-13",
    expires: "2027-10-13",
    id: "322982946OCI2025MCAOCP",
    verify: "https://catalog-education.oracle.com/pls/certview/sharebadge",
    badge: "/credentials/oracle-oci-multicloud-architect-2025.jpeg",
    note: null,
  },
  {
    title: "Oracle Cloud Database Services 2025 Certified Professional",
    issuer: "Oracle",
    issued: "2025-10-06",
    expires: "2027-10-06",
    id: "322841772ODBCS25CP",
    verify: "https://catalog-education.oracle.com/pls/certview/sharebadge",
    badge: "/credentials/oracle-cloud-database-services-2025.jpeg",
    note: null,
  },
  {
    title: "McKinsey.org Forward Program",
    issuer: "McKinsey.org",
    issued: "2025-12-10",
    expires: null,
    id: null,
    verify: null,
    badge: null,
    note: "A completion, not a certification. The certificate states that McKinsey is not an accredited education body and that the program carries no accredited qualification or credential.",
  },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2025-10-29" becomes "Oct 2025". Parsed by field, not by Date, so the
    rendered month never shifts with the runtime's timezone. */
export function credentialDate(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** Newest first. The order a reader cares about. */
export const CREDENTIALS_BY_DATE: Credential[] = [...CREDENTIALS].sort((a, b) =>
  b.issued.localeCompare(a.issued),
);
