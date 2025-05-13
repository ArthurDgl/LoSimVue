<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default {
    props: ["libraries"],
    emits: ["mounted"],
    data() {
        return {
            width: 0,
            height: 0,
        };
    },
    methods: {
        setDimensions(width, height) {
            this.width = width;
            this.height = height;
        }
    },
    mounted() {
        this.$emit("mounted");
        console.log("Libraries Window Mounted");
    }
}
</script>

<template>
    <div class="tab">
        <div class="tab-header">
            Loaded Libraries
        </div>

        <div class="list"
        :style="{
            'height': `${this.height}px`,
            'width': `${this.width}px`
        }">
            <div class="library" v-for="lib in this.libraries">
                <div class="lib-header">
                    <div class="lessen" @click="() => {lib.hide = !lib.hide}">
                        {{ lib.hide ? '+' : '-' }}
                    </div>
                    <div class="title">
                        {{ lib.name }}
                    </div>
                </div>

                <div class="component" v-if="!lib.hide" v-for="comp in lib.content">
                    {{ comp.name }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tab {
    position: absolute;
    top: 0px;
    left: 0px;
    background-color: rgba(0, 0, 0, 0.5);
    user-select: none;
    z-index: 100;
    color: aliceblue;
}

.tab-header {
    font-size: 20px;
}

.lib-header {
    display: flex;
    width: 100%;
    font-size: 20px;
}

.lessen {
    font-weight: bold;
    width: 10%;
    align-items: center;
    justify-content: center;
}

.lessen:hover {
    cursor: pointer;
}

.component {
    display: flex;
    margin-left: 10%;
}
</style>