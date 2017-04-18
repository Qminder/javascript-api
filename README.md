# Qminder Javascript API
[![Build Status](https://travis-ci.org/Qminder/javascript-api.svg?branch=master)](https://travis-ci.org/Qminder/javascript-api) [![Dependency Status](https://gemnasium.com/Qminder/qminder-api.svg)](https://gemnasium.com/Qminder/qminder-api)
[![npm](https://img.shields.io/npm/v/qminder-api.svg)](https://www.npmjs.com/package/qminder-api)
[![Bower](https://img.shields.io/bower/v/qminder-api.svg)](http://bower.io/search/?q=qminder-api)

Javascript wrapper for Qminder REST API.

## Installation

You can install this package either manually or with `bower` or `npm`.

### Manually

Add to your webpage:

[https://static.qminder.com/api/qminder-api.min.js](http://static.qminder.com/api/qminder-api.min.js)
```js
<script src="https://static.qminder.com/api/qminder-api.min.js" type="text/javascript"></script>
```

[https://static.qminder.com/api/qminder-bridge.min.js](http://static.qminder.com/api/qminder-bridge.min.js)
```js
<script src="https://static.qminder.com/api/qminder-bridge.min.js" type="text/javascript"></script>
```

### bower

```shell
bower install qminder-api
```

### npm

```shell
npm install qminder-api
```

## API Methods

```js
Qminder.setKey(key);
```

### Locations

#### [List of locations](https://www.qminder.com/docs/api/locations/#list)
```js
Qminder.locations.list(callback, [errorCallback]);
```

#### [Location details](https://www.qminder.com/docs/api/locations/#details)
```js
Qminder.locations.details(locationId, callback, [errorCallback]);
```

#### [List of lines](https://www.qminder.com/docs/api/locations/#lines)
```js
Qminder.locations.lines(locationId, callback, [errorCallback]);
```

#### [List of users](https://www.qminder.com/docs/api/locations/#users)
```js
Qminder.locations.users(locationId, callback, [errorCallback]);
```

#### [Creating a line](https://www.qminder.com/docs/api/locations/#newline)
```js
Qminder.locations.createLine(locationId, name, callback, [errorCallback]);
```

### Lines

#### [Line details](https://www.qminder.com/docs/api/lines/#details)
```js
Qminder.lines.details(lineId, callback, [errorCallback]);
```

#### [Estimated time](https://www.qminder.com/docs/api/lines/#estimated-time-of-service)
```js
Qminder.lines.estimatedTime(lineId, callback, [errorCallback]);
```

#### [Deleting a line](https://www.qminder.com/docs/api/lines/#deleting)
```js
Qminder.lines.delete(lineId, [callback], [errorCallback]);
```


### Tickets

#### [Creating a ticket](https://www.qminder.com/docs/api/tickets/#creating)
```js
Qminder.tickets.create(line, parameters, callback, [errorCallback]);
```

#### [Searching tickets](https://www.qminder.com/docs/api/tickets/#search)
```js
Qminder.tickets.search(parameters, callback, [errorCallback]);
```

#### [Calling a ticket from list](https://www.qminder.com/docs/api/tickets/#calling-from-list)
```js
Qminder.tickets.callNext(parameters, callback, [errorCallback]);
```

#### [Calling a ticket](https://www.qminder.com/docs/api/tickets/#calling)
```js
Qminder.tickets.call(parameters, callback, [errorCallback]);
```

#### [Recalling a ticket](https://www.qminder.com/docs/api/tickets/#recalling)
```js
Qminder.tickets.recall(id, callback, [errorCallback]);
```

#### [Marking ticket served](https://www.qminder.com/docs/api/tickets/#marking-served)
```js
Qminder.tickets.markServed(id, callback, [errorCallback]);
```

#### [Marking ticket no show](https://www.qminder.com/docs/api/tickets/#marking-noshow)
```js
Qminder.tickets.markNoShow(id, callback, [errorCallback]);
```

#### [Cancelling a ticket](https://www.qminder.com/docs/api/tickets/#cancelling)
```js
Qminder.tickets.cancel(id, user, callback, [errorCallback]);
```

#### [Assigning a ticket](https://www.qminder.com/docs/api/tickets/#assigning)
```js
Qminder.tickets.assign(id, assigner, assignee, callback, [errorCallback]);
```

#### [Reordering a ticket](https://www.qminder.com/docs/api/tickets/#reordering)
```js
Qminder.tickets.reorder(id, after, callback, [errorCallback]);
```

#### [Labelling a ticket](https://www.qminder.com/docs/api/tickets/#labelling)
```js
Qminder.tickets.addLabel(id, value, user, callback, [errorCallback]);
```

#### [Removing a label](https://www.qminder.com/docs/api/tickets/#removing-label)
```js
Qminder.tickets.removeLabel(id, value, user, callback, [errorCallback]);
```

#### [Ticket details](https://www.qminder.com/docs/api/tickets/#details)
```js
Qminder.tickets.details(id, callback, [errorCallback]);
```

#### [Audit logs for a ticket](https://www.qminder.com/docs/api/tickets/#auditlogs)
```js
Qminder.tickets.auditLogs(id, callback, [errorCallback]);
```

#### [Ticket messages](https://www.qminder.com/docs/api/tickets/#messages)
```js
Qminder.tickets.messages(id, callback, [errorCallback]);
```

### Users

#### [Creating a user](https://www.qminder.com/docs/api/users/#creating)
```js
Qminder.users.create(parameters, callback, [errorCallback]);
```

#### [Adding a role](https://www.qminder.com/docs/api/users/#adding-role)
```js
Qminder.users.addRole(id, parameters, [callback], [errorCallback]);
```

#### [User details](http://www.qminder.com/docs/api/users/#details)
```js
Qminder.users.details(id, callback, [errorCallback]);
```

#### [Deleting a user](http://www.qminder.com/docs/api/users/#deleting)
```js
Qminder.users.delete(id, callback, [errorCallback]);
```

#### [Adding a picture to a user](http://www.qminder.com/docs/api/users/#pictureadding)
```js
Qminder.users.addPicture(id, file, callback, [errorCallback]);
```

#### [Deleting picture from a user](http://www.qminder.com/docs/api/users/#picturedeleting)
```js
Qminder.users.deletePicture(id, callback, [errorCallback]);
```

### Devices

#### [List of devices](https://www.qminder.com/docs/api/devices/)
```js
Qminder.devices.list(location, callback, [errorCallback]);
```

## Questions?

If you have any questions, please feel free to contact
[Qminder Support](mailto:support@qminderapp.com).


## LICENSE

Copyright 2017 Qminder Limited.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
