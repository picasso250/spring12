import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

class OriginalModelSpring12Simulator {
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
        this.animationId = null;
        this.clock = new THREE.Clock();
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.modelsLoaded = 0;
        this.totalModels = 12;
        this.loadingComplete = false;
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a2a);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 80, 120);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1);
        document.body.appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 80;
        this.controls.maxDistance = 300;
        
        this.setupBasicLights();
        this.createLoadingScreen();
        this.createClockLayout();
        this.createMinimalUI();
        
        this.animate();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupBasicLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 100);
        this.scene.add(directionalLight);
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
                    加载高精度行星发动机模型
                </div>
                <div style="
                    width: 400px;
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
                <div id="loading-text" style="color: #ff8e53; margin-top: 10px; font-size: 1.1rem;">
                    正在准备加载模型...
                </div>
                <div style="margin-top: 30px; color: #666; font-size: 0.9rem;">
                    模型大小: 36.9MB × 12 | 请耐心等待...
                </div>
                <div id="model-stats" style="margin-top: 10px; color: #a0a0ff; font-size: 0.9rem;">
                    已加载: 0/12
                </div>
            </div>
        `;
        
        document.body.appendChild(this.loadingScreen);
    }

    updateLoadingProgress(percent, text) {
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        const modelStats = document.getElementById('model-stats');
        
        if (loadingBar) {
            loadingBar.style.width = `${percent}%`;
        }
        if (loadingText) {
            loadingText.textContent = text;
        }
        if (modelStats) {
            modelStats.textContent = `已加载: ${this.modelsLoaded}/${this.totalModels}`;
        }
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                document.body.removeChild(this.loadingScreen);
                this.loadingScreen = null;
                this.loadingComplete = true;
            }, 500);
        }
    }

    async createClockLayout() {
        const radius = 50;
        
        this.updateLoadingProgress(0, '初始化加载器...');
        
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        
        const modelPath = '行星发动机/XXFDJ.obj';
        const mtlPath = '行星发动机/XXFDJ.mtl';
        
        try {
            this.updateLoadingProgress(10, '加载材质文件...');
            
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
            
            if (materials) {
                materials.preload();
                objLoader.setMaterials(materials);
            }
            
            this.updateLoadingProgress(20, '加载第一个发动机模型...');
            
            const baseModel = await new Promise((resolve, reject) => {
                objLoader.load(
                    modelPath,
                    resolve,
                    (progress) => {
                        const percent = 20 + Math.round((progress.loaded / progress.total) * 30);
                        this.updateLoadingProgress(percent, `加载基础模型: ${Math.round(progress.loaded / 1024 / 1024)}MB / ${Math.round(progress.total / 1024 / 1024)}MB`);
                    },
                    reject
                );
            });
            
            this.modelsLoaded = 1;
            this.updateLoadingProgress(50, '基础模型加载完成，复制中...');
            
            await this.processAndCloneModel(baseModel, radius);
            
            this.updateLoadingProgress(100, '所有模型加载完成！');
            
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 500);
            
        } catch (error) {
            console.error('模型加载失败:', error);
            this.updateLoadingProgress(0, `加载失败: ${error.message}`);
        }
    }

    async processAndCloneModel(baseModel, radius) {
        const processedModel = baseModel.clone();
        
        const box = new THREE.Box3().setFromObject(processedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxSize = Math.max(size.x, size.y, size.z);
        const scale = 8 / maxSize;
        
        processedModel.scale.setScalar(scale);
        processedModel.position.sub(center.multiplyScalar(scale));
        processedModel.position.y = 0;
        
        processedModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
                
                if (child.material) {
                    child.material.needsUpdate = true;
                    
                    if (child.name.toLowerCase().includes('core') || 
                        child.name.toLowerCase().includes('light') ||
                        child.material.emissive) {
                        child.userData.isCore = true;
                    }
                }
            }
        });
        
        processedModel.userData.original = processedModel.clone();
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const engine = processedModel.clone();
            engine.position.set(x, 0, z);
            engine.rotation.y = -angle + Math.PI / 2;
            
            this.scene.add(engine);
            this.engines.push(engine);
            
            this.modelsLoaded++;
            const percent = 50 + Math.round((i / 11) * 50);
            this.updateLoadingProgress(percent, `创建发动机 ${i + 1}/12...`);
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const centerGeometry = new THREE.SphereGeometry(3, 16, 16);
        const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x4ecdc4 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.set(0, 15, 0);
        this.scene.add(center);
    }

    createMinimalUI() {
        const ui = document.createElement('div');
        ui.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 25px;
            border-radius: 8px;
            display: flex;
            gap: 20px;
            align-items: center;
            z-index: 100;
            font-family: 'Microsoft YaHei', sans-serif;
            color: white;
            border: 1px solid #444;
            backdrop-filter: blur(5px);
        `;
        
        ui.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.9rem; color: #aaa;">春节十二响</div>
                <div id="current-pulse" style="font-size: 1.8rem; font-weight: bold; color: #ff6b6b;">0/12</div>
            </div>
            
            <div style="width: 1px; height: 40px; background: #444;"></div>
            
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.9rem; color: #aaa;">状态</div>
                <div id="engine-status" style="font-size: 1.2rem; font-weight: bold; color: #4ecdc4;">加载中...</div>
            </div>
            
            <div style="width: 1px; height: 40px; background: #444;"></div>
            
            <button id="start-btn" style="
                padding: 12px 24px;
                background: #ff6b6b;
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                min-width: 140px;
                opacity: 0.5;
                cursor: not-allowed;
            " disabled>加载中...</button>
            
            <button id="reset-btn" style="
                padding: 12px 20px;
                background: #444;
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                opacity: 0.5;
                cursor: not-allowed;
            " disabled>重置</button>
            
            <div style="width: 1px; height: 40px; background: #444;"></div>
            
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.9rem; color: #aaa;">FPS</div>
                <div id="fps-display" style="font-size: 1.2rem; font-weight: bold; color: #ff8e53;">--</div>
            </div>
        `;
        
        document.body.appendChild(ui);
        
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        this.startBtn.addEventListener('click', () => this.startSequence());
        this.resetBtn.addEventListener('click', () => this.reset());
    }

    enableControls() {
        if (this.startBtn) {
            this.startBtn.style.opacity = '1';
            this.startBtn.style.cursor = 'pointer';
            this.startBtn.disabled = false;
            this.startBtn.textContent = '启动春节十二响';
        }
        
        if (this.resetBtn) {
            this.resetBtn.style.opacity = '1';
            this.resetBtn.style.cursor = 'pointer';
            this.resetBtn.disabled = false;
            this.resetBtn.textContent = '重置';
        }
        
        document.getElementById('engine-status').textContent = '就绪';
    }

    startSequence() {
        if (this.isRunning || !this.loadingComplete) return;
        
        this.isRunning = true;
        this.currentPulse = 0;
        this.activeEngineIndex = -1;
        
        this.startBtn.disabled = true;
        this.startBtn.style.opacity = '0.5';
        this.startBtn.style.cursor = 'not-allowed';
        document.getElementById('engine-status').textContent = '启动中';
        
        this.nextPulse();
    }

    nextPulse() {
        if (this.currentPulse >= this.totalPulses) {
            this.stopSequence();
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
                    this.stopSequence();
                }, 1000);
            }
        }, this.pulseDuration);
    }

    activateEngine(index) {
        const engine = this.engines[index];
        if (!engine) return;
        
        engine.traverse((child) => {
            if (child.isMesh && child.userData.isCore) {
                if (child.material.emissive) {
                    child.material.emissive.setHex(0xff0000);
                    child.material.emissiveIntensity = 2;
                } else {
                    const newMaterial = child.material.clone();
                    newMaterial.emissive = new THREE.Color(0xff0000);
                    newMaterial.emissiveIntensity = 2;
                    child.material = newMaterial;
                }
            }
        });
        
        document.getElementById('engine-status').textContent = `第 ${this.currentPulse} 响`;
        
        this.playBeepSound(600, 0.3);
    }

    deactivateEngine(index) {
        const engine = this.engines[index];
        if (!engine) return;
        
        engine.traverse((child) => {
            if (child.isMesh && child.userData.isCore) {
                if (child.material.emissive) {
                    child.material.emissive.setHex(0x880000);
                    child.material.emissiveIntensity = 0.5;
                }
            }
        });
        
        this.playBeepSound(300, 0.15);
    }

    stopSequence() {
        this.isRunning = false;
        this.activeEngineIndex = -1;
        
        this.startBtn.disabled = false;
        this.startBtn.style.opacity = '1';
        this.startBtn.style.cursor = 'pointer';
        document.getElementById('engine-status').textContent = '完成';
        
        setTimeout(() => {
            document.getElementById('engine-status').textContent = '就绪';
        }, 2000);
    }

    reset() {
        this.stopSequence();
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
            
            if (this.fps < 10) {
                fpsElement.style.color = '#ff6b6b';
            } else if (this.fps < 30) {
                fpsElement.style.color = '#ff8e53';
            } else {
                fpsElement.style.color = '#4ecdc4';
            }
        }
    }

    playBeepSound(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.log('音频播放失败');
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.loadingComplete) return;
            
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (!this.isRunning) {
                    this.startSequence();
                }
            }
            
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                this.reset();
            }
            
            if (e.key === 'Escape') {
                this.stopSequence();
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
        
        const delta = this.clock.getDelta();
        this.frameCount++;
        
        if (this.clock.elapsedTime - this.lastFpsUpdate >= 1) {
            this.fps = Math.round(this.frameCount / (this.clock.elapsedTime - this.lastFpsUpdate));
            this.lastFpsUpdate = this.clock.elapsedTime;
            this.frameCount = 0;
            this.updateUI();
        }
        
        if (this.loadingComplete && this.modelsLoaded === 12) {
            this.enableControls();
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new OriginalModelSpring12Simulator();
});