import * as THREE from 'three';
import { noiseTexture } from './world/noiseTexture';

/**
 * The last step of every frame: turns the rendered wood into something closer
 * to an illustration. It wobbles edges slightly as a hand would, draws soft
 * ink lines where one shape passes in front of another, and lays the picture
 * on grainy paper with a darkened border.
 */
export class Finish {
  private target: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: THREE.ShaderMaterial;

  constructor(private renderer: THREE.WebGLRenderer) {
    this.target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
      depthTexture: new THREE.DepthTexture(1, 1),
    });
    this.material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: this.target.texture },
        tDepth: { value: this.target.depthTexture },
        uNoise: { value: noiseTexture },
        uSize: { value: new THREE.Vector2(1, 1) },
        uNear: { value: 0.3 },
        uFar: { value: 600 },
        uFog: { value: 0.004 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        #include <packing>
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform sampler2D uNoise;
        uniform vec2 uSize;
        uniform float uNear;
        uniform float uFar;
        uniform float uFog;
        varying vec2 vUv;

        // Distance from the eye, in world units.
        float dist(vec2 uv) {
          return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar);
        }

        void main() {
          vec2 px = 1.0 / uSize;
          float scale = uSize.y / 900.0; // keep the effect the same size on any screen
          vec2 paperUv = vUv * uSize / (scale * 512.0);

          // A hand does not draw straight: push every point a little off true.
          vec2 wobble = vec2(texture2D(uNoise, paperUv * 1.7).r, texture2D(uNoise, paperUv * 1.7 + 0.43).r) - 0.5;
          vec2 uv = vUv + wobble * px * 3.0 * scale;

          vec3 col = texture2D(tColor, uv).rgb;

          // Ink where depth jumps. Comparing 1/distance ignores flat ground
          // seen at a slant, so only real silhouettes get a line.
          vec2 o = px * 1.4 * scale;
          float c = 1.0 / dist(uv);
          float n = 1.0 / dist(uv + vec2(0.0, o.y));
          float s = 1.0 / dist(uv - vec2(0.0, o.y));
          float e = 1.0 / dist(uv + vec2(o.x, 0.0));
          float w = 1.0 / dist(uv - vec2(o.x, 0.0));
          float jump = abs(n + s + e + w - 4.0 * c) / c;
          float ink = smoothstep(0.012, 0.05, jump);
          // Lines thin out with distance into the mist, and break up like a dry brush.
          float d = 1.0 / max(c, n);
          ink *= exp(-pow(uFog * d * 1.3, 2.0));
          ink *= 0.55 + 0.45 * texture2D(uNoise, paperUv * 6.0).r;
          col = mix(col, col * vec3(0.16, 0.24, 0.27), ink * 0.8);

          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>

          // Richer pigment than a renderer gives by default.
          float grey = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11));
          gl_FragColor.rgb = mix(vec3(grey), gl_FragColor.rgb, 1.22);
          gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * 1.08 + 0.52;

          // Paper: fine tooth, and a broad uneven wash where pigment pooled.
          vec2 cell = floor(gl_FragCoord.xy / max(1.0, floor(scale * 1.5)));
          float tooth = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
          float washA = texture2D(uNoise, paperUv * 0.8 + 0.2).r;
          gl_FragColor.rgb *= 0.95 + 0.06 * tooth + 0.08 * (washA - 0.5);

          // The picture fades into bare paper-shadow at the corners.
          vec2 q = vUv - 0.5;
          float corner = smoothstep(0.35, 0.95, length(q * vec2(1.0, 1.15)) + (washA - 0.5) * 0.12);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.55, 0.62, 0.55), corner * 0.5);
        }`,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  resize(): void {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.target.setSize(size.x, size.y);
    this.material.uniforms.uSize.value.copy(size);
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, fogDensity: number): void {
    const u = this.material.uniforms;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uFog.value = fogDensity;
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}
