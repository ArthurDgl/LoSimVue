<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const DEFAULT_BORDER_RADIUS = 10;
const DEFAULT_BORDER_WIDTH = 5;
const DEFAULT_PIN_RADIUS = 5;
const DEFAULT_FONT_SIZE = 20;

export default {
    props: ["componentData"],
    data() {
        return {
            screenPosition: {x:0, y: 0},
            screenWidth: 0,
            screenHeight: 0,
            borderRadius: 0,
            borderWidth: 0,
            pinRadius: 0,
            fontSize: 0,
            visibility: "visible",
            zIndex: "auto",
            dragging: false,
            dragOffset: {x: 0, y: 0},
        };
    },
    methods: {
        moveWithCamera() {
            this.screenPosition = this.$parent.worldToScreenCoordinates(this.componentData.position);

            this.borderRadius = this.$parent.scaleToZoom(DEFAULT_BORDER_RADIUS);
            this.borderWidth = this.$parent.scaleToZoom(DEFAULT_BORDER_WIDTH);

            this.pinRadius = this.$parent.scaleToZoom(DEFAULT_PIN_RADIUS);
            this.fontSize = this.$parent.scaleToZoom(DEFAULT_FONT_SIZE);
            
            this.screenWidth = this.$parent.scaleToZoom(this.componentData.width) - this.borderWidth * 2;
            this.screenHeight = this.$parent.scaleToZoom(this.componentData.height) - this.borderWidth * 2;

            this.visibility = this.$parent.isBoxInBounds(this.screenPosition, this.screenWidth, this.screenHeight) ?
                "visible" : "hidden";
        },
        startDrag(event) {
            if (event.pointerType === "mouse" && event.button != 0) return;

            document.body.style.cursor = "move";
            this.zIndex = "1";

            this.dragging = true;

            this.dragOffset = {
                x: event.clientX - this.screenPosition.x,
                y: event.clientY - this.screenPosition.y,
            };

            window.addEventListener("pointermove", this.drag);
            window.addEventListener("touchmove", this.drag);
        },
        drag(event) {
            if (!this.dragging) return;

            let cursorPos = !event.touches ? {x: event.clientX, y: event.clientY} : {x: event.touches[0].clientX, y: event.touches[0].clientY};
            let offsetPos = {
                x: cursorPos.x - this.dragOffset.x,
                y: cursorPos.y - this.dragOffset.y,
            };

            this.componentData.position = this.$parent.screenToWorldCoordinates(offsetPos);

            this.moveWithCamera();
        },
        stopDrag() {
            document.body.style.cursor = "auto";
            this.zIndex = "auto";

            this.dragging = false;
            window.removeEventListener("pointermove", this.drag);
            window.removeEventListener("touchmove", this.drag);
        },
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
        'border-width':`${this.borderWidth}px`,
        'visibility':`${this.visibility}`,
        'zIndex':`${this.zIndex}`,
        'fontSize':`${this.fontSize}px`,
        }"
        
        @pointerdown="this.startDrag"
        @pointerup="this.stopDrag"
        >

        <div class="pin" v-for="(pin, index) in this.componentData.pins.inputs"
        :style="{
            'top':`${(index + 0.5) / (this.componentData.pins.inputs.length) * 100}%`,
            'left':`${-2 * this.borderWidth}px`,
            'border-radius':`${this.pinRadius}px`,
            'width':`${2 * this.pinRadius}px`,
            'height':`${2 * this.pinRadius}px`,
            'background-color':`${(pin.state ? 'crimson' : 'rgb(80, 9, 23)')}`,
        }">
        </div>

        <div class="pin" v-for="(pin, index) in this.componentData.pins.outputs"
        :style="{
            'top':`${(index + 0.5) / (this.componentData.pins.outputs.length) * 100}%`,
            'right':`${-2 * this.borderWidth}px`,
            'border-radius':`${this.pinRadius}px`,
            'width':`${2 * this.pinRadius}px`,
            'height':`${2 * this.pinRadius}px`,
            'background-color':`${(pin.state ? 'crimson' : 'rgb(80, 9, 23)')}`,
        }">
        </div>

        <p class="name">{{ this.componentData.behavior.name }}</p>
    </div>
</template>

<style scoped>
.plate {
    background-color:dimgray;
    position: absolute;
    border-style: solid;
    border-color: gray;
    font-weight: bold;
}

.pin {
    position: absolute;
    transform: translateY(-50%);
    background-color: rgb(80, 9, 23);
}

.name {
    position: absolute;
    margin: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    user-select: none;
}
</style>