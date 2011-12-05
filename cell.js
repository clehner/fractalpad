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

	intersects: function (rect) {
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

function FractalView(canvas, initialBase, viewport) {
	this.canvas = canvas;
	this.base = initialBase;
	this.setViewport(viewport || new Rect(0, 0, 0, 0));
	this.draw();

}
FractalView.prototype = {
	base: null, // FixedFractal
	viewport: Rect.prototype,
	canvas: null,
	ctx: null,
	zoomBase: null,

	setViewport: function (viewport) {
		this.viewport = viewport;
		this.canvas.width = viewport.w;
		this.canvas.height = viewport.h;
		this.ctx = this.canvas.getContext("2d");
		this.ctx.translate(0.5, 0.5);
		this.ctx.strokeStyle = "#000";
		this.draw();

		var s = Math.min(viewport.w, viewport.h) / 2;
		this.zoomBase = Math.pow(2, 1/(s * 3/4));
	},

	setBase: function (fixedFractal) {
		this.base = fixedFractal;
		this._recalculateBase();
		this.redraw();
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

	// The base cell should be the closest ancestor of all visible cells.
	_recalculateBase: function () {
		var viewport = this.viewport;
		var i = 0;

		function containsViewport(fixedFractal) {
			return fixedFractal.getOuterRect().containsRect(viewport);
		}

		function isOuterRectVisible(fixedFractal) {
			return viewport.intersects(fixedFractal.getOuterRect());
		}

		// walk up
		// If the base does not cover the viewport, make the parent base.
		// todo: make this work on the edges of the root cell
		while (this.base.hasParent() && !containsViewport(this.base)) {
			//!isOuterRectVisible(this.base)) {
			if (i++ > 100) return;
			this.base = this.base.getParent();
			//console.log('walk up');
		}

		var children = this.base.getChildren();
		var visibleChild = children.first(isOuterRectVisible);

		// If the inner rect of the base cell is not visible in the viewport,
		// then at least one of its child cells is also not visible.
		// So the visible child, if there is one, should be made the base cell.
		// Narrow down.
		while (!this.base.rect.intersects(viewport)) {
			if (visibleChild) {
				//console.log("setting base to visible child");
				if (i++ > 100) return;
				this.base = visibleChild;
			} else {
				// todo: prevent this from happening.
				//console.log('Lost!');
			}

			children = this.base.getChildren();
			visibleChild = children.first(isOuterRectVisible);
		}

		// If the child cells are not visible but the base cell is, then
		// we are zoomed completely into the base cell and it is covering the
		// viewport.
		if (!visibleChild) {
			// todo: prevent this from happening.
			console.log('Too deep.');
		}

		//debugRect2(this.base.rect);
	},

	draw: function () {
		this.base.draw(this.ctx, this.viewport);
		//this.base.fractal.drawAll(this.ctx, this.base.rect);
	},

	redraw: function () {
		var v = this.viewport;
		this.ctx.clearRect(v.x, v.y, v.w, v.h);
		this.draw();
	},

	getZoomFactor: function (point) {
		var fixedFractal = this.base.getDescendantAtPoint(point, true);
		return fixedFractal ?
			fixedFractal.getZoomFactor(point) :
			this.getOuterZoomFactor(point);
	},

	// get a zoom factor for a point outside the base fractal.
	getOuterZoomFactor: function (point) {
		var rect = this.base.getOuterRect();
		return new Point(
			point.x > (rect.x + rect.w) ? 1 : point.x < rect.x ? -1 : 0,
			point.y > (rect.y + rect.h) ? 1 : point.y < rect.y ? -1 : 0
		);
	}
};

function Fractal(parent, j) {
	if (parent instanceof Fractal) {
		this.parent = parent;
		// i is the kind of cell this is out of an array of kinds.
		// i.e. vertical or horizontal
		// j is this.parent.children.indexOf(this)
		this.i = (parent.i + 1) % this.numChildren;
		this.j = j;
		this.id = this.generateId();
	} else {
		this.id = parent.toString();
	}
}
Fractal.prototype = {
	constructor: Fractal,
	i: 0,
	j: 0,
	parent: null,
	children: null,
	childRects: [],
	numChildren: 0,
	id: "",

	generateId: (function () {
		var digits =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		return function () {
			if (!this.parent) return "";
			var s = this.parent.id.split("&");
			var b64 = s[0] || "";
			var b10 = s[1] || 0;
			b10 = (b10 << 1) + +this.j;
			if (b10 > 64) {
				b64 += digits.charAt(b10 & 63);
				b10 >>= 6;
			}
			if (b10 < 10) {
				b10 = "0" + b10;
			}
			return b64 + "&" + b10;
		};
	})(),

	getChildren: function () {
		if (this.children) return this.children;
		
		var children = [];
		for (var i = 0; i < this.numChildren; i++) {
			children.push(new this.constructor(this, i));
		}
		this.children = children;
		return children;
	},

	getParent: function () {
		return this.parent;
	},

	// get child positions relative to a given position
	getChildRects: function (myRect) {
		return this.childRects[this.i].map(function (childRect) {
			return myRect.transform(childRect);
		});
	},

	getParentRect: function (myRect) {
		if (!this.parent) return;
		var transformation = this.childRects[this.parent.i][this.j];
		return myRect.transform(transformation.inverse());
	},

	getOuterRect: function () {
		return this.rect;
	},

	draw: function (ctx, rect) {
		return false;
	},

	drawAll: function (ctx, rect, viewport, finishedContent, finishedBorder) {
		if (rect.w < 1 || rect.h < 1) return;
		if (!viewport.intersects(this.getOuterRect(rect))) return;

		if (!finishedContent) {
			finishedContent = (this.draw(ctx, rect) === false);
		}
		if (this.editing) {
			this.drawEdits();
		}
		if (!finishedBorder) {
			finishedBorder = (this.drawBorder(ctx, rect) === false);
		}

		var children = this.getChildren();
		this.getChildRects(rect).forEach(function (childRect, i) {
			children[i].drawAll(ctx, childRect,
				viewport, finishedContent, finishedBorder);
		});
	},
	
	drawBorder: function (ctx, rect) {
		ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
	},

	drawOuterBorder: function (ctx, innerRect) {
		var rect = this.getOuterRect(innerRect);
		//ctx.beginPath();
		//ctx.moveTo(rect.x, rect.y);
		ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
	},

	getZoomFactor: function (point) {
		return [0, 0];
	}
};

function SquareRectangleFractal() {
	Fractal.apply(this, arguments);
	this.vertical = this.i % 2;
}
SquareRectangleFractal.prototype = {
	constructor: SquareRectangleFractal,
	vertical: null,
	childRects: [
		[ // horizontal
			new Rect(-.5, .25, .5, .5), // left
			new Rect(1, .25, .5, .5)], // right
		[ // vertical
			new Rect(.25, -.5, .5, .5), // top
			new Rect(.25, 1, .5, .5)]], // bottom
	numChildren: 2,

	outerRects: [
		new Rect(-.5, 0, 2, 1), // horizontal
		new Rect(0, -.5, 1, 2) // vertical
	],

	getOuterRect: function (rect) {
		return rect.transform(this.outerRects[this.i]);
	},

	// Given a point relative to the cell,
	// return a vector weighting the zoom that should be allowed.
	getZoomFactor: function (point) {
		if (this.parent) {
			var sub = this.j ? -1 : 1;
			var vertical = this.vertical && sub;
			var horizontal = !vertical && sub;
		}
		return new Point(
			vertical || (1 - 2*point.x),
			horizontal || (1 - 2*point.y));
	},

	drawBorder: function (ctx, rect) {
		ctx.beginPath();
		ctx.moveTo(rect.x, rect.y);

		if (this.vertical) {
			ctx.lineTo(rect.x + rect.w / 4, rect.y);
			ctx.moveTo(rect.x + rect.w * .75, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y);

			ctx.moveTo(rect.x, rect.y + rect.h);
			ctx.lineTo(rect.x + rect.w / 4, rect.y + rect.h);
			ctx.moveTo(rect.x + rect.w * .75, rect.y + rect.h);

		} else {
			ctx.lineTo(rect.x, rect.y + rect.h / 4);
			ctx.moveTo(rect.x, rect.y + rect.h * .75);
			ctx.lineTo(rect.x, rect.y + rect.h);

			ctx.moveTo(rect.x + rect.w, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 4);
			ctx.moveTo(rect.x + rect.w, rect.y + rect.h * .75);
		}
		ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
		ctx.stroke();

		if (rect.w < 4 || rect.h < 4) return false;
	}

};
inherit(SquareRectangleFractal, Fractal);

// A fractal at a specific rect
function FixedFractal(fractal, rect) {
	this.fractal = fractal;
	this.rect = rect;
}
FixedFractal.prototype = {
	fractal: null,
	rect: null,
	
	draw: function (ctx, viewport) {
		this.fractal.drawOuterBorder(ctx, this.rect);
		this.fractal.drawAll(ctx, this.rect, viewport);
	},

	getChildren: function () {
		var childRects = this.fractal.getChildRects(this.rect);
		return this.fractal.getChildren().map(function (childFractal, i) {
			return new FixedFractal(childFractal, childRects[i]);
		});
	},

	hasParent: function () {
		// todo: change this, maybe
		return !!this.fractal.getParent();
	},

	getParent: function () {
		return new FixedFractal(
			this.fractal.getParent(),
			this.fractal.getParentRect(this.rect)
		);
	},

	getOuterRect: function () {
		return this.fractal.getOuterRect(this.rect);
	},

	/*
	pointToRelative: function (point) {
		return point.relativeToRect(this.rect);
	},
	*/

	getZoomFactor: function (point) {
		var relativePoint = point.relativeToRect(this.rect);
		return this.fractal.getZoomFactor(relativePoint);
	},

	getDescendantAtPoint: function (point, allowNull, depth) {
		// don't go too deep.
		if (!depth) depth = 0;
		if (depth > 25) return this;

		if (this.rect.containsPoint(point)) return this;

		var childWithPoint = this.getChildren().first(function (child) {
			return child.getOuterRect().containsPoint(point);
		});
		return childWithPoint ?
			childWithPoint.getDescendantAtPoint(point, allowNull, depth + 1) :
		allowNull ?
			null :
			this;
	}
};

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

