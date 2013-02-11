var mineflayer = require('mineflayer');
var blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
var bot = mineflayer.createBot({username: 'Player'});

// Install the plugin
blockFinderPlugin(bot);

// Sample usage
bot.once('spawn', function() {
  bot.findBlock({
    point: bot.entity.position,
    matching: 56,
    maxDistance: 256,
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
