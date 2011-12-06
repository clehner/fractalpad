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
	mouse.setBehavior(new DefaultBehavior(fractalView, mouse));
}
