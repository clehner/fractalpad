var inherit = function (constructor, superConstructor) {
	// todo: cross-platformify this
	constructor.prototype.__proto__ = superConstructor.prototype;
}

Array.prototype.first = function (test) {
	for (var i = 0; i < this.length; i++) {
		if (test(this[i])) return this[i];
	}
};

function Point(x, y) {
	this.x = x;
	this.y = y;
}
Point.prototype = {
	x: NaN,
	y: NaN,

	toString: function () {
		return "[Point " + this.x + "," + this.y + "]";
	},

	minus: function (point) {
		return new Point(point.x - this.x, point.y - this.y);
	},

	relativeToRect: function (rect) {
		return new Point(
			(this.x - rect.x) / rect.w,
			(this.y - rect.y) / rect.h);
	}
};

function Rect(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}
Rect.prototype = {
	x: NaN,
	y: NaN,
	w: NaN,
	h: NaN,

	toString: function () {
		return "[Rect x:" + this.x + " y:" + this.y
			+ " w:" + this.w + " h:" + this.h + "]";
	},

	transform: function (rect) {
		return new Rect(
			this.x + this.w * rect.x,
			this.y + this.h * rect.y,
			this.w * rect.w,
			this.h * rect.h);
	},

	inverse: function () {
		return new Rect(
			-this.x / this.w,
			-this.y / this.h,
			1/this.w,
			1/this.h);
	},

/*
	inverseTransform: function (rect) {
		return new Rect(
			this.x - rect.x,
			this.y - rect.y,
			this.w / rect.w,
			this.h / rect.h);
	},

	transform2: function (rect) {
		return new Rect(
			this.x + rect.x,
			this.y + rect.y,
			this.w * rect.w,
			this.h * rect.h);
	},
*/

	directionToPoint: function (point) {
	},

	containsPoint: function (point) {
		return point.x > this.x
			&& point.y > this.y
			&& point.x < this.x + this.w
			&& point.y < this.y + this.h;
	},

	containsRect: function (rect) {
		return this.x < rect.x
			&& this.y < rect.y
			&& this.x + this.w > rect.x + rect.w
			&& this.y + this.h > rect.y + rect.h;
	},

	intersectsRect: function (rect) {
		return rect.x < this.x + this.w
			&& rect.y < this.y + this.h
			&& this.x < rect.x + rect.w
			&& this.y < rect.y + rect.h;
	}
};

function debugRect(rect, msg) {
	var a = document.createElement("div");
	a.className = "debug-rect";
	a.style.top = rect.y + "px";
	a.style.left = rect.x + "px";
	a.style.width = rect.w + 1 + "px";
	a.style.height = rect.h + 1 + "px";
	if (msg) a.textContent = msg;
	document.body.appendChild(a);
}

var debuggerRect = document.createElement("div");
debuggerRect.className = "debug-rect2";
function debugRect2(rect, msg) {
	debuggerRect.style.top = rect.y + "px";
	debuggerRect.style.left = rect.x + "px";
	debuggerRect.style.width = rect.w + 1 + "px";
	debuggerRect.style.height = rect.h + 1 + "px";
	if (msg) debuggerRect.textContent = msg;
	if (!debuggerRect.parentNode) document.body.appendChild(debuggerRect);
}

function Fractal(rootCell, canvas, viewport) {
	if (viewport) this.viewport = viewport;
	this.canvas = canvas;
	this.rootCell = this.baseCell = rootCell;
	this.layers = [];

}
Fractal.prototype = {
	rootCell: null,
	baseCell: null,
	viewport: new Rect(0, 0, 0, 0),
	canvas: null,
	ctx: null,
	layers: null,

	setViewport: function (viewport) {
		this.canvas.width = viewport.w;
		this.canvas.height = viewport.h;
		this.viewport = viewport;
		this.ctx = this.canvas.getContext("2d");
		this.ctx.translate(0.5, 0.5);
		this.ctx.strokeStyle = "#000";
		this.draw();
	},

	setBase: function (cell) {
		if (cell.rect.w < 1 || cell.rect.h < 1) {
			throw new Error("Can't jump that far.");
		}
		this.baseCell = cell;
		this._recalculateBase();
		//this.redraw();
		//this.baseCell.updateParentPosition();
		//debugRect2(cell.rect);
	},

	setRootPosition: function (rect) {
		this.rootCell.setPosition(rect);
	},

	// Transform the cell positions by mapping the square rect(0, 0, 1, 1)
	// to a give rect.
	/*
	transformPosition: function (transform) {
		this.baseCell.setPosition(this.baseCell.rect.transform(transform));
		this._recalculateBase();
		this.redraw();
	},
	*/

	// The base cell should be the closest ancestor cell of all visible cells
	// that contains the viewport.
	_recalculateBase: function () {
		var viewport = this.viewport;

		function cellIsVisible(cell) {
			return viewport.intersectsRect(cell.rect);
		}

		function cellOrDescendantsIsVisible(cell) {
			return viewport.intersectsRect(cell.getOuterRect());
		}
		//this.baseCell.updateParentPosition();

		// If the content of the base cell is not visible in the viewport,
		// then at least one of its child cells is also not visible.
		// So the visible child, if there is one, should be made the base cell.
		while (!cellIsVisible(this.baseCell)) {
			// narrow down
			var visibleChild = this.baseCell.children.first(
				cellOrDescendantsIsVisible);
			if (visibleChild) {
				//console.log("setting base to visible child");
				//this.setBase(visibleChild);
				//debugRect2(visibleChild.rect);
				this.baseCell = visibleChild;
			} else {
				// todo: prevent this from happening.
				console.log('Lost!');
			}
		}

		// If the child cells are not visible but the base cell is, then
		// we are zoomed completely into the base cell and it is covering the
		// viewport.
		if (!this.baseCell.children.some(cellOrDescendantsIsVisible)) {
			// todo: prevent this from happening.
			console.log('Too deep.');
		}

		// The base cell's outer rectangle should cover the viewport, unless
		// it is the root cell. If it does not cover the viewport, one of its
		// ancestors that does should be made the base cell.
		// walk up
		while (this.baseCell.parent != null
			&& !this.baseCell.getOuterRect().containsRect(viewport)) {
				//debugger;
				this.baseCell.updateParentPosition();
				//this.setBase(this.baseCell.parent);
				this.baseCell = this.baseCell.parent;
				//this._recalculateBase();
				console.log('back up');
		}

		//debugRect2(this.baseCell.rect);
	},

	draw: function () {
		var self = this;
		this.layers.forEach(function (layer) {
			if (layer.drawBaseCell(self.baseCell, self.ctx) === true) {
				self.drawCells(self.baseCell, layer);
			}
		});
	},

	redraw: function () {
		var v = this.viewport;
		this.ctx.clearRect(v.x, v.y, v.w, v.h);
		this.draw();
	},

	drawCells: function (cell, layer) {
		var returned = layer.drawCell(cell, this.ctx);
		if (returned === true) {
			var self = this;
			if (!cell.children) return;
			cell.children.forEach(function (childCell) {
				self.drawCells(childCell, layer);
			});
		}
	},

	getCellAtPoint: function (point) {
		if (this.baseCell.getOuterRect().containsPoint(point)) {
			return this.baseCell.getDescendantAtPoint(point, 0);
		} else {
			return null;
		}
	},

	getZoomFactor: function (point) {
		var cell = this.getCellAtPoint(point, true);
		if (cell) {
			var relativePoint = cell.pointToRelative(point);
			return cell.getZoomFactor(relativePoint);
			//debugRect2(cell.rect);
		}
		cell = this.baseCell;
		//cell = this.rootCell;
		var rect = cell.getOuterRect();
		return new Point(
			point.x > (rect.x + rect.w) ? 1 : point.x < rect.x ? -1 : 0,
			point.y > (rect.y + rect.h) ? 1 : point.y < rect.y ? -1 : 0
		);
		//return new Point(-1 + 2*Math.random(), -1 + 2*Math.random());
	}
};

function Cell(parent, j) {
	if (parent) {
		this.parent = parent;
		// i is the kind of cell this is out of an array of kinds.
		// i.e. vertical or horizontal
		// j is this.parent.children.indexOf(this)
		this.i = (parent.i + 1) % this.numMagicRects;
		this.j = j;
	}
}
Cell.prototype = {
	constructor: Cell,
	i: 0,
	j: 0,
	rect: null,
	parent: null,
	children: null,
	magicRects: [],
	numMagicRects: 0,

	getOuterRect: function () {
		return this.rect;
	},

	getChildren: function () {
		if (this.children) return this.children;
		
		var children = [];
		for (var i = 0; i < this.numMagicRects; i++) {
			children.push(new this.constructor(this, i));
		}
		this.children = children;
		return children;
	},

	// recursively update cell positions
	setPosition: function (rect) {
		//console.log(rect+"");
		this.rect = rect;
		if (rect.w < 1 || rect.h < 1) return;
		var magicRects = this.magicRects[this.i];
		var self = this;
		this.getChildren().forEach(function (childCell, j) {
			childCell.setPosition(rect.transform(magicRects[j]));
		});
	},

	updateParentPosition: function () {
		var parent = this.parent;
		if (!parent) return;
		var magicRect = this.magicRects[parent.i][this.j];
		//debugger;
		//console.log('updating parent position');
		parent.rect = this.rect.transform(magicRect.inverse());
		// todo: check this.
	},

	getZoomFactor: function (point) {
		return [0, 0];
	},

	pointToRelative: function (point) {
		return point.relativeToRect(this.rect);
	},

	getDescendantAtPoint: function (point, depth) {
		// don't go too deep.
		if (!this.children || !this.rect || depth > 25) return this;

		var cellInDescendants = this.children.first(function (cell) {
			return cell.getOuterRect().containsPoint(point);
		});
		if (cellInDescendants) {
			return cellInDescendants.getDescendantAtPoint(point, depth + 1);
		} else {
			return this;
		}
	}

	/*
	getDescendantAtPoint: function (point, depth) {
		if (!d) d = 0;
		if (d > 25) return null;
		if (x > 0 && x < 1 && y > 0 && y < 1) {
			return [this, x, y, d];
		}
		var child = this.getChildren();
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
	}
	*/
};

function SquareRectangleFractalCell() {
	Cell.apply(this, arguments);
	this.vertical = this.i % 2;
}
SquareRectangleFractalCell.prototype = {
	constructor: SquareRectangleFractalCell,
	vertical: null,
	magicRects: [
		[ // horizontal
			new Rect(-.5, .25, .5, .5), // left
			new Rect(1, .25, .5, .5)], // right
		[ // vertical
			new Rect(.25, -.5, .5, .5), // top
			new Rect(.25, 1, .5, .5)]], // bottom
	numMagicRects: 2,

	outerRects: [
		new Rect(-.5, 0, 2, 1), // horizontal
		new Rect(0, -.5, 1, 2) // vertical
	],

	getOuterRect: function () {
		return this.rect.transform(this.outerRects[this.i]);
	},

	// Given a point relative to the cell and a depth for the cell,
	// return a vector weighting the zoom that should be allowed.
	getZoomFactor: function (point) {
		if (this.parent) {
			var first = (this == this.parent.children[0]);
			var sub = first ? 1 : -1;
			var vertical = this.vertical && sub;
			var horizontal = !vertical && sub;
		}
		return new Point(
			vertical || (1 - 2*point.x),
			horizontal || (1 - 2*point.y));
	}

};
inherit(SquareRectangleFractalCell, Cell);

// a cell and a point relative to it
function CellPosition(cell, point) {
	this.cell = cell;
	this.point = point;
}

function FractalBorder(fractal) {
	// draw the border that encloses the root cell.
	function drawOuterBorder(cell, ctx) {
		var rect = cell.getOuterRect();
		ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
	}

	this.drawBaseCell = function (cell, ctx) {
		drawOuterBorder(cell, ctx);
		return true;
	}

	// recursively draw the border of the cells of a fractal.
	this.drawCell = function (cell, ctx) {
		var rect = cell.rect;

		ctx.beginPath();
		ctx.moveTo(rect.x, rect.y);
		//ctx.lineWidth = q / 32;
		
		if (cell.vertical) {
			ctx.lineTo(rect.x + rect.w / 4, rect.y);
			ctx.moveTo(rect.x + rect.w * 3/4, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y);

			ctx.moveTo(rect.x, rect.y + rect.h);
			ctx.lineTo(rect.x + rect.w / 4, rect.y + rect.h);
			ctx.moveTo(rect.x + rect.w * 3/4, rect.y + rect.h);

		} else {
			ctx.lineTo(rect.x, rect.y + rect.h / 4);
			ctx.moveTo(rect.x, rect.y + rect.h * 3/4);
			ctx.lineTo(rect.x, rect.y + rect.h);

			ctx.moveTo(rect.x + rect.w, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 4);
			ctx.moveTo(rect.x + rect.w, rect.y + rect.h * 3/4);
		}
		ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
		ctx.stroke();

		if (rect.w < 4 || rect.h < 4) return false;
		return true;
	};
}

function FractalColors() {

	// 0: left, 1: right, 2: top, 3: bottom
	function getCellDirection(cell) {
		return (!cell.vertical * 2) |
			((cell.parent && (cell == cell.parent.children[1])) * 1);
	}

	function color(hue) {
		return "hsl(" + hue + ", 100%, 75%)";
		//return "hsl(0, 0%, " + hue/3.6 + "%)";
	}

	function getParentHue(cell) {
		return cell.parent ? getCellHue(cell.parent) :
			cell.parentHue || (cell.parentHue = 360*Math.random());
	}

	function getCellHue(cell) {
		return cell.hue || (cell.hue =
			(getParentHue(cell) +
				(15 + 15 * Math.random()) *
				(Math.random() > .5 ? 1 : -1)) % 360);
	}

	this.drawCell = function (cell, ctx) {
		ctx.fillStyle = 'brown';
		var rect = cell.rect;
		//console.log(rect.toString());

		var d = getCellDirection(cell);
		var x1 = x + (d == 1) * s;
		var y1 = y + (d == 3) * s;
		var x2 = x + (d == 0) * s;
		var y2 = y + (d == 2) * s;

		var grad = ctx.createLinearGradient(x1, y1, x2, y2);
		grad.addColorStop(0, color(getCellHue(cell)));
		grad.addColorStop(1, color(getParentHue(cell)));
		ctx.fillStyle = grad;
		ctx.fillRect(rect.x - .5, rect.y - .5, rect.w + 1, rect.h + 1);
		return true;
	};
}

function MouseController(element) {
	var behavior;

	this.setBehavior = function (b) {
		behavior = b;
		element.className = behavior.className || '';
	};

	element.addEventListener("mousedown", function (e) {
		behavior && behavior.onMouseDown && behavior.onMouseDown(
			new Point(e.pageX, e.pageY));
	}, false);

	document.addEventListener("mousemove", function (e) {
		behavior && behavior.onMouseMove && behavior.onMouseMove(
			new Point(e.pageX, e.pageY));
	}, false);

	document.addEventListener("mouseup", function (e) {
		behavior && behavior.onMouseUp && behavior.onMouseUp(
			new Point(e.pageX, e.pageY));
	}, false);
}

