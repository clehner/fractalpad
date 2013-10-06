if (!window.console) {
	window.console = {
		log: function () {}
	};
}

// Utils

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

function DragController(element, options) {
	if (!element) return null;
	if (!options) options = 0;
	var onDragStart = options.onDragStart;
	var onDrag = options.onDrag;
	var onDragEnd = options.onDragEnd;
	var context = options;
	if (options.onActivate) options.onActivate();

	var lastX, lastY;
	var offsetX, offsetY;
	function calculateOffsets() {
		var x = 0, y = 0;
		for (var el = element; el; el = el.offsetParent) {
			x += el.offsetLeft - el.scrollLeft;
			y += el.offsetTop - el.scrollTop;
		}
		offsetX = x;
		offsetY = y;
	}

	// Add coords relative to element
	function correctEvent(e) {
		lastX = e._x = e.pageX - offsetX;
		lastY = e._y = e.pageY - offsetY;
	}

	function onMouseMove(e) {
		correctEvent(e);
		if (onDrag) onDrag.call(context, e);
	}

	function onMouseUp(e) {
		document.removeEventListener("mouseup", onMouseUp, false);
		document.removeEventListener("mousemove", onMouseMove, true);
		correctEvent(e);
		if (onDragEnd) onDragEnd.call(context, e);
	}

	function onTouchEnd(e) {
		if (e.touches.length > 0) return;
		document.removeEventListener("touchend", onTouchEnd, false);
		document.removeEventListener("touchcancel", onTouchEnd, false);
		document.removeEventListener("touchmove", onMouseMove, true);
		e._x = lastX;
		e._y = lastY;
		if (onDragEnd) onDragEnd.call(context, e);
	}

	function onMouseDown(e) {
		if (e.touches) {
			e.preventDefault();
			document.addEventListener("touchmove", onMouseMove, true);
			document.addEventListener("touchend", onTouchEnd, false);
			document.addEventListener("touchcancel", onTouchEnd, false);
		} else {
			document.addEventListener("mousemove", onMouseMove, true);
			document.addEventListener("mouseup", onMouseUp, false);
		}

		// ignore right click
		document.addEventListener("contextmenu", onMouseUp, false);
		calculateOffsets();
		correctEvent(e);
		if (onDragStart) onDragStart.call(context, e);
	}
	element.addEventListener("touchstart", onMouseDown, false);
	element.addEventListener("mousedown", onMouseDown, false);

	this.setBehavior = function (opt) {
		onDragStart = opt.onDragStart;
		onDrag = opt.onDrag;
		onDragEnd = opt.onDragEnd;
		if (context && context.onDeactivate) context.onDeactivate();
		context = opt;
		if (opt.onActivate) opt.onActivate();
	};
}

function pref(key, val) {
	if (pref.arguments.length == 1) {
		return (window.localStorage || window.sessionStorage || 0)[key];
	} else {
		(window.localStorage || window.sessionStorage || 0)[key] = val;
	}
}

window.pref = pref;
window.Canvases = Canvases;
window.DragController = DragController;
