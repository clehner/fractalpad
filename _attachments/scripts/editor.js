function FractalEditor(fractalViewer, mouseController) {
	// Use closure instead of prototype because this should only have one
	// instance.

	var color, // [r,g,b,a]
		brushStyle, // rgb() or rgba(), string for css/canvas
		drawOptions = $("draw-options"),
		colorSelection = $("color-selection"),
		alphaSelection = colorSelection.getElementsByTagName("div")[0],
		colorPalette = new Palette(),
		colorSelector = new ColorSelector(colorPalette),
		key = new KeyController();

	colorSelection.addEventListener("click", onColorSelectionClicked, false);
	document.body.appendChild(colorSelector.container);
	colorSelector.addEventListener("change", onColorSelectorChange, false);

	// remove input fields
	colorSelector.container.removeChild(colorSelector.inputContainer);

	function onColorSelectionClicked(e) {
		showColorSelector(window.innerWidth / 2, window.innerHeight / 2);
	}

	function showColorSelector(x, y) {
		var el = colorSelector.container;
		el.style.left = x - 125 + "px";
		el.style.top = y - 125 + "px";
		colorSelector.show();
	}

	function onColorSelectorChange(e) {
		// raw color is array
		var rgba = colorSelector.getColor();
		color = rgba;
		var c = rgba.slice(0, 3).join(", ");
		var solidColor = "rgb(" + c + ")";
		var alpha = color[3];
		//var alpha = (rgba[3] == null) ? rgba[3] : color[3];
		brushStyle = (alpha == 1) ?
			solidColor : "rgba(" + c + ", " + alpha + ")";
		colorSelection.style.backgroundColor = solidColor;
		alphaSelection.style.opacity = 1 - alpha;
		//console.log(color.join(","), brushStyle);
	}

	colorSelector.setColor([255, 0, 0, 1]);

	var drawBehavior = {
		className: "mouse-behavior-draw",
		point: null,

		onMouseDown: function (point, e) {
			if (!key.shift) {
				colorSelector.hide();
			}
			//mouseController.setBehavior(new DrawingBehavior());
			this.point = point;
		},

		onMouseMove: function (point) {
			if (this.point) {
				// todo
				this.point = point;
			}
		},

		onMouseUp: function (point) {
			this.onMouseMove(point);
			this.point = null;
		}
	};

	var eyedropperBehavior = {
		className: "mouse-behavior-eyedropper",

		eyedrop: function (point) {
			var pixel = fractalViewer.ctx.getImageData(point.x, point.y, 1, 1);
			var c = Array.prototype.slice.call(pixel.data);
			c[3] = color[3];
			colorSelector.setColor(c);
		},

		onMouseDown: function (point) {
			this.eyedrop(point);
			this.mouseIsDown = true;
		},

		onMouseMove: function (point) {
			if (this.mouseIsDown) {
				this.eyedrop(point);
			}
		},

		onMouseUp: function () {
			this.mouseIsDown = false;
		}
	};

	var tempScrollBehavior = new DefaultBehavior(fractalViewer,
		mouseController);

	key.setBehavior({
		onShiftDown: function () {
			var mouse = mouseController.getPoint();
			showColorSelector(mouse.x, mouse.y);
		},
		onShiftUp: function () {
			colorSelector.hide();
		},
		onAltDown: function () {
			mouseController.setBehavior(eyedropperBehavior);
		},
		onMetaDown: function () {
			mouseController.setBehavior(tempScrollBehavior);
		},
		onAllUp: function () {
			mouseController.setBehavior(drawBehavior);
		}
	});

	this.activate = function () {
		drawOptions.className = "";
		mouseController.setBehavior(drawBehavior);
		key.activate();
	};

	this.deactivate = function () {
		drawOptions.className = "hidden";
		colorSelector.hide();
		key.deactivate();
	};

}
