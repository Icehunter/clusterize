'use strict';

var cluster = require('cluster');
var _ = require('underscore');

var SetupClusterize = function setupClusterize(initializer, options, eventHandlers) {
    if (!(this instanceof SetupClusterize)) {
        return new SetupClusterize(initializer, options, eventHandlers);
    }
    var _this = this;
    _this.options = options || {};
    if (cluster.isMaster) {
        require('util').inherits(exports, require('events').EventEmitter);
        // setup emitter subscribers if passed
        if (eventHandlers) {
            for (var key in eventHandlers) {
                _this.on(key, eventHandlers[key]);
            }
        }
        _.each(require('os').cpus(), function (cpu, cpuNumber) {
            var fork = true;
            var offset = _this.options.skipCPU || 0;
            if (_this.options.skipCPU) {
                if (cpuNumber < _this.options.skipCPU) {
                    fork = false;
                }
            }
            if (fork) {
                if (_this.options.cpuLimit) {
                    fork = (cpuNumber - offset) < _this.options.cpuLimit;
                }
                if (fork) {
                    _this.emit('forking', {
                        message: 'Forking on CPU [' + cpuNumber + ']',
                        cpu: cpu,
                        cpuNumber: cpuNumber
                    });
                    cluster.fork();
                }
            }
        });
        var timeouts = [];
        cluster.on('fork', function (worker) {
            timeouts[worker.id] = setTimeout(function () {
                _this.emit('timedout', {
                    message: 'Something must be wrong with the connection.',
                    worker: worker
                });
            }, 10000);
        });
        cluster.on('listening', function (worker, address) {
            clearTimeout(timeouts[worker.id]);
            _this.emit('listening', {
                message: 'A worker is now connected to [' + address.address + ':' + address.port + '].',
                worker: worker,
                address: address
            });
        });
        cluster.on('online', function (worker) {
            _this.emit('online', {
                message: 'Worker responded after it was forked.',
                worker: worker
            });
        });
        cluster.on('disconnect', function (worker) {
            _this.emit('disconnect', {
                message: 'Worker #[' + worker.id + '] has disconnected.',
                worker: worker
            });
        });
        cluster.on('exit', function (worker, code, signal) {
            _this.emit('exit', {
                message: 'Worker [' + worker.process.pid + '] died [(' + signal || code + ')]. Restarting.',
                worker: worker,
                code: code,
                signal: signal
            });
            cluster.fork();
        });
    }
    else {
        initializer();
    }
    return _this;
};

module.exports = SetupClusterize;

require('util').inherits(module.exports, require('events').EventEmitter);
