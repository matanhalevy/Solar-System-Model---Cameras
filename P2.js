/***
 * Created by Glen Berseth Feb 5, 2016
 * Created for Project 2 of CPSC314 Introduction to graphics Course.
 */

// Build a visual axis system
function buildAxis( src, dst, colorHex, dashed ) {
        var geom = new THREE.Geometry(),
            mat;

        if(dashed) {
                mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
        } else {
                mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
        }

        geom.vertices.push( src.clone() );
        geom.vertices.push( dst.clone() );
        geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        var axis = new THREE.Line( geom, mat, THREE.LinePieces );

        return axis;

}
var length = 100.0;
// Build axis visuliaztion for debugging.
x_axis = buildAxis(
	    new THREE.Vector3( 0, 0, 0 ),
	    new THREE.Vector3( length, 0, 0 ),
	    0xFF0000,
	    false
	)
y_axis = buildAxis(
	    new THREE.Vector3( 0, 0, 0 ),
	    new THREE.Vector3( 0, length, 0 ),
	    0x00ff00,
	    false
	)
z_axis = buildAxis(
	    new THREE.Vector3( 0, 0, 0 ),
	    new THREE.Vector3( 0, 0, length ),
	    0x0000FF,
	    false
	)
	
// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix=a;
  this.matrix.decompose(this.position,this.quaternion,this.scale);
}
//ASSIGNMENT-SPECIFIC API EXTENSION
// For use with matrix stack
THREE.Object3D.prototype.setMatrixFromStack = function(a) {
  this.matrix=mvMatrix;
  this.matrix.decompose(this.position,this.quaternion,this.scale);
}

// Data to for the two camera view
var mouseX = 0, mouseY = 0;
var windowWidth, windowHeight;
var views = [
	{
		left: 0,
		bottom: 0,
		width: 0.499,
		height: 1.0,
		background: new THREE.Color().setRGB( 0.1, 0.1, 0.1 ),
		eye: [ 80, 20, 80 ],
		up: [ 0, 1, 0 ],
		fov: 45,
		updateCamera: function ( camera, scene, mouseX, mouseY ) {		}
	},
	{
		left: 0.501,
		bottom: 0.0,
		width: 0.499,
		height: 1.0,
		background: new THREE.Color().setRGB( 0.1, 0.1, 0.1 ),
		eye: [ 65, 20, 65 ],
		up: [ 0, 1, 0 ],
		fov: 45,
		updateCamera: function ( camera, scene, mouseX, mouseY ) {		}
	}
];



//SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
// renderer.setClearColor(0xFFFFFF); // white background colour
canvas.appendChild(renderer.domElement);

var lookMother = {"x":0,"y":0,"z":0};
var lookScout = {"x":0,"y":0,"z":0};

// Creating the two cameras and adding them to the scene.
var view = views[0];
camera_MotherShip = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
camera_MotherShip.position.x = view.eye[ 0 ];
camera_MotherShip.position.y = view.eye[ 1 ];
camera_MotherShip.position.z = view.eye[ 2 ];
camera_MotherShip.up.x = view.up[ 0 ];
camera_MotherShip.up.y = view.up[ 1 ];
camera_MotherShip.up.z = view.up[ 2 ];
camera_MotherShip.lookAt( scene.position );
view.camera = camera_MotherShip;
scene.add(view.camera);

var view = views[1];
camera_ScoutShip = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
camera_ScoutShip.position.x = view.eye[ 0 ];
camera_ScoutShip.position.y = view.eye[ 1 ];
camera_ScoutShip.position.z = view.eye[ 2 ];
camera_ScoutShip.up.x = view.up[ 0 ];
camera_ScoutShip.up.y = view.up[ 1 ];
camera_ScoutShip.up.z = view.up[ 2 ];
camera_ScoutShip.lookAt( scene.position );
view.camera = camera_ScoutShip;
scene.add(view.camera);


// ADDING THE AXIS DEBUG VISUALIZATIONS
scene.add(x_axis);
scene.add(y_axis);
scene.add(z_axis);


// ADAPT TO WINDOW RESIZE
function resize() {
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;
  renderer.setSize(window.innerWidth,window.innerHeight);
}

// EVENT LISTENER RESIZE
window.addEventListener('resize',resize);
resize();

//SCROLLBAR FUNCTION DISABLE
window.onscroll = function () 
{
     window.scrollTo(0,0);
}

var ambientLight = new THREE.AmbientLight( 0x222222 );
scene.add( ambientLight );

var lights = [];
lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[0].castShadow = true;

lights[0].position.set( 0, 0, 0 ); // IN THE SUN....

scene.add( lights[0] );

// SETUP HELPER GRID
// Note: Press Z to show/hide
var gridGeometry = new THREE.Geometry();
var i;
for(i=-50;i<51;i+=2) {
    gridGeometry.vertices.push( new THREE.Vector3(i,0,-50));
    gridGeometry.vertices.push( new THREE.Vector3(i,0,50));
    gridGeometry.vertices.push( new THREE.Vector3(-50,0,i));
    gridGeometry.vertices.push( new THREE.Vector3(50,0,i));
}

var gridMaterial = new THREE.LineBasicMaterial({color:0xBBBBBB});
var grid = new THREE.Line(gridGeometry,gridMaterial,THREE.LinePieces);

/////////////////////////////////
//   YOUR WORK STARTS BELOW    //
/////////////////////////////////

// CONTROL VARIABLES
var shipView = true; // true - mothership (left), false - scout (right)
var absLookatMode = false; // changed with l key
var relFlyMode = false;
var geoOrbitMode = false;
var geoPlanet = 3;
var initDist = 2;
var step = 1;

function lookAtPoint(obj, x, y, z) {
	var dz = -1;
	if (z > 0) dz = 1;
	obj.rotation.y = -Math.PI/2 + Math.atan((x-obj.position.x)/(z-obj.position.z));
	var dist = Math.sqrt(Math.pow(obj.position.x-x,2)+Math.pow(obj.position.z-z,2));
	obj.rotation.z = -Math.atan((y-obj.position.y)/dist);
}

// Create ships

var shiptext = THREE.ImageUtils.loadTexture( "images/metaltext.jpg");
var scout = {};
scout["geometry"] = new THREE.CylinderGeometry(1.1,1,0.15,60);
var transToLarge = new THREE.Matrix4().set(1,0,0,0, 0,1,0,-0.45, 0,0,1,-0.65, 0,0,0,1);

var attachment = new THREE.BoxGeometry(0.1,0.8,0.3);
var shearAttach = new THREE.Matrix4().set(1,0,0,0, 0,1,0,0, 0, 0.75,1,0, 0,0,0,1);
attachment.applyMatrix(shearAttach);

var engine = new THREE.CylinderGeometry(0.15,0.12,0.6,60);
engine.rotateX(Math.PI/2);
var transToAttach = new THREE.Matrix4().set(1,0,0,0, 0,1,0,-0.52, 0,0,1,-0.4, 0,0,0,1);


var attachThrustR = new THREE.BoxGeometry(0.05,0.8,0.1);
attachThrustR.rotateZ(Math.PI/8);
var transToEngineR = new THREE.Matrix4().set(1,0,0,-0.18, 0,1,0,0.4, 0,0,1,-0.25, 0,0,0,1);

var attachThrustL = new THREE.BoxGeometry(0.05,0.8,0.1);
attachThrustL.rotateZ(-Math.PI/8);
var transToEngineL = new THREE.Matrix4().set(1,0,0,0.18, 0,1,0,0.4, 0,0,1,-0.25, 0,0,0,1);

var thrustR = new THREE.CylinderGeometry(0.1,0.07,0.8,60);
thrustR.rotateX(Math.PI/2);
var transToAttachThrustR = new THREE.Matrix4().set(1,0,0,-0.18, 0,1,0,0.435, 0,0,1,-0.25, 0,0,0,1);

var thrustL = new THREE.CylinderGeometry(0.1,0.07,0.8,60);
thrustL.rotateX(Math.PI/2);
var transToAttachThrustL = new THREE.Matrix4().set(1,0,0,0.18, 0,1,0,0.435, 0,0,1,-0.25, 0,0,0,1);

attachThrustL.merge(thrustL,transToAttachThrustL);
attachThrustR.merge(thrustR,transToAttachThrustR);
engine.merge(attachThrustR,transToEngineR);
engine.merge(attachThrustL,transToEngineL);
attachment.merge(engine,transToAttach);
scout.geometry.merge(attachment,transToLarge);

scout["material"] = new THREE.MeshBasicMaterial({color:0xffffff, map: shiptext});
scout["obj"] = new THREE.Mesh( scout.geometry, scout.material );
scout.obj.position.x = camera_ScoutShip.position.x;
scout.obj.position.y = camera_ScoutShip.position.y;
scout.obj.position.z = camera_ScoutShip.position.z;
scout.obj.lookAt({"x":0,"y":0,"z":0});
scene.add(scout.obj);

var mother = {};
mother["geometry"] = new THREE.CylinderGeometry(1.1,1,0.15,60);
mother.geometry.merge(attachment,transToLarge);
mother.geometry.scale(3,3,3);
mother["material"] = new THREE.MeshBasicMaterial({color:0x666666, map: shiptext});
mother["obj"] = new THREE.Mesh( mother.geometry, mother.material );
mother.obj.position.x = camera_MotherShip.position.x;
mother.obj.position.y = camera_MotherShip.position.y;
mother.obj.position.z = camera_MotherShip.position.z;
mother.obj.lookAt({"x":0,"y":0,"z":0});
scene.add(mother.obj);


// Create Solar System
var spacing = 2;

var sunRad = 5;
var geometry = new THREE.SphereGeometry( sunRad, 32, 32 );
var suntex = THREE.ImageUtils.loadTexture( "images/sun.png");
generateVertexColors( geometry );
var material = new THREE.MeshBasicMaterial( {color: 0xd3d3d3,map:suntex} );
var sun = new THREE.Mesh( geometry, material );
var sunSpin = Math.random();
scene.add( sun );

var planets = [];

var mercury = {};
var merctex = THREE.ImageUtils.loadTexture( "images/mercury.png");
mercury["radius"] = 0.3;
mercury["geometry"] = new THREE.SphereGeometry(mercury.radius, 32, 32);
mercury["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map: merctex} );
mercury["obj"] = new THREE.Mesh( mercury.geometry, mercury.material );
mercury["spin"] =  Math.random();
mercury["orbit"] =  Math.random();
mercury["start"] = sunRad + mercury.radius + spacing;
generateVertexColors( mercury.geometry );
mercury.obj.position.x = mercury.start;
planets.push(mercury);
scene.add( mercury.obj );

var venus = {};
var ventex = THREE.ImageUtils.loadTexture( "images/venus.png");
venus["radius"] = 0.45;
venus["geometry"] = new THREE.SphereGeometry(venus.radius, 32, 32);
venus["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map:ventex} );
venus["obj"] = new THREE.Mesh( venus.geometry, venus.material );
venus["spin"] =  Math.random();
venus["orbit"] =  Math.random();
venus["start"] = mercury.start + venus.radius + spacing;
generateVertexColors( venus.geometry );
venus.obj.position.x = venus.start;
planets.push(venus);
scene.add( venus.obj );


var moon = {};
var moontex = THREE.ImageUtils.loadTexture("images/moontext.jpg");
moon["geometry"] = new THREE.SphereGeometry(0.2,32,32);
moon["obj"] = new THREE.Mesh(moon.geometry, new THREE.MeshBasicMaterial({color:0xd3d3d3, map:moontex}));
moon["orbit"] = Math.random();
moon["start"] = 0.8;


var earth = {};
var eartex = THREE.ImageUtils.loadTexture( "images/earth.png");
earth["radius"] = 0.5;
earth["geometry"] = new THREE.SphereGeometry(earth.radius, 32, 32);
earth["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map:eartex} );
earth["obj"] = new THREE.Mesh( earth.geometry, earth.material );
earth.obj.add(moon.obj);
earth["spin"] =  1;
earth["orbit"] =  Math.random();
earth["start"] = earth.radius + venus.start + spacing;
generateVertexColors( earth.geometry );
earth.obj.position.x = earth.start;
planets.push(earth);
scene.add( earth.obj );

var mars = {};
var martex = THREE.ImageUtils.loadTexture( "images/mars.png");
mars["radius"] = 0.4;
mars["geometry"] = new THREE.SphereGeometry(mars.radius, 32, 32);
mars["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map:martex} );
mars["obj"] = new THREE.Mesh( mars.geometry, mars.material );
mars["spin"] =  Math.random();
mars["orbit"] =  Math.random();
mars["start"] = earth.start + mars.radius + spacing;
generateVertexColors( mars.geometry );
mars.obj.position.x = mars.start;
planets.push(mars);
scene.add( mars.obj );

//jupiters moons
var ioMoon = {};
var iomoontex = THREE.ImageUtils.loadTexture("images/iomoontext.jpg");
ioMoon["geometry"] = new THREE.SphereGeometry(0.3,32,32);
ioMoon["obj"] = new THREE.Mesh(moon.geometry, new THREE.MeshBasicMaterial({color:0xd3d3d3, map:iomoontex}));
ioMoon["orbit"] = Math.random();
ioMoon["start"] = 1.6;

//jupiters moons
var europaMoon = {};
var europamoontex = THREE.ImageUtils.loadTexture("images/europamoontext.jpg");
europaMoon["geometry"] = new THREE.SphereGeometry(0.25,32,32);
europaMoon["obj"] = new THREE.Mesh(moon.geometry, new THREE.MeshBasicMaterial({color:0xd3d3d3, map:europamoontex}));
europaMoon["orbit"] = Math.random();
europaMoon["start"] = 1.4;

var ganMoon = {};
var ganmoontex = THREE.ImageUtils.loadTexture("images/gamoontext.jpg");
ganMoon["geometry"] = new THREE.SphereGeometry(0.45,32,32);
ganMoon["obj"] = new THREE.Mesh(moon.geometry, new THREE.MeshBasicMaterial({color:0xd3d3d3, map:ganmoontex}));
ganMoon["orbit"] = Math.random();
ganMoon["start"] = 1.8;

var calMoon = {};
var calmoontex = THREE.ImageUtils.loadTexture("images/camoontext.jpg");
calMoon["geometry"] = new THREE.SphereGeometry(0.4,32,32);
calMoon["obj"] = new THREE.Mesh(moon.geometry, new THREE.MeshBasicMaterial({color:0xd3d3d3, map:calmoontex}));
calMoon["orbit"] = Math.random();
calMoon["start"] = 2;

var jupiter = {};
var juptex = THREE.ImageUtils.loadTexture( "images/jupiter.png");
jupiter["radius"] = 1.2;
jupiter["geometry"] = new THREE.SphereGeometry(jupiter.radius, 32, 32);
jupiter["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map:juptex} );
jupiter["obj"] = new THREE.Mesh( jupiter.geometry, jupiter.material );
jupiter.obj.add(ioMoon.obj);
jupiter.obj.add(europaMoon.obj);
jupiter.obj.add(ganMoon.obj);
jupiter.obj.add(calMoon.obj);
jupiter["spin"] =  Math.random();
jupiter["orbit"] =  Math.random();
jupiter["start"] = jupiter.radius + mars.start + spacing;
generateVertexColors( jupiter.geometry );
jupiter.obj.position.x = jupiter.start;
planets.push(jupiter);
scene.add( jupiter.obj );




var saturn = {};
var sattex = THREE.ImageUtils.loadTexture( "images/saturn.png");
var satringtex = THREE.ImageUtils.loadTexture("images/saturnring.jpg")
var rotateZRing = new THREE.Matrix4().set(
	1,        0,         0,        0,
	0, Math.cos(Math.PI/3),-Math.sin(Math.PI/3), 0,
	0, Math.sin(Math.PI/3), Math.cos(Math.PI/3), 0,
	0,        0,         0,        1);
saturn["radius"] = 1;
saturn["geometry"] = new THREE.SphereGeometry(saturn.radius, 32, 32);
saturn["material"] = new THREE.MeshBasicMaterial( {color: 0xff6600, map:sattex} );
saturn["ringGeometry"] = new THREE.RingGeometry(1.05, 1.45, 32, 8, Math.PI * 2);
saturn.ringGeometry.applyMatrix(rotateZRing);
saturn.ringGeometry.rotateY(Math.PI/2);
saturn["ringObj"] = new THREE.Mesh(saturn.ringGeometry, new THREE.MeshBasicMaterial({color: 0xffeaea, side: THREE.DoubleSide, map:satringtex}));
saturn["obj"] = new THREE.Mesh( saturn.geometry, saturn.material );
saturn.obj.add(saturn.ringObj);
saturn["spin"] =  Math.random();
saturn["orbit"] =  Math.random();
saturn["start"] = jupiter.start + saturn.radius + spacing;
generateVertexColors( saturn.geometry );
saturn.obj.position.x = saturn.start;
planets.push(saturn);
scene.add( saturn.obj );

var uranus = {};
var uratex = THREE.ImageUtils.loadTexture( "images/uranus.png");
uranus["radius"] = 0.7;
uranus["geometry"] = new THREE.SphereGeometry(uranus.radius, 32, 32);
uranus["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map:uratex} );
uranus["obj"] = new THREE.Mesh( uranus.geometry, uranus.material );
uranus["spin"] =  Math.random();
uranus["orbit"] =  Math.random();
uranus["start"] = uranus.radius + saturn.start + spacing;
generateVertexColors( uranus.geometry );
uranus.obj.position.x = uranus.start;
planets.push(uranus);
scene.add( uranus.obj );

var neptune = {};
var neptex = THREE.ImageUtils.loadTexture( "images/neptune.png");
neptune["radius"] = 0.7;
neptune["geometry"] = new THREE.SphereGeometry(neptune.radius, 32, 32);
neptune["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map:neptex} );
neptune["obj"] = new THREE.Mesh( neptune.geometry, neptune.material );
neptune["spin"] =  Math.random();
neptune["orbit"] =  Math.random();
neptune["start"] = uranus.start + neptune.radius + spacing;
generateVertexColors( neptune.geometry );
neptune.obj.position.x = neptune.start;
planets.push(neptune);
scene.add( neptune.obj );

var pluto = {};
var plutex = THREE.ImageUtils.loadTexture( "images/pluto.png");
pluto["radius"] = 0.15;
pluto["geometry"] = new THREE.SphereGeometry(pluto.radius, 32, 32);
pluto["material"] = new THREE.MeshBasicMaterial( {color: 0xd3d3d3, map:plutex} );
pluto["obj"] = new THREE.Mesh( pluto.geometry, pluto.material );
pluto["spin"] =  Math.random();
pluto["orbit"] =  Math.random();
pluto["start"] = neptune.start + pluto.radius + spacing;
generateVertexColors( pluto.geometry );
pluto.obj.position.x = pluto.start;
planets.push(pluto);
scene.add( pluto.obj );

//TO-DO: INITIALIZE THE REST OF YOUR PLANETS

//ORBIT RINGS
var orbits = [];
var orbtex = THREE.ImageUtils.loadTexture("images/playdough.jpg");
var orbMaterial = new THREE.MeshBasicMaterial({color:0xffffcc, map: orbtex});
var rotateZ = new THREE.Matrix4().set(
	1,        0,         0,        0,
	0, Math.cos(Math.PI/2),-Math.sin(Math.PI/2), 0,
	0, Math.sin(Math.PI/2), Math.cos(Math.PI/2), 0,
	0,        0,         0,        1);

var mercuryOrbit = {};
mercuryOrbit["geometry"] = new THREE.TorusGeometry(mercury.start,0.1,16,100,Math.PI*2);
mercuryOrbit.geometry.applyMatrix(rotateZ);
mercuryOrbit["obj"] = new THREE.Mesh(mercuryOrbit.geometry, orbMaterial);
generateVertexColors(mercuryOrbit.geometry);
orbits.push(mercuryOrbit);
scene.add(mercuryOrbit.obj);

var venusOrbit = {};
venusOrbit["geometry"] = new THREE.TorusGeometry(venus.start,0.1,16,100,Math.PI*2);
venusOrbit.geometry.applyMatrix(rotateZ);
venusOrbit["obj"] = new THREE.Mesh(venusOrbit.geometry, orbMaterial);
generateVertexColors(venusOrbit.geometry);
orbits.push(venusOrbit);
scene.add(venusOrbit.obj);

var earthOrbit = {};
earthOrbit["geometry"] = new THREE.TorusGeometry(earth.start,0.1,16,100,Math.PI*2);
earthOrbit.geometry.applyMatrix(rotateZ);
earthOrbit["obj"] = new THREE.Mesh(earthOrbit.geometry, orbMaterial);
generateVertexColors(earthOrbit.geometry);
orbits.push(earthOrbit);
scene.add(earthOrbit.obj);

var marsOrbit = {};
marsOrbit["geometry"] = new THREE.TorusGeometry(mars.start,0.1,16,100,Math.PI*2);
marsOrbit.geometry.applyMatrix(rotateZ);
marsOrbit["obj"] = new THREE.Mesh(marsOrbit.geometry, orbMaterial);
generateVertexColors(marsOrbit.geometry);
orbits.push(marsOrbit);
scene.add(marsOrbit.obj);

var jupiterOrbit = {};
jupiterOrbit["geometry"] = new THREE.TorusGeometry(jupiter.start,0.1,16,100,Math.PI*2);
jupiterOrbit.geometry.applyMatrix(rotateZ);
jupiterOrbit["obj"] = new THREE.Mesh(jupiterOrbit.geometry, orbMaterial);
generateVertexColors(jupiterOrbit.geometry);
orbits.push(jupiterOrbit);
scene.add(jupiterOrbit.obj);

var saturnOrbit = {};
saturnOrbit["geometry"] = new THREE.TorusGeometry(saturn.start,0.1,16,100,Math.PI*2);
saturnOrbit.geometry.applyMatrix(rotateZ);
saturnOrbit["obj"] = new THREE.Mesh(saturnOrbit.geometry, orbMaterial);
generateVertexColors(saturnOrbit.geometry);
orbits.push(saturnOrbit);
scene.add(saturnOrbit.obj);

var uranusOrbit = {};
uranusOrbit["geometry"] = new THREE.TorusGeometry(uranus.start,0.1,16,100,Math.PI*2);
uranusOrbit.geometry.applyMatrix(rotateZ);
uranusOrbit["obj"] = new THREE.Mesh(uranusOrbit.geometry, orbMaterial);
generateVertexColors(uranusOrbit.geometry);
orbits.push(uranusOrbit);
scene.add(uranusOrbit.obj);

var neptuneOrbit = {};
neptuneOrbit["geometry"] = new THREE.TorusGeometry(neptune.start,0.1,16,100,Math.PI*2);
neptuneOrbit.geometry.applyMatrix(rotateZ);
neptuneOrbit["obj"] = new THREE.Mesh(neptuneOrbit.geometry, orbMaterial);
generateVertexColors(neptuneOrbit.geometry);
orbits.push(neptuneOrbit);
scene.add(neptuneOrbit.obj);

var plutoOrbit = {};
plutoOrbit["geometry"] = new THREE.TorusGeometry(pluto.start,0.05,16,100,Math.PI*2);
plutoOrbit.geometry.applyMatrix(rotateZ);
plutoOrbit["obj"] = new THREE.Mesh(plutoOrbit.geometry, orbMaterial);
generateVertexColors(plutoOrbit.geometry);
orbits.push(plutoOrbit);
scene.add(plutoOrbit.obj);


//Note: Use of parent attribute IS allowed.
//Hint: Keep hierarchies in mind! 

var clock = new THREE.Clock(true);
function updateSystem()
{
	if (clock.running) {
		// ANIMATE YOUR SOLAR SYSTEM HERE.
		sun.rotation.y = clock.getElapsedTime() * sunSpin;
		for (i in planets) {
			planets[i].obj.setMatrix(new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().makeRotationY(clock.getElapsedTime() *planets[i].orbit), new THREE.Matrix4().makeTranslation(planets[i].start,0,0)).multiply(new THREE.Matrix4().makeRotationY(clock.getElapsedTime()*planets[i].spin)));
			//planets[i].obj.rotation.y = clock.getElapsedTime()*planets[i].spin;
		}
		moon.obj.setMatrix(new THREE.Matrix4().makeRotationY(clock.getElapsedTime() * moon.orbit).multiply(new THREE.Matrix4().makeTranslation(0,0,moon.start)));

		ioMoon.obj.setMatrix(new THREE.Matrix4().makeRotationY(clock.getElapsedTime() * ioMoon.orbit).multiply(new THREE.Matrix4().makeTranslation(0,0,ioMoon.start)));
		europaMoon.obj.setMatrix(new THREE.Matrix4().makeRotationY(clock.getElapsedTime() * europaMoon.orbit).multiply(new THREE.Matrix4().makeTranslation(0,0,europaMoon.start)));
		ganMoon.obj.setMatrix(new THREE.Matrix4().makeRotationY(clock.getElapsedTime() * ganMoon.orbit).multiply(new THREE.Matrix4().makeTranslation(0,0,ganMoon.start)));
		calMoon.obj.setMatrix(new THREE.Matrix4().makeRotationY(clock.getElapsedTime() * calMoon.orbit).multiply(new THREE.Matrix4().makeTranslation(0,0,calMoon.start)));
	}
}

function resetCams() {
	geoOrbitMode = false;
	relFlyMode = false;
	absLookatMode = false;
  	  
  	  camera_MotherShip.parent = null;
  	  camera_ScoutShip.parent = null;
  	  mother.obj.parent = null;
  	  scout.obj.parent = null;
  	  
	  camera_MotherShip.position.x = views[0].eye[ 0 ];
	  camera_MotherShip.position.y = views[0].eye[ 1 ];
	  camera_MotherShip.position.z = views[0].eye[ 2 ];
	  camera_MotherShip.up.x = views[0].up[ 0 ];
	  camera_MotherShip.up.y = views[0].up[ 1 ];
	  camera_MotherShip.up.z = views[0].up[ 2 ];
	  camera_MotherShip.lookAt( {"x":0,"y":0,"z":0} );

	  mother.obj.position.x = views[0].eye[ 0 ];
	  mother.obj.position.y = views[0].eye[ 1 ];
	  mother.obj.position.z = views[0].eye[ 2 ];
	  mother.obj.up.x = views[0].up[ 0 ];
	  mother.obj.up.y = views[0].up[ 1 ];
	  mother.obj.up.z = views[0].up[ 2 ];

	  camera_ScoutShip.position.x = views[1].eye[ 0 ];
	  camera_ScoutShip.position.y = views[1].eye[ 1 ];
	  camera_ScoutShip.position.z = views[1].eye[ 2 ];
	  camera_ScoutShip.up.x = views[1].up[ 0 ];
	  camera_ScoutShip.up.y = views[1].up[ 1 ];
	  camera_ScoutShip.up.z = views[1].up[ 2 ];
	  camera_ScoutShip.lookAt( {"x":0,"y":0,"z":0} );
	  
	  scout.obj.position.x = views[1].eye[ 0 ];
	  scout.obj.position.y = views[1].eye[ 1 ];
	  scout.obj.position.z = views[1].eye[ 2 ];
	  scout.obj.up.x = views[1].up[ 0 ];
	  scout.obj.up.y = views[1].up[ 1 ];
	  scout.obj.up.z = views[1].up[ 2 ];

	  scout.obj.lookAt({"x":0,"y":0,"z":0});
	  mother.obj.lookAt({"x":0,"y":0,"z":0});

	  lookMother = {"x":0,"y":0,"z":0};
	  lookScout = {"x":0,"y":0,"z":0};
}

function getPlanet() {
	switch(geoPlanet) {
		case 1:
			return mercury;
			break;
		case 2:
			return venus;
			break;
		case 3:
			return earth;
			break;
		case 4:
			return mars;
			break;
		case 5:
			return jupiter;
			break;
		case 6:
			return saturn;
			break;
		case 7:
			return uranus;
			break;
		case 8:
			return neptune;
			break;
		case 9:
			return pluto;
			break;
	}
}

function geosync() {
	var c = (shipView) ? camera_MotherShip : camera_ScoutShip;
	var s = (shipView) ? mother.obj : scout.obj;
	var look = (shipView) ? lookMother : lookScout;	
	var planet = getPlanet();
	
	var dist = planet.radius + initDist;
	if (clock.running) {
	
	
	c.parent = planet.obj;
	c.position.x = dist/Math.sqrt(2);
	c.position.y = dist;
	c.position.z = dist/Math.sqrt(2);
	s.parent = planet.obj;
	s.position.x = dist/Math.sqrt(2);
	s.position.y = dist;
	s.position.z = dist/Math.sqrt(2);
	
	
	c.up = {"x":0, "y":1, "z":0};
	c.lookAt({"x":0, "y":0, "z":0});
	scout.obj.lookAt({"x":0,"y":0,"z":0});
	}
}

// LISTEN TO KEYBOARD
// Hint: Pay careful attention to how the keys already specified work!
var keyboard = new THREEx.KeyboardState();
var grid_state = false;
		
function onKeyDown(event)
{
	var c = (shipView) ? camera_MotherShip : camera_ScoutShip;
	var s = (shipView) ? mother.obj : scout.obj;
	var look = (shipView) ? lookMother : lookScout;
	// TO-DO: BIND KEYS TO YOUR CONTROLS	  
  if(keyboard.eventMatches(event,"shift+g"))
  {  // Reveal/Hide helper grid
    grid_state = !grid_state;
    grid_state? scene.add(grid) : scene.remove(grid);
  } else if (keyboard.eventMatches(event, "space")) {
	  if (clock.running) clock.stop();
	  else clock.start();
  } else if (keyboard.eventMatches(event, "m")) {
  	  resetCams();
  } else if (keyboard.eventMatches(event, "o")) {
	  shipView = true;
  } else if (keyboard.eventMatches(event, "p")) {
	  shipView = false;
  } else if (keyboard.eventMatches(event, "l")) {
	  absLookatMode = !absLookatMode;
	  relFlyMode = false;
	  geoOrbitMode = false;
	  if (!absLookatMode) resetCams();
  } 
  // TODO: complete ship rotations for abs lookat mode
  else if (keyboard.eventMatches(event, "shift+x")) {
  	  if (absLookatMode) {
	  	  c.position.x -= step;
	  	  s.position.x -= step;
  	  }  
  } else if (keyboard.eventMatches(event, "x")) {
  	  if (absLookatMode) {
	  	  c.position.x += step;
	  	  s.position.x += step;
  	  }  
  }  else if (keyboard.eventMatches(event, "shift+y")) {
  	  if (absLookatMode) {
	  	  c.position.y -= step;
	  	  s.position.y -= step;
  	  }  
  } else if (keyboard.eventMatches(event, "y")) {
  	  if (absLookatMode) {
	  	  c.position.y += step;
	  	  s.position.y += step;
  	  }  
  } else if (keyboard.eventMatches(event, "shift+z")) {
  	  if (absLookatMode) {
	  	  c.position.z -= step;
	  	  s.position.z -= step;
  	  } else if (relFlyMode) {
		  var dir = c.getWorldDirection();
		  c.position.x -= step*dir.x;
		  c.position.y -= step*dir.y;
		  c.position.z -= step*dir.z;
		  s.position.x -= step*dir.x;
		  s.position.y -= step*dir.y;
		  s.position.z -= step*dir.z;
		  look.x -= step*dir.x;
		  look.y -= step*dir.y;
		  look.z -= step*dir.z;
	  }
  } else if (keyboard.eventMatches(event, "z")) {
  	  if (absLookatMode) {1
	  	  c.position.z += step;
	  	  s.position.z += step;
  	  } else if (relFlyMode) {
		  var dir = c.getWorldDirection();
		  c.position.x += step*dir.x;
		  c.position.y += step*dir.y;
		  c.position.z += step*dir.z;
		  s.position.x += step*dir.x;
		  s.position.y += step*dir.y;
		  s.position.z += step*dir.z;
		  look.x += step*dir.x;
		  look.y += step*dir.y;
		  look.z += step*dir.z;
	  }
  } else if (keyboard.eventMatches(event, "shift+k")) {
  	  if ((absLookatMode || geoOrbitMode || relFlyMode) && step >= 0.5) {
	  	  step /= 1.5;	  	  
  	  } 
  } else if (keyboard.eventMatches(event, "k")) {
  	  if (absLookatMode || geoOrbitMode || relFlyMode) {
	  	  step *= 1.5;
  	  } 
  } else if (keyboard.eventMatches(event, "shift+a")) {
	  if (absLookatMode) {
	      look.x -= step;
		  c.lookAt(look);
		  s.lookAt(look);
	  } else if (relFlyMode) {
	  	  c.up.y = c.up.y*Math.cos(step/5)+c.up.z*Math.sin(step/5);
	  	  c.up.z = -1*c.up.y*Math.sin(step/5)+c.up.z*Math.cos(step/5);
	  	  s.up.y = s.up.y*Math.cos(step/5)+s.up.z*Math.sin(step/5);
	  	  s.up.z = -1*s.up.y*Math.sin(step/5)+s.up.z*Math.cos(step/5);
	  	  c.lookAt(look);
	  	  s.lookAt(look);
	  	  //var rotate = new THREE.Matrix4().makeRotationX(-1*step/5);
		  //s.setMatrix(new THREE.Matrix4().multiplyMatrices(s.matrix,rotate));
	  }
  } else if (keyboard.eventMatches(event, "a")) {
	  if (absLookatMode) {
	  	 look.x += step;
		 c.lookAt(look);
		 s.lookAt(look);
	  } else if (relFlyMode) {
	  	  c.up.y = c.up.y*Math.cos(step/5)-c.up.z*Math.sin(step/5);
	  	  c.up.z = c.up.y*Math.sin(step/5)+c.up.z*Math.cos(step/5);
	  	  c.lookAt(look);
	  	  s.up.y = s.up.y*Math.cos(step/5)-s.up.z*Math.sin(step/5);
	  	  s.up.z = s.up.y*Math.sin(step/5)+s.up.z*Math.cos(step/5);
	  	  s.lookAt(look);
	  	  //var rotate = new THREE.Matrix4().makeRotationX(step/5);
		  //s.setMatrix(new THREE.Matrix4().multiplyMatrices(s.matrix,rotate));
	  }
  } else if (keyboard.eventMatches(event, "shift+b")) {
	  if (absLookatMode) {
	      look.y -= step;
		  c.lookAt(look);
		  s.lookAt(look);	  }
  } else if (keyboard.eventMatches(event, "b")) {
	  if (absLookatMode) {
	  	 look.y += step;
		 c.lookAt(look);
		 s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "shift+c")) {
	  if (absLookatMode) {
	      look.z -= step;
		  c.lookAt(look);
		  s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "c")) {
	  if (absLookatMode) {
	  	 look.z += step;
		 c.lookAt(look);
		 s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "shift+d")) {
	  if (absLookatMode) {
	      c.up.x -= step/5;
	      c.lookAt(look);
	      s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "d")) {
	  if (absLookatMode) {
	  	 c.up.x += step/5;
	  	 c.lookAt(look);
	  	 s.up.x += step/5;
	  	 s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "shift+e")) {
	  if (absLookatMode) {
	      c.up.y -= step/5;
	      c.lookAt(look);
	      s.up.y -= step/5;
	      s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "e")) {
	  if (absLookatMode) {
	  	 c.up.y += step/5;
	  	 c.lookAt(look);
	  	 s.up.y += step/5;
	  	 s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "shift+f")) {
	  if (absLookatMode) {
	      c.up.z -= step/5;
	      c.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "f")) {
	  if (absLookatMode) {
	  	 c.up.z += step/5;
	  	 c.lookAt(look);
	  	 s.up.z += step/5;
	  	 s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "g")) {
	  geoOrbitMode = !geoOrbitMode;
	  absLookatMode = false;
	  relFlyMode = false;
	  initDist = 2;
	  if (!geoOrbitMode) resetCams();
  } else if (keyboard.eventMatches(event, "1")) {
	  geoPlanet = 1;
  } else if (keyboard.eventMatches(event, "2")) {
	  geoPlanet = 2;
  } else if (keyboard.eventMatches(event, "3")) {
	  geoPlanet = 3;
  } else if (keyboard.eventMatches(event, "4")) {
	  geoPlanet = 4;
  } else if (keyboard.eventMatches(event, "5")) {
	  geoPlanet = 5;
  } else if (keyboard.eventMatches(event, "6")) {
	  geoPlanet = 6;
  } else if (keyboard.eventMatches(event, "7")) {
	  geoPlanet = 7;
  } else if (keyboard.eventMatches(event, "8")) {
	  geoPlanet = 8;
  } else if (keyboard.eventMatches(event, "9")) {
	  geoPlanet = 9;
  } else if (keyboard.eventMatches(event, "shift+w")) {
	  if (geoOrbitMode && initDist > step)
	  	initDist -= step;
  } else if (keyboard.eventMatches(event, "w")) {
	  if (geoOrbitMode)
	  initDist += step;
  } else if (keyboard.eventMatches(event, "r")) {
	  relFlyMode = !relFlyMode;
	  absLookatMode = false;
	  geoOrbitMode = false;
	  if (!relFlyMode) resetCams();
  } else if (keyboard.eventMatches(event, "shift+s")) {
  		if (relFlyMode) {
  	  var norm = Math.sqrt(Math.pow(c.up.x,2)+Math.pow(c.up.y,2)+Math.pow(c.up.z,2));
	  look.x -= c.up.x*step/norm;
	  look.y -= c.up.y*step/norm;
	  look.z -= c.up.z*step/norm;
	  c.lookAt(look);
	  s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "s")) {
  	if (relFlyMode) {
	  var norm = Math.sqrt(Math.pow(c.up.x,2)+Math.pow(c.up.y,2)+Math.pow(c.up.z,2));
	  look.x += c.up.x*step/norm;
	  look.y += c.up.y*step/norm;
	  look.z += c.up.z*step/norm;
	  c.lookAt(look);
	  s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "shift+q")) {
	  if (relFlyMode) {
		  var yaw = {"x":0,"y":0,"z":0};
		  var dir = c.getWorldDirection();
		  yaw.x = dir.y*c.up.z-dir.z*c.up.y;
		  yaw.y = -1*dir.x*c.up.z+dir.z*c.up.x;
		  yaw.z = dir.x*c.up.y-dir.y*c.up.x;
		  var norm = Math.sqrt(Math.pow(yaw.x,2)+Math.pow(yaw.y,2)+Math.pow(yaw.z,2));
		  look.x -= yaw.x*step/norm;
		  look.y -= yaw.y*step/norm;
		  look.z -= yaw.z*step/norm;
		  c.lookAt(look);
		  s.lookAt(look);
	  }
  } else if (keyboard.eventMatches(event, "q")) {
	  if (relFlyMode) {
		  var yaw = {"x":1,"y":1,"z":1};
		  var dir = c.getWorldDirection();
		  yaw.x = dir.y*c.up.z-dir.z*c.up.y;
		  yaw.y = -1*dir.x*c.up.z+dir.z*c.up.x;
		  yaw.z = dir.x*c.up.y-dir.y*c.up.x;
		  var norm = Math.sqrt(Math.pow(yaw.x,2)+Math.pow(yaw.y,2)+Math.pow(yaw.z,2));
		  look.x += yaw.x*step/norm;
		  look.y += yaw.y*step/norm;
		  look.z += yaw.z*step/norm;
		  c.lookAt(look);
		  s.lookAt(look);
	  }
  }

}
keyboard.domElement.addEventListener('keydown', onKeyDown );
		

// SETUP UPDATE CALL-BACK
// Hint: It is useful to understand what is being updated here, the effect, and why.
// DON'T TOUCH THIS
function update() {
  updateSystem();
  if (geoOrbitMode) {
	  geosync();
  }

  requestAnimationFrame(update);
  
  // UPDATES THE MULTIPLE CAMERAS IN THE SIMULATION
  for ( var ii = 0; ii < views.length; ++ii ) 
  {

		view = views[ii];
		camera_ = view.camera;

		view.updateCamera( camera_, scene, mouseX, mouseY );

		var left   = Math.floor( windowWidth  * view.left );
		var bottom = Math.floor( windowHeight * view.bottom );
		var width  = Math.floor( windowWidth  * view.width );
		var height = Math.floor( windowHeight * view.height );
		renderer.setViewport( left, bottom, width, height );
		renderer.setScissor( left, bottom, width, height );
		renderer.enableScissorTest ( true );
		renderer.setClearColor( view.background );

		camera_.aspect = width / height;
		camera_.updateProjectionMatrix();

		renderer.render( scene, camera_ );
	}
}
clock.start();
update();