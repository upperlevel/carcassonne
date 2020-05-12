<template>
    <div>
        <div v-for="color in this.colors"
             class="color"
             :style="{backgroundColor: colorToStr(color)}"
             v-on:click="$emit('input', color)"
        ></div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        data() {
            return {
                colors: [
                    0xd50000, // red
                    0xff6d00, // orange
                    0xffc400, // gold
                    0xffff00, // yellow
                    0x64dd17, // lime
                    0x00c853, // green
                    0x00b8d4, // light-blue
                    0x303f9f, // blue
                    0xff80ab, // pink
                    0xab47bc, // violet
                    0x4a148c, // purple
                    0xf5f5f5, // white
                    0x1a1a1a, // black
                    0x4e342e, // brown
                ]
            }
        },
        methods: {
            colorToStr(color: number) {
                return `
                    rgb(
                        ${(color >> 16) & 0xff},
                        ${(color >> 8) & 0xff},
                        ${color & 0xff}
                    )
                `;
            },
        }
    });
</script>

<style scoped>
    .color {
        display: inline-block;

        margin: 5px;
        width: 50px;
        height: 50px;
        border-radius: 3px;
    }

    .color:hover {
        cursor: pointer;
    }
</style>
