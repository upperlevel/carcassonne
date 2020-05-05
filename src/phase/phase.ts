import Vue from "vue";

export class Phase {
    name: string;
    vue: any;

    constructor(name: string) {
        this.name = name;
    }

    log(message: string) {
        console.log(`[${this.name}] ` + message);
    }

    ui(): Vue {
        return undefined;
    }

    enable() {
        this.log("Enabling");

        this.vue = this.ui();
        if (this.vue) {
            this.log("Mounting Vue");
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
