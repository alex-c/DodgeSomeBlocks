/**
 *  Game difficulty presets.
 */
var Presets = {
    easy: {
        worldLength: 32000,
        worldWidth: 400,
        baseSpeed: 5,
        speedIncrement: 0,
        obstacleDistance: 500,
        maxObstacleQuantity: 2,
        maxObstacleSize: 50,
        powerupChance: 20,
        powerdownChance: 5
    },
    normal: {
        worldLength: 44000,
        worldWidth: 500,
        baseSpeed: 5,
        speedIncrement: 0.005,
        obstacleDistance: 400,
        maxObstacleQuantity: 2,
        maxObstacleSize: 75,
        powerupChance: 20,
        powerdownChance: 10
    },
    difficult: {
        worldLength: 64000,
        worldWidth: 600,
        baseSpeed: 5,
        speedIncrement: 0.01,
        obstacleDistance: 250,
        maxObstacleQuantity: 3,
        maxObstacleSize: 100,
        powerupChance: 5,
        powerdownChance: 20
    }
};
