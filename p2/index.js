import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

window.AllTheStuff = async function AllTheStuff() {
    
// Generate ya sphere
var sRadius = 1; 
var slices = 25; 
var stacks = 12; 
var sVertices = []; 
let sColors = [];   // TODO: Delete me 
var count = 0;
let drawSphere = true;

for (let t = 0 ; t < stacks ; t++ ){ // stacks are ELEVATION so they count theta
	var phi1 = ( (t)/stacks )*Math.PI;
	var phi2 = ( (t+1)/stacks )*Math.PI;
    for (let p = 0 ; p < slices +1 ; p++ ){ // slices are ORANGE SLICES so 					
        var theta = ( (p)/slices )*2*Math.PI ; 
        var xVal = sRadius * Math.cos(theta) * Math.sin(phi1);
        var yVal = sRadius * Math.sin(theta) * Math.sin(phi1);
        var zVal = sRadius * Math.cos(phi1);
        sVertices = sVertices.concat([ xVal, yVal, zVal ]);
        sColors = sColors.concat([Math.random(),Math.random(),Math.random(),1]);
        count++;
        var xVal = sRadius * Math.cos(theta) * Math.sin(phi2);
        var yVal = sRadius * Math.sin(theta) * Math.sin(phi2);
        var zVal = sRadius * Math.cos(phi2);
        sVertices = sVertices.concat([ xVal, yVal, zVal ]);
        sColors = sColors.concat([Math.random(),Math.random(),Math.random(),1]);
        count++;
    }
}        

let xMin = -5;
let xMax = 5;
let yMin = -5;
let yMax = 5; 

let squarePositions = [   xMin, yMax, 0,    xMax, yMax, 0,
                        xMax, yMin, 0,    xMin, yMin, 0];
let squareColors = [  1, 0, 0, 1,     1, 0, 0, 1,
                    0, 1, 0, 1,     0, 1, 0, 1];

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

let squarePositionBuffer = tools.initBuffer(squarePositions, gl.STATIC_DRAW, 3, 4);
let squareColorBuffer = tools.initBuffer(squareColors, gl.STATIC_DRAW, 4, 4);

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

let sphereCoords = [(Math.random()*10)-5, (Math.random()*10)-5, 0];

function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Square stuff ---------------------------------------
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, -15]);
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        squarePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        squareColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_LOOP, 0, squarePositionBuffer.numItems);
    
    // Sphere stuff ---------------------------------------
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [sphereCoords[0]+vx, sphereCoords[1]+vy, -15]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), [1, 0, 1]);
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);

    // Bounce calculations //
    mat4.getTranslation(sphereCoords, mvMatrix);
    if (sphereCoords[0] >= xMax || sphereCoords[0] <= xMin) {vx *= -1}
    if (sphereCoords[1] >= yMax || sphereCoords[1] <= yMin) {vy *= -1}
    // Bounce calculations //

    if (drawSphere) {
        gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            spherePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
            sphereColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, spherePositionBuffer.numItems);
    }
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

var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;
let vx = Math.random()*0.15;
let vy = Math.random()*0.15;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        //update the rotation to the current time.
        xRot += (xSpeed * elapsed) / 1000.0;
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

    // Interactive stuff 
    document.getElementById('sphere_coords').innerHTML =
        `${tools.roundDown(sphereCoords[0])}, ${tools.roundDown(sphereCoords[1])}`
}

let ixMin = document.getElementById('xMin');
let ixMax = document.getElementById('xMax');
let iyMin = document.getElementById('yMin');
let iyMax = document.getElementById('yMax');
let fields = document.getElementsByClassName('resize');

ixMin.value = xMin;
ixMax.value = xMax;
iyMin.value = yMin;
iyMax.value = yMax;

function resizeSquare() {
    squarePositions = [   xMin, yMax, 0,    xMax, yMax, 0,
                          xMax, yMin, 0,    xMin, yMin, 0];
    squarePositionBuffer = tools.initBuffer(squarePositions, gl.STATIC_DRAW, 3, 4);
    sphereCoords = [(xMin+xMax)/2, (yMin+yMax)/2, 0];
    console.log('sum');
}

ixMin.addEventListener('blur', e => {
    xMin = parseInt(e.target.value);
    if (xMin > xMax) {
        drawSphere = false;
    } else {drawSphere = true;}
    resizeSquare();
});
iyMin.addEventListener('blur', e => {
    yMin = parseInt(e.target.value);
    if (yMin > yMax) {
        drawSphere = false;
    } else {drawSphere = true;}
    resizeSquare();
});
ixMax.addEventListener('blur', e => {
    xMax = parseInt(e.target.value);
    if (xMax < xMin) {
        drawSphere = false;
    } else {drawSphere = true;}
    resizeSquare();
});
iyMax.addEventListener('blur', e => {
    yMax = parseInt(e.target.value);
    if (yMax < yMin) {
        drawSphere = false;
    } else {drawSphere = true;}
    resizeSquare();
});

document.addEventListener('keyup', e => {
    if (e.code == 'Enter') {
        e.preventDefault();
        e.target.blur()
    }
});

tick()
}