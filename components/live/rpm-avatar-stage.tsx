"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Ready Player Me glTF with ARKit + Oculus visemes (same sources as prototype). */
const RPM_AVATARS = {
  female:
    "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus%20Visemes",
  male: "https://models.readyplayer.me/64bfa1505b0d2e3a98e94a78.glb?morphTargets=ARKit,Oculus%20Visemes",
} as const;

export type AvatarGender = "female" | "male";
export type AvatarState = "idle" | "thinking" | "speaking" | "listening";

type ApiRef = {
  ready: boolean;
  stateRef: AvatarState;
  THREE?: typeof THREE;
  scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  renderer?: THREE.WebGLRenderer;
  model?: THREE.Object3D;
  head?: THREE.Bone;
  morphMeshes: THREE.Mesh[];
  clock?: THREE.Clock;
};

/**
 * 3D Ready Player Me avatar in a square stage (prototype `RPMAvatar`).
 * Loads only on the client; shows a styled fallback if WebGL or GLB fails.
 */
export function RpmAvatarStage({
  gender,
  state,
  size,
  className = "",
}: {
  gender: AvatarGender;
  state: AvatarState;
  size: number;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ApiRef>({
    ready: false,
    stateRef: state,
    morphMeshes: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    apiRef.current.stateRef = state;
  }, [state]);

  useEffect(() => {
    let mounted = true;
    let rafId = 0;
    let stopped = false;
    const api = apiRef.current;
    api.morphMeshes = [];
    api.ready = false;

    const mount = mountRef.current;
    if (!mount || size < 80) {
      return;
    }

    const W = size;
    const H = size;
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(20, W / H, 0.1, 100);
    camera.position.set(0, 1.62, 1.05);
    camera.lookAt(0, 1.62, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xfff1d6, 1.4);
    key.position.set(1.5, 2.2, 1.8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xea580c, 0.9);
    rim.position.set(-1.6, 1.4, -1.2);
    scene.add(rim);
    const fill = new THREE.AmbientLight(0x4a5570, 0.45);
    scene.add(fill);

    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    let model: THREE.Object3D | null = null;
    let head: THREE.Bone | null = null;
    const morphMeshes: THREE.Mesh[] = [];

    const onLoadError = () => {
      if (!mounted) return;
      stopped = true;
      cancelAnimationFrame(rafId);
      setErrored(true);
      try {
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      } catch {
        /* ignore */
      }
    };

    loader.load(
      RPM_AVATARS[gender] ?? RPM_AVATARS.female,
      (gltf) => {
        if (!mounted) return;
        model = gltf.scene;
        model.position.set(0, 0, 0);
        scene.add(model);
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            morphMeshes.push(mesh);
          }
          if (o instanceof THREE.Bone && /head/i.test(o.name) && !head) {
            head = o;
          }
        });
        api.ready = true;
        api.scene = scene;
        api.camera = camera;
        api.renderer = renderer;
        api.model = model;
        api.head = head ?? undefined;
        api.morphMeshes = morphMeshes;
        api.THREE = THREE;
        setLoaded(true);
      },
      undefined,
      onLoadError,
    );

    const setMorph = (
      mesh: THREE.Mesh,
      dict: Record<string, number>,
      influences: number[],
      name: string,
      v: number,
    ) => {
      const idx = dict[name];
      if (idx !== undefined) influences[idx] = v;
    };

    const animate = () => {
      if (stopped) return;
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (api.ready && api.model && api.renderer && api.camera && api.scene) {
        api.model.rotation.y = Math.sin(t * 0.4) * 0.04;
        api.model.position.y = Math.sin(t * 0.9) * 0.005;

        const headBone = api.head;
        if (headBone) {
          const st = api.stateRef;
          const targetX = st === "thinking" ? -0.1 : 0;
          const targetZ = st === "listening" ? 0.06 : 0;
          headBone.rotation.x += (targetX - headBone.rotation.x) * 0.06;
          headBone.rotation.z += (targetZ - headBone.rotation.z) * 0.06;
          headBone.rotation.y = Math.sin(t * 0.3) * 0.05;
        }

        const names = [
          "viseme_aa",
          "viseme_E",
          "viseme_I",
          "viseme_O",
          "viseme_U",
          "viseme_PP",
          "viseme_FF",
          "mouthOpen",
          "mouthSmile",
        ];

        for (const mesh of api.morphMeshes) {
          const dict = mesh.morphTargetDictionary;
          const inf = mesh.morphTargetInfluences;
          if (!dict || !inf) continue;
          for (const n of names) setMorph(mesh, dict, inf, n, 0);

          const st = api.stateRef;
          if (st === "speaking") {
            const wob = Math.abs(Math.sin(t * 9.5));
            const wob2 = Math.abs(Math.sin(t * 6.2 + 1.2));
            setMorph(mesh, dict, inf, "viseme_aa", wob * 0.55);
            setMorph(mesh, dict, inf, "viseme_O", wob2 * 0.4);
            setMorph(mesh, dict, inf, "viseme_E", Math.abs(Math.sin(t * 11.3)) * 0.3);
            setMorph(mesh, dict, inf, "mouthOpen", wob * 0.35);
          } else if (st === "listening") {
            setMorph(mesh, dict, inf, "mouthSmile", 0.25);
          } else if (st === "thinking") {
            setMorph(mesh, dict, inf, "mouthSmile", 0.05);
          }

          const blinkPhase = (t % 4.2) / 4.2;
          const blinkV = blinkPhase > 0.96 ? 1 : 0;
          setMorph(mesh, dict, inf, "eyeBlinkLeft", blinkV);
          setMorph(mesh, dict, inf, "eyeBlinkRight", blinkV);
          setMorph(mesh, dict, inf, "browInnerUp", st === "listening" ? 0.35 : 0);
        }

        api.renderer.render(api.scene, api.camera);
      }
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      mounted = false;
      stopped = true;
      cancelAnimationFrame(rafId);
      api.ready = false;
      void renderer.dispose();
      scene.clear();
      mount.innerHTML = "";
    };
  }, [gender, size]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div ref={mountRef} className="h-full w-full" />
      {!loaded && !errored ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
          Loading Camille…
        </div>
      ) : null}
      {errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas-2 px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute-2">
            3D avatar unavailable
          </p>
          <div className="flex h-40 w-40 items-center justify-center rounded-full border border-rule-2 bg-gradient-to-br from-canvas-3 to-canvas-2">
            <span className="font-display text-5xl text-wine/80">C</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
