
//下拉选项
// @format

(function() {
  var dropdownItems = ws.dom.cr(
    'div',
    'ws-dropdown-items ws-dropdown-items-responsive'
  );

  ws.ready(function() {
    ws.dom.ap(document.body, dropdownItems);
  });

  /** A stylable dropdown
     *  @constructor
     *
     *  @emits Change - when the selection changes
     *  @emits Open - when the dropdown is opened
     *  @emits Close - when the dropdown is closed
     *
     *  @param parent {domnode} - the node to attach the dropdown to
     */
  ws.DropDown = function(parent, extraClasses, icons) {
    var events = ws.events(),
      container = ws.dom.cr('div', 'ws-dropdown ' + extraClasses),
      body = ws.dom.cr('div', 'ws-dropdown-body'),
      arrow = ws.dom.cr('div', 'ws-dropdown-arrow fa fa-caret-down'),
      items = [],
      selectedItem = false,
      expanded = false,
      catcher = false;

    ////////////////////////////////////////////////////////////////////////

    //Build the DOM
    function buildDOM() {
      dropdownItems.innerHTML = '';

      items.forEach(function(item) {
        ws.dom.ap(dropdownItems, item.node);
        //IE fix
        item.node.innerHTML = ''; //item.title();
        
        const icon = ws.dom.cr('span', 'ws-icon-container');
        if (icons) {
            ws.dom.ap(icon, ws.dom.style(ws.dom.cr('span'), {
              'margin-left': '2px',
              width: '15px',
              height: '15px',
              float: 'left',
              display: 'inline-block',
              "margin-right": "5px",
              "color": "rgb(66, 200, 192)",
              'background-position': 'left middle',
              'background-size': 'auto 100%',
              'background-repeat': 'no-repeat',
              'background-image':
                'url("data:image/svg+xml;utf8,' +
                encodeURIComponent(icons[item.id().toLowerCase()]) +
                '")'
            }));
        }

        ws.dom.ap(item.node, icon, ws.dom.style(ws.dom.cr('span', '', item.title() || ''), { 'position': 'relative', 'top': '3px'}));
      });
    }

    //Collapse the dropdown
    function collapse() {
      if (ws.isFn(catcher)) {
        catcher();
        catcher = false;
      }

      //Should update the container
      if (selectedItem) {
        body.innerHTML = '';
        if (icons) {      
          ws.dom.ap(body, ws.dom.style(ws.dom.cr('span'), {
            'margin-left': '2px',
            width: '15px',
            height: '15px',
            float: 'left',
            display: 'inline-block',
            "margin-right": "5px",
            "color": "rgb(66, 200, 192)",
            'background-position': 'left middle',
            'background-size': 'auto 100%',
            'background-repeat': 'no-repeat',
            'background-image':
              'url("data:image/svg+xml;utf8,' +
              encodeURIComponent(icons[selectedItem.id().toLowerCase()]) +
            '")'
          }));
        }
        body.innerHTML += selectedItem.title();
      }

      ws.dom.style(dropdownItems, {
        opacity: 0,
        left: '-20000px',
        'pointer-events': 'none'
      });

      expanded = false;
    }

    //Expand the dropdown
    function expand(e) {
      buildDOM();

      var pos = ws.dom.pos(container, true),
        s = ws.dom.size(container);

      //Quick hack for IE...
      if (!pos || !pos.x) {
        pos = {
          x: 10,
          y: 10
        };
      }

      if (!s || !s.w) {
        s = {
          w: 200,
          h: 200
        };
      }

      //Need to check the height + y to see if we need to move it

      ws.dom.style(dropdownItems, {
        opacity: 1,
        'pointer-events': 'auto',
        left: pos.x + 'px',
        top: pos.y + s.h + 4 + 'px',
        width: s.w - 1 + 'px',
        'min-height': s.h + 'px'
      });

      catcher = ws.showDimmer(collapse, true, true, 500);

      expanded = true;
    }

    //Toggle expansion
    function toggle(e) {
      expanded = !expanded;
      if (expanded) {
        return expand(e);
      }
      collapse();

      return expanded;
    }

    /** Add an item to the dropdown
         *  @memberof ws.DropDown
         *  @param item {object} - the item to add
         *    > title {string} - the title of the item
         *    > id {anyting} - the id of the item
         *    > select {function} - function to call when the item is selected
         */
    function addItem(item) {
      if (item && item.id) {
        if (!ws.isBasic(item.id)) {
          item.id = '1234';
        }
      }

      if (ws.isBasic(item)) {
        item = {
          id: item,
          title: item
        };
      }

      if (
        items.filter(function(b) {
          return b.id() === item.id;
        }).length > 0
      ) {
        return false;
      }

      var node = ws.dom.cr('div', 'ws-dropdown-item'),
        id = ws.uuid(),
        index = items.length,
        itemInstance = {
          //The node
          node: node,

          //Get the index
          index: function() {
            return index;
          },

          //Get the ID
          id: function() {
            return id;
          },

          icon: function() {
            return item.icon;
          },

          //Get the title
          title: function() {
            return ws.isStr(item) ? item : item.title || '';
          },

          //Unselect the item
          unselect: function() {
            node.className = 'ws-dropdown-item';
          },

          //Select the item
          select: function(dontEmit) {
            if (selectedItem) {
              selectedItem.unselect();
            }

            node.className =
              'ws-dropdown-item ws-dropdown-item-selected';
            selectedItem = itemInstance;

            body.innerHTML = selectedItem.title();

            if (!dontEmit) events.emit('Change', itemInstance);

            if (item && ws.isFn(item.select)) {
              item.select(itemInstance);
            }

            collapse();
          }, 

          updateOptions: function(updatedItem) {
            item = updatedItem;
          },

          setId: function(newId) {
            id = newId;
          }
        };

      if (!item) {
        return false;
      }

      if (ws.isStr(item) || ws.isNum(item)) {
        node.innerHTML = item;
        id = item;
      } else {
        
        const icon = ws.dom.cr('span', 'ws-icon-container', (item.icon ? '<i class="fa fa-' + item.icon + '" />' : ''));

        ws.dom.style(icon, {
          "margin-right": "5px",
          "color": "rgb(66, 200, 192)"
        });
        
        ws.dom.ap(node, icon, ws.dom.cr('span', '', item.title || ''));
        id = item.id; // || id;

        if (item.selected) {
          itemInstance.select();
        }
      }

      ws.dom.on(node, 'click', function(e) {
        itemInstance.select();
        e.cancelBubble = true;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      });

      items.push(itemInstance);

      return itemInstance;
    }

    /** Clear the dropdown
         *  @memberof ws.DropDown
         */
    function clear() {
      items = [];
    }

    /** Add several items to the dropdown
         *  @memberof ws.DropDown
         *  @param itemsToAdd {array} - array of items to add
         */
    function addItems(itemsToAdd) {
      if (ws.isArr(itemsToAdd)) {
        itemsToAdd.forEach(addItem);
      }
    }

    /** Set the current selection by id
         *  @memberof ws.DropDown
         *  @param id {anything} - the id to select
         */
    function selectById(id, dontEmit) {
      items.some(function(item) {
        //This is not a typo..
        if (item.id() == id) {
          item.select(dontEmit);
          return true;
        }
      });
    }

    function updateByIndex(index, details, newId) {
      items[index].updateOptions(details);
      if (newId) items[index].setId(newId);
    }

    /** Set the current selection by index
         *  @memberof ws.DropDown
         *  @param index {number} - the index to select in range [0..item.length]
         */
    function selectByIndex(index, dontEmit) {
      if (index >= 0 && index < items.length) {
        items[index].select(dontEmit);
      }
    }

    function selectAll() {
      return items;
    }

    function deleteByIndex(index) {
      items.splice(index, 1);
    }
    
    function sliceList(length) {
      items = items.slice(0, length);
    }

    function getSelectedItem() {
      return selectedItem;
    }

    ///////////////////////////////////////////////////////////////////////////

    if (parent) {
      parent = ws.dom.get(parent);
      ws.dom.ap(parent, container);
    }

    ws.dom.ap(container, body, arrow);

    ws.dom.on(container, 'click', toggle);

    return {
      container: container,
      selectById: selectById,
      selectByIndex: selectByIndex,
      selectAll: selectAll,
      updateByIndex: updateByIndex,
      deleteByIndex: deleteByIndex,
      sliceList: sliceList,
      addItems: addItems,
      getSelectedItem: getSelectedItem,
      addItem: addItem,
      clear: clear,
      on: events.on
    };
  };
})();
