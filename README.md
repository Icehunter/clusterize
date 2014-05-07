# Clusterize

Yes another 'ize' module which basically abstracts cluster into a common base for all my projects.

###Installation:
``` text
npm i git+ssh://git@github.com:Icehunter/clusterize.git --save
```

###Usage:
``` javascript
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
} else {
    // if this far; having or not having a parent is irrelevant as when loaded by cluster it will always be a child
    require('clusterize')(SetupServer);
    // you can use options as {verbose: true} to get logging for spawning and death/disconnection of a worker
    // require('clusterize')(SetupServer,{verbose: true});
}
```
