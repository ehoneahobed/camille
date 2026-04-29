// Ready Player Me 3D avatar via Three.js, with audio-reactive lip-sync.
// Uses official RPM glTF avatars and morph targets (visemes) for mouth movement.
// Loads Three.js + GLTFLoader from CDN at module-init.

const RPM_AVATARS = {
  female: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus%20Visemes',
  male:   'https://models.readyplayer.me/64bfa1505b0d2e3a98e94a78.glb?morphTargets=ARKit,Oculus%20Visemes',
};

const ensureThree = (() => {
  let p;
  return () => {
    if (p) return p;
    p = new Promise((resolve) => {
      const s1 = document.createElement('script');
      s1.src = 'https://unpkg.com/three@0.149.0/build/three.min.js';
      s1.onload = () => {
        const s2 = document.createElement('script');
        s2.src = 'https://unpkg.com/three@0.149.0/examples/js/loaders/GLTFLoader.js';
        s2.onload = () => resolve(window.THREE);
        s2.onerror = () => { console.error('GLTFLoader failed to load'); resolve(window.THREE); };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    });
    return p;
  };
})();

const RPMAvatar = ({ gender = 'female', state = 'idle', speechProgress = 0, size = 460 }) => {
  const mountRef = React.useRef(null);
  const apiRef = React.useRef({ ready: false });
  const [loaded, setLoaded] = React.useState(false);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    let rafId;
    let scene, camera, renderer, model, head, mixer;
    let morphMeshes = [];

    ensureThree().then((THREE) => {
      if (!mounted || !mountRef.current) return;
      const W = size, H = size;
      scene = new THREE.Scene();
      scene.background = null;

      camera = new THREE.PerspectiveCamera(20, W / H, 0.1, 100);
      camera.position.set(0, 1.62, 1.05);
      camera.lookAt(0, 1.62, 0);

      if (!THREE.GLTFLoader) { setErrored(true); return; }

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);

      // Cinematic lighting — key + rim
      const key = new THREE.DirectionalLight(0xfff1d6, 1.4);
      key.position.set(1.5, 2.2, 1.8);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xea580c, 0.9);
      rim.position.set(-1.6, 1.4, -1.2);
      scene.add(rim);
      const fill = new THREE.AmbientLight(0x4a5570, 0.45);
      scene.add(fill);

      const loader = new THREE.GLTFLoader();
      loader.load(
        RPM_AVATARS[gender] || RPM_AVATARS.female,
        (gltf) => {
          if (!mounted) return;
          model = gltf.scene;
          model.position.set(0, 0, 0);
          scene.add(model);
          model.traverse((o) => {
            if (o.isMesh && o.morphTargetDictionary) {
              morphMeshes.push(o);
            }
            if (o.isBone && /head/i.test(o.name) && !head) head = o;
          });
          apiRef.current = { ready: true, THREE, scene, camera, renderer, model, head, morphMeshes };
          setLoaded(true);
        },
        undefined,
        (err) => { console.error('RPM load failed', err); setErrored(true); }
      );

      const clock = new THREE.Clock();
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const api = apiRef.current;
        if (api.ready) {
          // Subtle idle sway
          if (api.model) {
            api.model.rotation.y = Math.sin(t * 0.4) * 0.04;
            api.model.position.y = Math.sin(t * 0.9) * 0.005;
          }
          // Head tilt by state
          if (api.head) {
            const targetX = api.stateRef === 'thinking' ? -0.10 : 0;
            const targetZ = api.stateRef === 'listening' ? 0.06 : 0;
            api.head.rotation.x += (targetX - api.head.rotation.x) * 0.06;
            api.head.rotation.z += (targetZ - api.head.rotation.z) * 0.06;
            api.head.rotation.y = Math.sin(t * 0.3) * 0.05;
          }
          // Visemes — drive mouth open while speaking
          api.morphMeshes.forEach((m) => {
            const dict = m.morphTargetDictionary;
            const inf = m.morphTargetInfluences;
            const setMorph = (name, v) => {
              const idx = dict[name];
              if (idx !== undefined) inf[idx] = v;
            };
            // Reset visemes
            ['viseme_aa','viseme_E','viseme_I','viseme_O','viseme_U','viseme_PP','viseme_FF','mouthOpen','mouthSmile']
              .forEach(n => setMorph(n, 0));

            if (api.stateRef === 'speaking') {
              const wob = Math.abs(Math.sin(t * 9.5));
              const wob2 = Math.abs(Math.sin(t * 6.2 + 1.2));
              setMorph('viseme_aa', wob * 0.55);
              setMorph('viseme_O', wob2 * 0.4);
              setMorph('viseme_E', Math.abs(Math.sin(t * 11.3)) * 0.3);
              setMorph('mouthOpen', wob * 0.35);
            } else if (api.stateRef === 'listening') {
              setMorph('mouthSmile', 0.25);
            } else if (api.stateRef === 'thinking') {
              setMorph('mouthSmile', 0.05);
            }

            // Blinks
            const blinkPhase = (t % 4.2) / 4.2;
            const blinking = blinkPhase > 0.96;
            const blinkV = blinking ? 1 : 0;
            setMorph('eyeBlinkLeft', blinkV);
            setMorph('eyeBlinkRight', blinkV);

            // Brow lift while listening
            if (api.stateRef === 'listening') {
              setMorph('browInnerUp', 0.35);
            } else {
              setMorph('browInnerUp', 0);
            }
          });
        }
        if (renderer && scene && camera) renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      mounted = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (renderer) renderer.dispose();
    };
  }, [gender, size]);

  // Push state into the rAF closure without retriggering load.
  React.useEffect(() => {
    apiRef.current.stateRef = state;
  }, [state]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div ref={mountRef} style={{ width: size, height: size }} />
      {!loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center text-mute font-mono text-[11px] uppercase tracking-[0.18em]">
          Loading Camille…
        </div>
      )}
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center text-mute2 font-mono text-[11px] uppercase tracking-[0.18em] text-center px-6">
          Couldn't load 3D avatar.<br/>Falling back to portrait.
        </div>
      )}
    </div>
  );
};

Object.assign(window, { RPMAvatar });
