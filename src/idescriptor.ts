export enum DescriptorTypesEnum {
    Field = 'Field',
    Object = 'Object',
    Array = 'Array',
}

export type FieldMap<T> = { [P in keyof T]?: string | IDescriptor };
export interface IDescriptor {
    descriptorName: string;
    descriptorType: DescriptorTypesEnum;

    getDescription(filed: string): string | IDescriptor;
}

type Comparer<T> = (a: T, b: T) => boolean;

export class Descriptor<T> {
    public constructor(
        public map: FieldMap<T>,
        public descriptorName: string = null,
        public descriptorType: DescriptorTypesEnum = DescriptorTypesEnum.Object,
        public keyFn: (T) => string = null,
        private comparer: Comparer<T> = null) {
    }

    public getFields() {
        return this.map ? Object.keys(this.map) as Array<keyof T> : [];
    }

    public getDescription(field: string): string {
        const descriptor = this.getFieldType(field);
        if (!descriptor) {
            return null;
        }
        return  this.map ? descriptor === DescriptorTypesEnum.Field ? this.map[field] : (<IDescriptor>this.map[field]).descriptorName: null;
    }

    public Compare(a: T, b: T): boolean {
        if (this.comparer) {
            return this.comparer(a, b);
        } else if (this.keyFn) {
            return this.keyFn(a) === this.keyFn(b);
        }
        return false;
    }
    public getFieldType(field: string): DescriptorTypesEnum {
        const value = this.map ? this.map[field] : null;
        if (!value) {
            return null;
        }
        if (typeof value === 'object') {
            return (value as IDescriptor).descriptorType;
        }
        return DescriptorTypesEnum.Field;
    }
}
