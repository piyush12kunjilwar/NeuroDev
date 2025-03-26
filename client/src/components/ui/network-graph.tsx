import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface NetworkGraphProps {
  numNodes?: number;
  className?: string;
}

export function NetworkGraph({ numNodes = 50, className }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    nodes: THREE.Mesh[];
    lines: THREE.Line[];
    frameId: number | null;
  } | null>(null);

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Create nodes (spheres)
    const nodes: THREE.Mesh[] = [];
    const lines: THREE.Line[] = [];
    
    // Node material
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x4f46e5 }); // Primary color
    const highlightNodeMaterial = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Accent color
    
    // Line material
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x64748b, // Medium gray
      transparent: true,
      opacity: 0.3
    });
    
    // Create nodes and position them randomly
    for (let i = 0; i < numNodes; i++) {
      const geometry = new THREE.SphereGeometry(
        Math.random() * 0.3 + 0.2, // Random size between 0.2 and 0.5
        16, 
        16
      );
      
      // Use highlight material for some nodes to represent active compute contributors
      const material = Math.random() > 0.8 ? highlightNodeMaterial : nodeMaterial;
      
      const sphere = new THREE.Mesh(geometry, material);
      
      // Random position within a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = Math.random() * 15 + 5;
      
      sphere.position.x = radius * Math.sin(phi) * Math.cos(theta);
      sphere.position.y = radius * Math.sin(phi) * Math.sin(theta);
      sphere.position.z = radius * Math.cos(phi);
      
      scene.add(sphere);
      nodes.push(sphere);
    }
    
    // Create connections between some nodes
    for (let i = 0; i < numNodes; i++) {
      // Connect to 2-5 random nodes
      const numConnections = Math.floor(Math.random() * 4) + 2;
      
      for (let j = 0; j < numConnections; j++) {
        const targetIdx = Math.floor(Math.random() * numNodes);
        if (targetIdx !== i) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position,
            nodes[targetIdx].position
          ]);
          
          const line = new THREE.Line(lineGeometry, lineMaterial);
          scene.add(line);
          lines.push(line);
        }
      }
    }
    
    // Animation function
    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      
      // Rotate the entire scene slightly
      scene.rotation.y += 0.001;
      
      // Update node positions with subtle movements
      nodes.forEach((node) => {
        node.position.x += Math.sin(Date.now() * 0.001 + node.position.y) * 0.01;
        node.position.y += Math.cos(Date.now() * 0.001 + node.position.x) * 0.01;
        node.position.z += Math.sin(Date.now() * 0.0005) * 0.01;
      });
      
      // Update line positions based on connected nodes
      lines.forEach((line) => {
        const positions = line.geometry.attributes.position.array;
        // This assumes the lines were created with exactly 2 points
        if (positions.length === 6) {
          // The positions array has [x1, y1, z1, x2, y2, z2] format
          const startNodeIdx = Math.floor(Math.random() * nodes.length);
          const endNodeIdx = Math.floor(Math.random() * nodes.length);
          
          positions[0] = nodes[startNodeIdx].position.x;
          positions[1] = nodes[startNodeIdx].position.y;
          positions[2] = nodes[startNodeIdx].position.z;
          
          positions[3] = nodes[endNodeIdx].position.x;
          positions[4] = nodes[endNodeIdx].position.y;
          positions[5] = nodes[endNodeIdx].position.z;
          
          line.geometry.attributes.position.needsUpdate = true;
        }
      });
      
      controls.update();
      renderer.render(scene, camera);
      
      if (sceneRef.current) {
        sceneRef.current.frameId = frameId;
      }
    };
    
    // Start animation
    animate();
    
    // Store references for cleanup
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      nodes,
      lines,
      frameId: null
    };
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      
      const { camera, renderer } = sceneRef.current;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current) {
        if (sceneRef.current.frameId !== null) {
          cancelAnimationFrame(sceneRef.current.frameId);
        }
        
        if (containerRef.current) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        
        // Dispose geometries and materials
        sceneRef.current.nodes.forEach(node => {
          node.geometry.dispose();
          if (node.material instanceof THREE.Material) {
            node.material.dispose();
          }
        });
        
        sceneRef.current.lines.forEach(line => {
          line.geometry.dispose();
          if (line.material instanceof THREE.Material) {
            line.material.dispose();
          }
        });
      }
    };
  }, [numNodes]);
  
  return <div ref={containerRef} className={className} />;
}
