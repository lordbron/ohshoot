import SIK from 'SpectaclesInteractionKit.lspkg/SIK';
import { BaseWeapon } from "./BaseWeapon"


@component
export class TriggerShootTracking extends BaseScriptComponent {
    @input
    keypointPrefab: ObjectPrefab // Prefab to instantiate on each keypoint

    @input
    weaponObject!: BaseWeapon // Current weapon

    // use handInputData from SIK to get hand data
    private handInputData = SIK.HandInputData
    private rightHand = this.handInputData.getHand('right')
    private indexTipKeypointSceneObject: SceneObject
    private middleTipKeypointSceneObject: SceneObject
    private middleUpperKeypointSceneObject: SceneObject

    onAwake() {
        this.onUpdatePrefabPosition()
    }

      // Setup collision detection for scoring
    private setupCollisionDetection(): void {
        // Get the collider component on the projectile
        const collider = this.middleUpperKeypointSceneObject.getChild(0).getComponent("Physics.ColliderComponent") as any
        if (collider) {
        print("next finger Collider found.")
        // Setup overlap events
        const self = this
        collider.onOverlapEnter.add((e) => {
            const hitObject = e.overlap.collider.getSceneObject()
            print("Overlapping " + hitObject.name)

            // Check if it hit the rotating target or any other target
            if (hitObject.name.includes("Trigger")) {
                this.weaponObject.shootArrow()
                print("Shoot the weapon!")
            } else {
            // self.sceneObject.destroy()
                print("Not a target!")
            }
        })
        } else {
        print("No collider found.")
        }
    }

    private onUpdatePrefabPosition() {
        this.createEvent('UpdateEvent').bind(() => {
        if (this.rightHand.isTracked()) {
            // Hand is tracked - create prefabs if they don't exist
            if (!this.indexTipKeypointSceneObject) {
                this.indexTipKeypointSceneObject = this.keypointPrefab.instantiate(
                    this.getSceneObject()
                )
                this.indexTipKeypointSceneObject.getChild(0).name = "TriggerFinger"
                print('Right hand tracked - instantiated index tip keypoint prefab');
            }

            // if (!this.middleTipKeypointSceneObject) {
            //     this.middleTipKeypointSceneObject = this.keypointPrefab.instantiate(
            //         this.getSceneObject()
            //     );
            // print('Right hand tracked - instantiated middle tip keypoint prefab');
            // }

            if (!this.middleUpperKeypointSceneObject) {
                this.middleUpperKeypointSceneObject = this.keypointPrefab.instantiate(
                    this.getSceneObject()
                );
                this.middleUpperKeypointSceneObject.getChild(0).name = "NextFinger"
                this.setupCollisionDetection()
                print('Right hand tracked - instantiated middle upper keypoint prefab');
            }

            // Update position and rotation
            const indexTipSOTransform = this.indexTipKeypointSceneObject.getTransform();
            let indexTip = this.rightHand.indexUpperJoint;

            // Set position to keypoint position
            indexTipSOTransform.setWorldPosition(indexTip.position);
            // Set rotation to keypoint rotation
            indexTipSOTransform.setWorldRotation(indexTip.rotation);

            // // Update position and rotation
            // const middleTipSOTransform = this.middleTipKeypointSceneObject.getTransform();
            // let middleTip = this.rightHand.middleTip;

            // // Set position to keypoint position
            // middleTipSOTransform.setWorldPosition(middleTip.position);
            // // Set rotation to keypoint rotation
            // middleTipSOTransform.setWorldRotation(middleTip.rotation);

            // Update position and rotation
            const middleUpperSOTransform = this.middleUpperKeypointSceneObject.getTransform();
            let middleUpper = this.rightHand.middleUpperJoint;

            // Set position to keypoint position
            middleUpperSOTransform.setWorldPosition(middleUpper.position);
            // Set rotation to keypoint rotation
            middleUpperSOTransform.setWorldRotation(middleUpper.rotation);
        } else {
            // Hand is not tracked - destroy prefabs if they exists
            if (this.indexTipKeypointSceneObject) {
            this.indexTipKeypointSceneObject.destroy();
            this.indexTipKeypointSceneObject = null;
            print('Right hand lost - destroyed index tip keypoint prefab');
            }
            // if (this.middleTipKeypointSceneObject) {
            // this.middleTipKeypointSceneObject.destroy();
            // this.middleTipKeypointSceneObject = null;
            // print('Right hand lost - destroyed middle tip keypoint prefab');
            // }
            if (this.middleUpperKeypointSceneObject) {
            this.middleUpperKeypointSceneObject.destroy();
            this.middleUpperKeypointSceneObject = null;
            print('Right hand lost - destroyed middle upper joing keypoint prefab');
            }
        }
        });
    }
}
