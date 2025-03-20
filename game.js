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
        
        // Set background
        this.scene.background = new THREE.Color(0x000020);
        
        // Planet properties
        this.planetRadius = 20;
        this.gravity = new THREE.Vector3(0, -1, 0);
        
        // Fixed camera angle (no orbit)
        this.cameraOffset = new THREE.Vector3(0, 10, 15);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);

        // Create stars
        this.createStars();
        
        // Create planet
        this.createPlanet();

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
    
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            sizeAttenuation: true
        });
        
        const starsVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }
    
    createPlanet() {
        // Planet geometry
        const planetGeometry = new THREE.SphereGeometry(this.planetRadius, 64, 64);
        
        // Planet material with grass texture
        const planetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x33aa33,
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.planet = new THREE.Mesh(planetGeometry, planetMaterial);
        this.scene.add(this.planet);
        
        // Add some random mountains and craters
        this.addTerrainFeatures();
    }
    
    addTerrainFeatures() {
        // Add mountains
        for (let i = 0; i < 20; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            const mountainGeometry = new THREE.ConeGeometry(
                Math.random() * 2 + 1, 
                Math.random() * 3 + 2, 
                4
            );
            
            const mountainMaterial = new THREE.MeshStandardMaterial({
                color: 0x228822,
                roughness: 0.9
            });
            
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            // Position on sphere surface
            const x = this.planetRadius * Math.sin(theta) * Math.cos(phi);
            const y = this.planetRadius * Math.sin(theta) * Math.sin(phi);
            const z = this.planetRadius * Math.cos(theta);
            
            mountain.position.set(x, y, z);
            
            // Orient to face away from center
            mountain.lookAt(0, 0, 0);
            mountain.rotateX(Math.PI / 2);
            
            this.scene.add(mountain);
        }
        
        // Add craters
        for (let i = 0; i < 10; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            const craterGeometry = new THREE.CircleGeometry(
                Math.random() * 1.5 + 0.5,
                32
            );
            
            const craterMaterial = new THREE.MeshStandardMaterial({
                color: 0x227722,
                roughness: 1,
                side: THREE.DoubleSide
            });
            
            const crater = new THREE.Mesh(craterGeometry, craterMaterial);
            
            // Position slightly above sphere surface
            const x = this.planetRadius * Math.sin(theta) * Math.cos(phi);
            const y = this.planetRadius * Math.sin(theta) * Math.sin(phi);
            const z = this.planetRadius * Math.cos(theta);
            
            crater.position.set(x, y, z);
            
            // Orient to face away from center
            crater.lookAt(0, 0, 0);
            
            this.scene.add(crater);
        }
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
        
        // Position UFO above planet
        this.positionOnPlanet(ufoGroup, 0, 0, 5);
        
        this.scene.add(ufoGroup);
        this.ufo = ufoGroup;
    }
    
    // Helper function to position objects on planet surface
    positionOnPlanet(object, longitude, latitude, height = 0) {
        // Convert from spherical to cartesian coordinates
        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);
        
        // Calculate position on sphere
        const x = -(this.planetRadius + height) * Math.sin(phi) * Math.cos(theta);
        const y = (this.planetRadius + height) * Math.cos(phi);
        const z = (this.planetRadius + height) * Math.sin(phi) * Math.sin(theta);
        
        // Set position
        object.position.set(x, y, z);
        
        // Orient object to face away from planet center
        const normal = new THREE.Vector3(x, y, z).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        
        // Create a quaternion that aligns the object's up with the normal
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
        object.setRotationFromQuaternion(quaternion);
        
        // Store the object's local up vector (normal to planet)
        object.userData.localUp = normal.clone();
        object.userData.longitude = longitude;
        object.userData.latitude = latitude;
        
        return object;
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
            
            // Random position on planet
            const longitude = Math.random() * 360 - 180;
            const latitude = Math.random() * 180 - 90;
            
            this.positionOnPlanet(cowGroup, longitude, latitude, 1);
            
            this.scene.add(cowGroup);
            this.cows.push({
                mesh: cowGroup,
                isBeingAbducted: false,
                abductionProgress: 0,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderTime: 0,
                longitude: longitude,
                latitude: latitude
            });
        }
    }

    updateUFO() {
        const speed = 1;
        const rotationSpeed = 0.03;
        
        // Get current position data
        let longitude = this.ufo.userData.longitude || 0;
        let latitude = this.ufo.userData.latitude || 0;
        
        // Rotate UFO with Q and E
        if (this.keys['q']) this.ufoRotation += rotationSpeed;
        if (this.keys['e']) this.ufoRotation -= rotationSpeed;
        
        // Move UFO on planet surface
        if (this.keys['w']) latitude += speed;
        if (this.keys['s']) latitude -= speed;
        if (this.keys['a']) longitude -= speed;
        if (this.keys['d']) longitude += speed;
        
        // Clamp latitude to avoid going over the poles
        latitude = Math.max(-85, Math.min(85, latitude));
        
        // Wrap longitude around
        if (longitude > 180) longitude -= 360;
        if (longitude < -180) longitude += 360;
        
        // Update UFO position on planet
        this.positionOnPlanet(this.ufo, longitude, latitude, 5);
        
        // Apply local rotation
        this.ufo.rotateY(this.ufoRotation);
        
        // Update camera to follow UFO
        this.updateCamera();
        
        // Update tractor beam effects
        this.tractorBeam.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
        this.tractorBeamGlow.material.opacity = 0.1 + Math.sin(Date.now() * 0.003) * 0.05;
        this.tractorBeam.rotation.y += 0.02;
        this.tractorBeamGlow.rotation.y -= 0.01;
    }
    
    updateCamera() {
        // Get UFO's position and normal
        const ufoPosition = this.ufo.position.clone();
        const ufoNormal = this.ufo.userData.localUp.clone();
        
        // Calculate camera position: behind and above UFO
        const offsetDistance = 15;
        const heightOffset = 8;
        
        // Create a vector pointing from UFO in the opposite direction of planet center
        const awayFromPlanet = ufoNormal.clone().multiplyScalar(heightOffset);
        
        // Create a vector pointing behind the UFO based on its rotation
        const behindUfo = new THREE.Vector3(0, 0, offsetDistance);
        behindUfo.applyQuaternion(this.ufo.quaternion);
        
        // Combine these vectors with the UFO position
        const cameraPosition = ufoPosition.clone()
            .add(awayFromPlanet)
            .add(behindUfo);
        
        // Smoothly move camera to new position
        this.camera.position.lerp(cameraPosition, 0.1);
        
        // Look at UFO
        this.camera.lookAt(ufoPosition);
    }

    updateCows() {
        const deltaTime = this.clock.getDelta();
        
        this.cows.forEach((cow, index) => {
            if (cow.isBeingAbducted) {
                cow.abductionProgress += 0.02;
                
                // Move cow towards UFO
                const ufoPosition = this.ufo.position.clone();
                cow.mesh.position.lerp(ufoPosition, 0.05);
                
                // Spin the cow while being abducted
                cow.mesh.rotation.y += 0.1;
                cow.mesh.rotation.x = Math.sin(Date.now() * 0.003) * 0.2;
                
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
                // Wandering behavior on planet surface
                cow.wanderTime += deltaTime;
                
                // Change direction every few seconds
                if (cow.wanderTime > 3) {
                    cow.wanderAngle = Math.random() * Math.PI * 2;
                    cow.wanderTime = 0;
                }
                
                // Move in current direction on planet surface
                const speed = 0.3;
                let newLongitude = cow.longitude;
                let newLatitude = cow.latitude;
                
                newLongitude += Math.cos(cow.wanderAngle) * speed;
                newLatitude += Math.sin(cow.wanderAngle) * speed;
                
                // Wrap and clamp coordinates
                if (newLongitude > 180) newLongitude -= 360;
                if (newLongitude < -180) newLongitude += 360;
                newLatitude = Math.max(-85, Math.min(85, newLatitude));
                
                // Update cow position
                this.positionOnPlanet(cow.mesh, newLongitude, newLatitude, 1);
                cow.longitude = newLongitude;
                cow.latitude = newLatitude;
                
                // Rotate cow to face movement direction
                cow.mesh.rotateY(cow.wanderAngle);
                
                // Check if cow is under UFO beam
                const distance = cow.mesh.position.distanceTo(this.ufo.position);
                if (distance < 5) {
                    cow.isBeingAbducted = true;
                }
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateUFO();
        this.updateCows();
        
        // Slowly rotate the planet
        this.planet.rotation.y += 0.0005;
        
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
