@component
export class Scoreboard extends BaseScriptComponent {
    @input
    scoreText: Text

    private scoreValue = 0

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
