/**
// Name: CloneMaterialToObjects
// Version: 0.0.1
// Description: To optimize project, we clone materials in runtime. 
// You can have one source material and duplicate them for each mesh it's on with this script
*/

// @input Asset.Material materialToCopy
// @input SceneObject[] objectsRequiringMaterial

if (!script.materialToCopy) {
    print("CloneMaterialToObjects: Please assign a material to script that you want cloned to objects.");
    return;
}

for (var i = 0; i < script.objectsRequiringMaterial.length; i++) {
    var object = script.objectsRequiringMaterial[i];

    if (!object) {
        return;
    }

    var meshVisual = object.getComponent("Component.RenderMeshVisual");

    if (!meshVisual) {
        return;
    }

    meshVisual.clearMaterials();
    meshVisual.addMaterial(script.materialToCopy.clone());
}