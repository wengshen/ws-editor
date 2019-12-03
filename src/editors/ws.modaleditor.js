

// @format

/** A modal editor
 * The modal editor connects to a "summoner", which is the DOM node that should
 * spawn the editor. This arg is however optional, and if not present,
 * `show()` should be called instead when wanting to display it.
 *
 * The contained editor can either be a full editor, or a simple editor.
 *
 * @example
 * ws.ModalEditor('icon', {allowDone: true}, function (html) {
 *    doSomethingWithTheExportedHTML(html);
 * });
 *
 * @constructor
 *
 * @param summoner {domnode} - the node which spawns the editor
 * @param attributes {object} - properties. Note that this object is also passed to the editor constructor.
 *   > type {string} - either `full` or `simple`.
 *   > allowDone {bool} - if set to true (default is false) a "Close and use" button will appear on the top bar
 * @param fn {function} - function to call when done editing, argument is an instance of ws.ChartPreview
 *
 */
ws.ModalEditor = function(summoner, attributes, fn) {
  var properties = ws.merge(
      {
        type: 'full',
        allowDone: false
      },
      attributes
    ),
    modal = ws.OverlayModal(false, {
      width: '95%',
      height: '95%',
      showOnInit: false
    }),
    editor =
      properties.type === 'full'
        ? ws.Editor(modal.body, attributes)
        : ws.SimpleEditor(modal.body, attributes),
    //We don't always know the summoner at create time..
    sumFn = false,
    doneEditing = ws.dom.cr(
      'button',
      'ws-done-button',
      'Close &amp; Use'
    );

  ///////////////////////////////////////////////////////////////////////////

  /** Attach to a new summoner
     *  @memberof ws.ModalEditor
     *  @param nn {domnode} - the new node to attach to
     */
  function attachToSummoner(nn) {
    nn = nn || summoner;

    if (!nn) {
      return;
    }

    if (ws.isFn(sumFn)) {
      sumFn();
    }

    //Show the modal when clicking the summoner
    sumFn = ws.dom.on(ws.dom.get(nn), 'click', function(){
      modal.show();
      editor.resize();
    });
  }

  function doDone() {
    if (ws.isFn(fn)) {
      fn(editor.chart);
    }
    modal.hide();
  }

  //Resize the editor when showing the modal
  modal.on('Show', editor.resize);

  ws.dom.on(doneEditing, 'click', doDone);

  attachToSummoner(summoner);

  if (properties.allowDone) {
    ws.dom.ap(editor.toolbar.center, doneEditing);
  }

  editor.on('Done', doDone);
  editor.resize();

  ///////////////////////////////////////////////////////////////////////////

  return {
    editor: editor,
    show: modal.show,
    hide: modal.hide,
    on: editor.on,
    resize: editor.resize,
    attachToSummoner: attachToSummoner
  };
};
