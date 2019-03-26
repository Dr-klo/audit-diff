import {expect} from 'chai';
import 'mocha';
import {DiffService} from './diff.service';
import {Descriptor, DescriptorTypesEnum, FieldMap} from './idescriptor';

class Simple {
    public field: string;
}

const simpleMap: FieldMap<Simple> = {
    field: 'Simple field',
}

const barMap: FieldMap<Bar> = {
    title: 'Magic Title',
    user: 'Magic User',
};

const stackMap: FieldMap<StackClass> = {
    name: 'Stack item Name',
    id: 'Key',
};

const fooMap: FieldMap<IFoo> = {
    bar: new Descriptor(barMap),
    disabled: 'Is Disabled',
    edited: 'Is Edited',
    title: 'Magic Title',
    stack: new Descriptor(stackMap,
        'Foo Stack Table',
        DescriptorTypesEnum.Array,
        (a) => a.name,
        (a, b) => a.id === b.id),
};

interface IFoo {
    bar: Bar;
    title: string;
    edited?: Date;
    disabled: boolean;
    stack: StackClass[];
}

class Bar {
    public title: string;
    public user: string;
}

class Foo implements IFoo {
    public bar: Bar;
    public disabled: boolean;
    public edited: Date;
    public title: string;
    public stack: StackClass[];
}

class StackClass {
    public name: string;
    public id: number;
}

describe('Diff check', () => {

    it('Should not file on null pass', () => {
        const a = new Simple();
        const b = new Simple();
        a.field = 'a';
        b.field = 'b';

        const diff = new DiffService(simpleMap);
        console.log(diff.diff(null, b));
        console.log(diff.diff( a, null));
        console.log(diff.diff( null, null));
    });
    it('Diff only one field', () => {
        const a = new Simple();
        const b = new Simple();
        a.field = 'a';
        b.field = 'b';
        const service = new DiffService(simpleMap);
        const diff = service.diff(a, b);
        expect(diff.length).to.equal(1);
        expect(diff[0].old_value).to.equal(a.field);
        expect(diff[0].new_value).to.equal(b.field);
        expect(diff[0].field).to.equal(simpleMap.field);
    });
    it('Not Mapped field not checked', () => {
        const a = new Simple();
        const b = new Simple();
        a.field = 'a';
        b.field = 'a';
        const service = new DiffService(simpleMap);
        const diff = service.diff(a, b);
        expect(diff.length).to.equal(0);
    });
    it('Map diff Embedded Array of the same documents', () => {
        const a = new Foo();
        // a.title ='z';
        const b = new Foo();
        // b.title = 'z2';
        a.stack = [];
        b.stack = [];
        a.stack.push({name: 'A First Child', id: 1});
        b.stack.push({name: 'B First Child', id: 1 });

        const service = new DiffService<IFoo>(fooMap);
        const diff = service.diff(a, b);
        expect(diff[0].old_value).to.equal(a.stack[0].name);
        expect(diff[0].new_value).to.equal(b.stack[0].name);
    });
    it('Map diff Embedded Array of different documents', () => {
        const a = new Foo();
        // a.title ='z';
        const b = new Foo();
        // b.title = 'z2';
        a.stack = [];
        b.stack = [];
        a.stack.push({name: 'A First Child', id: 1});

        const service = new DiffService<IFoo>(fooMap);
        const diff = service.diff(a, b);
        // console.log(diff);
        expect(diff[0].old_value).to.contains(a.stack[0].name);
        expect(diff[0].new_value).to.equal(service.emptyLabel);
    });

    it('Should not fail on empty embedded array', () => {
        const a = new Foo();
        const b = new Foo();
        const service = new DiffService<IFoo>(fooMap);
        const diff = service.diff(a, b);
        // console.log(diff);
        expect(diff.length).to.equal(0);

    })
});
