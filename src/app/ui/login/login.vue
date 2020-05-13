<template>
    <div>
        <h1>Carcassonne</h1>
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
