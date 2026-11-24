import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type CorePreset = 'orbital' | 'resonance' | 'aligned';

// Pre-allocated scratch math helpers outside the render loop (zero GC)
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export const ThreeCoreCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const presetRef = useRef<CorePreset>('orbital');
  const [preset, setPreset] = useState<CorePreset>('orbital');
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let width = Math.max(260, container.clientWidth);
    let height = Math.max(260, container.clientHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070306, 0.06);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 40);
    camera.position.set(0, 0.75, 5.1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Studio reflection environment for PBR metals & crystal refraction
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Three-point warm crimson / cool lavender lighting rig
    const keyLight = new THREE.DirectionalLight(0xffb4c8, 2.2);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xd9c6ec, 0x2a0815, 0.85);
    scene.add(hemiLight);

    const rimLight = new THREE.PointLight(0xf45b84, 5.5, 16, 1.5);
    rimLight.position.set(-3.2, -1.8, -2.5);
    scene.add(rimLight);

    // Composite Multi-Part 3D Core Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Part 1: Outer Faceted Obsidian-Wine Armor Cage (wireframe + beveled metallic lattice)
    const cageGeo = new THREE.IcosahedronGeometry(1.06, 0);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x2d0917,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // Part 2: Primary Faceted Burgundy Core
    const coreGeo = new THREE.IcosahedronGeometry(0.84, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x4d0c24,
      emissive: 0x2a0512,
      emissiveIntensity: 0.55,
      metalness: 0.78,
      roughness: 0.34,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Part 3: Inner Translucent Rose-Quartz Crystal Prism
    const prismGeo = new THREE.OctahedronGeometry(0.56, 0);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd1e0,
      emissive: 0xf45b84,
      emissiveIntensity: 0.42,
      metalness: 0.05,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: isSoftwareGl ? 0.55 : 1,
      ior: 1.68,
      thickness: 1.4,
      clearcoat: 1.0,
      attenuationColor: new THREE.Color(0xf45b84),
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    coreGroup.add(prismMesh);

    // Part 4: Primary Rose-Gold Inclined Orbital Ring
    const outerRingGeo = new THREE.TorusGeometry(1.66, 0.032, 20, 96);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0xf6a6c1,
      emissive: 0x5c112a,
      emissiveIntensity: 0.35,
      metalness: 0.94,
      roughness: 0.16,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.set(Math.PI * 0.34, Math.PI * 0.12, 0);
    coreGroup.add(outerRing);

    // Part 5: Secondary Anodized Wine Gimbal Ring
    const innerRingGeo = new THREE.TorusGeometry(1.34, 0.024, 16, 84);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0xd9c6ec,
      metalness: 0.72,
      roughness: 0.46,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.set(-Math.PI * 0.28, -Math.PI * 0.22, 0);
    coreGroup.add(innerRing);

    // Part 6: Instanced Orbiting Constellation Satellites (28 nodes)
    const satCount = 28;
    const satGeo = new THREE.OctahedronGeometry(0.046, 0);
    const satMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf45b84,
      emissiveIntensity: 0.75,
      metalness: 0.4,
      roughness: 0.22,
    });
    const satInstanced = new THREE.InstancedMesh(satGeo, satMat, satCount);
    const satAngles: number[] = [];
    const satRadii: number[] = [];
    const satHeights: number[] = [];
    const satScales: number[] = [];
    const satColors = [0xf45b84, 0xfaf4f6, 0xd9c6ec, 0xfb7185];

    for (let i = 0; i < satCount; i++) {
      satAngles.push((i / satCount) * Math.PI * 2);
      satRadii.push(1.85 + (i % 3) * 0.22);
      satHeights.push(Math.sin(i * 1.4) * 0.35);
      satScales.push(0.85 + (i % 4) * 0.12);
      _color.setHex(satColors[i % satColors.length]);
      satInstanced.setColorAt(i, _color);
    }
    satInstanced.frustumCulled = false;
    coreGroup.add(satInstanced);

    // Subtle radial shadow / glow disc grounding the sculpture
    const discGeo = new THREE.CircleGeometry(1.7, 48);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x4d0c24,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const baseDisc = new THREE.Mesh(discGeo, discMat);
    baseDisc.rotation.x = -Math.PI / 2;
    baseDisc.position.y = -1.72;
    scene.add(baseDisc);

    // OrbitControls (zoom disabled to never capture page scroll)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl && !reducedMotion;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.65;

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    const updateSatellites = (elapsed: number) => {
      const mode = presetRef.current;
      const spread = mode === 'resonance' ? 1.18 : mode === 'aligned' ? 0.92 : 1.0;
      for (let i = 0; i < satCount; i++) {
        const a = satAngles[i] + elapsed * (0.28 + (i % 3) * 0.07);
        const r = satRadii[i] * spread;
        const y = mode === 'aligned' ? 0 : satHeights[i] * Math.cos(elapsed * 0.7 + i);
        _dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        _dummy.rotation.set(a, a * 0.6, 0);
        _dummy.scale.setScalar(satScales[i]);
        _dummy.updateMatrix();
        satInstanced.setMatrixAt(i, _dummy.matrix);
      }
      satInstanced.instanceMatrix.needsUpdate = true;
    };

    updateSatellites(0);
    satInstanced.computeBoundingSphere();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const mode = presetRef.current;

      if (!reducedMotion) {
        const speedMul = mode === 'resonance' ? 1.55 : mode === 'aligned' ? 0.55 : 1.0;
        coreMesh.rotation.y += delta * 0.35 * speedMul;
        coreMesh.rotation.x += delta * 0.14 * speedMul;
        cageMesh.rotation.y -= delta * 0.22 * speedMul;
        prismMesh.rotation.y += delta * 0.65 * speedMul;

        const targetScale = mode === 'resonance' ? 1.14 : 1.0;
        const currentScale = cageMesh.scale.x;
        const nextScale = THREE.MathUtils.damp(currentScale, targetScale, 5, delta);
        cageMesh.scale.setScalar(nextScale);

        const targetRingTilt = mode === 'aligned' ? 0 : Math.PI * 0.34;
        outerRing.rotation.x = THREE.MathUtils.damp(outerRing.rotation.x, targetRingTilt, 4.5, delta);
        outerRing.rotation.z += delta * 0.28 * speedMul;
        innerRing.rotation.y -= delta * 0.34 * speedMul;
        innerRing.rotation.x = THREE.MathUtils.damp(
          innerRing.rotation.x,
          mode === 'aligned' ? 0 : -Math.PI * 0.28,
          4.5,
          delta
        );

        coreGroup.position.y = Math.sin(elapsed * 1.1) * 0.08;
        updateSatellites(elapsed);
      }

      controls.update();
      renderer.render(scene, camera);

      if (!reducedMotion) {
        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      }
    };

    // Initial render + loop
    if (reducedMotion) {
      renderer.render(scene, camera);
    } else {
      tick();
    }

    const onControlChange = () => {
      if (reducedMotion) {
        renderer.render(scene, camera);
      }
    };
    controls.addEventListener('change', onControlChange);

    const handleResize = () => {
      if (!container || disposed) return;
      width = Math.max(260, container.clientWidth);
      height = Math.max(260, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (reducedMotion) renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      cageGeo.dispose();
      cageMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      prismGeo.dispose();
      prismMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      discGeo.dispose();
      discMat.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-[360px] sm:h-[430px] lg:h-[480px] ${className}`}>
      {contextLost ? (
        <div className="w-full h-full rounded-2xl border border-rose-400/20 bg-[#14050B]/85 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#4D0C24] via-[#F45B84] to-[#D9C6EC] opacity-85" />
          <p className="text-xs font-mono text-rose-200/90">NEXORA Spatial Core</p>
        </div>
      ) : (
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D NEXORA Core Sculpture — drag to rotate"
        />
      )}

      {/* Compact Non-Obstructive Bottom Mode Switcher (Zero backdrop-filter over WebGL) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-xl bg-[#12040A]/90 border border-rose-300/20">
        {(
          [
            { id: 'orbital', label: 'Orbital' },
            { id: 'resonance', label: 'Expand' },
            { id: 'aligned', label: 'Align' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              preset === item.id
                ? 'bg-[#6E1233] text-[#FAF4F6]'
                : 'text-[#D8C7CE]/75 hover:text-[#FAF4F6]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
