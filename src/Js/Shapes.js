// Hook for custom constraints
mxShape.prototype.getConstraints = function (style, w, h)
{
    return null; // this.constraints;
};
mxShape.prototype.setTransparentBackgroundImage = function (node)
{
    node.style.backgroundImage = 'url(\'' + mxUtils.transparentImage + '\')';
};

/**
 * Registers shapes.
 */
(function ()
{
    // Cube Shape, supports size style
    function CubeShape()
    {
        mxCylinder.call(this);
    }
    mxUtils.extend(CubeShape, mxCylinder);
    CubeShape.prototype.size = 20;
    CubeShape.prototype.darkOpacity = 0;
    CubeShape.prototype.darkOpacity2 = 0;
    CubeShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        var s = Math.max(0, Math.min(w, Math.min(h, parseFloat(mxUtils.getValue(this.style, 'size', this.size)))));
        var op = Math.max(-1, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'darkOpacity', this.darkOpacity))));
        var op2 = Math.max(-1, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'darkOpacity2', this.darkOpacity2))));
        c.translate(x, y);

        c.begin();
        c.moveTo(0, 0);
        c.lineTo(w - s, 0);
        c.lineTo(w, s);
        c.lineTo(w, h);
        c.lineTo(s, h);
        c.lineTo(0, h - s);
        c.lineTo(0, 0);
        c.close();
        c.end();
        c.fillAndStroke();

        if (!this.outline)
        {
            c.setShadow(false);

            if (op != 0)
            {
                c.setFillAlpha(Math.abs(op));
                c.setFillColor((op < 0) ? '#FFFFFF' : '#000000');
                c.begin();
                c.moveTo(0, 0);
                c.lineTo(w - s, 0);
                c.lineTo(w, s);
                c.lineTo(s, s);
                c.close();
                c.fill();
            }

            if (op2 != 0)
            {
                c.setFillAlpha(Math.abs(op2));
                c.setFillColor((op2 < 0) ? '#FFFFFF' : '#000000');
                c.begin();
                c.moveTo(0, 0);
                c.lineTo(s, s);
                c.lineTo(s, h);
                c.lineTo(0, h - s);
                c.close();
                c.fill();
            }

            c.begin();
            c.moveTo(s, h);
            c.lineTo(s, s);
            c.lineTo(0, 0);
            c.moveTo(s, s);
            c.lineTo(w, s);
            c.end();
            c.stroke();
        }
    };
    CubeShape.prototype.getLabelMargins = function (rect)
    {
        if (mxUtils.getValue(this.style, 'boundedLbl', false))
        {
            var s = parseFloat(mxUtils.getValue(this.style, 'size', this.size)) * this.scale;

            return new mxRectangle(s, s, 0, 0);
        }

        return null;
    };
    mxCellRenderer.registerShape('cube', CubeShape);

    var cylinderGetCylinderSize = mxCylinder.prototype.getCylinderSize;
    mxCylinder.prototype.getCylinderSize = function (x, y, w, h)
    {
        var size = mxUtils.getValue(this.style, 'size');
        if (size != null)
            return h * Math.max(0, Math.min(1, size));
        return cylinderGetCylinderSize.apply(this, arguments);
    };
    mxCylinder.prototype.getLabelMargins = function (rect)
    {
        if (mxUtils.getValue(this.style, 'boundedLbl', false))
        {
            var size = mxUtils.getValue(this.style, 'size', 0.15) * 2;
            return new mxRectangle(0, Math.min(this.maxHeight * this.scale, rect.height * size), 0, 0);
        }
        return null;
    };

    // Parallelogram shape
    function ParallelogramShape()
    {
        mxActor.call(this);
    }
    mxUtils.extend(ParallelogramShape, mxActor);
    ParallelogramShape.prototype.size = 0.2;
    ParallelogramShape.prototype.isRoundable = function ()
    {
        return true;
    };
    ParallelogramShape.prototype.redrawPath = function (c, x, y, w, h)
    {
        var dx = w * Math.max(0, Math.min(0.9, parseFloat(mxUtils.getValue(this.style, 'size', this.size))));
        var arcSize = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2;
        this.addPoints(c, [new mxPoint(0, h), new mxPoint(dx, 0), new mxPoint(w, 0), new mxPoint(w - dx, h)],
            this.isRounded, arcSize, true);
        c.end();
    };
    mxCellRenderer.registerShape('parallelogram', ParallelogramShape);

    // Trapezoid shape
    function TrapezoidShape()
    {
        mxActor.call(this);
    }
    mxUtils.extend(TrapezoidShape, mxActor);
    TrapezoidShape.prototype.size = 0.2;
    TrapezoidShape.prototype.isRoundable = function ()
    {
        return true;
    };
    TrapezoidShape.prototype.redrawPath = function (c, x, y, w, h)
    {
        var dx = w * Math.max(0, Math.min(0.5, parseFloat(mxUtils.getValue(this.style, 'size', this.size))));
        var arcSize = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2;
        this.addPoints(c, [new mxPoint(0, h), new mxPoint(dx, 0), new mxPoint(w - dx, 0), new mxPoint(w, h)],
            this.isRounded, arcSize, true);
    };
    mxCellRenderer.registerShape('trapezoid', TrapezoidShape); 

    // Overrides painting of rhombus shape to allow for double style
    var mxRhombusPaintVertexShape = mxRhombus.prototype.paintVertexShape;
    mxRhombus.prototype.getLabelBounds = function (rect)
    {
        if (this.style['double'] == 1)
        {
            var margin = (Math.max(2, this.strokewidth + 1) * 2 + parseFloat(
                this.style[mxConstants.STYLE_MARGIN] || 0)) * this.scale;

            return new mxRectangle(rect.x + margin, rect.y + margin,
                rect.width - 2 * margin, rect.height - 2 * margin);
        }

        return rect;
    };
    mxRhombus.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        mxRhombusPaintVertexShape.apply(this, arguments);

        if (!this.outline && this.style['double'] == 1)
        {
            var margin = Math.max(2, this.strokewidth + 1) * 2 +
                parseFloat(this.style[mxConstants.STYLE_MARGIN] || 0);
            x += margin;
            y += margin;
            w -= 2 * margin;
            h -= 2 * margin;

            if (w > 0 && h > 0)
            {
                c.setShadow(false);

                // Workaround for closure compiler bug where the lines with x and y above
                // are removed if arguments is used as second argument in call below.
                mxRhombusPaintVertexShape.apply(this, [c, x, y, w, h]);
            }
        }
    };

    // Perimeters
    mxPerimeter.OrthogonalPerimeter = function (bounds, vertex, next, orthogonal)
    {
        orthogonal = true;
        return mxPerimeter.RectanglePerimeter.apply(this, arguments);
    };
    mxStyleRegistry.putValue('orthogonalPerimeter', mxPerimeter.OrthogonalPerimeter);

    mxPerimeter.ParallelogramPerimeter = function (bounds, vertex, next, orthogonal)
    {
        var size = ParallelogramShape.prototype.size;

        if (vertex != null)
            size = mxUtils.getValue(vertex.style, 'size', size);

        var x = bounds.x;
        var y = bounds.y;
        var w = bounds.width;
        var h = bounds.height;

        var direction = (vertex != null) ? mxUtils.getValue(
            vertex.style, mxConstants.STYLE_DIRECTION,
            mxConstants.DIRECTION_EAST) : mxConstants.DIRECTION_EAST;
        var vertical = direction == mxConstants.DIRECTION_NORTH ||
            direction == mxConstants.DIRECTION_SOUTH;
        var points;

        if (vertical)
        {
            var dy = h * Math.max(0, Math.min(1, size));
            points = [new mxPoint(x, y), new mxPoint(x + w, y + dy),
            new mxPoint(x + w, y + h), new mxPoint(x, y + h - dy), new mxPoint(x, y)];
        }
        else
        {
            var dx = w * Math.max(0, Math.min(1, size));
            points = [new mxPoint(x + dx, y), new mxPoint(x + w, y),
            new mxPoint(x + w - dx, y + h), new mxPoint(x, y + h), new mxPoint(x + dx, y)];
        }

        var cx = bounds.getCenterX();
        var cy = bounds.getCenterY();

        var p1 = new mxPoint(cx, cy);

        if (orthogonal)
        {
            if (next.x < x || next.x > x + w)
            {
                p1.y = next.y;
            }
            else
            {
                p1.x = next.x;
            }
        }

        return mxUtils.getPerimeterPoint(points, p1, next);
    };
    mxStyleRegistry.putValue('parallelogramPerimeter', mxPerimeter.ParallelogramPerimeter);

    mxPerimeter.TrapezoidPerimeter = function (bounds, vertex, next, orthogonal)
    {
        var size = TrapezoidShape.prototype.size;

        if (vertex != null)
            size = mxUtils.getValue(vertex.style, 'size', size);

        var x = bounds.x;
        var y = bounds.y;
        var w = bounds.width;
        var h = bounds.height;

        var direction = (vertex != null) ? mxUtils.getValue(
            vertex.style, mxConstants.STYLE_DIRECTION,
            mxConstants.DIRECTION_EAST) : mxConstants.DIRECTION_EAST;
        var points;

        if (direction == mxConstants.DIRECTION_EAST)
        {
            var dx = w * Math.max(0, Math.min(1, size));
            points = [new mxPoint(x + dx, y), new mxPoint(x + w - dx, y),
            new mxPoint(x + w, y + h), new mxPoint(x, y + h), new mxPoint(x + dx, y)];
        }
        else if (direction == mxConstants.DIRECTION_WEST)
        {
            var dx = w * Math.max(0, Math.min(1, size));
            points = [new mxPoint(x, y), new mxPoint(x + w, y),
            new mxPoint(x + w - dx, y + h), new mxPoint(x + dx, y + h), new mxPoint(x, y)];
        }
        else if (direction == mxConstants.DIRECTION_NORTH)
        {
            var dy = h * Math.max(0, Math.min(1, size));
            points = [new mxPoint(x, y + dy), new mxPoint(x + w, y),
            new mxPoint(x + w, y + h), new mxPoint(x, y + h - dy), new mxPoint(x, y + dy)];
        }
        else
        {
            var dy = h * Math.max(0, Math.min(1, size));
            points = [new mxPoint(x, y), new mxPoint(x + w, y + dy),
            new mxPoint(x + w, y + h - dy), new mxPoint(x, y + h), new mxPoint(x, y)];
        }

        var cx = bounds.getCenterX();
        var cy = bounds.getCenterY();

        var p1 = new mxPoint(cx, cy);

        if (orthogonal)
        {
            if (next.x < x || next.x > x + w)
            {
                p1.y = next.y;
            }
            else
            {
                p1.x = next.x;
            }
        }

        return mxUtils.getPerimeterPoint(points, p1, next);
    };
    mxStyleRegistry.putValue('trapezoidPerimeter', mxPerimeter.TrapezoidPerimeter);

    // Link shape
    function LinkShape()
    {
        mxArrowConnector.call(this);
        this.spacing = 0;
    }
    mxUtils.extend(LinkShape, mxArrowConnector);
    LinkShape.prototype.defaultWidth = 4;
    LinkShape.prototype.isOpenEnded = function ()
    {
        return true;
    };
    LinkShape.prototype.getEdgeWidth = function ()
    {
        return mxUtils.getNumber(this.style, 'width', this.defaultWidth) + Math.max(0, this.strokewidth - 1);
    };
    LinkShape.prototype.isArrowRounded = function ()
    {
        return this.isRounded;
    };
    mxCellRenderer.registerShape('link', LinkShape);

    // Generic arrow
    function FlexArrowShape()
    {
        mxArrowConnector.call(this);
        this.spacing = 0;
    }
    mxUtils.extend(FlexArrowShape, mxArrowConnector);
    FlexArrowShape.prototype.defaultWidth = 10;
    FlexArrowShape.prototype.defaultArrowWidth = 20;
    FlexArrowShape.prototype.getStartArrowWidth = function ()
    {
        return this.getEdgeWidth() + mxUtils.getNumber(this.style, 'startWidth', this.defaultArrowWidth);
    };
    FlexArrowShape.prototype.getEndArrowWidth = function ()
    {
        return this.getEdgeWidth() + mxUtils.getNumber(this.style, 'endWidth', this.defaultArrowWidth);
    };
    FlexArrowShape.prototype.getEdgeWidth = function ()
    {
        return mxUtils.getNumber(this.style, 'width', this.defaultWidth) + Math.max(0, this.strokewidth - 1);
    };
    mxCellRenderer.registerShape('flexArrow', FlexArrowShape);

    // Single Arrow
    function SingleArrowShape()
    {
        mxActor.call(this);
    }
    mxUtils.extend(SingleArrowShape, mxActor);
    SingleArrowShape.prototype.arrowWidth = 0.3;
    SingleArrowShape.prototype.arrowSize = 0.2;
    SingleArrowShape.prototype.redrawPath = function (c, x, y, w, h)
    {
        var aw = h * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowWidth', this.arrowWidth))));
        var as = w * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowSize', this.arrowSize))));
        var at = (h - aw) / 2;
        var ab = at + aw;

        var arcSize = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2;
        this.addPoints(c, [new mxPoint(0, at), new mxPoint(w - as, at), new mxPoint(w - as, 0), new mxPoint(w, h / 2),
        new mxPoint(w - as, h), new mxPoint(w - as, ab), new mxPoint(0, ab)],
            this.isRounded, arcSize, true);
        c.end();
    };
    mxCellRenderer.registerShape('singleArrow', SingleArrowShape);

    // Double Arrow
    function DoubleArrowShape()
    {
        mxActor.call(this);
    }
    mxUtils.extend(DoubleArrowShape, mxActor);
    DoubleArrowShape.prototype.redrawPath = function (c, x, y, w, h)
    {
        var aw = h * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowWidth', SingleArrowShape.prototype.arrowWidth))));
        var as = w * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowSize', SingleArrowShape.prototype.arrowSize))));
        var at = (h - aw) / 2;
        var ab = at + aw;

        var arcSize = mxUtils.getValue(this.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2;
        this.addPoints(c, [new mxPoint(0, h / 2), new mxPoint(as, 0), new mxPoint(as, at), new mxPoint(w - as, at),
        new mxPoint(w - as, 0), new mxPoint(w, h / 2), new mxPoint(w - as, h),
        new mxPoint(w - as, ab), new mxPoint(as, ab), new mxPoint(as, h)],
            this.isRounded, arcSize, true);
        c.end();
    };
    mxCellRenderer.registerShape('doubleArrow', DoubleArrowShape);

    // FilledEdge shape
    function FilledEdge()
    {
        mxConnector.call(this);
    };
    mxUtils.extend(FilledEdge, mxConnector);
    FilledEdge.prototype.origPaintEdgeShape = FilledEdge.prototype.paintEdgeShape;
    FilledEdge.prototype.paintEdgeShape = function (c, pts, rounded)
    {
        // Markers modify incoming points array
        var temp = [];

        for (var i = 0; i < pts.length; i++)
        {
            temp.push(mxUtils.clone(pts[i]));
        }

        // paintEdgeShape resets dashed to false
        var dashed = c.state.dashed;
        var fixDash = c.state.fixDash;
        FilledEdge.prototype.origPaintEdgeShape.apply(this, [c, temp, rounded]);

        if (c.state.strokeWidth >= 3)
        {
            var fillClr = mxUtils.getValue(this.style, 'fillColor', null);
            if (fillClr != null)
            {
                c.setStrokeColor(fillClr);
                c.setStrokeWidth(c.state.strokeWidth - 2);
                c.setDashed(dashed, fixDash);
                FilledEdge.prototype.origPaintEdgeShape.apply(this, [c, pts, rounded]);
            }
        }
    };
    mxCellRenderer.registerShape('filledEdge', FilledEdge);

    // Arc Shape
    function ArcShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(ArcShape, mxShape);
    ArcShape.prototype.isRoundable = function ()
    {
        return false;
    };
    ArcShape.prototype.paintBackground = function (c, x, y, w, h)
    {
        c.translate(x, y);

        c.begin();
        c.moveTo(0, 0);
        c.arcTo(w, h/2, 0, 1, 1, 0, h);
        c.end();
        c.stroke();
    };
    ArcShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0, 0),   false, 'N'),
        new mxConnectionConstraint(new mxPoint(1, 0.5), false, 'E'),
        new mxConnectionConstraint(new mxPoint(0, 1),   false, 'S')
    ];
    mxCellRenderer.registerShape('arc', ArcShape);

    // Sound Shape
    function SoundShape()
    {
        mxImage.call(this);
    }
    mxUtils.extend(SoundShape, mxImageShape);
    SoundShape.prototype.isRoundable = function ()
    {
        return false;
    };
    SoundShape.prototype.isConnectable = function ()
    {
        return false;
    };
    SoundShape.prototype.constraints = [];
    mxCellRenderer.registerShape('sound', SoundShape);

    // Table Shape
    function TableShape()
    {
        mxSwimlane.call(this);
    }
    mxUtils.extend(TableShape, mxSwimlane);
    TableShape.prototype.isRoundable = function ()
    {
        return true;
    };
    TableShape.prototype.isConnectable = function ()
    {
        return true;
    };
    TableShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S'),
        new mxConnectionConstraint(new mxPoint(0, 0.5), false, 'W'),
        new mxConnectionConstraint(new mxPoint(1, 0.5), false, 'E')
    ];
    mxCellRenderer.registerShape('table', TableShape);

    // Button Shape
    function ButtonShape()
    {
        mxLabel.call(this);
    }
    mxUtils.extend(ButtonShape, mxLabel);
    ButtonShape.prototype.isRoundable = function ()
    {
        return true;
    };
    ButtonShape.prototype.isConnectable = function ()
    {
        return true;
    };
    ButtonShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S'),
        new mxConnectionConstraint(new mxPoint(0, 0.5), false, 'W'),
        new mxConnectionConstraint(new mxPoint(1, 0.5), false, 'E')
    ];
    mxCellRenderer.registerShape('button', ButtonShape);

    // Bus Shape
    function BusShape()
    {
        mxRectangleShape.call(this);
    }
    mxUtils.extend(BusShape, mxRectangleShape);
    BusShape.prototype.isRoundable = function ()
    {
        return false;
    };
    BusShape.prototype.isSizerVisible = function (index)
    {
        return index != 0 && index != 2 && index != 5 && index != 7;
    };
    BusShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        mxRectangleShape.prototype.paintVertexShape.apply(this, arguments);
        //c.begin();
        //c.moveTo(x + (w / 2), y + 0 + ((h / 8) * 2));
        //c.lineTo(x + (w / 2), y + h - ((h / 8) * 2));
        //c.end();
        //c.stroke();
    };
    BusShape.prototype.paintBackground = function (c, x, y, w, h)
    {
        mxRectangleShape.prototype.paintBackground.apply(this, arguments);
    };
    BusShape.prototype.paintForeground = function (c, x, y, w, h)
    {
        mxRectangleShape.prototype.paintForeground.apply(this, arguments);
    };
    BusShape.prototype.getConstraints = function (style, w, h)
    {
        var constr = [];
        // left side
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0.5), false, "W"));
        // right side
        constr.push(new mxConnectionConstraint(new mxPoint(1, 0.5), false, "E"));

        var graph = this.state.view.graph;
        var step = graph.gridEnabled ? graph.gridSize || 5 : 5;
        if (w > step)
        {
            var i = 0;
            for (var dx = step; dx < w; dx += step)
                constr.push(new mxConnectionConstraint(new mxPoint(0, 0.5), false, "P" + i, dx, 0));
        }

        return (constr);
    };
    mxCellRenderer.registerShape('bus', BusShape);

    // Switch Shape
    function SwitchShape()
    {
        mxRectangleShape.call(this);
    }
    mxUtils.extend(SwitchShape, mxRectangleShape);
    SwitchShape.prototype.isRoundable = function ()
    {
        return true;
    };
    SwitchShape.prototype.on = true;
    SwitchShape.prototype.position = true;
    SwitchShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        mxRectangleShape.prototype.paintVertexShape.apply(this, arguments);
    };
    SwitchShape.prototype.paintBackground = function (c, x, y, w, h)
    {
        mxRectangleShape.prototype.paintBackground.apply(this, arguments);
    };
    SwitchShape.prototype.paintForeground = function (c, x, y, w, h)
    {
        if (this.position)
        {
            c.begin();
            if (this.on)
            {
                c.moveTo(x + (w / 2), y + 0 + ((h / 8) * 2));
                c.lineTo(x + (w / 2), y + h - ((h / 8) * 2));
            }
            else
            {
                c.moveTo(x + (w / 8) * 2, y + (h / 2));
                c.lineTo(x + w - ((w / 8) * 2), y + (h / 2));
            }
            c.end();
            c.fillAndStroke();
        }
        mxRectangleShape.prototype.paintForeground.apply(this, arguments);
    };
    SwitchShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S'),
        new mxConnectionConstraint(new mxPoint(0, 0.5), false, 'W'),
        new mxConnectionConstraint(new mxPoint(1, 0.5), false, 'E')
    ];
    mxCellRenderer.registerShape('switch', SwitchShape);

    // RollSwitch Shape
    function RollSwitchShape()
    {
        mxRectangleShape.call(this);
    }
    mxUtils.extend(RollSwitchShape, mxRectangleShape);
    RollSwitchShape.prototype.isRoundable = function ()
    {
        return true;
    };
    RollSwitchShape.prototype.on = true;
    RollSwitchShape.prototype.position = true;
    RollSwitchShape.prototype.roll = 'UNKNOWN';
    RollSwitchShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        // draw roll state
        c.begin();

        c.setLineCap('round');
        c.setLineJoin('round');

        // top
        c.moveTo(x + (w / 2), y + 0);
        c.lineTo(x, y + h / 9);
        c.moveTo(x + (w / 2), y + 0);
        c.lineTo(x + w, y + h / 9);

        if (this.roll == "UNKNOWN" || this.roll == "IN")
        {
            c.moveTo(x + (w / 2), y + (h / 15));
            c.lineTo(x, y + h / 9 + (h / 15));
            c.moveTo(x + (w / 2), y + (h / 15));
            c.lineTo(x + w, y + h / 9 + (h / 15));

            c.moveTo(x + (w / 2), y + (h / 15));
            c.lineTo(x + (w / 2), y + h / 3);
        }
        
        // bottom
        c.moveTo(x + (w / 2), y + h);
        c.lineTo(x, y + h - h / 9);
        c.moveTo(x + (w / 2), y + h);
        c.lineTo(x + w, y + h - h / 9);

        if (this.roll == "UNKNOWN" || this.roll == "IN")
        {
            c.moveTo(x + (w / 2), y + h - (h / 15));
            c.lineTo(x, y + h - h / 9 - (h / 15));
            c.moveTo(x + (w / 2), y + h - (h / 15));
            c.lineTo(x + w, y + h - h / 9 - (h / 15));

            c.moveTo(x + (w / 2), y + h - (h / 15));
            c.lineTo(x + (w / 2), y + h - h / 3);
        }

        c.fillAndStroke();
        c.end();

        mxRectangleShape.prototype.paintVertexShape.apply(this, arguments);
    };
    RollSwitchShape.prototype.paintBackground = function (c, x, y, w, h)
    {
        if (this.roll == 'DAMAGE')
        {
            c.setStrokeColor('#FFFFFF');
            c.setFillColor(this.on ? '#FFFFFF' : 'none');
        }
        if (this.roll == "DAMAGE|DAMAGE")
        {
            c.setStrokeColor('#FF0000');
            c.setFillColor('none');
        }
        mxRectangleShape.prototype.paintBackground.apply(this, [c, x, y + h / 3, w, h / 3]);
    };
    RollSwitchShape.prototype.paintForeground = function (c, x, y, w, h)
    {
        if (this.position)
        {
            c.begin();
            c.setStrokeColor('#000000');
            if (this.on)
            {
                c.moveTo(x + (w / 2), y + (h / 3) + ((h / 24) * 2));
                c.lineTo(x + (w / 2), y + (h / 3) * 2 - ((h / 24) * 2));
            }
            else
            {
                c.moveTo(x + (w / 8) * 2, y + (h / 2));
                c.lineTo(x + w - ((w / 8) * 2), y + (h / 2));
            }
            c.fillAndStroke();
            c.end();
        }
        mxRectangleShape.prototype.paintForeground.apply(this, arguments);
    };
    RollSwitchShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('rollswitch', RollSwitchShape);

    // RollDisconnector Shape
    function RollDisconnectorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(RollDisconnectorShape, mxShape);
    RollDisconnectorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    RollDisconnectorShape.prototype.roll = 'UNKNOWN';
    RollDisconnectorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        // draw roll state
        c.begin();

        c.setLineCap('round');
        c.setLineJoin('round');

        // top
        c.moveTo(x + (w / 2), y + 0);
        c.lineTo(x, y + h / 9);
        c.moveTo(x + (w / 2), y + 0);
        c.lineTo(x + w, y + h / 9);

        if (this.roll != "CONTROL")
        {
            // top
            c.moveTo(x + (w / 2), y + (h / 15));
            c.lineTo(x, y + h / 9 + (h / 15));
            c.moveTo(x + (w / 2), y + (h / 15));
            c.lineTo(x + w, y + h / 9 + (h / 15));

            // line
            c.moveTo(x + (w / 2), y + (h / 15));
            c.lineTo(x + (w / 2), y + h - (h / 15));

            // bottom
            c.moveTo(x + (w / 2), y + h - (h / 15));
            c.lineTo(x, y + h - h / 9 - (h / 15));
            c.moveTo(x + (w / 2), y + h - (h / 15));
            c.lineTo(x + w, y + h - h / 9 - (h / 15));
        }

        // bottom
        c.moveTo(x + (w / 2), y + h);
        c.lineTo(x, y + h - h / 9);
        c.moveTo(x + (w / 2), y + h);
        c.lineTo(x + w, y + h - h / 9);

        c.fillAndStroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    RollDisconnectorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('rolldisconnector', RollDisconnectorShape);

    // Disconnector Shape
    function DisconnectorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(DisconnectorShape, mxShape);
    DisconnectorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    DisconnectorShape.prototype._state = 'UNKNOWN';
    DisconnectorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        // draw roll state
        c.begin();

        c.setLineCap('round');
        c.setLineJoin('round');

        // top
        let space = (w / 10);
        c.moveTo(x + space, y + 0);
        c.lineTo(x + w - space, y + 0);

        // middle
        if (this._state == "UNKNOWN" || this._state == "ON")
        {
            c.moveTo(x + (w / 2), y + (h / 8));
            c.lineTo(x + (w / 2), y + h - (h / 8));
        }
        else if (this._state == "OFF")
        {
            c.moveTo(x, y + (h / 2));
            c.lineTo(x + w, y + (h / 2));
        }
        else if (this._state == "MIDDLE")
        {
            c.moveTo(x, y + h - (h / 4));
            c.lineTo(x + w, y + (h / 4));
        }

        // bottom
        c.moveTo(x + space, y + h);
        c.lineTo(x + w - space, y + h);

        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    DisconnectorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('disconnector', DisconnectorShape);

    // Separator Shape
    function SeparatorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(SeparatorShape, mxShape);
    SeparatorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    SeparatorShape.prototype._state = 'UNKNOWN';
    SeparatorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');
        c.setFillColor('#000000');

        let rsize = h / 10;
        let space = (w / 10);

        // top
        c.begin();
        c.moveTo(x + space, y + 0);
        c.lineTo(x + w - space, y + 0);
        c.stroke();
        c.end();

        // middle
        if (this._state == "UNKNOWN" || this._state == "ON")
        {
            c.begin();

            c.moveTo(x + (w / 2), y + (h / 8));
            c.lineTo(x + (w / 2), y + h - (h / 8));

            c.moveTo(x + (w / 2), y + h / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + h / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + h / 2 + rsize);
            c.lineTo(x + (w / 2), y + h / 2 + rsize);
            c.rotate(0, false, false, x + (w / 2), y + (h / 2));

            c.close();
            c.fillAndStroke();
            c.end();
        }
        else if (this._state == "OFF")
        {
            c.begin();
            c.moveTo(x, y + (h / 2));
            c.lineTo(x + w, y + (h / 2));
            c.stroke();
            c.end();

            c.save();
            c.begin();

            c.moveTo(x + (w / 2), y + h / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + h / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + h / 2 + rsize);
            c.lineTo(x + (w / 2), y + h / 2 + rsize);
            c.rotate(90, false, false, x + (w / 2), y + (h / 2));

            c.close();
            c.fillAndStroke();
            c.end();
            c.restore();
        }
        else if (this._state == "MIDDLE")
        {
            c.save();
            c.begin();

            c.moveTo(x + (w / 2), y + (h / 8));
            c.lineTo(x + (w / 2), y + h - (h / 8));

            c.moveTo(x + (w / 2), y + h / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + h / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + h / 2 + rsize);
            c.lineTo(x + (w / 2), y + h / 2 + rsize);
            c.rotate(45, false, false, x + (w / 2), y + (h / 2));

            c.close();
            c.fillAndStroke();
            c.end();
            c.restore();
        }

        // bottom
        c.begin();
        c.moveTo(x + space, y + h);
        c.lineTo(x + w - space, y + h);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    SeparatorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('separator', SeparatorShape);

    // Ground Shape
    function GroundShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(GroundShape, mxShape);
    GroundShape.prototype.isRoundable = function ()
    {
        return false;
    };
    GroundShape.prototype._state = 'UNKNOWN';
    GroundShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.begin();

        c.setLineCap('round');
        c.setLineJoin('round');

        let space = (w / 10);
        let gsize = (h / 3);
        let gstep = gsize / 3;

        let height = h - gsize;

        // top
        c.moveTo(x + space, y + 0);
        c.lineTo(x + w - space, y + 0);

        // middle
        if (this._state == "UNKNOWN" || this._state == "ON")
        {
            c.moveTo(x + (w / 2), y + (height / 8));
            c.lineTo(x + (w / 2), y + height - (height / 8));
        }
        else if (this._state == "OFF")
        {
            c.moveTo(x, y + (height / 2));
            c.lineTo(x + w, y + (height / 2));
        }
        else if (this._state == "MIDDLE")
        {
            c.moveTo(x, y + height - (height / 4));
            c.lineTo(x + w, y + (height / 4));
        }

        // bottom
        c.moveTo(x + space, y + height);
        c.lineTo(x + w - space, y + height);

        // ground
        c.moveTo(x + w / 2, y + height);
        c.lineTo(x + w / 2, y + height + gstep * 1);

        // 1
        c.moveTo(x + space * 0, y + height + gstep * 1);
        c.lineTo(x + w - space * 0, y + height + gstep * 1);

        // 2
        c.moveTo(x + space * 2, y + height + gstep * 2);
        c.lineTo(x + w - space * 2, y + height + gstep * 2);

        // 3
        c.moveTo(x + space * 3, y + height + gstep * 3);
        c.lineTo(x + w - space * 3, y + height + gstep * 3);

        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    GroundShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('ground', GroundShape);

    // Contactor Shape
    function ContactorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(ContactorShape, mxShape);
    ContactorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    ContactorShape.prototype._state = 'UNKNOWN';
    ContactorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');
        c.setFillColor('#000000');

        let rsize  = h / 10;
        let space  = (w / 10);
        let gsize  = (h / 3);
        let gstep  = gsize / 3;
        let height = h - gsize;

        // top
        c.begin();  
        c.moveTo(x + space, y + 0);
        c.lineTo(x + w - space, y + 0);
        c.stroke();
        c.end();

        // middle
        if (this._state == "UNKNOWN" || this._state == "ON")
        {
            //c.moveTo(x + (w / 2), y + (height / 8));
            //c.lineTo(x + (w / 2), y + height - (height / 8));

            c.begin();

            c.moveTo(x + (w / 2), y + (height / 8));
            c.lineTo(x + (w / 2), y + height - (height / 8));

            c.moveTo(x + (w / 2), y + height / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + height / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + height / 2 + rsize);
            c.lineTo(x + (w / 2), y + height / 2 + rsize);
            c.rotate(0, false, false, x + (w / 2), y + (height / 2));

            c.close();
            c.fillAndStroke();
            c.end();
        }
        else if (this._state == "OFF")
        {
            //c.moveTo(x, y + (height / 2));
            //c.lineTo(x + w, y + (height / 2));
            c.begin();
            c.moveTo(x, y + (height / 2));
            c.lineTo(x + w, y + (height / 2));
            c.stroke();
            c.end();

            c.save();
            c.begin();

            c.moveTo(x + (w / 2), y + height / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + height / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + height / 2 + rsize);
            c.lineTo(x + (w / 2), y + height / 2 + rsize);
            c.rotate(90, false, false, x + (w / 2), y + (height / 2));

            c.close();
            c.fillAndStroke();
            c.end();
            c.restore();
        }
        else if (this._state == "MIDDLE")
        {
            //c.moveTo(x, y + height - (height / 4));
            //c.lineTo(x + w, y + (height / 4));
            c.save();
            c.begin();

            c.moveTo(x + (w / 2), y + (height / 8));
            c.lineTo(x + (w / 2), y + height - (height / 8));

            c.moveTo(x + (w / 2), y + height / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + height / 2 - rsize);
            c.lineTo(x + (w / 2) + rsize / 2, y + height / 2 + rsize);
            c.lineTo(x + (w / 2), y + height / 2 + rsize);
            c.rotate(45, false, false, x + (w / 2), y + (height / 2));

            c.close();
            c.fillAndStroke();
            c.end();
            c.restore();
        }

        c.begin();

        // bottom
        c.moveTo(x + space, y + height);
        c.lineTo(x + w - space, y + height);

        // ground
        c.moveTo(x + w / 2, y + height);
        c.lineTo(x + w / 2, y + height + gstep * 1);

        // 1
        c.moveTo(x + space * 0, y + height + gstep * 1);
        c.lineTo(x + w - space * 0, y + height + gstep * 1);

        // 2
        c.moveTo(x + space * 2, y + height + gstep * 2);
        c.lineTo(x + w - space * 2, y + height + gstep * 2);

        // 3
        c.moveTo(x + space * 3, y + height + gstep * 3);
        c.lineTo(x + w - space * 3, y + height + gstep * 3);

        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    ContactorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('contactor', ContactorShape);

    // Roll element Shape
    function RollElementShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(RollElementShape, mxShape);
    RollElementShape.prototype.isRoundable = function ()
    {
        return false;
    };
    RollElementShape.prototype._state = 'UNKNOWN';
    RollElementShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        // draw roll state
        c.begin();

        c.setLineCap('round');
        c.setLineJoin('round');

        // top
        c.moveTo(x + (w / 2), y + 0);
        c.lineTo(x, y + h / 2);
        c.moveTo(x + (w / 2), y + 0);
        c.lineTo(x + w, y + h / 2);

        if (this._state == "UNKNOWN" || this._state == "IN")
        {
            c.moveTo(x + (w / 2), y + (h / 2));
            c.lineTo(x, y + h);
            c.moveTo(x + (w / 2), y + (h / 2));
            c.lineTo(x + w, y + h);
        }

        c.fillAndStroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    RollElementShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N')
    ];
    mxCellRenderer.registerShape('rollelement', RollElementShape);

    // Actuator Shape
    function ActuatorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(ActuatorShape, mxShape);
    ActuatorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    ActuatorShape.prototype._state = 'UNKNOWN';
    ActuatorShape.prototype.fill_1 = null;
    ActuatorShape.prototype.fill_2 = null;
    ActuatorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        // left
        c.save();
        c.begin();
        if (this.fill_1 != null)
            c.setFillColor(this.fill_1);
        c.moveTo(x, y);
        c.lineTo(x + w / 2, y + h / 2);
        c.lineTo(x, y + h);
        c.close();
        c.fillAndStroke();
        c.end();
        c.restore();

        // right
        c.save();
        c.begin();
        if (this.fill_2 != null)
            c.setFillColor(this.fill_2);
        c.moveTo(x + w, y);
        c.lineTo(x + w / 2, y + h / 2);
        c.lineTo(x + w, y + h);
        c.close();
        c.fillAndStroke();
        c.end();
        c.restore();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    ActuatorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0, 0.5),   false, 'W'),
        new mxConnectionConstraint(new mxPoint(0.5, 0.5), false, 'M'),
        new mxConnectionConstraint(new mxPoint(1, 0.5),   false, 'E')
    ];
    mxCellRenderer.registerShape('actuator', ActuatorShape);

    // Simple switch Shape
    function SimpleSwitchShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(SimpleSwitchShape, mxShape);
    SimpleSwitchShape.prototype.isRoundable = function ()
    {
        return false;
    };
    SimpleSwitchShape.prototype._state = 'UNKNOWN';
    SimpleSwitchShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');
        c.setFillColor(c.state.strokeColor);

        let size  = w / 2;
        let csize = w / 4;

        // top
        c.begin();
        c.moveTo(x + (w / 2) - size / 2, y + 0);
        c.lineTo(x + (w / 2) + size / 2, y + 0);
        c.stroke();
        c.end();

        // middle
        if (this._state == "UNKNOWN" || this._state == "OFF")
        {
            c.begin();
            c.moveTo(x, y + (h / 8));
            c.lineTo(x + (w / 2), y + h);
            c.stroke();
            c.end();
        }
        else if (this._state == "ON")
        {
            c.begin();
            c.moveTo(x + (w / 2), y + (h / 10));
            c.lineTo(x + (w / 2), y + h);
            c.stroke();
            c.end();
        }
        
        // bottom
        c.begin();
        //c.moveTo(x + (w / 2), y + h);
        c.ellipse(x + (w / 2) - csize / 2, y + h - csize / 2, csize, csize);
        c.fillAndStroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    SimpleSwitchShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('simpleswitch', SimpleSwitchShape);

    // Chart Shape
    function ChartShape()
    {
        mxLabel.call(this);
    }
    mxUtils.extend(ChartShape, mxLabel);
    ChartShape.prototype.isRoundable = function ()
    {
        return true;
    };
    ChartShape.prototype.isConnectable = function ()
    {
        return true;
    };
    ChartShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S'),
        new mxConnectionConstraint(new mxPoint(0, 0.5), false, 'W'),
        new mxConnectionConstraint(new mxPoint(1, 0.5), false, 'E')
    ];
    mxCellRenderer.registerShape('chart', ChartShape);

    // BMRZ Shape
    function BmrzShape()
    {
        mxImage.call(this);
    }
    mxUtils.extend(BmrzShape, mxImageShape);
    BmrzShape.prototype.isRoundable = function ()
    {
        return false;
    };
    BmrzShape.prototype.isConnectable = function ()
    {
        return true;
    };
    BmrzShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S'),
        new mxConnectionConstraint(new mxPoint(0, 0.5), false, 'W'),
        new mxConnectionConstraint(new mxPoint(1, 0.5), false, 'E')
    ];
    mxCellRenderer.registerShape('bmrz', BmrzShape);

    //--------- static elements ------------//

    // WINDING STAR
    function WStarShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(WStarShape, mxShape);
    WStarShape.prototype.isRoundable = function ()
    {
        return false;
    };
    WStarShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');
        
        c.begin();
        // left
        c.moveTo(x + (w / 2), y + (h / 3));
        c.lineTo(x, y + 0);
        // right
        c.moveTo(x + (w / 2), y + (h / 3));
        c.lineTo(x + w, y + 0);
        // bottom
        c.moveTo(x + (w / 2), y + (h / 3));
        c.lineTo(x + w / 2, y + h);
        // stroke
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    WStarShape.prototype.constraints = [];
    mxCellRenderer.registerShape('wstar', WStarShape);

    // WINDING TRIANGLE
    function WTriangleShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(WTriangleShape, mxShape);
    WTriangleShape.prototype.isRoundable = function ()
    {
        return false;
    };
    WTriangleShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        c.begin();
        c.moveTo(x + (w / 2), y + 0);
        c.lineTo(x, y + h);
        c.lineTo(x + w, y + h);
        c.close();
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    WTriangleShape.prototype.constraints = [];
    mxCellRenderer.registerShape('wtriangle', WTriangleShape);

    // WINDING TORN TRIANGLE
    function WTornShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(WTornShape, mxShape);
    WTornShape.prototype.isRoundable = function ()
    {
        return false;
    };
    WTornShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        c.begin();
        c.moveTo(x + (w / 4), y + 0);
        c.lineTo(x, y + h);
        c.lineTo(x + w, y + h);
        c.lineTo(x + w - (w / 4), y + 0);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    WTornShape.prototype.constraints = [];
    mxCellRenderer.registerShape('wtorn', WTornShape);

    // FUSE
    function FuseShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(FuseShape, mxShape);
    FuseShape.prototype.isRoundable = function ()
    {
        return false;
    };
    FuseShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        c.begin();
        c.moveTo(x, y);
        c.rect(x, y, w, h);
        c.stroke();
        c.end();

        c.begin();        
        c.moveTo(x + w / 2, y);
        c.lineTo(x + w / 2, y + h);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    FuseShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('fuse', FuseShape);

    // CURRENT_TRANSFORMER
    function CurrentTransformerShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(CurrentTransformerShape, mxShape);
    CurrentTransformerShape.prototype.isRoundable = function ()
    {
        return false;
    };
    CurrentTransformerShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');
        c.setFillColor(c.state.strokeColor);

        let csize = w / 6;

        // ellipse
        c.begin();
        c.ellipse(x, y + h / 7, w, (h / 7) * 5);
        c.stroke();
        c.end();

        // line
        c.begin();
        c.moveTo(x + w / 2, y);
        c.lineTo(x + w / 2, y + h);
        c.stroke();
        c.end();

        // c1
        c.begin();
        c.ellipse(x + w / 2 - csize / 2, y - csize / 2, csize, csize);
        c.fill();
        c.end();

        // c2
        c.begin();
        c.ellipse(x + w / 2 - csize / 2, y + h - csize / 2, csize, csize);
        c.fill();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    CurrentTransformerShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('current_transformer', CurrentTransformerShape);

    // CURRENT_TRANSFORMER_RU
    function CurrentTransformerRUShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(CurrentTransformerRUShape, mxShape);
    CurrentTransformerRUShape.prototype.isRoundable = function ()
    {
        return false;
    };
    CurrentTransformerRUShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');
        
        // vline
        c.begin();
        c.moveTo(x + w - w / 4, y);
        c.lineTo(x + w - w / 4, y + h);
        c.stroke();
        c.end();

        // line1
        c.begin();
        c.moveTo(x + w - (w / 4) * 2, y);
        c.lineTo(x + w, y);
        c.stroke();
        c.end();

        // line2
        c.begin();
        c.moveTo(x + w - (w / 4) * 2, y + h);
        c.lineTo(x + w, y + h);
        c.stroke();
        c.end();

        // arc1
        c.begin();
        c.moveTo(x + w - (w / 4) * 2, y);
        c.arcTo(h / 4, w / 2, 90, 0, 0, x + w - (w / 4) * 2, y + h / 2);
        c.stroke();
        c.end();

        // arc2
        c.begin();
        c.moveTo(x + w - (w / 4) * 2, y + h);
        c.arcTo(h / 4, w / 2, 90, 0, 1, x + w - (w / 4) * 2, y + h / 2);
        c.stroke();
        c.end();
        
        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    CurrentTransformerRUShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.75, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.75, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('current_transformer_ru', CurrentTransformerRUShape);

    // CURRENT_TRANSFORMER_FSK
    function CurrentTransformerFSKShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(CurrentTransformerFSKShape, mxShape);
    CurrentTransformerFSKShape.prototype.isRoundable = function ()
    {
        return false;
    };
    CurrentTransformerFSKShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        // vline
        c.begin();
        c.ellipse(x, y, (w / 4) * 3, h);
        c.stroke();
        c.end();

        // line1
        c.begin();
        c.moveTo(x + w - (w / 8) * 2, y + (h / 6) * 2);
        c.lineTo(x + w, y + (h / 6) * 2);
        c.stroke();
        c.end();

        // line2
        c.begin();
        c.moveTo(x + w - (w / 8) * 2, y + h - (h / 6) * 2);
        c.lineTo(x + w, y + h - (h / 6) * 2);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    CurrentTransformerFSKShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.375, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.375, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('current_transformer_fsk', CurrentTransformerFSKShape);

    // Reactor
    function ReactorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(ReactorShape, mxShape);
    ReactorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    ReactorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        // arc
        c.begin();
        c.moveTo(x + w / 2, y);
        c.arcTo(h / 2, w / 2, 0, 1, 1, x, y + h / 2);
        c.stroke();
        c.end();

        // line1
        c.begin();
        c.moveTo(x, y + h / 2);
        c.lineTo(x + w / 2, y + h / 2);
        c.stroke();
        c.end();

        // line2
        c.begin();
        c.moveTo(x + w / 2, y + h / 2);
        c.lineTo(x + w / 2, y + h);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    ReactorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('reactor', ReactorShape);

    // OPN
    function OPNShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(OPNShape, mxShape);
    OPNShape.prototype.isRoundable = function ()
    {
        return false;
    };
    OPNShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        let space  = w / 5;
        let vspace = h / 8;

        // rect
        c.begin();
        c.rect(x + space, y, w - space * 2, h);
        c.stroke();
        c.end();

        // line
        c.begin();
        c.moveTo(x + w, y);
        c.lineTo(x, y + h - vspace * 2);
        c.lineTo(x, y + h);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    OPNShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('opn', OPNShape);

    // OPN non linear
    function OPNLShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(OPNLShape, mxShape);
    OPNLShape.prototype.isRoundable = function ()
    {
        return false;
    };
    OPNLShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        let space  = w / 5;
        let vspace = h / 8;

        // rect
        c.begin();
        c.rect(x + space, y, w - space * 2, h);
        c.stroke();
        c.end();

        // line
        c.begin();
        c.moveTo(x + w, y + h);
        c.lineTo(x, y + vspace * 2);
        c.lineTo(x, y);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    OPNLShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('opn_nl', OPNLShape);

    // Rezistor
    function RezistorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(RezistorShape, mxShape);
    RezistorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    RezistorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        // rect
        c.begin();
        c.rect(x, y, w, h);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    RezistorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('rezistor', RezistorShape);

    // Condensator
    function CondensatorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(CondensatorShape, mxShape);
    CondensatorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    CondensatorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        let vspace = h / 3;

        c.begin();

        c.moveTo(x + w / 2, y);
        c.lineTo(x + w / 2, y + vspace);

        c.moveTo(x, y + vspace);
        c.lineTo(x + w, y + vspace);

        c.moveTo(x, y + vspace * 2);
        c.lineTo(x + w, y + vspace * 2);

        c.moveTo(x + w / 2, y + vspace * 2);
        c.lineTo(x + w / 2, y + h);

        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    CondensatorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('condensator', CondensatorShape);

    // Inductance
    function InductanceShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(InductanceShape, mxShape);
    InductanceShape.prototype.isRoundable = function ()
    {
        return false;
    };
    InductanceShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        let vstep = h / 3;

        // arcs
        c.begin();
        c.moveTo(x, y);
        c.arcTo(vstep / 2, w, 90, 0, 1, x, y + vstep * 1);
        c.arcTo(vstep / 2, w, 90, 0, 1, x, y + vstep * 2);
        c.arcTo(vstep / 2, w, 90, 0, 1, x, y + h);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    InductanceShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0, 1), false, 'S')
    ];
    mxCellRenderer.registerShape('inductance', InductanceShape);

    // Ground1 Shape
    function Ground1Shape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(Ground1Shape, mxShape);
    Ground1Shape.prototype.isRoundable = function ()
    {
        return false;
    };
    Ground1Shape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.begin();

        c.setLineCap('round');
        c.setLineJoin('round');

        let space = (w / 8);

        // 1
        c.moveTo(x, y);
        c.lineTo(x + w, y);

        // 2
        c.moveTo(x + space * 1, y + h / 2);
        c.lineTo(x + w - space * 1, y + h / 2);

        // 3
        c.moveTo(x + space * 2, y + h);
        c.lineTo(x + w - space * 2, y + h);

        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    Ground1Shape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N')
    ];
    mxCellRenderer.registerShape('ground1', Ground1Shape);

    // CABLE_CONE
    function CableConeShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(CableConeShape, mxShape);
    CableConeShape.prototype.isRoundable = function ()
    {
        return false;
    };
    CableConeShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.begin();

        c.setLineCap('round');
        c.setLineJoin('round');

        // triangle
        c.moveTo(x, y);
        c.lineTo(x + w, y);
        c.lineTo(x + w / 2, y + h);
        c.close();
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    CableConeShape.prototype.constraints = [];
    mxCellRenderer.registerShape('cable_cone', CableConeShape);

    // AC shape
    function ACShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(ACShape, mxShape);
    ACShape.prototype.isRoundable = function ()
    {
        return false;
    };
    ACShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        // arcs
        c.begin();
        c.moveTo(x, y + h / 3);
        c.arcTo(w / 4, h / 2, 0, 0, 0, x + w / 2, y + h / 2);
        c.arcTo(w / 4, h / 2, 0, 0, 1, x + w, y + h - h / 3);
        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    ACShape.prototype.constraints = [];
    mxCellRenderer.registerShape('ac', ACShape);

    // Load shape
    function LoadShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(LoadShape, mxShape);
    LoadShape.prototype.isRoundable = function ()
    {
        return false;
    };
    LoadShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');
        c.setFillColor(c.state.strokeColor);

        // arcs
        c.begin();
        c.moveTo(x + w / 2, y);
        c.lineTo(x + w / 2, y + h / 2);
        c.moveTo(x, y + h / 2);
        c.lineTo(x + w, y + h / 2);
        c.lineTo(x + w / 2, y + h);
        c.close();
        c.fillAndStroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    LoadShape.prototype.constraints = [];
    mxCellRenderer.registerShape('load', LoadShape);

    // Compensator shape
    function CompensatorShape()
    {
        mxShape.call(this);
    }
    mxUtils.extend(CompensatorShape, mxShape);
    CompensatorShape.prototype.isRoundable = function ()
    {
        return false;
    };
    CompensatorShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        c.setLineCap('round');
        c.setLineJoin('round');

        let step = w / 5;

        c.begin();
        c.ellipse(x, y, w, h);
        c.stroke();
        c.end();

        c.begin();

        // line1
        c.moveTo(x + step, y + h / 2 - h / 8);
        c.lineTo(x + w - step, y + h / 2 - h / 8);
        // line2
        c.moveTo(x + step, y + h / 2 + h / 8);
        c.lineTo(x + w - step, y + h / 2 + h / 8);

        c.stroke();
        c.end();

        mxShape.prototype.paintVertexShape.apply(this, arguments);
    };
    CompensatorShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0.5, 0), false, 'N'),
        new mxConnectionConstraint(new mxPoint(0.5, 1), false, 'S'),
        new mxConnectionConstraint(new mxPoint(0, 0.5), false, 'W'),
        new mxConnectionConstraint(new mxPoint(1, 0.5), false, 'E')
    ];
    mxCellRenderer.registerShape('compensator', CompensatorShape);

    // Poster shape
    function PosterShape() {
        mxImageShape.call(this);
    }
    mxUtils.extend(PosterShape, mxImageShape);
    PosterShape.prototype.isRoundable = function ()
    {
        return false;
    };
    /**
     * https://stackoverflow.com/questions/35969656
     * @param {*} hex - color
     * @param {*} bw - black and white mode
     * @returns hex color string
     */
    PosterShape.prototype.getContrastColor = function invertColor(hex, bw) {
        const padZero = (str, len) => {
            len = len || 2;
            var zeros = new Array(len).join('0');
            return (zeros + str).slice(-len);
        };

        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        var r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
        }
        // invert color components
        r = (255 - r).toString(16);
        g = (255 - g).toString(16);
        b = (255 - b).toString(16);
        // pad each with zeros and return
        return "#" + padZero(r) + padZero(g) + padZero(b);
    };
    PosterShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        const cell = this.state.cell;
        const poster = this.state.cell._model;
        const graph = this.state.view.graph;
        const renderEmtyShape = () => {
            const backgroundColor = graph.background ? graph.background : "#FFFFFF";
            const contrastColor = this.getContrastColor(backgroundColor === "none" ? "#FFFFFF" : backgroundColor);
            c.setStrokeColor(contrastColor);
            c.setFontColor(contrastColor);
            c.setFontSize(Math.round(h / 3));
            c.text(x + w/2, y + h/2, w, h, "Плакатов\nнет", mxConstants.ALIGN_CENTER, mxConstants.ALIGN_MIDDLE, false, "", true, false, 0);
            mxRectangleShape.prototype.paintVertexShape.apply(this, arguments);
        };
        if (!poster) {
            renderEmtyShape();
            return;
        }
        const resData = poster.data.type.split("-") || [];
        const settedPosters = API.POSTERS.metadata.filter(meta => resData.includes(meta.key));
        const xOffset = w / 10;
        const yOffset = h / 10;
        /* check if this function has ben called from tracker process */
        if (cell._isHighlightRender) {
            /* render highlight rect */
            const steps = settedPosters.length > 1 ? settedPosters.length - 1 : 0;
            const rectWidth = w + xOffset * steps;
            const rectHeight = h + yOffset * steps;
            mxRectangleShape.prototype.paintVertexShape.call(this, c, x, y, rectWidth, rectHeight);
            /* reset hacking property */
            cell._isHighlightRender = false;
        } else {
            /* normal poster images render */
            for (let i = settedPosters.length - 1; i >= 0; i--) {
                this.image = settedPosters[i].src;
                mxImageShape.prototype.paintVertexShape.call(this, c, x + i * xOffset, y + i * yOffset, w, h);
            }
            if (settedPosters.length === 0) {
                renderEmtyShape();
            }
        }
    };
    PosterShape.prototype.constraints = [];
    mxCellRenderer.registerShape("poster", PosterShape);

    // Dispatcher mark shapes
    function DispatcherMarkShape() {
        mxImageShape.call(this);
    }
    mxUtils.extend(DispatcherMarkShape, mxImageShape);
    DispatcherMarkShape.prototype.isRoundable = function ()
    {
        return false;
    };
    DispatcherMarkShape.prototype.paintVertexShape = function (c, x, y, w, h)
    {
        const cell = this.state.cell;
        const dispatcherMark = cell._model;

        const renderDefaultShape = () => {
            this.image = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJpbmZvLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4wLjItMiAoZTg2Yzg3MDg3OSwgMjAyMS0wMS0xNSkiPgogIDxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgYm9yZGVyb3BhY2l0eT0iMSIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGdyaWR0b2xlcmFuY2U9IjEwMDAwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDAxIgogICAgIGlkPSJuYW1lZHZpZXc5IgogICAgIHNob3dncmlkPSJ0cnVlIgogICAgIGlua3NjYXBlOnpvb209IjQuNDI3NDY3MyIKICAgICBpbmtzY2FwZTpjeD0iMTUuNzI1NjEzIgogICAgIGlua3NjYXBlOmN5PSI2Mi4xMjE2NTYiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC1yb3RhdGlvbj0iMCIKICAgICBpbmtzY2FwZTpzbmFwLWdsb2JhbD0idHJ1ZSI+CiAgICA8aW5rc2NhcGU6Z3JpZAogICAgICAgdHlwZT0ieHlncmlkIgogICAgICAgaWQ9ImdyaWQ4MzMiCiAgICAgICBzcGFjaW5neD0iMC4yNjQ1ODMzMyIKICAgICAgIHNwYWNpbmd5PSIwLjI2NDU4MzMzIgogICAgICAgZW1wc3BhY2luZz0iMTAiIC8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPGRlZnMKICAgICBpZD0iZGVmczIiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNSI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGUgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICBpZD0ibGF5ZXIxIgogICAgIHN0eWxlPSJzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjI2NDU4MzMyLDAuMjY0NTgxNTMpIj4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6MjIuNTc3OHB4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjtmaWxsOiNlNjQ2ZTY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjAuMjgwMDE2IgogICAgICAgeD0iOS43MDQ5MDE3IgogICAgICAgeT0iMjAuODY5MDM0IgogICAgICAgaWQ9InRleHQ4NTEiPjx0c3BhbgogICAgICAgICBzb2RpcG9kaTpyb2xlPSJsaW5lIgogICAgICAgICBpZD0idHNwYW44NDkiCiAgICAgICAgIHg9IjkuNzA0OTAxNyIKICAgICAgICAgeT0iMjAuODY5MDM0IgogICAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpub3JtYWw7Zm9udC1zaXplOjIyLjU3NzhweDtmb250LWZhbWlseTonVGltZXMgTmV3IFJvbWFuJzstaW5rc2NhcGUtZm9udC1zcGVjaWZpY2F0aW9uOidUaW1lcyBOZXcgUm9tYW4sIEJvbGQnO2ZpbGw6I2U2NDZlNjtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6MC4yODAwMTYiPmk8L3RzcGFuPjwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=";
            mxImageShape.prototype.paintVertexShape.apply(this, arguments);
        };
        const renderGroundingNumber = () => {
            c.setFontColor("#000000");
            const length = dispatcherMark.data.number.length;
            if (length <= 5) {
                c.setFontSize(Math.round(h / 3));
            } else {
                c.setFontSize(Math.round(h * 1.5 / length));
            }
            c.text(x + w / 2, y + h / 2, w, h, dispatcherMark.data.number, mxConstants.ALIGN_CENTER, mxConstants.ALIGN_MIDDLE, false, "", true, false, 0);
        };

        if (!dispatcherMark) {
            renderDefaultShape();
            return;
        }
        let mark = null;
        for (const meta of API.DISPATCHER_MARKS.metadata) {
            if (meta.key === dispatcherMark.data.type) {
                mark = meta;
                break;
            }
        }
        /* check if this function has ben called from tracker process */
        if (cell._isHighlightRender) {
            /* render highlight rect */
            mxRectangleShape.prototype.paintVertexShape.call(this, c, x, y, w, h);
            /* reset hacking property */
            cell._isHighlightRender = false;
        } else {
            /* normal mark image render */
            if (mark) {
                this.image = mark.src;
                mxImageShape.prototype.paintVertexShape.apply(this, arguments);
                if (mark.key === "numPortableGrounding")
                    renderGroundingNumber();
            } else {
                renderDefaultShape();
            }
        }
    };
    DispatcherMarkShape.prototype.constraints = [];
    mxCellRenderer.registerShape("dispatcher_mark", DispatcherMarkShape);

    // Registers and defines the custom markers
    mxMarker.addMarker('dash', function (c, shape, type, pe, unitX, unitY, size, source, sw, filled)
    {
        var nx = unitX * (size + sw + 1);
        var ny = unitY * (size + sw + 1);

        return function ()
        {
            c.begin();
            c.moveTo(pe.x - nx / 2 - ny / 2, pe.y - ny / 2 + nx / 2);
            c.lineTo(pe.x + ny / 2 - 3 * nx / 2, pe.y - 3 * ny / 2 - nx / 2);
            c.stroke();
        };
    });
    mxMarker.addMarker('cross', function (c, shape, type, pe, unitX, unitY, size, source, sw, filled)
    {
        var nx = unitX * (size + sw + 1);
        var ny = unitY * (size + sw + 1);

        return function ()
        {
            c.begin();
            c.moveTo(pe.x - nx / 2 - ny / 2, pe.y - ny / 2 + nx / 2);
            c.lineTo(pe.x + ny / 2 - 3 * nx / 2, pe.y - 3 * ny / 2 - nx / 2);
            c.moveTo(pe.x - nx / 2 + ny / 2, pe.y - ny / 2 - nx / 2);
            c.lineTo(pe.x - ny / 2 - 3 * nx / 2, pe.y - 3 * ny / 2 + nx / 2);
            c.stroke();
        };
    });

    function circleMarker(c, shape, type, pe, unitX, unitY, size, source, sw, filled)
    {
        var a = size / 2;
        var size = size + sw;

        var pt = pe.clone();

        pe.x -= unitX * (2 * size + sw);
        pe.y -= unitY * (2 * size + sw);

        unitX = unitX * (size + sw);
        unitY = unitY * (size + sw);

        return function ()
        {
            c.ellipse(pt.x - unitX - size, pt.y - unitY - size, 2 * size, 2 * size);

            if (filled)
            {
                c.fillAndStroke();
            }
            else
            {
                c.stroke();
            }
        };
    }
    mxMarker.addMarker('circle', circleMarker);
    mxMarker.addMarker('circlePlus', function (c, shape, type, pe, unitX, unitY, size, source, sw, filled)
    {
        var pt = pe.clone();
        var fn = circleMarker.apply(this, arguments);
        var nx = unitX * (size + 2 * sw); // (size + sw + 1);
        var ny = unitY * (size + 2 * sw); //(size + sw + 1);

        return function ()
        {
            fn.apply(this, arguments);

            c.begin();
            c.moveTo(pt.x - unitX * (sw), pt.y - unitY * (sw));
            c.lineTo(pt.x - 2 * nx + unitX * (sw), pt.y - 2 * ny + unitY * (sw));
            c.moveTo(pt.x - nx - ny + unitY * sw, pt.y - ny + nx - unitX * sw);
            c.lineTo(pt.x + ny - nx - unitY * sw, pt.y - ny - nx + unitX * sw);
            c.stroke();
        };
    });
    mxMarker.addMarker('halfCircle', function (c, shape, type, pe, unitX, unitY, size, source, sw, filled)
    {
        var nx = unitX * (size + sw + 1);
        var ny = unitY * (size + sw + 1);
        var pt = pe.clone();

        pe.x -= nx;
        pe.y -= ny;

        return function ()
        {
            c.begin();
            c.moveTo(pt.x - ny, pt.y + nx);
            c.quadTo(pe.x - ny, pe.y + nx, pe.x, pe.y);
            c.quadTo(pe.x + ny, pe.y - nx, pt.x + ny, pt.y - nx);
            c.stroke();
        };
    });

    mxMarker.addMarker('async', function (c, shape, type, pe, unitX, unitY, size, source, sw, filled)
    {
        // The angle of the forward facing arrow sides against the x axis is
        // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
        // only half the strokewidth is processed ).
        var endOffsetX = unitX * sw * 1.118;
        var endOffsetY = unitY * sw * 1.118;

        unitX = unitX * (size + sw);
        unitY = unitY * (size + sw);

        var pt = pe.clone();
        pt.x -= endOffsetX;
        pt.y -= endOffsetY;

        var f = 1;
        pe.x += -unitX * f - endOffsetX;
        pe.y += -unitY * f - endOffsetY;

        return function ()
        {
            c.begin();
            c.moveTo(pt.x, pt.y);

            if (source)
            {
                c.lineTo(pt.x - unitX - unitY / 2, pt.y - unitY + unitX / 2);
            }
            else
            {
                c.lineTo(pt.x + unitY / 2 - unitX, pt.y - unitY - unitX / 2);
            }

            c.lineTo(pt.x - unitX, pt.y - unitY);
            c.close();

            if (filled)
            {
                c.fillAndStroke();
            }
            else
            {
                c.stroke();
            }
        };
    });

    function createOpenAsyncArrow(widthFactor)
    {
        widthFactor = (widthFactor != null) ? widthFactor : 2;

        return function (c, shape, type, pe, unitX, unitY, size, source, sw, filled)
        {
            unitX = unitX * (size + sw);
            unitY = unitY * (size + sw);

            var pt = pe.clone();

            return function ()
            {
                c.begin();
                c.moveTo(pt.x, pt.y);

                if (source)
                {
                    c.lineTo(pt.x - unitX - unitY / widthFactor, pt.y - unitY + unitX / widthFactor);
                }
                else
                {
                    c.lineTo(pt.x + unitY / widthFactor - unitX, pt.y - unitY - unitX / widthFactor);
                }

                c.stroke();
            };
        }
    }
    mxMarker.addMarker('openAsync', createOpenAsyncArrow(2));

    function arrow(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
    {
        // The angle of the forward facing arrow sides against the x axis is 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 
        // (/ 2 allows for only half the strokewidth is processed ).
        var endOffsetX = unitX * sw * 1.118;
        var endOffsetY = unitY * sw * 1.118;

        unitX = unitX * (size + sw);
        unitY = unitY * (size + sw);

        var pt = pe.clone();
        pt.x -= endOffsetX;
        pt.y -= endOffsetY;

        var f = (type != mxConstants.ARROW_CLASSIC && type != mxConstants.ARROW_CLASSIC_THIN) ? 1 : 3 / 4;
        pe.x += -unitX * f - endOffsetX;
        pe.y += -unitY * f - endOffsetY;

        return function ()
        {
            canvas.begin();
            canvas.moveTo(pt.x, pt.y);
            canvas.lineTo(pt.x - unitX - unitY / widthFactor, pt.y - unitY + unitX / widthFactor);

            if (type == mxConstants.ARROW_CLASSIC || type == mxConstants.ARROW_CLASSIC_THIN)
            {
                canvas.lineTo(pt.x - unitX * 3 / 4, pt.y - unitY * 3 / 4);
            }

            canvas.lineTo(pt.x + unitY / widthFactor - unitX, pt.y - unitY - unitX / widthFactor);
            canvas.close();

            if (filled)
            {
                canvas.fillAndStroke();
            }
            else
            {
                canvas.stroke();
            }
        };
    }

    // Handlers are only added if mxVertexHandler is defined (ie. not in embedded graph)
    if (typeof mxVertexHandler !== 'undefined')
    {
        function createHandle(state, keys, getPositionFn, setPositionFn, ignoreGrid, redrawEdges)
        {
            var handle = new mxHandle(state, null, mxVertexHandler.prototype.secondaryHandleImage);

            handle.execute = function ()
            {
                for (var i = 0; i < keys.length; i++)
                {
                    this.copyStyle(keys[i]);
                }
            };

            handle.getPosition = getPositionFn;
            handle.setPosition = setPositionFn;
            handle.ignoreGrid = (ignoreGrid != null) ? ignoreGrid : true;

            // Overridden to update connected edges
            if (redrawEdges)
            {
                var positionChanged = handle.positionChanged;
                handle.positionChanged = function ()
                {
                    positionChanged.apply(this, arguments);

                    // Redraws connected edges TODO: Include child edges
                    state.view.invalidate(this.state.cell);
                    state.view.validate();
                };
            }

            return handle;
        }
        function createArcHandle(state, yOffset)
        {
            return createHandle(state, [mxConstants.STYLE_ARCSIZE], function (bounds)
            {
                var tmp = (yOffset != null) ? yOffset : bounds.height / 8;
                if (mxUtils.getValue(state.style, mxConstants.STYLE_ABSOLUTE_ARCSIZE, 0) == '1')
                {
                    var arcSize = mxUtils.getValue(state.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE) / 2;
                    return new mxPoint(bounds.x + bounds.width - Math.min(bounds.width / 2, arcSize), bounds.y + tmp);
                }
                else
                {
                    var arcSize = Math.max(0, parseFloat(mxUtils.getValue(state.style,
                        mxConstants.STYLE_ARCSIZE, mxConstants.RECTANGLE_ROUNDING_FACTOR * 100))) / 100;
                    return new mxPoint(bounds.x + bounds.width - Math.min(Math.max(bounds.width / 2, bounds.height / 2),
                        Math.min(bounds.width, bounds.height) * arcSize), bounds.y + tmp);
                }
            }, function (bounds, pt, me)
                {
                    if (mxUtils.getValue(state.style, mxConstants.STYLE_ABSOLUTE_ARCSIZE, 0) == '1')
                    {
                        this.state.style[mxConstants.STYLE_ARCSIZE] = Math.round(Math.max(0, Math.min(bounds.width, (bounds.x + bounds.width - pt.x) * 2)));
                    }
                    else
                    {
                        var f = Math.min(50, Math.max(0, (bounds.width - pt.x + bounds.x) * 100 / Math.min(bounds.width, bounds.height)));
                        this.state.style[mxConstants.STYLE_ARCSIZE] = Math.round(f);
                    }
                });
        }
        function createArcHandleFunction()
        {
            return function (state)
            {
                var handles = [];

                if (mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED, false))
                {
                    handles.push(createArcHandle(state));
                }

                return handles;
            };
        }
        function createParallelogramHandleFunction()
        {
            var max = 1;
            return function (state)
            {
                var handles = [createHandle(state, ['size'], function (bounds)
                {
                    var size = Math.max(0, Math.min(max, parseFloat(mxUtils.getValue(this.state.style, 'size', TrapezoidShape.prototype.size))));

                    return new mxPoint(bounds.x + size * bounds.width * 0.75, bounds.y + bounds.height / 4);
                }, function (bounds, pt)
                    {
                        this.state.style['size'] = Math.max(0, Math.min(max, (pt.x - bounds.x) / (bounds.width * 0.75)));
                    }, null, true)];

                if (mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED, false))
                {
                    handles.push(createArcHandle(state));
                }

                return handles;
            };
        }
        function createTrapezoidHandleFunction()
        {
            var max = 0.5;
            return function (state)
            {
                var handles = [createHandle(state, ['size'], function (bounds)
                {
                    var size = Math.max(0, Math.min(max, parseFloat(mxUtils.getValue(this.state.style, 'size', TrapezoidShape.prototype.size))));

                    return new mxPoint(bounds.x + size * bounds.width * 0.75, bounds.y + bounds.height / 4);
                }, function (bounds, pt)
                    {
                        this.state.style['size'] = Math.max(0, Math.min(max, (pt.x - bounds.x) / (bounds.width * 0.75)));
                    }, null, true)];

                if (mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED, false))
                {
                    handles.push(createArcHandle(state));
                }

                return handles;
            };
        }
        function createCubeHandleFunction(factor, defaultValue, allowArcHandle)
        {
            var factor = 1;
            var defaultValue = CubeShape.prototype.size;
            var allowArcHandle = false;

            return function (state)
            {
                var handles = [createHandle(state, ['size'], function (bounds)
                {
                    var size = Math.max(0, Math.min(bounds.width, Math.min(bounds.height, parseFloat(
                        mxUtils.getValue(this.state.style, 'size', defaultValue))))) * factor;

                    return new mxPoint(bounds.x + size, bounds.y + size);
                }, function (bounds, pt)
                    {
                        this.state.style['size'] = Math.round(Math.max(0, Math.min(Math.min(bounds.width, pt.x - bounds.x),
                            Math.min(bounds.height, pt.y - bounds.y))) / factor);
                    })];

                if (allowArcHandle && mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED, false))
                {
                    handles.push(createArcHandle(state));
                }

                return handles;
            };
        }
        function createArrowHandleFunction(maxSize)
        {
            return function (state)
            {
                return [createHandle(state, ['arrowWidth', 'arrowSize'], function (bounds)
                {
                    var aw = Math.max(0, Math.min(1, mxUtils.getValue(this.state.style, 'arrowWidth', SingleArrowShape.prototype.arrowWidth)));
                    var as = Math.max(0, Math.min(maxSize, mxUtils.getValue(this.state.style, 'arrowSize', SingleArrowShape.prototype.arrowSize)));

                    return new mxPoint(bounds.x + (1 - as) * bounds.width, bounds.y + (1 - aw) * bounds.height / 2);
                }, function (bounds, pt)
                    {
                        this.state.style['arrowWidth'] = Math.max(0, Math.min(1, Math.abs(bounds.y + bounds.height / 2 - pt.y) / bounds.height * 2));
                        this.state.style['arrowSize'] = Math.max(0, Math.min(maxSize, (bounds.x + bounds.width - pt.x) / (bounds.width)));
                    })];
            };
        }
        function createEdgeHandle(state, keys, start, getPosition, setPosition)
        {
            return createHandle(state, keys, function (bounds)
            {
                var pts = state.absolutePoints;
                var n = pts.length - 1;

                var tr = state.view.translate;
                var s = state.view.scale;

                var p0 = (start) ? pts[0] : pts[n];
                var p1 = (start) ? pts[1] : pts[n - 1];
                var dx = (start) ? p1.x - p0.x : p1.x - p0.x;
                var dy = (start) ? p1.y - p0.y : p1.y - p0.y;

                var dist = Math.sqrt(dx * dx + dy * dy);

                var pt = getPosition.call(this, dist, dx / dist, dy / dist, p0, p1);

                return new mxPoint(pt.x / s - tr.x, pt.y / s - tr.y);
            }, function (bounds, pt, me)
                {
                    var pts = state.absolutePoints;
                    var n = pts.length - 1;

                    var tr = state.view.translate;
                    var s = state.view.scale;

                    var p0 = (start) ? pts[0] : pts[n];
                    var p1 = (start) ? pts[1] : pts[n - 1];
                    var dx = (start) ? p1.x - p0.x : p1.x - p0.x;
                    var dy = (start) ? p1.y - p0.y : p1.y - p0.y;

                    var dist = Math.sqrt(dx * dx + dy * dy);
                    pt.x = (pt.x + tr.x) * s;
                    pt.y = (pt.y + tr.y) * s;

                    setPosition.call(this, dist, dx / dist, dy / dist, p0, p1, pt, me);
                });
        }
        function createEdgeWidthHandle(state, start, spacing)
        {
            return createEdgeHandle(state, ['width'], start, function (dist, nx, ny, p0, p1)
            {
                var w = state.shape.getEdgeWidth() * state.view.scale + spacing;
                return new mxPoint(p0.x + nx * dist / 4 + ny * w / 2, p0.y + ny * dist / 4 - nx * w / 2);
            }, function (dist, nx, ny, p0, p1, pt)
                {
                    var w = Math.sqrt(mxUtils.ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
                    state.style['width'] = Math.round(w * 2) / state.view.scale - spacing;
                });
        }

        var handleFactory = {
            'link': function (state)
            {
                var spacing = 10;
                return [createEdgeWidthHandle(state, true, spacing), createEdgeWidthHandle(state, false, spacing)];
            },
            'flexArrow': function (state)
            {
                // Do not use state.shape.startSize/endSize since it is cached
                var tol = state.view.graph.gridSize / state.view.scale;
                var handles = [];

                if (mxUtils.getValue(state.style, mxConstants.STYLE_STARTARROW, mxConstants.NONE) != mxConstants.NONE)
                {
                    handles.push(createEdgeHandle(state, ['width', mxConstants.STYLE_STARTSIZE, mxConstants.STYLE_ENDSIZE], true, function (dist, nx, ny, p0, p1)
                    {
                        var w = (state.shape.getEdgeWidth() - state.shape.strokewidth) * state.view.scale;
                        var l = mxUtils.getNumber(state.style, mxConstants.STYLE_STARTSIZE, mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;

                        return new mxPoint(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) + ny * w / 2,
                            p0.y + ny * (l + state.shape.strokewidth * state.view.scale) - nx * w / 2);
                    }, function (dist, nx, ny, p0, p1, pt, me)
                        {
                            var w = Math.sqrt(mxUtils.ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
                            var l = mxUtils.ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);

                            state.style[mxConstants.STYLE_STARTSIZE] = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
                            state.style['width'] = Math.round(w * 2) / state.view.scale;

                            // Applies to opposite side
                            if (mxEvent.isControlDown(me.getEvent()))
                            {
                                state.style[mxConstants.STYLE_ENDSIZE] = state.style[mxConstants.STYLE_STARTSIZE];
                            }

                            // Snaps to end geometry
                            if (!mxEvent.isAltDown(me.getEvent()))
                            {
                                if (Math.abs(parseFloat(state.style[mxConstants.STYLE_STARTSIZE]) - parseFloat(state.style[mxConstants.STYLE_ENDSIZE])) < tol / 6)
                                {
                                    state.style[mxConstants.STYLE_STARTSIZE] = state.style[mxConstants.STYLE_ENDSIZE];
                                }
                            }
                        }));
                    handles.push(createEdgeHandle(state, ['startWidth', 'endWidth', mxConstants.STYLE_STARTSIZE, mxConstants.STYLE_ENDSIZE], true, function (dist, nx, ny, p0, p1)
                    {
                        var w = (state.shape.getStartArrowWidth() - state.shape.strokewidth) * state.view.scale;
                        var l = mxUtils.getNumber(state.style, mxConstants.STYLE_STARTSIZE, mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;

                        return new mxPoint(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) + ny * w / 2,
                            p0.y + ny * (l + state.shape.strokewidth * state.view.scale) - nx * w / 2);
                    }, function (dist, nx, ny, p0, p1, pt, me)
                        {
                            var w = Math.sqrt(mxUtils.ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
                            var l = mxUtils.ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);

                            state.style[mxConstants.STYLE_STARTSIZE] = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
                            state.style['startWidth'] = Math.max(0, Math.round(w * 2) - state.shape.getEdgeWidth()) / state.view.scale;

                            // Applies to opposite side
                            if (mxEvent.isControlDown(me.getEvent()))
                            {
                                state.style[mxConstants.STYLE_ENDSIZE] = state.style[mxConstants.STYLE_STARTSIZE];
                                state.style['endWidth'] = state.style['startWidth'];
                            }

                            // Snaps to endWidth
                            if (!mxEvent.isAltDown(me.getEvent()))
                            {
                                if (Math.abs(parseFloat(state.style[mxConstants.STYLE_STARTSIZE]) - parseFloat(state.style[mxConstants.STYLE_ENDSIZE])) < tol / 6)
                                {
                                    state.style[mxConstants.STYLE_STARTSIZE] = state.style[mxConstants.STYLE_ENDSIZE];
                                }

                                if (Math.abs(parseFloat(state.style['startWidth']) - parseFloat(state.style['endWidth'])) < tol)
                                {
                                    state.style['startWidth'] = state.style['endWidth'];
                                }
                            }
                        }));
                }

                if (mxUtils.getValue(state.style, mxConstants.STYLE_ENDARROW, mxConstants.NONE) != mxConstants.NONE)
                {
                    handles.push(createEdgeHandle(state, ['width', mxConstants.STYLE_STARTSIZE, mxConstants.STYLE_ENDSIZE], false, function (dist, nx, ny, p0, p1)
                    {
                        var w = (state.shape.getEdgeWidth() - state.shape.strokewidth) * state.view.scale;
                        var l = mxUtils.getNumber(state.style, mxConstants.STYLE_ENDSIZE, mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;

                        return new mxPoint(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) - ny * w / 2,
                            p0.y + ny * (l + state.shape.strokewidth * state.view.scale) + nx * w / 2);
                    }, function (dist, nx, ny, p0, p1, pt, me)
                        {
                            var w = Math.sqrt(mxUtils.ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
                            var l = mxUtils.ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);

                            state.style[mxConstants.STYLE_ENDSIZE] = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
                            state.style['width'] = Math.round(w * 2) / state.view.scale;

                            // Applies to opposite side
                            if (mxEvent.isControlDown(me.getEvent()))
                            {
                                state.style[mxConstants.STYLE_STARTSIZE] = state.style[mxConstants.STYLE_ENDSIZE];
                            }

                            // Snaps to start geometry
                            if (!mxEvent.isAltDown(me.getEvent()))
                            {
                                if (Math.abs(parseFloat(state.style[mxConstants.STYLE_ENDSIZE]) - parseFloat(state.style[mxConstants.STYLE_STARTSIZE])) < tol / 6)
                                {
                                    state.style[mxConstants.STYLE_ENDSIZE] = state.style[mxConstants.STYLE_STARTSIZE];
                                }
                            }
                        }));
                    handles.push(createEdgeHandle(state, ['startWidth', 'endWidth', mxConstants.STYLE_STARTSIZE, mxConstants.STYLE_ENDSIZE], false, function (dist, nx, ny, p0, p1)
                    {
                        var w = (state.shape.getEndArrowWidth() - state.shape.strokewidth) * state.view.scale;
                        var l = mxUtils.getNumber(state.style, mxConstants.STYLE_ENDSIZE, mxConstants.ARROW_SIZE / 5) * 3 * state.view.scale;

                        return new mxPoint(p0.x + nx * (l + state.shape.strokewidth * state.view.scale) - ny * w / 2,
                            p0.y + ny * (l + state.shape.strokewidth * state.view.scale) + nx * w / 2);
                    }, function (dist, nx, ny, p0, p1, pt, me)
                        {
                            var w = Math.sqrt(mxUtils.ptSegDistSq(p0.x, p0.y, p1.x, p1.y, pt.x, pt.y));
                            var l = mxUtils.ptLineDist(p0.x, p0.y, p0.x + ny, p0.y - nx, pt.x, pt.y);

                            state.style[mxConstants.STYLE_ENDSIZE] = Math.round((l - state.shape.strokewidth) * 100 / 3) / 100 / state.view.scale;
                            state.style['endWidth'] = Math.max(0, Math.round(w * 2) - state.shape.getEdgeWidth()) / state.view.scale;

                            // Applies to opposite side
                            if (mxEvent.isControlDown(me.getEvent()))
                            {
                                state.style[mxConstants.STYLE_STARTSIZE] = state.style[mxConstants.STYLE_ENDSIZE];
                                state.style['startWidth'] = state.style['endWidth'];
                            }

                            // Snaps to start geometry
                            if (!mxEvent.isAltDown(me.getEvent()))
                            {
                                if (Math.abs(parseFloat(state.style[mxConstants.STYLE_ENDSIZE]) - parseFloat(state.style[mxConstants.STYLE_STARTSIZE])) < tol / 6)
                                {
                                    state.style[mxConstants.STYLE_ENDSIZE] = state.style[mxConstants.STYLE_STARTSIZE];
                                }

                                if (Math.abs(parseFloat(state.style['endWidth']) - parseFloat(state.style['startWidth'])) < tol)
                                {
                                    state.style['endWidth'] = state.style['startWidth'];
                                }
                            }
                        }));
                }

                return handles;
            },
            'swimlane': function (state)
            {
                var handles = [createHandle(state, [mxConstants.STYLE_STARTSIZE], function (bounds)
                {
                    var size = parseFloat(mxUtils.getValue(state.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));

                    if (mxUtils.getValue(state.style, mxConstants.STYLE_HORIZONTAL, 1) == 1)
                    {
                        return new mxPoint(bounds.getCenterX(), bounds.y + Math.max(0, Math.min(bounds.height, size)));
                    }
                    else
                    {
                        return new mxPoint(bounds.x + Math.max(0, Math.min(bounds.width, size)), bounds.getCenterY());
                    }
                }, function (bounds, pt)
                    {
                        state.style[mxConstants.STYLE_STARTSIZE] =
                            (mxUtils.getValue(this.state.style, mxConstants.STYLE_HORIZONTAL, 1) == 1) ?
                                Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y))) :
                                Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x)));
                    })];

                if (mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED))
                {
                    var size = parseFloat(mxUtils.getValue(state.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));
                    handles.push(createArcHandle(state, size / 2));
                }

                return handles;
            },
            'table': function (state)
            {
                var handles = [createHandle(state, [mxConstants.STYLE_STARTSIZE], function (bounds)
                {
                    var size = parseFloat(mxUtils.getValue(state.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));

                    if (mxUtils.getValue(state.style, mxConstants.STYLE_HORIZONTAL, 1) == 1)
                    {
                        return new mxPoint(bounds.getCenterX(), bounds.y + Math.max(0, Math.min(bounds.height, size)));
                    }
                    else
                    {
                        return new mxPoint(bounds.x + Math.max(0, Math.min(bounds.width, size)), bounds.getCenterY());
                    }
                }, function (bounds, pt)
                    {
                        state.style[mxConstants.STYLE_STARTSIZE] =
                            (mxUtils.getValue(this.state.style, mxConstants.STYLE_HORIZONTAL, 1) == 1) ?
                                Math.round(Math.max(0, Math.min(bounds.height, pt.y - bounds.y))) :
                                Math.round(Math.max(0, Math.min(bounds.width, pt.x - bounds.x)));
                    })];

                if (mxUtils.getValue(state.style, mxConstants.STYLE_ROUNDED))
                {
                    var size = parseFloat(mxUtils.getValue(state.style, mxConstants.STYLE_STARTSIZE, mxConstants.DEFAULT_STARTSIZE));
                    handles.push(createArcHandle(state, size / 2));
                }

                return handles;
            },
            'label': createArcHandleFunction(),
            'rectangle': createArcHandleFunction(),
            'triangle': createArcHandleFunction(),
            'rhombus': createArcHandleFunction(),
            'singleArrow': createArrowHandleFunction(1),
            'doubleArrow': createArrowHandleFunction(0.5),
            'cube': createCubeHandleFunction(),
            'trapezoid': createTrapezoidHandleFunction(), 
            'parallelogram': createParallelogramHandleFunction()
        };

        // Exposes custom handles
        Graph.createHandle  = createHandle;
        Graph.handleFactory = handleFactory;

        mxVertexHandler.prototype.createCustomHandles = function ()
        {
            // Not rotatable means locked
            if (this.state.view.graph.getSelectionCount() == 1)
            {
                //if (this.graph.isCellRotatable(this.state.cell))
                // LATER: Make locked state independent of rotatable flag, fix toggle if default is false
                //if (this.graph.isCellResizable(this.state.cell) || this.graph.isCellMovable(this.state.cell))
                {
                    var name = this.state.style['shape'];
                    if (mxCellRenderer.defaultShapes[name] == null)
                        name = mxConstants.SHAPE_RECTANGLE;

                    var fn = handleFactory[name];
                    if (fn == null && this.state.shape != null && this.state.shape.isRoundable())
                        fn = handleFactory[mxConstants.SHAPE_RECTANGLE];

                    if (fn != null)
                        return fn(this.state);
                }
            }

            return null;
        };
        mxEdgeHandler.prototype.createCustomHandles = function ()
        {
            if (this.state.view.graph.getSelectionCount() == 1)
            {
                var name = this.state.style['shape'];
                if (mxCellRenderer.defaultShapes[name] == null)
                    name = mxConstants.SHAPE_CONNECTOR;

                var fn = handleFactory[name];
                if (fn != null)
                    return fn(this.state);
            }

            return null;
        };
    }

    mxEdgeStyle.IsometricConnector = function (state, source, target, points, result)
    {
        var isoHVector = new mxPoint(1, 0);
        var alpha1 = mxUtils.toRadians(-30);
        isoHVector = mxUtils.getRotatedPoint(isoHVector, Math.cos(alpha1), Math.sin(alpha1));

        var isoVVector = new mxPoint(1, 0);
        var alpha2 = mxUtils.toRadians(-150);
        isoVVector = mxUtils.getRotatedPoint(isoVVector, Math.cos(alpha2), Math.sin(alpha2));

        var view = state.view;
        var pt = (points != null && points.length > 0) ? points[0] : null;
        var pts = state.absolutePoints;
        var p0 = pts[0];
        var pe = pts[pts.length - 1];

        if (pt != null)
            pt = view.transformControlPoint(state, pt);

        if (p0 == null)
        {
            if (source != null)
                p0 = new mxPoint(source.getCenterX(), source.getCenterY());
        }

        if (pe == null)
        {
            if (target != null)
                pe = new mxPoint(target.getCenterX(), target.getCenterY());
        }

        var a1 = isoHVector.x;
        var a2 = isoHVector.y;

        var b1 = isoVVector.x;
        var b2 = isoVVector.y;

        var elbow = mxUtils.getValue(state.style, 'elbow', 'horizontal') == 'horizontal';

        if (pe != null && p0 != null)
        {
            var last = p0;
            function isoLineTo(x, y, ignoreFirst)
            {
                var c1 = x - last.x;
                var c2 = y - last.y;

                // Solves for isometric base vectors
                var h = (b2 * c1 - b1 * c2) / (a1 * b2 - a2 * b1);
                var v = (a2 * c1 - a1 * c2) / (a2 * b1 - a1 * b2);

                if (elbow)
                {
                    if (ignoreFirst)
                    {
                        last = new mxPoint(last.x + a1 * h, last.y + a2 * h);
                        result.push(last);
                    }

                    last = new mxPoint(last.x + b1 * v, last.y + b2 * v);
                    result.push(last);
                }
                else
                {
                    if (ignoreFirst)
                    {
                        last = new mxPoint(last.x + b1 * v, last.y + b2 * v);
                        result.push(last);
                    }

                    last = new mxPoint(last.x + a1 * h, last.y + a2 * h);
                    result.push(last);
                }
            }

            if (pt == null)
                pt = new mxPoint(p0.x + (pe.x - p0.x) / 2, p0.y + (pe.y - p0.y) / 2);

            isoLineTo(pt.x, pt.y, true);
            isoLineTo(pe.x, pe.y, false);
        }
    };
    mxStyleRegistry.putValue(mxConstants.EDGESTYLE_ISOMETRIC, mxEdgeStyle.IsometricConnector);

    var graphCreateEdgeHandler = Graph.prototype.createEdgeHandler;
    Graph.prototype.createEdgeHandler = function (state, edgeStyle)
    {
        if (edgeStyle == mxEdgeStyle.IsometricConnector)
        {
            var handler = new mxElbowEdgeHandler(state);
            handler.snapToTerminals = false;
            return handler;
        }
        return graphCreateEdgeHandler.apply(this, arguments);
    };

    // Defines connection points for all shapes
    mxRectangleShape.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0.5, 0), true, 'N'),
                                              new mxConnectionConstraint(new mxPoint(0, 0.5), true, 'W'),
                                              new mxConnectionConstraint(new mxPoint(1, 0.5), true, 'E'),
                                              new mxConnectionConstraint(new mxPoint(0.5, 1), true, 'S')];
    mxEllipse.prototype.constraints       = mxRectangleShape.prototype.constraints;
    mxLabel.prototype.constraints         = mxRectangleShape.prototype.constraints;
    mxImageShape.prototype.constraints    = mxRectangleShape.prototype.constraints;
    mxSwimlane.prototype.constraints      = mxRectangleShape.prototype.constraints;
    mxDoubleEllipse.prototype.constraints = mxRectangleShape.prototype.constraints;
    mxRhombus.prototype.constraints       = mxRectangleShape.prototype.constraints;

    mxTriangle.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0, 0.5), true),
                                        new mxConnectionConstraint(new mxPoint(0.5, 0), true),
                                        new mxConnectionConstraint(new mxPoint(0.5, 1), true),
                                        new mxConnectionConstraint(new mxPoint(1, 0.5), true)];
    mxHexagon.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0.375, 0), true),
                                        new mxConnectionConstraint(new mxPoint(0.5, 0), true),
                                        new mxConnectionConstraint(new mxPoint(0.625, 0), true),
                                        new mxConnectionConstraint(new mxPoint(0, 0.25), true),
                                        new mxConnectionConstraint(new mxPoint(0, 0.5), true),
                                        new mxConnectionConstraint(new mxPoint(0, 0.75), true),
                                        new mxConnectionConstraint(new mxPoint(1, 0.25), true),
                                        new mxConnectionConstraint(new mxPoint(1, 0.5), true),
                                        new mxConnectionConstraint(new mxPoint(1, 0.75), true),
                                        new mxConnectionConstraint(new mxPoint(0.375, 1), true),
                                        new mxConnectionConstraint(new mxPoint(0.5, 1), true),
                                        new mxConnectionConstraint(new mxPoint(0.625, 1), true)];
    mxCloud.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0.25, 0.25), false),
                                    new mxConnectionConstraint(new mxPoint(0.4, 0.1), false),
                                    new mxConnectionConstraint(new mxPoint(0.16, 0.55), false),
                                    new mxConnectionConstraint(new mxPoint(0.07, 0.4), false),
                                    new mxConnectionConstraint(new mxPoint(0.31, 0.8), false),
                                    new mxConnectionConstraint(new mxPoint(0.13, 0.77), false),
                                    new mxConnectionConstraint(new mxPoint(0.8, 0.8), false),
                                    new mxConnectionConstraint(new mxPoint(0.55, 0.95), false),
                                    new mxConnectionConstraint(new mxPoint(0.875, 0.5), false),
                                    new mxConnectionConstraint(new mxPoint(0.96, 0.7), false),
                                    new mxConnectionConstraint(new mxPoint(0.625, 0.2), false),
                                    new mxConnectionConstraint(new mxPoint(0.88, 0.25), false)];
    mxCylinder.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0.5, 0), true),
                                        new mxConnectionConstraint(new mxPoint(0, 0.5), true),
                                        new mxConnectionConstraint(new mxPoint(1, 0.5), true),
                                        new mxConnectionConstraint(new mxPoint(0.5, 1), true)];
    mxActor.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0.5, 0), true),
                                     new mxConnectionConstraint(new mxPoint(0.25, 0.2), false),
                                     new mxConnectionConstraint(new mxPoint(0.1, 0.5), false),
                                     new mxConnectionConstraint(new mxPoint(0, 0.75), true),
                                     new mxConnectionConstraint(new mxPoint(0.75, 0.25), false),
                                     new mxConnectionConstraint(new mxPoint(0.9, 0.5), false),
                                     new mxConnectionConstraint(new mxPoint(1, 0.75), true),
                                     new mxConnectionConstraint(new mxPoint(0.25, 1), true),
                                     new mxConnectionConstraint(new mxPoint(0.5, 1), true),
                                     new mxConnectionConstraint(new mxPoint(0.75, 1), true)];
    mxLine.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0, 0.5), false),
                                    new mxConnectionConstraint(new mxPoint(0.25, 0.5), false),
                                    new mxConnectionConstraint(new mxPoint(0.75, 0.5), false),
                                    new mxConnectionConstraint(new mxPoint(1, 0.5), false)];

    mxArrow.prototype.constraints = null;

    TrapezoidShape.prototype.constraints     = mxRectangleShape.prototype.constraints;
    ParallelogramShape.prototype.constraints = mxRectangleShape.prototype.constraints;

    CubeShape.prototype.getConstraints = function (style, w, h)
    {
        var constr = [];
        var s = Math.max(0, Math.min(w, Math.min(h, parseFloat(mxUtils.getValue(this.style, 'size', this.size)))));

        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, (w - s) * 0.5, 0));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w - s, 0));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w - s * 0.5, s * 0.5));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w, s));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w, (h + s) * 0.5));
        constr.push(new mxConnectionConstraint(new mxPoint(1, 1), false));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, (w + s) * 0.5, h));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, s, h));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, s * 0.5, h - s * 0.5));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, 0, h - s));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, 0, (h - s) * 0.5));

        return (constr);
    };
    SingleArrowShape.prototype.getConstraints = function (style, w, h)
    {
        var constr = [];
        var aw = h * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowWidth', this.arrowWidth))));
        var as = w * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowSize', this.arrowSize))));
        var at = (h - aw) / 2;
        var ab = at + aw;

        constr.push(new mxConnectionConstraint(new mxPoint(0, 0.5), false));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, 0, at));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, (w - as) * 0.5, at));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w - as, 0));
        constr.push(new mxConnectionConstraint(new mxPoint(1, 0.5), false));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w - as, h));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, (w - as) * 0.5, h - at));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, 0, h - at));

        return (constr);
    };
    DoubleArrowShape.prototype.getConstraints = function (style, w, h)
    {
        var constr = [];
        var aw = h * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowWidth', SingleArrowShape.prototype.arrowWidth))));
        var as = w * Math.max(0, Math.min(1, parseFloat(mxUtils.getValue(this.style, 'arrowSize', SingleArrowShape.prototype.arrowSize))));
        var at = (h - aw) / 2;
        var ab = at + aw;

        constr.push(new mxConnectionConstraint(new mxPoint(0, 0.5), false));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, as, 0));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w * 0.5, at));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w - as, 0));
        constr.push(new mxConnectionConstraint(new mxPoint(1, 0.5), false));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w - as, h));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, w * 0.5, h - at));
        constr.push(new mxConnectionConstraint(new mxPoint(0, 0), false, null, as, h));

        return (constr);
    };
})();