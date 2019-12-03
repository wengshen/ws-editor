

// @format

/** Make a node movable
 *  @constructor
 *
 *  @emits StartMove - when starting to move
 *  @emits Moving - when moving
 *  @emits EndMove - when stopping to move
 *
 *  @param target {domnode} - the node to make movable
 *  @param constrain {string} - constrain moving: `XY`, `Y`, or `X`
 */
ws.Movable = function(
  target,
  constrain,
  constrainParent,
  parentNode,
  min,
  doOffset
) {
  var events = ws.events(),
    moving = false;

  constrain = (constrain || 'XY').toUpperCase();
  target = ws.dom.get(target);

  if (target) {
    ws.dom.on(target, ['mousedown', 'touchstart'], function(e) {
      //   if (moving) return;
      
      moving = true;
      var cp = ws.dom.pos(target),
        ps = ws.dom.size(parentNode || target.parentNode),
        ns = ws.dom.size(target),
        x = cp.x,
        y = cp.y,
        offsetX = 0,
        offsetY = 0,
        mover = ws.dom.on(
          document.body,
          ['mousemove', 'touchmove'],
          function(moveE) {
            if (constrain === 'X' || constrain === 'XY') {
              x =
                cp.x + ((moveE.clientX || moveE.touches[0].clientX) - offsetX);
                
              if (constrainParent) {
                if (x < 0) x = 0;
                if (x > ps.w - ns.w) x = ps.w - ns.w;
              }
            }
            if (constrain === 'Y' || constrain === 'XY') {
              y =
                cp.y + ((moveE.clientY || moveE.touches[0].clientY) - offsetY);

              if (constrainParent) {
                if (y < 0) y = 0;
                if (y > ps.h - ns.h) y = ps.h - ns.h;
              }
            }

            if (min && x < min.x) {
              x = min.x;
            }
            if (min && y < min.y) {
              y = min.y;
            }

            ws.dom.style(target, {
              left: x - (doOffset ? ns.w : 0) + 'px',
              top: y + 'px'
            });

            events.emit('Moving', x, y);

            moveE.cancelBubble = true;
            moveE.preventDefault();
            moveE.stopPropagation();
            moveE.stopImmediatePropagation();
            return false;
          }
        ),
        upper = ws.dom.on(document.body, ['mouseup', 'touchend'], function(
          upE
        ) {
          //Detach the document listeners
          upper();
          mover();
          moving = false;
          document.body.className = document.body.className.replace(
            ' ws-nosel',
            ''
          );
          events.emit('EndMove', x, y);

          upE.cancelBubble = true;
          upE.preventDefault();
          upE.stopPropagation();
          upE.stopImmediatePropagation();
          return false;
        });

      document.body.className += ' ws-nosel';
      offsetX = e.clientX || e.touches[0].clientX;
      offsetY = e.clientY || e.touches[0].clientY;
      events.emit('StartMove', cp.x, cp.y);

      e.cancelBubble = true;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    });
  }
  
  ////////////////////////////////////////////////////////////////////////////

  return {
    on: events.on
  };
};
