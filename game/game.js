
function Game(selector, options, cameraMode, debugMode) {

    //UI Callbacks
    this.callbacks = {
        gameEnd: function(won) {},
        updateStats: function(remainingDistance, speed) {},
        event: function(event, value) {},
        effect: function(effect, duration) {}
    }

    //Options defaults
    this.options = {
        worldLength: options.worldLength || Presets.normal.worldLength,
        worldWidth: options.worldWidth || Presets.normal.worldWidth,
        baseSpeed: options.baseSpeed || Presets.normal.baseSpeed,
        speedIncrement: options.speedIncrement || Presets.normal.speedIncrement,
        strafingSpeed: options.strafingSpeed || 5,
        obstacleDistance: options.obstacleDistance || Presets.normal.obstacleDistance,
        maxObstacleQuantity: options.maxObstacleQuantity || Presets.normal.maxObstacleQuantity,
        maxObstacleSize: options.maxObstacleSize || Presets.normal.maxObstacleSize,
        powerupChance: options.powerupChance || Presets.normal.powerupChance,
        powerdownChance: options.powerdownChance || Presets.normal.powerdownChance,
        cameraMode: cameraMode
    }
    this.debugMode = debugMode || false;

    //Initialize scene, camera & renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.scene.add(this.camera);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xffffff);

    //Add renderer to DOM
    var container = document.querySelector(selector);
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.appendChild(this.renderer.domElement);

    //Axis for debugging
    if (this.debugMode) {
        var axisHelper = new THREE.AxisHelper(25);
        this.scene.add(axisHelper);
    }

    //Sky & sun
    this.sky = WorldGeneration.sky();
    this.sun = WorldGeneration.sun();
    this.sky.uniforms.sunPosition.value.copy(this.sun.position);
    this.scene.add(this.sky.mesh);
    this.scene.add(this.sun);

    //Ambient lighting & fog
    this.scene.add(new THREE.AmbientLight(0x3C3C3C, 0.3));
    this.scene.fog = new THREE.Fog(0x3388CC, 0, 2000);

    //World plane
    var planes = WorldGeneration.planes(this.options);
    for(var i = 0; i < planes.length; i++) {
        this.scene.add(planes[i]);
    }

    //Add glider light
    this.gliderLight = new THREE.SpotLight(0xffffff);
    this.gliderLight.castShadow = true;
    this.gliderLight.shadow.mapSize.width = 512;
    this.gliderLight.shadow.mapSize.height = 512;
    this.gliderLight.shadow.camera.near = 0.5;
    this.gliderLight.shadow.camera.far = 50;
    this.gliderLight.shadow.camera.fov = 30;
    this.gliderLight.position.set(0, 10, 0);
    var targetObject = new THREE.Object3D();
    this.scene.add(targetObject);
    this.gliderLight.target = targetObject;
    this.gliderLight.target.position.set(200, 10, 0);
    this.scene.add(this.gliderLight);

    //Set up position history
    this.positionHistory = [];
    this.positionHistory.push(0);
    this.maxPositionHistory = 10;

    //Set initial camera
    this.cameraMode = this.options.cameraMode; //Can be 'behind' or 'above'
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    //Idle camera properties
    this.idleCameraAngle = 0;
    this.idleCameraRadius = 100;

    //Active game properties
    this.running = false;
    this.powerLock = false;
    this.currentSpeed = this.options.baseSpeed;
    this.isStrafing = false;
    this.strafingDirection = 'none';
    this.effects = {
        glitch: false,
        reversedControls: false,
        speedfreeze: false,
        blackout: false
    }

    //Generate obstacles
    this.obstacles = WorldGeneration.obstacles(this.options);
    for(var i = 0; i < this.obstacles.length; i++) {
        this.scene.add(this.obstacles[i]);
    }
    this.debug(this.obstacles.length + " obstacles generated.");

    //Generate powerups & powerdowns
    this.powerups = WorldGeneration.powerups(this.options);
    for(var i = 0; i < this.powerups.length; i++) {
        this.scene.add(this.powerups[i]);
    }
    this.debug(this.powerups.length + " powerups generated.");
    this.powerdowns = WorldGeneration.powerdowns(this.options);
    for(var i = 0; i < this.powerdowns.length; i++) {
        this.scene.add(this.powerdowns[i]);
    }
    this.debug(this.powerdowns.length + " powerdowns generated.");

    //Digital Glitch
    this.glitchRenderer = new THREE.EffectComposer(this.renderer);
    this.glitchRenderer.addPass(new THREE.RenderPass(this.scene, this.camera));
    var glitchPass = new THREE.GlitchPass();
    glitchPass.renderToScreen = true;
    this.glitchRenderer.addPass(glitchPass);

    //Glider moderl and placeholder.
    this.glider;
    this.gliderModel;
    createGlider(this);
    this.repositionCamera();

}

/**
 * Game.prototype.render - Rendering loop.
 */
Game.prototype.render = function() {
    requestAnimationFrame(this.render.bind(this));
    //Game running
    if(this.running) {
        //Glider movement
        if(!this.effects.speedfreeze) {
            this.currentSpeed = this.currentSpeed + this.options.speedIncrement;
        }
        this.move();
        //Update camera
        this.repositionCamera();
        //Check win conditions
        this.checkWinConditions();
    }
    //Game paused
    else {
        this.idleCameraRotation();
    }
    //Render
    if(this.effects.glitch) {
        this.glitchRenderer.render();
    } else {
        this.renderer.render(this.scene, this.camera);
    }
    //Update UI game stats
    this.callbacks.updateStats(this.options.worldLength - this.glider.position.x, this.currentSpeed);
}

/**
 * Game.prototype.updateViewport - description
 *
 * @param  {number} width  New viewport width.
 * @param  {number} height New viewport height.
 */
Game.prototype.updateViewport = function(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
}

Game.prototype.move = function() {
    //Movement forward
    this.glider.position.x += this.currentSpeed;
    //Strafing
    if(this.isStrafing) {
        var factor = 1;
        if(this.effects.reversedControls) {
            factor = -1;
        }
        if(this.strafingDirection == 'left') {
            this.glider.position.z -= factor * this.options.strafingSpeed;
        } else if(this.strafingDirection == 'right') {
            this.glider.position.z += factor * this.options.strafingSpeed;
        }
    }
    //Update glider light
    if(this.effects.blackout) {
        this.gliderLight.intensity = 0;
    } else {
        this.gliderLight.intensity = 1;
    }
    this.gliderLight.position.set(this.glider.position.x, this.glider.position.y, this.glider.position.z);
    this.gliderLight.target.position.set(this.glider.position.x + 200, this.glider.position.y, this.glider.position.z);
    //Check for obstacle colision
    this.checkForCollision();
    if(!this.powerLock) {
        this.checkForPowerUps();
    }
    //Teleportation
    var teleported = false;
    if(this.glider.position.z < - this.options.worldWidth / 2) {
        this.glider.position.z = this.options.worldWidth / 2 - 10;
        teleported = true;
    } else if(this.glider.position.z > this.options.worldWidth / 2) {
        this.glider.position.z = - this.options.worldWidth / 2 + 10;
        teleported = true;
    }
    if(teleported) {
        this.positionHistory.length = 0;
        this.positionHistory.push(this.glider.position.z);
        this.applyEffect('glitch', 1);
    }
    this.gliderModel.position.set(this.glider.position.x, this.glider.position.y, this.glider.position.z);
    //Update position history
    this.positionHistory.push(this.glider.position.z);
    if(this.positionHistory.length > this.maxPositionHistory) {
        this.positionHistory.shift();
    }
}

Game.prototype.repositionCamera = function() {
    if(this.cameraMode == 'behind') {
        this.camera.position.set(this.glider.position.x - 100, this.glider.position.y + 45, this.positionHistory[0]);
        this.camera.lookAt(this.glider.position);
    } else if(this.cameraMode == 'above') {
        this.cameraTarget.x = this.glider.position.x;
        this.camera.position.set(this.cameraTarget.x - 300, 200, 0);
        this.camera.lookAt(this.cameraTarget);
    }
}

Game.prototype.idleCameraRotation = function() {
    this.camera.position.x = this.glider.position.x + this.idleCameraRadius * Math.cos(this.idleCameraAngle);
    this.camera.position.z = this.glider.position.z + this.idleCameraRadius * Math.sin(this.idleCameraAngle);
    this.idleCameraAngle += 0.01;
    this.camera.lookAt(this.glider.position);
}

Game.prototype.strafing = function(isStrafing, direction) {
    if(this.running) {
        this.isStrafing = isStrafing;
        this.strafingDirection = direction || 'none';
        if (isStrafing) {
            var factor = 1;
            if(this.effects.reversedControls) {
                factor = -1;
            }
            if (direction == 'left') {
                this.gliderModel.rotation.x = -1.57 - (factor*0.2);
            } else if(direction == 'right') {
                this.gliderModel.rotation.x = -1.57 + (factor*0.2);
            }
        } else {
            this.gliderModel.rotation.x = -1.57;
        }
    }
}

Game.prototype.checkForCollision = function() {
    for(var vertexIndex = 0; vertexIndex < this.glider.geometry.vertices.length; vertexIndex++) {
        var localVertex = this.glider.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(this.glider.matrix)
        var directionVector = globalVertex.sub(this.glider.position);
        var ray = new THREE.Raycaster(this.glider.position.clone(), directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(this.obstacles);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            this.end();
        }
    }
}

Game.prototype.checkForPowerUps = function() {
    for(var vertexIndex = 0; vertexIndex < this.glider.geometry.vertices.length; vertexIndex++) {
        var localVertex = this.glider.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(this.glider.matrix)
        var directionVector = globalVertex.sub(this.glider.position);
        var ray = new THREE.Raycaster(this.glider.position.clone(), directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(this.powerups);
        if (!this.powerLock && collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            this.setPowerLock();
            this.scene.remove(collisionResults[0].object);
            var id = this.randInt(1, 2);
            if(id == 1) {
                this.applyPunctualEffect('slowdown', 3);
            } else if(id == 2) {
                this.applyEffect('speedfreeze', 3);
            }
            break;
        }
        collisionResults = ray.intersectObjects(this.powerdowns);
        if (!this.powerLock && collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            this.setPowerLock();
            this.scene.remove(collisionResults[0].object);
            var id = this.randInt(1, 4);
            if(id == 1) {
                this.applyPunctualEffect('speedup', 1);
            } else if(id == 2) {
                this.applyEffect('glitch', 2);
            } else if(id == 3) {
                this.applyEffect('reversedControls', 3)
            } else if(id == 4) {
                this.applyEffect('blackout', 4)
            }
            break;
        }
    }
}

Game.prototype.setPowerLock = function() {
    this.powerLock = true;
    this.debug("--- POWER LOCK ["+parseInt(800-this.currentSpeed)+"]---");
    var that = this;
    setTimeout(function() {
        that.powerLock = false;
        that.debug("--- POWER UNLOCK ---");
    }, 800-this.currentSpeed);
}

Game.prototype.applyEffect = function(effect, time) {
    this.debug("Applying " + effect + "...");
    this.effects[effect] = true;
    var that = this;
    var effect = effect;
    setTimeout(function() {
        that.effects[effect] = false;
    }, time*1000);
    this.callbacks.effect(effect, time);
}

Game.prototype.applyPunctualEffect = function(effect, value) {
    this.debug("Applying " + effect + "...");
    if(effect == 'slowdown') {
        this.currentSpeed -= value;
        if(this.currentSpeed < 1) {
            this.currentSpeed = 1;
        }
    } else if(effect == 'speedup') {
        this.currentSpeed += value;
    }
    this.callbacks.event(effect, value);
}

Game.prototype.checkWinConditions = function() {
    if(this.glider.position.x >= this.options.worldLength + this.options.worldWidth / 2) {
        this.glider.position.x = this.options.worldLength + this.options.worldWidth;
        this.glider.position.z = 0;
        this.gliderModel.position = this.glider.position;
        this.end(true);
    }
}

Game.prototype.start = function() {
    this.running = true;
}

Game.prototype.pause = function() {
    this.running = false;
}

Game.prototype.end = function(won) {
    var won = won || false;
    this.running = false;
    this.scene.remove(this.gliderLight);
    this.callbacks.gameEnd(won);
}

//Debug output
Game.prototype.debug = function(text) {
    if(this.debugMode) {
        console.log(text);
    }
}

//Helper function for random ints
Game.prototype.randInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
