<<<<<<< HEAD
<<<<<<< HEAD
import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"
=======
import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"
import LoadPLY from "./plyParserV2.js";
>>>>>>> we got models

window.AllTheStuff = async function AllTheStuff() {
/**
 * All the webGL stuff
 */
<<<<<<< HEAD
=======

var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;
const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque white

>>>>>>> we got models
var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;

<<<<<<< HEAD
// Methods --------------------------------------
function tick() {
    requestAnimFrame(tick); 
    tools.resize(canvas);
    drawScene();
=======
// Mouse event stuff ----------------------------
let mouseclick = false;
let downCoords = [0, 0];
let rect = canvas.getBoundingClientRect();
let delta = [0, 0];
let zoom = -55;

let sceneRotate = mat4.create();
let mouseRotate = mat4.create();

canvas.addEventListener('mousemove', e => {
    if (mouseclick) {
        delta = [
            (e.clientX-rect.left)-downCoords[0], 
            (e.clientY-rect.top)-downCoords[1]
        ];
        downCoords = [e.clientX-rect.left, e.clientY-rect.top];

        // Rotate the scene
        mat4.fromYRotation(mouseRotate, tools.degToRad(delta[0]/2));
        mat4.rotate(mouseRotate, mouseRotate, tools.degToRad(delta[1]/2), [1, 0, 0]);
        mat4.multiply(sceneRotate, mouseRotate, sceneRotate);
    }
});
canvas.addEventListener('mousedown', e => {
    mouseclick = true;
    downCoords = [e.clientX-rect.left, e.clientY-rect.top];
});
canvas.addEventListener('mouseup', e => {
    delta = [0, 0];
    mouseclick = false;
});
canvas.addEventListener('mouseleave', e => {
    delta = [0, 0];
    mouseclick = false;
});
document.addEventListener('change', e => {
    let planet = eval(e.target.id);
    planet.draw = !planet.draw;
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
    window.requestAnimationFrame(tick);
    tools.resize(canvas);
    drawScene();
    animate();
}

function resetMv() {
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, zoom]);
    mat4.multiply(mvMatrix, mvMatrix, sceneRotate);
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);
>>>>>>> we got models
}

// ~ Start WebGL ..............................................................
// Create the GL viewport
<<<<<<< HEAD
var gl = tools.initGL(canvas);
// Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);
 

// Points ---------------------------------------
// Textures & Colors ----------------------------
// Initbuffers ----------------------------------
=======
window.gl = tools.initGL(canvas);
// Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);
gl.lineWidth(0.5);
 
const whiteTexture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
>>>>>>> we got models

// Drawing --------------------------------------
//Set the background color to opaque black
gl.clearColor(0.0, 0.0, 0.0, 1.0);
//Render only pixels in front of the others.
gl.enable(gl.DEPTH_TEST);

// Outside drawScene()
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

<<<<<<< HEAD
=======
let bunny;
gl.enable(gl.SAMPLE_COVERAGE);
>>>>>>> we got models
function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
<<<<<<< HEAD
}

// ~ End webGLStart() .........................................................
tick()
}
=======
window.webGLStart = () => {
    console.log('sip');
};
>>>>>>> p4 setup
=======
    resetMv();

    if (bunny) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bunny.vPosBuf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            bunny.vPosBuf.itemSize, gl.FLOAT, false, 0, 0);    

        gl.bindBuffer(gl.ARRAY_BUFFER, bunny.vTexBuf);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, bunny.vTexBuf.itemSize, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, bunny.vPosBuf.numItems);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}


// ~ End webGLStart() .........................................................
LoadPLY('bunny/reconstruction/bun_zipper.ply', plyObject => {bunny = plyObject;});
tick();
}
>>>>>>> we got models
