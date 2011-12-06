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
		shiftKeyIsDown = false;

	colorSelection.addEventListener("click", onColorSelectionClicked, false);
	document.body.appendChild(colorSelector.container);
	colorSelector.addEventListener("change", onColorSelectorChange, false);

	function onColorSelectionClicked(e) {
		showColorSelector(window.innerWidth / 2, window.innerHeight / 2);
	}

	function showColorSelector(x, y) {
		var el = colorSelector.container;
		el.style.left = x - el.offsetWidth/2 + "px";
		el.style.top = y - el.offsetHeight/2 + "px";
		colorSelector.show();
	}

	function onColorSelectorChange(e) {
		// raw color is array
		setBrushColor(colorSelector.getColor(), true);
	}

	function setBrushColor(rgba, fromColorSelector) {
		//if (rgba[3] == null) rgba[3] = color[3];
		color = rgba;
		var c = rgba.slice(0, 3).join(", ");
		var solidColor = "rgb(" + c + ")";
		var alpha = color[3];
		//var alpha = (rgba[3] == null) ? rgba[3] : color[3];
		brushStyle = (alpha == 1) ?
			solidColor : "rgba(" + c + ", " + alpha + ")";
		colorSelection.style.backgroundColor = solidColor;
		alphaSelection.style.opacity = 1 - alpha;
		console.log(color.join(","), brushStyle);
		if (!fromColorSelector) {
			colorSelector.setColor(color);
		}
	}

	setBrushColor([255, 0, 0, 1]);

	var drawBehavior = {
		className: "mouse-behavior-draw",

		onMouseDown: function (point, e) {
			if (!shiftKeyIsDown) {
				colorSelector.hide();
			}
			//mouseController.setBehavior(new DrawingBehavior());
		}
	};

	var eyedropperBehavior = {
		className: "mouse-behavior-eyedropper",

		onMouseDown: function (point) {
			var pixel = fractalViewer.ctx.getImageData(point.x, point.y, 1, 1);
			var c = Array.prototype.slice.call(pixel.data);
			c[3] = color[3];
			setBrushColor(c);
		}
	};

	function onWindowKeyDown(e) {
		switch(e.keyCode) {
			case 16: // shift
				shiftKeyIsDown = true;
				var mouse = mouseController.getPoint();
				showColorSelector(mouse.x, mouse.y);
				break;
			case 18: // alt
				mouseController.setBehavior(eyedropperBehavior);
				break;
		}
	}

	function onWindowKeyUp(e) {
		switch(e.keyCode) {
			case 16: // shift
				shiftKeyIsDown = false;
				colorSelector.hide();
				break;
			case 18: // alt
				mouseController.setBehavior(drawBehavior);
				break;
		}
	}

	this.activate = function () {
		drawOptions.className = "";
		window.addEventListener("keydown", onWindowKeyDown, false);
		window.addEventListener("keyup", onWindowKeyUp, false);
		mouseController.setBehavior(drawBehavior);
	};

	this.deactivate = function () {
		drawOptions.className = "hidden";
		window.removeEventListener("keydown", onWindowKeyDown, false);
		window.removeEventListener("keyup", onWindowKeyUp, false);
		colorSelector.hide();
	};

}
