

import * as mxgraph from 'mxgraph';
import { HELP, isNullOrEmpty } from './client'
import ScriptHandler from './Scripts';
import Chart from "chart.js"
let { 
    mxGraphModel, 
    mxUtils, 
    mxConstants,
    mxPopupMenu,
    mxCell,
    mxEventSource,
    mxCellTracker,
    mxCodecRegistry,

} = mxgraph();
/**
 * View mode logic
 */
export default function ViewModeHandler (editorUI)
{
    mxEventSource.call(this);

    this.ui      = editorUI;
    this.marksService = editorUI.marksService;
    this.editor  = this.ui.editor;
    this.graph   = this.editor.graph;
    this.model   = this.graph.getModel();
    this.scripts = new ScriptHandler(this.ui);
    this.init();

// @if !LINKMT
    this.marksService.fetchPosters();
    this.marksService.fetchMarks();
    
    // @endif
   
};
mxUtils.extend(ViewModeHandler, mxEventSource);

ViewModeHandler.prototype.init = function()
{
    this.createMenubar();
    const _marksService = this.marksService;
    // Highlight cell in view mode
    const tracker = new mxCellTracker(this.graph, '#060606', function (me)
    {
        const specialElements = ["poster", "dispatcher_mark"];
        const cell = me.getCell();

        /* disable when dispatcher editing enabled */
        if (_marksService.isEnabled()) {
            const cellState = cell ? this.graph.view.getState(cell) : null;
            if (cellState && !specialElements.includes(cell.value.tagName)) {
                cellState.setCursor("default");
            }
            return null;
        }

        /* detect mouse enter on cell */
        if (cell != this._cell)
        {
            this._cell = cell;

            if (this._cell != null)
            {
                /* mouse entered on cell */
                /* hack for special elements highligt render */
                if (specialElements.includes(cell.value.tagName)) {
                    cell._isHighlightRender = true;
                }
            }
        }

        if (cell != null) 
        {
            if (cell.commands != null || cell.action != null || specialElements.includes(cell.value.tagName))
            {
                let cellState = this.graph.view.getState(cell);
                if (cellState == null) {
                    return null;
                }
                cellState.setCursor(mxConstants.CURSOR_CONNECT);
                return cell;
            }

            let parent = cell.getParent();
            if (parent != null && (parent.commands != null || parent.action != null))
            {
                let cellState = this.graph.view.getState(parent);
                if (cellState == null) {
                    return null;
                }
                cellState.setCursor(mxConstants.CURSOR_CONNECT);
                return cell;
            }
        }
        return null;
    });

    // Open outline window
    //var outlineAction = this.ui.actions.get('outline');
    //if (outlineAction)
    //    outlineAction.funct();

    mxPopupMenu.prototype.useLeftButtonForPopup = true;

    // Ignores canvas in codecs
    mxCell.prototype.mxTransient.push('chart', 'canvas', 'onBindingsUpdated');
    mxCodecRegistry.getCodec(mxCell).exclude.push('chart', 'canvas', 'onBindingsUpdated');
    mxCodecRegistry.getCodec(mxGraphModel).exclude.push('chart', 'canvas', 'onBindingsUpdated');

    Chart.defaults.global.animation.duration = 0;
    Chart.defaults.global.hover.animationDuration = 0;
    Chart.defaults.global.responsiveAnimationDuration = 0;
    Chart.defaults.global.tooltips.enabled = false;

    this.names   = [];          // tag names
    this.links   = {};          // equipmentID   <--> items's  map
    this.cellMap = new Map();   // binding value <--> cell map


    const cells = this.getSchemeCells();

    for (let i = 0; i < cells.length; i++)
    {
        let cell = cells[i];
        if (!cell)
            continue;

        // find scriptor
        this.scripts.setup(cell);
        if (cell.scriptor == null)
            continue;
        // save original cell params for dynamic changes
        if (cell.origin == null)
        {
            cell.origin = {};
            cell.origin.style = this.graph.getCellStyle(cell);
            cell.origin.state = this.graph.view.getState(cell, true).clone();
            let geom = this.graph.getCellGeometry(cell);
            cell.origin.geometry = geom != null ? geom.clone() : null;
        }
        
        // cell binding map
        if (cell.bindingMap == null)
            cell.bindingMap = {};

        let map = { tag: [], eq: [] };
        cell.scriptor.visit(cell, map);

        // process tags
        if (map.tag.length > 0)
        {
            for (let j = 0; j < map.tag.length; j++)
            {
                let bindValue = map.tag[j].id;
                if (this.names.indexOf(bindValue) < 0)
                    this.names.push(bindValue);
                this.updateCellMapping(cell, bindValue);
                this.updateBindMapping(cell, bindValue);
            }
        }
        // process equipments
        if (map.eq.length > 0)
        {
            for (let j = 0; j < map.eq.length; j++)
            {
                let bindValue = map.eq[j].id;
                let eqID = map.eq[j].parent;
                eqID = !isNullOrEmpty(eqID) ? eqID : bindValue;
                // update equipments map
                let eq_mapping = this.links[eqID] || [];
                if (eq_mapping.indexOf(bindValue) < 0)
                    eq_mapping.push(bindValue);
                this.links[eqID] = eq_mapping;
                this.updateCellMapping(cell, bindValue);
                this.updateBindMapping(cell, bindValue);
            }
        }

        this.graph.view.invalidate(cell, true);
    }

    this.findMappedCells = mxUtils.bind(this, function (link)
    {
        return this.cellMap.get(link) || [];
    });
    this.dataProcessor = mxUtils.bind(this, function (cell, item, initial)
    {
        this.proceessDataItem(cell, item, initial);
    });

    this.graph.view.validate();

    this.initialization = true;
    this.setupHubs();
};

ViewModeHandler.prototype.createMenubar = function ()
{
};

ViewModeHandler.prototype.updateBindMapping = function (cell, value)
{
    cell.bindingMap[value] = cell.bindingMap[value] || [];
    let bindings = cell.getBindingsByID(value);
    bindings.forEach(function (b)
    {
        if (cell.bindingMap[value].indexOf(b) < 0)
            cell.bindingMap[value].push(b);
    });
}

ViewModeHandler.prototype.updateCellMapping = function (cell, value)
{
    var mapping = this.cellMap.get(value) || [];
    if (!mapping.find(function (c) { return c.id == cell.id; }))
        mapping.push(cell);
    this.cellMap.set(value, mapping);
};

ViewModeHandler.prototype.setupHubs = function ()
{
    //------>fix<------//
    const template = {}
    template.setupHubConnection = function (){

    }
      //------>fix<------//
    if (template)
    {
        // tags
        if (!this.tagsHub)
        {
            template.setupHubConnection('tagsHub', mxUtils.bind(this, function (tagsHubProxy)
            {
                if (tagsHubProxy != null)
                {
                    tagsHubProxy.onHubConnectionSuccess = mxUtils.bind(this, this.onTagsHubConnect);

                    this.tagsHubHandler = mxUtils.bind(this, this.tagsChanged);
                    tagsHubProxy.on('updateData', this.tagsHubHandler);

                    this.tagsHub = tagsHubProxy;
                }
            }));
        }

        // scheme hub
        if (!this.schemeHub)
        {
            template.setupHubConnection('schemeHub', mxUtils.bind(this, function (schemeHubProxy)
            {
                if (schemeHubProxy != null)
                {
                    schemeHubProxy.initialization = true;
                    //schemeHubProxy.state.links = this.links;

                    schemeHubProxy.onHubConnectionSuccess = mxUtils.bind(this, this.onSchemeHubConnect);

                    this.schemeHubHandler = mxUtils.bind(this, this.schemeDataChanged);
                    this.posterEventHandler = mxUtils.bind(this, this.posterDataChanged);
                    this.dispatcherMarkEventHandler = mxUtils.bind(this, this.dispatcherMarkDataChanged);

                    schemeHubProxy.on('updateData', this.schemeHubHandler);
                    schemeHubProxy.on('posterEvent', this.posterEventHandler);
                    schemeHubProxy.on('dispatcherMarkEvent', this.dispatcherMarkEventHandler);

                    this.schemeHub = schemeHubProxy;
                }
            }));
        }
    }
};
ViewModeHandler.prototype.onTagsHubConnect = function ()
{
    if (this.tagsHub != null)
    {
        var self = this;

        const tagsFilter = {
            tags: this.names,
        };
        
        this.tagsHub.invoke('setup', tagsFilter)
            .then(function (data)
            {
                if (data)
                    self.tagsHubHandler(data, self.tagsHub.initialization);
            })
            .catch(function (err)
            {
                HELP.log('tagsHub.server.setup(): ' + err);
            })
            .finally(function ()
            {
                self.tagsHub.initialization = false;
            });
    }
};
ViewModeHandler.prototype.onSchemeHubConnect = function ()
{
    if (this.schemeHub != null)
    {
        var self = this;
        const payload = {
            filter: this.links,
            schemeId: this.ui.scheme.id,
        };
        this.schemeHub.invoke('setup', payload)
            .then(function (data)
            {
                if (data)
                    self.schemeHubHandler(data, self.schemeHub.initialization);
            })
            .catch(function (err)
            {
                HELP.log('schemeHub.server.setup(): ' + err);
            })
            .finally(function ()
            {
                self.schemeHub.initialization = false;
            });
    }
};

ViewModeHandler.prototype.tagsChanged = function (data, initial)
{
    if (data && data.length > 0)
    {
        this.model.beginUpdate();
        try
        {
            for (let i = 0; i < data.length; i++)
            {
                let item = data[i];
                if (item != null)
                {
                    // save equipment ID
                    item.id = item.n;
                    //HELP.log(item.n + ' => ' + API.FORMAT.getRawTimestamp(item.ts));
                    let targetCells = this.findMappedCells(item.id);
                    if (targetCells.length > 0)
                    {
                        for (let j = 0; j < targetCells.length; j++)
                            this.dataProcessor(targetCells[j], item, initial);
                    }
                }
            }
        }
        finally
        {
            this.model.endUpdate();
        }
    }
};
ViewModeHandler.prototype.schemeDataChanged = function (respData, initial)
{
    if (!respData)
        return;
    
    const data = Array.isArray(respData) ? respData : [respData];

    if (data && data.length > 0)
    {
        this.model.beginUpdate();
        try
        {
            for (let i = 0; i < data.length; i++)
            {
                var item = data[i];
                if (item != null)
                {
                    let eqItems = item.data;
                    if (eqItems && eqItems.length > 0)
                    {
                        for (let k = 0; k < eqItems.length; k++)
                        {
                            // save equipment ID
                            eqItems[k].eq = item.id;
                            //HELP.log(eqItems[k].n + ' => ' + API.FORMAT.getRawTimestamp(eqItems[k].ts));
                            let targetCells = this.findMappedCells(eqItems[k].id);
                            if (targetCells.length > 0)
                            {
                                for (let j = 0; j < targetCells.length; j++)
                                    this.dataProcessor(targetCells[j], eqItems[k], initial);
                            }
                        }
                    }
                }
            }
        }
        finally
        {
            this.model.endUpdate();
        }
    }
};
ViewModeHandler.prototype.posterDataChanged = function (eventType, poster)
{
    if (!poster) {
        return;
    }

    switch (eventType) {
        case 0: // created
            this.marksService.addPosters([poster]);
            break;
        case 1: // updated
            this.marksService.updatePoster(poster);
            break;
        case 2: // deleted
            this.marksService.removePoster(poster);
            break;
        default:
            return;
    }
};
ViewModeHandler.prototype.dispatcherMarkDataChanged = function (eventType, dispatcherMark)
{
    if (!dispatcherMark) {
        return;
    }

    switch (eventType) {
        case 0: // created
            this.marksService.addDispatcherMarks([dispatcherMark]);
            break;
        case 1: // updated
            this.marksService.updateDispatcherMark(dispatcherMark);
            break;
        case 2: // deleted
            this.marksService.removeDispatcherMark(dispatcherMark);
            break;
        default:
            return;
    }
};
ViewModeHandler.prototype.getSchemeCells = function ()
{
    if (this.graph == null)
        return [];
    var filter = mxUtils.bind(this, function (cell)
    {
        return !this.model.isLayer(cell) && !this.model.isRoot(cell);
    });
    return this.model.filterDescendants(filter);
};
ViewModeHandler.prototype.proceessDataItem = function (cell, item, initial)
{
    // изменение тега / equipment
    let bindID = item.id;
    if (bindID)
    {
        let bindings = cell.bindingMap[bindID] || [];
        if (bindings.length > 0)
        {
            for (let i = 0; i < bindings.length; i++)
            {
                bindings[i].initial = initial;
                cell.scriptor.exec(cell, bindings[i], item);
            }
        }
    }
};
ViewModeHandler.prototype.destroy = function ()
{
    this.tagsHub?.stop();
    this.schemeHub?.stop();
};
