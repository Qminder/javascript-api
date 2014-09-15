# Qminder Javascript API
[![Build Status](https://travis-ci.org/Qminder/qminder-api.png?branch=master)](https://travis-ci.org/Qminder/qminder-api)

Javascript wrapper for Qminder REST API.

## Installation

Add to your webpage:

[http://static.qminderapp.com/api/qminder-api.min.js](http://static.qminderapp.com/api/qminder-api.min.js)
```js
<script src="http://static.qminderapp.com/api/qminder-api.min.js" type="text/javascript"></script>
```

[http://static.qminderapp.com/api/qminder-bridge.min.js](http://static.qminderapp.com/api/qminder-bridge.min.js)
```js
<script src="http://static.qminderapp.com/api/qminder-bridge.min.js" type="text/javascript"></script>
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

#### [Watching for last created ticket](http://www.qminderapp.com/docs/api/lines/#watchcreated)
```js
Qminder.lines.watchCreated(lineId, [lastKnownTicketId,] callback);
```
#### [Watching for last called ticket](http://www.qminderapp.com/docs/api/lines/#watchcalled)
```js
Qminder.lines.watchCalled(lineId, [lastKnownTicketId,] callback);
```
#### [Resetting number sequence](http://www.qminderapp.com/docs/api/lines/#resetting)
```js
Qminder.lines.reset(lineId, callback);
```
#### [Deleting a line](http://www.qminderapp.com/docs/api/lines/#deleting)
```js
Qminder.lines.delete(lineId, [callback]);
```


### Tickets

#### [Creating a ticket](http://www.qminderapp.com/docs/api/tickets/#creating)
```js
Qminder.tickets.create(line, parameters, callback);
```

#### [Searching tickets](http://www.qminderapp.com/docs/api/tickets/#search)
```js
Qminder.tickets.search(parameters, callback);
```

#### [Calling a ticket](http://www.qminderapp.com/docs/api/tickets/#calling)
```js
Qminder.tickets.call(lines, user, callback);
```

#### [Ticket status](http://www.qminderapp.com/docs/api/tickets/#status)
```js
Qminder.tickets.details(id, callback);
```

## Questions?

If you have any questions, please feel free to contact
[Qminder Support](mailto:support@qminderapp.com).


## LICENSE

Copyright 2014 Qminder Limited.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
