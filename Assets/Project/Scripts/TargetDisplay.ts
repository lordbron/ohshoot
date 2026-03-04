// import required modules
import { Scoreboard } from "./Scoreboard"
import { BaseTarget } from "./BaseTarget"
import { LevelSign } from "./LevelSign"
const EPSILON = 0.01

export class GameLevel {
  public difficultlyRank = 1
  public pointsRequiredToContinue = 5
  public timeToFinishInSeconds = 120
  public frequencyInSeconds = 3
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

  // For spectacles, this is on the camera object 
  @input
  tracker!: DeviceTracking

  // the scoreboard that let's the user know their current score
  @input
  scoreboard!: Scoreboard

  // the sign that tells them what level they're on/starting
  @input
  levelSign!: LevelSign

  
  // the smaller number here, the faster enemies spawn
  private frequencyInSeconds = 3

  // when did we last spawn a ducky
  private lastSpawnTime = 0

  // the data associated with the current level
  private currentLevel = new GameLevel()

  // whether or not we should spawn enemies
  private spawnEnemies = false

  
  onAwake() {
    // standard update event setup
    this.createEvent('UpdateEvent').bind(this.onUpdate.bind(this));
  }

  public startGame() {
    // let the level know that it has started
    this.currentLevel.levelStartTime = getTime()
    // start spawning enemies
    this.spawnEnemies = true
  }

  // hide the level sign
  public hideLevelSign() {
    // we currently use enabled to hide
    this.levelSign.enabled = false
  }

  // show the level sign
  public showLevelSign() {
    // we currently use enabled to show
    this.levelSign.enabled = true
  }

  // once we have a hit, let's handle it
  onHitTestResult(results) {

    // let's instantiate a new object
    const targetObject = this.targetPrefab.instantiate(this.sceneObject);

    // get hit information
    const hitPosition = results.position

    // set up items needed for scoring points
    const baseTarget = targetObject.getComponent(BaseTarget.getTypeName())
    baseTarget.scoreboard = this.scoreboard
    baseTarget.pointValue = 1

    //set position
    targetObject.getTransform().setWorldPosition(hitPosition);
  }

  onUpdate() {

    // if they've hit the goal, time to level up
    if (this.scoreboard.scoreValue == this.currentLevel.pointsRequiredToContinue) {
      // reset the score - May change this later, but it was there to help them tract current count
      this.scoreboard.resetScore()
      // you can think of this as the level number
      this.currentLevel.difficultlyRank += 1
      //  up the number of points needed to level up
      this.currentLevel.pointsRequiredToContinue += 10
      // let the spawning happen faster as they level up
      this.currentLevel.frequencyInSeconds -= ((this.currentLevel.difficultlyRank % 2) == 0) ? 1 : 0
      // this used to be frequency in frames, and I may fall back to that as 1 per second still seems slow
      if (this.currentLevel.frequencyInSeconds < 1) {
        this.currentLevel.frequencyInSeconds = 1
      }
      // tell the level sign that it should level up
      this.levelSign.LevelUp(this.currentLevel.difficultlyRank)
      // reset the level start time
      this.currentLevel.levelStartTime = getTime()
      // keep a local copy of the frequency rate - will be used later
      this.frequencyInSeconds = this.currentLevel.frequencyInSeconds

      // if they didn't make points in time, it's game over
    } else if ((getTime() - this.currentLevel.levelStartTime) >= this.currentLevel.timeToFinishInSeconds) {
      // we'll use this in a later commit to control some visuals
      this.currentLevel.gameOver = true
      // stop spawning the enemies
      this.spawnEnemies = false

      // if we're good to spawn some duckies, let's do it
    } else if (this.spawnEnemies) {
      // are we do to spawn another?
      if ((getTime() - this.lastSpawnTime) >= this.currentLevel.frequencyInSeconds)  {
        // check a hit test at a random spot
        var resArray = this.tracker.hitTestWorldMesh(new vec2(Math.random(), Math.random()))
        var res = {};

        // if we have a hit
        if (resArray.length) {
            res = resArray[0]

            // let's spawn an enemy
            this.onHitTestResult(res)
            // update the last spawn time
            this.lastSpawnTime = getTime()
        }
      }
    }
  }
}