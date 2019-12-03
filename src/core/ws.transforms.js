

// @format

// There be dragons here...
(function() {
  var hasTransformedAdvanced = false;

  /**
     * Merges/extends advanced meta
     *  1. Find the source
     *  2. If source is also extending:
     *      2a. Recursively merge source
     *  3. Remove the extends attribute from target
     *  4. Merge source children
     */
  function mergeAdv(superset, dest, src, trigger) {
    var path = src.split('.'),
      current = superset,
      seriesNames = {
        pie: true,
        line: true
      };

    // console.log(
    //     'extending',
    //     (dest.meta.ns ? dest.meta.ns + '.' : '') + dest.meta.name,
    //     'with',
    //     src
    // );

    path.some(function(p) {
      if (current.subtree[p]) {
        current = current.subtree[p];
      } else {
        // console.log(
        //     'unable to resolve path for merge:',
        //     src,
        //     'from',
        //     dest.meta.name
        // );

        current = false;
        return true;
      }
    });

    // Stop from trying to extend this multiple times
    dest.meta.extends = dest.meta.extends.replace(src, '');

    if (current) {
      // Extend the source if needed
      extend(superset, current);

      // Unfortunatly we need to take series into special consideration
      // until we have a more robust way of handling its meta
      if (trigger && trigger.indexOf('series') === 0) {
        Object.keys(current.subtree || {}).forEach(function(key) {
          dest.subtree[key] =
            dest.subtree[key] || ws.merge({}, current.subtree[key]);
          dest.subtree[key].meta.validFor =
            dest.subtree[key].meta.validFor || {};

          if (
            dest.meta.excludes &&
            Object.keys(dest.meta.excludes).length > 0
          ) {
            dest.subtree[key].meta.validFor[current.meta.name] = !dest.meta
              .excludes[key];
          } else {
            dest.subtree[key].meta.validFor[current.meta.name] = 1;
          }
        });

      } else if ((trigger && trigger.indexOf('plotOptions') === 0) || dest.meta.ns === undefined) {
        if (!dest.meta.validFor) dest.meta.validFor = {};
        dest.meta.validFor[dest.meta.name] = 1;

        if (dest.meta.ns === undefined) {
          ws.merge(dest.subtree, current.subtree, false, dest.meta.excludes);
        } else {
          Object.keys(current.subtree || {}).forEach(function(key) {
            dest.subtree[key] =
              dest.subtree[key] || ws.merge({}, current.subtree[key]);
            dest.subtree[key].meta.validFor =
              dest.subtree[key].meta.validFor || {};
  
            if (
              dest.meta.excludes &&
              Object.keys(dest.meta.excludes).length > 0
            ) {
              dest.subtree[key].meta.validFor[current.meta.name] = !dest.meta
                .excludes[key];
            } else {
              dest.subtree[key].meta.validFor[current.meta.name] = 1;
            }
          }); 
        }

      } else {
        // Do actual extending
        ws.merge(dest.subtree, current.subtree, false, dest.meta.excludes);
      }
    }
  }

  /**
      * Extend a node
      */
  function extend(superset, node, trigger) {
    if (trigger === undefined) {
      if (node.meta.ns && node.meta.ns === "plotOptions") {
        trigger = 'plotOptions';
      }
    }
    if (node.meta.extends && node.meta.extends.length > 0) {
      node.meta.extends = node.meta.extends.replace('{', '').replace('}', '');
      if (trigger === 'series') {
        node.meta.extends += ',plotOptions.line';
      }
      
      node.meta.extends.split(',').forEach(function(part) {
        if (part && part.length > 0) {
          mergeAdv(superset, node, part.trim(), trigger);
        }
      });
    }
  }

  /**
     * Transform the tree
     * - merges
     * - arrifies
     * - sorts
     *
     * Duplicating children is faster than arrifying and replacing
     *
     */
  function transformAdv(input, onlyOnce) {
    var res;
    
    if (onlyOnce && hasTransformedAdvanced) {
      return input;
    }

    function visit(node, pname) {
      var children = (node.subtree = node.subtree || {});
      
      node.meta = node.meta || {};
      node.meta.default = node.meta.default;
      node.meta.ns = pname;
      node.children = [];

      // Take care of merging
      extend(input, node, (pname ? pname + '.' : '') + node.meta.name);

      node.meta.hasSubTree = false;

      node.children = [];

      Object.keys(children).forEach(function(child) {
        if (Object.keys(children[child].subtree).length > 0) {
          node.meta.hasSubTree = true;
        }

        node.children.push(
          visit(
            children[child],
            (pname ? pname + '.' : '') + (node.meta.name || '')
          )
        );
      });

      node.children.sort(function(a, b) {
        return a.meta.name.localeCompare(b.meta.name);
      });

      if (node.children.length === 0) {
        node.meta.leafNode = true;
      }

      return node;
    }

    // console.time('tree transform');
    res = visit(input);
    // console.timeEnd('tree transform');

    return res;
  }

  // Removes all empty objects and arrays from the input object
  function removeBlanks(input) {
    function rewind(stack) {
      if (!stack || stack.length === 0) return;

      var t = stack.pop();

      if (Object.keys(t).length === 0) {
        rewind(stack);
      } else {
        Object.keys(t || {}).forEach(function(key) {
          var child = t[key];

          if (key[0] === '_') {
            delete t[key];
          } else if (
            child &&
            !ws.isBasic(child) &&
            !ws.isArr(child) &&
            Object.keys(child).length === 0
          ) {
            delete t[key];
          } else if (ws.isArr(child) && child.length === 0) {
            delete t[key];
          } else if (ws.isArr(child)) {
            child = child.map(function(sub) {
              return removeBlanks(sub);
            });
          }
        });
      }

      rewind(stack);
    }

    function visit(node, parentStack) {
      parentStack = parentStack || [];

      if (node) {
        if (parentStack && Object.keys(node).length === 0) {
          rewind(parentStack.concat([node]));
        } else {
          Object.keys(node).forEach(function(key) {
            var child = node[key];
            if (key[0] === '_') {
              rewind(parentStack.concat([node]));
            } else if (!ws.isBasic(child) && !ws.isArr(child)) {
              visit(child, parentStack.concat([node]));
            }
          });
        }
      }
    }

    visit(input);
    return input;
  }

  ws.transform = {
    advanced: transformAdv,
    remBlanks: removeBlanks
  };
})();
