<template>
    <div :style="{
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        height: '100vh',
        minHeight: '420px',
        overflow: 'hidden',
        touchAction: 'pan-y',
        background: background ?? '#111111',
        color: '#ffffff',
        ...style
    }" tabindex="0" role="region" aria-roledescription="carousel" :aria-labelledby="labelId" @keydown="onKeyDown">
        <p :id="labelId" style="display: none;">Liquid glass project carousel</p>
        <p :id="liveId" style="display: none;" aria-live="polite">
            {{ currentItem?.title ?? "" }}, {{ pad(active + 1) }} of {{ pad(items.length) }}
            {{ focused ? ", focused" : "" }}
        </p>
        <ShaderCanvas v-if="!failed" preset="fluted" />
        <!-- WebGL Canvas or Fallback -->
        <div v-if="failed"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #111111; color: #ffffff;">
            This carousel needs WebGL, which is unavailable in this browser.
        </div>
        <div v-else ref="mountRef" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>

        <p ref="titleRef"
            style="pointer-events: none; position: absolute; left: 50%; top: 4.5%; z-index: 10; margin: 0; text-align: center; font-size: 15px; font-weight: 500; color: #ffffff; opacity: 0; will-change: transform, opacity;">
            {{ currentItem?.title }}
        </p>
        <p ref="counterRef"
            style="pointer-events: none; position: absolute; left: 50%; bottom: 6%; z-index: 10; margin: 0; text-align: center; font-size: 13px; font-weight: 500; color: #ffffff; opacity: 0; will-change: transform, opacity;">
            {{ pad(active + 1) }}/{{ pad(items.length) }}
        </p>

        <div ref="cursorRef"
            style="pointer-events: none; position: absolute; left: 0; top: 0; z-index: 20; font-size: 13px; font-weight: 500; color: #ffffff; will-change: transform, opacity;">
            View
        </div>

        <button type="button" @click="closeFocus" aria-label="Close focused project"
            style="position: absolute; right: 4%; top: 4.5%; z-index: 20; font-size: 13px; font-weight: 500; color: #ffffff; transition: opacity 0.3s; will-change: opacity;"
            :style="{
                opacity: focused ? 1 : 0,
                pointerEvents: focused ? 'auto' : 'none',
            }">
            Close
        </button>
    </div>
</template>

<script lang="ts">
import type { CSSProperties } from "vue";
// ⚡ OPTIMIZED: Flutedglassbackground.vue merged into the shared ShaderCanvas.vue
import ShaderCanvas from "@/components/ShaderCanvas.vue";

export interface LiquidGlassCarouselItem {
    src: string;
    title: string;
    aspect?: number;
}

export interface LiquidGlassCarouselProps {
    items?: LiquidGlassCarouselItem[];
    panelHeight?: number;
    gap?: number;
    background?: string;
    backgroundImage?: string;
    entry?: boolean;
    className?: string;
    style?: CSSProperties;
}

const PORTRAIT_ASPECT = 3 / 4;
const photo = (id: string) =>
    `https://images.unsplash.com/photo-${id}?w=900&h=1200&q=85&auto=format&fit=crop`;

export const liquidGlassCarouselDefaultItems: LiquidGlassCarouselItem[] = [
    { title: "Project One", src: photo("1600585154340-be6161a56a0c"), aspect: PORTRAIT_ASPECT },
    { title: "Project Two", src: photo("1514906689926-25ba6dcb584b"), aspect: PORTRAIT_ASPECT },
    { title: "Project Three", src: photo("1568557412756-7d219873dd11"), aspect: PORTRAIT_ASPECT },
    { title: "Project Four", src: photo("1581892805885-73bdd91beff0"), aspect: PORTRAIT_ASPECT },
    { title: "Project Five", src: photo("1482938289607-e9573fc25ebb"), aspect: PORTRAIT_ASPECT },
    { title: "Project Six", src: photo("1610846202780-b4d9837371ea"), aspect: PORTRAIT_ASPECT },
    { title: "Project Seven", src: photo("1527630941-4a229fd674ab"), aspect: PORTRAIT_ASPECT },
    { title: "Project Eight", src: photo("1603786420263-ad59136a7409"), aspect: PORTRAIT_ASPECT },
];
</script>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, useId } from "vue";
import { gsap } from "gsap";
import * as THREE from "three";

const props = withDefaults(defineProps<LiquidGlassCarouselProps>(), {
    items: () => liquidGlassCarouselDefaultItems,
    panelHeight: 450,
    gap: 12,
    background: "#111111",
    backgroundImage: "",
    entry: true,
    className: "",
    style: () => ({}),
});

const emit = defineEmits<{
    (e: "activeChange", index: number): void;
    (e: "focusChange", focused: boolean): void;
}>();

const LENS = {
    sizeX: 0.565, sizeY: 1, posX: 0.5, posY: 0.5, rotation: 65, spin: 0, zoom: 0, dispersion: 11,
    blur: 0, glow: 4.2, whiteGlow: 0.24, novaSize: 12, blueRing: 6, ringRadius: 0.49, ringWidth: 0.014,
    shimmer: true, shimmerFreq: 12, shimmerSpeed: 3.5, shimmerDepth: 0.12, rimStart: 0.578,
    rimTangential: 0.6, rimInward: 0, rimFreq1: 2, rimFreq2: 1, blueColor: "#009dff", rimLine: 1.4,
    rimLinePos: 0.488, rimLineWidth: 0.003, vignette: 0, vignetteSize: 0.3, samples: 8,
};

const FOCUS = {
    cardDuration: 0.7, focusDuration: 0.9, cardEase: "power4.out", focusEase: "power3.out", stagger: 0.06,
    dropDist: 1.4, centerScale: 1.18, lensFade: 0.85,
};

const ENTRY = {
    delay: 0.5, startH: 80, riseDuration: 1.0, stagger: 0.07, riseEase: "power3.out", fromBelow: 0.9,
    growDelay: 0.25, growDuration: 2.15, growEase: "expo.inOut", growStagger: 0.085, lensBloom: 1.4, lensBloomEase: "power2.inOut",
};

const MAX_SAMPLES = 16;

function buildCaKernel(sampleCount: number): THREE.Vector4[] {
    const N = Math.max(2, Math.min(MAX_SAMPLES, sampleCount));
    const raw: { x: number; y: number; z: number; offset: number }[] = [];
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const dx = (t - 0.0) / 0.38;
        const dy = (t - 0.5) / 0.38;
        const dz = (t - 1.0) / 0.38;
        const wx = Math.exp(-(dx * dx));
        const wy = Math.exp(-(dy * dy));
        const wz = Math.exp(-(dz * dz));
        sumX += wx;
        sumY += wy;
        sumZ += wz;
        raw.push({ x: wx, y: wy, z: wz, offset: t - 0.5 });
    }

    const invX = 1 / Math.max(sumX, 0.001);
    const invY = 1 / Math.max(sumY, 0.001);
    const invZ = 1 / Math.max(sumZ, 0.001);

    const out: THREE.Vector4[] = [];
    for (let i = 0; i < MAX_SAMPLES; i++) {
        if (i < N) {
            const r = raw[i]!;
            out.push(new THREE.Vector4(r.x * invX, r.y * invY, r.z * invZ, r.offset));
        } else {
            out.push(new THREE.Vector4(0, 0, 0, 0));
        }
    }
    return out;
}

const LENS_VERTEX = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const LENS_FRAGMENT = /* glsl */ `
#define PI 3.14159265
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uSizeX;
uniform float uSizeY;
uniform float uAspect;
uniform float uZoom;
uniform float uDispersion;
uniform float uBlur;
uniform float uGlow;
uniform float uWhiteGlow;
uniform float uNovaSize;
uniform float uBlueRing;
uniform float uRingRadius;
uniform float uRingWidth;
uniform float uShimmer;
uniform float uShimmerFreq;
uniform float uShimmerSpeed;
uniform float uShimmerDepth;
uniform float uTime;
uniform float uRimStart;
uniform float uRimTangential;
uniform float uRimInward;
uniform float uRimFreq1;
uniform float uRimFreq2;
uniform vec3 uBlueColor;
uniform float uRimLine;
uniform float uRimLinePos;
uniform float uRimLineWidth;
uniform float uVignette;
uniform float uVignetteSize;
uniform float uShape;
uniform float uSquareRound;
uniform vec2 uRotCS;
uniform int uSamples;
uniform vec4 uCaKernel[16];

const int MAX_SAMPLES = 16;

float sq(float x) { return x * x; }

float sdRoundBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec4 discLens(vec2 center, float aspectCorrect, out float outA) {
  vec2 p = (vUv - center);
  p.x *= aspectCorrect;
  p = mat2(uRotCS.x, -uRotCS.y, uRotCS.y, uRotCS.x) * p;
  vec2 halfSize = vec2(uSizeX, uSizeY);
  float dist = length(p / halfSize);
  outA = 0.0;

  float maskND;
  if (uShape > 0.5) {
    float minS = min(uSizeX, uSizeY);
    float corner = minS * clamp(uSquareRound, 0.0, 1.0);
    float sd = sdRoundBox(p, halfSize, corner);
    maskND = 1.0 + sd / minS;
  } else {
    maskND = dist;
  }
  if (maskND > 1.0) return vec4(0.0);

  float shapeND = clamp(maskND, 0.0, 1.0);
  float nd = clamp(dist, 0.0, 1.0);
  vec2 offset = vUv - center;
  vec2 radialDir = normalize(offset + 1e-6);
  vec2 tangentDir = vec2(-radialDir.y, radialDir.x);

  float pull = uZoom * 0.30 * (nd * nd);
  float rimStrength = smoothstep(uRimStart, 1.0, nd);

  float angle = 0.0;
  bool hasAngle = false;
  vec2 rimOff = vec2(0.0);
  vec2 rimPull = vec2(0.0);

  if (rimStrength > 0.0) {
    angle = atan(p.y, p.x);
    hasAngle = true;
    float fluidWave = sin(angle * uRimFreq1) * 0.55 + sin(angle * uRimFreq2) * 0.25;
    float rScreen = (uSizeX + uSizeY) * 0.5 * rimStrength;
    rimOff = tangentDir * (fluidWave * rScreen * uRimTangential);
    rimPull = -radialDir * (rScreen * uRimInward);
  }

  vec2 baseUV = center + offset * (1.0 - pull) + rimOff + rimPull;

  float rimMask = smoothstep(0.55, 1.0, nd);
  float dispFactor = uDispersion * 0.004 * rimMask;
  vec4 col;

  if (dispFactor <= 1e-5) {
    col = texture2D(uTex, baseUV);
  } else {
    vec2 dispDir = offset * dispFactor;
    int N = uSamples;
    col = vec4(0.0);
    for (int i = 0; i < MAX_SAMPLES; i++) {
      if (i >= N) break;
      vec4 k = uCaKernel[i];
      vec4 s = texture2D(uTex, baseUV + dispDir * k.w);
      col.rgb += s.rgb * k.xyz;
      col.a += s.a * k.y;
    }
  }

  float blurFade = 1.0 - smoothstep(0.72, 0.98, nd);
  if (uBlur > 0.01 && blurFade > 0.01) {
    vec2 blurRad = vec2(uBlur) / uRes * blurFade;
    vec4 bcol = vec4(0.0);
    float btw = 0.0;
    for (float a = 0.0; a < PI * 2.0; a += PI * 2.0 / 6.0) {
      vec2 dir = vec2(cos(a), sin(a)) * blurRad;
      for (float rr = 0.4; rr <= 1.001; rr += 0.3) {
        float w = 1.0 - rr * 0.38;
        bcol += texture2D(uTex, baseUV + dir * rr) * w;
        btw += w;
      }
    }
    col = mix(bcol / btw, col, rimMask);
  }

  col.rgb *= mix(0.91, 1.0, smoothstep(0.0, 0.38, shapeND));

  float alphaMask = clamp(col.a * 1.5, 0.0, 1.0);

  if (alphaMask > 0.0001) {
    float r2 = shapeND * shapeND * 0.25;
    float gs = max(uNovaSize * uGlow * 0.003, 0.004);
    float glowScale = uGlow * (1.0 / 17.0);
    float nova = (exp(-r2 / gs) + exp(-r2 / (gs * 7.0)) * 0.18) * (uWhiteGlow * glowScale * 1.15);
    col.rgb += vec3(nova * alphaMask);

    float dC = shapeND * 0.5;
    if (uBlueRing > 0.0001) {
      float tR = clamp(uRingRadius, 0.1, 0.49);
      float rW = max(uRingWidth, 0.003);
      float diffR = dC - tR;
      float ring = exp(-sq(diffR / rW)) * (uBlueRing * glowScale * 1.8);
      if (uShimmer > 0.5) {
        if (!hasAngle) angle = atan(p.y, p.x);
        ring *= sin(angle * uShimmerFreq + uTime * uShimmerSpeed) * uShimmerDepth + (1.0 - uShimmerDepth);
      }
      float ringAura = exp(-sq(diffR / (rW * 6.0))) * (0.28 * uBlueRing * glowScale);
      col.rgb += uBlueColor * ((ring + ringAura) * alphaMask);
    }

    if (uRimLine > 0.0001) {
      float rimVal = exp(-sq((dC - uRimLinePos) / max(uRimLineWidth, 0.0001))) * uRimLine;
      col.rgb += vec3(rimVal * alphaMask);
    }
  }

  outA = 1.0 - smoothstep(0.93, 1.0, maskND);
  return col;
}

void main(){
  float a = 0.0;
  vec4 outc = discLens(uCenter, uAspect, a);
  outc.a *= a;
  
  if (uVignette > 0.001) {
    vec2 vc = vUv - 0.5;
    vc.x *= uAspect;
    float d = length(vc) / max(uVignetteSize, 0.0001);
    float vig = 1.0 - uVignette * smoothstep(0.5, 1.0, d);
    outc.rgb *= clamp(vig, 0.0, 1.0);
  }
  
  gl_FragColor = outc; 
}
`;

const LENS_FX_KEYS = [
    "uDispersion", "uBlueRing", "uRimLine", "uVignette", "uZoom", "uRimTangential", "uRimInward",
] as const;

const REPEATS = 4;
const CLICK_SLOP = 6;
const TOUCH_CLICK_SLOP = 12;
const FLICK_IDLE_MS = 90;
const DEG2RAD = Math.PI / 180;

function at<T>(list: readonly T[], index: number): T {
    const item = list[index];
    if (item === undefined) throw new Error("Index out of range.");
    return item;
}

type PanelRect = { left: number; right: number; top: number; bottom: number; poolIdx: number; srcIndex: number; centerX: number; };
type PoolItem = { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; srcIndex: number; bound: boolean; };
type Source = { tex: THREE.Texture | null; aspect: number; locked: boolean; };

type LiquidGlassCarouselHandle = {
    closeFocus: () => void;
    next: () => void;
    previous: () => void;
    destroy: () => void;
};

function prefersReducedMotion() {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pad(value: number) {
    return String(value).padStart(2, "0");
}

const mountRef = shallowRef<HTMLDivElement | null>(null);
const cursorRef = shallowRef<HTMLDivElement | null>(null);
const titleRef = shallowRef<HTMLParagraphElement | null>(null);
const counterRef = shallowRef<HTMLParagraphElement | null>(null);

const engineRef = shallowRef<LiquidGlassCarouselHandle | null>(null);
const active = ref(0);
const focused = ref(false);
const entryDone = ref(!props.entry);
const failed = ref(false);
const revealPlayed = ref(false);

const labelId = useId();
const liveId = useId();

const currentItem = computed(() => props.items[active.value] ?? props.items[0]);

const closeFocus = () => {
    engineRef.value?.closeFocus();
};

const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
        event.preventDefault();
        engineRef.value?.next();
    } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        engineRef.value?.previous();
    } else if (event.key === "Escape") {
        event.preventDefault();
        engineRef.value?.closeFocus();
    }
};

let cancelled = false;
onMounted(() => requestAnimationFrame(() => {
    if (cancelled) return;
    const mount = mountRef.value;
    if (!mount || props.items.length === 0) return;

    const engine = createCarousel(mount, cursorRef.value, {
        items: props.items,
        panelHeight: props.panelHeight,
        gap: props.gap,
        background: props.background,
        backgroundImage: props.backgroundImage,
        entry: props.entry,
        onActiveChange: (index) => {
            active.value = index;
            emit("activeChange", index);
        },
        onFocusChange: (open) => {
            focused.value = open;
            emit("focusChange", open);
        },
        onEntryDone: (done) => {
            entryDone.value = done;
        },
    });

    if (!engine) {
        failed.value = true;
        return;
    }

    engineRef.value = engine;
}));

onBeforeUnmount(() => {
    cancelled = true;
    if (engineRef.value) {
        engineRef.value.destroy();
        engineRef.value = null;
    }
});

watch([focused, entryDone, () => props.entry], () => {
    const title = titleRef.value;
    const counter = counterRef.value;
    if (!title || !counter) return;

    const reduced = prefersReducedMotion();
    gsap.set(title, { xPercent: -50 });
    gsap.set(counter, { xPercent: -50 });

    if (!entryDone.value && props.entry && !reduced) {
        gsap.set([title, counter], { autoAlpha: 0 });
        revealPlayed.value = false;
        return;
    }

    const y = focused.value ? window.innerHeight * -0.05 : 0;

    if (entryDone.value && !focused.value && !revealPlayed.value) {
        revealPlayed.value = true;
        gsap.fromTo(title, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0 : 1.6, ease: "power2.out" });
        gsap.fromTo(
            counter,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: reduced ? 0 : 1.6, ease: "power2.out", delay: reduced ? 0 : 0.18 }
        );
        return;
    }

    gsap.to(title, { y, autoAlpha: 1, duration: reduced ? 0 : 0.4, ease: "power3.out" });
    gsap.to(counter, { autoAlpha: focused.value ? 0 : 1, duration: reduced ? 0 : 0.4, ease: "power3.out" });
});

function createCarousel(
    mount: HTMLElement,
    cursorElement: HTMLElement | null,
    options: {
        items: LiquidGlassCarouselItem[];
        panelHeight: number;
        gap: number;
        background: string;
        backgroundImage: string;
        entry: boolean;
        onActiveChange: (index: number) => void;
        onFocusChange: (open: boolean) => void;
        onEntryDone: (done: boolean) => void;
    }
): LiquidGlassCarouselHandle | null {
    const reduced = prefersReducedMotion();
    const entryOn = options.entry && !reduced;
    const items = options.items;
    const N_SOURCES = items.length;
    if (N_SOURCES === 0) return null;

    let running = true;
    let booted = false;
    let raf = 0;
    let inView = true;
    let sceneDirty = true;
    let userInteracted = false;
    const abortCtrl = new AbortController();

    let W = Math.max(1, mount.clientWidth);
    let H = Math.max(1, mount.clientHeight);
    const panelHFor = () => {
        const mobileWidthLimit = (W * 0.68) / PORTRAIT_ASPECT;
        return Math.max(120, Math.min(options.panelHeight, Math.round(H * 0.52), mobileWidthLimit));
    };
    let PANEL_H = panelHFor();
    const GAP = options.gap;
    const EASE = reduced ? 0.28 : 0.09;
    const SNAP_EASE = reduced ? 0.22 : 0.05;
    const WHEEL = 1.4;
    const DRAG = 1.6;
    const TOUCH_DRAG = 1;
    const TOUCH_EASE = 0.22;
    const FRICTION = 0.865;
    const SNAP_IDLE_MS = 120;
    const SHRINK_MAX = 60;
    const SHRINK_ATTACK = 0.25;
    const SHRINK_DECAY = 0.06;

    // ⚡ OPTIMIZED: when nothing moves, the lens shimmer is the only thing animating. It used to re-render the whole
    // scene + lens shader at the full 60fps forever; the shimmer is slow, so 30fps looks identical at half the GPU cost.
    const IDLE_FRAME_MS = 1000 / 30;
    let idleShimmerOnly = false;
    let lastRenderAt = 0;

    // ⚡ OPTIMIZED: resolution governor. If real frames keep taking >30ms, step the render resolution down.
    let slowTicks = 0;
    let govCooldown = 0;
    let lastTickAt = 0;

    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
        });
    } catch {
        return null;
    }

    // ⚡ OPTIMIZED: pixel-ratio cap is no longer fixed. A small governor (see `governor()` below) lowers it on
    // machines that can't keep up, so slow GPUs get a slightly softer picture instead of a laggy one.
    let qualityCap = 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, qualityCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const el = renderer.domElement;
    el.style.display = "block";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.userSelect = "none";
    el.setAttribute("aria-hidden", "true");
    mount.appendChild(el);

    let rectLeft = 0;
    let rectTop = 0;
    let mostlyVisible = true;
    function updateCachedRect() {
        const r = el.getBoundingClientRect();
        rectLeft = r.left;
        rectTop = r.top;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visibleHeight = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        mostlyVisible = r.height > 0 && (visibleHeight / r.height) >= 0.75;
    }
    updateCachedRect();

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -100, 100);
    camera.position.z = 10;

    const loader = new THREE.TextureLoader();
    const targetH = Math.min(1400, Math.round(options.panelHeight * FOCUS.centerScale * dpr));

    const sources: Source[] = items.map((img) => ({
        tex: null,
        aspect: img.aspect || PORTRAIT_ASPECT,
        locked: img.aspect != null,
    }));

    function slotWidth(srcIndex: number) {
        return at(sources, srcIndex).aspect * PANEL_H + GAP;
    }

    const offsets = new Float64Array(N_SOURCES);
    let totalWidth = 0;
    function recomputeTotal() {
        let acc = 0;
        for (let i = 0; i < N_SOURCES; i++) {
            offsets[i] = acc;
            acc += slotWidth(i);
        }
        totalWidth = acc;
    }
    recomputeTotal();

    function centerForIndex(idx: number) {
        const loop = Math.floor(idx / N_SOURCES);
        const s = ((idx % N_SOURCES) + N_SOURCES) % N_SOURCES;
        return offsets[s]! + slotWidth(s) / 2 - GAP / 2 + loop * totalWidth;
    }

    function nearestIndex(value: number) {
        if (!totalWidth) return 0;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < N_SOURCES; i++) {
            const center = offsets[i]! + slotWidth(i) / 2 - GAP / 2;
            const k = Math.round((value - center) / totalWidth);
            const dist = Math.abs(center + k * totalWidth - value);
            if (dist < bestDist) {
                bestDist = dist;
                best = i + k * N_SOURCES;
            }
        }
        return best;
    }

    function centerIndex(value: number) {
        if (!totalWidth) return 0;
        let bestI = 0;
        let bestDist = Infinity;
        for (let i = 0; i < N_SOURCES; i++) {
            const center = offsets[i]! + slotWidth(i) / 2 - GAP / 2;
            const k = Math.round((value - center) / totalWidth);
            const dist = Math.abs(center + k * totalWidth - value);
            if (dist < bestDist) {
                bestDist = dist;
                bestI = i;
            }
        }
        return bestI;
    }

    let scroll = centerForIndex(0);
    let target = scroll;
    let velocity = 0;
    let prevScroll = scroll;
    let scrollEnergy = 0;
    let pendingFocus: { srcIndex: number } | null = null;
    let lastInput = performance.now();
    let snapped = false;

    function finishTexture(s: Source, tex: THREE.Texture, w: number, h: number) {
        if (!running) {
            (tex.image as ImageBitmap | undefined)?.close?.();
            tex.dispose();
            return;
        }
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        if (!s.locked) s.aspect = w / h;
        s.tex = tex;
        renderer.initTexture(tex);
        recomputeTotal();
        if (!userInteracted) {
            scroll = centerForIndex(0);
            target = scroll;
        }
        sceneDirty = true;
        if (booted) startLoop();
    }

    async function loadTexture(s: Source, img: LiquidGlassCarouselItem) {
        if (!running) return;
        const url = typeof img.src === "string" ? img.src : (img.src as any)?.default || img.src;
        try {
            if (typeof createImageBitmap === "function") {
                const res = await fetch(url, { mode: "cors", signal: abortCtrl.signal });
                if (!res.ok) throw new Error(String(res.status));
                const blob = await res.blob();
                if (!running) return;
                const bmp = await createImageBitmap(blob, {
                    resizeHeight: targetH,
                    resizeQuality: "medium",
                    imageOrientation: "flipY",
                });
                if (!running) {
                    bmp.close();
                    return;
                }
                const tex = new THREE.Texture(bmp);
                tex.flipY = false;
                finishTexture(s, tex, bmp.width, bmp.height);
                return;
            }
        } catch (err: any) {
            if (err?.name === "AbortError" || !running) return;
        }
        if (!running) return;
        await new Promise<void>((resolve) => {
            loader.load(
                url,
                (tex) => {
                    finishTexture(s, tex, tex.image.width, tex.image.height);
                    resolve();
                },
                undefined,
                (err) => {
                    console.error("Failed to load image:", url, err);
                    resolve();
                }
            );
        });
    }

    const priorityIndices = new Set<number>();
    const halfSpan = Math.min(4, Math.ceil(N_SOURCES / 2));
    for (let d = 0; d <= halfSpan; d++) {
        priorityIndices.add(d % N_SOURCES);
        priorityIndices.add(((N_SOURCES - d) % N_SOURCES + N_SOURCES) % N_SOURCES);
    }

    const priorityLoads: Promise<void>[] = [];
    const loadByIndex = new Map<number, Promise<void>>();
    const deferredIndices: number[] = [];
    for (let i = 0; i < N_SOURCES; i++) {
        if (priorityIndices.has(i)) {
            const p = loadTexture(at(sources, i), at(items, i));
            priorityLoads.push(p);
            loadByIndex.set(i, p);
        } else {
            deferredIndices.push(i);
        }
    }

    async function loadDeferredQueue() {
        const CONCURRENCY = 3;
        let cursor = 0;
        const workers = Array.from({ length: Math.min(CONCURRENCY, deferredIndices.length) }, async () => {
            while (running && cursor < deferredIndices.length) {
                const idx = deferredIndices[cursor++]!;
                await loadTexture(at(sources, idx), at(items, idx));
            }
        });
        await Promise.all(workers);
    }

    // wait only for the cards on screen at start (centre + its two neighbours), up to 8s
    const heroLoads = [0, 1, N_SOURCES - 1]
        .map((i) => loadByIndex.get(((i % N_SOURCES) + N_SOURCES) % N_SOURCES))
        .filter((p): p is Promise<void> => !!p);
    const texturesReady = Promise.race([
        Promise.all(heroLoads),
        new Promise<void>((r) => setTimeout(r, 8000)),
    ]);
    // the rest load in the background once every priority photo is in
    Promise.all(priorityLoads).then(() => {
        if (running && deferredIndices.length > 0) loadDeferredQueue();
    });

    let lastCenter = -1;
    const planeGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
    const placeholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); placeholder.colorSpace = THREE.SRGBColorSpace;
    placeholder.needsUpdate = true;

    const TOTAL_POOL = REPEATS * N_SOURCES;
    const pool: PoolItem[] = [];
    for (let r = 0; r < REPEATS; r++) {
        for (let i = 0; i < N_SOURCES; i++) {
            const mat = new THREE.MeshBasicMaterial({
                map: placeholder,
                transparent: true,
                depthTest: false,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(planeGeo, mat);
            mesh.matrixAutoUpdate = false;
            mesh.matrixWorldAutoUpdate = false;
            scene.add(mesh);
            pool.push({ mesh, mat, srcIndex: i, bound: false });
        }
    }

    const rt = new THREE.WebGLRenderTarget(W * dpr, H * dpr, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
    });

    const kernelFull = buildCaKernel(LENS.samples);
    const kernelLow = buildCaKernel(2);

    const lensScene = new THREE.Scene();
    const lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const initRad = LENS.rotation * DEG2RAD;
    const lensUniforms = {
        uTex: { value: rt.texture }, uRes: { value: new THREE.Vector2(W * dpr, H * dpr) },
        uCenter: { value: new THREE.Vector2(LENS.posX, LENS.posY) }, uSizeX: { value: LENS.sizeX },
        uSizeY: { value: LENS.sizeY }, uShape: { value: 0 }, uSquareRound: { value: 0 },
        uRotCS: { value: new THREE.Vector2(Math.cos(initRad), Math.sin(initRad)) },
        uAspect: { value: W / H }, uZoom: { value: LENS.zoom },
        uDispersion: { value: LENS.dispersion }, uBlur: { value: LENS.blur },
        uGlow: { value: LENS.glow }, uWhiteGlow: { value: LENS.whiteGlow },
        uNovaSize: { value: LENS.novaSize }, uBlueRing: { value: LENS.blueRing },
        uRingRadius: { value: LENS.ringRadius }, uRingWidth: { value: LENS.ringWidth },
        uShimmer: { value: reduced || !LENS.shimmer ? 0 : 1 }, uShimmerFreq: { value: LENS.shimmerFreq },
        uShimmerSpeed: { value: LENS.shimmerSpeed }, uShimmerDepth: { value: LENS.shimmerDepth },
        uTime: { value: 0 }, uRimStart: { value: LENS.rimStart },
        uRimTangential: { value: LENS.rimTangential }, uRimInward: { value: LENS.rimInward },
        uRimFreq1: { value: LENS.rimFreq1 }, uRimFreq2: { value: LENS.rimFreq2 },
        uBlueColor: { value: new THREE.Color(LENS.blueColor) }, uRimLine: { value: LENS.rimLine },
        uRimLinePos: { value: LENS.rimLinePos }, uRimLineWidth: { value: LENS.rimLineWidth },
        uVignette: { value: LENS.vignette }, uVignetteSize: { value: LENS.vignetteSize },
        uSamples: { value: LENS.samples },
        uCaKernel: { value: kernelFull },
    };

    const lensMat = new THREE.ShaderMaterial({
        uniforms: lensUniforms as unknown as THREE.ShaderMaterial["uniforms"],
        vertexShader: LENS_VERTEX,
        fragmentShader: LENS_FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });

    const lensQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lensMat);
    lensQuad.matrixAutoUpdate = false;
    lensQuad.matrixWorldAutoUpdate = false;
    lensScene.add(lensQuad);

    const focusState = {
        active: false,
        animating: false,
        srcIndex: -1,
        poolIdx: -1,
        lensFx: entryOn ? 0 : 1,
        anim: null as gsap.core.Timeline | null,
    };
    const drop = new Array<number>(TOTAL_POOL).fill(0);
    let focusScale = 1;
    const lastCenterX = new Array<number | undefined>(TOTAL_POOL);
    const pEntry = new Array<number>(TOTAL_POOL).fill(entryOn ? 0 : 1);
    let entryActive = entryOn;
    let entrySettled = false;
    const growArr = new Array<number>(TOTAL_POOL).fill(entryOn ? 0 : 1);
    let entryAnim: gsap.core.Timeline | null = null;

    const lensFxFull: Record<(typeof LENS_FX_KEYS)[number], number> = {
        uDispersion: lensUniforms.uDispersion.value, uBlueRing: lensUniforms.uBlueRing.value,
        uRimLine: lensUniforms.uRimLine.value, uVignette: lensUniforms.uVignette.value,
        uZoom: lensUniforms.uZoom.value, uRimTangential: lensUniforms.uRimTangential.value,
        uRimInward: lensUniforms.uRimInward.value,
    };

    const panelRects: PanelRect[] = Array.from({ length: TOTAL_POOL }, () => ({
        left: 0, right: 0, top: 0, bottom: 0, poolIdx: 0, srcIndex: 0, centerX: 0,
    }));
    let panelRectCount = 0;

    const centeredPanelObj = { srcIndex: 0, centerX: 0, wPx: 0, h: 0, poolIdx: 0 };
    let centeredPanel: typeof centeredPanelObj | null = null;

    const entryHalfWidths = new Float64Array(N_SOURCES);
    const entryXOffsets = new Float64Array(N_SOURCES);

    function layout() {
        panelRectCount = 0;
        centeredPanel = null;
        let centeredDist = Infinity;
        const half = W / 2;
        const buffer = PANEL_H;
        const inEntry = entryActive || entrySettled;
        const midRep = Math.floor(REPEATS / 2);

        if (inEntry) {
            const cSrc = centerIndex(scroll);
            const baseIdx = midRep * N_SOURCES;
            for (let s = 0; s < N_SOURCES; s++) {
                const gg = growArr[baseIdx + s] || 0;
                const sh = ENTRY.startH + (PANEL_H - ENTRY.startH) * gg;
                entryHalfWidths[s] = (sources[s]!.aspect * sh) * 0.5;
            }
            for (let i = 0; i < N_SOURCES; i++) {
                let di = i - cSrc;
                if (di > N_SOURCES / 2) di -= N_SOURCES;
                if (di < -N_SOURCES / 2) di += N_SOURCES;
                let off = 0;
                if (di > 0) {
                    for (let k = 0; k < di; k++) {
                        const sa = (((cSrc + k) % N_SOURCES) + N_SOURCES) % N_SOURCES;
                        const sb = (((cSrc + k + 1) % N_SOURCES) + N_SOURCES) % N_SOURCES;
                        off += entryHalfWidths[sa]! + entryHalfWidths[sb]! + GAP;
                    }
                } else if (di < 0) {
                    for (let k = 0; k < -di; k++) {
                        const sa = (((cSrc - k) % N_SOURCES) + N_SOURCES) % N_SOURCES;
                        const sb = (((cSrc - k - 1) % N_SOURCES) + N_SOURCES) % N_SOURCES;
                        off -= entryHalfWidths[sa]! + entryHalfWidths[sb]! + GAP;
                    }
                }
                entryXOffsets[i] = off;
            }
        }

        const shrink = 1 - 0.25 * scrollEnergy;
        const baseH = PANEL_H * shrink;

        for (let poolIdx = 0; poolIdx < TOTAL_POOL; poolIdx++) {
            const p = pool[poolIdx]!;
            const rep = Math.floor(poolIdx / N_SOURCES);
            const i = p.srcIndex;
            const src = sources[i]!;

            if (src.tex && !p.bound) {
                p.mat.map = src.tex;
                p.mat.needsUpdate = true;
                p.bound = true;
            }

            const slotCenterInLoop = offsets[i]! + slotWidth(i) / 2 - GAP / 2;
            let x = slotCenterInLoop - scroll;
            x = ((x % totalWidth) + totalWidth) % totalWidth;
            x += (rep - midRep) * totalWidth;
            if (x > half + totalWidth) x -= totalWidth * REPEATS;

            const centerX = x;
            if (!inEntry && (centerX < -half - buffer || centerX > half + buffer)) {
                p.mesh.visible = false;
                lastCenterX[poolIdx] = undefined;
                continue;
            }
            lastCenterX[poolIdx] = centerX;

            const h = baseH;
            const wPx = src.aspect * baseH;

            let y = 0;
            const isFocused = focusState.active && focusState.poolIdx === poolIdx;
            const d = drop[poolIdx] || 0;
            let drawW = wPx;
            let drawH = h;
            if (isFocused) {
                drawW = wPx * focusScale;
                drawH = h * focusScale;
            } else if (d > 0) {
                y = -d * H * FOCUS.dropDist;
            }

            let finalX = centerX;
            let finalY = y;
            let finalW = drawW;
            let finalH = drawH;

            if (inEntry) {
                if (rep !== midRep) {
                    p.mesh.visible = false;
                    lastCenterX[poolIdx] = undefined;
                    continue;
                }
                finalX = entryXOffsets[i]!;
                if (finalX < -half - buffer || finalX > half + buffer) {
                    p.mesh.visible = false;
                    lastCenterX[poolIdx] = undefined;
                    continue;
                }
                const pe = pEntry[poolIdx] || 0;
                const g = growArr[poolIdx] || 0;
                const curH = ENTRY.startH + (drawH - ENTRY.startH) * g;
                finalH = curH;
                finalW = curH * src.aspect;
                const below = -H * ENTRY.fromBelow;
                finalY = below + (y - below) * pe;
            }

            p.mesh.visible = true;
            p.mesh.position.set(finalX, finalY, 0);
            p.mesh.scale.set(finalW, finalH, 1);
            p.mesh.updateMatrix();
            p.mesh.matrixWorld.copy(p.mesh.matrix);

            const sx = centerX + half;
            const sy = H / 2 - y;
            const rect = panelRects[panelRectCount++]!;
            rect.left = sx - drawW / 2;
            rect.right = sx + drawW / 2;
            rect.top = sy - drawH / 2;
            rect.bottom = sy + drawH / 2;
            rect.poolIdx = poolIdx;
            rect.srcIndex = i;
            rect.centerX = centerX;

            const absX = Math.abs(centerX);
            if (absX < centeredDist) {
                centeredDist = absX;
                centeredPanelObj.srcIndex = i;
                centeredPanelObj.centerX = centerX;
                centeredPanelObj.wPx = wPx;
                centeredPanelObj.h = h;
                centeredPanelObj.poolIdx = poolIdx;
                centeredPanel = centeredPanelObj;
            }
        }
    }

    function panelAtPointer(px: number, py: number) {
        for (let i = 0; i < panelRectCount; i++) {
            const r = panelRects[i]!;
            if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) return r;
        }
        return null;
    }

    function localPoint(e: { clientX: number; clientY: number }) {
        return { x: e.clientX - rectLeft, y: e.clientY - rectTop };
    }

    let dragging = false;
    let dragPointerId: number | null = null;
    let dragLastX = 0;
    let dragDist = 0;
    let dragVel = 0;
    let dragMoveT = 0;
    let suppressClick = false;
    let dragPointerType = "mouse";
    let lastPointerX = Number.NaN;
    let lastPointerY = Number.NaN;
    let pointerInside = false;
    let lastPointerType = "mouse";

    if (cursorElement) gsap.set(cursorElement, { xPercent: 20, yPercent: 30, scale: 0, autoAlpha: 0 });
    const moveX = cursorElement ? gsap.quickTo(cursorElement, "x", { duration: 0.5, ease: "power3.out" }) : null;
    const moveY = cursorElement ? gsap.quickTo(cursorElement, "y", { duration: 0.5, ease: "power3.out" }) : null;

    let overPanel = false;
    let hoverPanel = false;
    let cursorNow = "";
    function setCursor(v: string) {
        if (v === cursorNow) return;
        cursorNow = v;
        el.style.cursor = v;
    }

    function updateCursor() {
        if (focusState.active || entryActive || entrySettled) return setCursor("");
        if (dragging) return setCursor("grabbing");
        if (!hoverPanel) return setCursor("");
        return setCursor("grab");
    }

    function setHover(on: boolean) {
        hoverPanel = on;
        setView(on);
    }

    function refreshHover() {
        if (!pointerInside || lastPointerType !== "mouse") return;
        if (!Number.isFinite(lastPointerX)) return;
        if (focusState.active) { setHover(false); return; }
        setHover(panelAtPointer(lastPointerX, lastPointerY) !== null);
    }

    function setView(on: boolean) {
        if (entryActive || entrySettled || dragging) on = false;
        if (on === overPanel) { updateCursor(); return; }
        overPanel = on;
        updateCursor();
        if (!cursorElement) return;
        gsap.killTweensOf(cursorElement, "scale,autoAlpha,opacity,visibility");
        gsap.to(cursorElement, {
            scale: on ? 1 : 0, autoAlpha: on ? 1 : 0, duration: on ? 0.35 : 0.25,
            ease: on ? "power3.out" : "power3.in",
        });
    }

    function inputLocked() { return focusState.active || entryActive || entrySettled; }

    // 🛠 FIXED: the vertical band the strip occupies (top of the highest panel to bottom of the lowest). Wheel input
    // anywhere inside this band - on a photo OR in the gap between photos - belongs to the strip, not to the page.
    function inStrip(py: number) {
        let top = Infinity;
        let bottom = -Infinity;
        for (let i = 0; i < panelRectCount; i++) {
            const r = panelRects[i]!;
            if (r.top < top) top = r.top;
            if (r.bottom > bottom) bottom = r.bottom;
        }
        if (top === Infinity) {
            const half = (PANEL_H * FOCUS.centerScale) / 2;
            top = H / 2 - half;
            bottom = H / 2 + half;
        }
        return py >= top && py <= bottom;
    }

    function onWheel(e: WheelEvent) {
        if (!mostlyVisible) return;

        const p = localPoint(e);

        // A focused photo is open: never let the page scroll behind it.
        if (focusState.active) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (inputLocked() || !inStrip(p.y)) return;

        // 🛠 FIXED: preventDefault only stops the browser's own scrolling. The page uses Lenis smooth-scroll, which listens
        // on `window` and scrolls the page by itself, so the event also has to be stopped before it bubbles up there.
        e.preventDefault();
        e.stopPropagation();
        userInteracted = true;
        pendingFocus = null;
        // trackpads can send mostly-horizontal swipes: use whichever axis is stronger
        target += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * WHEEL;
        lastInput = performance.now();
        snapped = false;
        startLoop();
    }

    function onPointerDown(e: PointerEvent) {
        suppressClick = false;
        if (inputLocked() || dragging) return;

        updateCachedRect();
        if (!mostlyVisible) return;

        const p = localPoint(e);
        if (!panelAtPointer(p.x, p.y)) return;

        if (e.button !== 0 && e.pointerType === "mouse") return;
        dragging = true;
        dragPointerId = e.pointerId;
        dragPointerType = e.pointerType || "mouse";
        try { el.setPointerCapture(e.pointerId); } catch { /* best-effort */ }
        dragLastX = p.x;
        lastPointerX = p.x;
        lastPointerY = p.y;
        dragDist = 0;
        dragVel = 0;
        dragMoveT = performance.now();
        setView(false);
        velocity = 0;
        pendingFocus = null;
        userInteracted = true;
        snapped = false;
        lastInput = dragMoveT;
        startLoop();
    }

    function onTouchMove(e: TouchEvent) {
        if (dragging) {
            e.preventDefault();
        }
    }

    function onPointerMove(e: PointerEvent) {
        const p = localPoint(e);
        if (dragging && e.pointerId === dragPointerId) {
            const sens = dragPointerType === "mouse" ? DRAG : TOUCH_DRAG;
            const dx = p.x - dragLastX;
            dragLastX = p.x;
            dragDist += Math.abs(dx);
            target -= dx * sens;
            dragVel = dragVel * 0.6 + -dx * sens * 0.4;
            dragMoveT = performance.now();
            lastInput = dragMoveT;
            snapped = false;
            startLoop();
        }
        lastPointerX = p.x;
        lastPointerY = p.y;
        lastPointerType = e.pointerType || "mouse";
        pointerInside = true;
        if (e.pointerType !== "mouse") return;
        if (moveX) moveX(p.x);
        if (moveY) moveY(p.y);
        if (focusState.active) { setHover(false); return; }
        setHover(panelAtPointer(p.x, p.y) !== null);
    }

    function onPointerUp(e?: PointerEvent) {
        if (!dragging) return;
        if (e && dragPointerId !== null && e.pointerId !== dragPointerId) return;
        dragging = false;
        if (dragPointerId !== null) {
            try { el.releasePointerCapture(dragPointerId); } catch { /* ignore */ }
            dragPointerId = null;
        }
        velocity = performance.now() - dragMoveT > FLICK_IDLE_MS ? 0 : dragVel;
        dragVel = 0;
        lastInput = performance.now();
        snapped = false;
        suppressClick = dragDist > (dragPointerType === "mouse" ? CLICK_SLOP : TOUCH_CLICK_SLOP);
        if (dragPointerType === "mouse") setHover(panelAtPointer(lastPointerX, lastPointerY) !== null);
        else updateCursor();
        startLoop();
    }

    function onEnter(e: PointerEvent) {
        updateCachedRect();
        pointerInside = true;
        lastPointerType = e.pointerType || "mouse";
    }
    function onLeave() { pointerInside = false; setHover(false); }

    function onClick(e: MouseEvent) {
        if (suppressClick) { suppressClick = false; return; }
        if (inputLocked()) return;
        const p = localPoint(e);
        const hit = panelAtPointer(p.x, p.y);
        if (!hit) return;
        if (centeredPanel && hit.poolIdx === centeredPanel.poolIdx) {
            pendingFocus = null;
            openFocus();
            return;
        }
        userInteracted = true;
        velocity = 0;
        target = centerForIndex(nearestIndex(scroll + hit.centerX));
        snapped = true;
        pendingFocus = { srcIndex: hit.srcIndex };
        setView(false);
        startLoop();
    }

    function openFocus() {
        if (focusState.active || !centeredPanel) return;
        const src = sources[centeredPanel.srcIndex];
        if (!src?.tex) return;

        focusState.active = true;
        focusState.animating = true;
        focusState.srcIndex = centeredPanel.srcIndex;
        const focusPoolIdx = centeredPanel.poolIdx;
        focusState.poolIdx = focusPoolIdx;
        target = centerForIndex(nearestIndex(scroll));

        const focusX = lastCenterX[focusPoolIdx] || 0;
        const others = pool
            .map((_, idx) => ({ idx, x: lastCenterX[idx] }))
            .filter((o) => o.idx !== focusPoolIdx && o.x !== undefined)
            .map((o) => ({ idx: o.idx, dist: Math.abs((o.x ?? 0) - focusX) }))
            .sort((a, b) => a.dist - b.dist);

        let rank = 0;
        let prevDist = -1;
        const ranked = others.map((o) => {
            if (prevDist >= 0 && o.dist - prevDist > 1) rank += 1;
            prevDist = o.dist;
            return { idx: o.idx, rank };
        });

        for (const key of LENS_FX_KEYS) lensFxFull[key] = lensUniforms[key].value;

        if (focusState.anim) focusState.anim.kill();
        const scaleProxy = { v: focusScale };
        const tl = gsap.timeline({
            onUpdate: () => { sceneDirty = true; startLoop(); },
            onComplete: () => { focusState.animating = false; sceneDirty = true; startLoop(); },
        });
        tl.to(focusState, { lensFx: 0, duration: FOCUS.lensFade, ease: "power3.out" }, 0);
        tl.to(scaleProxy, {
            v: FOCUS.centerScale, duration: FOCUS.focusDuration, ease: FOCUS.focusEase,
            onUpdate() { focusScale = scaleProxy.v; },
        }, 0);
        ranked.forEach((o) => {
            tl.to(drop, { [o.idx]: 1, duration: FOCUS.cardDuration, ease: FOCUS.cardEase }, o.rank * FOCUS.stagger);
        });
        focusState.anim = tl;
        setView(false);
        options.onFocusChange(true);
        sceneDirty = true;
        startLoop();
    }

    function closeFocus() {
        if (!focusState.active) return;
        if (focusState.anim) focusState.anim.kill();

        focusState.animating = true;
        const focusX = lastCenterX[focusState.poolIdx] || 0;
        const others = pool
            .map((_, idx) => ({ idx, x: lastCenterX[idx] }))
            .filter((o) => o.x !== undefined && (drop[o.idx] || 0) > 0)
            .map((o) => ({ idx: o.idx, dist: Math.abs((o.x ?? 0) - focusX) }))
            .sort((a, b) => b.dist - a.dist);

        let rank = 0;
        let prevDist = -1;
        const ranked = others.map((o) => {
            if (prevDist >= 0 && prevDist - o.dist > 1) rank += 1;
            prevDist = o.dist;
            return { idx: o.idx, rank };
        });

        options.onFocusChange(false);
        const scaleProxy = { v: focusScale };
        const tl = gsap.timeline({
            onUpdate: () => { sceneDirty = true; startLoop(); },
            onComplete: () => {
                focusState.active = false;
                focusState.animating = false;
                focusState.srcIndex = -1;
                sceneDirty = true;
                updateCursor();
                startLoop();
            },
        });
        tl.to(focusState, { lensFx: 1, duration: FOCUS.lensFade * 0.8, ease: "power3.inOut" }, 0);
        tl.to(scaleProxy, {
            v: 1, duration: FOCUS.focusDuration * 0.85, ease: FOCUS.focusEase,
            onUpdate() { focusScale = scaleProxy.v; },
        }, 0);
        ranked.forEach((o) => {
            tl.to(drop, { [o.idx]: 0, duration: FOCUS.cardDuration * 0.85, ease: FOCUS.cardEase }, o.rank * FOCUS.stagger * 0.7);
        });
        focusState.anim = tl;
        sceneDirty = true;
        startLoop();
    }

    function playEntry() {
        if (!entryOn) { options.onEntryDone(true); return; }
        if (entryAnim) entryAnim.kill();
        for (let k = 0; k < pEntry.length; k++) pEntry[k] = 0;
        entryActive = true;
        entrySettled = false;
        options.onEntryDone(false);
        for (let k = 0; k < growArr.length; k++) growArr[k] = 0;
        focusState.lensFx = 0;
        target = centerForIndex(nearestIndex(scroll));
        scroll = target;
        velocity = 0;
        snapped = true;
        layout();
        sceneDirty = true;

        const visible: number[] = [];
        for (let k = 0; k < lastCenterX.length; k++) {
            if (lastCenterX[k] !== undefined) visible.push(k);
        }
        const tl = gsap.timeline({
            delay: ENTRY.delay,
            onUpdate: () => { sceneDirty = true; startLoop(); },
        });
        const spread = ENTRY.stagger * Math.max(visible.length - 1, 1);
        let lastRiseEnd = 0;
        visible.forEach((idx) => {
            const atTime = Math.random() * spread;
            lastRiseEnd = Math.max(lastRiseEnd, atTime + ENTRY.riseDuration);
            tl.to(pEntry, { [idx]: 1, duration: ENTRY.riseDuration, ease: ENTRY.riseEase }, atTime);
        });
        tl.call(() => { entryActive = false; entrySettled = true; sceneDirty = true; }, [], lastRiseEnd);

        const cSrcG = centerIndex(scroll);
        const midRepG = Math.floor(REPEATS / 2);
        const growList: { idx: number; rank: number }[] = [];
        let maxRank = 0;
        for (let k = 0; k < lastCenterX.length; k++) {
            if (lastCenterX[k] === undefined) continue;
            if (Math.floor(k / N_SOURCES) !== midRepG) continue;
            let di = (k % N_SOURCES) - cSrcG;
            if (di > N_SOURCES / 2) di -= N_SOURCES;
            if (di < -N_SOURCES / 2) di += N_SOURCES;
            const r = Math.abs(di);
            maxRank = Math.max(maxRank, r);
            growList.push({ idx: k, rank: r });
        }
        const growRanked = growList.map((v) => ({ idx: v.idx, rank: maxRank - v.rank }));
        const growStart = lastRiseEnd + ENTRY.growDelay;
        let growEnd = growStart;
        tl.to(focusState, { lensFx: 1, duration: ENTRY.lensBloom, ease: ENTRY.lensBloomEase }, growStart);
        growRanked.forEach((o) => {
            const atTime = growStart + o.rank * ENTRY.growStagger;
            growEnd = Math.max(growEnd, atTime + ENTRY.growDuration);
            tl.to(growArr, { [o.idx]: 1, duration: ENTRY.growDuration, ease: ENTRY.growEase }, atTime);
        });
        tl.call(() => {
            entrySettled = false;
            for (let k = 0; k < growArr.length; k++) growArr[k] = 1;
            sceneDirty = true;
            options.onEntryDone(true);
            updateCursor();
            startLoop();
        }, [], growEnd);
        entryAnim = tl;
    }

    function step(direction: number) {
        if (inputLocked()) return;
        userInteracted = true;
        velocity = 0;
        pendingFocus = null;
        target = centerForIndex(nearestIndex(scroll) + direction);
        snapped = true;
        lastInput = performance.now();
        startLoop();
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointercancel", onPointerUp, { passive: true });
    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    el.addEventListener("click", onClick);
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("scroll", updateCachedRect, { passive: true });

    const io = new IntersectionObserver(
        ([e]) => {
            if (!e) return;
            inView = e.isIntersecting;
            mostlyVisible = e.intersectionRatio >= 0.75;
            if (inView && booted) {
                updateCachedRect();
                sceneDirty = true;
                startLoop();
            }
        },
        { threshold: [0, 0.75] }
    );
    io.observe(mount);

    function applyPixelRatio() {
        const ratio = Math.min(window.devicePixelRatio || 1, qualityCap);
        renderer.setPixelRatio(ratio);
        rt.setSize(W * ratio, H * ratio);
        lensUniforms.uRes.value.set(W * ratio, H * ratio);
        sceneDirty = true;
    }

    function governor(frameMs: number) {
        if (govCooldown > 0) { govCooldown--; return; }
        slowTicks = frameMs > 30 ? slowTicks + 1 : Math.max(0, slowTicks - 2);
        if (slowTicks > 40) {
            const current = Math.min(window.devicePixelRatio || 1, qualityCap);
            if (current > 0.75) {
                qualityCap = Math.max(0.75, current - (current > 1 ? 0.25 : 0.125));
                applyPixelRatio();
            }
            slowTicks = 0;
            govCooldown = 90;
        }
    }

    function tick() {
        if (!running) return;
        if (document.hidden || !inView) { raf = 0; lastTickAt = 0; return; }

        const now = performance.now();

        // ⚡ OPTIMIZED: idle shimmer runs at 30fps (skip this rAF if the last render was <33ms ago and nothing else is happening)
        if (idleShimmerOnly && !sceneDirty && !dragging && velocity === 0 && !pendingFocus && !focusState.active && !focusState.animating && now - lastRenderAt < IDLE_FRAME_MS) {
            raf = requestAnimationFrame(tick);
            return;
        }
        lastRenderAt = now;
        if (!idleShimmerOnly && lastTickAt) { const ms = now - lastTickAt; if (ms < 250) governor(ms); }
        lastTickAt = now;

        if (!dragging) {
            target += velocity;
            velocity *= FRICTION;
            if (Math.abs(velocity) < 0.05) velocity = 0;
            if (!snapped && !focusState.active && now - lastInput > SNAP_IDLE_MS) {
                target = centerForIndex(nearestIndex(scroll));
                snapped = true;
            }
        }

        const follow = dragging && dragPointerType !== "mouse" ? TOUCH_EASE : snapped && !pendingFocus ? SNAP_EASE : EASE;
        const deltaScroll = (target - scroll) * follow;
        if (Math.abs(deltaScroll) > 1e-4) {
            scroll += deltaScroll;
            sceneDirty = true;
        } else if (scroll !== target && snapped) {
            scroll = target;
            sceneDirty = true;
        }

        const ci = centerIndex(scroll);
        if (ci !== lastCenter) {
            lastCenter = ci;
            options.onActiveChange(ci);
        }

        const rawSpeed = scroll - prevScroll;
        prevScroll = scroll;
        const norm = Math.min(1, Math.abs(rawSpeed) / Math.max(1, SHRINK_MAX));
        const k = norm > scrollEnergy ? SHRINK_ATTACK : SHRINK_DECAY;
        const nextEnergy = scrollEnergy + (norm - scrollEnergy) * k;
        if (Math.abs(nextEnergy - scrollEnergy) > 1e-4) {
            scrollEnergy = nextEnergy;
            sceneDirty = true;
        } else if (scrollEnergy !== 0 && norm === 0) {
            scrollEnergy = 0;
            sceneDirty = true;
        }

        if (entryActive || entrySettled || focusState.animating) {
            sceneDirty = true;
        }

        if (sceneDirty) {
            layout();
            refreshHover();
            renderer.setRenderTarget(rt);
            renderer.render(scene, camera);
            sceneDirty = false;
        }

        if (pendingFocus && !focusState.active) {
            if (Math.abs(target - scroll) < 0.5) {
                const pf = pendingFocus;
                pendingFocus = null;
                if (centeredPanel && centeredPanel.srcIndex === pf.srcIndex) openFocus();
            }
        }

        const aspect = W / H;
        lensUniforms.uAspect.value = aspect;
        lensUniforms.uCenter.value.set(LENS.posX, LENS.posY);
        lensUniforms.uSizeX.value = aspect < 1 ? 0.42 * aspect : LENS.sizeX;

        const timeSec = now * 0.001;
        lensUniforms.uTime.value = timeSec;
        const rotAngle = (LENS.rotation + LENS.spin * timeSec) * DEG2RAD;
        lensUniforms.uRotCS.value.set(Math.cos(rotAngle), Math.sin(rotAngle));

        const fx = focusState.lensFx;
        for (const key of LENS_FX_KEYS) lensUniforms[key].value = lensFxFull[key] * fx;
        const useLowSamples = fx < 0.02;
        lensUniforms.uSamples.value = useLowSamples ? 2 : LENS.samples;
        lensUniforms.uCaKernel.value = useLowSamples ? kernelLow : kernelFull;

        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        const autoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.render(lensScene, lensCam);
        renderer.autoClear = autoClear;

        const isMoving =
            dragging ||
            Math.abs(velocity) > 0 ||
            Math.abs(target - scroll) > 1e-4 ||
            scrollEnergy > 1e-4 ||
            !snapped ||
            entryActive ||
            entrySettled ||
            focusState.animating ||
            pendingFocus !== null;

        const lensNeedsTime = (lensUniforms.uShimmer.value > 0.5 && lensUniforms.uBlueRing.value > 0.0001) || LENS.spin !== 0;

        idleShimmerOnly = !isMoving && lensNeedsTime;

        if (isMoving || lensNeedsTime) {
            raf = requestAnimationFrame(tick);
        } else {
            raf = 0;
            lastTickAt = 0;
        }
    }

    function startLoop() {
        if (!running || !booted || raf) return;
        raf = requestAnimationFrame(tick);
    }

    const compiled = (renderer as any).compileAsync
        ? Promise.all([
            (renderer as any).compileAsync(scene, camera),
            (renderer as any).compileAsync(lensScene, lensCam),
        ]).catch(() => { })
        : Promise.resolve();

    Promise.all([texturesReady, compiled]).then(() => {
        if (!running) return;
        booted = true;
        sceneDirty = true;
        if (entryOn) playEntry();
        else options.onEntryDone(true);
        startLoop();
    });

    function onResize() {
        W = Math.max(1, mount.clientWidth);
        H = Math.max(1, mount.clientHeight);
        PANEL_H = panelHFor();
        updateCachedRect();
        recomputeTotal();
        renderer.setSize(W, H);
        camera.left = -W / 2;
        camera.right = W / 2;
        camera.top = H / 2;
        camera.bottom = -H / 2;
        camera.updateProjectionMatrix();
        const ratio = Math.min(window.devicePixelRatio || 1, qualityCap);
        renderer.setPixelRatio(ratio);
        rt.setSize(W * ratio, H * ratio);
        lensUniforms.uRes.value.set(W * ratio, H * ratio);

        if (!userInteracted) {
            scroll = centerForIndex(0);
            target = scroll;
        }
        sceneDirty = true;
        startLoop();
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    const onVisibility = () => {
        if (!document.hidden) {
            sceneDirty = true;
            startLoop();
        }
    };
    document.addEventListener("visibilitychange", onVisibility);

    function destroy() {
        running = false;
        abortCtrl.abort();
        cancelAnimationFrame(raf);
        io.disconnect();
        resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("scroll", updateCachedRect);
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("pointerdown", onPointerDown);
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerup", onPointerUp);
        el.removeEventListener("pointercancel", onPointerUp);
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("click", onClick);
        el.removeEventListener("touchmove", onTouchMove);
        if (focusState.anim) focusState.anim.kill();
        if (entryAnim) entryAnim.kill();
        if (cursorElement) gsap.killTweensOf(cursorElement);

        if (el.parentNode) el.parentNode.removeChild(el);

        const scheduleIdle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 400));
        scheduleIdle(() => {
            sources.forEach((s) => {
                if (s.tex) {
                    (s.tex.image as ImageBitmap | undefined)?.close?.();
                    s.tex.dispose();
                }
            });
            pool.forEach((p) => p.mat.dispose());
            planeGeo.dispose();
            placeholder.dispose();
            lensQuad.geometry.dispose();
            lensMat.dispose();
            rt.dispose();
            renderer.dispose();
        });
    }

    return { closeFocus, next: () => step(1), previous: () => step(-1), destroy };
}
</script>