var gl;
let pi = 3.14159265359;

let polarPointData;
let polarColorData;

let lineBlastPositionData;
let lineBlastColorData;

async function getMyData() {
    // Polar curve stuff ------------------------------------------------------
    let getPP = $.getJSON('points.json', data => {
        polarPointData = data;
    })
    .done(() => { 
        console.log(`Points loaded`)
    })
    .fail(() => {
        console.log("Error loading points")
    });
    let getPC = $.getJSON('colors.json', data => {
        polarColorData = data;
    })
    .done(() => {
        console.log("Colors loaded")
    })
    .fail(() => {
        console.log("Error loading colors")
    });
    // Line blast stuff -------------------------------------------------------
    let getLBP = $.getJSON('line_points.json', data => {
        lineBlastPositionData = data;
    })
    .done(() => { 
        console.log(`Blast points loaded`)
    })
    .fail(() => {
        console.log("Error loading points")
    });
    let getLBC = $.getJSON('line_colors.json', data => {
        lineBlastColorData = data;
    })
    .done(() => {
        console.log("Blast colors loaded")
    })
    .fail(() => {
        console.log("Error loading colors")
    });
    await Promise.all([getPP, getPC, getLBP, getLBC])
    webGLStart(); // There's probably a better way to do this async stuff
}

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL");
    }
}

function getShader(gl, id) {
    //Load the shader code by it's ID, as assigned in
    //the script element (e.g. "shader-fs" or "shader-vs")
    var shaderScript = document.getElementById(id);
        if (!shaderScript) { return null; }

    var k = shaderScript.firstChild;
    var str = "";
    //While firstChild exists
    while (k) {
    ///If the firstChild is a TEXT type document
        if (k.nodeType == 3) {
            //Append the text to str.
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    //Now we have the type and the code, and we 
    //provide it to WebGL as such, then compile the shader
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    //If the compilation of the shader code fails, report 
    //and return nothing, since the shader failed to compile.
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`${id}\n${gl.getShaderInfoLog(shader)}`);
        return null;
    }

    //If there were no errors, return the compiled shader.
    return shader;
}

var shaderprogram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    //Create the program, then attach and link 
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    //Check for linker errors.
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    //Attach shaderprogram to openGL context.
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexPosition");

    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    //associate vertexColorAttribute with //internal shader variable aVertexColor
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");

    //identifies this as a second vertex attribute array for use when drawing
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    // send uniform data to the shaders
    shaderProgram.pMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

// Buffers for geometry & color
var triangleVertexPositionBuffer;
var triangleVertexColorBuffer;

var triLinePositionBuffer;		
var triLineColorBuffer;

let lineStripBuffer;

let lineLoopBuffer;

let polarPointBuffer;
let polarColorBuffer;

let pointPositionBuffer;
let pointColorBuffer;

let lineBlastPositionBuffer;
let lineBlastColorBuffer;

//We will Generate the geometry with this function
function initBuffers() {
    // Triangle ---------------------------------------------------------------
    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    var vertices = [
                 0.0,  1.0,  -4.0,
                -1.0, -1.0,  -4.0,
                 1.0, -1.0,  -4.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;

    //this holds the colors
    triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    var colors = [  1.0,  0.0,  0.0, 1,
                    0.0,  1.0,  0.0, 1,
                    0.0,  0.0,  1.0, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = 3;

    // Axes -------------------------------------------------------------------
    triLinePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triLinePositionBuffer);
    vertices = [	-10.0,  0.0,  0.0,    10.0,  0.0,  0.0,     // x
                    0.0,  -0.5,  0.0,    0.0,   0.0,  0.0,     // y
                    0.0,  0.0,  -10.0,    0.0,  0.0,  10.0 ];   // z
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triLinePositionBuffer.itemSize = 3; 
    triLinePositionBuffer.numItems = 6;
    triLineColorBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, triLineColorBuffer);
    colors = [	1.0,  0.0,  0.0, 1, 1.0,  0.0,  0.0, 1, 
                0.0,  1.0,  0.0, 1, 0.0,  1.0,  0.0, 1,
                0.0,  0.0,  1.0, 1, 0.0,  0.0,  1.0, 1 ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triLineColorBuffer.itemSize = 4;	
    triLineColorBuffer.numItems = 6;

    // Line strip -------------------------------------------------------------
    lineStripBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineStripBuffer);
    vertices = [
        -2.0,    1.0,    -2.0,
        -3.0,   -1.0,    -2.0,
        -1.0,   -1.0,    -2.0,];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    lineStripBuffer.itemSize = 3;
    lineStripBuffer.numItems = 3;

    // Line loop --------------------------------------------------------------
    lineLoopBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineLoopBuffer);
    vertices = [
        4.0,    1.0,    -2.0,
        3.0,   -1.0,    -2.0,
        5.0,   -1.0,    -2.0,];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    lineLoopBuffer.itemSize = 3;
    lineLoopBuffer.numItems = 3;

    // Polar fan stuff --------------------------------------------------------
    polarPointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, polarPointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(polarPointData), gl.STATIC_DRAW);
    polarPointBuffer.itemSize = 3;
    polarPointBuffer.numItems = 1001;
    polarColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, polarColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(polarColorData), gl.STATIC_DRAW);
    polarColorBuffer.itemSize = 3;
    polarColorBuffer.numItems = 1001;

    // Points -----------------------------------------------------------------
    pointPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
    vertices = [1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    pointPositionBuffer.itemSize = 3;
    pointPositionBuffer.numItems = 1;

    pointColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer);
    colors = [1.0, 1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    pointColorBuffer.itemSize = 4;
    pointColorBuffer.numItems = 1;

    // Line blast stuff
    lineBlastPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBlastPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineBlastPositionData), gl.STATIC_DRAW);
    lineBlastPositionBuffer.itemSize = 3;
    lineBlastPositionBuffer.numItems = 1000;

    lineBlastColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBlastColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineBlastColorData), gl.STATIC_DRAW);
    lineBlastColorBuffer.itemSize = 4;
    lineBlastColorBuffer.numItems = 1000;
}

//Here we connect the uniform matrices 

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var mvMatrix = glMatrix.mat4.create();
var pMatrix = glMatrix.mat4.create();

function drawScene() {
    // Viewport stuff
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Projection matrices
    glMatrix.mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    // glMatrix.mat4.identity(mvMatrix);
    glMatrix.mat4.fromYRotation(mvMatrix, pi/10);
    glMatrix.mat4.rotateX(mvMatrix, mvMatrix, pi/10);
    // glMatrix.mat4.rotateY(mvMatrix, mvMatrix, pi/4);
    glMatrix.mat4.translate(mvMatrix, mvMatrix, [1, -2, -2]);

    setMatrixUniforms();

    // Triangle ---------------------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
        triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    //set color attribute in vertex shader	
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
        triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // void gl.drawArrays(mode, first, count);
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);   
    
    // Axes -------------------------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, triLinePositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
        triLinePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triLineColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        triLineColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, triLinePositionBuffer.numItems);

    // Line strip -------------------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, lineStripBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        lineStripBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_STRIP, 0, lineStripBuffer.numItems);

    // Line Loop --------------------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, lineLoopBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        lineLoopBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_LOOP, 0, lineLoopBuffer.numItems);

    // Polar curve ------------------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, polarPointBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        polarPointBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, polarColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        polarColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, polarPointBuffer.numItems);

    // Points -----------------------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        pointPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, pointColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        pointColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, pointPositionBuffer.numItems);

    // Line blast -------------------------------------------------------------
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBlastPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        lineBlastPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBlastColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        lineBlastColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, lineBlastPositionBuffer.numItems);
}

function webGLStart() {
    var canvas = document.getElementById("webGLcanvas");

    canvas.width = window.innerWidth-20;
    canvas.height = window.innerHeight-20;
        
    //Create the GL viewport
    initGL(canvas);

    ///Load the shaders and buffers into the GPU
    initShaders();
    initBuffers();

    //Set the background color to opaque black
    gl.clearColor(0.3, 0.0, 0.4, 1.0);

    //Render only pixels in front of the others.
    gl.enable(gl.DEPTH_TEST);

    //render the scene
    console.log("Drawing");
    drawScene();
}
