

// @format

ws.OptionsPanel = function(parent, attr) {
  var events = ws.events(),
    container = ws.dom.cr(
      'div',
      'ws-transition ws-optionspanel ws-box-size'
    ),
    body = ws.dom.cr(
      'div',
      'ws-box-size ws-transition'
    ),
    prev,
    options = {},
    currentOption = null;

  ws.dom.ap(parent, ws.dom.ap(container, ws.dom.ap(body, ws.dom.cr('div', '', '工作空间:'))));

  function setDefault(option) {
    prev = option;
  }

  function addOption(option, id) {
    var btn = ws.dom.cr(
      'a',
      'ws-optionspanel-button ' + (id === 'data' ? 'active' : ''),
      option.text + '&nbsp;<i class="fa fa-' + option.icon + '"></i>'
    );
      
    (option.onClick || []).forEach(function(click) {
      ws.dom.on(btn, 'click', function() {
        Object.keys(options).forEach(function(o) {
          options[o].classList.remove('active');
        });
        currentOption = option;
        btn.classList.add('active');

        click(prev, option);
      });
    });

    options[id] = btn;
    
    ws.dom.ap(body,btn);
  }

  function clearOptions() {
    body.innerHTML = '';
    ws.dom.ap(body, ws.dom.cr('div', 'ws-optionspanel-header', '工作空间:'));
  }

  function getPrev() {
    return prev;
  }

  function getOptions() {
    return options;
  }

  function getCurrentOption() {
    return currentOption;
  }

  return {
    on: events.on,
    addOption: addOption,
    setDefault: setDefault,
    getPrev: getPrev,
    clearOptions: clearOptions,
    getOptions: getOptions,
    getCurrentOption: getCurrentOption
  };
};
