/**
// Name: Instanced Object Controller
// Version: 0.0.1
// Description: Allows you to instantiate objects using shader by passing in transform. 
// The script will take in a transform, write it into a texture, and pass it into a shader 
// which will instantiate a copy at that location
*/

// Set up image component to display generated texture for pos/rot/scale
// @input Component.Image image
// @input bool printDebug = false

// Set up minimum and maximum pos
var minPos = -1000;
var maxPos = 1000;

// Set up minimum and maximum scale, rot
var minRot = -100;
var maxRot = 100;

// Set up minimum and maximum scale, rot
var minSca = 0;
var maxSca = 100;

// Set up default pos, rot, scale for instantiated object
var defaultPos = new vec3(0, maxPos, 0);
var defaultRot = quat.quatIdentity();
var defaultScale = vec3.zero();


// Constants
var MIN_POS_BITS_TO_FLOAT_CONSTANT = new vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
var ENCODE_MAX_VALUE = 0.99999;

global.InstancedObject = function(instanceId, spawners, pos, rot, studioScales, currentScale, finalScale) {

    this.debugName = "InstanceName";
    this.instanceId = instanceId;
    this.spawners = spawners;
    this.position = pos;
    this.rotation = rot;
    this.studioScales = studioScales;
    this.currentScale = currentScale;
    this.finalScale = finalScale;
    this.isUpdating = true;

    this.setName = function(name) {
        this.debugName = name;
    };

    this.updateScale = function() {
        if (!this.isUpdating) {
            return;
        }

        var id = this.instanceId;
       
        var s = clampLerp(this.currentScale, this.finalScale, 0.1);
        this.currentScale = clampLerp(this.currentScale, this.finalScale, 0.1);

        for (var i = 0; i < this.spawners.length; i++) {
            this.spawners[i].updateInstanceScale(id, s * this.studioScales[i]);
            this.spawners[i].updateShader(true);
        }

        if (Math.abs(this.currentScale - this.finalScale) < 0.01) {
            this.isUpdating = false;
        }
    };

};

global.InstancedObjectController = (function() {
    function InstancedObjectController(sceneObject, maxInstanceCount, resetPosition) {
        if (!sceneObject) {
            printDebug("Error, No object provided to instantiate");
            return;
        }

        if (sceneObject.getComponentCount("Component.RenderMeshVisual") <= 0) {
            printDebug("Error, " + sceneObject.name + " object does not have a render mesh visual to instantiate");
            return;
        }

        if (!sceneObject.getComponent("Component.RenderMeshVisual").mainPass) {
            printDebug("Error, " + sceneObject.name + " object does not have a material to instantiate");
            return;
        }

        this.sceneObject = sceneObject;
        this.sceneObjectTransform = sceneObject.getTransform();

        if (resetPosition) {
            this.initPos = vec3.zero();
        } else {
            this.initPos = this.sceneObjectTransform.getWorldPosition();
        }
        this.initRot = this.sceneObjectTransform.getWorldRotation();
        this.initScale = this.sceneObjectTransform.getWorldScale();

        this.renderMeshVisual = this.sceneObject.getComponent("Component.RenderMeshVisual");
        this.pass = this.renderMeshVisual.mainPass;
        this.pass.instanceCount = 1;
        this.pass.frustumCull = false;
        this.pass.scriptControl = true;
        this.pass.maxInstanceCount = maxInstanceCount;
        this.pass.minPos = minPos;
        this.pass.maxPos = maxPos;
        this.pass.minRot = minRot;
        this.pass.maxRot = maxRot;
        this.pass.minSca = minSca;
        this.pass.maxSca = maxSca;

        this.maxInstanceCount = maxInstanceCount;

        // Set up data structure for how instance information is stored  
        // store pos X in 1st from bottom row pixel
        // store pos Y in 2nd from bottom row pixel
        this.posYPixelStartLoc = this.maxInstanceCount * 4;
        // store pos Z in 3rd from bottom row pixel
        this.posZPixelStartLoc = this.maxInstanceCount * 8;
        // store rot X and Y in 4th from bottom row pixel
        this.rotXYPixelStartLoc = this.maxInstanceCount * 12;
        // store rot Z and W in 5th from bottom row pixel
        this.rotZWPixelStartLoc = this.maxInstanceCount * 16;

        this.createProceduralTexture();

        // Set up scene
        this.sceneObjectTransform.setWorldPosition(vec3.zero());
        this.sceneObjectTransform.setWorldRotation(quat.quatIdentity());
        this.sceneObjectTransform.setWorldScale(new vec3(1, 1, 1));

        // // Set up initial instance at scene;
        this.updateInstancePosition(0, defaultPos);
        this.updateInstanceRotation(0, defaultRot);
        this.updateInstanceScale(0, defaultScale);
    }

    InstancedObjectController.prototype.maxInstanceCountReached = function() {
        if (this.pass) {
            return this.pass.instanceCount >= this.maxInstanceCount;
        }
        return false;
    };

    InstancedObjectController.prototype.createProceduralTexture = function() {
        this.texture = ProceduralTextureProvider.create(this.maxInstanceCount, 5, Colorspace.RGBA);
        this.textureData = new Uint8Array(this.maxInstanceCount * 4 * 5);
        this.pass.transformPosRotTex = this.texture;

        this.textureScale = ProceduralTextureProvider.create(this.maxInstanceCount, 1, Colorspace.R);
        this.textureDataScale = new Uint8Array(this.maxInstanceCount);
        this.pass.transformScaleTex = this.textureScale;

        //debug
        if (script.image) {
            script.image.mainPass.baseTex = this.texture;
        }
    };

    InstancedObjectController.prototype.updateInstancePosition = function(instanceId, raw) {
        var posX = encodeFloat(raw.x, minPos, maxPos).uniformScale(255);
        var posY = encodeFloat(raw.y, minPos, maxPos).uniformScale(255);
        var posZ = encodeFloat(raw.z, minPos, maxPos).uniformScale(255);

        var id = instanceId * 4;
        this.textureData[id + 0] = Math.round(posX.r);
        this.textureData[id + 1] = Math.round(posX.g);
        this.textureData[id + 2] = Math.round(posX.b);
        this.textureData[id + 3] = Math.round(posX.a);

        var id2 = this.posYPixelStartLoc + instanceId * 4;
        this.textureData[id2 + 0] = Math.round(posY.r);
        this.textureData[id2 + 1] = Math.round(posY.g);
        this.textureData[id2 + 2] = Math.round(posY.b);
        this.textureData[id2 + 3] = Math.round(posY.a);

        var id3 = this.posZPixelStartLoc + instanceId * 4;
        this.textureData[id3 + 0] = Math.round(posZ.r);
        this.textureData[id3 + 1] = Math.round(posZ.g);
        this.textureData[id3 + 2] = Math.round(posZ.b);
        this.textureData[id3 + 3] = Math.round(posZ.a);

    };

    InstancedObjectController.prototype.updateInstanceRotation = function(instanceId, raw) {
        var rotR = encodeFloat(raw.x, minRot, maxRot).uniformScale(255);
        var rotG = encodeFloat(raw.y, minRot, maxRot).uniformScale(255);
        var rotB = encodeFloat(raw.z, minRot, maxRot).uniformScale(255);
        var rotA = encodeFloat(raw.w, minRot, maxRot).uniformScale(255);

        var id = this.rotXYPixelStartLoc + instanceId * 4;
        this.textureData[id + 0] = Math.round(rotR.r);
        this.textureData[id + 1] = Math.round(rotR.g);
        this.textureData[id + 2] = Math.round(rotG.r);
        this.textureData[id + 3] = Math.round(rotG.g);

        var id2 = this.rotZWPixelStartLoc + instanceId * 4;
        this.textureData[id2 + 0] = Math.round(rotB.r);
        this.textureData[id2 + 1] = Math.round(rotB.g);
        this.textureData[id2 + 2] = Math.round(rotA.r);
        this.textureData[id2 + 3] = Math.round(rotA.g);

    };

    InstancedObjectController.prototype.updateInstanceScale = function(instanceId, raw) {
        if (instanceId >= 0 && instanceId < this.textureDataScale.length) {
            this.textureDataScale[instanceId] = remap(raw, minSca, maxSca, 0, 255);
        }
    };

    InstancedObjectController.prototype.getInstancePosition = function(instanceId) {
        var id = instanceId * 4;
        var x = new vec4(this.textureData[id + 0], this.textureData[id + 1], this.textureData[id + 2], this.textureData[id + 3]);

        var id2 = this.posYPixelStartLoc + instanceId * 4;
        var y = new vec4(this.textureData[id2 + 0], this.textureData[id2 + 1], this.textureData[id2 + 2], this.textureData[id2 + 3]);

        var id3 = this.posZPixelStartLoc + instanceId * 4;
        var z = new vec4(this.textureData[id3 + 0], this.textureData[id3 + 1], this.textureData[id3 + 2], this.textureData[id3 + 3]);

        var posX = decodeToFloat(x.uniformScale(1 / 255), minPos, maxPos);
        var posY = decodeToFloat(y.uniformScale(1 / 255), minPos, maxPos);
        var posZ = decodeToFloat(z.uniformScale(1 / 255), minPos, maxPos);

        return new vec3(posX, posY, posZ);
    };
    InstancedObjectController.prototype.getInstanceRotation = function(instanceId) {

        var id = this.rotXYPixelStartLoc + instanceId * 4;
        var x = new vec2(this.textureData[id + 0], this.textureData[id + 1]);
        var y = new vec2(this.textureData[id + 2], this.textureData[id + 3]);

        var id2 = this.rotZWPixelStartLoc + instanceId * 4;
        var z = new vec2(this.textureData[id2 + 0], this.textureData[id2 + 1]);
        var w = new vec2(this.textureData[id2 + 2], this.textureData[id2 + 3]);

        var rotR = decodeToFloat(x.uniformScale(1 / 255), minRot, maxRot);
        var rotG = decodeToFloat(y.uniformScale(1 / 255), minRot, maxRot);
        var rotB = decodeToFloat(z.uniformScale(1 / 255), minRot, maxRot);
        var rotA = decodeToFloat(w.uniformScale(1 / 255), minRot, maxRot);

        return new quat(rotA, rotR, rotG, rotB);
    };
    InstancedObjectController.prototype.getInstanceScale = function(instanceId) {
        var scaleY = remap(this.textureDataScale[instanceId], 0, 255, minSca, maxSca);
        return new vec3(scaleY, scaleY, scaleY);
    };


    InstancedObjectController.prototype.spawnObject = function(pos, rot, scale) {
        if (!this.pass) {
            return;
        }

        this.pass.instanceCount++;
        var curInstanceId = this.pass.instanceCount - 1;

        var _pos = pos.add(this.initPos);
        this.updateInstancePosition(curInstanceId, _pos);

        var _rot = rot.multiply(this.initRot);
        this.updateInstanceRotation(curInstanceId, _rot);

        this.updateInstanceScale(curInstanceId, scale);
        return curInstanceId;
    };

    InstancedObjectController.prototype.updateShader = function(scaleOnly) {
        if (!this.texture) {
            return;
        }

        if (!scaleOnly) {
            this.texture.control.setPixels(0, 0, this.maxInstanceCount, 5, this.textureData);
        }

        this.textureScale.control.setPixels(0, 0, this.maxInstanceCount, 1, this.textureDataScale);
    };

    return InstancedObjectController;
}());

// Helpers to convert pack floats. Use with Unpack node in Material Editor
function fract(float) {
    var n = Math.abs(float);
    var decimal = n - Math.floor(n);
    return decimal;
}

function remap(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function clamp(num, a, b) {
    return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
}

function floatToBits(float) {
    var x = fract(1 * float),
        y = fract(255 * float),
        z = fract(65025 * float),
        w = fract(16581375 * float);

    var a = y / 255,
        b = z / 255,
        c = w / 255,
        d = 0;

    return new vec4(x - a, y - b, z - c, w - d);
}

function encodeFloat(value, min, max) {
    return floatToBits(remap(clamp(value, min, max), min, max, 0.0, ENCODE_MAX_VALUE));
}

function bitsToFloat(raw) {
    var v = raw;

    if (raw.w === undefined) {
        var a = [raw.x, raw.y, raw.z].map(function(v) {
            return Math.floor(v * 65025 + 0.5) / 65025;
        });
        v = new vec4(a[0], a[1], a[2], 0);
    }

    return v.dot(MIN_POS_BITS_TO_FLOAT_CONSTANT);
}

function decodeToFloat(value, min, max) {
    return remap(bitsToFloat(value), 0.0, ENCODE_MAX_VALUE, min, max);
}

function clampLerp(value1, value2, amount) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
}

function printDebug(msg, force) {
    if (script.printDebug || force) {
        print("[CPU Instance Controller] " + msg);
    }
}