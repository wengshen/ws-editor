

// @format

/** Event dispatcher object
 *  Constructs an instance of an event dispatcher when called.
 *  @constructor
 *  @example
 *  var events = ws.events();
 *  events.on('foobar', function () {console.log('Hello world!')});
 *  events.emit('foobar');
 */
ws.events = function() {
  var callbacks = {},
    listenerCounter = 0;

  /** Listen to an event
      * @memberof ws.events
      * @param event {string} - the event to listen for
      * @param callback {function} - the function to call when the event is emitted
      * @param context {anything} - the calling context (`this` reference) for the callback
      * @returns {function} - function that can be called to unbind the listener
      */
  function on(event, callback, context) {
    var id = ++listenerCounter;

    if (ws.isArr(callback)) {
      return callback.forEach(function(cb) {
        on(event, cb, context);
      });
    }

    callbacks[event] = callbacks[event] || [];

    callbacks[event].push({
      id: id,
      fn: callback,
      context: context
    });

    return function() {
      callbacks[event] = callbacks[event].filter(function(e) {
        return e.id !== id;
      });
    };
  }

  return {
    on: on,

    /** Emit an event
         * Note that the function accepts a variable amount of arguments. Any arguments after the event name will be passed on to any event listeners attached to the event being emitted.
         * @memberof ws.events
         * @param event {string} - the event to emit
         * @return {number} - The number of events dispatched
         */
    emit: function(event) {
      var args = Array.prototype.slice.call(arguments);
      args.splice(0, 1);

      if (typeof callbacks[event] !== 'undefined') {
        callbacks[event].forEach(function(event) {
          if (ws.isFn(event.fn)) {
            event.fn.apply(event.context, args);
          }
        });

        return callbacks[event].length;
      }
      return 0;
    }
  };
};
