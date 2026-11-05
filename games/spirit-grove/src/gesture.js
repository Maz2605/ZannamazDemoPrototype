/** A consistent left/right swipe, independent of where the hand starts. */
(function (G) {
  'use strict';
  const LIMIT = Math.PI / 2;
  function start(_point, client) {
    return {origin:{...client},angle:0,distance:0,dx:0,dy:0};
  }
  function update(drag, _point, client) {
    drag.dx = client.x-drag.origin.x;
    drag.dy = client.y-drag.origin.y;
    drag.distance = Math.hypot(drag.dx,drag.dy);
    const horizontal = Math.abs(drag.dx)>=Math.abs(drag.dy)*1.2;
    // Follow the foreground animals: positive rotation moves them left.
    drag.angle = horizontal && Math.abs(drag.dx)>12 ? -Math.sign(drag.dx)*Math.min(LIMIT,(Math.abs(drag.dx)-12)*LIMIT/170) : 0;
    return drag.angle;
  }
  function direction(drag) {
    return Math.abs(drag.dx)>=24 && Math.abs(drag.dx)>=Math.abs(drag.dy)*1.2 ? -Math.sign(drag.dx) : 0;
  }
  G.Gesture = {start,update,direction};
})(window.SpiritGrove);
