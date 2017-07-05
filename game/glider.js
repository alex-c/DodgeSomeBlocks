function createGlider(gameInstance) {

    var loader = new THREE.ColladaLoader();
    loader.load('assets/models/Futuristic combat jet.dae', function(collada) {
        var object = collada.scene;
        object.scale.set(1, 1, 1);
        object.position.set(0, 10, 0);
        object.rotation.z = 1.57;
        console.log(object.rotation);
        gameInstance.gliderModel = object;
        gameInstance.scene.add(object);
        gameInstance.start();

	}, function(xhr) {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	});

    var geometry = new THREE.BoxGeometry(25, 20, 16);
	var material = new THREE.MeshPhongMaterial({color: 0x00AAFF, transparent: true, opacity: 0});
    var glider = new THREE.Mesh(geometry, material);
    glider.position.set(-10, 10, 0);
    gameInstance.glider = glider;
    gameInstance.scene.add(glider);
}
