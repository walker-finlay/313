import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

let pi = 3.14159265359;

window.AllTheStuff = async function AllTheStuff() {
// Polar curve stuff -------------------------------------------
let getPP = await tools.getMyData('points.json');
let getPC = await tools.getMyData('colors.json');
// Line blast stuff --------------------------------------------
let getLBP = await tools.getMyData('line_points.json');
let getLBC = await tools.getMyData('line_colors.json');

// ~ Start WebGL ..............................................................
var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;
//Create the GL viewport
let gl = tools.initGL(canvas);
///Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);

// ###########################################################
// #################### All the points #######################
// ###########################################################
// Polar fan
let polarPointBuffer = tools.initBuffer(getPP, gl.STATIC_DRAW, 3, 1001);
let polarColorBuffer = tools.initBuffer(getPC, gl.STATIC_DRAW, 3, 1001);
// Line blast
let starBurstPositionBuffer = tools.initBuffer(getLBP, gl.STATIC_DRAW, 3, 2000);
let starBurstColorBuffer = tools.initBuffer(getLBC, gl.STATIC_DRAW, 4, 2000);
// ###########################################################
// ######################### (end) ###########################
// ###########################################################

//Set the background color to opaque black
gl.clearColor(0.3, 0.0, 0.4, 1.0);
//Render only pixels in front of the others.
gl.enable(gl.DEPTH_TEST);
//render the scene
console.log("Drawing");

// ###########################################################
// ######################## Draw it! #########################
// ###########################################################
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Viewport stuff
gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// Projection matrices
mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

// mat4.identity(mvMatrix);
mat4.fromYRotation(mvMatrix, pi/10);
mat4.rotateX(mvMatrix, mvMatrix, pi/10);
mat4.translate(mvMatrix, mvMatrix, [1, -2, -2]);

tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);

// TODO: Make this a function?
gl.bindBuffer(gl.ARRAY_BUFFER, polarPointBuffer);
gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
    polarPointBuffer.itemSize, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, polarColorBuffer);
gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
    polarColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.TRIANGLE_FAN, 0, polarPointBuffer.numItems);

gl.bindBuffer(gl.ARRAY_BUFFER, starBurstPositionBuffer);
gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
    starBurstPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, starBurstColorBuffer);
gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
    starBurstColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
gl.drawArrays(gl.LINES, 0, starBurstColorBuffer.numItems);

// ###########################################################
// ######################### (end) ###########################
// ###########################################################
}