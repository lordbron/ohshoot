/**
// Name: RayCasting.js
// Version: 0.0.1
// Description: Randomly find surfaces and request to spawn objects on them.
*/

//@input Component.ScriptComponent spawner
//@input float surfaceDirVariation  = .4 {"widget":"slider", "min":0.0, "max":1.0, "step":0.01}

if (!script.spawner) {
    print("[RayCasting] InstanceSpawner Script is not set");
}

// How close must a normal be to exact angle (in Radians)
var angleMaxDeviation = script.surfaceDirVariation;

var upVec = vec3.up();

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(function() {
    for (var i = 0; i < 10; i++) {
        rayCastAndSpawn();
    }
});
updateEvent.enabled = false;

function setFullRaycastSpawn(flag) {
    updateEvent.enabled = flag;
}

function rayCastAndSpawn() {
    if (global.WorldMeshController.isInitialize) {
        var rayCastRes = global.WorldMeshController.getHitTestResult(new vec2(Math.random(), Math.random()));

        if (!rayCastRes.isValid()) {
            return;
        }
        spawnOnRaycastResult(rayCastRes);
    }
}

function spawnOnRaycastResult(rayCastRes) {
    if (!script.spawner) {
        return;
    }

    var classification = rayCastRes.getClassification();

    if (script.spawner.instancedSpawners && script.spawner.instancedSpawners[classification] && script.spawner.instancedSpawners[classification].length > 0) {
        var spawnerIdx = getRandomInt(script.spawner.instancedSpawners[classification].length);

        if (script.spawner.instancedSpawners[classification][spawnerIdx] && script.spawner.instancedSpawners[classification][spawnerIdx].maxInstanceCountReached()) {
            return false;
        }

        var spawnerObject = script.spawner.instancedSpawners[classification][spawnerIdx];
        if (!spawnerObject) {
            return false;
        }

        var pos = rayCastRes.getWorldPos();
        var normal = rayCastRes.getNormalVec();

        // Filter to return raycast result only on certain surface angles
        // so we can be more specific as to when an object should be spawned:
        // whether it is by surface classifcation or by angle.
        // Especially useful for devices which can't provide surface classifications.
        var angle = normal.angleTo(upVec);
        var directionType = spawnerObject.getDirectionType();
        if (!isNaN(angle)) {
            switch (directionType) {
                case "up":
                    if (!(angle > -angleMaxDeviation && angle < angleMaxDeviation)) {
                        return false;
                    }
                    break;
                case "vertical":
                    if (!(angle > Math.PI/2 - angleMaxDeviation && angle < Math.PI/2 + angleMaxDeviation)) {
                        return false;
                    }
                    break;
                case "down":
                    if (!(angle > Math.PI - angleMaxDeviation && angle < Math.PI + angleMaxDeviation)) {
                        return false;
                    }
                    break; 
            }
        }
        

        var transform = script.spawner.transformGetters[classification][spawnerIdx].getTransform(pos, normal);
        var success = spawnerObject.spawnObject(transform.position, transform.rotation, 0.0, 1.0);
        return success;
    }
    return false;
}


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

setFullRaycastSpawn(true);