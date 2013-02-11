var assert = require('assert');

module.exports = init;

var MAX_CPU_SPIN = 100;
var vec3;

function init(mineflayer) {

    vec3 = mineflayer.vec3;

    function inject(bot) {

        var newBlockMap = {};

        for (var x = -1; x <= 1; x++) {
            for (var y = -1; y <= 1; y++) {
                for (var z = -1; z <= 1; z++) {
                    var directions = [];
                    if (x) {
                        directions.push(vec3(x, 0, 0));
                    } else {
                        directions.push(vec3(1, 0, 0));
                        directions.push(vec3(-1, 0, 0));
                    }
                    if (y) {
                        directions.push(vec3(0, y, 0));
                    } else {
                        directions.push(vec3(0, 1, 0));
                        directions.push(vec3(0, -1, 0));
                    }
                    if (z) {
                        directions.push(vec3(0, 0, z));
                    } else {
                        directions.push(vec3(0, 0, 1));
                        directions.push(vec3(0, 0, -1));
                    }
                    newBlockMap[vec3(x, y, z)] = directions;
                }
            }
        }

        function vec3Sign(vec) {
            var x = vec.x,
                y = vec.y,
                z = vec.z;

            if (x < 0) x = -1;
            else if (x > 0) x = 1;
            if (y < 0) y = -1;
            else if (y > 0) y = 1;
            if (z < 0) z = -1;
            else if (z > 0) z = 1;

            return vec3(x, y, z);
        }

        function BlockIterator(center) {
            this.center = center.floored();
            this.closedSet = { // All blocks that are this.distance blocks away
                center: center,
            };
            this.openSet = {}; // When a block in the closedSet is checked, its adjacent neighbors are added to the openSet (the ones that do not lead back to the center).
            this.distance = 0;
        }

        BlockIterator.prototype.next = function() {
            // Get first item in closedSet
            for (var key in this.closedSet) break;

            if (key == null) {
                // We have exhausted all blocks within this.distance of this.center.
                this.closedSet = this.openSet;
                this.openSet = {};
                for (key in this.closedSet) break;
                this.distance++;
            }

            var point = this.closedSet[key];
            delete this.closedSet[key];
            if (point == null) {
                // Should never happen
                return null;
            }

            // Add all adjacent blocks that do not lead back to center to the open set
            var distanceSigned = vec3Sign(point.minus(this.center).floored());
            var directions = newBlockMap[distanceSigned];
            for (var i = 0; i < directions.length; i++) {
                var offset = point.plus(directions[i]);
                if (offset.y < 0 || offset.y > 255) continue;
                this.openSet[offset] = offset;
            }
            return point.floored();
        }

        function createBlockTypeMatcher(blockType) {
            return function(block) {
                return block == null ? false : blockType === block.type;
            };
        }

        function createBlockArrayMatcher(blockArray) {
            return function(block) {
                return block == null ? false : blockArray.indexOf(block.type) !== -1;
            };
        }

        function createBlockMapMatcher(blockTypeMap) {
            return function(block) {
                return block == null ? false : blockTypeMap[block.type];
            };
        }

        function predicateFromMatching(matching) {
            if (typeof(matching) === 'number') {
                return createBlockTypeMatcher(matching)
            } else if (typeof(matching) === 'function') {
                return matching;
            } else if (Array.isArray(matching)) {
                return createBlockArrayMatcher(matching);
            } else if (typeof(matching) === 'object') {
                return createBlockMapMatcher(matching);
            } else {
                // programmer error. crash loudly and proudly
                throw new Error("Block Finder: Unknown value for matching: " + matching);
            }
        }

        function optionsWithDefaults(options) {
            assert.notEqual(options.matching, null);
            assert.notEqual(options.point, null);
            return {
                point: options.point,
                matching: options.matching,
                count: options.count == null ? 1 : options.count,
                maxDistance: options.maxDistance == null ? 64 : options.maxDistance,
                predicate: predicateFromMatching(options.matching),
            };
        }

        bot.findBlock = findBlock;
        bot.findBlockSync = findBlockSync;

        function findBlockSync(options) {
            options = optionsWithDefaults(options);

            var it = new BlockIterator(options.point);
            var result = [];

            while (result.length < options.count && it.distance <= options.maxDistance) {
                var block = bot.blockAt(it.next());
                if (options.predicate(block)) result.push(block);
            }

            return result;
        }

        function findBlock(options, callback) {
            options = optionsWithDefaults(options);

            var it = new BlockIterator(options.point);
            var result = [];
            var lastTick = new Date();

            next();

            function next() {
                if (result.length >= options.count || it.distance > options.maxDistance) {
                    return callback(null, result);
                }

                var block = bot.blockAt(it.next());
                if (options.predicate(block)) result.push(block);
                var cpuSpinTime = new Date() - lastTick;
                if (cpuSpinTime > MAX_CPU_SPIN) {
                    process.nextTick(function() {
                        lastTick = new Date();
                        next();
                    });
                } else {
                    next();
                }
            }
        }
    }
    return inject;
}
