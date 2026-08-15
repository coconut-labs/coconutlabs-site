import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import Disclosure from "@/components/demos/Disclosure";
import Steps from "@/components/demos/Steps";
import Demo from "./Demo";
import { HEADLINE_AE, latentRows } from "./schedule";

export const metadata = buildMetadata({
  title: "Latent diffusion mechanics · Coconut Labs",
  description:
    "The noise schedule and the latent squeeze from a CompVis latent-diffusion tree, computed live in your browser from the repo's own configs. No trained model, and an honesty panel for the claims with no artifact.",
  path: "/projects/latent-diffusion",
});

const REPO = "https://github.com/ShreyPatel4/Latent-Diffusion-Artbench-OpenImage";

// Computed by app/projects/latent-diffusion/schedule.ts from ch_mult and
// embed_dim in the four autoencoder configs. Nothing in this table is typed
// by hand: latentRows() does the arithmetic, here and in the browser.
const ROWS = latentRows(512, 3);
const HEAD = ROWS.find((r) => r.file === HEADLINE_AE)!;
const n = (v: number) => v.toLocaleString("en-US");

// Every claim that travels with this project but has no artifact in the repo.
// Nothing from this table is presented anywhere else on the page.
const UNVERIFIED: { claim: string; repo: string; verifies: string }[] = [
  {
    claim: "Trained on 10 H100 nodes over pooled ArtBench and OpenImages",
    repo: "Two commits, under two minutes apart. The second is titled Saving Model Weights and contains no weights: it adds the CompVis source tree, its configs, and eight stock sample images. No checkpoint, no run directory, no lightning_logs, no dataset manifest.",
    verifies:
      "A training log carrying step count, loss curve, wall clock, and the config that ran, next to the checkpoint or its hash.",
  },
  {
    claim: "FID reduced by 20 percent",
    repo: "No eval output, no metrics file, no reference statistics, and no baseline number for the 20 percent to be measured against.",
    verifies:
      "An eval output naming the FID implementation, the reference statistics, the sample count, and the eval config, published beside the baseline it improves on.",
  },
  {
    claim: "1.84 second inference latency",
    repo: "No timing harness, no generated samples beyond the eight stock CompVis assets, no hardware named anywhere in the tree.",
    verifies:
      "A generation run recording sampler, step count, guidance scale, resolution, batch size, device, and wall clock, published with the samples it produced.",
  },
];

export default function LatentDiffusionPage() {
  return (
    <section className="content-band">
      <div className="content-inner max-w-4xl">
        <p className="font-mono text-xs uppercase text-ink-2">
          gallery unit · generative core · bottleneck class I
        </p>
        <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Latent diffusion mechanics
        </h1>

        {/* hook */}
        <p className="mt-6 max-w-2xl text-xl leading-9 text-ink-1">
          A diffusion model learns to undo noise. Do that one pixel at a time and a single 512x512
          image is {n(HEAD.pixelValues)} numbers to clean up, a thousand times over. The word
          &ldquo;latent&rdquo; is the whole trick: squeeze the image into a small code first, denoise
          the code, expand it back at the end. The loop then runs on {HEAD.ratio}x fewer numbers.
          That is the difference between a datacenter and a laptop.
        </p>

        {/* scenario sandbox */}
        <div className="mt-10">
          <Demo />
        </div>

        {/* the squeeze, computed from the configs */}
        <div className="mt-10 rounded-lg border border-rule bg-bg-1/60 p-5 md:p-7">
          <h2 className="font-mono text-xs uppercase text-ink-2">the squeeze, in arithmetic</h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-ink-1">
            The autoencoder in <span className="font-mono text-base">{HEAD.name}.yaml</span> lists{" "}
            <span className="font-mono text-base">ch_mult: {HEAD.chMult}</span> and{" "}
            <span className="font-mono text-base">embed_dim: {HEAD.embedDim}</span>. Class{" "}
            <span className="font-mono text-base">Encoder</span> in
            ldm/modules/diffusionmodules/model.py attaches a downsample at every level except the
            last, halving the side each time, so four entries means three halvings and a spatial
            factor of {HEAD.f}. Run a 512x512 RGB image through it:
          </p>
          <pre className="mt-6 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`image     512 x 512 x 3                     = ${n(HEAD.pixelValues).padStart(9)} numbers
latent    ${HEAD.latentSide} x ${HEAD.latentSide} x ${HEAD.embedDim}   (512/${HEAD.f} = ${HEAD.latentSide})    = ${n(HEAD.latentValues).padStart(9)} numbers
                                            ${"-".repeat(9)}
the U-Net denoises the second one, ${HEAD.ratio}x smaller, 1000 times`}
          </pre>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs uppercase text-ink-2">
                  <th className="py-2 font-normal">autoencoder config</th>
                  <th className="py-2 font-normal">f</th>
                  <th className="py-2 font-normal">latent, 512x512 in</th>
                  <th className="py-2 font-normal">values</th>
                  <th className="py-2 font-normal">vs pixels</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr className="border-b border-rule/60" key={r.file}>
                    <td className="py-2.5 text-ink-1">{r.name}</td>
                    <td className="py-2.5 text-ink-2">{r.f}</td>
                    <td className="py-2.5 text-ink-0">
                      {r.latentSide}x{r.latentSide}x{r.embedDim}
                    </td>
                    <td className="py-2.5 text-ink-1">{n(r.latentValues)}</td>
                    <td className="py-2.5 text-ink-0">{r.ratio}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 max-w-2xl font-mono text-xs leading-6 text-ink-2">
            Two things fall out of the table. The three configs at f = 8 and above all land on{" "}
            {n(HEAD.latentValues)} values: each doubling of the spatial factor is paid back by
            quadrupling the channels, so the count holds and only the shape moves. And the derivation
            checks itself against the filenames. At the configs&rsquo; own resolution of 256, 256/f
            gives {ROWS.map((r) => r.configLatentSide).join(", ")}, which is exactly what{" "}
            {ROWS.map((r) => r.filenameClaim).join(", ")} claim.
          </p>
        </div>

        {/* what you are looking at */}
        <div className="mt-12">
          <Steps
            items={[
              {
                label: "signal in",
                text: "A fixed 24x24 field stands in for a latent. It is a pattern, not an image: small enough to watch cell by cell, which is the only reason it is here.",
              },
              {
                label: "schedule runs",
                text: "The forward step mixes in noise using the beta endpoints from the config you picked, over the repo's 1000 timesteps. Drag t and the mix moves.",
              },
              {
                label: "one step back",
                text: "The reverse step is handed the true noise and returns the original. Spoil that noise by 5 percent and watch the same step multiply the mistake.",
              },
            ]}
          />
        </div>

        {/* architecture */}
        <div className="mt-14">
          <h2 className="font-mono text-xs uppercase text-ink-2">the pipeline, from the code</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-1">
            Three models, trained in two stages. The autoencoder learns the squeeze first and is
            frozen. The U-Net then learns to predict noise inside that squeezed space, with a text
            or class encoder feeding it context through cross-attention. Sampling walks the schedule
            backwards and decodes once at the end.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`stage 1   AutoencoderKL                                ldm/models/autoencoder.py:278
          Encoder / Decoder                            ldm/modules/diffusionmodules/model.py:344
          image 256x256x3  ->  z 32x32x4  ->  image     f = 8 from ch_mult [1,2,4,4]
          frozen after this stage; scale_factor 0.18215 rescales z

stage 2   LatentDiffusion                              ldm/models/diffusion/ddpm.py:401
          register_schedule builds the beta tables      ddpm.py:106
          q_sample adds noise to z                      ddpm.py:252

          prompt -> BERTEmbedder                        ldm/modules/encoders/modules.py:76
                    n_embed 1280, n_layer 32
                       |  context, 1280-d
                       v
          +-- UNetModel -----------------------------+  ldm/modules/diffusionmodules/openaimodel.py:346
          |  in 4ch, out 4ch, model_channels 320     |
          |  channel_mult [1,2,4,4], 2 res blocks    |
          |  attention_resolutions [4,2,1]           |
          |  SpatialTransformer depth 1, 8 heads     |  ldm/modules/attention.py:216
          |     CrossAttention q=z, k/v=context      |  ldm/modules/attention.py:150
          +------------------------------------------+
                       |  eps_hat
                       v
sampling  DDIMSampler / PLMSSampler loop over t         ddim.py:11 / plms.py:11
          predict_start_from_noise closes each step     ddpm.py:195
          z_0 -> AutoencoderKL.decode -> image

all shapes above are read from configs/latent-diffusion/txt2img-1p4B-eval.yaml`}
          </pre>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-1">
            One correction, because it is the thing everyone assumes. Neither text path above
            conditions on CLIP. <span className="font-mono text-sm">txt2img-1p4B-eval.yaml</span>{" "}
            wires <span className="font-mono text-sm">BERTEmbedder</span>,{" "}
            <span className="font-mono text-sm">cin256-v2.yaml</span> wires{" "}
            <span className="font-mono text-sm">ClassEmbedder</span>, and no config in the tree,
            under configs/ or models/, names a CLIP class at all.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
            CLIP is still here, just not through a config. environment.yaml pins openai/CLIP as an
            editable install, ldm/modules/encoders/modules.py defines{" "}
            <span className="font-mono text-sm">FrozenCLIPTextEmbedder</span> at line 133 and{" "}
            <span className="font-mono text-sm">FrozenClipImageEmbedder</span> at line 162, and
            scripts/knn2img.py imports both directly for the retrieval-augmented path. That path&rsquo;s
            config, configs/retrieval-augmented-diffusion/768x768.yaml, sets{" "}
            <span className="font-mono text-sm">cond_stage_config</span> to{" "}
            <span className="font-mono text-sm">torch.nn.Identity</span> and takes its 768-wide
            context precomputed from outside. So the conditioning encoder is chosen by the script
            there, not by the config.
          </p>
        </div>

        {/* the honesty panel: the strongest thing on this page */}
        <div
          data-testid="honesty-panel"
          className="mt-14 rounded-lg border border-rule bg-bg-1/60 p-5 md:p-7"
        >
          <h2 className="font-mono text-xs uppercase text-ink-2">
            the claims with no artifact
          </h2>
          <p className="mt-4 max-w-2xl text-xl leading-9 text-ink-0">
            Three claims travel with this project in its resume form: a training run on 10 H100
            nodes over pooled ArtBench and OpenImages, a 20 percent FID improvement, and 1.84 second
            inference. None of them are presented as results here. They were claimed during
            development and the artifacts were not retained in the repository.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
            The repository was read end to end twice, most recently on 12 August 2026: 65 tracked
            files, 2 commits, both dated 4 December 2024. It holds no training log, no eval output,
            no checkpoint, and no generated sample beyond the eight that ship with the upstream
            source. So none of the three numbers appear anywhere else on this page, in the gallery
            card, or in the page metadata.
          </p>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule text-left font-mono text-xs uppercase text-ink-2">
                  <th className="py-2 font-normal">claimed, unverified</th>
                  <th className="py-2 font-normal">what the repo actually holds</th>
                  <th className="py-2 font-normal">what would verify it</th>
                </tr>
              </thead>
              <tbody>
                {UNVERIFIED.map((r) => (
                  <tr className="border-b border-rule/60 align-top" key={r.claim}>
                    <td className="py-3 pr-5 font-mono text-xs leading-6 text-ink-0">{r.claim}</td>
                    <td className="py-3 pr-5 text-sm leading-6 text-ink-1">{r.repo}</td>
                    <td className="py-3 text-sm leading-6 text-ink-2">{r.verifies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-7 max-w-2xl text-base leading-7 text-ink-1">
            Be exact about the two dataset names in the repository title. Both appear in the tree,
            and neither is evidence of a training run. ArtBench appears as ten
            entries in the <span className="font-mono text-sm">DATABASES</span> list in
            scripts/knn2img.py, which is the upstream CompVis list of retrieval databases for
            retrieval-augmented diffusion. OpenImages appears in
            models/ldm/layout2img-openimages256/config.yaml, an upstream config whose data module is{" "}
            <span className="font-mono text-sm">ldm.data.openimages</span>, a file this tree does not
            contain: ldm/data/ holds base.py, imagenet.py, and lsun.py only. That config cannot load
            the dataset it names.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-1">
            The rule this page follows is the same one every unit in the gallery follows. A claim
            with an artifact ships with its regime attached. A claim without one ships here, in this
            panel, labelled as unverified, or it does not ship. If the logs and the eval output turn
            up, this unit gets rebuilt around them and this panel gets shorter. Until then the
            demonstration above stands on the only thing the repository can back: its configs and its
            code, both of which run in your browser a screen up.
          </p>
        </div>

        {/* go deeper */}
        <div className="mt-14 border-t border-rule">
          <h2 className="sr-only">Go deeper</h2>

          <Disclosure summary="The schedule, exactly as the repo computes it" defaultOpenDesktop>
            <p className="max-w-2xl text-lg leading-8 text-ink-1">
              Neither config sets <span className="font-mono text-base">beta_schedule</span>, so both
              take the <span className="font-mono text-base">&quot;linear&quot;</span> default from
              the <span className="font-mono text-base">DDPM.__init__</span> signature at
              ldm/models/diffusion/ddpm.py line 38. That name is misleading and worth flagging: the
              function it selects is linear in the square root of beta, not in beta.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`# ldm/modules/diffusionmodules/util.py:14
if schedule == "linear":
    betas = (
        torch.linspace(linear_start ** 0.5, linear_end ** 0.5,
                       n_timestep, dtype=torch.float64) ** 2
    )

# ldm/models/diffusion/ddpm.py:106  register_schedule
alphas          = 1. - betas
alphas_cumprod  = np.cumprod(alphas, axis=0)
sqrt_alphas_cumprod           = sqrt(alphas_cumprod)
sqrt_one_minus_alphas_cumprod = sqrt(1. - alphas_cumprod)
sqrt_recip_alphas_cumprod     = sqrt(1. / alphas_cumprod)
sqrt_recipm1_alphas_cumprod   = sqrt(1. / alphas_cumprod - 1)`}
            </pre>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
              Squaring a linear ramp puts most of the schedule&rsquo;s small betas early, so signal
              survives much longer than a plain linear ramp would let it. The sandbox above ports
              those seven lines to TypeScript, endpoint for endpoint, and the ported betas land on
              the config values exactly at both ends. The three preset chips differ only in those two
              endpoints, and they behave visibly differently: at t = 999 the txt2img schedule still
              holds a measurable trace of the signal, and cin256 has effectively none.
            </p>
          </Disclosure>

          <Disclosure summary="Why the reverse panel is handed the answer">
            <p className="max-w-2xl text-lg leading-8 text-ink-1">
              A reverse step needs two things: the noisy field, and an estimate of the noise inside
              it. The trained U-Net supplies the second one, and that is the only part of a diffusion
              model the weights are for. Everything around it is fixed arithmetic:
            </p>
            <pre className="mt-6 overflow-x-auto rounded-lg border border-rule bg-bg-2/50 p-6 font-mono text-xs leading-6 text-ink-1">
{`# ldm/models/diffusion/ddpm.py:195
def predict_start_from_noise(self, x_t, t, noise):
    return (sqrt_recip_alphas_cumprod[t]   * x_t -
            sqrt_recipm1_alphas_cumprod[t] * noise)`}
            </pre>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-1">
              There are no weights on this page, so the demo hands that step the noise it added
              itself. Read the right panel as the arithmetic, never as model output. The interesting
              part is the second coefficient. It is the error gain: whatever the predictor gets
              wrong, this step multiplies it by that number, and on the txt2img schedule it climbs
              from 0.57 at t = 200 to 14.6 at t = 999. That is why sampling walks back in many small
              steps instead of jumping. Late in the trajectory almost nothing is left of the signal,
              so a small mistake about the noise becomes a large mistake about the image. Switch the
              predictor to 5 percent off and drag t: the RMS error in the banner tracks the gain,
              because that is what the multiplication does.
            </p>
          </Disclosure>

          <Disclosure summary="Where this repository came from">
            <p className="max-w-2xl text-lg leading-8 text-ink-1">
              The source is the CompVis latent-diffusion tree. It was copied in rather than forked
              with history: the repository holds two commits, 1 minute and 59 seconds apart on 4
              December 2024. The first carries a LICENSE and a two-line README. The second adds all
              12,646 lines of the upstream tree in one move, under the title Saving Model Weights,
              and adds no weights.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-1">
              The lineage is not in doubt: environment.yaml pins{" "}
              <span className="font-mono text-sm">CompVis/taming-transformers</span> and{" "}
              <span className="font-mono text-sm">openai/CLIP</span> as editable installs, which is
              upstream&rsquo;s own dependency list, setup.py declares the package as{" "}
              <span className="font-mono text-sm">latent-diffusion 0.0.1</span>, and the eight images
              in assets/ are the upstream fire prompts. Credit for the architecture, the configs, and
              the code on this page belongs to the CompVis authors of the latent diffusion paper. The
              work in this unit is the reading of it.
            </p>
          </Disclosure>

          <Disclosure summary="What this demo does not do">
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-base leading-7 text-ink-1">
              <li>
                It runs no model. There are no weights on this page and no inference of any kind. The
                24x24 field is a toy pattern, not a latent produced by the autoencoder.
              </li>
              <li>
                It shows one reverse step, not a sampling loop. DDIM and PLMS chain hundreds of these
                with a guidance term; none of that is modeled here.
              </li>
              <li>
                The compression table is exact arithmetic on config values. It says nothing about
                reconstruction quality, which is what the KL and LPIPS terms in the autoencoder
                configs actually trade against.
              </li>
              <li>
                No generated images appear anywhere on this page. The eight in the repo&rsquo;s
                assets/ folder are upstream CompVis samples and are not this project&rsquo;s output.
              </li>
            </ul>
          </Disclosure>
        </div>

        {/* footer */}
        <div className="mt-14 flex flex-wrap gap-6 border-t border-rule pt-8">
          <a
            className="focus-ring rounded-sm font-mono text-sm text-ink-1 underline decoration-1 underline-offset-2 hover:text-accent"
            href={REPO}
          >
            source: github.com/ShreyPatel4/Latent-Diffusion-Artbench-OpenImage
          </a>
          <a
            className="focus-ring rounded-sm font-mono text-sm text-ink-1 underline decoration-1 underline-offset-2 hover:text-accent"
            href="https://github.com/CompVis/latent-diffusion"
          >
            upstream: github.com/CompVis/latent-diffusion
          </a>
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-sm text-accent"
            href="/projects/gallery"
          >
            <span aria-hidden="true">←</span> Back to the gallery
          </Link>
          <Link className="focus-ring rounded-sm font-mono text-sm text-ink-1 hover:text-accent" href="/projects">
            All projects
          </Link>
        </div>
      </div>
    </section>
  );
}
