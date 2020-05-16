<template>
    <div class="footer">

        <div class="credits">
            <!-- Links -->
            <div class="links">
                <a href="https://github.com/upperlevel/carcassonne">
                    <img alt="" src="" class="github-logo">
                </a>
            </div>
            <small>
                Developed by <a href="https://github.com/upperlevel">Upperlevel</a>
            </small>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
    });
</script>

<style scoped>

    .footer {
        text-align: right;
    }

    .credits {
        padding: 20px;
    }

    .github-logo {
        width: auto;
        height: 32px;
        content: url("~Public/images/GitHub-Mark-Light-32px.png");
    }

</style>
