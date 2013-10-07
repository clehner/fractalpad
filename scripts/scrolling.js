/* global Point, Rect, FixedFractal */

function pointToDirection(point) {
	var dirX = point.x;
	var dirY = point.y;
	var m = 0.33;
	var direction =
		(dirY > m ? 's' : -m > dirY ? 'n' : '') +
		(dirX > m ? 'e' : -m > dirX ? 'w' : '');
	return direction;
}

function ScrollHoverBehavior(fractalView, mouse) {
	this.fractalView = fractalView;
	this.mouse = mouse;
	this.canvasStyle = fractalView.canvas.style;
}
ScrollHoverBehavior.prototype = {
	onActivate: function () {
		this.fractalView.canvas.className = "cursor-scroll";
	},

	onMouseMove: function (point) {
		var zoomFactor = this.fractalView.getZoomFactor(point);

		// Set directional cursor
		var direction = pointToDirection(zoomFactor);
		this.canvasStyle.cursor = direction ? direction + '-resize' : '';
	},

	onDragStart: function (e) {
		var point = new Point(e.pageX, e.pageY);
		var behavior = new ScrollBehavior(this.fractalView, this.mouse, point);
		this.mouse.setBehavior(behavior);
	},

	onDeactivate: function (next) {
		if (next instanceof ScrollBehavior) return;
		this.canvasStyle.cursor = "";
	}
};

function ScrollBehavior(fractalView, mouse, mouseCoords) {
	this.fractalView = fractalView;
	this.mouse = mouse;

	this.mouseStart = mouseCoords;
	this.startBase = fractalView.base;

	this.zoomFactor = fractalView.getZoomFactor(mouseCoords);
}

ScrollBehavior.prototype = {
	onActivate: function () {
		this.fractalView.canvas.className = "cursor-scrolling";
	},

	onDrag: function (e) {
		var mouseCoords = new Point(e.pageX, e.pageY);
		var mouseDx = (mouseCoords.x - this.mouseStart.x);
		var mouseDy = (mouseCoords.y - this.mouseStart.y);
		var zoomX = this.zoomFactor.x * mouseDx;
		var zoomY = this.zoomFactor.y * mouseDy;
		var zoom = Math.pow(this.fractalView.zoomBase, zoomX + zoomY);

		var startBaseRect = this.startBase.rect;
		var baseRect = new Rect(
			mouseDx + this.mouseStart.x +
				zoom * (startBaseRect.x - this.mouseStart.x),
			mouseDy + this.mouseStart.y +
				zoom * (startBaseRect.y - this.mouseStart.y),
			startBaseRect.w * zoom,
			startBaseRect.h * zoom
		);

		var baseFractal = this.startBase.fractal;
		this.fractalView.setBase(new FixedFractal(baseFractal, baseRect));
		//fractalView.redraw();
	},

	onDragEnd: function () {
		var behavior = new ScrollHoverBehavior(this.fractalView, this.mouse);
		this.mouse.setBehavior(behavior);
	},

	onDeactivate: function (next) {
		if (next instanceof ScrollHoverBehavior) return;
		this.fractalView.canvas.style.cursor = "";
	}
};

window.ScrollHoverBehavior = ScrollHoverBehavior;
window.ScrollBehavior = ScrollBehavior;
