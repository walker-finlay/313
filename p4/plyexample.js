
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                         //
//         ##  ######        ########  ##       ##    ##       ########     ###    ########   ######  ######## ########    //
//         ## ##    ##       ##     ## ##        ##  ##        ##     ##   ## ##   ##     ## ##    ## ##       ##     ##   //
//         ## ##             ##     ## ##         ####         ##     ##  ##   ##  ##     ## ##       ##       ##     ##   //
//         ##  ######        ########  ##          ##          ########  ##     ## ########   ######  ######   ########    //
//   ##    ##       ##       ##        ##          ##          ##        ######### ##   ##         ## ##       ##   ##     //
//   ##    ## ##    ##       ##        ##          ##          ##        ##     ## ##    ##  ##    ## ##       ##    ##    // 
//    ######   ######        ##        ########    ##          ##        ##     ## ##     ##  ######  ######## ##     ##   //
//                                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var fileVertexPosBuffer;
var fileVertexNrmBuffer;
var fileVertexTexBuffer;
var fileVertexColBuffer;
var fileVertexIndBuffer;
var modelData = [];
var modelScale = 40;


// Path to folder where models are stored
var ModelFolderPath = "models/";

// Number of vertices in PLY file
var PLY_Vertices = 0;

// Number of faces in PLY file
var PLY_Faces = 0;

// 11 entries per vertex (x,y,z,nx,ny,nz,r,g,b,u,v)
var PLY_DataLenght = 11;

var VAO_VertexIndex = 0;

var FaceIndex = 0;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
//  888~-_                           ,e,                /       ,d88~~\   d8                             d8           // 
//  888   \    /~~~8e  888-~\  d88~\  "  888-~88e e88~88e       8888    _d88__ 888-~\ 888  888  e88~~\ _d88__  d88~\  //
//  888    |       88b 888    C888   888 888  888 888 888       `Y88b    888   888    888  888 d888     888   C888    //
//  888   /   e88~-888 888     Y88b  888 888  888 "88_88"        `Y88b,  888   888    888  888 8888     888    Y88b   //
//  888_-~   C888  888 888      888D 888 888  888  /               8888  888   888    888  888 Y888     888     888D  //
//  888       "88_-888 888    \_88P  888 888  888 Cb            \__88P'  "88_/ 888    "88_-888  "88__/  "88_/ \_88P   //
//                                                 Y8""8D                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function PLY_Vertex(x, y, z, nx, ny, nz, u, v, r, g, b) {
	this.x = 0; 	this.y = 0;	this.z = 0;
	this.nx= 0;	this.ny= 0;	this.nz= 0;
	this.u = 0;	this.v = 0;
	this.r = 0;	this.g = 0;	this.b = 0;
}

// PLY file face consisting of 3 vertex indices for each face
function PLY_Face(a, b, c) {
     this.a = a;
     this.b = b;
     this.c = c;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
//       e      ,d88~~\ Y88b    / 888b    |  e88~-_        ,d88~~\             d8                       //
//      d8b     8888     Y88b  /  |Y88b   | d888   \       8888     e88~~8e  _d88__ 888  888 888-~88e   //
//     /Y88b    `Y88b     Y88b/   | Y88b  | 8888           `Y88b   d888  88b  888   888  888 888  888b  //
//    /  Y88b    `Y88b,    Y8Y    |  Y88b | 8888            `Y88b, 8888__888  888   888  888 888  8888  //
//   /____Y88b     8888     Y     |   Y88b| Y888   /          8888 Y888    ,  888   888  888 888  888P  //
//  /      Y88b \__88P'    /      |    Y888  "88_-~        \__88P'  "88___/   "88_/ "88_-888 888-_88"   //
//                                                                                           888        //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
var xmlhttp;
function LoadPLY(filename)
{
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState == XMLHttpRequest.DONE) {
			if (xmlhttp.status == 200) {
				loadAsyncPLYfile();
			}
		}
	}

	console.log("Loading Model <" + filename + ">...");

	xmlhttp.open("GET", ModelFolderPath + filename, true);
	xmlhttp.send();
}


///////////////////////////////////////////////////////////////////////////////////////////
//                                                                                       //
//  888~-_   888     Y88b    /       888~-_                                              //
//  888   \  888      Y88b  /        888   \    /~~~8e  888-~\  d88~\  e88~~8e  888-~\   //
//  888    | 888       Y88b/         888    |       88b 888    C888   d888  88b 888      //
//  888   /  888        Y8Y          888   /   e88~-888 888     Y88b  8888__888 888      //
//  888_-~   888         Y           888_-~   C888  888 888      888D Y888    , 888      //
//  888      888____    /            888       "88_-888 888    \_88P   "88___/  888      //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////
var vertices = null;
var faces = null;
var arrayVertex, arrayNormal, arrayTexture, arrayColor, arrayIndex;
function loadAsyncPLYfile() {
	var data = xmlhttp.responseText;		//the downloaded data
	var lines = data.split("\n");			//the downloaded data split into lines
	var PLY_index = 0;					//the current PLY file line
	var ReadingPLYData = false;			//Switch for skipping header

	vertices = null;
	faces = null;
	//console.log("PLY number of lines = " + lines.length);

	for (var i = 0; i < lines.length; i++){
		////////////////////////////////////////////////////////////////////
		///Parse the Header                                              ///
		////////////////////////////////////////////////////////////////////
		if (!ReadingPLYData){
			// Read number of vertices stored in the file
			if (lines[i].substr(0, "element vertex".length) == "element vertex"){
				PLY_Vertices = lines[i].split(" ")[2];
			}

			// Read number of faces stored in the file
			if (lines[i].substr(0, "element face".length) == "element face"){
				PLY_Faces = lines[i].split(" ")[2];
			}

			// Finished reading header data, prepare for reading vertex data
			if (lines[i] == "end_header") {
				// Allocate enough space for vertices
				vertices = new Array(PLY_Vertices);

				// Allocate enough space for faces
				faces = new Array(PLY_Faces);

				// Allocate memory for returned arrays (VAOs)
				arrayVertex  = new Array(); // PLY_Vertices * 3
				arrayNormal  = new Array(); // PLY_Vertices * 3
				arrayTexture = new Array(); // PLY_Vertices * 2
				arrayColor   = new Array(); // PLY_Vertices * 3
				arrayIndex   = new Array(); // PLY_Vertices * 1

				ReadingPLYData = true;
			}
		} 

		////////////////////////////////////////////////////////////////////
		///Parse the main data                                           ///
		////////////////////////////////////////////////////////////////////
		else {
			var e = lines[i].split(" ");

			////////////////////////////////////////////////////////////////////
			///Parse the Vertices                                            ///
			////////////////////////////////////////////////////////////////////
			if (PLY_index < PLY_Vertices) {
				// Read vertices
				vertices[PLY_index] = new PLY_Vertex();
				vertices[PLY_index].x = e[0];		vertices[PLY_index].y = e[1];		vertices[PLY_index].z = e[2];		//position
				vertices[PLY_index].nx = e[3];	vertices[PLY_index].ny = e[4];	vertices[PLY_index].nz = e[5];	//normal
				vertices[PLY_index].u = e[6];		vertices[PLY_index].v = e[7];									//texture coords
				vertices[PLY_index].r = e[8];		vertices[PLY_index].g = e[9];		vertices[PLY_index].b = e[10];	//color
			} 

			////////////////////////////////////////////////////////////////////
			///Parse the Faces                                               ///
			////////////////////////////////////////////////////////////////////
			else {
				// Reset index for building VAOs
				if (PLY_index == PLY_Vertices) {
					console.log("Resetting Index...");
					FaceIndex = 0;
					VAO_VertexIndex = 0;
				}

				if (FaceIndex < PLY_Faces){
					// e[0] is not used; it stores the number of points on the polyhedron
					// we assume that to be 3, and accept no alternative.
					faces[FaceIndex] = new PLY_Face(e[1], e[2], e[3]);

				}
				FaceIndex++;

			}
			PLY_index++;
		}
	}

	buildTriangleList(true);

	console.log("PLY_Vertices = " + PLY_Vertices + " loaded");
	console.log("PLY_Faces = " + PLY_Faces + " loaded");
	console.log("arrayVertex length = " + arrayVertex.length);
	console.log("arrayNormal length = " + arrayNormal.length);
	console.log("arrayTexture length = " + arrayTexture.length);
	console.log("arrayColor length = " + arrayColor.length);
	console.log("arrayIndex length = " + arrayIndex.length);

	// We now have both complete vertex and face data loaded;
	// return everything we loaded as Float32Array & Uint16Array for index
	modelData = [
		new Float32Array(arrayVertex),
		new Float32Array(arrayNormal),
		new Float32Array(arrayTexture),
		new Float32Array(arrayColor),
		new Uint16Array(arrayIndex)
	];

	processBuffers(true, true, true);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                    //
//   ########  ##     ## #### ##       ########     ######## ########  ####    ###    ##    ##  ######   ##       ########  ######    //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##     ##  ##    ## ##   ###   ## ##    ##  ##       ##       ##    ##   //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##     ##  ##   ##   ##  ####  ## ##        ##       ##       ##         //
//   ########  ##     ##  ##  ##       ##     ##       ##    ########   ##  ##     ## ## ## ## ##   #### ##       ######    ######    //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##   ##    ##  ######### ##  #### ##    ##  ##       ##             ##   //
//   ##     ## ##     ##  ##  ##       ##     ##       ##    ##    ##   ##  ##     ## ##   ### ##    ##  ##       ##       ##    ##   //
//   ########   #######  #### ######## ########        ##    ##     ## #### ##     ## ##    ##  ######   ######## ########  ######    //
//                                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function buildTriangleList()
{
	for( var i = 0; i<faces.length; i++ ){
		var a = faces[i].a;
		var b = faces[i].b;
		var c = faces[i].c;

		// vertices
		arrayVertex.push(vertices[a].x);	arrayVertex.push(vertices[a].y);	arrayVertex.push(vertices[a].z);
		arrayVertex.push(vertices[b].x);	arrayVertex.push(vertices[b].y);	arrayVertex.push(vertices[b].z);
		arrayVertex.push(vertices[c].x);	arrayVertex.push(vertices[c].y);	arrayVertex.push(vertices[c].z);

		// normals
		arrayNormal.push(vertices[a].nx);	arrayNormal.push(vertices[a].ny);	arrayNormal.push(vertices[a].nz);
		arrayNormal.push(vertices[b].nx);	arrayNormal.push(vertices[b].ny);	arrayNormal.push(vertices[b].nz);
		arrayNormal.push(vertices[c].nx);	arrayNormal.push(vertices[c].ny);	arrayNormal.push(vertices[c].nz);

		// colors
		arrayColor.push(vertices[a].r);	arrayColor.push(vertices[a].g);	arrayColor.push(vertices[a].b);
		arrayColor.push(vertices[b].r);	arrayColor.push(vertices[b].g);	arrayColor.push(vertices[b].b);
		arrayColor.push(vertices[c].r);	arrayColor.push(vertices[c].g);	arrayColor.push(vertices[c].b);

		// uv
		arrayTexture.push(vertices[a].u);	arrayTexture.push(vertices[a].v);
		arrayTexture.push(vertices[b].u);	arrayTexture.push(vertices[b].v);
		arrayTexture.push(vertices[c].u);	arrayTexture.push(vertices[c].v);

		// index
		arrayIndex.push(i);
	}
}




////////////////////////////////////////////////////////////////////////////////////////////////////
///Helper function
///compute triangle norms from three PLY_VERTEX's
////////////////////////////////////////////////////////////////////////////////////////////////////
function getNorm( va, vb, vc  )
{
	var d1 = vec3.fromValues( vb.x-va.x, vb.y-va.y, vb.z-va.z );
	var d2 = vec3.fromValues( vc.x-va.x, vc.y-va.y, vc.z-va.z );
	var perp = vec3.create();
	vec3.cross(perp, d1, d2);
	var norm = vec3.create();
	vec3.normalize(norm, perp);
	return norm;
}









/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                                         //
//  ########  ##     ## ######## ######## ######## ########     ########  ########   #######   ######  ########  ######   ######  #### ##    ##  ######    //
//  ##     ## ##     ## ##       ##       ##       ##     ##    ##     ## ##     ## ##     ## ##    ## ##       ##    ## ##    ##  ##  ###   ## ##    ##   //
//  ##     ## ##     ## ##       ##       ##       ##     ##    ##     ## ##     ## ##     ## ##       ##       ##       ##        ##  ####  ## ##         //
//  ########  ##     ## ######   ######   ######   ########     ########  ########  ##     ## ##       ######    ######   ######   ##  ## ## ## ##   ####  //
//  ##     ## ##     ## ##       ##       ##       ##   ##      ##        ##   ##   ##     ## ##       ##             ##       ##  ##  ##  #### ##    ##   //
//  ##     ## ##     ## ##       ##       ##       ##    ##     ##        ##    ##  ##     ## ##    ## ##       ##    ## ##    ##  ##  ##   ### ##    ##   //
//  ########   #######  ##       ##       ######## ##     ##    ##        ##     ##  #######   ######  ########  ######   ######  #### ##    ##  ######    // 
//                                                                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function processBuffers(recenter, rescale, randomTexture)
{
	/////////////////////////////////////////////////////////////////
	///recenter the model                                         ///
	/////////////////////////////////////////////////////////////////
	var centX = 0;	var centY = 0;	var centZ = 0;
	if( recenter ){
		for (var i = 0; i < arrayVertex.length/3; i++){
			centX += modelData[0][3*i+0];
			centY += modelData[0][3*i+1];
			centZ += modelData[0][3*i+2];
			//console.log("Done Rescaling: centX: " + centX + " centY: " + centY + " centZ: " + centZ);
			//console.log("Done Rescaling: centX: " + arrayVertex[3*i+0] + " centY: " + arrayVertex[3*i+1] + " centZ: " + arrayVertex[3*i+2]);
		}
		centX /= arrayVertex.length/3;
		centY /= arrayVertex.length/3;
		centZ /= arrayVertex.length/3;
	}
		
	/////////////////////////////////////////////////////////////////
	///rescale the model                                          ///
	/////////////////////////////////////////////////////////////////
	if( rescale ){
		for (var i = 0; i < arrayVertex.length/3; i++){
			arrayVertex[3*i+0] = modelScale * (modelData[0][3*i+0] - centX);
			arrayVertex[3*i+1] = modelScale * (modelData[0][3*i+1] - centY);
			arrayVertex[3*i+2] = modelScale * (modelData[0][3*i+2] - centZ);
		}
	}

	/////////////////////////////////////////////////////////////////
	///retexture the model                                        ///
	/////////////////////////////////////////////////////////////////
	if( randomTexture ){
		for (var i = 0; i < arrayTexture.length/2; i++){
			// console.log("texture coords: texU: " + modelData[2][2*i+0] + " texV: " + modelData[2][2*i+1]);
			modelData[2][2*i+0] = Math.random();
			modelData[2][2*i+1] = Math.random();
		}
	}

	/////////////////////////////////////////////////////////////////
	///fill the buffers                                           ///
	/////////////////////////////////////////////////////////////////
	fileVertexPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexPosBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrayVertex), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	fileVertexPosBuffer.itemSize = 3;
	fileVertexPosBuffer.numItems = arrayVertex.length/3;

	fileVertexNrmBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexNrmBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData[1]), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	fileVertexNrmBuffer.itemSize = 3;
	fileVertexNrmBuffer.numItems = arrayVertex.length/3;

	fileVertexTexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexTexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData[2]), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	fileVertexTexBuffer.itemSize = 2;
	fileVertexTexBuffer.numItems = arrayTexture.length/2;

	fileVertexColBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, fileVertexColBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData[3]), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	fileVertexColBuffer.itemSize = 2;
	fileVertexColBuffer.numItems = arrayTexture.length/2;

}

