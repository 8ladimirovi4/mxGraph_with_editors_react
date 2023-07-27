import $ from "jquery";
import * as mxgraph from 'mxgraph';
import { Base64 } from 'js-base64';
import { API } from './scada'
import { VCLASS } from './Init'
import 
{ 
  HELP, 
  GUID, 
  isDefined, 
  AJAX, 
  isNullOrEmpty, 
  getExtension, 
  parseNumber 
} from './client'
import Chart from "chart.js"
import * as webix from 'webix/webix.js';
import 'webix/webix.css';
import moment from 'moment';
const {
  $$
  } = webix

let { 
    mxGraphModel, 
    mxGraphView, 
    mxUtils, 
    mxResources, 
    mxConstants,
    mxEvent,
    mxCell,
    mxGeometry,
    mxCodecRegistry,

} = mxgraph();

export default function BindingsHandler (editorUi) {
  webix.protoUI(
    {
      name: 'link',
      $init: function (config) {
        this.config = config;
        this.config.icon = 'wxi-trash';
        this.config.readonly = true;
        this.config.attributes = { drop_target: true };

        this.config.bind = mxUtils.bind(this, function (data) {
          if (data == null) return;

          let form = this.getFormView();
          if (form == null) return;

          let context = form.context;
          if (context == null) return;

          let item = GUID.isValid(data.id)
            ? context.eqTree.getItem(data.id)
            : context.paramsList.find(function (item) {
                return item.n == data.id;
              }, true);
          if (item != null) {
            item = mxUtils.clone(item);
            form.blockEvent();
            this.config.setValue(item);
            form.unblockEvent();
          }
        });
        this.config.setValue = mxUtils.bind(this, function (item) {
          if (item == null) {
            this.value = null;
            this.setValue('');
            return;
          }
          // tag
          if (item.mid) {
            this.value = { id: item.n };
            this.setValue(item.n);
            return;
          }
          // eq
          if (item.$count == 0 || item.eq) {
            let context = this.getFormView().context;
            if (context != null) {
              this.value = { id: item.id };
              let parent = context.eqTree.findParentEquipment(item.id);
              if (parent != null) this.value.parent = parent.id;

              let path = context.eqTree.buildPath(item.id);
              this.setValue(path);
            }
            return;
          }
        });
        this.config.getValue = mxUtils.bind(this, function () {
          return this.value;
        });
        this.config.on = {
          onFocus: function (current, prev) {
            let dnd = webix.DragControl.getContext();
            if (dnd != null) return;

            var form = current.getFormView();
            if (form == null) return;

            var context = form.context;
            context.currentView = this;

            var value = current.config.getValue();
            if (value == null) return;
            context.showItem(value.id);
          },
          onSearchIconClick: function (e) {
            this.config.setValue(null);
          },
        };
      },
      $cssName: 'search',
      $renderIcon: function (config) {
        $(this.$view).attr('drop_target', true);
        return '<span style="height:26px;padding-top:6px;" class="webix_input_icon ' + config.icon + '" title="Очистить привязку"></span>';
      },
    },
    webix.ui.search
  );
  webix.protoUI(
    {
      name: 'param',
      $init: function (config) {
        this.config = config;
        this.config.icon = 'wxi-trash';
        this.config.readonly = false;

        this.config.bind = mxUtils.bind(this, function (data) {
          if (data == null) return;

          let form = this.getFormView();
          if (form == null) return;

          let context = form.context;
          if (context == null) return;

          let item = data;
          if (isDefined(data.id)) {
            item = GUID.isValid(data.id)
              ? context.eqTree.getItem(data.id)
              : context.paramsList.find(function (item) {
                  return item.n == data.id;
                }, true);
          }

          if (item != null) {
            item = mxUtils.clone(item);
            this.config.setValue(item);
          }
        });
        this.config.setValue = mxUtils.bind(this, function (item) {
          try {
            this.changing = true;
            if (item == null) {
              this.value = null;
              // set display value
              this.setValue('');
              return;
            }
            // tag
            if (item.mid) {
              this.value = { id: item.n };
              // set display value
              this.setValue(item.n);
              return;
            }
            // eq
            if (item.$count == 0 || item.eq) {
              let context = this.getFormView().context;
              if (context != null) {
                this.value = { id: item.id };
                let parent = context.eqTree.findParentEquipment(item.id);
                if (parent != null) this.value.parent = parent.id;

                let path = context.eqTree.buildPath(item.id);
                // set display value
                this.setValue(path);
              }
              return;
            }
            // text
            if (isDefined(item.text)) {
              // set custom value
              this.value = item;
              // set display value
              this.setValue(item.text);
            }
          } finally {
            this.changing = false;
          }
        });
        this.config.getValue = mxUtils.bind(this, function () {
          return this.value;
        });
        this.config.on = $.extend(this.config.on || {}, {
          onFocus: function (current, prev) {
            let dnd = webix.DragControl.getContext();
            if (dnd != null) return;

            var form = current.getFormView();
            if (form == null) return;

            var context = form.context;
            context.currentView = this;

            var value = current.config.getValue();
            if (value == null) return;
            context.showItem(value.id);
          },
          onChange: function (newv, oldv) {
            if (!this.changing) this.config.setValue({ text: newv });
          },
          onSearchIconClick: function (e) {
            this.config.setValue(null);
          },
        });
      },
      $cssName: 'search',
      $renderIcon: function (config) {
        return '<span style="height:26px;padding-top:6px;" class="webix_input_icon ' + config.icon + '" title="Очистить"></span>';
      },
    },
    webix.ui.search
  );
  webix.protoUI(
    {
      name: 'path',
      $init: function (config) {
        this.config = config;
        this.config.icon = 'wxi-folder-open';
        this.config.readonly = false;

        this.config.bind = mxUtils.bind(this, function (data) {
          if (data == null) return;

          let form = this.getFormView();
          if (form == null) return;

          let context = form.context;
          if (context == null) return;

          let item = data;
          if (item != null) {
            item = mxUtils.clone(item);
            this.config.setValue(item);
          }
        });
        this.config.setValue = mxUtils.bind(this, function (item) {
          try {
            this.changing = true;
            if (item == null) {
              this.value = null;
              // set display value
              this.setValue('');
              return;
            }
            // text
            if (isDefined(item.text)) {
              // set custom value
              this.value = item;
              // set display value
              this.setValue(item.text);
            }
          } finally {
            this.changing = false;
          }
        });
        this.config.getValue = mxUtils.bind(this, function () {
          return this.value;
        });
        this.config.on = $.extend(this.config.on || {}, {
          onChange: function (newv, oldv) {
            if (!this.changing) this.config.setValue({ text: newv });
          },
          onSearchIconClick: function (e) {
            let context = this;
            let queryID = GUID.newID();

            // save current timeout
            let savedTimeout = AJAX.getTimeout();
            // temporary reset timeout
            AJAX.setTimeout(0);
            AJAX.post(
              '/linkmt/file/select/' + this.config.ext,
              null,
              queryID,
              function (xhr, resp) {
                if (!isNullOrEmpty(resp)) context.config.setValue({ text: resp });
              },
              function (xhr, err) {
                console.log('Ошибка выбора файла.')
                // messageError('Ошибка выбора файла.');
              },
              function (xhr) {
                // restore current timeout
                AJAX.setTimeout(savedTimeout);
              }
            );
          },
        });
      },
      $cssName: 'search',
      $renderIcon: function (config) {
        return '<span style="height:26px;padding-top:6px;padding-right:3px;" class="webix_input_icon ' + config.icon + '" title="Выбрать"></span>';
      },
    },
    webix.ui.search
  );
  webix.protoUI(
    {
      name: 'editlist',
    },
    webix.EditAbility,
    webix.ui.list
  );

  this.ui = editorUi;
  this.editor = this.ui.editor;
  this.graph = this.editor.graph;
  (function () {
      function Bindings (window, container) {
      this.window = window;
      this.container = container;
      this.titleBase = mxResources.get('bindings');

      webix.require(
        ['/js/common/params_tree.js'],
        mxUtils.bind(this, function () {
          this.init();
        })
      );
    };

    Bindings.prototype.ui = editorUi;
    Bindings.prototype.editor = editorUi.editor;
    Bindings.prototype.graph = editorUi.editor.graph;

    Bindings.prototype.init = function () {
      //---fix---//
      // var paramsView = paramstree.buildList({
      //   css: 'params_tree_acc',
      //   callback: mxUtils.bind(this, function (items) {
      //     if (!items || items.length != 1) return;

      //     if (this.currentView != null) {
      //       let itemToSet = items[0];
      //       let setValueAction = this.currentView.config.setValue || this.currentView.setValue;
      //       if (setValueAction) setValueAction.call(this.currentView, itemToSet);
      //     }
      //   }),
      // });
  //---fix---//
      let properties = {
        view: 'form',
        id: 'properties',
        borderless: false,
        margin: 0,
        padding: 8,
        scroll: false,
        width: 400,
        drag: 'target',
        complexData: false, // !!!! REQUIRED !!!
        elements: [],
        elementsConfig: {
          checkValue: '1',
          uncheckValue: '0',
        },
        on: {
          onChange: function (val, prev) {
            var ui = this.context.ui;
            var graph = this.context.graph;

            if (graph && graph.isEnabled()) {
              if (!this.context.validate()) return;

              try {
                graph.model.beginUpdate();

                var bindings = [];
                var getValue = function (el) {
                  if (el == null) return null;
                  let getValueAction = el.config.getValue || el.getValue;
                  if (getValueAction == null) return null;
                  return getValueAction.call(el);
                };

                this.getValues(function (el) {
                  var value = getValue(el);

                  // check linked value
                  if (!isNullOrEmpty(el.config.link)) {
                    let linkedElement = this.elements[el.config.link];
                    if (linkedElement == null) return;
                    let res = getValue(linkedElement);
                    if (isNullOrEmpty(res)) return;
                  }

                  // check defaults
                  if (value == el.config.default) return;

                  var item = { name: el.config.name, value: JSON.stringify(value) };
                  bindings.push(item);
                });

                // update cell bindings
                graph.model.setBindings(this.targetCell, bindings);

                // rebuild view
                if (this.targetCell.onBindingsUpdated) this.targetCell.onBindingsUpdated();
              } catch (e) {
                ui.handleError(e);
              } finally {
                graph.model.endUpdate();
              }
            }
          },
        },
      };
      let resizer = {
        view: 'resizer',
        hidden: true,
      };
      let params = {
        id: 'params',
        gravity: 1,
        hidden: true,
        rows: [
          {
            view: 'tabbar',
            id: 'paramsTab',
            multiview: true,
            bottomOffset: 1,
            height: 30,
            options: [
              { id: 'eqTree', value: 'Оборудование' },
              { id: 'params_tree_list', value: 'Параметры' },
            ],
          },
          {
            cells: [
              {
                view: 'tree',
                id: 'eqTree',
                select: true,
                drag: 'source',
                scroll: 'auto',
                navigation: true,
                template: function (obj, common) {
                  let tmpl = common.icon(obj, common) + common.folder(obj, common);
                  return tmpl + '<span>' + (obj.eq ? '<b>' + obj.desc + '</b>' : obj.desc) + '</span>';
                },
                type: {
                  folder: function (obj) {
                    if (obj.eq) return "<span class='webix_icon fas fa-cog'></span>";
                    if (obj.jrn) return "<span class='webix_icon fas fa-list'></span>";
                    if (obj.osc) return "<span class='webix_icon fas fa-image'></span>";
                    if (obj.states) return "<span class='webix_icon fas fa-eye'></span>";
                    if (obj.commands) return "<span class='webix_icon fas fa-bolt'></span>";
                    if (obj.pages) return "<span class='webix_icon fas fa-tags'></span>";
                    if (obj.page) return "<span class='webix_icon fas fa-columns'></span>";
                    if (obj.oper) return "<span class='webix_icon fas fa-dot-circle'></span>";
                    return "<span class='webix_icon wxi-angle-double-right'></span>";
                  },
                },
                scheme: {
                  $init: function (obj) {
                    if (isNullOrEmpty(obj.desc)) obj.desc = obj.name;

                    if (obj.type != null) {
                      obj.eq = true;
                      obj.desc = obj.name;
                    }

                    // pages
                    if (obj.pages && obj.pages.length > 0) {
                      if (!obj.data) obj.data = [];
                      var pagesRoot = { desc: 'Страницы параметров', pages: true, data: [] };

                      for (let i = 0; i < obj.pages.length; i++) {
                        var page = obj.pages[i];
                        if (page && page.params && page.params.length > 0) pagesRoot.data.push({ desc: page.hdr, path: true, page: true, data: page.params });
                      }

                      if (pagesRoot.data.length > 0) obj.data.unshift(pagesRoot);
                    }
                    // oper info
                    if (obj.oper && obj.oper.length > 0) {
                      if (!obj.data) obj.data = [];
                      obj.data.unshift({ desc: 'Оперативная информация', path: true, oper: true, data: obj.oper });
                    }
                    // commands
                    if (obj.commands && obj.commands.length > 0) {
                      if (!obj.data) obj.data = [];

                      for (let i = 0; i < obj.commands.length; i++) obj.commands[i].cmd = true;

                      obj.data.unshift({ desc: 'Команды', path: true, commands: true, data: obj.commands });
                    }
                    // states
                    if (obj.states && obj.states.length > 0) {
                      if (!obj.data) obj.data = [];

                      for (let i = 0; i < obj.states.length; i++) obj.states[i].state = true;

                      obj.data.unshift({ desc: 'Состояния', path: true, states: true, data: obj.states });
                    }
                    // maintenance
                    if (obj.maintenance?.parameters && obj.maintenance.parameters.length > 0) {
                      if (!obj.data) obj.data = [];

                      obj.maintenance.parameters.forEach((p) => (p.state = true));

                      obj.data.unshift({ desc: 'Признаки обслуживания', path: true, states: true, data: obj.maintenance.parameters });
                    }
                  },
                },
                data: [],
              },
              //---fix---//
              // paramsView,
               //---fix---//
            ],
          },
        ],
      };

      let elements = [
        {
          view: 'scrollview',
          gravity: 1,
          scroll: 'y',
          body: properties,
        },
        // resizer, // resizer works bad
        params,
      ];
      // @if !LINKMT
      resizer.hidden = false;
      params.hidden = false;
      // @endif
      this.layout = webix.ui({
        type: 'form',
        container: this.container,
        cols: elements,
      });

      // @if LINKMT
      // strange bug with modality fix
      this.layout.getNode().style['z-index'] = 10000;
      // @endif

      this.adjust = mxUtils.bind(this, function () {
        this.layout.adjust();
      });
      this.update = mxUtils.bind(this, function (sender, evt) {
        this.refresh();
      });

      this.graph.getModel().addListener(mxEvent.CHANGE, this.update);
      this.graph.getSelectionModel().addListener(mxEvent.CHANGE, this.update);

      this.showItem = mxUtils.bind(this, function (id) {
        if (isNullOrEmpty(id)) return;

        var isGuid = GUID.isValid(id);
        if (isGuid) {
          this.paramsTab.setValue('eqTree');
          if (this.eqTree.exists(id)) {
            this.eqTree.select(id);
            let parent = this.eqTree.getParentId(id);
            if (parent != null) this.eqTree.open(parent, true);
            this.eqTree.showItem(id);
          } else this.eqTree.unselectAll();
        } else {
          this.paramsTab.setValue('params_tree_list');
          var targetItem = this.paramsList.find(function (item) {
            return item.n == id;
          }, true);
          if (targetItem != null) {
            this.paramsList.select(targetItem.id);
            this.paramsList.showItem(targetItem.id);
          } else this.paramsList.unselectAll();
        }
      });

      this.properties = $$('properties');
      if (this.properties) this.properties.context = this;

      this.paramsList = $$('params_tree_list');
      if (this.paramsList) this.paramsList.context = this;

      this.paramsTab = $$('paramsTab');
      if (this.paramsTab) this.paramsTab.context = this;

      this.eqTree = $$('eqTree');
      if (this.eqTree) {
        this.eqTree.context = this;
        this.eqTree.findParentEquipment = mxUtils.bind(this.eqTree, function (id) {
          let self = this.getItem(id);
          if (self == null) return null;
          if (self.eq) return self;
          let parentID = this.getParentId(id);
          if (!isDefined(parentID)) return null;
          let parent = this.getItem(parentID);
          if (!parent) return null;
          if (parent.eq) return parent;
          return this.findParentEquipment(parent.id);
        });
        this.eqTree.buildPath = mxUtils.bind(this.eqTree, function (id) {
          let item = this.getItem(id);
          if (item == null) return null;

          var path = [item.desc];
          let parent = this.getItem(this.getParentId(item.id));
          while (parent) {
            if (parent.eq || parent.path) path.push(parent.desc);
            parent = this.getItem(this.getParentId(parent.id));
          }
          return path.reverse().join('\\');
        });
      }

      AJAX.get(
        API.FUNC.schemeEquipments,
        null,
        mxUtils.bind(this, function (xhr, resp) {
          this.equipments = resp;
        }),
        function (xhr, err) {
          console.log('Ошибка загрузки списка оборудования')
         // messageError('Ошибка загрузки списка оборудования');
        },
        mxUtils.bind(this, function (xhr, status) {
          if (!this.eqTree || !this.paramsTab) return;

          if (this.equipments == null) this.paramsTab.hideOption('eqTree');
          else {
            this.eqTree.parse(this.equipments);
            if (this.eqTree.count() == 1) this.eqTree.open(this.eqTree.getFirstId());
          }

          if (this.paramsList) {
            this.paramsList.complete = this.update;
            this.paramsList.callEvent('onViewShow');
          }
        })
      );

      webix.attachEvent(
        'onFocusChange',
        mxUtils.bind(this, function (current, prev) {
          if (current && current.getFormView) {
            let element = current.$view;
            if (element && $(element).attr('drop_target')) this.currentView = current;
          }
        })
      );

      this.dropLogic = {
        $drop: mxUtils.bind(this, function (source, target, e) {
          if (source !== target) {
            var context = webix.DragControl.getContext();
            for (let i = 0; i < context.source.length; i++) {
              let item = context.from.getItem(context.source[i]);
              if (item) {
                // only single tag or equipment item is accepted
                if (item.$count === 0 || item.eq) {
                  let element = $(target); //$(e.target || e.srcElement);
                  if (element && element.attr('drop_target')) {
                    let focusedView = this.currentView; //webix.UIManager.getFocus();
                    if (focusedView) {
                      let setValueAction = focusedView.config.setValue || focusedView.setValue;
                      if (setValueAction) setValueAction.call(focusedView, item);
                    }
                  }
                }
              }
            }
          }
        }),
        $dragIn: mxUtils.bind(this, function (source, target, e) {
          if (source != target) {
            let element = $(target);
            if (element && element.attr('drop_target')) {
              if (element.select) element.select();
              if (element.focus) element.focus();
              // find webix UI element
              let viewID = $(element).attr('view_id');
              if (!isNullOrEmpty(viewID)) {
                let view = $$(viewID);
                if (view && this.currentView != view) {
                  if (view.focus) view.focus();
                  webix.UIManager.setFocus(view);
                  this.currentView = view;
                }
              }
            }
            return source;
          }
        }),
      };
    };
    Bindings.prototype.validate = function () {
      return this.properties != null ? this.properties.validate() : false;
    };
    Bindings.prototype.refresh = function () {
      if (!this.window.isVisible() || this.properties == null) return;

      var cells = this.graph.getSelectionCells();
      if (cells.length != 1) {
        // reset title & properties
        this.properties.define('elements', []);
        this.properties.reconstruct();
        this.window.setTitle(this.titleBase);
        this.properties.targetCell = null;
        //webix.DragControl.unlink(this.properties);
        return;
      }

      var selectedCell = cells[0];
      if (this.properties.targetCell != selectedCell) {
        //webix.DragControl.unlink(this.properties);

        // reset title & properties
        this.properties.define('elements', []);
        this.properties.reconstruct();
        this.window.setTitle(this.titleBase);

        // update title
        var name = this.graph.getAttributeForCell(selectedCell, 'name', null);
        if (name != null) {
          // @if LINKMT
          let cellValue = selectedCell.getValue();
          if (cellValue != null && mxUtils.isNode(cellValue) && cellValue.nodeName.toLowerCase() == 'bmrz') name = 'IED';
          // @endif
          this.window.setTitle(this.titleBase + ' - ' + name);
        }

        if (this.container.clientHeight > 0) {
          var bindings = this.getForCell(selectedCell);
          if (bindings != null) {
            this.properties.targetCell = selectedCell;

            this.properties.define('elements', bindings);
            this.properties.reconstruct();

            for (let id in this.properties.elements) {
              let el = this.properties.elements[id];
              el.context = this;
              webix.DragControl.addDrop(el.$view, this.dropLogic);
            }

            this.properties.blockEvent();

            // read & apply element config
            if (selectedCell.bindings != null) {
              for (var i = 0; i < selectedCell.bindings.length; i++) {
                var item = selectedCell.bindings[i];
                if (item) {
                  // read & apply all attributes
                  let attrName = item.name;
                  if (!isNullOrEmpty(attrName)) {
                    let attrValue = item.value;
                    if (!isNullOrEmpty(attrValue)) {
                      var prop = this.properties.elements[attrName];
                      if (prop) {
                        let applyAction = prop.config.bind || prop.config.setValue || prop.setValue;
                        if (applyAction != null) {
                          // block events
                          if (prop.blockEvent) prop.blockEvent();
                          // apply value
                          applyAction.call(prop, JSON.parse(attrValue));
                          // restore events
                          if (prop.unblockEvent) prop.unblockEvent();
                        }
                      }
                    }
                  }
                }
              }
            }

            // custom ready event
            for (let id in this.properties.elements) {
              let el = this.properties.elements[id];
              if (el != null && el.callEvent) el.callEvent('onReady', []);
            }

            this.properties.unblockEvent();
          }
        }
      }
    };
    Bindings.prototype.getForCell = function (cell) {
      var bindings = [];

      var style = this.graph.getCellStyle(cell);
      if (style == null || style.shape == null) return bindings;

      var cellValue = cell.getValue();
      if (cellValue == null || !mxUtils.isNode(cellValue)) return bindings;

      //let cellType = style.shape.toLowerCase();
      let cellType = cellValue.nodeName.toLowerCase();
      let cellGeom = this.graph.getCellGeometry(cell);

      var context = this;
      var onHandler = {
        onFocus: function (current_view, prev_view) {
          if (context.currentView != current_view) {
            context.currentView = current_view;
            if (context.currentView.focus) context.currentView.focus();
            webix.UIManager.setFocus(context.currentView);
          }
        },
      };
      var onColorPickerHandler = {
        onFocus: function (current_view, prev_view) {
          if (context.currentView != current_view) {
            context.currentView = current_view;
            if (context.currentView.focus) context.currentView.focus();
            webix.UIManager.setFocus(context.currentView);
          }
        },
        onChange: function (val, prev) {},
      };

      var state = {
        cols: [
          { view: 'label', label: 'Состояние:', width: 110 },
          { view: 'link', name: 'state' },
        ],
      };
      var vclass = {
        cols: [
          { view: 'label', label: 'Класс напр-я:', width: 110 },
          {
            view: 'richselect',
            name: 'vclass',
            default: 'V0',
            value: 'V0',
            on: onHandler,
            options: {
              data: VCLASS.getOptions(),
              body: {
                template: function (obj, common) {
                  let result = '<span>' + obj.value + '</span>';
                  if (obj.id != 'V0') {
                    let color = VCLASS.getColor(obj.id);
                    result += '<span style="float:right;width:100px;text-align:center;color:#ffffff;background:' + color + '">' + color + '<span/>';
                  }
                  return result;
                },
              },
            },
          },
        ],
      };
      var script = {
        cols: [
          { view: 'label', label: 'Скрипт:', width: 110 },
          { view: 'richselect', /*name: "script", */ options: [cellType], value: cellType, on: onHandler, disabled: true },
        ],
      };

      var colors = {
        view: 'accordion',
        multi: true,
        type: 'clean',
        margin: 2,
        rows: [],
      };
      var fillColor = {
        view: 'accordionitem',
        header: 'Цвет заливки:',
        headerHeight: 22,
        headerAltHeight: 22,
        collapsed: true,
        body: {
          rows: [
            {
              cols: [
                { view: 'colorpicker', name: 'color.fill.$1.val', link: 'color.fill.$1', width: 100, editable: true, value: '#FF0000', on: onColorPickerHandler },
                { view: 'link', name: 'color.fill.$1' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.fill.$2.val', link: 'color.fill.$2', width: 100, editable: true, value: '#FFFF00', on: onColorPickerHandler },
                { view: 'link', name: 'color.fill.$2' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.fill.$3.val', link: 'color.fill.$3', width: 100, editable: true, value: '#00FF00', on: onColorPickerHandler },
                { view: 'link', name: 'color.fill.$3' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.fill.$4.val', link: 'color.fill.$4', width: 100, editable: true, value: '#CCCCCC', on: onColorPickerHandler },
                { view: 'link', name: 'color.fill.$4' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.fill.$5.val', link: 'color.fill.$5', width: 100, editable: true, value: '#0000FF', on: onColorPickerHandler },
                { view: 'link', name: 'color.fill.$5' },
              ],
            },
          ],
        },
      };
      var borderColor = {
        view: 'accordionitem',
        header: 'Цвет контура:',
        headerHeight: 22,
        headerAltHeight: 22,
        collapsed: true,
        body: {
          rows: [
            {
              cols: [
                { view: 'colorpicker', name: 'color.brd.$1.val', link: 'color.brd.$1', width: 100, editable: true, value: '#FF0000', on: onColorPickerHandler },
                { view: 'link', name: 'color.brd.$1' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.brd.$2.val', link: 'color.brd.$2', width: 100, editable: true, value: '#FFFF00', on: onColorPickerHandler },
                { view: 'link', name: 'color.brd.$2' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.brd.$3.val', link: 'color.brd.$3', width: 100, editable: true, value: '#00FF00', on: onColorPickerHandler },
                { view: 'link', name: 'color.brd.$3' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.brd.$4.val', link: 'color.brd.$4', width: 100, editable: true, value: '#CCCCCC', on: onColorPickerHandler },
                { view: 'link', name: 'color.brd.$4' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.brd.$5.val', link: 'color.brd.$5', width: 100, editable: true, value: '#0000FF', on: onColorPickerHandler },
                { view: 'link', name: 'color.brd.$5' },
              ],
            },
          ],
        },
      };
      var fontColor = {
        view: 'accordionitem',
        header: 'Цвет шрифта:',
        headerHeight: 22,
        headerAltHeight: 22,
        collapsed: true,
        body: {
          rows: [
            {
              cols: [
                { view: 'colorpicker', name: 'color.font.$1.val', link: 'color.font.$1', width: 100, editable: true, value: '#FF0000', on: onColorPickerHandler },
                { view: 'link', name: 'color.font.$1' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.font.$2.val', link: 'color.font.$2', width: 100, editable: true, value: '#FFFF00', on: onColorPickerHandler },
                { view: 'link', name: 'color.font.$2' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.font.$3.val', link: 'color.font.$3', width: 100, editable: true, value: '#00FF00', on: onColorPickerHandler },
                { view: 'link', name: 'color.font.$3' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.font.$4.val', link: 'color.font.$4', width: 100, editable: true, value: '#CCCCCC', on: onColorPickerHandler },
                { view: 'link', name: 'color.font.$4' },
              ],
            },
            {
              cols: [
                { view: 'colorpicker', name: 'color.font.$5.val', link: 'color.font.$5', width: 100, editable: true, value: '#0000FF', on: onColorPickerHandler },
                { view: 'link', name: 'color.font.$5' },
              ],
            },
          ],
        },
      };

      var visibility = {
        cols: [
          { view: 'label', label: 'Видимость:', width: 110 },
          { view: 'link', name: 'visibility' },
        ],
      };
      var label = {
        cols: [
          { view: 'label', label: 'Надпись:', width: 110 },
          { view: 'link', name: 'label' },
        ],
      };
      var header = {
        cols: [
          { view: 'label', label: 'Заголовок:', width: 110 },
          { view: 'param', name: 'header' },
        ],
      };
      var blinking = {
        rows: [
          {
            cols: [
              { view: 'label', label: 'Мигание:', width: 110 },
              { view: 'link', name: 'blink' },
            ],
          },
          {
            cols: [{}, { view: 'label', label: 'мс:', align: 'right' }, { view: 'text', name: 'blink.speed', link: 'blink', value: 500, width: 80, type: 'number' }],
          },
        ],
      };
      var rotation = {
        rows: [
          {
            cols: [
              { view: 'label', label: 'Вращение:', width: 110 },
              { view: 'link', name: 'rotation' },
            ],
          },
          {
            cols: [{}, { view: 'label', label: 'мс:', align: 'right' }, { view: 'text', name: 'rotation.speed', link: 'rotation', value: 100, width: 80, type: 'number' }],
          },
        ],
      };
      var turning = {
        rows: [
          {
            cols: [
              { view: 'label', label: 'Поворот:', width: 110 },
              { view: 'link', name: 'turn' },
            ],
          },
          {
            cols: [{}, { view: 'label', label: 'град (0-360):', align: 'right' }, { view: 'text', name: 'turn.angle', link: 'turn', value: 90, width: 80, type: 'number' }],
          },
        ],
      };
      var shifting = {
        rows: [
          {
            cols: [
              { view: 'label', label: 'Сдвиг:', width: 110 },
              { view: 'link', name: 'shift' },
            ],
          },
          {
            cols: [{}, { view: 'label', label: '∆x:', align: 'right', width: 25 }, { view: 'text', name: 'shift.dx', link: 'shift', value: 0, width: 80, type: 'number' }, { view: 'label', label: '∆y:', align: 'right', width: 25 }, { view: 'text', name: 'shift.dy', link: 'shift', value: 0, width: 80, type: 'number' }],
          },
        ],
      };
      var moving = {
        rows: [
          {
            cols: [
              { view: 'label', label: 'Перемещение:', width: 110 },
              { view: 'link', name: 'move' },
            ],
          },
          {
            cols: [{}, { view: 'label', label: 'x:', align: 'right', width: 25 }, { view: 'text', name: 'move.x', link: 'move', value: cellGeom.x, width: 80, type: 'number' }, { view: 'label', label: 'y:', align: 'right', width: 25 }, { view: 'text', name: 'move.y', link: 'move', value: cellGeom.y, width: 80, type: 'number' }],
          },
        ],
      };
      var sound = {
        cols: [
          { view: 'label', label: 'Источник:', width: 110 },
          {
            cols: [
              {
                view: 'label',
                id: 'play.name',
                name: 'play.name',
              },
              {
                view: 'text',
                id: 'play.data',
                name: 'play.data',
                hidden: true,
              },
              {
                view: 'uploader',
                value: 'Выбрать',
                apiOnly: true,
                width: 100,
                multiple: false,
                autosend: false, //!important
                accept: '.mp3,.ogg,.wav',
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
                  onAfterFileAdd: function (item) {
                    var inputs = this.$view.getElementsByTagName('INPUT');
                    var fileList = inputs[inputs.length - 1].files;
                    if (fileList && fileList.length > 0) {
                      // last file is loaded by client
                      if (this.files.count() === fileList.length) {
                        var self = this;
                        HELP.readBinaryFile(item.file, function (data) {
                          let srcData = window.btoa ? window.btoa(data) : Base64.encode(data, true);
                          $$('play.name').setValue(item.name);
                          $$('play.data').setValue('data:' + item.file.type + ';base64,' + srcData);
                          self.files.clearAll();
                        });
                      }
                    }
                  },
                },
              },
            ],
          },
        ],
      };
      var commands = {
        view: 'accordion',
        multi: true,
        type: 'clean',
        margin: 2,
        rows: [
          {
            view: 'accordionitem',
            header: 'Команды:',
            headerHeight: 22,
            headerAltHeight: 22,
            collapsed: true,
            body: {
              view: 'forminput',
              name: 'commands',
              bind: function (data) {
                if (data == null || data.length == 0) return;

                let list = this.queryView('editlist');
                list.blockEvent();

                data.forEach(function (x) {
                  let item = GUID.isValid(x.id)
                    ? context.eqTree.getItem(x.id)
                    : context.paramsList.find(function (item) {
                        return item.n == x.id;
                      }, true);
                  if (item != null) {
                    item = mxUtils.clone(item);
                    // restore user description
                    item.d = x.d;
                    list.config.bind.call(list, item);
                  }
                });

                list.refresh();
                list.unblockEvent();
              },
              getValue: function () {
                let list = this.queryView('editlist');
                return list.config.getValue.call(list);
              },
              body: {
                view: 'editlist',
                select: true,
                navigation: true,
                drag: 'order',
                dragScroll: true,
                editable: true,
                editor: 'text',
                editValue: 'd',
                minHeight: 150,
                data: [],
                ready: function () {
                  $(this.$view).attr('drop_target', true);
                  webix.DragControl.addDrop(this.$view, context.dropLogic);

                  this.data.attachEvent(
                    'onStoreUpdated',
                    mxUtils.bind(this, function (id, obj, mode) {
                      context.properties.callEvent('onChange');
                    })
                  );
                },
                bind: function (item) {
                  this.data.blockEvent();
                  this.config.setValue.call(this, item);
                  this.data.unblockEvent();
                },
                setValue: function (item) {
                  if (item == null) return;

                  let index = this.getIndexById(this.getSelectedId());

                  // tag
                  if (item.mid) {
                    if (item.vtype == API.ENUMS.TagValueType.Boolean) this.add({ id: item.n, val: item.n, d: item.d || item.n, confirm: true }, index);
                    return;
                  }
                  // eq
                  if (item.$count == 0 && item.cmd) {
                    let path = context.eqTree.buildPath(item.id);
                    let value = { id: item.id, val: path, d: item.d || item.desc, confirm: item.cnf };
                    if (!item.eq) {
                      let parent = context.eqTree.findParentEquipment(item.id);
                      if (parent) value.parent = parent.id;
                    }
                    this.add(value, index);
                    return;
                  }
                },
                getValue: function () {
                  return this.data.serialize(true);
                },
                on: {
                  onFocus: onHandler.onFocus,
                  onBeforeAdd: function (id, obj, index) {
                    return !this.exists(id);
                  },
                  onSelectChange: function (ids) {
                    if (ids == null || ids.length != 1) return;
                    let item = this.getSelectedItem();
                    if (item == null) return;
                    context.showItem(item.id);
                  },
                },
                onClick: {
                  'wxi-close': function (evt, id) {
                    this.remove(id);
                  },
                },
                template: function (obj, common) {
                  return obj.d + "<span class='webix_icon wxi-close' style='float:right;margin-top:5px' title='Удалить'></span>";
                },
              },
            },
          },
        ],
      };
      var action = {
        rows: [
          {
            cols: [
              { view: 'label', label: 'Действие:', width: 110 },
              {
                view: 'richselect',
                id: 'action',
                name: 'action',
                value: 'none',
                default: 'none',
                options: [
                  { id: 'none', value: 'Нет' },
                  { id: 'exec', value: 'Выполнить' },
                  { id: 'open', value: 'Открыть' },
                  { id: 'goto', value: 'Переход' },
                  { id: 'camera', value: 'IP-камера' },
                  { id: 'eq', value: 'Оборудование' },
                ],
                on: {
                  onReady: function () {
                    let args = $$('action.args');
                    let trigger = $$('action.trigger');
                    if (args != null && trigger != null) {
                      // reset
                      args.enable();
                      trigger.disable();
                      args.define('readonly', false);
                      $(args.$view).attr('drop_target', null);
                      // apply
                      switch (this.getValue()) {
                        case 'none':
                          args.disable();
                          break;
                        case 'eq':
                          {
                            args.define('readonly', true);
                            $(args.$view).attr('drop_target', true);
                            trigger.enable();
                          }
                          break;
                        case 'exec':
                          {
                            args.define('readonly', true);
                            $(args.$view).attr('drop_target', true);
                          }
                          break;
                        case 'camera':
                          {
                            trigger.enable();
                          }
                          break;
                        default:
                          break;
                      }
                      args.refresh();
                    }
                  },
                  onChange: function (newv, oldv) {
                    this.callEvent('onReady', []);
                    let args = $$('action.args');
                    let trigger = $$('action.trigger');
                    if (args != null && trigger != null) {
                      args.config.setValue(null);
                      trigger.config.setValue(null);
                    }
                  },
                },
              },
            ],
          },
          {
            cols: [
              { view: 'label', label: 'Аргумент:', width: 110 },
              { view: 'param', id: 'action.args', name: 'action.args', on: onHandler },
            ],
          },
          {
            cols: [
              { view: 'label', label: 'Триггер:', width: 110 },
              { view: 'link', id: 'action.trigger', name: 'action.trigger', on: onHandler },
            ],
          },
        ],
      };

      switch (cellType) {
        case 'switch':
        case 'rollswitch':
          {
            bindings.push(script);
            bindings.push(visibility);
            bindings.push(label);
            bindings.push(state);
            bindings.push(vclass);
            bindings.push({
              cols: [
                { view: 'label', label: 'Положение:', width: 110 },
                { view: 'checkbox', name: 'position', value: 1, default: 1, on: onHandler, tooltip: 'Отображать положение выключателя' },
              ],
            });
            bindings.push(blinking);
            bindings.push(rotation);
            bindings.push(turning);
            bindings.push(shifting);
            bindings.push(moving);
            bindings.push(action);
            bindings.push(commands);

            colors.rows.push(fillColor);
            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
        case 'separator':
        case 'disconnector':
        case 'rolldisconnector':
        case 'ground':
        case 'contactor':
        case 'rollelement':
        case 'actuator':
        case 'simpleswitch':
          {
            bindings.push(script);
            bindings.push(visibility);
            bindings.push(label);
            bindings.push(state);
            bindings.push(vclass);
            bindings.push(blinking);
            bindings.push(rotation);
            bindings.push(turning);
            bindings.push(shifting);
            bindings.push(moving);
            bindings.push(action);
            bindings.push(commands);

            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
        case 'wstar':
        case 'wtriangle':
        case 'wtorn':
        case 'fuse':
        case 'current_transformer':
        case 'current_transformer_ru':
        case 'current_transformer_fsk':
        case 'reactor':
        case 'opn':
        case 'opn_nl':
        case 'rezistor':
        case 'condensator':
        case 'inductance':
        case 'ground1':
        case 'cable_cone':
        case 'ac':
        case 'load':
        case 'compensator':
          {
            bindings.push(visibility);
            bindings.push(label);
            bindings.push(vclass);
            bindings.push(blinking);
            bindings.push(rotation);
            bindings.push(turning);
            bindings.push(shifting);
            bindings.push(moving);
            bindings.push(action);
            bindings.push(commands);

            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
        case 'bus':
          {
            bindings.push(script);
            bindings.push(visibility);
            bindings.push(label);
            bindings.push(state);
            bindings.push(vclass);
            bindings.push(action);

            colors.rows.push(fillColor);
            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
        case 'link':
          {
            bindings.push(script);
            bindings.push(visibility);
            bindings.push(label);
            bindings.push(state);
            bindings.push(vclass);

            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
        case 'sound':
          {
            bindings.push(script);
            bindings.push(sound);
            bindings.push({
              cols: [
                { view: 'label', label: 'Воспроизведение:', width: 145 },
                { view: 'link', name: 'play', on: onHandler },
              ],
            });
            bindings.push({
              cols: [
                { view: 'label', label: 'Циклически:', width: 145 },
                { view: 'checkbox', name: 'play.cycle', link: 'play', value: 0, default: 0, on: onHandler, tooltip: 'Циклическое воспроизведение' },
              ],
            });
          }
          break;
        case 'table':
          {
            let table_items = {
              view: 'accordion',
              multi: true,
              type: 'clean',
              margin: 2,
              rows: [
                {
                  view: 'accordionitem',
                  header: 'Список параметров:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: false,
                  body: {
                    view: 'forminput',
                    name: 'items',
                    bind: function (data) {
                      if (data == null || data.length == 0) return;

                      let list = this.queryView('editlist');
                      list.blockEvent();

                      data.forEach(function (x) {
                        let item = GUID.isValid(x.id)
                          ? context.eqTree.getItem(x.id)
                          : context.paramsList.find(function (item) {
                              return item.n == x.id;
                            }, true);
                        if (item != null) {
                          item = mxUtils.clone(item);
                          // restore user description
                          item.d = x.d;
                          list.config.bind.call(list, item);
                        }
                      });

                      list.refresh();
                      list.unblockEvent();
                    },
                    getValue: function () {
                      let list = this.queryView('editlist');
                      return list.config.getValue.call(list);
                    },
                    body: {
                      view: 'editlist',
                      select: true,
                      navigation: true,
                      drag: 'order',
                      dragScroll: true,
                      editable: true,
                      editor: 'text',
                      editValue: 'd',
                      data: [],
                      ready: function () {
                        $(this.$view).attr('drop_target', true);
                        webix.DragControl.addDrop(this.$view, context.dropLogic);

                        this.data.attachEvent(
                          'onStoreUpdated',
                          mxUtils.bind(this, function (id, obj, mode) {
                            context.properties.callEvent('onChange');
                          })
                        );
                      },
                      bind: function (item) {
                        this.data.blockEvent();
                        this.config.setValue.call(this, item);
                        this.data.unblockEvent();
                      },
                      setValue: function (item) {
                        if (item == null) return;

                        let index = this.getIndexById(this.getSelectedId());

                        // tag
                        if (item.mid) {
                          this.add({ id: item.n, val: item.n, d: item.d || item.n }, index);
                          return;
                        }
                        // eq
                        if (item.$count == 0 || item.eq) {
                          let path = context.eqTree.buildPath(item.id);
                          let value = { id: item.id, val: path, d: item.d || item.desc };
                          if (!item.eq) {
                            let parent = context.eqTree.findParentEquipment(item.id);
                            if (parent) value.parent = parent.id;
                          }
                          this.add(value, index);
                          return;
                        }
                      },
                      getValue: function () {
                        return this.data.serialize(true);
                      },
                      on: {
                        onFocus: onHandler.onFocus,
                        onBeforeAdd: function (id, obj, index) {
                          return !this.exists(id);
                        },
                        onSelectChange: function (ids) {
                          if (ids == null || ids.length != 1) return;
                          let item = this.getSelectedItem();
                          if (item == null) return;
                          context.showItem(item.id);
                        },
                      },
                      onClick: {
                        'wxi-close': function (evt, id) {
                          this.remove(id);
                        },
                      },
                      template: function (obj, common) {
                        return obj.d + "<span class='webix_icon wxi-close' style='float:right;margin-top:5px;margin-right:-10px' title='Удалить'></span>";
                      },
                    },
                  },
                },
              ],
            };
            bindings.push(script);
            bindings.push(visibility);
            bindings.push({
              cols: [
                { view: 'label', label: 'Стиль:', width: 110 },
                {
                  view: 'richselect',
                  name: 'style',
                  value: 'ptbl-default',
                  default: 'ptbl-default',
                  on: onHandler,
                  tooltip: 'Стиль оформления таблицы',
                  options: [
                    { id: 'ptbl-default', value: 'Обычный' },
                    { id: 'ptbl-borderless', value: 'Без сетки' },
                  ],
                },
              ],
            });
            bindings.push({
              cols: [
                { view: 'label', label: 'Ед. измерения:', width: 180 },
                { view: 'checkbox', name: 'measure', value: 0, default: 0, on: onHandler, tooltip: 'Отображать единицы измерения' },
              ],
            });
            bindings.push({
              cols: [
                { view: 'label', label: 'Ширина столбцов:', width: 180 },
                {
                  view: 'text',
                  name: 'w1',
                  value: 0,
                  default: 0,
                  width: 80,
                  type: 'number',
                  attributes: { step: 5, min: 0 },
                  validate: function (obj) {
                    return webix.rules.isNumber(obj) && obj >= 0;
                  },
                },
                {
                  view: 'text',
                  name: 'w2',
                  value: 0,
                  default: 0,
                  width: 80,
                  type: 'number',
                  attributes: { step: 5, min: 0 },
                  validate: function (obj) {
                    return webix.rules.isNumber(obj) && obj >= 0;
                  },
                },
                {},
              ],
            });
            bindings.push({
              cols: [
                { view: 'label', label: 'Размер шрифта ячеек:', width: 180 },
                {
                  view: 'text',
                  name: 'fontSize',
                  value: 10,
                  default: 10,
                  width: 80,
                  type: 'number',
                  attributes: { step: 1, min: 1 },
                  validate: function (obj) {
                    return webix.rules.isNumber(obj) && obj > 0;
                  },
                },
              ],
            });
            bindings.push({
              cols: [
                { view: 'label', label: 'Длина дробной части:', width: 180 },
                {
                  view: 'text',
                  name: 'fractionLength',
                  value: 6,
                  default: 6,
                  width: 80,
                  type: 'number',
                  attributes: { step: 1, min: 0, max: 99 },
                  validate: function (obj) {
                    return webix.rules.isNumber(obj) && obj >= 0 && obj < 100;
                  },
                },
              ],
            });
            bindings.push(table_items);

            var names_font_colors = {
              view: 'accordion',
              multi: true,
              type: 'clean',
              margin: 2,
              rows: [
                {
                  view: 'accordionitem',
                  header: 'Наименования:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: true,
                  body: {
                    view: 'forminput',
                    body: {
                      rows: [
                        // font
                        {
                          cols: [
                            { view: 'label', label: 'Цвет шрифта (по умолчанию):', width: 220 },
                            { view: 'colorpicker', name: 'color.font.name', editable: true, value: '#000000', default: '#000000', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'label', label: 'Плохое качество параметра:', width: 220 },
                            { view: 'colorpicker', name: 'color.font.name.bad', editable: true, value: '#000000', default: '#000000', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.name.$1.val', link: 'color.font.name.$1', width: 100, editable: true, value: '#FF0000', on: onHandler },
                            { view: 'link', name: 'color.font.name.$1' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.name.$2.val', link: 'color.font.name.$2', width: 100, editable: true, value: '#00FF00', on: onHandler },
                            { view: 'link', name: 'color.font.name.$2' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.name.$3.val', link: 'color.font.name.$3', width: 100, editable: true, value: '#0000FF', on: onHandler },
                            { view: 'link', name: 'color.font.name.$3' },
                          ],
                        },
                        // fill
                        {
                          cols: [
                            { view: 'label', label: 'Цвет заливки (по умолчанию):', width: 220 },
                            { view: 'colorpicker', name: 'color.fill.name', editable: true, value: '', default: '', on: onHandler, point: true },
                          ],
                        },
                        {
                          cols: [
                            { view: 'label', label: 'Плохое качество параметра:', width: 220 },
                            { view: 'colorpicker', name: 'color.fill.name.bad', editable: true, value: '', default: '', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.name.$1.val', link: 'color.fill.name.$1', width: 100, editable: true, value: '#FF0000', on: onHandler },
                            { view: 'link', name: 'color.fill.name.$1' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.name.$2.val', link: 'color.fill.name.$2', width: 100, editable: true, value: '#00FF00', on: onHandler },
                            { view: 'link', name: 'color.fill.name.$2' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.name.$3.val', link: 'color.fill.name.$3', width: 100, editable: true, value: '#0000FF', on: onHandler },
                            { view: 'link', name: 'color.fill.name.$3' },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            };
            bindings.push(names_font_colors);

            var values_font_colors = {
              view: 'accordion',
              multi: true,
              type: 'clean',
              margin: 2,
              rows: [
                {
                  view: 'accordionitem',
                  header: 'Значения:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: true,
                  body: {
                    view: 'forminput',
                    body: {
                      rows: [
                        // font
                        {
                          cols: [
                            { view: 'label', label: 'Цвет шрифта (по умолчанию):', width: 220 },
                            { view: 'colorpicker', name: 'color.font.value', editable: true, value: '#90EE90', default: '#90EE90', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'label', label: 'Плохое качество параметра:', width: 220 },
                            { view: 'colorpicker', name: 'color.font.value.bad', editable: true, value: VCLASS.UNRELIABLE_INFO, default: VCLASS.UNRELIABLE_INFO, on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.value.$1.val', link: 'color.font.value.$1', width: 100, editable: true, value: '#FF0000', on: onHandler },
                            { view: 'link', name: 'color.font.value.$1' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.value.$2.val', link: 'color.font.value.$2', width: 100, editable: true, value: '#00FF00', on: onHandler },
                            { view: 'link', name: 'color.font.value.$2' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.value.$3.val', link: 'color.font.value.$3', width: 100, editable: true, value: '#0000FF', on: onHandler },
                            { view: 'link', name: 'color.font.value.$3' },
                          ],
                        },
                        // fill
                        {
                          cols: [
                            { view: 'label', label: 'Цвет заливки (по умолчанию):', width: 220 },
                            { view: 'colorpicker', name: 'color.fill.value', editable: true, value: '#000000', default: '#000000', on: onHandler, point: true },
                          ],
                        },
                        {
                          cols: [
                            { view: 'label', label: 'Плохое качество параметра:', width: 220 },
                            { view: 'colorpicker', name: 'color.fill.value.bad', editable: true, value: '#808080', default: '#808080', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.value.$1.val', link: 'color.fill.value.$1', width: 100, editable: true, value: '#FF0000', on: onHandler },
                            { view: 'link', name: 'color.fill.value.$1' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.value.$2.val', link: 'color.fill.value.$2', width: 100, editable: true, value: '#00FF00', on: onHandler },
                            { view: 'link', name: 'color.fill.value.$2' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.value.$3.val', link: 'color.fill.value.$3', width: 100, editable: true, value: '#0000FF', on: onHandler },
                            { view: 'link', name: 'color.fill.value.$3' },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            };
            bindings.push(values_font_colors);

            var measures_font_colors = {
              view: 'accordion',
              multi: true,
              type: 'clean',
              margin: 2,
              rows: [
                {
                  view: 'accordionitem',
                  header: 'Ед. измерения:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: true,
                  body: {
                    view: 'forminput',
                    body: {
                      rows: [
                        // font
                        {
                          cols: [
                            { view: 'label', label: 'Цвет шрифта (по умолчанию):', width: 220 },
                            { view: 'colorpicker', name: 'color.font.measure', editable: true, value: '#000000', default: '#000000', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'label', label: 'Плохое качество параметра:', width: 220 },
                            { view: 'colorpicker', name: 'color.font.measure.bad', editable: true, value: '#000000', default: '#000000', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.measure.$1.val', link: 'color.font.measure.$1', width: 100, editable: true, value: '#FF0000', on: onHandler },
                            { view: 'link', name: 'color.font.measure.$1' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.measure.$2.val', link: 'color.font.measure.$2', width: 100, editable: true, value: '#00FF00', on: onHandler },
                            { view: 'link', name: 'color.font.measure.$2' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.font.measure.$3.val', link: 'color.font.measure.$3', width: 100, editable: true, value: '#0000FF', on: onHandler },
                            { view: 'link', name: 'color.font.measure.$3' },
                          ],
                        },
                        // fill
                        {
                          cols: [
                            { view: 'label', label: 'Цвет заливки (по умолчанию):', width: 220 },
                            { view: 'colorpicker', name: 'color.fill.measure', editable: true, value: '', default: '', on: onHandler, point: true },
                          ],
                        },
                        {
                          cols: [
                            { view: 'label', label: 'Плохое качество параметра:', width: 220 },
                            { view: 'colorpicker', name: 'color.fill.measure.bad', editable: true, value: '', default: '', on: onHandler },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.measure.$1.val', link: 'color.fill.measure.$1', width: 100, editable: true, value: '#FF0000', on: onHandler },
                            { view: 'link', name: 'color.fill.measure.$1' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.measure.$2.val', link: 'color.fill.measure.$2', width: 100, editable: true, value: '#00FF00', on: onHandler },
                            { view: 'link', name: 'color.fill.measure.$2' },
                          ],
                        },
                        {
                          cols: [
                            { view: 'colorpicker', name: 'color.fill.measure.$3.val', link: 'color.fill.measure.$3', width: 100, editable: true, value: '#0000FF', on: onHandler },
                            { view: 'link', name: 'color.fill.measure.$3' },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            };
            bindings.push(measures_font_colors);
          }
          break;
        case 'group':
          {
            bindings.push(script);
            bindings.push(visibility);
          }
          break;
        case 'button':
          {
            bindings.push(script);
            bindings.push(visibility);
            bindings.push(label);
            bindings.push(blinking);
            bindings.push(rotation);
            bindings.push(turning);
            bindings.push(shifting);
            bindings.push(moving);
            bindings.push(action);
            bindings.push(commands);

            colors.rows.push(fillColor);
            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
        case 'chart':
          {
            let getRandomColor = function () {
              var letters = '0123456789ABCDEF'.split('');
              var color = '#';
              for (var i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
              return color;
            };
            let color_suggest = webix.ui({
              view: 'suggest',
              body: {
                view: 'colorboard',
                width: 235,
                height: 200,
                cols: 12,
                rows: 10,
              },
            });
            let chart_items = {
              view: 'forminput',
              name: 'items',
              bind: function (data) {
                if (data == null || data.length == 0) return;

                let table = this.queryView('datatable');
                table.blockEvent();

                data.forEach(function (x) {
                  let item = GUID.isValid(x.id)
                    ? context.eqTree.getItem(x.id)
                    : context.paramsList.find(function (item) {
                        return item.n == x.id;
                      }, true);
                  if (item != null) {
                    item = mxUtils.clone(item);
                    // restore user description
                    $.extend(item, x);
                    //item.d = x.d;
                    table.config.bind.call(table, item);
                  }
                });

                table.refresh();
                table.unblockEvent();
              },
              getValue: function () {
                let table = this.queryView('datatable');
                return table.config.getValue.call(table);
              },
              body: {
                rows: [
                  { view: 'label', label: 'Список сигналов:' },
                  {
                    view: 'datatable',
                    resizeColumn: { size: 8 },
                    resizeRow: false,
                    editable: true,
                    headerRowHeight: 30,
                    navigation: true,
                    editaction: 'click',
                    select: 'cell',
                    rowHeight: 24,
                    scrollX: true,
                    drag: 'order',
                    dragColumn: 'order',
                    minHeight: 150,
                    data: [],
                    scheme: {
                      $init: function (obj) {
                        // default type
                        if (obj.view == null) obj.view = 2;
                        // random color
                        if (obj.color == null) obj.color = getRandomColor();
                      },
                      $serialize: function (obj) {
                        let result = {
                          id: obj.id,
                          d: obj.d,
                          view: obj.view,
                          color: obj.color,
                        };
                        if (obj.parent != null) result.parent = obj.parent;
                        return result;
                      },
                    },
                    columns: [
                      {
                        id: 'd',
                        header: 'Сигнал',
                        minWidth: 50,
                        fillspace: true,
                        editor: 'text',
                        sort: 'string',
                      },
                      {
                        id: 'view',
                        header: 'Тип',
                        minWidth: 60,
                        fillspace: true,
                        value: 2,
                        editor: 'select',
                        options: [
                          { id: 1, value: 'Точка' },
                          { id: 2, value: 'Линия' },
                          { id: 3, value: 'Линия с памятью' },
                          { id: 4, value: 'Столбцы' },
                        ],
                      },
                      {
                        id: 'color',
                        header: 'Цвет',
                        width: 95,
                        editor: 'text',
                        liveEdit: true,
                        tooltip: false,
                        suggest: color_suggest,
                        template: "<span style='background-color:#color#;border-style:solid;border-width:0.5px;border-color:#808080;border-radius:4px; padding-right:10px;cursor:pointer;'>&nbsp</span> #color#",
                      },
                      {
                        id: 'trash',
                        header: "<span class='webix_icon wxi-trash remove_all' title='" + 'common.delete_all' + "'></span>",
                        width: 35,
                        template: function (obj, common) {
                          let span = $(common.trashIcon(obj, common));
                          span.attr('title', 'common.delete');
                          return span[0].outerHTML;
                        },
                      },
                    ],
                    ready: function () {
                      $(this.$view).attr('drop_target', true);
                      webix.DragControl.addDrop(this.$view, context.dropLogic);

                      this.data.attachEvent(
                        'onStoreUpdated',
                        mxUtils.bind(this, function (id, obj, mode) {
                          context.properties.callEvent('onChange');
                        })
                      );
                    },
                    bind: function (item) {
                      this.data.blockEvent();
                      this.config.setValue.call(this, item);
                      this.data.unblockEvent();
                    },
                    setValue: function (item) {
                      if (item == null) return;

                      let value = {};
                      $.extend(value, item);

                      // tag
                      if (item.mid) {
                        value.id = item.n;
                        value.val = item.n;
                        value.d = item.d || item.desc || item.n;
                      }
                      // eq
                      else if (item.$count == 0 || item.eq) {
                        value.id = item.id;
                        value.val = context.eqTree.buildPath(item.id);
                        value.d = item.d || item.desc || item.n;

                        if (!item.eq) {
                          let parent = context.eqTree.findParentEquipment(item.id);
                          if (parent) value.parent = parent.id;
                        }
                      }

                      if (value != null && !$.isEmptyObject(value)) {
                        let index = this.getIndexById(this.getSelectedId());
                        this.add(value, index);
                      }
                    },
                    getValue: function () {
                      return this.serialize(true);
                    },
                    on: {
                      onFocus: onHandler.onFocus,
                      onAfterEditStart: function (cell) {
                        let item = this.getItem(cell.row);
                        if (!item) return false;

                        if (cell.column === 'color') {
                          var editor = this.getEditor(cell);
                          //show
                          $$(editor.config.suggest).linkInput(editor.node);
                          $$(editor.config.suggest).show(editor.node);
                          $$(editor.config.suggest).getBody().setValue(item.color);
                        }
                        return true;
                      },
                      onLiveEdit: function (state, editor, ignoreUpdate) {
                        let item = this.getItem(editor.row);
                        if (!item) return;

                        if (editor.column === 'color') {
                          item.color = state.value;
                          // update editor
                          editor.setValue(item.color);
                          // update suggest
                          var suggestView = $$(editor.config.suggest);
                          suggestView.getBody().setValue(item.color);
                        }
                        return true;
                      },
                      onBeforeEditStop: function (state, editor, ignoreUpdate) {
                        let item = this.getItem(editor.row);
                        if (!item) return;

                        if (editor.column === 'color') {
                          item.color = state.value;
                          var suggestView = $$(editor.config.suggest);
                          if (suggestView.isVisible()) {
                            var color = suggestView.getBody().getValue();
                            if (!isNullOrEmpty(color)) item.color = color;
                          }
                          state.value = item.color;
                        }
                      },
                      onBeforeAdd: function (id, obj, index) {
                        return !this.exists(id);
                      },
                      onSelectChange: function () {
                        let item = this.getSelectedItem();
                        if (item == null) return;
                        context.showItem(item.id);
                      },
                    },
                    onClick: {
                      'wxi-trash': function (evt, id) {
                        this.remove(id.row);
                        return false;
                      },
                      remove_all: function (evt, id, trg) {
                        let grid = this;
                        grid.editStop();
                        console.log('Удалить все сигналы', function (result) {
                          if (result === true) grid.clearAll();
                        })
                        // messageConfirm('Удалить все сигналы', function (result) {
                        //   if (result === true) grid.clearAll();
                        // });
                      },
                    },
                  },
                ],
              },
            };
            let axisX = {
              view: 'accordion',
              multi: true,
              type: 'clean',
              margin: 2,
              rows: [
                {
                  view: 'accordionitem',
                  header: 'Ось времени:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: true,
                  body: {
                    rows: [
                      {
                        cols: [
                          { view: 'label', label: 'Ед. измерения:', width: 110 },
                          {
                            view: 'richselect',
                            name: 'axisX.measure',
                            value: 's',
                            options: [
                              { id: 'ms', value: 'Миллисекунды' },
                              { id: 's', value: 'Секунды' },
                              { id: 'mn', value: 'Минуты' },
                              { id: 'h', value: 'Часы' },
                              { id: 'd', value: 'Сутки' },
                              { id: 'w', value: 'Неделя' },
                              { id: 'm', value: 'Месяц' },
                              { id: 'y', value: 'Год' },
                            ],
                          },
                        ],
                      },
                      {
                        cols: [
                          { view: 'label', label: 'Ширина:', width: 110 },
                          { view: 'text', type: 'number', name: 'axisX.scale', value: 30 },
                        ],
                      },
                      {
                        cols: [
                          { view: 'label', label: 'Шаг сетки:', width: 110 },
                          { view: 'text', type: 'number', name: 'axisX.step', value: 5 },
                        ],
                      },
                      {
                        cols: [
                          { view: 'label', label: 'Надпись:', width: 110 },
                          { view: 'param', name: 'axisX.label' },
                        ],
                      },
                    ],
                  },
                },
              ],
            };
            let axisY = {
              view: 'accordion',
              multi: true,
              type: 'clean',
              margin: 2,
              rows: [
                {
                  view: 'accordionitem',
                  header: 'Ось значений:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: true,
                  body: {
                    rows: [
                      {
                        cols: [
                          { view: 'label', label: 'Макс. значение:', width: 120 },
                          {
                            view: 'checkbox',
                            width: 30,
                            name: 'axisY.max.show',
                            value: 0,
                            default: 0,
                            tooltip: 'Отображать максимальное значение',
                            on: {
                              onFocus: onHandler.onFocus,
                              onChange: function () {
                                this.callEvent('onReady', []);
                              },
                              onReady: function () {
                                $$('maxVal').define('disabled', this.getValue() != 1);
                                $$('maxVal').refresh();
                              },
                            },
                          },
                          { view: 'text', type: 'number', id: 'maxVal', name: 'axisY.max.value', value: 0, disabled: true },
                        ],
                      },
                      {
                        cols: [
                          { view: 'label', label: 'Мин. значение:', width: 120 },
                          {
                            view: 'checkbox',
                            width: 30,
                            name: 'axisY.min.show',
                            value: 0,
                            default: 0,
                            tooltip: 'Отображать минимальное значение',
                            on: {
                              onFocus: onHandler.onFocus,
                              onChange: function (newv) {
                                this.callEvent('onReady', []);
                              },
                              onReady: function () {
                                $$('minVal').define('disabled', this.getValue() != 1);
                                $$('minVal').refresh();
                              },
                            },
                          },
                          { view: 'text', type: 'number', id: 'minVal', name: 'axisY.min.value', value: 0, disabled: true },
                        ],
                      },
                      {
                        cols: [
                          { view: 'label', label: 'Надпись:', width: 120 },
                          { view: 'param', name: 'axisY.label' },
                        ],
                      },
                    ],
                  },
                },
              ],
            };

            bindings.push(script);
            bindings.push(visibility);
            bindings.push(header);
            bindings.push({
              cols: [
                { view: 'label', label: 'Легенда:', width: 110 },
                { view: 'checkbox', name: 'legend', default: 1, value: 1, on: onHandler },
              ],
            });
            bindings.push(chart_items);
            bindings.push(axisX);
            bindings.push(axisY);
            //bindings.push(action);
            colors.rows.push(fillColor);
            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
        case 'bmrz':
          {
            var settings = {
              view: 'accordion',
              multi: true,
              type: 'clean',
              margin: 2,
              rows: [
                {
                  view: 'accordionitem',
                  header: 'Настройки подключения:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: false,
                  body: {
                    id: 'settings',
                    visibleBatch: 'usb',
                    rows: [
                      {
                        cols: [
                          { view: 'label', label: 'Тип:', width: 110 },
                          {
                            view: 'select',
                            name: 'connection.type',
                            options: [
                              { id: 'usb', value: 'USB' },
                              { id: 'com', value: 'RS485(MODBUS-MT)' },
                              { id: 'eth', value: 'Ethernet(MODBUS-MT/TCP)' },
                            ],
                            on: {
                              onReady: function () {
                                $$('settings').showBatch(this.getValue());
                              },
                              onChange: function (newv, oldv) {
                                $$('settings').showBatch(newv);
                              },
                            },
                          },
                        ],
                      },
                      {
                        batch: 'usb',
                        height: 1,
                        template: '',
                      },
                      {
                        batch: 'com',
                        rows: [
                          {
                            cols: [
                              { view: 'label', label: 'Порт:', width: 110 },
                              { view: 'text', name: 'com.port', validate: API.SERIAL.validate_port, value: 'COM1', default: 'COM1' },
                            ],
                          },
                          {
                            cols: [
                              { view: 'label', label: 'Адрес:', width: 110 },
                              {
                                view: 'text',
                                name: 'com.address',
                                validate: function (v) {
                                  return webix.rules.isNumber(v) && v > 0 && v < 248;
                                },
                                value: 55,
                                default: 55,
                              },
                            ],
                          },
                          {
                            cols: [
                              { view: 'label', label: 'Скорость:', width: 110 },
                              { view: 'select', name: 'com.speed', options: API.SERIAL.baud_rates_array, value: 19200, default: 19200 },
                            ],
                          },
                          {
                            cols: [
                              { view: 'label', label: 'Чётность:', width: 110 },
                              { view: 'select', name: 'com.parity', options: API.SERIAL.parities_array, value: 0, default: 0 },
                            ],
                          },
                          {
                            cols: [
                              { view: 'label', label: 'Стоп. биты:', width: 110 },
                              { view: 'select', name: 'com.stop_bits', options: API.SERIAL.stop_bits_array, value: 1, default: 1 },
                            ],
                          },
                          {
                            cols: [
                              { view: 'label', label: 'Межпакетный интервал:', width: 180 },
                              {
                                view: 'text',
                                type: 'number',
                                name: 'com.period',
                                validate: function (v) {
                                  return webix.rules.isNumber(v) && v >= 0 && v <= 255;
                                },
                                value: 0,
                                default: 0,
                              },
                            ],
                          },
                          {
                            cols: [
                              { view: 'label', label: 'Обмен с наличием эха:', width: 180 },
                              { view: 'checkbox', name: 'com.echo', value: 0, default: 0, on: onHandler },
                            ],
                          },
                        ],
                      },
                      {
                        batch: 'eth',
                        rows: [
                          {
                            cols: [
                              { view: 'label', label: 'IP-адрес:', width: 110 },
                              { view: 'text', name: 'eth.ip', validate: API.IPV4.validate, value: '1.1.1.1', default: '1.1.1.1' },
                            ],
                          },
                          {
                            cols: [
                              { view: 'label', label: 'Порт:', width: 110 },
                              {
                                view: 'text',
                                type: 'number',
                                name: 'eth.port',
                                validate: function (v) {
                                  return webix.rules.isNumber(v) && v > 0 && v < 65536;
                                },
                                value: 503,
                                default: 503,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  view: 'accordionitem',
                  header: 'Файлы:',
                  headerHeight: 22,
                  headerAltHeight: 22,
                  collapsed: false,
                  body: {
                    rows: [
                      {
                        cols: [
                          { view: 'label', label: 'Путь к БФПО:', width: 110 },
                          {
                            view: 'path',
                            name: 'path.bfpo',
                            ext: 'sth',
                            id: 'path.bfpo',
                            validate: function (v) {
                              return isNullOrEmpty(v) || getExtension(v.trim()).toLowerCase() === 'sth';
                            },
                          },
                        ],
                      },
                      {
                        cols: [
                          { view: 'label', label: 'Путь к ПМК:', width: 110 },
                          {
                            view: 'path',
                            name: 'path.pmk',
                            ext: 'sth_a',
                            id: 'path.pmk',
                            validate: function (v) {
                              let result = false;
                              if (isNullOrEmpty(v)) {
                                let bfpo = $$('path.bfpo').getValue();
                                let readpmk = $$('read_pmk').getValue();
                                result = isNullOrEmpty(bfpo) || readpmk == '1';
                              } else {
                                result = getExtension(v.trim()).toLowerCase() === 'sth_a';
                              }
                              return result;
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  cols: [
                    { view: 'label', label: 'Подключиться к блоку:', width: 180 },
                    {
                      view: 'checkbox',
                      name: 'options.connect',
                      value: 0,
                      default: 0,
                      on: {
                        onFocus: onHandler.onFocus,
                        onChange: function () {
                          let pmk = $$('pmk');
                          if (this.getValue() == 1) pmk.show();
                          else {
                            $$('read_pmk').setValue(0);
                            pmk.hide();
                          }
                        },
                        onReady: function () {
                          this.callEvent('onChange');
                        },
                      },
                    },
                  ],
                },
                {
                  id: 'pmk',
                  hidden: true,
                  cols: [
                    { view: 'label', label: 'Вычитать ПМК:', width: 180 },
                    { view: 'checkbox', name: 'options.read_pmk', id: 'read_pmk', value: 0, default: 0, on: onHandler },
                  ],
                },
              ],
            };
            bindings.push(settings);
          }
          break;
        default:
          {
            bindings.push(script);
            bindings.push(visibility);
            bindings.push(label);
            bindings.push(blinking);
            bindings.push(rotation);
            bindings.push(turning);
            bindings.push(shifting);
            bindings.push(moving);
            bindings.push(action);

            colors.rows.push(fillColor);
            colors.rows.push(borderColor);
            colors.rows.push(fontColor);
          }
          break;
      }

      // add colors section to binding
      if (colors.rows.length > 0) bindings.push(colors);

      return bindings;
    };
    Bindings.prototype.destroy = function () {
      if (this.eqTree) this.eqTree.destructor();
      if (this.paramsList) this.paramsList.destructor();
      if (this.properties) this.properties.destructor();
      if (this.paramsTab) this.paramsTab.destructor();
    };
    editorUi.Bindings = Bindings;
  })(window);

  this.initialize();
};
BindingsHandler.prototype.initialize = function () {
  let context = this;

  // Ignores canvas in codecs
  mxCell.prototype.mxTransient.push('chart', 'canvas', 'onBindingsUpdated');
  mxCodecRegistry.getCodec(mxCell).exclude.push('chart', 'canvas', 'onBindingsUpdated');
  mxCodecRegistry.getCodec(mxGraphModel).exclude.push('chart', 'canvas', 'onBindingsUpdated');

  // charts
  Chart.defaults.global.tooltips.enabled = false;

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
        position: 'right',
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
        position: 'right',
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
        animation: {
          duration: 300,
        },
        title: {
          display: true,
          text: 'График',
        },
        legend: {
          display: true,
          position: 'top',
          onClick: function () {},
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
                //stepSize: 1,
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

  let graphModelSetValue = this.graph.model.setValue;
  this.graph.model.setValue = function (cell, value) {
    cell.canvas = null;
    cell.chart = null;
    cell.table = null;
    cell.onBindingsUpdated = null;
    graphModelSetValue.apply(this, arguments);
  };

  let graphFireMouseEvent = this.graph.fireMouseEvent;
  this.graph.fireMouseEvent = function (evtName, me, sender) {
    if (evtName == mxEvent.MOUSE_DOWN || evtName == mxEvent.MOUSE_UP) {
      if (me.state?.cell.isTable) {
        // get parent cell for inner table
        const parent = context.graph.model.getParent(me.state.cell);
        // change event target cell
        me.state = this.view.getState(parent);
      }
      if (me.state?.cell.isPoster) {
        // get parent cell for inner table
        const parent = context.graph.model.getParent(me.state.cell);
        // change event target cell
        me.state = this.view.getState(parent);
      }
    }
    if (evtName == mxEvent.MOUSE_MOVE) {
      if (me.state?.cell.isPoster) {
        // get parent cell for inner table
        const parent = context.graph.model.getParent(me.state.cell);
        // change event target cell
        me.state = this.view.getState(parent);
      }
    }
    graphFireMouseEvent.apply(this, arguments);
  };

  let mxGraphViewValidatePosterState = mxGraphView.prototype.validateCellState;
  mxGraphView.prototype.validatePosterState = function (cell, recurse) {
    let context = this.graph;
    let state = this.getState(cell);
    if (state != null && context.model.isVertex(cell)) {
      let geom = context.getCellGeometry(cell);
      cell.onBindingsUpdated = mxUtils.bind(cell, function () {
        // check content cell
        let posterCell = this.getChildAt(0);
        if (posterCell == null) {
          // build cell
          posterCell = new mxCell('', new mxGeometry(0, 0, geom.width, geom.height), 'text;html=1;overflow=fill;connectable=0;resizable=0;deletable=0;selectable=0;rotatable=0;editable=0;pointerEvents=0;'); //movable=0;
          posterCell.vertex = true;
          posterCell.isPoster = 1;
          posterCell.isTable = true;
          if (!this.children) {
            posterCell = context.model.add(this, posterCell);
          }
        }
        let styleBinding = this.getBinding('style');
        let style = styleBinding != null ? JSON.parse($(styleBinding).attr('value')) : 'ptbl-default';

        // get bindings from default cell style
        const parentStyles = (cell.style || '').split(';');
        const getStyleByKey = (key) => {
          const style = parentStyles.find((x) => x.startsWith(key));
          return style?.includes('=') ? style.split('=')[1] : '';
        };

        //get background image
        let image = null;
        API.POSTERS.metadata.forEach((el) => {
          var pattern = /\b[a-zA-Z]+\b/;
          if (cell._model) {
            if (cell._model.data.type) {
              const type = cell._model.data.type.match(pattern)[0];
              if (el.key === type) {
                image = `url(${el.src})`;
              }
            }
          }
        });

        // get stroke width
        let strokeWidth = (+getStyleByKey('strokeWidth') || 0) + 1; // min 1 px
        if (strokeWidth % 2 !== 0) strokeWidth++; // should be even

        context.model.beginUpdate();

        // update content
        let poster = '<div class="poster-block {S}" style="width:{TW};height:{TH}; background-image:{IMG}; background-size:{IMG_SZ}; background-position:{IMG_POS}; background-repeat:{IMG_RE}"></div>';

        poster = poster
          .replace('{ID}', this.id)
          .replace('{S}', style)
          .replace('{TW}', `calc(100% - ${strokeWidth}px)`) // fix table position
          .replace('{TH}', `calc(100% - ${strokeWidth}px)`) // fix table position
          .replace('{IMG}', `${image}`)
          .replace('{IMG_SZ}', 'cover')
          .replace('{IMG_POS}', 'center')
          .replace('{IMG_RE}', 'no-repeat');

        context.model.setValue(posterCell, poster);

        context.model.endUpdate();
      });
      cell.onBindingsUpdated();
    }
    return mxGraphViewValidatePosterState.apply(this, arguments);
  };

  let mxGraphViewValidateCellState = mxGraphView.prototype.validateCellState;
  mxGraphView.prototype.validateCellState = function (cell, recurse) {
    let context = this.graph;
    let state = this.getState(cell);

    if (state != null && context.model.isVertex(cell)) {
      let shape = state.style[mxConstants.STYLE_SHAPE];
      let geom = context.getCellGeometry(cell);

      switch (shape) {
        case 'chart':
          {
            if (cell.canvas == null) {
              // build chart
              var node = document.createElement('canvas');
              node.setAttribute('id', cell.mxObjectId);
              node.setAttribute('class', 'chart');
              node.setAttribute('width', geom.width);
              node.setAttribute('height', geom.height);
              // Document for empty output if not in DOM
              //document.body.appendChild(node);
              cell.canvas = node;
              cell.chart = new Chart.Scatter(node.getContext('2d'), getChartConfig());

              if (cell.onBindingsUpdated == null) {
                cell.onBindingsUpdated = mxUtils.bind(cell, function () {
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
                              label: item.d,
                              fill: false,
                              showLine: getShowLine(item),
                              lineTension: 0,
                              backgroundColor: item.color,
                              borderColor: item.color,
                              type: getType(item),
                              steppedLine: item.view == '3' ? 'before' : false, // stepped line
                              data: [randomData(xUnit, +0, minValue, maxValue), randomData(xUnit, +10, minValue, maxValue), randomData(xUnit, +20, minValue, maxValue)],
                            });
                          }
                        }
                      }
                    }

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

                      if (minDate != null) this.chart.options.scales.xAxes[0].ticks.min = moment(minDate);
                    }

                    this.chart.update();
                  }
                });
                cell.onBindingsUpdated();
              }
            }
          }
          break;
        case 'table':
          {
            if (cell.onBindingsUpdated == null) {
              cell.onBindingsUpdated = mxUtils.bind(cell, function () {
                // check content cell
                let tableCell = this.getChildAt(0);
                if (tableCell == null) {
                  // build cell
                  tableCell = new mxCell('Параметры', new mxGeometry(0, 0, geom.width, geom.height), 'text;html=1;overflow=fill;connectable=0;resizable=0;deletable=0;selectable=0;rotatable=0;editable=0;pointerEvents=0;'); //movable=0;
                  tableCell.vertex = true;
                  tableCell.connectable = false;
                  tableCell.isTable = true;
                  tableCell = context.model.add(this, tableCell);
                }

                let itemsBinding = this.getBinding('items');
                let items = itemsBinding != null ? JSON.parse($(itemsBinding).attr('value')) : [];

                let styleBinding = this.getBinding('style');
                let style = styleBinding != null ? JSON.parse($(styleBinding).attr('value')) : 'ptbl-default';

                let measureBinding = this.getBinding('measure');
                let showMeasure = measureBinding != null ? JSON.parse($(measureBinding).attr('value')) == 1 : false;

                let w1Binding = this.getBinding('w1');
                let w1 = w1Binding != null ? JSON.parse($(w1Binding).attr('value')) + 'px' : '40%';
                let w2Binding = this.getBinding('w2');
                let w2 = w2Binding != null ? JSON.parse($(w2Binding).attr('value')) + 'px' : '40%';

                const fontSizeBinding = this.getBinding('fontSize');
                const fontSize = fontSizeBinding != null ? JSON.parse($(fontSizeBinding).attr('value')) + 'px' : '10px';

                // get bindings from default cell style
                const parentStyles = (cell.style || '').split(';');
                const getStyleByKey = (key) => {
                  const style = parentStyles.find((x) => x.startsWith(key));
                  return style?.includes('=') ? style.split('=')[1] : '';
                };

                // get stroke color
                const strokeColor = getStyleByKey('strokeColor') || 'grey';

                // get stroke width
                let strokeWidth = (+getStyleByKey('strokeWidth') || 0) + 1; // min 1 px
                if (strokeWidth % 2 !== 0) strokeWidth++; // should be even

                context.model.beginUpdate();

                // update content
                let table = '<table class="tbl{ID} {S}" style="width:{TW};height:{TH};margin-top:{TM};font-size:{FS}"><tbody>{B}</tbody></table>';

                let rows = [];
                for (let i = 0; i < items.length; i++) {
                  let item = items[i];
                  let ncell = '<td class="c-name"  style="width:{w1}; border-color:{BC}">{N}</td>'.replace('{N}', item.d || '&nbsp;').replace('{BC}', strokeColor);
                  let vcell = '<td class="c-value" style="width:{w2}; border-color:{BC}">{V}</td>'.replace('{V}', item.v || '&nbsp;').replace('{BC}', strokeColor);
                  // build row
                  let row = '<tr id="{ID}">'.replace('{ID}', item.id);
                  row += ncell;
                  row += vcell;
                  if (showMeasure) {
                    let mcell = '<td class="c-measure" style="border-color:{BC}">{M}</td>'.replace('{M}', item.m || '&nbsp;').replace('{BC}', strokeColor);
                    row += mcell;
                  }
                  row += '</tr>';
                  // column width
                  row = row.replace('{w1}', w1);
                  row = row.replace('{w2}', w2);
                  rows.push(row);
                }

                table = table
                  .replace('{ID}', this.id)
                  .replace('{S}', style)
                  .replace('{FS}', fontSize)
                  .replace('{TW}', `calc(100% - ${strokeWidth}px)`) // fix table position
                  .replace('{TH}', `calc(100% - ${strokeWidth}px)`) // fix table position
                  .replace('{TM}', `${Math.ceil(strokeWidth / 2)}px`) // fix table position
                  .replace('{B}', rows.join(''));
                context.model.setValue(tableCell, table);

                context.model.endUpdate();
              });
              cell.onBindingsUpdated();
            }
          }
          break;
      }
    }
    return mxGraphViewValidateCellState.apply(this, arguments);
  };

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
BindingsHandler.prototype.ready = function () {
  // rebuild(update) all cells view
  var filter = mxUtils.bind(this.graph, function (cell) {
    return !this.model.isLayer(cell) && !this.model.isRoot(cell) && cell.bindings != null;
  });
  this.graph.model.filterDescendants(filter).forEach(function (cell) {
    if (cell.onBindingsUpdated != null) cell.onBindingsUpdated();
  });
};
