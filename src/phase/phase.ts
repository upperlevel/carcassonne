
export class Phase {
    name: string;

    vue: any;

    constructor(name: string, Component?: any) {
        this.name = name;
        if (Component) {
            this.vue = new Component().$mount();
        }
    }

    enable() {
        console.log(`[${this.name}] Enabling`);
        if (this.vue) {
            document.getElementById("app").appendChild(this.vue.$el);
        }
    }

    disable() {
        console.log(`[${this.name}] Disabling`);
        if (this.vue) {
            document.getElementById("app").removeChild(this.vue.$el);
        }
    }
}
