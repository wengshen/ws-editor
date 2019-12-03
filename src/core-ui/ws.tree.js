

// @format

/** Tree component
 *  For an example of formatting, build the editor with `gulp with-advanced`,
 *  and look in `src/meta/ws.options.advanced.js`.
 *
 *  @emits Select {object} - when a node is selected
 *
 *  @constructor
 *  @param parent {domnode} - the node to attach the tree to
 */
ws.Tree = function(parent) {
  var container = ws.dom.cr('div', 'ws-tree'),
    selectedNode = false,
    events = ws.events(),
    expands = {},
    expandState = {},
    selectedID = false,
    selectedPath = false,
    attachedData = {},
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
    };

  ////////////////////////////////////////////////////////////////////////////

  function createNode(child, pnode, instancedData, productFilter, myIndex) {

    var id =  (child.meta.ns ? child.meta.ns + '.' : '') +
    (!isNaN(myIndex) ? '[' + myIndex + '].' : '') +
    child.meta.name;

    var node = ws.dom.cr(
        'div',
        'node',
        '',
        id
      ),
      title = ws.dom.cr(
        'div',
        'parent-title',
        ws.uncamelize(child.meta.title || child.meta.name)
      ),
      body = ws.dom.cr('div', 'parent-body'),
      icon = ws.dom.cr('div', 'exp-col-icon fa fa-folder-o'),
      rightIcons = ws.dom.cr('div', 'right-icons'),
      remIcon = ws.dom.cr('div', 'ws-icon fa fa-minus-square-o'),
      addIcon = ws.dom.cr('div', 'ws-icon fa fa-plus-square-o'),
      index =
        (child.meta.ns ? child.meta.ns + '.' : '') +
        (myIndex ? '[' + myIndex + '].' : '') +
        //(!isNaN(myIndex) ? '[' + myIndex + '].' : '') +
        child.meta.name,
      expanded = true;

    //child.meta.fullname = index;
    child.meta.fullname = (myIndex ? child.meta.name : index);

    function pushExpandState() {
      if (
        (!child.meta.types.array &&
          typeof expandState[index] !== 'undefined') ||
        expanded
      ) {
        expandState[index] = expanded;
      }
    }

    function select() {
      if (selectedNode) {
        selectedNode.className = 'parent-title';
      }

      selectedNode = title;
      selectedPath = index;

      title.className = 'parent-title parent-title-selected';
      events.emit(
        'Select',
        child,
        title.innerHTML,
        child.data,
        productFilter,
        filters[index] ? child.data[filters[index].controller] || filters[index].default : false
      );
    }

    function expand(noSelect, force) {
      if (
        (force || !expanded) &&
        child.children.length &&
        child.meta.hasSubTree
      ) {
        icon.className = 'exp-col-icon fa fa-folder-open-o';
        ws.dom.style(body, { display: 'block' });
        expanded = true;
        pushExpandState();
      }

      if (!noSelect) {
        select();
      }

      ws.emit(
        'UIAction',
        'AdvancedTreeNavigation',
        (child.meta.ns ? child.meta.ns + '.' : '') + child.meta.name
      );
    }

    function collapse(noSelect, noPush) {
      if (expanded && child.children.length && child.meta.hasSubTree) {
        icon.className = 'exp-col-icon fa fa-folder-o';
        ws.dom.style(body, { display: 'none' });
        expanded = false;
        if (!noPush) {
          pushExpandState();
        }
      }

      if (!noSelect) {
        select();
      }
    }

    function toggle(e) {
      if (expanded) {
        collapse();
      } else {
        expand();
      }

      if (e) {
        return ws.dom.nodefault(e);
      }
    }

    function buildSubtree(activeFilter) {
      body.innerHTML = '';

      // Skip this element if it's not part of the current product
      if (
        productFilter &&
        Object.keys(child.meta.products || {}).length > 0 &&
        !child.meta.products[productFilter]
      ) {
        //return false;
      }

      if (child.meta.isArrayElement) {
        ws.dom.ap(node, ws.dom.ap(rightIcons, remIcon));

        ws.dom.on(remIcon, 'click', function(e) {
          if (confirm('Really delete the element? This cannot be undone!')) {
            var delIndex = false;

            if (selectedNode === node) {
              selectedNode.className = 'parent-title';
              selectedNode = false;
              selectedPath = false;
              events.emit('ClearSelection');
            }

            body.parentNode.removeChild(body);
            node.parentNode.removeChild(node);

            // This is a bit convuluted, but we can't do a filter
            child.meta.arrayData.some(function(a, i) {
              if (a === child.data) {
                delIndex = i;
                return true;
              }
            });

            child.meta.arrayData.splice(delIndex, 1);

            events.emit('ForceSave', attachedData);

            ws.snackBar(
              'Removed element ' +
                delIndex +
                ' from ' +
                (child.meta.ns ? child.meta.ns + '.' : '') +
                child.meta.name
            );
          }

          return ws.dom.nodefault(e);
        });
      }

      // This node contains an array of stuff
      if (child.meta.types.array) {
        ws.dom.ap(node, ws.dom.ap(rightIcons, addIcon));

        icon.className = 'exp-col-icon fa fa-th-list';
        // We need to create one child per. existing entry
        child.data = instancedData[child.meta.name] =
          instancedData[child.meta.name] || [];

        // Force it to be an array
        if (!ws.isArr(child.data)) {
          child.data = instancedData[child.meta.name] = [
            instancedData[child.meta.name]
          ];
        }

        function addArrayElementToList(data, i) {
          var cat = {
              meta: {
                name: child.meta.name,
                title: child.meta.name + '[' + i + ']',
                hasSubTree: true,
                arrayData: instancedData[child.meta.name],
                isArrayElement: true,
                types: {
                  object: 1
                }
              },
              data: data,
              // We need to clone the children since the builders
              // add data attributes to them.
              // If we don't clone, all the sub-stuff will link to
              // the last child data accross all instances.
              children: ws.merge([], child.children)
            },
            node = createNode(cat, body, data, productFilter, i);
          if (node) {
            build(cat, node.body, data, productFilter, i);
          }
        }

        ws.dom.on(addIcon, 'click', function() {
          var newElement = {};

          ws.snackBar('Added new element to ' + child.meta.name);
          child.data.push(newElement);
          addArrayElementToList(newElement, child.data.length - 1);

          events.emit('ForceSave', attachedData);
        });

        child.data.forEach(addArrayElementToList);
      } else {
        // Only allow expanding on non-array parents
        ws.dom.on(node, 'click', function() {
          expand();
        });

        ws.dom.on(icon, 'click', toggle);

        if (!child.meta.hasSubTree) {
          icon.className = 'exp-col-icon fa fa-sliders';
        }

        // Add data instance
        if (!child.meta.isArrayElement) {
          child.data = instancedData[child.meta.name] =
            instancedData[child.meta.name] || {};
        }

        // Collapsed by default
        if (!expandState[index]) {
          collapse(true, true);
        } else {
          expand(true, true);
        }

        if (index === selectedPath) {
          select();
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////

    ws.dom.ap(pnode, ws.dom.ap(node, icon, title), body);
    
    expands[index] = expand;

    buildSubtree();

    return {
      data: child.data,
      body: body,
      rebuild: buildSubtree
    };
  }

  /** Expand to show a given ID
   *  @memberof ws.Tree
   *  @param id {string} - the ID of the element to expand
   */
  function expandTo(id) {
    var prev = '';

    if (!id) return;

    id = id
      .replace(/\-\-/g, '.')
      .replace(/\-/g, '.')
      .split('.');

    id.forEach(function(seg) {
      seg = prev + seg;
      if (expands[seg]) expands[seg]();
      prev += seg + '.';
    });
  }

  /** Build the tree
   *
   *  This function takes in a transformed, compact, meta definitions
   *  for all entries in the API. The definitions are structured as an actual
   *  tree, where each node has an array of children, and a meta object with
   *  meta information such as data type, default, and GH links.
   *
   *  @memberof ws.Tree
   *  @param tree {object} - the tree to display
   *    > children {object} - the children of the node
   *    > entries {array} - array of orphan children
   *  @param pnode {domnode} - the parent node
   *  @param instancedData {object} - the actual tree data
   *  @param dataIndex {number} - the path to data in arrays
   */
  function build(tree, pnode, instancedData, productFilter, myIndex) {
    if (!tree) {
      return;
    }


    // Handled in createNode, just skip.
    if (tree.meta.types['array']) {
      return;
    }

    if (
      productFilter &&
      Object.keys(tree.meta.products || {}).length > 0 &&
      !tree.meta.products[productFilter]
    ) {
      //return;
    }

    if (ws.isArr(tree.children)) {
      tree.children.forEach(function(child) {
        var node, fstate;

        if (tree.meta.fullname && filters[tree.meta.fullname]) {

          if (child.meta && child.meta.validFor) {

            var customizedSeriesOption = productFilter.series;
            if (myIndex) customizedSeriesOption = [customizedSeriesOption[myIndex]];
            
            var found = false;
            (customizedSeriesOption || []).forEach(function(serieOption) {
              fstate = serieOption[filters[tree.meta.fullname].controller] || filters[tree.meta.fullname].default;
              if (child.meta.validFor[fstate]) found = true;
            });

            if (!found) {
              return;
            }

          }
        }

        if (!child.meta.leafNode) {
          node = createNode(child, pnode, instancedData, productFilter);
          if (node) {
            build(child, node.body, node.data, productFilter);
          }
        }
      });
    }
  }

  function getMasterData() {
    return attachedData;
  }

  function isFilterController(ns, name) {
    if (typeof filters[ns] !== 'undefined') {
      return filters[ns].controller === name;
    }
    return false;
  }

  ////////////////////////////////////////////////////////////////////////////

  ws.dom.ap(parent, container);

  ////////////////////////////////////////////////////////////////////////////

  return {
    on: events.on,
    expandTo: expandTo,
    getMasterData: getMasterData,
    isFilterController: isFilterController,
    build: function(tree, data) {
      attachedData = data;
      container.innerHTML = '';
      build(tree, container, data, data);
    }
  };
};
