<script>
    import Vue from "vue";

    export default Vue.extend({
        created() {
            console.log("[loading] created");
        },
        mounted() {
            console.log("[loading] mounted");
        },
        destroyed() {
            console.log("[loading] destroyed");
        }
    });
</script>
