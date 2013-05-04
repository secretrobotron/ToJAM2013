(function() {

  var div = document.createElement('div');
  div.classList.add('Level');
  div.id = 'level1';

  [
    new Game.Entity({
      classes: ['Player'],
      id: 'player',
      x: 100,
      y: 100,
      width: 288 / 4,
      height: 72,
      img: "images/ship1.png",
      spriteFrameTime: 100, //ms
      spriteFrameX: 0,
      spriteMaxFrameX: 4,
    })
  , new Game.Entity({
      classes: ['Pirate'],
      x: 200,
      y: 200,
      width: 288 / 4,
      height: 72,
      img: "images/ship1.png",
      spriteFrameTime: 100, //ms
      spriteFrameX: 0,
      spriteMaxFrameX: 4,
    })
  ].forEach(function(entity) {
    div.appendChild(entity);
  });

  Game.levels[div.id] = div;

})();