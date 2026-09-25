<script setup>
// A portfolio index built as a wheel you turn.
//
// At rest the work sits in a ring around a title, each card tangent to the
// circle. The first notch of scroll blows the ring open into a vertical drum:
// the card at the front lies flat and full size, the ones above and below
// rotate away into hard perspective and run off the top and bottom of the
// frame. Keep turning and the drum carries the next piece round to the front.
//
// The whole thing is one number - `turn` - read by a single rAF pass that writes
// transforms straight to the DOM. 0 is the ring, 1 is the drum with item 0 at
// the front, and every whole number after that is one more item turned past.
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";

// items: [{ title, image, href? }]
const props = defineProps({
    items: { type: Array, default: () => [] },
    // Sits in the middle of the ring.
    label: { type: String, default: "Works '26" },
    // Label on the card's hover affordance. Pass "" to drop it.
    action: { type: String, default: "View" },
});

/* Geometry. The card is measured against the stage; everything else is measured
   against the card, so a narrow stage - where the card is capped by width, not
   height - scales the whole wheel down with it instead of leaving a small card
   swinging on a huge drum. The three that matter are tuned together: STEP
   against DRUM sets how hard the neighbours rotate away, and DRUM against LENS
   decides whether they land inside the frame or run off it. */
const CARD_H = 0.38; // front card height, of the stage
const CARD_MAX_W = 0.34; // ... but never wider than this much of the stage
const CARD_RATIO = 1.45; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights - and everything below likewise
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
/* The drum alone hangs the work on a plumb line. It isn't one: the strip curves
   away round an arc whose centre sits off to the LEFT, so the piece at the front
   is at the arc's near point - dead centre - and its neighbours have already
   swung back left as well as up and down. BOW is that arc's radius; nothing else
   makes the difference between a stack of cards and a wheel seen side on. */
const BOW = 1.82;
const TITLE = 0.124; // ring label and front-card title
const INDEX = 0.04; // the index down the right-hand side
/** Items either side of the front still worth drawing. Past this a card is
    edge-on, and further round it would stack up on the vanishing point. */
const CULL = 1.6;

/** How much of a wheel-notch or a dragged pixel counts as one item. */
const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
/** Quiet time after the last wheel event before the wheel settles on an item. */
const SETTLE = 140;
/** Fraction of the remaining distance closed each frame. 1 = no smoothing. */
const EASE = 0.12;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rad = (deg) => (deg * Math.PI) / 180;

/** How far left the arc has carried something that has turned `drumDeg` off the
    front. Zero at the front, so the piece being read stays centred. */
const bowAt = (drumDeg, bow) => -bow * (1 - Math.cos(rad(drumDeg)));

/** Both states in one chain: the ring terms fall away as `m` reaches the drum,
    and the drum terms are still zero while the ring is up. The bow is applied
    first, in the wheel's own plane, so it slides the card sideways rather than
    turning with it - and perspective still shrinks it with distance. */
function place(ringDeg, drumDeg, ringR, drumR, bow, m) {
    return (
        `translateX(${m * bowAt(drumDeg, bow)}px)` +
        ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
        ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
    );
}

// Template refs.
const stageRef = ref(null);
const wheelRef = ref(null);
const labelRef = ref(null);
const titleRef = ref(null);
// Plain array (not reactive) of card elements, written by index - mirrors the
// React version's cardRefs.current. It only needs to be readable in the rAF
// loop, never to drive a render.
const cardRefs = [];
function setCardRef(el, i) {
    cardRefs[i] = el;
}

// Reactive display state.
const stage = reactive({ w: 0, h: 0 });
const reduced = ref(false);
const active = ref(0);

const count = computed(() => props.items.length);
const last = computed(() => Math.max(count.value - 1, 0));

const metrics = computed(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    // Shrink the ring's cards until the circle reads as a closed loop rather
    // than beads on a wire, however many pieces the wheel is given.
    const ringScale = count.value
        ? clamp(
            (((2 * Math.PI * ringR) / count.value) * 0.82) / (cardW || 1),
            0.16,
            1,
        )
        : 1;
    return {
        cardW,
        cardH,
        ringR,
        ringScale,
        drumR,
        bow: cardH * BOW,
        depth: cardH * LENS,
        title: cardH * TITLE,
        index: cardH * INDEX,
    };
});

// The wheel's position, and where it is heading. Plain numbers (not refs) -
// the rAF loop reads/writes them directly every frame, the same way the React
// version used useRef so this wouldn't trigger a render on its own.
let turn = 0;
let target = 0;
let dragY = null;
let settlingTimer = 0;
let frame = 0;
let mql = null;
let ro = null;

function to(next) {
    target = clamp(next, 0, last.value + 1);
}

// One pass per frame: ease toward the target, then write every transform.
function draw() {
    frame = requestAnimationFrame(draw);
    const { ringR, ringScale, drumR, bow } = metrics.value;

    const gap = target - turn;
    if (Math.abs(gap) < 0.0005) turn = target;
    else turn += gap * (reduced.value ? 1 : EASE);

    const t = turn;
    const m = clamp(t, 0, 1);
    const pos = Math.max(0, t - 1);

    // The drum is pulled back so its front face lands on the picture plane.
    // That set-back has to arrive with the drum, or the ring would sit at the
    // far side of the perspective and render at half its size.
    if (wheelRef.value) {
        wheelRef.value.style.transform = `translateZ(${-m * drumR}px)`;
    }

    for (let i = 0; i < count.value; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs[i];
        if (card) {
            card.style.transform = place(
                d * (360 / count.value),
                drumDeg,
                ringR,
                drumR,
                bow,
                m,
            );
            // Culled by distance, not by angle: at a full turn the far side comes
            // back round to face us, and everything past the neighbours lands on
            // the vanishing point in a heap.
            card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
            card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card && card.firstElementChild;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
    }

    if (labelRef.value) labelRef.value.style.opacity = String(1 - m);
    if (titleRef.value) titleRef.value.style.opacity = String(m);
    const near = clamp(Math.round(pos), 0, last.value);
    if (active.value !== near) active.value = near;
}

function readReduced() {
    reduced.value = mql.matches;
}

function readStage() {
    const el = stageRef.value;
    if (!el) return;
    stage.w = el.clientWidth;
    stage.h = el.clientHeight;
}

// Native listener, because the wheel has to be cancellable - and it only
// cancels while it still has somewhere to go, so the page scrolls on at
// either end instead of trapping the reader.
function onWheel(event) {
    const next = target + event.deltaY / WHEEL_UNITS;
    if (next > 0 && next < last.value + 1) event.preventDefault();
    to(next);
    // A wheel gesture arrives as a burst of events with no end of its own, so
    // the rest position is whatever notch it happened to stop on. Left there
    // the drum sits between two cards - nothing at the front, and the pair
    // either side of the gap both turned half away. Settle onto an item.
    window.clearTimeout(settlingTimer);
    settlingTimer = window.setTimeout(() => to(Math.round(target)), SETTLE);
}

function onPointerDown(event) {
    dragY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
}
function onPointerMove(event) {
    if (dragY === null) return;
    to(target + (dragY - event.clientY) / DRAG_UNITS);
    dragY = event.clientY;
}
function onPointerUp() {
    // Land on an item rather than between two.
    dragY = null;
    if (target > 1) to(Math.round(target));
}
function onKeyDown(event) {
    if (event.key === "ArrowDown") to(Math.round(target) + 1);
    else if (event.key === "ArrowUp") to(Math.round(target) - 1);
    else return;
    event.preventDefault();
}

function goTo(i) {
    to(i + 1);
}

onMounted(() => {
    // Reduced motion drops the easing, so the wheel lands where it is put
    // instead of gliding there.
    mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    readReduced();
    mql.addEventListener("change", readReduced);

    readStage();
    if (stageRef.value) {
        ro = new ResizeObserver(readStage);
        ro.observe(stageRef.value);
        stageRef.value.addEventListener("wheel", onWheel, { passive: false });
    }

    frame = requestAnimationFrame(draw);
});

onBeforeUnmount(() => {
    if (mql) mql.removeEventListener("change", readReduced);
    if (ro) ro.disconnect();
    if (frame) cancelAnimationFrame(frame);
    if (stageRef.value) stageRef.value.removeEventListener("wheel", onWheel);
    window.clearTimeout(settlingTimer);
});
</script>

<template>
    <section :aria-label="label"
        class="bg-background text-foreground relative h-full min-h-[24rem] w-full overflow-hidden select-none">
        <div ref="stageRef" tabindex="0" role="listbox" :aria-label="label"
            :aria-activedescendant="`works-wheel-${active}`"
            class="focus-visible:outline-foreground absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
            :style="{ perspective: metrics.depth + 'px' }" @pointerdown="onPointerDown" @pointermove="onPointerMove"
            @pointerup="onPointerUp" @keydown="onKeyDown">
            <div ref="wheelRef" class="absolute top-1/2 left-1/2 [transform-style:preserve-3d]">
                <component :is="item.href ? 'a' : 'div'" v-for="(item, i) in items" :key="item.title"
                    :id="`works-wheel-${i}`" role="option" :aria-selected="i === active" :href="item.href"
                    :ref="(el) => setCardRef(el, i)" class="group absolute [backface-visibility:hidden]" :style="{
                        width: metrics.cardW + 'px',
                        height: metrics.cardH + 'px',
                        marginLeft: -metrics.cardW / 2 + 'px',
                        marginTop: -metrics.cardH / 2 + 'px',
                    }">
                    <span
                        class="bg-muted shadow-foreground/12 relative block size-full overflow-hidden rounded-lg shadow-[0_18px_40px_-18px_var(--tw-shadow-color)]">
                        <img :src="item.image" :alt="item.title" draggable="false" class="size-full object-cover" />
                        <span v-if="action && item.href"
                            class="bg-background/80 text-foreground pointer-events-none absolute right-3 bottom-3 flex translate-y-1 items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] opacity-0 backdrop-blur-sm transition group-hover:translate-y-0 group-hover:opacity-100">
                            <svg viewBox="0 0 12 12" class="size-2.5" aria-hidden="true">
                                <path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.4"
                                    stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            {{ action }}
                        </span>
                    </span>
                </component>
            </div>
        </div>

        <!-- Ring title and front-card title trade places across the transition.
         Type is sized off the measured stage, not vh, so the wheel keeps its
         proportions inside a card as well as at full bleed. -->
        <div ref="labelRef" class="pointer-events-none absolute inset-0 grid place-items-center tracking-tight"
            :style="{ fontSize: metrics.title + 'px' }">
            {{ label }}
        </div>
        <div ref="titleRef"
            class="pointer-events-none absolute top-1/2 left-[8%] -translate-y-1/2 tracking-tight opacity-0"
            :style="{ fontSize: metrics.title + 'px' }">
            {{ items[active] && items[active].title }}
        </div>

        <ol class="text-muted-foreground absolute top-[7.5%] right-[2.5%] text-right leading-[1.75]"
            :style="{ fontSize: metrics.index + 'px' }">
            <li v-for="(item, i) in items" :key="item.title">
                <button type="button"
                    class="focus-visible:outline-foreground cursor-pointer transition-colors outline-none focus-visible:outline-1"
                    :class="{ 'text-foreground font-medium': i === active }" @click="goTo(i)">
                    {{ item.title }}
                </button>
            </li>
        </ol>
    </section>
</template>