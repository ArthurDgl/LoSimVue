<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default {
    props: ["popupData"],
    emits: ["mounted"],
    data() {
        return {
            isDragging: false,
            offset: { x: 0, y: 0 },
            interval: null,
            lastMousePos: {x: 0, y: 0},
        };
    },
    methods: {
        startDrag(event) {
            this.isDragging = true;
            this.offset.x = event.clientX - this.popupData.position.x;
            this.offset.y = event.clientY - this.popupData.position.y;
            this.updateMousePos(event);
            this.interval = setInterval(this.drag, 5);
            document.addEventListener("mousemove", this.updateMousePos);
            document.addEventListener("mouseup", this.stopDrag);
            document.body.style.userSelect = 'none';
        },
        updateMousePos(event) {
            this.lastMousePos.x = event.clientX;
            this.lastMousePos.y = event.clientY;
        },
        drag() {
            if (this.isDragging) {
                this.popupData.position.x = this.lerp(this.popupData.position.x, this.lastMousePos.x - this.offset.x, 0.1);
                this.popupData.position.y = this.lerp(this.popupData.position.y, this.lastMousePos.y - this.offset.y, 0.1);
            }
        },
        stopDrag() {
            this.isDragging = false;
            clearInterval(this.interval);
            document.removeEventListener("mousemove", this.updateMousePos);
            document.removeEventListener("mouseup", this.stopDrag);
            document.body.style.userSelect = 'auto';
        },
        lerp(a, b, t) {
            return (1 - t)*a + t*b;
        },
    },
    mounted() {
        this.$emit("mounted");
    },
}
</script>

<template>
    <div class="plate" :style="{
        'left': `${this.popupData.position.x}px`,
        'top': `${this.popupData.position.y}px`,
    }"
    >
        <div class="title-bar" @mousedown="this.startDrag">
            {{ this.popupData.title }}
        </div>
        <div class="contents">
            <div class="content-element" v-for="(content, index) in this.popupData.contents" :key="index">
                <div class="text-element" v-if="content.type === 'TEXT'"> {{ content.text }} </div>
                <input class="input-element"
                v-if="content.type === 'INPUT'"
                :value="this.popupData.data[content.key]"
                @input="e => this.popupData.data[content.key] = content.strictFormat ? e.target.value.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() : e.target.value"
                @keydown="event => event.stopPropagation()"
                :placeholder="content.placeholder"
                autocomplete="off"
                spellcheck="false"
                aria-autocomplete="list"
                ></input>
            </div>

            <div class="buttons">
                <button class="end-button" v-for="button in this.popupData.options" :style="{
                    'background-color': `${button.color}`
                }"
                @click="() => {if (!button.onClick(this.popupData, this.$parent)) this.$parent.closePopup(this.popupData.id)}"
                >
                    {{ button.name }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.plate {
    z-index: 200;
    user-select: none;
    position: absolute;
    color: aliceblue;
    background-color: dimgray;
    border-radius: 10px;
}

.title-bar {
    background-color: rgb(82, 82, 82);
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    font-weight: bold;
    font-size: 20px;
}

.contents {
    padding: 10px;
    color: lightgray;
    width: min-content;
}

.content-element {
    margin-bottom: 10px;
    font-weight: bold;
}

.input-element {
    background-color: rgb(82, 82, 82);
    border: none;
    border-radius: 5px;
    font-size: 15px;
    font-weight: bold;
    padding: 5px;
    color: lightgray;
}

.input-element:focus {
    outline: none;
}

.buttons {
    display: flex;
    justify-content: center;
    align-items: center;
}

.end-button {
    padding: 2px;
    margin-left: 5px;
    margin-right: 5px;
    flex-grow: 1;
    outline: none;
    color: aliceblue;
}
</style>