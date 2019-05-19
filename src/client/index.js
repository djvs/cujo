import React, { Component } from "react"
import "./app.css"
// import ReactImage from './react.png'
import ReactDOM from "react-dom"
import axios from "axios"
const celer = require("celer-web-sdk")
import Web3 from "web3"
var app = require("./app")
  ; (function () {
    var scene, loadCat, addCats

    const maxMoveRadius = 40

    var container, scene, camera, renderer, controls, stats
    var keyboard = new THREEx.KeyboardState()
    var clock = new THREE.Clock()

    init()

    animate()

    const killCat = color => {
      console.log("Killing the cat", color)
      var audio = new Audio("/audio/scream.mp3")
      audio.play()
      var exploded
      var cat = cats[color]
      var card = cards[color]

      window.gltfLoader.load("/exploded.gltf", function (gltf) {
        var bloodTexture = new THREE.ImageUtils.loadTexture("/images/blood.jpg")
        bloodTexture.wrapS = bloodTexture.wrapT = THREE.RepeatWrapping
        bloodTexture.repeat.set(10, 10)
        // DoubleSide: render texture on both sides of mesh
        var bloodMaterial = new THREE.MeshBasicMaterial({
          map: bloodTexture,
          side: THREE.DoubleSide
        })

        exploded = gltf.scene
        Object.assign(exploded.position, cat.position)
        exploded.scale.x = 7
        exploded.scale.y = 7
        exploded.scale.z = 7
        exploded.rotateX(-Math.PI / 2)
        exploded.rotateZ(Math.PI)
        exploded.children[0].material = bloodMaterial
        add(exploded)
      })
      scene.remove(cat)
      scene.remove(card)

      setTimeout(() => {
        scene.remove(exploded)
      }, 3000)
    }

    function getHeightData(img) {
      var canvas = document.createElement("canvas")
      canvas.width = 1024
      canvas.height = 1024
      var context = canvas.getContext("2d")

      var size = 1024 * 1024,
        data = new Float32Array(size)

      context.drawImage(img, 0, 0)

      for (var i = 0; i < size; i++) {
        data[i] = 0
      }

      var imgd = context.getImageData(0, 0, 1024, 1024)
      var pix = imgd.data

      var j = 0
      for (var i = 0, n = pix.length; i < n; i += 4) {
        var all = pix[i] + pix[i + 1] + pix[i + 2]
        data[j++] = all / 30
      }

      return data
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

      /* stats = new Stats()
    stats.domElement.style.position = "absolute"
    stats.domElement.style.bottom = "0px"
    stats.domElement.style.zIndex = 100
    container.appendChild(stats.domElement)
   */

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

      /* 
    var sphereGeometry = new THREE.SphereGeometry(50, 32, 16)
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x8888ff })
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(100, 50, -50)
    scene.add(sphere)
  
    // Create an array of materials to be used in a cube, one for each side
    var cubeMaterialArray = []
    // order to add materials: x+,x-,y+,y-,z+,z-
    cubeMaterialArray.push(new THREE.MeshBasicMaterial({ color: 0xff3333 }))
    cubeMaterialArray.push(new THREE.MeshBasicMaterial({ color: 0xff8800 }))
    cubeMaterialArray.push(new THREE.MeshBasicMaterial({ color: 0xffff33 }))
    cubeMaterialArray.push(new THREE.MeshBasicMaterial({ color: 0x33ff33 }))
    cubeMaterialArray.push(new THREE.MeshBasicMaterial({ color: 0x3333ff }))
    cubeMaterialArray.push(new THREE.MeshBasicMaterial({ color: 0x8833ff }))
  
    var cubeMaterials = new THREE.MeshFaceMaterial(cubeMaterialArray)
    var cubeGeometry = new THREE.CubeGeometry(100, 100, 100, 1, 1, 1)
    cube = new THREE.Mesh(cubeGeometry, cubeMaterials)
    cube.position.set(-100, 50, -50)
    scene.add(cube)
   */

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
      loadCat = player => {
        window.gltfLoader.load("/cat.gltf", function (gltf) {
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

          console.log("image url", player.image_url)
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

          console.log("card assign?")
          var cardGeometry = new THREE.PlaneGeometry(75, 75, 2, 2)
          var card = new THREE.Mesh(cardGeometry, cardMaterial)
          card.position.x = player.position.x
          card.position.y = 150
          card.position.z = player.position.z
          card.rotateY(Math.PI / 2)
          console.log("card assign...")
          cards[player.color] = card

          add(cat)
          add(card)
        })
      }

      addCats = game => {
        loadCat(game.players.find(x => x.color === "orange"))
        loadCat(game.players.find(x => x.color === "blue"))
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

    app.runApp(loadCat, killCat)
  })()
