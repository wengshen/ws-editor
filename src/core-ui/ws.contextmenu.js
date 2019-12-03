

// @format

/** A context menu component
 *  Does a typicall right-click menu.
 *  Note that each instance get their own DOM node in the document body.
 *
 *  @example
 *  var ctx = ws.ContextMenu([
 *     {
 *         title: "Hello World",
 *         click: function (e) {
 *             alert('hello world!');
 *         }
 *     }
 *  ]);
 *
 *  @constructor
 *  @param stuff {object} - things to add (optional)
 *      > title {string} - the title of the entry
 *      > click {function} - function to call when selecting the item
 */
ws.ContextMenu = function(stuff) {
  var container = ws.dom.cr(
      'div',
      'ws-ctx-container-common ws-ctx-container'
    ),
    closeBtn = ws.dom.cr('div', 'ws-ctx-close-button', 'Close'),
    visible = false,
    dimHide = false;

  ///////////////////////////////////////////////////////////////////////////

  /** Add an entry to the menu
     *  @memberof ws.ContextMenu
     *  @param entry {object} - the definition of the entry to add
     *    > title {string} - the title of the entry
     *    > click {function} - the function to call when clicking the item
     */
  function addEntry(entry) {
    var item = ws.dom.cr(
        'div',
        'ws-ctx-item ws-ctx-item-responsive',
        entry.title
      ),
      right = ws.dom.cr('div', 'ws-ctx-child-icon fa fa-angle-right'),
      childCtx;

    if (entry === '-') {
      return ws.dom.ap(container, ws.dom.cr('div', 'ws-ctx-sep'));
    }

    ws.dom.on(item, 'click', function() {
      if (ws.isFn(entry.click)) {
        entry.click();
      }

      hide();
    });

    if (entry.selected) {
      item.className += ' ws-ctx-item-selected';
    }

    if (!ws.isNull(entry.children)) {
      childCtx = ws.ContextMenu(entry.children);

      ws.dom.on(item, 'mouseenter', function(e) {
        childCtx.show(e.clientX, e.clientY);
      });
    }

    ws.dom.ap(
      container,
      ws.dom.ap(
        item,
        entry.icon
          ? ws.dom.cr(
              'div',
              'ctx-child-licon ws-ctx-child-licon-responsive fa fa-' +
                entry.icon
            )
          : false,
        entry.children ? right : false
      )
    );
  }

  /** Show the menu
     *  @memberof ws.ContextMenu
     *  @param x {number} - the x position
     *  @param y {number} - the y position
     */
  function show(x, y, noDimmer) {
    var psize = ws.dom.size(document.body),
      size = ws.dom.size(container);

    if (!noDimmer && visible) return;

    if (x > psize.w - size.w - 20) {
      x = psize.w - size.w - 20;
    }

    if (y > psize.h - size.h - 20) {
      y = psize.h - size.h - 20;
    }

    ws.dom.style(container, {
      'pointer-events': 'auto',
      opacity: 1,
      left: x + 'px',
      top: y + 'px'
    });

    visible = true;
    if (!noDimmer) dimHide = ws.showDimmer(hide, true, true, 10);
  }

  /** Hide the menu
     *  @memberof ws.ContextMenu
     */
  function hide() {
    if (!visible) return;

    ws.dom.style(container, {
      left: '-2000px',
      'pointer-events': 'none',
      opacity: 0
    });

    if (ws.isFn(dimHide)) {
      dimHide();
    }

    visible = false;
  }

  /** Build a menu
     *  @memberof ws.ContextMenu
     *  @param def {array<object>} - an array of entries
     */
  function build(def) {
    container.innerHTML = '';
    ws.dom.ap(container, closeBtn);

    if (ws.isArr(def)) {
      return def.forEach(addEntry);
    }

    Object.keys(def).forEach(function(key) {
      var entry = def[key];
      addEntry(ws.merge({ title: key }, entry));
    });
  }

  ///////////////////////////////////////////////////////////////////////////

  if (stuff) {
    build(stuff);
  }

  ws.dom.on(closeBtn, 'click', hide);

  ws.ready(function() {
    ws.dom.ap(document.body, container);
  });

  ///////////////////////////////////////////////////////////////////////////

  return {
    addEntry: addEntry,
    show: show,
    hide: hide,
    build: build
  };
};
