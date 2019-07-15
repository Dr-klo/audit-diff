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
        return this.collectChanges(this.descriptor, newval, oldval, null, null);
    }

    private collectChanges(
        descriptor: Descriptor<T>,
        newval: T,
        oldval: T,
        currentPath: string,
        fieldVirtualPath: string): IDiffDetails[] {
        const changes = [];
        // console.log('collect changes', fieldVirtualPath, descriptor);
        const keys = descriptor.getFields();

        if (newval == null && oldval != null) {
            let deleteMsg = 'Delete ' + (descriptor.descriptorName || '');
            if (descriptor.keyFn) {
                deleteMsg += ': ' + descriptor.keyFn(oldval);
            }
            changes.push(new DiffDetails(fieldVirtualPath,currentPath, deleteMsg,
                this.emptyLabel));
            return changes;
        }
        if (oldval == null && newval != null) {
            let createMsg = 'Create ' + (descriptor.descriptorName || '');
            if (descriptor.keyFn) {
                createMsg += ': ' + descriptor.keyFn(newval);
            }
            changes.push(new DiffDetails(fieldVirtualPath, currentPath, this.emptyLabel,
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
            changes.push(new DiffDetails(fieldVirtualPath, currentPath, delMsg, createMsg))
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
            const path = this.bindPath(currentPath, key);
            const fieldPath: string = this.bindVirtualFieldPath(fieldVirtualPath, fieldDescription);
            if (keyType === DescriptorTypesEnum.Field) {
                const field = this.handleProperty(newvalElement, oldvalElement, path, fieldPath);
                if (field) {
                    changes.push(field);
                }
            } else {
                const descriptorElement = descriptor.map[key];
                // console.log('recource', key, keyType, keyType === DescriptorTypesEnum.Object, descriptorElement, newvalElement, oldvalElement);
                const fields = keyType === DescriptorTypesEnum.Object ?
                    this.collectChanges(
                        descriptorElement,
                        newvalElement, oldvalElement, path, fieldPath) :
                    this.handleArray(descriptorElement,
                        newvalElement, oldvalElement, path, fieldPath);
                // console.log('f', fields);
                if (fields) {
                    changes.push(...fields);
                }
            }
        }
        return changes;
    }

    private bindVirtualFieldPath(fieldVirtualPath: string, fieldDescription: string) {
        return fieldVirtualPath ?
            fieldVirtualPath + this.delimeter + fieldDescription:
            fieldDescription;
    }

    public bindPath(path = null, nextKey = null, index = null){
        return (path!==null? (path + (nextKey!==null?'.':'')) : '') + (nextKey||'') + (index!==null? `[${index}]`: '');
    }
    private handleArray(descriptor: Descriptor<T>,
                        newval: T[],
                        oldval: T[],
                        currentPath: string,
                        fieldVirtualPath: string): IDiffDetails[] {
        // console.log('handle array', key, fieldVirtualPath);
        const changes = [];
        const created = newval ? newval.slice() : [];
        const deleted = oldval ? oldval.slice() : [];

        const updated = created
                .map((c) => {
                    const del = deleted.find((d) => descriptor.Compare(d, c));
                    return {c, d: del};
                }).filter((x) => x.c && x.d);
             updated.forEach((pair, index)=>{
                const diff = this.collectChanges(descriptor, pair.c, pair.d,
                    this.bindPath(currentPath, null, index), fieldVirtualPath);
                if (diff) {
                    changes.push(...diff);
                }
                created.splice(created.indexOf(pair.c), 1);
                deleted.splice(deleted.indexOf(pair.d), 1);
            });
        for (const item of created) {
            const diff = this.collectChanges(descriptor, item, null,
                this.bindPath(currentPath), fieldVirtualPath);
            if (diff) {
                changes.push(...diff);
            }
        }
        for (const item of deleted) {
            const diff = this.collectChanges(descriptor, null, item,
                this.bindPath(currentPath), fieldVirtualPath);
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
                        fieldVirtualPath: string): any[] {
        const field = fieldVirtualPath ? fieldVirtualPath + '.' + key : key;
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
            return this.collectChanges(descriptor, newval, oldval, null, fieldVirtualPath);

        }
    }

    private isMongooseId(field) {
        if (!field) {
            return false;
        }
        return /^[A-Fa-f0-9]{24}$/.test(field.toString());
    }

    private handleProperty(newval: any, oldval: any, path, currentPath): any {
        // console.log("handle prop", newval, oldval, field);
        try {
            if (newval instanceof Date || oldval instanceof Date) {
               return this.handleDatesDiff(newval, oldval, currentPath, path);
            } else if (newval instanceof Boolean || oldval instanceof Boolean && oldval !== newval) {
                return this.createDiff(
                    currentPath,  path, oldval ? 'Checked' : 'Unchecked', newval ? 'Checked' : 'Unchecked');
            } else {
                if (newval !== oldval) {
                    return this.createDiff(
                        currentPath, path, oldval, newval);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    private createDiff(currentPath: string, path: string, oldval: any, newval:any) {
        if (newval == null) {
            newval =  this.emptyLabel;
        }
        if (oldval == null) {
            oldval =  this.emptyLabel;
        }
        return new DiffDetails(
            currentPath, path, oldval, newval);
    }
    private handleDatesDiff(newval: Date | string, oldval: Date | string, currentPath: string, path: string){
        let _old = oldval ? new Date(oldval).toLocaleString(): oldval;
        let _new = newval ? new Date(newval).toLocaleString(): newval;
        if (_old !== _new) {
            return this.createDiff(currentPath,path,
                _old,
                _new);
        }
    }
}
