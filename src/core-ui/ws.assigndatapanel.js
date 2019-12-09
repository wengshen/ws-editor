
//数据列确认
// @format

ws.AssignDataPanel = function(parent, dataTable, extraClass) {

  var defaultOptions = {
    'labels': {
      'name': "Categories",
      'desc': '为类别类型选择列。可以是名称或日期。.',
      'default': 'A',
      'value': 'A',
      'rawValue': [0],
      'previousValue': null,
      'linkedTo': 'x',
      'mandatory': true,
      'colors': {
        'light': 'rgba(66, 200, 192, 0.2)',
        'dark': 'rgb(66, 200, 192)',
      }
    },
    'values': {
      'name': "Values",
      'desc': 'Enter column with the values you want to chart.',
      'default': 'B',
      'linkedTo': 'y',
      'isData': true,
      'value': 'B',
      'rawValue': [1],
      'previousValue': null,
      'mandatory': true,
      'colors': {
        'light': 'rgba(145, 151, 229, 0.2)',
        'dark': 'rgb(145, 151, 229)',
      }
    },
    'label': {
      'name': "Label",
      'desc': 'The name of the point as shown in the legend, tooltip, data label etc.',
      'default': '',
      'value': '',
      'rawValue': null,
      'previousValue': null,
      'mandatory': false,
      'linkedTo': 'label',        
      'colors': {
        'light': 'rgba(229, 145, 145, 0.2)',
        'dark': 'rgb(229, 145, 145)',
      },
      'noNulls': true
    }
  },
  options = [],
  toggled = false,
  columnLength = 0,
  index = 0,
  maxColumnLength = 1,
  showCells = false,
  disabled = false;

  var events = ws.events(),
    container = ws.dom.cr(
      'div',
      'ws-transition ws-assigndatapanel ws-box-size ' + extraClass
    ),
    bar = ws.dom.cr('div', 'ws-assigndatapanel-bar ws-box-size ' + extraClass),
    body = ws.dom.cr(
      'div',
      'ws-assigndatapanel-body ws-box-size ws-transition ' + extraClass
    ),
    headerToggle = ws.dom.cr('span', '', '<i class="fa fa-chevron-down ws-assigndatapanel-toggle" aria-hidden="true"></i>'),
    header = ws.dom.ap(
              ws.dom.cr('div', 'ws-assigndatapanel-header-container'),
              ws.dom.ap(ws.dom.cr('h3', 'ws-assigndatapanel-header', '为此图表分配列'), headerToggle)),
    labels = ws.dom.cr('div', 'ws-assigndatapanel-data-options'),
    selectContainer = ws.dom.cr('div', 'ws-assigndatapanel-select-container'),
    changeSeriesTypeContainer = ws.dom.cr('div', 'ws-assigndatapanel-change-series-type'),
    changeSeriesTypeLink = ws.dom.cr('a', 'ws-assigndatapanel-change-series-type-link', '点击此处更改 series template 类型'),
    inputContainer = ws.dom.cr('div', 'ws-assigndatapanel-inputs-container'),
    addNewSeriesBtn = ws.dom.cr('button', 'ws-assigndatapanel-add-series', '<i class="fa fa-plus"/>'),
    deleteSeriesBtn = ws.dom.cr('button', 'ws-assigndatapanel-add-series', '<i class="fa fa-trash"/>'),
    toggleHideCellsBtn = ws.dom.cr('button', 'ws-assigndatapanel-add-series', '<i class="fa fa-eye-slash"/>'),
    seriesTypeSelect = ws.DropDown(selectContainer, ' ws-assigndatapanel-series-dropdown'),
    hidden = ws.dom.cr('div', 'ws-assigndatapanel-hide');

    ws.dom.style(hidden, {
      display: 'none'
    });
  addSerie();
  Object.keys(defaultOptions).forEach(function(key) {
    defaultOptions[key].colors = null;
  });
  
  function init(colLength) {
    columnLength = colLength;
    
    ws.dom.ap(body, labels);
    resetDOM();
    ws.dom.ap(parent, ws.dom.ap(container, bar, body));
    if (!disabled) {
      events.emit('AssignDataChanged', options[index]);
    }
  }
  
  function resetValues() {
    Object.keys(options[index]).forEach(function(key) {
      options[index][key].previousValue = null;
      options[index][key].value = options[index][key].default;
    });
  }

  function getAssignDataFields() {

    var all = [];

    options.forEach(function(option) {
      var arr = {};
      Object.keys(option).forEach(function(key) {
        if (option[key].value === '' || option[key].value === null) return;
        arr[key] = option[key].value;
      });
      all.push(ws.merge({}, arr));
    });

    return all;
  }

  function restart() {

    defaultOptions.labels.colors = {
      'light': 'rgba(66, 200, 192, 0.2)',
      'dark': 'rgb(66, 200, 192)',
    };
    
    defaultOptions.values.colors = {
      'light': 'rgba(145, 151, 229, 0.2)',
      'dark': 'rgb(145, 151, 229)',
    };
    
    defaultOptions.label.colors = {
      'light': 'rgba(229, 145, 145, 0.2)',
      'dark': 'rgb(229, 145, 145)',
    };

    index = 0,
    columnLength = 0,
    maxColumnLength = 1;
    
    options = [];
    addSerie();
    Object.keys(defaultOptions).forEach(function(key) {
      defaultOptions[key].colors = null;
    });

    resetDOM();
  }

  function getMergedLabelAndData() {
    var arr = {},
        extraColumns = [],
        values = [];

    Object.keys(options[index]).forEach(function(optionKeys) {
      if (optionKeys === 'labels') {
        arr.labelColumn = ws.getLetterIndex(options[index][optionKeys].value.charAt(0));
      } else if (options[index][optionKeys].isData) { //(ws.isArr(options[index][optionKeys])) {

        const allData = options[index][optionKeys];
        values.push(allData.rawValue[0]);
        arr.dataColumns = values;
        arr.dataColumns.sort();
      } else {
        // Check for any extra fields, eg. Name
        const extraValue = options[index][optionKeys];
        if (extraValue.value !== '') {
          extraColumns.push(ws.getLetterIndex(extraValue.value));
        }
      }
    });

    arr.extraColumns = extraColumns.sort();
    
    return arr; //arr.concat(values);
  }

  function getAllMergedLabelAndData() {
    var seriesValues = [];
    options.forEach(function(serie, i) {
      var arr = {},
      extraColumns = [],
      values = [];
      Object.keys(serie).forEach(function(optionKeys) {
          if (optionKeys === 'labels') {
            arr.labelColumn = ws.getLetterIndex(options[i][optionKeys].value.charAt(0));
          } else if (options[i][optionKeys].isData) { //(ws.isArr(options[i][optionKeys])) {
            const allData = options[i][optionKeys];
            /*
            allData.forEach(function(data) {
              values.push(data.rawValue[0]);
              arr.dataColumns = values;
            });*/
            values.push(allData.rawValue[0]);
            arr.dataColumns = values;
            arr.dataColumns.sort();
          } else {
            // Check for any extra fields, eg. Name
            const extraValue = options[i][optionKeys];
            if (extraValue.value !== '') {
              extraColumns.push(ws.getLetterIndex(extraValue.value));
            }
          }
      });
      arr.extraColumns = extraColumns.sort();
      seriesValues.push(ws.merge({}, arr));
    });
    return seriesValues;
  }

  function getLetterIndex(char) {
    return char.charCodeAt() - 65; 
  }

  function getLetterFromIndex(num) {
    return String.fromCharCode(num + 65);
  }

  function getActiveSerie() {
    return index;
  }

  function processField(input, overrideCheck, cb) {

    input.value = input.value.toUpperCase();
    var newOptions = [];

    var previousValues = [],
        values = [];
  
    if (!overrideCheck) {
      if (input.previousValue === input.value || (input.value === '' && input.previousValue === null)) return;
    }

    values = [input.value.charAt(0)];
    if (input.previousValue) previousValues = [input.previousValue];
    
    if (!input.mandatory && input.value === '') {
      values = [];
    }

    newOptions = getMergedLabelAndData();
    //else newOptions.push(ws.getLetterIndex(input.value.charAt(0)));
  
    input.previousValue = input.value.toUpperCase();
    input.rawValue = values.map(function (x) {
      return ws.getLetterIndex(x);
    });
    
    cb(previousValues.map(function (x) {
      return ws.getLetterIndex(x);
    }), input.rawValue, input, newOptions);

  }

  function getFieldsToHighlight(cb, overrideCheck, dontEmit) {
    if (!options[index]) return;
    Object.keys(options[index]).forEach(function(key) {
      var input = options[index][key];
      processField(input, overrideCheck, cb);
    });
    if (!disabled && !dontEmit) events.emit("ChangeData", options);
  }

  function generateColors() {
    const hue = Math.floor(Math.random()*(357-202+1)+202), // Want a blue/red/purple colour
          saturation =  Math.floor(Math.random() * 100),
          lightness =  60,
          alpha = 0.5;

    return {
      "light": "hsla(" + hue + ", " + saturation + "%, " + (lightness + 20) + "%, " + alpha + ")",
      "dark": "hsl(" + hue + ", " + saturation + "%, " + lightness + "%)",
    };
  }

  function addSeries(length, type) {
    if (length + 1 < options.length) {
      //Need to do some culling
      options = options.slice(0,length + 1);
      events.emit('RemoveSeries', length + 1);
      seriesTypeSelect.sliceList(length + 1);
      resetDOM();
    } else {
      for(var i=options.length - 1; i<length; i++) {
        addSerie(type);
      }
    }

    seriesTypeSelect.selectByIndex(0);
  }

  function getOptions() {
    return options[index];
  }

  function getAllOptions() {
    return options;
  }

  function resize(w, h) {
       
    ws.dom.style(container, {
      height: (h - 3) + 'px'
    });
  }

  function addSerie(seriesType, redrawDOM, skipSelect) {
    var type = seriesType;
    if (!type) type = 'line';
    
    seriesTypeSelect.addItems([{
      id: options.length,
      title: 'Series ' + (options.length + 1) + ' - ' + capitalizeFirstLetter(type)
    }]);
    if (maxColumnLength + 1 < columnLength) {
      maxColumnLength++;
    }

    const newOptions = ws.merge({}, defaultOptions);

    ws.merge(newOptions, ws.meta.charttype[type]);
    clean(newOptions);
    if (newOptions.values) {
      newOptions.values.rawValue = [maxColumnLength]; //TODO: Change later
      newOptions.values.value = getLetterFromIndex(maxColumnLength);
    }

    options.push(ws.merge({}, newOptions));
    if (!skipSelect) seriesTypeSelect.selectById(options.length - 1);
    if (redrawDOM) resetDOM();

    events.emit('AddSeries', options.length - 1, seriesType);
  }

  function hide() {
    ws.dom.style(container, {
      display: 'none'
    });
  }


  function disable() {
    ws.dom.style(hidden, {
      display: 'block'
    });
    disabled = true;
  }

  function enable() {
    ws.dom.style(hidden, {
      display: 'none'
    });
    disabled = false;
  }

  function show() {
    ws.dom.style(container, {
      display: 'block'
    });
  }
  
  function getValues(input) {
    const delimiter = (input.indexOf('-') > -1 ? '-' : ',');
    const output = input.split(delimiter).sort();

    output.forEach(function(value, index){
      output[index] = getLetterIndex(value);
    });

    return output;
  }
  
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function clean(obj) {
    Object.keys(obj).forEach(function(key) {
      if (ws.isNull(obj[key])) delete obj[key];
    });
  }

  function getSeriesType(data, index, aggregatedOptions) { 
    // Change this in future, data should handle 99% of cases but have had to use aggregatedoptions due to users setting chart type through custom code
    // Looks messy using both atm
    if (data.config) return data.config.chart.type;
    else {
      if (data.options && data.options.series && data.options.series[index] && data.options.series[index].type) return data.options.series[index].type;
      if (data.template && data.template.chart && data.template.chart.type) return data.template.chart.type;
      else if (data.options && data.options.chart && data.options.chart.type) return data.options.chart.type;
      else if (data.theme && data.theme.options.chart && data.theme.options.chart.type) return data.theme.options.chart.type;
      else if (aggregatedOptions && aggregatedOptions.chart && aggregatedOptions.chart.type) return aggregatedOptions.chart.type;
      else return 'line';
    }
  }


  function setAssignDataFields(data, maxColumns, init, seriesIndex, skipEmit, serieValue, aggregatedOptions) {
    if (!data || disabled) return;
    columnLength = maxColumns;
    var seriesType = getSeriesType(data, 0, aggregatedOptions),
        previousValues = null;
    
    seriesTypeSelect.updateByIndex(seriesIndex || index, {
      title: 'Series ' + ((seriesIndex || index) + 1) + ' - ' + capitalizeFirstLetter(seriesType)
    });
    seriesTypeSelect.selectByIndex(index);
    
    chartTypeOptions = ws.meta.charttype[seriesType.toLowerCase()];

    if (options[seriesIndex || index] && options[seriesIndex || index].values) {
      previousValues = options[seriesIndex || index].values;
    }

    options[seriesIndex || index] = null;
    options[seriesIndex || index] = ws.merge({}, defaultOptions);

    if (!isNaN(serieValue)) {
      if (options[seriesIndex || index].values) {
        options[seriesIndex || index].values.value = getLetterFromIndex(serieValue);
        options[seriesIndex || index].values.rawValue = [serieValue];
      }
    }

    if (previousValues && options[seriesIndex || index] && options[seriesIndex || index].values) {
      ws.merge(options[seriesIndex || index].values, previousValues);
    }
    /*
    if (chartTypeOptions && chartTypeOptions.data) {
      options[seriesIndex || index].data = null;
    }*/


    ws.merge(options[seriesIndex || index], ws.meta.charttype[seriesType]);
    clean(options[seriesIndex || index]);

    if (init) {

      if (data.settings && data.settings.dataProvider && data.settings.dataProvider.assignDataFields) {
        const dataFields = data.settings.dataProvider.assignDataFields;
        dataFields.forEach(function(option, index) {
          const seriesType = getSeriesType(data, index);
          if(!options[index]) {
            addSerie(seriesType);
          }
          Object.keys(option).forEach(function(key) {
            if (options[index][key]) {
              options[index][key].value = option[key];
              options[index][key].rawValue = [getLetterIndex(option[key])];
            }
          })
        });
      } else {
        // Probably a legacy chart, change values to equal rest of chart
        
        var length = maxColumns - 1;
        if (data && data.options && data.options.series) {
          length = data.options.series.length;
        }

        for(var i=1; i<length; i++) {
          const seriesType = getSeriesType(data, i, aggregatedOptions);
          if(!options[i]) {
            addSerie(seriesType, null, true);
          }
  
          options[i].labels.rawValue = [0];
          options[i].labels.value = "A";
          options[i].values.rawValue[0] = i + 1;
          options[i].values.value = getLetterFromIndex(i + 1);
        }
      }
      seriesTypeSelect.selectByIndex(0);
    }

    resetDOM();
    if (!disabled && !skipEmit) events.emit('ChangeData', options);
  }

  function checkValues(newValue, prevValue) {
    values = getValues(newValue);
    values2 = getValues(prevValue);
    if (Math.max(values[values.length - 1], values2[values2.length - 1]) - Math.min(values[0], values2[0]) <= (values[values.length - 1] - values[0]) + (values2[values2.length - 1] - values2[0])) {
      return true;
    }
    return false;
  }

  function valuesMatch(newValue, objectKey) {

    var found = false
        values = [],
        values2 = [];
    Object.keys(options[index]).some(function(key) {
      if (objectKey === key || found) return;
      /*
      if (ws.isArr(options[index][key])) {

        (options[index][key]).some(function(o) {
          if (object.id === o.id || found) return;
          found = checkValues(newValue, o.value);
          if (found) return false;
        });
      } else {*/
        found = checkValues(newValue, options[index][key].value);
        if (found) return false;
      //}

    });
    return found;

  }

  function generateInputs(option, key) {

    var labelInput,
        valueContainer = ws.dom.cr('div', 'ws-assigndatapanel-input-container');

    labelInput = ws.DropDown(valueContainer, 'ws-assigndata-dropdown');
    if(!option.mandatory){
      labelInput.addItem({
        id: '',
        title: ''
      });
    }
    for(var i = 0; i < columnLength; i++) {
      labelInput.addItem({
        id: getLetterFromIndex(i),
        title: getLetterFromIndex(i),
      });
    }
    
    labelInput.selectById(option.value);

    labelInput.on('Change', function(selected) {
      //detailIndex = selected.index();
      detailValue = selected.id();

      if (valuesMatch(detailValue, key)) {
        option.value = option.previousValue;
        labelInput.selectById(option.previousValue, true);
        alert("This column has already been assigned a value. Please select a different column");
        return;
      }
      else {
        if (detailValue !== '' && option && option.noNulls) {
          if (dataTable.areColumnsEmpty(getLetterIndex(detailValue))) {
            option.value = option.previousValue;
            labelInput.selectById(option.previousValue, true);
            alert("This column does not have any data. Please select a column with data in it");
            return;
          }
        }

        option.value = detailValue;
        option.rawValue = [getLetterIndex(option.value.toUpperCase())];
        if (getLetterIndex(option.value.toUpperCase()) > maxColumnLength) {
          maxColumnLength = getLetterIndex(option.value.toUpperCase());
        }
        
      }

      if (showCells) events.emit('ToggleHideCells', options[index], showCells);
      if (!disabled) {
        events.emit('AssignDataChanged', options[index], option, getLetterIndex(detailValue.toUpperCase()), key);
      }
      //liveDataTypeSelect.selectById(detailValue || 'json');
    });
  
    var colors = option.colors || generateColors();
    option.colors = colors;

    labelInput.value = option.value;
    const colorDiv = ws.dom.cr('div', 'ws-assigndatapanel-color');
    
    ws.dom.style(colorDiv, {
      "background-color": option.colors.light,
      "border": '1px solid ' + option.colors.dark,
    });

    var label = ws.dom.ap(ws.dom.cr('div', 'ws-assigndatapanel-data-option'),
                               colorDiv,
                               ws.dom.ap(ws.dom.cr('p', '', option.name + ':'),
                                             ws.dom.cr('span', 'ws-assigndatapanel-data-mandatory', option.mandatory ? '*' : '')),
                                             valueContainer,
                               ws.dom.cr('div', 'ws-assigndatapanel-data-desc', option.desc));
  
    ws.dom.ap(inputContainer, label);
  }

  function resetDOM() {
    inputContainer.innerHTML = '';
    if (options[index]){
      Object.keys(options[index]).forEach(function(key) {
        var option = options[index][key];
        generateInputs(option, key);
      });  
    }
  }

  function toggleCells() {
    if (showCells) {
      showCells = false;
      toggleHideCellsBtn.innerHTML = '<i class="fa fa-eye-slash">';
    } else {
      showCells = true;
      toggleHideCellsBtn.innerHTML = '<i class="fa fa-eye"/>';
    }
    events.emit('ToggleHideCells', options[index], showCells);
  }

  function checkToggleCells() {
    if (showCells) events.emit('ToggleHideCells', options[index], showCells);
  }

  function getStatus() {
    return disabled;
  }

  function addNewSerie(lastType) {
    addSerie(lastType, true);
    events.emit('AssignDataChanged');
  }

  function getElement() {
    return container;
  }

  function setColumnLength(length) {
    columnLength = length;
  }

  ////////////////////////////////////////////////////////////////////////////////
      
  ws.dom.ap(selectContainer, addNewSeriesBtn, deleteSeriesBtn, toggleHideCellsBtn);
  ws.dom.ap(changeSeriesTypeContainer, changeSeriesTypeLink);

  ws.dom.on(changeSeriesTypeLink, 'click', function() {
    events.emit('GoToTemplatePage');
  });

  ws.dom.on(toggleHideCellsBtn, 'click', function() {
    toggleCells();
  });
  
  ws.dom.on(deleteSeriesBtn, 'click', function() {
    
    if (index === 0) {
      ws.snackBar("Cannot delete this series");
      return;
    }

    if (confirm("Are you sure you want to delete this series?")) {
      options.splice(index, 1);
      seriesTypeSelect.deleteByIndex(index);
      const allSeries = seriesTypeSelect.selectAll();

      events.emit('DeleteSeries', index);
      setTimeout(function() {
        events.emit('AssignDataChanged');
      }, 1000);
  
      for(var i=index; i < options.length; i++) {
        seriesTypeSelect.updateByIndex(i, {
          title: 'Series ' + (i + 1) + ' -' + allSeries[i].title().split('-')[1]
        }, i);
      }
  
      seriesTypeSelect.selectByIndex(index - 1);
      ws.snackBar("Series " + (index + 2) + " Deleted");
    }

  });

  ws.dom.on(addNewSeriesBtn, 'click', function() {
    events.emit('GetLastType');
  });
  
  seriesTypeSelect.on('Change', function(selected) {
    if (index !== selected.id()) {
      index = selected.id();
      resetDOM();  
          
      if (showCells) events.emit('ToggleHideCells', options[index], showCells);
      if (!disabled) {
        events.emit('RedrawGrid', true);
        events.emit('SeriesChanged', index);
      }
    }
  });
  
  ws.dom.on(headerToggle, 'click', function() {

    const height = (toggled ? '48px' : 'initial');
    const overflow = (toggled ? 'hidden' : 'auto');
    
    ws.dom.style(container, {
      height: height,
      overflow: overflow
    });

    toggled = !toggled;
  });

  seriesTypeSelect.addItems([{
    id: 0,
    title: 'Series ' + (options.length) + ' - Line'
  }]);
  
  seriesTypeSelect.selectById(0);

  ws.dom.ap(body, header);
  ws.dom.ap(labels, selectContainer, changeSeriesTypeContainer, inputContainer);

  ws.dom.ap(body, hidden);

  return {
    on: events.on,
    hide: hide,
    show: show,
    getOptions: getOptions,
    resetValues: resetValues,
    resize: resize,
    getFieldsToHighlight: getFieldsToHighlight,
    getMergedLabelAndData: getMergedLabelAndData,
    getAllMergedLabelAndData: getAllMergedLabelAndData,
    setAssignDataFields: setAssignDataFields,
    getAssignDataFields: getAssignDataFields,
    getAllOptions: getAllOptions,
    getActiveSerie: getActiveSerie,
    addNewSerie: addNewSerie,
    addSeries: addSeries,
    setColumnLength: setColumnLength,
    checkToggleCells: checkToggleCells,
    init: init,
    enable: enable,
    disable: disable,
    getStatus: getStatus,
    getElement: getElement,
    restart: restart
  };
};
