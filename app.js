var canvas = document.getElementById("canvas");
var baseSize;

var fractal = new FractalView(new SquareRectangleFractal, canvas);
//fractal.layers.push(new FractalColors);
fractal.layers.push(new FractalBorder);

var s = baseSize = Math.min(innerWidth, innerHeight) / 2 - 2;
var x = innerWidth/2 - s/2;
var y = innerHeight/2 - s/2;
fractal.setRootPosition(new Rect(x, y, s, s));

function updateViewport() {
	fractal.setViewport(new Rect(0, 0, window.innerWidth, window.innerHeight));
}
updateViewport();
window.addEventListener("resize", updateViewport, false);

var mouse = new MouseController(canvas);
mouse.setBehavior(new DefaultBehavior(mouse));

