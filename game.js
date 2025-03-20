import * as THREE from 'three';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#game'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.score = 0;
        this.clock = new THREE.Clock();
        this.ufoRotation = 0;
        
        // Fixed camera angle (no orbit)
        this.cameraOffset = new THREE.Vector3(0, 10, 15);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.scene.add(this.ground);

        // UFO
        this.createUFO();
        this.cows = [];
        this.createCows(5);

        // Camera setup
        this.camera.position.set(0, 15, 20);

        // Controls
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        // Animation
        this.animate();
    }

    createUFO() {
        const ufoGroup = new THREE.Group();
        
        // UFO body
        const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
        bodyGeometry.scale(1.5, 0.5, 1.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
        this.ufoBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // UFO dome
        const domeGeometry = new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshStandardMaterial({ color: 0x44ccff, transparent: true, opacity: 0.6 });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 0.3;

        // Tractor Beam
        const beamGeometry = new THREE.CylinderGeometry(0.1, 2, 8, 32, 1, true);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x44ccff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.tractorBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        this.tractorBeam.position.y = -4;
        
        // Add beam glow
        const beamGlowGeometry = new THREE.CylinderGeometry(0.2, 2.2, 8, 32, 1, true);
        const beamGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ddff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        this.tractorBeamGlow = new THREE.Mesh(beamGlowGeometry, beamGlowMaterial);
        this.tractorBeamGlow.position.y = -4;

        ufoGroup.add(this.ufoBody);
        ufoGroup.add(dome);
        ufoGroup.add(this.tractorBeam);
        ufoGroup.add(this.tractorBeamGlow);
        ufoGroup.position.y = 5;
        this.scene.add(ufoGroup);
        this.ufo = ufoGroup;
    }

    createCows(count) {
        for (let i = 0; i < count; i++) {
            const cowGroup = new THREE.Group();
            
            // Cow body
            const bodyGeometry = new THREE.BoxGeometry(1, 0.8, 1.5);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            
            // Cow head
            const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const head = new THREE.Mesh(headGeometry, bodyMaterial);
            head.position.z = 0.8;
            head.position.y = 0.2;
            
            cowGroup.add(body);
            cowGroup.add(head);
            
            // Random position
            cowGroup.position.x = (Math.random() - 0.5) * 80;
            cowGroup.position.z = (Math.random() - 0.5) * 80;
            cowGroup.position.y = 0.8;
            
            this.scene.add(cowGroup);
            this.cows.push({
                mesh: cowGroup,
                isBeingAbducted: false,
                abductionProgress: 0,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderTime: 0
            });
        }
    }

    updateUFO() {
        const speed = 0.2;
        const rotationSpeed = 0.03;
        
        // Rotate UFO with Q and E
        if (this.keys['q']) this.ufoRotation += rotationSpeed;
        if (this.keys['e']) this.ufoRotation -= rotationSpeed;

        // Calculate movement based on UFO's rotation
        let dx = 0;
        let dz = 0;

        if (this.keys['w'] || this.keys['s'] || this.keys['a'] || this.keys['d']) {
            // Get basic direction from input
            let inputX = 0;
            let inputZ = 0;
            
            if (this.keys['w']) inputZ -= speed;
            if (this.keys['s']) inputZ += speed;
            if (this.keys['a']) inputX -= speed;
            if (this.keys['d']) inputX += speed;

            // Apply UFO's rotation to the movement
            dx = inputX * Math.cos(this.ufoRotation) + inputZ * Math.sin(this.ufoRotation);
            dz = -inputX * Math.sin(this.ufoRotation) + inputZ * Math.cos(this.ufoRotation);
        }

        // Apply movement
        this.ufo.position.x += dx;
        this.ufo.position.z += dz;
        
        // Keep UFO within bounds
        this.ufo.position.x = Math.max(-45, Math.min(45, this.ufo.position.x));
        this.ufo.position.z = Math.max(-45, Math.min(45, this.ufo.position.z));

        // Update UFO rotation
        this.ufo.rotation.y = this.ufoRotation;

        // Update camera position - now follows UFO's rotation
        const targetPosition = new THREE.Vector3(
            this.ufo.position.x + Math.sin(this.ufoRotation) * this.cameraOffset.z,
            this.ufo.position.y + this.cameraOffset.y,
            this.ufo.position.z + Math.cos(this.ufoRotation) * this.cameraOffset.z
        );

        // Smoothly interpolate camera position
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.ufo.position.x, this.ufo.position.y - 2, this.ufo.position.z);

        // Update tractor beam effects
        this.tractorBeam.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
        this.tractorBeamGlow.material.opacity = 0.1 + Math.sin(Date.now() * 0.003) * 0.05;
        this.tractorBeam.rotation.y += 0.02;
        this.tractorBeamGlow.rotation.y -= 0.01;
    }

    updateCows() {
        const deltaTime = this.clock.getDelta();
        
        this.cows.forEach((cow, index) => {
            if (cow.isBeingAbducted) {
                cow.abductionProgress += 0.02;
                const targetY = this.ufo.position.y - 2;
                cow.mesh.position.y = Math.min(targetY, cow.mesh.position.y + 0.1);
                
                // Spin the cow while being abducted
                cow.mesh.rotation.y += 0.1;
                cow.mesh.rotation.x = Math.sin(Date.now() * 0.003) * 0.2;
                
                // Move towards UFO
                cow.mesh.position.x += (this.ufo.position.x - cow.mesh.position.x) * 0.1;
                cow.mesh.position.z += (this.ufo.position.z - cow.mesh.position.z) * 0.1;
                
                if (cow.abductionProgress >= 1) {
                    this.scene.remove(cow.mesh);
                    this.cows.splice(index, 1);
                    this.score++;
                    document.getElementById('cowCount').textContent = this.score;
                    
                    // Add new cow if all are abducted
                    if (this.cows.length === 0) {
                        this.createCows(5);
                    }
                }
            } else {
                // Wandering behavior
                cow.wanderTime += deltaTime;
                
                // Change direction every few seconds
                if (cow.wanderTime > 3) {
                    cow.wanderAngle = Math.random() * Math.PI * 2;
                    cow.wanderTime = 0;
                }
                
                // Move in current direction
                const speed = 0.03;
                cow.mesh.position.x += Math.cos(cow.wanderAngle) * speed;
                cow.mesh.position.z += Math.sin(cow.wanderAngle) * speed;
                
                // Rotate cow to face movement direction
                cow.mesh.rotation.y = cow.wanderAngle;
                
                // Keep cows within bounds
                cow.mesh.position.x = Math.max(-45, Math.min(45, cow.mesh.position.x));
                cow.mesh.position.z = Math.max(-45, Math.min(45, cow.mesh.position.z));
                
                // Check if cow is under UFO beam
                const distance = new THREE.Vector2(
                    cow.mesh.position.x - this.ufo.position.x, 
                    cow.mesh.position.z - this.ufo.position.z
                ).length();
                
                if (distance < 2) {
                    cow.isBeingAbducted = true;
                }
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateUFO();
        this.updateCows();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const game = window.gameInstance;
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start game
window.gameInstance = new Game();
