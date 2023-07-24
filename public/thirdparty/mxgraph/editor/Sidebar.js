/**
 * Construcs a new sidebar for the given editor.
 */
function Sidebar(editorUi, container)
{
    this.editorUi = editorUi;
    this.container = container;
    this.palettes = new Object();
    this.showTooltips = true;
    this.graph = editorUi.createTemporaryGraph(this.editorUi.editor.graph.getStylesheet());
    this.graph.cellRenderer.minSvgStrokeWidth = this.minThumbStrokeWidth;
    this.graph.cellRenderer.antiAlias = this.thumbAntiAlias;
    this.graph.container.style.visibility = 'hidden';
    this.graph.foldingEnabled = false;

    document.body.appendChild(this.graph.container);
    
    this.pointerUpHandler = mxUtils.bind(this, function()
    {
        this.showTooltips = true;
    });
    mxEvent.addListener(document, (mxClient.IS_POINTER) ? 'pointerup' : 'mouseup', this.pointerUpHandler);

    this.pointerDownHandler = mxUtils.bind(this, function()
    {
        this.showTooltips = false;
        this.hideTooltip();
    });
    mxEvent.addListener(document, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown', this.pointerDownHandler);
    
    this.pointerMoveHandler = mxUtils.bind(this, function(evt)
    {
        var src = mxEvent.getSource(evt);
        
        while (src != null)
        {
            if (src == this.currentElt)
            {
                return;
            }
            
            src = src.parentNode;
        }
        
        this.hideTooltip();
    });
    mxEvent.addListener(document, (mxClient.IS_POINTER) ? 'pointermove' : 'mousemove', this.pointerMoveHandler);

    // Handles mouse leaving the window
    this.pointerOutHandler = mxUtils.bind(this, function(evt)
    {
        if (evt.toElement == null && evt.relatedTarget == null)
            this.hideTooltip();
    });
    mxEvent.addListener(document, (mxClient.IS_POINTER) ? 'pointerout' : 'mouseout', this.pointerOutHandler);

    // Enables tooltips after scroll
    mxEvent.addListener(container, 'scroll', mxUtils.bind(this, function()
    {
        this.showTooltips = true;
        this.hideTooltip();
    }));
    
    this.init();
}

/**
 * Adds all palettes to the sidebar.
 */
Sidebar.prototype.init = function()
{   
    if (this.editorUi.editor.isViewMode())
    {
        this.addDispatcherPalette(true);
    } else
    {
        this.addGeneralPalette(true);
        this.addFSKPalette(true);
    }    
};

Sidebar.prototype.collapsedImage    = 'data:image/gif;base64,R0lGODlhDQANAIABAJmZmf///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozNUQyRTJFNjZGNUYxMUU1QjZEOThCNDYxMDQ2MzNCQiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozNUQyRTJFNzZGNUYxMUU1QjZEOThCNDYxMDQ2MzNCQiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFERjc3MEUxNkY1RjExRTVCNkQ5OEI0NjEwNDYzM0JCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjFERjc3MEUyNkY1RjExRTVCNkQ5OEI0NjEwNDYzM0JCIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEAQAAAQAsAAAAAA0ADQAAAhSMj6lrwAjcC1GyahV+dcZJgeIIFgA7';
Sidebar.prototype.expandedImage     = 'data:image/gif;base64,R0lGODlhDQANAIABAJmZmf///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxREY3NzBERjZGNUYxMUU1QjZEOThCNDYxMDQ2MzNCQiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxREY3NzBFMDZGNUYxMUU1QjZEOThCNDYxMDQ2MzNCQiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFERjc3MERENkY1RjExRTVCNkQ5OEI0NjEwNDYzM0JCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjFERjc3MERFNkY1RjExRTVCNkQ5OEI0NjEwNDYzM0JCIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEAQAAAQAsAAAAAA0ADQAAAhGMj6nL3QAjVHIu6azbvPtWAAA7';
Sidebar.prototype.dragPreviewBorder = '1px dashed black';

/**
 * Specifies if tooltips should be visible. Default is true.
 */
Sidebar.prototype.enableTooltips = true;
/**
 * Specifies the delay for the tooltip. Default is 10px.
 */
Sidebar.prototype.tooltipBorder = 10;
/**
 * Specifies the delay for the tooltip. Default is 300 ms.
 */
Sidebar.prototype.tooltipDelay = 300;
/**
 * Specifies the delay for the drop target icons. Default is 200 ms.
 */
Sidebar.prototype.dropTargetDelay = 200;

/**
 * Specifies the width of the thumbnails.
 */
Sidebar.prototype.thumbWidth = 30;
/**
 * Specifies the height of the thumbnails.
 */
Sidebar.prototype.thumbHeight = 30;
/**
 * Specifies the width of the thumbnails.
 */
Sidebar.prototype.minThumbStrokeWidth = 1;
/**
 * Specifies the width of the thumbnails.
 */
Sidebar.prototype.thumbAntiAlias = true;
/**
 * Specifies the padding for the thumbnails. Default is 2.
 */
Sidebar.prototype.thumbPadding = 2;
/**
 * Specifies the border for thumbnails. Default is 1 px.
 */
Sidebar.prototype.thumbBorder = 1;

/**
 * Specifies if titles in the tooltips should be enabled.
 */
Sidebar.prototype.tooltipTitles    = true;
Sidebar.prototype.maxTooltipWidth  = 350;
Sidebar.prototype.maxTooltipHeight = 300;

Sidebar.prototype.getTooltipOffset = function()
{
    var wnd = $(this.container).parents('div:last')[0];
    return wnd ? new mxPoint(wnd.offsetLeft, wnd.offsetTop) : new mxPoint(0, 0);
};
Sidebar.prototype.showTooltip = function (elt, cells, w, h, title, showLabel, showTitle)
{
    if (this.enableTooltips && this.showTooltips)
    {
        if (this.currentElt != elt)
        {
            if (this.thread != null)
            {
                window.clearTimeout(this.thread);
                this.thread = null;
            }
            
            var show = mxUtils.bind(this, function()
            {
                // Lazy creation of the DOM nodes and graph instance
                if (this.tooltip == null)
                {
                    this.tooltip = document.createElement('div');
                    this.tooltip.className = 'geSidebarTooltip';
                    this.tooltip.style.zIndex = mxPopupMenu.prototype.zIndex - 1;
                    document.body.appendChild(this.tooltip);
                    
                    this.graph2 = new Graph(this.tooltip, null, null, this.editorUi.editor.graph.getStylesheet());
                    this.graph2.resetViewOnRootChange = false;
                    this.graph2.foldingEnabled = false;
                    this.graph2.gridEnabled = false;
                    this.graph2.autoScroll = false;
                    this.graph2.setTooltips(false);
                    this.graph2.setConnectable(false);
                    this.graph2.setEnabled(false);
                }
                
                this.graph2.model.clear();
                this.graph2.view.setTranslate(this.tooltipBorder, this.tooltipBorder);

                if (w > this.maxTooltipWidth || h > this.maxTooltipHeight)
                    this.graph2.view.scale = Math.round(Math.min(this.maxTooltipWidth / w, this.maxTooltipHeight / h) * 100) / 100;
                else
                    this.graph2.view.scale = 1;
                
                this.tooltip.style.display = 'block';
                //this.graph2.labelsVisible = (showLabel == null || showLabel);
                var fo = mxClient.NO_FO;
                mxClient.NO_FO = Editor.prototype.originalNoForeignObject;
                this.graph2.addCells(cells);
                mxClient.NO_FO = fo;
                
                var bounds = this.graph2.getGraphBounds();
                var width  = bounds.width  + 2 * this.tooltipBorder;
                var height = bounds.height + 2 * this.tooltipBorder;

                this.tooltip.style.overflow = 'visible';
                this.tooltip.style.width = width + 'px';
                var w2 = width;

                // Adds title for entry
                var showTooltipTitle = (showTitle == null || showTitle);
                if (this.tooltipTitles && showTooltipTitle && title != null && title.length > 0)
                {
                    // Tooltip width correction
                    var titleSize = mxUtils.getSizeForString(title.replace(/\n/g, "<br>"));
                    width = (width <= titleSize.width ? titleSize.width : width) + 20;
                    this.tooltip.style.width = width + 'px';

                    if (this.tooltipTitle == null)
                    {
                        this.tooltipTitle = document.createElement('div');
                        this.tooltipTitle.style.borderTop = '1px solid gray';
                        this.tooltipTitle.style.textAlign = 'center';
                        this.tooltipTitle.style.width     = '100%';
                        
                        // Oversize titles are cut-off currently. Should make tooltip wider later.
                        this.tooltipTitle.style.overflow   = 'hidden';
                        this.tooltipTitle.style.position   = 'absolute';
                        this.tooltipTitle.style.paddingTop = '6px';
                        this.tooltipTitle.style.bottom     = '6px';

                        this.tooltip.appendChild(this.tooltipTitle);
                    }
                    else
                    {
                        this.tooltipTitle.innerHTML = '';
                    }
                    
                    this.tooltipTitle.style.display = '';
                    mxUtils.write(this.tooltipTitle, title);

                    // Allows for wider labels
                    w2 = Math.min(this.maxTooltipWidth, Math.max(width, this.tooltipTitle.scrollWidth + 4));

                    var ddy = this.tooltipTitle.offsetHeight + 10;
                    height += ddy;
                    this.tooltipTitle.style.marginTop = (2 - ddy) + 'px';
                }
                else if (this.tooltipTitle != null && this.tooltipTitle.parentNode != null)
                {
                    this.tooltipTitle.style.display = 'none';
                }

                // Updates width if label is wider
                if (w2 > width)
                {
                    this.tooltip.style.width = w2 + 'px';
                }

                this.tooltip.style.height = height + 'px';
                
                var off = this.getTooltipOffset();
                var left = off.x + this.container.clientWidth + 20;
                var top  = off.y + this.container.offsetTop + elt.offsetTop - this.container.scrollTop;

                this.graph2.center(true, true, 0.5, 0.3);

                // Workaround for ignored position CSS style in IE9 (changes to relative without the following line)
                this.tooltip.style.position = 'absolute';
                this.tooltip.style.left     = left + 'px';
                this.tooltip.style.top      = top + 'px';
            });

            if (this.tooltip != null && this.tooltip.style.display != 'none')
                show();
            else
                this.thread = window.setTimeout(show, this.tooltipDelay);

            this.currentElt = elt;
        }
    }
};
Sidebar.prototype.hideTooltip = function()
{
    if (this.thread != null)
    {
        window.clearTimeout(this.thread);
        this.thread = null;
    }
    
    if (this.tooltip != null)
    {
        this.tooltip.style.display = 'none';
        this.currentElt = null;
    }
};

Sidebar.prototype.addEntry = function(tags, fn)
{
    return fn;
};
Sidebar.prototype.cloneCell = function(cell, value)
{
    var clone = cell.clone();
    if (value != null)
        clone.value = value;
    return clone;
};

Sidebar.prototype.addGeneralPalette = function(expand)
{    
    var sb = this;
    
    var fns = [
        this.createVertexTemplateEntry('text;whiteSpace=wrap;overflow=hidden;', 40, 30, 'Текст', 'Текст'),
        this.createVertexTemplateEntry('text;html=1;spacing=5;spacingTop=-20;whiteSpace=wrap;overflow=hidden;', 150, 75,'<h1>Заголовок</h1><p>Произвольный текст.</p>', 'Текстовое поле/HTML'),
        this.createVertexTemplateEntry('rectangle', 60, 30, '', 'Прямоугольник'),
        this.createVertexTemplateEntry('ellipse', 60, 30, '', 'Эллипс'),
        this.createVertexTemplateEntry('rectangle;aspect=fixed;', 30, 30, '', 'Квадрат'),
        this.createVertexTemplateEntry('ellipse;aspect=fixed;', 30, 30, '', 'Окружность'),
        this.createVertexTemplateEntry('rhombus', 30, 30, '', 'Ромб'),
        this.createVertexTemplateEntry('triangle', 30, 30, '', 'Треугольник'),
        this.createVertexTemplateEntry('trapezoid', 40, 30, '', 'Трапеция'),
        this.createVertexTemplateEntry('parallelogram', 60, 30, '', 'Параллелограм'),
        this.createVertexTemplateEntry('cylinder', 30, 40, '', 'Цилиндр'),
        this.createVertexTemplateEntry('cube', 40, 30, '', 'Куб'),
        this.createVertexTemplateEntry('cloud', 30, 30, '', 'Облако'),
        this.createVertexTemplateEntry('actor', 25, 30, '', 'Человек'),
        //this.createEdgeTemplateEntry('arrow', 60, 30, '', 'Стрелка', true, true), // <-- arrow is edge !!!
        this.createVertexTemplateEntry('singleArrow', 60, 30, '', 'Стрелка'),
        this.createVertexTemplateEntry('doubleArrow', 60, 30, '', 'Двойная стрелка'),
        this.createVertexTemplateEntry('arc', 15, 30, '', 'Дуга'),
        this.createEdgeTemplateEntry('endArrow=none;html=1;', 50, 50, '', 'Линия'),
        this.createEdgeTemplateEntry('shape=link;html=1;', 50, 50, '', 'Двойная линия'),
        this.createVertexTemplateEntry('button', 50, 30, 'ОК', 'Кнопка'),
        this.createVertexTemplateEntry('image', 30, 30, '', 'Изображение'),
        this.createVertexTemplateEntry('sound', 30, 30, '', 'Звук'),
        this.createVertexTemplateEntry('table', 150, 80, 'Таблица', 'Таблица'),
        this.createVertexTemplateEntry('swimlane', 150, 100, 'Контейнер', 'Контейнер'),
        this.addEntry('hyperlink', mxUtils.bind(this, function ()
        {
            var cell = new mxCell('WWW', new mxGeometry(0, 0, 40, 25), 'text;html=1;shape=label;strokeColor=none;fillColor=none;whiteSpace=wrap;align=center;verticalAlign=middle;fontColor=#0000EE;fontStyle=4;');
            cell.vertex = true;
            this.graph.setLinkForCell(cell, 'https://');
            return this.createVertexTemplateFromCells([cell], cell.geometry.width, cell.geometry.height, 'Ссылка');
        })),
        this.createVertexTemplateEntry('chart', 230, 140, null, 'График'),
// @if LINKMT
        this.createVertexTemplateEntry('bmrz', 50, 50, null, 'Блок БМРЗ')
// @endif
    ];
    
    this.addPaletteFunctions('general', mxResources.get('general'), (expand != null) ? expand : true, fns);
};
Sidebar.prototype.addFSKPalette = function (expand)
{
    var fns = [
        // dynamic
        this.createVertexTemplateEntry('bus', 150, 20, null, 'Шина'),
        this.createVertexTemplateEntry('switch', 20, 20, null, 'Выключатель'),
        this.createVertexTemplateEntry('rollswitch', 20, 60, null, 'Выкатные тележки КРУ, выкатные автоматы 0.4 кВ'),
        this.createVertexTemplateEntry('rolldisconnector', 20, 60, null, 'Выкатная тележка разъединителя'),
        this.createVertexTemplateEntry('disconnector', 25, 30, null, 'Разъединитель'),
        this.createVertexTemplateEntry('separator', 25, 30, null, 'Отделитель'),
        this.createVertexTemplateEntry('ground', 25, 40, null, 'Заземляющий нож'),
        this.createVertexTemplateEntry('contactor', 25, 40, null, 'Короткозамыкатель'),
        this.createVertexTemplateEntry('rollelement', 20, 15, null, 'Выкатной элемент'),
        this.createVertexTemplateEntry('actuator', 50, 25, null, 'Задвижка'),
        this.createVertexTemplateEntry('simpleswitch', 20, 30, null, 'Простой выключатель'),
        // static
        this.createVertexTemplateEntry('wstar', 30, 20, null, "Обозначение обмотки типа 'Звезда'"),
        this.createVertexTemplateEntry('wtriangle', 30, 30, null, "Обозначение обмотки типа 'Треугольник'"),
        this.createVertexTemplateEntry('wtorn', 30, 14, null, "Обозначение обмотки типа 'Разорванный треугольник'"),
        this.createVertexTemplateEntry('fuse', 15, 30, null, "Предохранитель"),
        this.createVertexTemplateEntry('current_transformer', 25, 35, null, "Трансформатор тока"),
        this.createVertexTemplateEntry('current_transformer_ru', 20, 35, null, "Трансформатор тока"),
        this.createVertexTemplateEntry('current_transformer_fsk', 40, 30, null, "Трансформатор тока"),
        this.createVertexTemplateEntry('reactor', 30, 30, null, "Реактор"),
        this.createVertexTemplateEntry('opn',  20, 30, null, "Ограничитель перенапряжения(ОПН)"),
        this.createVertexTemplateEntry('opn_nl', 20, 30, null, "Ограничитель перенапряжения(ОПН) нелинейный"),
        this.createVertexTemplateEntry('rezistor', 15, 30, null, "Сопротивление"),
        this.createVertexTemplateEntry('condensator', 20, 20, null, "Конденсатор"),
        this.createVertexTemplateEntry('inductance', 10, 30, null, "Индуктивность"),
        this.createVertexTemplateEntry('ground1', 20, 10, null, "Заземление"),
        this.createVertexTemplateEntry('cable_cone', 30, 30, null, "Кабельная воронка"),
        this.createVertexTemplateEntry('ac', 20, 10, null, "Переменное напряжение"),
        this.createVertexTemplateEntry('load', 10, 20, null, "Нагрузка"),
        this.createVertexTemplateEntry('compensator', 20, 20, null, "Синхронный компенсатор")
    ];
        this.addPaletteFunctions('fsk', "ФСК ЕЭС", expand, fns);
};

Sidebar.prototype.addDispatcherPalette = function (expanded)
{
    var fns = [
        this.createVertexTemplateEntry('poster', 80, 40, null, "Плакат"),
        this.createVertexTemplateEntry('dispatcher_mark', 40, 40, null, "Пометка"),
    ];
    this.addPaletteFunctions('dispatcher', "Диспетчерские пометки", expanded, fns);
};

/**
 * Creates and returns the given title element.
 */
Sidebar.prototype.createTitle = function(label)
{
    var elt = document.createElement('a');
    elt.setAttribute('title', mxResources.get('sidebarTooltip'));
    elt.className = 'geTitle';
    mxUtils.write(elt, label);
    return elt;
};
/**
 * Creates a thumbnail for the given cells.
 */
Sidebar.prototype.createThumb = function(cells, width, height, parent, title, showLabel, showTitle, realWidth, realHeight)
{
    this.graph.labelsVisible = (showLabel == null || showLabel);
    var fo = mxClient.NO_FO;
    mxClient.NO_FO = Editor.prototype.originalNoForeignObject;
    this.graph.view.scaleAndTranslate(1, 0, 0);
    this.graph.addCells(cells);
    var bounds = this.graph.getGraphBounds();
    var s = Math.floor(Math.min((width - 2 * this.thumbBorder) / bounds.width,
            (height - 2 * this.thumbBorder) / bounds.height) * 100) / 100;
    this.graph.view.scaleAndTranslate(s, Math.floor((width - bounds.width * s) / 2 / s - bounds.x),
            Math.floor((height - bounds.height * s) / 2 / s - bounds.y));
    var node = null;
    
    // For supporting HTML labels in IE9 standards mode the container is cloned instead
    if (this.graph.dialect == mxConstants.DIALECT_SVG && !mxClient.NO_FO && this.graph.view.getCanvas().ownerSVGElement != null)
    {
        node = this.graph.view.getCanvas().ownerSVGElement.cloneNode(true);
    }
    else
    {
        node = this.graph.container.cloneNode(false);
        node.innerHTML = this.graph.container.innerHTML;
    }
    
    this.graph.getModel().clear();
    mxClient.NO_FO = fo;
        
    node.style.position = 'relative';
    node.style.overflow = 'hidden';
    node.style.left = this.thumbBorder + 'px';
    node.style.top = this.thumbBorder + 'px';
    node.style.width = width + 'px';
    node.style.height = height + 'px';
    node.style.visibility = '';
    node.style.minWidth = '';
    node.style.minHeight = '';
    
    parent.appendChild(node);
    
    return bounds;
};

/**
 * Creates and returns a new palette item for the given image.
 */
Sidebar.prototype.createItem = function(cells, title, showLabel, showTitle, width, height, allowCellsInserted)
{
    var elt            = document.createElement('a');
    elt.className      = 'geItem';
    elt.style.overflow = 'hidden';
    var border         = this.thumbBorder * 2;
    elt.style.width    = (this.thumbWidth + border) + 'px';
    elt.style.height   = (this.thumbHeight + border) + 'px';
    elt.style.padding  = this.thumbPadding + 'px';
    
    // Blocks default click action
    mxEvent.addListener(elt, 'click', function(evt)
    {
        mxEvent.consume(evt);
    });

    this.createThumb(cells, this.thumbWidth, this.thumbHeight, elt, title, showLabel, showTitle, width, height);
    var bounds = new mxRectangle(0, 0, width, height);
    
    if (cells.length > 1 || cells[0].vertex)
    {
        var ds = this.createDragSource(elt, 
            this.createDropHandler(cells, true, allowCellsInserted, bounds),
            this.createDragPreview(width, height), cells, bounds);
        this.addClickHandler(elt, ds, cells);
    
        // Uses guides for vertices only if enabled in graph
        ds.isGuidesEnabled = mxUtils.bind(this, function()
        {
            return this.editorUi.editor.graph.graphHandler.guidesEnabled;
        });
    }
    else if (cells[0] != null && cells[0].edge)
    {
        var ds = this.createDragSource(elt, this.createDropHandler(cells, false, allowCellsInserted,
            bounds), this.createDragPreview(width, height), cells, bounds);
        this.addClickHandler(elt, ds, cells);
    }
    
    // Shows a tooltip with the rendered cell
    if (!mxClient.IS_IOS)
    {
        mxEvent.addGestureListeners(elt, null, mxUtils.bind(this, function(evt)
        {
            if (mxEvent.isMouseEvent(evt))
                this.showTooltip(elt, cells, bounds.width, bounds.height, title, showLabel, showTitle);
        }));
    }
    
    return elt;
};

Sidebar.prototype.updateShapes = function(source, targets)
{
    var graph = this.editorUi.editor.graph;
    var sourceCellStyle = graph.getCellStyle(source);
    var result = [];
    
    graph.model.beginUpdate();
    try
    {
        var cellStyle = graph.getModel().getStyle(source);

        // Lists the styles to carry over from the existing shape
        var styles = ['shadow', 'dashed', 'dashPattern', 'fontFamily', 'fontSize', 'fontColor', 'align', 'startFill',
                      'startSize', 'endFill', 'endSize', 'strokeColor', 'strokeWidth', 'fillColor', 'gradientColor',
                      'html', 'part', 'noEdgeStyle', 'edgeStyle', 'elbow', 'childLayout', 'recursiveResize',
                      'container', 'collapsible', mxConstants.STYLE_CONNECTABLE];
        
        for (var i = 0; i < targets.length; i++)
        {
            var targetCell = targets[i];
            
            if ((graph.getModel().isVertex(targetCell) == graph.getModel().isVertex(source)) ||
                (graph.getModel().isEdge(targetCell) == graph.getModel().isEdge(source)))
            {
                var state = graph.view.getState(targetCell);
                var style = (state != null) ? state.style : graph.getCellStyle(targets[i]);
                graph.getModel().setStyle(targetCell, cellStyle);
                
                // Removes all children of composite cells
                if (state != null && mxUtils.getValue(state.style, 'composite', '0') == '1')
                {
                    var childCount = graph.model.getChildCount(targetCell);
                    
                    for (var j = childCount; j >= 0; j--)
                    {
                        graph.model.remove(graph.model.getChildAt(targetCell, j));
                    }
                }

                if (style != null)
                {                    
                    for (var j = 0; j < styles.length; j++)
                    {
                        var value = style[styles[j]];
                        
                        if (value != null)
                        {
                            graph.setCellStyles(styles[j], value, [targetCell]);
                        }
                    }
                }
                
                result.push(targetCell);
            }
        }
    }
    finally
    {
        graph.model.endUpdate();
    }
    
    return result;
};
/**
 * Creates a drop handler for inserting the given cells.
 */
Sidebar.prototype.createDropHandler = function(cells, allowSplit, allowCellsInserted, bounds)
{
    allowCellsInserted = (allowCellsInserted != null) ? allowCellsInserted : true;
    
    return mxUtils.bind(this, function(graph, evt, target, x, y, force)
    {
        var elt = (force) ? null : ((mxEvent.isTouchEvent(evt) || mxEvent.isPenEvent(evt)) ?
            document.elementFromPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt)) :
            mxEvent.getSource(evt));
        
        while (elt != null && elt != this.container)
        {
            elt = elt.parentNode;
        }
        
        if (elt == null && graph.isEnabled())
        {
            cells = graph.getImportableCells(cells);
            
            if (cells.length > 0)
            {
                graph.stopEditing();
                
                // Holding alt while mouse is released ignores drop target
                var validDropTarget = (target != null && !mxEvent.isAltDown(evt)) ? graph.isValidDropTarget(target, cells, evt) : false;
                var select = null;

                if (target != null && !validDropTarget)
                    target = null;
                
                if (!graph.isCellLocked(target || graph.getDefaultParent()))
                {
                    graph.model.beginUpdate();
                    try
                    {
                        x = Math.round(x);
                        y = Math.round(y);
                        
                        // Splits the target edge or inserts into target group
                        if (allowSplit && graph.isSplitTarget(target, cells, evt))
                        {
                            var clones = graph.cloneCells(cells);
                            graph.splitEdge(target, clones, null,
                                x - bounds.width / 2, y - bounds.height / 2);
                            select = clones;
                        }
                        else if (cells.length > 0)
                        {
                            select = graph.importCells(cells, x, y, target);
                        }
                        
                        // Executes parent layout hooks for position/order
                        if (graph.layoutManager != null)
                        {
                            var layout = graph.layoutManager.getLayout(target);
                            
                            if (layout != null)
                            {
                                var s = graph.view.scale;
                                var tr = graph.view.translate;
                                var tx = (x + tr.x) * s;
                                var ty = (y + tr.y) * s;
                                
                                for (var i = 0; i < select.length; i++)
                                {
                                    layout.moveCell(select[i], tx, ty);
                                }
                            }
                        }
    
                        if (allowCellsInserted && (evt == null || !mxEvent.isShiftDown(evt)))
                        {
                            graph.fireEvent(new mxEventObject('cellsInserted', 'cells', select));
                        }
                    }
                    catch (e)
                    {
                        this.editorUi.handleError(e);
                    }
                    finally
                    {
                        graph.model.endUpdate();
                    }
    
                    if (select != null && select.length > 0)
                    {
                        graph.scrollCellToVisible(select[0]);
                        graph.setSelectionCells(select);
                    }

                    if (graph.editAfterInsert && evt != null && mxEvent.isMouseEvent(evt) &&
                        select != null && select.length == 1)
                    {
                        window.setTimeout(function()
                        {
                            graph.startEditing(select[0]);
                        }, 0);
                    }
                }
            }
            
            mxEvent.consume(evt);
        }
    });
};
/**
 * Creates and returns a preview element for the given width and height.
 */
Sidebar.prototype.createDragPreview = function(width, height)
{
    var elt = document.createElement('div');
    elt.style.border = this.dragPreviewBorder;
    elt.style.width = width + 'px';
    elt.style.height = height + 'px';
    
    return elt;
};

/**
 * Creates a drag source for the given element.
 */
Sidebar.prototype.dropAndConnect = function(source, targets, direction, dropCellIndex, evt)
{
    var geo = this.getDropAndConnectGeometry(source, targets[dropCellIndex], direction, targets);
    
    // Targets without the new edge for selection
    var tmp = [];
    
    if (geo != null)
    {
        var graph = this.editorUi.editor.graph;
        var editingCell = null;

        graph.model.beginUpdate();
        try
        {
            var sourceGeo = graph.getCellGeometry(source);
            var geo2 = graph.getCellGeometry(targets[dropCellIndex]);

            // Handles special case where target should be ignored for stack layouts
            var targetParent = graph.model.getParent(source);
            var validLayout = true;
            
            // Ignores parent if it has a stack layout
            if (graph.layoutManager != null)
            {
                var layout = graph.layoutManager.getLayout(targetParent);
            
                // LATER: Use parent of parent if valid layout
                if (layout != null && layout.constructor == mxStackLayout)
                {
                    validLayout = false;

                    var tmp = graph.view.getState(targetParent);
                    
                    // Offsets by parent position
                    if (tmp != null)
                    {
                        var offset = new mxPoint((tmp.x / graph.view.scale - graph.view.translate.x),
                                (tmp.y / graph.view.scale - graph.view.translate.y));
                        geo.x += offset.x;
                        geo.y += offset.y;
                        var pt = geo.getTerminalPoint(false);
                        
                        if (pt != null)
                        {
                            pt.x += offset.x;
                            pt.y += offset.y;
                        }
                    }
                }
            }
            
            var dx = geo2.x;
            var dy = geo2.y;
            
            // Ignores geometry of edges
            if (graph.model.isEdge(targets[dropCellIndex]))
            {
                dx = 0;
                dy = 0;
            }
            
            var useParent = graph.model.isEdge(source) || (sourceGeo != null && !sourceGeo.relative && validLayout);
            targets = graph.importCells(targets, (geo.x - (useParent ? dx : 0)),
                    (geo.y - (useParent ? dy : 0)), (useParent) ? targetParent : null);
            tmp = targets;
            
            if (graph.model.isEdge(source))
            {
                // Adds new terminal to edge
                // LATER: Push new terminal out radially from edge start point
                graph.model.setTerminal(source, targets[dropCellIndex], direction == mxConstants.DIRECTION_NORTH);
            }
            else if (graph.model.isEdge(targets[dropCellIndex]))
            {
                // Adds new outgoing connection to vertex and clears points
                graph.model.setTerminal(targets[dropCellIndex], source, true);
                var geo3 = graph.getCellGeometry(targets[dropCellIndex]);
                geo3.points = null;
                
                if (geo3.getTerminalPoint(false) != null)
                {
                    geo3.setTerminalPoint(geo.getTerminalPoint(false), false);
                }
                else if (useParent && graph.model.isVertex(targetParent))
                {
                    // Adds parent offset to other nodes
                    var tmpState = graph.view.getState(targetParent);
                    var offset = (tmpState.cell != graph.view.currentRoot) ?
                        new mxPoint((tmpState.x / graph.view.scale - graph.view.translate.x),
                        (tmpState.y / graph.view.scale - graph.view.translate.y)) : new mxPoint(0, 0);

                    graph.cellsMoved(targets, offset.x, offset.y, null, null, true);
                }
            }
            else
            {
                geo2 = graph.getCellGeometry(targets[dropCellIndex]);
                dx = geo.x - Math.round(geo2.x);
                dy = geo.y - Math.round(geo2.y);
                geo.x = Math.round(geo2.x);
                geo.y = Math.round(geo2.y);
                graph.model.setGeometry(targets[dropCellIndex], geo);
                graph.cellsMoved(targets, dx, dy, null, null, true);
                tmp = targets.slice();
                editingCell = (tmp.length == 1) ? tmp[0] : null;
                targets.push(graph.insertEdge(null, null, '', source, targets[dropCellIndex],
                    graph.createCurrentEdgeStyle()));
            }
            
            if (evt == null || !mxEvent.isShiftDown(evt))
            {
                graph.fireEvent(new mxEventObject('cellsInserted', 'cells', targets));
            }
        }
        catch (e)
        {
            this.editorUi.handleError(e);
        }
        finally
        {
            graph.model.endUpdate();
        }
        
        if (graph.editAfterInsert && evt != null && mxEvent.isMouseEvent(evt) && editingCell != null)
        {
            window.setTimeout(function() { graph.startEditing(editingCell); }, 0);
        }
    }
    
    return tmp;
};

Sidebar.prototype.getDropAndConnectGeometry = function(source, target, direction, targets)
{
    var graph = this.editorUi.editor.graph;
    var view = graph.view;
    var keepSize = targets.length > 1;
    var geo = graph.getCellGeometry(source);
    var geo2 = graph.getCellGeometry(target);
    
    if (geo != null && geo2 != null)
    {
        geo2 = geo2.clone();

        if (graph.model.isEdge(source))
        {
            var state = graph.view.getState(source);
            var pts = state.absolutePoints;
            var p0 = pts[0];
            var pe = pts[pts.length - 1];
            
            if (direction == mxConstants.DIRECTION_NORTH)
            {
                geo2.x = p0.x / view.scale - view.translate.x - geo2.width / 2;
                geo2.y = p0.y / view.scale - view.translate.y - geo2.height / 2;
            }
            else
            {
                geo2.x = pe.x / view.scale - view.translate.x - geo2.width / 2;
                geo2.y = pe.y / view.scale - view.translate.y - geo2.height / 2;
            }
        }
        else
        {
            if (geo.relative)
            {
                var state = graph.view.getState(source);
                geo = geo.clone();
                geo.x = (state.x - view.translate.x) / view.scale;
                geo.y = (state.y - view.translate.y) / view.scale;
            }
            
            var length = graph.defaultEdgeLength;
            
            // Maintains edge length
            if (graph.model.isEdge(target) && geo2.getTerminalPoint(true) != null && geo2.getTerminalPoint(false) != null)
            {
                var p0 = geo2.getTerminalPoint(true);
                var pe = geo2.getTerminalPoint(false);
                var dx = pe.x - p0.x;
                var dy = pe.y - p0.y;
                
                length = Math.sqrt(dx * dx + dy * dy);
                
                geo2.x = geo.getCenterX();
                geo2.y = geo.getCenterY();
                geo2.width = 1;
                geo2.height = 1;
                
                if (direction == mxConstants.DIRECTION_NORTH)
                {
                    geo2.height = length
                    geo2.y = geo.y - length;
                    geo2.setTerminalPoint(new mxPoint(geo2.x, geo2.y), false);
                }
                else if (direction == mxConstants.DIRECTION_EAST)
                {
                    geo2.width = length
                    geo2.x = geo.x + geo.width;
                    geo2.setTerminalPoint(new mxPoint(geo2.x + geo2.width, geo2.y), false);
                }
                else if (direction == mxConstants.DIRECTION_SOUTH)
                {
                    geo2.height = length
                    geo2.y = geo.y + geo.height;
                    geo2.setTerminalPoint(new mxPoint(geo2.x, geo2.y + geo2.height), false);
                }
                else if (direction == mxConstants.DIRECTION_WEST)
                {
                    geo2.width = length
                    geo2.x = geo.x - length;
                    geo2.setTerminalPoint(new mxPoint(geo2.x, geo2.y), false);
                }
            }
            else
            {
                // Try match size or ignore if width or height < 45 which
                // is considered special enough to be ignored here
                if (!keepSize && geo2.width > 45 && geo2.height > 45 &&
                    geo.width > 45 && geo.height > 45)
                {
                    geo2.width = geo2.width * (geo.height / geo2.height);
                    geo2.height = geo.height;
                }
    
                geo2.x = geo.x + geo.width / 2 - geo2.width / 2;
                geo2.y = geo.y + geo.height / 2 - geo2.height / 2;

                if (direction == mxConstants.DIRECTION_NORTH)
                {
                    geo2.y = geo2.y - geo.height / 2 - geo2.height / 2 - length;
                }
                else if (direction == mxConstants.DIRECTION_EAST)
                {
                    geo2.x = geo2.x + geo.width / 2 + geo2.width / 2 + length;
                }
                else if (direction == mxConstants.DIRECTION_SOUTH)
                {
                    geo2.y = geo2.y + geo.height / 2 + geo2.height / 2 + length;
                }
                else if (direction == mxConstants.DIRECTION_WEST)
                {
                    geo2.x = geo2.x - geo.width / 2 - geo2.width / 2 - length;
                }
                
                // Adds offset to match cells without connecting edge
                if (graph.model.isEdge(target) && geo2.getTerminalPoint(true) != null && target.getTerminal(false) != null)
                {
                    var targetGeo = graph.getCellGeometry(target.getTerminal(false));
                    
                    if (targetGeo != null)
                    {
                        if (direction == mxConstants.DIRECTION_NORTH)
                        {
                            geo2.x -= targetGeo.getCenterX();
                            geo2.y -= targetGeo.getCenterY() + targetGeo.height / 2;
                        }
                        else if (direction == mxConstants.DIRECTION_EAST)
                        {
                            geo2.x -= targetGeo.getCenterX() - targetGeo.width / 2;
                            geo2.y -= targetGeo.getCenterY();
                        }
                        else if (direction == mxConstants.DIRECTION_SOUTH)
                        {
                            geo2.x -= targetGeo.getCenterX();
                            geo2.y -= targetGeo.getCenterY() - targetGeo.height / 2;
                        }
                        else if (direction == mxConstants.DIRECTION_WEST)
                        {
                            geo2.x -= targetGeo.getCenterX() + targetGeo.width / 2;
                            geo2.y -= targetGeo.getCenterY();
                        }
                    }
                }
            }
        }
    }
    
    return geo2;
};
/**
 * Creates a drag source for the given element.
 */
Sidebar.prototype.createDragSource = function(elt, dropHandler, preview, cells, bounds)
{
    // Checks if the cells contain any vertices
    var ui = this.editorUi;
    var graph = ui.editor.graph;
    var freeSourceEdge = null;
    var firstVertex = null;
    var sidebar = this;
    
    for (var i = 0; i < cells.length; i++)
    {
        if (firstVertex == null && this.editorUi.editor.graph.model.isVertex(cells[i]))
        {
            firstVertex = i;
        }
        else if (freeSourceEdge == null && this.editorUi.editor.graph.model.isEdge(cells[i]) &&
                this.editorUi.editor.graph.model.getTerminal(cells[i], true) == null)
        {
            freeSourceEdge = i;
        }
        
        if (firstVertex != null && freeSourceEdge != null)
        {
            break;
        }
    }
    
    var dragSource = mxUtils.makeDraggable(elt, this.editorUi.editor.graph, mxUtils.bind(this, function(graph, evt, target, x, y)
    {
        if (this.updateThread != null)
        {
            window.clearTimeout(this.updateThread);
        }
        
        if (cells != null && currentStyleTarget != null && activeArrow == styleTarget)
        {
            var tmp = graph.isCellSelected(currentStyleTarget.cell) ? graph.getSelectionCells() : [currentStyleTarget.cell];
            var updatedCells = this.updateShapes((graph.model.isEdge(currentStyleTarget.cell)) ? cells[0] : cells[firstVertex], tmp);
            graph.setSelectionCells(updatedCells);
        }
        else if (cells != null && activeArrow != null && currentTargetState != null && activeArrow != styleTarget)
        {
            var index = (graph.model.isEdge(currentTargetState.cell) || freeSourceEdge == null) ? firstVertex : freeSourceEdge;
            graph.setSelectionCells(this.dropAndConnect(currentTargetState.cell, cells, direction, index, evt));
        }
        else
        {
            dropHandler.apply(this, arguments);
        }
        
        if (this.editorUi.hoverIcons != null)
        {
            this.editorUi.hoverIcons.update(graph.view.getState(graph.getSelectionCell()));
        }
    }), preview, 0, 0, graph.autoscroll, true, true);
    
    // Stops dragging if cancel is pressed
    graph.addListener(mxEvent.ESCAPE, function(sender, evt)
    {
        if (dragSource.isActive())
        {
            dragSource.reset();
        }
    });

    // Overrides mouseDown to ignore popup triggers
    var mouseDown = dragSource.mouseDown;
    
    dragSource.mouseDown = function(evt)
    {
        if (!mxEvent.isPopupTrigger(evt) && !mxEvent.isMultiTouchEvent(evt))
        {
            graph.stopEditing();
            mouseDown.apply(this, arguments);
        }
    };

    function createArrow(img, tooltip)
    {
        var arrow = mxUtils.createImage(img.src);
        arrow.style.width = img.width + 'px';
        arrow.style.height = img.height + 'px';
        
        if (tooltip != null)
            arrow.setAttribute('title', tooltip);
        
        mxUtils.setOpacity(arrow, (img == this.refreshTarget) ? 30 : 20);
        arrow.style.position = 'absolute';
        arrow.style.cursor = 'crosshair';
        
        return arrow;
    };

    var currentTargetState = null;
    var currentStateHandle = null;
    var currentStyleTarget = null;
    var activeTarget = false;
    
    var arrowUp = createArrow(this.triangleUp, mxResources.get('connect'));
    var arrowRight = createArrow(this.triangleRight, mxResources.get('connect'));
    var arrowDown = createArrow(this.triangleDown, mxResources.get('connect'));
    var arrowLeft = createArrow(this.triangleLeft, mxResources.get('connect'));
    var styleTarget = createArrow(this.refreshTarget, mxResources.get('replace'));
    // Workaround for actual parentNode not being updated in old IE
    var styleTargetParent = null;
    var roundSource = createArrow(this.roundDrop);
    var roundTarget = createArrow(this.roundDrop);
    var direction = mxConstants.DIRECTION_NORTH;
    var activeArrow = null;
    
    function checkArrow(x, y, bounds, arrow)
    {
        if (arrow.parentNode != null)
        {
            if (mxUtils.contains(bounds, x, y))
            {
                mxUtils.setOpacity(arrow, 100);
                activeArrow = arrow;
            }
            else
            {
                mxUtils.setOpacity(arrow, (arrow == styleTarget) ? 30 : 20);
            }
        }
        
        return bounds;
    };
    
    // Hides guides and preview if target is active
    var dsCreatePreviewElement = dragSource.createPreviewElement;
    
    // Stores initial size of preview element
    dragSource.createPreviewElement = function(graph)
    {
        var elt = dsCreatePreviewElement.apply(this, arguments);
        
        // Pass-through events required to tooltip on replace shape
        elt.style.pointerEvents = 'none';
        
        this.previewElementWidth = elt.style.width;
        this.previewElementHeight = elt.style.height;
        
        return elt;
    };
    
    // Shows/hides hover icons
    var dragEnter = dragSource.dragEnter;
    dragSource.dragEnter = function(graph, evt)
    {
        if (ui.hoverIcons != null)
        {
            ui.hoverIcons.setDisplay('none');
        }
        
        dragEnter.apply(this, arguments);
    };
    
    var dragExit = dragSource.dragExit;
    dragSource.dragExit = function(graph, evt)
    {
        if (ui.hoverIcons != null)
        {
            ui.hoverIcons.setDisplay('');
        }
        
        dragExit.apply(this, arguments);
    };
    
    dragSource.dragOver = function(graph, evt)
    {
        mxDragSource.prototype.dragOver.apply(this, arguments);

        if (this.currentGuide != null && activeArrow != null)
        {
            this.currentGuide.hide();
        }

        if (this.previewElement != null)
        {
            var view = graph.view;
            
            if (currentStyleTarget != null && activeArrow == styleTarget)
            {
                this.previewElement.style.display = (graph.model.isEdge(currentStyleTarget.cell)) ? 'none' : '';
                
                this.previewElement.style.left = currentStyleTarget.x + 'px';
                this.previewElement.style.top = currentStyleTarget.y + 'px';
                this.previewElement.style.width = currentStyleTarget.width + 'px';
                this.previewElement.style.height = currentStyleTarget.height + 'px';
            }
            else if (currentTargetState != null && activeArrow != null)
            {
                var index = (graph.model.isEdge(currentTargetState.cell) || freeSourceEdge == null) ? firstVertex : freeSourceEdge;
                var geo = sidebar.getDropAndConnectGeometry(currentTargetState.cell, cells[index], direction, cells);
                var geo2 = (!graph.model.isEdge(currentTargetState.cell)) ? graph.getCellGeometry(currentTargetState.cell) : null;
                var geo3 = graph.getCellGeometry(cells[index]);
                var parent = graph.model.getParent(currentTargetState.cell);
                var dx = view.translate.x * view.scale;
                var dy = view.translate.y * view.scale;
                
                if (geo2 != null && !geo2.relative && graph.model.isVertex(parent) && parent != view.currentRoot)
                {
                    var pState = view.getState(parent);
                    
                    dx = pState.x;
                    dy = pState.y;
                }
                
                var dx2 = geo3.x;
                var dy2 = geo3.y;

                // Ignores geometry of edges
                if (graph.model.isEdge(cells[index]))
                {
                    dx2 = 0;
                    dy2 = 0;
                }
                
                // Shows preview at drop location
                this.previewElement.style.left = ((geo.x - dx2) * view.scale + dx) + 'px';
                this.previewElement.style.top = ((geo.y - dy2) * view.scale + dy) + 'px';
                
                if (cells.length == 1)
                {
                    this.previewElement.style.width = (geo.width * view.scale) + 'px';
                    this.previewElement.style.height = (geo.height * view.scale) + 'px';
                }
                
                this.previewElement.style.display = '';
            }
            else if (dragSource.currentHighlight.state != null &&
                graph.model.isEdge(dragSource.currentHighlight.state.cell))
            {
                // Centers drop cells when splitting edges
                this.previewElement.style.left = Math.round(parseInt(this.previewElement.style.left) -
                    bounds.width * view.scale / 2) + 'px';
                this.previewElement.style.top = Math.round(parseInt(this.previewElement.style.top) -
                    bounds.height * view.scale / 2) + 'px';
            }
            else
            {
                this.previewElement.style.width = this.previewElementWidth;
                this.previewElement.style.height = this.previewElementHeight;
                this.previewElement.style.display = '';
            }
        }
    };
    
    var startTime = new Date().getTime();
    var timeOnTarget = 0;
    var prev = null;
    
    // Gets source cell style to compare shape below
    var sourceCellStyle = this.editorUi.editor.graph.getCellStyle(cells[0]);
    
    // Allows drop into cell only if target is a valid root
    dragSource.getDropTarget = mxUtils.bind(this, function(graph, x, y, evt)
    {
        // Alt means no targets at all
        // LATER: Show preview where result will go
        var cell = (!mxEvent.isAltDown(evt) && cells != null) ? graph.getCellAt(x, y) : null;
        
        // Uses connectable parent vertex if one exists
        if (cell != null && !this.graph.isCellConnectable(cell))
        {
            var parent = this.graph.getModel().getParent(cell);
            
            if (this.graph.getModel().isVertex(parent) && this.graph.isCellConnectable(parent))
            {
                cell = parent;
            }
        }
        
        // Ignores locked cells
        if (graph.isCellLocked(cell))
            cell = null;
        
        var state = graph.view.getState(cell);
        activeArrow = null;
        var bbox = null;

        // Time on target
        if (prev != state)
        {
            prev = state;
            startTime = new Date().getTime();
            timeOnTarget = 0;

            if (this.updateThread != null)
            {
                window.clearTimeout(this.updateThread);
            }
            
            if (state != null)
            {
                this.updateThread = window.setTimeout(function()
                {
                    if (activeArrow == null)
                    {
                        prev = state;
                        dragSource.getDropTarget(graph, x, y, evt);
                    }
                }, this.dropTargetDelay + 10);
            }
        }
        else
        {
            timeOnTarget = new Date().getTime() - startTime;
        }

        // Shift means disabled, delayed on cells with children, shows after this.dropTargetDelay, hides after 2500ms
        if (timeOnTarget < 2500 && state != null && !mxEvent.isShiftDown(evt) &&
            // If shape is equal or target has no stroke, fill and gradient then use longer delay except for images
            (((mxUtils.getValue(state.style, mxConstants.STYLE_SHAPE) != mxUtils.getValue(sourceCellStyle, mxConstants.STYLE_SHAPE) &&
            (mxUtils.getValue(state.style, mxConstants.STYLE_STROKECOLOR, mxConstants.NONE) != mxConstants.NONE ||
            mxUtils.getValue(state.style, mxConstants.STYLE_FILLCOLOR, mxConstants.NONE) != mxConstants.NONE ||
            mxUtils.getValue(state.style, mxConstants.STYLE_GRADIENTCOLOR, mxConstants.NONE) != mxConstants.NONE)) ||
            mxUtils.getValue(sourceCellStyle, mxConstants.STYLE_SHAPE) == 'image') ||
            timeOnTarget > 1500 || graph.model.isEdge(state.cell)) && (timeOnTarget > this.dropTargetDelay) && 
            ((graph.model.isVertex(state.cell) && firstVertex != null) ||
            (graph.model.isEdge(state.cell) && graph.model.isEdge(cells[0]))))
        {
            currentStyleTarget = state;
            var tmp = (graph.model.isEdge(state.cell)) ? graph.view.getPoint(state) :
                new mxPoint(state.getCenterX(), state.getCenterY());
            tmp = new mxRectangle(tmp.x - this.refreshTarget.width / 2, tmp.y - this.refreshTarget.height / 2,
                this.refreshTarget.width, this.refreshTarget.height);
            
            styleTarget.style.left = Math.floor(tmp.x) + 'px';
            styleTarget.style.top = Math.floor(tmp.y) + 'px';
            
            if (styleTargetParent == null)
            {
                graph.container.appendChild(styleTarget);
                styleTargetParent = styleTarget.parentNode;
            }
            
            checkArrow(x, y, tmp, styleTarget);
        }
        // Does not reset on ignored edges
        else if (currentStyleTarget == null || !mxUtils.contains(currentStyleTarget, x, y) ||
            (timeOnTarget > 1500 && !mxEvent.isShiftDown(evt)))
        {
            currentStyleTarget = null;
            
            if (styleTargetParent != null)
            {
                styleTarget.parentNode.removeChild(styleTarget);
                styleTargetParent = null;
            }
        }
        else if (currentStyleTarget != null && styleTargetParent != null)
        {
            // Sets active Arrow as side effect
            var tmp = (graph.model.isEdge(currentStyleTarget.cell)) ? graph.view.getPoint(currentStyleTarget) : new mxPoint(currentStyleTarget.getCenterX(), currentStyleTarget.getCenterY());
            tmp = new mxRectangle(tmp.x - this.refreshTarget.width / 2, tmp.y - this.refreshTarget.height / 2,
                this.refreshTarget.width, this.refreshTarget.height);
            checkArrow(x, y, tmp, styleTarget);
        }
        
        // Checks if inside bounds
        if (activeTarget && currentTargetState != null && !mxEvent.isAltDown(evt) && activeArrow == null)
        {
            // LATER: Use hit-detection for edges
            bbox = mxRectangle.fromRectangle(currentTargetState);
            
            if (graph.model.isEdge(currentTargetState.cell))
            {
                var pts = currentTargetState.absolutePoints;
                
                if (roundSource.parentNode != null)
                {
                    var p0 = pts[0];
                    bbox.add(checkArrow(x, y, new mxRectangle(p0.x - this.roundDrop.width / 2,
                        p0.y - this.roundDrop.height / 2, this.roundDrop.width, this.roundDrop.height), roundSource));
                }
                
                if (roundTarget.parentNode != null)
                {
                    var pe = pts[pts.length - 1];
                    bbox.add(checkArrow(x, y, new mxRectangle(pe.x - this.roundDrop.width / 2,
                        pe.y - this.roundDrop.height / 2,
                        this.roundDrop.width, this.roundDrop.height), roundTarget));
                }
            }
            else
            {
                var bds = mxRectangle.fromRectangle(currentTargetState);
                
                // Uses outer bounding box to take rotation into account
                if (currentTargetState.shape != null && currentTargetState.shape.boundingBox != null)
                {
                    bds = mxRectangle.fromRectangle(currentTargetState.shape.boundingBox);
                }

                bds.grow(this.graph.tolerance);
                bds.grow(HoverIcons.prototype.arrowSpacing);
                
                var handler = this.graph.selectionCellsHandler.getHandler(currentTargetState.cell);
                
                if (handler != null)
                {
                    bds.x -= handler.horizontalOffset / 2;
                    bds.y -= handler.verticalOffset / 2;
                    bds.width += handler.horizontalOffset;
                    bds.height += handler.verticalOffset;
                    
                    // Adds bounding box of rotation handle to avoid overlap
                    if (handler.rotationShape != null && handler.rotationShape.node != null &&
                        handler.rotationShape.node.style.visibility != 'hidden' &&
                        handler.rotationShape.node.style.display != 'none' &&
                        handler.rotationShape.boundingBox != null)
                    {
                        bds.add(handler.rotationShape.boundingBox);
                    }
                }
                
                bbox.add(checkArrow(x, y, new mxRectangle(currentTargetState.getCenterX() - this.triangleUp.width / 2,
                    bds.y - this.triangleUp.height, this.triangleUp.width, this.triangleUp.height), arrowUp));
                bbox.add(checkArrow(x, y, new mxRectangle(bds.x + bds.width,
                    currentTargetState.getCenterY() - this.triangleRight.height / 2,
                    this.triangleRight.width, this.triangleRight.height), arrowRight));
                bbox.add(checkArrow(x, y, new mxRectangle(currentTargetState.getCenterX() - this.triangleDown.width / 2,
                        bds.y + bds.height, this.triangleDown.width, this.triangleDown.height), arrowDown));
                bbox.add(checkArrow(x, y, new mxRectangle(bds.x - this.triangleLeft.width,
                        currentTargetState.getCenterY() - this.triangleLeft.height / 2,
                        this.triangleLeft.width, this.triangleLeft.height), arrowLeft));
            }
            
            // Adds tolerance
            if (bbox != null)
                bbox.grow(10);
        }
        
        direction = mxConstants.DIRECTION_NORTH;
        
        if (activeArrow == arrowRight)
        {
            direction = mxConstants.DIRECTION_EAST;
        }
        else if (activeArrow == arrowDown || activeArrow == roundTarget)
        {
            direction = mxConstants.DIRECTION_SOUTH;
        }
        else if (activeArrow == arrowLeft)
        {
            direction = mxConstants.DIRECTION_WEST;
        }
        
        if (currentStyleTarget != null && activeArrow == styleTarget)
        {
            state = currentStyleTarget;
        }

        var validTarget = (firstVertex == null || graph.isCellConnectable(cells[firstVertex])) &&
            ((graph.model.isEdge(cell) && firstVertex != null) ||
            (graph.model.isVertex(cell) && graph.isCellConnectable(cell)));
        
        // Drop arrows shown after this.dropTargetDelay, hidden after 5 secs, switches arrows after 500ms
        if ((currentTargetState != null && timeOnTarget >= 5000) ||
            (currentTargetState != state &&
            (bbox == null || !mxUtils.contains(bbox, x, y) ||
            (timeOnTarget > 500 && activeArrow == null && validTarget))))
        {
            activeTarget = false;
            currentTargetState = ((timeOnTarget < 5000 && timeOnTarget > this.dropTargetDelay) || graph.model.isEdge(cell)) ? state : null;

            if (currentTargetState != null && validTarget)
            {
                var elts = [roundSource, roundTarget, arrowUp, arrowRight, arrowDown, arrowLeft];
                
                for (var i = 0; i < elts.length; i++)
                {
                    if (elts[i].parentNode != null)
                    {
                        elts[i].parentNode.removeChild(elts[i]);
                    }
                }
                
                if (graph.model.isEdge(cell))
                {
                    var pts = state.absolutePoints;
                    
                    if (pts != null)
                    {
                        var p0 = pts[0];
                        var pe = pts[pts.length - 1];
                        var tol = graph.tolerance;
                        var box = new mxRectangle(x - tol, y - tol, 2 * tol, 2 * tol);
                        
                        roundSource.style.left = Math.floor(p0.x - this.roundDrop.width / 2) + 'px';
                        roundSource.style.top = Math.floor(p0.y - this.roundDrop.height / 2) + 'px';
                        
                        roundTarget.style.left = Math.floor(pe.x - this.roundDrop.width / 2) + 'px';
                        roundTarget.style.top = Math.floor(pe.y - this.roundDrop.height / 2) + 'px';
                        
                        if (graph.model.getTerminal(cell, true) == null)
                        {
                            graph.container.appendChild(roundSource);
                        }
                        
                        if (graph.model.getTerminal(cell, false) == null)
                        {
                            graph.container.appendChild(roundTarget);
                        }
                    }
                }
                else
                {
                    var bds = mxRectangle.fromRectangle(state);
                    
                    // Uses outer bounding box to take rotation into account
                    if (state.shape != null && state.shape.boundingBox != null)
                    {
                        bds = mxRectangle.fromRectangle(state.shape.boundingBox);
                    }

                    bds.grow(this.graph.tolerance);
                    bds.grow(HoverIcons.prototype.arrowSpacing);
                    
                    var handler = this.graph.selectionCellsHandler.getHandler(state.cell);
                    if (handler != null)
                    {
                        bds.x -= handler.horizontalOffset / 2;
                        bds.y -= handler.verticalOffset / 2;
                        bds.width += handler.horizontalOffset;
                        bds.height += handler.verticalOffset;
                        
                        // Adds bounding box of rotation handle to avoid overlap
                        if (handler.rotationShape != null && handler.rotationShape.node != null &&
                            handler.rotationShape.node.style.visibility != 'hidden' &&
                            handler.rotationShape.node.style.display != 'none' &&
                            handler.rotationShape.boundingBox != null)
                        {
                            bds.add(handler.rotationShape.boundingBox);
                        }
                    }
                    
                    arrowUp.style.left = Math.floor(state.getCenterX() - this.triangleUp.width / 2) + 'px';
                    arrowUp.style.top  = Math.floor(bds.y - this.triangleUp.height) + 'px';
                    
                    arrowRight.style.left = Math.floor(bds.x + bds.width) + 'px';
                    arrowRight.style.top  = Math.floor(state.getCenterY() - this.triangleRight.height / 2) + 'px';
                    
                    arrowDown.style.left = arrowUp.style.left
                    arrowDown.style.top  = Math.floor(bds.y + bds.height) + 'px';
                    
                    arrowLeft.style.left = Math.floor(bds.x - this.triangleLeft.width) + 'px';
                    arrowLeft.style.top  = arrowRight.style.top;
                    
                    if (state.style['portConstraint'] != 'eastwest')
                    {
                        graph.container.appendChild(arrowUp);
                        graph.container.appendChild(arrowDown);
                    }

                    graph.container.appendChild(arrowRight);
                    graph.container.appendChild(arrowLeft);
                }
                
                // Hides handle for cell under mouse
                if (state != null)
                {
                    currentStateHandle = graph.selectionCellsHandler.getHandler(state.cell);
                    if (currentStateHandle != null && currentStateHandle.setHandlesVisible != null)
                    {
                        currentStateHandle.setHandlesVisible(false);
                    }
                }
                
                activeTarget = true;
            }
            else
            {
                var elts = [roundSource, roundTarget, arrowUp, arrowRight, arrowDown, arrowLeft];
                
                for (var i = 0; i < elts.length; i++)
                {
                    if (elts[i].parentNode != null)
                    {
                        elts[i].parentNode.removeChild(elts[i]);
                    }
                }
            }
        }

        if (!activeTarget && currentStateHandle != null)
        {
            currentStateHandle.setHandlesVisible(true);
        }
        
        // Handles drop target
        var target = ((!mxEvent.isAltDown(evt) || mxEvent.isShiftDown(evt)) &&
            !(currentStyleTarget != null && activeArrow == styleTarget)) ?
            mxDragSource.prototype.getDropTarget.apply(this, arguments) : null;
        var model = graph.getModel();
        
        if (target != null)
        {
            if (activeArrow != null || !graph.isSplitTarget(target, cells, evt))
            {
                // Selects parent group as drop target
                while (target != null && !graph.isValidDropTarget(target, cells, evt) && model.isVertex(model.getParent(target)))
                {
                    target = model.getParent(target);
                }
                
                if (graph.view.currentRoot == target || (!graph.isValidRoot(target) &&
                    graph.getModel().getChildCount(target) == 0) ||
                    graph.isCellLocked(target) || model.isEdge(target))
                {
                    target = null;
                }
            }
        }
        
        return target;
    });
    
    dragSource.stopDrag = function()
    {
        mxDragSource.prototype.stopDrag.apply(this, arguments);
        
        var elts = [roundSource, roundTarget, styleTarget, arrowUp, arrowRight, arrowDown, arrowLeft];
        
        for (var i = 0; i < elts.length; i++)
        {
            if (elts[i].parentNode != null)
            {
                elts[i].parentNode.removeChild(elts[i]);
            }
        }
        
        if (currentTargetState != null && currentStateHandle != null)
        {
            currentStateHandle.reset();
        }
        
        currentStateHandle = null;
        currentTargetState = null;
        currentStyleTarget = null;
        styleTargetParent = null;
        activeArrow = null;
    };
    
    return dragSource;
};

/**
 * Adds a handler for inserting the cell with a single click.
 */
Sidebar.prototype.itemClicked = function(cells, ds, evt, elt)
{
    var graph = this.editorUi.editor.graph;
    graph.container.focus();
    
    // Alt+Click inserts and connects
    if (mxEvent.isAltDown(evt) && graph.getSelectionCount() == 1 && graph.model.isVertex(graph.getSelectionCell()))
    {
        var firstVertex = null;
        
        for (var i = 0; i < cells.length && firstVertex == null; i++)
        {
            if (graph.model.isVertex(cells[i]))
            {
                firstVertex = i;
            }
        }
        
        if (firstVertex != null)
        {
            graph.setSelectionCells(this.dropAndConnect(graph.getSelectionCell(), cells, (mxEvent.isMetaDown(evt) || mxEvent.isControlDown(evt)) ?
                (mxEvent.isShiftDown(evt) ? mxConstants.DIRECTION_WEST : mxConstants.DIRECTION_NORTH) : 
                (mxEvent.isShiftDown(evt) ? mxConstants.DIRECTION_EAST : mxConstants.DIRECTION_SOUTH),
                firstVertex, evt));
            graph.scrollCellToVisible(graph.getSelectionCell());
        }
    }
    // Shift+Click updates shape
    else if (mxEvent.isShiftDown(evt) && !graph.isSelectionEmpty())
    {
        this.updateShapes(cells[0], graph.getSelectionCells());
        graph.scrollCellToVisible(graph.getSelectionCell());
    }
    else
    {
        var pt = graph.getFreeInsertPoint();
        if (mxEvent.isAltDown(evt))
        {
            var bounds = graph.getGraphBounds();
            var tr = graph.view.translate;
            var s = graph.view.scale;
            pt.x = bounds.x / s - tr.x + bounds.width / s + graph.gridSize;
            pt.y = bounds.y / s - tr.y;
        }
        
        ds.drop(graph, evt, null, pt.x, pt.y, true);
        
        if (this.editorUi.hoverIcons != null && (mxEvent.isTouchEvent(evt) || mxEvent.isPenEvent(evt)))
            this.editorUi.hoverIcons.update(graph.view.getState(graph.getSelectionCell()));
    }
};

/**
 * Adds a handler for inserting the cell with a single click.
 */
Sidebar.prototype.addClickHandler = function(elt, ds, cells)
{
    var graph = this.editorUi.editor.graph;
    var oldMouseDown = ds.mouseDown;
    var oldMouseMove = ds.mouseMove;
    var oldMouseUp = ds.mouseUp;
    var tol = graph.tolerance;
    var first = null;
    var sb = this;
    
    ds.mouseDown =function(evt)
    {
        oldMouseDown.apply(this, arguments);
        first = new mxPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt));
        
        if (this.dragElement != null)
        {
            this.dragElement.style.display = 'none';
            mxUtils.setOpacity(elt, 50);
        }
    };
    
    ds.mouseMove = function(evt)
    {
        if (this.dragElement != null && this.dragElement.style.display == 'none' &&
            first != null && (Math.abs(first.x - mxEvent.getClientX(evt)) > tol ||
            Math.abs(first.y - mxEvent.getClientY(evt)) > tol))
        {
            this.dragElement.style.display = '';
            mxUtils.setOpacity(elt, 100);
        }
        
        oldMouseMove.apply(this, arguments);
    };
    
    ds.mouseUp = function(evt)
    {
        if (!mxEvent.isPopupTrigger(evt) && this.currentGraph == null &&
            this.dragElement != null && this.dragElement.style.display == 'none')
        {
            sb.itemClicked(cells, ds, evt, elt);
        }

        oldMouseUp.apply(ds, arguments);
        mxUtils.setOpacity(elt, 100);
        first = null;
        
        // Blocks tooltips on this element after single click
        sb.currentElt = elt;
    };
};

Sidebar.prototype.createVertexTemplateEntry = function (style, width, height, value, title, showLabel, showTitle)
{
    return this.addEntry(title, mxUtils.bind(this, function ()
    {
        return this.createVertexTemplate(style, width, height, value, title, showLabel, showTitle);
    }));
};
Sidebar.prototype.createVertexTemplate = function(style, width, height, value, title, showLabel, showTitle, allowCellsInserted)
{
    var cells = [new mxCell((value != null) ? value : '', new mxGeometry(0, 0, width, height), style)];
    cells[0].vertex = true;
    return this.createItem(cells, title, showLabel, showTitle, width, height, allowCellsInserted);
};
Sidebar.prototype.createEdgeTemplateEntry = function(style, width, height, value, title, showLabel, allowCellsInserted)
{
    return this.addEntry(title, mxUtils.bind(this, function()
    {
        var cell = new mxCell((value != null) ? value : '', new mxGeometry(0, 0, width, height), style);
        cell.geometry.setTerminalPoint(new mxPoint(0, height), true);
        cell.geometry.setTerminalPoint(new mxPoint(width, 0), false);
        cell.geometry.relative = true;
        cell.edge = true;
        return this.createItem([cell], title, showLabel, true, width, height, allowCellsInserted);
    }));
};
Sidebar.prototype.createVertexTemplateFromCells = function (cells, width, height, title, showLabel, showTitle, allowCellsInserted)
{
    // Use this line to convert calls to this function with lots of boilerplate code for creating cells
    //console.trace('xml', Graph.compress(mxUtils.getXml(this.graph.encodeCells(cells))), cells);
    return this.createItem(cells, title, showLabel, showTitle, width, height, allowCellsInserted);
};

Sidebar.prototype.addPaletteFunctions = function(id, title, expanded, fns)
{
    this.addPalette(id, title, expanded, mxUtils.bind(this, function(content)
    {
        for (var i = 0; i < fns.length; i++)
        {
            content.appendChild(fns[i](content));
        }
    }));
};
Sidebar.prototype.addPalette = function(id, title, expanded, onInit)
{
    var elt = this.createTitle(title);
    this.container.appendChild(elt);
    
    var div = document.createElement('div');
    div.className = 'geSidebar';
    
    // Disables built-in pan and zoom in IE10 and later
    if (mxClient.IS_POINTER)
        div.style.touchAction = 'none';

    if (expanded)
    {
        onInit(div);
        onInit = null;
    }
    else
    {
        div.style.display = 'none';
    }
    
    this.addFoldingHandler(elt, div, onInit);
    
    var outer = document.createElement('div');
    outer.appendChild(div);
    this.container.appendChild(outer);
    
    // Keeps references to the DOM nodes
    if (id != null)
        this.palettes[id] = [elt, outer];
    
    return div;
};

Sidebar.prototype.addFoldingHandler = function(title, content, funct)
{
    var initialized = false;

    // Avoids mixed content warning in IE6-8
    if (!mxClient.IS_IE || document.documentMode >= 8)
    {
        title.style.backgroundImage = (content.style.display == 'none') ?
            'url(\'' + this.collapsedImage + '\')' : 'url(\'' + this.expandedImage + '\')';
    }
    
    title.style.backgroundRepeat = 'no-repeat';
    title.style.backgroundPosition = '0% 50%';

    mxEvent.addListener(title, 'click', mxUtils.bind(this, function(evt)
    {
        if (content.style.display == 'none')
        {
            if (!initialized)
            {
                initialized = true;

                if (funct != null)
                {
                    // Wait cursor does not show up on Mac
                    title.style.cursor = 'wait';
                    var prev = title.innerHTML;
                    title.innerHTML = mxResources.get('loading') + '...';
                    
                    window.setTimeout(function()
                    {
                        content.style.display = 'block';
                        title.style.cursor = '';
                        title.innerHTML = prev;

                        var fo = mxClient.NO_FO;
                        mxClient.NO_FO = Editor.prototype.originalNoForeignObject;
                        funct(content, title);
                        mxClient.NO_FO = fo;
                    }, (mxClient.IS_FF) ? 20 : 0);
                }
                else
                    content.style.display = 'block';
            }
            else
                content.style.display = 'block';
            
            title.style.backgroundImage = 'url(\'' + this.expandedImage + '\')';
        }
        else
        {
            title.style.backgroundImage = 'url(\'' + this.collapsedImage + '\')';
            content.style.display = 'none';
        }
        
        mxEvent.consume(evt);
    }));
    
    // Prevents focus
    mxEvent.addListener(title, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown', mxUtils.bind(this, function(evt)
    {
        evt.preventDefault();
    }));
};

Sidebar.prototype.removePalette = function(id)
{
    var elts = this.palettes[id];
    if (elts)
    {
        this.palettes[id] = null;
        for (var i = 0; i < elts.length; i++)
            this.container.removeChild(elts[i]);
        return true;
    }
    return false;
};
Sidebar.prototype.destroy = function()
{
    if (this.graph != null)
    {
        if (this.graph.container != null && this.graph.container.parentNode != null)
            this.graph.container.parentNode.removeChild(this.graph.container);
        this.graph.destroy();
        this.graph = null;
    }
    
    if (this.pointerUpHandler != null)
    {
        mxEvent.removeListener(document, (mxClient.IS_POINTER) ? 'pointerup' : 'mouseup', this.pointerUpHandler);
        this.pointerUpHandler = null;
    }

    if (this.pointerDownHandler != null)
    {
        mxEvent.removeListener(document, (mxClient.IS_POINTER) ? 'pointerdown' : 'mousedown', this.pointerDownHandler);
        this.pointerDownHandler = null;
    }
    
    if (this.pointerMoveHandler != null)
    {
        mxEvent.removeListener(document, (mxClient.IS_POINTER) ? 'pointermove' : 'mousemove', this.pointerMoveHandler);
        this.pointerMoveHandler = null;
    }
    
    if (this.pointerOutHandler != null)
    {
        mxEvent.removeListener(document, (mxClient.IS_POINTER) ? 'pointerout' : 'mouseout', this.pointerOutHandler);
        this.pointerOutHandler = null;
    }
};
