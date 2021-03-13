import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

window.AllTheStuff = async function AllTheStuff() {

// Methods --------------------------------------
var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;
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
    tools.resize(canvas);
    drawScene();
    animate();
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
 

// Points ---------------------------------------
let axisPositions = [1, 0, 0,       0, 0, 0,
                     0, 1, 0,       0, 0, 0, 
                     0, 0, 1,       0, 0, 0,];
let axisColors = [1, 0, 0, 1,       1, 0, 0, 1,
                  0, 1, 0, 1,       0, 1, 0, 1,
                  0, 0, 1, 1,       0, 0, 1, 1];

let sphere = new tools.glSphere(1);

// Initbuffers ----------------------------------
let axisPositionBuffer = tools.initBuffer(axisPositions, 3, 6);
let axisColorBuffer = tools.initBuffer(axisColors, 4, 6);

let spherePositionBuffer = tools.initBuffer(sphere.sVertices, 3, sphere.numItems);
let sphereColorBuffer = tools.initBuffer(sphere.sColors, 4, sphere.numItems);

// Drawing --------------------------------------
//Set the background color to opaque black
gl.clearColor(0.0, 0.0, 0.0, 1.0);
//Render only pixels in front of the others.
gl.enable(gl.DEPTH_TEST);

// Outside drawScene()
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
mat4.identity(mvMatrix);
mat4.translate(mvMatrix, mvMatrix, [0, 0, -15]);

function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Axes
    gl.bindBuffer(gl.ARRAY_BUFFER, axisPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        axisPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        axisColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);

    gl.drawArrays(gl.LINES, 0, axisPositionBuffer.numItems);

    // Sphere
    gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        spherePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // gl.bindBuffer(gl.ARRAY_BUFFER, sphereColorBuffer);
    // gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
    //     sphereColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Set the color to white for the whole sphere
    gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);
    gl.vertexAttrib4f(shaderProgram.vertexColorAttribute,1,1,1,1);
    gl.drawArrays(gl.LINES, 0, spherePositionBuffer.numItems);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}



// ~ End webGLStart() .........................................................
tick()
}