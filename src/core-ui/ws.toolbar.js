

// @format

/** A standard toolbar.
 *
 *  @example
 *  var toolbar = ws.Toolbar('my-node', {
 *    additionalCSS: ['cool-toolbar']
 *  });
 *
 *  @constructor
 *  @param parent {domnode} - the node to attach the toolbar to
 *  @param attributes {object} - toolbar settings
 *    > additionalCSS {array} - array of additional css classes to add to the toolbar
 */
ws.Toolbar = function(parent, attributes) {
  var properties = ws.merge(
      {
        additionalCSS: []
      },
      attributes
    ),
    container = ws.dom.cr(
      'div',
      'ws-toolbar ' + properties.additionalCSS.join(' ')
    ),
    left = ws.dom.cr('div', 'ws-toolbar-left'),
    right = ws.dom.cr('div', 'ws-toolbar-right'),
    center = ws.dom.cr('div', 'ws-toolbar-center'),
    iconsRight = ws.dom.cr('div', 'icons');

  ///////////////////////////////////////////////////////////////////////////

  /** Add an icon to the toolbar
     *  @memberof ws.Toolbar
     *  @param icon {object} - an object containing the icon settings.
     *    > css {array} - the additional css class(s) to use
     *    > click {function} - the function to call when the icon is clicked
     */
  function addIcon(icon, where) {
    var i = ws.dom.cr('div', 'icon ws-icon fa ' + (icon.css || ''));

    ws.dom.on(i, 'click', function(e) {
      if (ws.isFn(icon.click)) {
        icon.click(e);
      }
    });

    i.title = icon.tooltip || icon.title;

    ws.dom.ap(where === 'left' ? left : right, i);
  }

  /** Add a button to the toolbar
     *  @memberof ws.Toolbar
     *  @param icon {object} - an object containing the icon settings.
     *    > css {array} - the additional css class(s) to use
     *    > click {function} - the function to call when the icon is clicked
     */
  function addButton(icon, where) {
    var i = ws.dom.cr(
      'div',
      'ws-ok-button ws-toolbar-button',
      icon.title || ''
    );

    ws.dom.on(i, 'click', function(e) {
      if (ws.isFn(icon.click)) {
        icon.click(e);
      }
    });

    i.title = icon.tooltip;

    ws.dom.ap(where === 'left' ? left : right, i);
  }

  function addSeparator(where) {
    ws.dom.ap(
      where === 'left' ? left : right,
      ws.dom.cr('span', 'separator')
    );
  }

  ///////////////////////////////////////////////////////////////////////////

  ws.dom.ap(parent, ws.dom.ap(container, left, center, right));

  ///////////////////////////////////////////////////////////////////////////

  return {
    /** The toolbar container
         *  @type {domnode}
         *  @memberof ws.Toolbar
         */
    container: container,
    addIcon: addIcon,
    addButton: addButton,
    addSeparator: addSeparator,
    /** The left part of the toolbar
         *  @type {domnode}
         *  @memberof ws.Toolbar
         */
    left: left,
    /** The center part of the toolbar
         *  @type {domnode}
         *  @memberof ws.Toolbar
         */
    center: center,
    /** The right part of the toolbar
         *  @type {domnode}
         *  @memberof ws.Toolbar
         */
    right: right
  };
};
