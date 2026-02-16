/**
// Name: Spawner
// Version: 0.0.1
// Description: Class that manages spawning of objects; to be used with InstanceController.js
*/

var instancesStorage = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    []
]; // max number of spacing groups
var instancedSpawners = [];
var transformGetters = [];


if (global.WorldMeshController) {
    for (var i = 0; i < global.WorldMeshController.numberOfTypes; i++) {
        instancedSpawners.push([]);
        transformGetters.push([]);
    }
} else {
    print("ERROR: WorldMeshController doesn't exist");
}

if (!global.InstancedObject) {
    print("ERROR: InstancedObjectController doesn't exist");
}

var lateUpdateEvent = script.createEvent("LateUpdateEvent");
lateUpdateEvent.bind(function() {
    for (var i = 0; i < instancesStorage.length; i++) {
        for (var j = 0; j < instancesStorage[i].length; j++) {
            instancesStorage[i][j].updateScale();
        }
    }

});


global.Spawner = function(instancedObjectControllers, studioScales, spacingGroup, spacingGroupsToCheck, spacingRadius) {
    this.spacingGroup = spacingGroup;
    this.spacingRadius = spacingRadius;
    this.spacingGroupsToCheck = spacingGroupsToCheck;

    this.needsVerticalSpawnOnly = false;
    this.needsHorizontalSpawnOnly = false;
    this.isScalingViaY = false;
    this.debugName = "debugName";

    this.instancedObjectControllers = Array.isArray(instancedObjectControllers) ? instancedObjectControllers : [instancedObjectControllers];
    this.studioScales = Array.isArray(studioScales) ? studioScales : [studioScales];

    this.addInstancedObjectController = function(instObjController) {
        this.instancedObjectControllers.push(instObjController);
    };

    this.setDebugName = function(name) {
        this.debugName = name;
    };

    this.getName = function() {
        return this.debugName;
    };

    this.setDirectionType = function(directionType) {
        this.directionType = directionType;
    };

    this.getDirectionType = function() {
        return this.directionType;
    };

    this.spawnObject = function(pos, rot, initialScale, finalScale, ignoreSpacing) {
        if (!ignoreSpacing) {
            for (var j = 0; j < this.spacingGroupsToCheck.length; j++) {
                var groupId = this.spacingGroupsToCheck[j];
                for (var i = 0; i < instancesStorage[groupId].length; i++) {
                    var obj = instancesStorage[groupId][i];

                    var objRadius = 0;
                    for (var k = 0; k < this.spacingGroupsToCheck.length; k++) {
                        if (this.spacingGroupsToCheck[k] === groupId) {
                            objRadius = this.spacingRadius[k];
                        }
                    }

                    var check = obj.position.distance(pos);
                    if (check < objRadius) {
                        return false;
                    }
                }
            }
        }

        this.spawn(pos, rot, initialScale, finalScale);
        return true;

    };

    this.spawn = function(pos, rot, initialScale, finalScale) {
        var instanceId;

        this.instancedObjectControllers.forEach(function(ioc, idx) {
            instanceId = ioc.spawnObject(pos, rot, initialScale);
            ioc.updateShader();
        });

        if (global.InstancedObject) {
            
            var instance = new global.InstancedObject(instanceId, this.instancedObjectControllers, pos, rot, this.studioScales, initialScale, finalScale);
            
            instancesStorage[this.spacingGroup].push(instance);
            return instance;
        }
    };

    this.maxInstanceCountReached = function() {
        var isReached = false;
        instancedObjectControllers.forEach(function(ioc) {
            if (ioc.maxInstanceCountReached()) {
                isReached = true;
            }
        });
        return isReached;
    };
};

script.instancesStorage = instancesStorage;
script.instancedSpawners = instancedSpawners;
script.transformGetters = transformGetters;