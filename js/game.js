(function(){
  var degToRad = 0.0174532925;

  function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
  }
  window.clamp = clamp;

  function sign(number) {
    if(0 === number) return 0;
    return (number/Math.abs(number) > 0) ? 1 : -1;
  }

  function extend(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  function setTransform(element, transform) {
    element.style.transform = transform;
    element.style.webkitTransform = transform;
    element.style.mozTransform = transform;
    element.style.msTransform = transform;
    element.style.oTransform = transform;
  }
  window.setTransform = setTransform;

  var nextEntityId = 0;
  function Entity(options) {
    options = options || {};

    var entityDefinition = {};
    if (options.type) {
      entityDefinition = Game.entityDefinitions[options.type];
    }

    Object.keys(entityDefinition).forEach(function(key){
      options[key] = options[key] || entityDefinition[key];
    });

    var id = options['id'] || 'Entity' + nextEntityId++;
    var img = options['img'];
    var width = options.width || 10;
    var height = options.height || 10;
    var extraClasses = options['classes'] || [];

    var div = document.createElement('div');

    if (entityDefinition.spriteLayout && entityDefinition.spriteLayout) {
      Game.Sprite.createFromLayout(entityDefinition.spriteLayout, div);
    }
    else {
      if(img) {
        div.style.backgroundImage = "url(" + img + ")";
      }
    }

    div.options = options;
    div.img = img;
    div.classList.add('Entity');
    extraClasses.forEach(function(className) {
      div.classList.add(className);
    });
    div.id = id;
    div.width = width;
    div.height = height;

    if (div.className.indexOf("Pirate") != -1 ||
        div.className.indexOf("Player") != -1) {
      div.classList.add("Damagable");
    }

    div.style.width = width + 'px';
    div.style.height = height.toFixed(1) + 'px';

    div.hitBox = entityDefinition.hitBox || [width*.8, height*.8];

    div.x = options['x'] || 0;
    div.y = options['y'] || 0;
    div.velX = options['velX'] || 0.0;
    div.velY = options['velY'] || 0.0;
    div.velMax = 0.5;
    if (div.className.indexOf("Pirate") != -1) {
      div.velMax = 0.5/2;
    }
    div.drag = 0.000;
    div.accel = 0.01;
    div.rotation = options['rotation'] || 0;
    div.rotationVel = options['rotationVel'] || 0;
    div.rotationAccel = options['rotationAccel'] || 0.0005;
    div.rotationDrag = 0.15;
    div.maxRotationVel = .2;
    div.velDamp = 0.1;
    if (div.className.indexOf("Pirate") != -1) {
      div.velDamp = 0.001;
    }
    div.rotationDamp = 0.1;
    div.scaling = options.scaling;
    div.update = options.update ? options.update.bind(div) : undefined;
    div.ai = options['ai'] ? options['ai'].bind(div) : undefined;

    div.damage = options.damage;
    div.life = options.life;
    div.lifeMax = options.life;
    div.faceVelocityDirection = options['faceVelocityDirection'] || false;
    div.showOnMinimap = options['showOnMinimap'] || false;
    div.minimapColor = options['minimapColor'] || "red";
    div.scouted = false;
    if (div.className.indexOf("Pirate") != -1) {
      div.showOnMinimap = true;
    }
    if (div.className.indexOf("Player") != -1) {
      div.showOnMinimap = true;
      div.minimapColor = "blue";
    }

    // Sprite properties
    div.spriteFrameX = options.spriteFrameX;
    div.spriteFrameY = options.spriteFrameY;
    div.spriteFrameTime = options['spriteFrameTime'] || 100;
    div.frameTimeRemaining = div.spriteFrameTime;

    // Weapon properties
    div.bulletType = options['bulletType'] || "Bullet";
    div.hitType = options['hitType'] || "laserHit";
    div.weaponReloadTime = {
      "Missile": 150,
      "Laser": 500,
      "Bullet": 400,
      "BulletStrong": 200,
      "EndGameBullet": 200,
    };
    div.weaponCooldown = {
      "Missile": 0,
      "Laser": 0,
      "Bullet": 0,
      "BulletStrong": 0,
      "EndGameBullet": 0,
    };
    div.ttl = options['ttl'] || null;
    div.owner = options['owner'] || null;

    div.topLeftX = function() {
      return this.x - this.width/2;
    }

    div.topLeftY = function() {
      return this.y - this.height/2;
    }

    div.bottomRightX = function() {
      return this.x + this.width/2;
    }

    div.bottomRightY = function() {
      return this.y + this.height/2;
    }

    div.centerX = function() {
      return this.x;
    };

    div.centerY = function() {
      return this.y;
    };

    div.faceAngle = function (x, y) {
      return Math.atan2(y - this.y, x - this.x)/degToRad + 90;
    };

    div.distanceTo = function distanceTo(x, y) {
      return Math.sqrt((this.centerX() - x)*(this.centerX() - x) + (this.centerY() - y)*(this.centerY() - y));
    };

    div.thrust = function thrust(div, dt, dirAngle, thrustDirSign) {
      // Thrust
      var newVelX = div.velX;
      var newVelY = div.velY;

      if (thrustDirSign) {
        newVelX = div.velX + thrustDirSign * dt * div.accel * -Math.sin(dirAngle * degToRad);
        newVelY = div.velY + thrustDirSign * dt * div.accel * Math.cos(dirAngle * degToRad);
      }

      // Clamping & Damping
      var velMag = Math.sqrt(newVelX*newVelX + newVelY*newVelY);

      if (velMag != 0) {
        var dampVelX = window.clamp(velMag * Math.pow(div.velDamp, dt/1000), -div.velMax, div.velMax) * (newVelX/velMag);
        var dampVelY = window.clamp(velMag * Math.pow(div.velDamp, dt/1000), -div.velMax, div.velMax) * (newVelY/velMag);

        div.velX = dampVelX;
        div.velY = dampVelY;
      }
    };

    div.kill = function() {
      document.kill(this);
      if (this.lifeBar) {
        this.lifeBar.parentNode.removeChild(this.lifeBar);
      }
      if (this.minimap) {
        this.minimap.parentNode.removeChild(this.minimap);
      }
      if (div.id == "player") {
        window.restartLevel();
      }

    };

    var BulletList = {
      "Bullet": function() {
        Sound.play('laser');
        var rot = degToRad * this.rotation;
        var vMag = Math.sqrt(this.velX*this.velX + this.velY*this.velY);
        var vDirX = Math.sin(rot);
        var vDirY = -Math.cos(rot);
        return new Game.Entity({
          classes: ['Bullet'],
          x: (-Math.sin(rot) * -this.height/2) + this.x,
          y: (Math.cos(rot) * -this.height/2) + this.y,
          velX: 2 * this.velMax * vDirX,
          velY: 2 * this.velMax * vDirY,
          img: "images/bullet1.png",
          width: 16,
          height: 16,
          ttl: 1500,
          damage: 10,
          owner: this,
          update: function(dt) {
            this.ttl = Math.max(0, this.ttl - dt);
            if(!this.ttl) {
              this.kill();
              return;
            }
            logic.motion.call(this, dt);
          }
        });
      },
      "BulletStrong": function() {
        Sound.play('laser');
        var rot = degToRad * this.rotation;
        var vMag = Math.sqrt(this.velX*this.velX + this.velY*this.velY);
        var vDirX = Math.sin(rot);
        var vDirY = -Math.cos(rot);
        return new Game.Entity({
          classes: ['Bullet'],
          x: (-Math.sin(rot) * -this.height/2) + this.x,
          y: (Math.cos(rot) * -this.height/2) + this.y,
          velX: 2 * this.velMax * vDirX,
          velY: 2 * this.velMax * vDirY,
          img: "images/bullet2.png",
          width: 16,
          height: 16,
          ttl: 1500,
          damage: 20,
          owner: this,
          update: function(dt) {
            this.ttl = Math.max(0, this.ttl - dt);
            if(!this.ttl) {
              this.kill();
              return;
            }
            logic.motion.call(this, dt);
          }
        });
      },
      "Laser": function() {
        var LaserColors = ["Blue", "Green", "Red", "Purple", "Yellow"];
        Sound.play('laser');
        var rot = degToRad * this.rotation;
        var vMag = Math.sqrt(this.velX*this.velX + this.velY*this.velY);
        var vDirX = Math.sin(rot);
        var vDirY = -Math.cos(rot);
        var laserColor = LaserColors[Math.floor(Math.random() * LaserColors.length)];
        return new Game.Entity({
          classes: ['Bullet'],
          x: (-Math.sin(rot) * -this.height/2) + this.x,
          y: (Math.cos(rot) * -this.height/2) + this.y,
          velX: 2 * this.velMax * vDirX,
          velY: 2 * this.velMax * vDirY,
          rotation: this.rotation,
          img: "images/projectiles/laser" + laserColor + ".png",
          width: 4,
          height: 62,
          ttl: 1500,
          damage: 50,
          owner: this,
          faceVelocityDirection: true,
          update: function(dt) {
            this.ttl = Math.max(0, this.ttl - dt);
            if(!this.ttl) {
              this.kill();
              return;
            }
            logic.motion.call(this, dt);
          }
        });
      },
      "EndGameBullet": function() {
        return BulletList["Missile"].bind(this)(1, 20000, 27, 72, "images/projectiles/missileBig.png", "explosion");
      },
      "Missile": function(scaling, damage, w, h, img, hitType, explosion) {
        Sound.play('missile');
        var rot = degToRad * this.rotation;
        var vMag = Math.sqrt(this.velX*this.velX + this.velY*this.velY);
        var vDirX = Math.sin(rot);
        var vDirY = -Math.cos(rot);
        var seekRange = 900;
        return new Game.Entity({
          classes: ['Bullet'],
          x: (-Math.sin(rot) * -this.height/2) + this.x,
          y: (Math.cos(rot) * -this.height/2) + this.y,
          velX: 2 * this.velMax * vDirX,
          velY: 2 * this.velMax * vDirY,
          rotation: this.rotation,
          faceVelocityDirection: true,
          img: img || "images/projectiles/missile.png",
          width: w || 9,
          height: h || 24,
          ttl: 1500,
          damage: damage || 10,
          owner: this,
          scaling: scaling,
          hitType: explosion || "missileHit",
          update: function(dt) {
            this.ttl = Math.max(0, this.ttl - dt);
            if (this.missileLockOnTarget == null ||
              this.missileLockOnTarget.life <= 0 ||
              this.distanceTo(this.missileLockOnTarget.centerX(), this.missileLockOnTarget.centerY()) > seekRange) {
              // Clear target
              this.missileLockOnTarget = null;

              // Find a target
              var possibleTargets = [];
              // Right now this code only works for a player missile seeking a pirate
              window.inDistance(400, this, "Pirate", function(player, entity) {
                possibleTargets.push(entity);
              });
              if (possibleTargets.length != 0) {
                this.missileLockOnTarget = possibleTargets[Math.floor(Math.random()*possibleTargets.length)];
                //console.log("Aquire target: " + this.missileLockOnTarget.id);
              } else {
                this.missileLockOnTarget = null;
              }
            }
            if (this.missileLockOnTarget) {
              this.thrust(this, dt, this.faceAngle(this.missileLockOnTarget.centerX(), this.missileLockOnTarget.centerY()) + 2 * Math.sin(Date.now() / 100), -1);
            } else {
              // No target, drift using a Math.sin based thrust
              if (this.lastX != null && this.lastY != null) {
                this.thrust(this, dt, this.faceAngle(this.lastX, this.lastY) + 20 * Math.sin(Date.now() / 100), 1);
              }
            }
            if(!this.ttl) {
              this.kill();
              return;
            }
            logic.motion.call(this, dt);
          }
        });
      },
    };
    div.fire = function(bulletName) {
      document.spawn(BulletList[bulletName].bind(this)());
    }

    div.style.marginLeft = -div.width/2 + 'px';
    div.style.marginTop = -div.height/2 + 'px';

    if (window.location.search.indexOf('hitbox') > -1) {
      var hitBoxElement = document.createElement('div');
      hitBoxElement.className = 'hitbox';
      hitBoxElement.style.top = (div.height - div.hitBox[1])/2 + 'px';
      hitBoxElement.style.bottom = (div.height - div.hitBox[1])/2 + 'px';
      hitBoxElement.style.left = (div.width - div.hitBox[0])/2 + 'px';
      hitBoxElement.style.right = (div.width - div.hitBox[0])/2 + 'px';
      div.appendChild(hitBoxElement);
    }

    div.render = function render() {
      div.style.left = (div.x - window.Game.Camera.x()) + 'px';
      div.style.top = (div.y - window.Game.Camera.y()) + 'px';
      var transformStr = "";
      transformStr += " rotate("+div.rotation.toFixed(1)+"deg)";

      if (div.spriteFrameX != null || div.spriteFrameY != null) {
        var frameX = div.spriteFrameX || 0;
        var frameY = div.spriteFrameY || 0;
        div.style.backgroundPosition = div.width * frameX + "px " + div.height * frameY + "px";
      }

      if (div.scaling != null) {
        transformStr += " scale("+div.scaling+","+div.scaling+")";
      }
      if (transformStr != "") {
        setTransform(div, transformStr);
      }

      if (div.life != div.lifeMax) {
        // Draw HP bar
        var lifeBarWidth = Math.min(div.width, 256);
        if (div.lifeBar == null) {
          div.lifeBar = document.createElement("div");
          div.lifeBar.className = "lifeBar";
          div.lifeBar.style.height = "8px";
          div.lifeBar.style.marginLeft = -div.width/2 + (div.width-lifeBarWidth)/2 + 'px';
          div.lifeBar.style.marginTop = -div.height/2 + 'px';
          div.parentNode.appendChild(div.lifeBar);
        }
        div.lifeBar.style.left = (div.x - window.Game.Camera.x()) + 'px';
        div.lifeBar.style.top = (div.y - window.Game.Camera.y()) + 'px';
        div.lifeBar.style.width = ((div.life/div.lifeMax) * lifeBarWidth) + "px";
        div.lifeBar.style.backgroundColor = "hsl(" + ((div.life/div.lifeMax)*100) + ",100%,50%)";
      }

      if (div.showOnMinimap && div.scouted == true) {
        if (div.minimap == null) {
          div.minimap = document.createElement("div");
          div.minimap.className = "minimapEntity";
          document.getElementById("minimap").appendChild(div.minimap);
        }
        var bounds = document.getElementsByClassName("Bounds")[0];
        div.minimap.style.left = (div.topLeftX() - bounds.topLeftX()) * 100 / bounds.width + "%";
        div.minimap.style.top = (div.topLeftY() - bounds.topLeftY()) * 100 / bounds.height + "%";
        div.minimap.style.width = Math.max(2, Math.floor(div.width/bounds.width*100)) + "%";
        div.minimap.style.height = Math.max(2, Math.floor(div.height/bounds.height*100)) + "%";
        div.minimap.style.backgroundColor = div.minimapColor;
      }
    };

    if (options.create) {
      options.create.call(div);
    }

    return div;
  };

  var tmp = 0;

  var logic = {
    motion: function(dt) {
      if(this.velX > 0) {
        this.velX = Math.max(0, this.velX - Math.max(0, dt * this.drag * Math.sin(this.rotation * degToRad)));
      } else {
        this.velX = Math.min(0, this.velX + Math.max(0, dt * this.drag * -Math.sin(this.rotation * degToRad)));
      }

      if(this.velY > 0) {
        this.velY = Math.max(0, this.velY - Math.max(0, dt * this.drag * -Math.cos(this.rotation * degToRad)));
      } else {
        this.velY = Math.min(0, this.velY + Math.max(0, dt * this.drag * Math.cos(this.rotation * degToRad)));
      }

      this.lastX = this.x;
      this.lastY = this.y;
      this.x += dt * this.velX;
      this.y += dt * this.velY;

      this.frameTimeRemaining -= dt;
      this.rotation = (this.rotation + this.rotationVel * dt) % 360;

      if (this.frameTimeRemaining < 0) {
        if (this.spriteFrameX != null) {
          this.spriteFrameX = (this.spriteFrameX + 1) % this.options.spriteMaxFrameX;
        }
        if (this.spriteFrameY != null) {
          this.spriteFrameY = (this.spriteFrameY + 1) % this.options.spriteMaxFrameY;
        }
        this.frameTimeRemaining = this.spriteFrameTime;
      }

      if (this.faceVelocityDirection) {
        this.rotation = (180 + this.faceAngle(this.lastX, this.lastY)) % 360;
      }
    },
    wormhole: function(dt) {
      var killedAllPirate = document.getElementsByClassName("Pirate").length == 0;
      if (killedAllPirate) {
        this.minimapColor = "rgb(" + (128 + 128*Math.sin(Date.now() / 180)).toFixed(0) + ",0,0)"
      }
      window.collisionDetection("Player", "Wormhole", function() {
        if (killedAllPirate) {
          var nextLevel = document.getLevel().nextId;
          window.changeLevelOnNextFrame(Game.levels[nextLevel]());
          Sound.play('wormhole');
        }
      });
    },
    weapon: function(dt, bulletType) {
      bulletType = bulletType || this.bulletType
      if(0 == this.weaponCooldown[bulletType]) {
        this.weaponCooldown[bulletType] = this.weaponReloadTime[bulletType];
        this.fire(bulletType);
      }
    },
    idle: function(dt) {
      this.thrust(this, dt, this.faceAngle(this.x, this.y), 0);
    },
    ai: function(dt) {

      var bulletTypes = Object.keys(this.weaponCooldown);
      bulletTypes.forEach(function(bulletType) {
        this.weaponCooldown[bulletType] = Math.max(0, this.weaponCooldown[bulletType] - dt);
      }.bind(this));

      // Seek player
      var player = document.getElementById("player");
      if (player && this.distanceTo(player.centerX(), player.centerY()) < 500) {
        this.seekX = player.centerX();
        this.seekY = player.centerY();
      }

      var self = this;
      window.noCollisionDetection(this, "Bounds", function(pirate) {
        var bounds = document.getElementsByClassName("Bounds")[0];
        self.seekX = bounds.centerX();
        self.seekY = bounds.centerY();
      });

      var idle = true;
      if (this.seekX != null && this.seekY != null) {
        // Aquire player
        var changeToAngle = this.rotation - this.faceAngle(this.seekX, this.seekY);
        if (changeToAngle > 180) {
          changeToAngle = 360 - changeToAngle;
        }
        if (changeToAngle < -180) {
          changeToAngle = changeToAngle + 360;
        }
        if (Math.abs(changeToAngle) > 0.1 * dt) {
          changeToAngle = sign(changeToAngle) * 0.1 * dt;
        }
        if (this.rotationAccel != 0) {
          this.rotation -= changeToAngle % 360;
        }

        if (this.distanceTo(this.seekX, this.seekY) > 200) {
          idle = false;
          this.thrust(this, dt, this.faceAngle(this.seekX, this.seekY), -1);
        }
        if (player && this.distanceTo(player.centerX(), player.centerY()) < 700) {
          logic.weapon.call(this, dt);
        }
      }

      if (idle) {
        // Check if we overlap with another Pirate
        var self = this;
        var otherPirate = null;
        window.collisionDetection("Pirate", "Pirate", function(p1, p2) {
          if (self == p1 && self != p2) {
            otherPirate = p2;
          }
        });
        if (otherPirate != null) {
          idle = false;
          this.thrust(this, dt, otherPirate.faceAngle(this.x, this.y), -1);
        }
        if (idle) {
          this.thrust(this, dt, this.faceAngle(this.x, this.y), 0);
        }
      }
    },
    default: function(dt) {
      logic.motion.call(this, dt);
    },
    player: function(dt) {
      logic.motion.call(this, dt);

      var bulletTypes = Object.keys(this.weaponCooldown);
      bulletTypes.forEach(function(bulletType) {
        this.weaponCooldown[bulletType] = Math.max(0, this.weaponCooldown[bulletType] - dt);
      }.bind(this));

      if(Game.playerKeyStates.fire) {
        // This will check cooldown
        if (this.hasEndGameBullets) {
          logic.weapon.call(this, dt, "EndGameBullet");
        } else {
          logic.weapon.call(this, dt, "Missile");
        }
      }
      if(Game.playerKeyStates.laser) {
        // This will check cooldown
        if (this.hasEndGameBullets) {
          logic.weapon.call(this, dt, "EndGameBullet");
        } else {
          logic.weapon.call(this, dt, "Laser");
        }
      }
      if(Game.playerKeyStates.missile) {
        if (this.hasEndGameBullets) {
          logic.weapon.call(this, dt, "EndGameBullet");
        } else {
          logic.weapon.call(this, dt, "Missile");
        }
      }
    }
  };

  var Game = {
    Entity: Entity,
    Camera: {
      // Fix to the player
      x: function() {
        if (document.getPlayer() == null) {
          return Game.Camera.cameraOldX;
        }
        var offset = document.getLevel().offsetWidth;
        var cameraNewX = document.getPlayer().x - offset / 2;
        if (Game.Camera.cameraOldX != null && Math.abs(Game.Camera.cameraOldX - cameraNewX) > 50) {
          cameraNewX = Game.Camera.cameraOldX - 10 * sign(Game.Camera.cameraOldX - cameraNewX);
        }
        Game.Camera.cameraOldX = cameraNewX;
        return cameraNewX;
      },
      y: function() {
        if (document.getPlayer() == null) {
          return Game.Camera.cameraOldY;
        }
        var offset = document.getLevel().offsetHeight;
        var cameraNewY = document.getPlayer().y - offset / 2;
        if (Game.Camera.cameraOldY != null && Math.abs(Game.Camera.cameraOldY - cameraNewY) > 50) {
          cameraNewY = Game.Camera.cameraOldY - 10 * sign(Game.Camera.cameraOldY - cameraNewY);
        }
        Game.Camera.cameraOldY = cameraNewY;
        return cameraNewY;
      },
    },
    levels: {},
    logic: logic
  };

  window.Game = Game;

}());

