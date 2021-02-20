let canvas, scene, camera, renderer, axes;
//let set = [];
let A0graph;
let data = [];
let dataA0 = [];
let arrowSet = [];
const arrowOffset = 0.0;

function drawArrowsRegion (minDate, maxDate) {
    let regionData = [];
    console.log("highlighting from ", minDate, " to ", maxDate)

    for (let i = 0; i < data.length; i ++) {
        const date = data[i][0];
        
        if (date > minDate && date < maxDate) regionData.push(data[i]);
    }

    drawArrows(regionData);
}

// very unoptimized; use a set
function drawArrows (data)
{   
    if (data.length > 10000) {
        console.error("Too many points to draw!");
        return;
    }

    if (arrowSet.length > 0) {
        for (let i = 0; i < arrowSet.length; i ++) {
            scene.remove(arrowSet[i][1]);
        }    
    }

    for (let i = 0; i < data.length; i++) {
        const time = data[i][0]
        const A0 = data[i][1];
        const x = data[i][2];
        const y = data[i][3];
        const z = data[i][4];

        const color = Math.floor(-A0*10);

        let vector = new THREE.Vector3(x, y, z);
        vector.addScalar(arrowOffset);
        //set.push(vector);

        dataA0.push([time, A0]);

        if (i < data.length-1) {
            let nextVector = new THREE.Vector3(data[i+1][2], data[i+1][3], data[i+1][4]);
            nextVector.addScalar(arrowOffset);


            const dir = nextVector.clone().sub(vector);
            const length = dir.length();
            dir.normalize();
            
            const arrowHelper = new THREE.ArrowHelper( dir, vector, length, `rgb(${color}, ${255-color}, ${255-color})` );
            arrowSet.push([data[i], arrowHelper]);
            scene.add( arrowHelper );
        }
    }


    //let geometry = new THREE.BufferGeometry().setFromPoints(set);
    //let pointMaterial = new THREE.PointsMaterial({ color : color, size : 1, sizeAttenuation : false});
    //let lineMaterial = new THREE.LineBasicMaterial( { color: color } );
    //let plot = new THREE.Points( geometry , pointMaterial );
    //let line = new THREE.Line(geometry, lineMaterial);

    //scene.add(plot);
    //scene.add(line);
}

function plotA0 () {
    A0graph = new Dygraph(document.getElementById("div_g"), dataA0,
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
        zoomCallback: (minDate, maxDate) => drawArrowsRegion(minDate, maxDate)
    });
}

function renderText (top, left) {
    let text2 = document.createElement('div');
    text2.style.position = 'absolute';
    //text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    text2.style.width = 100;
    text2.style.height = 100;
    text2.style.backgroundColor = "red";
    text2.innerHTML = "hi there!";
    text2.style.top = top + 'px';
    text2.style.left = left + 'px';
    document.body.appendChild(text2);
}

function toScreenCoords (pos) {
    let screen = pos.clone();
    screen.project(camera);
    screen.x = ( pos.x + 1) * canvas.width / 2;
    screen.y = - ( pos.y - 1) * canvas.height / 2;
    screen.z = 0;
    return screen;
}

window.onload = function() {
    canvas = document.getElementById("plot");

    scene = new THREE.Scene;
    scene.background = new THREE.Color(0x000000);

    renderer = new THREE.WebGLRenderer( { canvas: canvas } );
    renderer.setSize(canvas.width, canvas.height);

    camera = new THREE.PerspectiveCamera(45 , window.innerWidth/window.innerHeight , 1 , 1000);
    camera.up = new THREE.Vector3(0, 1, 0);
    camera.position.set(7, 2, 7);
    camera.controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.updateMatrixWorld();

    const axes = new THREE.AxesHelper(10);
    scene.add(axes);

    const grid = new THREE.GridHelper(8, 8);
    scene.add(grid);

    let textPosition = toScreenCoords(new THREE.Vector3(0, 10, 0));
    renderText (textPosition.x, textPosition.y);

    render();
};

function render () {
    camera.controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
};

function sendData () {
    //let from = document.getElementById("from").valueAsDate;
    //let to = document.getElementById("to").valueAsDate;
    let from = new Date("25 august 2002");
    let to = new Date("30 august 2002");
    getData(from, to).then(function (response) {
        data = response.rows;
        drawArrows(data);
        plotA0();
    })
}

sendData();

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