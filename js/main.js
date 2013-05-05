(function(){
  /**
   * @param {Object} obj The Object to iterate through.
   * @param {function(*, string)} iterator The function to call for each
   * property.
   */
  function forEach(obj, iterator) {
    var prop;
    for (prop in obj) {
      if (obj.hasOwnProperty([prop])) {
        iterator(obj[prop], prop);
      }
    }
  };

  /**
   * Create a transposed copy of an Object.
   *
   * @param {Object} obj
   * @return {Object}
   */
  function getTranspose(obj) {
    var transpose = {};

    forEach(obj, function (val, key) {
      transpose[val] = key;
    });

    return transpose;
  };

  var KEY_MAP = {
     'A': 65
    ,'B': 66
    ,'C': 67
    ,'D': 68
    ,'E': 69
    ,'F': 70
    ,'G': 71
    ,'H': 72
    ,'I': 73
    ,'J': 74
    ,'K': 75
    ,'L': 76
    ,'M': 77
    ,'N': 78
    ,'O': 79
    ,'P': 80
    ,'Q': 81
    ,'R': 82
    ,'S': 83
    ,'T': 84
    ,'U': 85
    ,'V': 86
    ,'W': 87
    ,'X': 88
    ,'Y': 89
    ,'Z': 90
    ,'ESC': 27
    ,'SPACE': 32
    ,'LEFT': 37
    ,'UP': 38
    ,'RIGHT': 39
    ,'DOWN': 40
  };

  /**
   * The transposed version of KEY_MAP.
   *
   * @type {Object.<string>}
   */
  var TRANSPOSED_KEY_MAP = getTranspose(KEY_MAP);

  var playerKeyMap = {
    'A': 'left',
    'D': 'right',
    'W': 'up',
    'S': 'down',
    'SPACE': 'fire',
    'P': 'power',
    'T': 'shield',
    'M': 'missile',
    'L': 'laser'
  };
  var playerKeyStates = {};
  Object.keys(playerKeyMap).forEach(function(key) {
    var action = playerKeyMap[key];
    playerKeyStates[action] = false;
  });

  Game.playerKeyMap = playerKeyMap;
  Game.playerKeyStates = playerKeyStates;

  function nullFunction () {}

  function handleKeyEvent(state, callback, evt) {
    var i;
    var key = TRANSPOSED_KEY_MAP[evt.keyCode];
    if(!key) return;
    callback = callback || nullFunction;

    evt.preventDefault();
    if(playerKeyMap.hasOwnProperty(key)) {
      var action = playerKeyMap[key];
      playerKeyStates[action] = state;
      callback(action, state);
    }
  };

  /**
   * Run collision detection between two CSS classes such as 'entity', 'mines',
   * invoking the callback with each collision
   */
  window.noCollisionDetection = function noCollisionDetection(entity1, classTwo, callback) {
    var level = document.getLevel();
    var entities2 = level.getElementsByClassName(classTwo);
    var hasCol = false;
    var w1, w2, h1, h2;
    var hw1, hw2, hh1, hh2;

    for(var j = 0; j < entities2.length; ++j) {
      var entity2 = entities2[j];

      // for center alignment, i.e. marginLeft, marginTop
      w1 = entity1.hitBox[0];
      w2 = entity2.hitBox[0];
      h1 = entity1.hitBox[1];
      h2 = entity2.hitBox[1];
      hw1 = w1/2;
      hw2 = w2/2;
      hh1 = h1/2;
      hh2 = h2/2;

      if (entity1.x - hw1 < entity2.x - hw2 + w2 &&
          entity2.x - hw2 < entity1.x - hw1 + w1 &&
          entity1.y - hh1 < entity2.y - hh2 + h2 &&
          entity2.y - hh2 < entity1.y - hh1 + h1) {

          hasCol = true;
      }
    }
    if (hasCol == false) {
      callback(entity1);
    }
  }
  window.collisionDetection = function collisionDetection(classOne, classTwo, callback) {
    var level = document.getLevel();
    var entities1 = level.getElementsByClassName(classOne);
    var entities2 = level.getElementsByClassName(classTwo);
    var w1, w2, h1, h2;
    var hw1, hw2, hh1, hh2;

    for(var i = 0; i < entities1.length; ++i) {
      var entity1 = entities1[i];
      if(!entity1) continue;
      for(var j = 0; j < entities2.length; ++j) {
        var entity2 = entities2[j];
        if(!entity2) continue;

        // for center alignment, i.e. marginLeft, marginTop
        w1 = entity1.hitBox[0];
        w2 = entity2.hitBox[0];
        h1 = entity1.hitBox[1];
        h2 = entity2.hitBox[1];
        hw1 = w1/2;
        hw2 = w2/2;
        hh1 = h1/2;
        hh2 = h2/2;

        if (entity1.x - hw1 < entity2.x - hw2 + w2 &&
            entity2.x - hw2 < entity1.x - hw1 + w1 &&
            entity1.y - hh1 < entity2.y - hh2 + h2 &&
            entity2.y - hh2 < entity1.y - hh1 + h1) {

            callback(entity1, entity2);

        }
      }
    }
  }

  function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
  }

  document.setLevel = function setLevel(level) {
    var currentLevel = document.getLevel();
    if(currentLevel)
      currentLevel.parentNode.removeChild(currentLevel);
    document.getElementById('gameboard').appendChild(level);
    document.title = "current level: " + level.id;
  };

  document.getLevel = function getLevel() {
    return document.getElementsByClassName('Level')[0];
  };

  document.getPlayer = function getPlayer() {
    return document.getElementById('player');
  };

  document.spawn = function spawn(entity) {
    document.getLevel().appendChild(entity);
  };

  document.kill = function kill(entity) {
    entity.parentNode.removeChild(entity);
  };

  window.onload = function (e) {
    window.bgOffsetX = 0;
    window.bgOffsetY = 0;
    var bossOs = new BossOs({
      hudContainer: document.querySelector('#hud'),
      playerKeyMap: playerKeyMap,
      playerKeyStates: playerKeyStates
    });

    document.addEventListener('keydown', handleKeyEvent.bind(undefined, true, bossOs.playerKeyStateChange));
    document.addEventListener('keyup', handleKeyEvent.bind(undefined, false, bossOs.playerKeyStateChange));

    document.setLevel(Game.levels['level1']());

    var frame = 0;
    var cachedTime = Date.now();
    var changeLevelOnNextFrame = null;
    var degToRad = 0.0174532925;
    function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

    document.getPlayer().childSprites.rocket1.reverseSpriteToStart();
    document.getPlayer().childSprites.rocket2.reverseSpriteToStart();

    var rocketsActive = false;

    function main() {
      window.requestAnimFrame(main);

      if (changeLevelOnNextFrame) {
        document.setLevel(changeLevelOnNextFrame);
        changeLevelOnNextFrame = null;
        document.getPlayer().childSprites.rocket1.reverseSpriteToStart();
        document.getPlayer().childSprites.rocket2.reverseSpriteToStart();
        rocketsActive = false;
      }
      var t = Date.now();
      var dt = t - cachedTime;
      var i;
      var l;

      var level = document.getElementsByClassName('Level')[0];
      var playerEntity = level.getElementsByClassName('Player')[0];

      var entityKillList = [];

      if(playerEntity) {
        document.title = "Player: " + playerEntity.x.toFixed(1) + ", " + playerEntity.y.toFixed(1);

        // Apply rotation
        var rotationDirSign = 0;
        if (playerKeyStates.left) {
          rotationDirSign = -1;
        } else if (playerKeyStates.right) {
          rotationDirSign = 1;
        }

        if (playerKeyStates.up && !rocketsActive) {
          playerEntity.childSprites.rocket1.continueSprite();
          playerEntity.childSprites.rocket2.continueSprite();
          rocketsActive = true;
        }
        else if (!playerKeyStates.up && rocketsActive) {
          rocketsActive = false;
          playerEntity.childSprites.rocket1.reverseSpriteToStart();
          playerEntity.childSprites.rocket2.reverseSpriteToStart();
        }

        // d/ms                  += ms * scalar * d/ms^2
        playerEntity.rotationVel += dt * rotationDirSign * playerEntity.rotationAccel;

        // d/ms                  *= ms * scalar/ms
        playerEntity.rotationVel *= Math.pow(playerEntity.rotationDamp, dt/1000);

        if (Math.abs(playerEntity.rotationVel) > playerEntity.maxRotationVel) {
          playerEntity.rotationVel = playerEntity.maxRotationVel * sign(playerEntity.rotationVel);
        }

        // Note: We're computing the thust on the old rotation, this will lag by a frame for simplicity
        var thrustDirSign = 0;
        if (playerKeyStates.down) {
          thrustDirSign = 1;
        } else if (playerKeyStates.up) {
          thrustDirSign = -1;
        }

        playerEntity.thrust(playerEntity, dt, playerEntity.rotation, thrustDirSign);

      }

      // Update entities
      var entities = level.getElementsByClassName('Entity');

      for(i = 0, l = entities.length; i < l; ++ i) {
        var entity = entities[i];
        if(entity && 'function' === typeof entity.ai)
          entity.ai(dt);
      }

      for(i = 0, l = entities.length; i < l; ++ i) {
        var entity = entities[i];
        if(entity && 'function' === typeof entity.update)
          entity.update(dt);
      }

      // Collisions
      window.collisionDetection("Player", "Wormhole", function() {
        var nextLevel = document.getLevel().nextId;
        changeLevelOnNextFrame = Game.levels[nextLevel]();
      });

      window.collisionDetection("Pirate", "Bullet", function(pirate, bullet) {
        entityKillList.push(bullet);
        document.spawn(new Game.Entity({
          type: 'laserHit',
          x: bullet.x,
          y: bullet.y,
        }));
      });

      window.noCollisionDetection(playerEntity, "Bounds", function() {
        var bounds = document.getElementsByClassName("Bounds")[0];
        // Outside the level
        if (playerEntity.x < bounds.x) {
          playerEntity.x += bounds.width;
          window.bgOffsetX += bounds.width;
        }
        if (playerEntity.y < bounds.y) {
          playerEntity.y += bounds.height;
          window.bgOffsetY += bounds.height;
        }
        if (playerEntity.x > bounds.x + bounds.width/2) {
          playerEntity.x -= bounds.width;
          window.bgOffsetX -= bounds.width;
        }
        if (playerEntity.y > bounds.y + bounds.height/2) {
          playerEntity.y -= bounds.height;
          window.bgOffsetY -= bounds.height;
        }
      });

      bossOs.update(playerEntity);

      while (entityKillList.length > 0) {
        var entity = entityKillList.pop();
        if (entity.parentNode) {
          document.kill(entity);
        }
      }

      Array.prototype.forEach.call(document.getLevel().querySelectorAll('.sprite'), function(element){
        element.updateSprite(dt);
      });

      // Flush render state to DOM
      for(i = 0, l = entities.length; i < l; ++ i) {
        entities[i].render();
      }

      var x, y;
      x = -5000 + (window.bgOffsetX-window.Game.Camera.x())/5;
      y = -5000 + (window.bgOffsetY-window.Game.Camera.y())/5;
      window.setTransform(document.getElementById("bg3"), "translate(" + x + "px," + y + "px)");
      x = -5000 + (window.bgOffsetX-window.Game.Camera.x())/10;
      y = -5000 + (window.bgOffsetY-window.Game.Camera.y())/10;
      window.setTransform(document.getElementById("bg2"), "translate(" + x + "px," + y + "px)");
      x = -5000 + (window.bgOffsetX-window.Game.Camera.x())/50;
      y = -5000 + (window.bgOffsetY-window.Game.Camera.y())/50;
      window.setTransform(document.getElementById("bg1"), "translate(" + x + "px," + y + "px)");

      cachedTime = t;
    };
    window.requestAnimFrame(main);
  };

}());

