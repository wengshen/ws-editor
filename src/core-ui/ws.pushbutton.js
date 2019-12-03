

// @format

/** A simple toggle button component
 *
 *  @example
 *  //Create a push button with the gear icon attached
 *  ws.PushButton(document.body, 'gear', false).on('Toggle', function (state) {
 *      alert('Push button is now ' + state);
 *  });
 *
 *  @constructor
 *
 *  @emits Toggle {boolean} - when the state changes
 *
 *  @param parent {domnode} (optional) - the parent to attach the button to
 *  @param icon {string} - the button icon
 *  @param state {boolean} - the initial state of the button
 */
ws.PushButton = function(parent, icon, state) {
  var button = ws.dom.cr('span', 'ws-pushbutton fa fa-' + icon),
    events = ws.events();

  function updateCSS() {
    if (state) {
      button.className += ' ws-pushbutton-active';
    } else {
      button.className = button.className.replace(
        ' ws-pushbutton-active',
        ''
      );
    }
  }

  /** Set the current state
    *  @memberof ws.PushButton
    *  @param flag {boolean} - the new state
    */
  function set(flag) {
    state = flag;
    updateCSS();
  }

  ws.dom.on(button, 'click', function() {
    state = !state;
    updateCSS();
    events.emit('Toggle', state);
  });

  if (!ws.isNull(parent) && parent !== false) {
    ws.dom.ap(parent, button);
  }

  updateCSS();

  return {
    set: set,
    /** The button
         * @memberof ws.PushButton
         * @type {domnode}
         */
    button: button,
    on: events.on
  };
};
