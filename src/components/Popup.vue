<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default {
    props: ["popupData"],
    emits: ["mounted"],
    data() {
        return {

        };
    },
    methods: {
        
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
        <div class="title-bar">
            {{ this.popupData.title }}
        </div>
        <div class="contents">
            <div class="content-element" v-for="(content, index) in this.popupData.contents" :key="index">
                <div class="text-element" v-if="content.type === 'TEXT'"> {{ content.text }} </div>
                <input class="input-element"
                v-if="content.type === 'INPUT'"
                :value="this.popupData.data[content.key]"
                @input="e => this.popupData.data[content.key] = e.target.value"
                :placeholder="content.placeholder"
                autocomplete="off"
                aria-autocomplete="list"
                ></input>
            </div>

            <div class="buttons">
                <button class="end-button" v-for="button in this.popupData.options" :style="{
                    'background-color': `${button.color}`
                }"
                @click="() => {button.onClick(this.popupData, this.$parent); this.$parent.closePopup(this.popupData.id)}"
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
}
</style>