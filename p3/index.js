import * as tools from "../lib/tools.js"
import * as mat4 from "../lib/mat4.js"

window.AllTheStuff = async function AllTheStuff() {
/**
 * All the webGL stuff
 */

var lastTime = 0;	
var xRot = 0;		
var xSpeed = 30;
const pixel = new Uint8Array([127, 127, 127, 255]);  // opaque white

var canvas = document.getElementById("webGLcanvas");
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;

// Mouse event stuff ----------------------------
let mouseclick = false;
let downCoords = [0, 0];
let rect = canvas.getBoundingClientRect();
let delta = [0, 0];

let sceneRotate = mat4.create();
let mouseRotate = mat4.create();

canvas.addEventListener('mousemove', e => {
    if (mouseclick) {
        delta = [
            (e.clientX-rect.left)-downCoords[0], 
            (e.clientY-rect.top)-downCoords[1]
        ];

        // Rotate the scene
        mat4.fromYRotation(mouseRotate, tools.degToRad(delta[0]/50));
        mat4.rotate(mouseRotate, mouseRotate, tools.degToRad(delta[1]/50), [1, 0, 0]);
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
    requestAnimFrame(tick); 
    tools.resize(canvas);
    drawScene();
    animate();
}

function resetMv() {
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, -55]);
    mat4.multiply(mvMatrix, mvMatrix, sceneRotate);
    tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);
}

function drawSphere(spherePositionBuffer, worldTexture) {
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

function drawPlanet(p, pBuffer, texture) {
    if (p.draw) {
        p.theta += p.omega;
        mat4.rotateZ(mvMatrix, mvMatrix, p.theta);
        mat4.translate(mvMatrix, mvMatrix, [p.orbit, 0, 0]);
        tools.setMatrixUniforms(shaderProgram, mvMatrix, pMatrix);
        drawSphere(pBuffer, texture);
        resetMv();
    }
}

// ~ Start WebGL ..............................................................
// Create the GL viewport
var gl = tools.initGL(canvas);
// Load the shaders and buffers into the GPU
let shaderProgram;
shaderProgram = tools.initShaders(shaderProgram);
gl.lineWidth(0.5);
 

// Points ---------------------------------------
let bg = new tools.glSphere(60, true);
let sol = new tools.glSphere(4, true);
let mercury = new tools.Planet(0.5, 10, Math.random()/60);
let venus = new tools.Planet(0.5, 13, Math.random()/60);
let earth = new tools.Planet(0.5, 16, Math.random()/60);
let mars = new tools.Planet(0.5, 19, Math.random()/60);
let jupiter = new tools.Planet(2, 22, Math.random()/60);
let saturn = new tools.Planet(1.7, 26, Math.random()/60);
let uranus = new tools.Planet(1, 29, Math.random()/60);
let neptune = new tools.Planet(1, 32, Math.random()/60);
// Textures & Colors ----------------------------
let bgTexture = tools.initTexture('/p3/images/2k_stars.jpg');
var solTexture = tools.initTexture("/p3/images/2k_sun.jpg");
let mercuryTexture = tools.initTexture('/p3/images/2k_mercury.jpg');
let venusTexture = tools.initTexture('/p3/images/2k_venus_surface.jpg');
let earthTexture = tools.initTexture('/p3/images/2k_earth_daymap.jpg');
let marsTexture = tools.initTexture('/p3/images/2k_mars.jpg');
let jupiterTexture = tools.initTexture('/p3/images/2k_jupiter.jpg');
let saturnTexture = tools.initTexture('/p3/images/2k_saturn.jpg');
let uranusTexture = tools.initTexture('/p3/images/2k_uranus.jpg');
let neptuneTexture = tools.initTexture('/p3/images/2k_neptune.jpg');
// Initbuffers ----------------------------------
let bgPositionBuffer = tools.initBuffer(bg.sVertices, 3, bg.numItems);
let solPositionBuffer = tools.initBuffer(sol.sVertices, 3, sol.numItems);
let sphereVertexTextureCoordBuffer = tools.initBuffer(sol.textureCoords, 2, sol.stacks*(sol.slices+1)*2);
let earthPositionBuffer = tools.initBuffer(earth.sVertices, 3, earth.numItems);
let earthOrbitBuffer = tools.initBuffer(earth.cVertices, 3, earth.cVertices.length/3);
let mercuryPositionBuffer = tools.initBuffer(mercury.sVertices, 3, mercury.numItems);
let mercuryOrbitBuffer = tools.initBuffer(mercury.cVertices, 3, mercury.cVertices.length/3);
let venusPositionBuffer = tools.initBuffer(venus.sVertices, 3, venus.numItems);
let venusOrbitBuffer = tools.initBuffer(venus.cVertices, 3, venus.cVertices.length/3);
let marsPositionBuffer = tools.initBuffer(mars.sVertices, 3, mars.numItems);
let marsOrbitBuffer = tools.initBuffer(mars.cVertices, 3, mars.cVertices.length/3);
let jupiterPositionBuffer = tools.initBuffer(jupiter.sVertices, 3, jupiter.numItems);
let jupiterOrbitBuffer = tools.initBuffer(jupiter.cVertices, 3, jupiter.cVertices.length/3);
let saturnPositionBuffer = tools.initBuffer(saturn.sVertices, 3, saturn.numItems);
let saturnOrbitBuffer = tools.initBuffer(saturn.cVertices, 3, saturn.cVertices.length/3);
let uranusPositionBuffer = tools.initBuffer(uranus.sVertices, 3, uranus.numItems);
let uranusOrbitBuffer = tools.initBuffer(uranus.cVertices, 3, uranus.cVertices.length/3);
let neptunePositionBuffer = tools.initBuffer(neptune.sVertices, 3, neptune.numItems);
let neptuneOrbitBuffer = tools.initBuffer(neptune.cVertices, 3, neptune.cVertices.length/3);


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

    drawSphere(bgPositionBuffer, bgTexture);
    drawSphere(solPositionBuffer, solTexture);

    drawPlanet(mercury, mercuryPositionBuffer, mercuryTexture);
    drawPlanet(venus, venusPositionBuffer, venusTexture);
    drawPlanet(earth, earthPositionBuffer, earthTexture);
    drawPlanet(mars, marsPositionBuffer, marsTexture);
    drawPlanet(jupiter, jupiterPositionBuffer, jupiterTexture);
    drawPlanet(saturn, saturnPositionBuffer, saturnTexture);
    drawPlanet(uranus, uranusPositionBuffer, uranusTexture);
    drawPlanet(neptune, neptunePositionBuffer, neptuneTexture);

    // Circle //
    function drawOrbit(circlePositionBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, circlePositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, circlePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_LOOP, 0, circlePositionBuffer.numItems);
    }

    // FIXME: Problems here with textures - find a way to undo this
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
    //     1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    drawOrbit(mercuryOrbitBuffer);
    drawOrbit(venusOrbitBuffer);
    drawOrbit(earthOrbitBuffer);
    drawOrbit(marsOrbitBuffer);
    drawOrbit(jupiterOrbitBuffer);
    drawOrbit(saturnOrbitBuffer);
    drawOrbit(uranusOrbitBuffer);
    drawOrbit(neptuneOrbitBuffer);
}

// ~ End webGLStart() .........................................................
tick()
}