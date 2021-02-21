let canvas, scene, camera, renderer, axes;
let lines;
let graph;
let data = [];
let dataA0 = [];
let labels = [];

const linesOffset = 0;

function drawArrowsRegion (minDate, maxDate, yRanges) {
    let regionData = [];
    const minY = yRanges[0][0];
    const maxY = yRanges[0][1];

    for (let i = 0; i < data.length; i ++) {
        const date = data[i][0];
        const A0 = dataA0[i][1];
        if (date > minDate && date < maxDate && A0 >= minY && A0 <= maxY) regionData.push(data[i]);
    }

    drawArrows(regionData);
}

function drawArrows (data)
{   
    if (data.length > 10000) {
        console.error("Too many points to draw!");
        return;
    }

    if (lines != undefined) {
        scene.remove(lines);
    }

    let points = []; 
    let arrows = new Float32Array(data.length*9);

    let materials = [];

    for (let i = 0; i < data.length; i++) {
        const colorNum = Math.floor(255*(1.0/dataA0[i][1]));

        const color = "rgb("+colorNum+", "+colorNum+","+colorNum+")";

        materials.push( new THREE.LineBasicMaterial( { color: color } ) );
        

        let vector = new THREE.Vector3(linesOffset+data[i][2], data[i][3], linesOffset+data[i][4]);

        points.push(vector);

        let label = createLabel();
        label.setHTML(i);
        label.position = vector;
        labels.push(label);
        document.body.appendChild(label.element);
        
        if (i < data.length-1) {
            let nextVector = new THREE.Vector3(linesOffset+data[i+1][2], data[i+1][3], linesOffset+data[i+1][4]);

            const dir = nextVector.clone().sub(vector);
            const length = dir.length();
            dir.normalize();

            const right = dir.cross(new THREE.Vector3(0, 1, 0)).normalize();
            arrows[i*9] = nextVector.x - 0.02;
            arrows[i*9+1] = nextVector.y;
            arrows[i*9+2] = nextVector.z - 0.02;

            arrows[i*9+3] = nextVector.x
            arrows[i*9+4] = nextVector.y
            arrows[i*9+5] =  nextVector.z + 0.02;

            arrows[i*9+6] = nextVector.x + 0.02
            arrows[i*9+7] = nextVector.y
            arrows[i*9+8] = nextVector.z - 0.02;
        }
    }

    let linesGeometry = new THREE.BufferGeometry().setFromPoints(points);
    linesGeometry.clearGroups();
    for (let i = 0; i < data.length; i++) {
        linesGeometry.addGroup( i, 2, i );  
    }
    lines = new THREE.Line(linesGeometry, materials);
    scene.add(lines);

    /*
    var mat = new THREE.MeshBasicMaterial( { color: "blue" } );
    mat.side = THREE.DoubleSide;
    let arrowsGeometry = new THREE.BufferGeometry();
    arrowsGeometry.setAttribute( 'position', new THREE.BufferAttribute( arrows, 3 ) );

    arrowsGeometry.clearGroups();
    arrowsGeometry.addGroup( 0, 20*9, 0 );
    arrowsGeometry.addGroup( 20*9, arrows.length, 1 );
    scene.add(new THREE.Mesh( arrowsGeometry, mat ));*/

    //let pointMaterial = new THREE.PointsMaterial({ color : color, size : 1, sizeAttenuation : false});
    //let plot = new THREE.Points( geometry , pointMaterial );
    //scene.add(plot);
}


function initLabels () {
    for (let i = 0; i < 10; i++) {
        let label = createLabel();
        label.setHTML(i);
        label.position = new THREE.Vector3(i, 0, 0);
        labels.push(label);
        document.body.appendChild(label.element);
    }
}

function createLabel () {
    let div = document.createElement('div');
    div.className = 'text-label';
    div.style.position = 'fixed';
    div.style.zIndex = "1";
    //div.style.width = 100;
    //div.style.height = 100;
    div.innerHTML = "hi there";
    div.style.top = -1000;
    div.style.left = -1000;

    return {
        element: div,
        parent: false,
        position: new THREE.Vector3(0,0,0),
        setHTML: function(html) {
            this.element.innerHTML = html;
        },
        setParent: function(threejsobj) {
            this.parent = threejsobj;
        },
        updatePosition: function() {
            if(parent) {
                //this.position.copy(this.parent.position);
            }

            let coords2d = this.get2DCoords(this.position);
            this.element.style.left = coords2d.x + 'px';
            this.element.style.top = coords2d.y + 'px';
        },
        get2DCoords: function(position) {
            
            //let vector = position.clone().project( camera );    // maybe we shouldn't clone in update 
            //let rect = renderer.domElement.getBoundingClientRect();
            //console.log(rect.top, rect.right, rect.bottom, rect.left);
            //vector.x = ( vector.x + 1) *  renderer.domElement.width / 2; 
            //vector.y = - ( vector.y - 1) * renderer.domElement.height / 2; 
            //vector.z = 0;
            let vector = position.clone().project(camera);
            vector.x = (vector.x + 1)/2 * canvas.width;
            vector.y = -(vector.y - 1)/2 * canvas.height;
            return vector;
        }
    }
}

function initA0 () {
    if (dataA0.length > 0) {
        dataA0.length = 0;
    }

    let A0max = 0;

    for (let i = 0; i < data.length; i++) {
        const A0 = data[i][1];
        if (Math.abs(A0) > A0max) {
            A0max = Math.abs(A0);
        };
    }

    for (let i = 0; i < data.length; i++) {
        const A0 = data[i][1];
        const diff = Math.abs(A0+A0max);  // abs probably isn't neccesary
        const time = data[i][0]
        dataA0.push([time, diff]);
    }
}

function plotA0 () {
    graph = new Dygraph(document.getElementById("div_g"), dataA0,
    {
        legend: 'always',
        showRoller: true,

        labels: ['Time', 'A0'],
        ylabel: 'A0',
        series: {
            'A0': {
                axis: 'y1'
            },
        },
        zoomCallback: (minDate, maxDate, yRanges) => drawArrowsRegion(minDate, maxDate, yRanges)
    });
}


window.onload = function() {
    canvas = document.getElementById("plot");

    scene = new THREE.Scene;
    scene.background = new THREE.Color(0x000000);

    renderer = new THREE.WebGLRenderer( { canvas: canvas } );
    renderer.setSize(canvas.width, canvas.height);

    camera = new THREE.PerspectiveCamera(45 , window.innerWidth/window.innerHeight , 0.05 , 100);
    camera.up = new THREE.Vector3(0, 1, 0);
    camera.position.set(3, 2, 3);
    camera.controls = new THREE.OrbitControls(camera, renderer.domElement);

    const axes = new THREE.AxesHelper(10);
    scene.add(axes);

    const grid = new THREE.GridHelper(8, 8);
    scene.add(grid);

    initLabels ();

    sendData();

    render();
};

function render () {
    for(let i = 0; i< labels.length; i++) {
        labels[i].updatePosition();
    }

    camera.controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
};

function sendData () {
    let from = document.getElementById("from").valueAsDate;
    let to = document.getElementById("to").valueAsDate;

    getData(from, to).then(function (response) {
        data = response.rows;
        initA0();
        plotA0();
        drawArrows(data);
    })
}


async function getData (from, to) {
    let fromUnix = Math.floor(from.getTime() / 1000);
    let toUnix = Math.floor(to.getTime() / 1000);
    const response = await fetch('api/data?from=' + fromUnix + '&to=' + toUnix, {
        method: 'GET',
        credentials: "include",
    }).catch((e) => {
        console.error(e);
    });
    
    if(response && response.ok)
        return await response.json();
    console.error("Server didn't respond or some error occured");
    return null;
}

window.addEventListener('resize', function() {
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.height);
}, false);