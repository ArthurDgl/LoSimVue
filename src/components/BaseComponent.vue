<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const DEFAULT_BORDER_RADIUS = 10;

export default {
    props: ["componentData"],
    data() {
        return {
            screenPosition: {x:0, y: 0},
            screenWidth: 0,
            screenHeight: 0,
            borderRadius: 0,
            visibility: "visible",
        };
    },
    methods: {
        moveWithCamera(camera, zoom, windowWidth, windowHeight) {
            this.screenPosition.x = (this.componentData.position.x - camera.x) * zoom;
            this.screenPosition.y = (this.componentData.position.y - camera.y) * zoom;

            this.screenWidth = this.componentData.width * zoom;
            this.screenHeight = this.componentData.height * zoom;

            this.borderRadius = DEFAULT_BORDER_RADIUS * zoom;

            if (
                this.screenPosition.x > windowWidth
                || this.screenPosition.x + this.screenWidth < 0
                || this.screenPosition.y > windowHeight
                || this.screenPosition.y + this.screenHeight < 0
            ) {
                this.visibility = "hidden";
            }
            else {
                this.visibility = "visible";
            }
        }
    },
}
</script>

<template>
    <div class="plate" :style="{
        'width':`${this.screenWidth}px`,
        'height':`${this.screenHeight}px`,
        'left':`${this.screenPosition.x}px`,
        'top':`${this.screenPosition.y}px`,
        'border-radius':`${this.borderRadius}px`,
        'visibility':`${this.visibility}`
        }">

    </div>
</template>

<style scoped>
.plate {
    background-color:dimgray;
    position: absolute;
}
</style>