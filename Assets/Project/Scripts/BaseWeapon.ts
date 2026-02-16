import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
const log = new NativeLogger("MyNativeLogger")

import {BaseProjectile} from "./BaseProjectile"

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
        instance.removeParent()

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
        let baseProjectile = instance.getComponent(
          BaseProjectile.getTypeName()
          );
        baseProjectile.speed = this.initialSpeed
        baseProjectile.gravity = this.gravityStrength
        baseProjectile.drag = this.dragFactor
        baseProjectile.startPosition = startPos
        baseProjectile.direction = shootDir.normalize()


        if (physicsBody) {
        // Reset any existing physics state
        physicsBody.velocity = new vec3(0, 0, 0)
        physicsBody.angularVelocity = new vec3(0, 0, 0)

        // Calculate initial velocity based on shooting direction
        const initialVelocity = shootDir.uniformScale(this.initialSpeed)
        physicsBody.enabled = false
        baseProjectile.setupManualMotion(shootDir)

        } else {
        print("No physics body found on projectile - using manual motion")

        // Use manual motion for non-physics objects
        baseProjectile.setupManualMotion(shootDir)
        }
    } else {
        print("ERROR: Projectile prefab not assigned!")
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


}
