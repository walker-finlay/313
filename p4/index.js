<<<<<<< HEAD
import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

window.AllTheStuff = async function AllTheStuff() {
/**
 * All the webGL stuff
 */
var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;

// Methods --------------------------------------
function tick() {
    requestAnimFrame(tick); 
    tools.resize(canvas);
    drawScene();
}

// ~ Start WebGL ..............................................................
// Create the GL viewport
var gl = tools.initGL(canvas);
// Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);
 

// Points ---------------------------------------
// Textures & Colors ----------------------------
// Initbuffers ----------------------------------

// Drawing --------------------------------------
//Set the background color to opaque black
gl.clearColor(0.0, 0.0, 0.0, 1.0);
//Render only pixels in front of the others.
gl.enable(gl.DEPTH_TEST);

// Outside drawScene()
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// ~ End webGLStart() .........................................................
tick()
}
=======
window.webGLStart = () => {
    console.log('sip');
};
>>>>>>> p4 setup
