import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
const log = new NativeLogger("MyNativeLogger")

@component
export class BaseWeapon extends BaseScriptComponent {
    @input
    projectile!: ObjectPrefab

    @input
    muzzle!:SceneObject

    @input
    @hint("Text component to display score")
    scoreText!: Component

    private shootCount: number = 0
    private score: number = 0
    private rotatingTarget: SceneObject
    private initialSpeed: number = 100.0
    private gravityStrength: number = 1.0
    private dragFactor: number = 0.001

    onAwake() {
    }

    // Fire the arrow projectile
  shootArrow(): void {
    this.shootCount++
    print("🏹 SHOOT ARROW CALLED! Shot #" + this.shootCount + " 🏹")
    print("SHOOTING ARROW - Shot #" + this.shootCount)

    // Calculate the direction from start to end
    const startPos = this.muzzle.getTransform().getWorldPosition()

    // Calculate normalized direction vector precisely
    const shootDir = this.muzzle.getTransform().forward

    // Log shooting parameters for debugging
    print("🎯 Shooting from: " + startPos.toString())
    print("🎯 Direction vector: " + shootDir.toString())

    // Create the projectile
    if (this.projectile) {
        // Instantiate at shooting ray start
        const instance = this.projectile.instantiate(this.sceneObject) ///this.sceneObject.copyWholeHierarchy(this.projectile)
        if (!instance) {
        print("Failed to instantiate projectile")
        return
        }

        // Enable the instance and position it exactly at the start point
        instance.enabled = true
        instance.getTransform().setWorldPosition(startPos)

        // Create a rotation that directly aligns the projectile with the shooting direction
        // The Z-axis of the object should point toward the shooting direction
        ///const lookRotation = this.getLookRotation(shootDir)
        ///instance.getTransform().setWorldRotation(lookRotation)

        // Log rotation info for debugging
        print("🔄 Rotation set to align projectile with direction: " + shootDir.toString())

        // Double-check projectile orientation before applying force
        const objectMatrix = instance.getTransform().getWorldTransform()
        const worldForward = objectMatrix.multiplyDirection(new vec3(0, 0, 1))
        print("🔄 Projectile Z-axis (world space): " + worldForward.normalize().toString())

        // Log projectile setup
        print("🔴 Projectile instantiated at: " + startPos.toString())
        print("🔴 Projectile direction set to: " + shootDir.toString())

        // Get physics body component
        const physicsBody = instance.getComponent("Physics.BodyComponent") as any

        if (physicsBody) {
        // Reset any existing physics state
        physicsBody.velocity = new vec3(0, 0, 0)
        physicsBody.angularVelocity = new vec3(0, 0, 0)

        // Calculate initial velocity based on shooting direction
        const initialVelocity = shootDir.uniformScale(this.initialSpeed)

        try {
            // =================== USE MANUAL MOTION INSTEAD OF PHYSICS ===================
            // Since physics mode isn't working correctly, use manual motion for all projectiles
            print("🔄 Using manual motion for more reliable trajectory")

            // Completely disable the physics body to prevent it from interfering
            physicsBody.enabled = false

            // Set up manual motion with the script component
            this.setupManualMotion(instance, shootDir)
        } catch (e) {
            print("⚠️ Error applying physics: " + e.toString())
            print("Error with physics - falling back to manual motion")

            // Fallback to manual motion if physics fails
            this.setupManualMotion(instance, shootDir)
        }

        } else {
        print("No physics body found on projectile - using manual motion")

        // Use manual motion for non-physics objects
        this.setupManualMotion(instance, shootDir)
        }
    } else {
        print("ERROR: Projectile prefab not assigned!")
    }
    }

  // Set up manual motion for objects without physics or as fallback
  private setupManualMotion(projectile: SceneObject, direction: vec3): void {
    const moveScript = projectile.createComponent("ScriptComponent") as any
    if (moveScript) {
      // Store exact start position for reference
      moveScript.startPosition = projectile.getTransform().getWorldPosition()

      // Store initial trajectory parameters
      moveScript.direction = direction.normalize() // Normalized direction
      moveScript.speed = this.initialSpeed // Speed (units per second)
      moveScript.gravity = this.gravityStrength // Gravity effect
      moveScript.drag = this.dragFactor // Air resistance
      moveScript.flightTime = 0 // Track flight time

      // For debugging
      print("🚀 Starting position: " + moveScript.startPosition.toString())
      print("🚀 Direction: " + moveScript.direction.toString())
      print("🚀 Speed: " + moveScript.speed)

      // Update event that runs every frame to move the projectile
      moveScript.createEvent("UpdateEvent").bind(() => {
        // Get time since last frame
        const dt = getDeltaTime()
        moveScript.flightTime += dt

        // Calculate position based on physics - similar to projectile motion equations:
        // position = startPos + (direction * speed * time) + (0, -0.5 * gravity * time^2, 0)

        // Calculate distance traveled in the x-z plane (horizontal)
        const baseVelocity = moveScript.direction.uniformScale(moveScript.speed)

        // Current horizontal position (without gravity)
        const horizontalOffset = baseVelocity.uniformScale(moveScript.flightTime)

        // Calculate vertical drop due to gravity (only affects Y component)
        // Gravity effect increases over time (t²)
        const time_squared = moveScript.flightTime * moveScript.flightTime
        const gravityDrop = new vec3(0, -0.5 * moveScript.gravity * time_squared, 0)

        // Apply air resistance (simplified - just slows down over time)
        const dragFactor = Math.max(0, 1.0 - moveScript.drag * moveScript.flightTime)
        const horizontalWithDrag = horizontalOffset.uniformScale(dragFactor)

        // Combine all effects to get the new position
        const newPos = moveScript.startPosition.add(horizontalWithDrag).add(gravityDrop)
        projectile.getTransform().setWorldPosition(newPos)

        // Calculate instantaneous velocity for arrow rotation (combine horizontal and vertical)
        const horizVelocity = baseVelocity.uniformScale(dragFactor)
        const vertVelocity = new vec3(0, -moveScript.gravity * moveScript.flightTime, 0)
        const currentVelocity = horizVelocity.add(vertVelocity)

        // Only update rotation if there's meaningful movement
        if (currentVelocity.length > 0.001) {
          const flightDir = currentVelocity.normalize()
          const lookRotation = this.getLookRotation(flightDir)
          projectile.getTransform().setWorldRotation(lookRotation)
        }
      })

    }
  }

  // Simplified collision detection for non-physics objects
  private setupSimpleCollisionDetection(projectile: SceneObject, moveScript: any): void {
    moveScript.createEvent("UpdateEvent").bind(() => {
      const projectilePos = projectile.getTransform().getWorldPosition()

      // If we have a rotating target, check distance to it
      if (this.rotatingTarget) {
        const targetPos = this.rotatingTarget.getTransform().getWorldPosition()
        const distance = targetPos.sub(projectilePos).length

        if (distance < 5.0) {
          // Collision threshold
          this.score += 10 // Increase score
          print("Rotating target hit! Score: " + this.score)

          // Update score text
          if (this.scoreText) {
            ;(this.scoreText as any).text = "Score: " + this.score
          }

          // Destroy projectile
          projectile.destroy()
        }
      }
    })
  }

  // Helper function to find the closest point on a line
  closestPointOnLine(point: vec3, start: vec3, end: vec3): vec3 {
    const lineDirection = end.sub(start)
    const lineLength = lineDirection.length
    const normalizedDirection = lineDirection.normalize()
    const pointDirection = point.sub(start)
    const dot = pointDirection.dot(normalizedDirection)
    const clampedDot = Math.max(0, Math.min(dot, lineLength))
    return start.add(normalizedDirection.uniformScale(clampedDot))
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

}
