
export interface IDiffDetails {
    field: string;
    path: string;
    old_value: string;
    new_value: string;
}


export class DiffDetails implements IDiffDetails {
    public field: string;
    public old_value: string;
    public new_value: string;
    public path: string;

    constructor(key: string, path: string, oldval: string, newval: string) {
        this.field = key;
        this.old_value = oldval;
        this.new_value = newval;
        this.path = path;
    }
}