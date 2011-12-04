
function DefaultBehavior(fractalView, mouse) {
	this.fractalView = fractalView;
	this.mouse = mouse;
}
DefaultBehavior.prototype = {
	className: 'mouse-behavior-scroll',
	onMouseMove: function func(point) {
		var zoomFactor = this.fractalView.getZoomFactor(point);

		// Set directional cursor
		var dirX = zoomFactor.x;
		var dirY = zoomFactor.y;
		var m = .33;
		var direction =
			(dirY > m ? 's' : -m > dirY ? 'n' : '') +
			(dirX > m ? 'e' : -m > dirX ? 'w' : '');
		canvas.style.cursor = direction ? direction + '-resize' : '';
	},
	onMouseDown: function (point) {
		var behavior = new ScrollBehavior(this.fractalView, this.mouse, point);
		this.mouse.setBehavior(behavior);
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
	className: 'mouse-behavior-scrolling',

	onMouseMove: function (mouseCoords) {
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

	onMouseUp: function () {
		var behavior = new DefaultBehavior(this.fractalView, this.mouse);
		this.mouse.setBehavior(behavior);
	}
};
