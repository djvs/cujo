const path = require("path")
const axios = require("axios")
const express = require("express")
const os = require("os")
const R = require("ramda")
const secp256k1 = require("secp256k1")
const bodyParser = require("body-parser")
const eju = require("ethereumjs-util")
const request = require("request")
const wallet = require("ethereumjs-wallet")

const app = express()

require("dotenv").config()

// GAME STATE ////////////////////////////////
var game

// player structure: {
//   addr: "0x...",
//   color: "blue" | "orange",
//   position: {x: -400, z: -400} // to 400, 400
// }

const resetGame = () => {
  game = {
    state: "initial",
    players: []
  }
}

const kitties = {
  blue:
    "https://img.cn.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/202.png",
  orange:
    "https://img.cn.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/150.png"
}

/*
const resetGame = () => {
  game = {
    state: "won",
    winner: "blue",
    loser: "orange",
    players: [
      {
        image_url:
        color: "orange",
        addr: "0x9999",
        position: {
          x: -10,
          z: -10
        }
      },
      {
        image_url:
        color: "blue",
        addr: "0x0000",
        position: {
          x: 0,
          z: 0
        }
      }
    ]
  }
} */

resetGame()

const defaultPositions = {
  orange: { x: -400, z: -400 },
  blue: { x: 400, z: 400 }
}

const colors = ["orange", "blue"]

// GAME STATE HELPERS ////////////////////////

const startGame = () => {
  game.state = "playing"
}

const moveOutOfBounds = pos => {
  if (Math.abs(pos.x) > 400 || Math.abs(pos.z) > 400) {
  }
}

const mergePos = (p1, p2) => {
  return { x: p1.x + p2.x, z: p1.z + p2.z }
}

const maxMoveRadius = 40

const isValidSig = (msgStr, sig, addr) => {
  try {
    const digest = eju.hashPersonalMessage(eju.toBuffer(msgStr))
    // Extract the signature parts so we can recover the public key
    const sigParts = eju.fromRpcSig(sig)
    // Recover public key from the hash of the message we constructed and the signature the user provided
    const recoveredPubkey = eju.ecrecover(
      digest,
      sigParts.v,
      sigParts.r,
      sigParts.s
    )
    // Convert the recovered public key into the corresponding ethereum address
    const recoveredAddress = wallet
      .fromPublicKey(new Buffer(recoveredPubkey, "hex"))
      .getAddressString()

    return recoveredAddress.toLowerCase() === addr.toLowerCase()
  } catch (err) {
    console.log(err.message)
    return false
  }
}

const validMove = (player, move) => {
  // is the move initially valid?
  if (
    typeof move !== "object" ||
    typeof move.x !== "number" ||
    typeof move.z !== "number"
  ) {
    console.log("invalid move obj")
    return null
  }
  if (Math.sqrt(move.x ** 2 + move.z ** 2) > maxMoveRadius) {
    console.log("move outside bounds")
    return null
  }
  let newpos = mergePos(player.position, move)
  if (moveOutOfBounds(newpos)) {
    return null
  }

  // fuck it up randomly (2/3 chance)
  if (Math.random() > 1 / 3) {
    let foundAValidFuckup = false
    var fuckup
    while (!foundAValidFuckup) {
      fuckup = { x: Math.random() * 20, z: Math.random() * 20 }
      foundAValidFuckup = !moveOutOfBounds(mergePos(newpos, fuckup))
    }
    newpos = mergePos(newpos, fuckup)
  }
  return newpos
}

// def susceptible to replay attacks :(
const getPlayer = (addr, sig, moveStr) => {
  // does that player exist
  let player = game.players.find(x => x.addr === addr)
  if (!player) return null

  // is the sig valid
  let sigValidity = isValidSig(moveStr, sig, addr)
  if (!sigValidity) return null

  return player
}

const getKitty = async id => {
  console.log("getting kitty", id, process.env)
  let result = await axios({
    headers: {
      "x-api-token": process.env.CRYPTOKITTIES_API_TOKEN
    },
    method: "GET",
    url: "https://public.api.cryptokitties.co/v1/kitties/" + id
  })
  console.log("got kitty", result.data)
}

/* let k1 = getKitty(150)
let k2 = getKitty(202)
game.players[0].image = k1.image_url_png */

const getOtherPlayer = player => {
  return game.players.find(x => x !== player)
}

const concludeGame = winner => {
  game.state = "won"
  game.winner = winner.color
  game.loser = colors.find(x => x != winner.color)
}

const commitMove = (player1, moveResult) => {
  console.log("CMP1", player1)
  player1.position = moveResult
  player2 = getOtherPlayer(player1)
  console.log("CMP2", player2)
  const diffX = player1.position.x - player2.position.x
  const diffY = player1.position.y - player2.position.y
  if (Math.sqrt(diffX ** 2 + diffY ** 2) < 30) {
    concludeGame(player1)
  }
}

// API ///////////////////////////////////////

app.use(bodyParser.json())

app.use(express.static("dist"))

app.use(express.static(path.join(__dirname, "/public")))

app.post("/api/move", (req, res) => {
  /* 
  if (game.players.length !== 2) return res.status(400).json("bad_player_count")

  const player = getPlayer(req.body.addr, req.body.sig, req.body.move)
  if (player === null) {
    return res.status(400).json("no_player")
  }

*/
  const player = game.players.find(x => x.color === "blue")

  const move = JSON.parse(req.body.move)

  let moveResult = validMove(player, move)
  if (!moveResult) return res.status(400).json("invalid_move")

  // persist moveResult (which if not null is a new position for the player), which will also change the game state if it's a win
  commitMove(player, moveResult)

  res.json({ game })
})

app.get("/api/game", (req, res) => {
  console.log("Game poll", game)
  res.json({ game })
})

app.get("/api/image", (req, res) => {
  if (req.query.url.indexOf("https://img.cn.cryptokitties.co/0x" === -1)) {
    request.get(req.query.url).pipe(res)
  } else {
    console.log("Invalid image url requested", req.query.url)
  }
})

app.get("/api/nuke", (req, res) => {
  resetGame()
  res.json({ success: true })
})

app.post("/api/register", (req, res) => {
  // doesn't have a real locking mechanism so not really safe
  if (game.players.length > 2) return res.status(400).json("too_many_players")

  let sigValidity = isValidSig("register", req.body.sig, req.body.addr)
  if (!sigValidity) return res.status(400).json("invalid_sig")

  const takenColors = R.pluck("color", game.players)
  console.log("taken colors", takenColors)
  const color = colors.find(c => takenColors.indexOf(c) === -1) // orange, if orange is taken, blue

  const player = {
    addr: req.body.addr,
    color: color,
    image_url: kitties[color],
    position: defaultPositions[color]
  }

  let existing = game.players.find(x => x.addr === req.body.addr)
  if (existing) {
    game.players = game.players.filter(x => x != existing)
  } // let players reset if they refresh, lol
  /* if (R.pluck("addr", game.players).indexOf(player.addr) != -1) {
    return res.status(400).json("already_playing")
  } */

  game.players.push(player)

  if (game.players.length == 2) {
    startGame()
  }

  res.json({ game: game, player: player })
})

// SERVER ///////////////////////////////////

app.listen(
  process.env.PORT || 8080,
  process.env.EXPRESS_BIND || "0.0.0.0",
  () => console.log(`Listening on port ${process.env.PORT || 8080}!`)
)
