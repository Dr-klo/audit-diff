# audit-diff
Audit differences using map.

## Basic usage 
### Typescript

```typescript
import {DiffService, IDiffDetails, FieldMap} from 'audit-diff';

interface IUser {
    Name?: string;
    Address?: string;
    City?: string;
    Phone?: string;
    HiddenComment?: string;
}
// mapping constant
const UserMap: FieldMap<IUser>  = {
    Name: 'Name',
    Address: 'Address Line',
    City: 'City',
    Phone: 'Mobile Phone',
    // no map to HiddenComment
};

(async () => {
    const oldProfile: IUser = {
                                Name: 'John',
                                Address: 'Washington st.',
                                City: 'Chicago',
                                Phone: '111-111-1111',
                                HiddenComment: 'Comment 1'};
    const newProfile: IUser = {
                                Name: 'John',
                                Address: 'Washington st.',
                                City: 'Brooklyn',
                                Phone: '222-222-2222',
                                HiddenComment: 'Comment 2'};
    const diff: IDiffDetails[] = new DiffService(UserMap).diff(oldProfile, newProfile);
    // prints [ 
    //    DiffDetails {field: 'City', old_value: 'Chicago', new_value: 'Brooklyn'},
    //    DiffDetails {field: 'Mobile Phone', old_value: '111-111-1111', new_value: '222-222-2222'} ]
    console.log(diff);
})();


```

### JavaScript 
```javascript
var audit = require('audit-diff')

class User {
    constructor(name, address, city, phone, comment) {
        this.Name = name;
        this.Address = address;
        this.City = city;
        this.Phone = phone;
        this.HiddenComment = comment;
    }
}
// mapping constant
const UserMap = {
    Name: 'Name',
    Address: 'Address Line',
    City: 'City',
    Phone: 'Mobile Phone',
    // no map to HiddenComment
};

(async () => {
    const oldProfile = new User('John', 'Washington st.', 'Chicago', '111-111-1111', 'Comment 1');
    const newProfile = new User('John', 'Washington st.', 'Brooklyn', '222-222-2222', 'Comment 2');
    const diff = new audit.DiffService(UserMap).diff(oldProfile, newProfile);
    // prints [ 
    //     {field: 'City', old_value: 'Chicago', new_value: 'Brooklyn'},
    //     {field: 'Mobile Phone', old_value: '111-111-1111', new_value: '222-222-2222'} ]
    console.log(diff);
})();
```

## Reason

Difficulties to track changes prompted me made mechanism to audit changes. It is best suited for database driven forms or codebehind forms.
Audit-Diff  aims to solve easies comparison changes with UI-form.

## Install

`npm install audit-diff`

## Testing

`npm test`

## API Documentation
Note: this documentation for typescript usage.

### DiffService class

This is the class which check your objects to differences.

#### Methods:

`new DiffService(map: FieldMap<T>)`

Constructor create instance of the diff service to compare objects that implements type `T` or instances of this class (`T`).


`diff(old_state: T, new_state: T): IDiffDetails[]`

This method compare two objects and returns array of differences .
You can use the one instance of diff service to compare many objects;

### FieldMap class

FieldMap provide map scheme of object type.
If You will use declaration map of `FieldMap<T>`  - it allows create map properties of only existing fields in `T` type
For example
```typescript
class Foo {
    bar: string;
 }
 const fooMap: FieldMap<Foo> = {
    bar: "The Bar Field",
    another: "Another field" // throws compiler error
 }
 ```
Hint: If Some field doesn't have map  - it will exclude from comparizon.

### Descriptor class
For hierarchical structure of objects You have to use `Descriptor`

Example: 
```typescript

class Bar {
    title: string;
    desc: string;
}
const barMap: FieldMap<Bar> = {
    title: "Title",
    desc: "Description",
};
class Foo {
    bar: Bar;
};
const fooMap: FieldMap<Foo> = {
    bar: new Descriptor(barMap)
};

const foo1 = {
    bar: {
        title: "bar 1 title",
        desc: "desc",
    },
};
const foo2 = {
    bar: {
        title: "bar 2 title",
        desc: "desc",
    },
};
```
Comarison result of foo1 and foo2 will be 

` [{
        field: 'Title',
        old_value: 'bar 1 title',
        new_value: 'bar 2 title'
    }] `

For display hierarchy You should append to descriptor name of instance as second parameter: 
`bar: new Descriptor(barMap, "Bar")`. It returns 

` [{
        field: 'Bar -> Title',
        old_value: 'bar 1 title',
        new_value: 'bar 2 title'
    }] `

### Todo
- [x] Mapping differences to UI labels
- [x] Checking embedded objects and array
- [x] Custom function for comparison and displaying fields
- [ ] Interceptor for embedded object for custom comparizon(For example Mongodb ObjectId intercept)
- [ ] Load map from JSON
