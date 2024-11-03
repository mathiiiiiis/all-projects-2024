let scene, camera, renderer;
let car, ground;
let speed = 0;
let turnSpeed = 0.03;
let wheels = [];
let loader;
const baseRotation = 90 * (Math.PI / 180);
let velocity = 0;
const maxSpeed = 1.5;
const acceleration = 0.05;
const reverseAcceleration = 0.03;
const friction = 0.02;
const steeringSensitivity = 0.03;
let steerAngle = 0;

let isJumping = false;
let jumpSpeed = 0;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    const groundTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/checker.png');
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(20000, 20000);
    const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    loader = new THREE.GLTFLoader();
    loader.load(
        '/mnt/data/low-poly_truck_car_drifter.glb',
        function (gltf) {
            car = gltf.scene;
            car.scale.set(0.01, 0.01, 0.01);
            car.position.set(0, 0.5, 0);
            car.rotation.y = baseRotation;
            scene.add(car);

            car.traverse(function (child) {
                if (child.isMesh && child.name.toLowerCase().includes("wheel")) {
                    wheels.push(child);
                }
            });
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    createSimpleEnvironment();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    animate();
}

function createSimpleEnvironment() {
    const rampGeometry = new THREE.BoxGeometry(8, 2, 10);
    const rampMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(20, 1, 0);
    ramp.rotation.z = -Math.PI / 12;
    scene.add(ramp);

    const barrierGeometry = new THREE.BoxGeometry(2, 3, 20);
    const barrierMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    for (let i = 0; i < 4; i++) {
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.set(-30 + i * 20, 1.5, -30);
        scene.add(barrier);
    }

    const treeGeometry = new THREE.ConeGeometry(2, 8, 8);
    const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });

    for (let i = 0; i < 15; i++) {
        const treeGroup = new THREE.Group();
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
        leaves.position.y = 6;
        
        treeGroup.add(trunk);
        treeGroup.add(leaves);
        treeGroup.position.set(
            Math.random() * 160 - 80,
            0,
            Math.random() * 160 - 80
        );
        scene.add(treeGroup);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let keys = {};
function onKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
}
function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}

window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

function animate() {
    requestAnimationFrame(animate);
 
    if (car) {
        const accelerationRate = 0.05;
        const maxReverseSpeed = maxSpeed / 3;
 
        if (keys['s']) {
            velocity = Math.min(velocity + accelerationRate, maxSpeed);
        } else if (keys['w']) {
            velocity = Math.max(velocity - accelerationRate, -maxReverseSpeed);
        } else {
            velocity *= (1 - friction);
            
            if (Math.abs(velocity) < 0.01) {
                velocity = 0;
            }
        }
 
        const maxSteerAngle = Math.PI / 6;
        if (keys['a']) {
            steerAngle = Math.max(steerAngle - 0.05, -maxSteerAngle);
        } else if (keys['d']) {
            steerAngle = Math.min(steerAngle + 0.05, maxSteerAngle);
        } else {
            steerAngle *= 0.8;
        }
        
        const absoluteVelocity = Math.abs(velocity);
        const steeringInfluence = Math.min(absoluteVelocity / maxSpeed, 1);
        
        if (velocity >= 0) {
            car.rotation.y += steerAngle * steeringInfluence;
            car.position.x += velocity * Math.cos(car.rotation.y);
            car.position.z += velocity * Math.sin(car.rotation.y);
        } else {
            car.rotation.y -= steerAngle * steeringInfluence;
            car.position.x -= Math.abs(velocity) * Math.cos(car.rotation.y);
            car.position.z -= Math.abs(velocity) * Math.sin(car.rotation.y);
        }
 
        wheels.forEach(wheel => {
            wheel.rotation.z += Math.abs(velocity) * 0.15;
        });
 
        if (keys[' '] && !isJumping) {
            isJumping = true;
            jumpSpeed = 0.2;
        }
        if (isJumping) {
            car.position.y += jumpSpeed;
            jumpSpeed -= 0.01;
            
            if (car.position.y <= 0.5) {
                car.position.y = 0.5;
                isJumping = false;
                jumpSpeed = 0;
            }
        }
 
        const cameraLerpFactor = 0.1;
        camera.position.x += (car.position.x - camera.position.x) * cameraLerpFactor;
        camera.position.y += ((car.position.y + 5) - camera.position.y) * cameraLerpFactor;
        camera.position.z += ((car.position.z + 12) - camera.position.z) * cameraLerpFactor;
        
        camera.lookAt(car.position);
    }
 
    renderer.render(scene, camera);
}

init();
