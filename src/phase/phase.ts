
export class Phase {
    name: string;

    div: HTMLDivElement;

    constructor(name: string) {
        this.name = name;

        this.div = document.getElementById(this.name) as HTMLDivElement;
    }

    enable() {
        console.log(`[${this.name}] Enabling`);
        if (this.div)
            this.div.style.display = "block";
    }

    disable() {
        console.log(`[${this.name}] Disabling`);
        if (this.div)
            this.div.style.display = "none";
    }
}
