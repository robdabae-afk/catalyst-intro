export interface ImageQualityResult {
  ok: boolean;
  issues: Array<"blurry" | "too_dark" | "too_bright">;
}

const ANALYSIS_SIZE = 320;

// Downscale onto an offscreen canvas so pixel analysis stays fast regardless of source resolution.
function getAnalysisContext(source: HTMLCanvasElement): { data: ImageData; width: number; height: number } {
  const scale = ANALYSIS_SIZE / Math.max(source.width, source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, width, height);

  return { data: ctx.getImageData(0, 0, width, height), width, height };
}

function toGrayscale(data: ImageData): Float32Array {
  const gray = new Float32Array(data.width * data.height);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data.data[o] + 0.587 * data.data[o + 1] + 0.114 * data.data[o + 2];
  }
  return gray;
}

// Laplacian-variance sharpness estimate: low variance in the second derivative means few sharp edges (blur/out of focus).
function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  const lap: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const value =
        -4 * gray[i] + gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width];
      lap.push(value);
    }
  }
  if (lap.length === 0) return 0;
  const mean = lap.reduce((a, b) => a + b, 0) / lap.length;
  const variance = lap.reduce((a, b) => a + (b - mean) ** 2, 0) / lap.length;
  return variance;
}

function averageBrightness(gray: Float32Array): number {
  return gray.reduce((a, b) => a + b, 0) / gray.length;
}

const BLUR_VARIANCE_THRESHOLD = 90;
const TOO_DARK_THRESHOLD = 55;
const TOO_BRIGHT_THRESHOLD = 225;

export function analyzeImageQuality(source: HTMLCanvasElement): ImageQualityResult {
  const { data, width, height } = getAnalysisContext(source);
  const gray = toGrayscale(data);

  const variance = laplacianVariance(gray, width, height);
  const brightness = averageBrightness(gray);

  const issues: ImageQualityResult["issues"] = [];
  if (variance < BLUR_VARIANCE_THRESHOLD) issues.push("blurry");
  if (brightness < TOO_DARK_THRESHOLD) issues.push("too_dark");
  if (brightness > TOO_BRIGHT_THRESHOLD) issues.push("too_bright");

  return { ok: issues.length === 0, issues };
}

export function issueMessage(issue: ImageQualityResult["issues"][number]): string {
  switch (issue) {
    case "blurry":
      return "This photo looks blurry or out of focus.";
    case "too_dark":
      return "This photo looks too dark.";
    case "too_bright":
      return "This photo looks too bright / overexposed.";
  }
}
