import React, { 
  useEffect, 
  useLayoutEffect, 
  useRef, 
  useState 
} from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart } from 'lucide-react';
import './HeroSection.css'; 

import { useUserProfile } from '@/hooks/useUserProfile';

gsap.registerPlugin(ScrollTrigger);

interface ComponentProps {
  onComplete?: () => void;
}

export const Component = ({ onComplete }: ComponentProps) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const scrollProgressRef = useRef(null);
  const menuRef = useRef(null);
  const ctaButtonRef = useRef(null);

  const { profile, loading: profileLoading } = useUserProfile();
  const [userName, setUserName] = useState(""); 

  const smoothCameraPos = useRef({ x: 0, y: 30, z: 400 });
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  // States to manage the "Jump" prevention
  const [isScrollReady, setIsScrollReady] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  
  const [showCTAButton, setShowCTAButton] = useState(false);
  const totalSections = 2;

  const threeRefs = useRef({
    scene: null as any,
    camera: null as any,
    renderer: null as any,
    composer: null as any,
    stars: [] as any[],
    nebula: null as any,
    mountains: [] as any[],
    animationId: null as any,
    targetCameraX: 0,
    targetCameraY: 0,
    targetCameraZ: 0, 
    locations: [] as number[],
  });

  // --- 1. SCROLL MANAGEMENT & INITIAL POSITIONING ---
  useEffect(() => {
    document.body.classList.add('enable-scroll');
    document.documentElement.classList.add('enable-scroll');
    
    // Wait for DOM to stabilize
    setTimeout(() => {
      const totalHeight = document.body.scrollHeight;
      const position9Percent = totalHeight * 0.09; 
      
      // Instant jump so the user never sees the movement
      window.scrollTo({ top: position9Percent, behavior: 'instant' }); 
      
      ScrollTrigger.refresh();
      setIsScrollReady(true); // Allow fade-in only after scroll is done
    }, 100);

    return () => {
      document.body.classList.remove('enable-scroll');
      document.documentElement.classList.remove('enable-scroll');
    };
  }, []);

  // --- 2. DATA LOADING (Prevents "Welcome... Name" jump) ---
  useEffect(() => {
    if (profileLoading) return;
    
    if (profile && profile.first_name) {
      setUserName(profile.first_name.toUpperCase());
    } else {
      setUserName("RISHUL"); 
    }
    
    // Only mark data as ready when we have the final name
    setIsDataReady(true);
  }, [profile, profileLoading]);

  // --- 3. THREE.JS INIT ---
  useEffect(() => {
    const initThree = () => {
      const { current: refs } = threeRefs;
      
      const width = window.innerWidth;
      const height = window.innerHeight;

      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x000000, 0.0003); 
      refs.scene.background = new THREE.Color(0x000000);

      refs.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 3000);
      refs.camera.position.z = 400; 
      refs.camera.position.y = 20;

      refs.renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false 
      });
      
      refs.renderer.setSize(width, height);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.4; 

      refs.composer = new EffectComposer(refs.renderer);
      refs.composer.setSize(width, height);

      const renderPass = new RenderPass(refs.scene, refs.camera);
      refs.composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.5,
        0.4,
        0.9
      );
      refs.composer.addPass(bloomPass);

      createStarField();
      createNebula();
      createMountains();
      createAtmosphere();
      getLocation();
      animate();
      setIsReady(true);
    };

    const createStarField = () => {
      const { current: refs } = threeRefs;
      const starCount = 5000;

      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let j = 0; j < starCount; j++) {
          const radius = 200 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);

          positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[j * 3 + 2] = radius * Math.cos(phi);

          const color = new THREE.Color();
          const colorChoice = Math.random();
          if (colorChoice < 0.7) {
            color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
          } else if (colorChoice < 0.9) {
            color.setHSL(0.08, 0.5, 0.8);
          } else {
            color.setHSL(0.6, 0.5, 0.8);
          }

          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;
          sizes[j] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            depth: { value: i }
          },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float depth;
            void main() {
              vColor = color;
              vec3 pos = position;
              float angle = time * 0.05 * (1.0 - depth * 0.3);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const stars = new THREE.Points(geometry, material);
        refs.scene.add(stars);
        refs.stars.push(stars);
      }
    };

    const createNebula = () => {
      const { current: refs } = threeRefs;
      const geometry = new THREE.PlaneGeometry(8000, 4000, 100, 100);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0x0033ff) },
          color2: { value: new THREE.Color(0xff0066) },
          opacity: { value: 0.15 } 
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vElevation;
          uniform float time;
          void main() {
            vUv = uv;
            vec3 pos = position;
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
            pos.z += elevation;
            vElevation = elevation;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          varying float vElevation;
          void main() {
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.01;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -1050;
      refs.scene.add(nebula);
      refs.nebula = nebula;
    };

    const createMountains = () => {
      const { current: refs } = threeRefs;
      const layers = [
        { distance: -50, height: 60, color: 0x1a1a2e, opacity: 1 },
        { distance: -100, height: 80, color: 0x16213e, opacity: 0.8 },
        { distance: -150, height: 100, color: 0x0f3460, opacity: 0.6 },
        { distance: -200, height: 120, color: 0x0a4668, opacity: 0.4 }
      ];

      layers.forEach((layer, index) => {
        const points = [];
        const segments = 50;
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1000;
          const y = Math.sin(i * 0.1) * layer.height +
                   Math.sin(i * 0.05) * layer.height * 0.5 +
                   Math.random() * layer.height * 0.2 - 100;
          points.push(new THREE.Vector2(x, y));
        }
        points.push(new THREE.Vector2(5000, -300));
        points.push(new THREE.Vector2(-5000, -300));

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide
        });

        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance;
        mountain.position.y = layer.distance;
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene.add(mountain);
        refs.mountains.push(mountain);
      });
    };

    const createAtmosphere = () => {
      const { current: refs } = threeRefs;
      const geometry = new THREE.SphereGeometry(600, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;
            float pulse = sin(time * 2.0) * 0.1 + 0.9;
            atmosphere *= pulse;
            gl_FragColor = vec4(atmosphere, intensity * 0.25);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
      });
      const atmosphere = new THREE.Mesh(geometry, material);
      refs.scene.add(atmosphere);
    };

    const getLocation = () => {
      const { current: refs } = threeRefs;
      const locations = [];
      refs.mountains.forEach( (mountain, i) => {
        locations[i] = mountain.position.z
      });
      refs.locations = locations;
    };

    const animate = () => {
      const { current: refs } = threeRefs;
      refs.animationId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      refs.stars.forEach(s => s.material.uniforms.time.value = time);
      if (refs.nebula) refs.nebula.material.uniforms.time.value = time * 0.5;

      if (refs.camera) {
        const smoothingFactor = 0.05;
        
        smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * smoothingFactor;
        smoothCameraPos.current.y += (refs.targetCameraY - smoothCameraPos.current.y) * smoothingFactor;
        smoothCameraPos.current.z += (refs.targetCameraZ - smoothCameraPos.current.z) * smoothingFactor;

        const floatX = Math.sin(time * 0.1) * 2;
        const floatY = Math.cos(time * 0.15) * 1;

        refs.camera.position.x = smoothCameraPos.current.x + floatX;
        refs.camera.position.y = smoothCameraPos.current.y + floatY;
        refs.camera.position.z = smoothCameraPos.current.z;
        refs.camera.lookAt(0, 10, -600);
      }

      refs.mountains.forEach((mountain, i) => {
        const parallaxFactor = 1 + i * 0.5;
        mountain.position.x = Math.sin(time * 0.1) * 2 * parallaxFactor;
        mountain.position.y = 50 + (Math.cos(time * 0.15) * 1 * parallaxFactor);
      });

      if (refs.composer) refs.composer.render();
    };

    initThree();

    const handleResize = () => {
      const { current: refs } = threeRefs;
      if (refs.camera && refs.renderer && refs.composer) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        refs.camera.aspect = width / height;
        refs.camera.updateProjectionMatrix();
        
        refs.renderer.setSize(width, height);
        refs.composer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      const { current: refs } = threeRefs;
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);
      refs.stars.forEach(s => { s.geometry.dispose(); s.material.dispose(); });
      refs.mountains.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
      if (refs.nebula) { refs.nebula.geometry.dispose(); refs.nebula.material.dispose(); }
      if (refs.renderer) refs.renderer.dispose();
    };
  }, []);

  useLayoutEffect(() => {
    // CRITICAL: Don't run animations until scroll is set AND user data is ready
    // This prevents the "Welcome... wait... Name" jump artifact.
    if (!isReady || !isScrollReady || !isDataReady) return;
    
    gsap.set([menuRef.current, scrollProgressRef.current], { visibility: 'visible' });
    const titleChars = titleRef.current?.querySelectorAll('.title-char') ?? [];
    
    gsap.set(titleChars, { opacity: 0, y: 50 });
    gsap.set(titleRef.current, { visibility: 'visible' }); 
    gsap.set(subtitleRef.current, { visibility: "hidden", opacity: 0, y: 20 }); 

    const tl = gsap.timeline();

    if (menuRef.current) {
      tl.from(menuRef.current, { x: -100, opacity: 0, duration: 1, ease: "power3.out" });
    }

    if (titleRef.current) {
      tl.to(titleChars, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.03 });
      tl.to(subtitleRef.current, { visibility: "visible", opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "+=0.2");
    }

    if (scrollProgressRef.current) {
      tl.from(scrollProgressRef.current, { opacity: 0, y: 50, duration: 1, ease: "power2.out" }, "-=0.5");
    }

    return () => { tl.kill(); };
  }, [isReady, isScrollReady, isDataReady, userName]); 

  useEffect(() => {
    if (ctaButtonRef.current && showCTAButton) {
      gsap.set(ctaButtonRef.current, { visibility: 'visible' });
      gsap.from(ctaButtonRef.current, { opacity: 0, y: 30, scale: 0.9, duration: 0.8, ease: "back.out(1.7)" });
    }
  }, [showCTAButton]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      const maxScroll = documentHeight - windowHeight;
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      
      setScrollProgress(progress);
      const newSection = Math.floor(progress * totalSections);
      setCurrentSection(newSection);

      if (progress >= 0.95 && !showCTAButton) setShowCTAButton(true);
      else if (progress < 0.95 && showCTAButton) setShowCTAButton(false);

      const { current: refs } = threeRefs;
      
      const totalProgress = progress * totalSections;
      const sectionProgress = totalProgress % 1;
      
      const cameraPositions = [
        { x: 0, y: 30, z: 400 },
        { x: 0, y: 40, z: -50 },
        { x: 0, y: 50, z: -700 }
      ];
      
      const currentPos = cameraPositions[newSection] || cameraPositions[0];
      const nextPos = cameraPositions[newSection + 1] || currentPos;
      
      refs.targetCameraX = currentPos.x + (nextPos.x - currentPos.x) * sectionProgress;
      refs.targetCameraY = currentPos.y + (nextPos.y - currentPos.y) * sectionProgress;
      refs.targetCameraZ = currentPos.z + (nextPos.z - currentPos.z) * sectionProgress;
      
      refs.mountains.forEach((mountain, i) => {
        const speed = 1 + i * 0.9;
        const targetZ = mountain.userData.baseZ + scrollY * speed * 0.5;
        refs.nebula.position.z = (targetZ + progress * speed * 0.01) - 100;
        
        if (progress > 0.7) mountain.position.z = 600000;
        else mountain.position.z = refs.locations[i];
      });
      if(refs.mountains[3]) refs.nebula.position.z = refs.mountains[3].position.z;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections, showCTAButton]);

  const splitText = (text: string) => {
    return text.split("").map((char, i) => (
      <span key={i} className="title-char">{char}</span>
    ));
  };

  const handleContinue = () => {
    if (onComplete) onComplete();
  };

  return (
    <div 
      ref={containerRef} 
      className="hero-container cosmos-style"
      // FADE IN only when scroll is locked AND user name is ready.
      // This eliminates the "Welcome... [jump] ...Name" artifact.
      style={{ 
        opacity: (isScrollReady && isDataReady) ? 1 : 0, 
        transition: 'opacity 0.6s ease-out' 
      }}
    >
      <canvas ref={canvasRef} className="hero-canvas" />
      
      <div ref={menuRef} className="side-menu" style={{ visibility: 'hidden' }}>
        <div className="menu-icon"><span></span><span></span><span></span></div>
        <div className="vertical-text">SPACE</div>
      </div>

      <div className="hero-content cosmos-content">
        <h1 
          ref={titleRef} 
          className="hero-title title-container" 
          style={{ 
            visibility: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.2em', 
            // Positioned lower (42vh) to counter the 9% scroll offset
            marginTop: '42vh' 
          }}
        >
          <div className="block">
            {splitText("WELCOME")}
          </div>
          <div className="block">
            {splitText(userName)}
          </div>
        </h1>
        
        <div ref={subtitleRef} className="hero-subtitle cosmos-subtitle" style={{ visibility: "hidden" }}>
          <p className="subtitle-line">Scroll down to see more</p>
        </div>
      </div>

      {showCTAButton && (
        <div ref={ctaButtonRef} className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50" style={{ visibility: 'hidden' }}>
          <Button
            onClick={handleContinue}
            size="lg"
            className="bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow interactive group"
          >
            <Heart className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Let's Get Started
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      )}


      <div className="scroll-sections">
       {[...Array(2)].map((_, i) => {
          const titles = { 1: 'Discover People', 2: 'Make Connections' }; 
          
          const subtitles = {
            1: { line1: 'Scroll to explore profiles', line2: 'from right here at NIT Kurukshetra.' },
            2: { line1: 'Genuine connections', line2: 'are just a swipe away.' }
          };
          
          const isMakeConnections = i + 1 === 2;

          return (
            <section key={i} className="content-section">
              <h1 className={`hero-title ${isMakeConnections ? 'make-connections-title' : ''}`}>
                {isMakeConnections ? (
                  <>
                    <div className="block">MAKE</div>
                    <div className="block">CONNECTIONS</div>
                  </>
                ) : (
                  titles[i+1] || 'DEFAULT'
                )}
              </h1>
              <div className="hero-subtitle cosmos-subtitle">
                <p className="subtitle-line">{subtitles[i+1].line1}</p>
                <p className="subtitle-line">{subtitles[i+1].line2}</p>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};