import * as mxgraph from 'mxgraph';
import { API } from './scada'
import { HELP, AJAX } from './client'
import * as webix from 'webix/webix.js';
import 'webix/webix.css';
import { SidebarWindow } from './Dialogs'
const {
  $$
  } = webix


let { 
    mxRectangle,
    mxEvent,
    mxCell,
    mxGeometry,
} = mxgraph();


export default function MarksService(editorUI) {
  this.ui = editorUI;
  this.editor = editorUI.editor;
  this.graph = editorUI.editor.graph;

  this.editedCells = new Map();
  this.insertedCells = new Map();
  this.deletedCells = new Map();

  this.modeEnabled = false;

  this.setupGraph();
  this.setupListeners();
};

MarksService.prototype.TYPES = {
  POSTER: 0,
  MARK: 1,
};
MarksService.prototype.TYPE_FROM_NAME = {
  ['poster']: 0,
  ['dispatcher_mark']: 1,
};
MarksService.prototype.NAME_FROM_TYPE = {
  0: 'poster',
  1: 'dispatcher_mark',
};
MarksService.prototype.DEFAULT_MODELS = {
  0: function () {
    return {
      createdAt: '',
      createdBy: '',
      data: {
        message: '',
        title: '',
        type: '',
        width: 200,
        height: 100,
        x: 20,
        y: 20,
      },
      id: '',
      modifiedBy: '',
      schemeId: '',
      ts: '',
    };
  },
  1: function () {
    return {
      createdAt: '',
      createdBy: '',
      data: {
        message: '',
        title: '',
        type: 'info',
        width: 100,
        height: 100,
        x: 20,
        y: 20,
      },
      id: '',
      modifiedBy: '',
      schemeId: '',
      ts: '',
    };
  },
};

MarksService.prototype.getCellType = function (cell) {
  const type = this.TYPE_FROM_NAME[cell.value.tagName];
  return type > -1 ? type : -1;
};

MarksService.prototype.getCellStyle = function (type) {
  return this.NAME_FROM_TYPE[type];
};

MarksService.prototype.getCellDefaultModel = function (cell) {
  const type = this.getCellType(cell);
  const model = this.DEFAULT_MODELS[type]();
  model.id = '_' + cell.id;
  return model;
};

MarksService.prototype.setupGraph = function () {
  this.graph.isEnabled = () => this.isEnabled();

  this.graph.panningHandler.usePopupTrigger = false;

  /* disable connection */
  this.graph.connectionHandler.mouseMove = function () {
    return;
  };

  /* disable rotation */
  this.graph.isCellRotatable = function (cell) {
    return false;
  };

  /* disable inserting text action on double click */
  this.graph.dblClick = function () {
    return;
  };

  /* disable connection arrows */
  this.graph.connectionArrowsEnabled = false;

  /* bind the delete key */
  this.ui.keyHandler.bindAction(46, false, 'delete'); // Delete

  /* create new layer ontop for posters and marks */
  this.marksLayer = this.graph.model.getRoot().insert(new mxCell('Плакаты / пометки'));
  this.graph.setDefaultParent(this.marksLayer);
};

MarksService.prototype.setupListeners = function () {
  this.graph.addListener('cellsInserted', (sender, evt) => {
    const cells = evt.getProperty('cells');
    if (Array.isArray(cells)) {
      this.onCellInserted(cells[0]);
    }
  });

  this.graph.addListener(mxEvent.CELLS_MOVED, (sender, evt) => {
    const cells = evt.getProperty('cells');
    if (Array.isArray(cells)) {
      this.onCellsChanged(cells.filter((cell) => cell.value !== ''));
    }
  });

  this.graph.addListener(mxEvent.CELLS_RESIZED, (sender, evt) => {
    const cells = evt.getProperty('cells');
    if (Array.isArray(cells)) {
      this.onCellsChanged(cells.filter((cell) => cell.value !== ''));
    }
  });

  this.graph.addListener(mxEvent.CELLS_REMOVED, (sender, evt) => {
    const cells = evt.getProperty('cells');
    if (Array.isArray(cells)) {
      this.onCellsDeleted(cells);
    }
  });
};

MarksService.prototype.isEnabled = function () {
  // @if !LINKMT
  return this.modeEnabled;
  // @endif
  // @if LINKMT
  return false;
  // @endif
};

MarksService.prototype.resetAndUpdate = function () {
  /* refresh page to clear changes */
  HELP.pageRedirect(HELP.buildUrl('scheme/view', 'id=' + HELP.queryStringParam('id')));
};

MarksService.prototype.onConflict = function () {
  webix
    .modalbox({
      title: 'Возможный конфликт',
      buttons: ['Ок'],
      width: 500,
      text: 'Плакаты и пометки на данной схеме были изменены другим пользователем.\nЧтобы избежать конфликтов, текущие изменения будут отменены.',
    })
    .then(() => {
      this.resetAndUpdate();
    });
};

MarksService.prototype.createSnackBar = function () {
  this.snackBar = webix.ui({
    view: 'toolbar',
    id: 'dispatcher-mode-snackbar',
    css: 'poster-snackbar',
    height: 40,
    paddingX: 8,
    width: 400,
    cols: [
      {
        view: 'label',
        label: 'Режим установки плакатов, пометок',
      },
      {
        view: 'button',
        value: 'common.exit',
        align: 'center',
        css: 'webix_danger',
        width: 100,
        click: () => {
          this.onModeButtonClick();
        },
      },
    ],
  });
};

MarksService.prototype.showSnackbar = function (isVisible) {
  if (!this.snackBar) {
    return;
  }
  const snackNode = this.snackBar.getNode();
  snackNode.style.top = $$('toolbar').$height + 4 + 'px';
  if (isVisible) {
    this.snackBar.show();
  } else {
    this.snackBar.hide();
  }
};

MarksService.prototype.setSnackbarTitle = function () {
  if (!this.snackBar) {
    return;
  }
  const isEdited = this.insertedCells.size + this.editedCells.size + this.deletedCells.size > 0;
  const label = this.snackBar.getChildViews()[0];
  const currentString = label.getValue().length > 0 ? label.getValue() : label.config.label;
  const originString = currentString.charAt(currentString.length - 1) === '*' ? currentString.slice(0, -1) : currentString;
  if (isEdited) {
    label.setValue(originString + ' *');
  } else {
    label.setValue(originString);
  }
};

MarksService.prototype.onCellInserted = function (cell) {
  /* return if cell inserted from hub */
  if (cell._fromHub) {
    delete cell._fromHub;
    return;
  }
  /* add model for new cell */
  cell._model = this.getCellDefaultModel(cell);
  this.ui.viewHandler.scripts.setup(cell);
  cell._tempInsert = true;
  /* add cell to temp list */
  this.insertedCells.set(cell._model.id, cell);
  /* open properties window */
  const type = this.getCellType(cell);
  if (type === this.TYPES.POSTER) {
    API.POSTERS.openPosterEditor(this.graph, cell, true);
  } else if (type === this.TYPES.MARK) {
    API.DISPATCHER_MARKS.openMarkEditor(this.graph, cell, true);
  }
  /* update snack bar title */
  this.setSnackbarTitle();
};

MarksService.prototype.onCellsChanged = function (cells) {
  cells.forEach((cell) => {
    /* return if cell updated from hub */
    if (cell._fromHub) {
      delete cell._fromHub;
      return;
    }
    /* update geometry in poster model */
    const geometry = cell.getGeometry();
    cell._model.data.x = geometry.x;
    cell._model.data.y = geometry.y;
    cell._model.data.width = geometry.width;
    cell._model.data.height = geometry.height;
    /* manage temp lists */
    if (this.insertedCells.has(cell._model.id)) {
      this.insertedCells.set(cell._model.id, cell);
    } else {
      this.editedCells.set(cell._model.id, cell);
    }
    /* update children cell geometry */
    if (cell.children) {
      const childCell = cell.children[0];
      const childGeometry = new mxGeometry(0, 0, geometry.width, geometry.height);
      this.graph.getModel().setGeometry(childCell, childGeometry);
    }
  });

  /* update snack bar title */
  this.setSnackbarTitle();
};

MarksService.prototype.onCellsDeleted = function (cells) {
  cells.forEach((cell) => {
    /* manage temp lists */
    this.insertedCells.delete(cell._model.id);
    this.editedCells.delete(cell._model.id);
    /* check if cell was not temporary for inserting process or deleted from hub */
    if (!cell._tempInsert && !cell._fromHub) {
      this.deletedCells.set(cell._model.id, cell);
      this.ui.viewHandler.cellMap.delete(cell._model.id);
    } else {
      delete cell._tempInsert;
      delete cell._fromHub;
    }
  });
  /* update snack bar title */
  this.setSnackbarTitle();
};

MarksService.prototype.updatePosterLayer = function () {
  /* lock or unlock other layers */
  const layerCount = this.graph.model.getChildCount(this.graph.model.root);
  for (let i = 0; i < layerCount; i++) {
    /* get the layer */
    const layer = this.graph.model.getChildAt(this.graph.model.root, i);
    /* check if this layer is not the marks layer */
    if (layer.mxObjectId === this.marksLayer.mxObjectId) continue;
    /* set locked style */
    this.graph.model.beginUpdate();
    try {
      this.graph.setCellStyles('locked', null, [layer]);
      this.graph.setCellStyles('locked', '1', [layer]);
    } finally {
      this.graph.model.endUpdate();
    }
  }
};

MarksService.prototype.toggleMode = function () {
  if (!this.modeEnabled) {
    this.insertedCells.clear();
    this.editedCells.clear();
    this.deletedCells.clear();
  }
  /* CREATE */
  if (this.modeEnabled && this.insertedCells.size > 0) {
    const postersData = [];
    const dispatcherMarksData = [];
    const tempCells = []; // need this because insertedCells is a map

    /* fill data arrays */
    this.insertedCells.forEach((cell) => {
      const type = this.getCellType(cell);
      if (type === this.TYPES.POSTER) {
        postersData.push(cell._model.data);
      } else if (type === this.TYPES.MARK) {
        dispatcherMarksData.push(cell._model.data);
      }
      tempCells.push(cell);
    });

    /* POST to server */
    if (postersData.length > 0) {
      AJAX.post(
        'api/scheme/posters',
        //--->fix---//
         null,
         //'schemeId=' + viewer.scheme.id,
        //--->fix---//
        postersData,
        (xhr, res) => {},
        // (xhr, err) => messageError('Ошибка сохранения.')
        (xhr, err) => console.log('Ошибка сохранения.')
       
      );
    }
    if (dispatcherMarksData.length > 0) {
      AJAX.post(
        'api/scheme/marks',
       //--->fix---//
       null,
       //'schemeId=' + viewer.scheme.id,
      //--->fix---//
        dispatcherMarksData,
        (xhr, res) => {},
        // (xhr, err) => messageError('Ошибка сохранения.')
        (xhr, err) => console.log('Ошибка сохранения.')
      );
    }

    /* new cells will be inserted from hub event, so we need to remove temp cells */
    try {
      this.graph.model.beginUpdate();
      this.graph.removeCells(tempCells);
    } finally {
      this.graph.model.endUpdate();
      this.insertedCells.clear();
    }
  }

  /* UPDATE */
  if (this.modeEnabled && this.editedCells.size > 0) {
    const posters = [];
    const dispatcherMarks = [];

    this.editedCells.forEach((cell) => {
      const type = this.getCellType(cell);
      if (type === this.TYPES.POSTER) {
        posters.push(cell._model);
      } else if (type === this.TYPES.MARK) {
        dispatcherMarks.push(cell._model);
      }
    });

    /* PATCH to server */
    if (posters.length > 0) {
      AJAX.patch(
        'api/scheme/posters',
        //--->fix---//
        null,
        //'schemeId=' + viewer.scheme.id,
       //--->fix---//
        posters,
        (xhr, res) => {},
        // (xhr, err) => messageError('Ошибка сохранения.')
        (xhr, err) => console.log('Ошибка сохранения.')
      );
    }
    if (dispatcherMarks.length > 0) {
      AJAX.patch(
        'api/scheme/marks',
        //--->fix---//
        null,
        //'schemeId=' + viewer.scheme.id,
       //--->fix---//
        dispatcherMarks,
        (xhr, res) => {},
        //(xhr, err) => messageError('Ошибка сохранения.')
        (xhr, err) => console.log('Ошибка сохранения.')
      );
    }

    /* cells will be updated from hub event */
    this.editedCells.clear();
  }

  /* DELETE */
  if (this.modeEnabled && this.deletedCells.size > 0) {
    const postersIds = [];
    const dispatcherMarksIds = [];

    this.deletedCells.forEach((cell) => {
      const type = this.getCellType(cell);
      if (type === this.TYPES.POSTER) {
        postersIds.push(cell._model.id);
      } else if (type === this.TYPES.MARK) {
        dispatcherMarksIds.push(cell._model.id);
      }
    });

    /* DELETE to sever */
    if (postersIds.length > 0) {
      AJAX.delete(
        'api/scheme/posters',
       //--->fix---//
       null,
       //'schemeId=' + viewer.scheme.id,
      //--->fix---//
        postersIds,
        (xhr, res) => {
          if (res.posters.length > 0) {
            res.posters.forEach((poster) => {
              this.ui.viewHandler.cellMap.delete(poster.id);
            });
          }
        },
        //(xhr, err) => messageError('Ошибка сохранения.')
        (xhr, err) => console.log('Ошибка сохранения.')
      );
    }
    if (dispatcherMarksIds.length > 0) {
      AJAX.delete(
        'api/scheme/marks',
       //--->fix---//
       null,
       //'schemeId=' + viewer.scheme.id,
      //--->fix---//
        dispatcherMarksIds,
        (xhr, res) => {
          if (res.dispatcherMarks.length > 0) {
            res.dispatcherMarks.forEach((mark) => {
              this.ui.viewHandler.cellMap.delete(mark.id);
            });
          }
        },
        //(xhr, err) => messageError('Ошибка сохранения.')
        (xhr, err) => console.log('Ошибка сохранения.')
      );
    }

    /* cells will be deleted from hub event */
    this.deletedCells.clear();
  }

  /* change mode */
  this.modeEnabled = !this.modeEnabled;

  /* show sidebar panel */
  if (!this.sidebarWindow) {
    this.sidebarWindow = new SidebarWindow(this.ui, 256, 256, 170, 101);
    this.sidebarWindow.window.setClosable(false);
    this.sidebarWindow.window.setResizable(false);
  } else {
    this.sidebarWindow.window.setVisible(this.modeEnabled);
  }

  /* reset selection */
  this.graph.selectionModel.removeCells(this.graph.selectionModel.cells);

  /* lock or unlock other layers */
  const layerCount = this.graph.model.getChildCount(this.graph.model.root);
  for (let i = 0; i < layerCount; i++) {
    /* get the layer */
    const layer = this.graph.model.getChildAt(this.graph.model.root, i);
    /* check if this layer is not the marks layer */
    if (layer.mxObjectId === this.marksLayer.mxObjectId) continue;
    /* set locked style */
    this.graph.model.beginUpdate();
    try {
      this.graph.setCellStyles('locked', this.modeEnabled ? '1' : null, [layer]);
    } finally {
      this.graph.model.endUpdate();
    }
  }

  /* show snackbar */
  if (!this.snackBar) {
    this.createSnackBar();
  }
  this.showSnackbar(this.modeEnabled);
};

MarksService.prototype.onModeButtonClick = function () {
  const title = 'Редактирование плакатов и пометок';
  const entryMessage = this.modeEnabled ? 'Выйти из режима редактирования?' : 'Войти в режим редактирования?';
  webix
    .modalbox({
      type: 'alert-warning',
      title,
      buttons: ['common.yes', 'common.no'],
      width: 'auto',
      text: entryMessage,
    })
    .then((result) => {
      if (result !== '0') {
        return;
      } else if (!this.modeEnabled) {
        this.toggleMode();
      } else {
        webix
          .modalbox({
            type: 'alert-warning',
            title,
            buttons: ['common.yes','common.no'],
            width: 'auto',
            text: 'Сохранить внесенные изменения?',
          })
          .then((result) => {
            if (result === '0') {
              this.toggleMode();
            } else {
              this.resetAndUpdate();
            }
          });
      }
    });
};

MarksService.prototype.addCells = function (items, type) {
  if (!Array.isArray(items)) return;

  if (this.modeEnabled) {
    this.onConflict();
    return;
  }

  this.graph.stopEditing();

  this.graph.model.beginUpdate();
  try {
    items.forEach((item) => {
      const cell = this.graph.insertVertex(this.marksLayer, null, null, Math.round(item.data.x), Math.round(item.data.y), Math.round(item.data.width), Math.round(item.data.height), this.getCellStyle(type));

      cell._model = item;

      if (!cell) return;

      // find scriptor
      this.ui.viewHandler.scripts.setup(cell);
      if (cell.scriptor == null) return;

      // save original cell params for dynamic changes
      if (cell.origin == null) {
        cell.origin = {};
        cell.origin.style = this.graph.getCellStyle(cell);
        cell.origin.state = this.graph.view.getState(cell, true).clone();
        const geometry = this.graph.getCellGeometry(cell);
        cell.origin.geometry = geometry != null ? geometry.clone() : null;
      }

      // cell binding map
      if (cell.bindingMap == null) cell.bindingMap = {};

      const map = { tag: [], eq: [] };
      cell.scriptor.visit(cell, map);

      // process binding
      if (this.ui.viewHandler.names.indexOf(item.id) < 0) this.ui.viewHandler.names.push(item.id);

      this.ui.viewHandler.updateCellMapping(cell, item.id);
      this.ui.viewHandler.updateBindMapping(cell, item.id);

      this.graph.view.invalidate(cell, true);
    });
  } finally {
    this.graph.model.endUpdate();
  }
};

MarksService.prototype.updateCells = function (item, type) {
  if (this.modeEnabled) {
    this.onConflict();
    return;
  }

  const targetCells = this.ui.viewHandler.findMappedCells(item.id);
  targetCells.forEach((targetCell) => {
    targetCell._fromHub = true; // custom source property for update cell event handler
    const bounds = new mxRectangle(item.data.x, item.data.y, item.data.width, item.data.height);
    this.graph.resizeCells([targetCell], [bounds]);
    targetCell.scriptor.state(targetCell, null, item);
  });
  /* add new item if cell was deleted in editing mode */
  if (targetCells.length === 0 && this.deletedCells.has(item.id)) {
    this.addCells([item], type);
    this.deletedCells.delete(item.id);
  }
};

MarksService.prototype.removeCells = function (item) {
  if (this.modeEnabled) {
    this.onConflict();
    return;
  }

  const targetCells = this.ui.viewHandler.findMappedCells(item.id);
  targetCells.forEach((cell) => (cell._fromHub = true)); // custom source property for CELLS_REMOVED event handler
  this.graph.removeCells(targetCells);
  this.ui.viewHandler.cellMap.delete(item.id);
};

MarksService.prototype.addPosters = function (posters) {
  this.addCells(posters, this.TYPES.POSTER);
};

MarksService.prototype.updatePoster = function (poster) {
  this.updateCells(poster, this.TYPES.POSTER);
};

MarksService.prototype.removePoster = function (poster) {
  this.removeCells(poster);
};

MarksService.prototype.addDispatcherMarks = function (marks) {
  this.addCells(marks, this.TYPES.MARK);
};

MarksService.prototype.updateDispatcherMark = function (mark) {
  this.updateCells(mark, this.TYPES.MARK);
};

MarksService.prototype.removeDispatcherMark = function (mark) {
  this.removeCells(mark);
};

  MarksService.prototype.fetchPosters = function () {
    //---->fix<--------//
    AJAX.get(
      null,
      null,
      (xhr, res) => {
      //render posters 
      res = {
        "posters": [
          {
            "id": "277972a7-96c2-4c1d-9af7-b7dbbbc7573f",
            "data": {
              "title": "2",
              "message": "2",
              "type": "grounded",
              "x": 590.5,
              "y": 596.0,
              "width": 194.0,
              "height": 98.0
            },
            "schemeId": "2251b1c0-f0a3-4979-99c3-caa251ff3cd2",
            "modifiedBy": "система",
            "createdBy": "система",
            "ts": "2023-07-21T13:32:10.3376830Z",
            "createdAt": "2023-07-21T13:32:10.3376830Z",
            "isRemoved": false
          },
          {
            "id": "7404ab0f-b86e-4147-b074-235d025337b5",
            "data": {
              "title": "1",
              "message": "",
              "type": "workOnLine",
              "x": 313.0,
              "y": 469.0,
              "width": 141.0,
              "height": 71.0
            },
            "schemeId": "2251b1c0-f0a3-4979-99c3-caa251ff3cd2",
            "modifiedBy": "система",
            "createdBy": "система",
            "ts": "2023-07-21T13:32:10.4776802Z",
            "createdAt": "2023-07-20T11:11:50.6344934Z",
            "isRemoved": false
          },
          {
            "id": "818cc327-bb3a-4724-a6a5-77ca72e07ce4",
            "data": {
              "title": "3",
              "message": "3",
              "type": "workUnderVoltage-transit",
              "x": 559.5,
              "y": 320.5,
              "width": 171.0,
              "height": 86.0
            },
            "schemeId": "2251b1c0-f0a3-4979-99c3-caa251ff3cd2",
            "modifiedBy": "система",
            "createdBy": "система",
            "ts": "2023-07-21T13:32:10.5847440Z",
            "createdAt": "2023-07-21T13:32:10.5847440Z",
            "isRemoved": false
          }
        ]
      }
        if (Array.isArray(res.posters)) {
          this.addPosters(res.posters);
        } else {
          console.log('Ошибка получения плакатов')
          // messageError('Ошибка получения плакатов');
        }
        /* if we have poster id in query */
        const posterId = HELP.queryStringParam('poster');
        const cells = posterId ? this.ui.viewHandler.cellMap.get(posterId) : null;
        if (Array.isArray(cells) && cells.length > 0) {
          this.graph.addSelectionCells(cells);
          API.POSTERS.openPosterViewer(cells[0]._model, this.graph, cells[0]);
        }
      },
      // (xhr, err) => messageError('Ошибка получения плакатов')
      (xhr, err) => console.log('Ошибка получения плакатов')
    );
     //---->fix<--------//
  };


MarksService.prototype.fetchMarks = function () {
   //---->fix<--------//
  AJAX.get(
    null,
    null,
    (xhr, res) => {
      /* render marks */
        res = {
        dispatcherMarks:[
          {
            "id": "decbc6fd-0bd1-4ea2-8219-79b0728bf60c",
            "data": {
                "title": "1",
                "message": "1",
                "number": "",
                "type": "portableGrounding",
                "x": 891,
                "y": 583,
                "width": 124,
                "height": 124
            },
            "schemeId": "2251b1c0-f0a3-4979-99c3-caa251ff3cd2",
            "modifiedBy": "система",
            "createdBy": "система",
            "ts": "2023-07-21T13:32:10.3532889Z",
            "createdAt": "2023-07-21T13:32:10.3532889Z",
            "isRemoved": false
        },
        {
          "id": "3bcb8734-11d0-47d0-bd71-3b4ae0ef5fc9",
          "data": {
              "title": "1",
              "message": "",
              "number": "",
              "type": "info",
              "x": 822.5,
              "y": 344.5,
              "width": 200,
              "height": 200
          },
          "schemeId": "2251b1c0-f0a3-4979-99c3-caa251ff3cd2",
          "modifiedBy": "система",
          "createdBy": "система",
          "ts": "2023-07-21T13:32:10.5261483Z",
          "createdAt": "2023-07-20T11:11:50.6494786Z",
          "isRemoved": false
      },
      {
        "id": "7a1d9e14-29ba-4ba8-a529-ea4683526f53",
        "data": {
            "title": "2",
            "message": "2",
            "number": "",
            "type": "relayProtection",
            "x": 1035,
            "y": 263.5,
            "width": 125,
            "height": 125
        },
        "schemeId": "2251b1c0-f0a3-4979-99c3-caa251ff3cd2",
        "modifiedBy": "система",
        "createdBy": "система",
        "ts": "2023-07-21T13:32:10.5867107Z",
        "createdAt": "2023-07-21T13:32:10.5867107Z",
        "isRemoved": false
    }
        ]
      }
      if (Array.isArray(res.dispatcherMarks)) {
        this.addDispatcherMarks(res.dispatcherMarks);
      } else {
        console.log('Ошибка получения пометок')
        // messageError('Ошибка получения пометок');
      }
      /* if we have mark id in query */
      const markId = HELP.queryStringParam('mark');
      const cells = markId ? this.ui.viewHandler.cellMap.get(markId) : null;
      if (Array.isArray(cells) && cells.length > 0) {
        this.graph.addSelectionCells(cells);
        API.DISPATCHER_MARKS.openMarkViewer(cells[0]._model, this.graph, cells[0]);
      }
    },
    // (xhr, err) => messageError('Ошибка получения пометок')
    (xhr, err) => console.log('Ошибка получения пометок')
  );
   //---->fix<--------//
};