<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const GRID_CELL_SIZE = 50.0;

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
        };
    },
    methods: {
        setDimensions(width, height) {
            this.width = width;
            this.height = height;
        },
        getColumns() {
            const worldLeft = this.camera.x;
            const worldRight = this.camera.x + this.width / this.zoom;
            const startX = Math.floor(worldLeft / GRID_CELL_SIZE) * GRID_CELL_SIZE;
            const endX = Math.ceil(worldRight / GRID_CELL_SIZE) * GRID_CELL_SIZE;

            let columns = [];
            for (let x = startX; x <= endX; x += GRID_CELL_SIZE) {
                columns.push({
                    top: 0,
                    left: (x - this.camera.x) * this.zoom,
                    width: 2,
                    height: this.height
                });
            }
            return columns;
        },
        getRows() {
            const worldTop = this.camera.y;
            const worldBottom = this.camera.y + this.height / this.zoom;
            const startY = Math.floor(worldTop / GRID_CELL_SIZE) * GRID_CELL_SIZE;
            const endY = Math.ceil(worldBottom / GRID_CELL_SIZE) * GRID_CELL_SIZE;

            let rows = [];
            for (let y = startY; y <= endY; y += GRID_CELL_SIZE) {
                rows.push({
                    top: (y - this.camera.y) * this.zoom,
                    left: 0,
                    width: this.width,
                    height: 2
                });
            }
            return rows;
        },
        startDrag(event) {
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
        },
        stopDrag() {
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
        }
    },
    emits: ['mounted'],
    mounted() {
        this.$emit("mounted");
        console.log("CircuitEditor Mounted");
    },
}
</script>

<template>
    <div class="grid"
    :style="{'width':`${this.width}px`, 'height':`${this.height}px`}"
    @pointerdown="this.startDrag"
    @pointerup="this.stopDrag"
    @mousewheel="this.handleMouseWheel"
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