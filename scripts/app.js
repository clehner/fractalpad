/* global Rect, FractalView, FixedFractal, SquareRectangleFractal,
   MouseController, ToolSet */

function FractalPad() {
	var canvas = document.getElementById("canvas");
	this.viewerEl = canvas;

	var s = (Math.min(window.innerWidth, window.innerHeight) - 1) / 2;
	var x = (window.innerWidth - s)/2;
	var y = (window.innerHeight - s)/2;
	var centerSquare = new Rect(x, y, s, s);

	var fractal = new SquareRectangleFractal("a_");
	var initialRect = centerSquare.transform(fractal.baseShape);
	var base = new FixedFractal(fractal, initialRect);
	var fractalView = new FractalView(canvas, base);
	this.view = fractalView;

	function updateViewport() {
		var viewport = new Rect(0, 0, window.innerWidth, window.innerHeight);
		fractalView.setViewport(viewport);
	}
	window.addEventListener("resize", updateViewport, false);
	updateViewport();

	// Editor
	//var editor = new FractalEditor(fractalView, mouse);

	// Modes
	var mouse = new MouseController(canvas);
	var toolset = new ToolSet(this, mouse, document.getElementById("tools"));
	toolset.selectTool(sessionStorage.defaultTool || "scroll");
	toolset.onSelectTool = function (toolName) {
		sessionStorage.defaultTool = toolName;
	};
}

FractalPad.prototype = {
	constructor: FractalPad,

	viewerEl: null,
	location: {x: NaN, y: NaN, z: NaN},

	queueTileSave: function (tile) {
	},

	setPosition: function (x, y) {
	}
};

function init() {
	window.app = new FractalPad();
}

