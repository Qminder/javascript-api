# Qminder Javascript API
[![Build Status](https://travis-ci.org/Qminder/javascript-api.svg?branch=master)](https://travis-ci.org/Qminder/javascript-api) [![Dependency Status](https://gemnasium.com/Qminder/qminder-api.svg)](https://gemnasium.com/Qminder/qminder-api)
[![npm](https://img.shields.io/npm/v/qminder-api.svg)](https://www.npmjs.com/package/qminder-api)
[![Bower](https://img.shields.io/bower/v/qminder-api.svg)](http://bower.io/search/?q=qminder-api)

Javascript wrapper for Qminder REST API.

## Installation

You can install this package either manually or with `bower`.

### Manually

Add to your webpage:

[http://static.qminderapp.com/api/qminder-api.min.js](http://static.qminderapp.com/api/qminder-api.min.js)
```js
<script src="http://static.qminderapp.com/api/qminder-api.min.js" type="text/javascript"></script>
```

[http://static.qminderapp.com/api/qminder-bridge.min.js](http://static.qminderapp.com/api/qminder-bridge.min.js)
```js
<script src="http://static.qminderapp.com/api/qminder-bridge.min.js" type="text/javascript"></script>
```

### bower

```shell
bower install qminder-api
```

## API Methods

```js
Qminder.setKey(key);
```

### Locations

#### [List of locations](http://www.qminderapp.com/docs/api/locations/#list)
```js
Qminder.locations.list(callback);
```

#### [Location details](http://www.qminderapp.com/docs/api/locations/#details)
```js
Qminder.locations.details(locationId, callback);
```

#### [List of lines](http://www.qminderapp.com/docs/api/locations/#lines)
```js
Qminder.locations.lines(locationId, callback);
```

#### [List of users](http://www.qminderapp.com/docs/api/locations/#users)
```js
Qminder.locations.users(locationId, callback);
```

#### [Creating a line](http://www.qminderapp.com/docs/api/locations/#newline)
```js
Qminder.locations.createLine(locationId, name, callback);
```

### Lines

#### [Line details](http://www.qminderapp.com/docs/api/lines/#details)
```js
Qminder.lines.details(lineId, callback);
```

#### [Estimated time](http://www.qminderapp.com/docs/api/lines/#estimated-time-of-service)
```js
Qminder.lines.estimatedTime(lineId, callback);
```

#### [Deleting a line](http://www.qminderapp.com/docs/api/lines/#deleting)
```js
Qminder.lines.delete(lineId, [callback]);
```


### Tickets

#### [Creating a ticket](http://www.qminderapp.com/docs/api/tickets/#creating)
```js
Qminder.tickets.create(line, parameters, callback, [errorCallback]);
```

#### [Searching tickets](http://www.qminderapp.com/docs/api/tickets/#search)
```js
Qminder.tickets.search(parameters, callback);
```

#### [Calling a ticket from list](http://qminderapp.com/docs/api/tickets/#calling-from-list)
```js
Qminder.tickets.callNext(parameters, callback);
```

#### [Calling a ticket](http://www.qminderapp.com/docs/api/tickets/#calling)
```js
Qminder.tickets.call(parameters, callback);
```

#### [Recalling a ticket](http://qminderapp.com/docs/api/tickets/#recalling)
```js
Qminder.tickets.recall(id, callback);
```

#### [Marking ticket served](http://qminderapp.com/docs/api/tickets/#marking-served)
```js
Qminder.tickets.markServed(id, callback);
```

#### [Marking ticket no show](http://qminderapp.com/docs/api/tickets/#marking-noshow)
```js
Qminder.tickets.markNoShow(id, callback);
```

#### [Cancelling a ticket](http://qminderapp.com/docs/api/tickets/#cancelling)
```js
Qminder.tickets.cancel(id, user, callback);
```

#### [Assigning a ticket](http://qminderapp.com/docs/api/tickets/#assigning)
```js
Qminder.tickets.assign(id, assigner, assignee, callback);
```

#### [Reordering a ticket](http://qminderapp.com/docs/api/tickets/#reordering)
```js
Qminder.tickets.reorder(id, after, callback);
```

#### [Labelling a ticket](http://qminderapp.com/docs/api/tickets/#labelling)
```js
Qminder.tickets.addLabel(id, value, user, callback);
```

#### [Removing a label](http://qminderapp.com/docs/api/tickets/#removing-label)
```js
Qminder.tickets.removeLabel(id, value, user, callback);
```

#### [Ticket status](http://www.qminderapp.com/docs/api/tickets/#status)
```js
Qminder.tickets.details(id, callback);
```

### Users

#### [Creating a users](http://www.qminderapp.com/docs/api/users/#creating)
```js
Qminder.users.create(parameters, callback);
```

#### [Adding a role](http://www.qminderapp.com/docs/api/users/#adding-role)
```js
Qminder.users.addRole(id, parameters, [callback]);
```

#### [User details](http://qminderapp.com/docs/api/users/#details)
```js
Qminder.users.details(id, callback);
```

#### [Deleting a users](http://qminderapp.com/docs/api/users/#deleting)
```js
Qminder.users.delete(id, callback);
```

### Devices

#### [List of devices](http://qminderapp.com/docs/api/devices/)
```js
Qminder.devices.list(location, callback);
```

## Questions?

If you have any questions, please feel free to contact
[Qminder Support](mailto:support@qminderapp.com).


## LICENSE

Copyright 2015 Qminder Limited.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
