

// @format 搜索advance高级属性

ws.SearchAdvancedOptions = function(parent, attr) {

  var timeout = null,
      advancedOptions = null,
      filters = {
        //Filter the series properties based on the series.type property
        series: {
          controller: 'type',
          state: false,
          default: 'line'
        },
        plotOptions: {
          controller: 'type',
          state: false,
          default: 'line'
        }
      };;

  function resize(w, h) {
       
    ws.dom.style(container, {
      height: (h - 5) + 'px'
    });
  }

  function setOptions(options) {
    advancedOptions = options;
    /*
    advancedOptions = (options.series || []).map(function(serie) {
      return serie.type || 'line';
    });*/
  }

  var events = ws.events(),
    container = ws.dom.cr(
      'div',
      'ws-transition ws-assigndatapanel ws-searchadvancedoptions ws-box-size'
    ),
    bar = ws.dom.cr('div', 'ws-searchadvancedoptions-bar ws-box-size'),
    body = ws.dom.cr(
      'div',
      'ws-searchadvancedoptions-body ws-box-size ws-transition'
    ),
    header = ws.dom.ap(
              ws.dom.cr('div', 'ws-searchadvancedoptions-header-container'),
              ws.dom.cr('h3', 'ws-searchadvancedoptions-header', 'Search'),
              ws.dom.cr('p', 'ws-searchadvancedoptions-header-desc')),
    labels = ws.dom.cr('div', 'ws-searchadvancedoptions-data-options'),
    searchResultContainer = ws.dom.cr('div', 'ws-searchadvancedoptions-results'),
    inputContainer = ws.dom.cr('div', 'ws-searchadvancedoptions-inputs-container'),
    searchInput = ws.dom.cr('input', 'ws-searchadvancedoptions-search ws-field-input'),
    loading = ws.dom.cr(
      'div',
      'ws-customizer-adv-loader ws-searchadvancedoptions-loading',
      '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i> Loading');

    ws.dom.style(loading, {
      opacity: 0
    });
  var searchResults = [];


  function compareValues(str, queryArr) {
    var foundCount = 0;

    queryArr.forEach(function(q) {
      if (str.indexOf(q) > - 1) {
        foundCount ++;
      }
    });

    return foundCount;
  }

  function search(node, parent, str) {

    if (parent && parent.meta.fullname && filters[parent.meta.fullname]) {
      if (node.meta && node.meta.validFor) {

        var customizedSeriesOption = advancedOptions.series;
        var found = false;
        customizedSeriesOption.forEach(function(serieOption) {
          fstate = serieOption[filters[parent.meta.fullname].controller] || filters[parent.meta.fullname].default;
          if (node.meta.validFor[fstate]) found = true;
        });

        if (!found) {
          return;
        }
      }
    }

    if (ws.isArr(node)) {
      node.forEach(function(child) {
        search(child, parent, str);
      });
    } else {
      
      if (Object.keys(node.meta.types)[0] === 'function' || (
        node.meta.products &&
        Object.keys(node.meta.products) > 0)) {
        return;
      }
      
      var foundCount = compareValues(ws.uncamelize(node.meta.name).toLowerCase(), str);
      foundCount += compareValues(ws.uncamelize(node.meta.ns).toLowerCase(), str);
      if (node.meta.description) foundCount += compareValues(ws.uncamelize(node.meta.description).toLowerCase(), str);

      if (foundCount > 0) {
        searchResults.push({
          name: ws.uncamelize(node.meta.name),
          rawName: node.meta.name,
          parents: (node.meta.ns.split('.')).map(function(e){ return ws.uncamelize(e); }),
          rawParent: (parent === null ? node.meta.name : parent.meta.ns + parent.meta.name),
          foundCount: foundCount,
          ns: node.meta.ns
        }); 
      }
      if (node.children && node.children.length > 0) {
        search(node.children, node, str);
      }
    }
  }

  ws.dom.on(searchInput, 'keyup', function(e) {
      ws.dom.style(loading, {
        opacity: 1
      });
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      const optionsAdvanced = ws.meta.optionsAdvanced.children,
      searchArray = searchInput.value.toLowerCase().split(' ');

      searchResults = [];
      optionsAdvanced.forEach(function(child) {
        search(child, null, searchArray);
      });

      resetDOM();
    }, 500);
  });

  function hide() {
    ws.dom.style(container, {
      display: 'none'
    });
  }

  function show() {
    ws.dom.style(container, {
      display: 'block'
    });
  }

  ws.dom.ap(body, header);

  function firstToLowerCase( str ) {
    return str.substr(0, 1).toLowerCase() + str.substr(1);
  }


  function highlight(input) {
    input.classList += ' active-highlight';
    setTimeout(function() {
      if (input) input.classList.remove('active-highlight');
    }, 2000);
  }

  function resetDOM() {
    searchResultContainer.innerHTML = '';
    searchResults.sort(function(a,b) {return (a.foundCount < b.foundCount) ? 1 : ((b.foundCount < a.foundCount) ? -1 : 0);} ); 
    searchResults.forEach(function(result, i) {
      if (i > 50) return;
      const resultContainer = ws.dom.cr('div', 'ws-searchadvancedoptions-result-container'),
            resultTitle = ws.dom.cr('div', 'ws-searchadvancedoptions-result-title', result.name),
            resultParents = ws.dom.cr('div', 'ws-searchadvancedoptions-result-parents', result.parents.join(' <i class="fa fa-circle ws-parent-splitter" aria-hidden="true"></i> '));
      
      ws.dom.on(resultContainer, 'click', function() {

        const parents = result.parents,
              time = 500;
        var link = '';
        
        for(var i=0; i<parents.length; i++) {
          setTimeout(function(parent) {
            link += (link !== '' ? "." : '') + firstToLowerCase(parent).replace(' ', '');
            var element = document.getElementById(link);
            if (element) {
              element.click();
            }
          }, time * i, parents[i]);
        }

        setTimeout(function(parent) {
          var input = document.getElementById(parent.rawName + '_container');
          if (input){
            input.scrollIntoView({
              block: 'end'
            });
            highlight(input);
          } else {
            //Probably a menu option
            input = document.getElementById(link + '.' + parent.rawName);
            if (input) {
              highlight(input);
            }
          }
        }, (time * parents.length) + 100, result);
      });

      ws.dom.ap(resultContainer, resultTitle, resultParents);
      ws.dom.ap(searchResultContainer, resultContainer);
    });
    
    ws.dom.style(loading, {
      opacity: 0
    });

  }

  ws.dom.ap(inputContainer, searchInput);
  ws.dom.ap(body, labels, inputContainer, searchResultContainer);
  
  ws.dom.ap(body, loading);

  ws.dom.ap(parent, ws.dom.ap(container, bar, body));

  return {
    on: events.on,
    hide: hide,
    show: show,
    resize: resize,
    setOptions: setOptions
  };
};
