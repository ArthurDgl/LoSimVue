<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const DEFAULT_BORDER_RADIUS = 10;
const DEFAULT_BORDER_WIDTH = 5;
const DEFAULT_PIN_RADIUS = 4;
const DEFAULT_FONT_SIZE = 20;

export default {
    props: ["componentData"],
    emits: ["componentmove"],
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
            text: "",
            color: "#696969",
            borderColor: null,
        };
    },
    methods: {
        moveWithCamera() {
            if (this.$parent.keysPressed['Control'] && (this.dragging || this.componentData.temporary)) {
                this.componentData.position = this.$parent.snapToGrid(this.componentData.position, {x: this.componentData.width / 2, y: this.componentData.height / 2});
            }

            this.screenPosition = this.$parent.worldToScreenCoordinates(this.componentData.position);

            this.borderRadius = this.$parent.scaleToZoom(DEFAULT_BORDER_RADIUS);
            this.borderWidth = this.$parent.scaleToZoom(DEFAULT_BORDER_WIDTH);

            this.pinRadius = this.$parent.scaleToZoom(DEFAULT_PIN_RADIUS);
            this.fontSize = this.$parent.scaleToZoom(DEFAULT_FONT_SIZE);
            
            this.screenWidth = this.$parent.scaleToZoom(this.componentData.width) - this.borderWidth * 2;
            this.screenHeight = this.$parent.scaleToZoom(this.componentData.height) - this.borderWidth * 2;

            this.visibility = this.$parent.isBoxInBounds(this.screenPosition, this.screenWidth + 2 * this.borderWidth, this.screenHeight + 2 * this.borderWidth) ?
                "visible" : "hidden";
        },
        startDrag(event) {
            window.getSelection()?.removeAllRanges();

            if (event.button != 0) return;
            
            if (this.$parent.getMouseTool() !== "default") return;

            if (this.componentData.temporary) return;

            document.body.style.cursor = "move";
            this.zIndex = "1";

            this.dragging = true;
            this.$parent.componentPickedUp(this.componentData);

            this.dragOffset = {
                x: event.clientX - this.screenPosition.x,
                y: event.clientY - this.screenPosition.y,
            };

            window.addEventListener("mousemove", this.drag);
            window.addEventListener("mouseup", this.stopDrag);
        },
        drag(event) {
            this.$parent.mouseMove(event);

            window.getSelection()?.removeAllRanges();
            if (!this.dragging) {return;}

            let cursorPos = {x: event.clientX, y: event.clientY};
            let offsetPos = {
                x: cursorPos.x - this.dragOffset.x,
                y: cursorPos.y - this.dragOffset.y,
            };

            this.componentData.position = this.$parent.screenToWorldCoordinates(offsetPos);

            this.moveWithCamera();

            this.$parent.updateCanvas();
        },
        stopDrag() {
            window.getSelection()?.removeAllRanges();

            document.body.style.cursor = this.$parent.getMouseTool();
            this.zIndex = "auto";

            this.dragging = false;
            this.$parent.componentPlacedDown(this.componentData);

            window.removeEventListener("mousemove", this.drag);
            window.removeEventListener("mouseup", this.stopDrag);
        },
        getInputPinPosition(pinIndex) {
            const x = this.componentData.position.x;
            const fromTop = (pinIndex + 0.5) / (this.componentData.pins.inputs.length);
            const y = this.componentData.position.y + (this.componentData.height - 2 * DEFAULT_BORDER_WIDTH) * fromTop + DEFAULT_BORDER_WIDTH;
            return {x: x, y: y};
        },
        getOutputPinPosition(pinIndex) {
            const x = this.componentData.position.x + this.componentData.width;
            const fromTop = (pinIndex + 0.5) / (this.componentData.pins.outputs.length);
            const y = this.componentData.position.y + (this.componentData.height - 2 * DEFAULT_BORDER_WIDTH) * fromTop + DEFAULT_BORDER_WIDTH;
            return {x: x, y: y};
        },
        handleClick(event) {
            if (this.componentData.temporary) {
                this.$parent.placeTemporaryComponent();
            }
            else if (event.button == 0 && this.$parent.getMouseTool() === "pointer") {
                this.componentData.behavior.onPoke(this.componentData.behavior);
            }
        },
        updateRendering() {
            this.componentData.behavior.render.start(this.componentData, this.componentData.behavior.render, this);
        },
        fetchSources() {
            this.componentData.pins.inputs.forEach(inputPin => {
                if (inputPin.source) {
                    inputPin.state = inputPin.source.state;
                }
            });
        },
        updateOutputs(updateCount) {
            let inputValues = [];
            this.componentData.pins.inputs.forEach((inputPin) => {
                inputValues.push(inputPin.state);
            });
            this.componentData.pins.outputs.forEach((outputPin, index) => {
                outputPin.state = this.componentData.behavior.resultFunctions[index](this.componentData.behavior, inputValues, updateCount);
            });
        },
        updateLogic(updateCount) {
            this.fetchSources();
            this.updateOutputs(updateCount);
            this.updateRendering();
        },
        openPropertiesPopup(event) {
            event.preventDefault();

            const title = "Properties";

            const data = {};
            const contents = [
                {
                    type: "TEXT",
                    text: "label :"
                },
                {
                    type: "INPUT",
                    key: "label",
                    placeholder: "Enter label",
                    strictFormat: true
                }
            ];
            if (this.componentData.behavior.label) data.label = this.componentData.behavior.label;
            Object.keys(this.componentData.behavior.properties).forEach(key => {
                data[key] = this.componentData.behavior.properties[key];
                contents.push({
                    type: "TEXT",
                    text: key + " :",
                });
                contents.push({
                    type: "INPUT",
                    key: key,
                    placeholder: "Enter " + key,
                });
            });

            this.$parent.$parent.closePopupsByTitle(title);2

            this.$parent.$parent.addPopup({
                title: title,
                position: {x: event.clientX + 10, y: event.clientY + 10},
                data: data,
                contents: contents,
                options: [
                    {
                        color: "#6688FA",
                        name: "Apply",
                        onClick: (popup, app) => {
                            if (popup.data.label && popup.data.label !== "") {
                                this.componentData.behavior.label = popup.data.label;
                            }
                            for (let i = 1; i < popup.contents.length; i++) {
                                const content = popup.contents[i];
                                this.componentData.behavior.properties[content.key] = popup.data[content.key];
                            }
                        }
                    },
                    {
                        color: "#FA5544",
                        name: "Cancel",
                        onClick: (popup, app) => {}
                    }
                ]
            });
        }
    },
    mounted() {
        this.componentData.vueComponent = this;
        if (this.componentData.behavior.defaultColor) {
            this.color = this.componentData.behavior.defaultColor;
        }
        if (this.componentData.behavior.defaultBorderColor) {
            this.borderColor = this.componentData.behavior.defaultBorderColor;
        }
    }
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
        'background-color':`${this.color}`,
        'border-color':`${this.borderColor ? this.borderColor : this.$parent.lightenColor(this.color)}`
        }"
        
        @click="this.handleClick"
        @mousedown="this.startDrag"
        @contextmenu="this.openPropertiesPopup"
        >

        <div class="pin input" v-for="(pin, index) in this.componentData.pins.inputs"
        :style="{
                'top':`${(index + 0.5) / (this.componentData.pins.inputs.length) * 100}%`,
                'left':`${-this.borderWidth}px`,
                'border-radius':`${this.pinRadius}px`,
                'width':`${2 * this.pinRadius}px`,
                'height':`${2 * this.pinRadius}px`,
                'background-color':`${(pin.state ? 'crimson' : 'rgb(80, 9, 23)')}`,
                'border-width':`${this.borderWidth / 2}px`,
                'color':`${this.$parent.lightenColor(this.color, -20)}`
            }"
            :class="{
                'pin-highlight': this.$parent.getMouseTool() === 'crosshair' && this.$parent.selectedOutput
            }"
            ref="in"
            @click="this.$parent.handlePinClick(pin)"
        >
        <div class="input-pin-label" v-if="pin.label && pin.label !== ''">{{ pin.label }}</div>
        </div>

        <div class="pin output" v-for="(pin, index) in this.componentData.pins.outputs"
            :style="{
                'top':`${(index + 0.5) / (this.componentData.pins.outputs.length) * 100}%`,
                'left':`${this.borderWidth + this.screenWidth}px`,
                'border-radius':`${this.pinRadius}px`,
                'width':`${2 * this.pinRadius}px`,
                'height':`${2 * this.pinRadius}px`,
                'background-color':`${(pin.state ? 'crimson' : 'rgb(80, 9, 23)')}`,
                'border-width':`${this.borderWidth / 2}px`,
                'color':`${this.$parent.lightenColor(this.color, -20)}`
            }"
            :class="{
                'selected-output': this.$parent.isPinSelected(pin),
                'pin-highlight': this.$parent.getMouseTool() === 'crosshair' && !this.$parent.selectedOutput
            }"
            ref="out"
            @click="this.$parent.handlePinClick(pin)"
        >
        <div class="output-pin-label" v-if="pin.label && pin.label !== ''">{{ pin.label }}</div>
        </div>

        <div class="name">{{ this.text }}</div>
        <div class="label" v-if="this.componentData.behavior.label && this.componentData.behavior.label !== ''">{{ this.componentData.behavior.label }}</div>
    </div>
</template>

<style scoped>
.plate {
    position: absolute;
    border-style: solid;
    font-weight: bold;
}

.pin {
    position: absolute;
    transform: translate(-50%, -50%);
    border-color: aliceblue;
}

.selected-output {
    border-style: solid;
}

.pin-highlight:hover {
    border-style: solid;
}

.name {
    position: absolute;
    margin: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    user-select: none;
    color: aliceblue;
}

.label {
    position: absolute;
    margin: 0;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    user-select: none;
    color: gray;
}

.input-pin-label {
    position: relative;
    margin: 0;
    top: 50%;
    left: 100%;
    transform: translateY(-50%) scale(75%);
    user-select: none;
}

.output-pin-label {
    position: absolute;
    margin: 0;
    top: 50%;
    left: 0%;
    transform: translate(-100%, -50%) scale(75%);
    user-select: none;
}
</style>