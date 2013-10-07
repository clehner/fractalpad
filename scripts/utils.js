/*global Point */

if (!window.console) {
	window.console = {
		log: function () {}
	};
}

// Utils

function pref(key, val) {
	if (pref.arguments.length == 1) {
		return (window.localStorage || window.sessionStorage || 0)[key];
	} else {
		(window.localStorage || window.sessionStorage || 0)[key] = val;
	}
}

var Canvases = {
	_canvases: [],

	allocate: function (width, height) {
		var canvas = this._canvases.pop() || document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		return canvas;
	},

	free: function (canvas) {
		if (canvas) {
			this._canvases.push(canvas);
		}
	}
};

function MouseController(element) {
	var self = this;
	this.element = element;
	if (!element) throw new Error("Missing element");

	function point(e) {
		return new Point(e.pageX, e.pageY);
	}

	this.onMouseDown = function (e) { self.behavior.onMouseDown(point(e), e); };
	this.onMouseMove = function (e) { self.behavior.onMouseMove(point(e), e); };
	this.onMouseUp = function (e) { self.behavior.onMouseUp(point(e), e); };
}

MouseController.prototype.setBehavior = function (b) {
	var oldB = this.behavior;
	if (oldB == b) return;
	this.behavior = b;
	if (oldB && oldB.onDeactivate) oldB.onDeactivate(b);
	if (b && b.onActivate) b.onActivate(this);
	this.updateEvent(b, oldB, this.element, "mousedown", "onMouseDown");
	this.updateEvent(b, oldB, document, "mousemove", "onMouseMove");
	this.updateEvent(b, oldB, document, "mouseup", "onMouseUp");
	//element.className = behavior.className || '';
};

MouseController.prototype.updateEvent = function (a, b, el, evName, fnName) {
	if (a && a[fnName]) {
		if (!b || !b[fnName]) el.addEventListener(evName, this[fnName], false);
	} else {
		if (b && b[fnName]) el.removeEventListener(evName, this[fnName], false);
	}
};

function DragBehavior(opt) {
	if (typeof opt == "function") {
		opt = {
			onDragStart: this.drag,
			onDrag: opt
		};
	}
	this.opt = opt;
	this.draggingBehavior = new DraggingBehavior(opt, this);
}
DragBehavior.prototype.drag = function (e) {
	this.onDrag(e);
};
DragBehavior.prototype.onActivate = function (controller) {
	this.controller = controller;
	if (this.opt.onActivate) this.opt.onActivate(controller);
};
DragBehavior.prototype.onMouseDown = function (point, e) {
	this.controller.setBehavior(this.draggingBehavior);
	this.draggingBehavior.onDragStart(point, e);
};

function DraggingBehavior(opt, defaultBehavior) {
	this.opt = opt;
	this.defaultBehavior = defaultBehavior;
}

DraggingBehavior.prototype.calculateOffset = function () {
	var x = 0, y = 0;
	for (var el = this.controller.element; el; el = el.offsetParent) {
		x += el.offsetLeft - el.scrollLeft;
		y += el.offsetTop - el.scrollTop;
	}
	this.offset = new Point(x, y);
};

DraggingBehavior.prototype.onActivate = function (controller) {
	this.controller = controller;
	if (this.opt.onActivate) this.opt.onActivate(controller);
};
DraggingBehavior.prototype.onDragStart = function (point, e) {
	this.calculateOffset();
	var innerPoint = point.minus(this.offset);
	if (this.opt.onDragStart) this.opt.onDragStart(innerPoint, e);
};
DraggingBehavior.prototype.onMouseMove = function (point, e) {
	var innerPoint = point.minus(this.offset);
	if (this.opt.onDrag) this.opt.onDrag(innerPoint, e);
};
DraggingBehavior.prototype.onMouseUp = function (point, e) {
	var innerPoint = point.minus(this.offset);
	if (this.opt.onDragEnd) this.opt.onDragEnd(innerPoint, e);
	this.controller.setBehavior(this.defaultBehavior);
};
DraggingBehavior.prototype.onDeactivate = function () {
	if (this.opt.onDeactivate) this.opt.onDeactivate();
};

window.pref = pref;
window.Canvases = Canvases;
window.MouseController = MouseController;
window.DragBehavior = DragBehavior;
window.DraggingBehavior = DraggingBehavior;
