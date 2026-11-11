import * as THREE from 'three';

/**
 * A jellyfish drawn as light: a glassy bell that squeezes and opens, fine
 * tentacles trailing from its rim, and four broader frilled arms beneath.
 * Used in the deep sea, and for the one that visits the wood.
 */

export const BODY_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uAmp;
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  varying float vFade;
  void main() {
    vec3 p = position;
    // The bell squeezes and opens: the rim moves most.
    float beat = sin(uTime * 1.6 + uPhase);
    float rim = smoothstep(0.6, -0.1, p.y);
    p.xz *= 1.0 + uAmp * beat * rim;
    p.y *= 1.0 - uAmp * 0.5 * beat;
    vP = position;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vFade = exp(-length(mv.xyz) * uFade);
    gl_Position = projectionMatrix * mv;
  }`;

const JELLY_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFlash;
  uniform float uTime;
  uniform float uPhase;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  varying float vFade;
  void main() {
    // Glassy: brightest where the surface turns away from the eye.
    float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
    float stripes = 0.5 + 0.5 * sin(atan(vP.z, vP.x) * 8.0);
    float margin = smoothstep(0.25, 0.0, abs(vP.y - 0.05));
    float beat = 0.6 + 0.4 * sin(uTime * 1.6 + uPhase);
    vec3 c = uColor * (0.16 + edge * 0.9 + stripes * 0.12 + margin * 0.55 * beat) + vec3(1.0) * uFlash * 0.8;
    gl_FragColor = vec4(c * vFade, 1.0);
  }`;

const RIBBON_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uFade;
  varying float vAlong;
  varying float vFade;
  void main() {
    vec3 p = position;
    // Tentacles trail and ripple, more the further they hang from the bell.
    float hang = -p.y;
    float off = modelMatrix[3].x * 3.0 + modelMatrix[3].z * 2.0;
    p.x += sin(hang * 2.4 - uTime * 2.2 + uPhase + off) * 0.11 * hang;
    p.z += cos(hang * 1.9 - uTime * 1.7 + uPhase + off) * 0.09 * hang;
    vAlong = hang;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFade = exp(-length(mv.xyz) * uFade);
    gl_Position = projectionMatrix * mv;
  }`;

const RIBBON_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uLength;
  uniform float uFlash;
  varying float vAlong;
  varying float vFade;
  void main() {
    float fade = 1.0 - vAlong / uLength;
    gl_FragColor = vec4((uColor * 0.42 + uFlash * 0.4) * fade * vFade, 1.0);
  }`;

export const glow = (params: THREE.ShaderMaterialParameters) =>
  new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...params });

const bellProfile: THREE.Vector2[] = [];
for (let i = 0; i <= 14; i++) {
  const a = (i / 14) * (Math.PI / 2);
  bellProfile.push(new THREE.Vector2(Math.sin(a), Math.cos(a) * 0.65));
}
bellProfile.push(new THREE.Vector2(0.9, -0.08));
const bellGeo = new THREE.LatheGeometry(bellProfile, 28);

export interface JellyOptions {
  /** A clock shared by everything that should move together. */
  time: { value: number };
  colour: THREE.Color;
  phase: number;
  /** How quickly it dims with distance: the sea is murky, the wood's air is clear. */
  fade?: number;
  random?: () => number;
}

export function makeJellyfish(o: JellyOptions): { group: THREE.Group; flash: { value: number } } {
  const rnd = o.random ?? Math.random;
  const flash = { value: 0 };
  const shared = { uTime: o.time, uPhase: { value: o.phase }, uColor: { value: o.colour }, uFlash: flash, uFade: { value: o.fade ?? 0.03 } };
  const group = new THREE.Group();
  group.add(new THREE.Mesh(bellGeo, glow({ uniforms: { ...shared, uAmp: { value: 0.22 } }, vertexShader: BODY_VERT, fragmentShader: JELLY_FRAG })));
  // Fine trailing tentacles round the rim, and four frilled arms beneath the middle.
  const strands = (count: number, ring: number, width: number, length: number) => {
    const mat = glow({ uniforms: { ...shared, uLength: { value: length } }, vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG });
    const geo = new THREE.PlaneGeometry(width, length, 1, 18).translate(0, -length / 2, 0);
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + rnd() * 0.3;
      const strand = new THREE.Mesh(geo, mat);
      strand.position.set(Math.cos(a) * ring, 0, Math.sin(a) * ring);
      strand.rotation.y = rnd() * 3.14;
      group.add(strand);
    }
  };
  strands(10, 0.86, 0.035, 2.6 + rnd() * 2);
  strands(4, 0.22, 0.2, 1.6 + rnd());
  return { group, flash };
}
