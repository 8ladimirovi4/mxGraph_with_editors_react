﻿/**
 * Fix minimize/maximize localization
 */
function mtWindow(title, content, x, y, width, height, minimizable, moveable, replace, style)
{
    mxWindow.call(this, title, content, x, y, width, height, minimizable, moveable, replace, style);
    this.addListener(mxEvent.SHOW, mxUtils.bind(this, function ()
    {
        this.closeImg.title = mxResources.get('close');
        this.maximize.title = mxResources.get('expand');
        this.minimize.title = mxResources.get('collapse');
        this.fit();
    }));
    this.addListener(mxEvent.MAXIMIZE, mxUtils.bind(this, function ()
    {
        this.maximize.title = mxResources.get('restore');
    }));
    this.addListener(mxEvent.MINIMIZE, mxUtils.bind(this, function ()
    {
        this.minimize.title = mxResources.get('restore');        
    }));
    this.addListener(mxEvent.NORMALIZE, mxUtils.bind(this, function ()
    {
        this.maximize.title = mxResources.get('expand');
        this.minimize.title = mxResources.get('collapse');
    }));
}
mtWindow.prototype = new mxWindow();
mtWindow.prototype.constructor = mtWindow;

/**
 * Constructs a new open dialog.
 */
var OpenDialog = function()
{
    var iframe = document.createElement('iframe');
    iframe.style.backgroundColor = 'transparent';
    iframe.allowTransparency = 'true';
    iframe.style.borderStyle = 'none';
    iframe.style.borderWidth = '0px';
    iframe.style.overflow = 'hidden';
    iframe.frameBorder = '0';
        
    iframe.setAttribute('width',  320 + 'px');
    iframe.setAttribute('height', 220 + 'px');
    //iframe.setAttribute('src', OPEN_FORM);
    
    this.container = iframe;
};

/**
 * Constructs a new color dialog.
 */
var ColorDialog = function(editorUi, color, apply, cancelFn)
{
    this.editorUi = editorUi;
    
    var input = document.createElement('input');
    input.style.marginBottom = '10px';
    input.style.width = '216px';
    
    // Required for picker to render in IE
    if (mxClient.IS_IE)
    {
        input.style.marginTop = '10px';
        document.body.appendChild(input);
    }
    
    this.init = function()
    {
        if (!mxClient.IS_TOUCH)
        {
            input.focus();
        }
    };

    var picker = new jscolor.color(input);
    picker.pickerOnfocus = false;
    picker.showPicker();

    var div = document.createElement('div');
    jscolor.picker.box.style.position = 'relative';
    jscolor.picker.box.style.width = '230px';
    jscolor.picker.box.style.height = '100px';
    jscolor.picker.box.style.paddingBottom = '10px';
    div.appendChild(jscolor.picker.box);

    var center = document.createElement('center');
    
    function createRecentColorTable()
    {
        var table = addPresets((ColorDialog.recentColors.length == 0) ? ['FFFFFF'] :
                    ColorDialog.recentColors, 11, 'FFFFFF', true);
        table.style.marginBottom = '8px';
        
        return table;
    };
    
    function addPresets(presets, rowLength, defaultColor, addResetOption)
    {
        rowLength = (rowLength != null) ? rowLength : 12;
        var table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.setAttribute('cellspacing', '0');
        table.style.marginBottom = '20px';
        table.style.cellSpacing = '0px';
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);

        var rows = presets.length / rowLength;
        
        for (var row = 0; row < rows; row++)
        {
            var tr = document.createElement('tr');
            
            for (var i = 0; i < rowLength; i++)
            {
                (function(clr)
                {
                    var td = document.createElement('td');
                    td.style.border = '1px solid black';
                    td.style.padding = '0px';
                    td.style.width = '16px';
                    td.style.height = '16px';
                    
                    if (clr == null)
                    {
                        clr = defaultColor;
                    }
                    
                    if (clr == 'none')
                    {
                        td.style.background = 'url(\'' + Dialog.prototype.noColorImage + '\')';
                    }
                    else
                    {
                        td.style.backgroundColor = '#' + clr;
                    }
                    
                    tr.appendChild(td);

                    if (clr != null)
                    {
                        td.style.cursor = 'pointer';
                        
                        mxEvent.addListener(td, 'click', function()
                        {
                            if (clr == 'none')
                            {
                                picker.fromString('ffffff');
                                input.value = 'none';
                            }
                            else
                            {
                                picker.fromString(clr);
                            }
                        });
                    }
                })(presets[row * rowLength + i]);
            }
            
            tbody.appendChild(tr);
        }
        
        if (addResetOption)
        {
            var td = document.createElement('td');
            td.setAttribute('title', mxResources.get('reset'));
            td.style.border = '1px solid black';
            td.style.padding = '0px';
            td.style.width = '16px';
            td.style.height = '16px';
            td.style.backgroundImage = 'url(\'' + Dialog.prototype.closeImage + '\')';
            td.style.backgroundPosition = 'center center';
            td.style.backgroundRepeat = 'no-repeat';
            td.style.cursor = 'pointer';
            
            tr.appendChild(td);

            mxEvent.addListener(td, 'click', function()
            {
                ColorDialog.resetRecentColors();
                table.parentNode.replaceChild(createRecentColorTable(), table);
            });
        }
        
        center.appendChild(table);
        
        return table;
    };

    div.appendChild(input);
    mxUtils.br(div);
    
    // Adds recent colors
    createRecentColorTable();
        
    // Adds presets
    var table = addPresets(this.presetColors);
    table.style.marginBottom = '8px';
    table = addPresets(this.defaultColors);
    table.style.marginBottom = '16px';

    div.appendChild(center);

    var buttons = document.createElement('div');
    buttons.style.textAlign = 'right';
    buttons.style.whiteSpace = 'nowrap';
    
    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
        editorUi.hideDialog();
        if (cancelFn != null)
            cancelFn();
    });
    cancelBtn.className = 'geBtn';
    buttons.appendChild(cancelBtn);
    
    var applyFunction = (apply != null) ? apply : this.createApplyFunction();
    var applyBtn = mxUtils.button(mxResources.get('apply'), function()
    {
        var color = input.value;
        
        // Blocks any non-alphabetic chars in colors
        if (/(^#?[a-zA-Z0-9]*$)/.test(color))
        {
            //ColorDialog.addRecentColor(color, 12);
            
            if (color != 'none' && color.charAt(0) != '#')
            {
                color = '#' + color;
            }

            ColorDialog.addRecentColor((color != 'none') ? color.substring(1) : color, 12);
            applyFunction(color);
            editorUi.hideDialog();
        }
        else
        {
            editorUi.handleError({message: mxResources.get('invalidInput')});	
        }
    });
    applyBtn.className = 'geBtn gePrimaryBtn';
    buttons.appendChild(applyBtn);
    
    if (color != null)
    {
        if (color == 'none')
        {
            picker.fromString('ffffff');
            input.value = 'none';
        }
        else
        {
            picker.fromString(color);
        }
    }
    
    div.appendChild(buttons);
    this.picker = picker;
    this.colorInput = input;

    // LATER: Only fires if input if focused, should always fire if this dialog is showing.
    mxEvent.addListener(div, 'keydown', function(e)
    {
        if (e.keyCode == 27)
        {
            editorUi.hideDialog();
            if (cancelFn != null)
                cancelFn();
            mxEvent.consume(e);
        }
    });
    
    this.container = div;
};
ColorDialog.prototype.presetColors = ['E6D0DE', 'CDA2BE', 'B5739D', 'E1D5E7', 'C3ABD0', 'A680B8', 'D4E1F5', 'A9C4EB', '7EA6E0', 'D5E8D4', '9AC7BF', '67AB9F', 'D5E8D4', 'B9E0A5', '97D077', 'FFF2CC', 'FFE599', 'FFD966', 'FFF4C3', 'FFCE9F', 'FFB570', 'F8CECC', 'F19C99', 'EA6B66']; 
ColorDialog.prototype.defaultColors = ['none', 'FFFFFF', 'E6E6E6', 'CCCCCC', 'B3B3B3', '999999', '808080', '666666', '4D4D4D', '333333', '1A1A1A', '000000', 'FFCCCC', 'FFE6CC', 'FFFFCC', 'E6FFCC', 'CCFFCC', 'CCFFE6', 'CCFFFF', 'CCE5FF', 'CCCCFF', 'E5CCFF', 'FFCCFF', 'FFCCE6',
        'FF9999', 'FFCC99', 'FFFF99', 'CCFF99', '99FF99', '99FFCC', '99FFFF', '99CCFF', '9999FF', 'CC99FF', 'FF99FF', 'FF99CC', 'FF6666', 'FFB366', 'FFFF66', 'B3FF66', '66FF66', '66FFB3', '66FFFF', '66B2FF', '6666FF', 'B266FF', 'FF66FF', 'FF66B3', 'FF3333', 'FF9933', 'FFFF33',
        '99FF33', '33FF33', '33FF99', '33FFFF', '3399FF', '3333FF', '9933FF', 'FF33FF', 'FF3399', 'FF0000', 'FF8000', 'FFFF00', '80FF00', '00FF00', '00FF80', '00FFFF', '007FFF', '0000FF', '7F00FF', 'FF00FF', 'FF0080', 'CC0000', 'CC6600', 'CCCC00', '66CC00', '00CC00', '00CC66',
        '00CCCC', '0066CC', '0000CC', '6600CC', 'CC00CC', 'CC0066', '990000', '994C00', '999900', '4D9900', '009900', '00994D', '009999', '004C99', '000099', '4C0099', '990099', '99004D', '660000', '663300', '666600', '336600', '006600', '006633', '006666', '003366', '000066',
        '330066', '660066', '660033', '330000', '331A00', '333300', '1A3300', '003300', '00331A', '003333', '001933', '000033', '190033', '330033', '33001A'];
ColorDialog.prototype.createApplyFunction = function()
{
    return mxUtils.bind(this, function(color)
    {
        var graph = this.editorUi.editor.graph;
        
        graph.getModel().beginUpdate();
        try
        {
            graph.setCellStyles(this.currentColorKey, color);
            this.editorUi.fireEvent(new mxEventObject('styleChanged', 'keys', [this.currentColorKey],
                'values', [color], 'cells', graph.getSelectionCells()));
        }
        finally
        {
            graph.getModel().endUpdate();
        }
    });
};
ColorDialog.recentColors = [];
ColorDialog.addRecentColor = function(color, max)
{
    if (color != null)
    {
        mxUtils.remove(color, ColorDialog.recentColors);
        ColorDialog.recentColors.splice(0, 0, color);
        
        if (ColorDialog.recentColors.length >= max)
        {
            ColorDialog.recentColors.pop();
        }
    }
};
ColorDialog.resetRecentColors = function()
{
    ColorDialog.recentColors = [];
};

/**
 * Constructs a new filename dialog.
 */
var FilenameDialog = function(editorUi, filename, buttonText, fn, label, validateFn, content, helpLink, closeOnBtn, cancelFn, hints, w)
{
    closeOnBtn = (closeOnBtn != null) ? closeOnBtn : true;
    var row, td;
    
    var table = document.createElement('table');
    var tbody = document.createElement('tbody');
    table.style.marginTop = '8px';
    
    row = document.createElement('tr');
    
    td = document.createElement('td');
    td.style.whiteSpace = 'nowrap';
    //td.style.fontSize = '10pt';
    td.style.width = '120px';
    mxUtils.write(td, (label || mxResources.get('filename')) + ':');
    
    row.appendChild(td);
    
    var nameInput = document.createElement('input');
    nameInput.setAttribute('value', filename || '');
    nameInput.style.marginLeft = '4px';
    nameInput.style.width = (w != null) ? w + 'px' : '180px';
    
    var genericBtn = mxUtils.button(buttonText, function()
    {
        if (validateFn == null || validateFn(nameInput.value))
        {
            if (closeOnBtn)
                editorUi.hideDialog();            
            fn(nameInput.value);
        }
    });
    genericBtn.className = 'geBtn gePrimaryBtn';
    
    this.init = function()
    {
        if (label == null && content != null)
            return;
        
        nameInput.focus();
        
        if (mxClient.IS_GC || mxClient.IS_FF || document.documentMode >= 5)
            nameInput.select();
        else
            document.execCommand('selectAll', false, null);
        
        // Installs drag and drop handler for links
        if (Graph.fileSupport)
        {
            // Setup the dnd listeners
            var dlg = table.parentNode;
            if (dlg != null)
            {
                var graph = editorUi.editor.graph;
                var dropElt = null;
                    
                mxEvent.addListener(dlg, 'dragleave', function(evt)
                {
                    if (dropElt != null)
                    {
                        dropElt.style.backgroundColor = '';
                        dropElt = null;
                    }
                    
                    evt.stopPropagation();
                    evt.preventDefault();
                });
                
                mxEvent.addListener(dlg, 'dragover', mxUtils.bind(this, function(evt)
                {
                    // IE 10 does not implement pointer-events so it can't have a drop highlight
                    if (dropElt == null && (!mxClient.IS_IE || document.documentMode > 10))
                    {
                        dropElt = nameInput;
                        dropElt.style.backgroundColor = '#ebf2f9';
                    }
                    
                    evt.stopPropagation();
                    evt.preventDefault();
                }));
                        
                mxEvent.addListener(dlg, 'drop', mxUtils.bind(this, function(evt)
                {
                    if (dropElt != null)
                    {
                        dropElt.style.backgroundColor = '';
                        dropElt = null;
                    }
    
                    if (mxUtils.indexOf(evt.dataTransfer.types, 'text/uri-list') >= 0)
                    {
                        nameInput.value = decodeURIComponent(evt.dataTransfer.getData('text/uri-list'));
                        genericBtn.click();
                    }
    
                    evt.stopPropagation();
                    evt.preventDefault();
                }));
            }
        }
    };

    td = document.createElement('td');
    td.style.whiteSpace = 'nowrap';
    td.appendChild(nameInput);
    row.appendChild(td);
    
    if (label != null || content == null)
    {
        tbody.appendChild(row);
        if (hints != null)
            td.appendChild(FilenameDialog.createTypeHint(editorUi, nameInput, hints));
    }
    
    if (content != null)
    {
        row = document.createElement('tr');
        td = document.createElement('td');
        td.colSpan = 2;
        td.appendChild(content);
        row.appendChild(td);
        tbody.appendChild(row);
    }
    
    row = document.createElement('tr');
    td = document.createElement('td');
    td.colSpan = 2;
    td.style.paddingTop = '20px';
    td.style.whiteSpace = 'nowrap';
    td.setAttribute('align', 'right');
    
    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
        editorUi.hideDialog();
        if (cancelFn != null)
            cancelFn();
    });
    cancelBtn.className = 'geBtn';
    td.appendChild(cancelBtn);
        
    if (helpLink != null)
    {
        var helpBtn = mxUtils.button(mxResources.get('help'), function()
        {
            editorUi.editor.graph.openLink(helpLink);
        });
        helpBtn.className = 'geBtn';	
        td.appendChild(helpBtn);
    }

    mxEvent.addListener(nameInput, 'keypress', function(e)
    {
        if (e.keyCode == 13)
        {
            genericBtn.click();
        }
    });
    
    td.appendChild(genericBtn);
    
    row.appendChild(td);
    tbody.appendChild(row);
    table.appendChild(tbody);
    
    this.container = table;
};
FilenameDialog.filenameHelpLink = null;
FilenameDialog.createTypeHint = function(ui, nameInput, hints)
{
    var hint = document.createElement('img');
    hint.style.cssText = 'vertical-align:top;height:16px;width:16px;margin-left:4px;background-repeat:no-repeat;background-position:center bottom;cursor:pointer;';
    mxUtils.setOpacity(hint, 70);
    
    var nameChanged = function()
    {
        hint.setAttribute('src', Editor.helpImage);
        hint.setAttribute('title', mxResources.get('help'));
        
        for (var i = 0; i < hints.length; i++)
        {
            if (hints[i].ext.length > 0 &&
                nameInput.value.substring(nameInput.value.length -
                        hints[i].ext.length - 1) == '.' + hints[i].ext)
            {
                hint.setAttribute('src',  mxClient.imageBasePath + '/warning.png');
                hint.setAttribute('title', mxResources.get(hints[i].title));
                break;
            }
        }
    };
    
    mxEvent.addListener(nameInput, 'keyup', nameChanged);
    mxEvent.addListener(nameInput, 'change', nameChanged);
    mxEvent.addListener(hint, 'click', function(evt)
    {
        var title = hint.getAttribute('title');
        
        if (hint.getAttribute('src') == Editor.helpImage)
        {
            ui.editor.graph.openLink(FilenameDialog.filenameHelpLink);
        }
        else if (title != '')
        {
            ui.showError(null, title, mxResources.get('help'), function()
            {
                ui.editor.graph.openLink(FilenameDialog.filenameHelpLink);
            }, null, mxResources.get('ok'), null, null, null, 340, 90);
        }
        
        mxEvent.consume(evt);
    });
    
    nameChanged();
    
    return hint;
};

/**
 * Constructs a new textarea dialog.
 */
var TextareaDialog = function(editorUi, title, url, fn, cancelFn, cancelTitle, w, h, addButtons, noHide, noWrap, applyTitle, helpLink)
{
    w = (w != null) ? w : 300;
    h = (h != null) ? h : 120;
    noHide = (noHide != null) ? noHide : false;
    var row, td;
    
    var table = document.createElement('table');
    var tbody = document.createElement('tbody');
    
    row = document.createElement('tr');
    
    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    td.style.width = '100px';
    mxUtils.write(td, title);
    
    row.appendChild(td);
    tbody.appendChild(row);

    row = document.createElement('tr');
    td = document.createElement('td');

    var nameInput = document.createElement('textarea');
    
    if (noWrap)
    {
        nameInput.setAttribute('wrap', 'off');
    }
    
    nameInput.setAttribute('spellcheck', 'false');
    nameInput.setAttribute('autocorrect', 'off');
    nameInput.setAttribute('autocomplete', 'off');
    nameInput.setAttribute('autocapitalize', 'off');
    
    mxUtils.write(nameInput, url || '');
    nameInput.style.resize = 'none';
    nameInput.style.width = w + 'px';
    nameInput.style.height = h + 'px';
    
    this.textarea = nameInput;

    this.init = function()
    {
        nameInput.focus();
        nameInput.scrollTop = 0;
    };

    td.appendChild(nameInput);
    row.appendChild(td);
    
    tbody.appendChild(row);

    row = document.createElement('tr');
    td = document.createElement('td');
    td.style.paddingTop = '14px';
    td.style.whiteSpace = 'nowrap';
    td.setAttribute('align', 'right');
    
    if (helpLink != null)
    {
        var helpBtn = mxUtils.button(mxResources.get('help'), function()
        {
            editorUi.editor.graph.openLink(helpLink);
        });
        helpBtn.className = 'geBtn';
        
        td.appendChild(helpBtn);
    }
    
    var cancelBtn = mxUtils.button(cancelTitle || mxResources.get('cancel'), function()
    {
        editorUi.hideDialog();
        
        if (cancelFn != null)
        {
            cancelFn();
        }
    });
    cancelBtn.className = 'geBtn';
    td.appendChild(cancelBtn);
    
    if (addButtons != null)
    {
        addButtons(td, nameInput);
    }
    
    if (fn != null)
    {
        var genericBtn = mxUtils.button(applyTitle || mxResources.get('apply'), function()
        {
            if (!noHide)
                editorUi.hideDialog();
            fn(nameInput.value);
        });
        
        genericBtn.className = 'geBtn gePrimaryBtn';	
        td.appendChild(genericBtn);
    }
    
    row.appendChild(td);
    tbody.appendChild(row);
    table.appendChild(tbody);
    this.container = table;
};

/**
 * Constructs a new edit file dialog.
 */
var EditDiagramDialog = function(editorUi)
{
    var div = document.createElement('div');
    div.style.textAlign = 'right';
    var textarea = document.createElement('textarea');
    textarea.setAttribute('wrap', 'off');
    textarea.setAttribute('spellcheck', 'false');
    textarea.setAttribute('autocorrect', 'off');
    textarea.setAttribute('autocomplete', 'off');
    textarea.setAttribute('autocapitalize', 'off');
    textarea.style.overflow = 'auto';
    textarea.style.resize = 'none';
    textarea.style.width = '580px';
    textarea.style.height = '360px';
    textarea.style.marginBottom = '16px';
    
    textarea.value = mxUtils.getPrettyXml(editorUi.editor.getGraphXml());
    div.appendChild(textarea);
    
    this.init = function()
    {
        textarea.focus();
    };
    
    // Enables dropping files
    if (Graph.fileSupport)
    {
        function handleDrop(evt)
        {
            evt.stopPropagation();
            evt.preventDefault();
            
            if (evt.dataTransfer.files.length > 0)
            {
                var file = evt.dataTransfer.files[0];
                var reader = new FileReader();
                
                reader.onload = function(e)
                {
                    textarea.value = e.target.result;
                };
                
                reader.readAsText(file);
            }
            else
            {
                textarea.value = editorUi.extractGraphModelFromEvent(evt);
            }
        };
        function handleDragOver(evt)
        {
            evt.stopPropagation();
            evt.preventDefault();
        };

        // Setup the dnd listeners.
        textarea.addEventListener('dragover', handleDragOver, false);
        textarea.addEventListener('drop', handleDrop, false);
    }
    
    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
        editorUi.hideDialog();
    });
    cancelBtn.className = 'geBtn';
    div.appendChild(cancelBtn);
    
    var select = document.createElement('select');
    select.style.width = '250px';
    select.className = 'geBtn';

    if (editorUi.editor.graph.isEnabled())
    {
        var replaceOption = document.createElement('option');
        replaceOption.setAttribute('value', 'replace');
        mxUtils.write(replaceOption, mxResources.get('replaceExistingDrawing'));
        select.appendChild(replaceOption);

        var importOption = document.createElement('option');
        importOption.setAttribute('value', 'import');
        mxUtils.write(importOption, mxResources.get('addToExistingDrawing'));
        select.appendChild(importOption);
    }

    //div.appendChild(select);

    var okBtn = mxUtils.button(mxResources.get('ok'), function()
    {
        // Removes all illegal control characters before parsing
        var data = Graph.zapGremlins(mxUtils.trim(textarea.value));
        var error = null;
        
        if (select.value == 'replace')
        {
            editorUi.editor.graph.model.beginUpdate();
            try
            {
                editorUi.editor.setGraphXml(mxUtils.parseXml(data).documentElement);
                // LATER: Why is hideDialog between begin-/endUpdate faster?
                editorUi.hideDialog();
            }
            catch (e)
            {
                error = e;
            }
            finally
            {
                editorUi.editor.graph.model.endUpdate();				
            }
        }
        else if (select.value == 'import')
        {
            editorUi.editor.graph.model.beginUpdate();
            try
            {
                var doc = mxUtils.parseXml(data);
                var model = new mxGraphModel();
                var codec = new mxCodec(doc);
                codec.decode(doc.documentElement, model);
                
                var children = model.getChildren(model.getChildAt(model.getRoot(), 0));
                editorUi.editor.graph.setSelectionCells(editorUi.editor.graph.importCells(children));
                
                // LATER: Why is hideDialog between begin-/endUpdate faster?
                editorUi.hideDialog();
            }
            catch (e)
            {
                error = e;
            }
            finally
            {
                editorUi.editor.graph.model.endUpdate();				
            }
        }
            
        if (error != null)
            messageError(error.message);
    });
    okBtn.className = 'geBtn gePrimaryBtn';
    div.appendChild(okBtn);

    this.container = div;
};

/**
 * Constructs a new export dialog.
 */
var ExportDialog = function(editorUi)
{
    var graph = editorUi.editor.graph;
    var bounds = graph.getGraphBounds();
    var scale = graph.view.scale;
    
    var width = Math.ceil(bounds.width / scale);
    var height = Math.ceil(bounds.height / scale);

    var row, td;
    
    var table = document.createElement('table');
    var tbody = document.createElement('tbody');
    table.setAttribute('cellpadding', (mxClient.IS_SF) ? '0' : '2');
    
    row = document.createElement('tr');
    
    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    td.style.width = '100px';
    mxUtils.write(td, mxResources.get('filename') + ':');
    
    row.appendChild(td);
    
    var nameInput = document.createElement('input');
    nameInput.setAttribute('value', editorUi.editor.getOrCreateFilename());
    nameInput.style.width = '180px';

    td = document.createElement('td');
    td.appendChild(nameInput);
    row.appendChild(td);
    
    tbody.appendChild(row);
        
    row = document.createElement('tr');
    
    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    mxUtils.write(td, mxResources.get('format') + ':');
    
    row.appendChild(td);
    
    var imageFormatSelect = document.createElement('select');
    imageFormatSelect.style.width = '180px';

    //var pngOption = document.createElement('option');
    //pngOption.setAttribute('value', 'png');
    //mxUtils.write(pngOption, mxResources.get('formatPng'));
    //imageFormatSelect.appendChild(pngOption);
    
    if (ExportDialog.showGifOption)
    {
        var gifOption = document.createElement('option');
        gifOption.setAttribute('value', 'gif');
        mxUtils.write(gifOption, mxResources.get('formatGif'));
        imageFormatSelect.appendChild(gifOption);
    }
    
    //var jpgOption = document.createElement('option');
    //jpgOption.setAttribute('value', 'jpg');
    //mxUtils.write(jpgOption, mxResources.get('formatJpg'));
    //imageFormatSelect.appendChild(jpgOption);

    //var pdfOption = document.createElement('option');
    //pdfOption.setAttribute('value', 'pdf');
    //mxUtils.write(pdfOption, mxResources.get('formatPdf'));
    //imageFormatSelect.appendChild(pdfOption);
    
    var svgOption = document.createElement('option');
    svgOption.setAttribute('value', 'svg');
    mxUtils.write(svgOption, mxResources.get('formatSvg'));
    imageFormatSelect.appendChild(svgOption);
    
    if (ExportDialog.showXmlOption)
    {
        var xmlOption = document.createElement('option');
        xmlOption.setAttribute('value', 'xml');
        mxUtils.write(xmlOption, mxResources.get('formatXml'));
        imageFormatSelect.appendChild(xmlOption);
    }

    td = document.createElement('td');
    td.appendChild(imageFormatSelect);
    row.appendChild(td);
    
    tbody.appendChild(row);
    
    row = document.createElement('tr');

    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    mxUtils.write(td, mxResources.get('zoom') + ' (%):');
    
    row.appendChild(td);
    
    var zoomInput = document.createElement('input');
    zoomInput.setAttribute('type', 'number');
    zoomInput.setAttribute('value', '100');
    zoomInput.style.width = '180px';

    td = document.createElement('td');
    td.appendChild(zoomInput);
    row.appendChild(td);

    tbody.appendChild(row);

    row = document.createElement('tr');

    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    mxUtils.write(td, mxResources.get('width') + ':');
    
    row.appendChild(td);
    
    var widthInput = document.createElement('input');
    widthInput.setAttribute('value', width);
    widthInput.style.width = '180px';

    td = document.createElement('td');
    td.appendChild(widthInput);
    row.appendChild(td);

    tbody.appendChild(row);
    
    row = document.createElement('tr');
    
    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    mxUtils.write(td, mxResources.get('height') + ':');
    
    row.appendChild(td);
    
    var heightInput = document.createElement('input');
    heightInput.setAttribute('value', height);
    heightInput.style.width = '180px';

    td = document.createElement('td');
    td.appendChild(heightInput);
    row.appendChild(td);

    tbody.appendChild(row);
    
    row = document.createElement('tr');
    
    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    mxUtils.write(td, mxResources.get('background') + ':');
    
    row.appendChild(td);
    
    var transparentCheckbox = document.createElement('input');
    transparentCheckbox.setAttribute('type', 'checkbox');
    transparentCheckbox.checked = graph.background == null || graph.background == mxConstants.NONE;

    td = document.createElement('td');
    td.appendChild(transparentCheckbox);
    mxUtils.write(td, mxResources.get('transparent'));
    
    row.appendChild(td);
    
    tbody.appendChild(row);
    
    row = document.createElement('tr');

    td = document.createElement('td');
    //td.style.fontSize = '10pt';
    mxUtils.write(td, mxResources.get('borderWidth') + ':');
    
    row.appendChild(td);
    
    var borderInput = document.createElement('input');
    borderInput.setAttribute('type', 'number');
    borderInput.setAttribute('value', ExportDialog.lastBorderValue);
    borderInput.style.width = '180px';

    td = document.createElement('td');
    td.appendChild(borderInput);
    row.appendChild(td);

    tbody.appendChild(row);
    table.appendChild(tbody);
    
    // Handles changes in the export format
    function formatChanged()
    {
        var name = nameInput.value;
        var dot = name.lastIndexOf('.');
        
        if (dot > 0)
        {
            nameInput.value = name.substring(0, dot + 1) + imageFormatSelect.value;
        }
        else
        {
            nameInput.value = name + '.' + imageFormatSelect.value;
        }
        
        if (imageFormatSelect.value === 'xml')
        {
            zoomInput.setAttribute('disabled', 'true');
            widthInput.setAttribute('disabled', 'true');
            heightInput.setAttribute('disabled', 'true');
            borderInput.setAttribute('disabled', 'true');
        }
        else
        {
            zoomInput.removeAttribute('disabled');
            widthInput.removeAttribute('disabled');
            heightInput.removeAttribute('disabled');
            borderInput.removeAttribute('disabled');
        }
        
        if (imageFormatSelect.value === 'png' || imageFormatSelect.value === 'svg')
        {
            transparentCheckbox.removeAttribute('disabled');
        }
        else
        {
            transparentCheckbox.setAttribute('disabled', 'disabled');
        }
    }
    
    mxEvent.addListener(imageFormatSelect, 'change', formatChanged);
    formatChanged();

    function checkValues()
    {
        if (widthInput.value * heightInput.value > MAX_AREA || widthInput.value <= 0)
        {
            widthInput.style.backgroundColor = 'red';
        }
        else
        {
            widthInput.style.backgroundColor = '';
        }
        
        if (widthInput.value * heightInput.value > MAX_AREA || heightInput.value <= 0)
        {
            heightInput.style.backgroundColor = 'red';
        }
        else
        {
            heightInput.style.backgroundColor = '';
        }
    }

    mxEvent.addListener(zoomInput, 'change', function()
    {
        var s = Math.max(0, parseFloat(zoomInput.value) || 100) / 100;
        zoomInput.value = parseFloat((s * 100).toFixed(2));
        
        if (width > 0)
        {
            widthInput.value = Math.floor(width * s);
            heightInput.value = Math.floor(height * s);
        }
        else
        {
            zoomInput.value = '100';
            widthInput.value = width;
            heightInput.value = height;
        }
        
        checkValues();
    });

    mxEvent.addListener(widthInput, 'change', function()
    {
        var s = parseInt(widthInput.value) / width;
        
        if (s > 0)
        {
            zoomInput.value = parseFloat((s * 100).toFixed(2));
            heightInput.value = Math.floor(height * s);
        }
        else
        {
            zoomInput.value = '100';
            widthInput.value = width;
            heightInput.value = height;
        }
        
        checkValues();
    });

    mxEvent.addListener(heightInput, 'change', function()
    {
        var s = parseInt(heightInput.value) / height;
        
        if (s > 0)
        {
            zoomInput.value = parseFloat((s * 100).toFixed(2));
            widthInput.value = Math.floor(width * s);
        }
        else
        {
            zoomInput.value = '100';
            widthInput.value = width;
            heightInput.value = height;
        }
        
        checkValues();
    });
    
    row = document.createElement('tr');
    td = document.createElement('td');
    td.setAttribute('align', 'right');
    td.style.paddingTop = '22px';
    td.colSpan = 2;
    
    var saveBtn = mxUtils.button(mxResources.get('export'), mxUtils.bind(this, function()
    {
        if (parseInt(zoomInput.value) <= 0)
        {
            messageError(mxResources.get('drawingEmpty'));
        }
        else
        {
            var name = nameInput.value;
            var format = imageFormatSelect.value;
            var s = Math.max(0, parseFloat(zoomInput.value) || 100) / 100;
            var b = Math.max(0, parseInt(borderInput.value));
            var bg = graph.background;
            
            if ((format == 'svg' || format == 'png') && transparentCheckbox.checked)
            {
                bg = null;
            }
            else if (bg == null || bg == mxConstants.NONE)
            {
                bg = '#ffffff';
            }
            
            ExportDialog.lastBorderValue = b;
            ExportDialog.exportFile(editorUi, name, format, bg, s, b);
        }
    }));
    saveBtn.className = 'geBtn gePrimaryBtn';
    
    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
        editorUi.hideDialog();
    });
    cancelBtn.className = 'geBtn';
    td.appendChild(cancelBtn);
    td.appendChild(saveBtn);

    row.appendChild(td);
    tbody.appendChild(row);
    table.appendChild(tbody);

    this.container = table;
};
/**
 * Remembers last value for border.
 */
ExportDialog.lastBorderValue = 0;
/**
 * Global switches for the export dialog.
 */
ExportDialog.showGifOption = false;
/**
 * Global switches for the export dialog.
 */
ExportDialog.showXmlOption = true;
/**
 * Hook for getting the export format. Returns null for the default
 * intermediate XML export format or a function that returns the
 * parameter and value to be used in the request in the form
 * key=value, where value should be URL encoded.
 */
ExportDialog.exportFile = function(editorUi, name, format, bg, s, b)
{
    var graph = editorUi.editor.graph;
    
    if (format == 'xml')
    {
        ExportDialog.saveLocalFile(editorUi, mxUtils.getXml(editorUi.editor.getGraphXml()), name, format);
    }
    else if (format == 'svg')
    {
        ExportDialog.saveLocalFile(editorUi, mxUtils.getXml(graph.getSvg(bg, s, b)), name, format);
    }
    else
    {
        var bounds = graph.getGraphBounds();
        
        // New image export
        var xmlDoc = mxUtils.createXmlDocument();
        var root = xmlDoc.createElement('output');
        xmlDoc.appendChild(root);
        
        // Renders graph. Offset will be multiplied with state's scale when painting state.
        var xmlCanvas = new mxXmlCanvas2D(root);
        xmlCanvas.translate(Math.floor((b / s - bounds.x) / graph.view.scale),
            Math.floor((b / s - bounds.y) / graph.view.scale));
        xmlCanvas.scale(s / graph.view.scale);
        
        var imgExport = new mxImageExport();
        imgExport.drawState(graph.getView().getState(graph.model.root), xmlCanvas);
        
        // Puts request data together
        var param = 'xml=' + encodeURIComponent(mxUtils.getXml(root));
        var w = Math.ceil(bounds.width * s / graph.view.scale + 2 * b);
        var h = Math.ceil(bounds.height * s / graph.view.scale + 2 * b);
        
        // Requests image if request is valid
        if (param.length <= MAX_REQUEST_SIZE && w * h < MAX_AREA)
        {
            editorUi.hideDialog();
            var req = new mxXmlRequest(EXPORT_URL, 'format=' + format +
                '&filename=' + encodeURIComponent(name) +
                '&bg=' + ((bg != null) ? bg : 'none') +
                '&w=' + w + '&h=' + h + '&' + param);
            req.simulate(document, '_blank');
        }
        else
        {
            messageError(mxResources.get('drawingTooLarge'));
        }
    }
};
/**
 * Hook for getting the export format. Returns null for the default
 * intermediate XML export format or a function that returns the
 * parameter and value to be used in the request in the form
 * key=value, where value should be URL encoded.
 */
ExportDialog.saveLocalFile = function(editorUi, data, filename, format)
{
    if (data.length < MAX_REQUEST_SIZE)
    {
        editorUi.hideDialog();
        var req = new mxXmlRequest(SAVE_URL, 'xml=' + encodeURIComponent(data) + '&filename=' +
            encodeURIComponent(filename) + '&format=' + format);
        req.simulate(document, '_blank');
    }
    else
    {
        messageError(mxResources.get('drawingTooLarge'));
        mxUtils.popup(xml);
    }
};

/**
 * Constructs a new metadata dialog.
 */
var EditDataDialog = function(ui, cell)
{
    var div   = document.createElement('div');
    var graph = ui.editor.graph;
    
    var value = graph.getModel().getValue(cell);
    
    // Converts the value to an XML node
    if (!mxUtils.isNode(value))
    {
        var doc = mxUtils.createXmlDocument();
        var obj = doc.createElement('object');
        obj.setAttribute('label', value || '');
        value = obj;
    }

    // Creates the dialog contents
    var form = new mxForm('properties');
    form.table.style.width = '100%';

    var names = [];
    var texts = [];
    var count = 0;
    var attrs = value.attributes;

    var id = (EditDataDialog.getDisplayIdForCell != null) ? EditDataDialog.getDisplayIdForCell(ui, cell) : null;
    
    var addRemoveButton = function(text, name)
    {
        var wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.paddingRight = '20px';
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.width = '100%';
        
        var removeAttr = document.createElement('a');
        var img = mxUtils.createImage(Dialog.prototype.closeImage);
        img.style.height = '9px';
        img.style.fontSize = '9px';
        img.style.marginBottom = (mxClient.IS_IE11) ? '-1px' : '5px';
        
        removeAttr.className = 'geButton';
        removeAttr.setAttribute('title', mxResources.get('delete'));
        removeAttr.style.position = 'absolute';
        removeAttr.style.top = '4px';
        removeAttr.style.right = '0px';
        removeAttr.style.margin = '0px';
        removeAttr.style.width = '9px';
        removeAttr.style.height = '9px';
        removeAttr.style.cursor = 'pointer';
        removeAttr.appendChild(img);
        
        var removeAttrFn = (function(name)
        {
            return function()
            {
                var count = 0;
                
                for (var j = 0; j < names.length; j++)
                {
                    if (names[j] == name)
                    {
                        texts[j] = null;
                        form.table.deleteRow(count + ((id != null) ? 1 : 0));
                        
                        break;
                    }
                    
                    if (texts[j] != null)
                    {
                        count++;
                    }
                }
            };
        })(name);
        
        mxEvent.addListener(removeAttr, 'click', removeAttrFn);
        
        var parent = text.parentNode;
        wrapper.appendChild(text);
        wrapper.appendChild(removeAttr);
        parent.appendChild(wrapper);
    };
    var addTextArea = function(index, name, value)
    {
        names[index] = name;
        texts[index] = form.addTextarea(names[count] + ':', value, 2);
        texts[index].style.width = '100%';
        
        addRemoveButton(texts[index], name);
    };
    
    var temp = [];
    var isLayer = graph.getModel().getParent(cell) == graph.getModel().getRoot();

    for (var i = 0; i < attrs.length; i++)
    {
        if ((isLayer || attrs[i].nodeName != 'label') && attrs[i].nodeName != 'placeholders')
            temp.push({name: attrs[i].nodeName, value: attrs[i].nodeValue});
    }
    
    // Sorts by name
    temp.sort(function(a, b)
    {
        if (a.name < b.name)
        {
            return -1;
        }
        else if (a.name > b.name)
        {
            return 1;
        }
        else
        {
            return 0;
        }
    });

    if (id != null)
    {	
        var text = document.createElement('div');
        text.style.width = '100%';
        //text.style.fontSize = '11px';
        text.style.textAlign = 'center';
        mxUtils.write(text, id);
        form.addField(mxResources.get('id') + ':', text);
    }
    
    for (var i = 0; i < temp.length; i++)
    {
        addTextArea(count, temp[i].name, temp[i].value);
        count++;
    }
    
    var top = document.createElement('div');
    top.style.cssText = 'position:absolute;left:30px;right:30px;overflow-y:auto;top:30px;bottom:80px;';
    top.appendChild(form.table);

    var newProp = document.createElement('div');
    newProp.style.boxSizing    = 'border-box';
    newProp.style.paddingRight = '160px';
    newProp.style.whiteSpace   = 'nowrap';
    newProp.style.marginTop    = '6px';
    newProp.style.width        = '100%';
    
    var nameInput = document.createElement('input');
    nameInput.setAttribute('placeholder', mxResources.get('enterPropertyName'));
    nameInput.setAttribute('type', 'text');
    nameInput.setAttribute('size', (mxClient.IS_IE || mxClient.IS_IE11) ? '36' : '40');
    nameInput.style.boxSizing = 'border-box';
    nameInput.style.marginLeft = '2px';
    nameInput.style.width = '100%';
    
    newProp.appendChild(nameInput);
    top.appendChild(newProp);
    div.appendChild(top);
    
    var addBtn = mxUtils.button(mxResources.get('addProperty'), function()
    {
        var name = nameInput.value;

        // Avoid ':' in attribute names which seems to be valid in Chrome
        if (name.length > 0 && name != 'label' && name != 'placeholders' && name.indexOf(':') < 0)
        {
            try
            {
                var idx = mxUtils.indexOf(names, name);
                
                if (idx >= 0 && texts[idx] != null)
                {
                    texts[idx].focus();
                }
                else
                {
                    // Checks if the name is valid
                    var clone = value.cloneNode(false);
                    clone.setAttribute(name, '');
                    
                    if (idx >= 0)
                    {
                        names.splice(idx, 1);
                        texts.splice(idx, 1);
                    }

                    names.push(name);
                    var text = form.addTextarea(name + ':', '', 2);
                    text.style.width = '100%';
                    texts.push(text);
                    addRemoveButton(text, name);

                    text.focus();
                }

                addBtn.setAttribute('disabled', 'disabled');
                nameInput.value = '';
            }
            catch (e)
            {
                messageError(e.message);
            }
        }
        else
        {
            messageError(mxResources.get('invalidName'));
        }
    });
    
    this.init = function()
    {
        if (texts.length > 0)
        {
            texts[0].focus();
        }
        else
        {
            nameInput.focus();
        }
    };
    
    addBtn.setAttribute('title', mxResources.get('addProperty'));
    addBtn.setAttribute('disabled', 'disabled');
    addBtn.style.textOverflow = 'ellipsis';
    addBtn.style.position = 'absolute';
    addBtn.style.overflow = 'hidden';
    addBtn.style.width = '144px';
    addBtn.style.right = '0px';
    addBtn.className = 'geBtn';
    newProp.appendChild(addBtn);

    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
        ui.hideDialog.apply(ui, arguments);
    });
    cancelBtn.className = 'geBtn';
    
    var applyBtn = mxUtils.button(mxResources.get('apply'), function()
    {
        try
        {
            ui.hideDialog.apply(ui, arguments);
            
            // Clones and updates the value
            value = value.cloneNode(true);
            var removeLabel = false;
            
            for (var i = 0; i < names.length; i++)
            {
                if (texts[i] == null)
                {
                    value.removeAttribute(names[i]);
                }
                else
                {
                    value.setAttribute(names[i], texts[i].value);
                    removeLabel = removeLabel || (names[i] == 'placeholder' && value.getAttribute('placeholders') == '1');
                }
            }
            
            // Removes label if placeholder is assigned
            if (removeLabel)
                value.removeAttribute('label');
            
            // Updates the value of the cell (undoable)
            graph.getModel().setValue(cell, value);
        }
        catch (e)
        {
            HELP.log(e);
            messageError(e.message);
        }
    });
    applyBtn.className = 'geBtn gePrimaryBtn';
    
    function updateAddBtn()
    {
        if (nameInput.value.length > 0)
        {
            addBtn.removeAttribute('disabled');
        }
        else
        {
            addBtn.setAttribute('disabled', 'disabled');
        }
    };
    mxEvent.addListener(nameInput, 'keyup', updateAddBtn);
    
    // Catches all changes that don't fire a keyup (such as paste via mouse)
    mxEvent.addListener(nameInput, 'change', updateAddBtn);
    
    var buttons = document.createElement('div');
    buttons.style.cssText = 'position:absolute;left:30px;right:30px;text-align:right;bottom:30px;height:40px;'
    
    if (ui.editor.graph.getModel().isVertex(cell) || ui.editor.graph.getModel().isEdge(cell))
    {
        var replace = document.createElement('span');
        replace.style.marginRight = '10px';
        //var input = document.createElement('input');
        //input.setAttribute('type', 'checkbox');
        //input.style.marginRight = '6px';
        
        //if (value.getAttribute('placeholders') == '1')
        //{
        //    input.setAttribute('checked', 'checked');
        //    input.defaultChecked = true;
        //}
    
        //mxEvent.addListener(input, 'click', function()
        //{
        //    if (value.getAttribute('placeholders') == '1')
        //    {
        //        value.removeAttribute('placeholders');
        //    }
        //    else
        //    {
        //        value.setAttribute('placeholders', '1');
        //    }
        //});
        
        //replace.appendChild(input);
        //mxUtils.write(replace, mxResources.get('placeholders'));        
        buttons.appendChild(replace);
    }
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(applyBtn);
    div.appendChild(buttons);

    this.container = div;
};
EditDataDialog.getDisplayIdForCell = function(ui, cell)
{
    var id = null;
    if (ui.editor.graph.getModel().getParent(cell) != null)
        id = cell.getId();
    return id;
};

/**
 * Constructs a new link dialog.
 */
var LinkDialog = function(editorUi, initialValue, btnLabel, fn)
{
    var div = document.createElement('div');
    mxUtils.write(div, mxResources.get('editLink') + ':');
    
    var inner = document.createElement('div');
    inner.className = 'geTitle';
    inner.style.backgroundColor = 'transparent';
    inner.style.borderColor = 'transparent';
    inner.style.whiteSpace = 'nowrap';
    inner.style.textOverflow = 'clip';
    inner.style.cursor = 'default';
    
    inner.style.paddingRight = '20px';
    
    var linkInput = document.createElement('input');
    linkInput.setAttribute('value', initialValue);
    linkInput.setAttribute('placeholder', 'http://www.example.com/');
    linkInput.setAttribute('type', 'text');
    linkInput.style.marginTop = '6px';
    linkInput.style.width = '400px';
    linkInput.style.backgroundImage = 'url(\'' + Dialog.prototype.clearImage + '\')';
    linkInput.style.backgroundRepeat = 'no-repeat';
    linkInput.style.backgroundPosition = '100% 50%';
    linkInput.style.paddingRight = '14px';
    
    var cross = document.createElement('div');
    cross.setAttribute('title', mxResources.get('reset'));
    cross.style.position = 'relative';
    cross.style.left = '-16px';
    cross.style.width = '12px';
    cross.style.height = '14px';
    cross.style.cursor = 'pointer';

    cross.style.display = 'inline-block';
    cross.style.top = '3px';
    
    // Needed to block event transparency in IE
    cross.style.background = 'url(\'' + mxUtils.transparentImage + '\')';

    mxEvent.addListener(cross, 'click', function()
    {
        linkInput.value = '';
        linkInput.focus();
    });
    
    inner.appendChild(linkInput);
    inner.appendChild(cross);
    div.appendChild(inner);
    
    this.init = function()
    {
        linkInput.focus();
        
        if (mxClient.IS_GC || mxClient.IS_FF || document.documentMode >= 5)
        {
            linkInput.select();
        }
        else
        {
            document.execCommand('selectAll', false, null);
        }
    };
    
    var btns = document.createElement('div');
    btns.style.marginTop = '18px';
    btns.style.textAlign = 'right';

    mxEvent.addListener(linkInput, 'keypress', function(e)
    {
        if (e.keyCode == 13)
        {
            editorUi.hideDialog();
            fn(linkInput.value);
        }
    });

    var cancelBtn = mxUtils.button(mxResources.get('cancel'), function()
    {
        editorUi.hideDialog();
    });
    cancelBtn.className = 'geBtn'; 
    btns.appendChild(cancelBtn);
    
    var mainBtn = mxUtils.button(btnLabel, function()
    {
        editorUi.hideDialog();
        fn(linkInput.value);
    });
    mainBtn.className = 'geBtn gePrimaryBtn';
    btns.appendChild(mainBtn);
    div.appendChild(btns);

    this.container = div;
};

/**
 * Constructs a new outline window.
 */
var OutlineWindow = function(editorUi, x, y, w, h)
{
    var graph = editorUi.editor.graph;

    var div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.width    = '100%';
    div.style.height   = '100%';
    div.style.border   = '1px solid whiteSmoke';
    div.style.overflow = 'hidden';

    this.window = new mtWindow(mxResources.get('outline'), div, x, y, w, h, true, true);
    this.window.minimumSize = new mxRectangle(0, 0, w, 80);
    this.window.destroyOnClose = false;
    this.window.setMaximizable(false);
    this.window.setResizable(true);
    this.window.setClosable(true);
    this.window.setVisible(true);

    var outline = new mxOutline(graph);

    this.window.setLocation = function(x, y)
    {
        var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
        var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;
        
        x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
        y = Math.max(0, Math.min(y, ih - this.table.clientHeight));

        if (this.getX() != x || this.getY() != y)
            mtWindow.prototype.setLocation.apply(this, arguments);
    };
    var resizeListener = mxUtils.bind(this, function ()
    {
        if (this.window.div.clientHeight > graph.container.clientHeight)
            this.window.setSize(this.window.div.style.width, graph.container.clientHeight - 5);
        this.window.setLocation(this.window.getX(), this.window.getY());
        outline.update(false);
    });
    mxEvent.addListener(window, 'resize', resizeListener);    

    this.destroy = function ()
    {
        mxEvent.removeListener(window, 'resize', resizeListener);
        this.window.destroy();
        outline.destroy();
    };

    this.window.addListener(mxEvent.RESIZE, mxUtils.bind(this, function()
    {
        outline.update(false);
        outline.outline.sizeDidChange();
    }));
    this.window.addListener(mxEvent.SHOW, mxUtils.bind(this, function()
    {
        this.window.fit();
        outline.suspended = false;
        outline.outline.refresh();
        outline.update();
    }));
    this.window.addListener(mxEvent.HIDE, mxUtils.bind(this, function()
    {
        outline.suspended = true;
    }));
    this.window.addListener(mxEvent.NORMALIZE, mxUtils.bind(this, function()
    {
        outline.suspended = false;
        outline.update();
    }));
    this.window.addListener(mxEvent.MINIMIZE, mxUtils.bind(this, function()
    {
        outline.suspended = true;
    }));

    var outlineCreateGraph = outline.createGraph;
    outline.createGraph = function(container)
    {
        var g = outlineCreateGraph.apply(this, arguments);
        g.gridEnabled = false;
        g.pageScale   = graph.pageScale;
        g.pageFormat  = graph.pageFormat;
        g.background  = (graph.background == null || graph.background == mxConstants.NONE) ? graph.defaultPageBackgroundColor : graph.background;
        g.pageVisible = graph.pageVisible;

        var current = mxUtils.getCurrentStyle(graph.container);
        div.style.backgroundColor = current.backgroundColor;

        return g;
    };
    outline.getOutlineOffset = function (scale)
    {
        return new mxPoint(20, 20);
    };

    function update()
    {
        outline.outline.pageScale = graph.pageScale;
        outline.outline.pageFormat = graph.pageFormat;
        outline.outline.pageVisible = graph.pageVisible;
        outline.outline.background = (graph.background == null || graph.background == mxConstants.NONE) ? graph.defaultPageBackgroundColor : graph.background;
        
        var current = mxUtils.getCurrentStyle(graph.container);
        div.style.backgroundColor = current.backgroundColor;

        if (graph.view.backgroundPageShape != null && outline.outline.view.backgroundPageShape != null)
            outline.outline.view.backgroundPageShape.fill = graph.view.backgroundPageShape.fill;
        
        outline.outline.refresh();
    }

    outline.init(div);
    outline.setZoomEnabled(false);

    editorUi.editor.addListener('resetGraphView', update);
    editorUi.addListener('pageFormatChanged', update);
    editorUi.addListener('backgroundColorChanged', update);
    editorUi.addListener('backgroundImageChanged', update);
    editorUi.addListener('pageViewChanged', function()
    {
        update();
        outline.update(true);
    });
    
    if (outline.outline.dialect == mxConstants.DIALECT_SVG)
    {
        var zoomInAction  = editorUi.actions.get('zoomIn');
        var zoomOutAction = editorUi.actions.get('zoomOut');
        
        mxEvent.addMouseWheelListener(function(evt, up)
        {
            var outlineWheel = false;

            var source = mxEvent.getSource(evt);
            while (source != null)
            {
                if (source == outline.outline.view.canvas.ownerSVGElement)
                {
                    outlineWheel = true;
                    break;
                }
                source = source.parentNode;
            }
    
            if (outlineWheel)
            {
                if (up)
                    zoomInAction.funct();
                else
                    zoomOutAction.funct();
    
                //mxEvent.consume(evt);
            }
        });
    }
};

/**
 * Constructs a new layers window.
 */
var LayersWindow = function(editorUi, x, y, w, h)
{
    var graph = editorUi.editor.graph;
    
    var div = document.createElement('div');
    div.style.userSelect = 'none';
    div.style.background = (Dialog.backdropColor == 'white') ? 'whiteSmoke' : Dialog.backdropColor;
    div.style.border = '1px solid whiteSmoke';
    div.style.height = '100%';
    div.style.marginBottom = '10px';
    div.style.overflow = 'auto';

    var tbarHeight = '26px';
    
    var listDiv = document.createElement('div')
    listDiv.style.backgroundColor = (Dialog.backdropColor == 'white') ? '#dcdcdc' : Dialog.backdropColor;
    listDiv.style.position = 'absolute';
    listDiv.style.overflow = 'auto';
    listDiv.style.left = '0px';
    listDiv.style.right = '0px';
    listDiv.style.top = '0px';
    listDiv.style.bottom = (parseInt(tbarHeight) + 7) + 'px';
    div.appendChild(listDiv);
    
    var dragSource = null;
    var dropIndex = null;
    
    mxEvent.addListener(div, 'dragover', function(evt)
    {
        evt.dataTransfer.dropEffect = 'move';
        dropIndex = 0;
        evt.stopPropagation();
        evt.preventDefault();
    });
    
    // Workaround for "no element found" error in FF
    mxEvent.addListener(div, 'drop', function(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();
    });

    var layerCount = null;
    var selectionLayer = null;
    
    var ldiv = document.createElement('div');
    
    ldiv.className = 'geToolbarContainer';
    ldiv.style.position = 'absolute';
    ldiv.style.bottom = '0px';
    ldiv.style.left = '0px';
    ldiv.style.right = '0px';
    ldiv.style.height = tbarHeight;
    ldiv.style.overflow = 'hidden';
    ldiv.style.padding = '4px 0px 3px 0px';
    ldiv.style.backgroundColor = (Dialog.backdropColor == 'white') ? 'whiteSmoke' : Dialog.backdropColor;
    ldiv.style.borderWidth = '1px 0px 0px 0px';
    ldiv.style.borderColor = '#c3c3c3';
    ldiv.style.borderStyle = 'solid';
    ldiv.style.display = 'block';
    ldiv.style.whiteSpace = 'nowrap';
    
    var link = document.createElement('a');
    link.className = 'geButton';
        
    var removeLink = link.cloneNode();
    removeLink.innerHTML = '<div class="geSprite geSprite-delete" style="display:inline-block;"></div>';

    mxEvent.addListener(removeLink, 'click', function(evt)
    {
        if (graph.isEnabled())
        {
            graph.model.beginUpdate();
            try
            {
                var index = graph.model.root.getIndex(selectionLayer);
                graph.removeCells([selectionLayer], false);
                
                // Creates default layer if no layer exists
                if (graph.model.getChildCount(graph.model.root) == 0)
                {
                    graph.model.add(graph.model.root, new mxCell());
                    graph.setDefaultParent(null);
                }
                else if (index > 0 && index <= graph.model.getChildCount(graph.model.root))
                {
                    graph.setDefaultParent(graph.model.getChildAt(graph.model.root, index - 1));
                }
                else
                {
                    graph.setDefaultParent(null);
                }
            }
            finally
            {
                graph.model.endUpdate();
            }
        }
        
        mxEvent.consume(evt);
    });
    
    if (!graph.isEnabled())
        removeLink.className = 'geButton mxDisabled';
    
    ldiv.appendChild(removeLink);

    var insertLink = link.cloneNode();
    insertLink.setAttribute('title', mxUtils.trim(mxResources.get('moveSelectionTo', [''])));
    insertLink.innerHTML = '<div class="geSprite geSprite-insert" style="display:inline-block;"></div>';
    
    mxEvent.addListener(insertLink, 'click', function(evt)
    {
        if (graph.isEnabled() && !graph.isSelectionEmpty())
        {
            editorUi.editor.graph.popupMenuHandler.hideMenu();
            
            var menu = new mxPopupMenu(mxUtils.bind(this, function(menu, parent)
            {
                for (var i = layerCount - 1; i >= 0; i--)
                {
                    (mxUtils.bind(this, function(child)
                    {
                        var item = menu.addItem(graph.convertValueToString(child) ||
                                mxResources.get('background'), null, mxUtils.bind(this, function()
                        {
                            graph.moveCells(graph.getSelectionCells(), 0, 0, false, child);
                        }), parent);
                        
                        if (graph.getSelectionCount() == 1 && graph.model.isAncestor(child, graph.getSelectionCell()))
                        {
                            menu.addCheckmark(item, Editor.checkmarkImage);
                        }
                        
                    }))(graph.model.getChildAt(graph.model.root, i));
                }
            }));
            menu.div.className += ' geMenubarMenu';
            menu.smartSeparators = true;
            menu.showDisabled = true;
            menu.autoExpand = true;
            
            // Disables autoexpand and destroys menu when hidden
            menu.hideMenu = mxUtils.bind(this, function()
            {
                mxPopupMenu.prototype.hideMenu.apply(menu, arguments);
                menu.destroy();
            });
    
            var offset = mxUtils.getOffset(insertLink);
            menu.popup(offset.x, offset.y + insertLink.offsetHeight, null, evt);
            
            // Allows hiding by clicking on document
            editorUi.setCurrentMenu(menu);
        }
    });

    ldiv.appendChild(insertLink);
    
    var dataLink = link.cloneNode();
    dataLink.innerHTML = '<div class="geSprite geSprite-dots" style="display:inline-block;"></div>';
    dataLink.setAttribute('title', mxResources.get('rename'));

    mxEvent.addListener(dataLink, 'click', function(evt)
    {
        if (graph.isEnabled())
            editorUi.showDataDialog(selectionLayer);
        mxEvent.consume(evt);
    });
    
    if (!graph.isEnabled())
        dataLink.className = 'geButton mxDisabled';
    ldiv.appendChild(dataLink);
    
    function renameLayer(layer)
    {
        if (graph.isEnabled() && layer != null)
        {
            var label = graph.convertValueToString(layer);
            var dlg = new FilenameDialog(editorUi, label || mxResources.get('background'), mxResources.get('rename'), mxUtils.bind(this, function(newValue)
            {
                if (newValue != null)
                {
                    graph.cellLabelChanged(layer, newValue);
                }
            }), mxResources.get('enterName'));
            editorUi.showDialog(dlg.container, 320, 80, true, true);
            dlg.init();
        }
    };
    
    var duplicateLink = link.cloneNode();
    duplicateLink.innerHTML = '<div class="geSprite geSprite-duplicate" style="display:inline-block;"></div>';
    
    mxEvent.addListener(duplicateLink, 'click', function(evt)
    {
        if (graph.isEnabled())
        {
            var newCell = null;
            graph.model.beginUpdate();
            try
            {
                newCell = graph.cloneCell(selectionLayer);
                graph.cellLabelChanged(newCell, mxResources.get('untitledLayer'));
                newCell.setVisible(true);
                newCell = graph.addCell(newCell, graph.model.root);
                graph.setDefaultParent(newCell);
            }
            finally
            {
                graph.model.endUpdate();
            }

            if (newCell != null && !graph.isCellLocked(newCell))
            {
                graph.selectAll(newCell);
            }
        }
    });
    
    if (!graph.isEnabled())
        duplicateLink.className = 'geButton mxDisabled';

    ldiv.appendChild(duplicateLink);

    var addLink = link.cloneNode();
    addLink.innerHTML = '<div class="geSprite geSprite-plus" style="display:inline-block;"></div>';
    addLink.setAttribute('title', mxResources.get('addLayer'));
    
    mxEvent.addListener(addLink, 'click', function(evt)
    {
        if (graph.isEnabled())
        {
            graph.model.beginUpdate();
            
            try
            {
                var cell = graph.addCell(new mxCell(mxResources.get('untitledLayer')), graph.model.root);
                graph.setDefaultParent(cell);
            }
            finally
            {
                graph.model.endUpdate();
            }
        }
        
        mxEvent.consume(evt);
    });
    
    if (!graph.isEnabled())
        addLink.className = 'geButton mxDisabled';
    
    ldiv.appendChild(addLink);
    div.appendChild(ldiv);	
    
    function refresh()
    {
        layerCount = graph.model.getChildCount(graph.model.root);
        listDiv.innerHTML = '';

        function addLayer(index, label, child, defaultParent)
        {
            var ldiv = document.createElement('div');
            ldiv.className = 'geToolbarContainer';

            ldiv.style.overflow = 'hidden';
            ldiv.style.position = 'relative';
            ldiv.style.padding = '4px';
            ldiv.style.height = '22px';
            ldiv.style.display = 'block';
            ldiv.style.backgroundColor = (Dialog.backdropColor == 'white') ? 'whiteSmoke' : Dialog.backdropColor;
            ldiv.style.borderWidth = '0px 0px 1px 0px';
            ldiv.style.borderColor = '#c3c3c3';
            ldiv.style.borderStyle = 'solid';
            ldiv.style.whiteSpace = 'nowrap';
            ldiv.setAttribute('title', label);
            
            var left = document.createElement('div');
            left.style.display = 'inline-block';
            left.style.width = '100%';
            left.style.textOverflow = 'ellipsis';
            left.style.overflow = 'hidden';
            
            mxEvent.addListener(ldiv, 'dragover', function(evt)
            {
                evt.dataTransfer.dropEffect = 'move';
                dropIndex = index;
                evt.stopPropagation();
                evt.preventDefault();
            });
            
            mxEvent.addListener(ldiv, 'dragstart', function(evt)
            {
                dragSource = ldiv;
                
                // Workaround for no DnD on DIV in FF
                if (mxClient.IS_FF)
                {
                    // LATER: Check what triggers a parse as XML on this in FF after drop
                    evt.dataTransfer.setData('Text', '<layer/>');
                }
            });
            
            mxEvent.addListener(ldiv, 'dragend', function(evt)
            {
                if (dragSource != null && dropIndex != null)
                {
                    graph.addCell(child, graph.model.root, dropIndex);
                }

                dragSource = null;
                dropIndex = null;
                evt.stopPropagation();
                evt.preventDefault();
            });

            var btn = document.createElement('img');
            btn.setAttribute('draggable', 'false');
            btn.setAttribute('align', 'top');
            btn.setAttribute('border', '0');
            btn.style.padding = '4px';
            btn.setAttribute('title', mxResources.get('lockUnlock'));

            var state = graph.view.getState(child);
                var style = (state != null) ? state.style : graph.getCellStyle(child);

            if (mxUtils.getValue(style, 'locked', '0') == '1')
            {
                btn.setAttribute('src', Dialog.prototype.lockedImage);
            }
            else
            {
                btn.setAttribute('src', Dialog.prototype.unlockedImage);
            }
            
            if (graph.isEnabled())
            {
                btn.style.cursor = 'pointer';
            }
            
            mxEvent.addListener(btn, 'click', function(evt)
            {
                if (graph.isEnabled())
                {
                    var value = null;
                    
                    graph.getModel().beginUpdate();
                    try
                    {
                        value = (mxUtils.getValue(style, 'locked', '0') == '1') ? null : '1';
                        graph.setCellStyles('locked', value, [child]);
                    }
                    finally
                    {
                        graph.getModel().endUpdate();
                    }

                    if (value == '1')
                    {
                        graph.removeSelectionCells(graph.getModel().getDescendants(child));
                    }
                    
                    mxEvent.consume(evt);
                }
            });

            left.appendChild(btn);

            var inp = document.createElement('input');
            inp.setAttribute('type', 'checkbox');
            inp.setAttribute('title', mxResources.get('hideIt', [child.value || mxResources.get('background')]));
            inp.style.marginLeft = '4px';
            inp.style.marginRight = '6px';
            inp.style.marginTop = '4px';
            left.appendChild(inp);
            
            if (graph.model.isVisible(child))
            {
                inp.setAttribute('checked', 'checked');
                inp.defaultChecked = true;
            }

            mxEvent.addListener(inp, 'click', function(evt)
            {
                graph.model.setVisible(child, !graph.model.isVisible(child));
                mxEvent.consume(evt);
            });

            mxUtils.write(left, label);
            ldiv.appendChild(left);
            
            if (graph.isEnabled())
            {
                // Fallback if no drag and drop is available
                if (mxClient.IS_TOUCH || mxClient.IS_POINTER || (mxClient.IS_IE && document.documentMode < 10))
                {
                    var right = document.createElement('div');
                    right.style.display = 'block';
                    right.style.textAlign = 'right';
                    right.style.whiteSpace = 'nowrap';
                    right.style.position = 'absolute';
                    right.style.right = '6px';
                    right.style.top = '6px';
        
                    // Poor man's change layer order
                    if (index > 0)
                    {
                        var img2 = document.createElement('a');
                        
                        img2.setAttribute('title', mxResources.get('toBack'));
                        
                        img2.className = 'geButton';
                        img2.style.cssFloat = 'none';
                        img2.innerHTML = '&#9660;';
                        img2.style.width = '14px';
                        img2.style.height = '14px';
                        //img2.style.fontSize = '14px';
                        img2.style.margin = '0px';
                        img2.style.marginTop = '-1px';
                        right.appendChild(img2);
                        
                        mxEvent.addListener(img2, 'click', function(evt)
                        {
                            if (graph.isEnabled())
                            {
                                graph.addCell(child, graph.model.root, index - 1);
                            }
                            
                            mxEvent.consume(evt);
                        });
                    }
        
                    if (index >= 0 && index < layerCount - 1)
                    {
                        var img1 = document.createElement('a');
                        
                        img1.setAttribute('title', mxResources.get('toFront'));
                        
                        img1.className = 'geButton';
                        img1.style.cssFloat = 'none';
                        img1.innerHTML = '&#9650;';
                        img1.style.width = '14px';
                        img1.style.height = '14px';
                        //img1.style.fontSize = '14px';
                        img1.style.margin = '0px';
                        img1.style.marginTop = '-1px';
                        right.appendChild(img1);
                        
                        mxEvent.addListener(img1, 'click', function(evt)
                        {
                            if (graph.isEnabled())
                            {
                                graph.addCell(child, graph.model.root, index + 1);
                            }
                            
                            mxEvent.consume(evt);
                        });
                    }
                    
                    ldiv.appendChild(right);
                }
                
                if (!mxClient.IS_IE || document.documentMode >= 10)
                {
                    ldiv.setAttribute('draggable', 'true');
                    ldiv.style.cursor = 'move';
                }
            }

            mxEvent.addListener(ldiv, 'dblclick', function(evt)
            {
                var nodeName = mxEvent.getSource(evt).nodeName;
                
                if (nodeName != 'INPUT' && nodeName != 'IMG')
                {
                    renameLayer(child);
                    mxEvent.consume(evt);
                }
            });

            if (graph.getDefaultParent() == child)
            {
                ldiv.style.background =  (Dialog.backdropColor == 'white') ? '#e6eff8' : '#505759';
                ldiv.style.fontWeight = (graph.isEnabled()) ? 'bold' : '';
                selectionLayer = child;
            }
            else
            {
                mxEvent.addListener(ldiv, 'click', function(evt)
                {
                    if (graph.isEnabled())
                    {
                        graph.setDefaultParent(defaultParent);
                        graph.view.setCurrentRoot(null);
                        refresh();
                    }
                });
            }
            
            listDiv.appendChild(ldiv);
        }
        
        // Cannot be moved or deleted
        for (var i = layerCount - 1; i >= 0; i--)
        {
            (mxUtils.bind(this, function(child)
            {
                addLayer(i, graph.convertValueToString(child) || mxResources.get('background'), child, child);
            }))(graph.model.getChildAt(graph.model.root, i));
        }
        
        var label = graph.convertValueToString(selectionLayer) || mxResources.get('background');
        removeLink.setAttribute('title', mxResources.get('removeIt', [label]));
        duplicateLink.setAttribute('title', mxResources.get('duplicateIt', [label]));
        dataLink.setAttribute('title', mxResources.get('editData'));

        if (graph.isSelectionEmpty())
            insertLink.className = 'geButton mxDisabled';
    }

    refresh();
    graph.model.addListener(mxEvent.CHANGE, function()
    {
        refresh();
    });

    graph.selectionModel.addListener(mxEvent.CHANGE, function()
    {
        if (graph.isSelectionEmpty())
            insertLink.className = 'geButton mxDisabled';
        else
            insertLink.className = 'geButton';
    });

    this.window = new mtWindow(mxResources.get('layers'), div, x, y, w, h, true, true);
    this.window.minimumSize = new mxRectangle(0, 0, w, 80);
    this.window.destroyOnClose = false;
    this.window.setMaximizable(false);
    this.window.setResizable(true);
    this.window.setClosable(true);
    this.window.setVisible(true);

    this.window.addListener(mxEvent.SHOW, mxUtils.bind(this, function()
    {
        this.window.fit();
    }));
    
    // Make refresh available via instance
    this.refreshLayers = refresh;
    
    this.window.setLocation = function(x, y)
    {
        var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
        var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;
        
        x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
        y = Math.max(0, Math.min(y, ih - this.table.clientHeight));

        if (this.getX() != x || this.getY() != y)
            mtWindow.prototype.setLocation.apply(this, arguments);
    };
    
    var resizeListener = mxUtils.bind(this, function()
    {        
        if (this.window.div.clientHeight > graph.container.clientHeight)
            this.window.setSize(this.window.div.style.width, graph.container.clientHeight - 5);
        this.window.setLocation(this.window.getX(), this.window.getY());
    });
    mxEvent.addListener(window, 'resize', resizeListener);

    this.destroy = function ()
    {
        mxEvent.removeListener(window, 'resize', resizeListener);
        this.window.destroy();
    };
};

/**
 * Constructs a new sidebar window.
 */
var SidebarWindow = function (editorUi, point, w, h)
{
    var x = point.x;
    var y = point.y;

    var graph     = editorUi.editor.graph;
    var container = editorUi.createDiv('geSidebarContainer');

    this.window = new mtWindow(mxResources.get('sidebar'), container, x, y, w, h, true, true);
    this.window.minimumSize = new mxRectangle(0, 0, w, 80);
    this.window.destroyOnClose = false;
    this.window.setMaximizable(false);
    this.window.setResizable(true);
    this.window.setClosable(true);
    this.window.setVisible(true);

    this.window.setLocation = function (x, y)
    {
        var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
        var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;

        x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
        y = Math.max(0, Math.min(y, ih - this.table.clientHeight));

        if (this.getX() != x || this.getY() != y)
            mtWindow.prototype.setLocation.apply(this, arguments);
    };

    var resizeListener = mxUtils.bind(this, function ()
    {
        if (this.window.div.clientHeight > graph.container.clientHeight)
            this.window.setSize(this.window.div.style.width, graph.container.clientHeight - 5);
        this.window.setLocation(this.window.getX(), this.window.getY());
    });
    mxEvent.addListener(window, 'resize', resizeListener);

    var sidebar = new Sidebar(editorUi, container);

    this.destroy = function ()
    {
        mxEvent.removeListener(window, 'resize', resizeListener);
        this.window.destroy();
        sidebar.destroy();
    };
    this.window.addListener(mxEvent.SHOW, mxUtils.bind(this, function ()
    {
        this.window.fit();
    }));
};

/**
 * Constructs a new format window.
 */
var FormatWindow = function (editorUi, point, w, h)
{
    var x = point.x;
    var y = point.y;

    var graph = editorUi.editor.graph;
    var container = editorUi.createDiv('geSidebarContainer geFormatContainer');

    this.window = new mtWindow(mxResources.get('properties'), container, x, y, w, h, true, true);
    this.window.minimumSize = new mxRectangle(0, 0, w, 80);
    this.window.destroyOnClose = false;
    this.window.setMaximizable(false);
    this.window.setResizable(true);
    this.window.setClosable(true);
    this.window.setVisible(true);

    this.window.setLocation = function (x, y)
    {
        var iw = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth;
        var ih = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight;

        x = Math.max(0, Math.min(x, iw - this.table.clientWidth));
        y = Math.max(0, Math.min(y, ih - this.table.clientHeight));

        if (this.getX() != x || this.getY() != y)
            mtWindow.prototype.setLocation.apply(this, arguments);
    };

    var resizeListener = mxUtils.bind(this, function ()
    {
        if (this.window.div.clientHeight > graph.container.clientHeight)
            this.window.setSize(this.window.div.style.width, graph.container.clientHeight - 5);
        this.window.setLocation(this.window.getX(), this.window.getY());
    });
    mxEvent.addListener(window, 'resize', resizeListener);

    var format = new Format(editorUi, container);

    this.destroy = function ()
    {
        mxEvent.removeListener(window, 'resize', resizeListener);
        this.window.destroy();
        format.destroy();
    };
    this.window.addListener(mxEvent.SHOW, mxUtils.bind(this, function ()
    {
        this.window.fit();
    }));
};

/**
 * Constructs a new bindings window.
 */
var BindingsWindow = function (editorUi, modal, w, h)
{
    let window = $$('bindingsWindow');
    if (window == null)
    {
        var content = editorUi.createDiv('geBindingsContainer');
        window = webix.ui({
            view: "window",
            head: mxResources.get('bindings'),
            css: "bindingsWindow",
            move: true,
            close: true,
            resize: true,
            modal: modal,
            autofocus: true,
            autofit: true,
            toFront: true,
            point: true,
            width:  w || 800,
            height: h || 500,
            id: 'bindingsWindow',
            position: "center",
            body:
            {
                rows:
                    [
                        {
                            css: "content",
                            content: content
                        },
                        {
                            view: "button", width: 0, height: 1, css: "hidden", hotkey: "esc",
                            click: function ()
                            {
                                window.hide();
                            }
                        }
                    ]
            }
        });

        // custom method
        window.setTitle = function (title)
        {
            let header = window.getHead().getChildViews()[0];
            if (header != null)
                header.setHTML(title);
        };

        var bindings = new Bindings(window, content);

        var editorUiIsEventIgnored = editorUi.keyHandler.isEventIgnored;
        editorUi.keyHandler.isEventIgnored = function (evt)
        {
            let ignored = editorUiIsEventIgnored.apply(this, arguments);
            if (window.isVisible())
            {
                if (window.config.modal)
                    ignored = true;
                else
                {
                    let focused = webix.UIManager.getFocus();
                    if (focused != null)
                    {
                        let topView = focused.getTopParentView();
                        if (topView != null && topView.parentElement != null)
                            ignored |= $(topView.parentElement).hasClass('geBindingsContainer');
                    }
                }
            }
            return ignored;
        };

        window.attachEvent('onShow', function ()
        {
            bindings.refresh();
            editorUi.fireEvent(new mxEventObject('bindings'));
        });
        window.attachEvent('onHide', function ()
        {
            if (!bindings.validate())
            {
                window.show();
                return;
            }
            editorUi.fireEvent(new mxEventObject('bindings'));
        });
        window.attachEvent('onViewResize', function ()
        {
            bindings.adjust();
        });

        this.destroy = function ()
        {
            bindings.destroy();
            window.destructor();
        };
    }
    return window;
};

/**
 * Constructs a new camera window.
 */
var CameraWindow = function (editorUi, srcID)
{
    let window = $$(srcID);
    if (window == null)
    {
        window = webix.ui({
            view: "window",
            head: "Камера",
            move: true,
            close: true,
            resize: true,
            width: 600,
            height: 430,
            id: srcID,
            //position: "center",
            body:
            {
                template: function (obj)
                {
                    return "<canvas id='" + srcID + "' width='100%' height='100%' style='width:100%;height:100%' />";
                }
            }
        });

        let body = window.getBody();
        let image = new Image();

        //let createQuery = function ()
        //{
        //    if (isNullOrEmpty(path.href))
        //        return null;
        //    return path.href + (path.href.indexOf('?') > 0 ? '&' : "?") + 't=' + Date.now();
        //};
        let updateView = function ()
        {
            // get last shot
            AJAX.get(API.FUNC.cameraShot, 'id=' + srcID,
                function (xhr, resp)
                {
                    if (resp != null)
                        image.src = "data:image/jpeg; base64," + resp;
                },
                function (xhr, err)
                {
                    image.src = null;
                });
        };
        let updateRoutine = mxUtils.bind(window, updateView);

        window.attachEvent('onBeforeShow', function ()
        {
            updateView();
        });
        image.onload = function ()
        {
            if (!window.context)
            {
                window.canvas = document.getElementById(srcID);
                window.context = window.canvas.getContext("2d");
            }

            // update size
            let width = body.$width;
            let height = body.$height;
            window.canvas.setAttribute("width", width);
            image.setAttribute("width", width);
            window.canvas.setAttribute("height", height);
            image.setAttribute("height", height);
            // draw image
            window.context.drawImage(this, 0, 0, width, height);
            setTimeout(updateRoutine, 300);
        };

        window.attachEvent('onHide', function ()
        {
            image.onload = null;
            window.close();
            window.destructor();
        });
    }
    return window;
};

/**
 * Constructs a new modal equipment window.
 */
var EquipmentWindow = function (editorUi, eqID)
{
    let window = $$(eqID);
    if (window == null)
    {
        let graph  = editorUi.editor.graph;
        let format = graph.pageFormat;

        window = webix.ui({
            view: "window",
            modal: true,
            head: 'Оборудование',
            move: true,
            close: true,
            resize: true,
            width:  format.width,
            height: format.height,
            id: eqID,
            position: "center",
            body:
            {
                view: "iframe",
                src: HELP.buildUrl(API.FUNC.schemeEqView, 'id=' + eqID + "&mode=layout")
            }
        });

        window.attachEvent('onHide', function ()
        {
            window.close();
            window.destructor();
        });
    }
    return window;
};