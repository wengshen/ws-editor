

// @format

/** Vertical splitter
 *  Splits a view into two vertical cells
 *
 *  @example
 *  var splitter = ws.VSplitter(document.body);
 *  ws.dom.ap(splitter.top, ws.dom.cr('div', '', 'Top!'));
 *  ws.dom.ap(splitter.bottom, ws.dom.cr('div', '', 'Bottom!'));
 *
 *  @constructor
 *  @param parent {domnode} - the parent to attach to
 *  @param attributes {object} - the settings for the splitter
 *    > topHeight {number} - the height in percent of the left cell. Alternatively, use '123px' to set a capped size.
 *    > noOverflow {bool} - whether or not overflowing is allowed
 */
ws.VSplitter = function(parent, attributes) {
  var properties = ws.merge(
      {
        topHeight: 40,
        noOverflow: false
      },
      attributes
    ),
    container = ws.dom.cr('div', 'ws-vsplitter'),
    top = ws.dom.cr('div', 'panel top ws-scrollbar'),
    bottom = ws.dom.cr('div', 'panel bottom ws-scrollbar'),
    topBody = ws.dom.cr('div', 'ws-vsplitter-body ws-scrollbar'),
    bottomBody = ws.dom.cr('div', 'ws-vsplitter-body ws-scrollbar');

  ///////////////////////////////////////////////////////////////////////////

  /** Force a resize of the splitter
     *  @memberof ws.VSplitter
     *  @param w {number} - the width of the splitter (will use parent if null)
     *  @param h {number} - the height of the splitter (will use parent if null)
     */
  function resize(w, h) {
    var s = ws.dom.size(parent);
    
    ws.dom.style(container, {
      height: '100%'
    });

    if (!w && !h) {
      

      ws.dom.style(top, {
        height: (typeof properties.topHeight === 'string' ? properties.topHeight : properties.topHeight + '%' )
      })
      if (bottom) {
        ws.dom.style(bottom, {
          width: '100%',
          height:  (typeof properties.topHeight === 'string' ? 'calc(100% - ' + properties.topHeight + ')' : 100 - properties.topHeight + '%' )
        });
      }
      return;
    }
    ws.dom.style(container, {
      width: (w || s.w) + 'px',
      height: ((h || s.h)) + 'px'
    });

    if (properties.topHeight.toString().indexOf('px') > 0) {
      ws.dom.style(top, {
        height: properties.topHeight
      });

      ws.dom.style(bottom, {
        height: (h || s.h) - parseInt(properties.topHeight, 10) + 'px'
      });
    } else {
      ws.dom.style(top, {
        height: properties.topHeight + '%'
      });

      ws.dom.style(bottom, {
        height: 100 - properties.topHeight + '%'
      });
    }
    //ws.dom.style([top, bottom, container], {
    //    width: (w || s.w) + 'px'
    //});
  }

  ///////////////////////////////////////////////////////////////////////////

  ws.dom.ap(
    ws.dom.get(parent),
    ws.dom.ap(
      container,
      ws.dom.ap(top, topBody),
      ws.dom.ap(bottom, bottomBody)
    )
  );

  if (properties.noOverflow) {
    ws.dom.style([container, top, bottom], {
      'overflow-y': 'hidden'
    });
  }

  parent = ws.dom.get(parent);

  ///////////////////////////////////////////////////////////////////////////

  // Public interface
  return {
    resize: resize,
    /** The dom node for the top cell
         *  @memberof ws.VSplitter
         *  @type {domnode}
         */
    top: topBody,
    /** The dom node for the bottom cell
         *  @memberof ws.VSplitter
         *  @type {domnode}
         */
    bottom: bottomBody
  };
};
