
function DefaultBehavior(mouse) {
	this.mouse = mouse;
}
DefaultBehavior.prototype = {
	className: 'mouse-behavior-scroll',
	onMouseMove: function func(point) {
		var zoomFactor = fractal.getZoomFactor(point);

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
		this.mouse.setBehavior(new ScrollBehavior(this.mouse, point));
	}
};

function ScrollBehavior(mouse, mouseCoords) {
	this.mouse = mouse;
	this.zoomBase = Math.pow(2, 1/(baseSize * 3/4));

	this.mouseStart = mouseCoords;
	this.startBaseCell = fractal.baseCell;
	this.startBaseRect = fractal.baseCell.rect;

	this.zoomFactor = fractal.getZoomFactor(mouseCoords);
}

ScrollBehavior.prototype = {
	className: 'mouse-behavior-scrolling',

	onMouseMove: function (mouseCoords) {
		var mouseDx = (mouseCoords.x - this.mouseStart.x);
		var mouseDy = (mouseCoords.y - this.mouseStart.y);
		var zoomX = this.zoomFactor.x * mouseDx;
		var zoomY = this.zoomFactor.y * mouseDy;
		var zoom = Math.pow(this.zoomBase, zoomX + zoomY);
		this.startBaseCell.setPosition(new Rect(
			mouseDx + this.mouseStart.x +
				zoom * (this.startBaseRect.x - this.mouseStart.x),
			mouseDy + this.mouseStart.y +
				zoom * (this.startBaseRect.y - this.mouseStart.y),
			this.startBaseRect.w * zoom,
			this.startBaseRect.h * zoom));
		fractal.setBase(this.startBaseCell);
		fractal.redraw();
	},

	onMouseUp: function () {
		this.mouse.setBehavior(new DefaultBehavior(this.mouse));
	}
};
