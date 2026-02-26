import {Scoreboard} from "./Scoreboard"

@component
export class BaseTarget extends BaseScriptComponent {
    public scoreboard:Scoreboard
    public pointValue = 0

    public killOff() {
        if (this.scoreboard) {
            this.scoreboard.AddScore(this.pointValue)
        }
        this.sceneObject.destroy()
    }

}
