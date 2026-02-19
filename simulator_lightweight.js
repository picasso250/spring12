import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class LightweightSpring12Simulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.engines = [];
        this.activeEngineIndex = -1;
        this.isRunning = false;
        this.currentPulse = 0;
        this.totalPulses = 12;
        this.pulseDuration = 1500;
        this.pulseInterval = 3000;
        this.enginePower = 1.0;
        this.countdownTimer = null;
        this.animationId = null;
        this.clock = new THREE.Clock();
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a2a);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 50, 80);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: "high-performance",
            precision: "mediump"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = false;
        this.renderer.setPixelRatio(1);
        document.body.appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 200;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        this.setupLights();
        this.createClockLayoutEngines();
        this.createEnvironment();
        this.createParticleSystems();
        this.createUI();
        
        this.animate();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
        
        const hemisphereLight = new THREE.HemisphereLight(0x4444ff, 0x222222, 0.3);
        this.scene.add(hemisphereLight);
    }

    createLightweightEngine() {
        const engineGroup = new THREE.Group();
        
        const segments = 12;
        
        const baseGeometry = new THREE.CylinderGeometry(3, 4, 2, segments);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1;
        engineGroup.add(base);
        
        const middleGeometry = new THREE.CylinderGeometry(2.5, 3, 3, segments);
        const middleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444
        });
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.y = 3.5;
        engineGroup.add(middle);
        
        const topGeometry = new THREE.ConeGeometry(2.5, 4, segments);
        const topMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x555555
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 7;
        engineGroup.add(top);
        
        const coreGeometry = new THREE.CylinderGeometry(0.6, 1, 5, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4444,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 4;
        engineGroup.add(core);
        
        engineGroup.userData.core = core;
        engineGroup.userData.isActive = false;
        
        return engineGroup;
    }

    createClockLayoutEngines() {
        const radius = 40;
        const count = 12;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const engine = this.createLightweightEngine();
            engine.position.set(x, 0, z);
            engine.rotation.y = -angle + Math.PI / 2;
            engine.scale.setScalar(1.2);
            
            this.scene.add(engine);
            this.engines.push(engine);
            
            const number = document.createElement('div');
            number.className = 'clock-number';
            number.textContent = i + 1;
            number.style.cssText = `
                position: absolute;
                color: #4ecdc4;
                font-size: 24px;
                font-weight: bold;
                transform: translate(-50%, -50%);
                pointer-events: none;
                text-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
            `;
            
            const vector = new THREE.Vector3(x, 5, z);
            vector.project(this.camera);
            
            const xPos = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const yPos = (-vector.y * 0.5 + 0.5) * window.innerHeight;
            
            number.style.left = `${xPos}px`;
            number.style.top = `${yPos}px`;
            document.body.appendChild(number);
            engine.userData.numberElement = number;
        }
        
        const centerLight = new THREE.PointLight(0x4ecdc4, 1, 50);
        centerLight.position.set(0, 10, 0);
        this.scene.add(centerLight);
        
        const centerGeometry = new THREE.SphereGeometry(3, 16, 16);
        const centerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.5
        });
        const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
        centerSphere.position.set(0, 10, 0);
        this.scene.add(centerSphere);
    }

    createEnvironment() {
        const groundGeometry = new THREE.CircleGeometry(100, 32);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2a
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        
        const gridGeometry = new THREE.CircleGeometry(100, 64);
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });
        const grid = new THREE.LineLoop(gridGeometry, gridMaterial);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = 0.01;
        this.scene.add(grid);
        
        for (let i = 1; i <= 4; i++) {
            const radius = i * 20;
            const circleGeometry = new THREE.CircleGeometry(radius, 64);
            const circle = new THREE.LineLoop(circleGeometry, gridMaterial);
            circle.rotation.x = -Math.PI / 2;
            circle.position.y = 0.01;
            this.scene.add(circle);
        }
    }

    createParticleSystems() {
        this.particleSystems = [];
        
        for (let i = 0; i < 12; i++) {
            const particleCount = 100;
            const particles = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            
            const color = new THREE.Color();
            
            for (let j = 0; j < particleCount; j++) {
                const j3 = j * 3;
                positions[j3] = 0;
                positions[j3 + 1] = 0;
                positions[j3 + 2] = 0;
                
                color.setHSL(0.0, 1.0, 0.5);
                colors[j3] = color.r;
                colors[j3 + 1] = color.g;
                colors[j3 + 2] = color.b;
            }
            
            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                size: 0.3,
                vertexColors: true,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });
            
            const particleSystem = new THREE.Points(particles, particleMaterial);
            particleSystem.visible = false;
            this.scene.add(particleSystem);
            this.particleSystems.push(particleSystem);
        }
    }

    createUI() {
        const uiContainer = document.createElement('div');
        uiContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20, 20, 40, 0.9);
            padding: 15px 25px;
            border-radius: 10px;
            border: 1px solid rgba(100, 100, 255, 0.3);
            backdrop-filter: blur(10px);
            display: flex;
            gap: 20px;
            align-items: center;
            z-index: 100;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
            font-family: 'Microsoft YaHei', sans-serif;
        `;
        
        uiContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="color: #a0a0ff; font-size: 0.9rem;">当前脉冲</div>
                <div id="current-pulse" style="color: #ff6b6b; font-size: 1.5rem; font-weight: bold;">0/12</div>
            </div>
            
            <div style="width: 1px; height: 40px; background: rgba(255, 255, 255, 0.2);"></div>
            
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="color: #a0a0ff; font-size: 0.9rem;">发动机状态</div>
                <div id="engine-status" style="color: #4ecdc4; font-size: 1.2rem; font-weight: bold;">待机</div>
            </div>
            
            <div style="width: 1px; height: 40px; background: rgba(255, 255, 255, 0.2);"></div>
            
            <button id="start-btn" style="
                padding: 12px 24px;
                background: linear-gradient(45deg, #ff6b6b, #ff8e53);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 120px;
            ">启动春节十二响</button>
            
            <button id="reset-btn" style="
                padding: 12px 24px;
                background: linear-gradient(45deg, #4ecdc4, #44a08d);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 80px;
            ">重置</button>
            
            <div style="width: 1px; height: 40px; background: rgba(255, 255, 255, 0.2);"></div>
            
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="color: #a0a0ff; font-size: 0.9rem;">FPS</div>
                <div id="fps-display" style="color: #ff8e53; font-size: 1.2rem; font-weight: bold;">--</div>
            </div>
        `;
        
        document.body.appendChild(uiContainer);
        
        document.getElementById('start-btn').addEventListener('click', () => this.startPulseSequence());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetSystem());
    }

    startPulseSequence() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentPulse = 0;
        this.activeEngineIndex = -1;
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('engine-status').textContent = '启动中...';
        
        this.nextPulse();
    }

    nextPulse() {
        if (this.currentPulse >= this.totalPulses) {
            this.stopPulseSequence();
            return;
        }
        
        this.currentPulse++;
        this.activeEngineIndex = (this.currentPulse - 1) % 12;
        
        this.updateUI();
        this.activateEngine(this.activeEngineIndex);
        
        setTimeout(() => {
            this.deactivateEngine(this.activeEngineIndex);
            
            if (this.currentPulse < this.totalPulses) {
                setTimeout(() => {
                    this.nextPulse();
                }, this.pulseInterval);
            } else {
                setTimeout(() => {
                    this.stopPulseSequence();
                }, 1000);
            }
        }, this.pulseDuration);
    }

    activateEngine(index) {
        const engine = this.engines[index];
        if (!engine) return;
        
        engine.userData.isActive = true;
        const core = engine.userData.core;
        
        if (core) {
            core.material.color.setHex(0xff0000);
            core.material.opacity = 1;
        }
        
        const particleSystem = this.particleSystems[index];
        if (particleSystem) {
            particleSystem.visible = true;
            particleSystem.material.opacity = 0.8;
            particleSystem.material.size = 0.5;
            
            const positions = particleSystem.geometry.attributes.position.array;
            const enginePos = engine.position;
            
            for (let i = 0; i < positions.length; i += 3) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 2 + Math.random() * 2;
                
                positions[i] = enginePos.x + Math.cos(angle) * radius;
                positions[i + 1] = enginePos.y + 8;
                positions[i + 2] = enginePos.z + Math.sin(angle) * radius;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        document.getElementById('engine-status').textContent = `第 ${this.currentPulse} 响`;
        this.playSound('start');
    }

    deactivateEngine(index) {
        const engine = this.engines[index];
        if (!engine) return;
        
        engine.userData.isActive = false;
        const core = engine.userData.core;
        
        if (core) {
            core.material.color.setHex(0xff4444);
            core.material.opacity = 0.6;
        }
        
        const particleSystem = this.particleSystems[index];
        if (particleSystem) {
            particleSystem.material.opacity = 0;
            setTimeout(() => {
                particleSystem.visible = false;
            }, 500);
        }
        
        this.playSound('stop');
    }

    stopPulseSequence() {
        this.isRunning = false;
        this.activeEngineIndex = -1;
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('engine-status').textContent = '完成';
        
        setTimeout(() => {
            document.getElementById('engine-status').textContent = '待机';
        }, 2000);
    }

    resetSystem() {
        this.stopPulseSequence();
        this.currentPulse = 0;
        
        for (let i = 0; i < this.engines.length; i++) {
            this.deactivateEngine(i);
        }
        
        this.updateUI();
        document.getElementById('engine-status').textContent = '已重置';
    }

    updateUI() {
        document.getElementById('current-pulse').textContent = `${this.currentPulse}/${this.totalPulses}`;
        
        const fpsElement = document.getElementById('fps-display');
        if (fpsElement) {
            fpsElement.textContent = this.fps;
            
            if (this.fps < 30) {
                fpsElement.style.color = '#ff6b6b';
            } else if (this.fps < 50) {
                fpsElement.style.color = '#ff8e53';
            } else {
                fpsElement.style.color = '#4ecdc4';
            }
        }
    }

    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (type === 'start') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(120, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.6);
            } else if (type === 'stop') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (error) {
            console.log('音频播放失败:', error);
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (!this.isRunning) {
                    this.startPulseSequence();
                }
            }
            
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                this.resetSystem();
            }
            
            if (e.key === 'Escape') {
                this.stopPulseSequence();
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        this.updateClockNumbers();
    }

    updateClockNumbers() {
        this.engines.forEach((engine, index) => {
            const numberElement = engine.userData.numberElement;
            if (numberElement) {
                const vector = new THREE.Vector3();
                engine.getWorldPosition(vector);
                vector.y += 5;
                
                vector.project(this.camera);
                
                const xPos = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const yPos = (-vector.y * 0.5 + 0.5) * window.innerHeight;
                
                numberElement.style.left = `${xPos}px`;
                numberElement.style.top = `${yPos}px`;
            }
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        this.frameCount++;
        
        if (this.clock.elapsedTime - this.lastFpsUpdate >= 1) {
            this.fps = Math.round(this.frameCount / (this.clock.elapsedTime - this.lastFpsUpdate));
            this.lastFpsUpdate = this.clock.elapsedTime;
            this.frameCount = 0;
            this.updateUI();
        }
        
        this.engines.forEach((engine, index) => {
            if (engine.userData.isActive) {
                engine.rotation.y += delta * 2;
                
                const particleSystem = this.particleSystems[index];
                if (particleSystem && particleSystem.visible) {
                    const positions = particleSystem.geometry.attributes.position.array;
                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i + 1] += delta * 20;
                        
                        if (positions[i + 1] > 30) {
                            positions[i + 1] = engine.position.y + 8;
                        }
                    }
                    particleSystem.geometry.attributes.position.needsUpdate = true;
                }
            }
        });
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        
        this.updateClockNumbers();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new LightweightSpring12Simulator();
});