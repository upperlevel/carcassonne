<template>
    <div class="container">
        <h1 class="title">Carcassonne</h1>


        <login-form ref="form"></login-form>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import LoginForm from "./loginForm.vue";

    export default Vue.extend({
        components: {
            LoginForm
        },
    });
</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');

    .container {
        position: absolute;
        width: 100%;
        height: 100%;

        background-color: #6e472c;
    }

    .title {
        padding-top: 35px;
        padding-bottom: 35px;

        text-align: center;

        font-family: 'Cinzel Decorative', serif;
        color: #ffd324;
        text-shadow: -2px -2px 2px black;
    }

</style>
