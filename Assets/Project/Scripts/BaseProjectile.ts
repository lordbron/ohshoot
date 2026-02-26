import {BaseTarget} from "./BaseTarget"

@component
export class BaseProjectile extends BaseScriptComponent {
    public speed: number = 100.0
    public gravity: number = 1.0
    public drag: number = 0.001
    public startPosition: vec3 = vec3.zero()
    public direction: vec3 = vec3.zero()
    public flightTime: number = 0
    private shouldMove: boolean = true
    private lastPos: vec3 = vec3.zero()
    private spent: boolean = false

    onAwake() {
        this.setupCollisionDetection()
        this.createEvent('UpdateEvent').bind(this.onUpdate.bind(this))
    }
    
    onUpdate() {
      if (this.shouldMove) {
        // Get time since last frame
        const dt = getDeltaTime()
        this.flightTime += dt

        // Calculate position based on physics - similar to projectile motion equations:
        // position = startPos + (direction * speed * time) + (0, -0.5 * gravity * time^2, 0)

        // Calculate distance traveled in the x-z plane (horizontal)
        const baseVelocity = this.direction.uniformScale(this.speed)

        // Current horizontal position (without gravity)
        const horizontalOffset = baseVelocity.uniformScale(this.flightTime)

        // Calculate vertical drop due to gravity (only affects Y component)
        // Gravity effect increases over time (t²)
        const time_squared = this.flightTime * this.flightTime
        const gravityDrop = new vec3(0, -0.5 * this.gravity * time_squared, 0)

        // Apply air resistance (simplified - just slows down over time)
        const dragFactor = Math.max(0, 1.0 - this.drag * this.flightTime)
        const horizontalWithDrag = horizontalOffset.uniformScale(dragFactor)

        // Combine all effects to get the new position
        const newPos = this.startPosition.add(horizontalWithDrag).add(gravityDrop)
        this.getTransform().setWorldPosition(newPos)

        // Calculate instantaneous velocity for arrow rotation (combine horizontal and vertical)
        const horizVelocity = baseVelocity.uniformScale(dragFactor)
        const vertVelocity = new vec3(0, -this.gravity * this.flightTime, 0)
        const currentVelocity = horizVelocity.add(vertVelocity)

        // Only update rotation if there's meaningful movement
        if (currentVelocity.length > 0.001) {
          const flightDir = currentVelocity.normalize()
          const lookRotation = this.getLookRotation(flightDir)
          this.getTransform().setWorldRotation(lookRotation)
        }
      }
    }

  public setupManualMotion(direction: vec3): void {    

      // For debugging
      // print("🚀 Starting position: " + this.startPosition.toString())
      // print("🚀 Direction: " + this.direction.toString())
      // print("🚀 Speed: " + this.speed)
      const self = this
      // Update event that runs every frame to move the projectile
    }
  // Calculate look rotation quaternion from a direction
  private getLookRotation(forward: vec3): quat {
    // Ensure forward is normalized
    forward = forward.normalize()

    // In Lens Studio, the default forward direction is typically (0,0,1)
    const worldForward = new vec3(0, 0, 1)

    // Choose appropriate up vector - default is (0,1,0) but if forward is nearly
    // parallel to that, use (0,0,1) instead
    let upVector = new vec3(0, 1, 0)
    if (Math.abs(forward.dot(upVector)) > 0.99999) {
      upVector = new vec3(1, 0, 0) // Use right vector instead if forward is aligned with up
    }

    // Create a stable right vector
    const right = upVector.cross(forward).normalize()

    // Recalculate a stable up vector to ensure orthogonality
    const up = forward.cross(right).normalize()

    // Build rotation matrix from the orthonormal basis (right, up, forward)
    const m00 = right.x
    const m01 = right.y
    const m02 = right.z
    const m10 = up.x
    const m11 = up.y
    const m12 = up.z
    const m20 = forward.x
    const m21 = forward.y
    const m22 = forward.z

    // Convert the rotation matrix to quaternion
    const trace = m00 + m11 + m22
    const q = new quat(0, 0, 0, 1)

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0)
      q.w = 0.25 / s
      q.x = (m12 - m21) * s
      q.y = (m20 - m02) * s
      q.z = (m01 - m10) * s
    } else if (m00 > m11 && m00 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22)
      q.w = (m12 - m21) / s
      q.x = 0.25 * s
      q.y = (m01 + m10) / s
      q.z = (m20 + m02) / s
    } else if (m11 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22)
      q.w = (m20 - m02) / s
      q.x = (m01 + m10) / s
      q.y = 0.25 * s
      q.z = (m12 + m21) / s
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11)
      q.w = (m01 - m10) / s
      q.x = (m20 + m02) / s
      q.y = (m12 + m21) / s
      q.z = 0.25 * s
    }

    return q
  }

      // Setup collision detection for scoring
  private setupCollisionDetection(): void {
    // Get the collider component on the projectile
    const collider = this.sceneObject.getComponent("Physics.ColliderComponent") as any
    if (collider) {
      // Setup overlap events
      const self = this
      collider.onOverlapEnter.add((e) => {
        if (self.spent) {
          return
        }
        const hitObject = e.overlap.collider.getSceneObject()
        const baseTarget = hitObject.getComponent(BaseTarget.getTypeName())

        // Check if it hit the rotating target or any other target
        if (baseTarget) {
          print("Projectile Overlapping " + hitObject.name)
          print("Project Overlapping basetarget" + baseTarget)
          print("Projectile Overlapping baseTarget? " + ((baseTarget != null)?"y":"n"))
          //   this.score += 10 // Increase score
          //   print("Target hit! Score: " + this.score)

          //   // Update score text
          //   if (this.scoreText) {
          //     ;(this.scoreText as any).text = "Score: " + this.score
          //   }

            // Destroy the projectile and target after hitting
          self.spent = true
            baseTarget.killOff()
            self.sceneObject.destroy()
          print("Destroy both")

        // } else if (hitObject.name.includes("World")) {
        //   print("Splat")
        //   self.shouldMove = false
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
