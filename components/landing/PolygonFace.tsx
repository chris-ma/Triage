"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FACE_POSITIONS, FACE_INDICES } from "@/lib/mesh/faceMesh";

export default function PolygonFace() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 3.9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Real face topology — the 468-vertex canonical mesh used by face landmark
    // detection, rather than a deformed primitive.
    const base = new THREE.BufferGeometry();
    base.setAttribute("position", new THREE.Float32BufferAttribute(FACE_POSITIONS, 3));
    base.setIndex(FACE_INDICES);
    base.computeVertexNormals();

    // WireframeGeometry (not EdgesGeometry) so every triangle edge is drawn —
    // EdgesGeometry would merge near-coplanar faces and thin out the mesh.
    const wireGeo = new THREE.WireframeGeometry(base);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x374151,
      transparent: true,
      opacity: 0.1,
    });
    const lines = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(lines);

    // Vertex dots — these sit exactly on the 468 landmark points
    const dotsMat = new THREE.PointsMaterial({
      color: 0x374151,
      size: 0.018,
      transparent: true,
      opacity: 0.28,
      sizeAttenuation: true,
    });
    const dots = new THREE.Points(base, dotsMat);
    scene.add(dots);

    // Interaction
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let isPointerActive = false;
    let scrollY = 0;

    function onMouseMove(e: MouseEvent) {
      isPointerActive = true;
      target.x = ((e.clientX / window.innerWidth) - 0.5) * 0.65;
      target.y = -((e.clientY / window.innerHeight) - 0.5) * 0.45;
    }

    function onTouchMove(e: TouchEvent) {
      if (!e.touches[0]) return;
      isPointerActive = true;
      target.x = ((e.touches[0].clientX / window.innerWidth) - 0.5) * 0.65;
      target.y = -((e.touches[0].clientY / window.innerHeight) - 0.5) * 0.45;
    }

    function onPointerLeave() { isPointerActive = false; }
    function onScroll() { scrollY = window.scrollY; }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    let raf = 0;
    let t = 0;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      t += delta;

      const idleX = isPointerActive ? 0 : Math.sin(t * 0.27) * 0.07;
      const idleY = isPointerActive ? 0 : Math.sin(t * 0.18) * 0.04;

      current.x += ((target.x + idleX) - current.x) * 0.045;
      current.y += ((target.y + idleY) - current.y) * 0.045;

      lines.rotation.y = current.x;
      lines.rotation.x = current.y;
      dots.rotation.y = current.x;
      dots.rotation.x = current.y;

      // Breathing
      const breathe = 1 + Math.sin(t * 0.55) * 0.007;
      lines.scale.setScalar(breathe);
      dots.scale.setScalar(breathe);

      // Scroll parallax
      lines.position.y = -scrollY * 0.0018;
      dots.position.y = -scrollY * 0.0018;

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
      base.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      dotsMat.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
