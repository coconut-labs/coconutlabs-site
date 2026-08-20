# coconutlabs.org: personal brand, live demos, credentials

2026-08-20. Design for two coupled changes: the site becomes Shrey's studio
rather than a two-person company, and its main content becomes demos that
actually run. The skill-up curriculum is a separate project and stays local.

## Decisions taken

| Question | Answer |
|---|---|
| Identity | Lab as studio. Coconut Labs stays the banner; the voice is Shrey's. Jay credited where he contributed, not a co-founder slot. `/joinus` retires. |
| Budget | Hard $0. No paid plan. |
| Navigation | Slight reorganization of the current index and landing page. No new taxonomy. |
| Demo slate | Both, heavy: keep the systems units, add a substantial AI/ML band. |
| Credentials | Real section. Source material found on disk. |

## The demo ladder

Three tiers. Each repo lands on the lowest rung that still tells its story.

```
   ENGINE DEMOS         AI DEMOS              HEAVY DEMOS
   browser wasm         Worker (free)         laptop + tunnel
                          + Workers AI
   real compiled code   real model            full fidelity
   visitor's CPU        10k neurons/day       MLX, Spark, Postgres
   never down, $0       + D1 runs/share       live/offline badge
                        never down, $0        + recorded replay
```

The unlock: Workers AI is on the free plan at 10,000 neurons/day, and the
Workers 10 ms CPU limit measures only the Worker's own code. Waiting on a
binding does not count. So a free Worker can call a real model, stream the
answer, and persist the run, spending ~2 ms of its own CPU. Live inference at
hard $0 is real, not a compromise.

Free-tier models confirmed available: `@cf/nvidia/nemotron-3-120b-a12b`,
`@cf/google/gemma-4-26b-a4b-it`, `@cf/zai-org/glm-4.7-flash`.

### Honesty rule per tier

- Engine: runs the real compiled crate, seeded and deterministic.
- AI: names the model, the token count, and the neurons spent. No hidden
  prompt doing the work the model is credited with.
- Heavy: says plainly when the laptop is off and shows a recorded run instead.
  A demo that pretends to be live when it is not is worse than no demo.

## Voice

Rendered prose carries ~50 first-person-plural forms. The lab-plural is the
thing that reads as a company, not Jay's name, which appears in exactly three
places.

- `we` meaning the lab becomes `I`.
- `we` meaning Shrey and a named collaborator on a specific piece of work
  stays `we`, because it is true.
- `content/people/shrey-patel.mdx`: role becomes Engineer, not Co-founder.
- `content/people/jay-patel.mdx`: role becomes Collaborator. Kept, not deleted.
  He contributed and the site says so.
- `how-we-work.mdx` "Honest scale" is rewritten: a studio of one with a
  regular collaborator, stated plainly.
- `/joinus` retires. It implies hiring and there is no hiring.

## Credentials

Source material on disk, verified:

| Credential | Issued | Artifact |
|---|---|---|
| NVIDIA Certified Professional: Gen AI and LLMs | 2026-02 | PDF + badge PNG |
| Oracle Certified Professional: OCI Multicloud Architect | 2025 | badge JPEG |
| Oracle Certified Professional: Oracle Cloud Database Services | 2025 | badge JPEG |
| McKinsey.org Forward | 2025-12 | PDF |
| 4 further eCertificate PDFs | 2025-10/11 | PDF |

Excluded by default and never published: `Govt_Loan_EWS_CERTIFICATE`, degree
and university character certificates, anything under `VISA/` or `EAD/`, and
the ZF Friedrichshafen internship certificate. The first three are identity
documents. The last is an employer artifact and falls under the standing rule
that no employer is listed beyond what the resume already carries.

Each entry shows issuer, title, date, and a verification link where the issuer
provides one. A credential with no verifiable link says so rather than
implying one.

## Landing page

Current order: StatusStrip, Hero, ManifestoStrip, ProjectsStrip,
SurfacesStrip, EvidenceStrip, PeopleStrip, ContactStrip.

Reorganized: the demos move up directly under the hero, because they are the
thing worth seeing first and they currently sit fourth. Credentials gets a
strip. People becomes a single line about who runs this rather than a founder
grid.

## Out of scope

The skill-up curriculum. It is personal, stays local, and gets its own spec.
