

// @format

/** A wizard-type stepper
 *  This is sort of like a tab control, but with a logical
 *  x -> y flow.
 *
 *  @emits Step - when going back/forth
 *  @emits AddStep - when a new step is added
 *
 *  @constructor
 *  @param bodyParent {domnode} - the node to attach the body to
 *  @param indicatorParent {domnode} - the node to attach the indicators to
 *  @param attributes {object} - the settings for the stepper
 *    > indicatorPos {enum} - the indicator alignment
 *       > top
 *       > bottom
 */
ws.WizardStepper = function(bodyParent, indicatorParent, attributes) {
  var properties = ws.merge(
      {
        indicatorPos: 'top'
      },
      attributes
    ),
    events = ws.events(),
    body = ws.dom.cr('div', 'ws-wizstepper-body'),
    indicators = ws.dom.cr('div', 'ws-wizstepper-indicators'),
    currentIndicator = ws.dom.cr('div', 'ws-wizstepper-current'),
    currentBubble = ws.dom.cr('div', 'ws-wizstpper-current-bubble'),
    activeStep = false,
    stepCount = 0,
    steps = [],
    ctx = ws.ContextMenu();

  ///////////////////////////////////////////////////////////////////////////

  /* Update the bar CSS - this is more stable than doing it in pure CS */
  function updateBarCSS() {
    var fsteps = steps.filter(function(t) {
      return t.visible;
    });

    stepCount = 0;

    fsteps.forEach(function(step, i) {
      if (i === 0) {
        step.bar.className = 'bar bar-first';
      } else if (i === fsteps.length - 1) {
        step.bar.className = 'bar bar-last';
      } else {
        step.bar.className = 'bar';
      }

      step.number = ++stepCount;

      step.bar.className +=
        ' ' + (properties.indicatorPos === 'bottom' ? 'bar-bottom' : 'bar-top');
    });
  }

  /** Add a new step
     *  @memberof ws.WizardStepper
     *  @param step {object} - an object describing the step
     *    > title {string} - the step title
     *  @returns {object} - interface to manipulate the step
     *    > activate {function} - function to activate the step
     *    > bubble {domnode} - the node for the bubble
     *    > body {domnode} - the node for the step body
     */
  function addStep(step) {
    var stepexports = {
      number: ++stepCount,
      node: ws.dom.cr('div', 'ws-wizstepper-item'),
      label: ws.dom.cr('div', '', step.title, 'label'),
      bubble: ws.dom.cr(
        'div',
        'bubble ' +
          (properties.indicatorPos === 'bottom'
            ? 'bubble-bottom'
            : 'bubble-top')
      ),
      bar: ws.dom.cr(
        'div',
        'bar ' +
          (properties.indicatorPos === 'bottom' ? 'bar-bottom' : 'bar-top')
      ),
      body: ws.dom.cr('div', 'ws-step-body'),
      visible: true
    };

    stepexports.title = step.title;

    function activate() {
      if (activeStep) {
        activeStep.bubble.innerHTML = '';

        ws.dom.style(activeStep.bubble, {
          height: '',
          width: '',
          bottom: '-4px',
          'font-size': '0px'
        });

        ws.dom.style(activeStep.body, {
          opacity: 0,
          display: 'none',
          'pointer-events': 'none'
        });

        if (properties.indicatorPos === 'top') {
          ws.dom.style(activeStep.bubble, {
            top: '-6px',
            bottom: ''
          });
        }

        activeStep.label.className = 'label-inactive';

        currentIndicator.innerHTML =
          step.title + ' - ' + stepexports.number + '/' + stepCount;

        //ws.dom.ap(currentIndicator, currentBubble);
        currentBubble.innerHTML = stepexports.number + '/' + stepCount;

        if (step.onshow) {
          step.onshow();
        }
      }

      stepexports.bubble.innerHTML = stepexports.number;

      ws.dom.style(stepexports.bubble, {
        height: '25px',
        width: '25px',
        bottom: '-8px',
        'font-size': '16px'
      });

      ws.dom.style(stepexports.body, {
        opacity: 1,
        display: 'block',
        'pointer-events': 'auto'
      });

      if (properties.indicatorPos === 'top') {
        ws.dom.style(stepexports.bubble, {
          top: '-10px'
        });
      }

      activeStep = stepexports;
      activeStep.label.className = 'label-active';

      events.emit('Step', stepexports, stepCount, step);
    }

    stepexports.hide = function() {
      ws.dom.style(stepexports.node, {
        display: 'none'
      });
      if (stepexports.visible) {
        //This needs fixing
        stepCount--;
        stepexports.visible = false;
        updateBarCSS();
      }
    };

    stepexports.show = function() {
      ws.dom.style(stepexports.node, {
        display: ''
      });

      if (!stepexports.visible) {
        stepCount++;
        stepexports.visible = true;
        updateBarCSS();

        if (step.onshow) {
          step.onshow();
        }
      }
    };

    stepexports.visible = function() {
      return visible;
    };

    ws.dom.on(stepexports.node, 'click', activate);

    if (!activeStep) {
      activate();
    }

    stepexports.activate = activate;

    steps.push(stepexports);

    updateBarCSS();

    ws.dom.ap(
      indicators,
      ws.dom.ap(
        stepexports.node,
        stepexports.label,
        stepexports.bar,
        stepexports.bubble
      )
    );

    ws.dom.ap(body, stepexports.body);

    events.emit('AddStep', activeStep, stepCount);

    return stepexports;
  }

  /** Go to the next step
     *  @memberof ws.WizardStepper
     */
  function next() {
    var fsteps = steps.filter(function(t) {
      return t.visible;
    });
    if (activeStep && activeStep.number < stepCount) {
      fsteps[activeStep.number].activate();
    }
  }

  /** Go to the previous step
     *  @memberof ws.WizardStepper
     */
  function previous() {
    var fsteps = steps.filter(function(t) {
      return t.visible;
    });
    if (activeStep && activeStep.number > 1) {
      fsteps[activeStep.number - 2].activate();
    }
  }

  /** Force a resize of the splitter
     *  @memberof ws.WizardStepper
     *  @param w {number} - the width of the stepper (will use parent if null)
     *  @param h {number} - the height of the stepper (will use parent if null)
     */
  function resize(w, h) {
    var ps = ws.dom.size(bodyParent);

    ws.dom.style(body, {
      height: (h || ps.h) + 'px'
    });
  }

  /** Select the first step
      * @memberof ws.WizardStepper
      */
  function selectFirst() {
    steps.some(function(step, i) {
      if (step.visible) {
        step.activate();
        return true;
      }
    });
  }

  ws.dom.on(currentIndicator, 'click', function(e) {
    var fsteps = steps.filter(function(t) {
      return t.visible;
    });

    ctx.build(
      fsteps.map(function(step) {
        return {
          title: step.title,
          click: step.activate,
          selected: activeStep.title === step.title
        };
      })
    );

    ctx.show(e.clientX, e.clientY);
  });

  ///////////////////////////////////////////////////////////////////////////

  ws.dom.ap(
    indicatorParent,
    indicators,
    ws.dom.ap(currentIndicator, currentBubble)
  );

  ws.dom.ap(bodyParent, body);

  ///////////////////////////////////////////////////////////////////////////

  return {
    on: events.on,
    addStep: addStep,
    next: next,
    resize: resize,
    previous: previous,
    selectFirst: selectFirst,
    /** The main body
         *  @memberof ws.WizardStepper
         *  @type {domnode}
         */
    body: body
  };
};
