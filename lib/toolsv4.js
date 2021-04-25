var gl;
import * as mat3 from './mat3.js'
export {initGL, createProgram, initBuffer, 
    getMyData, setMatrixUniforms, roundDown, degToRad,
    resize, glSphere, Planet, initTexture, getCircle}

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
        alert(`${id}\n${gl.getShaderInfoLog(shader)}`);
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

function createProgram(vertexShaderID, fragmentShaderID) {
    var fragmentShader = getShader(gl, vertexShaderID); // FIXME: and here (prob)
    var vertexShader = getShader(gl, fragmentShaderID);

    //Create the program, then attach and link 
    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader); // FIXME: Problems here
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    //Check for linker errors.
    if ( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS) ) {
        var info = gl.getProgramInfoLog(shaderProgram);
        throw 'Could not compile WebGL program. \n\n' + info;
    }

    // Attach shaderprogram to openGL context.
    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute); // attributes must be enabled

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    // Used in setMatrixUniforms()
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    // Texturing
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    // Lighting
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");

    shaderProgram.lightSpecUniform = gl.getUniformLocation(shaderProgram, "light_specularity");
    shaderProgram.matSpecUniform = gl.getUniformLocation(shaderProgram, "material_specularity");
    shaderProgram.matShineUniform = gl.getUniformLocation(shaderProgram, "material_shine");

    shaderProgram.ptLightPosUniform = gl.getUniformLocation(shaderProgram, "uPtLightPos");
    shaderProgram.ptLightColorUniform = gl.getUniformLocation(shaderProgram, "uPtLightColor");
    return shaderProgram;
}

 /**
  * Creates, binds, inserts data, sets props (itemSize and numItems) for `WebGLBuffer` object
  * @param {Object} data A list of data points
  * @param {Number} is itemSize
  * @param {Number} ni numItems
  * @param {GLenum} drawingMode A `GLenum` specifying drawing type
  */
function initBuffer(data, is, ni, drawingMode=gl.STATIC_DRAW) {
    let vbo = gl.createBuffer(); /* Vertex buffer object (VBO) */
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), drawingMode);
    vbo.itemSize = is;    // Item size
    vbo.numItems = ni;    // Num items
    return vbo;
}

// Here we connect the uniform matrices 
function setMatrixUniforms(shaderProgram, mvMatrix, pMatrix, normalMatrix) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    mat3.normalFromMat4(normalMatrix, mvMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function roundDown(num) {
    return Number.parseFloat(num).toFixed(2)
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}    

function resize(canvas){
	var dispWidth = window.innerWidth-20;	  //browser width
	var dispHeight = (window.innerHeight)-20;  //browser height

    //check if the canvas is not the same size
	if (canvas.width != dispWidth || canvas.height != dispHeight) {
        canvas.width = dispWidth;   // FIXME: This doesn't work, it just scales the image
		canvas.height = dispHeight; // Might need to initGL again?
		gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}
}

class glSphere {
    /**
     * # glSphere
     * This object contains points for a sphere drawn as a `gl.TRIANGE_STRIP`,
     * and optionally include texture coordinates. TODO- specify resolution?
     * @param {Number} radius `Number`
     * @param {Boolean} textureCoords `Boolean` Generate texture coordinates?
     */
    constructor(radius, textureCoords=false) {
        this.sRadius = radius; 
        this.slices = 25; 
        this.stacks = 12; 
        this.sVertices = []; 
        this.sColors = []; // TODO: figger this out
        this.numItems = (2*(this.slices+1)*this.stacks);
        this.textureCoords = textureCoords;

        // stacks are ELEVATION so they count theta
        for (let t = 0 ; t < this.stacks ; t++ ) { 
            var phi1 = ( (t)/this.stacks )*Math.PI;
            var phi2 = ( (t+1)/this.stacks )*Math.PI;
            for (let p = 0 ; p < this.slices +1 ; p++ ){ // slices are ORANGE SLICES so 					
                var theta = ( (p)/this.slices )*2*Math.PI ; 
                var xVal = this.sRadius * Math.cos(theta) * Math.sin(phi1);
                var yVal = this.sRadius * Math.sin(theta) * Math.sin(phi1);
                var zVal = this.sRadius * Math.cos(phi1);
                this.sVertices = this.sVertices.concat([ xVal, yVal, zVal ]);
                this.sColors = this.sColors.concat([Math.random(),Math.random(),Math.random(),1]);
                var xVal = this.sRadius * Math.cos(theta) * Math.sin(phi2);
                var yVal = this.sRadius * Math.sin(theta) * Math.sin(phi2);
                var zVal = this.sRadius * Math.cos(phi2);
                this.sVertices = this.sVertices.concat([ xVal, yVal, zVal ]);
                this.sColors = this.sColors.concat([Math.random(),Math.random(),Math.random(),1]);
            }
        }

        if (textureCoords) {
            this.textureCoords = [];
            for(let t = 0 ; t < this.stacks ; t++ )	{
                var phi1 = ( (t)/this.stacks );
                var phi2 = ( (t+1)/this.stacks );
                for(let p = 0 ; p < this.slices+1 ; p++ ){
                    var theta = 1 - ( (p)/this.slices );
                    this.textureCoords = this.textureCoords.concat([theta, phi1]);
                    this.textureCoords = this.textureCoords.concat([theta, phi2]);
                }
            }
        }
    }
}

class Planet extends glSphere {
    /**
     * 
     * @param {Number} radius Radius of the planet itself
     * @param {Number} orbit Radius of the orbit around the sun
     * @param {Number} omega Angular velocity in radians/second
     */
    constructor(radius, orbit, omega) {
        super(radius, true);
        this.orbit = orbit;
        this.cVertices = getCircle(orbit, 50);
        this.omega = omega;
        this.theta = Math.random();
        this.draw = true;
    }
}

function initTexture(path) {
    function handleLoadedTexture(texture) {
        // reads the texture image and saves 
        // it to the variable provided.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    let worldTexture = gl.createTexture();
	worldTexture.image = new Image();

	worldTexture.image.onload = function() {
		handleLoadedTexture(worldTexture)
	}

	worldTexture.image.src = path;
    return worldTexture;
}

function getCircle(radius, num_segments) {
    let circleVertices = [];
    for (let i = 0; i < num_segments; i++) {
        let x = radius * Math.cos(i / num_segments * 2 * Math.PI);
        let y = radius * Math.sin(i / num_segments * 2 * Math.PI);
        circleVertices = circleVertices.concat([x, y, 0]);
    }
    return circleVertices;
}