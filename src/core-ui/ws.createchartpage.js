

// @format

/* global window */

ws.CreateChartPage = function(parent, userOptions, props) {
  var events = ws.events(),
    builtInOptions = [
      {
        id: 1,
        title: 'Choose Template',
        permission: 'templates',
        create: function(body) {
          ws.dom.ap(body, templateContainer);
        }
      },
      {
        id: 2,
        title: 'Title Your Chart',
        create: function(body) {
          ws.dom.ap(body, titleContainer);
        }
      },
      {
        id: 3,
        title: '导入数据',
        create: function(body) {
          ws.dom.ap(body, dataTableContainer);
        }
      },
      {
        id: 4,
        title: 'Customize',
        permission: 'customize',
        hideTitle: true,
        create: function(body) {
          ws.dom.ap(body, customizerContainer);
        }
      }
    ],
    container = ws.dom.cr(
      'div',
      'ws-transition ws-toolbox wizard ws-box-size '
    ),
    title = ws.dom.cr('div', 'ws-toolbox-body-title'),
    contents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-inner-body'
    ),
    userContents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-user-contents test-test'
    ),
    body = ws.dom.cr(
      'div',
      'ws-toolbox-body ws-box-size ws-transition'
    ),
    listContainer = ws.dom.cr('div', 'ws-toolbox-createchart-list'),
    isVisible = false,
    customizerContainer = ws.dom.cr('div', 'ws-toolbox-customise'),
    titleContainer = ws.dom.cr('div', 'ws-toolbox-title'),
    templateContainer = ws.dom.cr('div', 'ws-toolbox-template'),
    dataTableContainer = ws.dom.cr('div', 'ws-toolbox-data'),
    //toolbox = ws.Toolbox(userContents),
    options = [];

    function init(dataPage,templatePage, customizePage) {

      var counter = 1;
      toolbox = ws.Toolbox(userContents);
      builtInOptions.forEach(function(option, index) {
        if (option.permission && userOptions.indexOf(option.permission) === -1) return;

        var o = toolbox.addEntry({
          title: option.title,
          number: counter,//option.id,
          onClick: manualSelection,
          hideTitle: option.hideTitle
        });

        if (ws.isFn(option.create)) {
          option.create(o.body);
        }

        options.push(o);
        counter++;

      });
      options[0].expand();

      createTitleSection();
      createImportDataSection(dataPage);
      createTemplateSection(templatePage);
      createCustomizeSection();

      ws.dom.ap(contents, userContents);
      ws.dom.ap(body, contents);
  
      //ws.dom.ap(userContents, listContainer);
      
      ws.dom.ap(parent, ws.dom.ap(container, body));

      expand();
    }


    function createTitleSection() {

      var titleInput = ws.dom.cr('input', 'ws-imp-input'),
          subtitleInput = ws.dom.cr('input', 'ws-imp-input'),
          nextButton = ws.dom.cr(
            'button',
            'ws-ok-button ws-import-button negative',
            'Next'
          ),
          skipAll = ws.dom.cr('span', 'ws-toolbox-skip-all', 'Skip All');

      titleInput.placeholder = 'Enter chart title';
      subtitleInput.placeholder = 'Enter chart subtitle';

      titleInput.value = '';
      subtitleInput.value = '';
      
      ws.dom.on(nextButton, 'click', function() {
        
        if(userOptions && (userOptions.indexOf('templates') === -1)) {
          options[1].expand();
        } else options[2].expand();
        events.emit("SimpleCreateChangeTitle", {
          title: titleInput.value,
          subtitle: subtitleInput.value
        });
      });

      ws.dom.on(skipAll, 'click', function() {
        events.emit("SimpleCreateChartDone", true);
      });

      ws.dom.ap(titleContainer,
        ws.dom.cr(
          'table'
        ),
        ws.dom.ap(
          ws.dom.cr('tr', 'ws-toolbox-input-container'),
          ws.dom.cr(
            'td',
            'ws-toolbox-label',
            'Chart Title'
          ), 
          ws.dom.ap(ws.dom.cr('td'), titleInput)
        ),
        ws.dom.ap(
          ws.dom.cr('tr', 'ws-toolbox-input-container'),
          ws.dom.cr(
            'td',
            'ws-toolbox-label',
            'Subtitle'
          ), 
          ws.dom.ap(ws.dom.cr('td'), subtitleInput)
        ),
        ws.dom.ap(
          ws.dom.cr('tr'),
          ws.dom.cr('td'),
          ws.dom.ap(
            ws.dom.cr('td','ws-toolbox-button-container'),
            skipAll,
            nextButton
          )
        )
      );   
    }

    function createImportDataSection(dataPage) {

      var nextButton = ws.dom.cr(
            'button',
            'ws-ok-button ws-import-button negative',
            'No thanks, I will enter my data manually'
          ),
          loader = ws.dom.cr('span','ws-wizard-loader', '<i class="fa fa-spinner fa-spin fa-1x fa-fw"></i>'),
          dataTableDropzoneContainer = dataPage.createSimpleDataTable(function() {
            if(userOptions && (userOptions.indexOf('templates') === -1)) { 
              options[2].expand();
            } else if(userOptions && (userOptions.indexOf('customize') === -1)) {
              events.emit("SimpleCreateChartDone", true);
            } else options[3].expand();

          }, function(loading) {
            if (loading) loader.classList += ' active';
            else loader.classList.remove('active');
          });

      ws.dom.on(nextButton, 'click', function() {
        if(userOptions && (userOptions.indexOf('templates') === -1)) { 
          options[2].expand();
        } else if(userOptions && (userOptions.indexOf('customize') === -1)) {
          events.emit("SimpleCreateChartDone", true);
        }
        else options[3].expand();
      });
      ws.dom.ap(dataTableContainer,
        ws.dom.ap(dataTableDropzoneContainer,
          ws.dom.ap(
            ws.dom.cr('div','ws-toolbox-button-container'),
            loader,
            nextButton
          )
        )
      );
    }

    function createTemplateSection(templatePage) {

      var nextButton = ws.dom.cr(
            'button',
            'ws-ok-button ws-import-button negative',
            'Choose A Template Later'
      ),
      skipAll = ws.dom.ap(ws.dom.cr('div', 'ws-toolbox-skip-all'), ws.dom.cr('span','', 'Skip All'));
      loader = ws.dom.cr('span','ws-wizard-loader ', '<i class="fa fa-spinner fa-spin fa-1x fa-fw a"></i>'),
      templatesContainer = templatePage.createMostPopularTemplates(function() {
        setTimeout(function() {
          options[1].expand();
        },200);
      }, function(loading) {
        if (loading) loader.classList += ' active';
        else loader.classList.remove('active');
      });

      ws.dom.on(skipAll, 'click', function() {
        events.emit("SimpleCreateChartDone", true);
      });
      
      ws.dom.on(nextButton, 'click', function() {
        options[1].expand();
      });

      ws.dom.ap(templateContainer,
        ws.dom.ap(ws.dom.cr('div', 'ws-toolbox-template-body'),
          ws.dom.ap(
            ws.dom.cr('div', 'ws-toolbox-text'),
            ws.dom.cr('div', 'ws-toolbox-template-text', 'Pick a basic starter template. You can change it later.'),
            ws.dom.cr('div', 'ws-toolbox-template-text', "If you're not sure, just hit Choose A Template Later.")
          ),
          ws.dom.ap(
            ws.dom.cr('div', 'ws-toolbox-extras'),
            nextButton,
            ws.dom.ap(
              skipAll,
              loader
            )
          )
        ),
        templatesContainer
      );
    }

    function createCustomizeSection() {

      var nextButton = ws.dom.cr(
            'button',
            'ws-ok-button ws-import-button negative',
            'Customize Your Chart'
          );//,
         // dataTableDropzoneContainer = dataPage.createSimpleDataTable();

      ws.dom.on(nextButton, 'click', function() {
        events.emit("SimpleCreateChartDone");
      });

      ws.dom.ap(customizerContainer,
        ws.dom.cr('div', 'ws-toolbox-customize-header', "You're Done!"),
        ws.dom.ap(
          ws.dom.cr('div','ws-toolbox-button-container'),
          nextButton
        )
      );
    }

    function manualSelection(number) {
      options.forEach(function(option, i){
        if (i+1 <= number) option.disselect();
        else option.removeCompleted();
      });
    }

    function resize() {
      if (isVisible) {
        expand();
      }
    }

    ws.dom.on(window, 'resize', resize);
    
    function expand() {
      //var bsize = ws.dom.size(bar);

      var newWidth = props.widths.desktop;
      if (ws.onTablet() && props.widths.tablet) newWidth = props.widths.tablet;
      else if (ws.onPhone() && props.widths.phone) newWidth = props.widths.phone;

      ws.dom.style(body, {
        width: 100 + '%',
        //height: //(bsize.h - 55) + 'px',
        opacity: 1
      });

      ws.dom.style(container, {
        width: newWidth + '%'
      });

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
        width: size.w + 'px',
        height: ((size.h - 16)) + 'px'
      });
    }

    setTimeout(resizeBody, 300);
    ws.emit('UIAction', 'ToolboxNavigation', props.title);

    }

  function show() {
    ws.dom.style(container, {
      display: 'block'
    });
    isVisible = true;
    //expand();
    
  }
  function hide() {
    ws.dom.style(container, {
      display: 'none'
    });
    isVisible = false;
  }

  function destroy() {}

  function getIcons() {
    return null;
  }

  //////////////////////////////////////////////////////////////////////////////

  return {
    on: events.on,
    destroy: destroy,
    hide: hide,
    show: show,
    isVisible: function() {
      return isVisible;
    },
    init: init,
    getIcons: getIcons
  };
};
