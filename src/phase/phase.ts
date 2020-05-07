import Vue from "vue";

export class Phase {
    name: string;

    vue: any;
    vEventHandler: any;

    constructor(name: string) {
        this.name = name;

        // Create Vue instance that is responsible for handling the UI events of the current phase.
        // https://medium.com/vuejobs/create-a-global-event-bus-in-vue-js-838a5d9ab03a
        this.vEventHandler = new Vue();
    }

    log(message: string) {
        console.log(`[${this.name}] ` + message);
    }

    ui(): Vue {
        return undefined;
    }

    enable() {
        this.log("Enabling");

        (Vue.prototype as any).$eventHub = this.vEventHandler;

        this.vue = this.ui();
        if (this.vue) {
            this.vue.$mount();
            document.getElementById("app").appendChild(this.vue.$el);
        }

        // Done ^^
    }

    disable() {
        console.log(`[${this.name}] Disabling`);
        if (this.vue) {
            document.getElementById("app").removeChild(this.vue.$el);
        }
    }
}
