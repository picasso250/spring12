import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

class OptimizedSpring12Simulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.engineModel = null;
        this.engineCore = null;
        this.particles = [];
        this.isRunning = false;
        this.currentPulse = 0;
        this.totalPulses = 12;
        this.pulseDuration = 2000;
        this.pulseInterval = 4000;
        this.enginePower = 1.0;
        this.countdownTimer = null;
        this.animationId = null;
        this.modelLoaded = false;
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a2a);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 15, 25);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        
        this.setupLights();
        this.createEnvironment();
        this.createLoadingScreen();
        
        this.loadOptimizedModel();
        this.animate();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 50, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        const engineLight = new THREE.PointLight(0xff6b6b, 3, 100);
        engineLight.position.set(0, 10, 0);
        engineLight.castShadow = true;
        this.scene.add(engineLight);
        this.engineLight = engineLight;
    }

    createEnvironment() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2a,
            metalness: 0.1,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        const gridHelper = new THREE.GridHelper(200, 40, 0x333333, 0x222222);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    createLoadingScreen() {
        this.loadingScreen = document.createElement('div');
        this.loadingScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0a0a2a;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-family: 'Microsoft YaHei', sans-serif;
        `;
        
        this.loadingScreen.innerHTML = `
            <div style="text-align: center;">
                <h1 style="color: #4ecdc4; margin-bottom: 20px; font-size: 2.5rem;">
                    流浪地球 - 春节十二响
                </h1>
                <div style="font-size: 1.2rem; color: #a0a0ff; margin-bottom: 30px;">
                    行星发动机模拟器
                </div>
                <div id="loading-progress" style="
                    width: 300px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    margin: 20px auto;
                ">
                    <div id="loading-bar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #4ecdc4, #44a08d);
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <div id="loading-text" style="color: #ff8e53; margin-top: 10px;">
                    正在优化加载模型...
                </div>
                <div style="margin-top: 30px; color: #666; font-size: 0.9rem;">
                    模型大小: 36.9MB | 正在应用性能优化...
                </div>
            </div>
        `;
        
        document.body.appendChild(this.loadingScreen);
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                document.body.removeChild(this.loadingScreen);
                this.loadingScreen = null;
            }, 500);
        }
    }

    updateLoadingProgress(percent, text) {
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingBar) {
            loadingBar.style.width = `${percent}%`;
        }
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    async loadOptimizedModel() {
        try {
            this.updateLoadingProgress(10, '准备加载模型...');
            
            const modelPath = '行星发动机/XXFDJ.obj';
            const mtlPath = '行星发动机/XXFDJ.mtl';
            
            this.updateLoadingProgress(20, '加载材质文件...');
            
            const mtlLoader = new MTLLoader();
            const materials = await new Promise((resolve, reject) => {
                mtlLoader.load(
                    mtlPath,
                    resolve,
                    undefined,
                    () => {
                        console.log('使用默认材质');
                        resolve(null);
                    }
                );
            });
            
            this.updateLoadingProgress(40, '加载模型数据...');
            
            const objLoader = new OBJLoader();
            if (materials) {
                materials.preload();
                objLoader.setMaterials(materials);
            }
            
            const model = await new Promise((resolve, reject) => {
                objLoader.load(
                    modelPath,
                    resolve,
                    (progress) => {
                        const percent = 40 + Math.round((progress.loaded / progress.total) * 50);
                        this.updateLoadingProgress(percent, `加载模型: ${Math.round(progress.loaded / 1024 / 1024)}MB / ${Math.round(progress.total / 1024 / 1024)}MB`);
                    },
                    reject
                );
            });
            
            this.updateLoadingProgress(90, '优化模型性能...');
            
            await this.optimizeModel(model);
            
            this.updateLoadingProgress(100, '模型加载完成！');
            
            setTimeout(() => {
                this.hideLoadingScreen();
                this.createControlPanel();
            }, 500);
            
        } catch (error) {
            console.error('模型加载失败:', error);
            this.updateLoadingProgress(0, `加载失败: ${error.message}`);
            this.createSimpleEngine();
        }
    }

    async optimizeModel(model) {
        this.engineModel = model;
        
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxSize = Math.max(size.x, size.y, size.z);
        const scale = 15 / maxSize;
        
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y = size.y * scale * 0.5;
        
        let vertexCount = 0;
        let faceCount = 0;
        
        model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                
                vertexCount += geometry.attributes.position.count;
                faceCount += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
                
                child.castShadow = false;
                child.receiveShadow = false;
                
                if (child.material) {
                    child.material.needsUpdate = true;
                    
                    if (child.name.toLowerCase().includes('core') || 
                        child.name.toLowerCase().includes('light') ||
                        child.material.emissive) {
                        this.engineCore = child;
                        child.castShadow = true;
                    }
                    
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.shadowSide = null;
                            mat.side = THREE.FrontSide;
                        });
                    } else {
                        child.material.shadowSide = null;
                        child.material.side = THREE.FrontSide;
                    }
                }
                
                geometry.computeVertexNormals();
                
                if (geometry.attributes.position.count > 50000) {
                    console.log(`优化网格: ${child.name} - 顶点: ${geometry.attributes.position.count}`);
                    this.simplifyGeometry(geometry);
                }
            }
        });
        
        console.log(`模型统计: 顶点: ${vertexCount}, 面: ${faceCount}`);
        
        this.scene.add(model);
        
        this.camera.position.set(25, 20, 30);
        this.controls.target.set(0, size.y * scale * 0.5, 0);
        this.controls.update();
        
        this.createParticleSystem();
        this.modelLoaded = true;
    }

    simplifyGeometry(geometry) {
        const positions = geometry.attributes.position.array;
        const newPositions = [];
        const indexMap = new Map();
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            const key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
            
            if (!indexMap.has(key)) {
                indexMap.set(key, newPositions.length / 3);
                newPositions.push(x, y, z);
            }
        }
        
        if (newPositions.length < positions.length * 0.7) {
            console.log(`简化: ${positions.length / 3} -> ${newPositions.length / 3} 顶点`);
            
            const newGeometry = new THREE.BufferGeometry();
            newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
            
            if (geometry.attributes.normal) {
                newGeometry.computeVertexNormals();
            }
            
            geometry.dispose();
            return newGeometry;
        }
        
        return geometry;
    }

    createSimpleEngine() {
        const engineGroup = new THREE.Group();
        
        const baseGeometry = new THREE.CylinderGeometry(4, 5, 2, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1;
        engineGroup.add(base);
        
        const middleGeometry = new THREE.CylinderGeometry(3, 4, 4, 16);
        const middleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.3
        });
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.y = 4;
        engineGroup.add(middle);
        
        const topGeometry = new THREE.ConeGeometry(3, 6, 16);
        const topMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            metalness: 0.6,
            roughness: 0.4,
            emissive: 0x222222,
            emissiveIntensity: 0.1
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 9;
        engineGroup.add(top);
        
        const coreGeometry = new THREE.CylinderGeometry(0.8, 1.2, 8, 12);
        const coreMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff4444,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xff0000,
            emissiveIntensity: 0.2
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 5;
        engineGroup.add(core);
        
        this.engineModel = engineGroup;
        this.engineCore = core;
        this.scene.add(engineGroup);
        
        this.createParticleSystem();
        this.modelLoaded = true;
        
        this.hideLoadingScreen();
        this.createControlPanel();
    }

    createParticleSystem() {
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            const radius = 3 + Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = Math.random() * 15;
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            color.setHSL(0.0 + Math.random() * 0.1, 1.0, 0.5);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.particleSystem.visible = false;
        this.scene.add(this.particleSystem);
    }

    createControlPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
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
            gap: 15px;
            align-items: center;
            z-index: 100;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
        `;
        
        panel.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <div style="color: #a0a0ff; font-size: 0.9rem;">发动机状态</div>
                <div id="engine-status" style="color: #4ecdc4; font-weight: bold;">待机</div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <div style="color: #a0a0ff; font-size: 0.9rem;">当前脉冲</div>
                <div id="current-pulse" style="color: #ff6b6b; font-weight: bold;">0/12</div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <div style="color: #a0a0ff; font-size: 0.9rem;">燃料</div>
                <div id="fuel-level" style="color: #4ecdc4; font-weight: bold;">100%</div>
            </div>
            
            <div style="width: 1px; height: 30px; background: rgba(255, 255, 255, 0.2);"></div>
            
            <button id="start-btn" style="
                padding: 10px 20px;
                background: linear-gradient(45deg, #ff6b6b, #ff8e53);
                border: none;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            ">启动十二响</button>
            
            <button id="reset-btn" style="
                padding: 10px 20px;
                background: linear-gradient(45deg, #4ecdc4, #44a08d);
                border: none;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            ">重置</button>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <div style="color: #a0a0ff; font-size: 0.9rem;">下一脉冲</div>
                <div id="countdown-timer" style="color: #ff8e53; font-weight: bold;">--:--</div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('start-btn').addEventListener('click', () => this.startPulse());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetSystem());
    }

    startPulse() {
        if (this.isRunning || !this.modelLoaded) return;
        
        this.isRunning = true;
        this.currentPulse = 0;
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('engine-status').textContent = '运行中';
        
        this.runPulseSequence();
    }

    runPulseSequence() {
        if (this.currentPulse >= this.totalPulses) {
            this.stopPulse();
            return;
        }
        
        this.currentPulse++;
        this.updateUI();
        
        this.activateEngine();
        
        setTimeout(() => {
            this.deactivateEngine();
            
            if (this.currentPulse < this.totalPulses) {
                this.startCountdown();
                setTimeout(() => {
                    this.runPulseSequence();
                }, this.pulseInterval);
            } else {
                setTimeout(() => {
                    this.stopPulse();
                }, 1000);
            }
        }, this.pulseDuration);
    }

    activateEngine() {
        this.engineLight.intensity = 8 * this.enginePower;
        this.engineLight.color.setHex(0xff6b6b);
        
        this.particleSystem.visible = true;
        this.particleSystem.material.size = 0.4 * this.enginePower;
        
        if (this.engineCore) {
            if (Array.isArray(this.engineCore.material)) {
                this.engineCore.material.forEach(mat => {
                    if (mat.emissive) {
                        mat.emissive.setHex(0xff0000);
                        mat.emissiveIntensity = 1.5 * this.enginePower;
                    }
                });
            } else if (this.engineCore.material.emissive) {
                this.engineCore.material.emissive.setHex(0xff0000);
                this.engineCore.material.emissiveIntensity = 1.5 * this.enginePower;
            }
        }
        
        this.createExplosionEffect();
        
        document.getElementById('engine-status').textContent = `脉冲 ${this.currentPulse}/12`;
        
        this.playSound('start');
    }

    deactivateEngine() {
        this.engineLight.intensity = 3;
        this.engineLight.color.setHex(0xff6b6b);
        
        this.particleSystem.visible = false;
        
        if (this.engineCore) {
            if (Array.isArray(this.engineCore.material)) {
                this.engineCore.material.forEach(mat => {
                    if (mat.emissive) {
                        mat.emissive.setHex(0xff0000);
                        mat.emissiveIntensity = 0.3;
                    }
                });
            } else if (this.engineCore.material.emissive) {
                this.engineCore.material.emissive.setHex(0xff0000);
                this.engineCore.material.emissiveIntensity = 0.3;
            }
        }
        
        document.getElementById('engine-status').textContent = '冷却中';
        
        this.playSound('stop');
    }

    createExplosionEffect() {
        const explosionGeometry = new THREE.SphereGeometry(2, 6, 6);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(0, 15, 0);
        this.scene.add(explosion);
        
        let scale = 1;
        const animateExplosion = () => {
            scale += 0.3;
            explosion.scale.setScalar(scale);
            explosion.material.opacity -= 0.08;
            
            if (explosion.material.opacity > 0) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
                explosion.geometry.dispose();
                explosion.material.dispose();
            }
        };
        
        animateExplosion();
    }

    startCountdown() {
        let timeLeft = this.pulseInterval / 1000;
        const countdownElement = document.getElementById('countdown-timer');
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        this.countdownTimer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(this.countdownTimer);
                countdownElement.textContent = '00:00';
            }
        }, 1000);
    }

    stopPulse() {
        this.isRunning = false;
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.disabled = false;
        }
        
        document.getElementById('engine-status').textContent = '待机';
        document.getElementById('countdown-timer').textContent = '--:--';
        
        this.deactivateEngine();
    }

    resetSystem() {
        this.stopPulse();
        this.currentPulse = 0;
        this.updateUI();
        
        document.getElementById('engine-status').textContent = '待机';
        document.getElementById('fuel-level').textContent = '100%';
        document.getElementById('current-pulse').textContent = '0/12';
        
        this.engineLight.intensity = 3;
        this.particleSystem.visible = false;
        
        if (this.engineCore) {
            if (Array.isArray(this.engineCore.material)) {
                this.engineCore.material.forEach(mat => {
                    if (mat.emissive) {
                        mat.emissiveIntensity = 0.3;
                    }
                });
            } else if (this.engineCore.material.emissive) {
                this.engineCore.material.emissiveIntensity = 0.3;
            }
        }
    }

    updateUI() {
        document.getElementById('current-pulse').textContent = `${this.currentPulse}/${this.totalPulses}`;
        document.getElementById('fuel-level').textContent = `${Math.round((1 - this.currentPulse / this.totalPulses) * 100)}%`;
    }

    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (type === 'start') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.4);
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.8);
            } else if (type === 'stop') {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.3);
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
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
                    this.startPulse();
                }
            }
            
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                this.resetSystem();
            }
            
            if (e.key === 'Escape') {
                this.stopPulse();
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.engineModel) {
            this.engineModel.rotation.y += 0.001;
            
            if (this.particleSystem.visible) {
                const positions = this.particleSystem.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += 0.15 * this.enginePower;
                    
                    if (positions[i + 1] > 20) {
                        positions[i + 1] = 0;
                        const radius = 3 + Math.random() * 2;
                        const angle = Math.random() * Math.PI * 2;
                        positions[i] = Math.cos(angle) * radius;
                        positions[i + 2] = Math.sin(angle) * radius;
                    }
                }
                this.particleSystem.geometry.attributes.position.needsUpdate = true;
            }
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new OptimizedSpring12Simulator();
});