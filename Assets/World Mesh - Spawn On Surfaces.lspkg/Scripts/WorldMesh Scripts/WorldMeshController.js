/**
// Name: WorldMeshController.js
// Version: 0.0.1
// Description: Provides the ability to understand surfaces in the real world at a specific point, 
// or, when world mesh is not available, defines a virtual surface. 
*/

//@input Component.DeviceTracking tracker
//@input Component.RenderMeshVisual worldMesh
//@input bool enableFakeResult = true
//@input bool printDebug = false

global.WorldMeshController = {
    numberOfTypes: 8,
    surfaceType: {
        None: 0,
        Wall: 1,
        Floor: 2,
        Ceiling: 3,
        Table: 4,
        Seat: 5,
        Window: 6,
        Door: 7
    }
};


/* 
 * Start customization section 
 *
 * The following section allows you to define virtual surfaces in cases
 * where device does not have the ability to provide information about
 * surfaces in the real world.
 * 
 * By default, a fake floor, table, and wall virtual surfaces 
 * is provided as an example.
 * 
 * To add your own, copy and modify one of the example result objects, 
 * then add them to the `fakeResultsPool` array. When no information is available
 * from the device, the script will randomly choose one of these results.
 * 
 */

var fakeFloorResult = {
    isValid: function() {
        return true;
    },
    getWorldPos: function() {
        return new vec3(Math.random() * 250 - 125, -50, Math.random() * 250 - 50);
    },
    getNormalVec: function() {
        return vec3.up();
    },
    getClassification: function() {
        return global.WorldMeshController.surfaceType.Floor;
    }
};
var fakeTableResult = {
    isValid: function() {
        return true;
    },
    getWorldPos: function() {
        return new vec3(Math.random() * 100 - 80, 0, Math.random() * 100 - 120);
    },
    getNormalVec: function() {
        return vec3.up();
    },
    getClassification: function() {
        return global.WorldMeshController.surfaceType.Table;
    }
};
var fakeWallResult = {
    isValid: function() {
        return true;
    },
    getWorldPos: function() {
        return new vec3(Math.random() * 300 - 150, Math.random() * 200, -150);
    },
    getNormalVec: function() {
        return vec3.forward();
    },
    getClassification: function() {
        return global.WorldMeshController.surfaceType.Wall;
    }
};
var fakeResultsPool = [fakeFloorResult, fakeTableResult, fakeWallResult];

/* 
 * End customization section 
 */

function initialize() {
    if (validateInputs()) {
        worldMeshHit();
        global.WorldMeshController.isInitialize = true;
    }
}

function validateInputs() {
    if (!script.tracker) {
        print("ERROR: Make sure to set the Device Tracking Component to the script.");
        global.WorldMeshController.isInitialize = false;
        return false;
    }
    if (!script.worldMesh) {
        print("ERROR: Make sure to set the World Mesh to the script.");
        global.WorldMeshController.isInitialize = false;
        return false;
    }

    return true;
}

function isWorldMeshCapable() {
    var os = global.deviceInfoSystem.getOS();
    var isMobile = os === OS.iOS || os === OS.Android;
    var isInteractivePreview = global.deviceInfoSystem.isEditor() && script.tracker.worldTrackingCapabilities.sceneReconstructionSupported;
    return isInteractivePreview 
        || (isMobile && script.tracker.isDeviceTrackingModeSupported(DeviceTrackingMode.World));
}

var HitTestResult = function(isValid, res) {
    this._isValid = isValid;
    this._res = res;

    this.isValid = function() {
        return this._isValid;
    };

    this.getWorldPos = function() {
        return this._res.position;
    };

    this.getNormalVec = function() {
        return this._res.normal;
    };

    this.getClassification = function() {
        return this._res.classification;
    };
};


function worldMeshHit() {
    if (!isWorldMeshCapable()) {
        printDebug("Scene reconstruction not supported");
        if(!script.enableFakeResult){
            return;
        } 
        script.tracker.requestDeviceTrackingMode(DeviceTrackingMode.Surface);

        global.WorldMeshController.getHitTestResult = function() {
            return fakeResultsPool[getRandomInt(fakeResultsPool.length)];
        };

        global.WorldMeshController.getHitTestResult3D = function() {
            return {
                isValid: function() {
                    return true;
                },
                getWorldPos: function() {
                    return new vec3(0, 100, -200);
                },
                getNormalVec: function() {
                    return vec3.zero();
                },
                getClassification: function() {
                    return 0;
                }
            };
        };

        global.WorldMeshController.findEdge = function() {
            return [];
        };

    } else {
        var worldTrackingProvider = script.worldMesh.mesh.control;
        worldTrackingProvider.meshClassificationFormat = MeshClassificationFormat.PerVertexFast;
        worldTrackingProvider.useNormals = true;
        worldTrackingProvider.enableDepthModelBasedTracking = true;


        global.WorldMeshController.getHitTestResult = function(screenPos) {
            var resultIsValid = false;
            var res = {};

            if (script.tracker.hitTestWorldMesh != null) {
                var resArray = script.tracker.hitTestWorldMesh(screenPos);

                if (resArray.length) {
                    res = resArray[0];
                    resultIsValid = true;
                }
            }

            return new HitTestResult(resultIsValid, res);
        };

        global.WorldMeshController.getHitTestResult3D = function(from, to) {
            var resultIsValid = false;
            var res = {};
            if (script.tracker.raycastWorldMesh != null) {
                var resArray = script.tracker.raycastWorldMesh(from, to);
                if (resArray.length) {
                    res = resArray[0];
                    resultIsValid = true;
                }
            }
            return new HitTestResult(resultIsValid, res);
        };

        global.WorldMeshController.findEdge = function(searchWorldSurfaceType) {
            var trackerTransform = script.tracker.getTransform();
            var camPos = trackerTransform.getWorldPosition();
            var camDirDir = trackerTransform.back;
            var camDirDirXZ = new vec3(camDirDir.x, 0, camDirDir.z);
            camDirDirXZ = camDirDirXZ.normalize();

            var frontOffs = 300.0;
            var dirSpaced = camDirDirXZ.uniformScale(frontOffs);
            var traceCenter = camPos.add(dirSpaced);
            var resArray = script.tracker.detectEdges(traceCenter, 200, searchWorldSurfaceType, 20);
            return resArray;
        };
    }
}


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function printDebug(msg, force) {
    if (script.printDebug || force) {
        print("[WorldMeshController] " + msg + "");
    }
}

initialize();