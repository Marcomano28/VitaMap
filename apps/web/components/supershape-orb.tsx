"use client";

import { useEffect, useRef } from "react";

type Point3 = {
  x: number;
  y: number;
  z: number;
};

type Node3 = Point3 & {
  x0: number;
  y0: number;
  z0: number;
  vx: number;
  vy: number;
  vz: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  scale: number;
};

type Rgba = [number, number, number, number];

const TWO_PI = Math.PI * 2;

// Buckwheat achene cross-section: a SHARP superformula triangle (m = 3, high n
// → pointed ridges, flat faces), plus a bulge that peaks at each face centre and
// vanishes at the ridges. Result: plump faces like a real trigo-sarraceno seed
// while the three angles stay sharp. https://paulbourke.net/geometry/supershape/
const SEED_M = 3;
const SEED_N1 = 34;
const SEED_N2 = 72;
const SEED_N3 = 72;
// Outward bulge of the face centres (0 = flat faces; ~0.4 plump; too high also
// starts to round the ridges). Applied ∝ distance from a ridge, so the sharp
// angles are preserved and only the middle of each face swells.
const SEED_FACE_BULGE = 0.4;
// Place one of the three ridges toward +x so a sharp angle faces the camera.
const SEED_RIDGE_OFFSET = Math.PI;
// Overall proportions (multipliers on the layout radius): length ≈ 1.5 × width.
const SEED_HALF_WIDTH = 1.54;
const SEED_HEIGHT = 2.1;
// Gentle top-down tilt so the seed stands upright, apex up, in the front shell.
const SEED_VIEW_TILT = 1.0;
// Target spacing between glow dots, as a fraction of the layout radius. Dots are
// distributed by edge length so latitudinal rings and longitudinal ribs read at
// the same density instead of the ribs looking denser. Lower = more dots.
const DOT_SPACING = 0.08;

function supershape(theta: number, m: number, n1: number, n2: number, n3: number) {
  const t1 = Math.pow(Math.abs(Math.cos((m * theta) / 4)), n2);
  const t2 = Math.pow(Math.abs(Math.sin((m * theta) / 4)), n3);
  const value = Math.pow(t1 + t2, -1 / n1);
  return Number.isFinite(value) ? value : 0;
}

// Peak (ridge) and trough (face-centre) radii, to normalise so ridge = 1 and to
// know how far each angle is from a ridge.
const [SEED_RMAX, SEED_RMIN] = (() => {
  let max = 0;
  let min = Infinity;
  for (let i = 0; i < 2048; i += 1) {
    const theta = -Math.PI + (i / 2047) * TWO_PI;
    const r = supershape(theta, SEED_M, SEED_N1, SEED_N2, SEED_N3);
    if (r > max) max = r;
    if (r < min) min = r;
  }
  return [max, min];
})();

// Normalised cross-section radius (ridge = 1) with the face-centre bulge added.
// faceness is 0 at the ridges and 1 at the face centres, so the bulge swells the
// middle of each face while leaving the sharp angles untouched.
function seedCross(theta: number) {
  const sup = supershape(theta, SEED_M, SEED_N1, SEED_N2, SEED_N3);
  const faceness = (SEED_RMAX - sup) / (SEED_RMAX - SEED_RMIN);
  return (sup / SEED_RMAX) * (1 + SEED_FACE_BULGE * faceness);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

// Longitudinal profile of the achene along its axis.
// u = 0 → sharp apex (top), u = 1 → blunt rounded base (bottom).
function seedProfile(u: number) {
  const body = Math.pow(smoothstep(0, 0.7, u), 0.78); // ogive taper down from the apex
  const shoulder = 1 - 0.45 * smoothstep(0.72, 1, u); // draw the body back in below the belly
  const baseRound = 1 - Math.pow(smoothstep(0.9, 1, u), 1.6) * 0.9; // round off the blunt base
  const scale = body * shoulder * baseRound;
  const height = 0.92 - 1.58 * Math.pow(u, 1.04);
  return { scale, height };
}

function buildNodes(count: number, radius: number) {
  const nodes: Node3[][] = [];

  for (let i = 0; i < count; i += 1) {
    const row: Node3[] = [];
    const theta = map(i, 0, count - 1, -Math.PI, Math.PI) + SEED_RIDGE_OFFSET;
    const ridge = seedCross(theta);

    for (let j = 0; j < count; j += 1) {
      const u = map(j, 0, count - 1, 0, 1);
      const { scale, height } = seedProfile(u);
      const crossRadius = radius * SEED_HALF_WIDTH * scale * ridge;
      const x = crossRadius * Math.cos(theta);
      const z = crossRadius * Math.sin(theta);
      const y = -radius * SEED_HEIGHT * height; // apex up (negative y is up after projection)

      row.push({ x, y, z, x0: x, y0: y, z0: z, vx: 0, vy: 0, vz: 0 });
    }

    nodes.push(row);
  }

  return nodes;
}

function map(value: number, start1: number, stop1: number, start2: number, stop2: number) {
  return start2 + ((stop2 - start2) * (value - start1)) / (stop1 - start1);
}

function spring(ax: number, ay: number, az: number, bx: number, by: number, bz: number, k: number) {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return { x: dx * k, y: dy * k, z: dz * k };
}

function readCssVar(element: HTMLElement, name: string, fallback: string) {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  return value || fallback;
}

function parseColor(input: string): Rgba {
  const value = input.trim();

  // Hex, including #rrggbbaa. The production CSS minifier (Lightning CSS, used
  // by Tailwind v4) rewrites rgba(...) into hex, e.g.
  //   --orb-particle: rgba(232, 150, 86, 0.86)  ->  #e89656db
  // so the old rgba()-only parser matched nothing and fell back to white,
  // which is why the dots lost their theme colour only in the built deploy.
  if (value.charCodeAt(0) === 35 /* '#' */) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.replace(/./g, (c) => c + c); // #rgb(a) -> #rrggbb(aa)
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return [r / 255, g / 255, b / 255, Number.isFinite(a) ? a : 1];
      }
    }
  }

  // rgb()/rgba(), comma- or modern space/slash-separated (e.g.
  // "rgb(232 150 86 / 86%)"), with optional percentage channels.
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (match) {
    const tokens = match[1].split(/[\s,/]+/).filter(Boolean);
    const channel = (t: string | undefined) =>
      t === undefined ? 255 : t.endsWith("%") ? (parseFloat(t) / 100) * 255 : parseFloat(t);
    const r = channel(tokens[0]);
    const g = channel(tokens[1]);
    const b = channel(tokens[2]);
    const aTok = tokens[3];
    const a =
      aTok === undefined ? 1 : aTok.endsWith("%") ? parseFloat(aTok) / 100 : parseFloat(aTok);
    return [r / 255, g / 255, b / 255, Number.isFinite(a) ? a : 1];
  }

  return [1, 1, 1, 1];
}

// --- WebGL: rotation + perspective happen on the GPU so the whole point cloud
// is one draw call instead of thousands of Canvas 2D arc() fills. ---

// Shared projection: rotateY → rotateX → perspective, matching the CPU version.
const TRANSFORM_GLSL = `
  float cy = cos(uRotY), sy = sin(uRotY), cx = cos(uRotX), sx = sin(uRotX);
  float x1 = aPos.x * cy - aPos.z * sy;
  float z1 = aPos.x * sy + aPos.z * cy;
  float y1 = aPos.y * cx - z1 * sx;
  float z2 = aPos.y * sx + z1 * cx;
  float scale = uPersp / (uPersp + z2);
  float depth = z2 / uRadius;
  float devX = uViewport.x * 0.5 + x1 * scale * uDpr;
  float devY = uViewport.y * 0.5 + y1 * scale * uDpr;
  gl_Position = vec4(devX / uViewport.x * 2.0 - 1.0, 1.0 - devY / uViewport.y * 2.0, 0.0, 1.0);
`;

const POINT_VS = `
attribute vec3 aPos;
uniform float uRotX, uRotY, uRadius, uPersp, uDpr;
uniform vec2 uViewport;
varying float vFront;
void main() {
  ${TRANSFORM_GLSL}
  vFront = clamp((depth + 1.4) / 2.8, 0.0, 1.0);
  gl_PointSize = max(1.0, (0.55 + vFront * 1.1) * scale * uDpr * 2.0);
}
`;

// Soft additive dot (premultiplied output, blend = ONE, ONE).
const POINT_FS = `
precision mediump float;
varying float vFront;
uniform vec3 uLine;
uniform float uLineA;
uniform vec3 uSoft;
uniform float uSoftA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float mask = 1.0 - smoothstep(0.4, 1.0, d);
  if (mask <= 0.001) discard;
  float g = 0.11 + vFront * 0.46;
  // Smooth front-to-back blend instead of a hard cutoff, which drew a sharp
  // boundary across the seed where the depth crossed the old 0.56 threshold.
  float tone = smoothstep(0.1, 0.95, vFront);
  vec3 col = mix(uSoft, uLine, tone);
  float ca = mix(uSoftA, uLineA, tone);
  float a = ca * g * mask;
  gl_FragColor = vec4(col * a, a);
}
`;

const SURFACE_VS = `
attribute vec3 aPos;
uniform float uRotX, uRotY, uRadius, uPersp, uDpr;
uniform vec2 uViewport;
varying float vFront;
void main() {
  ${TRANSFORM_GLSL}
  vFront = clamp((depth + 1.3) / 2.6, 0.0, 1.0);
}
`;

// Translucent face (premultiplied output, blend = ONE, ONE_MINUS_SRC_ALPHA).
const SURFACE_FS = `
precision mediump float;
varying float vFront;
uniform vec3 uSurf;
uniform float uSurfA;
void main() {
  float a = uSurfA * (0.08 + vFront * 0.2);
  gl_FragColor = vec4(uSurf * a, a);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram, names: string[]): Uniforms {
  const uniforms: Uniforms = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
  return uniforms;
}

const COMMON_UNIFORMS = ["uRotX", "uRotY", "uRadius", "uPersp", "uDpr", "uViewport"];

export function SupershapeOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Shared simulation state (renderer-agnostic) ---
    let width = 0;
    let height = 0;
    let dpr = 1;
    let radius = 150;
    let count = 26;
    let nodes = buildNodes(count, radius);
    let frame = 0;
    let raf: number | null = null;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rotationX = SEED_VIEW_TILT;
    let rotationY = 0.5;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    const pointer = { inside: false, x: 0, y: 0, z: 0, strength: 0 };

    // Returns whether any node is still meaningfully away from rest, so the
    // caller can stop simulating (and stop re-uploading GPU buffers) once the
    // springs have settled — at rest the seed only rotates, which is uniforms.
    const update = (time: number) => {
      const damping = 0.925;
      const dt = 0.105;
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.0014);
      const reach = radius * (0.16 + pulse * 0.08);
      const restEps = radius * 0.002;
      let moving = false;

      for (let i = 0; i < count; i += 1) {
        for (let j = 0; j < count; j += 1) {
          const node = nodes[i][j];
          const base = spring(node.x0, node.y0, node.z0, node.x, node.y, node.z, 5.1);
          let fx = base.x;
          let fy = base.y;
          let fz = base.z;

          if (pointer.strength > 0) {
            const distance = Math.hypot(pointer.x - node.x, pointer.y - node.y, pointer.z - node.z);
            const pull = 28 * Math.exp(-distance / Math.max(1, reach)) * pointer.strength;
            const attract = spring(pointer.x, pointer.y, pointer.z, node.x, node.y, node.z, pull);
            fx += attract.x;
            fy += attract.y;
            fz += attract.z;
          }

          node.vx = (node.vx + dt * fx) * damping;
          node.vy = (node.vy + dt * fy) * damping;
          node.vz = (node.vz + dt * fz) * damping;
          node.x += node.vx * dt;
          node.y += node.vy * dt;
          node.z += node.vz * dt;

          if (
            !moving &&
            (Math.abs(node.x - node.x0) > restEps ||
              Math.abs(node.y - node.y0) > restEps ||
              Math.abs(node.z - node.z0) > restEps ||
              Math.abs(node.vx) > restEps ||
              Math.abs(node.vy) > restEps ||
              Math.abs(node.vz) > restEps)
          ) {
            moving = true;
          }
        }
      }

      return moving;
    };

    // The springs only move while the pointer pulls on them or while they are
    // still settling back afterwards. Outside those windows every frame skips
    // the O(count²) physics and the point-cloud re-upload entirely.
    let simActive = false;
    let positionsDirty = true;

    const stepSimulation = (time: number) => {
      if (pointer.strength > 0) simActive = true;
      if (!simActive) return;
      const moving = update(time);
      positionsDirty = true;
      if (!moving && pointer.strength === 0) {
        for (let i = 0; i < count; i += 1) {
          for (let j = 0; j < count; j += 1) {
            const node = nodes[i][j];
            node.x = node.x0;
            node.y = node.y0;
            node.z = node.z0;
            node.vx = 0;
            node.vy = 0;
            node.vz = 0;
          }
        }
        simActive = false;
      }
    };

    const updatePointer = (event: PointerEvent) => {
      // Movil (tactil): sin interaccion. El arrastre y la atraccion de nodos
      // hacia el dedo resultan demasiado marcados en un telefono; se deja solo
      // la rotacion automatica por frames.
      if (event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy);
      const limit = Math.min(rect.width, rect.height) * 0.42;

      pointer.inside = distance < limit;
      pointer.x = dx;
      pointer.y = dy;
      pointer.z = dx * 0.12;
      pointer.strength = pointer.inside ? 1 - distance / limit : 0;

      if (isDragging) {
        const dragDx = event.clientX - lastPointerX;
        const dragDy = event.clientY - lastPointerY;
        rotationY += dragDx * 0.008;
        // No clamp on X: the seed auto-tumbles on X, so dragging stays free too
        // (clamping here would snap when grabbing mid-spin).
        rotationX += dragDy * 0.008;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
      }
    };

    const startDrag = (event: PointerEvent) => {
      if (event.pointerType === "touch") return; // sin arrastre en movil
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - cx, event.clientY - cy);
      const limit = Math.min(rect.width, rect.height) * 0.52;

      if (distance > limit) return;

      isDragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      canvas.dataset.dragging = "true";
      event.preventDefault();
    };

    const stopDrag = () => {
      isDragging = false;
      delete canvas.dataset.dragging;
    };

    const leavePointer = () => {
      pointer.inside = false;
      pointer.strength = 0;
      stopDrag();
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resizeObserver = new ResizeObserver(() => resize());

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    // resize() / tick() / applyPalette() are assigned by whichever renderer is
    // active. applyPalette re-reads the CSS palette variables; it runs on theme
    // attribute changes (observer below) instead of polling every N frames.
    let resize: () => void = () => {};
    let tick: (time: number) => void = () => {};
    let applyPalette: () => void = () => {};

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      depth: false,
    }) as WebGLRenderingContext | null;

    const pointProgram = gl ? createProgram(gl, POINT_VS, POINT_FS) : null;
    const surfaceProgram = gl ? createProgram(gl, SURFACE_VS, SURFACE_FS) : null;

    if (gl && pointProgram && surfaceProgram) {
      // --- WebGL renderer ---
      let line: Rgba = [0.26, 0.42, 0.48, 0.56];
      let soft: Rgba = [0.13, 0.25, 0.31, 0.28];
      let surf: Rgba = [0.16, 0.31, 0.36, 0.13];

      const updatePalette = () => {
        line = parseColor(readCssVar(canvas, "--orb-particle", "rgba(66, 108, 123, 0.56)"));
        soft = parseColor(readCssVar(canvas, "--orb-particle-soft", "rgba(34, 63, 78, 0.28)"));
        surf = parseColor(readCssVar(canvas, "--orb-surface", "rgba(42, 79, 92, 0.13)"));
      };

      const pointU = getUniforms(gl, pointProgram, [...COMMON_UNIFORMS, "uLine", "uLineA", "uSoft", "uSoftA"]);
      const surfaceU = getUniforms(gl, surfaceProgram, [...COMMON_UNIFORMS, "uSurf", "uSurfA"]);
      const pointAttrib = gl.getAttribLocation(pointProgram, "aPos");
      const surfaceAttrib = gl.getAttribLocation(surfaceProgram, "aPos");

      const nodeBuffer = gl.createBuffer();
      const pointBuffer = gl.createBuffer();
      const indexBuffer = gl.createBuffer();

      // Node positions (for the translucent faces) plus the interpolated dot
      // samples along every grid edge (for the additive point cloud).
      let nodePos = new Float32Array(0);
      let pointPos = new Float32Array(0);
      let sampleAIdx = new Int32Array(0); // byte-free offsets (index * 3) into nodePos
      let sampleBIdx = new Int32Array(0);
      let sampleP = new Float32Array(0);
      let sampleCount = 0;
      let indexCount = 0;

      const rebuildGeometry = () => {
        const cells = (count - 1) * (count - 1);
        const indices = new Uint16Array(cells * 6);
        let ii = 0;
        for (let i = 0; i < count - 1; i += 1) {
          for (let j = 0; j < count - 1; j += 1) {
            const a = i * count + j;
            const b = (i + 1) * count + j;
            const c = (i + 1) * count + (j + 1);
            const d = i * count + (j + 1);
            indices[ii++] = a;
            indices[ii++] = b;
            indices[ii++] = c;
            indices[ii++] = a;
            indices[ii++] = c;
            indices[ii++] = d;
          }
        }
        indexCount = indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // Distribute dots by edge length so the latitudinal rings (which are
        // ~3× longer than the longitudinal ribs at the belly) get subdivided
        // more and read at the same density as the ribs.
        const target = radius * DOT_SPACING;
        const linkSegments = (na: Node3, nb: Node3) => {
          const dx = na.x0 - nb.x0;
          const dy = na.y0 - nb.y0;
          const dz = na.z0 - nb.z0;
          return Math.max(1, Math.min(9, Math.round(Math.hypot(dx, dy, dz) / target)));
        };
        const aIdxArr: number[] = [];
        const bIdxArr: number[] = [];
        const pArr: number[] = [];
        for (let i = 0; i < count - 1; i += 1) {
          for (let j = 0; j < count - 1; j += 1) {
            const aOff = (i * count + j) * 3;
            const rightOff = ((i + 1) * count + j) * 3;
            const downOff = (i * count + (j + 1)) * 3;
            const acrossN = linkSegments(nodes[i][j], nodes[i + 1][j]); // latitudinal (around)
            for (let k = 0; k <= acrossN; k += 1) {
              aIdxArr.push(aOff);
              bIdxArr.push(rightOff);
              pArr.push(k / acrossN);
            }
            const alongN = linkSegments(nodes[i][j], nodes[i][j + 1]); // longitudinal (apex→base)
            for (let k = 0; k <= alongN; k += 1) {
              aIdxArr.push(aOff);
              bIdxArr.push(downOff);
              pArr.push(k / alongN);
            }
          }
        }
        sampleCount = aIdxArr.length;
        sampleAIdx = Int32Array.from(aIdxArr);
        sampleBIdx = Int32Array.from(bIdxArr);
        sampleP = Float32Array.from(pArr);

        nodePos = new Float32Array(count * count * 3);
        pointPos = new Float32Array(sampleCount * 3);
        positionsDirty = true;
      };

      const setCommonUniforms = (u: Uniforms) => {
        gl.uniform1f(u.uRotX, rotationX);
        gl.uniform1f(u.uRotY, rotationY);
        gl.uniform1f(u.uRadius, radius);
        gl.uniform1f(u.uPersp, radius * 4.6);
        gl.uniform1f(u.uDpr, dpr);
        gl.uniform2f(u.uViewport, canvas.width, canvas.height);
      };

      const render = () => {
        if (!isDragging && !reducedMotion) rotationX -= 0.0028;

        // Flatten node positions and interpolate the edge samples only when
        // the simulation actually moved something; at rest the buffers stay on
        // the GPU and rotation rides on the uniforms alone.
        if (positionsDirty) {
          let p = 0;
          for (let i = 0; i < count; i += 1) {
            for (let j = 0; j < count; j += 1) {
              const node = nodes[i][j];
              nodePos[p++] = node.x;
              nodePos[p++] = node.y;
              nodePos[p++] = node.z;
            }
          }
          for (let s = 0; s < sampleCount; s += 1) {
            const a = sampleAIdx[s];
            const b = sampleBIdx[s];
            const t = sampleP[s];
            const o = s * 3;
            pointPos[o] = nodePos[a] + (nodePos[b] - nodePos[a]) * t;
            pointPos[o + 1] = nodePos[a + 1] + (nodePos[b + 1] - nodePos[a + 1]) * t;
            pointPos[o + 2] = nodePos[a + 2] + (nodePos[b + 2] - nodePos[a + 2]) * t;
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, nodePos, gl.DYNAMIC_DRAW);
          gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, pointPos, gl.DYNAMIC_DRAW);
          positionsDirty = false;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);

        // Translucent faces (source-over over a transparent canvas).
        gl.useProgram(surfaceProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer);
        gl.enableVertexAttribArray(surfaceAttrib);
        gl.vertexAttribPointer(surfaceAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        setCommonUniforms(surfaceU);
        gl.uniform3f(surfaceU.uSurf, surf[0], surf[1], surf[2]);
        gl.uniform1f(surfaceU.uSurfA, surf[3]);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

        // Additive glow point cloud.
        gl.useProgram(pointProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.enableVertexAttribArray(pointAttrib);
        gl.vertexAttribPointer(pointAttrib, 3, gl.FLOAT, false, 0, 0);
        setCommonUniforms(pointU);
        gl.uniform3f(pointU.uLine, line[0], line[1], line[2]);
        gl.uniform1f(pointU.uLineA, line[3]);
        gl.uniform3f(pointU.uSoft, soft[0], soft[1], soft[2]);
        gl.uniform1f(pointU.uSoftA, soft[3]);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.drawArrays(gl.POINTS, 0, sampleCount);
      };

      resize = () => {
        measure();
        const nextCount = width < 330 ? 25 : width < 430 ? 31 : 37;
        const nextRadius = Math.min(width, height) * 0.29;
        const countChanged = nextCount !== count;
        const radiusChanged = Math.abs(nextRadius - radius) > 2;

        if (countChanged || radiusChanged) {
          count = nextCount;
          radius = nextRadius;
          nodes = buildNodes(count, radius);
          positionsDirty = true;
        }
        // Dot distribution is scale-invariant, so it only needs rebuilding when
        // the node grid (count) changes, not on every radius tweak.
        if (countChanged) rebuildGeometry();

        updatePalette();
        render();
      };

      tick = (time: number) => {
        frame += 1;
        // Re-read the theme palette periodically so the point cloud follows
        // data-theme / data-palette changes even if the MutationObserver misses
        // one (parity with the reference VitaWende implementation).
        if (frame % 30 === 0) applyPalette();
        if (!reducedMotion) stepSimulation(time);
        render();
        if (!reducedMotion || frame < 2) {
          raf = window.requestAnimationFrame(tick);
        } else {
          raf = null;
        }
      };

      applyPalette = updatePalette;
      rebuildGeometry();
    } else {
      // --- Canvas 2D fallback (no WebGL): node-level point cloud, no edge fill ---
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let lineCss = "rgba(66, 108, 123, 0.56)";
      let softCss = "rgba(34, 63, 78, 0.28)";
      let surfaceCss = "rgba(42, 79, 92, 0.13)";

      const updatePalette = () => {
        lineCss = readCssVar(canvas, "--orb-particle", lineCss);
        softCss = readCssVar(canvas, "--orb-particle-soft", softCss);
        surfaceCss = readCssVar(canvas, "--orb-surface", surfaceCss);
      };

      const project = (point: Point3): ProjectedPoint => {
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;
        const y1 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;
        const perspective = radius * 4.6;
        const scale = perspective / (perspective + z2);
        return { x: width / 2 + x1 * scale, y: height / 2 + y1 * scale, depth: z2 / radius, scale };
      };

      const render = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        if (!isDragging && !reducedMotion) rotationX -= 0.0028;

        const projected = nodes.map((row) => row.map((node) => project(node)));

        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let i = 0; i < count - 1; i += 1) {
          for (let j = 0; j < count - 1; j += 1) {
            const a = projected[i][j];
            const b = projected[i + 1][j];
            const c = projected[i + 1][j + 1];
            const d = projected[i][j + 1];
            const front = Math.max(0, Math.min(1, ((a.depth + b.depth + c.depth + d.depth) / 4 + 1.3) / 2.6));
            ctx.globalAlpha = 0.035 + front * 0.11;
            ctx.fillStyle = surfaceCss;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.lineTo(d.x, d.y);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < count; i += 1) {
          for (let j = 0; j < count; j += 1) {
            const pt = projected[i][j];
            const front = Math.max(0, Math.min(1, (pt.depth + 1.4) / 2.8));
            ctx.globalAlpha = 0.09 + front * 0.42;
            ctx.fillStyle = front > 0.56 ? lineCss : softCss;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, (0.55 + front * 1.1) * pt.scale, 0, TWO_PI);
            ctx.fill();
          }
        }
        ctx.restore();
      };

      resize = () => {
        measure();
        const nextCount = width < 330 ? 25 : width < 430 ? 31 : 37;
        const nextRadius = Math.min(width, height) * 0.29;
        if (nextCount !== count || Math.abs(nextRadius - radius) > 2) {
          count = nextCount;
          radius = nextRadius;
          nodes = buildNodes(count, radius);
        }
        updatePalette();
        render();
      };

      tick = (time: number) => {
        frame += 1;
        // Re-read the theme palette periodically so the point cloud follows
        // data-theme / data-palette changes even if the MutationObserver misses
        // one (parity with the reference VitaWende implementation).
        if (frame % 30 === 0) applyPalette();
        if (!reducedMotion) stepSimulation(time);
        render();
        if (!reducedMotion || frame < 2) {
          raf = window.requestAnimationFrame(tick);
        } else {
          raf = null;
        }
      };

      applyPalette = updatePalette;
    }

    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      if (!reducedMotion && raf === null) raf = window.requestAnimationFrame(tick);
      if (reducedMotion) resize();
    };

    // The palette lives in CSS variables that change with the html data-theme /
    // data-palette attributes; re-read them on change instead of polling.
    const themeObserver = new MutationObserver(() => {
      applyPalette();
      if (raf === null) resize(); // repaint when reduced motion froze the loop
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette", "data-theme-mode"],
    });

    resizeObserver.observe(canvas);
    window.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointermove", updatePointer);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    window.addEventListener("pointerleave", leavePointer);
    motionQuery.addEventListener("change", onMotionChange);
    resize();
    raf = window.requestAnimationFrame(tick);

    return () => {
      themeObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointerdown", startDrag);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      window.removeEventListener("pointerleave", leavePointer);
      motionQuery.removeEventListener("change", onMotionChange);
      if (raf !== null) window.cancelAnimationFrame(raf);
      // Do NOT lose the context: getContext() returns the *same* context for a
      // reused <canvas>, so losing it leaves the orb blank after navigating away
      // and back. Just free the programs we created.
      if (gl) {
        if (pointProgram) gl.deleteProgram(pointProgram);
        if (surfaceProgram) gl.deleteProgram(surfaceProgram);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="vitawende-supershape-canvas" aria-hidden="true" />;
}
