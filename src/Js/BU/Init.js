import { $ } from 'jquery';
// import { API } from './scada'
import { isNullOrEmpty, isDefined } from './client';
import * as mxgraph from 'mxgraph';
let { 
    
    mxGraphModel, 
    mxClient, 
    mxUtils, 
    mxConstants,
    mxImage,
    mxEvent,
    mxPopupMenu,
    mxConstraintHandler,
    mxCell,
    mxWindow,
    mxObjectCodec,
    mxCodecRegistry,
    mxGenericChangeCodec,
  
} = mxgraph();


// Workaround for allowing target="_blank" in HTML sanitizer
// see https://code.google.com/p/google-caja/issues/detail?can=2&q=&colspec=ID%20Type%20Status%20Priority%20Owner%20Summary&groupby=&sort=&id=1296
//---fix---//
// if (typeof html4 !== 'undefined')
// {
//     html4.ATTRIBS["a::target"] = 0;
//     html4.ATTRIBS["source::src"] = 0;
//     html4.ATTRIBS["video::src"] = 0;
//     // Would be nice for tooltips but probably a security risk...
//     //html4.ATTRIBS["video::autoplay"]   = 0;
//     //html4.ATTRIBS["video::autobuffer"] = 0;
//// }
//---fix---//
// define API
//---fix---//
// API.FUNC.schemeEqView     = "/equipments/view";
// API.FUNC.schemeExecCmd    = API.PREFIX + "scheme/execCmd";
// API.FUNC.schemeEquipments = API.PREFIX + "scheme/equipments";
//---fix---//
// Fixes possible clipping issues in Chrome
mxClient.NO_FO = true;

// Changes default colors
mxConstants.SHADOW_OPACITY      = 0.5;
mxConstants.SHADOWCOLOR         = '#c0c0c0';
mxConstants.SHADOW_OFFSET_X     = 4;
mxConstants.SHADOW_OFFSET_Y     = 4;
mxConstants.DEFAULT_FONTSIZE    = 14;
mxConstants.DEFAULT_FONTFAMILY  = "'PT Sans'";
mxConstants.EDGESTYLE_ISOMETRIC = 'isometricEdgeStyle';
mxConstants.STYLE_CONNECTABLE   = 'connectable';

mxUtils.errorImage       = 'data:image/gif;base64,R0lGODlhEAAQAPcAAADGAIQAAISEhP8AAP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yH5BAEAAAAALAAAAAAQABAAAAhoAAEIFBigYMGBCAkGGMCQ4cGECxtKHBAAYUQCEzFSHLiQgMeGHjEGEAAg4oCQJz86LCkxpEqHAkwyRClxpEyXGmGaREmTIsmOL1GO/DkzI0yOE2sKIMlRJsWhCQHENDiUaVSpS5cmDAgAOw==';
mxUtils.transparentImage = 'data:image/gif;base64,R0lGODlhMAAwAIAAAP///wAAACH5BAEAAAAALAAAAAAwADAAAAIxhI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8egpAAA7';

mxConstraintHandler.prototype.pointImage = new mxImage('data:image/gif;base64,R0lGODlhBQAFAJECAAAA/////////wAAACH5BAEAAAIALAAAAAAFAAUAAAIIRBSml7yGQAEAOw==', 5, 5);

mxPopupMenu.prototype.zIndex = 100;
mxPopupMenu.prototype.submenuImage = 'data:image/gif;base64,R0lGODlhCQAJAIAAAP///zMzMyH5BAEAAAAALAAAAAAJAAkAAAIPhI8WebHsHopSOVgb26AAADs=';

mxWindow.prototype.closeImage     = 'data:image/gif;base64,R0lGODlhDAAMAIAAAP///0RERCH5BAAAAAAALAAAAAAMAAwAAAIdjI8Hy23w2JtR1bQiVDlIvnVIt3llqKFm4yRuUAAAOw==';
mxWindow.prototype.minimizeImage  = 'data:image/gif;base64,R0lGODlhDAAMAIAAAERERP///yH5BAAAAAAALAAAAAAMAAwAAAIXhI8Xy20Nw4tsUgnuspTHlyhgmHkQGRYAOw==';
mxWindow.prototype.maximizeImage  = 'data:image/gif;base64,R0lGODlhDAAMAPcAAP///0RERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIMAADCBxIcCCAgwgTCgRQ0ODChg8DMEx4UOJDihMvUrRoESPHiRsZcmwoEqNCiAUDAgA7';
mxWindow.prototype.normalizeImage = 'data:image/gif;base64,R0lGODlhDAAMAPcAAP///0RERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAADAAMAAAIMgADCBxIcCCAgwgTCkRYMACAhQcbPnQYUeHEiQQfXmy4sKPFiA4pVgSJ0SDJhCg5NgwIADs=';
mxWindow.prototype.resizeImage    = 'data:image/gif;base64,R0lGODlhDAAMAJECAP///4CAgNTQyAAAACH5BAEAAAIALAAAAAAMAAwAAAIblI8CmRB83IMSqvBWw3dnHnFV+GVGhZZXmaoFADs=';

// custom images
mxConstants.PICTURE_IMAGE = 'data:image/png,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfjCw8MAR6ZuReNAAABuElEQVRIx8XVv2sTcRzG8VfkxNbBpbjULqUOLv5a/IGgkwQHJ3WwTWc3oU7iojiJ/0GGqtRChw4qilBQURBcBGk6tVRB0QppUSzUSC/ydUjz45KmzWXxuenueN7Pc5877gM5c2Ih5RErGCGS89CiCWXpFDltkoyCXoeUUtqh15w1YuNdmCsaF0eipvJ9jln3zu8OAGXRjsSFjJu+ee6Fr0Y7K5EEjLnlvVFXLHsg2xkiyNfmuqJgJ9hrxdttvXmhscGAPo/FYNlrR9M+wqpgoAH3My3gh5dyziPjmuOm086A/ZYEnywJPtiTdgYsOuKu7xZcd8pqi+GsKf1bNdhaWSXBgn3tG2ylc54oGjPoVbJFZw2ySr4YwgXrtRZ5IQnoccOBTdP/+Gxw4+yS2Lz+VsAuzwRFB9umV1VtkQD0mBHc86sJkUyv6qLYvKd1QCX9Dk4mEK3pjS1CFVC3SyDa2+sIwYQZwe2GWxXE1U3LN+p+BfC3yV5FhG3stbfQaocTprax1wCPdKuNT7nYNUDzP/H/AMqirt2RcmW1He5ojTRrt4K1jBGTPnrTxXI9Y8gwDJvtar3Pusw/AuXdyJGME8cAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMTEtMTVUMTI6MDE6MzArMDA6MDAHdoikAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTExLTE1VDEyOjAxOjMwKzAwOjAwdiswGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAASUVORK5CYII=';
mxConstants.SOUND_IMAGE   = 'data:image/png,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J / AAAABGdBTUEAALGPC / xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfjCw8LOjhySWvNAAACKElEQVRIx7WUTUhUURTHf9ZMGNNkoTaUlvWkpdpQaZQLiQirhRRhMBTRRqn1tKqgVYQE0XfkooKiRWAhCIqRJtMDPxYyfdBCEstRM + gDRmZ4mK + Fdy73zXvz3qR07ubc887 / d8 + 53Hfgv1vpcsQbiWEyRFHulBUu8hoGWaCKEE1LATQywFsO8p4EG2T0CmcozAfQQifXiZDOiv + ijXFOuHfu4xYpInKvE1W + FnKBFI9ZlUsepIspdisRnSh + 9ijVVvOVLnxOco0PxKmwxHSiVJNiXKmqgmluLJb7hJCSHEYnQtIGjlPGOdo5QAvzwATHecNzYgWY3GNCpG2lFT9 / ssQ6HVwDoIZuXnJWxO8Tpg5M9snUehYc2lIvcRcGh4S / hXlq3R6Sk41wl8vC / 0I / x6yAUVo9EbeppVL4fdRbAUnaPQFjJKgT / ie0f20BYEo + 7R8ULwWwhjnhBUhmA4o85UG281H45cxYAWEmPQHN / GRY + HsZsgICBDzLv8QdDABWc5heHxBkvSzP3fw8JU2b2J3CpAOSmJZ1xCbLvMRK + pmUb2AdM5wHKEFT1kUMTjoASnlGmh42idhKOonjdyrzNIZlgCwCtvGA / Uorj / gua7FZEymuUmBrIWMafSTY4XZZDfzmoZw4KkDjJnN0s9njutnJN16I + asC3hHjqJc4c9YYr1mbBbCN0tz / wmcaCPGKKsqYlVEjv9MzVswAJoN5 / CEuVrIccR72F6cfjBeeMpVLAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTExLTE1VDExOjU4OjU2KzAwOjAwkkFfXwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0xMS0xNVQxMTo1ODo1NiswMDowMOMc5 + MAAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2FwZS5vcmeb7jwaAAAAAElFTkSuQmCC';
mxConstants.BLOCKED_IMAGE = 'data:image/png;base64,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';
mxConstants.MANUAL_IMAGE  = 'data:image/png;base64,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';

// Disables built-in context menu
mxEvent.disableContextMenu(document.body);

// Voltage class
var VCLASS = {
    UOFF: '#ffffff',
    UGEN: '#e646e6',
    SERVICE: '#cdff9b',
    MOVABLE_GROUND: '#968C55',
    CURRENT_VOLTAGE_LOAD: '#00FF00',
    GENERATION: '#DC9691',
    DAMAGE: '#FF0000',
    OVERLOAD: '#FFFF00',
    UNRELIABLE_INFO: '#FFFFFF',
    DATE_TIME_FREQ: '#FFBE00',
    ASU_TP_PS: '#505050',
    PTK_CUS: '#000000',

    getOptions: function ()
    {
        if (this.options == null)
        {
            this.options = [
                { id: 'V0',    value: 'Не задано' },
                { id: 'V1',    value: 'До 1 кВ'   },
                { id: 'V6',    value: '6 кВ'      },
                { id: 'V10',   value: '10 кВ'     },
                { id: 'V20',   value: '20 кВ'     },
                { id: 'V35',   value: '35 кВ'     },
                { id: 'V110',  value: '110 кВ'    },
                { id: 'V150',  value: '150 кВ'    },
                { id: 'V220',  value: '220 кВ'    },
                { id: 'V330',  value: '330 кВ'    },
                { id: 'V400',  value: '400 кВ'    },
                { id: 'V500',  value: '500 кВ'    },
                { id: 'V750',  value: '750 кВ'    },
                { id: 'V800',  value: '800 кВ'    },
                { id: 'V1150', value: '1150 кВ'   }
            ];
        }
        return this.options;
    },
    getColor: function (val)
    {
        return VCLASS.getMap()[val];
    },
    isDefaultValue: function (val)
    {
        return val == null || val == 'V0';
    },
    getMap: function ()
    {
        if (this.map == null)
        {
            this.map = {
                V0:    'none',
                V1:    '#bebebe',
                V6:    '#c89664',
                V10:   '#640064',
                V20:   '#826432',
                V35:   '#826432',
                V110:  '#00b4c8',
                V150:  '#aa9600',
                V220:  '#c8c800',
                V330:  '#008c00',
                V400:  '#f0961e',
                V500:  '#a50f0a',
                V750:  '#0000c8',
                V800:  '#0000c8',
                V1150: '#cd8aff'
            };
        }
        return this.map;
    }
};

function mxBindings (source)
{
    if (source != null && isDefined(source.length))
    {
        for (let i = 0; i < source.length; i++)
            this.push(source[i]);
    }
}
mxUtils.extend(mxBindings, Array);

var codec = new mxObjectCodec(new mxBindings());
codec.encode = function (enc, obj)
{
    let xmlDoc   = mxUtils.createXmlDocument();
    let bindings = xmlDoc.createElement('mxBindings');
    if (obj != null && obj instanceof mxBindings)
    {
        for (let i = 0; i < obj.length; i++)
        {
            let bindItem = obj[i];
            if (bindItem != null)
            {
                let item = xmlDoc.createElement('item');
                $(item).attr('name', bindItem.name);
                $(item).attr('value', bindItem.value);
                bindings.appendChild(item);
            }
        }
    }
    return bindings;
};
codec.decode = function (dec, node, into)
{
    let bindings = [];
    var items = node.getElementsByTagName('item');
    if (items && items.length > 0)
    {
        for (let i = 0; i < items.length; i++)
            bindings.push({ name: $(items[i]).attr('name'), value: $(items[i]).attr('value') });
    }
    return new mxBindings(bindings);
};
mxCodecRegistry.register(codec);

function mxBindingsChange(model, cell, bindings)
{
    this.model = model;
    this.cell = cell;
    this.bindings = bindings;
    this.previous = bindings;
};
mxBindingsChange.prototype.execute = function ()
{
    if (this.cell != null)
    {
        this.bindings = this.previous;
        this.previous = this.model.bindingsForCellChanged(this.cell, this.previous);
    }
};
mxGraphModel.prototype.setBinding = function (cell, name, value)
{
    // update cell runtime bindings
    if (cell.bindings == null)
        cell.bindings = new mxBindings();
    let targetBinding = this.getBinding(name);
    if (targetBinding != null)
        targetBinding.value = JSON.stringify(value);
    else
        cell.bindings.push({ name: name, value: value });
    this.setBindings(cell, cell.bindings);
};
mxGraphModel.prototype.setBindings = function (cell, bindings)
{
    if (bindings != cell.bindings)
    {
        this.execute(new mxBindingsChange(this, cell, bindings));
    }
    return bindings;
};
mxGraphModel.prototype.bindingsForCellChanged = function (cell, bindings)
{
    var previous = cell.bindings;
    cell.setBindings(bindings);
    return previous;
};
mxCodecRegistry.register(mxGenericChangeCodec(new mxBindingsChange(), 'bindings'));


mxCell.prototype.setBindings = function (array)
{
    // update cell runtime bindings
    this.bindings = new mxBindings(array);
    console.log(this.bindings)
    // Clones the value for correct undo/redo
    //let cellValue = this.getValue().cloneNode(true);
    // update cell value
    //if (cellValue != null && mxUtils.isNode(cellValue))
    //{
    //    var xmlDoc = mxUtils.createXmlDocument();
    //    var bindings = xmlDoc.createElement('bindings');
    //    xmlDoc.appendChild(bindings);
    //    for (let i = 0; i < array.length; i++)
    //    {
    //        let bindItem = array[i];
    //        if (bindItem != null)
    //        {
    //            let item = xmlDoc.createElement('item');
    //            $(item).attr('name',  bindItem.name);
    //            $(item).attr('value', bindItem.value);
    //            bindings.appendChild(item);
    //        }
    //    }
    //    // update target values
    //    var cellBindings = cellValue.getElementsByTagName('bindings');
    //    if (cellBindings && cellBindings.length > 0)
    //        cellValue.removeChild(cellBindings[0]);
    //    cellValue.appendChild(bindings);
    //}
    //return cellValue;
};
mxCell.prototype.getBinding = function (name)
{
    //if (this.bindings == null)
        //this.bindings = this.getBindings();
    return this.bindings != null ? this.bindings.find(function (x) { return x.name == name; }) : null;
};
mxCell.prototype.getBindingsByID = function (bindID)
{
    if (this.bindings == null)
        return [];
    return this.bindings.filter(function (x) { return !isNullOrEmpty(x.value) && x.value.indexOf(bindID) > 0; });
};

export { VCLASS }