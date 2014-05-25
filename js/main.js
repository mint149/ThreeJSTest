/*
・面のrotは中心から出る法線
・壁の画像が必要
・地球以外のテクスチャ
・+new Dateはミリ秒単位
･床画像 : フローリングテクスチャーの作成 | How to Use ArchiCAD : http://www.howtousearchicad.com/?p=1016
･壁紙画像 : http://www.r-toolbox.jp/service/%E3%82%AB%E3%83%A9%E3%83%BC%E3%82%AF%E3%83%AD%E3%82%B9%EF%BC%8F%E3%83%87%E3%82%B6%E3%82%A4%E3%83%8A%E3%83%BC/5%E8%89%B2%E3%81%8B%E3%82%89%E9%81%B8%E3%81%B6/
*/

//定数
// 大きさの単位は10cm.
var FIELD_SIZE = 15;		//箱のサイズ。1.5m=150cm
var TARGET_SIZE = 0.6;

var posCnt = 0;
var posStart = 0;
var posEnd = 0;
var isPlaying = false;	//再生スタート状態かどうかのフラグ
var frameCnt = 0;	//フレームスキップ用カウンタ

function showDialog(obj) {
	$("#dialog").attr("title",obj.innerHTML);
	$("#dialogImage").attr("src","images/temp.jpg");
	$("#dialog").dialog('open');
}

function traceReset(){
	posStart = 0;
	posEnd = 0;
	var date = $("#dateFrom").val().split("-");
	var time = $("#timeFrom").val().split(":");
	var fromDate = new Date(
		date[0],
		date[1] - 1,
		date[2],
		time[0],
		time[1]
	);
	if(time.length == 3){fromDate.setSeconds(time[2])}
	date = $("#dateTo").val().split("-");
	time = $("#timeTo").val().split(":");
	var toDate = new Date(
		date[0],
		date[1] - 1,
		date[2],
		time[0],
		time[1]
	);
	if(time.length == 3){toDate.setSeconds(time[2])}
	var posDate;
	for (var i = 0; i < pos.length; i++) {
		posDate = new Date(
			pos[i][0],
			pos[i][1] - 1,
			pos[i][2],
			pos[i][3],
			pos[i][4],
			pos[i][5]
		);
		if(posDate.getTime() < fromDate.getTime()){
			posStart++;
		}
		if(posDate.getTime() < toDate.getTime()){
			posEnd++;
		}else{
			break;
		}
	}
	posCnt = posStart;
}

function tracePlay(){
	if(isPlaying){
		isPlaying = false;
		$("#playButton").val("再生"); 
	}else{
		isPlaying = true;
		$("#playButton").val("停止"); 
	}
}

function init(){
	$("dt").click(function(){
		if($("dd").css("display")=="block"){
			$("dd:not(:animated)").slideUp("slow");
		}else{
			$("dd").slideDown("slow");
		}
	})

	// レンダラの初期化
	var renderer = new THREE.WebGLRenderer({ antialias:true });
	renderer.setSize(500, 500);
	renderer.setClearColorHex(0x000000, 1);
	$('#monitor').append(renderer.domElement);

	// stats(FPSを表示するパーツ)の初期化
	stats = new Stats();
	stats.domElement.style.zIndex = 100;
	$('#header').append(stats.domElement);

	// シーン
	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xccccff, 0.001);

	// カメラ
	var camera = new THREE.PerspectiveCamera(15, 500 / 500);
	camera.position.set(65,65,65);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.add(camera);

	// ライト
	var light = new THREE.DirectionalLight(0xffffff,5);
	light.position.set(75, 150, 75);
	var ambient = new THREE.AmbientLight(0xffffff);
	scene.add(light);
	scene.add(ambient);

	// 地球テクスチャ
	var earthMaterial = new THREE.MeshBasicMaterial({
		map: THREE.ImageUtils.loadTexture('images/earth.jpg') 
	});

	// 壁テクスチャ
	var wallMaterial = new THREE.MeshBasicMaterial({
		map: THREE.ImageUtils.loadTexture('images/block.jpg'),
		side: THREE.BackSide,
		opacity: 0.3,
		transparent: true
	});

	// 床テクスチャ
	var floorMaterial = new THREE.MeshBasicMaterial({
		side: THREE.BackSide,
		opacity: 0.3,
		transparent: true,
		map: THREE.ImageUtils.loadTexture('images/flooring.jpg') 
	});

	// 天面テクスチャ
	var topMaterial = new THREE.MeshBasicMaterial({
		side: THREE.BackSide,
		opacity: 0.3,
		transparent: true,
		map: THREE.ImageUtils.loadTexture('images/block.jpg') 
	});

	//グリッド
	var planeMaterial = new THREE.MeshBasicMaterial({
		side: THREE.BackSide,
		color: 0xffffff,
		opacity: 0.2,
		transparent: true,
		wireframe: true 
	});

	//スカイボックス
	//6面分のマテリアルを生成
	var skyBoxMaterials = [
		wallMaterial,
		wallMaterial,
		topMaterial,	//天面
		floorMaterial,	//底面
		wallMaterial,
		wallMaterial
	];
	//メッシュ用のマテリアルとしてMeshFaceMaterialを指定
	var faceMaterial = new THREE.MeshFaceMaterial();
	// CubeGeometryを作る時に、7番目の引数に6面分のマテリアルを指定
	var skyBoxGeo = new THREE.CubeGeometry(100, 100, 100, 10, 10, 10, skyBoxMaterials);
	var skyBox = new THREE.Mesh(skyBoxGeo, faceMaterial);
	skyBox.position.set(0, 48, 0);
	scene.add(skyBox);

	//地球
	var earthGeo = new THREE.SphereGeometry(TARGET_SIZE, 32, 16);
	var earth = new THREE.Mesh(earthGeo, earthMaterial);
	earth.position.set(0, 0, 0);
	scene.add(earth);

	// X軸が赤色、Y軸が緑色、Z軸が青色の補助線を出す
	var axis = new THREE.AxisHelper(1000);
	scene.add(axis);

	// 1.5m立方の箱
	var cubeGeo = new THREE.CubeGeometry(FIELD_SIZE, FIELD_SIZE, FIELD_SIZE, 1, 1, 1);
	var cube = new THREE.Mesh(cubeGeo, planeMaterial);
	cube.position.set(FIELD_SIZE / 2, FIELD_SIZE / 2, FIELD_SIZE / 2);
	scene.add(cube);

	// XYZ軸
	var earthAxisGeo = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1);
	var earthAxis = new THREE.Mesh(earthAxisGeo, planeMaterial);
	earthAxis.position.set(0, 0, 0);
	scene.add(earthAxis);

	// カメラコントロールを作成
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.center = new THREE.Vector3(FIELD_SIZE / 2, FIELD_SIZE / 2, FIELD_SIZE / 2);

	// レンダリング
	var baseTime = +new Date;
	function render() {
		if(isPlaying){
			if(posCnt < posEnd){
				frameCnt++;
				if(frameCnt == 3) {
					earth.position.set(
						pos[posCnt][7] / 10,
						pos[posCnt][8] / 10,
						pos[posCnt][9] / 10
					);
					earthAxis.position.set(
						earth.position.x / 2,
						earth.position.y / 2,
						earth.position.z / 2
					);
					earthAxis.scale.set(
						earth.position.x,
						earth.position.y,
						earth.position.z
					);
					// 3D空間内での時刻と座標を表示する
					$("p#point").text("現在の座標:" + 
						pos[posCnt][0] + "/" +
						pos[posCnt][1] + "/" +
						pos[posCnt][2] + " " +
						pos[posCnt][3] + ":" +
						pos[posCnt][4] + ":" +
						pos[posCnt][5] + " (" +
						pos[posCnt][7] + "," +
						pos[posCnt][8] + "," +
						pos[posCnt][9] + ")"
					);
					frameCnt = 0;
					posCnt++;
				}
			}
		}
		requestAnimationFrame(render);

		// カメラの状態を更新
		controls.update();

		// 自転
		earth.rotation.y = 0.3 * (+new Date - baseTime) / 1000;

		renderer.render(scene, camera);
		stats.update();
	}
	render();
}
