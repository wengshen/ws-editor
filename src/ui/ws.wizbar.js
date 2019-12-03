

// @format

/** This is a component that implements a toolbar with wizard steps
 * Proxies the interface of the WizardStepper object.
 * @constructor
 * @emits Step - when stepping back or forth
 * @emits AddStep - when adding a step to the stepper
 * @param parent {domnode} - the dom node to attach the UI to
 * @param bodyParent {domnode} - the dom node to attach the stepper body to
 * @param attributes {object} - options for the object
 */
ws.WizardBar = function(parent, bodyParent, attributes) {
  var toolbar = ws.Toolbar(parent, {
      additionalCSS: ['ws-wizstepper-bar']
    }),
    stepper = ws.WizardStepper(bodyParent, toolbar.center),
    next = ws.dom.cr(
      'span',
      'ws-wizstepper-next-prev fa fa-arrow-right'
    ),
    previous = ws.dom.cr(
      'span',
      'ws-wizstepper-next-prev fa fa-arrow-left'
    );

  ///////////////////////////////////////////////////////////////////////////

  function handleStepEvent(step, count) {
    if (step.number > 1) {
      ws.dom.style(previous, {
        opacity: 1,
        'pointer-events': 'auto',
        visibility: 'visible'
      });
    } else {
      ws.dom.style(previous, {
        opacity: 0,
        'pointer-events': 'none',
        visibility: 'hidden'
      });
    }

    if (step.number < count) {
      ws.dom.style(next, {
        opacity: 1,
        'pointer-events': 'auto',
        visibility: 'visible'
      });
    } else {
      ws.dom.style(next, {
        opacity: 0,
        'pointer-events': 'none',
        visibility: 'hidden'
      });
    }
  }

  stepper.on('Step', handleStepEvent);
  stepper.on('AddStep', handleStepEvent);

  ws.dom.on(next, 'click', stepper.next);
  ws.dom.on(previous, 'click', stepper.previous);

  ///////////////////////////////////////////////////////////////////////////

  ws.dom.ap(toolbar.right, next);
  ws.dom.ap(toolbar.left, previous);

  ws.dom.style(previous, {
    opacity: 0,
    'pointer-events': 'none'
  });

  return {
    /** The container which the bar is attached to
     *  @type {domnode}
     *  @memberof ws.WizardBar
     */
    container: toolbar.container,
    on: stepper.on,
    next: stepper.next,
    previous: stepper.previous,
    addStep: stepper.addStep,
    selectFirst: stepper.selectFirst
  };
};
