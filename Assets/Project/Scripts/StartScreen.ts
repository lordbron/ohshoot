import { BaseProjectile } from "./BaseProjectile"
import { TargetDisplay } from "./TargetDisplay"

// This class handles everything associated with the start screen
@component
export class StartScreen extends BaseScriptComponent {    

  // the targetDisplay class lays out the enemies and controls leveling up
  @input
  targetDisplay!: TargetDisplay

  // storage for the event registration to remove when we're done with the start screen
  private eventReg: EventRegistration
  onAwake() {
      // setup collision detectors so we can act when it's shot
      this.setupCollisionDetection()
  }

  // Setup collision detection for scoring
  private setupCollisionDetection(): void {
    // Get the collider component on the projectile
    const collider = this.sceneObject.getComponent("Physics.ColliderComponent") as any
    if (collider) {
      // save a reference to ourself
      const self = this
      // Setup overlap events
      this.eventReg = collider.onOverlapEnter.add((e) => {
        // get the object we collided with
        const hitObject = e.overlap.collider.getSceneObject()
        // if it's named Sphere it's likely a shot the player lobbed at it
        if (hitObject.name == "Sphere") {
          // let's remove ourself...
          self.remove()
          // ... so the player can start the game
          self.targetDisplay.startGame()
        }
      })
    } else {
      print("No collider found.")
    }
  }

  // take action when the start screen needs to be removed
  private remove(): void {
    // grab the collider
    const collider = this.sceneObject.getComponent("Physics.ColliderComponent") as any
    
    // remove our event listener
    collider.onOverlapEnter.remove(this.eventReg)
    
    // then disable the object
    this.sceneObject.enabled = false
  }
}
