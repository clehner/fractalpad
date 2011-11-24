// globals: rectInView & rectContainsView.
// todo: encapsulate them better.

function Cell(vertical, parent) {
	this.vertical = vertical;
	this.parent = parent;
}
Cell.prototype = {
	vertical: null,
	parent: null,
	_childCells: null,

	getChildCells: function () {
		return this._childCells || (this._childCells = [
			new Cell(!this.vertical, this),
			new Cell(!this.vertical, this)
		]);
	},

	// check what parts of the cell are in view
	getViewSituation: function (coords) {
		var x = coords[0];
		var y = coords[1];
		var s = coords[2];

		var firstInView = this.vertical ?
			rectInView(x, y - s/2, s, s/2):
			rectInView(x - s/2, y, s/2, s);
		var secondInView = this.vertical ?
			rectInView(x, y + s, s, s/2):
			rectInView(x + s, y, s/2, s);
		var middleInView = rectInView(x, y, s, s);
		var fullyInView = firstInView && secondInView && middleInView;

		return {
			all: fullyInView,
			first: firstInView,
			second: secondInView,
			middle: middleInView
		};
	},

	containsView: function (x, y, s) {
		return this.vertical ?
			rectContainsView(x, y - s/2, s, 2*s):
			rectContainsView(x - s/2, y, 2*s, s);
	},

	// get the position and size of the parent cell relative to this one
	// (inverse of getChildCoords)
	getParentCoords: function (x, y, s) {
		if (!this.parent) throw new Error("This cell has no parent.");
		var first = (this == this.parent._childCells[0]);
		var s2 = 2*s;
		return this.parent.vertical ?
			(first ?
				[x - s/2, y + s, s2]:
				[x - s/2, y - s2, s2]):
			(first ?
				[x + s, y - s/2, s2]:
				[x - s2, y - s/2, s2]);
	},

	getChildCoords: function (childNum, x, y, s) {
		var first = (childNum == 0);
		var s2 = s/2;
		return this.vertical ?
			(first ?
				[x + s/4, y - s2, s2]:
				[x + s/4, y + s, s2]):
			(first ?
				[x - s2, y + s/4, s2]:
				[x + s, y + s/4, s2]);
	},

	// Given a point relative to the cell, return the cell it is in, the
	// coords relative to that cell, and the depth/size of that cell relative
	// to this one.
	getCoordsInDescendents: function (x, y, d) {
		if (!d) d = 0;
		if (d > 25) return null;
		if (x > 0 && x < 1 && y > 0 && y < 1) {
			return [this, x, y, d];
		}
		var child = this.getChildCells();
		var coords = this.vertical ?
			(x > 0 && x < 1) ?
				(y > -.5 && y < 0) ?
					child[0].getCoordsInDescendents(2*x - .5, 2*y + 1, d + 1) :
				(y > 1 && y < 1.5) ?
					child[1].getCoordsInDescendents(2*x - .5, 2*y - 2, d + 1) :
				null :
			null :
			(y > 0 && y < 1) ?
				(x > -.5 && x < 0) ?
					child[0].getCoordsInDescendents(2*x + 1, 2*y - .5, d + 1) :
				(x > 1 && x < 1.5) ?
					child[1].getCoordsInDescendents(2*x - 2, 2*y - .5, d + 1) :
				null :
			null;

		if (!coords) {
			// out of bounds.
			// todo: recurse through parent?
			coords = [this,
				this.vertical ?
					(x > 1 ? 0 : x < 0 ? 1 : .5) :
					(x > 3/2 ? 0 : x < -1/2 ? 1 : .5),
				this.vertical ?
					(y > 3/2 ? 0 : y < -1/2 ? 1 : .5) :
					(y > 1 ? 0 : y < 0 ? 1 : .5),
				d];
		}
		return coords;
	},

	// Given a point relative to the cell and a depth for the cell,
	// return a vector weighting the zoom that should be allowed.
	getZoomFactors: function (x, y) {
		if (this.parent) {
			var first = (this == this.parent._childCells[0]);
			var sub = first ? 1 : -1;
			var vertical = this.vertical && sub;
			var horizontal = !vertical && sub;
		}
		return [vertical || (1 - 2*x), horizontal || (1 - 2*y)];
	},

	loadImage: function (ctx, x, y, s) {
		
	},

	// draw the image content of the cell
	draw: function (ctx, x, y, s, inDrawAll) {
		//ctx.fillStyle = "hsl(" + 360 * Math.random() + ", 100%, 75%)";
		//ctx.fillRect(x - .5, y - .5, s, s);
		if (this.img) {
			ctx.drawImage(this.img, x, y, s, s);
		} else {
			this.loadImage(ctx, x, y, s);
		}
		// redo border which gets covered up
		if (!inDrawAll) {
			this.drawOverlappedBorder(ctx, x, y, s);
		}
	},

	drawBorder: function (ctx, x, y, s) {
		if (s < 1) return;
		ctx.beginPath();
		if (this.vertical) {
			// above
			ctx.moveTo(x,     y - s/2);
			ctx.lineTo(x + s, y - s/2);
			// below
			ctx.moveTo(x,     y + 3*s/2);
			ctx.lineTo(x + s, y + 3*s/2);

		} else {
			// left
			ctx.moveTo(x - s/2, y);
			ctx.lineTo(x - s/2, y + s);
			// right
			ctx.moveTo(x + 3*s/2, y);
			ctx.lineTo(x + 3*s/2, y + s);
		}
		ctx.stroke();
	},

	// draw the 2 border segments that drawing this cell overlaps
	drawOverlappedBorder: function (ctx, x, y, s) {
		var q = s / 4;
		if (q < 1) return;
		ctx.beginPath();
		if (this.vertical) {
			ctx.moveTo(x, y);
			ctx.lineTo(x + q, y);
			ctx.moveTo(x + s - q, y);
			ctx.lineTo(x + s, y);

		} else {
			ctx.moveTo(x, y);
			ctx.lineTo(x, y + q);
			ctx.moveTo(x, y + s - q);
			ctx.lineTo(x, y + s);
		}
		ctx.stroke();
	},

	// this should be called for the base cell only
	drawOuterBorder: function (ctx, x, y, s) {
		ctx.beginPath();
		ctx.moveTo(x, y);
		if (this.vertical) {
			ctx.lineTo(x, y + s);
			ctx.moveTo(x + s, y);
		} else {
			ctx.lineTo(x + s, y);
			ctx.moveTo(x, y + s);
		}
		ctx.lineTo(x + s, y + s);
		ctx.stroke();
	},

	// Draw the cell at a given position on the canvas, at a given size,
	// and draw it's descendents.
	drawAll: function (ctx, x, y, s, containerInView) {
		if (s < 1) return;

		// check if the 1st and 2nd children need to be drawn
		var firstInView = containerInView ||
			(this.vertical ?
				rectInView(x, y - s/2, s, s/2):
				rectInView(x - s/2, y, s/2, s));
		var secondInView = containerInView ||
			(this.vertical ?
				rectInView(x, y + s, s, s/2):
				rectInView(x + s, y, s/2, s));
		var middleInView = containerInView ||
			rectInView(x, y, s, s);
		var fullyInView = containerInView ||
			(firstInView && secondInView && middleInView);

		// draw image content if its square is in view
		if (middleInView) {
			this.draw(ctx, x, y, s);
		}

		if (s >= 2) {
			// draw the child cells
			var children = this.getChildCells();
			if (this.vertical) {
				if (firstInView) {
					children[0].drawAll(ctx,
						x + s/4, y - s/2, s/2, fullyInView);
				}
				if (secondInView) {
					children[1].drawAll(ctx,
						x + s/4, y + s, s/2, fullyInView);
				}

			} else {
				if (firstInView) {
					children[0].drawAll(ctx,
						x - s/2, y + s/4, s/2, fullyInView);
				}
				if (secondInView) {
					children[1].drawAll(ctx,
						x + s, y + s/4, s/2, fullyInView);
				}
			}
		}

		this.drawBorder(ctx, x, y, s);
	}
};

