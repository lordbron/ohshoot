@component
export class BaseProjectile extends BaseScriptComponent {
    onAwake() {
        this.setupCollisionDetection()
    }

      // Setup collision detection for scoring
  private setupCollisionDetection(): void {
    // Get the collider component on the projectile
    const collider = this.sceneObject.getComponent("Physics.ColliderComponent") as any
    if (collider) {
      print("Collider found.")
      // Setup overlap events
      const self = this
      collider.onOverlapEnter.add((e) => {
        const hitObject = e.overlap.collider.getSceneObject()
          print("Overlapping " + hitObject.name)

        // Check if it hit the rotating target or any other target
        if (hitObject.name.includes("Target")) {
        //   this.score += 10 // Increase score
        //   print("Target hit! Score: " + this.score)

        //   // Update score text
        //   if (this.scoreText) {
        //     ;(this.scoreText as any).text = "Score: " + this.score
        //   }

          // Destroy the projectile and target after hitting
        hitObject.destroy()
        self.sceneObject.destroy()
        print("Destroy both")

        //   this.sceneObject.destroy()
        print("Hit a target!")
        } else if (hitObject.name.includes("World")) {
          print("Splat")
        } else {
          // self.sceneObject.destroy()
          print("Not a target!")
        }
      })
    } else {
      print("No collider found.")
    }
  }

}
