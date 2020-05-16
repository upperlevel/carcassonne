<template>
    <div class="phase-container">
        <div class="title-container">
            <h1 class="title">Carcassonne</h1>
        </div>

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

