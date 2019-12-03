

// @format

/** A list component
 *
 *  Creates a list with selectable items
 *
 *  @example
 *  var list = ws.List(document.body).addItem({
 *      title: 'My Item',
 *      click: function() {
 *          alert('You clicked the item!');
 *      }
 *  });
 *
 *  @constructor
 *  @param parent {domnode} - the node to attach the list to
 *  @param responsive {boolean} - set to true to get JS-based responsive functionality
 */
ws.List = function(parent, responsive, props, planCode) {
  var container = ws.dom.cr('div', 'ws-list'),
    compactIndicator = ws.dom.cr('div', 'ws-list-compact', 'compact'),
    ctx = ws.ContextMenu(),
    selectedItem = false,
    events = ws.events(),
    items = [],
    dropdowns = {},
    properties = props;

  ///////////////////////////////////////////////////////////////////////////

  /** Add an item to the list
     * @memberof ws.List
     * @param item {object} - the item meta for the item to add
     *   > title {string} - the title as displayed in the list
     *   > id {anything} - the id of the item: used for `ws.List.on('Select')`
     *   > click {function} - function to call when clicking the item
     * @returns {object} - an interface to interact with the item
     *   > id {anything} - the item id
     *   > title {string} - the title of the item
     *   > node {domnode} - the dom node for the item
     *   > select {function} - selects the item if called
     */
  function addItem(item, children, chartPreview) {
    
    var node = ws.dom.cr('a', 'item', item.title),
      nodeArrow = ws.dom.cr('span', 'item-arrow', '<i class="fa fa-angle-right" aria-hidden="true"></i>'),
      nodeChildren = ws.dom.cr('span', 'ws-list-suboptions', ''),
      iexports = {};

    ws.dom.style(nodeChildren, {
      display: 'none'
    });

    ws.dom.ap(node, nodeArrow);
    
    (children || []).forEach(function(thing) {
      selectGroup(thing);
    });

    function shouldInclude(group) {
      var doInclude = false;

      if (Object.keys(properties.availableSettings || {}).length > 0) {
        if (ws.isArr(group)) {
          group.forEach(function(sub) {
            if (shouldInclude(sub)) {
              doInclude = true;
            }
          });
        } else if (ws.isArr(group.options)) {
          group.options.forEach(function(sub) {
            if (shouldInclude(sub)) {
              doInclude = true;
            }
          });
        } else if (
          properties.availableSettings[group.id] ||
          properties.availableSettings[group.pid]
        ) {
          doInclude = true;
        }

        return doInclude;
      }

      return true;
    }


    function applyFilter(detailIndex, filteredBy, filter) {
      var selected = selectedItem, //list.selected(),
        id = selected.id,
        entry = ws.meta.optionsExtended.options[id];

      if (!selected) return false;

      //body.innerHTML = '';

      entry.forEach(function(thing) {
        selectGroup(thing, false, false, detailIndex, filteredBy, filter);
      });

      highlighted = false;
    }
        //This function has mutated into a proper mess. Needs refactoring.
    function selectGroup(group, table, options, detailIndex, filteredBy, filter) {
      var master,
        vals,
        doInclude = true,
        container,
        masterNode,
        def;

      options = chartPreview.options.getCustomized(); //userOptions;//chartPreview.options.getCustomized();
      
      if (ws.isArr(group.options)) {
        table = ws.dom.cr('div', 'ws-customizer-table');
        warningContainer = ws.dom.cr('div', 'ws-customize-warning-container'),
        warning = ws.dom.cr('div', 'ws-customize-warning', 'You need to be on a paid plan for this to work in production');
        doInclude = shouldInclude(group);

        if (group.warning && group.warning.length > 0 && 
          planCode && group.warning.indexOf(planCode) > -1) {
          ws.dom.ap(table, ws.dom.ap(warningContainer, warning));
        }

        if (!doInclude) {
          return;
        }
        
        container = ws.dom.cr('div', 'ws-customize-group' + (group.dropdown ? ' ws-list-general-drop-down' : ' ws-list-normal'), null, 'ws-list-header-' + ws.L(group.text));
        masterNode = ws.dom.cr('div', 'ws-customize-master-dropdown');
        nodeHeading = ws.dom.cr(
          'div',
          'ws-customizer-table-heading' + (group.dropdown ? ' ws-list-general-drop-down-header' : ''),
          ws.L(group.text)
        );

        if (group.dropdown) {
          dropdowns[ws.L(group.text)] = container;
          ws.dom.on(nodeHeading, 'click', function(e) {
            
            if (e.target !== this) {
              Object.keys(dropdowns).forEach(function(d) {
                if (dropdowns[d] !== container) dropdowns[d].classList.remove('active');
              });

              if (container.classList.contains('active')) {
                container.classList.remove('active');
              } else {
                container.className += ' active';
              }
            }

          });
        }


        ws.dom.ap(
          nodeChildren,
          ws.dom.ap(
            container,
            nodeHeading,
            masterNode,
            table
          )
        );

        if (group.filteredBy) {
          filter = ws.getAttr(options, group.filteredBy, detailIndex);
        }

        if (group.controlledBy) {
          master = ws.DropDown();
          ws.dom.style(masterNode, {
            display: 'block'
          });

          if (ws.isStr(group.controlledBy.options)) {
            vals = ws.getAttr(
              options,
              group.controlledBy.options,
              detailIndex
            );

            if (ws.isArr(vals)) {
              
              if (vals.length === 0) {
                ws.dom.ap(
                  parent,
                  ws.dom.cr('i', '', 'No data to display..')
                );
                return;
              }

              master.addItems(
                vals.map(function(t, i) {
                  return (
                    (group.controlledBy.optionsTitle
                      ? t[group.controlledBy.optionsTitle]
                      : '#' + (i + 1)) || '#' + (i + 1)
                  );
                })
              );

              master.selectByIndex(detailIndex || 0);

              master.on('Change', function(selected) {

                detailIndex = selected.index();

                table.innerHTML = '';

                group.options.forEach(function(sub) {
                  if (group.filteredBy) {
                    filter = ws.getAttr(
                      options,
                      group.filteredBy,
                      detailIndex
                    );
                  }
                  selectGroup(
                    sub,
                    table,
                    options,
                    detailIndex,
                    group.filteredBy,
                    filter
                  );
                });
              });

              ws.dom.ap(masterNode, master.container);
              detailIndex = detailIndex || 0;
            } else {
              return;
            }
          }
        }

        //ws.dom.ap(body, table);

        group.options.forEach(function(sub) {
          selectGroup(sub, table, options, detailIndex, group.filteredBy, filter);
        });
      } else if (typeof group.id !== 'undefined') {
        //Check if we should filter out this column
        if (filter && group.subType && group.subType.length) {
          if (!ws.arrToObj(group.subType)[filter]) {
            return;
          }
        }

        if (Object.keys(properties.availableSettings || {}).length > 0) {
          if (
            !properties.availableSettings[group.id] &&
            !properties.availableSettings[group.pid]
          ) {
            return;
          }
        }

        if (typeof group.dataIndex !== 'undefined') {
          detailIndex = group.dataIndex;
        }

        def = ws.getAttr(options, group.id, detailIndex);

        //ws.dom.ap(sub, ws.dom.cr('span', '', referenced[0].returnType));
        
        ws.dom.ap(
          table,
          ws.InspectorField(
            group.values ? 'options' : group.dataType,
            typeof def !== 'undefined'
              ? def
              : filter && group.subTypeDefaults[filter]
                ? group.subTypeDefaults[filter]
                : group.defaults,
            {
              title: ws.L('option.text.' + group.pid),
              tooltip: ws.L('option.tooltip.' + group.pid),
              values: group.values,
              custom: group.custom,
              defaults: group.defaults,
              width: group.width || 100,
              attributes: group.attributes || [],
              warning: group.warning || [],
              header: ws.L(group.pid)
            },
            function(newValue) {
              if (group.header) return;
              if (group.plugins && group.plugins.length > 0) {
                events.emit('TogglePlugins', group.id, newValue);
              }
              
              if (!group.noChange) events.emit('PropertyChange', group.id, newValue, detailIndex);
              
              ws.emit(
                'UIAction',
                'SimplePropSet',
                ws.L('option.text.' + group.pid),
                newValue
              );

              if (group.id === filteredBy) {
                //This is a master for the rest of the childs,
                //which means that we need to rebuild everything
                //here somehow and check their subType
                nodeChildren.innerHTML = '';
                applyFilter(detailIndex, filteredBy, newValue);
              }
            },
            false,
            group.id,
            planCode
          )
        );
      }
    }

    function select(e) {
      if (selectedItem) {
        selectedItem.selected = false;
        selectedItem.node.className = 'item';
        selectedItem.nodeArrow.innerHTML = '<i class="fa fa-angle-right" aria-hidden="true"></i>';
        ws.dom.style(selectedItem.nodeChildren, {
          display: "none"
        });
      }
      dropdowns = {};

      nodeArrow.innerHTML = '<i class="fa fa-angle-down" aria-hidden="true"></i>';
      nodeChildren.innerHTML = '';
      var entry = ws.meta.optionsExtended.options[item.id];
      (entry || []).forEach(function(thing) {
        selectGroup(thing);
      });

      ws.dom.style(nodeChildren, {
        display: 'block'
      });
      
      selectedItem = iexports;
      selectedItem.selected = true;
      node.className = 'item item-selected';
      events.emit('Select', item.id);
      compactIndicator.innerHTML =
        '<span class="icon fa fa-th-list"></span>' + item.title;

      if (ws.isFn(item.click)) {
        return item.click(e);
      }
    }

    if (!item.annotations) {
      ws.dom.on(node, 'click', item.onClick || select);
    }
    ws.dom.ap(container, node, nodeChildren);

    iexports = {
      id: item.id,
      title: item.title,
      node: node,
      nodeArrow: nodeArrow,
      nodeChildren: nodeChildren,
      select: select,
      selected: false
    };

    items.push(iexports);

    if (!selectedItem) {
      select();
    }

    return iexports;
  }

  /** Add a set of items to the list
     *  @memberof ws.List
     *  @param items {array<object>} - an array of items to add
     */
  function addItems(items) {
    if (ws.isArr(items)) {

      items.forEach(function(item) {
        addItem(item);
      });
    }
  }

  /** Clear all the items in the list
     *  @memberof ws.List
     */
  function clear() {
    container.innerHTML = '';
  }

  /** Force resize of the list
     *  @memberof ws.List
     */
  function resize() {
    var ps = ws.dom.size(parent),
      cs = ws.dom.size(container);

    if (responsive && ps.h < 50 && ps.h !== 0 && ps.h) {
      ws.dom.style(compactIndicator, {
        display: 'block'
      });
      ws.dom.style(container, {
        display: 'none'
      });
    } else if (responsive) {
      ws.dom.style(compactIndicator, {
        display: 'none'
      });
      ws.dom.style(container, {
        display: ''
      });
    }

    // ws.dom.style(container, {
    //     //height: ps.height + 'px'
    //     height: '100%'
    // });
  }

  /** Show the list
    *  @memberof ws.List
    */
  function show() {
    ws.dom.style(container, {});
  }

  /** Hide the list
     *  @memberof ws.List
     */
  function hide() {}

  /** Select the first item
     *  @memberof ws.List
     */
  function selectFirst() {
    if (items.length > 0) {
      items[0].select();
    }
  }

  /** Select an item
     *  @memberof ws.List
     *  @param which {string} - the id of the item to select
     */
  function select(which) {

    items.some(function(item) {
      if (which === item.title) {
        if (item.selected) return true;
        item.select();
        return true;
      }
    });
  }

  function selectDropdown(dropdownKey) {


    if (dropdowns[dropdownKey].classList.contains('active')) {
      return true;
    }

    Object.keys(dropdowns).forEach(function(d) {
      if (dropdowns[d] !== dropdowns[dropdownKey]) dropdowns[d].classList.remove('active');
    });

    if (!dropdowns[dropdownKey].classList.contains('active')) {
      dropdowns[dropdownKey].className += ' active';
    }

  }

  /** Reselect the current item
     *  @memberof ws.List
     */
  function reselect() {
    if (selectedItem) {
      selectedItem.select();
    }
  }

  /** Count the number of items currently in the list
     *  @memberof ws.List
     */
  function countItems() {
    return items.length;
  }

  /** Get the selected item
     *  @memberof ws.List
     *  @returns {object} - the selected item
     */
  function selected() {
    return selectedItem;
  }
  ///////////////////////////////////////////////////////////////////////////

  ws.dom.on(compactIndicator, 'click', function(e) {
    ctx.build(
      items.map(function(item) {
        return {
          title: item.title,
          click: item.select,
          selected: item.selected
        };
      })
    );
    ctx.show(e.clientX, e.clientY);
  });

  ws.dom.ap(parent, container, compactIndicator);

  ///////////////////////////////////////////////////////////////////////////

  //Public interface
  return {
    on: events.on,
    addItem: addItem,
    addItems: addItems,
    clear: clear,
    resize: resize,
    show: show,
    hide: hide,
    selectFirst: selectFirst,
    select: select,
    selectDropdown: selectDropdown,
    reselect: reselect,
    selected: selected,
    count: countItems,
    container: container
  };
};
