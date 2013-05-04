(function(){
  var keymap = {
    65: 'A',
    68: 'D',
    83: 'S',
    87: 'W'
  };
  var keycodes = Object.keys(keymap);

  function handleKeyEvent(state, evt) {
    var i;
    var code = evt.keyCode;
    for(i = 0, l = keycodes.length; i < l; ++ i) {
      if(code == keycodes[i]) {
        var key = keymap[code];
        var playerKey = playerKeyMap[key];
        playerKeyStates[playerKey] = state;
        return;
      }
    }
  };

  var playerKeyMap = {
    'A': 'left',
    'D': 'right',
    'W': 'up',
    'S': 'down'
  };

  var playerKeyStates = {
    'left': false,
    'right': false,
    'up': false,
    'down': false
  };

  /**
   * Run collision detection between two CSS classes such as 'entity', 'mines',
   * invoking the callback with each collision
   */
  function collisionDetection(classOne, classTwo, callback) {
    var level = document.getElementsByClassName('Level')[0];
    var entities1 = level.getElementsByClassName(classOne);
    var entities2 = level.getElementsByClassName(classTwo);
    for(var i = 0; i < entities1.length; ++i) {
      var entity1 = entities1[i];
      for(var j = 0; j < entities2.length; ++j) {
        var entity2 = entities2[i];
        if (entity1.x < entity2.x + entity2.width &&
            entity2.x < entity1.x + entity1.width &&
            entity1.y < entity2.y + entity2.height &&
            entity2.y < entity1.y + entity2.height) {

            callback(entity1, entity2);

        }
      }
    }
  }

  function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
  }

  document.getLevel = function getLevel() {
    return document.getElementsByClassName('Level')[0];
  };

  document.getPlayer = function getPlayer() {
    return document.getElementById('player');
  };

  window.onload = function (e) {
    console.log('game start!');

    var bossOs = new BossOs({
      hudContainer: document.querySelector('#hud'),
      playerKeyMap: playerKeyMap,
      playerKeyStates: playerKeyStates
    });

    document.addEventListener('keydown', handleKeyEvent.bind(undefined, true));
    document.addEventListener('keyup', handleKeyEvent.bind(undefined, false));

    document.getElementById('gameboard').appendChild(Game.levels['level1']);

    var frame = 0;
    var cachedTime = Date.now();
    function main() {
      window.requestAnimFrame(main);
      var t = Date.now();
      var dt = t - cachedTime;
      var i;
      var l;

      var level = document.getElementsByClassName('Level')[0];
      var playerEntity = level.getElementsByClassName('Player')[0];
      if(playerEntity) {
        playerEntity.velX += (playerKeyStates.left ? dt * -playerEntity.accel : 0.0) + (playerKeyStates.right ? dt * playerEntity.accel : 0.0);
        playerEntity.velY += (playerKeyStates.up ? dt * -playerEntity.accel : 0.0) + (playerKeyStates.down ? dt * playerEntity.accel : 0.0);
      }

      // Update entities
      var entities = level.getElementsByClassName('Entity');
      for(i = 0, l = entities.length; i < l; ++ i) {
        entities[i].update(dt);
      }

      // Collisions
      collisionDetection("Player", "Pirate", function() {
      });

      bossOs.update();

      // Flush render state to DOM
      for(i = 0, l = entities.length; i < l; ++ i) {
        entities[i].render();
      }

      cachedTime = t;
    };
    window.requestAnimFrame(main);
  };

}());

