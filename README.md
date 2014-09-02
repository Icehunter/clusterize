# Clusterize

Yes another 'ize' module which basically abstracts cluster into a common base for all my projects.

###Installation:
``` text
npm i git://github.com/icehunter/clusterize -S
```

###Usage:
``` javascript
'use strict';

var cluster = require('cluster');

var SetupServer = function setupServer(hasParent) {
    if (!(this instanceof SetupServer)) {
        return new SetupServer(hasParent);
    }

    var express = require('express');
    var app = express();

    app.get('/', function (req, res) {
        res.send('hello from worker [' + cluster.worker.id + ']\'s world');
    });

    // if loaded in a unit test framework or submodule don't spawn on port
    if (!hasParent) {
        app.listen(process.env.PORT || 3000);
    }
};

if (module.parent) {
    new SetupServer(true);
}
else {
    // if this far; having or not having a parent is irrelevant as when loaded by cluster it will always be a child
    var options = {
        workerLimit: process.env.NODE_WORKER_LIMIT
    };
    require('../lib/clusterize')(SetupServer, options, {
        forking: function (e) {
            // message: 'Forking on Worker [#' + workerNumber + ']',
            // workerNumber: workerNumber
            console.log(e);
        },
        timedout: function (e) {
            // message: 'Something must be wrong with the connection.',
            // worker: worker
            console.log(e);
        },
        listening: function (e) {
            // message: 'A worker is now connected to [' + address.address + ':' + address.port + '].',
            // worker: worker,
            // address: address
            console.log(e);
        },
        online: function (e) {
            // message: 'Worker responded after it was forked.',
            // worker: worker
            console.log(e);
        },
        disconnect: function (e) {
            // message: 'Worker #[' + worker.id + '] has disconnected.',
            // worker: worker
            console.log(e);
        },
        exit: function (e) {
            // message: 'Worker [' + worker.process.pid + '] died [(' + signal || code + ')]. Restarting.',
            // worker: worker,
            // code: code,
            // signal: signal
            console.log(e);
        }
    });
}
```
