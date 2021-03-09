import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

let pi = 3.14159265359;


window.AllTheStuff = async function AllTheStuff() {
    
// Generate ya sphere
var sRadius = 4; 
var slices = 25; 
var stacks = 12; 
var sVertices = []; 
let sColors = [];   // TODO: Delete me 
var count =0;

for (let t = 0 ; t < stacks ; t++ ){ // stacks are ELEVATION so they count theta
	var phi1 = ( (t)/stacks )*Math.PI;
	var phi2 = ( (t+1)/stacks )*Math.PI;
    for (let p = 0 ; p < slices +1 ; p++ ){ // slices are ORANGE SLICES so 					
        var theta = ( (p)/slices )*2*Math.PI ; 
        var xVal = sRadius * Math.cos(theta) * Math.sin(phi1);
        var yVal = sRadius * Math.sin(theta) * Math.sin(phi1);
        var zVal = sRadius * Math.cos(phi1);
        sVertices = sVertices.concat([ xVal, yVal, zVal ]);
        sColors = sColors.concat([1,1,1,1]);
        count++;
        var xVal = sRadius * Math.cos(theta) * Math.sin(phi2);
        var yVal = sRadius * Math.sin(theta) * Math.sin(phi2);
        var zVal = sRadius * Math.cos(phi2);
        sVertices = sVertices.concat([ xVal, yVal, zVal ]);
        sColors = sColors.concat([1,1,1,1]);
        count++;
    }
}        

// ~ Start WebGL ..............................................................
var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;
//Create the GL viewport
var gl = tools.initGL(canvas);
///Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);

// initBuffer
let spherePositionBuffer = tools.initBuffer(sVertices, gl.STATIC_DRAW, 3, (2*(slices+1)*stacks));
let sphereColorBuffer = tools.initBuffer(sColors, gl.STATIC_DRAW, 4, (2*(slices+1)*stacks));

//Set the background color to opaque black
gl.clearColor(0.0, 0.0, 0.0, 1.0);
//Render only pixels in front of the others.
gl.enable(gl.DEPTH_TEST);

// Outside drawScene()
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Projection matrices
mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
mat4.identity(mvMatrix);
mat4.translate(mvMatrix, mvMatrix, [0, 0, -15]);

function drawScene() {
    // Viewport stuff
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), [1, 1, 1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        spherePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        sphereColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);
    gl.drawArrays(gl.LINES, 0, spherePositionBuffer.numItems);
}


// Animation stuff

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}    

function resize(canvas){
	var dispWidth = window.innerWidth-20;	  //browser width
	var dispHeight = (window.innerHeight)-20;  //browser height

    //check if the canvas is not the same size
	if (canvas.width != dispWidth || canvas.height != dispHeight) {
        canvas.width = dispWidth;   // FIXME: This doesn't work, it just scales the image
		canvas.height = dispHeight; // Might need to initGL again?
		gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}
}

var lastTime = 0;	var xRot = 0;		var xSpeed = 60;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        //update the rotation to the current time.
        xRot = (xSpeed * elapsed) / 1000.0;
        if( xRot > 360 ){
            xRot -= 360;
        }
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick); 
    resize(canvas);
    drawScene();
    animate();
}

tick()
// drawScene();
}