function $(id) {
	return document.getElementById(id);
}

function init() {
	var canvas = document.getElementById("canvas");

	var s = (Math.min(innerWidth, innerHeight) - 1) / 2;
	var x = (innerWidth - s)/2;
	var y = (innerHeight - s)/2;

	var initialRect = new Rect(x, y, s, s);
	var fractal = new SquareRectangleFractal("a_");
	var base = new FixedFractal(fractal, initialRect);
	var fractalView = new FractalView(canvas, base);

	function updateViewport() {
		var viewport = new Rect(0, 0, window.innerWidth, window.innerHeight);
		fractalView.setViewport(viewport);
	}
	window.addEventListener("resize", updateViewport, false);
	updateViewport();

	var mouse = new MouseController(canvas);

	var scrollBehavior = new DefaultBehavior(fractalView, mouse);
	mouse.setBehavior(scrollBehavior);

	// Editor
	var editor = new FractalEditor(fractalView, mouse);

	// Modes
	var inDrawMode, inScrollMode;
	var modeButtons = {
		scroll: $("scroll-mode"),
		draw: $("draw-mode")
	};

	function updateMode() {
		inDrawMode = modeButtons.draw.checked;
		inScrollMode = !inDrawMode;
		if (inScrollMode) {
			editor.deactivate();
			mouse.setBehavior(scrollBehavior);
		} else if (inDrawMode) {
			editor.activate();
		}
	}

	modeButtons.scroll.addEventListener("change", updateMode, false);
	modeButtons.draw.addEventListener("change", updateMode, false);
	modeButtons.scroll.checked = true;
	updateMode();
}
