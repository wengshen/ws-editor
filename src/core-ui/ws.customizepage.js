

// @format

/* global window */

ws.CustomizePage = function(parent, options, chartPreview, chartFrame, props, chartContainer, planCode) {
  var events = ws.events(),
    // Main properties
    container = ws.dom.cr(
      'div',
      'ws-transition ws-toolbox ws-box-size'
    ),
    title = ws.dom.cr('div', 'ws-toolbox-body-title'),
    customizeTitle,
    contents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-inner-body'
    ),
    userContents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-user-contents test'
    ),
    helpIcon = ws.dom.cr(
      'div',
      'ws-toolbox-help ws-icon fa fa-question-circle'
    ),
    width,
    chartWidth = 68,
    iconClass,
    autoAppearanceTab = true,
    icon = ws.dom.cr('div', iconClass),
    helpModal,
    // Data table
    customizerContainer = ws.dom.cr('div', 'ws-box-size ws-fill'),
    customizer,
    body = ws.dom.cr(
      'div',
      'ws-toolbox-body ws-box-size ws-transition'
    ),
    iconsContainer = ws.dom.cr('div', 'ws-icons-container'),
    annotationContainer,
    activeAnnotation = null,
    annotationOptions = [{
      tooltip: 'Add Circle',
      icon: 'circle',
      value: 'circle',
      draggable: true
    }, {
      tooltip: 'Add Square',
      icon: 'stop',
      value: 'rect',
      draggable: true
    }, {
      tooltip: 'Add Annotations',
      icon: 'comment',
      value: 'label',
      draggable: true
    }, {
      tooltip: 'Move',
      icon: 'arrows',
      value: 'drag'
    }, {
      tooltip: 'Remove',
      icon: 'trash',
      value: 'delete',
    }, {
      tooltip: 'Close',
      icon: 'times',
      onClick: function() {
        annotationOptions.forEach(function(o) {
          o.element.classList.remove('active');
        });

        chartPreview.setIsAnnotating(false);
        annotationContainer.classList.remove('active');
      }
    }],
    buttons = [
      {
        tooltip: 'Basic',
        onClick: function() {
          reduceSize(customizer.showSimpleEditor);
        },
        icon: 'cog'
      },
      {
        tooltip: 'Advanced',
        noPermission: options.noAdvanced,
        onClick: function() {
          customizer.showAdvancedEditor();
        },
        icon: 'cogs'
      },
      {
        tooltip: 'Custom Code',
        noPermission: options.noCustomCode,
        onClick: function() {
          reduceSize(customizer.showCustomCode);
        },
        icon: 'code'
      },
      {
        tooltip: 'Preview Options',
        noPermission: options.noPreview,
        onClick: function() {

          reduceSize(customizer.showPreviewOptions);

        },
        icon: 'eye'
      }
    ],

    isVisible = false,
    searchAdvancedOptions = ws.SearchAdvancedOptions(parent),
    resolutionSettings = ws.dom.cr('span', 'ws-resolution-settings'),
    phoneIcon = ws.dom.cr('span', '', '<i class="fa fa-mobile" aria-hidden="true"></i>');
    tabletIcon = ws.dom.cr('span', '', '<i class="fa fa-tablet" aria-hidden="true"></i>'),
    tabletIcon = ws.dom.cr('span', '', '<i class="fa fa-tablet" aria-hidden="true"></i>'),
    stretchToFitIcon = ws.dom.cr('span', '', '<i class="fa fa-laptop" aria-hidden="true"></i>'),
    chartSizeText = ws.dom.cr('span', 'text', 'Chart Size:'),
    resWidth = ws.dom.cr('input', 'ws-res-number'),
    resHeight = ws.dom.cr('input', 'ws-res-number'),
    resolutions = [
      {
        iconElement: phoneIcon,
        width: 414,
        height: 736
      },
      {
        iconElement: tabletIcon,
        width: 1024,
        height: 768
      }
    ],
    overlayAddTextModal = ws.OverlayModal(false, {
      // zIndex: 20000,
      showOnInit: false,
      width: 300,
      height: 350,
      class: ' ws-annotations-modal'
    }),
    activeColor = 'rgba(0, 0, 0, 0.75)',
    addTextModalContainer = ws.dom.cr('div', 'ws-add-text-popup'),
    addTextModalInput = ws.dom.cr('textarea', 'ws-imp-input-stretch'),
    colorDropdownParent = ws.dom.cr('div'),
    typeDropdownParent = ws.dom.cr('div'),
    addTextModalHeader = ws.dom.cr('div', 'ws-modal-header', 'Add Annotation'),
    addTextModalColorSelect = ws.DropDown(colorDropdownParent),
    addTextModalTypeOptions = [{
      text: 'Callout',
      icon: 'comment-o',
      value: 'callout'
    },{
      text: 'Connector',
      icon: 'external-link',
      value: 'connector'
    }, {
      text: 'Circle',
      icon: 'circle-o',
      value: 'circle'
    }],
    addTextModalTypeValue = 'callout',
    addTextModalColorValue = '#000000',
    addTextModalColorContainer = ws.dom.cr('div', 'ws-modal-color-container'),
    addTextModalColorInput = ws.dom.cr('input', 'ws-color-input'),
    box = ws.dom.cr('div', 'ws-field-colorpicker', ''),
    addTextModalBtnContainer = ws.dom.cr('div', 'ws-modal-button-container'),
    addTextModalSubmit = ws.dom.cr('button', 'ws-ok-button ws-import-button mini', 'Save'),
    addTextModalCancel = ws.dom.cr('button', 'ws-ok-button ws-import-button grey negative mini', 'Cancel'),
    addLabelX = null,
    addLabelY = null;
    
    resWidth.placeholder = 'W';
    resHeight.placeholder = 'H';

    addTextModalColorSelect.addItems([
      {
        title: 'Black',
        id: 'black',
        select: function() {
          activeColor = 'rgba(0, 0, 0, 0.75)';
        }
      },
      {
        title: 'Red',
        id: 'red',
        select: function() {
          activeColor = 'rgba(255, 0, 0, 0.75)';
        }
      },
      {
        title: 'Blue',
        id: 'blue',
        select: function() {
          activeColor = 'rgba(0, 0, 255, 0.75)';
        }
      }
    ]);

    addTextModalColorSelect.selectByIndex(0);
    
    addTextModalColorInput.value = addTextModalColorValue;

    ws.dom.on(addTextModalCancel, 'click', function() {
      overlayAddTextModal.hide();
    });

    ws.dom.style(box, {
      background: addTextModalColorValue,
      color: ws.getContrastedColor(addTextModalColorValue)
    });

    addTextModalTypeOptions.forEach(function(option) {

      var container = ws.dom.cr('div', 'ws-annotation-modal-container ' + (addTextModalTypeValue === option.value ? ' active' : '')),
          icon = ws.dom.cr('div', 'ws-modal-icon fa fa-' + option.icon),
          text = ws.dom.cr('div', 'ws-modal-text', option.text);
          option.element = container;
      
      ws.dom.on(container, 'click', function() {
        addTextModalTypeOptions.forEach(function(o) {
          if (o.element.classList.contains('active'))  o.element.classList.remove('active');
        })
        option.element.classList += ' active';
        addTextModalTypeValue = option.value;
      })
      
      ws.dom.ap(typeDropdownParent, ws.dom.ap(container, icon, text));
    });

    addTextModalInput.placeholder = 'Write annotation here';


    function update(col) {
      if (
        col &&
        col !== 'null' &&
        col !== 'undefined' &&
        typeof col !== 'undefined'
      ) {
        box.innerHTML = "";
        //box.innerHTML = col;
      } else {
        box.innerHTML = 'auto';
        col = '#FFFFFF';
      }

      ws.dom.style(box, {
        background: col,
        color: ws.getContrastedColor(col)
      });

    }

    var timeout = null;
    ws.dom.on(addTextModalColorInput, 'change', function(e) {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        addTextModalColorValue = addTextModalColorInput.value;
        update(addTextModalColorValue);
      }, 500);
    });

    ws.dom.on(box, 'click', function(e) {
      ws.pickColor(e.clientX, e.clientY, addTextModalColorValue, function(col) {
        if (ws.isArr(addTextModalColorValue)) {
          addTextModalColorValue = '#000000';
        }

        addTextModalColorValue = col;
        addTextModalColorInput.value = addTextModalColorValue;
        update(col);
      });
    });

    ws.dom.ap(overlayAddTextModal.body,
      ws.dom.ap(addTextModalContainer,
                    addTextModalHeader,
                    addTextModalInput,
                    ws.dom.cr('div', 'ws-add-text-label', 'Type:'),
                    typeDropdownParent,
                    ws.dom.cr('div', 'ws-add-text-label', 'Color:'),
                    //colorDropdownParent,
                    ws.dom.ap(addTextModalColorContainer, box, addTextModalColorInput),
                    ws.dom.ap(addTextModalBtnContainer,
                      addTextModalSubmit,
                      addTextModalCancel
                    )
                  )
    );

    ws.dom.on(addTextModalSubmit, 'click', function() {
      overlayAddTextModal.hide();
      chartPreview.addAnnotationLabel(addLabelX, addLabelY, addTextModalInput.value.replace('\n', '<br/>'), addTextModalColorValue, addTextModalTypeValue);
      addTextModalInput.value = '';

    });

  function usingSafari() {
    return (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Mac') != -1 && navigator.userAgent.indexOf('Chrome') == -1)
  }

  function init() {

    width = props.width,
    customizeTitle = ws.dom.cr('div', 'ws-customize-title'/*, props.title*/),
    iconClass = 'ws-box-size ws-toolbox-bar-icon fa ' + props.icon;

    customizerContainer.innerHTML = '';

    customizer = ws.ChartCustomizer(
      customizerContainer,
      options,
      chartPreview,
      planCode
    ),
    helpModal = ws.HelpModal(props.help || []);

    customizer.on('PropertyChange', chartPreview.options.set);
    customizer.on('PropertySetChange', chartPreview.options.setAll);
    customizer.on('TogglePlugins', chartPreview.options.togglePlugins);
    
    customizer.on('AdvancedBuilt', function() {

      var bsize = ws.dom.size(body),
      size = {
        w: bsize.w,
        h: (window.innerHeight
          || document.documentElement.clientHeight
          || document.body.clientHeight) - ws.dom.pos(body, true).y
      };

      searchAdvancedOptions.resize(width, (size.h - ws.dom.size(chartFrame).h) - 15);
    
      searchAdvancedOptions.setOptions(customizer.getAdvancedOptions());
    });

    customizer.on('AnnotationsClicked', function() {
      chartPreview.options.togglePlugins('annotations', 1);
    });
  
    customizer.on('AdvanceClicked', function() {
  
      width = 66;
      if (ws.onTablet()) width = 64;

      chartWidth = 28;
      ws.dom.style(backIcon, {
        display: "inline-block"
      });
  
      expand();
      resizeChart(300);
  
      setTimeout(chartPreview.resize, 1000);
      searchAdvancedOptions.show();
    });
    
    ws.dom.ap(resolutionSettings, chartSizeText, stretchToFitIcon, tabletIcon, phoneIcon, resWidth, resHeight);
    
    title.innerHTML = '';
    
    iconsContainer.innerHTML = '';

    if (!ws.onPhone()) {
      buttons.forEach(function(button, i) {
        if (button.noPermission) return;
        
        button.element = ws.dom.cr('span', 'ws-toolbox-custom-code-icon ws-template-tooltip ' + ( i === 0 ? ' active' : ''), '<i class="fa fa-' + button.icon + '" aria-hidden="true"></i><span class="ws-tooltip-text">' + button.tooltip + '</span>');
        
        ws.dom.on(button.element, 'click', function() {
          buttons.forEach(function(b){
            if (!b.noPermission)  b.element.classList.remove('active');
          });
          button.element.classList.add('active');
          button.onClick();
        });
        ws.dom.ap(iconsContainer, button.element);
      });
    }

    var annotationButton = ws.dom.cr('span', 'ws-template-tooltip annotation-buttons ' + (usingSafari() ? ' usingsafari ' : '') , '<i class="fa fa-commenting" aria-hidden="true"></i><span class="ws-tooltip-text">Annotations</span>');

    ws.dom.on(annotationButton, 'click', function() {
      if (annotationContainer.classList.contains('active')) annotationContainer.classList.remove('active');
      else annotationContainer.classList.add('active');

    });

    if (!annotationContainer) {
      annotationContainer = ws.dom.cr('div', 'ws-transition ws-annotation-container');

      ws.dom.ap(annotationContainer, annotationButton);

      annotationOptions.forEach(function(option) {
        var btn = ws.dom.cr('span', 'ws-template-tooltip annotation-buttons ' + (usingSafari() ? ' usingsafari ' : '') , '<i class="fa fa-' + option.icon + '" aria-hidden="true"></i><span class="ws-tooltip-text">' + option.tooltip + '</span>');
        if (option.onClick || !option.draggable) {
          ws.dom.on(btn, 'click', function() {
            
            if (option.onClick) option.onClick();
            else {
              var isAnnotating = !(option.element.className.indexOf('active') > -1);
    
              annotationOptions.forEach(function(o) {
                o.element.classList.remove('active');
              });
      
              chartPreview.setIsAnnotating(isAnnotating);
              if (isAnnotating) {
                chartPreview.options.togglePlugins('annotations', 1);
                chartPreview.setAnnotationType(option.value);
                option.element.className += ' active';
              }
            }
          });
        } else {
          ws.dom.on(btn, 'mousedown', function (e) {
            
            activeAnnotation = ws.dom.cr('div', 'ws-active-annotation fa fa-' + option.icon);
            
            ws.dom.ap(document.body, activeAnnotation);
            function moveAt(pageX, pageY) {
              ws.dom.style(activeAnnotation, {
                left: pageX - (btn.offsetWidth / 2 - 10) + 'px',
                top: pageY - (btn.offsetHeight / 2 - 10) + 'px'
              });
            }
            moveAt(e.pageX, e.pageY);
            
            function onMouseMove(event) {
              if(event.stopPropagation) event.stopPropagation();
              if(event.preventDefault) event.preventDefault();
              moveAt(event.pageX, event.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            ws.dom.on(activeAnnotation, 'mouseup', function (e) {
              e = chartPreview.options.all().pointer.normalize(e);
              document.removeEventListener('mousemove', onMouseMove);
              activeAnnotation.onmouseup = null;
              activeAnnotation.remove();
              activeAnnotation = null;
              
              chartPreview.options.togglePlugins('annotations', 1);
              chartPreview.setAnnotationType(option.value);
              chartPreview.addAnnotation(e);
            });
          });
        }

  
        option.element = btn;
        ws.dom.ap(annotationContainer, btn);
      });
    }

    
    ws.dom.ap(iconsContainer, annotationContainer);

    ws.dom.ap(contents, userContents);
    ws.dom.ap(body, contents);
  
    ws.dom.ap(userContents, customizerContainer);
    ws.dom.ap(parent, ws.dom.ap(container,body));
  
    //customizer.resize();

    expand();
    hide();
  }

  function getResolutionContainer() {
    return resolutionSettings;
  }
  
  function afterResize(func){
    var timer;
    return function(event){
      if(timer) clearTimeout(timer);
      timer = setTimeout(func,100,event);
    };
  }

  function reduceSize(fn) {
    width = props.widths.desktop;
    if (ws.onTablet() && props.widths.tablet) width = props.widths.tablet;
    else if (ws.onPhone() && props.widths.phone) width = props.widths.phone;
    
    chartWidth = 68;

    expand();
    setTimeout(function() {
      if (fn) fn();
      resizeChart(((window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight) - ws.dom.pos(body, true).y) - 16);
    }, 200);
  }

  function resize() {
    if (isVisible){
      expand()
      setTimeout(function() {

        resizeChart((((window.innerHeight
          || document.documentElement.clientHeight
          || document.body.clientHeight) - ws.dom.pos(body, true).y) - 16));
      }, 500);
      //expand();
    }
  }
  
  if (!ws.onPhone()) {
    ws.dom.on(window, 'resize', afterResize(function(e){
      resize();
    }));
  }

  resolutions.forEach(function(res) {
    ws.dom.on(res.iconElement, 'click', function(){
      sizeChart(res.width, res.height);

      resWidth.value = res.width;
      resHeight.value = res.height;
    });
  });

  ws.dom.on(stretchToFitIcon, 'click', function() {
    
    resWidth.value = '';
    resHeight.value = '';
    ws.dom.style(chartContainer, {
      width: '100%',
      height: '100%',
    });
    setTimeout(chartPreview.resize, 300);
  }),
  backIcon = ws.dom.cr('div','ws-back-icon', '<i class="fa fa-chevron-circle-left" aria-hidden="true"></i>');


  ws.dom.style(backIcon, {
    display: "none"
  });


  ws.dom.on(backIcon, 'click', function(){
    
    width = props.widths.desktop;
    if (ws.onTablet() && props.widths.tablet) width = props.widths.tablet;
    else if (ws.onPhone() && props.widths.phone) width = props.widths.phone;
    
    chartWidth = 68;
    
    ws.dom.style(backIcon, {
      display: "none"
    });
    searchAdvancedOptions.hide();

    expand();
    resizeChart(((window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight) - ws.dom.pos(body, true).y) - 16);

    setTimeout(customizer.showSimpleEditor, 200);
  });

  function expand() {
    
    var newWidth = width; //props.width;

    ws.dom.style(body, {
      width: 100 + '%',
      opacity: 1
    });


    if (!ws.onPhone()) {
      const windowWidth = ws.dom.size(parent).w;
      const percentage = ((100 - chartWidth) / 100);
  
      var styles =  window.getComputedStyle(chartFrame);
      var containerStyles =  window.getComputedStyle(container);
      var chartMargin = parseFloat(styles['marginLeft']) + parseFloat(styles['marginRight']),
          containerMargin = parseFloat(containerStyles['marginLeft']) + parseFloat(containerStyles['marginRight']);

      ws.dom.style(container, {
        width: ((windowWidth*percentage) - (chartMargin + containerMargin + 35) - 3 /*padding*/) + 'px'
      });
    }

    events.emit('BeforeResize', newWidth);

    function resizeBody() {
      var bsize = ws.dom.size(body),
        tsize = ws.dom.size(title),
        size = {
          w: bsize.w,
          h: (window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight) - ws.dom.pos(body, true).y
        };

        ws.dom.style(contents, {
          width: "100%",
          height: ((size.h - 16)) + 'px'
        });

      customizer.resize(size.w, (size.h - 17) - tsize.h);

      return size;
    }

    setTimeout(resizeBody, 300);  
    ws.emit('UIAction', 'ToolboxNavigation', props.title);
  }

  function show() {
    ws.dom.style(container, {
      display: 'block'
    });
    expand();
    resizeChart(((window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight) - ws.dom.pos(body, true).y) - 16);
    isVisible = true;
    ws.dom.style(resolutionSettings, {
      display: 'block'
    });


    if (autoAppearanceTab) {
      setTimeout(function() {
        if (!document.getElementById('ws-list-header-Appearance').classList.contains('active')){
          document.getElementById('ws-list-header-Appearance').children[0].click()
        }
      }, 300)
    }

  }
  
  function hide() {

    customizer.showSimpleEditor();
      
    width = props.widths.desktop;
    if (ws.onTablet() && props.widths.tablet) width = props.widths.tablet;
    else if (ws.onPhone() && props.widths.phone) width = props.widths.phone;

    chartWidth = 68;
   
    ws.dom.style(backIcon, {
      display: "none"
    });
    searchAdvancedOptions.hide();

    expand();

    ws.dom.style(container, {
      display: 'none'
    });
    isVisible = false;
    searchAdvancedOptions.hide();
    
    if (resolutionSettings) {
      ws.dom.style(resolutionSettings, {
        display: 'none'
      });
    }

    if (!ws.onPhone()){
      buttons.forEach(function(button, i) {

        if (button.noPermission) return;
        if (button.element) {
          button.element.classList.remove('active');
        }
        if (i === 0) button.element.classList += ' active';
      });
    }

    resHeight.value = '';
    resWidth.value = '';
  }

  function selectOption(event, x, y) {
    customizer.focus(event, x, y);
  }

  function setTabBehaviour(behaviour) {
    autoAppearanceTab = behaviour
  }

  function destroy() {}

  function showError(title, message) {
    ws.dom.style(errorBar, {
      opacity: 1,
      'pointer-events': 'auto'
    });

    errorBarHeadline.innerHTML = title;
    errorBarBody.innerHTML = message;
  }  
  
  function sizeChart(w, h) {
    if ((!w || w.length === 0) && (!h || h.length === 0)) {
      fixedSize = false;
      resHeight.value = '';
      resWidth.value = '';
      resizeChart();
    } else {
      var s = ws.dom.size(chartFrame);

      // ws.dom.style(chartFrame, {
      //   paddingLeft: (s.w / 2) - (w / 2) + 'px',
      //   paddingTop: (s.h / 2) - (h / 2) + 'px'
      // });

      fixedSize = {
        w: w,
        h: h
      };

      w = (w === 'auto' ?  s.w : w || s.w - 100);
      h = (h === 'auto' ?  s.h : h || s.h - 100);

      ws.dom.style(chartContainer, {
        width: w + 'px',
        height: h + 'px'
      });

      //chartPreview.chart.setWidth();

      chartPreview.resize(w, h);
    }
  }

  ws.dom.on([resWidth, resHeight], 'change', function() {
    sizeChart(parseInt(resWidth.value, 10), parseInt(resHeight.value, 10));
  });


  chartPreview.on('ShowTextDialog', function(chart, x, y) {
    addLabelX = x;
    addLabelY = y;
    addTextModalInput.focus();

    overlayAddTextModal.show();

  });
  
  chartPreview.on('ChartChange', function(newData) {
    events.emit('ChartChangedLately', newData);
  });

  function getIcons(){
    return iconsContainer;
  }

  function resizeChart(newHeight) {

    ws.dom.style(chartFrame, {
      /*left: newWidth + 'px',*/
      width: chartWidth + '%', //'68%',
      height: newHeight + 'px' || '100%'
    });
/*
    ws.dom.style(chartContainer, {
      width: psize.w - newWidth - 100 + 'px',
      height: psize.h - 100 + 'px'
    });*/

    setTimeout(chartPreview.resize, 200);
  }

  
  chartPreview.on('SetResizeData', function () {
    //setToActualSize();
  });

  return {
    on: events.on,
    destroy: destroy,
    hide: hide,
    show: show,
    resize: resize,
    isVisible: function() {
      return isVisible;
    },
    init: init,
    getIcons: getIcons,
    selectOption: selectOption,
    getResolutionContainer: getResolutionContainer,
    setTabBehaviour: setTabBehaviour
    //toolbar: toolbar
  };
};
