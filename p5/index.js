import * as tools from "../lib/toolsv3.js"
import * as mat3 from "../lib/mat3.js"
import * as mat4 from "../lib/mat4.js"
import LoadPLY from "./plyParserV2.js";
import hexRgb from "../lib/hex-rgb.js";
import rgbHex from "../lib/rgb-hex.js";

window.AllTheStuff = async function AllTheStuff() {
/**
 * All the webGL stuff
 */

var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;
const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque white

var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;

// Mouse event stuff ----------------------------
let mouseclick = false;
let downCoords = [0, 0];
let rect = canvas.getBoundingClientRect();
let delta = [0, 0];
let zoom = -35;

let sceneRotate = mat4.create();
let mouseRotate = mat4.create();

let model1draw = document.getElementById('model1draw');
let model2draw = document.getElementById('model2draw');

let ambientcolor = document.getElementById('ambientcolor');
let directionalcolor = document.getElementById('directionalcolor');

let xlight = document.getElementById('xlight')
let ylight = document.getElementById('ylight')
let zlight = document.getElementById('zlight')

model1draw.addEventListener('change', () => {bunny.draw = !bunny.draw;});
model2draw.addEventListener('change', () => {teapot.draw = !teapot.draw});

ambientcolor.addEventListener('input', e => {
    let color = hexRgb(e.target.value);
    gl.uniform3f(shaderProgram.ambientColorUniform, 
        color.red/255, color.green/255, color.blue/255);
});

directionalcolor.addEventListener('input', e => {
    let color = hexRgb(e.target.value);
    gl.uniform3f(shaderProgram.directionalColorUniform, 
        color.red/255, color.green/255, color.blue/255);
});

document.querySelectorAll('.direction').forEach(slider => {
    slider.addEventListener('input', () => {
        gl.uniform3f(shaderProgram.lightingDirectionUniform, 
            xlight.value, ylight.value, zlight.value);
    });
});

document.getElementById('random').addEventListener('click', () => {
    let rand = {red: Math.random(), green: Math.random(), blue: Math.random()}
    gl.uniform3f(shaderProgram.ambientColorUniform, 
        rand.red, rand.green, rand.blue);
    ambientcolor.value = '#' + rgbHex(rand.red*255, rand.green*255, rand.blue*255);

    rand = {red: Math.random(), green: Math.random(), blue: Math.random()}
    gl.uniform3f(shaderProgram.directionalColorUniform, 
        rand.red, rand.green, rand.blue);
    directionalcolor.value = '#' + rgbHex(rand.red*255, rand.green*255, rand.blue*255);
});

canvas.addEventListener('mousemove', e => {
    if (mouseclick) {
        window.requestAnimationFrame(() => {
                delta = [
                    (e.clientX-rect.left)-downCoords[0], 
                    (e.clientY-rect.top)-downCoords[1]
                ];
                downCoords = [e.clientX-rect.left, e.clientY-rect.top];
        
                // Rotate the scene
                mat4.fromYRotation(mouseRotate, tools.degToRad(delta[0]));
                mat4.rotate(mouseRotate, mouseRotate, tools.degToRad(delta[1]), [1, 0, 0]);
                mat4.multiply(sceneRotate, mouseRotate, sceneRotate);
            
        });
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
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix, normalMatrix);
}

function tryDrawPly(plyObject) {
    if (plyObject.buffers && plyObject.draw) {
        gl.bindBuffer(gl.ARRAY_BUFFER, plyObject.buffers.vPosBuf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            plyObject.buffers.vPosBuf.itemSize, gl.FLOAT, false, 0, 0);    
        
        gl.bindBuffer(gl.ARRAY_BUFFER, plyObject.buffers.vNrmBuf);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
            plyObject.buffers.vNrmBuf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, plyObject.buffers.vTexBuf);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, plyObject.buffers.vTexBuf.itemSize, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix, normalMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, plyObject.buffers.vPosBuf.numItems);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

// ~ Start WebGL ..............................................................
// Create the GL viewport
window.gl = tools.initGL(canvas);
// Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);
gl.lineWidth(0.5);
 
const whiteTexture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

// Drawing --------------------------------------
//Set the background color to opaque black
gl.clearColor(0.0, 0.0, 0.0, 1.0);
//Render only pixels in front of the others.
gl.enable(gl.DEPTH_TEST);

// Outside drawScene()
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var normalMatrix = mat3.create();

mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

let bunny = {draw: true, buffers: null};
let teapot = {draw: true, buffers: null};

gl.uniform1i(shaderProgram.useLightingUniform, 1);
gl.uniform3f(shaderProgram.ambientColorUniform, 0.0, 0.0, 0.0);
gl.uniform3f(shaderProgram.lightingDirectionUniform, 0.0, 0.5, 0.5);
gl.uniform3f(shaderProgram.directionalColorUniform, 1.0, 1.0, 1.0); // FIXME: should be 1,1,1

gl.uniform1f(shaderProgram.lightSpecUniform, 1.0);
gl.uniform1f(shaderProgram.matSpecUniform, 1.0);
gl.uniform1f(shaderProgram.matShineUniform, 9.5);

// gl.enable(gl.SAMPLE_COVERAGE);
function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    resetMv();

    tryDrawPly(bunny);
    mat4.translate(mvMatrix, mvMatrix, [-7, -2, 2]);
    mat4.rotate(mvMatrix, mvMatrix, -Math.PI/2 , [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, Math.PI/4 , [0, 0, 1]);
    tryDrawPly(teapot);
}


// ~ End webGLStart() .........................................................
LoadPLY('teapot.ply', 1.0, plyBufferObject => {
    teapot.buffers = plyBufferObject;
    LoadPLY('bunny/reconstruction/bun_zipper.ply', 60, plyBufferObject => {
        bunny.buffers = plyBufferObject;
    });
});
tick();
}