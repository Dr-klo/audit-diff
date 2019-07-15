import {expect} from 'chai';
import 'mocha';
import {DiffService} from './diff.service';
import {Descriptor, DescriptorTypesEnum, FieldMap, IDescriptor} from './idescriptor';

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

    constructor() {
        this.stack = [];
    }
}

class StackClass {
    public name: string;
    public id: number;
}

describe('Diff check', () => {

    it('Should not fail on null pass', () => {
        const a = new Simple();
        const b = new Simple();
        a.field = 'a';
        b.field = 'b';

        const diff = new DiffService(simpleMap);
        expect(() => {
            diff.diff(null, b)
        }).to.not.throw();
        expect(() => {
            diff.diff(a, null)
        }).to.not.throw();
        expect(() => {
            diff.diff(null, null)
        }).to.not.throw();
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

    it('Should get path', () => {
        const a = new Foo();
        const b = new Foo();
        a.bar = new Bar();
        b.bar = new Bar();
        a.bar.user = "A Bar User";
        b.bar.user = "B Bar User";
        const service = new DiffService<IFoo>(fooMap);
        const diff = service.diff(a, b);
        expect(diff.length).to.equal(1);
        expect(diff[0].path).to.equal('bar.user');

    })
    it('Should get path of array', () => {
        const a = new Foo();
        const b = new Foo();
        a.stack.push({name: "A Stack Name", id: 0});
        b.stack.push({name: "B Stack Name", id: 0});
        a.stack.push({name: "C Stack Name", id: 1});
        b.stack.push({name: "D Stack Name", id: 2});
        const service = new DiffService<IFoo>(fooMap);
        const diff = service.diff(a, b);
        expect(diff.length).to.equal(3);
        expect(diff[0].path).to.equal('stack[0].name');
        expect(diff[0].field).to.equal((<IDescriptor>fooMap.stack).descriptorName + service.delimeter + stackMap.name);
        expect(diff[1].path).to.equal('stack');
        expect(diff[2].path).to.equal('stack');

    });
    it('Should Correct Bind Path', () => {
        const service = new DiffService<IFoo>(fooMap);
        expect(service.bindPath('root')).to.equal('root');
        expect(service.bindPath(null, 'child')).to.equal('child');
        expect(service.bindPath('root', 'child')).to.equal('root.child');
        expect(service.bindPath('root', 'child', 0)).to.equal('root.child[0]');
        expect(service.bindPath('root', 'child', 4)).to.equal('root.child[4]');
    });
    it('Should not fail on empty date', () => {
        const a = {date: new Date(2019,1,1)};
        const b = {date: null};
        const service = new DiffService<any>({date: "Date Title"});
        const diff = service.diff(a, b);
        expect(diff.length).to.equal(1);
        expect(diff[0].path).to.equal('date');
        expect(diff[0].old_value).to.equal(a.date.toLocaleString());
        expect(diff[0].new_value).to.equal('N/A');
    })
});
