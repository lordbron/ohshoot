import {Scoreboard} from "./Scoreboard"

@component
export class BaseTarget extends BaseScriptComponent {
    @input
    spawnSound: AudioComponent

    @input
    shotSound: AudioComponent


    public scoreboard:Scoreboard
    public pointValue = 0
    onAwake() {
        let event = this.createEvent('OnStartEvent');
        // Bind the function printTime to the event UpdateEvent
        event.bind(this.playSpawnSound.bind(this));
    }

    playSpawnSound() {
        this.spawnSound.play(1)
    }

    playShotSound() {
        this.shotSound.play(1)
    }

    public killOff() {
        if (this.scoreboard) {
            this.scoreboard.AddScore(this.pointValue)
        }
        this.playShotSound()
        this.sceneObject.destroy()
        
    }

}
