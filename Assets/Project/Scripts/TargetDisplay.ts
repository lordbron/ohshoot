// import required modules
import { Scoreboard } from "./Scoreboard"
import { BaseTarget } from "./BaseTarget"
const EPSILON = 0.01

export class GameLevel {
  public difficultlyRank = 1
  public pointsRequiredToContinue = 10
  public timeToFinishInSeconds = 60
  public frequencyInFrame = 76
  public levelStartTime = 0
  public gameOver = false
}

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
  private frequencyInFrames = 76

  // the max is just so we don't let the counter get big, but adjustable for slower values
  private frameCountMax = 601

  // keeping count of which frame we're on
  private currentFrameCount = 0

  private currentLevel = new GameLevel()

  private spawnEnemies = true

  
  onAwake() {
    // standard update event setup
    this.createEvent('UpdateEvent').bind(this.onUpdate.bind(this));
    this.currentLevel.levelStartTime = getTime()
    print("go " + this.currentLevel.gameOver)
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

      //set position
      targetObject.getTransform().setWorldPosition(hitPosition);
  }

  onUpdate() {

    if (this.scoreboard.scoreValue == this.currentLevel.pointsRequiredToContinue) {
      this.currentLevel.difficultlyRank += 1
      this.currentLevel.pointsRequiredToContinue += 10
      this.currentLevel.frequencyInFrame -= (this.currentLevel.difficultlyRank % 2) ? 15 : 0
      //this.currentLevel.timeToFinishInSeconds = ((this.currentLevel.difficultlyRank/2) * 60)
      this.currentLevel.levelStartTime = getTime()
      this.currentFrameCount = 0
      this.frequencyInFrames = this.currentLevel.frequencyInFrame
      this.scoreboard.resetScore()
    } else if ((getTime() - this.currentLevel.levelStartTime) >= this.currentLevel.timeToFinishInSeconds) {
      this.currentLevel.gameOver = true
      this.spawnEnemies = false
    } else if (this.spawnEnemies) {
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
}