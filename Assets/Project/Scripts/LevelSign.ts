@component
export class LevelSign extends BaseScriptComponent {
    
    // we only need to track the one we're updating
    @input
    levelText: Text

    // everyone starts at level 1, for now
    public levelValue = 1

    onAwake() {
        // let them know what level they're on
        this.updateLevelText()
    }

    public updateLevelText() {
        // time to update the text so it's showing the right level number
        this.levelText.text = this.levelValue.toString()
    }

    // I originally had this as an additive one, but something tells me passing it in will be useful later
    public LevelUp(newLevelValue: number) {
        // update the value, then update the text
        this.levelValue = newLevelValue
        this.updateLevelText()
    }
}
