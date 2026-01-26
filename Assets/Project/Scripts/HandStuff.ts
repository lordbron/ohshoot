// A class to handle all things related to hands in the lens
@component
export class HandStuff extends BaseScriptComponent {
  @input()
  visualSceneObject: SceneObject;

  @input()
  rightHand: HandTracking3DAsset;

  private objectTracking3DComponent: ObjectTracking3D;

  onAwake() {
    this.objectTracking3DComponent = this.sceneObject.createComponent(
      'Component.ObjectTracking3D'
    );
    this.objectTracking3DComponent.trackingAsset = this.rightHand;
    this.objectTracking3DComponent.addAttachmentPoint(
      'index-3',
      this.visualSceneObject
    );
  }
}