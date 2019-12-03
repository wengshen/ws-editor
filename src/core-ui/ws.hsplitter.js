

// @format

/** Horizontal splitter
 *
 *  Splits a view into two horizontal cells
 *
 *  @example
 *  var splitter = ws.HSplitter(document.body);
 *  ws.dom.ap(splitter.left, ws.dom.cr('div', '', 'Left!'));
 *  ws.dom.ap(splitter.right, ws.dom.cr('div', '', 'Right!'));
 *
 *  @constructor
 *  @param parent {domnode} - the parent to attach to
 *  @param attributes {object} - the settings for the splitter
 *    > leftWidth {number} - the width in percent of the left cell
 *    > noOverflow {bool} - whether or not overflowing is allowed
 *    > leftClasses {string} - additional css classes to use for the left body
 *    > rightClasses {string} - additional css classes to use for the right body
 *    > allowResize {boolean} - set to true to enable user-resizing
 *    > leftMax {number} - the max width of the left panel
 *    > rightMax {number} - the max width of the right panel
 */
ws.HSplitter = function(parent, attributes) {
  var properties = ws.merge(
      {
        leftWidth: 40,
        noOverflow: false,
        leftClasses: '',
        rightClasses: '',
        allowResize: false,
        responsive: false,
        leftMax: false,
        rightMax: false
      },
      attributes
    ),
    container = ws.dom.cr('div', 'ws-hsplitter'),
    left = ws.dom.cr(
      'div',
      'ws-scrollbar panel left ' + properties.leftClasses
    ),
    right = ws.dom.cr(
      'div',
      'ws-scrollbar panel right ' + properties.rightClasses
    ),
    leftBody = ws.dom.cr(
      'div',
      'ws-scrollbar ws-hsplitter-body ' + properties.leftClasses
    ),
    rightBody = ws.dom.cr(
      'div',
      'ws-scrollbar ws-hsplitter-body ' + properties.rightClasses
    ),
    resizeBar = ws.dom.cr('div', 'ws-hsplitter-resize-bar'),
    mover;

  if (properties.responsive) {
    left.className += ' ws-hsplitter-body-responsive';
  }

  ///////////////////////////////////////////////////////////////////////////

  function updateSizeFromMover(x) {
    var psize;

    if (properties.allowResize && ws.dom.isVisible(right)) {
      psize = ws.dom.size(container);
      x = x || ws.dom.pos(resizeBar).x;

      ws.dom.style(left, {
        width: x + 'px'
      });

      ws.dom.style(right, {
        width: psize.w - x + 'px'
      });

      ws.dom.style(resizeBar, {
        display: ''
      });
    }
  }

  /** Force a resize of the splitter
     *  @memberof ws.HSplitter
     *  @param w {number} - the width of the splitter (will use parent if null)
     *  @param h {number} - the height of the splitter (will use parent if null)
     */
  function resize(w, h) {
    var s = ws.dom.size(parent),
      st,
      ps;

    //Check if the right side is visible
    if (!ws.dom.isVisible(right)) {
      ws.dom.style(left, {
        width: '100%'
      });

      ws.dom.style(resizeBar, {
        display: 'none'
      });
    } else {
      resetSize();
    }

    if (properties.responsive) {
      st = window.getComputedStyle(left);
      if (st.float === 'none') {
        ws.dom.style(right, {
          width: '100%'
        });

        ws.dom.style(resizeBar, {
          display: 'none'
        });
      } else {
        resetSize();
      }
    }

    ws.dom.style([left, right, container, resizeBar], {
      height: (h || s.h) + 'px'
    });

    if (properties.rightMax) {
      ws.dom.style(right, {
        'max-width': properties.rightMax + 'px'
      });
    }

    if (properties.leftMax) {
      ws.dom.style(left, {
        'max-width': properties.leftMax + 'px'
      });
    }

    //If we're at right max, we need to resize the left panel
    ps = ws.dom.size(left);
    if (ps.w === properties.leftMax) {
      ws.dom.style(right, {
        width: s.w - properties.leftMax - 1 + 'px'
      });
    }

    updateSizeFromMover();
  }

  function resetSize() {
    ws.dom.style(left, {
      width: properties.leftWidth + '%'
    });

    ws.dom.style(right, {
      width: (properties.rightWidth ? properties.rightWidth : 100 - properties.leftWidth) + '%'
    });
  }

  ///////////////////////////////////////////////////////////////////////////

  parent = ws.dom.get(parent);

  ws.dom.ap(
    ws.dom.get(parent),
    ws.dom.ap(
      container,
      ws.dom.ap(left, leftBody),
      ws.dom.ap(right, rightBody)
    )
  );

  resetSize();

  if (properties.noOverflow) {
    ws.dom.style([container, left, right], {
      'overflow-y': 'hidden'
    });
  }

  if (properties.allowResize) {
    ws.dom.ap(container, resizeBar);

    ws.dom.style(resizeBar, {
      left: properties.leftWidth + '%'
    });

    mover = ws.Movable(resizeBar, 'x').on('Moving', function(x) {
      updateSizeFromMover(x);
    });
  }

  //resize();

  ///////////////////////////////////////////////////////////////////////////

  // Public interface
  return {
    resize: resize,
    /** The dom node for the left cell
         *  @memberof ws.HSplitter
         *  @type {domnode}
         */
    left: leftBody,
    /** The dom node for the right cell
         *  @memberof ws.HSplitter
         *  @type {domnode}
         */
    right: rightBody
  };
};
