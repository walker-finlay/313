
//import BVHtree from './BVHtree001' //import BVHnode from './BVHtree001'
import * as vec3 from '../lib/vec3.js'
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

//for use in the renderer
var fileVertexPosBuffer;
var fileVertexNrmBuffer;
var fileVertexTexBuffer;
var fileVertexColBuffer;
var fileVertexIndBuffer;
var modelData = [];
var modelScale = 60;

//for use in analysis
var vertices = null;
var faces = null;
var arrayVertex, arrayNormal, arrayTexture, arrayColor, arrayIndex;

//for use in ray tracing
var linearizedBVHtree = null;
var linearizedVecNrmTriAndNodes = null;


// PLY object
function PLY() { this.object; }

// Path to folder where models are stored
var ModelFolderPath = "models/";

// Number of vertices in PLY file
var PLY_Vertices = 0;
// Number of faces in PLY file
var PLY_Faces = 0;
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
let cb;
var xmlhttp;
export default function LoadPLY(filename, callback)
{
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState == XMLHttpRequest.DONE) {
			if (xmlhttp.status == 200) {
				cb = callback;
				loadAsyncPLYfile();
				
				//test
				// outputVertsAndFaces();
				
			}
			if (xmlhttp.status == 404) {
				console.log("ERROR: <" + filename + ">... not found.");
			}
		}
	}

	console.log("Loading Model <" + filename + ">...");

	xmlhttp.open("GET", ModelFolderPath + filename, true);
	xmlhttp.send();
}


function outputVertsAndFaces()
{
	if( vertices.length/3 > maxVerticesInModel){
		console.log("ERROR: too many vertices in model for BVH tree");
	}
	if( faces.length/3 > maxTrianglesInModel){
		console.log("ERROR: too many faces/triangles in model for BVH tree");
	}

	//vertices_array.length is three times the length;
	let vertices_array = [];
	for( var i = 0; i< vertices.length; i++){
		vertices_array.push( vertices[i].x );
		vertices_array.push( vertices[i].y );
		vertices_array.push( vertices[i].z );
		//zero value to pack floats into vec4 in shader
		vertices_array.push( 0.0 );			
	}
	//normals_array.length is three times the length;
	let normals_array = [];
	for( var i = 0; i< vertices.length; i++){
		normals_array.push( vertices[i].nx );
		normals_array.push( vertices[i].ny );
		normals_array.push( vertices[i].nz );
		//zero value to pack floats into vec4 in shader
		normals_array.push( 0.0 );			
	}
	
	//faces.length is three times the length;
	let faces_array = [];
	for( var i = 0; i< faces.length; i++){
		faces_array.push( faces[i].a );
		faces_array.push( faces[i].b );
		faces_array.push( faces[i].c );
		//zero value to pack floats into vec4 in shader
		faces_array.push( 0.0 );			
	}

	console.log("vertices: " + vertices_array.length/4 + " faces: " + faces_array.length/4);
	
	
	//construct BVH tree.
	//note that these arrays are zero packed to lenght 4 per vertex, normal, and face.
	var bvhTest = new BVHtree(vertices_array, normals_array, faces_array);
//	var nodeArrayTest = bvhTest.linearize();

	//zero fill the vertices, normals, and faces, after bvh construciton.
	//zero fill the rest of the vertices, up to maxVerticesInModel.
	for( var i = 0; i< maxVerticesInModel-vertices.length; i++){
		vertices_array.push( 0.0 );			
		vertices_array.push( 0.0 );			
		vertices_array.push( 0.0 );			
		vertices_array.push( -1.0 );	//-1 in the fourth position indicates empty vertex.
	}
	//zero fill the rest of the normals, up to maxVerticesInModel.
	for( var i = 0; i< maxVerticesInModel-vertices.length; i++){
		normals_array.push( 0.0 );			
		normals_array.push( 0.0 );			
		normals_array.push( 0.0 );			
		normals_array.push( -1.0 );	//-1 in the fourth position indicates empty normal.
	}
	//zero fill the rest of the faces, up to maxTrianglesInModel.
	for( var i = 0; i< maxTrianglesInModel-faces.length; i++){
		faces_array.push( 0.0 );			
		faces_array.push( 0.0 );			
		faces_array.push( 0.0 );			
		faces_array.push( -1.0 );	//-1 in the fourth position indicates empty triangle.
	}
	//zero fill the rest of the nodes, up to maxNodesInBVH.
	for( var i = 0; i< maxNodesInBVH-bvhTest.numNodes; i++){
		nodeArrayTest.push( 0.0 );			
		nodeArrayTest.push( 0.0 );			
		nodeArrayTest.push( 0.0 );			
		nodeArrayTest.push( -1.0 );		//-1 to indicate empty node
		for( var j = 0; j<6*4; i++){		//7 total vec4's.
			nodeArrayTest.push( 0.0 );			
		}
	}



	//var maxTrianglesPerNode = 20;
	//var maxNodesInBVH = 1000;
	var maxTrianglesInModel = 1000;
	var maxVerticesInModel = 1000;


	///this is the final linearized tree	
	linearizedBVHtree = nodeArrayTest;
	
	//this is linearized everything.
	linearizedVecNrmTriAndNodes = [];
	linearizedVecNrmTriAndNodes.concat(vertices_array);
	linearizedVecNrmTriAndNodes.concat(normals_array);
	linearizedVecNrmTriAndNodes.concat(faces_array);
	linearizedVecNrmTriAndNodes.concat(nodeArrayTest);
	
//	return nodeArrayTest;
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
				vertices[PLY_index].x = parseFloat(e[0]);		vertices[PLY_index].y = parseFloat(e[1]);		vertices[PLY_index].z = parseFloat(e[2]);		//position
				vertices[PLY_index].nx = parseFloat(e[3]);		vertices[PLY_index].ny = parseFloat(e[4]);		vertices[PLY_index].nz = parseFloat(e[5]);		//normal
				vertices[PLY_index].u = parseFloat(e[6]);		vertices[PLY_index].v = parseFloat(e[7]);												//texture coords
				vertices[PLY_index].r = parseFloat(e[8]);		vertices[PLY_index].g = parseFloat(e[9]);		vertices[PLY_index].b = parseFloat(e[10]);		//color
			} 

			////////////////////////////////////////////////////////////////////
			///Parse the Faces                                               ///
			////////////////////////////////////////////////////////////////////
			else {
				// Reset index for building VAOs
				if (PLY_index == PLY_Vertices) {
					console.log("Resetting Index...");
					FaceIndex = 0;
				}

				if (FaceIndex < PLY_Faces){
					// e[0] is not used; it stores the number of points on the polyhedron
					// we assume that to be 3, and accept no alternative.
					faces[FaceIndex] = new PLY_Face( parseInt(e[1]), parseInt(e[2]), parseInt(e[3]) );

				}
				FaceIndex++;

			}
			PLY_index++;
		}
	}

	//True for averaged normals (Gouraud shading)
	//False for fixed normals (flat shading)
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
function buildTriangleList(averageNormals)
{
	///Average normals for Goroaud shading
	//track a list of faces adjacent to each vertex
	//We always run this because flat shading often has flipped triangles
	//so we use it to catch flipped triangles.
	if(averageNormals){
		let adjFaces = new Array(vertices.length);
		for( var i = 0; i<vertices.length; i++ ){
			adjFaces[i] = [];
		}

		//loop through the list of faces, adding all adjacent vertices.
		for( var i = 0; i<faces.length; i++ ){
			//we get a list corresponding to a vertex of this face, and push the face index.
			adjFaces[ faces[i].a ].push( i );
			adjFaces[ faces[i].b ].push( i );
			adjFaces[ faces[i].c ].push( i );
		}

		//Now for each vertex, we get the normals of each adjacent face
		//and average them
		for( var i = 0; i<vertices.length; i++ ){
			var normx = 0; var normy = 0; var normz = 0;
			//iterate over adjacent faces, getting the normals
			for( var j = 0; j<adjFaces[i].length; j++ ){
				var va = vertices[ faces[ adjFaces[i][j] ].a ];
				var vb = vertices[ faces[ adjFaces[i][j] ].b ];
				var vc = vertices[ faces[ adjFaces[i][j] ].c ];
				var thisNorm = getNorm( va, vb, vc  );
				normx += thisNorm[0];
				normy += thisNorm[1];
				normz += thisNorm[2];
			}
			normx /= adjFaces[i].length;
			normy /= adjFaces[i].length;
			normz /= adjFaces[i].length;
			vertices[i].nx = normx;
			vertices[i].ny = normy;
			vertices[i].nz = normz;
		}
	}
	for( var i = 0; i<faces.length; i++ ){
		var a = faces[i].a;
		var b = faces[i].b;
		var c = faces[i].c;

		// vertices
		arrayVertex.push(vertices[a].x);	arrayVertex.push(vertices[a].y);	arrayVertex.push(vertices[a].z);
		arrayVertex.push(vertices[b].x);	arrayVertex.push(vertices[b].y);	arrayVertex.push(vertices[b].z);
		arrayVertex.push(vertices[c].x);	arrayVertex.push(vertices[c].y);	arrayVertex.push(vertices[c].z);

		// normals
		if( !averageNormals ){
			var thisNorm = getNorm( vertices[a], vertices[b], vertices[c] );
			arrayNormal.push( thisNorm[0], thisNorm[1], thisNorm[2] );
			arrayNormal.push( thisNorm[0], thisNorm[1], thisNorm[2] );
			arrayNormal.push( thisNorm[0], thisNorm[1], thisNorm[2] );
		}
		else{
			//pass through whatever normal situation is above
			arrayNormal.push(vertices[a].nx);	arrayNormal.push(vertices[a].ny);	arrayNormal.push(vertices[a].nz);
			arrayNormal.push(vertices[b].nx);	arrayNormal.push(vertices[b].ny);	arrayNormal.push(vertices[b].nz);
			arrayNormal.push(vertices[c].nx);	arrayNormal.push(vertices[c].ny);	arrayNormal.push(vertices[c].nz);
		}

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

	cb({
		vPosBuf: fileVertexPosBuffer,
		vNrmBuf: fileVertexNrmBuffer,
		vTexBuf: fileVertexTexBuffer,
		vColBuf: fileVertexColBuffer,
	})
}











