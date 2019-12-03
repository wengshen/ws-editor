

// @format

/** Slider widget
 *  @constructor
 *
 *  @emits Change - when the value changes
 *
 *  @param parent {domnode} - the parent of the slider
 *  @param attributes {object} - the slider properties
 *    > max {number} - the max value
 *    > min {number} - the min value
 *    > step {number} - the step size
 *    > resetTo {anything} - value to reset to
 */
ws.Slider = function(parent, attributes) {
  var properties = ws.merge(
      {
        max: 100,
        min: 1,
        step: 1,
        resetTo: 0,
        value: 0
      },
      attributes
    ),
    events = ws.events(),
    value = properties.value || properties.resetTo,
    container = ws.dom.cr('div', 'ws-slider'),
    indicator = ws.dom.cr('div', 'ws-slider-indicator'),
    textIndicator = ws.dom.cr('div', 'ws-slider-text-indicator'),
    sliderBackground = ws.dom.cr('div', 'ws-slider-background'),
    resetIcon = ws.dom.cr('div', 'ws-slider-reset fa fa-undo'),

    numberInput = ws.dom.cr('input', 'ws-slider-input'),
    mover = ws.Movable(indicator, 'x', true, sliderBackground);
    
    numberInput.type = "number";
    numberInput.value = value;
    numberInput.max = properties.max;
    numberInput.min = 0;
  ////////////////////////////////////////////////////////////////////////////

  function updateText() {
    textIndicator.innerHTML = value;

    if (value === 'null' || value === null) {
      textIndicator.innerHTML = 'auto';
    }
    if (value === 'undefined' || typeof value === 'undefined') {
      textIndicator.innerHTML = 'auto';
    }
  }

  // Calculate the indicator X
  function calcIndicator() {
    var x = 0,
      s = ws.dom.size(sliderBackground),
      ms = ws.dom.size(indicator);

    if (!ws.isNum(value) || !value) {
      x = 0;
    } else {
      x =
        (value - properties.min) /
        (properties.max - properties.min) *
        (s.w - ms.w);
    }

    ws.dom.style(indicator, {
      left: x + 'px'
    });
  }

  //Waits until the slider is in the dom
  function tryUpdateIndicators() {
    updateText();
    if (container.parentNode) {
      calcIndicator();
    } else {
      window.setTimeout(tryUpdateIndicators, 10);
    }
  }

  /** Set the value
     *  @memberof ws.Slider
     *  @param newValue {number} - the new value
     */
  function set(newValue) {
    value = ws.clamp(properties.min, properties.max, newValue);
    textIndicator.innerHTML = value;
    calcIndicator();
  }

  mover.on('Moving', function(x) {
    var s = ws.dom.size(sliderBackground),
      ms = ws.dom.size(indicator);

    //Set the value based on the new X
    value =
      properties.min +
      Math.round(x / (s.w - ms.w) * (properties.max - properties.min));

    numberInput.value = value;
    textIndicator.innerHTML = value;
    if (!ws.onPhone()) {
      events.emit('Change', value);
    }
  });

  ws.dom.on(numberInput, 'keyup', function(e) {
    
    if (e.target.value && !isNaN(e.target.value)) {
      if (parseInt(e.target.value) > properties.max) {
        value = properties.max;
      } else value = parseInt(e.target.value);

      textIndicator.innerHTML = value;
      calcIndicator();  
      if (!ws.onPhone()) {
        events.emit('Change', value);
      }
    }

  });

  mover.on('StartMove', function() {
    if (ws.onPhone()) {
      textIndicator.className =
        'ws-slider-text-indicator ws-slider-text-indicator-popup';
    }
  });

  mover.on('EndMove', function() {
    if (ws.onPhone()) {
      textIndicator.className = 'ws-slider-text-indicator';
      //We're not emitting changes until done on mobile
      events.emit('Change', value);
    }
  });

  ////////////////////////////////////////////////////////////////////////////

  ws.dom.on(resetIcon, 'mouseover', function(e) {
    //  ws.Tooltip(e.clientX, e.clientY, 'Reset to initial value');
  });

  ws.dom.on(resetIcon, 'click', function() {
    value = properties.resetTo;
    calcIndicator();

    if (value === 'null') {
      value = null;
    }
    if (value === 'undefined') {
      value = undefined;
    }

    updateText();
    events.emit('Change', value);
  });

  if (parent) {
    parent = ws.dom.get(parent);
    ws.dom.ap(parent, container);
  }

  ws.dom.ap(
    container,
    sliderBackground,
    numberInput,
    resetIcon,
    ws.dom.ap(indicator, textIndicator)
  );

  tryUpdateIndicators();

  // Public interface
  return {
    on: events.on,
    set: set,
    container: container
  };
};
