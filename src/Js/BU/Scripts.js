import { $ } from 'jquery';
import * as mxgraph from 'mxgraph';
import { API } from './scada';
import Chart from 'chart.js'
import moment from 'moment';
import { Howl } from 'howler';
import Menus from './Menus';
import BindingsHandler from './Bindings';
import { CameraWindow } from './Dialogs';
import { template } from './template';
import { isNullOrEmpty, GUID, AJAX, parseNumber } from './client';
import { VCLASS } from './Init';

let { 
    mxGraph, 
    mxUtils, 
    mxConstants,
    mxImage,
    mxEvent,
    mxCellRenderer,
    mxPopupMenu,
    mxEventSource,
    mxCellOverlay,

} = mxgraph();
/**
 * Scripts support
 */
 export default function ScriptHandler (editorUI) {
  mxEventSource.call(this);

  this.ui = editorUI;
  this.editor = this.ui.editor;
  this.graph = this.editor.graph;
  this.view = this.ui.viewHandler;
  this.marksService = editorUI.marksService;
  this.scriptors = new Map();
  this.init();
  this.menus = editorUI.createMenus();
};
mxUtils.extend(ScriptHandler, mxEventSource);

ScriptHandler.prototype.init = function () {
  var shapeBaseAPI = mxUtils.bind(this, function () {
    return new ShapeAPI(this.ui);
  });
  var linkBaseAPI = mxUtils.bind(this, function () {
    return new LinkScriptAPI(this.ui);
  });
  var switchBaseAPI = mxUtils.bind(this, function () {
    return new SwitchScriptAPI(this.ui);
  });
  var busBaseAPI = mxUtils.bind(this, function () {
    return new BusScriptAPI(this.ui);
  });
  var soundBaseAPI = mxUtils.bind(this, function () {
    return new SoundScriptAPI(this.ui);
  });
  var tableBaseAPI = mxUtils.bind(this, function () {
    return new TableScriptAPI(this.ui);
  });
  var buttonBaseAPI = mxUtils.bind(this, function () {
    return new ButtonScriptAPI(this.ui);
  });
  var chartBaseAPI = mxUtils.bind(this, function () {
    return new ChartScriptAPI(this.ui);
  });
  var rollSwitchBaseAPI = mxUtils.bind(this, function () {
    return new RollSwitchScriptAPI(this.ui);
  });
  var rollDisconnectorBaseAPI = mxUtils.bind(this, function () {
    return new RollDisconnectorScriptAPI(this.ui);
  });
  var disconnectorBaseAPI = mxUtils.bind(this, function () {
    return new DisconnectorScriptAPI(this.ui);
  });
  var separatorBaseAPI = mxUtils.bind(this, function () {
    return new SeparatorScriptAPI(this.ui);
  });
  var groundBaseAPI = mxUtils.bind(this, function () {
    return new GroundScriptAPI(this.ui);
  });
  var rollelementBaseAPI = mxUtils.bind(this, function () {
    return new RollElementScriptAPI(this.ui);
  });
  var actuatorBaseAPI = mxUtils.bind(this, function () {
    return new ActuatorScriptAPI(this.ui);
  });
  var simpleSwitchBaseAPI = mxUtils.bind(this, function () {
    return new SimpleSwitchScriptAPI(this.ui);
  });
  var bmrzBaseAPI = mxUtils.bind(this, function () {
    return new BMRZScriptAPI(this.ui);
  });
  var posterBaseAPI = mxUtils.bind(this, function () {
    return new PosterScriptAPI(this.ui);
  });
  var dispatcherMarkBaseAPI = mxUtils.bind(this, function () {
    return new DispatcherMarkScriptAPI(this.ui);
  });

  // simple shapes
  this.scriptors.set('label', shapeBaseAPI);
  this.scriptors.set('text', shapeBaseAPI);
  this.scriptors.set('rectangle', shapeBaseAPI);
  this.scriptors.set('ellipse', shapeBaseAPI);
  this.scriptors.set('triangle', shapeBaseAPI);
  this.scriptors.set('rhombus', shapeBaseAPI);
  this.scriptors.set('trapezoid', shapeBaseAPI);
  this.scriptors.set('parallelogram', shapeBaseAPI);
  this.scriptors.set('cylinder', shapeBaseAPI);
  this.scriptors.set('cube', shapeBaseAPI);
  this.scriptors.set('cloud', shapeBaseAPI);
  this.scriptors.set('actor', shapeBaseAPI);
  this.scriptors.set('singlearrow', shapeBaseAPI);
  this.scriptors.set('doublearrow', shapeBaseAPI);
  this.scriptors.set('image', shapeBaseAPI);
  this.scriptors.set('arc', shapeBaseAPI);
  this.scriptors.set('swimlane', shapeBaseAPI);

  this.scriptors.set('custom', shapeBaseAPI); // for hrefs
  this.scriptors.set('group', shapeBaseAPI); // for groups

  // custom shapes
  this.scriptors.set('button', buttonBaseAPI);
  this.scriptors.set('link', linkBaseAPI);
  this.scriptors.set('sound', soundBaseAPI);
  this.scriptors.set('table', tableBaseAPI);
  this.scriptors.set('chart', chartBaseAPI);

  // @if WEBSCADA
  this.scriptors.set('bus', busBaseAPI);
  this.scriptors.set('switch', switchBaseAPI);
  this.scriptors.set('separator', separatorBaseAPI);
  this.scriptors.set('rollswitch', rollSwitchBaseAPI);
  this.scriptors.set('rolldisconnector', rollDisconnectorBaseAPI);
  this.scriptors.set('disconnector', disconnectorBaseAPI);
  this.scriptors.set('ground', groundBaseAPI);
  this.scriptors.set('contactor', groundBaseAPI);
  this.scriptors.set('rollelement', rollelementBaseAPI);
  this.scriptors.set('actuator', actuatorBaseAPI);
  this.scriptors.set('simpleswitch', simpleSwitchBaseAPI);
  this.scriptors.set('poster', posterBaseAPI);
  this.scriptors.set('dispatcher_mark', dispatcherMarkBaseAPI);
  // @endif

  // @if LINKMT
  this.scriptors.set('bmrz', bmrzBaseAPI);
  // @endif

  //----> longTouch conextMenu
  const editor = this.ui.editor;
  const graph = editor.graph;
  let contextMenu = null;

  graph.addListener(
    mxEvent.TAP_AND_HOLD,
    function (sender, evt) {
      const cell = evt.getProperty('cell');

      //pick up active point
      graph.setSelectionCell(cell);
      if (!cell) {
        graph.clearSelection();
      }
      if (cell) {
        //create context menu
        contextMenu = new mxPopupMenu(document.createElement('div'));
        contextMenu.div.className = 'mxPopupMenu';
        this.menus.createPopupMenu(contextMenu, cell, evt);

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

        //add position for context menu touch by touch
        const x = evt.getProperty('event').clientX;
        const y = evt.getProperty('event').clientY;
        contextMenu.div.style.left = `${x}px`;
        contextMenu.div.style.top = `${y}px`;
        contextMenu.showMenu();
      }
    }.bind(this)
  );

  //-------> fix bug with empty tbody
  graph.addListener(mxEvent.TAP_AND_HOLD, function (sender, evt) {
    const div = document.querySelector('div.mxPopupMenu');
    const tbody = document.querySelector('div.mxPopupMenu tbody');
    if (tbody && tbody.innerHTML.trim() === '') {
      div.remove();
    }
  });
  //<------- fix bug with empty tbody

  document.addEventListener('click', function (event) {
    const menuContainer = document.querySelector('.mxPopupMenu');
    if (menuContainer) {
      contextMenu.hideMenu();
    }
  });
  //-------> fix bug with extra divs. case: touch switch mouse
  graph.addListener(mxEvent.CLICK, function (sender, evt) {
    const cell = evt.getProperty('cell');
    const menuContainer = document.querySelectorAll('div.mxPopupMenu');

    if (menuContainer && menuContainer.length > 1) {
      const divs = document.querySelectorAll('div.mxPopupMenu');
      divs[0].remove();
    }
    if (contextMenu && !cell) {
      contextMenu.hideMenu();
    }
  });
  //<------- fix bug with extra divs. case: touch switch mouse

  //<---- longTouch conextMenu

  // @if WEBSCADA
  var menusCreatePopupMenu = Menus.prototype.createPopupMenu;
  Menus.prototype.createPopupMenu = function (menu, cell, evt) {
    menusCreatePopupMenu.apply(this, arguments);

    const isLeftClick = mxEvent.isLeftMouseButton(evt);
    const isMiddleClick = mxEvent.isMiddleMouseButton(evt);
    if (!cell || isLeftClick || isMiddleClick) {
      return;
    }

    const editor = this.editorUi.editor;
    const graph = editor.graph;
    const marksService = this.editorUi.marksService;
    if (cell.manual || cell.blocked || cell.service || !API.USER.hasPermission('scheme.exec_cmd')) {
      return;
    }

    let target = cell.commands != null ? cell : cell.getParent();
    let commands = target != null ? target.commands : null;
    if (commands != null && commands.length > 0) {
      for (let i = 0; i < commands.length; i++) {
        let cmd = commands[i];
        menu.addItem(
          cmd.d,
          null,
          mxUtils.bind(cmd, function () {
            if (target.scriptor != null) target.scriptor.execCommand(target, this);
          }),
          null,
          null,
          true
        );
      }
    }
    // Poster actions
    if (cell.scriptor && cell.scriptor instanceof PosterScriptAPI && marksService.isEnabled()) {
      menu.addItem('Редактировать', null, () => {
        API.POSTERS.openPosterEditor(graph, cell, false);
      });
      menu.addItem('Удалить', null, () => {
        try {
          graph.model.beginUpdate();
          graph.removeCells([cell]);
        } finally {
          graph.model.endUpdate();
        }
      });
    }
    // Dispatcher mark actions
    if (cell.scriptor && cell.scriptor instanceof DispatcherMarkScriptAPI && marksService.isEnabled()) {
      menu.addItem('Редактировать', null, () => {
        API.DISPATCHER_MARKS.openMarkEditor(graph, cell, false);
      });
      menu.addItem('Удалить', null, () => {
        try {
          graph.model.beginUpdate();
          graph.removeCells([cell]);
        } finally {
          graph.model.endUpdate();
        }
      });
    }
  };
  // @endif

  this.graph.addListener(mxEvent.CLICK, (sender, evt) => {
    if (this.marksService.isEnabled()) return;

    const isRightClick = mxEvent.isRightMouseButton(evt.getProperty('event'));
    const cell = evt.getProperty('cell'); // cell may be null

    const onCellLeftClick = () => {
      const styles = cell.style.split(';');

      if (styles.includes('poster')) {
        /* cell is poster */
        API.POSTERS.openPosterViewer(cell._model, this.graph, cell);
        evt.consume();
      } else if (styles.includes('dispatcher_mark')) {
        /* cell is dispatcher mark */
        API.DISPATCHER_MARKS.openMarkViewer(cell._model, this.graph, cell);
        evt.consume();
      } else {
        /* generic cell - check and execute binded action */
        const target = cell.action != null ? cell : cell.getParent();
        if (target != null && target.action != null) {
          if (target.scriptor != null) {
            target.scriptor.execAction(cell);
          }
          evt.consume();
        }
      }
    };

    if (cell && !isRightClick) {
      /* left click on cell */
      onCellLeftClick();
      // } else if (!cell && !isRightClick) {
      //     /* left click on emty space */
      // } else if (!cell && isRightClick) {
      //     /* right click on emty space */
    }

    // if (cell != null && (cell.commands == null || cell.commands.length == 0))
    // {
    //     let target = (cell.action != null ? cell : cell.getParent());
    //     if (target != null && target.action != null)
    //     {
    //         if (target.scriptor != null)
    //             target.scriptor.execAction(cell);
    //         evt.consume();
    //     }
    // }
  });

  let graphConvertValueToString = this.graph.convertValueToString;
  this.graph.convertValueToString = function (cell) {
    if (this.model.isVertex(cell)) {
      let state = this.view.getState(cell);
      if (state != null) {
        switch (state.style[mxConstants.STYLE_SHAPE]) {
          case 'chart': {
            // remove image
            if (state.shape.image != null) {
              delete state.shape.image;
              this.cellRenderer.doRedrawShape(state);
            }
            return cell.canvas;
          }
        }
      }
    }
    return graphConvertValueToString.apply(this, arguments);
  };
};

ScriptHandler.prototype.register = function (name, script) {
  if (isNullOrEmpty(name) || isNullOrEmpty(script)) return;
  var scriptor = this.scriptors.get(name);
  if (scriptor == null) {
    let evalResult = mxUtils.eval(script);
    if (evalResult != null && typeof evalResult == 'function')
      this.scriptors.set(
        name.toLowerCase(),
        mxUtils.bind(this, function () {
          return new evalResult(this.ui);
        })
      );
  }
};
ScriptHandler.prototype.setup = function (cell) {
  if (cell == null || !mxUtils.isNode(cell.value)) return null;
  if (!cell.scriptor) {
    let name = cell.value.nodeName.toLowerCase();
    if (isNullOrEmpty(name)) return null;

    // check binding
    // let scriptBinding = cell.getBinding('script');
    // if (scriptBinding != null) {
    //   let scriptName = $(scriptBinding).attr('value');
    //   if (!isNullOrEmpty(scriptName)) name = scriptName.toLowerCase();
    // }

    let factory = this.scriptors.get(name) || this.scriptors.get('custom');
    if (factory == null || typeof factory != 'function') return null;

    cell.scriptor = new factory();
  }
  return cell.scriptor;
};
ScriptHandler.prototype.destroy = function () {};

function ShapeAPI(editorUI) {
  mxEventSource.call(this);
  this.ui = editorUI;
  this.editor = this.ui.editor;
  this.graph = this.editor.graph;
  this.init();
}
mxUtils.extend(ShapeAPI, mxEventSource);

ShapeAPI.prototype.init = function () {};
ShapeAPI.prototype.setup = function (cell) {
  // hide tooltip
  cell.getTooltip = function () {};
  // set cursor
  if (cell.bindings != null && cell.bindings.length > 0) {
    let cellState = this.graph.view.getState(cell);
    if (cellState == null) return;

    if (cell.commands == null) {
      let commandsBinding = cell.getBinding('commands');
      if (commandsBinding != null && !isNullOrEmpty(commandsBinding.value)) cell.commands = JSON.parse(commandsBinding.value);
    }
    if (cell.action == null) {
      let actionBinding = cell.getBinding('action');
      if (actionBinding != null && !isNullOrEmpty(actionBinding.value)) {
        cell.action = JSON.parse(actionBinding.value);
        let argsBinding = cell.getBinding('action.args');
        cell.action_args = argsBinding != null ? JSON.parse(argsBinding.value) : null;
      }
    }

    if ((cell.commands != null && cell.commands.length > 0) || cell.action != null) cellState.setCursor(mxConstants.CURSOR_CONNECT);
  }
};
ShapeAPI.prototype.visit = function (cell, map, resolver) {
  this.setup(cell);
  if (cell.bindings != null && cell.bindings.length > 0) {
    for (var i = 0; i < cell.bindings.length; i++) {
      var item = cell.bindings[i];
      if (item != null && !isNullOrEmpty(item.value)) {
        let bind = JSON.parse(item.value);
        if (bind == null) continue;

        // common bindings
        switch (item.name) {
          case 'state':
          case 'link':
          case 'visibility':
          case 'label':
          case 'command':
          case 'blink':
          case 'rotation':
          case 'turn':
          case 'shift':
          case 'move':
          case 'play':
          case 'color.fill.$1': // colors
          case 'color.fill.$2':
          case 'color.fill.$3':
          case 'color.fill.$4':
          case 'color.fill.$5':
          case 'color.brd.$1':
          case 'color.brd.$2':
          case 'color.brd.$3':
          case 'color.brd.$4':
          case 'color.brd.$5':
          case 'color.font.$1':
          case 'color.font.$2':
          case 'color.font.$3':
          case 'color.font.$4':
          case 'color.font.$5':
          case 'action.trigger':
            {
              if (GUID.isValid(bind.id)) map.eq.push(bind);
              else map.tag.push(bind);
            }
            break;
          default:
            {
              // custom resolve
              if (resolver != null && resolver(item)) break;
              // process as static
              this.exec(cell, item);
            }
            break;
        }
      }
    }
  }
};
ShapeAPI.prototype.checkValue = function (value) {
  return value != null && value.q >= API.ENUMS.QualityValue.Good;
};
ShapeAPI.prototype.processValue = function (cell, value) {
  let result = {
    src: value,
    get bad() {
      return !shapeCheckValue(this.src);
    },
  };

  if (result.src != null) {
    result.isbool = result.src.vtype == API.ENUMS.TagValueType.Boolean;
    // eq state
    if (result.src.eq && result.src.eq == result.src.id) {
      result.state = {
        values: result.src.v.split('|'),
        has: function (val) {
          return this.values.indexOf(val) >= 0;
        },
        get service() {
          return this.has('SERVICE');
        },
        get blocked() {
          return this.has('BLOCK');
        },
        get manual() {
          return this.has('MANUAL');
        },
      };
      result.value = this.resolveState(result);
    } else result.value = this.resolveValue(result);
  }

  // check blocked & manual & service states
  if (result.state != null) {
    cell.manual = null;
    cell.blocked = null;
    this.graph.removeCellOverlays(cell);

    cell.service = result.state.service;

    if (result.state.blocked) {
      cell.blocked = true;
      this.graph.addCellOverlay(cell, new mxCellOverlay(new mxImage(mxConstants.BLOCKED_IMAGE, 16, 16), 'Оперативная блокировка', null, mxConstants.ALIGN_TOP));
    }
    if (result.state.manual) {
      cell.manual = true;
      this.graph.addCellOverlay(cell, new mxCellOverlay(new mxImage(mxConstants.MANUAL_IMAGE, 16, 16), 'Ручное управление', null, mxConstants.ALIGN_BOTTOM));
    }
  }

  return result;
};
ShapeAPI.prototype.resolveState = function (result) {
  let defaultState = 'UNKNOWN';
  if (result == null || result.bad) return defaultState;
  else return result.state.service ? 'SERVICE' : result.state.values.length > 0 ? result.state.values[0] : defaultState;
};
ShapeAPI.prototype.resolveValue = function (result) {
    if (result == null || result.src == null) return null;
  return API.FORMAT.getValue(result.src);
};
ShapeAPI.prototype.stateToBit = function (state) {
  if (isNullOrEmpty(state)) return false;
  return ['ON', 'ROLL_IN', 'ROLL_IN_SWITCH_ON', 'OPEN'].indexOf(state) >= 0;
};
ShapeAPI.prototype.exec = function (cell, binding, item) {
  if (cell == null || binding == null) return;

  let actionName = binding.name;
  if (isNullOrEmpty(actionName)) return;

  let actionPath = actionName.split('.');
  if (actionPath.length > 1) actionName = actionPath[0];

  let targetAction = this[actionName];
  if (targetAction == null) return;

  return targetAction.apply(this, [cell, binding, item]);
};
ShapeAPI.prototype.action = function (cell, binding, value) {
  if (cell == null || binding == null || value == null) return;

  if (binding.initial) return;

  let actionPath = binding.name.split('.');
  if (actionPath.length == 0 || actionPath[0] != 'action') return;

  switch (actionPath[1]) {
    case 'trigger':
      {
        let result = this.processValue(cell, value);
        let on = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);
        if (on) this.execAction(cell);
      }
      break;
    default:
      break;
  }
};
ShapeAPI.prototype.execCommand = function (cell, cmd) {
  if (cell == null || cmd == null) return;

  if (cell.manual || cell.blocked || cell.service || !API.USER.hasPermission('scheme.exec_cmd')) {
    console.log('Управление запрещено')
    //messageError('Управление запрещено');
    return;
  }

  let postCommand = function (cmd) {
    // subscribe to execution result
    if (template != null && template.execHubProxy != null) template.execHubProxy.invoke('subscribe', cmd);

    // exec command
    AJAX.post(
      API.FUNC.schemeExecCmd,
      null,
      { id: cmd.id, parent: cmd.parent },
      function (xhr, resp) {
        if (resp === true) 
        //messageDebug(translate('common.messages.command_sent_to_server'));
        console.log('common.messages.command_sent_to_server')
        //else messageError(translate('common.errors.command_execution'));
        else console.log('common.errors.command_execution');
      },
      function (xhr, err) {
        console.log('common.errors.command_execution')
        //messageError(translate('common.errors.command_execution'));
      }
    );
  };

  if (cmd.confirm != false) {
    console.log('common.execute_command' + " '" + (isNullOrEmpty(cmd.d) ? cmd.val : cmd.d) + "'", function (result) {
      if (result === true) postCommand(cmd);
    })
    // messageConfirm(translate('common.execute_command') + " '" + (isNullOrEmpty(cmd.d) ? cmd.val : cmd.d) + "'", function (result) {
    //   if (result === true) postCommand(cmd);
    // });
  } else postCommand(cmd);
};
ShapeAPI.prototype.execAction = function (cell) {
  if (cell == null || cell.action == null || cell.action_args == null) return;

  let cellState = this.graph.view.getState(cell);
  if (cellState == null) return null;

  switch (cell.action) {
    case 'exec':
      {
        cell.action_args.confirm = false;
        this.execCommand(cell, cell.action_args);
      }
      break;
    case 'open':
      {
        this.graph.openLink(cell.action_args.text, '_blank');
      }
      break;
    case 'goto':
      {
        this.graph.openLink(cell.action_args.text, '_self');
      }
      break;
    case 'camera':
      {
        let cam = new CameraWindow(this.ui, cell.action_args.text);
        if (cam != null) {
          if (cam.isVisible()) cam.show();
          else cam.show(cellState.shape.node, { x: 10, y: 10 });
        }
      }
      break;
    case 'eq':
      {
        window.open(`/equipments/view?id=${cell.action_args.id}&mode=subwindow`, '_blank', 'location=yes,height=600,width=800,scrollbars=yes,status=yes');
      }
      break;
    default:
      break;
  }
};

ShapeAPI.prototype.vclass = function (cell, binding) {
  if (cell == null || binding == null) return;
  // get vclass
  if (binding.name == 'vclass' && !isNullOrEmpty(binding.value)) cell.vclass = JSON.parse(binding.value);
  // apply vclass
  if (!VCLASS.isDefaultValue(cell.vclass)) {
    let targetColor = VCLASS.getColor(cell.vclass);
    // apply color
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, targetColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, targetColor, [cell]);
  }
};
ShapeAPI.prototype.visibility = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);
  let visible = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  this.graph.cellsToggled([cell], visible || false);

  //let originOpacity     = cell.origin.style.opacity     || 100;
  //let originTextOpacity = cell.origin.style.textOpacity || 100;

  //// remove opacity
  //this.graph.setCellStyles(mxConstants.STYLE_OPACITY, originOpacity, [cell]);
  //this.graph.setCellStyles(mxConstants.STYLE_TEXT_OPACITY, originTextOpacity, [cell]);

  //let cellState = this.graph.view.getState(cell);
  //if (cellState != null)
  //{
  //    let opacity     = visible ? (cell.origin.style.opacity     || 100) : 0;
  //    let textopacity = visible ? (cell.origin.style.textOpacity || 100) : 0;
  //    this.graph.setCellStyles(mxConstants.STYLE_OPACITY, opacity, [cell]);
  //    this.graph.setCellStyles(mxConstants.STYLE_TEXT_OPACITY, textopacity, [cell]);
  //}
};
ShapeAPI.prototype.blink = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);
  let blinking = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  if (cell.blinkingID) {
    window.clearInterval(cell.blinkingID);
    delete cell.blinkingID;
  }

  //let originOpacity     = cell.origin.style.opacity     || 100;
  //let originTextOpacity = cell.origin.style.textOpacity || 100;

  // reset visibility
  this.graph.cellsToggled([cell], true);
  //this.graph.setCellStyles(mxConstants.STYLE_OPACITY, originOpacity, [cell]);
  //this.graph.setCellStyles(mxConstants.STYLE_TEXT_OPACITY, originTextOpacity, [cell]);

  // run
  if (blinking) {
    if (cell.blinkSpeed == null) {
      cell.blinkSpeed = 500;
      let speedBinding = cell.getBinding('blink.speed');
      if (speedBinding != null) cell.blinkSpeed = parseInt(JSON.parse(speedBinding.value));
    }

    cell.blinkingID = window.setInterval(
      mxUtils.bind(this, function (cell) {
        //this.graph.toggleCells(!cell.isVisible(), [cell], false);
        this.graph.cellsToggled([cell], !cell.isVisible());
        //let style   = this.graph.getCellStyle(cell);
        //let opValue = style.opacity == 100 ? 0 : 100;
        //this.graph.setCellStyles(mxConstants.STYLE_TEXT_OPACITY, opValue, [cell]);
        //this.graph.setCellStyles(mxConstants.STYLE_OPACITY, opValue, [cell]);
      }),
      cell.blinkSpeed,
      cell
    );
  }
};
ShapeAPI.prototype.label = function (cell, binding, value) {
  if (cell == null || value == null) return;
  let result = this.processValue(cell, value);
  this.graph.setAttributeForCell(cell, 'label', result.value);
};
ShapeAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);
  let stateON = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let targetColor = cell.origin.style.fillColor || 'none';

  // если задан класс напряжения
  if (!VCLASS.isDefaultValue(cell.vclass)) {
    if (stateON) targetColor = VCLASS.getColor(cell.vclass);
  }

  // проверяем динамические цвета заливки
  if (cell.fill_colors && Object.keys(cell.fill_colors).length > 0) {
    let firstIndex = Object.keys(cell.fill_colors).sort()[0];
    targetColor = cell.fill_colors[firstIndex];
  }

  // apply color
  this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, targetColor, [cell]);
};
ShapeAPI.prototype.rotation = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);
  let rotate = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  if (cell.rotationID) {
    window.clearInterval(cell.rotationID);
    delete cell.rotationID;
  }

  // reset rotation
  this.graph.setCellStyles(mxConstants.STYLE_ROTATION, cell.origin.style.rotation || 0, [cell]);

  // run
  if (rotate) {
    if (cell.rotationSpeed == null) {
      cell.rotationSpeed = 100;
      let speedBinding = cell.getBinding('rotation.speed');
      if (speedBinding != null) cell.rotationSpeed = parseInt(JSON.parse(speedBinding.value));
    }

    cell.rotationID = window.setInterval(
      mxUtils.bind(this, function (cell) {
        let style = this.graph.getCellStyle(cell);
        let rValue = (style.rotation || 0) + 10; // 10 град.
        this.graph.setCellStyles(mxConstants.STYLE_ROTATION, rValue, [cell]);
      }),
      cell.rotationSpeed,
      cell
    );
  }
};
ShapeAPI.prototype.turn = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);
  let turning = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  // reset rotation
  this.graph.setCellStyles(mxConstants.STYLE_ROTATION, cell.origin.style.rotation || 0, [cell]);

  // run
  if (turning) {
    if (cell.turnAngle == null) {
      cell.turnAngle = 90;
      let angleBinding = cell.getBinding('turn.angle');
      if (angleBinding != null) cell.turnAngle = parseInt(JSON.parse(angleBinding.value));
    }
    // apply
    this.graph.setCellStyles(mxConstants.STYLE_ROTATION, cell.turnAngle, [cell]);
  }
};
ShapeAPI.prototype.shift = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);
  let shifting = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let geo = this.graph.getCellGeometry(cell).clone();

  // reset cell position
  geo.x = cell.origin.geometry.x;
  geo.y = cell.origin.geometry.y;
  this.graph.getModel().setGeometry(cell, geo);

  // run
  if (shifting) {
    if (cell.dx == null) {
      let dxBinding = cell.getBinding('shift.dx');
      cell.dx = dxBinding != null ? parseInt(JSON.parse(dxBinding.value)) : 0;
    }
    if (cell.dy == null) {
      let dyBinding = cell.getBinding('shift.dy');
      cell.dy = dyBinding != null ? parseInt(JSON.parse(dyBinding.value)) : 0;
    }
    // apply
    geo.x += cell.dx;
    geo.y += cell.dy;
    this.graph.getModel().setGeometry(cell, geo);
  }
};
ShapeAPI.prototype.move = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);
  let moving = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let geo = this.graph.getCellGeometry(cell).clone();

  // reset cell position
  geo.x = cell.origin.geometry.x;
  geo.y = cell.origin.geometry.y;
  this.graph.getModel().setGeometry(cell, geo);

  // run
  if (moving) {
    if (cell.x == null) {
      let xBinding = cell.getBinding('move.x');
      cell.x = xBinding != null ? parseInt(JSON.parse(xBinding.value)) : geo.x;
    }
    if (cell.y == null) {
      let yBinding = cell.getBinding('move.y');
      cell.y = yBinding != null ? parseInt(JSON.parse(yBinding.value)) : geo.y;
    }
    // apply
    geo.x = cell.x;
    geo.y = cell.y;
    this.graph.getModel().setGeometry(cell, geo);
  }
};

ShapeAPI.prototype.color = function (cell, binding, value) {
  if (cell == null || binding == null || value == null) return null;

  let actionName = binding.name.split('.');
  if (actionName.length == 0 || actionName[0] != 'color') return null;

  let color = null;
  switch (actionName[1]) {
    case 'fill':
      color = this.color_fill(cell, binding, value);
      break;
    case 'brd':
      color = this.color_border(cell, binding, value);
      break;
    case 'font':
      color = this.color_font(cell, binding, value);
      break;
  }

  return color;
};
ShapeAPI.prototype.color_fill = function (cell, binding, value) {
  if (cell == null || binding == null || value == null) return null;

  // check vclass
  if (!VCLASS.isDefaultValue(cell.vclass)) return null;

  let result = this.processValue(cell, value);
  let coloring = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let color = null;

  // for dynamic colors
  if (cell.fill_colors == null) cell.fill_colors = {};

  let actionName = binding.name;
  let match = actionName.split('.')[2].match(/\d+$/);
  let index = match != null && match.length > 0 ? match[0] : 0;

  let colorValueBinding = cell.getBinding(actionName + '.val');
  if (index == 0 || colorValueBinding == null) delete cell.fill_colors[index];
  else {
    color = JSON.parse(colorValueBinding.value);
    // get value
    if (coloring) cell.fill_colors[index] = color;
    else {
      // bad quality
      if (result.bad) cell.fill_colors[index] = VCLASS.UNRELIABLE_INFO;
      else delete cell.fill_colors[index];
    }
  }

  // get first color or reset
  if (Object.keys(cell.fill_colors).length > 0) {
    let firstIndex = Object.keys(cell.fill_colors).sort()[0];
    color = cell.fill_colors[firstIndex];
  } else {
    // for reset
    color = null;
  }

  // apply
  cell.color_fill = color || cell.origin.style.fillColor || 'none';
  this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, cell.color_fill, [cell]);

  return cell.color_fill;
};
ShapeAPI.prototype.color_border = function (cell, binding, value) {
  if (cell == null || binding == null || value == null) return null;

  if (!VCLASS.isDefaultValue(cell.vclass)) return null;

  let result = this.processValue(cell, value);
  let coloring = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let color = null;

  // for dynamic colors
  if (cell.brd_colors == null) cell.brd_colors = {};

  let actionName = binding.name;
  let match = actionName.split('.')[2].match(/\d+$/);
  let index = match != null && match.length > 0 ? match[0] : 0;

  let colorValueBinding = cell.getBinding(actionName + '.val');
  if (index == 0 || colorValueBinding == null) delete cell.brd_colors[index];
  else {
    color = JSON.parse(colorValueBinding.value);
    // check value
    if (coloring) cell.brd_colors[index] = color;
    else delete cell.brd_colors[index];
  }

  // get first color or reset
  if (Object.keys(cell.brd_colors).length > 0) {
    let firstIndex = Object.keys(cell.brd_colors).sort()[0];
    color = cell.brd_colors[firstIndex];
  } else {
    // for reset
    color = null;
  }

  // apply
  if (color != null) {
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, color, [cell]);
  } else {
    // reset to defaults
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, cell.origin.style.strokeColor || 'none', [cell]);
  }

  return color;
};
ShapeAPI.prototype.color_font = function (cell, binding, value) {
  if (cell == null || binding == null || value == null) return null;

  let result = this.processValue(cell, value);
  let coloring = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let color = null;

  // for dynamic colors
  if (cell.font_colors == null) cell.font_colors = {};

  let actionName = binding.name;
  let match = actionName.split('.')[2].match(/\d+$/);
  let index = match != null && match.length > 0 ? match[0] : 0;

  let colorValueBinding = cell.getBinding(actionName + '.val');
  if (index == 0 || colorValueBinding == null) delete cell.font_colors[index];
  else {
    color = JSON.parse(colorValueBinding.value);
    // check value
    if (coloring) cell.font_colors[index] = color;
    else delete cell.font_colors[index];
  }

  // get first color or reset
  if (Object.keys(cell.font_colors).length > 0) {
    let firstIndex = Object.keys(cell.font_colors).sort()[0];
    color = cell.font_colors[firstIndex];
  } else {
    // for reset
    color = null;
  }

  // apply
  if (color != null) {
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, color, [cell]);
  } else {
    // reset to defaults
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, cell.origin.style.fontColor || 'none', [cell]);
  }

  return color;
};

// save base implementation
var shapeInit = ShapeAPI.prototype.init;
var shapeSetup = ShapeAPI.prototype.setup;
var shapeVisit = ShapeAPI.prototype.visit;
var shapeCheckValue = ShapeAPI.prototype.checkValue;
var shapeProcessValue = ShapeAPI.prototype.processValue;
var shapeResolveState = ShapeAPI.prototype.resolveState;
var shapeResolveValue = ShapeAPI.prototype.resolveValue;
var shapeStateToBit = ShapeAPI.prototype.stateToBit;
var shapeExec = ShapeAPI.prototype.exec;

var shapeVisibility = ShapeAPI.prototype.visibility;
var shapeBlink = ShapeAPI.prototype.blink;
var shapeLabel = ShapeAPI.prototype.label;
var shapeState = ShapeAPI.prototype.state;
var shapeRotation = ShapeAPI.prototype.rotation;
var shapeTurn = ShapeAPI.prototype.turn;
var shapeShift = ShapeAPI.prototype.shift;
var shapeMove = ShapeAPI.prototype.move;
var shapeColor = ShapeAPI.prototype.color;
var shapeColorFill = ShapeAPI.prototype.color_fill;
var shapeColorBorder = ShapeAPI.prototype.color_border;
var shapeColorFont = ShapeAPI.prototype.color_font;

function LinkScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(LinkScriptAPI, ShapeAPI);
LinkScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ON' : 'OFF';

  let borderColor = cell.origin.style.strokeColor || 'none';

  // если задан класс напряжения
  switch (current) {
    case 'ON':
      borderColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : borderColor;
      break;
    case 'OFF':
      borderColor = VCLASS.UOFF;
      break;
    case 'SERVICE':
      borderColor = VCLASS.SERVICE;
      break;
    default:
      borderColor = VCLASS.UNRELIABLE_INFO;
      break;
  }

  // apply color
  this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);
};

function BusScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(BusScriptAPI, ShapeAPI);
BusScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ON' : 'OFF';

  let fillColor = cell.origin.style.fillColor || 'none';

  switch (current) {
    case 'ON':
      fillColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : fillColor;
      break;
    case 'OFF':
      fillColor = VCLASS.UOFF;
      break;
    case 'SERVICE':
      fillColor = VCLASS.SERVICE;
      break;
    default:
      fillColor = VCLASS.UNRELIABLE_INFO;
      break;
  }

  // apply color
  this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, fillColor, [cell]);
};

function SwitchScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(SwitchScriptAPI, ShapeAPI);
SwitchScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.question == null) {
    cell.question = this.graph.insertVertex(cell, null, '?', 0, 0, geo.width, geo.height, 'text;align=center;verticalAlign=middle;pointerEvents=0;fontSize=' + (geo.height / 10) * 7, false);
    cell.question.getTooltip = function () {};
  }
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, '', -0.5, -0.5, geo.width * 2, geo.height * 2, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
};
SwitchScriptAPI.prototype.position = function (cell, binding) {
  let pos = binding != null ? JSON.parse(binding.value) : mxCellRenderer.defaultShapes['switch'].prototype.position == true ? '1' : '0';
  let state = this.graph.view.getState(cell);
  if (state != null && state.shape != null) cell.position = state.shape.position = pos == '1';
};
SwitchScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ON' : 'OFF';

  // hide question
  cell.question.setVisible(false);
  // hide damage
  cell.damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;
    // check position
    if (cell.position == null) cell.position = mxCellRenderer.defaultShapes['switch'].prototype.position;
    shape.position = cell.position;

    let fontColor = cell.origin.style.fontColor || 'none';
    let fillColor = cell.origin.style.fillColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, fillColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // если задан класс напряжения
    if (!VCLASS.isDefaultValue(cell.vclass)) {
      let vclassColor = VCLASS.getColor(cell.vclass);
      switch (current) {
        case 'ON':
          shape.on = true;
          fillColor = vclassColor;
          break;
        case 'OFF':
          shape.on = false;
          fillColor = 'none';
          borderColor = vclassColor;
          break;
        case 'DAMAGE':
          fillColor = 'none';
          borderColor = vclassColor;
          cell.damage.setVisible(true);
          // update cell.damage
          let damageCellState = this.graph.view.getState(cell.damage);
          if (damageCellState != null) damageCellState.setCursor(mxConstants.CURSOR_CONNECT);
          break;
        case 'SERVICE':
          // hide position if exists
          shape.position = false;
          fillColor = 'none';
          borderColor = VCLASS.SERVICE;
          break;
        default:
          // hide position if exists
          shape.position = false;
          // apply colors
          fillColor = VCLASS.UNRELIABLE_INFO;
          borderColor = vclassColor;
          // show question mark
          cell.question.setVisible(true);
          this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, vclassColor, [cell.question]);
          // update cell.question
          let questionCellState = this.graph.view.getState(cell.question, true);
          if (questionCellState != null) questionCellState.setCursor(mxConstants.CURSOR_CONNECT);
          break;
      }
    } else {
      switch (current) {
        case 'ON':
          shape.on = true;
          break;
        case 'OFF':
          shape.on = false;
          break;
        case 'DAMAGE':
          shape.on = false;
          cell.damage.setVisible(true);
          // update cell.damage
          let damageCellState = this.graph.view.getState(cell.damage);
          if (damageCellState != null) damageCellState.setCursor(mxConstants.CURSOR_CONNECT);
          break;
        case 'SERVICE':
          // hide position if exists
          shape.position = false;
          fillColor = 'none';
          borderColor = VCLASS.SERVICE;
          break;
        default:
          // hide position if exists
          shape.position = false;
          // apply colors
          fillColor = VCLASS.UNRELIABLE_INFO;
          // show question mark
          cell.question.setVisible(true);
          // update cell.question
          let questionCellState = this.graph.view.getState(cell.question);
          if (questionCellState != null) questionCellState.setCursor(mxConstants.CURSOR_CONNECT);
          break;
      }
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, fillColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function SoundScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(SoundScriptAPI, ShapeAPI);
SoundScriptAPI.prototype.setup = function (cell) {
  if (cell.audio == null) {
    let dataBinding = cell.getBinding('play.data');
    let data = dataBinding != null ? JSON.parse(dataBinding.value) : null;
    if (data != null) {
      let cycleBinding = cell.getBinding('play.cycle');
      let loop = (cycleBinding != null ? JSON.parse(cycleBinding.value) : '0') == '1';
      cell.audio = new Howl({
        src: [data],
        autoplay: false,
        preload: true,
        mute: false,
        loop: loop,
        volume: 1,
      });
    }
  }
};
SoundScriptAPI.prototype.playSound = function () {
  if (this.audio != null) this.audio.play();
};
SoundScriptAPI.prototype.stopSound = function () {
  if (this.audio != null) this.audio.stop();
};
SoundScriptAPI.prototype.play = function (cell, binding, value) {
  if (cell == null || value == null) return;

  if (binding.initial) return;

  let result = this.processValue(cell, value);
  let playing = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  if (playing) this.playSound.call(cell);
  else this.stopSound.call(cell);
};

function TableScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
  this.ui = editorUI;
}
mxUtils.extend(TableScriptAPI, ShapeAPI);
TableScriptAPI.prototype.visit = function (cell, map) {
  let args = Array.prototype.slice.call(arguments);
  // add custom resolver
  args.push(function (item) {
    if (item != null && !isNullOrEmpty(item.value)) {
      let bind = JSON.parse(item.value);
      if (bind == null) return;

      switch (item.name) {
        case 'color.font.name':
        case 'color.font.name.bad':
        case 'color.fill.name':
        case 'color.fill.name.bad':
        case 'color.font.value':
        case 'color.font.value.bad':
        case 'color.fill.value':
        case 'color.fill.value.bad':
        case 'color.font.measure':
        case 'color.font.measure.bad':
        case 'color.fill.measure':
        case 'color.fill.measure.bad':
          {
            cell[item.name] = bind;
          }
          break;

        case 'color.font.name.$1':
        case 'color.font.name.$2':
        case 'color.font.name.$3':
        case 'color.fill.name.$1':
        case 'color.fill.name.$2':
        case 'color.fill.name.$3':
        case 'color.font.value.$1':
        case 'color.font.value.$2':
        case 'color.font.value.$3':
        case 'color.fill.value.$1':
        case 'color.fill.value.$2':
        case 'color.fill.value.$3':
        case 'color.font.measure.$1':
        case 'color.font.measure.$2':
        case 'color.font.measure.$3':
        case 'color.fill.measure.$1':
        case 'color.fill.measure.$2':
        case 'color.fill.measure.$3':
          {
            if (GUID.isValid(bind.id)) map.eq.push(bind);
            else map.tag.push(bind);
          }
          break;
      }
    }
  });
  shapeVisit.apply(this, args);

  // let itemsBinding = cell.getBinding('items');
  // if (itemsBinding != null && !isNullOrEmpty(itemsBinding.value)) {
  //   let bind = JSON.parse(itemsBinding.value);
  //   if (bind != null && bind.length > 0) {
  //     for (let j = 0; j < bind.length; j++) {
  //       let id = bind[j].id;
  //       if (GUID.isValid(id)) map.eq.push(bind[j]);
  //       else map.tag.push(bind[j]);
  //     }
  //   }
  // }
};
TableScriptAPI.prototype.setup = function (cell) {
  // find tables
  // if (cell.tables == null) {
  //   cell.tables = $('table.tbl' + cell.id);
  //   cell.container = cell.children[0];
  // }
};
TableScriptAPI.prototype.color = function (cell, binding, value) {
  if (cell == null || binding == null || value == null) return null;

  let actionName = binding.name.split('.');
  if (actionName.length < 2 || actionName[0] != 'color') return null;

  let color = null;
  switch (actionName[1]) {
    case 'font':
      color = this.color_font(cell, binding, value, actionName[2]);
      break;
    case 'fill':
      color = this.color_fill(cell, binding, value, actionName[2]);
      break;
  }

  return color;
};
TableScriptAPI.prototype.color_font = function (cell, binding, value, target) {
  if (cell == null || binding == null || value == null || isNullOrEmpty(target)) return null;

  let result = this.processValue(cell, value);
  let coloring = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let color = null;
  let key = 'font_colors_' + target;

  // for dynamic colors
  cell[key] = cell[key] || {};

  let actionName = binding.name;
  let match = actionName.split('.')[3].match(/\d+$/);
  let index = match != null && match.length > 0 ? match[0] : 0;

  let colorValueBinding = cell.getBinding(actionName + '.val');
  if (index == 0 || colorValueBinding == null || !coloring) delete cell[key][index];
  else {
    color = JSON.parse(colorValueBinding.value);
    // set value
    if (coloring) cell[key][index] = color;
  }

  // get first color or reset
  if (Object.keys(cell[key]).length > 0) {
    let firstIndex = Object.keys(cell[key]).sort()[0];
    color = cell[key][firstIndex];
  } else {
    // for reset
    color = null;
  }

  // apply
  cell['current.color.font.' + target] = color;

  return color;
};
TableScriptAPI.prototype.color_fill = function (cell, binding, value, target) {
  if (cell == null || binding == null || value == null || isNullOrEmpty(target)) return null;

  let result = this.processValue(cell, value);
  let coloring = !result.bad && (result.state ? this.stateToBit(result.value) : result.value);

  let color = null;
  let key = 'fill_colors_' + target;

  // for dynamic colors
  cell[key] = cell[key] || {};

  let actionName = binding.name;
  let match = actionName.split('.')[3].match(/\d+$/);
  let index = match != null && match.length > 0 ? match[0] : 0;

  let colorValueBinding = cell.getBinding(actionName + '.val');
  if (index == 0 || colorValueBinding == null || !coloring) delete cell[key][index];
  else {
    color = JSON.parse(colorValueBinding.value);
    // set value
    if (coloring) cell[key][index] = color;
  }

  // get first color or reset
  if (Object.keys(cell[key]).length > 0) {
    let firstIndex = Object.keys(cell[key]).sort()[0];
    color = cell[key][firstIndex];
  } else {
    // for reset
    color = null;
  }

  // apply
  cell['current.color.fill.' + target] = color;

  return color;
};
TableScriptAPI.prototype.resolveColor = function () {
  let args = Array.prototype.slice.call(arguments);
  for (let i = 0; i < args.length; i++) {
    if (args[i] != null) return args[i];
  }
  return null;
};

TableScriptAPI.prototype.items = function (cell, binding, value) {
    if (cell == null || value == null) return;
    const fractionLengthBinding = cell.getBinding('fractionLength')
    let fractionLength = fractionLengthBinding != null ? JSON.parse($(fractionLengthBinding).attr('value')) : null;
    
  if (cell.tables != null) {
    let result = this.processValue(cell, value);
    for (var i = 0; i < cell.tables.length; i++) {
      let table = cell.tables[i];

      if (result.src != null) {
        let row = document.querySelector(`#${CSS.escape(result.src.id)}`);
        if (row != null) {
          let cname = $(row).find('td.c-name');
          let cvalue = $(row).find('td.c-value');
          let cmeasure = $(row).find('td.c-measure');
          if (cname == null || cvalue == null || cmeasure == null) return;

          ////////// resolve colors (dynamic || fixed || default) & check for bad //////////

          // font name
          let target_font_color_name = this.resolveColor(cell['current.color.font.name'], cell['color.font.name'], '#000000');
          if (result.bad) target_font_color_name = this.resolveColor(cell['color.font.name.bad'], target_font_color_name);

          // font value
          let target_font_color_value = this.resolveColor(cell['current.color.font.value'], cell['color.font.value'], '#90EE90');
          if (result.bad) target_font_color_value = this.resolveColor(cell['color.font.value.bad'], VCLASS.UNRELIABLE_INFO);

          // font measure
          let target_font_color_measure = this.resolveColor(cell['current.color.font.measure'], cell['color.font.measure'], '#000000');
          if (result.bad) target_font_color_measure = this.resolveColor(cell['color.font.measure.bad'], target_font_color_measure);

          // fill name
          let target_fill_color_name = this.resolveColor(cell['current.color.fill.name'], cell['color.fill.name'], 'transparent');
          if (result.bad) target_fill_color_name = this.resolveColor(cell['color.fill.name.bad'], target_fill_color_name);

          // fill value
          let target_fill_color_value = this.resolveColor(cell['current.color.fill.value'], cell['color.fill.value'], '#000000');
          if (result.bad) target_fill_color_value = this.resolveColor(cell['color.fill.value.bad'], '#808080');

          // fill measure
          let target_fill_color_measure = this.resolveColor(cell['current.color.fill.measure'], cell['color.fill.measure'], 'transparent');
          if (result.bad) target_fill_color_measure = this.resolveColor(cell['color.fill.measure.bad'], target_fill_color_measure);

          // value
            if (result.isbool) {
                if (row.box == null) {
                    let chBox = $(document.createElement('input'));
                    chBox.attr('type', 'checkbox');
                    chBox.attr('readOnly', true);
                    row.box = chBox;
                }
                row.box.attr('checked', result.value == true);
                row.box.attr('disabled', result.bad);
                cvalue.html(row.box[0].outerHTML);
            } else fractionLength
                ?
                cvalue.html(API.FORMAT.getValue(value).toFixed(Number(fractionLength)))
                :
                cvalue.html(API.FORMAT.getValue(value));
              

          // measure
          if (!row.measure) {
            cmeasure.html(result.src.m);
            row.measure = true;
          }

          // apply colors
          cname.css('color', target_font_color_name || 'transparent');
          cname.css('background-color', target_fill_color_name || 'transparent');

          cvalue.css('color', target_font_color_value || 'transparent');
          cvalue.css('background-color', target_fill_color_value || 'transparent');

          cmeasure.css('color', target_font_color_measure || 'transparent');
          cmeasure.css('background-color', target_fill_color_measure || 'transparent');
        }
      }
      // update cell HTML value for printing !!!
      if (cell.container != null) cell.container.setValue(table.outerHTML);
    }
  }
};

function ButtonScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(ButtonScriptAPI, ShapeAPI);
ButtonScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);
};

function ChartScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(ChartScriptAPI, ShapeAPI);
ChartScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);
  // setup chart
  if (cell.canvas == null) {
    let chartColors = {
      red: 'rgb(255, 99, 132)',
      blue: 'rgb(54, 162, 235)',
      max: 'rgb(255, 0, 255)',
      min: 'rgb(0, 255, 000)',
    };
    let randomData = function (unit, add, min, max) {
      if (min == null) min = -100;
      if (max == null) max = +100;
      if (unit == null) unit = 'second';

      let randomTime = function () {
        switch (unit) {
          case 'millisecond':
            return new Date().addMilliseconds(add || 0);
          case 'second':
            return new Date().addSeconds(add || 0);
          case 'minute':
            return new Date().addMinutes(add || 0);
          case 'hour':
            return new Date().addHours(add || 0);
          case 'day':
            return new Date().addDays(add || 0);
          case 'week':
            return new Date().addWeeks(add || 0);
          case 'month':
            return new Date().addMonths(add || 0);
          case 'year':
            return new Date().addWeeks(add || 0);
          default:
            return new Date().addSeconds(add || 0);
        }
      };

      return {
        x: randomTime(),
        y: Math.random() * (max - min) + min,
      };
    };
    var createMaxAnnotation = function (value) {
      return {
        id: 'y-max',
        type: 'line',
        mode: 'horizontal',
        scaleID: 'y-axis-1',
        value: value,
        borderColor: 'rgba(255, 0, 0, 1)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        label: {
          enabled: true,
          backgroundColor: 'transparent',
          fontColor: '#ff0000',
          content: 'Макс.',
          position: 'left',
          fontSize: 10,
          yAdjust: +8,
          cornerRadius: 3,
        },
      };
    };
    var createMinAnnotation = function (value) {
      return {
        id: 'y-min',
        type: 'line',
        mode: 'horizontal',
        scaleID: 'y-axis-1',
        value: value,
        borderColor: 'rgba(0, 0, 255, 1)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        label: {
          enabled: true,
          backgroundColor: 'transparent',
          fontColor: '#0000ff',
          content: 'Мин.',
          position: 'left',
          fontSize: 10,
          yAdjust: -8,
          cornerRadius: 3,
        },
      };
    };
    let getChartConfig = function () {
      return {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Тренд 1',
              fill: false,
              showLine: true,
              lineTension: 0,
              backgroundColor: chartColors.red,
              borderColor: chartColors.red,
              data: [],
            },
            {
              label: 'Тренд 2',
              fill: false,
              showLine: true,
              lineTension: 0,
              backgroundColor: chartColors.blue,
              borderColor: chartColors.blue,
              data: [],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          //{
          //    duration: 300
          //},
          title: {
            display: true,
            text: 'График',
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 15,
              fontFamily: 'Arial',
              fontSize: 8,
              padding: 5,
              usePointStyle: false,
            },
          },
          scales: {
            xAxes: [
              {
                display: true,
                type: 'time',
                autoSkip: false,
                position: 'bottom',
                distribution: 'linear',
                bounds: 'ticks',
                time: {
                  isoWeekday: true,
                  unit: 'second',
                  //unitStepSize: 10,
                  //stepSize: 1,
                  //precision: 1,
                  //round: true,
                  //minUnit: 'hour',
                  displayFormats: {
                    millisecond: 'ss.SSS',
                    second: 'mm:ss.SSS',
                    minute: 'HH:mm:ss',
                    hour: 'DD.MM HH:mm',
                    day: 'DD.MM',
                    week: 'WW.YYYY',
                    month: 'DD.MM.YYYY',
                    quarter: 'Q YYYY',
                    year: 'YYYY',
                  },
                },
                scaleLabel: {
                  display: true,
                  labelString: 'Время',
                  lineHeight: 1,
                  fontFamily: 'Arial',
                  fontSize: 10,
                  padding: { bootom: 5 },
                },
                //ticks:
                //{
                //    source: "auto",
                //    //maxTicksLimit: 10,
                //    //autoSkip: true,
                //    stepSize: 5,
                //    //precision: 1,

                //    lineHeight: 1,
                //    fontFamily: 'Arial',
                //    fontSize: 10,
                //    padding: 0,
                //    maxRotation: 45,
                //    //callback: function (value, index, values)
                //    //{
                //    //    //return API.FORMAT.getDateTimeString(value);
                //    //    return moment(value).format('HH:mm:ss');
                //    //}
                //}
              },
            ],
            yAxes: [
              {
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: 'Значение',
                  lineHeight: 1,
                  fontFamily: 'Arial',
                  fontSize: 10,
                  padding: { top: 5 },
                },
                ticks: {
                  source: 'data',
                  maxTicksLimit: 10,
                  //stepSize: 1.1,
                  precision: 3,
                  lineHeight: 1,
                  fontFamily: 'Arial',
                  fontSize: 10,
                },
              },
            ],
          },
          layout: {
            padding: 0,
          },
          annotation: {
            drawTime: 'afterDraw',
            annotations: [createMaxAnnotation(90), createMinAnnotation(-90)],
          },
        },
      };
    };

    let geom = this.graph.getCellGeometry(cell);
    // build chart
    var node = document.createElement('canvas');
    node.setAttribute('id', cell.mxObjectId);
    node.setAttribute('class', 'chart');
    node.setAttribute('width', geom.width);
    node.setAttribute('height', geom.height);
    // Document for empty output if not in DOM
    document.body.appendChild(node);
    cell.canvas = node;
    cell.chart = new Chart.Scatter(node.getContext('2d'), getChartConfig());

    (function () {
      if (this.chart != null) {
        // header
        this.chart.options.title.display = false;
        let hdrBinding = this.getBinding('header');
        if (hdrBinding != null) {
          let hdr = JSON.parse(hdrBinding.value);
          if (hdr != null && hdr.text != null) {
            this.chart.options.title.text = hdr.text;
            this.chart.options.title.display = true;
          }
        }
        // legend
        let legendBinding = this.getBinding('legend');
        this.chart.options.legend.display = legendBinding == null || JSON.parse(legendBinding.value) != '0';

        // axisX.label
        this.chart.options.scales.xAxes[0].scaleLabel.display = false;
        let axisXLabelBinding = this.getBinding('axisX.label');
        if (axisXLabelBinding != null) {
          let axisXLabel = JSON.parse(axisXLabelBinding.value);
          if (axisXLabel != null && axisXLabel.text != null) {
            this.chart.options.scales.xAxes[0].scaleLabel.labelString = axisXLabel.text;
            this.chart.options.scales.xAxes[0].scaleLabel.display = true;
          }
        }

        // axisX.measure
        let xUnit = 'second';
        let axisXMeasureBinding = this.getBinding('axisX.measure');
        if (axisXMeasureBinding != null) {
          let axisXMeasure = JSON.parse(axisXMeasureBinding.value);
          switch (axisXMeasure) {
            case 'ms':
              xUnit = 'millisecond';
              break;
            case 's':
              xUnit = 'second';
              break;
            case 'mn':
              xUnit = 'minute';
              break;
            case 'h':
              xUnit = 'hour';
              break;
            case 'd':
              xUnit = 'day';
              break;
            case 'w':
              xUnit = 'week';
              break;
            case 'm':
              xUnit = 'month';
              break;
            case 'y':
              xUnit = 'year';
              break;
            default:
              xUnit = 'second';
              break;
          }
        }
        this.chart.options.scales.xAxes[0].time.unit = xUnit;

        // axisX.step
        let xStep = 1;
        this.chart.options.scales.xAxes[0].time.stepSize = xStep;
        let axisXStepBinding = this.getBinding('axisX.step');
        if (axisXStepBinding != null) {
          let axisXStep = JSON.parse(axisXStepBinding.value);
          xStep = parseNumber(axisXStep) || 1;
          this.chart.options.scales.xAxes[0].time.stepSize = xStep;
        }

        // axisX.scale
        let xScale = 30;
        let axisXScaleBinding = this.getBinding('axisX.scale');
        if (axisXScaleBinding != null) {
          let axisXScale = JSON.parse(axisXScaleBinding.value);
          xScale = parseNumber(axisXScale) || 30;
        }

        // axisY.label
        this.chart.options.scales.yAxes[0].scaleLabel.display = false;
        let axisYLabelBinding = this.getBinding('axisY.label');
        if (axisYLabelBinding != null) {
          let axisYLabel = JSON.parse(axisYLabelBinding.value);
          if (axisYLabel != null && axisYLabel.text != null) {
            this.chart.options.scales.yAxes[0].scaleLabel.labelString = axisYLabel.text;
            this.chart.options.scales.yAxes[0].scaleLabel.display = true;
          }
        }

        // clear axisY annotations
        this.chart.options.annotation.annotations.length = 0;
        this.chart.annotation.elements = {};
        this.chart.annotation.options.annotations.length = 0;

        // axisY.max
        let maxValue = null;
        let axisYMaxBinding = this.getBinding('axisY.max.show');
        if (axisYMaxBinding != null) {
          let axisYMaxShow = JSON.parse(axisYMaxBinding.value);
          if (axisYMaxShow != null && axisYMaxShow != '0') {
            let axisYMaxValueBinding = this.getBinding('axisY.max.value');
            if (axisYMaxValueBinding != null) {
              let axisYMaxValue = JSON.parse(axisYMaxValueBinding.value);
              if (axisYMaxValue != null) maxValue = parseNumber(axisYMaxValue, 0, 3);
            }
            let annotation = createMaxAnnotation(maxValue);
            this.chart.options.annotation.annotations.push(annotation); // show
          }
        }
        // axisY.min
        let minValue = null;
        let axisYMinBinding = this.getBinding('axisY.min.show');
        if (axisYMinBinding != null) {
          let axisYMinShow = JSON.parse(axisYMinBinding.value);
          if (axisYMinShow != null && axisYMinShow != '0') {
            let axisYMinValueBinding = this.getBinding('axisY.min.value');
            if (axisYMinValueBinding != null) {
              let axisYMinValue = JSON.parse(axisYMinValueBinding.value);
              if (axisYMinValue != null) minValue = parseNumber(axisYMinValue, 0, 3);
            }
            let annotation = createMinAnnotation(minValue);
            this.chart.options.annotation.annotations.push(annotation); // show
          }
        }

        // items
        this.chart.data.datasets = [];
        let itemsBinding = this.getBinding('items');
        if (itemsBinding != null) {
          let getType = function (item) {
            switch (item.view) {
              case '4': // bars
                return 'bar';
              default:
                return 'scatter';
            }
          };
          let getShowLine = function (item) {
            switch (item.view) {
              case '1': // points
                return false;
              default:
                return true;
            }
          };

          let items = JSON.parse(itemsBinding.value);
          if (items != null && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
              let item = items[i];
              if (item != null) {
                this.chart.data.datasets.push({
                  id: item.id,
                  label: item.d,
                  fill: false,
                  showLine: getShowLine(item),
                  lineTension: 0,
                  backgroundColor: item.color,
                  borderColor: item.color,
                  type: getType(item),
                  steppedLine: item.view == '3' ? 'before' : false, // stepped line
                  data: [
                    //randomData(xUnit, 0, minValue, maxValue),
                    //randomData(xUnit, 1, minValue, maxValue),
                    //randomData(xUnit, 2, minValue, maxValue),
                    //randomData(xUnit, 3, minValue, maxValue),
                    //randomData(xUnit, 4, minValue, maxValue)
                  ],
                });
              }
            }
          }
        }

        this.chart.update();

        this.chart.validateRange = mxUtils.bind(cell, function () {
          // update x-axis width
          if (xScale > 0 && xStep > 0) {
            let xAxis = this.chart.scales['x-axis-1'];
            let minDate = moment(xAxis.min).toDate();
            let maxDate = moment(xAxis.max).toDate();

            switch (xUnit) {
              case 'millisecond':
                minDate = maxDate.addMilliseconds(-xScale || 0);
                break;
              case 'second':
                minDate = maxDate.addSeconds(-xScale || 0);
                break;
              case 'minute':
                minDate = maxDate.addMinutes(-xScale || 0);
                break;
              case 'hour':
                minDate = maxDate.addHours(-xScale || 0);
                break;
              case 'day':
                minDate = maxDate.addDays(-xScale || 0);
                break;
              case 'week':
                minDate = maxDate.addWeeks(-xScale || 0);
                break;
              case 'month':
                minDate = maxDate.addMonths(-xScale || 0);
                break;
              case 'year':
                minDate = maxDate.addWeeks(-xScale || 0);
                break;
              default:
                break;
            }

            if (minDate != null) this.chart.options.scales.xAxes[0].ticks.min = minDate.getTime(); //moment(minDate);

            this.chart.update();
          }
        });
        this.chart.validateRange();
      }
    }).apply(cell);
  }
};
ChartScriptAPI.prototype.visit = function (cell, map) {
  shapeVisit.apply(this, arguments);
  let itemsBinding = cell.getBinding('items');
  if (itemsBinding != null && !isNullOrEmpty(itemsBinding.value)) {
    let bind = JSON.parse(itemsBinding.value);
    if (bind == null) return;
    if (bind.length) {
      for (let j = 0; j < bind.length; j++) {
        let id = bind[j].id;
        if (GUID.isValid(id)) map.eq.push(bind[j]);
        else map.tag.push(bind[j]);
      }
    }
  }
};
ChartScriptAPI.prototype.items = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let ds = cell.chart.data.datasets.find(function (x) {
    return x.id == value.id;
  });
  if (ds != null) {
    if (ds.data.length > 100) ds.data.shift();

    ds.data.push({
      x: API.FORMAT.getDate(value.ts).getTime(),
      y: value.v,
    });
  }

  cell.chart.validateRange();
};

function RollSwitchScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(RollSwitchScriptAPI, ShapeAPI);
RollSwitchScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.question == null) {
    cell.question = this.graph.insertVertex(cell, null, '?', 0, geo.height / 3, geo.width, geo.height / 3, 'text;align=center;verticalAlign=middle;pointerEvents=0;fontSize=' + (geo.height / 3 / 10) * 7, false);
    cell.question.getTooltip = function () {};
  }
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, '', -0.5, -0.5, geo.width * 2, geo.height * 2, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
  if (cell.roll_damage == null) {
    cell.roll_damage = this.graph.insertVertex(cell, null, '', -1, 0, geo.width * 3, geo.height, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.roll_damage.getTooltip = function () {};
  }
};
RollSwitchScriptAPI.prototype.position = function (cell, binding) {
  let pos = binding != null ? JSON.parse(binding.value) : mxCellRenderer.defaultShapes['rollswitch'].prototype.position == true ? '1' : '0';
  let state = this.graph.view.getState(cell);
  if (state != null && state.shape != null) cell.position = state.shape.position = pos == '1';
};
RollSwitchScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ROLL_IN_SWITCH_ON' : 'ROLL_IN_SWITCH_OFF';

  // hide question
  cell.question.setVisible(false);
  // hide damage
  cell.damage.setVisible(false);
  // hide roll_damage
  cell.roll_damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;
    // check position
    if (cell.position == null) cell.position = mxCellRenderer.defaultShapes['rollswitch'].prototype.position;
    shape.position = cell.position;

    let fontColor = cell.origin.style.fontColor || 'none';
    let fillColor = cell.origin.style.fillColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, fillColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // если задан класс напряжения
    if (!VCLASS.isDefaultValue(cell.vclass)) {
      let vclassColor = VCLASS.getColor(cell.vclass);
      switch (current) {
        case 'ROLL_IN_SWITCH_ON':
          {
            shape.on = true;
            shape.roll = 'IN';
            fillColor = vclassColor;
            borderColor = vclassColor;
          }
          break;
        case 'ROLL_IN_SWITCH_OFF':
          {
            shape.on = false;
            shape.roll = 'IN';
            fillColor = 'none';
            borderColor = vclassColor;
          }
          break;
        case 'ROLL_IN_SWITCH_ERROR':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'IN';
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            borderColor = vclassColor;
            // show question mark
            cell.question.setVisible(true);
            this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, vclassColor, [cell.question]);
            // update cell.question
            //let questionCellState = this.graph.view.getState(cell.question, true);
            //if (questionCellState != null)
            //    questionCellState.setCursor(mxConstants.CURSOR_CONNECT);
          }
          break;
        case 'ROLL_IN_SWITCH_DAMAGE':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'IN';
            // apply colors
            fillColor = 'none';
            borderColor = vclassColor;
            cell.damage.setVisible(true);
          }
          break;
        case 'ROLL_CONTROL_SWITCH_ON':
          {
            shape.on = true;
            shape.roll = 'CONTROL';
            fillColor = vclassColor;
            borderColor = vclassColor;
          }
          break;
        case 'ROLL_CONTROL_SWITCH_OFF':
          {
            shape.on = false;
            shape.roll = 'CONTROL';
            fillColor = 'none';
            borderColor = vclassColor;
          }
          break;
        case 'ROLL_CONTROL_SWITCH_ERROR':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'CONTROL';
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            borderColor = vclassColor;
            // show question mark
            cell.question.setVisible(true);
            this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, vclassColor, [cell.question]);
            // update cell.question
            //let questionCellState = this.graph.view.getState(cell.question, true);
            //if (questionCellState != null)
            //    questionCellState.setCursor(mxConstants.CURSOR_CONNECT);
          }
          break;
        case 'ROLL_CONTROL_SWITCH_DAMAGE':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'CONTROL';
            // apply colors
            fillColor = 'none';
            borderColor = vclassColor;
            cell.damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_ON':
          {
            // hide position if exists
            shape.on = true;
            shape.position = false;
            shape.roll = 'DAMAGE';
            // apply colors
            borderColor = vclassColor;
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_OFF':
          {
            // hide position if exists
            shape.on = false;
            shape.position = false;
            shape.roll = 'DAMAGE';
            // apply colors
            borderColor = vclassColor;
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_ERROR':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'DAMAGE';
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            borderColor = vclassColor;
            // show question mark
            cell.question.setVisible(true);
            this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, vclassColor, [cell.question]);
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_DAMAGE':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'DAMAGE|DAMAGE';
            // apply colors
            fillColor = 'none';
            borderColor = vclassColor;
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'SERVICE':
          // hide position if exists
          shape.position = false;
          fillColor = 'none';
          borderColor = VCLASS.SERVICE;
          break;
        default:
          {
            // hide position if exists
            shape.position = false;
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            borderColor = vclassColor;
            // show question mark
            cell.question.setVisible(true);
            this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, vclassColor, [cell.question]);
            // update cell.question
            //let questionCellState = this.graph.view.getState(cell.question, true);
            //if (questionCellState != null)
            //    questionCellState.setCursor(mxConstants.CURSOR_CONNECT);
          }
          break;
      }
    } else {
      switch (current) {
        case 'ROLL_IN_SWITCH_ON':
          {
            shape.on = true;
            shape.roll = 'IN';
          }
          break;
        case 'ROLL_IN_SWITCH_OFF':
          {
            shape.on = false;
            shape.roll = 'IN';
            fillColor = 'none';
          }
          break;
        case 'ROLL_IN_SWITCH_ERROR':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'IN';
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            // show question mark
            cell.question.setVisible(true);
          }
          break;
        case 'ROLL_IN_SWITCH_DAMAGE':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'IN';
            // apply colors
            fillColor = 'none';
            cell.damage.setVisible(true);
          }
          break;
        case 'ROLL_CONTROL_SWITCH_ON':
          {
            shape.on = true;
            shape.roll = 'CONTROL';
          }
          break;
        case 'ROLL_CONTROL_SWITCH_OFF':
          {
            shape.on = false;
            shape.roll = 'CONTROL';
            fillColor = 'none';
          }
          break;
        case 'ROLL_CONTROL_SWITCH_ERROR':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'CONTROL';
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            // show question mark
            cell.question.setVisible(true);
          }
          break;
        case 'ROLL_CONTROL_SWITCH_DAMAGE':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'CONTROL';
            // apply colors
            fillColor = 'none';
            cell.damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_ON':
          {
            // hide position if exists
            shape.on = true;
            shape.position = false;
            shape.roll = 'DAMAGE';
            // apply colors
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_OFF':
          {
            // hide position if exists
            shape.on = false;
            shape.position = false;
            shape.roll = 'DAMAGE';
            // apply colors
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_ERROR':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'DAMAGE';
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            // show question mark
            cell.question.setVisible(true);
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'ROLL_DAMAGE_SWITCH_DAMAGE':
          {
            // hide position if exists
            shape.position = false;
            shape.roll = 'DAMAGE|DAMAGE';
            // apply colors
            fillColor = 'none';
            cell.roll_damage.setVisible(true);
          }
          break;
        case 'SERVICE':
          // hide position if exists
          shape.position = false;
          fillColor = 'none';
          borderColor = VCLASS.SERVICE;
          break;
        default:
          {
            // hide position if exists
            shape.position = false;
            // apply colors
            fillColor = VCLASS.UNRELIABLE_INFO;
            // show question mark
            cell.question.setVisible(true);
          }
          break;
      }
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, fillColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function RollDisconnectorScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(RollDisconnectorScriptAPI, ShapeAPI);
RollDisconnectorScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, '', -1, 0, geo.width * 3, geo.height, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
};
RollDisconnectorScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ROLL_IN' : 'ROLL_CONTROL';

  // hide damage
  cell.damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;

    let fontColor = cell.origin.style.fontColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    let targetColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : borderColor;
    switch (current) {
      case 'ROLL_IN':
        {
          shape.roll = 'IN';
          borderColor = targetColor;
        }
        break;
      case 'ROLL_CONTROL':
        {
          shape.roll = 'CONTROL';
          borderColor = targetColor;
        }
        break;
      case 'ROLL_DAMAGE':
        {
          shape.roll = 'DAMAGE';
          borderColor = targetColor;
          cell.damage.setVisible(true);
        }
        break;
      case 'SERVICE':
        {
          borderColor = VCLASS.SERVICE;
        }
        break;
      default:
        {
          borderColor = targetColor;
        }
        break;
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function DisconnectorScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(DisconnectorScriptAPI, ShapeAPI);
DisconnectorScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.question == null) {
    cell.question = this.graph.insertVertex(cell, null, '?', 0 + geo.width / 5, geo.height / 8, geo.width - geo.width / 2.5, geo.height - geo.height / 4, 'text;align=center;verticalAlign=middle;pointerEvents=0;fontSize=' + (geo.height / 10) * 7 + ';fillColor=' + VCLASS.UNRELIABLE_INFO, false);
    cell.question.getTooltip = function () {};
  }
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, null, -0.5, -0.5, geo.width * 2, geo.height * 2, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
};
DisconnectorScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ON' : 'OFF';

  // hide question
  cell.question.setVisible(false);
  // hide damage
  cell.damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;

    let fontColor = cell.origin.style.fontColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    let targetColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : borderColor;
    switch (current) {
      case 'ON':
        {
          shape._state = 'ON';
          borderColor = targetColor;
        }
        break;
      case 'OFF':
        {
          shape._state = 'OFF';
          borderColor = targetColor;
        }
        break;
      case 'MIDDLE':
        {
          shape._state = 'MIDDLE';
          borderColor = targetColor;
        }
        break;
      case 'DAMAGE':
        {
          shape._state = 'DAMAGE';
          borderColor = targetColor;
          cell.damage.setVisible(true);
        }
        break;
      case 'SERVICE':
        {
          shape._state = 'OFF';
          borderColor = VCLASS.SERVICE;
        }
        break;
      case 'ERROR':
      default:
        {
          shape._state = 'ERROR';
          borderColor = targetColor;
          // show question mark
          cell.question.setVisible(true);
          this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, targetColor, [cell.question]);
        }
        break;
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function SeparatorScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(SeparatorScriptAPI, ShapeAPI);
SeparatorScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.question == null) {
    cell.question = this.graph.insertVertex(cell, null, '?', 0 + geo.width / 5, geo.height / 8, geo.width - geo.width / 2.5, geo.height - geo.height / 4, 'text;align=center;verticalAlign=middle;pointerEvents=0;fontSize=' + (geo.height / 10) * 7 + ';fillColor=' + VCLASS.UNRELIABLE_INFO, false);
    cell.question.getTooltip = function () {};
  }
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, null, -0.5, -0.5, geo.width * 2, geo.height * 2, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
};
SeparatorScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ON' : 'OFF';

  // hide question
  cell.question.setVisible(false);
  // hide damage
  cell.damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;

    let fontColor = cell.origin.style.fontColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    let targetColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : borderColor;
    switch (current) {
      case 'ON':
        {
          shape._state = 'ON';
          borderColor = targetColor;
        }
        break;
      case 'OFF':
        {
          shape._state = 'OFF';
          borderColor = targetColor;
        }
        break;
      case 'MIDDLE':
        {
          shape._state = 'MIDDLE';
          borderColor = targetColor;
        }
        break;
      case 'DAMAGE':
        {
          shape._state = 'DAMAGE';
          borderColor = targetColor;
          cell.damage.setVisible(true);
        }
        break;
      case 'SERVICE':
        {
          shape._state = 'OFF';
          borderColor = VCLASS.SERVICE;
        }
        break;
      case 'ERROR':
      default:
        {
          shape._state = 'ERROR';
          borderColor = targetColor;
          // show question mark
          cell.question.setVisible(true);
          this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, targetColor, [cell.question]);
        }
        break;
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function GroundScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(GroundScriptAPI, ShapeAPI);
GroundScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.question == null) {
    cell.question = this.graph.insertVertex(cell, null, '?', 0, geo.height / 10, geo.width, geo.height - geo.height / 5, 'text;align=center;verticalAlign=middle;pointerEvents=0;fontSize=' + (geo.height / 10) * 7 + ';fillColor=' + VCLASS.UNRELIABLE_INFO, false);
    cell.question.getTooltip = function () {};
  }
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, null, -0.5, -0.5, geo.width * 2, geo.height * 2, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
};
GroundScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ON' : 'OFF';

  // hide question
  cell.question.setVisible(false);
  // hide damage
  cell.damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;

    let fontColor = cell.origin.style.fontColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    let targetColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : borderColor;
    switch (current) {
      case 'ON':
        {
          shape._state = 'ON';
          borderColor = targetColor;
        }
        break;
      case 'OFF':
        {
          shape._state = 'OFF';
          borderColor = targetColor;
        }
        break;
      case 'MIDDLE':
        {
          shape._state = 'MIDDLE';
          borderColor = targetColor;
        }
        break;
      case 'DAMAGE':
        {
          shape._state = 'DAMAGE';
          borderColor = targetColor;
          cell.damage.setVisible(true);
        }
        break;
      case 'SERVICE':
        {
          shape._state = 'OFF';
          borderColor = VCLASS.SERVICE;
        }
        break;
      case 'ERROR':
      default:
        {
          shape._state = 'ERROR';
          borderColor = targetColor;
          // show question mark
          cell.question.setVisible(true);
          this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, targetColor, [cell.question]);
        }
        break;
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function RollElementScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(RollElementScriptAPI, ShapeAPI);
RollElementScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, '', -0.5, -0.5, geo.width * 2, geo.height * 2, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
};
RollElementScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ROLL_IN' : 'ROLL_CONTROL';

  // hide damage
  cell.damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;

    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    let targetColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : borderColor;
    switch (current) {
      case 'ROLL_IN':
        {
          shape._state = 'IN';
          borderColor = targetColor;
        }
        break;
      case 'ROLL_CONTROL':
        {
          shape._state = 'CONTROL';
          borderColor = targetColor;
        }
        break;
      case 'ROLL_DAMAGE':
        {
          shape._state = 'DAMAGE';
          borderColor = targetColor;
          cell.damage.setVisible(true);
        }
        break;
      case 'SERVICE':
        {
          shape._state = 'SERVICE';
          borderColor = VCLASS.SERVICE;
        }
        break;
      default:
        {
          shape._state = 'UNKNOWN';
          borderColor = VCLASS.UNRELIABLE_INFO;
        }
        break;
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function ActuatorScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(ActuatorScriptAPI, ShapeAPI);
ActuatorScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  if (cell.question == null) {
    cell.question = this.graph.insertVertex(cell, null, '?', 0, 0.5, geo.width, geo.height, 'text;pointerEvents=0;fontSize=' + (geo.height / 10) * 8, true);
    cell.question.getTooltip = function () {};
  }
};
ActuatorScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'OPEN' : 'CLOSE';

  // hide question
  cell.question.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;

    let fontColor = cell.origin.style.fontColor || 'none';
    let fillColor = cell.origin.style.fillColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, fillColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    shape.fill_1 = null;
    shape.fill_2 = null;

    let targetColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : fillColor;
    switch (current) {
      case 'OPEN':
        {
          shape._state = 'OPEN';
          fillColor = targetColor;
        }
        break;
      case 'CLOSE':
        {
          shape._state = 'CLOSE';
          fillColor = 'none';
          borderColor = targetColor;
        }
        break;
      case 'MIDDLE':
        {
          shape._state = 'MIDDLE';
          fillColor = 'none';
          shape.fill_1 = targetColor;
        }
        break;
      case 'SERVICE':
        {
          shape._state = 'SERVICE';
          fillColor = 'none';
          borderColor = VCLASS.SERVICE;
        }
        break;
      case 'ERROR':
      default:
        {
          shape._state = 'ERROR';
          fillColor = '#FFFFFF';
          cell.question.setVisible(true);
          this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, targetColor, [cell.question]);
        }
        break;
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, fillColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function SimpleSwitchScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(SimpleSwitchScriptAPI, ShapeAPI);
SimpleSwitchScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  let geo = this.graph.getCellGeometry(cell);
  //let angle = mxUtils.getValue(this.graph.view.getState(cell).style, mxConstants.STYLE_ROTATION, 0);
  if (cell.question == null) {
    cell.question = this.graph.insertVertex(cell, null, '?', 0, geo.height / 20, geo.width, geo.height - geo.height / 10, 'text;align=center;verticalAlign=middle;pointerEvents=0;fontSize=' + (geo.height / 10) * 7 + ';fillColor=' + VCLASS.UNRELIABLE_INFO, false);
    cell.question.getTooltip = function () {};
  }
  if (cell.damage == null) {
    cell.damage = this.graph.insertVertex(cell, null, null, -0.5, -0.5, geo.width * 2, geo.height * 2, 'line;strokeColor=#FF0000;strokeWidth=2;fillColor=none;pointerEvents=0;rotation=-45;', true);
    cell.damage.getTooltip = function () {};
  }
};
SimpleSwitchScriptAPI.prototype.state = function (cell, binding, value) {
  if (cell == null || value == null) return;

  let result = this.processValue(cell, value);

  let current = result.bad ? 'UNKNOWN' : result.value;
  if (result.state == null && current != 'UNKNOWN') current = result.value != null && result.value ? 'ON' : 'OFF';

  // hide question
  cell.question.setVisible(false);
  // hide damage
  cell.damage.setVisible(false);

  var cellState = this.graph.view.getState(cell);
  if (cellState != null && cellState.shape != null) {
    let shape = cellState.shape;

    let fontColor = cell.origin.style.fontColor || 'none';
    let borderColor = cell.origin.style.strokeColor || 'none';

    // reset colors
    this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, fontColor, [cell.question]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, borderColor, [cell]);

    let targetColor = !VCLASS.isDefaultValue(cell.vclass) ? VCLASS.getColor(cell.vclass) : borderColor;
    switch (current) {
      case 'ON':
        {
          shape._state = 'ON';
        }
        break;
      case 'OFF':
        {
          shape._state = 'OFF';
        }
        break;
      case 'DAMAGE':
        {
          shape._state = 'DAMAGE';
          cell.damage.setVisible(true);
        }
        break;
      case 'SERVICE':
        {
          shape._state = 'OFF';
          targetColor = VCLASS.SERVICE;
        }
        break;
      case 'ERROR':
      default:
        {
          shape._state = 'ERROR';
          // show question mark
          cell.question.setVisible(true);
          this.graph.setCellStyles(mxConstants.STYLE_FONTCOLOR, targetColor, [cell.question]);
        }
        break;
    }

    // apply colors
    this.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, targetColor, [cell]);
    this.graph.setCellStyles(mxConstants.STYLE_STROKECOLOR, targetColor, [cell]);

    // update cell
    this.graph.cellRenderer.redrawShape(cellState, true);
  }
};

function BMRZScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(BMRZScriptAPI, ShapeAPI);
BMRZScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);
  // fake action
  cell.action = function () {};
  cell.getTooltip = function () {
    return 'Подключиться';
  };
};
BMRZScriptAPI.prototype.buildConfig = function (cell) {
  let config = { type: 'usb' };
  let type = cell.getBinding('connection.type');
  if (type != null && type.value != null) config.type = JSON.parse(type.value);

  switch (config.type) {
    case 'usb':
      break;
    case 'com':
      {
        config.com = {};
        // port
        config.com.port = 'COM1';
        let port = cell.getBinding('com.port');
        if (port != null && port.value != null) config.com.port = JSON.parse(port.value).trim();
        // address
        config.com.address = '55';
        let address = cell.getBinding('com.address');
        if (address != null && address.value != null) config.com.address = JSON.parse(address.value).trim();
        // speed
        config.com.speed = '19200';
        let speed = cell.getBinding('com.speed');
        if (speed != null && speed.value != null) config.com.speed = JSON.parse(speed.value).trim();
        // parity
        config.com.parity = '0';
        let parity = cell.getBinding('com.parity');
        if (parity != null && parity.value != null) config.com.parity = JSON.parse(parity.value).trim();
        // stop_bits
        config.com.stop_bits = '1';
        let stop_bits = cell.getBinding('com.stop_bits');
        if (stop_bits != null && stop_bits.value != null) config.com.stop_bits = JSON.parse(stop_bits.value).trim();
        // period
        config.com.period = '0';
        let period = cell.getBinding('com.period');
        if (period != null && period.value != null) config.com.period = JSON.parse(period.value).trim();
        // echo
        config.com.echo = false;
        let echo = cell.getBinding('com.echo');
        if (echo != null && echo.value != null) config.com.echo = JSON.parse(echo.value) == '1';
      }
      break;
    case 'eth':
      {
        config.eth = {};
        // ip
        config.eth.ip = '1.1.1.1';
        let ip = cell.getBinding('eth.ip');
        if (ip != null && ip.value != null) config.eth.ip = JSON.parse(ip.value).trim();
        // port
        config.eth.port = '503';
        let port = cell.getBinding('eth.port');
        if (port != null && port.value != null) config.eth.port = JSON.parse(port.value).trim();
      }
      break;
    default:
      return;
  }

  // pmk
  config.pmk = '';
  let pmk = cell.getBinding('path.pmk');
  if (pmk != null && pmk.value != null) config.pmk = JSON.parse(pmk.value).text.trim();
  // bfpo
  config.bfpo = '';
  let bfpo = cell.getBinding('path.bfpo');
  if (bfpo != null && bfpo.value != null) config.bfpo = JSON.parse(bfpo.value).text.trim();

  // connect
  config.connect = false;
  let connect = cell.getBinding('options.connect');
  if (connect != null && connect.value != null) config.connect = JSON.parse(connect.value) == '1';
  // read_pmk
  config.readpmk = false;
  let read_pmk = cell.getBinding('options.read_pmk');
  if (read_pmk != null && read_pmk.value != null) config.readpmk = JSON.parse(read_pmk.value) == '1';

  return config;
};
BMRZScriptAPI.prototype.execAction = function (cell) {
  if (cell == null) return;

  cell.config = cell.config || this.buildConfig(cell);
  if (cell.config == null) {
    console.log('Ошибка параметризации')
    //messageError('Ошибка параметризации');
    return;
  }

  // exec command
  AJAX.post(
    '/linkmt/cfgmt/exec',
    null,
    cell.config,
    function (xhr, resp) {
      console.log('common.messages.command_sent_to_server')
      //messageDebug(translate('common.messages.command_sent_to_server'));
    },
    function (xhr, err) {
      console.log('common.errors.command_execution')
      //messageError(translate('common.errors.command_execution'));
    }
  );
};

function PosterScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(PosterScriptAPI, ShapeAPI);
PosterScriptAPI.prototype.setup = function (cell) {
  console.log(cell)
  shapeSetup.apply(this, arguments);

  var bindingsHandler = new BindingsHandler(this.ui);
  // init bindings
  if (typeof BindingsHandler == 'function') {
    bindingsHandler.graph.view.validatePosterState(cell);
  }
  //unstick cells
  mxGraph.prototype.isValidDropTarget = function (target, cells, evt) {
    return target._type == 'phase' && cells.every((c) => c._type != 'phase');
  };

  cell.getTooltip = function () {
    return this._model ? `[${API.FORMAT.getDateString(this._model.ts)}]: ${this._model.modifiedBy}.\n${this._model.data.title}` : null;
  };
};
PosterScriptAPI.prototype.state = function (cell, binding, value) {
  cell._model = value;
  this.graph.cellRenderer.redrawShape(this.graph.view.getState(cell), true);
};

function DispatcherMarkScriptAPI(editorUI) {
  ShapeAPI.call(this, editorUI);
}
mxUtils.extend(DispatcherMarkScriptAPI, ShapeAPI);
DispatcherMarkScriptAPI.prototype.setup = function (cell) {
  shapeSetup.apply(this, arguments);

  cell.getTooltip = function () {
    return this._model ? `[${API.FORMAT.getDateString(this._model.ts)}]: ${this._model.modifiedBy}.\n${this._model.data.title}` : null;
  };
};
DispatcherMarkScriptAPI.prototype.state = function (cell, binding, value) {
  cell._model = value;
  this.graph.cellRenderer.redrawShape(this.graph.view.getState(cell), true);
};
