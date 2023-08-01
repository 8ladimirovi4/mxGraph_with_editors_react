function mxValueChange(model, cell, value)
{
	this.model = model;
	this.cell = cell;
	this.value = value;
	this.previous = value;
};

/**
 * Function: execute
 * 
 * Changes the value of <cell> to <previous> using
 * <mxGraphModel.valueForCellChanged>.
 */
mxValueChange.prototype.execute = function()
{
	if (this.cell != null)
	{
		this.value = this.previous;
		this.previous = this.model.valueForCellChanged(
			this.cell, this.previous);
	}
};

export default mxValueChange