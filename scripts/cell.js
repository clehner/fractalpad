/*global TreeID */

if (!Function.prototype.bind) {
	Function.prototype.bind = function (context) {
		var fn = this,
			args = Array.prototype.slice.call(arguments, 1);
		return function () {
			return fn.apply(context, args.concat(args.concat.call(arguments)));
		};
	};
}

function inherit(constructor, superConstructor) {
	function C() {}
	C.prototype = superConstructor.prototype;
	var proto = new C();
	for (var key in constructor.prototype) {
		proto[key] = constructor.prototype[key];
	}
	constructor.prototype = proto;
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
	toString: function () {
		return "[Point " + this.x + "," + this.y + "]";
	},

	minus: function (point) {
		return new Point(this.x - point.x, this.y - point.y);
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
	toString: function () {
		return "[Rect x:" + this.x + " y:" + this.y +
			" w:" + this.w + " h:" + this.h + "]";
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

	//directionToPoint: function (point) {
	//},

	containsPoint: function (point) {
		return point.x > this.x &&
			point.y > this.y &&
			point.x < this.x + this.w &&
			point.y < this.y + this.h;
	},

	containsRect: function (rect) {
		return this.x <= rect.x &&
			this.y <= rect.y &&
			this.x + this.w >= rect.x + rect.w &&
			this.y + this.h >= rect.y + rect.h;
	},

	intersects: function (rect) {
		return rect.x < this.x + this.w &&
			rect.y < this.y + this.h &&
			this.x < rect.x + rect.w &&
			this.y < rect.y + rect.h;
	},

	intersect: function (rect) {
		//if (this.containsRect(rect)) return this;
		var x0 = Math.max(this.x, rect.x);
		var x1 = Math.min(this.x + this.w, rect.x + rect.w);

		if (x0 <= x1) {
			var y0 = Math.max(this.y, rect.y);
			var y1 = Math.min(this.y + this.h, rect.y + rect.h);

			if (y0 <= y1) {
				return new Rect(x0, y0, x1 - x0, y1 - y0);
			}
		}
		return null;
	},

	getCenterPoint: function () {
		return new Point(this.x + this.w / 2, this.y + this.h / 2);
	}
};

/*
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
	this.setBase(initialBase);

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
		var ratio = this.base.fractal.zoomRatio;
		this.zoomBase = Math.pow(2, 1/(s * ratio));
	},

	setBase: function (fixedFractal) {
		this.base = this.recalculateBase(fixedFractal);
		this.redraw();
	},

	// The base cell should be the closest ancestor of all visible cells.
	recalculateBase: function (base) {
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
		while (!containsViewport(base)) {
			//!isOuterRectVisible(this.base)) 
			if (i++ > 100) return;
			base = base.getParent();
			//console.log('walk up');
		}
		//console.log('walked up', i);

		var children = base.getChildren();
		var visibleChild = children.first(isOuterRectVisible);

		// If the inner rect of the base cell is not visible in the viewport,
		// then at least one of its child cells is also not visible.
		// So the visible child, if there is one, should be made the base cell.
		// Narrow down.
		//i = 0;
		while (!base.rect.intersects(viewport)) {
			if (visibleChild) {
				//console.log("setting base to visible child");
				if (i++ > 100) return;
				base = visibleChild;
			} else {
				// todo: prevent this from happening.
				console.log('Lost!');
			}

			children = base.getChildren();
			visibleChild = children.first(isOuterRectVisible);
		}
		//console.log('walked down', i);

		// If the child cells are not visible but the base cell is, then
		// we are zoomed completely into the base cell and it is covering the
		// viewport.
		if (!visibleChild) {
			console.log('Too deep.');
		}

		return base;
		//debugRect2(this.base.rect);
	},

	draw: function () {
		this.base.draw(this, this.ctx, this.viewport);
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
	},

	getPixel: function (point) {
		var pixel = this.ctx.getImageData(point.x, point.y, 1, 1);
		var rgba = Array.prototype.slice.call(pixel.data);
		return rgba;
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
		this.idGenerator = parent.idGenerator;
		this.id = this.idGenerator.child(parent.id, j);
	} else {
		this.idGenerator = new TreeID(this.numChildren, this.idPrefix);
		this.id = this.idGenerator.start();
	}
}
Fractal.prototype = {
	constructor: Fractal,
	i: 0,
	j: 0,
	parent: null,
	children: null,
	childRects: [],
	baseShape: new Rect(0, 0, 1, 1),
	numChildren: 0,
	id: "",
	imageUrl: "fractal/%.png",
	idPrefix: "",

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
		if (!this.parent) {
			this.parent = new this.constructor();
			this.parent.i = (this.numChildren + this.i - 1) % this.numChildren;
			// todo: allow j to alternate for some fractal types
			this.parent.j = this.i ^ this.j;
		}
		return this.parent;
	},

	// get child positions relative to a given position
	getChildRects: function (myRect) {
		return this.childRects[this.i].map(function (childRect) {
			return myRect.transform(childRect);
		});
	},

	getParentRect: function (myRect) {
		var transformation = this.childRects[this.getParent().i][this.j];
		return myRect.transform(transformation.inverse());
	},

	getOuterRect: function () {
		return this.rect;
	},

	getZoomFactor: function (point /*jshint unused:false*/) {
		return [0, 0];
	},

	// distance from center of cell to center of first child cell
	zoomRatio: 1,

	// Draw the content of this cell, and maybe its descendants too.
	// Return value false stops drawing children.
	// Other return values are passed to draw call for children.
	draw: function (ctx, rect, drawingStatus, viewport, view) {
		//return false;
		var s = Math.min(rect.w, rect.h);
		if (this.loadedImage) {
			var oRect = this.getOuterRect(rect);
			// todo: instead of clearing and drawing, draw the subset
			if (drawingStatus == "drawn") {
				// overwrite parent's image
				var iRect = oRect.intersect(viewport);
				ctx.clearRect(iRect.x, iRect.y, iRect.w, iRect.h);
			}
			// todo: draw only the part of the image intersecting the viewport
			ctx.drawImage(this.image, oRect.x, oRect.y, oRect.w, oRect.h);
			if (s < 512) {
				return false;
			} else {
				// still need to draw children to get full resolution
				return "drawn";
			}

		// Don't load image if parent is loading it at required resolution.
		} else if (!this.image && // don't load more than once
			(drawingStatus != "loading" || (s > 256))
		) {
			//this.loadImage(view);
			return "loading";
		}

		return drawingStatus;
	},

	drawAll: function (view, ctx, rect, viewport, imageStatus, borderStatus) {
		if (rect.w < 1 || rect.h < 1) return;
		if (!viewport.intersects(this.getOuterRect(rect))) return;

		if (imageStatus !== false) {
			imageStatus = this.draw(ctx, rect, imageStatus, viewport, view);
		}
		if (this.editing) {
			this.drawEdits();
		}
		if (borderStatus !== false) {
			borderStatus = this.drawBorder(ctx, rect);
		}

		var children = this.getChildren();
		this.getChildRects(rect).forEach(function (childRect, i) {
			children[i].drawAll(view, ctx, childRect,
				viewport, imageStatus, borderStatus);
		});
	},

	drawBorder: function (ctx, rect) {
		ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
	},

	loadImage: function (view) {
		//console.log('load image', this.id);
		var img = this.image = new Image();
		img.src = this.imageUrl.replace('%', this.id);

		var self = this;
		img.onload = function () {
			delete img.onload;
			self.loadedImage = true;
			view.redraw();
		};
		img.onerror = function () {
			delete img.onload;
			delete self.image;
			//console.error("We had an error. Ahhhhhh!!");
			//scheduleRetry(self.loadImage.bind(self, view));
		};
	}
};

//function scheduleRetry(fn) {
	// todo
//}

function SquareRectangleFractal() {
	Fractal.apply(this, arguments);
	this.vertical = this.i % 2;
}
SquareRectangleFractal.prototype = {
	constructor: SquareRectangleFractal,
	vertical: null,
	childRects: [
		[ // horizontal
			new Rect(-0.5, 0.25, 0.5, 0.5), // left
			new Rect(1, 0.25, 0.5, 0.5) // right
		],
		[ // vertical
			new Rect(0.25, -0.5, 0.5, 0.5), // top
			new Rect(0.25, 1, 0.5, 0.5) // bottom
		]
	],
	numChildren: 2,
	zoomRatio: 3/4,
	idPrefix: "a",

	outerRects: [
		new Rect(-0.5, 0, 2, 1), // horizontal
		new Rect(0, -0.5, 1, 2) // vertical
	],

	getOuterRect: function (rect) {
		return rect.transform(this.outerRects[this.i]);
	},

	// Given a point relative to the cell,
	// return a vector weighting the zoom that should be allowed.
	getZoomFactor: function (point) {
		var vertical, horizontal;
		if (this.parent) {
			var sub = this.j ? -1 : 1;
			vertical = this.vertical && sub;
			horizontal = !vertical && sub;
		}
		return new Point(
			vertical || (1 - 2*point.x),
			horizontal || (1 - 2*point.y));
	},

	/*
	borderRects: [
		new Rect(0, 0, 1, 1/16),
		new Rect(0, 0, 1/16, 1),
		new Rect(0, 1 - 1/16, 1, 1/16),
		new Rect(1 - 1/16, 0, 1/16, 1)
	],
	*/

	drawBorder: function (ctx, rect) {
		/*
		var r = rect.transform(this.borderRects[this.i * 1 + this.j * 2]);
		ctx.fillRect(r.x, r.y, r.w, r.h);

		if (rect.w < 2 || rect.h < 2) return false;
		return;
		*/

		ctx.beginPath();
		ctx.moveTo(rect.x, rect.y);

		if (this.vertical) {
			ctx.lineTo(rect.x + rect.w / 4, rect.y);
			ctx.moveTo(rect.x + rect.w * 0.75, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y);

			ctx.moveTo(rect.x, rect.y + rect.h);
			ctx.lineTo(rect.x + rect.w / 4, rect.y + rect.h);
			ctx.moveTo(rect.x + rect.w * 0.75, rect.y + rect.h);

		} else {
			ctx.lineTo(rect.x, rect.y + rect.h / 4);
			ctx.moveTo(rect.x, rect.y + rect.h * 0.75);
			ctx.lineTo(rect.x, rect.y + rect.h);

			ctx.moveTo(rect.x + rect.w, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 4);
			ctx.moveTo(rect.x + rect.w, rect.y + rect.h * 0.75);
		}
		ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
		ctx.stroke();

		if (rect.w < 4 || rect.h < 4) return false;
	}

};
inherit(SquareRectangleFractal, Fractal);


/*
function HexagonFractal() {
	Fractal.apply(this, arguments);
}
HexagonFractal.prototype = {
	constructor: HexagonFractal,
	childRects: [[
		new Rect(0.25, -0.5, 0.5, 0.5), // top
		new Rect(0.25, 1, 0.5, 0.5)
	]], // bottom
	numChildren: 6,
	zoomRatio: 3/4,

	outerRects: [
		new Rect(-0.5, 0, 2, 1), // horizontal
		new Rect(0, -0.5, 1, 2) // vertical
	],
	baseShape: new Rect(0, 0, 1, Math.sqrt(3)),

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
			ctx.moveTo(rect.x + rect.w * 0.75, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y);

			ctx.moveTo(rect.x, rect.y + rect.h);
			ctx.lineTo(rect.x + rect.w / 4, rect.y + rect.h);
			ctx.moveTo(rect.x + rect.w * 0.75, rect.y + rect.h);

		} else {
			ctx.lineTo(rect.x, rect.y + rect.h / 4);
			ctx.moveTo(rect.x, rect.y + rect.h * 0.75);
			ctx.lineTo(rect.x, rect.y + rect.h);

			ctx.moveTo(rect.x + rect.w, rect.y);
			ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 4);
			ctx.moveTo(rect.x + rect.w, rect.y + rect.h * 0.75);
		}
		ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
		ctx.stroke();

		if (rect.w < 4 || rect.h < 4) return false;
	}

};
inherit(HexagonFractal, Fractal);
*/

// A fractal at a specific rect
function FixedFractal(fractal, rect) {
	this.fractal = fractal;
	this.rect = rect;
}
FixedFractal.prototype = {
	fractal: null,
	rect: null,
	
	draw: function (view, ctx, viewport) {
		this.fractal.drawAll(view, ctx, this.rect, viewport);
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

function KeyController(win) {
	var behavior = {},
		keyMap = 0,
		self = this;

	win = win || window;

	function map(e) {
		return keyMap ^ (keyMap =
			(1 * (self.ctrl = e.ctrlKey))
			| (2 * (self.alt = e.altKey))
			| (4 * (self.shift = e.shiftKey))
			| (8 * (self.meta = e.metaKey)));
	}

	function onKeyDown(e) {
		var diff = map(e);
		if ((diff & 1) && behavior.onCtrlDown) behavior.onCtrlDown(e);
		if ((diff & 2) && behavior.onAltDown) behavior.onAltDown(e);
		if ((diff & 4) && behavior.onShiftDown) behavior.onShiftDown(e);
		if ((diff & 8) && behavior.onMetaDown) behavior.onMetaDown(e);
	}

	function onKeyUp(e) {
		var diff = map(e);
		if ((diff & 1) && behavior.onCtrlUp) behavior.onCtrlUp(e);
		if ((diff & 2) && behavior.onAltUp) behavior.onAltUp(e);
		if ((diff & 4) && behavior.onShiftUp) behavior.onShiftUp(e);
		if ((diff & 8) && behavior.onMetaUp) behavior.onMetaUp(e);
		if (diff && !keyMap && behavior.onAllUp) behavior.onAllUp(e);
	}

	this.activate = function () {
		win.addEventListener("keydown", onKeyDown, false);
		win.addEventListener("keyup", onKeyUp, false);
		win.addEventListener("blur", onKeyUp, false);
	};

	this.deactivate = function () {
		win.removeEventListener("keydown", onKeyDown, false);
		win.removeEventListener("keyup", onKeyUp, false);
		win.removeEventListener("blur", onKeyUp, false);
	};

	this.setBehavior = function (b) {
		behavior = b;
	};
}
KeyController.prototype = {
	shift: false,
	ctrl: false,
	alt: false,
	meta: false
};

window.KeyController = KeyController;
window.Fractal = Fractal;
window.Point = Point;
window.Rect = Rect;
window.FractalView = FractalView;
window.SquareRectangleFractal = SquareRectangleFractal;
