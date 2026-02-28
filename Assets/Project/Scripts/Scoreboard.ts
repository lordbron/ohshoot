@component
export class Scoreboard extends BaseScriptComponent {
    @input
    scoreText: Text

    public scoreValue = 0

    public resetScore() {
        this.scoreValue = 0
        this.updateScoreText()
    }

    onAwake() {
        this.updateScoreText()
    }

    public updateScoreText() {
        this.scoreText.text = this.scoreValue.toString()
    }

    public AddScore(pointsToAdd: number) {
        this.scoreValue += pointsToAdd
        this.updateScoreText()
    }
}
