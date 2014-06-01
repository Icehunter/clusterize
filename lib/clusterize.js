'use strict';

var cluster = require('cluster');
var _ = require('underscore');

module.exports = function (initializer, options) {
    var _this = exports;
    options = options || {};
    var _logger = options.logger || console;
    if (cluster.isMaster) {
        _.each(require('os').cpus(), function (cpu, cpuNumber) {
            var fork = true;
            var offset = options.skipCPU || 0;
            if (options.skipCPU) {
                if (cpuNumber < options.skipCPU) {
                    fork = false;
                }
            }
            if (fork) {
                if (options.cpuLimit) {
                    fork = (cpuNumber - offset) < options.cpuLimit;
                }
                if (fork) {
                    if (options.verbose) {
                        _logger.info('Forking on CPU [' + cpuNumber + ']');
                    }
                    cluster.fork();
                }
            }
        });
        var timeouts = [];
        cluster.on('fork', function (worker) {
            timeouts[worker.id] = setTimeout(function () {
                if (options.verbose) {
                    _logger.error('Something must be wrong with the connection.');
                }
            }, 10000);
        });
        cluster.on('listening', function (worker, address) {
            clearTimeout(timeouts[worker.id]);
            if (options.verbose) {
                _logger.info('A worker is now connected to [' + address.address + ':' + address.port + '].');
            }
        });
        cluster.on('online', function (/*worker*/) {
            if (options.verbose) {
                _logger.info('Worker responded after it was forked.');
            }
        });
        cluster.on('disconnect', function (worker) {
            if (options.verbose) {
                _logger.info('Worker #[' + worker.id + '] has disconnected.');
            }
        });
        cluster.on('exit', function (worker, code, signal) {
            if (options.verbose) {
                _logger.info('Worker [%d] died [(%s)]. Restarting.', worker.process.pid, signal || code);
            }
            cluster.fork();
        });
    } else {
        initializer();
    }
    return _this;
};