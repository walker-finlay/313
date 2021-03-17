import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

window.AllTheStuff = async function AllTheStuff() {
/**
 * All the webGL stuff
 */

var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;

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

var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;
//Create the GL viewport
var gl = tools.initGL(canvas);
///Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);
 

// Points ---------------------------------------
let sphere = new tools.glSphere(1);

// Textures -------------------------------------
var worldTexture = tools.initTexture("/p3/images/worldMap.gif");

// texture coords
let stacks = sphere.stacks;
let slices = sphere.slices;
var textureCoords = [];
for(let t = 0 ; t < stacks ; t++ )	{
	var phi1 = ( (t)/stacks );
	var phi2 = ( (t+1)/stacks );
	for(let p = 0 ; p < slices+1 ; p++ ){
		var theta = 1 - ( (p)/slices );
		textureCoords = textureCoords.concat([theta, phi1]);
		textureCoords = textureCoords.concat([theta, phi2]);
	}
}

// Initbuffers ----------------------------------
let spherePositionBuffer = tools.initBuffer(sphere.sVertices, 3, sphere.numItems);
let sphereVertexTextureCoordBuffer = tools.initBuffer(textureCoords, 2, stacks*(slices+1)*2);
// let sphereColorBuffer = tools.initBuffer(sphere.sColors, 4, sphere.numItems);

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
mat4.translate(mvMatrix, mvMatrix, [0, 0, -5]);
mat4.rotate(mvMatrix, mvMatrix, Math.PI/1.4, [1,0,0]);
mat4.rotate(mvMatrix, mvMatrix, Math.PI, [0,0,1]);


function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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