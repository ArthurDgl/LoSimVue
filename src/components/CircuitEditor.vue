<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import BaseComponent from './BaseComponent.vue';
import { ref } from 'vue';

const GRID_CELL_SIZE = 50;
const LARGE_GRID_CELL_SIZE = 200;

let NEXT_COMPONENT_ID = 0;

export default {
    data() {
        return {
            width: 600,
            height: 600,
            camera: {x: 0.0, y: 0.0},
            dragging: false,
            draggingPrevious: {x: 0, y: 0},
            zoom: 1.0,
            zoomFactor: 1.2,
            zoomTarget: 1.0,
            zoomPosition: {x: 0, y: 0},
            zoomInterval: null,

            baseComponentsData: [],
        };
    },
    methods: {
        setDimensions(width, height) {
            this.width = width;
            this.height = height;
        },
        getColumns() {
            const cellSize = this.zoom < 0.66 ? LARGE_GRID_CELL_SIZE : GRID_CELL_SIZE;

            const worldLeft = this.camera.x;
            const worldRight = this.camera.x + this.width / this.zoom;
            const startX = Math.floor(worldLeft / cellSize) * cellSize;
            const endX = Math.ceil(worldRight / cellSize) * cellSize;

            let columns = [];
            for (let x = startX; x <= endX; x += cellSize) {
                columns.push({
                    top: 0,
                    left: (x - this.camera.x) * this.zoom - 1,
                    width: 2,
                    height: this.height
                });
            }
            return columns;
        },
        getRows() {
            const cellSize = this.zoom < 0.66 ? LARGE_GRID_CELL_SIZE : GRID_CELL_SIZE;

            const worldTop = this.camera.y;
            const worldBottom = this.camera.y + this.height / this.zoom;
            const startY = Math.floor(worldTop / cellSize) * cellSize;
            const endY = Math.ceil(worldBottom / cellSize) * cellSize;

            let rows = [];
            for (let y = startY; y <= endY; y += cellSize) {
                rows.push({
                    top: (y - this.camera.y) * this.zoom - 1,
                    left: 0,
                    width: this.width,
                    height: 2
                });
            }
            return rows;
        },
        startDrag(event) {
            if (event.pointerType === "mouse" && event.button != 1) return;

            document.body.style.cursor = "move";

            this.dragging = true;
            this.draggingPrevious = {x: event.clientX, y: event.clientY};
            window.addEventListener("pointermove", this.drag);
            window.addEventListener("touchmove", this.drag);
        },
        drag(event) {
            if (!this.dragging) return;

            let currentPos = !event.touches ? {x: event.clientX, y: event.clientY} : {x: event.touches[0].clientX, y: event.touches[0].clientY};
            this.camera.x -= (currentPos.x - this.draggingPrevious.x) / this.zoom;
            this.camera.y -= (currentPos.y - this.draggingPrevious.y) / this.zoom;
            this.draggingPrevious = currentPos;

            this.alteredCamera();
        },
        stopDrag() {
            document.body.style.cursor = "auto";

            this.dragging = false;
            window.removeEventListener("pointermove", this.drag);
            window.removeEventListener("touchmove", this.drag);
        },
        startZoom() {
            if (this.zoomInterval) {
                clearInterval(this.zoomInterval);
            }
            this.zoomInterval = setInterval(this.applyZoom, 5);
        },
        endZoom() {
            clearInterval(this.zoomInterval);
        },
        lerp(a, b, t) {
            return a * (1 - t) + b * t;
        },
        applyZoom() {
            if (Math.abs(this.zoomTarget - this.zoom) < 0.01) {
                this.endZoom();
                return;
            }

            const zoomFactor = this.lerp(this.zoom, this.zoomTarget, 0.1) / this.zoom;

            const worldX = this.camera.x + this.zoomPosition.x / this.zoom;
            const worldY = this.camera.y + this.zoomPosition.y / this.zoom;

            this.zoom *= zoomFactor;

            this.camera.x = worldX - this.zoomPosition.x / this.zoom;
            this.camera.y = worldY - this.zoomPosition.y / this.zoom;

            this.alteredCamera();
        },
        zoomIn() {
            if (this.zoomTarget >= 4) return;
            this.zoomTarget *= this.zoomFactor;
            this.zoomPosition = {
                x: this.width / 2,
                y: this.height / 2,
            }
            this.startZoom();
        },
        zoomOut() {
            if (this.zoomTarget <= 0.25) return;
            this.zoomTarget /= this.zoomFactor;
            this.zoomPosition = {
                x: this.width / 2,
                y: this.height / 2,
            }
            this.startZoom();
        },
        handleMouseWheel(event) {
            this.zoomPosition.x = event.clientX;
            this.zoomPosition.y = event.clientY;

            if (event.deltaY > 0 && this.zoomTarget > 0.25) {
                this.zoomTarget /= this.zoomFactor;
            } else if (event.deltaY < 0 && this.zoomTarget < 4) {
                this.zoomTarget *= this.zoomFactor;
            }

            this.startZoom();
        },
        newBaseComponent(behavior, position, width, height) {
            let component = {
                id: NEXT_COMPONENT_ID,
                behavior: behavior,
                position: position,
                width: width,
                height: height,
                pins: {
                    inputs: [],
                    outputs: [],
                },
            };

            this.baseComponentsData.push(component);

            NEXT_COMPONENT_ID += 1;

            return component;
        },
        newEmptyComponent(position, width, height) {
            this.newBaseComponent({}, position, width, height);
        },
        newLibraryComponent(libraryId, componentName, position) {
            let behavior = {};
            let libraryComponent = this.$parent.getLibraryComponent(libraryId, componentName);

            behavior.inputs = libraryComponent.inputs;
            behavior.outputs = libraryComponent.outputs;
            behavior.name = libraryComponent.name;

            const resEval = libraryComponent.resultEvaluation;
            if (resEval.type === "TABLE") {
                behavior.resultFunction = (inputValues => {
                    const l = inputValues.length;
                    let index = 0;
                    for (let i = 0; i < l; i++) {
                        if (!inputValues[i]) continue;
                        index += Math.pow(2, l - i - 1);
                    }

                    return resEval.table[index];
                });
            }

            let component = this.newBaseComponent(behavior, position, libraryComponent.dimensions.width, libraryComponent.dimensions.height);

            for (let i = 0; i < behavior.inputs; i++) {
                this.addComponentPin(component.id, "INPUT");
            }
            for (let i = 0; i < behavior.outputs; i++) {
                this.addComponentPin(component.id, "OUTPUT");
            }
        },
        findComponentById(componentId) {
            return this.baseComponentsData.find(comp => {
                return comp.id == componentId;
            });
        },
        addComponentPin(componentId, pinType) {
            let component = this.findComponentById(componentId);

            let pin = {
                type: pinType,
                state: false,
                parentId: componentId,
            };

            if (pinType === "OUTPUT") {
                pin.index = component.pins.outputs.length;
                component.pins.outputs.push(pin);
            }
            else {
                pin.index = component.pins.inputs.length;
                component.pins.inputs.push(pin);
            }
        },
        connectPins(sourceId, sourceIndex, destId, destIndex) {
            let sourceComp = this.findComponentById(sourceId);
            let source = sourceComp.pins.outputs[sourceIndex];

            let destComp = this.findComponentById(destId);
            let dest = destComp.pins.inputs[destIndex];

            dest.source = source;
        },
        alteredCamera() {
            this.updateComponentPositions();
        },
        updateComponentPositions() {
            this.$refs.baseComponents.forEach(component => {
                component.moveWithCamera(this.camera, this.zoom, this.width, this.height);
            });
        },
        worldToScreenCoordinates(coordinates) {
            return {
                x: (coordinates.x - this.camera.x) * this.zoom,
                y: (coordinates.y - this.camera.y) * this.zoom,
            }
        },
        screenToWorldCoordinates(coordinates) {
            return {
                x: coordinates.x / this.zoom + this.camera.x,
                y: coordinates.y / this.zoom + this.camera.y,
            }
        },
        isBoxInBounds(screenPosition, screenWidth, screenHeight) {
            return !(screenPosition.x > this.width
                || screenPosition.x + screenWidth < 0
                || screenPosition.y > this.height
                || screenPosition.y + screenHeight < 0);
        },
        scaleToZoom(property) {
            return property * this.zoom;
        },
        onLibrariesLoaded() {
            this.newLibraryComponent(0, "AND", {x: 400, y: 100});
            this.newLibraryComponent(0, "OR", {x: 400, y: 200});
            this.newLibraryComponent(0, "NOT", {x: 400, y: 300});
            this.newLibraryComponent(0, "XOR", {x: 400, y: 400});

            this.$nextTick(() => {
                this.alteredCamera()
            });
        },
    },
    emits: ['mounted'],
    mounted() {
        this.$nextTick(() => {
            this.alteredCamera()
        });

        this.$emit("mounted");
        console.log("CircuitEditor Mounted");
    },
    components: {
        BaseComponent
    }
}
</script>

<template>
    <div class="grid"
    :style="{'width':`${this.width}px`, 'height':`${this.height}px`}"
    @pointerdown="this.startDrag"
    @pointerup="this.stopDrag"
    >
        <div v-for="line in this.getColumns().concat(this.getRows())" class="line" :style="{
            'top':`${line.top}px`,
            'left':`${line.left}px`,
            'width':`${line.width}px`,
            'height':`${line.height}px`
            }"></div>
    </div>

    <div id="zoom-buttons">
        <button @mousedown="this.zoomIn">
            <font-awesome-icon :icon="['fas', 'magnifying-glass-plus']" />
        </button>
        <button @mousedown="this.zoomOut">
            <font-awesome-icon :icon="['fas', 'magnifying-glass-minus']" />
        </button>
    </div>

    <BaseComponent
        v-for="(component, index) in this.baseComponentsData"
        :key="index"
        :componentData="component"
        ref="baseComponents"
    />
</template>

<style scoped>
.grid {
    position: relative;
    background-color: darkslategrey;
    overflow: hidden;
}

.line {
    position: absolute;
    background-color: lightslategray;
}

#zoom-buttons {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

button {
    position: relative;
    margin: 10px;
    margin-bottom: 0;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 15px;
    padding-right: 15px;
    background-color: rgb(30, 50, 50);
    color: lightslategray;
}

*:focus {
    outline: none;
}
</style>