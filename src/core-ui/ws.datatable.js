

// @format

function parseCSV(inData, delimiter) {
  var isStr = ws.isStr,
    isArr = ws.isArray,
    isNum = ws.isNum,
    csv = inData || '',
    result = [],
    options = {
      delimiter: delimiter
    },
    potentialDelimiters = {
      ',': true,
      ';': true,
      '\t': true
    },
    delimiterCounts = {
      ',': 0,
      ';': 0,
      '\t': 0
    };
  //The only thing CSV formats have in common..
  rows = (csv || '').replace(/\r\n/g, '\n').split('\n');
  // If there's no delimiter, look at the first few rows to guess it.

  if (!options.delimiter) {
    rows.some(function(row, i) {
      if (i > 10) return true;

      var inStr = false,
        c,
        cn,
        cl,
        token = '';

      for (var j = 0; j < row.length; j++) {
        c = row[j];
        cn = row[j + 1];
        cl = row[j - 1];

        if (c === '"') {
          if (inStr) {
            if (cl !== '"' && cn !== '"') {
              // The next non-blank character is likely the delimiter.

              while (cn === ' ') {
                cn = row[++j];
              }

              if (potentialDelimiters[cn]) {
                delimiterCounts[cn]++;
                return true;
              }

              inStr = false;
            }
          } else {
            inStr = true;
          }
        } else if (potentialDelimiters[c]) {
          if (!isNaN(Date.parse(token))) {
            // Yup, likely the right delimiter
            token = '';
            delimiterCounts[c]++;
          } else if (!isNum(token) && token.length) {
            token = '';
            delimiterCounts[c]++;
          }
        } else {
          token += c;
        }
      }
    });

    options.delimiter = ';';

    if (
      delimiterCounts[','] > delimiterCounts[';'] &&
      delimiterCounts[','] > delimiterCounts['\t']
    ) {
      options.delimiter = ',';
    }

    if (
      delimiterCounts['\t'] >= delimiterCounts[';'] &&
      delimiterCounts['\t'] >= delimiterCounts[',']
    ) {
      options.delimiter = '\t';
    }
  }

  rows.forEach(function(row, rowNumber) {
    var cols = [],
      inStr = false,
      i = 0,
      j,
      token = '',
      guessedDel,
      c,
      cp,
      cn;

    function pushToken() {
      token = (token || '').replace(/\,/g, '');
      if (!token.length) {
        token = null;
        // return;
      }

      if (isNum(token)) {
        token = parseFloat(token);
      }

      cols.push(token);
      token = '';
    }

    for (i = 0; i < row.length; i++) {
      c = row[i];
      cn = row[i + 1];
      cp = row[i - 1];

      if (c === '"') {
        if (inStr) {
          pushToken();
        } else {
          inStr = false;
        }

        //Everything is allowed inside quotes
      } else if (inStr) {
        token += c;
        //Check if we're done reading a token
      } else if (c === options.delimiter) {
        pushToken();

        //Append to token
      } else {
        token += c;
      }

      // Push if this was the last character
      if (i === row.length - 1) {
        pushToken();
      }
    }

    result.push(cols);
  });
  return result;
}

/** Data table
 *  @constructor
 *  @param {domnode} parent - the node to attach to
 *  @param {object} attributes - the properties
 */
ws.DataTable = function(parent, attributes) {
  var properties = ws.merge(
      {
        checkable: true,
        importer: {}
      },
      attributes
    ),
    events = ws.events(),
    container = ws.dom.cr('div', 'ws-dtable-container'),
    frame = ws.dom.cr('div', 'ws-dtable-table-frame ws-scrollbar'),
    movementBar = ws.dom.cr('div', 'ws-dtable-movement-bar', ''),
    table = ws.dom.cr('table', 'ws-dtable-table'),
    thead = ws.dom.cr('thead', 'ws-dtable-head'),
    tbody = ws.dom.cr('tbody', 'ws-dtable-body'),
    tableTail = ws.dom.cr(
      'div',
      'ws-dtable-table-tail',
      'Only the first 500 rows are shown.'
    ),
    colgroup = ws.dom.cr('colgroup'),
    leftBar = ws.dom.cr('div', 'ws-dtable-left-bar'),
    hideCellsDiv = ws.dom.cr('div', 'ws-dtable-hide-cells'),
    topBar = ws.dom.cr('div', 'ws-dtable-top-bar'),
    topLetterBar = ws.dom.cr('div', 'ws-dtable-top-letter-bar'),
    topColumnBar = ws.dom.cr('div', 'ws-dtable-top-column-bar'),
    topLeftPanel = ws.dom.cr('div', 'ws-dtable-top-left-panel'),
    //checkAll = ws.dom.cr('input'),
    mainInput = ws.dom.cr('textarea', 'ws-dtable-input'),
    cornerPiece = ws.dom.cr('div', 'ws-dtable-corner-piece'),
    weirdDataModal = ws.OverlayModal(false, {
      // zIndex: 20000,
      showOnInit: false,
      width: 300,
      height: 350
    }),
    weirdDataContainer = ws.dom.cr(
      'div',
      'ws-dtable-weird-data ws-box-size ws-errobar-body'
    ),
    weirdDataIgnore = ws.dom.cr(
      'button',
      'ws-ok-button',
      'No, this looks right'
    ),
    weirdDataFix = ws.dom.cr(
      'button',
      'ws-ok-button',
      'Yeah, this looks wrong'
    ),
    loadIndicator = ws.dom.cr(
      'div',
      'ws-dtable-load-indicator',
      '<i class="fa fa-spinner fa-spin fa-1x fa-fw"></i> Loading'
    ),
    dropZone = ws.dom.cr(
      'div',
      'ws-dtable-drop-zone ws-transition'
    ),
    liveDataFrame = ws.dom.cr(
      'div',
      'ws-box-size ws-dtable-gsheet-frame'
    ),
    gsheetFrame = ws.dom.cr(
      'div',
      'ws-box-size ws-dtable-gsheet-frame'
    ),
    gsheetContainer = ws.dom.cr(
      'div',
      'ws-box-size ws-prettyscroll ws-dtable-gsheet'
    ),
    liveDataContainer = ws.dom.cr(
      'div',
      'ws-box-size ws-prettyscroll ws-dtable-gsheet'
    ),
    liveDataInput = ws.dom.cr('input', 'ws-imp-input-stretch'),
    liveDataIntervalInput = ws.dom.cr('input', 'ws-imp-input-stretch'),
    liveDataTypeSelect = ws.DropDown(),

    liveDataTypeContainer = ws.dom.cr('div', 'ws-customize-group'),
    liveDataTypeMasterNode = ws.dom.cr('div', 'ws-customize-master-dropdown'),

    gsheetID = ws.dom.cr(
      'input',
      'ws-box-size ws-dtable-gsheet-id'
    ),
    gsheetWorksheetID = ws.dom.cr(
      'input',
      'ws-box-size ws-dtable-gsheet-id'
    ),
    gsheetRefreshTime = ws.dom.cr(
      'input',
      'ws-box-size ws-dtable-gsheet-id'
    ),
    gsheetStartRow = ws.dom.cr(
      'input',
      'ws-box-size ws-dtable-gsheet-id'
    ),
    gsheetEndRow = ws.dom.cr(
      'input',
      'ws-box-size ws-dtable-gsheet-id'
    ),
    gsheetStartCol = ws.dom.cr(
      'input',
      'ws-box-size ws-dtable-gsheet-id'
    ),
    gsheetEndCol = ws.dom.cr(
      'input',
      'ws-box-size ws-dtable-gsheet-id'
    ),
    gsheetCancelButton = ws.dom.cr(
      'button',
      'ws-import-button green padded',
      'Detach Sheet From Chart'
    ),
    switchRowColumns = ws.dom.cr(
      'button',
      'switch-column-button ws-template-tooltip',
      '<i class="fa fa-refresh" aria-hidden="true"></i> <span class="ws-tooltip-text ws-template-tooltip-text-left">Switch Rows/Columns</span>'
    ),
    gsheetLoadButton = ws.dom.cr(
      'button',
      'ws-import-button green padded',
      'Load Spreadsheet'
    ),
    liveDataLoadButton = ws.dom.cr(
      'button',
      'ws-import-button green padded',
      'Load Live Data'
    ),
    liveDataCancelButton = ws.dom.cr(
      'button',
      'ws-import-button green padded',
      'Cancel'
    ),
    detailValue = 0,
    isInGSheetMode = false,
    isInLiveDataMode = false,
    mainInputCb = [],
    rawCSV = false,
    mainInputCloseCb = false,
    toolbar,
    importModal = ws.OverlayModal(false, {
      minWidth: 600,
      minHeight: 600
    }),
    importer = ws.DataImporter(importModal.body, properties.importer),
    rows = [],
    gcolumns = [],
    changeTimeout = false,
    dataModal,
    surpressChangeEvents = false,
    monthNumbers = {
      JAN: 1,
      FEB: 2,
      MAR: 3,
      APR: 4,
      MAY: 5,
      JUN: 6,
      JUL: 7,
      AUG: 8,
      SEP: 9,
      OCT: 10,
      NOV: 11,
      DEC: 12
    },
    selectedRowIndex = 0,
    keyValue = "A",
    tempKeyValue = "A",
    //checkAll.type = 'checkbox',
    selectedFirstCell = [],
    selectedEndCell = [],
    selectedCopyFirstCell = [],
    selectedCopyEndCell = [],
    lastSelectedCell = [null, null],
    allSelectedCells = [],
    allSelectedCopyCells = [],
    selectedHeaders = [],
    columnsToHighlight = [],
    dataFieldsUsed = [],
    inCopyOverCellMode = false;
    moveToColumn = null,
    dragHeaderMode = false,
    globalContextMenu = ws.ContextMenu([
      {
        title: "Insert Row Above",
        icon: 'plus',
        click: function() {
          events.emit('ColumnMoving');
          addRowBefore(selectedFirstCell[1]);
          ws.emit('UIAction', 'AddRowBeforeHighlight');
          events.emit('ColumnMoved');
        }
      },
      {
        title: "Insert Row Below",
        icon: 'plus',
        click: function() {
          events.emit('ColumnMoving');
          addRowAfter(selectedEndCell[1]);
          ws.emit('UIAction', 'AddRowAfterHighlight');
          events.emit('ColumnMoved');
        }
      },
      '-',
      {
        title: 'Remove Row',
        icon: 'trash',
        click: function() {
          ws.emit('UIAction', 'BtnDeleteRow');

          if (!confirm(ws.L('dgDeleteRow'))) {
            return;
          }

          ws.emit('UIAction', 'DeleteRowConfirm');

          rows.forEach(function(row, index) {
            //if (row.isChecked()) {
              if(row.number === selectedFirstCell[1]) {
                row.destroy();
                emitChanged();
              }
            //}
          });
          rebuildRows();
        }
      },
      {
        title: ws.L('dgDelCol'),
        icon: 'trash',
        click: function() {
          if (confirm(ws.L('dgDelColConfirm'))) {
            events.emit('ColumnMoving');
            delCol(selectedFirstCell[0]);
            updateColumns();
            events.emit('ColumnMoved');
          }
        }
      },
      '-',
      {
        title: ws.L('dgInsColBefore'),
        icon: 'plus',
        click: function() {
          events.emit('ColumnMoving');
          insertCol(selectedFirstCell[0]);
          events.emit('ColumnMoved');
        }
      },
      {
        title: ws.L('dgInsColAfter'),
        icon: 'plus',
        click: function() {
          events.emit('ColumnMoving');
          insertCol(selectedFirstCell[0] + 1);
          events.emit('ColumnMoved');
        }
      }
    ]);
    
  const DEFAULT_COLUMN = 9,
        DEFAULT_ROW = 20;
    

  ws.dom.ap(hideCellsDiv, switchRowColumns)

  ws.dom.on(mainInput, 'click', function(e) {
    return ws.dom.nodefault(e);
  });

  ws.dom.style(liveDataIntervalInput, {
    padding: '8px'
  });

  var mouseDown = false;
  document.body.onmousedown = function() { 
    mouseDown = true;
  }
  document.body.onmouseup = function() {
    mouseDown = false;
  }

  document.addEventListener('keydown', function (e) {  
    if(e.keyCode === 8 || e.keyCode === 46){
      allSelectedCells.forEach(function(cell){
        cell.deleteContents();
      });
    }
  }, false);

  document.addEventListener('contextmenu', function(e) {
    if (e.path && e.path.indexOf(container) > -1) {
      globalContextMenu.show(e.clientX, e.clientY, true);
      return ws.dom.nodefault(e);
    }
  }, false);

  ws.dom.on(document.querySelector('body'), 'click', function(){
    globalContextMenu.hide();
  });

  ws.dom.on(cornerPiece, 'mousedown', function(e){
    inCopyOverCellMode = true;
    deselectAllCells();
  });


  ws.dom.ap(frame, cornerPiece);
  ////////////////////////////////////////////////////////////////////////////

  // Handle drag 'n drop of files
  function handleFileUpload(f, cb) {
    if (f.type !== 'text/csv') {
      return ws.snackBar('The file is not a valid CSV file');
    }

    var reader = new FileReader();

    reader.onload = function(e) {
      clear();
      //events.emit('ClearSeriesForImport');
      loadCSV({ csv: e.target.result }, null, true, cb);
    };

    reader.readAsText(f);
  }

  frame.ondrop = function(e) {
    e.preventDefault();

    var d = e.dataTransfer;
    var f;
    var i;

    if (d.items) {
      for (i = 0; i < d.items.length; i++) {
        f = d.items[i];
        if (f.kind === 'file') {
          handleFileUpload(f.getAsFile());
        }
      }
    } else {
      for (i = 0; i < d.files.length; i++) {
        f = d.files[i];
        handleFileUpload(f);
      }
    }
  };

  frame.ondragover = function(e) {
    e.preventDefault();
  };

  ////////////////////////////////////////////////////////////////////////////

  function showDataImportError() {
    ws.dom.style(weirdDataContainer, {
      display: 'block'
    });
  }

  function hideDataImportError() {
    ws.dom.style(weirdDataContainer, {
      display: 'none'
    });
  }

  function emitChanged(noDelay) {
    window.clearTimeout(changeTimeout);

    if (isInGSheetMode) {
      return;
    }
    if (isInLiveDataMode) {
      return;
    }

    if (surpressChangeEvents) {
      return;
    }

    if (noDelay) {
      return events.emit('Change', getHeaderTextArr(), toData());
    }

    //We use an interval to stop a crazy amount of changes to be
    //emitted in succession when e.g. loading sets.
    changeTimeout = window.setTimeout(function() {
      if (!isInGSheetMode && !isInLiveDataMode) {
        events.emit('Change', getHeaderTextArr());
      }
    }, 1000);
  }

  function makeEditable(target, value, fn, keyup, close, dontFocus) {
    
    if (mainInputCb.length) {
      mainInputCb = mainInputCb.filter(function(fn) {
        fn();
        return false;
      });
    }

    if (mainInputCloseCb) {
      mainInputCloseCb();
    }

    mainInputCloseCb = close;

    mainInput.value = value;
    //mainInput.setSelectionRange(0, mainInput.value.length);

    mainInputCb.push(
      ws.dom.on(mainInput, 'keydown', function(e) {
        //(ws.isFn(fn) && fn(mainInput.value));
        if (ws.isFn(keyup)) {
          return keyup(e);
        }
      })
    );

    mainInputCb.push(
      ws.dom.on(mainInput, 'keyup', function(e) {
        // Super hack to allow pasting CSV into cells
        var ps = ws.parseCSV(mainInput.value);
        if (ps.length > 1) { //TODO: Need to fix this...
          if (
            confirm(
              'You are about to load CSV data. This will overwrite your current data. Continue?'
            )
          ) {
            rawCSV = mainInput.value;
            ws.emit('UIAction', 'PasteCSVAttempt');
             loadCSV({
               csv: rawCSV
              }, null, true, function() {

            });
            /*
            return loadRows(ps, function() {
              if (rows.length > 0) rows[0].columns[0].focus();
              events.emit('InitLoaded');
              events.emit('AssignDataForFileUpload', rows[0].length);
            });*/
          }
          return;
        }

        return ws.isFn(fn) && fn(mainInput.value);
      })
    );
    
    ws.dom.ap(target, mainInput);

    if (!dontFocus) mainInput.focus();

  }

  ////////////////////////////////////////////////////////////////////////////
  function highlightLeft(colNumber) {
    columnsToHighlight.forEach(function(highlightedColumn) {
      highlightedColumn.element.classList.remove('highlight-right');
    });
    
    rows.forEach(function(row) {
      if (row.columns[colNumber].element.className.indexOf('highlight-right') === -1) {
        row.columns[colNumber].element.className += ' highlight-right';
        columnsToHighlight.push(row.columns[colNumber]);
      }
    });

    if (gcolumns[colNumber].header.className.indexOf('highlight-right') === -1) {
      gcolumns[colNumber].header.className += ' highlight-right';
      columnsToHighlight.push({
        element: gcolumns[colNumber].header
      });
    }

    if (gcolumns[colNumber].letter.className.indexOf('highlight-right') === -1) {
      gcolumns[colNumber].letter.className += ' highlight-right';
      columnsToHighlight.push({
        element: gcolumns[colNumber].letter
      });
      moveToColumn = colNumber;
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  function Column(row, colNumber, val, keyVal) {

    var value = typeof val === 'undefined' || typeof val === 'object' || (val === 'null') ? null : val, //object check for ie11/edge
      col = ws.dom.cr('td', 'ws-dtable-cell'),
      colVal = ws.dom.cr('div', 'ws-dtable-col-val', value),
      input = ws.dom.cr('input'),
      exports = {};
    function goLeft() {
      if (colNumber >= 1) {
        row.columns[colNumber - 1].focus();
      } else {
        //Go up to the last column
        if (row.number - 1 >= 0) {
          rows[row.number - 1].columns[
            rows[row.number - 1].columns.length - 1
          ].focus();
        }
      }
    }

    function goRight() {
      if (colNumber < row.columns.length - 1) {
        row.columns[colNumber + 1].focus();
      } else {
        //Go down on the first column
        if (row.number < rows.length - 1) {
          rows[row.number + 1].columns[0].focus();
        }
      }
    }

    function goUp() {
      if (row.number > 0 && rows[row.number - 1].columns.length > colNumber) {
        rows[row.number - 1].columns[colNumber].focus();
      }
    }

    function goBelow() {
      if (
        row.number < rows.length - 1 &&
        rows[row.number + 1].columns.length > colNumber
      ) {
        rows[row.number + 1].columns[colNumber].focus();
      }
    }

    function handleKeyup(e) {
      //Go the the column to the left
      if (e.keyCode === 37) {
        goLeft();
        return ws.dom.nodefault(e);

        //Go to the column above
      } else if (e.keyCode === 38) {
        goUp();
        return ws.dom.nodefault(e);

        //Go to the column to the right
      } else if (e.keyCode === 39 || e.keyCode === 9) {
        goRight();
        return ws.dom.nodefault(e);

        //Go to the column below
      } else if (e.keyCode === 40) {
        goBelow();
        return ws.dom.nodefault(e);

        //Go to next row
      } else if (e.keyCode === 13) {
        //If we're standing in the last column of the last row,
        //insert a new row.
        if (row.number === rows.length - 1) {
          // && colNumber === rows.columns.length - 1) {
          events.emit('ColumnMoving');
          addRow();
          rows[row.number + 1].columns[0].focus();
          events.emit('ColumnMoved');
    
        } else {
          goBelow();
        }
        return ws.dom.nodefault(e);
      }
    }

    function selContents() {
      input.setSelectionRange(0, input.value.length);
    }

    function deleteContents() {
      colVal.innerHTML = '';
      mainInput.value = '';
      value = null;
      emitChanged();
    }

    function setValue(newValue) {
      colVal.innerHTML = newValue;
      mainInput.value = newValue;
      value = newValue;
      emitChanged();
    }

    function focus(dontFocus) {

      deselectAllCells();

      function checkNull(value) {
        return value === null || value === '';
      }
      mainInput.className = 'ws-dtable-input';
      mainInput.draggable = false;

      ws.dom.on(mainInput, 'dragstart', function(e){
        ws.dom.nodefault(e);
        return false;
      });
      ws.dom.on(mainInput, 'ondrop', function(e){
        ws.dom.nodefault(e);
        return false;
      });

      makeEditable(
        col,
        value,
        function(val) {
          var changed = value !== val;
          value = checkNull(val) ? null : val;
          colVal.innerHTML = value;
          if (changed) {
            emitChanged();
          }
        },
        handleKeyup,
        dontFocus
      );



      ws.dom.style(cornerPiece, {
        top: ((ws.dom.pos(col).y + ws.dom.size(col).h - 3)) + "px",
        left: ((ws.dom.pos(col).x + ws.dom.size(col).w - 3)) + "px",
        display: "block"
      });

      row.select();
    }

    function deselectCell() {
      col.classList.remove('cell-selected');
    }

    function deselectCopyCell() {
      col.classList.remove('cell-copy-selected');
    }

    function selectCell() {
      if(col.className.indexOf('cell-selected') === -1) {
        col.className += ' cell-selected';
        if (allSelectedCells.indexOf(exports) === -1) allSelectedCells.push(exports);
      }
    }

    function select() {
      selectedEndCell[0] = colNumber;
      selectedEndCell[1] = row.number; 

      selectNewCells(selectedFirstCell, selectedEndCell);
    }

    function selectCellToCopy() {
      if(col.className.indexOf('cell-copy-selected') === -1) {
        col.className += ' cell-copy-selected';
        if (allSelectedCopyCells.indexOf(exports) === -1) allSelectedCopyCells.push(exports);
      }
    }

    function destroy() {
      row.node.removeChild(col);
      col.innerHTML = '';
      colVal.innerHTML = '';
    }

    function getVal() {
      return value;
    }

    function addToDOM(me) {
      colNumber = me || colNumber;
      ws.dom.ap(row.node, ws.dom.ap(col, colVal));
    }

    ws.dom.on(col, 'mouseup', function(e) {
      if (inCopyOverCellMode) {
        inCopyOverCellMode = false;
        
        const newValue = rows[selectedCopyFirstCell[1]].columns[selectedCopyFirstCell[0]].value();
        allSelectedCopyCells.forEach(function(cell) {
          cell.setValue(newValue);
          cell.deselectCopyCell();
        });

        allSelectedCopyCells = [];

      }
      else if (selectedFirstCell[0] === selectedEndCell[0] && 
          selectedFirstCell[1] === selectedEndCell[1]) {
            //Have not dragged anywhere else on the grid. So the user has just clicked on a cell.
            
          lastSelectedCell[0] = colNumber;
          lastSelectedCell[1] = row.number;
          selectedCopyFirstCell[0] = selectedFirstCell[0];
          selectedCopyFirstCell[1] = selectedFirstCell[1];
          selectedCopyEndCell[1] = selectedEndCell[1];
          selectedCopyEndCell[0] = selectedEndCell[0];
          selectedHeaders = [];
          focus();
          globalContextMenu.hide();
      }
    });

    ws.dom.on([col, colVal], 'mouseover', function(e) {
      if(mouseDown) {
        if (inCopyOverCellMode) {

          if (colNumber === selectedCopyEndCell[0]) {
            selectedCopyEndCell[1] = row.number;
            selectedCopyEndCell[0] = selectedCopyFirstCell[0];
          } else if (selectedCopyEndCell[1] === row.number) {
            selectedCopyEndCell[1] = selectedCopyFirstCell[1];
            selectedCopyEndCell[0] = colNumber;
          }

          selectCellsToMove(selectedCopyFirstCell, selectedCopyEndCell);

        } else if (dragHeaderMode) {
          highlightLeft(colNumber);
        } else {
          select();      
        }
      }
    });
    ws.dom.on(col, 'mousedown', function() {
      if (lastSelectedCell[0] !== colNumber && lastSelectedCell[1] !== row.number) {
        focus();
      }
    
      selectedFirstCell[0] = colNumber;//keyVal; 
      selectedEndCell[0] = colNumber;//keyVal; 
      selectedFirstCell[1] = row.number; 
      selectedEndCell[1] = row.number;                   
      
      selectedCopyFirstCell[0] = selectedFirstCell[0];
      selectedCopyFirstCell[1] = selectedFirstCell[1];
      selectedCopyEndCell[1] = selectedEndCell[1];
      selectedCopyEndCell[0] = selectedEndCell[0];

    });

    if (rows.length <= 500) {
      addToDOM();
    }

    exports = {
      focus: focus,
      value: getVal,
      destroy: destroy,
      addToDOM: addToDOM,
      selectCell: selectCell,
      deleteContents: deleteContents,
      deselectCell: deselectCell,
      deselectCopyCell: deselectCopyCell,
      element: col,
      setValue: setValue,
      rowNumber: row.number,
      colNumber: colNumber,
      selectCellToCopy: selectCellToCopy,
      updateColNumber: function(i){
        colNumber = i;
        exports.colNumber = i;
      }
    };

    return exports;
  }

  function deselectAllCells() {

    allSelectedCells.forEach(function(cells) {
      cells.deselectCell();
    });
    
    allSelectedCells = [];
    selectedEndCell[0] = null;
    selectedEndCell[1] = null;
    selectedFirstCell[0] = null;
    selectedFirstCell[1] = null;
  }

  function selectCellsToMove(firstCell, endCell){ // selectedCopyFirstCell, selectedCopyEndCell

    allSelectedCopyCells = allSelectedCopyCells.filter(function(cell) {
      if ((cell.rowNumber > endCell[1] || cell.colNumber > endCell[0]) || (cell.rowNumber < firstCell[1] || cell.colNumber < firstCell[0])) {
        cell.deselectCopyCell();
        return false;
      }

      return cell;
    });

    var tempColValue,
        lowCell,
        highCell,
        cell;

    if (firstCell[0] <= endCell[0]) {
      tempColValue = firstCell[0];
      cell = endCell;
    } else if (firstCell[0] > endCell[0]) {
      tempColValue = endCell[0];      
      cell = firstCell;
    }

    lowCell = (firstCell[1] > endCell[1] ? endCell : firstCell);
    highCell = (firstCell[1] < endCell[1] ? endCell : firstCell);
    

    while(tempColValue <= cell[0]) {
      for(var i = lowCell[1];i<= highCell[1]; i++) {
        if (rows[i]) rows[i].columns[tempColValue].selectCellToCopy();
      }
      tempColValue++;
    }

  }

  function selectNewCells(firstCell, endCell) { //firstCell, endCell
    
    if (firstCell.length === 0 || endCell.length === 0 ||   // Weird bug when opening the console and hovering over cells
      (firstCell[0] === null || firstCell[1] === null)
    ) return;

    allSelectedCells = allSelectedCells.filter(function(cell) {
      if ((cell.rowNumber > endCell[1] || cell.colNumber > endCell[0]) || (cell.rowNumber < firstCell[1] || cell.colNumber < firstCell[0])) {
        cell.deselectCell();
        return false;
      }

      return cell;
    });

    var tempColValue,
        lowCell,
        highCell,
        cell;

    if (firstCell[0] <= endCell[0]) {
      tempColValue = firstCell[0];
      cell = endCell;
    } else if (firstCell[0] > endCell[0]) {
      tempColValue = endCell[0];      
      cell = firstCell;
    }

    lowCell = (firstCell[1] > endCell[1] ? endCell : firstCell);
    highCell = (firstCell[1] < endCell[1] ? endCell : firstCell);
    
    while(tempColValue <= cell[0]) {
      for(var i = lowCell[1];i<= highCell[1]; i++) {
        if (rows[i]) rows[i].columns[tempColValue].selectCell();
      }
      tempColValue++;
    }
  }

  ////////////////////////////////////////////////////////////////////////////

  function Row(skipAdd) {
    var columns = [],
      row = ws.dom.cr('tr'),
      leftItem = ws.dom.cr('div', 'ws-dtable-left-bar-row', ''),
      checker = ws.dom.cr('div', 'ws-dtable-row'),
      checked = false,
      didAddHTML = false,
      exports = {};

    ws.dom.on(leftItem, 'mouseover', function(e) {
      if(mouseDown) {
          selectedEndCell[1] = checker.value;
          selectNewCells(selectedFirstCell, selectedEndCell);
      }
    });    
    
    ws.dom.on(leftItem, 'mousedown', function(e) {
      //if (e.button === 2 && selectedFirstCell.length > 0 && selectedEndCell.length > 0 && selectedFirstCell[0] === 0 && selectedEndCell[0] === (rows[0].columns.length - 1)) {
      deselectAllCells();
    
      selectedFirstCell[0] = 0
      selectedEndCell[0] = rows[0].columns.length - 1;
      selectedFirstCell[1] = e.target.value; 
      selectedEndCell[1] = e.target.value;

      selectNewCells(selectedFirstCell, selectedEndCell);

    });

    function addCol(val, keyValue) {
      columns.push(Column(exports, columns.length, val, keyValue));
    }

    function insertCol(where) {
      var col = Column(exports, columns.length);
      columns.splice(where, 0, col);
    }

    function select() {
      var o = tbody.querySelector('.ws-dtable-body-selected-row');
      if (o) {
        o.className = '';
      }
      row.className = 'ws-dtable-body-selected-row';
      selectedRowIndex = exports.rowIndex;
    }

    function isChecked() {
      return checked;
    }

    function check(state) {
      checker.checked = checked = state;
    }

    function destroy() {
      if (didAddHTML) {
        leftBar.removeChild(leftItem);
        tbody.removeChild(row);
        row.innerHTML = '';
      }

      rows = rows.filter(function(b) {
        return b !== exports;
      });

      if (rows.length < 2) {
        showDropzone();
      }
    }

    function addToDOM(number) {
      didAddHTML = true;
      exports.number = number;
      checker.innerHTML = number + 1;
      checker.value = number;
      leftItem.value = number;
      ws.dom.ap(tbody, row);

      ws.dom.ap(leftBar, ws.dom.ap(leftItem, checker));
    }

    function rebuildColumns() {
      row.innerHTML = '';
      columns.forEach(function(col, i) {
        col.updateColNumber(i);
        col.addToDOM(i);
      });
    }

    function delCol(which) {
      if (which >= 0 && which < columns.length) {
        columns[which].destroy();
        columns.splice(which, 1);
      }
    }

    ws.dom.on(checker, 'change', function() {
      checked = checker.checked;
    });
    if (rows.length < 500) {
      addToDOM(rows.length);
    } else if (rows.length === 500) {
      ws.dom.style(tableTail, {
        display: 'block'
      });
    }

    exports = {
      destroy: destroy,
      select: select,
      columns: columns,
      number: rows.length,
      addCol: addCol,
      isChecked: isChecked,
      check: check,
      node: row,
      addToDOM: addToDOM,
      insertCol: insertCol,
      rebuildColumns: rebuildColumns,
      delCol: delCol,
      rowIndex: rows.length
    };

    if (!skipAdd) {
      rows.push(exports);
    }

    resize();

    return exports;
  }

  ////////////////////////////////////////////////////////////////////////////

  function rebuildRows() {
    rows.forEach(function(row, i) {
      if (rows.length < 500) {
        row.addToDOM(i);
      }
      row.rowIndex = i;
    });
    emitChanged();
  }

  function rebuildColumns() {
    rows.forEach(function(row) {
      row.rebuildColumns();
    });
  }

  function addRowBefore(index) {
    if (index > 0 && index < rows.length) {
      rows.splice(index - 0, 0, addRow(true, true));
      rebuildRows();
    }
  }

  function addRowAfter(index) {
    if (index >= 0 && index < rows.length) {
      rows.splice(index + 1, 0, addRow(true, true));
      rebuildRows();
    }
  }

  function init() {
    clear();
    surpressChangeEvents = true;

    setTimeout(function(){ events.emit('InitLoaded'); }, 10);
    
    for (var i = 0; i < DEFAULT_ROW; i++) {
      var r = Row(false, keyValue);
    }

    tempKeyValue = "A";
    for (var j = 0; j < DEFAULT_COLUMN; j++) {
      addCol('Column ' + (j + 1));
    }
    ws.dom.ap(colgroup, ws.dom.cr('col'));
    resize();
    surpressChangeEvents = false;
  }

  function updateColumns() {
    colgroup.innerHTML = '';
    topColumnBar.innerHTML = '';
    topLetterBar.innerHTML = '';
    var resetLetters = 'A';
    
    gcolumns.forEach(function(col, i) {      
      col.colNumber = i;
      col.setLetter(resetLetters);
      resetLetters = getNextLetter(resetLetters);
      col.addToDOM();

    });

    rebuildColumns();

    ws.dom.ap(colgroup, ws.dom.cr('col'));
    resize();
  }

  function getNextLetter(key) {
    if (key === 'Z' || key === 'z') {
      return String.fromCharCode(key.charCodeAt() - 25) + String.fromCharCode(key.charCodeAt() - 25);
    } else {
      var lastChar = key.slice(-1);
      var sub = key.slice(0, -1);
      if (lastChar === 'Z' || lastChar === 'z') {
        return getNextLetter(sub) + String.fromCharCode(lastChar.charCodeAt() - 25);
      } else {
        return sub + String.fromCharCode(lastChar.charCodeAt() + 1);
      }
    }
    return key;
  };

  function addCol(value, where) {
    //The header columns control the colgroup
    var col = ws.dom.cr('col'),
      colNumber = gcolumns.length,
      header = ws.dom.cr('span', 'ws-dtable-top-bar-col'),
      letter = ws.dom.cr('span', 'ws-dtable-top-bar-letter'),
      headerTitle = ws.dom.cr('div', '', (typeof value === 'undefined' || value === 'null' ? null : value)),
      moveHandle = ws.dom.cr('div', 'ws-dtable-resize-handle'),
      options = ws.dom.cr(
        'div',
        'ws-dtable-top-bar-col-options fa fa-chevron-down'
      ),
      exports = {
        col: col,
        header: header,
        headerTitle: headerTitle,
        colNumber: gcolumns.length,
        letter: letter,
        test: true
      },
      mover = ws.Movable(
        moveHandle,
        'X',
        false,
        false,
        {
          x: 20,
          y: 0
        },
        true
      ),
      ctx = ws.ContextMenu([
        {
          title: ws.L('dgSortAsc'),
          icon: 'sort-amount-asc',
          click: function() {
            sortRows(exports.colNumber, 'asc');
          }
        },
        {
          title: ws.L('dgSortDec'),
          icon: 'sort-amount-desc',
          click: function() {
            sortRows(exports.colNumber, 'desc');
          }
        },
        '-',
        {
          title: ws.L('dgSortAscMonth'),
          icon: 'sort-amount-asc',
          click: function() {
            sortRows(exports.colNumber, 'asc', true);
          }
        },
        {
          title: ws.L('dgSortDecMonth'),
          icon: 'sort-amount-desc',
          click: function() {
            sortRows(exports.colNumber, 'desc', true);
          }
        },
        '-',
        {
          title: ws.L('dgDelCol'),
          icon: 'trash',
          click: function() {
            if (confirm(ws.L('dgDelColConfirm'))) {
              delCol(exports.colNumber);
            }
          }
        },
        // {
        //     title: 'Clone Column',
        //     icon: 'clone'
        // },
        '-',
        {
          title: ws.L('dgInsColBefore'),
          icon: 'plus',
          click: function() {

            events.emit('ColumnMoving');
            insertCol(exports.colNumber);
            events.emit('ColumnMoved')
          }
        },
        {
          title: ws.L('dgInsColAfter'),
          icon: 'plus',
          click: function() {
            events.emit('ColumnMoving');
            insertCol(exports.colNumber + 1);
            events.emit('ColumnMoved')
          }
        }
      ]),
      ox,
      keyCell = ws.dom.cr('span', 'ws-dtable-cell-value', keyValue);

    //letter.innerHTML = keyValue;
    letter.value = ws.getLetterIndex(keyValue);

    exports.setLetter = function (str) {
      keyCell.innerHTML = str;
      letter.value = ws.getLetterIndex(str);
      //exports.colNumber = ws.getLetterIndex(str);
    }

    exports.hideColumns = function() {
      if (!col.classList.contains('cell-hide')) {
        col.classList.add('cell-hide');
        header.classList.add('cell-hide');
        letter.classList.add('cell-hide');
      }
    }

    exports.showColumns = function() {
      if (col.classList.contains('cell-hide')) {
        col.classList.remove('cell-hide');
        header.classList.remove('cell-hide');
        letter.classList.remove('cell-hide');
      }
    }

    ws.dom.on(letter, 'mouseover', function(e) {
      if(mouseDown && (e.target !== options && e.target !== moveHandle)) {
        if (dragHeaderMode) {
          if (movementBar.className.indexOf('active') === -1) {
            movementBar.className += ' active'; 
            ws.dom.style(movementBar, {
              width: 140 * ((selectedHeaders[0] < selectedHeaders[1] ? selectedHeaders[1] - selectedHeaders[0]  : selectedHeaders[0] - selectedHeaders[1]) +1) + 'px'
              //width: 140 * selectedHeaders.length + 'px'
            });
          }
          highlightLeft(letter.value);
          
          ws.dom.style(movementBar, {
            left: (e.clientX - ws.dom.size(movementBar).w / 2) + 'px'
          });
        } else {
          selectedEndCell[0] = letter.value;
          selectedHeaders[1] = letter.value;
          selectNewCells(selectedFirstCell, selectedEndCell);
        }
      }
    });    
    
    ws.dom.on(letter, 'mousedown', function(e) {

      deselectAllCells();
      
      if (selectedHeaders.length > 0 && ( e.target.value >= selectedHeaders[0] && e.target.value <= selectedHeaders[1])) {
        //User is trying to drag headers left and right.
        dragHeaderMode = true;
      } else {
        //deselectAllCells();
        if(e.target !== options && e.target !== moveHandle) {
          selectedHeaders = [];

          selectedHeaders[0] = e.target.value;
          selectedHeaders[1] = e.target.value;

          selectedFirstCell[0] = e.target.value;
          selectedEndCell[0] = e.target.value;
          selectedFirstCell[1] = 0; 
          selectedEndCell[1] = rows.length - 1; 
          selectNewCells(selectedFirstCell, selectedEndCell);
        }
      }
    });

    ws.dom.on(container, 'mouseover', function(e) {
      if (dragHeaderMode) {
        ws.dom.style(movementBar, {
          left: (e.clientX - ws.dom.size(movementBar).w / 2) + 'px'
        });
      } 
    });

    function shuffleArray(arr, min, amount, moveTo) {
      var x = arr.splice(min, amount);
      var args = [moveTo, 0].concat(x);
      Array.prototype.splice.apply(arr, args);
    }

    function moveCells() {
      
      if (moveToColumn !== null) {    
        events.emit('ColumnMoving');
        
        const min = selectedHeaders[0/*(moveToColumn < selectedHeaders[0] ? 1 : 0)*/],
              max = (selectedHeaders[0] < selectedHeaders[1] ? selectedHeaders[1] - selectedHeaders[0]  : selectedHeaders[0] - selectedHeaders[1]) +1,
              total = (selectedHeaders[0] < selectedHeaders[1] ? selectedHeaders[1] - selectedHeaders[0]  : selectedHeaders[0] - selectedHeaders[1]);

        shuffleArray(gcolumns, min, max, (moveToColumn < selectedHeaders[0] ? moveToColumn + 1 : moveToColumn - total));

        rows.forEach(function(row) {
          shuffleArray(row.columns, min, max, (moveToColumn < selectedHeaders[0] ? moveToColumn + 1 : moveToColumn - total));
        });

        if (rows.length > 0) rows[0].columns[0].focus();
        updateColumns();
        emitChanged();
        events.emit('ColumnMoved');
      }
    }

    ws.dom.on(container, 'mouseup', function(e) {
      if (dragHeaderMode) {

        moveCells();
        selectedHeaders = [];
        dragHeaderMode = false;
        movementBar.classList.remove('active');
        columnsToHighlight.forEach(function(highlightedColumn) {
          highlightedColumn.element.classList.remove('highlight-right');
        });
        columnsToHighlight = [];
        moveToColumn = null;
      }
      globalContextMenu.hide();
    })

    ws.dom.on(header, 'mouseover', function(e) {
      if(mouseDown) {
        if (dragHeaderMode) {
          highlightLeft(exports.colNumber);
        }
      }
    });

    
    keyValue = getNextLetter(keyValue);
    ////////////////////////////////////////////////////////////////////////
    exports.addToDOM = function() {

      ws.dom.ap(colgroup, col);
      ws.dom.ap(
        topLetterBar,
        ws.dom.ap(letter, keyCell, options, moveHandle)
      );

      ws.dom.ap(
        topColumnBar,
        ws.dom.ap(header, headerTitle)
      );
    };

    exports.destroy = function() {
      colgroup.removeChild(col);
      topColumnBar.removeChild(header);
      topLetterBar.removeChild(letter);

      gcolumns = gcolumns.filter(function(b) {
        return b !== exports;
      });

    };

    ////////////////////////////////////////////////////////////////////////

    exports.addToDOM();

    // ws.dom.showOnHover(header, options);

    col.width = 140;
    ws.dom.style([col, header, letter], {
      width: col.width + 'px',
      'max-width': col.width + 'px'
    });

    mover.on('StartMove', function(x) {
      ox = x;

      if (!header.classList.contains('no-transition')) {
        header.classList += ' no-transition';
        letter.classList += ' no-transition';
        col.classList += ' no-transition';
      }

      if (rows.length > 0) rows[0].columns[0].focus();
      ws.dom.style(cornerPiece, {
        display: 'none'
      })

      ws.dom.style(document.body, {
        cursor: 'ew-resize'
      });
    });

    mover.on('Moving', function(x) {
      col.width = x;

      ws.dom.style(cornerPiece, {
        display: 'none'
      })

      ws.dom.style([col, header, letter], {
        width: x + 'px',
        'max-width': x + 'px'
      });

      moveHandle.className =
        'ws-dtable-resize-handle ws-dtable-resize-handle-moving';
    });

    mover.on('EndMove', function(x) {
      ws.dom.style(document.body, {
        cursor: ''
      });

      if (header.classList.contains('no-transition')) {
        header.classList.remove('no-transition');
        letter.classList.remove('no-transition');
        col.classList.remove('no-transition');
      }

      moveHandle.className = 'ws-dtable-resize-handle';
      if (rows.length > 0) rows[0].columns[0].focus();
    });

    ws.dom.on(options, 'click', function(e) {
      ctx.show(e.clientX, e.clientY);
      return ws.dom.nodefault(e);
    });

    ws.dom.on(header, 'click', function(e) {
      //Ugly.
      mainInput.className = 'ws-dtable-input ws-dtable-input-header';
      //Spawn an edit box in the node

      ws.dom.style(cornerPiece, {
        display: "none"
      });
      deselectAllCells();

      makeEditable(
        header,
        value,
        function(val) {
          headerTitle.innerHTML = value = val;
          emitChanged();
        },
        function(e) {
          if (e.keyCode === 13) {
            mainInput.className = 'ws-dtable-input';
            header.removeChild(mainInput);
          }
        }
      );
    });

    rows.forEach(function(row) {
      if (where) {
        row.insertCol(where);
      } else {
        row.addCol(null, tempKeyValue);
      }

      tempKeyValue = getNextLetter(tempKeyValue);
    });

    if (!isNaN(where)) {
      gcolumns.splice(where, 0, exports);
    } else {
      gcolumns.push(exports);
    }

    emitChanged();
  }

  function showDropzone() {
    ws.dom.style(dropZone, {
      opacity: 1
    });
  }

  function hideDropzone() {
    ws.dom.style(dropZone, {
      opacity: 0
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  // PUBLIC FUNCTIONS FOLLOW

  /** Sort rows
   * @memberof ws.DataTable
   * @param column {number} - the column to sort on
   * @param direction {string} - the direction: `asc` or `desc`
   * @param asMonths {boolean} - if true, sort by month
   */
  function sortRows(column, direction, asMonths) {
    tbody.innerHTML = '';

    direction = (direction || '').toUpperCase();
    rows.sort(function(a, b) {
      var ad = a.columns[column].value(),
        bd = b.columns[column].value();

      if ((ws.isNum(ad) && ws.isNum(bd)) || asMonths) {
        if (asMonths) {
          ad = monthNumbers[ad.toUpperCase().substr(0, 3)] || 13;
          bd = monthNumbers[bd.toUpperCase().substr(0, 3)] || 13;
        } else {
          ad = parseFloat(ad);
          bd = parseFloat(bd);
        }

        if (direction === 'ASC') {
          return ad - bd;
        }
        return bd < ad ? -1 : bd > ad ? 1 : 0;
      }

      if (direction === 'ASC') {
        if (!ad) return bd;
        return ad.localeCompare(bd);
      }

      if (bd) {
        if (!ad) return bd;
        return bd.localeCompare(ad);
      }
       else {
         if (ad) return ad.localeCompare(bd);
       }
      
    });

    rebuildRows();

    if (rows.length > 0) rows[0].columns[column].focus();
    emitChanged();
  }

  /** Clear the table
   * @memberof ws.DataTable
   */
  function clear(noWait) {
    rows = rows.filter(function(row) {
      row.destroy();
      return false;
    });

    gcolumns = gcolumns.filter(function(row) {
      //Destroy col here
      return false;
    });

    tbody.innerHTML = '';
    leftBar.innerHTML = '';
    topColumnBar.innerHTML = '';
    topLetterBar.innerHTML = '';
    colgroup.innerHTML = '';
    keyValue = "A";

    ws.dom.style(tableTail, {
      display: ''
    });

    events.emit('ClearData', true);

    emitChanged(noWait);
    showDropzone();
  }

  /** Add a new row
   * @memberof ws.DataTable
   */
  function addRow(supressChange, skipAdd) {
    var r = Row(skipAdd);

    gcolumns.forEach(function() {
      r.addCol();
    });

    if (!supressChange) {
      emitChanged();
    }
    if (rows.length > 1) {
      hideDropzone();
    }

    return r;
  }

  /** Insert a new column
   * @memberof ws.DataTable
   * @param {number} where - is the position where to add it
   */
  function insertCol(where) {
    if (where === null) where = gcolumns.length;
    if (where <= 0) where = 0;
    if (where >= gcolumns.length) where = gcolumns.length;
    //Insert into gcolumns and on each row, then call updateColumns()
    addCol(ws.L('dgNewCol'), where);

    updateColumns();
  }

  /** Delete a column
   * @memberof ws.DataTable
   * @param {number} which - the index of the column to delete
   */
  function delCol(which) {
    if (which >= 0 && which < gcolumns.length) {
      rows.forEach(function(row) {
        row.delCol(which);
      });

      gcolumns[which].destroy();

      updateColumns();
      emitChanged();
    }
  }

  /** Resize the table based on the container size
   *  @memberof ws.DataTable
   */
  function resize() {
    var ps = ws.dom.size(parent),
      hs = ws.dom.size(topBar);
      //tb = ws.dom.size(toolbar.container);
    
    ws.dom.style(frame, {
      height: ps.h - hs.h - 55 - 17 + 'px' //55 is padding from top for data column and letter
    });

    ws.dom.style([container, gsheetFrame, liveDataFrame], {
      height: ps.h - hs.h - 22 /*- tb.h*/ + 'px'
    });


    ws.dom.style(table, {
      width: ps.w + 'px'
    });

  }

  /** Returns the header titles as an array
   *  @memberof ws.DataTable
   *  @returns {array<string>} - the headers
   */
  function getHeaderTextArr(quoteStrings, section) {

    var columnNames = [];


    function cleanData(data) {
      var title = data && data.headerTitle.innerHTML.length
      ? data.headerTitle.innerHTML
      : null;
      
      if (quoteStrings) {
        title = '"' + title + '"';
      }

      columnNames.push(title);  
    }

    if (section) {
      //Add in label data first
      //cleanData(gcolumns[section.labelColumn]);
    }

    gcolumns.reduce(function(result, item, index) {
      
      if ( section && !checkSections(section, index)) {
            return;
          }
      
      cleanData(item);

    }, []);

    return columnNames;
  }

  function checkSections(sections, index) {
    return (sections || []).some(function(section) {
      return (section.dataColumns.indexOf(index) > -1 || section.extraColumns.indexOf(index) > -1 || section.labelColumn === index);
    });
  }

  /** Get the table contents as an array of arrays
   *  @memberof ws.DataTable
   *  @param {boolean} quoteStrings - if true, strings are wrapped in double quotes
   *  @param {boolean} includeHeaders - if true, the header texts will be included as the first row
   *  @returns {array<array<string>>}
   */
  function toData(quoteStrings, includeHeaders, section) {
    var data = [];
    if (includeHeaders) {
      data.push(getHeaderTextArr(quoteStrings, section));
    }
    dataFieldsUsed = [];

    function addData(column, arr) {

      if (quoteStrings && !ws.isNum(column) && ws.isStr(column)) {
        column = '"' + column.replace(/\"/g, '"') + '"';
      }

      if (ws.isNum(column)) {
        column = parseFloat(column);
      }

      if (ws.isStr(column) && Date.parse(column) !== NaN) {
        //v = (new Date(v)).getTime();
      }

      arr.push(column);
    }

    rows.forEach(function(row) {
      var rarr = [],
        hasData = false;

      if (section) {
        //Add in label data first
        //addData(row.columns[section[0].labelColumn].value(), rarr);
      }

      row.columns.forEach(function(col, index) {
        if (section && !checkSections(section, index)) return;

        var v = col.value();

        if (v) {
          hasData = true;
        }

        if (dataFieldsUsed.indexOf(index) === -1) {
          dataFieldsUsed.push(index);
          if (!v) {
            hasData = true;
            v = undefined;
          }
        }

        addData(v, rarr);

      });

      if (hasData) {
        data.push(rarr);
      }
    });
    return data;
  }

  /** Get the table contents as series
   *  @memberof ws.DataTable
   */
  function toDataSeries(ignoreFirst) {
    var res = {
      categories: [],
      series: []
    };

    gcolumns.forEach(function(item, i) {
      if (i > 0) {
        res.series.push({
          name: item.headerTitle.innerHTML.length
            ? item.headerTitle.innerHTML
            : null,
          data: []
        });
      }
    });

    rows.forEach(function(row, i) {
      row.columns.forEach(function(col, ci) {
        var v = col.value();

        if (!ci) {
          if (v && ws.isStr(v) && Date.parse(v) !== NaN) {
            // v = new Date(v);
          }

          res.categories.push(v);
          return;
        }

        ci--;

        if (v && ws.isNum(v)) {
          v = parseFloat(v);
        }

        if (v && ws.isStr(v) && Date.parse(v) !== NaN) {
          // v = (new Date(v)).getTime();
        }

        res.series[ci].data.push(v);
      });
    });

    return res;
  }

  /** Get the table contents as standard CSV
   *  @memberof ws.DataTable
   *  @param delimiter {string} - the delimiter to use. Defaults to `,`.
   *  @param section {array} - the section of the data table which is the data.
   */
  function toCSV(delimiter, quoteStrings, section) {
    delimiter = delimiter || ','; 
    return toData(quoteStrings, true, section)
      .map(function(cols) {
        return cols.join(delimiter);
      })
      .join('\n');
  }

  function loadRows(rows, done) {
    var sanityCounts = {};
    clear();

    if (rows.length > 1) {
      hideDropzone();
    }

    // Do a sanity check on rows.
    // If the column count varries between rows, there may be something wrong.
    // In those cases we should pop up a dialog allow to specify what the
    // delimiter should be manually.

    rows.some(function(row, i) {
      var count = row.length;
      sanityCounts[count] =
        typeof sanityCounts[count] === 'undefined' ? 0 : sanityCounts[count];
      ++sanityCounts[count];
      return i > 20;
    });

    if (Object.keys(sanityCounts).length > 4) {
      // Four or more rows have varrying amounts of columns.
      // Something is wrong.
      showDataImportError();
    }

    ws.dom.style(loadIndicator, {
      opacity: 1
    });

    ws.dom.style(hideCellsDiv, {
      opacity: 0
    });

    setTimeout(function() {

      if(rows[0] && rows.length < DEFAULT_ROW) {
        var counter = DEFAULT_ROW - rows.length,
            length = (rows[0].length > DEFAULT_COLUMN ? rows[0].length : DEFAULT_COLUMN);

        rows.forEach(function(row) {
          if (row.length < DEFAULT_COLUMN) {
            const len = DEFAULT_COLUMN - row.length;
            for(var i=0;i<len;i++) {
              row.push(null);
            }
          }
        });

        for(var i =0;i<counter; i++) {
          rows.push(Array(length).fill(null, 0));
        }
      }

      rows.forEach(function(cols, i) {
        var row;

        if (i) {
          row = Row();
        }
        tempKeyValue = "A";
        cols.forEach(function(c) {
          if (i === 0) {
            addCol(c);
          } else {
            row.addCol(c, tempKeyValue);
          }
          tempKeyValue = getNextLetter(tempKeyValue);
        });
      });

      ws.dom.ap(colgroup, ws.dom.cr('col'));

      // ws.snackBar(ws.L('dgDataImported'));
      resize();

      ws.dom.style(loadIndicator, {
        opacity: 0
      });
      ws.dom.style(hideCellsDiv, {
        opacity: 1
      });

      if (ws.isFn(done)) {
        done();
      }
    }, 10);
  }

  function loadLiveDataPanel(params){
      //loadRows(params.csv);

      isInLiveDataMode = true;
      ws.dom.style(gsheetFrame, {
        display: 'none'
      });
      ws.dom.style(container, {
        display: 'none'
      });
      ws.dom.style(liveDataFrame, {
        display: 'block'
      });

      liveDataInput.value = params.columnsURL || params.rowsURL || params.csvURL;
      liveDataIntervalInput.value = params.dataRefreshRate || '';
      liveDataTypeSelect.selectById((params.columnsURL ? 'columnsURL' : (params.rowsURL ? 'rowsURL': 'csvURL')));
  }

  function loadLiveDataFromURL(url, interval, type) {
    isInLiveDataMode = true;
    events.emit('LoadLiveData', { url: url,
                                  interval: interval,
                                  type: type });
  }

  function loadCSV(data, surpressEvents, updateAssignData, cb) {
    var rows;

    if (isInGSheetMode) {
      isInGSheetMode = false;
      isInLiveDataMode = false;

      ws.dom.style(gsheetFrame, {
        display: 'none'
      });

      ws.dom.style(liveDataFrame, {
        display: 'none'
      });

      ws.dom.style(container, {
        display: 'block'
      });
    }

    // ws.snackBar(ws.L('dgDataImporting'));
    importModal.hide();

    surpressChangeEvents = true;

    rawCSV = data.csv;

    if (data && data.csv) {
      rows = parseCSV(data.csv, data.delimiter);
      if (updateAssignData && rows[0].length < DEFAULT_COLUMN) events.emit('AssignDataForFileUpload', rows[0].length);

      if(rows[0] && rows.length < DEFAULT_ROW) {
        var counter = DEFAULT_ROW - rows.length,
            length = (rows[0].length > DEFAULT_COLUMN ? rows[0].length : DEFAULT_COLUMN);

        rows.forEach(function(row) {
          if (row.length < DEFAULT_COLUMN) {
            const len = DEFAULT_COLUMN - row.length;
            for(var i=0;i<len;i++) {
              row.push(null);
            }
          }
        });

        for(var i =0;i<counter; i++) {
          rows.push(Array(length).fill(null, 0));
        }
      }
      loadRows(rows, function() {
        if (updateAssignData && rows[0].length > DEFAULT_COLUMN) events.emit('AssignDataForFileUpload', rows[0].length);
        if (cb) cb();
      });
    } else {
      // surpressChangeEvents = false;
      // if (!surpressEvents) {
      //   emitChanged(true);
      // }
    }
    surpressChangeEvents = false;
    if (!surpressEvents) {
      emitChanged(true);
    }
  }

  function initGSheet(
    id,
    worksheet,
    startRow,
    endRow,
    startColumn,
    endColumn,
    skipLoad,
    dataRefreshRate
  ) {
    gsheetID.value = id;
    gsheetWorksheetID.value = worksheet || '';
    gsheetRefreshTime.value = dataRefreshRate || '';
    gsheetStartRow.value = startRow || 0;
    gsheetEndRow.value = (endRow === Number.MAX_VALUE ? '' : endRow) || '';
    gsheetStartCol.value = startColumn || 0;
    gsheetEndCol.value =  (endColumn === Number.MAX_VALUE ? '' : endColumn) || '';

    isInGSheetMode = true;
    isInLiveDataMode = false;

    ws.dom.style(gsheetFrame, {
      display: 'block'
    });

    ws.dom.style(container, {
      display: 'none'
    });

    ws.dom.style(liveDataFrame, {
      display: 'none'
    });

    if (!skipLoad) {

      events.emit('LoadGSheet', {
        googleSpreadsheetKey: gsheetID.value,
        googleSpreadsheetWorksheet: gsheetWorksheetID.value || false,
        dataRefreshRate: gsheetRefreshTime.value || false,
        enablePolling: (parseInt(gsheetRefreshTime.value) !== 0),
        startRow: gsheetStartRow.value || 0,
        endRow: gsheetEndRow.value || undefined,
        startColumn: gsheetStartCol.value || 0,
        endColumn: gsheetEndCol.value || undefined
      });
    }
  }

  function showDataTableError() {
    ws.dom.style(container, {
      border: '1px solid #aa5555'
    });
  }

  function hideDataTableError() {
    ws.dom.style(container, {
      border: 'initial'
    });
  }

  function addImportTab(tabOptions){
    importer.addImportTab(tabOptions);
  }

  function hideImportModal(){
    importModal.hide();
  }

  function showImportModal(index) {
    importModal.show();
    if (!isNaN(index)) {
      importer.selectTab(index);
    }

    events.emit('initExporter', importer.exporter);
    importer.resize();
  }

  function showLiveData(skipConfirm) {
    if (
      skipConfirm ||
      rows.length <= 1 ||
      confirm('This will clear your existing data. Continue?')
    ) {
      clear(true);
      events.emit('ClearSeries');

      liveDataInput.value = '';
      liveDataIntervalInput.value = '';
      liveDataTypeSelect.selectByIndex(0);

      ws.dom.style(gsheetFrame, {
        display: 'none'
      });

      ws.dom.style(container, {
        display: 'none'
      });

      ws.dom.style(liveDataFrame, {
        display: 'block'
      });
      importModal.hide();

      isInGSheetMode = false;
      isInLiveDataMode = true;
    }
  }

  function showGSheet(skipConfirm) {
    if (
      skipConfirm ||
      rows.length <= 1 ||
      confirm('This will clear your existing data. Continue?')
    ) {
      clear(true);
      events.emit('ClearSeries');
      
      gsheetID.value = '';
      gsheetWorksheetID.value = '';
      gsheetRefreshTime.value = '';
      ws.dom.style(gsheetFrame, {
        display: 'block'
      });

      ws.dom.style(container, {
        display: 'none'
      });

      ws.dom.style(liveDataFrame, {
        display: 'none'
      });

      importModal.hide();
      isInGSheetMode = true;
      isInLiveDataMode = false;
    }
  }

  function hideLiveData() {
    if (
      !liveDataInput.value ||
      confirm('Are you sure you want to remove your live data?')
    ) {
      // Should emit a gsheet clear

      events.emit('LoadLiveData', {
          url: ''
      });

      ws.dom.style(gsheetFrame, {
        display: 'none'
      });

      ws.dom.style(container, {
        display: 'block'
      });


      ws.dom.style(liveDataFrame, {
        display: 'none'
      });

      isInLiveDataMode = false;

      init();
    }
  }

  function hideGSheet() {
    if (
      !gsheetID.value ||
      confirm('Are you sure you want to detach the current spreadsheet?')
    ) {
      // Should emit a gsheet clear
      events.emit('LoadGSheet', {
        googleSpreadsheetKey: '',
        googleSpreadsheetWorksheet: false
      });

      ws.dom.style(gsheetFrame, {
        display: 'none'
      });

      ws.dom.style(container, {
        display: 'block'
      });

      ws.dom.style(liveDataFrame, {
        display: 'none'
      });
      isInGSheetMode = false;

      init();

      ws.emit('UIAction', 'DetachGoogleSheet');
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  importer.on('ExportComma', function(data) {
    ws.emit('UIAction', 'ExportComma');
    ws.download('data.csv', toCSV(','), 'application/csv');
    events.emit('EnableAssignDataPanel');
    importModal.hide();
  });

  importer.on('ExportSemiColon', function(data) {
    ws.emit('UIAction', 'ExportSemiColon');
    ws.download('data.csv', toCSV(';'), 'application/csv');
    events.emit('EnableAssignDataPanel');
    importModal.hide();
  });

  importer.on('ImportCSV', function(data, cb) {
    ws.emit('UIAction', 'ImportCSV');
    events.emit('EnableAssignDataPanel');
    loadCSV(data, null, true, cb);
  });

  importer.on('ImportGoogleSpreadsheet', function() {
    ws.emit('UIAction', 'BtnGoogleSheet');
    events.emit('DisableAssignDataPanel');
    showGSheet();
  });

  importer.on('ImportLiveData', function(data) {
    isInLiveDataMode = true;
    events.emit('DisableAssignDataPanel');
    showLiveData();
    //loadLiveDataFromURL(data.url);
  });

  importer.on('ImportChartSettings', function(settings, format) {
    // Do something with the data here
    events.emit('ImportChartSettings', settings, format);
    importModal.hide();
  });

  ws.dom.on(switchRowColumns, 'click', function() {
    selectSwitchRowsColumns()
  })

  ws.dom.on(gsheetCancelButton, 'click', function() {
    hideGSheet();
    events.emit('CancelDataInput');
    events.emit('EnableAssignDataPanel');
  });

  ws.dom.on(liveDataCancelButton, 'click', function() {
    hideLiveData();
    events.emit('CancelDataInput');
    events.emit('EnableAssignDataPanel');
  });

  ws.dom.on(liveDataLoadButton, 'click', function() {
    loadLiveDataFromURL(liveDataInput.value, liveDataIntervalInput.value, detailValue || 'columnsURL');
  });

  ws.dom.on(gsheetLoadButton, 'click', function() {

    var value = parseInt(gsheetRefreshTime.value);
    events.emit('LoadGSheet', {
      googleSpreadsheetKey: gsheetID.value,
      googleSpreadsheetWorksheet: gsheetWorksheetID.value || false,
      dataRefreshRate: (!isNaN(value) && value !== 0 ? value : false),
      enablePolling: (!isNaN(value) && value !== 0),
      startRow: gsheetStartRow.value || 0,
      endRow: gsheetEndRow.value || Number.MAX_VALUE,
      startColumn: gsheetStartCol.value || 0,
      endColumn: gsheetEndCol.value || Number.MAX_VALUE
    });
  });

  ws.dom.on(weirdDataIgnore, 'click', hideDataImportError);

  ws.dom.on(weirdDataFix, 'click', function() {
    // Pop open a modal with the option of supplying a delimiter manually.
    var dropdownParent = ws.dom.cr('div'),
      dropdown = ws.DropDown(dropdownParent),
      okBtn = ws.dom.cr('button', 'ws-ok-button', 'Rerun Import'),
      nevermindBtn = ws.dom.cr('button', 'ws-ok-button', 'Nevermind'),
      selectedDelimiter = undefined;

    weirdDataModal.body.innerHTML = '';
    weirdDataModal.show();

    dropdown.addItems([
      {
        title: 'Tab',
        id: 'tab',
        select: function() {
          selectedDelimiter = '\t';
        }
      },
      {
        title: 'Comma',
        id: 'comma',
        select: function() {
          selectedDelimiter = ',';
        }
      },
      {
        title: 'Semicolon',
        id: 'semicolon',
        select: function() {
          selectedDelimiter = ';';
        }
      }
    ]);

    dropdown.selectByIndex(0);

    ws.dom.ap(
      weirdDataModal.body,
      ws.dom.cr('h3', '', 'Data Import Fixer'),
      ws.dom.cr(
        'div',
        'ws-dtable-weird-data-body',
        [
          'We could not properly determine how your columns are separated.',
          '<br/><br/>',
          'Usually this is caused by commas as thousand separators,',
          'or something similar. Please choose which delimiter you want to use,',
          'and click the Rerun button.<br/><br/>'
        ].join(' ')
      ),
      dropdownParent,
      ws.dom.style(okBtn, {
        marginRight: '5px'
      }),
      nevermindBtn
    );

    ws.dom.on(nevermindBtn, 'click', weirdDataModal.hide);

    ws.dom.on(okBtn, 'click', function() {
      weirdDataModal.hide();
      hideDataImportError();

      loadCSV({
        csv: rawCSV,
        delimiter: selectedDelimiter
      }, null, true);
    });
  });

  ////////////////////////////////////////////////////////////////////////////

  dropZone.innerHTML =
    'Drop CSV files here.<br/>' +
    '<span class="ws-dtable-drop-zone-small">You can also paste CSV or Excel data into any cell</span>';

  table.cellPadding = 0;
  table.cellSpacing = 0;

  ws.dom.on(frame, 'scroll', function(e) {
    leftBar.style.top = -frame.scrollTop + 'px';
    topBar.style.left = -frame.scrollLeft + 40 + 'px';
  });

  parent = ws.dom.get(parent);
  ws.dom.ap(
    parent,
    gsheetFrame,
    liveDataFrame,
    ws.dom.ap(
      container,
      ws.dom.ap(
        frame,
        ws.dom.ap(table, colgroup, thead, tbody),
        tableTail,
        dropZone,
        movementBar
      ),
      hideCellsDiv,
      leftBar,
      ws.dom.ap(topBar, topLetterBar, topColumnBar)
      //ws.dom.ap(topLeftPanel, checkAll)
    ),
    ws.dom.ap(
      weirdDataContainer,
      ws.dom.cr(
        'div',
        'ws-dtable-weird-data-body',
        [
          'Uh-oh! It looks like our data importer may have had some issues',
          'processing your data.',
          'Usually this means that we were unable to deduce how the columns',
          'are separated.'
        ].join(' ')
      ),
      weirdDataIgnore,
      weirdDataFix
    ),

    loadIndicator
  );

  gsheetID.placeholder = 'Spreadsheet ID';
  gsheetWorksheetID.placeholder = 'Worksheet (leave blank for first)';
  gsheetRefreshTime.placeholder = 'Refresh Time (leave blank for no refresh)';

  ws.dom.ap(
    gsheetFrame,
    ws.dom.ap(
      gsheetContainer,
      ws.dom.cr(
        'div',
        'ws-dtable-gsheet-heading',
        'Link Google Spreadsheet'
      ),
      ws.dom.ap(
        ws.dom.cr('div', 'ws-dtable-gsheet-inner'),
        // ws.dom.cr('div', 'ws-dtable-gsheet-centered', 'You have loaded a Google Spreadsheet.'),
        // ws.dom.cr(
        //   'div',
        //   'ws-dtable-gsheet-desc',
        //   [
        //     'Google Spreadsheets are referenced, meaning that the data is imported',
        //     'on the fly. When viewing the chart, the latest version of your sheet',
        //     'will always be used!<br/><br/>'
        //   ].join(' ')
        // ),
        ws.dom.cr(
          'div',
          'ws-dtable-gsheet-label',
          'Google Spreadsheet ID'
        ),
        ws.dom.ap(ws.dom.cr('div'), gsheetID),
        ws.dom.ap(
          ws.dom.cr('table', 'ws-stretch'),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'Worksheet'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'Refresh Time (Seconds)')
          ),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.ap(ws.dom.cr('td', '', ''), gsheetWorksheetID),
            ws.dom.ap(ws.dom.cr('td', '', ''), gsheetRefreshTime)
          ),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'Start Row'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'End Row')
          ),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.ap(ws.dom.cr('td', '', ''), gsheetStartRow),
            ws.dom.ap(ws.dom.cr('td', '', ''), gsheetEndRow)
          ),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'Start Column'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'End Column')
          ),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.ap(ws.dom.cr('td', '', ''), gsheetStartCol),
            ws.dom.ap(ws.dom.cr('td', '', ''), gsheetEndCol)
          )
        ),
        ws.dom.ap(
          ws.dom.cr('div', 'ws-gsheet-btn-container'),
          gsheetLoadButton,
          gsheetCancelButton
        ),
        ws.dom.cr(
          'div',
          'ws-gsheet-text',
          [
            'When using Google Spreadsheet, Highcharts references the sheet directly.<br/><br/>',
            'This means that the published chart always loads the latest version of the sheet.<br/><br/>',

            'For more information on how to set up your spreadsheet, visit',
            '<a target="_blank" href="https://cloud.highcharts.com/docs/#/google-spread-sheet-setting">the documentation</a>.'
          ].join(' ')
        )
      )
    )
  );

  liveDataTypeSelect.addItems([
    {id: 'columnsURL', title: "JSON (Column Ordered)"},
    {id: 'rowsURL', title: "JSON (Row Ordered)"},
    {id: 'csvURL', title: "CSV"}
  ]
  );

  liveDataTypeSelect.on('Change', function(selected) {
    //detailIndex = selected.index();
    detailValue = selected.id();
    //liveDataTypeSelect.selectById(detailValue || 'json');
  });

  ws.dom.ap(liveDataTypeMasterNode, liveDataTypeSelect.container);
  ws.dom.style(liveDataTypeMasterNode, {
    display: 'block'
  });

  ws.dom.ap(
    liveDataFrame,
    ws.dom.ap(
      liveDataContainer,
      ws.dom.cr(
        'div',
        'ws-dtable-gsheet-heading',
        'Live Data'
      ),
      ws.dom.ap(
        ws.dom.cr('div', 'ws-dtable-gsheet-inner'),
        // ws.dom.cr('div', 'ws-dtable-gsheet-centered', 'You have loaded a Google Spreadsheet.'),
        // ws.dom.cr(
        //   'div',
        //   'ws-dtable-gsheet-desc',
        //   [
        //     'Google Spreadsheets are referenced, meaning that the data is imported',
        //     'on the fly. When viewing the chart, the latest version of your sheet',
        //     'will always be used!<br/><br/>'
        //   ].join(' ')
        // ),
        ws.dom.cr(
          'div',
          'ws-dtable-gsheet-label',
          'URL'
        ),
        ws.dom.ap(ws.dom.cr('div'), liveDataInput),

        ws.dom.ap(
          ws.dom.cr('table', 'ws-stretch'),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'Chart Refresh Time (Seconds)'),
            ws.dom.cr('td', 'ws-dtable-gsheet-label', 'Data Type')
          ),
          ws.dom.ap(
            ws.dom.cr('tr'),
            ws.dom.ap(ws.dom.cr('td', '', ''), liveDataIntervalInput),
            ws.dom.ap(ws.dom.cr('td', '', ''), liveDataTypeMasterNode)
          )
        ),

        ws.dom.ap(
          ws.dom.cr('div', 'ws-gsheet-btn-container'),
          liveDataLoadButton,
          liveDataCancelButton
        ),
        ws.dom.cr('div', 'ws-gsheet-text', [
          'Live data needs a url to your JSON data to reference.<br/><br/>',
          'This means that the published chart always loads the latest version of your data.<br/><br/>'
        ].join(' '))
      )
    )
  );

  function selectSwitchRowsColumns() {
    var csvData = rowsToColumns(ws.parseCSV(toCSV()))
    .map(function(cols) {
      return cols.join(';');
    }).join('\n')

    clearData()
    loadCSV({
      csv: csvData
    }, null, true);
  }

  function rowsToColumns(rows) {
    var row,
        rowsLength,
        col,
        colsLength,
        columns;

    if (rows) {
        columns = [];
        rowsLength = rows.length;
        for (row = 0; row < rowsLength; row++) {
            colsLength = rows[row].length;
            for (col = 0; col < colsLength; col++) {
                if (!columns[col]) {
                    columns[col] = [];
                }
                columns[col][row] = rows[row][col];
            }
        }
    }
    return columns;
  }


  function getRawCSV() {
    return rawCSV;
  }

  function clearData() {
    ws.emit('UIAction', 'FlushDataConfirm');
    init();
    emitChanged();
    if (rows.length > 0) rows[0].columns[0].focus();
  }
  function colorHeader(values, color) {
    var tempValue = values[0];
    if (values.length > 0) {
      while (tempValue <= values[values.length - 1]) {
        if (gcolumns[tempValue]) {
          ws.dom.style(gcolumns[tempValue].letter, {
            "background-color": color.light,
            "border-left": "1px double " + color.dark,
            "border-top": "1px double " + color.dark,
            "border-bottom": "1px double " + color.dark,
            "border-right": "1px double " + color.dark,
          });        
          ws.dom.style(gcolumns[tempValue].header, {
            "background-color": color.light,
            "border-left": "1px double " + color.dark,
            "border-right": "1px double " + color.dark,
            "border-bottom": "1px double " + color.dark,
          });
        }
        tempValue++;
      }
    }
  }

  function colorCells(values, color) {
    if (values.length > 0) {
      rows.forEach(function(row) {
        var tempValue = values[0];
        while (tempValue <= values[values.length - 1]) {
          if (row.columns[tempValue]) {
            ws.dom.style(row.columns[tempValue].element, {
              "background-color": color.light 
            });      
          }  
          tempValue++;
        }
      });
    }
  }

  function outlineCell(values, color) {
    values.forEach(function(value, index) {
      rows.forEach(function(row) {
        if (row.columns[value]) {
          ws.dom.style(row.columns[value].element, {
            "border-right": (index === (values.length - 1) ? '1px double ' + color.dark : ''),
            "border-left": (index === 0 ? '1px double ' + color.dark : ''),
          });
        }
      });
    });
  }

  function decolorCells(previousValues) {
    if (previousValues && previousValues.length > 0) {
      
      rows.forEach(function(row) {
        var tempValue = previousValues[0];
        if (previousValues.length > 0) {
          while (tempValue <= previousValues[previousValues.length - 1]) {
            if (row.columns[tempValue]) {
              ws.dom.style(row.columns[tempValue].element, {
                "background-color": ''
              });
            }
            tempValue++; //= getNextLetter(tempValue);
          }
        }
      });
    }
  }

  function decolorHeader(previousValues) {
    if (previousValues && previousValues.length > 0){
      var tempValue = previousValues[0];
      if (previousValues.length > 0) {
        while (tempValue <= previousValues[previousValues.length - 1]) {
          if (gcolumns[tempValue]) {
            ws.dom.style([gcolumns[tempValue].letter, gcolumns[tempValue].header], {
              "background-color": '',
              "border": '',
            });
          }
          tempValue++; //= getNextLetter(tempValue);
        }
      }
    }
  }

  function removeOutlineFromCell(values) {
    (values || []).forEach(function(value) {
      (rows || []).forEach(function(row){
        if (row.columns[value]) { //May have been deleted on startup
          ws.dom.style(row.columns[value].element, {
            "border-right": '',
            "border-left": '',
          });
        }
      });
    });
  }

  function removeCellColoring(previousValues) {
    removeOutlineFromCell(previousValues);
    decolorHeader(previousValues);
    decolorCells(previousValues);
  }

  function colorFields(values, color) {
    outlineCell(values, color);
    colorCells(values, color);
    colorHeader(values, color);
  }

  function highlightCells(previousValues, values, input, newOptions) {
    removeCellColoring(previousValues);
    colorFields(values, input.colors);
    //events.emit('AssignDataChanged', input, newOptions);
  }

  function removeAllCellsHighlight(previousValues, values, input, newOptions) {
    removeCellColoring(values);
  }

  function toggleUnwantedCells(values, toggle) {
    
    var found = false;

    gcolumns.forEach(function(col, index) {
      if (!values.indexOf(index) === -1) {
        toggle ? col.hideColumns() : col.showColumns();
      } else {
        col.showColumns();

        if (!found && rows[0]) {
          rows[0].columns[index].focus();
          found = true;
        }
        
      }
    });
  }
  
  function getColumnLength(){
    return (rows[0] && rows[0].columns ? rows[0].columns.length : 2);
  }

  function areColumnsEmpty(colNumber) {
    return !rows.some(function(row){
      return row.columns[colNumber].value() !== null;
    });
  }

  function areRowsEmpty(rowNumber) {
    return !rows[rowNumber].columns.some(function(column){
      return column.value() !== null;
    });
  }

  function getDataFieldsUsed() {
    return dataFieldsUsed;
  }

  function isInCSVMode() {
    return (!isInGSheetMode && !isInLiveDataMode);
  }

  // Getting kinda long, probably need to move this all out of here to createchartpage
  function createTableInputs(inputs, maxColSpan, extraClass) {

    var table = ws.dom.cr('table', 'ws-createchartwizard-table'),
    maxColSpan = maxColSpan,
    currentColSpan = maxColSpan,
    tr;

    inputs.forEach(function(input) {
      if (currentColSpan >= maxColSpan) {
        tr = ws.dom.cr('tr', extraClass);
        ws.dom.ap(table, tr);
        currentColSpan = 0;
      }

      currentColSpan += input.colspan;
      input.element = {};

      if (input.type && input.type === 'select') {
        input.element.dropdown = ws.DropDown(null, 'ws-wizard-dropdown-container');
        input.element.dropdown.addItems([
          {id: 'columnsURL', title: "JSON (Column Ordered)"},
          {id: 'rowsURL', title: "JSON (Row Ordered)"},
          {id: 'csvURL', title: "CSV"}
        ]);
        input.element.dropdown.selectByIndex(0);
        input.element.dropdown.on('Change', function(selected) {
          detailValue = selected.id();
        });

        input.element.input = input.element.dropdown.container;

      } else input.element.input = ws.dom.cr('input','ws-imp-input-stretch');
      if (input.placeholder) input.element.input.placeholder = input.placeholder
      input.element.label = ws.dom.cr('span', '', input.label);
      
      const tdLabel = ws.dom.ap(ws.dom.cr('td', 'ws-modal-label'), input.element.label),
            tdInput = ws.dom.ap(ws.dom.cr('td', ''), input.element.input);
      
      tdLabel.colSpan = 1;
      tdInput.colSpan = input.colspan - 1;

      ws.dom.ap(tr, tdLabel, tdInput);
    });
    return table;
  }

  function createCancelBtn() {
    cancel = ws.dom.cr('button', 'ws-ok-button ws-import-button grey', 'Cancel');
    ws.dom.on(cancel, 'click', function() {
      dataModal.hide();
    });
    return cancel;
  }

  function createLiveDataContainer(toNextPage) {
    const container = ws.dom.cr('div', 'ws-modal-container'),
    inputs = [
      { label: 'URL', placeholder: 'Spreadsheet ID', colspan: 2, linkedTo: liveDataInput},
      { label: 'Refresh Time in Seconds', placeholder: 'Refresh time  (leave blank for no refresh)', colspan: 2, linkedTo: liveDataIntervalInput},
      { label: 'Type', colspan: 2, linkedTo: liveDataTypeSelect, type:'select'}],
    table = createTableInputs(inputs, 2, 'ws-live-data'),
    importData = ws.dom.cr('button', 'ws-ok-button ws-import-button negative', 'Import Data'),
    cancel = createCancelBtn();

    ws.dom.on(importData, 'click', function() {
      showLiveData(true);
      dataModal.hide();
      inputs.forEach(function(input) {
        if (input.type && input.type === 'select') {
          input.linkedTo.selectByIndex(input.element.dropdown.getSelectedItem().index());
        }
        else input.linkedTo.value = input.element.input.value;
      });
      liveDataLoadButton.click();
      toNextPage();
    });
    ws.dom.ap(container,
      ws.dom.cr('div', 'ws-modal-title ws-help-toolbar', 'Import Live Data'),
      ws.dom.ap(ws.dom.cr('div'),
        ws.dom.cr('div', 'ws-modal-text', 'Live data needs a url to your JSON data to reference.'),
        ws.dom.cr('div', 'ws-modal-text', 'This means that the published chart always loads the latest version of your data.')),
      ws.dom.ap(ws.dom.cr('div', 'ws-table-container'), table),
      ws.dom.ap(ws.dom.cr('div', 'ws-button-container'), importData, cancel));
    
    return container;
  }

  function createGSheetContainer(toNextPage) {
    const container = ws.dom.cr('div', 'ws-modal-container');
    inputs = [
      { label: 'Google Spreadsheet ID', placeholder: 'Spreadsheet ID', colspan: 4, linkedTo: gsheetID},
      { label: 'Worksheet', placeholder: 'Worksheet (leave blank for first)', colspan: 4, linkedTo: gsheetWorksheetID},
      { label: 'Refresh Time in Seconds', placeholder: 'Refresh time  (leave blank for no refresh)', colspan: 4, linkedTo: gsheetRefreshTime},
      { label: 'Start Row', colspan: 2, linkedTo: gsheetStartRow},
      { label: 'End Row', colspan: 2, linkedTo: gsheetEndRow},
      { label: 'Start Column', colspan: 2, linkedTo: gsheetStartCol},
      { label: 'End Column', colspan: 2, linkedTo: gsheetEndCol}],
    table = createTableInputs(inputs, 4),
    connectSheet = ws.dom.cr('button', 'ws-ok-button ws-import-button negative', 'Connect Sheet');
    cancel = createCancelBtn();

    ws.dom.on(connectSheet, 'click', function() {
      showGSheet(true);
      dataModal.hide();
      inputs.forEach(function(input) {
        input.linkedTo.value = input.element.input.value;
      });
      gsheetLoadButton.click();
      toNextPage();
    });

    ws.dom.ap(container,
                  ws.dom.cr('div', 'ws-modal-title ws-help-toolbar', 'Connect Google Sheet'),
                  ws.dom.ap(ws.dom.cr('div'),
                    ws.dom.cr('div', 'ws-modal-text', 'When using Google Spreadsheet, Highcharts references the sheet directly.'),
                    ws.dom.cr('div', 'ws-modal-text', 'This means that the published chart always loads the latest version of the sheet.'),
                    ws.dom.cr('div', 'ws-modal-text', 'For more information on how to set up your spreadsheet, visit the documentation.')),
                  ws.dom.ap(ws.dom.cr('div', 'ws-table-container'), table),
                  ws.dom.ap(ws.dom.cr('div', 'ws-button-container'), connectSheet, cancel));

    return container;
  }

  function createCutAndPasteContainer(toNextPage) {
    const container = ws.dom.cr('div', 'ws-modal-container');
    importData = ws.dom.cr('button', 'ws-ok-button ws-import-button negative', 'Import Data');
    input = ws.dom.cr('textarea', 'ws-table-input'),
    cancel = createCancelBtn();

    ws.dom.on(importData, 'click', function() {
      importer.emitCSVImport(input.value);
      dataModal.hide();
      toNextPage();
    });

    ws.dom.ap(container,
                  ws.dom.cr('div', 'ws-modal-title ws-help-toolbar', 'Cut And Paste Data'),
                  ws.dom.ap(
                    ws.dom.cr('div'),
                    ws.dom.cr('div', 'ws-modal-text', 'Paste CSV into the below box, or upload a file. Click Import to import your data.')
                  ),
                  ws.dom.ap(ws.dom.cr('div'), input),
                  ws.dom.ap(ws.dom.cr('div', 'ws-button-container'), importData, cancel));

    return container;
  }

  function createSampleData(toNextPage, loading) {
    const container = ws.dom.cr('div', 'ws-modal-container'),
          buttonsContainer = ws.dom.cr('div', 'ws-modal-buttons-container');

    ws.samples.each(function(sample) {
      var data = sample.dataset.join('\n'),
        loadBtn = ws.dom.cr(
          'button',
          'ws-box-size ws-imp-button',
          sample.title
        );

      ws.dom.style(loadBtn, { width: '99%' });

      ws.dom.on(loadBtn, 'click', function() {
        loading(true);
        dataModal.hide();
        importer.emitCSVImport(data, function() {
          loading(false);
          if (toNextPage) toNextPage();
        });
      });

      ws.dom.ap(
        buttonsContainer,
        //ws.dom.cr('div', '', name),
        //ws.dom.cr('br'),
        loadBtn,
        ws.dom.cr('br')
      );
    });

    ws.dom.ap(container, buttonsContainer);
    
    return container;
  }

  function createSimpleDataTable(toNextPage, loading) {
    var container = ws.dom.cr('div', 'ws-table-dropzone-container'),
        selectFile = ws.dom.cr('button', 'ws-ok-button ws-import-button', 'Select File'),
        buttonsContainer = ws.dom.cr('div'),
        modalContainer = ws.dom.cr('div', 'ws-table-modal'),
        gSheetContainer = createGSheetContainer(toNextPage),
        liveContainer = createLiveDataContainer(toNextPage),
        sampleDataContainer = createSampleData(toNextPage, loading);
        cutAndPasteContainer = createCutAndPasteContainer(toNextPage);

    var buttons = [{ title: 'Connect Google Sheet', linkedTo: gSheetContainer}, 
                   { title: 'Import Live Data', linkedTo: liveContainer, height: 321}, 
                   { title: 'Cut and Paste Data', linkedTo: cutAndPasteContainer, height: 448, width: 518}, 
                   { title: 'Load Sample Data', linkedTo: sampleDataContainer}];

    buttons.forEach(function(buttonProp) {
      const button = ws.dom.cr('button', 'ws-ok-button ws-import-button', buttonProp.title);
      ws.dom.on(button, 'click', function() {
        dataModal.resize(buttonProp.width || 530, buttonProp.height || 530);
        modalContainer.innerHTML = '';
        ws.dom.ap(modalContainer, buttonProp.linkedTo);
        dataModal.show();
      });
      ws.dom.ap(buttonsContainer, button);
    });


    ws.dom.on(selectFile, 'click', function(){
      ws.readLocalFile({
        type: 'text',
        accept: '.csv',
        success: function(info) {
          ws.snackBar('File uploaded');
          importer.emitCSVImport(info.data);
          //events.emit("AssignDataForFileUpload", info.data); - Does this later in loadCSV
          toNextPage();
        }
      });
    });
    
    dataModal = ws.OverlayModal(false, {
      minWidth: 530,
      minHeight: 530,
      showCloseIcon: true
    });

    ws.dom.ap(dataModal.body, modalContainer);

    container.ondragover = function(e) {
      e.preventDefault();
    };

    container.ondrop = function(e) {
      e.preventDefault();

      var d = e.dataTransfer;
      var f;
      var i;

      if (d.items) {
        for (i = 0; i < d.items.length; i++) {
          f = d.items[i];
          if (f.kind === 'file') {
            handleFileUpload(f.getAsFile(), function() {
              ws.snackBar('File uploaded');
              toNextPage();
            });
          }
        }
      } else {
        for (i = 0; i < d.files.length; i++) {
          f = d.files[i];
          handleFileUpload(f, function() {
            ws.snackBar('File uploaded');
            toNextPage();
          });
        }
      }

      //events.emit('AssignDataForFileUpload');
      //toNextPage();
    };

    ws.dom.ap(container,
      ws.dom.ap(
        ws.dom.cr('div','ws-table-dropzone'),
        ws.dom.cr('div', 'ws-table-dropzone-title', 'Drop CSV files here'),
        ws.dom.cr('div', 'ws-table-dropzone-subtitle', 'or'),
        ws.dom.ap(
          ws.dom.cr('div', 'ws-table-dropzone-button'),
          selectFile
        ),
        ws.dom.cr('div', 'ws-table-dropzone-subtitle ws-table-dropzone-message', 'You can also:'),
        buttonsContainer
      )
    );

    return container;
  }

  ////////////////////////////////////////////////////////////////////////////

  ws.ready(function() {
    init();
  });

  ////////////////////////////////////////////////////////////////////////////

  return {
    toolbar: toolbar,
    sortRows: sortRows,
    clear: clear,
    addRow: addRow,
    insCol: insertCol,
    delCol: delCol,
    loadCSV: loadCSV,
    getRawCSV: getRawCSV,
    toData: toData,
    toCSV: toCSV,
    toDataSeries: toDataSeries,
    getHeaderTextArr: getHeaderTextArr,
    addImportTab: addImportTab,
    hideImportModal: hideImportModal,
    showImportModal: showImportModal,
    initGSheet: initGSheet,
    on: events.on,
    resize: resize,
    loadLiveDataFromURL: loadLiveDataFromURL,
    loadLiveDataPanel: loadLiveDataPanel,
    isInCSVMode: isInCSVMode,
    //highlightSelectedFields: highlightSelectedFields,
    highlightCells: highlightCells,
    removeAllCellsHighlight: removeAllCellsHighlight,
    toggleUnwantedCells: toggleUnwantedCells,
    getColumnLength: getColumnLength,
    getDataFieldsUsed: getDataFieldsUsed,
    createSimpleDataTable: createSimpleDataTable,
    areColumnsEmpty: areColumnsEmpty,
    clearData: clearData,
    showDataTableError: showDataTableError,
    hideDataTableError: hideDataTableError,
    selectSwitchRowsColumns: selectSwitchRowsColumns
  };
};
