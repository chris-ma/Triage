"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PolygonFace() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Geometry — icosahedron displaced into a head-like shape
    const geo = new THREE.IcosahedronGeometry(1, 3);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Elongate vertically (head is taller than wide)
      const ny = y * 1.22;
      // Taper chin
      const chinFactor = y < -0.3 ? 1 - (Math.abs(y + 0.3) * 0.35) : 1;
      const nx = x * chinFactor * 0.92;
      const nz = z * chinFactor * 0.88;

      // Eye socket indentations (front-facing, two slight depressions)
      const eyeL = Math.sqrt((x + 0.32) ** 2 + (y - 0.18) ** 2 + (z - 0.85) ** 2);
      const eyeR = Math.sqrt((x - 0.32) ** 2 + (y - 0.18) ** 2 + (z - 0.85) ** 2);
      const eyeDent = Math.max(0, 1 - eyeL * 4) * 0.07 + Math.max(0, 1 - eyeR * 4) * 0.07;

      // Nose bridge slight protrusion
      const nose = Math.max(0, 1 - Math.sqrt(x ** 2 + (y + 0.05) ** 2 + (z - 0.92) ** 2) * 5) * 0.06;

      const scale = 1 - eyeDent + nose;
      pos.setXYZ(i, nx * scale, ny, nz * scale);
    }

    geo.computeVertexNormals();

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const mat = new THREE.MeshPhongMaterial({
      color: isDark ? 0xd4cfc8 : 0xf0ede8,
      specular: 0x222222,
      shininess: 8,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Ground shadow ellipse
    const shadowGeo = new THREE.CircleGeometry(0.72, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x000000 : 0x000000,
      transparent: true,
      opacity: 0.07,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -1.35, 0);
    scene.add(shadow);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.3);
    keyLight.position.set(-2, 3, 2);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xc8d8f0, 0.55);
    fillLight.position.set(3, -1, 1);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0xffffff, 0.4, 10);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    // Interaction state
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let isPointerActive = false;
    let scrollY = 0;

    function onMouseMove(e: MouseEvent) {
      isPointerActive = true;
      target.x = ((e.clientX / window.innerWidth) - 0.5) * 0.7;
      target.y = -((e.clientY / window.innerHeight) - 0.5) * 0.5;
    }

    function onTouchMove(e: TouchEvent) {
      if (!e.touches[0]) return;
      isPointerActive = true;
      target.x = ((e.touches[0].clientX / window.innerWidth) - 0.5) * 0.7;
      target.y = -((e.touches[0].clientY / window.innerHeight) - 0.5) * 0.5;
    }

    function onPointerLeave() {
      isPointerActive = false;
    }

    function onScroll() {
      scrollY = window.scrollY;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Resize
    const ro = new ResizeObserver(() => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    // Animation loop
    let raf = 0;
    let t = 0;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      t += delta;

      // Idle drift when no pointer input
      const idleX = isPointerActive ? 0 : Math.sin(t * 0.28) * 0.08;
      const idleY = isPointerActive ? 0 : Math.sin(t * 0.19) * 0.05;

      // Damp toward target
      current.x += ((target.x + idleX) - current.x) * 0.045;
      current.y += ((target.y + idleY) - current.y) * 0.045;

      mesh.rotation.y = current.x;
      mesh.rotation.x = current.y;

      // Subtle breathing scale
      const breathe = 1 + Math.sin(t * 0.6) * 0.008;
      mesh.scale.setScalar(breathe);

      // Scroll parallax
      mesh.position.y = -scrollY * 0.002;
      shadow.position.y = -1.35 - scrollY * 0.002;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
