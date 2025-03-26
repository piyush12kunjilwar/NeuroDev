import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ModelVisualizationProps {
  className?: string;
}

export function ModelVisualization({ className }: ModelVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    layers: THREE.Group[];
    connections: THREE.Line[];
    frameId: number | null;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    
    // Add a subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 15);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Create CNN model visualization (simplified for MNIST classifier)
    const layers: THREE.Group[] = [];
    const connections: THREE.Line[] = [];
    
    // Define network architecture for MNIST classifier
    // Input layer (28x28)
    // Conv layer 1 (26x26)
    // Conv layer 2 (24x24)
    // Pooling layer (12x12)
    // Fully connected layer (128 neurons)
    // Output layer (10 neurons)
    
    // Colors
    const layerMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x4F46E5, shininess: 80 }), // Primary (Input)
      new THREE.MeshPhongMaterial({ color: 0x818CF8, shininess: 80 }), // Primary lighter (Conv1)
      new THREE.MeshPhongMaterial({ color: 0x10B981, shininess: 80 }), // Secondary (Conv2)
      new THREE.MeshPhongMaterial({ color: 0x34D399, shininess: 80 }), // Secondary lighter (Pooling)
      new THREE.MeshPhongMaterial({ color: 0xF59E0B, shininess: 80 }), // Accent (FC)
      new THREE.MeshPhongMaterial({ color: 0xFBBF24, shininess: 80 })  // Accent lighter (Output)
    ];
    
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x64748B,
      transparent: true,
      opacity: 0.15
    });
    
    // Function to create a layer of nodes
    const createLayer = (
      nodeCount: number, 
      position: THREE.Vector3,
      material: THREE.Material,
      nodeSize: number,
      arrangement: 'grid' | 'line' = 'line',
      dimensions?: { width: number, height: number }
    ) => {
      const group = new THREE.Group();
      group.position.copy(position);
      
      if (arrangement === 'grid' && dimensions) {
        // Create nodes in a grid arrangement
        const { width, height } = dimensions;
        const nodeWidth = width / Math.sqrt(nodeCount);
        const nodeHeight = height / Math.sqrt(nodeCount);
        
        const rows = Math.sqrt(nodeCount);
        const cols = Math.sqrt(nodeCount);
        
        // Adjust for the center of the grid
        const offsetX = (cols - 1) * nodeWidth * 0.5;
        const offsetY = (rows - 1) * nodeHeight * 0.5;
        
        let idx = 0;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (idx < nodeCount) {
              const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
              const node = new THREE.Mesh(nodeGeometry, material);
              
              node.position.set(
                j * nodeWidth - offsetX,
                i * nodeHeight - offsetY,
                0
              );
              
              group.add(node);
              idx++;
            }
          }
        }
      } else {
        // Create nodes in a vertical line
        const spacing = nodeCount > 1 ? 0.5 : 0;
        const totalHeight = (nodeCount - 1) * spacing;
        
        for (let i = 0; i < nodeCount; i++) {
          const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
          const node = new THREE.Mesh(nodeGeometry, material);
          
          node.position.y = (i * spacing) - (totalHeight / 2);
          group.add(node);
        }
      }
      
      scene.add(group);
      return group;
    };
    
    // Function to create connections between layers
    const connectLayers = (sourceLayer: THREE.Group, targetLayer: THREE.Group, density: number = 0.1) => {
      const sourceNodes = sourceLayer.children as THREE.Mesh[];
      const targetNodes = targetLayer.children as THREE.Mesh[];
      
      // Connect some random nodes based on density
      for (let i = 0; i < sourceNodes.length; i++) {
        for (let j = 0; j < targetNodes.length; j++) {
          if (Math.random() < density) {
            const sourcePos = new THREE.Vector3();
            sourceNodes[i].getWorldPosition(sourcePos);
            
            const targetPos = new THREE.Vector3();
            targetNodes[j].getWorldPosition(targetPos);
            
            const points = [sourcePos, targetPos];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const line = new THREE.Line(geometry, connectionMaterial);
            scene.add(line);
            connections.push(line);
          }
        }
      }
    };
    
    // Create network layers
    // Input layer - Visualize as a grid (28x28)
    const inputLayer = createLayer(
      49, // Simplified from 784 (28x28) for performance
      new THREE.Vector3(-10, 0, 0),
      layerMaterials[0],
      0.15,
      'grid',
      { width: 4, height: 4 }
    );
    layers.push(inputLayer);
    
    // Convolutional layer 1
    const conv1Layer = createLayer(
      36, // Simplified
      new THREE.Vector3(-6, 0, 0),
      layerMaterials[1],
      0.13,
      'grid',
      { width: 3.5, height: 3.5 }
    );
    layers.push(conv1Layer);
    
    // Convolutional layer 2
    const conv2Layer = createLayer(
      25, // Simplified
      new THREE.Vector3(-2, 0, 0),
      layerMaterials[2],
      0.12,
      'grid',
      { width: 3, height: 3 }
    );
    layers.push(conv2Layer);
    
    // Pooling layer
    const poolingLayer = createLayer(
      16, // Simplified
      new THREE.Vector3(2, 0, 0),
      layerMaterials[3],
      0.1,
      'grid',
      { width: 2.5, height: 2.5 }
    );
    layers.push(poolingLayer);
    
    // Fully connected layer
    const fcLayer = createLayer(
      24, // Simplified from 128
      new THREE.Vector3(6, 0, 0),
      layerMaterials[4],
      0.12,
      'line'
    );
    layers.push(fcLayer);
    
    // Output layer (10 nodes for digits 0-9)
    const outputLayer = createLayer(
      10,
      new THREE.Vector3(10, 0, 0),
      layerMaterials[5],
      0.15,
      'line'
    );
    layers.push(outputLayer);
    
    // Connect layers
    connectLayers(inputLayer, conv1Layer, 0.02);
    connectLayers(conv1Layer, conv2Layer, 0.04);
    connectLayers(conv2Layer, poolingLayer, 0.06);
    connectLayers(poolingLayer, fcLayer, 0.08);
    connectLayers(fcLayer, outputLayer, 0.1);
    
    // Animation function
    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      
      // Add subtle animation to the model
      layers.forEach((layer, i) => {
        layer.rotation.y = Math.sin(Date.now() * 0.0005 + i * 0.2) * 0.05;
        layer.position.y = Math.sin(Date.now() * 0.0002 + i * 0.5) * 0.1;
      });
      
      // Pulse effect for nodes (activation simulation)
      layers.forEach((layer) => {
        layer.children.forEach((node) => {
          if (Math.random() < 0.01) {
            // Randomly activate some nodes
            const mesh = node as THREE.Mesh;
            if (mesh.material instanceof THREE.MeshPhongMaterial) {
              const originalColor = mesh.material.color.clone();
              mesh.material.emissive.set(0xffffff);
              
              // Reset after a short delay
              setTimeout(() => {
                if (mesh.material instanceof THREE.MeshPhongMaterial) {
                  mesh.material.emissive.set(0x000000);
                }
              }, 200);
            }
          }
        });
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
      layers,
      connections,
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
        sceneRef.current.layers.forEach(layer => {
          layer.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (child.material instanceof THREE.Material) {
                child.material.dispose();
              }
            }
          });
        });
        
        sceneRef.current.connections.forEach(line => {
          line.geometry.dispose();
          if (line.material instanceof THREE.Material) {
            line.material.dispose();
          }
        });
      }
    };
  }, []);
  
  return (
    <div className={className} ref={containerRef}>
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 z-10">
        <button className="inline-flex items-center px-2 py-1 bg-white bg-opacity-90 rounded-md shadow text-sm text-gray-700 hover:bg-opacity-100 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button className="inline-flex items-center px-2 py-1 bg-white bg-opacity-90 rounded-md shadow text-sm text-gray-700 hover:bg-opacity-100 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button className="inline-flex items-center px-2 py-1 bg-white bg-opacity-90 rounded-md shadow text-sm text-gray-700 hover:bg-opacity-100 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
