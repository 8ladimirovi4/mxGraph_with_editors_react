import * as mxgraph from 'mxgraph';
import { Base64 } from 'js-base64';
import { API } from './scada'
import { HELP, isNullOrEmpty, AJAX } from './client'
import Editor, { ErrorDialog, OpenFile, Dialog } from './Editor'
import Graph, { HoverIcons } from './Graph'
import Actions from './Actions'
import ViewModeHandler from './ViewMode'
import { ColorDialog, OpenDialog, FilenameDialog, LinkDialog, EditDataDialog } from './Dialogs'
import Menus from './Menus'
import MarksService from './MarksService'
import BindingsHandler from './Bindings'
import Toolbar from './Toolbar';
import * as webix from 'webix/webix.js';
import $ from "jquery";
let { 
  mxGraphModel, 
  mxClient, 
  mxUtils, 
  mxResources, 
  mxRectangle,
  mxConstants,
  mxImage,
  mxEvent,
  mxPoint,
  mxPopupMenu,
  mxStackLayout,
  mxEventObject,
  mxCodec,
  mxEventSource,
  mxClipboard,
  mxObjectCodec,
  mxCodecRegistry,
  mxMorphing,
  mxKeyHandler,
} = mxgraph();

/**
 * Constructs a new graph editor
 */

 export default function EditorUi (editor, container, scheme) {
   mxEventSource.call(this);
   
   this.destroyFunctions = [];
   
   this.scheme = scheme;
   this.container = container || document.body;
   this.editor = editor || new Editor();
   this.dialogs = [];
   
   var graph = this.editor.graph;

  // Faster scrollwheel zoom is possible with CSS transforms
  if (graph.useCssTransforms) this.lazyZoomDelay = 0;

  // Pre-fetches submenu image or replaces with embedded image if supported
  mxPopupMenu.prototype.submenuImage = 'data:image/gif;base64,R0lGODlhCQAJAIAAAP///zMzMyH5BAEAAAAALAAAAAAJAAkAAAIPhI8WebHsHopSOVgb26AAADs=';

  // Creates the user interface
  this.actions = new Actions(this);
  //---fix---//
  //this.menus = this.createMenus();
  this.menus = new Menus(this)
   //---fix---//
  this.createDivs();
  this.createUi();
  this.refresh();

  // Disables HTML and text selection
  var textEditing = mxUtils.bind(this, function (evt) {
    if (evt == null) evt = window.event;
    return graph.isEditing() || (evt != null && this.isSelectionAllowed(evt));
  });

  // Disables text selection while not editing and no dialog visible
  if (this.container == document.body) {
    this.menubarContainer.onselectstart = textEditing;
    this.menubarContainer.onmousedown = textEditing;
    this.toolbarContainer.onselectstart = textEditing;
    this.toolbarContainer.onmousedown = textEditing;
    this.diagramContainer.onselectstart = textEditing;
    this.diagramContainer.onmousedown = textEditing;
    //this.sidebarContainer.onselectstart = textEditing;
    //this.sidebarContainer.onmousedown = textEditing;
    //this.formatContainer.onselectstart = textEditing;
    //this.formatContainer.onmousedown = textEditing;
    //this.footerContainer.onselectstart = textEditing;
    //this.footerContainer.onmousedown = textEditing;
  }

  // And uses built-in context menu while editing
  if (!this.editor.isViewMode()) {
    // Allows context menu for links in hints
    var linkHandler = function (evt) {
      if (evt != null) {
        var source = mxEvent.getSource(evt);
        if (source.nodeName == 'A') {
          while (source != null) {
            if (source.className == 'geHint') return true;
            source = source.parentNode;
          }
        }
      }
      return textEditing(evt);
    };

    if (mxClient.IS_IE && (typeof document.documentMode === 'undefined' || document.documentMode < 9)) mxEvent.addListener(this.diagramContainer, 'contextmenu', linkHandler);
    else {
      // Allows browser context menu outside of diagram and sidebar
      this.diagramContainer.oncontextmenu = linkHandler;
    }
  }

  // Contains the main graph instance inside the given panel
  graph.init(this.diagramContainer);

  // Improves line wrapping for in-place editor
  if (graph.view.getDrawPane() != null) {
    var root = graph.view.getDrawPane().ownerSVGElement;
    if (root) root.style.position = 'absolute';
  }

  // Creates hover icons
  this.hoverIcons = this.createHoverIcons();

  // Adds tooltip when mouse is over scrollbars to show space-drag panning option
  mxEvent.addListener(
    this.diagramContainer,
    'mousemove',
    mxUtils.bind(this, function (evt) {
      var off = mxUtils.getOffset(this.diagramContainer);

      if (mxEvent.getClientX(evt) - off.x - this.diagramContainer.clientWidth > 0 || mxEvent.getClientY(evt) - off.y - this.diagramContainer.clientHeight > 0) {
        this.diagramContainer.setAttribute('title', mxResources.get('panTooltip'));
      } else {
        this.diagramContainer.removeAttribute('title');
      }
    })
  );

  // Escape key hides dialogs, adds space+drag panning
  var spaceKeyPressed = false;

  // Overrides hovericons to disable while space key is pressed
  var hoverIconsIsResetEvent = this.hoverIcons.isResetEvent;
  this.hoverIcons.isResetEvent = function (evt, allowShift) {
    return spaceKeyPressed || hoverIconsIsResetEvent.apply(this, arguments);
  };

  this.keydownHandler = mxUtils.bind(this, function (evt) {
    if (evt.which == 32 /* Space */ && !graph.isEditing()) {
      spaceKeyPressed = true;
      this.hoverIcons.reset();
      graph.container.style.cursor = 'move';

      // Disables scroll after space keystroke with scrollbars
      if (!graph.isEditing() && mxEvent.getSource(evt) == graph.container) {
        mxEvent.consume(evt);
      }
    } else if (!mxEvent.isConsumed(evt) && evt.keyCode == 27 /* Escape */) {
      this.hideDialog(null, true);
    }
  });
  mxEvent.addListener(document, 'keydown', this.keydownHandler);

  this.keyupHandler = mxUtils.bind(this, function (evt) {
    graph.container.style.cursor = '';
    spaceKeyPressed = false;
  });
  mxEvent.addListener(document, 'keyup', this.keyupHandler);

  // Forces panning for middle and right mouse buttons
  var panningHandlerIsForcePanningEvent = graph.panningHandler.isForcePanningEvent;
  graph.panningHandler.isForcePanningEvent = function (me) {
    // Ctrl+left button is reported as right button in FF on Mac
    return panningHandlerIsForcePanningEvent.apply(this, arguments) || spaceKeyPressed || (mxEvent.isMouseEvent(me.getEvent()) && (this.usePopupTrigger || !mxEvent.isPopupTrigger(me.getEvent())) && ((!mxEvent.isControlDown(me.getEvent()) && mxEvent.isRightMouseButton(me.getEvent())) || mxEvent.isMiddleMouseButton(me.getEvent())));
  };

  // Ctrl/Cmd+Enter applies editing value except in Safari where Ctrl+Enter creates
  // a new line (while Enter creates a new paragraph and Shift+Enter stops)
  var cellEditorIsStopEditingEvent = graph.cellEditor.isStopEditingEvent;
  graph.cellEditor.isStopEditingEvent = function (evt) {
    return cellEditorIsStopEditingEvent.apply(this, arguments) || (evt.keyCode == 13 && ((!mxClient.IS_SF && mxEvent.isControlDown(evt)) || (mxClient.IS_MAC && mxEvent.isMetaDown(evt)) || (mxClient.IS_SF && mxEvent.isShiftDown(evt))));
  };

  // Switches toolbar for text editing
  var textMode = false;
  var fontMenu = null;
  var sizeMenu = null;
  var nodes = null;

  var updateToolbar = mxUtils.bind(this, function () {
    if (this.toolbar != null && textMode != graph.cellEditor.isContentEditing()) {
      var node = this.toolbar.container.firstChild;
      var newNodes = [];

      while (node != null) {
        var tmp = node.nextSibling;

        if (mxUtils.indexOf(this.toolbar.staticElements, node) < 0) {
          node.parentNode.removeChild(node);
          newNodes.push(node);
        }

        node = tmp;
      }

      // Saves references to special items
      var tmp1 = this.toolbar.fontMenu;
      var tmp2 = this.toolbar.sizeMenu;

      if (nodes == null) {
        this.toolbar.createTextToolbar();
      } else {
        for (var i = 0; i < nodes.length; i++) {
          this.toolbar.container.appendChild(nodes[i]);
        }

        // Restores references to special items
        this.toolbar.fontMenu = fontMenu;
        this.toolbar.sizeMenu = sizeMenu;
      }

      textMode = graph.cellEditor.isContentEditing();
      fontMenu = tmp1;
      sizeMenu = tmp2;
      nodes = newNodes;
    }
  });

  var ui = this;

  // Overrides cell editor to update toolbar
  var cellEditorStartEditing = graph.cellEditor.startEditing;
  graph.cellEditor.startEditing = function () {
    cellEditorStartEditing.apply(this, arguments);
    updateToolbar();

    if (graph.cellEditor.isContentEditing()) {
      var updating = false;

      var updateCssHandler = function () {
        if (!updating) {
          updating = true;

          window.setTimeout(function () {
            var selectedElement = graph.getSelectedElement();
            var node = selectedElement;

            while (node != null && node.nodeType != mxConstants.NODETYPE_ELEMENT) {
              node = node.parentNode;
            }

            if (node != null) {
              var css = mxUtils.getCurrentStyle(node);

              if (css != null && ui.toolbar != null) {
                // Strips leading and trailing quotes
                var ff = css.fontFamily;

                if (ff.charAt(0) == "'") {
                  ff = ff.substring(1);
                }

                if (ff.charAt(ff.length - 1) == "'") {
                  ff = ff.substring(0, ff.length - 1);
                }

                ui.toolbar.setFontName(ff);
                ui.toolbar.setFontSize(parseInt(css.fontSize));
              }
            }

            updating = false;
          }, 0);
        }
      };

      mxEvent.addListener(graph.cellEditor.textarea, 'input', updateCssHandler);
      mxEvent.addListener(graph.cellEditor.textarea, 'touchend', updateCssHandler);
      mxEvent.addListener(graph.cellEditor.textarea, 'mouseup', updateCssHandler);
      mxEvent.addListener(graph.cellEditor.textarea, 'keyup', updateCssHandler);
      updateCssHandler();
    }
  };

  var cellEditorStopEditing = graph.cellEditor.stopEditing;
  graph.cellEditor.stopEditing = function (cell, trigger) {
    cellEditorStopEditing.apply(this, arguments);
    updateToolbar();
  };

  // Enables scrollbars and sets cursor style for the container
  graph.container.setAttribute('tabindex', '0');
  graph.container.style.cursor = 'default';
  graph.container.focus();

  // Keeps graph container focused on mouse down
  var graphFireMouseEvent = graph.fireMouseEvent;
  graph.fireMouseEvent = function (evtName, me, sender) {
    if (evtName == mxEvent.MOUSE_DOWN) {
      this.container.focus();
    }

    graphFireMouseEvent.apply(this, arguments);
  };

  // Configures automatic expand on mouseover
  graph.popupMenuHandler.autoExpand = true;

  // Installs context menu
  if (this.menus) {
    graph.popupMenuHandler.factoryMethod = mxUtils.bind(this, function (menu, cell, evt) {
      this.menus.createPopupMenu(menu, cell, evt);
    });
  }

  // Hides context menu
  mxEvent.addGestureListeners(
    document,
    mxUtils.bind(this, function (evt) {
      graph.popupMenuHandler.hideMenu();
    })
  );

  // Create handler for key events
  this.keyHandler = this.createKeyHandler(editor);
  // Getter for key handler
  this.getKeyHandler = function () {
    //---fix---//
    return this.keyHandler;
    //return keyHandler;
    //---fix---//
   
  };

  // Stores the current style and assigns it to new cells
  var styles = ['rounded', 'shadow', 'dashed', 'dashPattern', 'labelBackgroundColor'];
  var connectStyles = ['shape', 'edgeStyle', 'curved', 'rounded', 'elbow', 'jumpStyle', 'jumpSize'];

  // Note: Everything that is not in styles is ignored (styles is augmented below)
  this.setDefaultStyle = function (cell) {
    try {
      var state = graph.view.getState(cell);

      if (state != null) {
        // Ignores default styles
        var clone = cell.clone();
        clone.style = '';
        var defaultStyle = graph.getCellStyle(clone);
        var values = [];
        var keys = [];

        for (var key in state.style) {
          if (defaultStyle[key] != state.style[key]) {
            values.push(state.style[key]);
            keys.push(key);
          }
        }

        // Handles special case for value "none"
        var cellStyle = graph.getModel().getStyle(state.cell);
        var tokens = cellStyle != null ? cellStyle.split(';') : [];

        for (var i = 0; i < tokens.length; i++) {
          var tmp = tokens[i];
          var pos = tmp.indexOf('=');

          if (pos >= 0) {
            var key = tmp.substring(0, pos);
            var value = tmp.substring(pos + 1);

            if (defaultStyle[key] != null && value == 'none') {
              values.push(value);
              keys.push(key);
            }
          }
        }

        // Resets current style
        if (graph.getModel().isEdge(state.cell)) {
          graph.currentEdgeStyle = {};
        } else {
          graph.currentVertexStyle = {};
        }

        this.fireEvent(new mxEventObject('styleChanged', 'keys', keys, 'values', values, 'cells', [state.cell]));
      }
    } catch (e) {
      this.handleError(e);
    }
  };
  this.clearDefaultStyle = function () {
    graph.currentEdgeStyle = mxUtils.clone(graph.defaultEdgeStyle);
    graph.currentVertexStyle = mxUtils.clone(graph.defaultVertexStyle);
    // Updates UI
    this.fireEvent(new mxEventObject('styleChanged', 'keys', [], 'values', [], 'cells', []));
  };

  // Keys that should be ignored if the cell has a value (known: new default for all cells is html=1 so
  // for the html key this effecticely only works for edges inserted via the connection handler)
  var valueStyles = ['fontFamily', 'fontSize', 'fontColor'];

  // Keys that always update the current edge style regardless of selection
  var alwaysEdgeStyles = ['edgeStyle', 'startArrow', 'startFill', 'startSize', 'endArrow', 'endFill', 'endSize'];

  // Keys that are ignored together (if one appears all are ignored)
  var keyGroups = [['startArrow', 'startFill', 'startSize', 'sourcePerimeterSpacing', 'endArrow', 'endFill', 'endSize', 'targetPerimeterSpacing'], ['strokeColor', 'strokeWidth'], ['fillColor', 'gradientColor'], valueStyles, ['opacity'], ['align'], ['html']];

  // Adds all keys used above to the styles array
  for (var i = 0; i < keyGroups.length; i++) {
    for (var j = 0; j < keyGroups[i].length; j++) {
      styles.push(keyGroups[i][j]);
    }
  }

  for (var i = 0; i < connectStyles.length; i++) {
    if (mxUtils.indexOf(styles, connectStyles[i]) < 0) {
      styles.push(connectStyles[i]);
    }
  }

  // Implements a global current style for edges and vertices that is applied to new cells
  var insertHandler = function (cells, asText) {
    var model = graph.getModel();

    model.beginUpdate();
    try {
      // Converts the value to an XML node
      var convertToNode = function (cell) {
        if (cell) {
          //delete model.cells[cell.getId()];
          //cell.setId(model.nextId);
          //model.cells[cell.getId()] = cell;

          var cellValue = model.getValue(cell);
          if (!mxUtils.isNode(cellValue)) {
            var doc = mxUtils.createXmlDocument();
            var shape = cell.isVertex() ? graph.getCellStyle(cell)[mxConstants.STYLE_SHAPE] : cell.isEdge() ? 'link' : graph.getModel().isLayer(cell) ? 'layer' : 'mxCell';

            if (!isNullOrEmpty(shape)) {
              var obj = doc.createElement(shape);
              obj.setAttribute('label', cellValue || '');
              obj.setAttribute('name', shape + cell.getId());
              model.setValue(cell, obj);
            }
          }
        }
      };

      // Applies only basic text styles
      if (asText) {
        for (var i = 0; i < cells.length; i++) {
          let cell = cells[i];
          var edge = model.isEdge(cell);
          var current = edge ? graph.currentEdgeStyle : graph.currentVertexStyle;
          var textStyles = ['fontSize', 'fontFamily', 'fontColor'];

          for (var j = 0; j < textStyles.length; j++) {
            var value = current[textStyles[j]];
            if (value != null) graph.setCellStyles(textStyles[j], value, cells);
          }
          convertToNode(cell);
        }
      } else {
        for (var i = 0; i < cells.length; i++) {
          let cell = cells[i];

          // Removes styles defined in the cell style from the styles to be applied
          var cellStyle = model.getStyle(cell);
          var tokens = cellStyle != null ? cellStyle.split(';') : [];
          var appliedStyles = styles.slice();

          for (var j = 0; j < tokens.length; j++) {
            var tmp = tokens[j];
            var pos = tmp.indexOf('=');

            if (pos >= 0) {
              var key = tmp.substring(0, pos);
              var index = mxUtils.indexOf(appliedStyles, key);

              if (index >= 0) {
                appliedStyles.splice(index, 1);
              }

              // Handles special cases where one defined style ignores other styles
              for (var k = 0; k < keyGroups.length; k++) {
                var group = keyGroups[k];

                if (mxUtils.indexOf(group, key) >= 0) {
                  for (var l = 0; l < group.length; l++) {
                    var index2 = mxUtils.indexOf(appliedStyles, group[l]);

                    if (index2 >= 0) {
                      appliedStyles.splice(index2, 1);
                    }
                  }
                }
              }
            }
          }

          // Applies the current style to the cell
          var edge = model.isEdge(cell);
          var current = edge ? graph.currentEdgeStyle : graph.currentVertexStyle;
          var newStyle = model.getStyle(cell);

          for (var j = 0; j < appliedStyles.length; j++) {
            var key = appliedStyles[j];
            var styleValue = current[key];

            if (styleValue != null && (key != 'shape' || edge)) {
              // Special case: Connect styles are not applied here but in the connection handler
              if (!edge || mxUtils.indexOf(connectStyles, key) < 0) {
                newStyle = mxUtils.setStyle(newStyle, key, styleValue);
              }
            }
          }

          model.setStyle(cell, newStyle);
          convertToNode(cell);
        }
      }
    } finally {
      model.endUpdate();
    }
  };

  graph.addListener(mxEvent.CELLS_ADDED, function (sender, evt) {
    insertHandler(evt.getProperty('cells'));
  });
  graph.addListener('cellsInserted', function (sender, evt) {
    insertHandler(evt.getProperty('cells'));
  });
  graph.addListener('textInserted', function (sender, evt) {
    insertHandler(evt.getProperty('cells'), true);
  });
  graph.connectionHandler.addListener(mxEvent.CONNECT, function (sender, evt) {
    var cells = [evt.getProperty('cell')];
    if (evt.getProperty('terminalInserted')) cells.push(evt.getProperty('terminal'));

    insertHandler(cells);
  });

  this.addListener(
    'styleChanged',
    mxUtils.bind(this, function (sender, evt) {
      // Checks if edges and/or vertices were modified
      var cells = evt.getProperty('cells');
      var vertex = false;
      var edge = false;

      if (cells.length > 0) {
        for (var i = 0; i < cells.length; i++) {
          vertex = graph.getModel().isVertex(cells[i]) || vertex;
          edge = graph.getModel().isEdge(cells[i]) || edge;

          if (edge && vertex) {
            break;
          }
        }
      } else {
        vertex = true;
        edge = true;
      }

      var keys = evt.getProperty('keys');
      var values = evt.getProperty('values');

      for (var i = 0; i < keys.length; i++) {
        var common = mxUtils.indexOf(valueStyles, keys[i]) >= 0;

        // Ignores transparent stroke colors
        if (keys[i] != 'strokeColor' || (values[i] != null && values[i] != 'none')) {
          // Special case: Edge style and shape
          if (mxUtils.indexOf(connectStyles, keys[i]) >= 0) {
            if (edge || mxUtils.indexOf(alwaysEdgeStyles, keys[i]) >= 0) {
              if (values[i] == null) {
                delete graph.currentEdgeStyle[keys[i]];
              } else {
                graph.currentEdgeStyle[keys[i]] = values[i];
              }
            }
            // Uses style for vertex if defined in styles
            else if (vertex && mxUtils.indexOf(styles, keys[i]) >= 0) {
              if (values[i] == null) {
                delete graph.currentVertexStyle[keys[i]];
              } else {
                graph.currentVertexStyle[keys[i]] = values[i];
              }
            }
          } else if (mxUtils.indexOf(styles, keys[i]) >= 0) {
            if (vertex || common) {
              if (values[i] == null) {
                delete graph.currentVertexStyle[keys[i]];
              } else {
                graph.currentVertexStyle[keys[i]] = values[i];
              }
            }

            if (edge || common || mxUtils.indexOf(alwaysEdgeStyles, keys[i]) >= 0) {
              if (values[i] == null) {
                delete graph.currentEdgeStyle[keys[i]];
              } else {
                graph.currentEdgeStyle[keys[i]] = values[i];
              }
            }
          }
        }
      }

      if (this.toolbar != null) {
        this.toolbar.setFontName(graph.currentVertexStyle['fontFamily'] || Menus.prototype.defaultFont);
        this.toolbar.setFontSize(graph.currentVertexStyle['fontSize'] || Menus.prototype.defaultFontSize);

        if (this.toolbar.edgeStyleMenu != null) {
          // Updates toolbar icon for edge style
          var edgeStyleDiv = this.toolbar.edgeStyleMenu.getElementsByTagName('div')[0];

          if (graph.currentEdgeStyle['edgeStyle'] == mxConstants.EDGESTYLE_ORTHOGONAL && graph.currentEdgeStyle['curved'] == '1') {
            edgeStyleDiv.className = 'geSprite geSprite-curved';
          } else if (graph.currentEdgeStyle['edgeStyle'] == 'straight' || graph.currentEdgeStyle['edgeStyle'] == 'none' || graph.currentEdgeStyle['edgeStyle'] == null) {
            edgeStyleDiv.className = 'geSprite geSprite-straight';
          } else if (graph.currentEdgeStyle['edgeStyle'] == mxConstants.EDGESTYLE_ENTITY_RELATION) {
            edgeStyleDiv.className = 'geSprite geSprite-entity';
          } else if (graph.currentEdgeStyle['edgeStyle'] == mxConstants.EDGESTYLE_ELBOW) {
            edgeStyleDiv.className = 'geSprite geSprite-' + (graph.currentEdgeStyle['elbow'] == 'vertical' ? 'verticalelbow' : 'horizontalelbow');
          } else if (graph.currentEdgeStyle['edgeStyle'] == mxConstants.EDGESTYLE_ISOMETRIC) {
            edgeStyleDiv.className = 'geSprite geSprite-' + (graph.currentEdgeStyle['elbow'] == 'vertical' ? 'verticalisometric' : 'horizontalisometric');
          } else {
            edgeStyleDiv.className = 'geSprite geSprite-orthogonal';
          }
        }

        if (this.toolbar.edgeShapeMenu != null) {
          // Updates icon for edge shape
          var edgeShapeDiv = this.toolbar.edgeShapeMenu.getElementsByTagName('div')[0];

          if (graph.currentEdgeStyle['shape'] == 'link') {
            edgeShapeDiv.className = 'geSprite geSprite-linkedge';
          } else if (graph.currentEdgeStyle['shape'] == 'flexArrow') {
            edgeShapeDiv.className = 'geSprite geSprite-arrow';
          } else if (graph.currentEdgeStyle['shape'] == 'arrow') {
            edgeShapeDiv.className = 'geSprite geSprite-simplearrow';
          } else {
            edgeShapeDiv.className = 'geSprite geSprite-noarrow';
          }
        }

        // Updates icon for optinal line start shape
        if (this.toolbar.lineStartMenu != null) {
          var lineStartDiv = this.toolbar.lineStartMenu.getElementsByTagName('div')[0];

          lineStartDiv.className = this.getCssClassForMarker('start', graph.currentEdgeStyle['shape'], graph.currentEdgeStyle[mxConstants.STYLE_STARTARROW], mxUtils.getValue(graph.currentEdgeStyle, 'startFill', '1'));
        }

        // Updates icon for optinal line end shape
        if (this.toolbar.lineEndMenu != null) {
          var lineEndDiv = this.toolbar.lineEndMenu.getElementsByTagName('div')[0];

          lineEndDiv.className = this.getCssClassForMarker('end', graph.currentEdgeStyle['shape'], graph.currentEdgeStyle[mxConstants.STYLE_ENDARROW], mxUtils.getValue(graph.currentEdgeStyle, 'endFill', '1'));
        }
      }
    })
  );

  // Update font size and font family labels
  if (this.toolbar) {
    var update = mxUtils.bind(this, function () {
      var ff = graph.currentVertexStyle['fontFamily'] || 'Tahoma';
      var fs = String(graph.currentVertexStyle['fontSize'] || '12');

      var state = graph.getView().getState(graph.getSelectionCell());
      if (state != null) {
        ff = state.style[mxConstants.STYLE_FONTFAMILY] || ff;
        fs = state.style[mxConstants.STYLE_FONTSIZE] || fs;

        if (ff.length > 10) {
          ff = ff.substring(0, 8) + '...';
        }
      }

      this.toolbar.setFontName(ff);
      this.toolbar.setFontSize(fs);
    });

    graph.getSelectionModel().addListener(mxEvent.CHANGE, update);
    graph.getModel().addListener(mxEvent.CHANGE, update);
  }

  // Makes sure the current layer is visible when cells are added
  graph.addListener(mxEvent.CELLS_ADDED, function (sender, evt) {
    var cells = evt.getProperty('cells');
    var parent = evt.getProperty('parent');

    if (graph.getModel().isLayer(parent) && !graph.isCellVisible(parent) && cells != null && cells.length > 0) {
      graph.getModel().setVisible(parent, true);
    }
  });

  // Global handler to hide the current menu
  this.gestureHandler = mxUtils.bind(this, function (evt) {
    if (this.currentMenu != null && mxEvent.getSource(evt) != this.currentMenu.div) {
      this.hideCurrentMenu();
    }
  });
  mxEvent.addGestureListeners(document, this.gestureHandler);

  // Updates the editor UI after the window has been resized or the orientation changes
  // Timeout is workaround for old IE versions which have a delay for DOM client sizes.
  // Should not use delay > 0 to avoid handle multiple repaints during window resize
  this.resizeHandler = mxUtils.bind(this, function () {
    window.setTimeout(
      mxUtils.bind(this, function () {
        if (this.editor.graph != null) {
          this.refresh();
        }
      }),
      0
    );
  });
  mxEvent.addListener(window, 'resize', this.resizeHandler);

  this.orientationChangeHandler = mxUtils.bind(this, function () {
    this.refresh();
  });
  mxEvent.addListener(window, 'orientationchange', this.orientationChangeHandler);

  // Workaround for bug on iOS see
  // http://stackoverflow.com/questions/19012135/ios-7-ipad-safari-landscape-innerheight-outerheight-layout-issue
  if (mxClient.IS_IOS && !window.navigator.standalone) {
    this.scrollHandler = mxUtils.bind(this, function () {
      window.scrollTo(0, 0);
    });
    mxEvent.addListener(window, 'scroll', this.scrollHandler);
  }

  /**
   * Sets the initial scrollbar locations after a file was loaded.
   */
  this.editor.addListener(
    'resetGraphView',
    mxUtils.bind(this, function () {
      this.resetScrollbars();
    })
  );

  /**
   * Repaints the grid.
   */
  this.addListener(
    'gridEnabledChanged',
    mxUtils.bind(this, function () {
      graph.view.validateBackground();
    })
  );
  this.addListener(
    'backgroundColorChanged',
    mxUtils.bind(this, function () {
      graph.view.validateBackground();
    })
  );
  /**
   * Repaints the grid.
   */
  graph.addListener(
    'gridSizeChanged',
    mxUtils.bind(this, function () {
      if (graph.isGridEnabled()) {
        graph.view.validateBackground();
      }
    })
  );

  // Resets UI, updates action and menu states
  this.editor.resetGraph();

  if (this.editor.isViewMode()) {

    this.init();
    this.open();

    this.marksService = new MarksService(this);
    this.viewHandler = new ViewModeHandler(this);
 
    this.marksService.modeEnabled = false;
  } else {
    // init bindings
    if (typeof BindingsHandler == 'function') this.bindingsHandler = new BindingsHandler(this);

    this.init();
    this.open();

    if (this.bindingsHandler != null) this.bindingsHandler.ready();

    // Open sidebar panel
    var sidebarAction = this.actions.get('sidebarPanel');
    if (sidebarAction) sidebarAction.funct();

    // Open format panel
    var formatAction = this.actions.get('formatPanel');
    if (formatAction) formatAction.funct();

    //var mgr = new mxAutoSaveManager(graph);
    //mgr.save = function()
    //{
    //   mxLog.show();
    //   mxLog.debug('save');
    //};
  }

  this.editor.setModified(false);
  this.editor.undoManager.clear();

};
mxUtils.extend(EditorUi, mxEventSource);



/**
 * Specifies the height of the menubar.
 */
EditorUi.prototype.menubarHeight = 40;
/**
 * Specifies the height of the toolbar.
 */
EditorUi.prototype.toolbarHeight = 30;
/**
 * Specifies the height of the footer. Default is 20.
 */
EditorUi.prototype.footerHeight = 20;

/**
 * Installs the listeners to update the action states.
 */
EditorUi.prototype.init = function () {
  /**
   * Keypress starts immediate editing on selection cell
   */
  var graph = this.editor.graph;

  //----> longTouch conextMenu
  let contextMenu = null;
  let bool = true;
  graph.addListener(
    mxEvent.TAP_AND_HOLD,
    function (sender, evt) {
      const cell = evt.getProperty('cell');

      //pick up active point
      graph.setSelectionCell(cell);
      if (!cell) {
        graph.clearSelection();
        }

      //create context menu
      contextMenu = new mxPopupMenu(document.createElement('div'));
      contextMenu.div.className = 'mxPopupMenu';
      this.menus.createPopupMenu(contextMenu, cell, evt, bool);

      //-------> fix bug with extra divs. case: touch by touch
      const divs = document.querySelectorAll('.mxPopupMenu');
      let num = divs.length;
      for (let i = 0; i < divs.length; i++) {
        num -= 1;
        if (num == 0) {
          break;
        } else {
          divs[i].remove();
        }
      }
      //<------- fix bug with extra divs. case: touch by touch

      //add position for context menu
      const x = evt.getProperty('event').clientX;
      const y = evt.getProperty('event').clientY;
      contextMenu.div.style.left = `${x}px`;
      contextMenu.div.style.top = `${y}px`;

      contextMenu.showMenu();
    }.bind(this)
  );

  //-------> fix bug with extra divs. case: touch switch mouse
  graph.addListener(mxEvent.CLICK, function (sender, evt) {
    const cell = evt.getProperty('cell');
    const menuContainer = document.querySelectorAll('div.mxPopupMenu');

    if (menuContainer && menuContainer.length > 1) {
      const divs = document.querySelectorAll('div.mxPopupMenu');
      divs[0].remove();
    }
  });
  //<------- fix bug with extra divs. case: touch switch mouse 

  //<---- longTouch conextMenu

  mxEvent.addGestureListeners(
    document,
    mxUtils.bind(this, function (evt) {
      if (contextMenu) contextMenu.hideMenu();
    })
  );
  mxEvent.addListener(
    graph.container,
    'keydown',
    mxUtils.bind(this, function (evt) {
      this.onKeyDown(evt);
    })
  );
  mxEvent.addListener(
    graph.container,
    'keypress',
    mxUtils.bind(this, function (evt) {
      this.onKeyPress(evt);
    })
  );

  // Updates action states
  this.addUndoListener();
  this.addBeforeUnloadListener();

  graph.getSelectionModel().addListener(
    mxEvent.CHANGE,
    mxUtils.bind(this, function () {
      this.updateActionStates();
    })
  );
  graph.getModel().addListener(
    mxEvent.CHANGE,
    mxUtils.bind(this, function () {
      this.updateActionStates();
    })
  );

  // Changes action states after change of default parent
  var graphSetDefaultParent = graph.setDefaultParent;
  var ui = this;

  this.editor.graph.setDefaultParent = function () {
    graphSetDefaultParent.apply(this, arguments);
    ui.updateActionStates();
  };

  // Hack to make editLink available in vertex handler
  graph.editLink = ui.actions.get('editLink').funct;

  this.updateActionStates();
  this.initClipboard();
  this.initCanvas();

  if (this.scheme.model != null) {
    var doc = mxUtils.parseXml(this.scheme.model);
    this.editor.setGraphXml(doc.documentElement);
  }
  this.editor.setFilename(this.scheme.name);
  this.editor.setModified(false);
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */

EditorUi.prototype.onKeyDown = function (evt) {
  var graph = this.editor.graph;

  // Tab selects next cell
  if (evt.which == 9 && graph.isEnabled() && !mxEvent.isAltDown(evt)) {
    if (graph.isEditing()) {
      graph.stopEditing(false);
    } else {
      graph.selectCell(!mxEvent.isShiftDown(evt));
    }

    mxEvent.consume(evt);
  }
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.onKeyPress = function (evt) {
  var graph = this.editor.graph;

  if (this.isImmediateEditingEvent(evt) && !graph.isEditing() && !graph.isSelectionEmpty() && evt.which !== 0 && evt.which !== 27 && !mxEvent.isAltDown(evt) && !mxEvent.isControlDown(evt) && !mxEvent.isMetaDown(evt)) {
    graph.escape();
    graph.startEditing();

    // Workaround for FF where char is lost if cursor is placed before char
    if (mxClient.IS_FF) {
      var ce = graph.cellEditor;
      ce.textarea.innerHTML = String.fromCharCode(evt.which);

      // Moves cursor to end of textarea
      var range = document.createRange();
      range.selectNodeContents(ce.textarea);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
};

/**
 * Returns true if the given event should start editing. This implementation returns true.
 */
EditorUi.prototype.isImmediateEditingEvent = function (evt) {
  return true;
};

/**
 * Private helper method.
 */
EditorUi.prototype.getCssClassForMarker = function (prefix, shape, marker, fill) {
  var result = '';

  if (shape == 'flexArrow') {
    result = marker != null && marker != mxConstants.NONE ? 'geSprite geSprite-' + prefix + 'blocktrans' : 'geSprite geSprite-noarrow';
  } else {
    if (marker == mxConstants.ARROW_CLASSIC) {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'classic' : 'geSprite geSprite-' + prefix + 'classictrans';
    } else if (marker == mxConstants.ARROW_CLASSIC_THIN) {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'classicthin' : 'geSprite geSprite-' + prefix + 'classicthintrans';
    } else if (marker == mxConstants.ARROW_OPEN) {
      result = 'geSprite geSprite-' + prefix + 'open';
    } else if (marker == mxConstants.ARROW_OPEN_THIN) {
      result = 'geSprite geSprite-' + prefix + 'openthin';
    } else if (marker == mxConstants.ARROW_BLOCK) {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'block' : 'geSprite geSprite-' + prefix + 'blocktrans';
    } else if (marker == mxConstants.ARROW_BLOCK_THIN) {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'blockthin' : 'geSprite geSprite-' + prefix + 'blockthintrans';
    } else if (marker == mxConstants.ARROW_OVAL) {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'oval' : 'geSprite geSprite-' + prefix + 'ovaltrans';
    } else if (marker == mxConstants.ARROW_DIAMOND) {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'diamond' : 'geSprite geSprite-' + prefix + 'diamondtrans';
    } else if (marker == mxConstants.ARROW_DIAMOND_THIN) {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'thindiamond' : 'geSprite geSprite-' + prefix + 'thindiamondtrans';
    } else if (marker == 'openAsync') {
      result = 'geSprite geSprite-' + prefix + 'openasync';
    } else if (marker == 'dash') {
      result = 'geSprite geSprite-' + prefix + 'dash';
    } else if (marker == 'cross') {
      result = 'geSprite geSprite-' + prefix + 'cross';
    } else if (marker == 'async') {
      result = fill == '1' ? 'geSprite geSprite-' + prefix + 'async' : 'geSprite geSprite-' + prefix + 'asynctrans';
    } else if (marker == 'circle' || marker == 'circlePlus') {
      result = fill == '1' || marker == 'circle' ? 'geSprite geSprite-' + prefix + 'circle' : 'geSprite geSprite-' + prefix + 'circleplus';
    } else if (marker == 'ERone') {
      result = 'geSprite geSprite-' + prefix + 'erone';
    } else if (marker == 'ERmandOne') {
      result = 'geSprite geSprite-' + prefix + 'eronetoone';
    } else if (marker == 'ERmany') {
      result = 'geSprite geSprite-' + prefix + 'ermany';
    } else if (marker == 'ERoneToMany') {
      result = 'geSprite geSprite-' + prefix + 'eronetomany';
    } else if (marker == 'ERzeroToOne') {
      result = 'geSprite geSprite-' + prefix + 'eroneopt';
    } else if (marker == 'ERzeroToMany') {
      result = 'geSprite geSprite-' + prefix + 'ermanyopt';
    } else {
      result = 'geSprite geSprite-noarrow';
    }
  }

  return result;
};

/**
 * Overridden in Menus.js
 */
EditorUi.prototype.createMenus = function () {
  return null;
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.updatePasteActionStates = function () {
  var graph = this.editor.graph;
  var paste = this.actions.get('paste');
  var pasteHere = this.actions.get('pasteHere');

  paste.setEnabled(this.editor.graph.cellEditor.isContentEditing() || (!mxClipboard.isEmpty() && graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent())));
  pasteHere.setEnabled(paste.isEnabled());
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.initClipboard = function () {
  var ui = this;

  // Public helper method for shared clipboard.
  mxClipboard.cellsToString = function (cells) {
    var codec = new mxCodec();
    var model = new mxGraphModel();
    var parent = model.getChildAt(model.getRoot(), 0);

    for (var i = 0; i < cells.length; i++) {
      model.add(parent, cells[i]);
    }

    return mxUtils.getXml(codec.encode(model));
  };

  var mxClipboardIsEmpty = mxClipboard.isEmpty;
  mxClipboard.isEmpty = function () {
    return mxClipboardIsEmpty.apply(this, arguments) && webix.storage.local.get('scheme.clipboard') == null;
  };

  var mxClipboardCut = mxClipboard.cut;
  mxClipboard.cut = function (graph) {
    var result = null;

    if (graph.cellEditor.isContentEditing()) {
      document.execCommand('copy', false, null);
    } else {
      result = result || graph.getSelectionCells();
      result = graph.getExportableCells(graph.model.getTopmostCells(result));

      var cloneMap = new Object();
      var lookup = graph.createCellLookup(result);
      var clones = graph.cloneCells(result, null, cloneMap);

      // Uses temporary model to force new IDs to be assigned
      // to avoid having to carry over the mapping from object
      // ID to cell ID to the paste operation
      var model = new mxGraphModel();
      var parent = model.getChildAt(model.getRoot(), 0);

      for (var i = 0; i < clones.length; i++) {
        model.add(parent, clones[i]);
      }

      graph.updateCustomLinks(graph.createCellMapping(cloneMap, lookup), clones);

      mxClipboard.insertCount = 1;
      mxClipboard.setCells(clones);
      copyCells(graph, graph.removeCells());
    }

    ui.updatePasteActionStates();

    return result;
  };

  var mxClipboardCopy = mxClipboard.copy;
  mxClipboard.copy = function (graph) {
    if (graph.cellEditor.isContentEditing()) {
      document.execCommand('copy', false, null);
    } else {
      //mxClipboardCopy.apply(this, arguments);
      copyCells(graph, graph.getSelectionCells());
    }

    ui.updatePasteActionStates();
  };

  var mxClipboardPaste = mxClipboard.paste;
  mxClipboard.paste = function (graph) {
    var result = null;

    if (graph.cellEditor.isContentEditing()) {
      document.execCommand('paste', false, null);
    } else {
      //result = mxClipboardPaste.apply(this, arguments);
      result = pasteCells(graph);
    }

    ui.updatePasteActionStates();

    return result;
  };

  // Merges XML into existing graph and layers
  var importXml = function (graph, xml, dx, dy) {
    dx = dx != null ? dx : 0;
    dy = dy != null ? dy : 0;
    var cells = [];

    try {
      var doc = mxUtils.parseXml(xml);
      var node = doc.documentElement;

      if (node != null) {
        var model = new mxGraphModel();
        var codec = new mxCodec(node.ownerDocument);
        codec.decode(node, model);

        var childCount = model.getChildCount(model.getRoot());
        var targetChildCount = graph.model.getChildCount(graph.model.getRoot());

        // Merges existing layers and adds new layers
        graph.model.beginUpdate();
        try {
          for (var i = 0; i < childCount; i++) {
            var parent = model.getChildAt(model.getRoot(), i);

            // Adds cells to existing layers if not locked
            if (targetChildCount > i) {
              // Inserts into active layer if only one layer is being pasted
              var target = childCount == 1 ? graph.getDefaultParent() : graph.model.getChildAt(graph.model.getRoot(), i);

              if (!graph.isCellLocked(target)) {
                var children = model.getChildren(parent);
                cells = cells.concat(graph.importCells(children, dx, dy, target));
              }
            } else {
              // Delta is non cascading, needs separate move for layers
              parent = graph.importCells([parent], 0, 0, graph.model.getRoot())[0];
              var children = graph.model.getChildren(parent);
              graph.moveCells(children, dx, dy);
              cells = cells.concat(children);
            }
          }
        } finally {
          graph.model.endUpdate();
        }
      }
    } catch (e) {
      alert(e);
      throw e;
    }

    return cells;
  };
  // Parses and inserts XML into graph
  var pasteText = function (graph, text) {
    var xml = mxUtils.trim(text);
    var x = graph.container.scrollLeft / graph.view.scale - graph.view.translate.x;
    var y = graph.container.scrollTop / graph.view.scale - graph.view.translate.y;

    if (xml.length > 0) {
      let gs = graph.gridSize;
      let dx = gs;
      let dy = gs;

      // Standard paste via control-v
      if (xml.substring(0, 14) == '<mxGraphModel>') {
        let cells = importXml(graph, xml, dx, dy);
        graph.setSelectionCells(cells);
        graph.scrollCellToVisible(graph.getSelectionCell());
        return cells;
      }
    }
  };

  var copyCells = function (graph, cells) {
    if (cells.length > 0) {
      var clones = graph.cloneCells(cells);

      // Checks for orphaned relative children and makes absolute
      for (var i = 0; i < clones.length; i++) {
        var state = graph.view.getState(cells[i]);

        if (state != null) {
          var geo = graph.getCellGeometry(clones[i]);

          if (geo != null && geo.relative) {
            geo.relative = false;
            geo.x = state.x / state.view.scale - state.view.translate.x;
            geo.y = state.y / state.view.scale - state.view.translate.y;
          }
        }
      }

      webix.storage.local.put('scheme.clipboard', mxClipboard.cellsToString(clones));
    }
  };
  var pasteCells = function (graph) {
    if (graph.isEnabled()) {
      var xml = ui.extractGraphModelFromEvent(graph.getEventSource());
      let data = xml != null && xml.length > 0 ? xml : webix.storage.local.get('scheme.clipboard');
      return pasteText(graph, data);
    }
  };

  // Overrides cell editor to update paste action state
  var cellEditorStartEditing = this.editor.graph.cellEditor.startEditing;

  this.editor.graph.cellEditor.startEditing = function () {
    cellEditorStartEditing.apply(this, arguments);
    ui.updatePasteActionStates();
  };

  var cellEditorStopEditing = this.editor.graph.cellEditor.stopEditing;

  this.editor.graph.cellEditor.stopEditing = function (cell, trigger) {
    cellEditorStopEditing.apply(this, arguments);
    ui.updatePasteActionStates();
  };

  this.updatePasteActionStates();
};

/**
 * Initializes the infinite canvas.
 */
EditorUi.prototype.lazyZoomDelay = 20;

/**
 * Initializes the infinite canvas.
 */
EditorUi.prototype.initCanvas = function () {
  // Initial page layout view, scrollBuffer and timer-based scrolling
  var graph = this.editor.graph;
  graph.timerAutoScroll = true;

  /**
   * Returns the padding for pages in page view with scrollbars.
   */
  graph.getPagePadding = function () {
    return new mxPoint(Math.max(0, Math.round((graph.container.offsetWidth - 34) / graph.view.scale)), Math.max(0, Math.round((graph.container.offsetHeight - 34) / graph.view.scale)));
  };

  // Fits the number of background pages to the graph
  graph.view.getBackgroundPageBounds = function () {
    var layout = this.graph.getPageLayout();
    var page = this.graph.getPageSize();

    return new mxRectangle(this.scale * (this.translate.x + layout.x * page.width), this.scale * (this.translate.y + layout.y * page.height), this.scale * layout.width * page.width, this.scale * layout.height * page.height);
  };

  graph.getPreferredPageSize = function (bounds, width, height) {
    var pages = this.getPageLayout();
    var size = this.getPageSize();

    return new mxRectangle(0, 0, pages.width * size.width, pages.height * size.height);
  };

  // Scales pages/graph to fit available size
  var resize = null;
  var ui = this;

  if (this.editor.isViewMode()) {
    resize = mxUtils.bind(this, function (autoscale, maxScale, cx, cy) {
      if (graph.container != null) {
        cx = cx != null ? cx : 0;
        cy = cy != null ? cy : 0;

        var bds = graph.pageVisible ? graph.view.getBackgroundPageBounds() : graph.getGraphBounds();
        var scroll = mxUtils.hasScrollbars(graph.container);
        var tr = graph.view.translate;
        var s = graph.view.scale;

        // Normalizes the bounds
        var b = mxRectangle.fromRectangle(bds);
        b.x = b.x / s - tr.x;
        b.y = b.y / s - tr.y;
        b.width /= s;
        b.height /= s;

        var st = graph.container.scrollTop;
        var sl = graph.container.scrollLeft;
        var sb = document.documentMode >= 8 ? 20 : 14;

        if (document.documentMode == 8 || document.documentMode == 9) {
          sb += 3;
        }

        var cw = graph.container.offsetWidth - sb;
        var ch = graph.container.offsetHeight - sb;

        var ns = autoscale ? Math.max(0.3, Math.min(maxScale || 1, cw / b.width)) : s;
        var dx = (cw - ns * b.width) / 2 / ns;
        var dy = (ch - ns * b.height) / 4 / ns;

        if (scroll) {
          dx = Math.max(dx, 0);
          dy = Math.max(dy, 0);
        }

        if (scroll || bds.width < cw || bds.height < ch) {
          graph.view.scaleAndTranslate(ns, Math.floor(dx - b.x), Math.floor(dy - b.y));
          graph.container.scrollTop = (st * ns) / s;
          graph.container.scrollLeft = (sl * ns) / s;
        } else if (cx != 0 || cy != 0) {
          var t = graph.view.translate;
          graph.view.setTranslate(Math.floor(t.x + cx / s), Math.floor(t.y + cy / s));
        }
      }
    });

    // Hack to make function available to subclassers
    this.viewModeResize = resize;
    this.viewModeWindowResize = mxUtils.bind(this, function () {
      this.viewModeResize(false);
    });

    // Removable resize listener
    var autoscaleResize = mxUtils.bind(this, function () {
      this.viewModeWindowResize(false);
    });
    mxEvent.addListener(window, 'resize', autoscaleResize);

    this.destroyFunctions.push(function () {
      mxEvent.removeListener(window, 'resize', autoscaleResize);
    });

    this.editor.addListener(
      'resetGraphView',
      mxUtils.bind(this, function () {
        this.viewModeResize(true);
      })
    );

    this.actions.get('zoomIn').funct = mxUtils.bind(this, function (evt) {
      graph.zoomIn();
        this.viewModeResize(false);
    });
    this.actions.get('zoomOut').funct = mxUtils.bind(this, function (evt) {
      graph.zoomOut();
        this.viewModeResize(false);
    });

    // Creates toolbar for viewer
    this.viewModeToolbar = document.createElement('div');
    this.viewModeToolbar.style.position = 'fixed';
    this.viewModeToolbar.style.overflow = 'hidden';
    this.viewModeToolbar.style.boxSizing = 'border-box';
    this.viewModeToolbar.style.whiteSpace = 'nowrap';
    this.viewModeToolbar.style.backgroundColor = '#000000';
    this.viewModeToolbar.style.padding = '6px';
    this.viewModeToolbar.style.right = '0px';
    this.viewModeToolbar.style.bottom = '0px';
    this.viewModeToolbar.className = 'toolbar';

    mxUtils.setPrefixedStyle(this.viewModeToolbar.style, 'borderRadius', '10px');
    mxUtils.setPrefixedStyle(this.viewModeToolbar.style, 'transition', 'opacity 600ms ease-in-out');

    var updateViewModeToolbarPosition = mxUtils.bind(this, function () {
      var css = mxUtils.getCurrentStyle(graph.container);
      this.viewModeToolbar.style.bottom = (css != null ? parseInt(css['margin-bottom'] || 0) : 0) + 20 + 'px';
    });
    this.editor.addListener('resetGraphView', updateViewModeToolbarPosition);

    updateViewModeToolbarPosition();

    var addButton = mxUtils.bind(this, function (fn, imgSrc, tip) {
      var a = document.createElement('span');
      a.style.paddingLeft = '8px';
      a.style.paddingRight = '8px';
      a.style.cursor = 'pointer';
      mxEvent.addListener(a, 'click', fn);

      if (tip != null) a.setAttribute('title', tip);

      var img = document.createElement('img');
      img.setAttribute('border', '0');
      img.setAttribute('src', imgSrc);
      img.setAttribute('width', 20);
      img.setAttribute('height', 20);

      a.appendChild(img);
      this.viewModeToolbar.appendChild(a);

      return a;
    });

    addButton(
      mxUtils.bind(this, function (evt) {
          this.actions.get('zoomOut').funct();
        mxEvent.consume(evt);
      }),
      Editor.zoomOutLargeImage,
      mxResources.get('zoomOut') + ' (Alt+Mousewheel)'
    );
    addButton(
      mxUtils.bind(this, function (evt) {
          this.actions.get('zoomIn').funct();
        mxEvent.consume(evt);
      }),
      Editor.zoomInLargeImage,
      mxResources.get('zoomIn') + ' (Alt+Mousewheel)'
    );
    addButton(
      mxUtils.bind(this, function (evt) {
        this.viewModeResize(true);
        mxEvent.consume(evt);
      }),
      Editor.actualSizeLargeImage,
      mxResources.get('fit')
    );
    // @if !LINKMT
    if (API.USER.hasPermission('scheme.exec_cmd')) {
      addButton(
        mxUtils.bind(this, function (evt) {
          this.marksService.onModeButtonClick();
        }),
        Editor.marksImage,
        'Редактировать пометки'
      );
    }
    // @endif
    // Changes toolbar opacity on hover
    var fadeThread = null;
    var fadeThread2 = null;

    var fadeOut = mxUtils.bind(this, function (delay) {
      //---fix---//
      // if (fadeThread != null) {
      //   window.clearTimeout(fadeThread);
      //   fadeThead = null;
      // }
      // if (fadeThread2 != null) {
      //   window.clearTimeout(fadeThread2);
      //   fadeThead2 = null;
      // }

      // fadeThread = window.setTimeout(
      //   mxUtils.bind(this, function () {
      //     mxUtils.setOpacity(this.viewModeToolbar, 0);
      //     fadeThread = null;

      //     fadeThread2 = window.setTimeout(
      //       mxUtils.bind(this, function () {
      //         this.viewModeToolbar.style.display = 'none';
      //         fadeThread2 = null;
      //       }),
      //       600
      //     );
      //   }),
      //   delay || 200
      // );
        //---fix---//
    });
    var fadeIn = mxUtils.bind(this, function (opacity) {
      //---fix---//
      // if (fadeThread != null) {
      //   window.clearTimeout(fadeThread);
      //   fadeThead = null;
      // }
      // if (fadeThread2 != null) {
      //   window.clearTimeout(fadeThread2);
      //   fadeThead2 = null;
      // }

      // this.viewModeToolbar.style.display = '';
      // mxUtils.setOpacity(this.viewModeToolbar, opacity || 30);
      //---fix---//
    });

    this.layersDialog = null;
    var layersButton = addButton(
      mxUtils.bind(this, function (evt) {
        if (this.layersDialog != null) {
          this.layersDialog.parentNode.removeChild(this.layersDialog);
          this.layersDialog = null;
        } else {
          this.layersDialog = graph.createLayersDialog();
          mxEvent.addListener(
            this.layersDialog,
            'mouseleave',
            mxUtils.bind(this, function () {
              this.layersDialog.parentNode.removeChild(this.layersDialog);
              this.layersDialog = null;
            })
          );

          var r = layersButton.getBoundingClientRect();

          mxUtils.setPrefixedStyle(this.layersDialog.style, 'borderRadius', '5px');
          this.layersDialog.style.position = 'fixed';
          this.layersDialog.style.fontFamily = mxConstants.DEFAULT_FONTFAMILY;
          this.layersDialog.style.backgroundColor = '#000000';
          this.layersDialog.style.width = '160px';
          this.layersDialog.style.padding = '4px 2px 4px 2px';
          this.layersDialog.style.color = '#ffffff';
          mxUtils.setOpacity(this.layersDialog, 70);
          this.layersDialog.style.right = 0;
          this.layersDialog.style.bottom = parseInt(this.viewModeToolbar.style.bottom) + this.viewModeToolbar.offsetHeight + 4 + 'px';
          this.layersDialog.className = 'layers';
          // Puts the dialog on top of the container z-index
          var style = mxUtils.getCurrentStyle(this.editor.graph.container);
          this.layersDialog.style.zIndex = 2;

          document.body.appendChild(this.layersDialog);
        }
        mxEvent.consume(evt);
      }),
      Editor.layersLargeImage,
      mxResources.get('layers')
    );

    // Shows/hides layers button depending on content
    var model = graph.getModel();
    model.addListener(mxEvent.CHANGE, function () {
      layersButton.style.display = model.getChildCount(model.root) > 1 ? '' : 'none';
    });

    // @if !LINKMT
    addButton(
      mxUtils.bind(this, function (evt) {
        this.actions.get('print').funct();
        mxEvent.consume(evt);
      }),
      Editor.printLargeImage,
      mxResources.get('print')
    );
    // @endif
    addButton(
      mxUtils.bind(this, function (evt) {
        window.location.reload();
        mxEvent.consume(evt);
      }),
      Editor.refreshLargeImage,
      mxResources.get('refresh')
    );

    // Initial state invisible
    this.viewModeToolbar.style.display = 'none';
    mxUtils.setPrefixedStyle(this.viewModeToolbar.style, 'transform', 'translate(0,0)');
    graph.container.appendChild(this.viewModeToolbar);

    mxEvent.addListener(
      graph.container,
      mxClient.IS_POINTER ? 'pointermove' : 'mousemove',
      mxUtils.bind(this, function (evt) {
        if (!mxEvent.isTouchEvent(evt)) {
          fadeIn(30);
          fadeOut();
        }
      })
    );

    mxEvent.addListener(this.viewModeToolbar, mxClient.IS_POINTER ? 'pointermove' : 'mousemove', function (evt) {
      mxEvent.consume(evt);
    });
    mxEvent.addListener(
      this.viewModeToolbar,
      'mouseenter',
      mxUtils.bind(this, function (evt) {
        fadeIn(100);
      })
    );
    mxEvent.addListener(
      this.viewModeToolbar,
      'mousemove',
      mxUtils.bind(this, function (evt) {
        fadeIn(100);
        mxEvent.consume(evt);
      })
    );
    mxEvent.addListener(
      this.viewModeToolbar,
      'mouseleave',
      mxUtils.bind(this, function (evt) {
        if (!mxEvent.isTouchEvent(evt)) fadeIn(30);
      })
    );

    // Shows/hides toolbar for touch devices
    var tol = graph.getTolerance();
    graph.addMouseListener({
      startX: 0,
      startY: 0,
      scrollLeft: 0,
      scrollTop: 0,
      mouseDown: function (sender, me) {
        this.startX = me.getGraphX();
        this.startY = me.getGraphY();
        this.scrollLeft = graph.container.scrollLeft;
        this.scrollTop = graph.container.scrollTop;
      },
      mouseMove: function (sender, me) {},
      mouseUp: function (sender, me) {
        if (mxEvent.isTouchEvent(me.getEvent())) {
          if (Math.abs(this.scrollLeft - graph.container.scrollLeft) < tol && Math.abs(this.scrollTop - graph.container.scrollTop) < tol && Math.abs(this.startX - me.getGraphX()) < tol && Math.abs(this.startY - me.getGraphY()) < tol) {
            if (parseFloat(ui.viewModeToolbar.style.opacity || 0) > 0) fadeOut();
            else fadeIn(30);
          }
        }
      },
    });

    // Installs handling of highlight and handling links to relative links and anchors
    graph.addClickHandler();
  } else if (this.editor.extendCanvas) {
    /**
     * Guesses autoTranslate to avoid another repaint (see below).
     * Works if only the scale of the graph changes or if pages
     * are visible and the visible pages do not change.
     */
    var graphViewValidate = graph.view.validate;
    graph.view.validate = function () {
      if (this.graph.container != null && mxUtils.hasScrollbars(this.graph.container)) {
        var pad = this.graph.getPagePadding();
        var size = this.graph.getPageSize();

        //var tx = this.translate.x;
        //var ty = this.translate.y;
        this.translate.x = pad.x - (this.x0 || 0) * size.width;
        this.translate.y = pad.y - (this.y0 || 0) * size.height;
      }

      graphViewValidate.apply(this, arguments);
    };

    var graphSizeDidChange = graph.sizeDidChange;
    graph.sizeDidChange = function () {
      if (this.container != null && mxUtils.hasScrollbars(this.container)) {
        var pages = this.getPageLayout();
        var pad = this.getPagePadding();
        var size = this.getPageSize();

        // Updates the minimum graph size
        var minw = Math.ceil(2 * pad.x + pages.width * size.width);
        var minh = Math.ceil(2 * pad.y + pages.height * size.height);

        var min = graph.minimumGraphSize;
        if (min == null || min.width != minw || min.height != minh) graph.minimumGraphSize = new mxRectangle(0, 0, minw, minh);

        // Updates auto-translate to include padding and graph size
        var dx = pad.x - pages.x * size.width;
        var dy = pad.y - pages.y * size.height;

        if (!this.autoTranslate && (this.view.translate.x != dx || this.view.translate.y != dy)) {
          this.autoTranslate = true;
          this.view.x0 = pages.x;
          this.view.y0 = pages.y;

          // NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
          // BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
          // SHOULD MOVE TRANSLATE/SCALE TO VIEW.
          var tx = graph.view.translate.x;
          var ty = graph.view.translate.y;
          graph.view.setTranslate(dx, dy);

          // LATER: Fix rounding errors for small zoom
          graph.container.scrollLeft += Math.round((dx - tx) * graph.view.scale);
          graph.container.scrollTop += Math.round((dy - ty) * graph.view.scale);

          this.autoTranslate = false;

          return;
        }

        graphSizeDidChange.apply(this, arguments);
      } else {
        // Fires event but does not invoke superclass
        this.fireEvent(new mxEventObject(mxEvent.SIZE, 'bounds', this.getGraphBounds()));
      }
    };
  }

  // Accumulates the zoom factor while the rendering is taking place
  // so that not the complete sequence of zoom steps must be painted
  graph.updateZoomTimeout = null;
  graph.cumulativeZoomFactor = 1;

  var cursorPosition = null;

  graph.lazyZoom = function (zoomIn) {
    if (this.updateZoomTimeout != null) window.clearTimeout(this.updateZoomTimeout);

    // Switches to 1% zoom steps below 15%. Lower bound depdends on rounding below
    if (zoomIn) {
      if (this.view.scale * this.cumulativeZoomFactor < 0.15) this.cumulativeZoomFactor = (this.view.scale + 0.01) / this.view.scale;
      else {
        // Uses to 5% zoom steps for better grid rendering in webkit and to avoid rounding errors for zoom steps
        this.cumulativeZoomFactor *= this.zoomFactor;
        this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale;
      }
    } else {
      if (this.view.scale * this.cumulativeZoomFactor <= 0.15) this.cumulativeZoomFactor = (this.view.scale - 0.01) / this.view.scale;
      else {
        // Uses to 5% zoom steps for better grid rendering in webkit and to avoid rounding errors for zoom steps
        this.cumulativeZoomFactor /= this.zoomFactor;
        this.cumulativeZoomFactor = Math.round(this.view.scale * this.cumulativeZoomFactor * 20) / 20 / this.view.scale;
      }
    }

    this.cumulativeZoomFactor = Math.max(0.01, Math.min(this.view.scale * this.cumulativeZoomFactor, 160) / this.view.scale);
    this.updateZoomTimeout = window.setTimeout(
      mxUtils.bind(this, function () {
        var offset = mxUtils.getOffset(graph.container);
        var dx = 0;
        var dy = 0;

        if (cursorPosition != null) {
          dx = graph.container.offsetWidth / 2 - cursorPosition.x + offset.x;
          dy = graph.container.offsetHeight / 2 - cursorPosition.y + offset.y;
        }

        var prev = this.view.scale;
        this.zoom(this.cumulativeZoomFactor);
        var s = this.view.scale;

        if (s != prev) {
          if (resize != null) {
            ui.viewModeResize(false, null, dx * (this.cumulativeZoomFactor - 1), dy * (this.cumulativeZoomFactor - 1));
          }

          if (mxUtils.hasScrollbars(graph.container) && (dx != 0 || dy != 0)) {
            graph.container.scrollLeft -= dx * (this.cumulativeZoomFactor - 1);
            graph.container.scrollTop -= dy * (this.cumulativeZoomFactor - 1);
          }
        }

        this.cumulativeZoomFactor = 1;
        this.updateZoomTimeout = null;
      }),
      this.lazyZoomDelay
    );
  };

  mxEvent.addMouseWheelListener(
    mxUtils.bind(this, function (evt, up) {
      // Ctrl+wheel (or pinch on touchpad) is a native browser zoom event is OS X
      // LATER: Add support for zoom via pinch on trackpad for Chrome in OS X
      if ((this.dialogs == null || this.dialogs.length == 0) && graph.isZoomWheelEvent(evt)) {
        var source = mxEvent.getSource(evt);
        while (source != null) {
          if (source == graph.container) {
            cursorPosition = new mxPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
            graph.lazyZoom(up);
            mxEvent.consume(evt);
            return false;
          }

          source = source.parentNode;
        }
      }
    }),
    graph.container
  );
};

/**
 * Creates a temporary graph instance for rendering off-screen content.
 */
EditorUi.prototype.createTemporaryGraph = function (stylesheet) {
  var graph = new Graph(document.createElement('div'), null, null, stylesheet);
  graph.resetViewOnRootChange = false;
  graph.setConnectable(false);
  graph.gridEnabled = false;
  graph.autoScroll = false;
  graph.setTooltips(false);
  graph.setEnabled(false);

  // Container must be in the DOM for correct HTML rendering
  graph.container.style.visibility = 'hidden';
  graph.container.style.position = 'absolute';
  graph.container.style.overflow = 'hidden';
  graph.container.style.height = '1px';
  graph.container.style.width = '1px';

  return graph;
};

EditorUi.prototype.isDiagramEmpty = function () {
  var model = this.editor.graph.getModel();
  return model.getChildCount(model.root) == 1 && model.getChildCount(model.getChildAt(model.root, 0)) == 0;
};

/**
 * Hook for allowing selection and context menu for certain events.
 */
EditorUi.prototype.isSelectionAllowed = function (evt) {
  let src = mxEvent.getSource(evt);
  return (src && src.nodeName == 'SELECT') || (src.nodeName == 'INPUT' && mxUtils.isAncestorNode(this.formatContainer, src));
};

/**
 * Installs dialog if browser window is closed without saving
 * This must be disabled during save and image export.
 */
EditorUi.prototype.addBeforeUnloadListener = function () {
  // Installs dialog if browser window is closed without saving (This must be disabled during save and image export)
  window.onbeforeunload = mxUtils.bind(this, function () {
    if (!this.editor.isViewMode()) return this.onBeforeUnload();
  });
};

/**
 * Sets the onbeforeunload for the application
 */
EditorUi.prototype.onBeforeUnload = function () {
  if (this.editor.modified) return mxResources.get('allChangesLost');
};

/**
 * Opens the current diagram via the window.opener if one exists.
 */
EditorUi.prototype.open = function () {
  // Cross-domain window access is not allowed in FF, so if we
  // were opened from another domain then this will fail.
  try {
    if (window.opener != null && window.opener.openFile != null) {
      window.opener.openFile.setConsumer(
        mxUtils.bind(this, function (xml, filename) {
          try {
            if (filename != null) {
              var doc = mxUtils.parseXml(xml);
              this.editor.setGraphXml(doc.documentElement);
              this.editor.setFilename(filename);
              this.editor.setModified(false);
              this.editor.undoManager.clear();
            }
            return;
          } catch (e) {
            console.log(mxResources.get('invalidOrMissingFile') + ': ' + e.message)
            // messageError(mxResources.get('invalidOrMissingFile') + ': ' + e.message);
          }
        })
      );
    }
  } catch (e) {
    // ignore
  }

  // Fires as the last step if no file was loaded
  this.editor.graph.view.validate();

  // Required only in special cases where an initial file is opened and the minimumGraphSize changes and CSS must be updated.
  this.editor.graph.sizeDidChange();
  this.editor.fireEvent(new mxEventObject('resetGraphView'));
};

/**
 * Sets the current menu and element.
 */
EditorUi.prototype.setCurrentMenu = function (menu, elt) {
  this.currentMenuElt = elt;
  this.currentMenu = menu;
};

/**
 * Resets the current menu and element.
 */
EditorUi.prototype.resetCurrentMenu = function () {
  this.currentMenuElt = null;
  this.currentMenu = null;
};

/**
 * Hides and destroys the current menu.
 */
EditorUi.prototype.hideCurrentMenu = function () {
  if (this.currentMenu != null) {
    this.currentMenu.hideMenu();
    this.resetCurrentMenu();
  }
};

/**
 * Updates the document title.
 */
EditorUi.prototype.createHoverIcons = function () {
  return new HoverIcons(this.editor.graph);
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.redo = function () {
  try {
    var graph = this.editor.graph;

    if (graph.isEditing()) {
      document.execCommand('redo', false, null);
    } else {
      this.editor.undoManager.redo();
    }
  } catch (e) {
    // ignore all errors
  }
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.undo = function () {
  try {
    var graph = this.editor.graph;

    if (graph.isEditing()) {
      // Stops editing and executes undo on graph if native undo
      // does not affect current editing value
      var value = graph.cellEditor.textarea.innerHTML;
      document.execCommand('undo', false, null);

      if (value == graph.cellEditor.textarea.innerHTML) {
        graph.stopEditing(true);
        this.editor.undoManager.undo();
      }
    } else {
      this.editor.undoManager.undo();
    }
  } catch (e) {
    // ignore all errors
  }
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.canRedo = function () {
  return this.editor.graph.isEditing() || this.editor.undoManager.canRedo();
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.canUndo = function () {
  return this.editor.graph.isEditing() || this.editor.undoManager.canUndo();
};

/**
 *
 */
EditorUi.prototype.getEditBlankXml = function () {
  return mxUtils.getXml(this.editor.getGraphXml());
};

/**
 * Returns the URL for a copy of this editor with no state.
 */
EditorUi.prototype.getUrl = function (pathname) {
  //---fix---//
  // var href = pathname != null ? pathname : window.location.pathname;
  // var parms = href.indexOf('?') > 0 ? 1 : 0;

  // // Removes template URL parameter for new blank diagram
  // for (var key in urlParams) {
  //   if (parms == 0) {
  //     href += '?';
  //   } else {
  //     href += '&';
  //   }

  //   href += key + '=' + urlParams[key];
  //   parms++;
  // }

  // return href;
   //---fix---//
};

/**
 * Specifies if the graph has scrollbars.
 */
EditorUi.prototype.setScrollbars = function (value) {
  var graph = this.editor.graph;
  var prev = graph.container.style.overflow;
  graph.scrollbars = value;
  this.editor.updateGraphComponents();

  if (prev != graph.container.style.overflow) {
    if (graph.container.style.overflow == 'hidden') {
      var t = graph.view.translate;
      graph.view.setTranslate(t.x - graph.container.scrollLeft / graph.view.scale, t.y - graph.container.scrollTop / graph.view.scale);
      graph.container.scrollLeft = 0;
      graph.container.scrollTop = 0;
      graph.minimumGraphSize = null;
      graph.sizeDidChange();
    } else {
      var dx = graph.view.translate.x;
      var dy = graph.view.translate.y;

      graph.view.translate.x = 0;
      graph.view.translate.y = 0;
      graph.sizeDidChange();
      graph.container.scrollLeft -= Math.round(dx * graph.view.scale);
      graph.container.scrollTop -= Math.round(dy * graph.view.scale);
    }
  }

  this.fireEvent(new mxEventObject('scrollbarsChanged'));
};

/**
 * Returns true if the graph has scrollbars.
 */
EditorUi.prototype.hasScrollbars = function () {
  return this.editor.graph.scrollbars;
};

/**
 * Resets the state of the scrollbars.
 */
EditorUi.prototype.resetScrollbars = function () {
  var graph = this.editor.graph;

  if (!this.editor.extendCanvas) {
    graph.container.scrollTop = 0;
    graph.container.scrollLeft = 0;

    if (!mxUtils.hasScrollbars(graph.container)) {
      graph.view.setTranslate(0, 0);
    }
  } else if (!this.editor.isViewMode()) {
    if (mxUtils.hasScrollbars(graph.container)) {
      if (graph.pageVisible) {
        var pad = graph.getPagePadding();
        graph.container.scrollTop = Math.floor(pad.y - this.editor.initialTopSpacing) - 1;
        graph.container.scrollLeft = Math.floor(Math.min(pad.x, (graph.container.scrollWidth - graph.container.clientWidth) / 2)) - 1;

        // Scrolls graph to visible area
        var bounds = graph.getGraphBounds();

        if (bounds.width > 0 && bounds.height > 0) {
          if (bounds.x > graph.container.scrollLeft + graph.container.clientWidth * 0.9) {
            graph.container.scrollLeft = Math.min(bounds.x + bounds.width - graph.container.clientWidth, bounds.x - 10);
          }

          if (bounds.y > graph.container.scrollTop + graph.container.clientHeight * 0.9) {
            graph.container.scrollTop = Math.min(bounds.y + bounds.height - graph.container.clientHeight, bounds.y - 10);
          }
        }
      } else {
        var bounds = graph.getGraphBounds();
        var width = Math.max(bounds.width, graph.scrollTileSize.width * graph.view.scale);
        var height = Math.max(bounds.height, graph.scrollTileSize.height * graph.view.scale);
        graph.container.scrollTop = Math.floor(Math.max(0, bounds.y - Math.max(20, (graph.container.clientHeight - height) / 4)));
        graph.container.scrollLeft = Math.floor(Math.max(0, bounds.x - Math.max(0, (graph.container.clientWidth - width) / 2)));
      }
    } else {
      // This code is not actively used since the default for scrollbars is always true
      if (graph.pageVisible) {
        var b = graph.view.getBackgroundPageBounds();
        graph.view.setTranslate(Math.floor(Math.max(0, (graph.container.clientWidth - b.width) / 2) - b.x), Math.floor(Math.max(0, (graph.container.clientHeight - b.height) / 2) - b.y));
      } else {
        var bounds = graph.getGraphBounds();
        graph.view.setTranslate(Math.floor(Math.max(0, Math.max(0, (graph.container.clientWidth - bounds.width) / 2) - bounds.x)), Math.floor(Math.max(0, Math.max(20, (graph.container.clientHeight - bounds.height) / 4)) - bounds.y));
      }
    }
  }
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageVisible = function (value) {
  var graph = this.editor.graph;
  var hasScrollbars = mxUtils.hasScrollbars(graph.container);
  var tx = 0;
  var ty = 0;

  if (hasScrollbars) {
    tx = graph.view.translate.x * graph.view.scale - graph.container.scrollLeft;
    ty = graph.view.translate.y * graph.view.scale - graph.container.scrollTop;
  }

  graph.pageVisible = value;
  graph.pageBreaksVisible = value;
  graph.preferPageSize = value;
  graph.view.validateBackground();

  // Workaround for possible handle offset
  if (hasScrollbars) {
    var cells = graph.getSelectionCells();
    graph.clearSelection();
    graph.setSelectionCells(cells);
  }

  // Calls updatePageBreaks
  graph.sizeDidChange();

  if (hasScrollbars) {
    graph.container.scrollLeft = graph.view.translate.x * graph.view.scale - tx;
    graph.container.scrollTop = graph.view.translate.y * graph.view.scale - ty;
  }

  this.fireEvent(new mxEventObject('pageViewChanged'));
};

/**
 * Change types
 */
function ChangePageSetup(ui, color, image, format) {
  this.ui = ui;
  this.color = color;
  this.previousColor = color;
  this.image = image;
  this.previousImage = image;
  this.format = format;
  this.previousFormat = format;

  // Needed since null are valid values for color and image
  this.ignoreColor = false;
  this.ignoreImage = false;
}
/**
 * Implementation of the undoable page rename.
 */
ChangePageSetup.prototype.execute = function () {
  var graph = this.ui.editor.graph;

  if (!this.ignoreColor) {
    this.color = this.previousColor;
    let tmp = graph.background;
    this.ui.setBackgroundColor(this.previousColor);
    this.previousColor = tmp;
  }

  if (!this.ignoreImage) {
    this.image = this.previousImage;
    let tmp = graph.backgroundImage;
    this.ui.setBackgroundImage(this.previousImage);
    this.previousImage = tmp;
  }

  if (this.previousFormat != null) {
    this.format = this.previousFormat;
    let tmp = graph.pageFormat;

    if (this.previousFormat.width != tmp.width || this.previousFormat.height != tmp.height) {
      this.ui.setPageFormat(this.previousFormat);
      this.previousFormat = tmp;
    }
  }

  if (this.foldingEnabled != null && this.foldingEnabled != this.ui.editor.graph.foldingEnabled) {
    this.ui.setFoldingEnabled(this.foldingEnabled);
    this.foldingEnabled = !this.foldingEnabled;
  }
};

// Registers codec for ChangePageSetup
(function () {
  var codec = new mxObjectCodec(new ChangePageSetup(), ['ui', 'previousColor', 'previousImage', 'previousFormat']);
  codec.afterDecode = function (dec, node, obj) {
    obj.previousColor = obj.color;
    obj.previousImage = obj.image;
    obj.previousFormat = obj.format;

    if (obj.foldingEnabled != null) obj.foldingEnabled = !obj.foldingEnabled;

    return obj;
  };
  mxCodecRegistry.register(codec);
})();

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setBackgroundColor = function (value) {
  this.editor.graph.background = value;
  this.editor.graph.view.validateBackground();

  this.fireEvent(new mxEventObject('backgroundColorChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setFoldingEnabled = function (value) {
  this.editor.graph.foldingEnabled = value;
  this.editor.graph.view.revalidate();

  this.fireEvent(new mxEventObject('foldingEnabledChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageFormat = function (value) {
  this.editor.graph.pageFormat = value;

  if (!this.editor.graph.pageVisible) this.actions.get('pageView').funct();
  else {
    this.editor.graph.view.validateBackground();
    this.editor.graph.sizeDidChange();
  }
  this.fireEvent(new mxEventObject('pageFormatChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setPageScale = function (value) {
  this.editor.graph.pageScale = value;

  if (!this.editor.graph.pageVisible) this.actions.get('pageView').funct();
  else {
    this.editor.graph.view.validateBackground();
    this.editor.graph.sizeDidChange();
  }

  this.fireEvent(new mxEventObject('pageScaleChanged'));
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setGridColor = function (value) {
  this.editor.graph.view.gridColor = value;
  this.editor.graph.view.validateBackground();
  this.fireEvent(new mxEventObject('gridColorChanged'));
};

/**
 * Updates the states of the given undo/redo items.
 */
EditorUi.prototype.addUndoListener = function () {
  var undo = this.actions.get('undo');
  var redo = this.actions.get('redo');

  var undoMgr = this.editor.undoManager;
  var undoListener = mxUtils.bind(this, function () {
    undo.setEnabled(this.canUndo());
    redo.setEnabled(this.canRedo());
  });

  undoMgr.addListener(mxEvent.ADD, undoListener);
  undoMgr.addListener(mxEvent.UNDO, undoListener);
  undoMgr.addListener(mxEvent.REDO, undoListener);
  undoMgr.addListener(mxEvent.CLEAR, undoListener);

  // Overrides cell editor to update action states
  var cellEditorStartEditing = this.editor.graph.cellEditor.startEditing;
  this.editor.graph.cellEditor.startEditing = function () {
    cellEditorStartEditing.apply(this, arguments);
    undoListener();
  };

  var cellEditorStopEditing = this.editor.graph.cellEditor.stopEditing;
  this.editor.graph.cellEditor.stopEditing = function (cell, trigger) {
    cellEditorStopEditing.apply(this, arguments);
    undoListener();
  };

  // Updates the button states once
  undoListener();
};

/**
 * Updates the states of the given toolbar items based on the selection.
 */
EditorUi.prototype.updateActionStates = function () {
  var graph = this.editor.graph;
  var selected = !graph.isSelectionEmpty();
  var vertexSelected = false;
  var edgeSelected = false;

  var cells = graph.getSelectionCells();

  if (cells != null) {
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];

      if (graph.getModel().isEdge(cell)) {
        edgeSelected = true;
      }

      if (graph.getModel().isVertex(cell)) {
        vertexSelected = true;
      }

      if (edgeSelected && vertexSelected) {
        break;
      }
    }
  }

  // Updates action states
  var actions = ['cut', 'copy', 'bold', 'italic', 'underline', 'delete', 'duplicate', 'editStyle', 'editTooltip', 'editLink', 'backgroundColor', 'borderColor', 'edit', 'toFront', 'toBack', 'lockUnlock', 'solid', 'dashed', 'pasteSize', 'dotted', 'fillColor', 'gradientColor', 'shadow', 'fontColor', 'formattedText', 'rounded', 'toggleRounded', 'sharp', 'strokeColor'];

  for (var i = 0; i < actions.length; i++) {
    this.actions.get(actions[i]).setEnabled(selected);
  }

  this.actions.get('setAsDefaultStyle').setEnabled(graph.getSelectionCount() == 1);
  this.actions.get('clearWaypoints').setEnabled(!graph.isSelectionEmpty());
  this.actions.get('copySize').setEnabled(graph.getSelectionCount() == 1);
  this.actions.get('turn').setEnabled(!graph.isSelectionEmpty());
  this.actions.get('curved').setEnabled(edgeSelected);
  this.actions.get('rotation').setEnabled(vertexSelected);
  this.actions.get('wordWrap').setEnabled(vertexSelected);
  this.actions.get('autosize').setEnabled(vertexSelected);
  var oneVertexSelected = vertexSelected && graph.getSelectionCount() == 1;
  this.actions.get('group').setEnabled(graph.getSelectionCount() > 1 || (oneVertexSelected && !graph.isContainer(graph.getSelectionCell())));
  this.actions.get('ungroup').setEnabled(graph.getSelectionCount() == 1 && (graph.getModel().getChildCount(graph.getSelectionCell()) > 0 || (oneVertexSelected && graph.isContainer(graph.getSelectionCell()))));
  this.actions.get('removeFromGroup').setEnabled(oneVertexSelected && graph.getModel().isVertex(graph.getModel().getParent(graph.getSelectionCell())));

  // Updates menu states
  var state = graph.view.getState(graph.getSelectionCell());

  this.menus.get('navigation').setEnabled(selected || graph.view.currentRoot != null);
  this.actions.get('collapsible').setEnabled(vertexSelected && (graph.isContainer(graph.getSelectionCell()) || graph.model.getChildCount(graph.getSelectionCell()) > 0));
  //this.actions.get('home').setEnabled(graph.view.currentRoot != null);
  //this.actions.get('exitGroup').setEnabled(graph.view.currentRoot != null);
  //this.actions.get('enterGroup').setEnabled(graph.getSelectionCount() == 1 && graph.isValidRoot(graph.getSelectionCell()));
  var foldable = graph.getSelectionCount() == 1 && graph.isCellFoldable(graph.getSelectionCell());
  this.actions.get('expand').setEnabled(foldable);
  this.actions.get('collapse').setEnabled(foldable);

  this.actions.get('editLink').setEnabled(graph.getSelectionCount() == 1);
  this.actions.get('openLink').setEnabled(graph.getSelectionCount() == 1 && graph.getLinkForCell(graph.getSelectionCell()) != null);
  this.actions.get('guides').setEnabled(graph.isEnabled());
  this.actions.get('grid').setEnabled(!this.editor.isViewMode());

  var unlocked = graph.isEnabled() && !graph.isCellLocked(graph.getDefaultParent());
  //this.menus.get('layout').setEnabled(unlocked);
  this.menus.get('insert').setEnabled(unlocked);
  this.menus.get('direction').setEnabled(unlocked && vertexSelected);
  this.menus.get('align').setEnabled(unlocked && vertexSelected && graph.getSelectionCount() > 1);
  this.menus.get('distribute').setEnabled(unlocked && vertexSelected && graph.getSelectionCount() > 1);
  this.actions.get('selectVertices').setEnabled(unlocked);
  this.actions.get('selectEdges').setEnabled(unlocked);
  this.actions.get('selectAll').setEnabled(unlocked);
  this.actions.get('selectNone').setEnabled(unlocked);

  this.updatePasteActionStates();
};

/**
 * Refreshes the viewport.
 */
EditorUi.prototype.refresh = function (sizeDidChange) {
  sizeDidChange = sizeDidChange != null ? sizeDidChange : true;

  var w = this.container.clientWidth;
  var h = this.container.clientHeight;

  if (this.container == document.body) {
    w = document.body.clientWidth || document.documentElement.clientWidth;
    h = document.documentElement.clientHeight;
  }

  // Workaround for bug on iOS see
  // http://stackoverflow.com/questions/19012135/ios-7-ipad-safari-landscape-innerheight-outerheight-layout-issue
  // FIXME: Fix if footer visible
  var off = 0;
  if (mxClient.IS_IOS && !window.navigator.standalone) {
    if (window.innerHeight != document.documentElement.clientHeight) {
      off = document.documentElement.clientHeight - window.innerHeight;
      window.scrollTo(0, 0);
    }
  }

  var tmp = 0;

  tmp += this.demobarContainer.$height || 0;

  this.menubarContainer.style.height = this.menubarHeight + 'px';
  tmp += this.menubarHeight;

  if (this.toolbar != null) {
    this.toolbarContainer.style.height = this.toolbarHeight + 'px';
    tmp += this.toolbarHeight;
  }

  this.diagramContainer.style.top = tmp + 'px';
  this.diagramContainer.style.bottom = this.footerHeight + off + 'px';

  // actions windows should be below the header part
  if (this.actions) {
    if (this.actions.sidebarWindow && this.actions.sidebarWindow.window.getY() < tmp) this.actions.sidebarWindow.window.setLocation(this.actions.sidebarWindow.window.getX(), tmp);

    if (this.actions.formatWindow && this.actions.formatWindow.window.getY() < tmp) this.actions.formatWindow.window.setLocation(this.actions.formatWindow.window.getX(), tmp);
  }

  if (sizeDidChange) this.editor.graph.sizeDidChange();
};

/**
 * Creates the required containers.
 */

EditorUi.prototype.createDivs = function () {
  //----->fix<------//
  var demobar = webix.ui({
    css: 'demoheader',
    autoheight: true,
    hidden: true, // set false to see the demo-banner
    rows: [
        {
            height: 10
        },
        {
            cols: [
                {
                    rows:
                        [
                            {
                                borderless: true,
                                autoheight: true,
                                css: 'demo_template',
                                template: "<p align='right'>Это демонстрационная версия продукта. До окончания пробного периода осталось дней:</p>"
                                    + "<p align='right'>Информацию о полной версии можно получить в коммерческом департаменте: sales.mt@systeme.ru 8 (800) 250-63-60</p>"
                            }
                        ]
                },
                {
                    view: "template",
                    css: 'demo_template',
                    borderless: true,
                    autoheight: true,
                    width: 100,
                    template: function (obj) {
                       
                        return "<p align='center' class=demorestborder> </p>";
                    },
                    
                }
            ]
        },
        {
            height: 10
        }
    ]
})
//----->fix<------//
  this.demobarContainer = demobar || { $height: 0 };
//----->fix<------//
  var menubar = webix.ui({
    css: 'demoheader',
    autoheight: true,
    hidden: true, // set false to see the demo-banner
    rows: [
        {
            height: 10
        },
        {
            cols: [
                {
                    rows:
                        [
                            {
                                borderless: true,
                                autoheight: true,
                                css: 'demo_template',
                                template: "<p align='right'>Это демонстрационная версия продукта. До окончания пробного периода осталось дней:</p>"
                                    + "<p align='right'>Информацию о полной версии можно получить в коммерческом департаменте: sales.mt@systeme.ru 8 (800) 250-63-60</p>"
                            }
                        ]
                },
                {
                    view: "template",
                    css: 'demo_template',
                    borderless: true,
                    autoheight: true,
                    width: 100,
                    template: function (obj) {
                       
                        return "<p align='center' class=demorestborder> </p>";
                    },
                    
                }
            ]
        },
        {
            height: 10
        }
    ]
})
//----->fix<------//
  if (menubar) {
    webix.html.addCss(menubar.getNode(), 'geMenubarContainer');
    this.menubarContainer = menubar.getNode();
  }

  this.toolbarContainer = this.createDiv('geToolbarContainer');
  this.diagramContainer = this.createDiv('geDiagramContainer');
};

/**
 * Creates the required containers.
 */
EditorUi.prototype.createUi = function () {
  // Creates menubar
  this.menubar = this.editor.isViewMode() ? null : this.menus.createMenubar(this.createDiv('geMenubar'));
  if (this.menubar) this.menubarContainer.appendChild(this.menubar.container);

  // Creates toolbar
  this.toolbar = this.editor.isViewMode() ? null : new Toolbar(this, this.createDiv('geToolbar'));
  if (this.toolbar != null) {
    this.toolbarContainer.appendChild(this.toolbar.container);
    this.container.appendChild(this.toolbarContainer);
  }

  this.container.appendChild(this.diagramContainer);
};

/**
 * Creates the actual toolbar for the toolbar container.
 */
EditorUi.prototype.createDiv = function (classname) {
  var elt = document.createElement('div');
  elt.className = classname;

  return elt;
};

EditorUi.prototype.handleError = function (resp, title, fn, invokeFnOnClose, notFoundMessage) {
  var e = resp != null && resp.error != null ? resp.error : resp;

  if (e != null || title != null) {
    var msg = mxUtils.htmlEntities(mxResources.get('unknownError'));
    var btn = mxResources.get('ok');
    title = title != null ? title : mxResources.get('error');

    if (e != null && e.message != null) {
      msg = mxUtils.htmlEntities(e.message);
    }

    this.showError(title, msg, btn, fn, null, null, null, null, null, null, null, null, invokeFnOnClose ? fn : null);
  } else if (fn != null) {
    fn();
  }
};
EditorUi.prototype.showError = function (title, msg, btn, fn, retry, btn2, fn2, btn3, fn3, w, h, hide, onClose) {
  var dlg = new ErrorDialog(this, title, msg, btn || mxResources.get('ok'), fn, retry, btn2, fn2, hide, btn3, fn3);
  var lines = Math.ceil(msg != null ? msg.length / 50 : 1);
  this.showDialog(dlg.container, w || 340, h || 100 + lines * 20, true, false, onClose);
  dlg.init();
};

/**
 * Displays dialog.
 */
EditorUi.prototype.showDialog = function (elt, w, h, modal, closable, onClose, noScroll, transparent, onResize, ignoreBgClick) {
  this.editor.graph.tooltipHandler.hideTooltip();

  this.dialog = new Dialog(this, elt, w, h, modal, closable, onClose, noScroll, transparent, onResize, /*ignoreBgClick*/ true);
  this.dialogs.push(this.dialog);
};

/**
 * Hides dialog.
 */
EditorUi.prototype.hideDialog = function (cancel, isEsc) {
  if (this.dialogs != null && this.dialogs.length > 0) {
    var dlg = this.dialogs.pop();

    if (dlg.close(cancel, isEsc) == false) {
      //add the dialog back if dialog closing is cancelled
      this.dialogs.push(dlg);
      return;
    }

    this.dialog = this.dialogs.length > 0 ? this.dialogs[this.dialogs.length - 1] : null;
    this.editor.fireEvent(new mxEventObject('hideDialog'));

    if (this.dialog == null && this.editor.graph.container.style.visibility != 'hidden') {
      window.setTimeout(
        mxUtils.bind(this, function () {
          if (this.editor.graph.isEditing() && this.editor.graph.cellEditor.textarea != null) {
            this.editor.graph.cellEditor.textarea.focus();
          } else {
            mxUtils.clearSelection();
            this.editor.graph.container.focus();
          }
        }),
        0
      );
    }
  }
};

/**
 * Display a color dialog.
 */
EditorUi.prototype.pickColor = function (color, apply) {
  var graph = this.editor.graph;
  var selState = graph.cellEditor.saveSelection();
  var h = 226 + (Math.ceil(ColorDialog.prototype.presetColors.length / 12) + Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) * 17;

  var dlg = new ColorDialog(
    this,
    color || 'none',
    function (color) {
      graph.cellEditor.restoreSelection(selState);
      apply(color);
    },
    function () {
      graph.cellEditor.restoreSelection(selState);
    }
  );
  this.showDialog(dlg.container, 230, h, true, false);
  dlg.init();
};

/**
 * Adds the label menu items to the given menu and parent.
 */
EditorUi.prototype.openFile = function () {
  // Closes dialog after open
  window.openFile = new OpenFile(
    mxUtils.bind(this, function (cancel) {
      this.hideDialog(cancel);
    })
  );

  // Removes openFile if dialog is closed
  this.showDialog(new OpenDialog(this).container, 320, 220, true, true, function () {
    window.openFile = null;
  });
};

/**
 * Extracs the graph model from the given HTML data from a data transfer event.
 */
EditorUi.prototype.extractGraphModelFromHtml = function (data) {
  var result = null;

  try {
    var idx = data.indexOf('&lt;mxGraphModel ');

    if (idx >= 0) {
      var idx2 = data.lastIndexOf('&lt;/mxGraphModel&gt;');

      if (idx2 > idx) {
        result = data
          .substring(idx, idx2 + 21)
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/\\&quot;/g, '"')
          .replace(/\n/g, '');
      }
    }
  } catch (e) {
    // ignore
  }

  return result;
};

/**
 * Opens the given files in the editor.
 */
EditorUi.prototype.extractGraphModelFromEvent = function (evt) {
  var result = null;
  var data = null;

  if (evt != null) {
    var provider = evt.dataTransfer != null ? evt.dataTransfer : evt.clipboardData;

    if (provider != null) {
      if (document.documentMode == 10 || document.documentMode == 11) {
        data = provider.getData('Text');
      } else {
        data = mxUtils.indexOf(provider.types, 'text/html') >= 0 ? provider.getData('text/html') : null;

        if (mxUtils.indexOf(provider.types, 'text/plain' && (data == null || data.length == 0))) {
          data = provider.getData('text/plain');
        }
      }

      if (data != null) {
        data = Graph.zapGremlins(mxUtils.trim(data));

        // Tries parsing as HTML document with embedded XML
        var xml = this.extractGraphModelFromHtml(data);

        if (xml != null) {
          data = xml;
        }
      }
    }
  }

  if (data != null && this.isCompatibleString(data)) {
    result = data;
  }

  return result;
};

/**
 * Hook for subclassers to return true if event data is a supported format.
 * This implementation always returns false.
 */
EditorUi.prototype.isCompatibleString = function (data) {
  return false;
};

/**
 * Adds the label menu items to the given menu and parent.
 */
EditorUi.prototype.saveFile = function (forceDialog) {
  if (!forceDialog && this.editor.filename != null) {
    this.save(this.editor.getOrCreateFilename());
  } else {
    var dlg = new FilenameDialog(
      this,
      this.editor.getOrCreateFilename(),
      mxResources.get('save'),
      mxUtils.bind(this, function (name) {
        AJAX.post(
          API.FUNC.schemeAdd,
          null,
          { name: name },
          mxUtils.bind(this, function (xhr, res) {
            if (res) {
              this.scheme = res;
              this.save(name);
            }
          }),
          function (xhr, err) {
            console.log('Ошибка добавления схемы')
            // messageError('Ошибка добавления схемы');
          }
        );
      }),
      mxResources.get('schemeName'),
      mxUtils.bind(this, function (name) {
        if (name != null && name.length > 0) return true;
        console.log(mxResources.get('invalidName'))
        // messageError(mxResources.get('invalidName'));
        return false;
      })
    );

    this.showDialog(dlg.container, 300, 80, true, true);
    dlg.init();
  }
};

/**
 * Saves the current graph under the given filename.
 */
EditorUi.prototype.save = function (name) {
  if (!isNullOrEmpty(name)) {
    try {
      if (this.editor.graph.isEditing()) this.editor.graph.stopEditing();

      var xml = mxUtils.getXml(this.editor.getGraphXml());
      this.scheme.model = xml;
      AJAX.post(
        // SAVE_URL,
        null,
        null,
        this.scheme,
        mxUtils.bind(this, function (xhr, res) {
          if (!res) {
            console.log('Ошибка сохранения схемы.')
            // messageError('Ошибка сохранения схемы.');
            return;
          }
          this.editor.setFilename(name);
          this.editor.setModified(false);
        }),
        function (xhr, err) {
          console.log('Ошибка сохранения схемы.')
          // messageError('Ошибка сохранения схемы.');
        }
      );
    } catch (e) {
      console.log(mxResources.get('errorSavingFile'))
      // messageError(mxResources.get('errorSavingFile'));
    }
  }
};

/**
 * Executes the given action.
 */
EditorUi.prototype.animateAction = function (exec, animate, post) {
  var graph = this.editor.graph;

  if (graph.isEnabled()) {
    graph.getModel().beginUpdate();
    try {
      exec();
    } catch (e) {
      throw e;
    } finally {
      // Animates the changes in the graph model except for Camino, where animation is too slow
      if (animate && navigator.userAgent.indexOf('Camino') < 0) {
        // New API for animating graph layout results asynchronously
        var morph = new mxMorphing(graph);
        morph.addListener(
          mxEvent.DONE,
          mxUtils.bind(this, function () {
            graph.getModel().endUpdate();

            if (post != null) {
              post();
            }
          })
        );

        morph.startAnimation();
      } else {
        graph.getModel().endUpdate();

        if (post != null) {
          post();
        }
      }
    }
  }
};

var imageUploader = webix.ui({
  //---fix---//
  //id: 'img_uploader',
  //---fix---//
  view: 'uploader',
  multiple: false,
  apiOnly: true,
  autosend: false,
  on: {
    onBeforeFileAdd: function (item) {
      if (this.config.accept && this.config.accept !== '*') {
        let acceptedTypes = this.config.accept.split(',').map(function (x) {
          return x.trimFromStart('.');
        });
        if (acceptedTypes.indexOf(item.type.toLowerCase()) < 0) {
          console.log('common.errors.support_only_files' + ': ' + acceptedTypes.join(','))
          // messageError(translate('common.errors.support_only_files') + ': ' + acceptedTypes.join(','));
          this.files.clearAll();
          return false;
        }
      }
    },
    //onAfterFileAdd: function (item)
    //{
    //    var inputs = this.$view.getElementsByTagName("INPUT");
    //    var fileList = inputs[inputs.length - 1].files;
    //    if (fileList && fileList.length > 0)
    //    {
    //        // last file is loaded by client
    //        if (this.files.count() === fileList.length)
    //        {
    //            //var fdata = new FormData();
    //            //fdata.append('ftype', this.config.ftype);
    //            //let obj = this.files.data.pull[item.id];
    //            //fdata.append('files[]', obj.file, obj.name);
    //            //let fileData = new Blob([files[0]]);
    //            var self = this;
    //            HELP.readFile(item.file, function (data)
    //            {
    //                let imgbase64 = 'data:image/' + item.type + ';base64,' + Base64.encode(data, true);
    //                var img = new Image();
    //                img.onload = function()
    //                {
    //                    fn(newValue, img.width, img.height);
    //                };
    //                img.onerror = function()
    //                {
    //                    fn(null);
    //                    messageError(mxResources.get('fileNotFound'));
    //                };
    //                img.src = newValue;
    //                self.files.clearAll();
    //            });
    //        }
    //    }
    //}
  },
});
EditorUi.prototype.showImageDialog = function (title, value, fn, ignoreExisting) {
  var cellEditor = this.editor.graph.cellEditor;
  var selState = cellEditor.saveSelection();
  //var newValue = mxUtils.prompt(title, value);
  //cellEditor.restoreSelection(selState);

  //if (newValue != null && newValue.length > 0)
  //{
  //    var img = new Image();

  //    img.onload = function()
  //    {
  //        fn(newValue, img.width, img.height);
  //    };
  //    img.onerror = function()
  //    {
  //        fn(null);
  //        messageError(mxResources.get('fileNotFound'));
  //    };

  //    img.src = newValue;
  //}
  //else
  //{
  //    fn(null);
  //}

  var inputs = imageUploader.$view.getElementsByTagName('INPUT');
  if (inputs.length > 0) {
    var fileInput = inputs[inputs.length - 1];
    if (fileInput) {
      let acceptedImages = '.svg,.png,.gif,.jpg,.jpeg,.bmp';
      $(fileInput).attr('accept', acceptedImages);
      imageUploader.define('accept', acceptedImages);
      var uploaderEvent = imageUploader.attachEvent('onAfterFileAdd', function (item) {
        cellEditor.restoreSelection(selState);
        var inputs = this.$view.getElementsByTagName('INPUT');
        if (inputs.length > 0) {
          var fileList = inputs[inputs.length - 1].files;
          if (fileList && fileList.length > 0) {
            if (this.files.count() === fileList.length) {
              var self = this;
              if (item.type.toLowerCase() == 'svg') {
                HELP.readFile(item.file, function (data) {
                  let imageData = window.btoa ? window.btoa(data) : Base64.encode(data, true);
                  var img = new Image();
                  img.onload = function () {
                    fn('data:image/svg+xml,' + imageData, img.width, img.height);
                  };
                  img.onerror = function () {
                    fn(null);
                    console.log(mxResources.get('errorLoadingFile'))
                    // messageError(mxResources.get('errorLoadingFile'));
                  };
                  img.src = 'data:image/svg+xml;base64,' + imageData;
                  self.files.clearAll();
                });
              } else {
                HELP.readBinaryFile(item.file, function (data) {
                  let imageData = window.btoa ? window.btoa(data) : Base64.encode(data, true);
                  var img = new Image();
                  img.onload = function () {
                    fn('data:image/' + item.type + ',' + imageData, img.width, img.height);
                  };
                  img.onerror = function () {
                    fn(null);
                    console.log(mxResources.get('errorLoadingFile'))
                    // messageError(mxResources.get('errorLoadingFile'));
                  };
                  img.src = 'data:image/' + item.type + ';base64,' + imageData;
                  self.files.clearAll();
                });
              }
            }
          }
        }
        imageUploader.detachEvent(uploaderEvent);
      });
      imageUploader.fileDialog();
    }
  }
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showLinkDialog = function (value, btnLabel, fn) {
  var dlg = new LinkDialog(this, value, btnLabel, fn);
  this.showDialog(dlg.container, 420, 90, true, true);
  dlg.init();
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showDataDialog = function (cell) {
  if (cell != null) {
    var dlg = new EditDataDialog(this, cell);
    this.showDialog(dlg.container, 480, 420, true, true, null, false);
    dlg.init();
  }
};

/**
 * Hides the current menu.
 */
EditorUi.prototype.showBackgroundImageDialog = function (apply) {
  apply =
    apply != null
      ? apply
      : mxUtils.bind(this, function (image) {
          var change = new ChangePageSetup(this, null, image);
          change.ignoreColor = true;

          this.editor.graph.model.execute(change);
        });

  var newValue = mxUtils.prompt(mxResources.get('backgroundImage'), '');

  if (newValue != null && newValue.length > 0) {
    var img = new Image();

    img.onload = function () {
      apply(new mxImage(newValue, img.width, img.height));
    };
    img.onerror = function () {
      apply(null);
      console.log(mxResources.get('fileNotFound'))
      // messageError(mxResources.get('fileNotFound'));
    };

    img.src = newValue;
  } else {
    apply(null);
  }
};

/**
 * Loads the stylesheet for this graph.
 */
EditorUi.prototype.setBackgroundImage = function (image) {
  this.editor.graph.setBackgroundImage(image);
  this.editor.graph.view.validateBackgroundImage();

  this.fireEvent(new mxEventObject('backgroundImageChanged'));
};

EditorUi.prototype.confirm = function (msg, okFn, cancelFn) {
  //---fix---//
//   messageConfirm(msg, function (result) {
//     if (result === true && okFn != null) okFn();
//     else if (cancelFn != null) cancelFn();
//   });
 //---fix---//
 };

// Alt+Shift+Keycode mapping to action
EditorUi.prototype.altShiftActions = {
  67: 'clearWaypoints', // Alt+Shift+C
  65: 'connectionArrows', // Alt+Shift+A
  76: 'editLink', // Alt+Shift+L
  80: 'connectionPoints', // Alt+Shift+P
  84: 'editTooltip', // Alt+Shift+T
  86: 'pasteSize', // Alt+Shift+V
  88: 'copySize', // Alt+Shift+X
};

/**
 * Creates the keyboard event handler for the current graph and history.
 */
EditorUi.prototype.createKeyHandler = function (editor) {
  var editorUi = this;
  var graph = this.editor.graph;
  var keyHandler = new mxKeyHandler(graph);

  var isEventIgnored = keyHandler.isEventIgnored;
  keyHandler.isEventIgnored = function (evt) {
    // Handles undo/redo/ctrl+./,/u via action and allows ctrl+b/i only if editing value is HTML (except for FF and Safari)
    return (!this.isControlDown(evt) || mxEvent.isShiftDown(evt) || (evt.keyCode != 90 && evt.keyCode != 89 && evt.keyCode != 188 && evt.keyCode != 190 && evt.keyCode != 85)) && ((evt.keyCode != 66 && evt.keyCode != 73) || !this.isControlDown(evt) || (this.graph.cellEditor.isContentEditing() && !mxClient.IS_FF && !mxClient.IS_SF)) && isEventIgnored.apply(this, arguments);
  };

  // Ignores graph enabled state but not view mode state
  keyHandler.isEnabledForEvent = function (evt) {
    return !mxEvent.isConsumed(evt) && this.isGraphEvent(evt) && this.isEnabled() && (editorUi.dialogs == null || editorUi.dialogs.length == 0);
  };

  // Routes command-key to control-key on Mac
  keyHandler.isControlDown = function (evt) {
    return mxEvent.isControlDown(evt) || (mxClient.IS_MAC && evt.metaKey);
  };

  var queue = [];
  var thread = null;

  // Helper function to move cells with the cursor keys
  function nudge(keyCode, stepSize, resize) {
    queue.push(function () {
      if (!graph.isSelectionEmpty() && graph.isEnabled()) {
        stepSize = stepSize != null ? stepSize : 1;

        if (resize) {
          // Resizes all selected vertices
          graph.getModel().beginUpdate();
          try {
            var cells = graph.getSelectionCells();

            for (var i = 0; i < cells.length; i++) {
              if (graph.getModel().isVertex(cells[i]) && graph.isCellResizable(cells[i])) {
                var geo = graph.getCellGeometry(cells[i]);

                if (geo != null) {
                  geo = geo.clone();

                  if (keyCode == 37) {
                    geo.width = Math.max(0, geo.width - stepSize);
                  } else if (keyCode == 38) {
                    geo.height = Math.max(0, geo.height - stepSize);
                  } else if (keyCode == 39) {
                    geo.width += stepSize;
                  } else if (keyCode == 40) {
                    geo.height += stepSize;
                  }

                  graph.getModel().setGeometry(cells[i], geo);
                }
              }
            }
          } finally {
            graph.getModel().endUpdate();
          }
        } else {
          // Moves vertices up/down in a stack layout
          var cell = graph.getSelectionCell();
          var parent = graph.model.getParent(cell);
          var layout = null;

          if (graph.getSelectionCount() == 1 && graph.model.isVertex(cell) && graph.layoutManager != null && !graph.isCellLocked(cell)) {
            layout = graph.layoutManager.getLayout(parent);
          }

          if (layout != null && layout.constructor == mxStackLayout) {
            var index = parent.getIndex(cell);

            if (keyCode == 37 || keyCode == 38) {
              graph.model.add(parent, cell, Math.max(0, index - 1));
            } else if (keyCode == 39 || keyCode == 40) {
              graph.model.add(parent, cell, Math.min(graph.model.getChildCount(parent), index + 1));
            }
          } else {
            var dx = 0;
            var dy = 0;

            if (keyCode == 37) {
              dx = -stepSize;
            } else if (keyCode == 38) {
              dy = -stepSize;
            } else if (keyCode == 39) {
              dx = stepSize;
            } else if (keyCode == 40) {
              dy = stepSize;
            }

            graph.moveCells(graph.getMovableCells(graph.getSelectionCells()), dx, dy);
          }
        }
      }
    });

    if (thread != null) {
      window.clearTimeout(thread);
    }

    thread = window.setTimeout(function () {
      if (queue.length > 0) {
        graph.getModel().beginUpdate();
        try {
          for (var i = 0; i < queue.length; i++) {
            queue[i]();
          }

          queue = [];
        } finally {
          graph.getModel().endUpdate();
        }
        graph.scrollCellToVisible(graph.getSelectionCell());
      }
    }, 200);
  }

  // Overridden to handle special alt+shift+cursor keyboard shortcuts
  var directions = { 37: mxConstants.DIRECTION_WEST, 38: mxConstants.DIRECTION_NORTH, 39: mxConstants.DIRECTION_EAST, 40: mxConstants.DIRECTION_SOUTH };

  var keyHandlerGetFunction = keyHandler.getFunction;
  mxKeyHandler.prototype.getFunction = function (evt) {
    if (graph.isEnabled()) {
      // TODO: Add alt modified state in core API, here are some specific cases
      if (mxEvent.isShiftDown(evt) && mxEvent.isAltDown(evt)) {
        var action = editorUi.actions.get(editorUi.altShiftActions[evt.keyCode]);

        if (action != null) {
          return action.funct;
        }
      }

      if (evt.keyCode == 9 && mxEvent.isAltDown(evt)) {
        if (mxEvent.isShiftDown(evt)) {
          // Alt+Shift+Tab
          return function () {
            graph.selectParentCell();
          };
        } else {
          // Alt+Tab
          return function () {
            graph.selectChildCell();
          };
        }
      } else if (directions[evt.keyCode] != null && !graph.isSelectionEmpty()) {
        // On macOS, Control+Cursor is used by Expose so allow for Alt+Control to resize
        if (!this.isControlDown(evt) && mxEvent.isShiftDown(evt) && mxEvent.isAltDown(evt)) {
          if (graph.model.isVertex(graph.getSelectionCell())) {
            return function () {
              var cells = graph.connectVertex(graph.getSelectionCell(), directions[evt.keyCode], graph.defaultEdgeLength, evt, true);

              if (cells != null && cells.length > 0) {
                if (cells.length == 1 && graph.model.isEdge(cells[0])) {
                  graph.setSelectionCell(graph.model.getTerminal(cells[0], false));
                } else {
                  graph.setSelectionCell(cells[cells.length - 1]);
                }

                graph.scrollCellToVisible(graph.getSelectionCell());

                if (editorUi.hoverIcons != null) {
                  editorUi.hoverIcons.update(graph.view.getState(graph.getSelectionCell()));
                }
              }
            };
          }
        } else {
          // Avoids consuming event if no vertex is selected by returning null below
          // Cursor keys move and resize (ctrl) cells
          if (this.isControlDown(evt)) {
            return function () {
              nudge(evt.keyCode, mxEvent.isShiftDown(evt) ? graph.gridSize : null, true);
            };
          } else {
            return function () {
              nudge(evt.keyCode, mxEvent.isShiftDown(evt) ? graph.gridSize : null);
            };
          }
        }
      }
    }

    return keyHandlerGetFunction.apply(this, arguments);
  };

  // Binds keystrokes to actions
  keyHandler.bindAction = mxUtils.bind(this, function (code, control, key, shift) {
    var action = this.actions.get(key);

    if (action != null) {
      var f = function (evt) {
        if (action.isEnabled()) {
          action.funct(evt);
        }
      };

      if (control) {
        if (shift) {
          keyHandler.bindControlShiftKey(code, f);
        } else {
          keyHandler.bindControlKey(code, f);
        }
      } else {
        if (shift) {
          keyHandler.bindShiftKey(code, f);
        } else {
          keyHandler.bindKey(code, f);
        }
      }
    }
  });

  var ui = this;
  var keyHandlerEscape = keyHandler.escape;
  keyHandler.escape = function (evt) {
    keyHandlerEscape.apply(this, arguments);
  };

  // Ignores enter keystroke. Remove this line if you want the
  // enter keystroke to stop editing. N, W, T are reserved.
  keyHandler.enter = function () {};

  keyHandler.bindControlShiftKey(36, function () {
    graph.exitGroup();
  }); // Ctrl+Shift+Home
  keyHandler.bindControlShiftKey(35, function () {
    graph.enterGroup();
  }); // Ctrl+Shift+End
  keyHandler.bindKey(36, function () {
    graph.home();
  }); // Home
  keyHandler.bindKey(35, function () {
    graph.refresh();
  }); // End
  keyHandler.bindAction(107, true, 'zoomIn'); // Ctrl+Plus
  keyHandler.bindAction(109, true, 'zoomOut'); // Ctrl+Minus
  keyHandler.bindAction(80, true, 'print'); // Ctrl+P
  keyHandler.bindAction(79, true, 'outline', true); // Ctrl+Shift+O
  keyHandler.bindAction(88, true, 'bindings', true); // Ctrl+Shift+X

  if (!this.editor.isViewMode()) {
    keyHandler.bindControlKey(36, function () {
      if (graph.isEnabled()) {
        graph.foldCells(true);
      }
    }); // Ctrl+Home
    keyHandler.bindControlKey(35, function () {
      if (graph.isEnabled()) {
        graph.foldCells(false);
      }
    }); // Ctrl+End
    keyHandler.bindControlKey(13, function () {
      if (graph.isEnabled()) {
        graph.setSelectionCells(graph.duplicateCells(graph.getSelectionCells(), false));
      }
    }); // Ctrl+Enter
    keyHandler.bindAction(8, false, 'delete'); // Backspace
    keyHandler.bindAction(8, true, 'deleteAll'); // Backspace
    keyHandler.bindAction(46, false, 'delete'); // Delete
    keyHandler.bindAction(46, true, 'deleteAll'); // Ctrl+Delete
    keyHandler.bindAction(72, true, 'resetView'); // Ctrl+H
    keyHandler.bindAction(72, true, 'fitWindow', true); // Ctrl+Shift+H
    keyHandler.bindAction(74, true, 'fitPage'); // Ctrl+J
    keyHandler.bindAction(74, true, 'fitTwoPages', true); // Ctrl+Shift+J
    keyHandler.bindAction(48, true, 'customZoom'); // Ctrl+0
    keyHandler.bindAction(82, true, 'turn'); // Ctrl+R
    keyHandler.bindAction(82, true, 'clearDefaultStyle', true); // Ctrl+Shift+R
    keyHandler.bindAction(83, true, 'save'); // Ctrl+S
    keyHandler.bindAction(83, true, 'saveAs', true); // Ctrl+Shift+S
    keyHandler.bindAction(65, true, 'selectAll'); // Ctrl+A
    keyHandler.bindAction(65, true, 'selectNone', true); // Ctrl+A
    keyHandler.bindAction(73, true, 'selectVertices', true); // Ctrl+Shift+I
    keyHandler.bindAction(69, true, 'selectEdges', true); // Ctrl+Shift+E
    keyHandler.bindAction(69, true, 'editStyle'); // Ctrl+E
    keyHandler.bindAction(66, true, 'bold'); // Ctrl+B
    keyHandler.bindAction(66, true, 'toBack', true); // Ctrl+Shift+B
    keyHandler.bindAction(70, true, 'toFront', true); // Ctrl+Shift+F
    keyHandler.bindAction(68, true, 'duplicate'); // Ctrl+D
    keyHandler.bindAction(68, true, 'setAsDefaultStyle', true); // Ctrl+Shift+D
    keyHandler.bindAction(90, true, 'undo'); // Ctrl+Z
    keyHandler.bindAction(89, true, 'autosize', true); // Ctrl+Shift+Y
    keyHandler.bindAction(88, true, 'cut'); // Ctrl+X
    keyHandler.bindAction(67, true, 'copy'); // Ctrl+C
    keyHandler.bindAction(86, true, 'paste'); // Ctrl+V
    keyHandler.bindAction(71, true, 'group'); // Ctrl+G
    keyHandler.bindAction(77, true, 'editData'); // Ctrl+M
    keyHandler.bindAction(78, false, 'new', true); // Shift+N
    keyHandler.bindAction(79, false, 'open', true); // Shift+O
    keyHandler.bindAction(71, true, 'grid', true); // Ctrl+Shift+G
    keyHandler.bindAction(73, true, 'italic'); // Ctrl+I
    keyHandler.bindAction(76, true, 'lockUnlock'); // Ctrl+L
    keyHandler.bindAction(76, true, 'layers', true); // Ctrl+Shift+L
    keyHandler.bindAction(80, true, 'formatPanel', true); // Ctrl+Shift+P
    keyHandler.bindAction(85, true, 'underline'); // Ctrl+U
    keyHandler.bindAction(85, true, 'ungroup', true); // Ctrl+Shift+U
    keyHandler.bindAction(190, true, 'superscript'); // Ctrl+.
    keyHandler.bindAction(188, true, 'subscript'); // Ctrl+,
    keyHandler.bindKey(13, function () {
      if (graph.isEnabled()) {
        graph.startEditingAtCell();
      }
    }); // Enter
    keyHandler.bindKey(113, function () {
      if (graph.isEnabled()) {
        graph.startEditingAtCell();
      }
    }); // F2

    if (!mxClient.IS_WIN) {
      keyHandler.bindAction(90, true, 'redo', true); // Ctrl+Shift+Z
    } else {
      keyHandler.bindAction(89, true, 'redo'); // Ctrl+Y
    }
  }

  return keyHandler;
};

EditorUi.prototype.destroy = function () {
  if (this.editor != null) {
    this.editor.destroy();
    this.editor = null;
  }

  if (this.menubar != null) {
    this.menubar.destroy();
    this.menubar = null;
  }

  if (this.toolbar != null) {
    this.toolbar.destroy();
    this.toolbar = null;
  }

  if (this.sidebar != null) {
    this.sidebar.destroy();
    this.sidebar = null;
  }

  if (this.keyHandler != null) {
    this.keyHandler.destroy();
    this.keyHandler = null;
  }

  if (this.keydownHandler != null) {
    mxEvent.removeListener(document, 'keydown', this.keydownHandler);
    this.keydownHandler = null;
  }

  if (this.keyupHandler != null) {
    mxEvent.removeListener(document, 'keyup', this.keyupHandler);
    this.keyupHandler = null;
  }

  if (this.resizeHandler != null) {
    mxEvent.removeListener(window, 'resize', this.resizeHandler);
    this.resizeHandler = null;
  }

  if (this.gestureHandler != null) {
    mxEvent.removeGestureListeners(document, this.gestureHandler);
    this.gestureHandler = null;
  }

  if (this.orientationChangeHandler != null) {
    mxEvent.removeListener(window, 'orientationchange', this.orientationChangeHandler);
    this.orientationChangeHandler = null;
  }

  if (this.scrollHandler != null) {
    mxEvent.removeListener(window, 'scroll', this.scrollHandler);
    this.scrollHandler = null;
  }
 
  if (this.viewHandler != null) {
    this.viewHandler.destroy();
    this.viewHandler = null;
  }

  if (this.destroyFunctions != null) {
    for (var i = 0; i < this.destroyFunctions.length; i++) this.destroyFunctions[i]();

    this.destroyFunctions = null;
  }

  var c = [this.menubarContainer, this.toolbarContainer, this.diagramContainer, this.layersDialog];
  for (var i = 0; i < c.length; i++) {
    if (c[i] != null && c[i].parentNode != null) c[i].parentNode.removeChild(c[i]);
  }
};

export { ChangePageSetup };