/* The noise schedule from Latent-Diffusion-Artbench-OpenImage, in TypeScript.
 *
 * Every constant below is transcribed from a file in that repo and carries the
 * file it came from. Nothing here is a result, a benchmark, or a trained model.
 * It is the arithmetic the repo's own code runs before any weights are loaded.
 *
 * Sources, all in github.com/ShreyPatel4/Latent-Diffusion-Artbench-OpenImage:
 *   ldm/modules/diffusionmodules/util.py:14  make_beta_schedule("linear")
 *     betas = linspace(start**0.5, end**0.5, n) ** 2
 *   ldm/models/diffusion/ddpm.py:38          beta_schedule="linear" default
 *   ldm/models/diffusion/ddpm.py:106         register_schedule, the buffers
 *   ldm/models/diffusion/ddpm.py:252         q_sample, the forward step
 *   ldm/models/diffusion/ddpm.py:195         predict_start_from_noise
 *   ldm/modules/diffusionmodules/model.py:344 class Encoder, downsample loop
 *
 * Determinism note: this module runs on the server (Node/V8) and again in the
 * browser (V8, SpiderMonkey, JavaScriptCore) and both renders must agree to the
 * last bit. So it uses only IEEE-754 exact operations: +, -, *, /, Math.sqrt,
 * Math.abs, Math.floor, Math.round, Math.imul. No sin, cos, exp, log, or **,
 * whose last-place results are implementation-defined. The pseudo-random field
 * is mulberry32 plus an Irwin-Hall sum, not Box-Muller, for the same reason.
 */

// ---------------------------------------------------------------------------
// 1. The schedules, transcribed from the repo's configs
// ---------------------------------------------------------------------------

export type ScheduleId = "txt2img" | "cin256" | "ddpm-default";

export type ScheduleSpec = {
  id: ScheduleId;
  /** Chip label in the sandbox. */
  label: string;
  /** The file in the repo these three numbers come from. */
  source: string;
  linear_start: number;
  linear_end: number;
  timesteps: number;
  /** What that config builds, in plain words. */
  builds: string;
};

export const SCHEDULES: readonly ScheduleSpec[] = [
  {
    id: "txt2img",
    label: "txt2img 1.4B",
    source: "configs/latent-diffusion/txt2img-1p4B-eval.yaml",
    linear_start: 0.00085,
    linear_end: 0.012,
    timesteps: 1000,
    builds: "text-conditioned model, 32x32x4 latents, BERTEmbedder conditioning",
  },
  {
    id: "cin256",
    label: "cin256-v2",
    source: "configs/latent-diffusion/cin256-v2.yaml",
    linear_start: 0.0015,
    linear_end: 0.0195,
    timesteps: 1000,
    builds: "class-conditioned model, 64x64x3 latents, ClassEmbedder conditioning",
  },
  {
    id: "ddpm-default",
    label: "DDPM default",
    source: "ldm/models/diffusion/ddpm.py:50",
    linear_start: 1e-4,
    linear_end: 2e-2,
    timesteps: 1000,
    builds: "the fallback when a config sets no endpoints",
  },
] as const;

export const scheduleById = (id: ScheduleId): ScheduleSpec =>
  SCHEDULES.find((s) => s.id === id) ?? SCHEDULES[0]!;

// ---------------------------------------------------------------------------
// 2. make_beta_schedule + register_schedule
// ---------------------------------------------------------------------------

/* util.py:14. Note what this is: linear in the SQUARE ROOT of beta, not in
   beta. torch.linspace includes both endpoints, so betas[0] === linear_start
   and betas[n-1] === linear_end exactly. */
export function makeBetaSchedule(linearStart: number, linearEnd: number, n: number): Float64Array {
  const a = Math.sqrt(linearStart);
  const b = Math.sqrt(linearEnd);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const s = a + ((b - a) * i) / (n - 1);
    out[i] = s * s;
  }
  return out;
}

export type Tables = {
  betas: Float64Array;
  alphasCumprod: Float64Array;
  sqrtAlphasCumprod: Float64Array;
  sqrtOneMinusAlphasCumprod: Float64Array;
  sqrtRecipAlphasCumprod: Float64Array;
  sqrtRecipm1AlphasCumprod: Float64Array;
};

/* ddpm.py:106 register_schedule, the five buffers the sampler actually reads. */
export function buildTables(spec: ScheduleSpec): Tables {
  const n = spec.timesteps;
  const betas = makeBetaSchedule(spec.linear_start, spec.linear_end, n);
  const alphasCumprod = new Float64Array(n);
  let running = 1;
  for (let i = 0; i < n; i++) {
    running *= 1 - betas[i]!;
    alphasCumprod[i] = running;
  }
  const sqrtAlphasCumprod = new Float64Array(n);
  const sqrtOneMinusAlphasCumprod = new Float64Array(n);
  const sqrtRecipAlphasCumprod = new Float64Array(n);
  const sqrtRecipm1AlphasCumprod = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const ab = alphasCumprod[i]!;
    sqrtAlphasCumprod[i] = Math.sqrt(ab);
    sqrtOneMinusAlphasCumprod[i] = Math.sqrt(1 - ab);
    sqrtRecipAlphasCumprod[i] = Math.sqrt(1 / ab);
    sqrtRecipm1AlphasCumprod[i] = Math.sqrt(1 / ab - 1);
  }
  return {
    betas,
    alphasCumprod,
    sqrtAlphasCumprod,
    sqrtOneMinusAlphasCumprod,
    sqrtRecipAlphasCumprod,
    sqrtRecipm1AlphasCumprod,
  };
}

const cache = new Map<ScheduleId, Tables>();
export function tablesFor(id: ScheduleId): Tables {
  let t = cache.get(id);
  if (!t) {
    t = buildTables(scheduleById(id));
    cache.set(id, t);
  }
  return t;
}

// ---------------------------------------------------------------------------
// 3. The toy 2D signal
// ---------------------------------------------------------------------------

/** Side of the toy field. Not an image, not a latent: a 2D scalar grid. */
export const GRID = 24;
export const CELLS = GRID * GRID;

/* Triangle wave, period 1, range [-1, 1]. floor and abs only, so exact. */
const tri = (x: number): number => 4 * Math.abs(x - Math.floor(x + 0.5)) - 1;
const clamp1 = (x: number): number => (x > 1 ? 1 : x < -1 ? -1 : x);

/* A fixed analytic pattern: concentric rings crossed by a diagonal band. It is
   recognisable at 24x24, which is the only requirement. Same values every run,
   every engine, every render. */
export function baseSignal(): Float64Array {
  const out = new Float64Array(CELLS);
  const c = (GRID - 1) / 2;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const v = (i - c) / c;
      const u = (j - c) / c;
      const r2 = u * u + v * v;
      out[i * GRID + j] = clamp1(0.74 * tri(r2 * 1.15) + 0.36 * tri((u + v) * 0.85 + 0.5));
    }
  }
  return out;
}

/* mulberry32: integer ops only. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Unit-variance field by Irwin-Hall: four uniforms sum to mean 2, variance
   1/3, so (sum - 2) * sqrt(3) has mean 0 and variance 1. Multiplication and
   one exact square root, nothing implementation-defined. */
export function gaussianField(seed: number): Float64Array {
  const rnd = mulberry32(seed);
  const k = Math.sqrt(3);
  const out = new Float64Array(CELLS);
  for (let i = 0; i < CELLS; i++) {
    out[i] = (rnd() + rnd() + rnd() + rnd() - 2) * k;
  }
  return out;
}

/** The epsilon actually mixed into the signal. One fixed seed, so the whole
 *  page is the same run for every visitor. */
export const EPS_SEED = 20241204;
/** Independent field used to perturb the predictor's guess. */
export const ERR_SEED = 90210;

// ---------------------------------------------------------------------------
// 4. q_sample and predict_start_from_noise
// ---------------------------------------------------------------------------

/* ddpm.py:252. x_t = sqrt(abar_t) * x_0 + sqrt(1 - abar_t) * eps */
export function qSample(x0: Float64Array, eps: Float64Array, t: number, tb: Tables): Float64Array {
  const a = tb.sqrtAlphasCumprod[t]!;
  const b = tb.sqrtOneMinusAlphasCumprod[t]!;
  const out = new Float64Array(x0.length);
  for (let i = 0; i < x0.length; i++) out[i] = a * x0[i]! + b * eps[i]!;
  return out;
}

/* ddpm.py:195. x0_hat = sqrt(1/abar_t) * x_t - sqrt(1/abar_t - 1) * eps_hat.
   This is the whole reverse step. A trained UNet's only job is producing
   eps_hat from x_t; the arithmetic around it is fixed by the schedule. */
export function predictStartFromNoise(
  xt: Float64Array,
  epsHat: Float64Array,
  t: number,
  tb: Tables,
): Float64Array {
  const a = tb.sqrtRecipAlphasCumprod[t]!;
  const b = tb.sqrtRecipm1AlphasCumprod[t]!;
  const out = new Float64Array(xt.length);
  for (let i = 0; i < xt.length; i++) out[i] = a * xt[i]! - b * epsHat[i]!;
  return out;
}

/** An imperfect predictor: the true eps plus an independent field scaled to
 *  errorPct. errorPct 0 hands the reverse step the exact answer. */
export function predictorEps(eps: Float64Array, errorPct: number): Float64Array {
  if (errorPct === 0) return eps;
  const err = gaussianField(ERR_SEED);
  const k = errorPct / 100;
  const out = new Float64Array(eps.length);
  for (let i = 0; i < eps.length; i++) out[i] = eps[i]! + k * err[i]!;
  return out;
}

// ---------------------------------------------------------------------------
// 5. One frame of the sandbox
// ---------------------------------------------------------------------------

export type Frame = {
  t: number;
  /** alphas_cumprod[t]: how much of the signal's variance survives. */
  alphaBar: number;
  /** sqrt(alphas_cumprod[t]) as a percentage: the signal's surviving amplitude. */
  signalPct: number;
  /** sqrt(1 - alphas_cumprod[t]) as a percentage: the noise's amplitude. */
  noisePct: number;
  /** beta at this step, straight off the schedule. */
  beta: number;
  /** sqrt(1/abar_t - 1): what the reverse step multiplies a predictor error by. */
  errorGain: number;
  /** RMS distance between the recovered field and the original. */
  reconRms: number;
  /** Per-cell fill opacities, rounded so SSR and hydration agree exactly. */
  noisedCells: number[];
  recoveredCells: number[];
};

const opacity = (v: number): number => {
  const o = (clamp1(v) + 1) / 2;
  return Math.round(o * 1000) / 1000;
};

const round = (v: number, dp: number): number => {
  const k = dp === 1 ? 10 : dp === 2 ? 100 : dp === 3 ? 1000 : 10000;
  return Math.round(v * k) / k;
};

/** The full sandbox state at one (schedule, t, predictor error). Pure. */
export function frame(id: ScheduleId, t: number, errorPct: number): Frame {
  const tb = tablesFor(id);
  const x0 = baseSignal();
  const eps = gaussianField(EPS_SEED);
  const xt = qSample(x0, eps, t, tb);
  const recovered = predictStartFromNoise(xt, predictorEps(eps, errorPct), t, tb);

  let sq = 0;
  for (let i = 0; i < CELLS; i++) {
    const d = recovered[i]! - x0[i]!;
    sq += d * d;
  }

  return {
    t,
    alphaBar: round(tb.alphasCumprod[t]!, 4),
    signalPct: round(tb.sqrtAlphasCumprod[t]! * 100, 1),
    noisePct: round(tb.sqrtOneMinusAlphasCumprod[t]! * 100, 1),
    beta: tb.betas[t]!,
    errorGain: round(tb.sqrtRecipm1AlphasCumprod[t]!, 1),
    reconRms: round(Math.sqrt(sq / CELLS), 3),
    noisedCells: Array.from(xt, opacity),
    recoveredCells: Array.from(recovered, opacity),
  };
}

/** The original field, for the "t = 0" reference strip. */
export function baseCells(): number[] {
  return Array.from(baseSignal(), opacity);
}

// ---------------------------------------------------------------------------
// 5b. The forward trajectory, as a replayable log
// ---------------------------------------------------------------------------

export type TrajectoryStep = {
  t: number;
  alphaBar: number;
  signalPct: number;
  noisePct: number;
  /** True once noise amplitude exceeds signal amplitude, i.e. abar < 0.5. */
  noiseDominant: boolean;
};

export const TRAJECTORY_STRIDE = 25;

/** Every STRIDE-th step of the same schedule the panels use, plus the last
 *  step. Nothing here is generated for the animation: each line is a lookup
 *  into the tables register_schedule builds. */
export function trajectory(id: ScheduleId, stride: number = TRAJECTORY_STRIDE): TrajectoryStep[] {
  const tb = tablesFor(id);
  const n = tb.alphasCumprod.length;
  const out: TrajectoryStep[] = [];
  for (let t = 0; t < n; t += stride) {
    out.push(step(tb, t));
  }
  if (out[out.length - 1]!.t !== n - 1) out.push(step(tb, n - 1));
  return out;
}

function step(tb: Tables, t: number): TrajectoryStep {
  const ab = tb.alphasCumprod[t]!;
  return {
    t,
    alphaBar: round(ab, 4),
    signalPct: round(tb.sqrtAlphasCumprod[t]! * 100, 1),
    noisePct: round(tb.sqrtOneMinusAlphasCumprod[t]! * 100, 1),
    noiseDominant: ab < 0.5,
  };
}

// ---------------------------------------------------------------------------
// 6. The compression arithmetic
// ---------------------------------------------------------------------------

export type AutoencoderSpec = {
  /** Config file in the repo. */
  file: string;
  /** ddconfig.ch_mult */
  chMult: readonly number[];
  /** embed_dim, the latent channel count */
  embedDim: number;
  /** ddconfig.resolution, the size the config is named for */
  resolution: number;
};

/* All four KL autoencoder configs in the repo, verbatim. */
export const AUTOENCODERS: readonly AutoencoderSpec[] = [
  { file: "configs/autoencoder/autoencoder_kl_64x64x3.yaml", chMult: [1, 2, 4], embedDim: 3, resolution: 256 },
  { file: "configs/autoencoder/autoencoder_kl_32x32x4.yaml", chMult: [1, 2, 4, 4], embedDim: 4, resolution: 256 },
  { file: "configs/autoencoder/autoencoder_kl_16x16x16.yaml", chMult: [1, 1, 2, 2, 4], embedDim: 16, resolution: 256 },
  { file: "configs/autoencoder/autoencoder_kl_8x8x64.yaml", chMult: [1, 1, 2, 2, 4, 4], embedDim: 64, resolution: 256 },
] as const;

/* model.py:344, class Encoder. The loop runs once per entry in ch_mult and
   attaches a Downsample at every level EXCEPT the last, halving curr_res each
   time. So the spatial factor is 2 ** (len(ch_mult) - 1). */
export const downsampleFactor = (chMult: readonly number[]): number => 1 << (chMult.length - 1);

export type LatentRow = {
  file: string;
  /** Short name, from the config filename. */
  name: string;
  /** ddconfig.ch_mult, verbatim, rendered as the config writes it. */
  chMult: string;
  f: number;
  embedDim: number;
  /** resolution / f, which is what the config filename claims. */
  configLatentSide: number;
  /** The filename's own claim, e.g. "32x32x4". Equal to configLatentSide when the derivation holds. */
  filenameClaim: string;
  /** Latent side for the input the page shows. */
  latentSide: number;
  /** Numbers the UNet denoises for that input. */
  latentValues: number;
  /** Numbers in the input image itself. */
  pixelValues: number;
  /** pixelValues / latentValues. */
  ratio: number;
};

const basename = (p: string): string => p.slice(p.lastIndexOf("/") + 1).replace(".yaml", "");

/** The arithmetic, computed from ch_mult and embed_dim. Nothing typed by hand. */
export function latentRows(side = 512, channels = 3): LatentRow[] {
  return AUTOENCODERS.map((a) => {
    const f = downsampleFactor(a.chMult);
    const configSide = a.resolution / f;
    const latentSide = side / f;
    const latentValues = latentSide * latentSide * a.embedDim;
    const pixelValues = side * side * channels;
    return {
      file: a.file,
      name: basename(a.file),
      chMult: `[${a.chMult.join(",")}]`,
      f,
      embedDim: a.embedDim,
      configLatentSide: configSide,
      filenameClaim: `${configSide}x${configSide}x${a.embedDim}`,
      latentSide,
      latentValues,
      pixelValues,
      ratio: round(pixelValues / latentValues, 1),
    };
  });
}

/** The row the page leads with: the autoencoder txt2img-1p4B-eval.yaml wires. */
export const HEADLINE_AE = "configs/autoencoder/autoencoder_kl_32x32x4.yaml";
