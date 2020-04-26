
export class Phase {
    name: string;

    div: HTMLDivElement;

    constructor(name: string) {
        this.name = name;

        this.div = document.getElementById(this.name) as HTMLDivElement;
    }

    enable() {
        console.log(`[${this.name}] Enabling`);
        this.div.style.display = "block";
    }

    disable() {
        console.log(`[${this.name}] Disabling`);
        this.div.style.display = "none";
    }
}
