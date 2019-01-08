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
}
// mapping constant
const UserMap: FieldMap<IUser>  = {
    Name: 'Name',
    Address: 'Address Line',
    City: 'City',
    Phone: 'Mobile Phone',
};

(async () => {
    const oldProfile: IUser = {Name: 'John', Address: 'Washington st.', City: 'Chicago', Phone: '111-111-1111'};
    const newProfile: IUser = {Name: 'John', Address: 'Washington st.', City: 'Brooklyn', Phone: '222-222-2222'};
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
    constructor(name, address, city, phone) {
        this.Name = name;
        this.Address = address;
        this.City = city;
        this.Phone = phone;
    }
}
// mapping constant
const UserMap = {
    Name: 'Name',
    Address: 'Address Line',
    City: 'City',
    Phone: 'Mobile Phone',
};

(async () => {
    const oldProfile = new User('John', 'Washington st.', 'Chicago', '111-111-1111');
    const newProfile = new User('John', 'Washington st.', 'Brooklyn', '222-222-2222');
    const diff = new audit.DiffService(UserMap).diff(oldProfile, newProfile);
    // prints [ 
    //    DiffDetails {field: 'City', old_value: 'Chicago', new_value: 'Brooklyn'},
    //    DiffDetails {field: 'Mobile Phone', old_value: '111-111-1111', new_value: '222-222-2222'} ]
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

### Todo
- [x] Mapping differences to UI labels
- [x] Checking embedded objects and array
- [x] Custom function for comparison and displaying fields
- [ ] Interceptor for embedded object for custom comparizon(For example Mongodb ObjectId intercept)
- [ ] Load map from JSON
