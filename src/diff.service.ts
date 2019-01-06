import {Descriptor, DescriptorTypesEnum, FieldMap, IDescriptor} from './idescriptor';
import {IDiffDetails, DiffDetails} from './diff.details';

export interface IDiffServiceOptions {
    delimeter?: string;
    emptyLabel?: string;
}

export class DiffService<T> {

    public delimeter: string;
    public emptyLabel: string;
    public descriptor: Descriptor<T>;
    constructor(protected map: FieldMap<T>, options: IDiffServiceOptions = null) {
        this.descriptor = new Descriptor<T>(map);
        this.delimeter = options && options.delimeter ? options.delimeter : ' -> ';
        this.emptyLabel = options && options.emptyLabel ? options.emptyLabel : 'N/A';
    }

    public diff(oldval: T, newval: T): IDiffDetails[] {
        return this.collectChanges(this.descriptor, newval, oldval, null);
    }

    private collectChanges(
        descriptor: Descriptor<T>,
        newval: T,
        oldval: T,
        currentPath: string): IDiffDetails[] {
        const changes = [];
        // console.log('collect changes', currentPath, descriptor);
        const keys = descriptor.getFields();

        if (newval == null && oldval != null) {
            let deleteMsg = 'Delete ' + (descriptor.descriptorName || '');
            if (descriptor.keyFn) {
                deleteMsg += ': ' + descriptor.keyFn(oldval);
            }
            changes.push(new DiffDetails(currentPath,currentPath, deleteMsg,
                this.emptyLabel));
            return changes;
        }
        if (oldval == null && newval != null) {
            let createMsg = 'Create ' + (descriptor.descriptorName || '');
            if (descriptor.keyFn) {
                createMsg += ': ' + descriptor.keyFn(newval);
            }
            changes.push(new DiffDetails(currentPath, currentPath, this.emptyLabel,
                createMsg));
            return changes;
        }
        if (oldval == null && newval == null) {
            // console.log('all empty');
            return changes;
        }
        if (descriptor.keyFn && !descriptor.Compare(newval, oldval)) {
            // keys of object different - this is different object.
            let delMsg = 'from ';
            if (descriptor.keyFn) {
                delMsg += ': ' + descriptor.keyFn(oldval);
            }
            let createMsg = 'to ';
            if (descriptor.keyFn) {
                createMsg += ': ' + descriptor.keyFn(newval);
            }
            changes.push(new DiffDetails(currentPath, currentPath, delMsg, createMsg))
            return changes;
        }
        for (const _key of keys) {
            const key = _key.toString();
            // console.log('check key', _key, keys);
            const keyType = descriptor.getFieldType(key.toString());
            // console.log(keyType);
            const fieldDescription = descriptor.getDescription(key.toString());
            if (!keyType) {
                console.error('Unexpected key', keyType);
                continue;
            }
            const newvalElement = newval[key];
            const oldvalElement = oldval[key];
            // console.log('desc', fieldDescription, newvalElement, oldvalElement);
            if (keyType === DescriptorTypesEnum.Field) {
                const path: string = currentPath ?
                    currentPath + this.delimeter + fieldDescription.toString() : fieldDescription.toString();
                const field = this.handleProperty(newvalElement, oldvalElement, path);
                if (field) {
                    changes.push(field);
                }
            } else {
                const path: string = currentPath ?
                    currentPath + this.delimeter + (fieldDescription as IDescriptor).descriptorName :
                    (fieldDescription as IDescriptor).descriptorName;
                const descriptorElement = descriptor.map[key];
                // console.log('recource', key, keyType, keyType === DescriptorTypesEnum.Object, descriptorElement, newvalElement, oldvalElement);
                const fields = keyType === DescriptorTypesEnum.Object ?
                    this.collectChanges(
                        descriptorElement,
                        newvalElement, oldvalElement, path) :
                    this.handleArray(descriptorElement,
                        newvalElement, oldvalElement, key, path);
                // console.log('f', fields);
                if (fields) {
                    changes.push(...fields);
                }
            }
        }
        return changes;
    }

    private handleArray(descriptor: Descriptor<T>,
                        newval: T[],
                        oldval: T[],
                        key: string,
                        currentPath: string): IDiffDetails[] {
        // console.log('handle array', key, currentPath);
        const changes = [];
        const created = newval.slice();
        const deleted = oldval.slice();

        const updated = created
                .map((c) => {
                    const del = deleted.find((d) => descriptor.Compare(d, c));
                    return {c, d: del};
                }).filter((x) => x.c && x.d);
            for (const pair of updated) {
                const diff = this.collectChanges(descriptor, pair.c, pair.d, currentPath);
                if (diff) {
                    changes.push(...diff);
                }
                created.splice(created.indexOf(pair.c), 1);
                deleted.splice(deleted.indexOf(pair.d), 1);
            }

        for (const item of created) {
            const diff = this.collectChanges(descriptor, item, null, currentPath);
            if (diff) {
                changes.push(...diff);
            }
        }
        for (const item of deleted) {
            const diff = this.collectChanges(descriptor, null, item, currentPath);
            if (diff) {
                changes.push(...diff);
            }
        }
        return changes;
    }

    private handleField(descriptor: Descriptor<T>,
                        newval: T,
                        oldval: T,
                        key: string,
                        currentPath: string): any[] {
        const field = currentPath ? currentPath + '.' + key : key;
        if (!newval.hasOwnProperty(key)) {
            return null;
        }
        if (typeof newval[key] === 'object') {
            if (oldval[key] === undefined) {
                // todo get name of new instance
                return [new DiffDetails(
                    field, field,  this.emptyLabel, 'new item')];
            }
            // todo check deleted item in array.

            // todo check that item referenced to the same instance
            if (this.isMongooseId(newval[key]) || this.isMongooseId(oldval[key])) {
                // console.log("typegoose reference find");
                return null;
            }
            return this.collectChanges(descriptor, newval, oldval, currentPath);

        }
    }

    private isMongooseId(field) {
        if (!field) {
            return false;
        }
        return /^[A-Fa-f0-9]{24}$/.test(field.toString());
    }

    private handleProperty(newval: any, oldval: any, field): any {
        // console.log("handle prop", newval, oldval, field);
        if (newval == null) {
            newval =  this.emptyLabel;
        }
        if (oldval == null) {
            oldval =  this.emptyLabel;
        }
        try {
            if (newval instanceof Date || oldval instanceof Date) {
                if (new Date(newval).toISOString() !== new Date(oldval).toISOString()) {
                    return new DiffDetails(field,field,
                        new Date(oldval).toLocaleString(),
                        new Date(newval).toLocaleString());
                }
            } else if (newval instanceof Boolean || oldval instanceof Boolean && oldval !== newval) {
                return new DiffDetails(
                    field,  field, oldval ? 'Checked' : 'Unchecked', newval ? 'Checked' : 'Unchecked');
            } else {
                if (newval.toString() !== oldval.toString()) {
                    return new DiffDetails(
                        field, field, oldval.toString(), newval.toString());
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
}
