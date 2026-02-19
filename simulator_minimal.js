import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class MinimalSpring12Simulator {
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
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a2a);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 60, 100);
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
        this.controls.minDistance = 50;
        this.controls.maxDistance = 200;
        
        this.setupBasicLights();
        this.createClockLayout();
        this.createMinimalUI();
        
        this.animate();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupBasicLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
    }

    createMinimalEngine() {
        const group = new THREE.Group();
        
        const segments = 8;
        
        const baseGeometry = new THREE.CylinderGeometry(2.5, 3.5, 1.5, segments);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.75;
        group.add(base);
        
        const middleGeometry = new THREE.CylinderGeometry(2, 2.5, 2.5, segments);
        const middleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.y = 2.5;
        group.add(middle);
        
        const topGeometry = new THREE.ConeGeometry(2, 3, segments);
        const topMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 5;
        group.add(top);
        
        const coreGeometry = new THREE.CylinderGeometry(0.4, 0.7, 4, 6);
        const coreMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.7
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 3;
        group.add(core);
        
        group.userData.core = core;
        group.userData.isActive = false;
        
        return group;
    }

    createClockLayout() {
        const radius = 35;
        const count = 12;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const engine = this.createMinimalEngine();
            engine.position.set(x, 0, z);
            engine.rotation.y = -angle + Math.PI / 2;
            
            this.scene.add(engine);
            this.engines.push(engine);
        }
        
        const centerGeometry = new THREE.SphereGeometry(2, 8, 8);
        const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x4ecdc4 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.set(0, 8, 0);
        this.scene.add(center);
        
        const circleGeometry = new THREE.RingGeometry(radius - 1, radius + 1, 64);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = Math.PI / 2;
        this.scene.add(circle);
    }

    createMinimalUI() {
        const ui = document.createElement('div');
        ui.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            padding: 15px 25px;
            border-radius: 8px;
            display: flex;
            gap: 20px;
            align-items: center;
            z-index: 100;
            font-family: 'Microsoft YaHei', sans-serif;
            color: white;
            border: 1px solid #444;
        `;
        
        ui.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.9rem; color: #aaa;">脉冲</div>
                <div id="current-pulse" style="font-size: 1.8rem; font-weight: bold; color: #ff6b6b;">0/12</div>
            </div>
            
            <div style="width: 1px; height: 40px; background: #444;"></div>
            
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.9rem; color: #aaa;">状态</div>
                <div id="engine-status" style="font-size: 1.2rem; font-weight: bold; color: #4ecdc4;">待机</div>
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
            ">启动春节十二响</button>
            
            <button id="reset-btn" style="
                padding: 12px 20px;
                background: #444;
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
            ">重置</button>
            
            <div style="width: 1px; height: 40px; background: #444;"></div>
            
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 0.9rem; color: #aaa;">FPS</div>
                <div id="fps-display" style="font-size: 1.2rem; font-weight: bold; color: #ff8e53;">--</div>
            </div>
        `;
        
        document.body.appendChild(ui);
        
        document.getElementById('start-btn').addEventListener('click', () => this.startSequence());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    startSequence() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentPulse = 0;
        this.activeEngineIndex = -1;
        
        document.getElementById('start-btn').disabled = true;
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
        
        engine.userData.isActive = true;
        const core = engine.userData.core;
        
        if (core) {
            core.material.color.setHex(0xff0000);
            core.material.opacity = 1;
        }
        
        document.getElementById('engine-status').textContent = `第 ${this.currentPulse} 响`;
        
        this.playBeepSound(600, 0.3);
    }

    deactivateEngine(index) {
        const engine = this.engines[index];
        if (!engine) return;
        
        engine.userData.isActive = false;
        const core = engine.userData.core;
        
        if (core) {
            core.material.color.setHex(0x444444);
            core.material.opacity = 0.7;
        }
        
        this.playBeepSound(300, 0.15);
    }

    stopSequence() {
        this.isRunning = false;
        this.activeEngineIndex = -1;
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('engine-status').textContent = '完成';
        
        setTimeout(() => {
            document.getElementById('engine-status').textContent = '待机';
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
            
            if (this.fps < 30) {
                fpsElement.style.color = '#ff6b6b';
            } else if (this.fps < 50) {
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
        
        this.engines.forEach((engine, index) => {
            if (engine.userData.isActive) {
                engine.rotation.y += delta * 3;
            }
        });
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new MinimalSpring12Simulator();
});