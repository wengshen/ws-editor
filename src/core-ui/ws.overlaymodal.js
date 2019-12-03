

// @format

/** Turn a DOM node into an overlay "popup"
 *
 *  @example
 *  //Create an overlay with hello world in it
 *  ws.OverlayModal(ws.dom.cr('h1', '', 'Hello World!'));
 *
 *  @constructor
 *
 *  @emits Show - when the overlay is shown
 *  @emits Hide - when the overlay is hidden
 *
 *  @param {domnode} contents - the DOM node to wrap.
 *  @param {object} attributes - properties for the modal
 *    > width {number} - the width of the modal
 *    > height {number} - the height of the modal
 *    > minWidth {number} - the minimum width of the modal
 *    > minHeight {number} - the minimum height of the modal
 *    > showOnInit {boolean} - if true, the modal will be shown after creation
 *    > zIndex {number} - the Z-Index to use for the modal
 *  @return {object} - A new instance of OverlayModal
 */
ws.OverlayModal = function(contents, attributes) {
  var container = ws.dom.cr('div', 'ws-overlay-modal '),
    events = ws.events(),
    properties = ws.merge(
      {
        width: 200,
        height: 200,
        minWidth: 10,
        minHeight: 10,
        showOnInit: true,
        zIndex: 10000,
        showCloseIcon: false,
        cancelButton: false
      },
      attributes
    ),
    hideDimmer = false,
    visible = false;

    if (properties.class) {
      container.classList += properties.class;
    }

  ///////////////////////////////////////////////////////////////////////////


  /** resize the modal
     *  @memberof ws.OverlayModal
     */

  function resize(width, height) {
    properties.minWidth = width;
    properties.minHeight = height;
  }
  /** Show the modal
     *  @memberof ws.OverlayModal
     */
  function show() {
    if (visible) return;
    ws.dom.style(container, {
      width:
        properties.width +
        (properties.width.toString().indexOf('%') > 0 ? '' : 'px'),
      height:
        properties.height +
        (properties.height.toString().indexOf('%') > 0 ? '' : 'px'),
      opacity: 1,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      'pointer-events': 'auto',
      'min-width': properties.minWidth + 'px',
      'min-height': properties.minHeight + 'px',
      'z-index': properties.zIndex
    });

    ws.dom.style(document.body, {
      'overflow-x': 'hidden',
      'overflow-y': 'hidden'
    });

    if (properties.showCloseIcon) {
      const icon = ws.dom.cr('span', 'ws-overlaymodal-close', '<i class="fa fa-times" aria-hidden="true"></i>');
      ws.dom.on(icon, 'click', function() {
        hide();
      });
      ws.dom.ap(container, icon);
    }

    hideDimmer = ws.showDimmer(
      hide,
      true,
      false,
      properties.zIndex - 10000
    );

    window.setTimeout(function() {
      events.emit('Show');
    }, 300);

    visible = true;
  }

  /** Hide the modal
     *  @memberof ws.OverlayModal
     *  @param suppress {boolean} - suppress the hide event emitting
     */
  function hide(suppress) {
    if (!visible) return;

    ws.dom.style(container, {
      width: '0px',
      height: '0px',
      opacity: 0,
      left: '-20000px',
      'pointer-events': 'none'
    });

    ws.dom.style(document.body, {
      'overflow-x': '',
      'overflow-y': ''
    });

    if (ws.isFn(hideDimmer)) {
      hideDimmer();
    }

    visible = false;

    if (!suppress) {
      events.emit('Hide');
    }
  }

  ///////////////////////////////////////////////////////////////////////////

  ws.ready(function() {
    ws.dom.ap(document.body, container);
  });

  if (contents) {
    // if (ws.isStr(contents)) {
    //    contents = ws.dom.cr('div', '', contents);
    // }
    // ws.dom.ap(container,
    //    contents
    // );
  }

  hide(true);

  ///////////////////////////////////////////////////////////////////////////

  //Public interface
  return {
    on: events.on,
    show: show,
    hide: hide,
    resize: resize,
    /** The container DOM node
         *  @memberof ws.OverlayModal
         */
    body: container
  };
};
