# mineflayer-blockFinder

A library to help your mineflayer bot find blocks in the 3D world.

See [mineflayer](https://github.com/superjoe30/mineflayer/).

## Usage

```js
var mineflayer = require('mineflayer');
var blockFinderPlugin = require('mineflayer-blockFinder')(mineflayer);
var bot = mineflayer.createBot({username: 'Player'});

// Install the plugin
blockFinderPlugin(bot);

// Sample usage
bot.once('spawn', function() {
  bot.findBlock(bot.entity.position, 56, {
    radius: 256,
    count: 1,
  }, function(err, blockPoints) {
    if (err) {
      return bot.chat('Error trying to find Diamond Ore: ' + err);
      bot.quit('quitting');
      return;
    }
    if (blockPoints.length) {
      bot.chat('I found a Diamond Ore block at ' + blockPoints[0] + '.');
      bot.quit('quitting');
      return;
    } else {
      bot.chat("I couldn't find any Diamond Ore blocks within 256.");
      bot.quit('quitting');
      return;
    }
  });
});
```

## Documentation

### bot.findBlock(point, blockMatchType, options, callback)

Finds the nearest block(s) to the given point.
 * `point` - The start position of the search.
 * `blockMatchType` - A function that returns true if the given block is a match.  Also supports this value being a block id or array of block ids.
 * `options` - Additional options for the search:
   - `radius` - The radius of the search, defaults to 64.
   - `count` - The number of blocks to find at most, defaults to 1.
 * `callback` - A callback function to get the result.  Function signature:

```
function(err, arrayOfPoints)
```

### bot.findBlockSync(point, blockMatchType, [radius], [count])

Finds the nearest block(s) to the given point synchronously.

See `bot.findBlock`.
