import {Phase} from "./phase";

export class Stage extends Phase {
    phase: Phase | null;

    constructor(name: string) {
        super(name);
    }

    setPhase(phase: Phase | null) {
        if (this.phase)
            this.phase.disable();
        this.phase = phase;
        if (this.phase)
            this.phase.enable();
    }

    disable() {
        super.disable();
        this.setPhase(null);
    }

    resize() {
        super.resize();
        if (this.phase)
            this.phase.resize();
    }

    update(delta: number) {
        super.update(delta);
        if (this.phase)
            this.phase.update(delta);
    }

    render() {
        super.render();
        if (this.phase)
            this.phase.render();
    }
}
