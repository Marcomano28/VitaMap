"use client";

import { useEffect, useRef } from "react";

/**
 * Escena "Atmósfera" de la portada de VitaWende (WebGL, sin dependencias).
 *
 * La imagen se trata como un espacio gracias a un mapa de profundidad de la
 * propia foto (public/images/vitawende-courtyard-depth.png, generado una vez
 * con Depth Anything V2 Small, licencia Apache-2.0; blanco = cerca):
 *   - la niebla se acumula con la distancia y hacia arriba;
 *   - lo cercano (abajo) queda más saturado y oscuro;
 *   - cada punto se desplaza según su profundidad con el puntero y el scroll;
 *   - la palabra gigante vive dentro de la escena y queda detrás de lo cercano;
 *   - los bordes se funden con el fondo de la página.
 * Los colores salen de --vw-bg y --vw-fog (paleta cálida o fría de VitaWende).
 * Sin WebGL queda la imagen estática de respaldo; con "reducir movimiento",
 * la escena se pinta quieta.
 */
export function AtmosphereScene({
  src,
  depthSrc,
  word,
  label,
}: {
  src: string;
  depthSrc: string;
  word: string;
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let program: WebGLProgram;
    try {
      program = buildProgram(gl);
    } catch {
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);

    const readPalette = () => {
      const style = getComputedStyle(wrap);
      gl.uniform3fv(u("uBg"), hexToRgb(style.getPropertyValue("--vw-bg")));
      gl.uniform3fv(u("uFog"), hexToRgb(style.getPropertyValue("--vw-fog")));
    };

    const wordCanvas = document.createElement("canvas");
    const drawWord = () => {
      wordCanvas.width = canvas.width;
      wordCanvas.height = canvas.height;
      const c = wordCanvas.getContext("2d");
      if (!c) return;
      c.clearRect(0, 0, wordCanvas.width, wordCanvas.height);
      const size = Math.min(wordCanvas.width * 0.2, wordCanvas.height * 0.34);
      c.font = `600 ${size}px ${getComputedStyle(wrap).fontFamily}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#fff";
      if ("letterSpacing" in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-size * 0.04}px`;
      c.fillText(word, wordCanvas.width / 2, wordCanvas.height * 0.36);
      uploadTexture(gl, 2, wordCanvas);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      let w = canvas.clientWidth * dpr;
      let h = canvas.clientHeight * dpr;
      const cap = Math.sqrt(2_400_000 / Math.max(1, w * h)); // límite de píxeles para equipos modestos
      if (cap < 1) { w *= cap; h *= cap; }
      canvas.width = Math.max(1, Math.round(w));
      canvas.height = Math.max(1, Math.round(h));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u("uRes"), canvas.width, canvas.height);
      drawWord();
    };

    let raf = 0;
    let visible = true;
    let ready = false;
    let target = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0 };
    let lastMove = -1e9;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      if (!reduce) {
        if (now - lastMove > 2500) target = { x: Math.sin(t * 0.23) * 0.55, y: Math.cos(t * 0.17) * 0.3 };
        pointer.x += (target.x - pointer.x) * 0.04;
        pointer.y += (target.y - pointer.y) * 0.04;
      }
      gl.uniform2f(u("uMouse"), pointer.x, pointer.y);
      gl.uniform1f(u("uTime"), reduce ? 0 : t);
      gl.uniform1f(u("uScroll"), Math.min(1, window.scrollY / window.innerHeight));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (now: number) => {
      draw(now);
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    };
    const redraw = () => { if (ready && (reduce || !visible)) draw(performance.now()); };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) };
      lastMove = performance.now();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && ready && !reduce) raf = requestAnimationFrame(loop);
    });
    const ro = new ResizeObserver(() => { if (ready) { resize(); redraw(); } });
    // La paleta se cambia en el <html> (data-palette): se releen los colores.
    const mo = new MutationObserver(() => { if (ready) { readPalette(); redraw(); } });

    let cancelled = false;
    Promise.all([loadImage(src), loadImage(depthSrc)])
      .then(([img, depth]) => {
        if (cancelled) return;
        uploadTexture(gl, 0, img);
        uploadTexture(gl, 1, depth);
        gl.uniform1i(u("uImg"), 0);
        gl.uniform1i(u("uDepth"), 1);
        gl.uniform1i(u("uText"), 2);
        gl.uniform2f(u("uImg2"), img.naturalWidth, img.naturalHeight);
        gl.uniform1f(u("uTextDepth"), 0.38);
        readPalette();
        resize();
        ready = true;
        draw(performance.now());
        wrap.dataset.ready = "true";
        io.observe(canvas);
        ro.observe(canvas);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });
        window.addEventListener("pointermove", onMove, { passive: true });
        if (reduce) window.addEventListener("scroll", redraw, { passive: true });
        else raf = requestAnimationFrame(loop);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", redraw);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [src, depthSrc, word]);

  return (
    <div ref={wrapRef} className="vwa-scene" role="img" aria-label={label}>
      <div className="vwa-scene-fallback" style={{ backgroundImage: `url(${src})` }} />
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

const VERTEX = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImg, uDepth, uText;
uniform vec2 uRes, uImg2, uMouse;
uniform float uTime, uScroll, uTextDepth;
uniform vec3 uFog, uBg;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }

vec2 cover(vec2 uv){
  float sr = uRes.x/uRes.y, ir = uImg2.x/uImg2.y;
  vec2 s = sr > ir ? vec2(1., ir/sr) : vec2(sr/ir, 1.);
  return (uv-.5)*s*.9 + .5 + vec2(0., .03);
}

void main(){
  vec2 p = cover(vUv);
  // Paralaje por profundidad: lo cercano se mueve más que lo lejano.
  vec2 off = uMouse*vec2(.026,.016) + vec2(0., uScroll*.05);
  float d = texture2D(uDepth, p).r;
  vec2 q = p + off*(d-.3);
  d = texture2D(uDepth, q).r;
  q = p + off*(d-.3);
  d = texture2D(uDepth, q).r;
  vec3 col = texture2D(uImg, q).rgb;

  // Cerca (abajo): más saturado y más oscuro.
  float near = smoothstep(.45, 1., d);
  float l = dot(col, vec3(.299,.587,.114));
  col = mix(vec3(l), col, 1. + .5*near);
  col *= mix(.86, .5, near);

  // Palabra gigante dentro de la escena, como una ventana en la niebla: dentro
  // de las letras la niebla se aclara y la imagen se ve algo más nítida y
  // luminosa; un borde finísimo de luz las dibuja. Lo cercano la tapa.
  vec2 tq = vUv + off*(uTextDepth-.3)*.9;
  float ta = texture2D(uText, tq).a;
  vec2 px = 1.6 / uRes;
  float tn = texture2D(uText, tq + vec2(px.x, 0.)).a + texture2D(uText, tq - vec2(px.x, 0.)).a
           + texture2D(uText, tq + vec2(0., px.y)).a + texture2D(uText, tq - vec2(0., px.y)).a;
  float behind = smoothstep(uTextDepth+.035, uTextDepth-.035, d);
  float win = ta * behind;
  float rim = clamp(abs(ta*4. - tn), 0., 1.) * behind;
  float dEff = d;

  // Niebla: se acumula con la distancia y hacia arriba; deriva muy despacio.
  float far = 1. - dEff;
  float n = fbm(vec2(q.x*2.6 + uTime*.010, q.y*4.2 - uTime*.003));
  float n2 = fbm(vec2(q.x*5.5 - uTime*.016, q.y*9. + 3.));
  float fogA = smoothstep(.2, .9, far)*.7 + smoothstep(.5, 1., vUv.y)*.26;
  fogA *= .5 + .8*n + .3*(n2-.5);
  fogA += smoothstep(.12, .0, abs(dEff-.42)) * .22 * smoothstep(.3,.7,n2);
  fogA = clamp(fogA, 0., .92);
  fogA *= 1. - .5*win;
  vec3 fogCol = mix(uFog*.8, uFog*1.18, smoothstep(.2, 1., vUv.y));
  col = mix(col, fogCol, fogA);
  col = mix(col, col*1.14 + .02, win*.6);
  col += rim * .11 * mix(vec3(1.), uFog*1.6, .4);

  // Los bordes se funden con el fondo de la página.
  float ex = smoothstep(0., .16, vUv.x) * smoothstep(0., .16, 1.-vUv.x);
  float eb = smoothstep(0., .42, vUv.y);
  float et = smoothstep(0., .22, 1.-vUv.y);
  col = mix(uBg, col, ex*eb*et);

  col += (hash(vUv*uRes + uTime) - .5) / 120.;
  gl_FragColor = vec4(col, 1.);
}`;

function buildProgram(gl: WebGLRenderingContext) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
    return shader;
  };
  const program = gl.createProgram();
  if (!program) throw new Error("program");
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link");
  return program;
}

function uploadTexture(gl: WebGLRenderingContext, unit: number, source: TexImageSource) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hexToRgb(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.padEnd(6, "0");
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}
