var gl;
export {initGL, initShaders, initBuffer, 
    getMyData, setMatrixUniforms, roundDown}

async function getMyData(filename) {
    return $.getJSON(filename)
    .done(() => {
        console.log(`Fetched ${filename} successfully`)
    })
    .fail(err => {
        console.log(`Error fetching ${filename}: ${err}`)
    });
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
    return gl;
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

function initShaders(shaderProgram) {
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
    return shaderProgram;
}

/**
 * Creates, binds, inserts data, sets props (itemSize and numItems) for WebGLBuffer object
 * @param data Should be an array of data (points, colors) like [...]
 * @param drawingMode 
 * @param is itemSize - didn't want to cause confusion with naming
 * @param ni numItems
 */
function initBuffer(data, drawingMode, is, ni) {
    let vbo = gl.createBuffer(); /* Vertex buffer object (VBO) */
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), drawingMode);
    vbo.itemSize = is;    // Item size
    vbo.numItems = ni;    // Num items
    return vbo;
}

// Here we connect the uniform matrices 
function setMatrixUniforms(shaderProgram, mvMatrix, pMatrix) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function roundDown(num) {
    return Number.parseFloat(num).toFixed(2)
}