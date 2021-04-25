import * as tools from "../lib/toolsv4.js"
import * as mat3 from "../lib/mat3.js"
import * as vec3 from "../lib/vec3.js";
import * as mat4 from "../lib/mat4.js"
import LoadPLY from "./plyParserV2.js";
import hexRgb from "../lib/hex-rgb.js";
import rgbHex from "../lib/rgb-hex.js";

window.AllTheStuff = async function AllTheStuff() {
/**
 * All the webGL stuff
 */

var pointLightPos = [0, 0, 1000];
var pointLightRot = 0;
var LightRotSpeed = 0.5; 

var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;
const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque white

var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;

// Program parameters --------------------------------
let zoom = -35;

// Input handlers stuff ------------------------------
let mouseclick = false;
let downCoords = [0, 0];
let rect = canvas.getBoundingClientRect();
let delta = [0, 0];

let sceneRotate = mat4.create();
let mouseRotate = mat4.create();

let model1draw = document.getElementById('model1draw');
let model2draw = document.getElementById('model2draw');

let ambientcolor = document.getElementById('ambientcolor');
let directionalcolor = document.getElementById('directionalcolor');
let ptlightcolor = document.getElementById('ptlightcolor');

let xlight = document.getElementById('xlight')
let ylight = document.getElementById('ylight')
let zlight = document.getElementById('zlight')

let model1tex = document.getElementById('model1tex');
let model2tex = document.getElementById('model2tex');

let usePerFrag = document.getElementById('usePerFrag');
let perFragmentLighting = usePerFrag.checked;
usePerFrag.addEventListener('change', () => {
    perFragmentLighting = !perFragmentLighting

    if (perFragmentLighting) {
        shaderProgram = perFragmentProgram;
    } else {
        shaderProgram = perVertexProgram;
    }
    gl.useProgram(shaderProgram);
    setUniforms();
});

model1draw.addEventListener('change', () => {bunny.draw = !bunny.draw;});
model2draw.addEventListener('change', () => {teapot.draw = !teapot.draw});

model1tex.addEventListener('change', () => {bunny.tex = !bunny.tex;})
model2tex.addEventListener('change', () => {teapot.tex = !teapot.tex;})

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

ptlightcolor.addEventListener('input', e => {
    window.requestAnimationFrame(() => {
        let color = hexRgb(e.target.value);
        gl.uniform3f(shaderProgram.ptLightColorUniform,
            color.red/255, color.green/255, color.blue/255);
        const lspx = new Uint8Array([color.red, color.green, color.blue, 255]);
        gl.bindTexture(gl.TEXTURE_2D, lstex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
                1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lspx);
    });
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

function tick() {
    window.requestAnimationFrame(tick);
    tools.resize(canvas);
    drawScene();
    // animate();
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
        if (plyObject.tex) {
            gl.bindTexture(gl.TEXTURE_2D, actualTexture);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
        }
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix, normalMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, plyObject.buffers.vPosBuf.numItems);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

function setUniforms() {
    gl.uniform1i(shaderProgram.useLightingUniform, 1);
    gl.uniform3f(shaderProgram.ambientColorUniform, 0.0, 77/255, 29/255);
    gl.uniform3f(shaderProgram.lightingDirectionUniform, -1.0, 0.5, 0.5);
    gl.uniform3f(shaderProgram.directionalColorUniform, 134/255, 6/255, 232/255);
    gl.uniform3f(shaderProgram.ptLightColorUniform, 1.0, 0.0, 0.0);

    gl.uniform1f(shaderProgram.lightSpecUniform, 0.75);
    gl.uniform1f(shaderProgram.matSpecUniform, 0.75);
    gl.uniform1f(shaderProgram.matShineUniform, 30.0);
}

// ~ Start WebGL ..............................................................
// Create the GL viewport
window.gl = tools.initGL(canvas);
// Load the shaders and buffers into the GPU
let perVertexProgram = tools.createProgram('shader-vs', 'shader-fs');
let perFragmentProgram = tools.createProgram('perfrag-shader-vs', 'perfrag-shader-fs');
let shaderProgram = perFragmentProgram;
gl.lineWidth(0.5);

// Stuff that gets drawn ------------------------
let vx = Math.random()*0.5;
let vy = Math.random()*0.5;
let xMin = -10;
let xMax = 10;
let yMin = -10;
let yMax = 10; 
let squarePositions = [   xMin, yMax, 0,    xMax, yMax, 0,
                        xMax, yMin, 0,    xMin, yMin, 0];

let lightSourceCoords = [(Math.random()*20)-10, (Math.random()*20)-10, 0];
const lspx = new Uint8Array([255, 0, 0, 255]);  // colored pixel for light source
const lstex = gl.createTexture()                // texture for light source 
gl.bindTexture(gl.TEXTURE_2D, lstex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lspx);

const lightSource = new tools.glSphere(0.5, true);
let lightSourcePositionBuffer = tools.initBuffer(lightSource.sVertices, 3, lightSource.numItems);
let lightSourceTextureBuffer = tools.initBuffer(lightSource.textureCoords, 2, lightSource.stacks*(lightSource.slices + 1)*2);
let squarePositionBuffer = tools.initBuffer(squarePositions, 3, 4);

const whiteTexture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

const actualTexture = tools.initTexture('images/njd.jpeg');

let bunny = {draw: true, buffers: null, tex: false};
let teapot = {draw: true, buffers: null, tex: false};

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

// Initial conditions
gl.uniform1i(shaderProgram.useLightingUniform, 1);
gl.uniform3f(shaderProgram.ambientColorUniform, 0.0, 77/255, 29/255);
gl.uniform3f(shaderProgram.lightingDirectionUniform, -1.0, 0.5, 0.5);
gl.uniform3f(shaderProgram.directionalColorUniform, 134/255, 6/255, 232/255);
gl.uniform3f(shaderProgram.ptLightColorUniform, 1.0, 0.0, 0.0);

gl.uniform1f(shaderProgram.lightSpecUniform, 5.0);
gl.uniform1f(shaderProgram.matSpecUniform, 5.0);
gl.uniform1f(shaderProgram.matShineUniform, 30.0);

// gl.enable(gl.SAMPLE_COVERAGE);
function drawScene() {
    // Tell webGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Clear the canvas and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    resetMv();

    // PLY Models 
    gl.uniform1i(shaderProgram.useLightingUniform, 1);
    tryDrawPly(bunny);
    mat4.translate(mvMatrix, mvMatrix, [-7, -2, 2]);
    mat4.rotate(mvMatrix, mvMatrix, -Math.PI/2 , [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, Math.PI/4 , [0, 0, 1]);
    tryDrawPly(teapot);

    gl.uniform1i(shaderProgram.useLightingUniform, 0);
    // Square stuff
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, -20]);
    gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        squarePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix, normalMatrix);
    gl.drawArrays(gl.LINE_LOOP, 0, squarePositionBuffer.numItems);

    // Light source stuff
    mat4.translate(mvMatrix, mvMatrix, [lightSourceCoords[0]+vx, lightSourceCoords[1]+vy, 0]);
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix, normalMatrix);

    mat4.getTranslation(lightSourceCoords, mvMatrix);
    if (lightSourceCoords[0] >= xMax || lightSourceCoords[0] <= xMin) {vx *= -1}
    if (lightSourceCoords[1] >= yMax || lightSourceCoords[1] <= yMin) {vy *= -1}

    gl.bindBuffer(gl.ARRAY_BUFFER, lightSourcePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        lightSourcePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, lightSourceTextureBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, lightSourceTextureBuffer.itemSize,
        gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lstex);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, lightSourcePositionBuffer.numItems);
    gl.uniform3f(shaderProgram.ptLightPosUniform, lightSourceCoords[0], lightSourceCoords[1], 0);
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