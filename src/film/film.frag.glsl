#version 300 es
// The film treatment, GLSL 300 es. Effects in order:
// 1 sub frame blend · 2 depth parallax · 3 velocity dispersion · 4 DoF ·
// 5 barrel warp · 6 ramp grade · 7 atmosphere · 8 grain · 9 vignette + wash.
// LOW_QUALITY compiles out 3, 4 and 5 entirely (defines, not branches).
precision highp float;

uniform sampler2D uFrame;
uniform sampler2D uFrameNext;
uniform float uBlend;
uniform float uVelocity;
uniform float uWash;
uniform float uSoften;
uniform vec2 uResolution;
uniform vec2 uTexSize;
uniform float uTime;

// the travelling atmosphere: the act's own gradient, crossfaded by the clock
uniform vec3 uAtmTop;
uniform vec3 uAtmBottom;
uniform float uGlow;
// how far the plate is pulled toward the ramp, 0 untouched .. 1 full duotone
uniform float uGrade;
// 0..1 impulse fired on a hard cut, drives the flare sweep
uniform float uCut;

in vec2 vUv;
out vec4 outColor;

const vec3 SHADOW = vec3(0.0392, 0.0235, 0.0314);
const vec3 RUST   = vec3(0.4314, 0.1647, 0.0471);
const vec3 EMBER  = vec3(1.0000, 0.3686, 0.1020);
const vec3 FLARE  = vec3(1.0000, 0.6353, 0.2275);
const vec3 BONE   = vec3(0.9686, 0.9451, 0.9137);

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// cover fit, preserves composition at any viewport aspect
vec2 coverUv(vec2 uv) {
  float ra = uResolution.x / uResolution.y;
  float ta = uTexSize.x / uTexSize.y;
  vec2 s = ra > ta ? vec2(1.0, ta / ra) : vec2(ra / ta, 1.0);
  return (uv - 0.5) / s + 0.5;
}

#ifndef LOW_QUALITY
// EFFECT 5 · barrel warp, sells a curved projection surface
vec2 barrel(vec2 uv, float k) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  return 0.5 + c * (1.0 + k * r2);
}
#endif

// EFFECT 1 · sub frame blend, the highest value effect in the build
vec3 sampleFilm(vec2 uv) {
  vec2 t = vec2(uv.x, 1.0 - uv.y); // UNPACK_FLIP_Y is off; flip here, free
  return mix(texture(uFrame, t).rgb, texture(uFrameNext, t).rgb, uBlend);
}

vec3 sampleA(vec2 uv) {
  vec2 t = vec2(uv.x, 1.0 - uv.y);
  return texture(uFrame, t).rgb;
}

// EFFECT 6 · the ramp, as a five stop transfer curve over luminance.
// Grading toward the tungsten already in the room rather than tinting flat.
vec3 ramp(float t) {
  vec3 c = mix(SHADOW, RUST,  smoothstep(0.00, 0.30, t));
  c = mix(c, EMBER, smoothstep(0.28, 0.60, t));
  c = mix(c, FLARE, smoothstep(0.58, 0.84, t));
  c = mix(c, BONE,  smoothstep(0.84, 1.00, t));
  return c;
}

void main() {
  vec2 uv = coverUv(vUv);

#ifndef LOW_QUALITY
  float k = 0.012 + abs(uVelocity) * 0.018;
  uv = barrel(uv, k);
#endif

  vec3 base = sampleFilm(uv);

  // EFFECT 2 · depth parallax from a luminance proxy
  float depth = smoothstep(0.0, 1.0, luma(base)) * (1.0 - length(vUv - 0.5));
  vec2 pOff = vec2(uVelocity * 0.018 * (1.0 - depth), 0.0);

#ifndef LOW_QUALITY
  // EFFECT 3 · velocity chromatic dispersion, widened briefly on a cut
  float disp = (abs(uVelocity) * 2.2 + uCut * 5.0) / uResolution.x;
  vec3 col;
  col.r = sampleFilm(uv + pOff + vec2(disp, 0.0)).r;
  col.g = sampleFilm(uv + pOff).g;
  col.b = sampleFilm(uv + pOff - vec2(disp, 0.0)).b;

  // EFFECT 4 · depth of field, 6 tap Poisson, strongest in the upper third.
  // Taps read uFrame only; uFrameNext contributes at the centre tap via col.
  float upper = smoothstep(0.55, 1.0, 1.0 - vUv.y);
  float blurAmt = (0.0015 + uSoften * 0.0055) * (0.35 + upper);
  if (blurAmt > 0.0016) {
    vec2 P[6];
    P[0] = vec2(0.94, 0.26); P[1] = vec2(-0.55, 0.81); P[2] = vec2(-0.72, -0.62);
    P[3] = vec2(0.34, -0.91); P[4] = vec2(0.11, 0.99); P[5] = vec2(-0.98, -0.12);
    vec3 acc = col;
    for (int i = 0; i < 6; i++) acc += sampleA(uv + pOff + P[i] * blurAmt);
    col = acc / 7.0;
  }
#else
  vec3 col = sampleFilm(uv + pOff);
#endif

  // EFFECT 6 · grade. Pull toward the ramp, then restore most of the original
  // luminance so faces keep their modelling and the plate stays readable.
  float l = luma(col);
  vec3 graded = ramp(l);
  col = mix(col, graded, uGrade);
  col *= mix(1.0, l / max(luma(col), 0.001), 0.65);
  col = pow(col, vec3(1.05));

  // EFFECT 7 · atmosphere. The act's gradient is the air the film is seen
  // through, so the page and the footage share one colour field.
  float vy = smoothstep(0.0, 1.0, vUv.y);
  vec3 ground = mix(uAtmTop, uAtmBottom, vy);
  col += ground * 1.35;

  // ember bloom rising off the lower edge, strongest in the late acts
  float bloom = smoothstep(1.0, 0.1, vUv.y) * uGlow;
  col += EMBER * bloom * 0.15 * (0.3 + 0.7 * l);

  // cut flare: a fast horizontal wipe of light on a hard cut
  if (uCut > 0.001) {
    float band = smoothstep(0.24, 0.0, abs(vUv.x - (1.0 - uCut) * 1.2 - 0.05));
    col += FLARE * band * uCut * 0.34;
    col += EMBER * uCut * 0.05;
  }

  // EFFECT 8 · animated grain, constant in screen pixels
  float g = hash(gl_FragCoord.xy + fract(uTime) * 100.0);
  col += (g - 0.5) * 0.032;

  // EFFECT 9 · vignette, then wash. Both fall to the act ground, never to a
  // neutral black that would sit outside the palette.
  float vig = 1.0 - smoothstep(0.45, 1.05, length(vUv - 0.5) * 1.42);
  vec3 floorCol = mix(ground, RUST * 0.35, 0.28);
  col = mix(floorCol, col, mix(0.44, 1.0, vig));
  col = mix(floorCol, col, uWash);

  outColor = vec4(col, 1.0);
}
