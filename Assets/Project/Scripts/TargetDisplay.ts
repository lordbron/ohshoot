// import required modules
import { Scoreboard } from "./Scoreboard"
import { BaseTarget } from "./BaseTarget"
const EPSILON = 0.01

// based on code in the "World Mesh - Spawn on Surface" Asset in Lens Studio Asset Library 
// For Asset Library info: https://developers.snap.com/lens-studio/assets-pipeline/asset-library/asset-library-overview
@component
export class TargetDisplay extends BaseScriptComponent {
  // this is the target you want this display to instatiate during layout
  @input
  targetPrefab!: ObjectPrefab

  // the world mesh so we can spawn enemies "on the real world"
  @input
  worldMesh!: RenderMeshVisual

  // For spectacles, this is the camera object 
  @input
  tracker!: DeviceTracking

  @input
  scoreboard!: Scoreboard

  // the folowing properties are to control how frequently you want enemies to appear
  // while the defaul is slow, I plan on speeding it up to make the game harder as you play
  
  // the smaller number here, the faster they spawn
  private frequencyInFrames = 100

  // the max is just so we don't let the counter get big, but adjustable for slower values
  private frameCountMax = 601

  // keeping count of which frame we're on
  private currentFrameCount = 0

  
  onAwake() {
    // standard update event setup
    this.createEvent('UpdateEvent').bind(this.onUpdate.bind(this));
  }

  // once we have a hit, let's handle it
  onHitTestResult(results) {

      // let's instantiate a new object
      const targetObject = this.targetPrefab.instantiate(this.sceneObject);

      // get hit information
      const hitPosition = results.position
      const hitNormal = results.normal
      const baseTarget = targetObject.getComponent(BaseTarget.getTypeName())
      baseTarget.scoreboard = this.scoreboard
      baseTarget.pointValue = 1

      // leaving this in to add scary rotate towards player effect
      var lookDirection;
      if (1 - Math.abs(hitNormal.normalize().dot(vec3.up())) < EPSILON) {
        lookDirection = vec3.forward();
      } else {
        lookDirection = hitNormal.cross(vec3.up());
      }

      const toRotation = quat.lookAt(lookDirection, hitNormal);

      //identifying the direction the object should look at based on the normal of the hit location.
      // //set position and rotation
      targetObject.getTransform().setWorldRotation(toRotation);
      targetObject.getTransform().setWorldPosition(hitPosition);
  }

  onUpdate() {
    // use data to control spawning speed
    this.currentFrameCount += 1
    if ((this.currentFrameCount % this.frequencyInFrames) == 0) {
      // check a hit test at a random spot
      var resArray = this.tracker.hitTestWorldMesh(new vec2(Math.random(), Math.random()))
      var res = {};

      // if we have a hit
      if (resArray.length) {
          res = resArray[0]

          // let's spawn an enemy
          this.onHitTestResult(res)
      }
    }

    // reset to zero now and again just to avoid large numbers
    if (this.currentFrameCount >= this.frameCountMax) {
      this.currentFrameCount = 0
    }   
  }
}