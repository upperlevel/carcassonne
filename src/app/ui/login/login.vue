<template>
    <div class="phase-container">
        <div class="title-container">
            <h1 class="title">Carcassonne</h1>
            A board-game brought online!
        </div>

        <login-form ref="form"></login-form>

        <div style="text-align: center">
            <button class="info-btn btn" @click="howToPlay">How to Play?</button>
        </div>

        <modal-component ref="howToPlay">
            <how-to-play-component class="how-to-play"></how-to-play-component>
        </modal-component>

        <footer-component></footer-component>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import LoginForm from "./loginForm.vue";
    import FooterComponent from "../footer.vue";
    import ModalComponent from "../util/modal.vue";
    import HowToPlayComponent from "../howToPlay.vue";

    export default Vue.extend({
        components: {
            LoginForm,
            FooterComponent,
            ModalComponent,
            HowToPlayComponent,
        },
        methods: {
            howToPlay() {
                this.$refs.howToPlay.open();
            }
        }
    });
</script>

<style scoped>
    .how-to-play {
        width: 400px;
        padding: 35px;
    }
</style>

