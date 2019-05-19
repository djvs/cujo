var app = require("./app")
;(function() {
  var container, scene, camera, renderer, controls, stats
  var keyboard = new THREEx.KeyboardState()
  var clock = new THREE.Clock()
  var cats = {}
  var cards = {}
  const maxMoveRadius = 120

  init()

  animate()

  var bloodTexture = new THREE.ImageUtils.loadTexture("/images/blood.jpg")
  bloodTexture.wrapS = bloodTexture.wrapT = THREE.RepeatWrapping
  bloodTexture.repeat.set(10, 10)
  // DoubleSide: render texture on both sides of mesh
  var bloodMaterial = new THREE.MeshBasicMaterial({
    map: bloodTexture,
    side: THREE.DoubleSide
  })

  const killCat = (color, game) => {
    let player = game.players.find(x => x.color === color)
    console.log("Killing the cat", color, player)
    var audio = new Audio("/audio/scream.mp3")
    audio.play()
    var exploded
    var cat = cats[color]
    var card = cards[color]

    window.gltfLoader.load("/exploded.gltf", function(gltf) {
      exploded = gltf.scene
      console.log("pp", player.position)
      exploded.position.x = player.position.x
      exploded.position.y = 0
      exploded.position.z = player.position.z
      exploded.scale.x = 7
      exploded.scale.y = 7
      exploded.scale.z = 7
      exploded.rotateX(-Math.PI / 2)
      exploded.rotateZ(Math.PI)
      exploded.children[0].material = bloodMaterial
      add(exploded)
      console.log("explo", exploded)
    })
    scene.remove(cat)
    scene.remove(card)

    setTimeout(() => {
      scene.remove(exploded)
    }, 3000)
  }

  const delableObjs = []

  const add = obj => {
    delableObjs.push(obj)
    scene.add(obj)
  }

  const resetScene = () => {
    delableObjs.forEach(obj => {
      scene.remove(obj)
    })
  }

  function init() {
    scene = new THREE.Scene()

    var SCREEN_WIDTH = window.innerWidth,
      SCREEN_HEIGHT = window.innerHeight

    var VIEW_ANGLE = 45,
      ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
      NEAR = 0.1,
      FAR = 20000

    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR)

    scene.add(camera)

    camera.position.set(-1200, 650, -250)
    camera.lookAt(scene.position)

    if (Detector.webgl) renderer = new THREE.WebGLRenderer({ antialias: true })
    else renderer = new THREE.CanvasRenderer()

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)

    container = document.getElementById("gamewrap")

    container.appendChild(renderer.domElement)

    THREEx.WindowResize(renderer, camera)

    THREEx.FullScreen.bindKey({ charCode: "m".charCodeAt(0) })

    controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.minPolarAngle = 0
    controls.maxPolarAngle = Math.PI / 2.1
    controls.maxDistance = 12000
    controls.minDistance = 500

    /* var light = new THREE.PointLight(0xffffff)
    light.position.set(0, 250, 0)
    scene.add(light) */

    var ambientLight = new THREE.AmbientLight(0xffffff)
    ambientLight.position.set(0, 200, 0)
    scene.add(ambientLight)

    var dlight = new THREE.DirectionalLight(0xffffff, 1)
    dlight.position.set(0, 200, 40)
    dlight.castShadow = true
    let dlightTarget = new THREE.Object3D()
    scene.add(dlightTarget)
    dlight.target = dlightTarget
    scene.add(dlight)

    var fur1Texture = new THREE.ImageUtils.loadTexture("/images/fur1.jpg")
    fur1Texture.wrapS = fur1Texture.wrapT = THREE.CubeUVReflectionMapping
    fur1Texture.repeat.set(10, 10)
    // DoubleSide: render texture on both sides of mesh
    var fur1Material = new THREE.MeshBasicMaterial({
      map: fur1Texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    })

    var fur2Texture = new THREE.ImageUtils.loadTexture("/images/fur2.jpg")
    fur2Texture.wrapS = fur2Texture.wrapT = THREE.RepeatWrapping
    fur2Texture.repeat.set(10, 10)
    // DoubleSide: render texture on both sides of mesh
    var fur2Material = new THREE.MeshBasicMaterial({
      map: fur2Texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    })

    // orange cat
    loadCat = (player, game) => {
      if (!player) {
        return false
      }
      if (game.loser && player.color === game.loser) {
        return false
      }
      window.gltfLoader.load("/cat.gltf", function(gltf) {
        let cat = (cats[player.color] = gltf.scene)

        let catMesh = cat.children[0]
        catMesh.rotateX(-Math.PI / 2)
        catMesh.position.x = player.position.x
        catMesh.position.y = 0
        catMesh.position.z = player.position.z
        catMesh.scale.x = 9
        catMesh.scale.y = 9
        catMesh.scale.z = 9

        if (player.color === "blue") {
          catMesh.rotateZ(Math.PI)
        }
        catMesh.material =
          player.color === "orange" ? fur1Material : fur2Material

        var cardTexture = new THREE.ImageUtils.loadTexture(
          "/api/image?url=" + encodeURI(player.image_url)
        )
        cardTexture.wrapS = cardTexture.wrapT = THREE.RepeatWrapping
        cardTexture.repeat.set(1, 1)
        // DoubleSide: render texture on both sides of mesh
        var cardMaterial = new THREE.MeshBasicMaterial({
          map: cardTexture,
          side: THREE.DoubleSide
        })

        var cardGeometry = new THREE.PlaneGeometry(75, 75, 2, 2)
        var card = new THREE.Mesh(cardGeometry, cardMaterial)
        card.position.x = player.position.x
        card.position.y = 150
        card.position.z = player.position.z
        card.rotateY(Math.PI / 2)
        cards[player.color] = card

        add(cat)
        add(card)
      })
    }

    addCats = game => {
      loadCat(game.players.find(x => x.color === "orange"), game)
      loadCat(game.players.find(x => x.color === "blue"), game)
    }

    // note: 4x4 checkboard pattern scaled so that each square is 25 by 25 pixels.
    var floorTexture = new THREE.ImageUtils.loadTexture("/images/ground.jpg")
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
    floorTexture.repeat.set(1, 1)
    // DoubleSide: render texture on both sides of mesh
    var floorMaterial = new THREE.MeshBasicMaterial({
      map: floorTexture,
      side: THREE.DoubleSide
    })
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1)
    var floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.position.y = -0.5
    floor.rotation.x = Math.PI / 2
    scene.add(floor)

    var skyBoxGeometry = new THREE.SphereGeometry(10000, 25, 25)
    textureLoader.load("/images/space.jpg", skyTexture => {
      // skyTexture.repeat.set(10, 10)
      var skyBoxMaterial = new THREE.MeshPhongMaterial({
        map: skyTexture,
        side: THREE.BackSide
      })
      var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial)
      scene.add(skyBox)
    })

    // scene.fog = new THREE.FogExp2(0x9999ff, 0.00025)
  }

  function animate() {
    requestAnimationFrame(animate)
    render()
    update()
  }

  function update() {
    var delta = clock.getDelta()

    if (keyboard.pressed("1"))
      document.getElementById("message").innerHTML = " Have a nice day! - 1"
    if (keyboard.pressed("2"))
      document.getElementById("message").innerHTML = " Have a nice day! - 2 "

    controls.update()
    // stats.update()
  }

  function render() {
    renderer.render(scene, camera)
  }

  app.runApp({ addCats, killCat, maxMoveRadius, cats, cards, resetScene })
})()
