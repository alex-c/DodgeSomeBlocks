
var WorldGeneration = new function() {

    this.planes = function(options) {

        var planes = [];

        //Main plane - obstacle stretch
        var mainPlaneGeometry = new THREE.PlaneGeometry(options.worldLength, options.worldWidth);
        var hexTexture = new THREE.TextureLoader().load("assets/textures/egrid.jpg");
        hexTexture.wrapS = THREE.RepeatWrapping;
        hexTexture.wrapT = THREE.RepeatWrapping;
        hexTexture.repeat.set(options.worldWidth/128*(options.worldLength/options.worldWidth), options.worldWidth/128);
        var mainPlaneMaterial = new THREE.MeshPhongMaterial({map: hexTexture});
        var mainPlane = new THREE.Mesh(mainPlaneGeometry, mainPlaneMaterial);
        mainPlane.rotation.x = -0.5 * Math.PI;
        mainPlane.position.x = options.worldLength / 2 + options.worldWidth / 2;
        mainPlane.position.y = 0;
        mainPlane.position.z = 0;
        mainPlane.receiveShadow = true;
        planes.push(mainPlane);

        //Start & end zones
        var zoneGeometry = new THREE.PlaneGeometry(options.worldWidth, options.worldWidth);
        var hazardTexture = new THREE.TextureLoader().load("assets/textures/hazard.jpg");
        hazardTexture.wrapS = THREE.RepeatWrapping;
        hazardTexture.wrapT = THREE.RepeatWrapping;
        var zoneMaterial = new THREE.MeshPhongMaterial({map: hazardTexture});
        var startZone = new THREE.Mesh(zoneGeometry, zoneMaterial);
        startZone.rotation.x = -0.5 * Math.PI;
        startZone.position.x = 0;
        startZone.receiveShadow = true;
        planes.push(startZone);
        var endZone = new THREE.Mesh(zoneGeometry, zoneMaterial);
        endZone.rotation.x = -0.5 * Math.PI;
        endZone.position.x = options.worldLength + options.worldWidth;
        endZone.receiveShadow = true;
        planes.push(endZone);

        return planes;

    }

    this.sky = function() {
        var sky = new THREE.Sky();
        sky.uniforms.luminance.value = 1.15;
        sky.uniforms.turbidity.value = 15;
        return sky;
    }

    this.sun = function() {
        var sunSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(20000, 16, 8),
            new THREE.MeshBasicMaterial({color: 0xffffff})
        );
        sunSphere.position.x = 700000;
        sunSphere.position.y = 50000;
        sunSphere.position.z = 100000
        sunSphere.visible = false;
        return sunSphere;
    }

    this.obstacles = function(options) {
        var obstacles = [];
        var distance = options.obstacleDistance + options.worldWidth / 2;
        var obstacleQuantity;
        var obstacleTexture = new THREE.TextureLoader().load("assets/textures/obstacle.jpg");
        while(distance < options.worldLength + options.worldWidth / 2) {
            obstacleQuantity = this.randInt(1, options.maxObstacleQuantity);
            for(var i = 1; i <= obstacleQuantity; i++) {
                var depth = this.randInt(10, options.maxObstacleSize);
                var height = this.randInt(10, options.maxObstacleSize);
                var width = this.randInt(10, options.maxObstacleSize);
                var boxGeometry = new THREE.BoxGeometry(depth, height, width);
                var material = new THREE.MeshPhongMaterial({map: obstacleTexture});
                //var material = new THREE.MeshPhongMaterial({color: this.randRBGColorString()});
                var cube = new THREE.Mesh(boxGeometry, material);
                cube.position.x = distance;
                cube.position.y = height / 2;
                cube.position.z = this.randInt(-options.worldWidth/2, options.worldWidth/2);
                cube.castShadow = true;
                obstacles.push(cube);
            }
            distance += options.obstacleDistance;
        }
        return obstacles;
    }

    this.powerups = function(options) {
        var powerups = [];
        var distance = options.obstacleDistance + options.worldWidth / 2 + options.obstacleDistance / 2;
        var powerupTexture = new THREE.TextureLoader().load("assets/textures/powerup.jpg");
        while(distance < options.worldLength + options.worldWidth / 2) {
            if(this.randInt(1, 100) <= options.powerupChance) {
                var boxGeometry = new THREE.BoxGeometry(16, 16, 16);
                var material = new THREE.MeshPhongMaterial({map: powerupTexture});
                var cube = new THREE.Mesh(boxGeometry, material);
                cube.position.x = distance;
                cube.position.y = 16;
                cube.position.z = this.randInt(-options.worldWidth/2, options.worldWidth/2);
                cube.castShadow = true;
                powerups.push(cube);
            }
            distance += options.obstacleDistance;
        }
        return powerups;
    }

    this.powerdowns = function(options) {
        var powerdowns = [];
        var distance = options.obstacleDistance + options.worldWidth / 2 + options.obstacleDistance / 2;
        var powerdownTexture = new THREE.TextureLoader().load("assets/textures/powerdown.bmp");
        while(distance < options.worldLength + options.worldWidth / 2) {
            if(this.randInt(1, 100) <= options.powerdownChance) {
                var boxGeometry = new THREE.BoxGeometry(16, 16, 16);
                var material = new THREE.MeshPhongMaterial({map: powerdownTexture});
                var cube = new THREE.Mesh(boxGeometry, material);
                cube.position.x = distance;
                cube.position.y = 16;
                cube.position.z = this.randInt(-options.worldWidth/2, options.worldWidth/2);
                cube.castShadow = true;
                powerdowns.push(cube);
            }
            distance += options.obstacleDistance;
        }
        return powerdowns;
    }

    //Helper function for random ints
    this.randInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //Helper function for random RGB colors
    this.randRBGColorString = function() {
        var r = this.randInt(0, 255);
        var g = this.randInt(0, 255);
        var b = this.randInt(0, 255);
        return("rgb("+r+","+g+","+b+")");
    }

}
