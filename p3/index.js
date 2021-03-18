import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

window.AllTheStuff = async function AllTheStuff() {
/**
 * All the webGL stuff
 */

var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;

var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;

// Mouse event stuff ----------------------------
let mouseCoords = document.getElementById('mouseCoords');
let drag_delta = document.getElementById('delta');
let mouseclick = false;
let downCoords = [0, 0];
let rect = canvas.getBoundingClientRect();
let delta = [0, 0];

let sceneRotate = mat4.create();
let mouseRotate = mat4.create();

canvas.addEventListener('mousemove', e => {
    mouseCoords.innerHTML = 
        `${e.clientX - rect.left}, ${e.clientY - rect.top}`;
    if (mouseclick) {
        delta = [
            (e.clientX-rect.left)-downCoords[0], 
            (e.clientY-rect.top)-downCoords[1]
        ];
        drag_delta.innerHTML = `${delta[0]}, ${delta[1]}`;

        // Rotate the scene
        mat4.fromYRotation(mouseRotate, tools.degToRad(delta[0]/50));
        mat4.rotate(mouseRotate, mouseRotate, tools.degToRad(delta[1]/50), [1, 0, 0]);
        mat4.multiply(sceneRotate, mouseRotate, sceneRotate);
    }
});
canvas.addEventListener('mousedown', e => {
    mouseclick = true;
    downCoords = [e.clientX-rect.left, e.clientY-rect.top];
    clickt.innerHTML = 'true';
});
canvas.addEventListener('mouseup', e => {
    // mat4.identity(sceneRotate);
    delta = [0, 0];
    mouseclick = false;
    clickt.innerHTML = 'false';
});
canvas.addEventListener('mouseleave', e => {
    delta = [0, 0];
    mouseclick = false;
    clickt.innerHTML = 'false';
});

// Methods --------------------------------------
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
//Create the GL viewport
var gl = tools.initGL(canvas);
///Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);
 

// Points ---------------------------------------
let sphere = new tools.glSphere(4, true);
let axPositions =  [1, 0, 0,    0, 0, 0,
                    0, 1, 0,    0, 0, 0,
                    0, 0, 1,    0, 0, 0,];

// Textures & Colors ----------------------------
var worldTexture = tools.initTexture("/p3/images/worldMap.gif");
let axColors = [1, 0, 0,    1, 0, 0,
                0, 1, 0,    0, 1, 0,
                0, 0, 1,    0, 0, 1,]

// Initbuffers ----------------------------------
let spherePositionBuffer = tools.initBuffer(sphere.sVertices, 3, sphere.numItems);
let sphereVertexTextureCoordBuffer = tools.initBuffer(sphere.textureCoords, 2, sphere.stacks*(sphere.slices+1)*2);

let axPositionBuffer = tools.initBuffer(axPositions, 3, 6);
let axColorBuffer = tools.initBuffer(axColors, 3, 6);

// Drawing --------------------------------------
//Set the background color to opaque black
gl.clearColor(0.0, 0.0, 0.0, 1.0);
//Render only pixels in front of the others.
gl.enable(gl.DEPTH_TEST);

// Outside drawScene()
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, -15]);
    mat4.multiply(mvMatrix, mvMatrix, sceneRotate);
    mat4.rotate(mvMatrix, mvMatrix, Math.PI/2, [1,0,0]);
    mat4.rotate(mvMatrix, mvMatrix, Math.PI, [0,0,1]);
    
    // Sphere //
    gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        spherePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sphereVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, worldTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, spherePositionBuffer.numItems);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

// ~ End webGLStart() .........................................................
tick()
}