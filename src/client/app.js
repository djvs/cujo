import React, { Component } from "react"
import "./app.css"
import ReactDOM from "react-dom"
import axios from "axios"
const celer = require("celer-web-sdk")
import Web3 from "web3"
var contract = require("truffle-contract")

export const runApp = (loadCat, killCat) => {
  class App extends Component {
    interval = false

    // TODO empty this after register works
    state = {
      player: { color: "blue" },
      game: {
        players: [
          {
            color: "orange",
            image_url:
              "https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/150.png",
            pubkey: "0x9999",
            position: {
              x: -10,
              z: -10
            }
          },
          {
            color: "blue",
            image_url:
              "https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/202.png",
            pubkey: "0x0000",
            position: {
              x: 0,
              z: 0
            }
          }
        ]
      }
    }

    register = async () => {
      // TODO delete this after register works
      this.state.game.players.forEach(loadCat)

      try {
        if (window.ethereum) {
          window.web3 = new Web3(ethereum)
          // Request account access if needed
          await ethereum.enable()
        } else {
          throw new Error("no ethereum found")
        }
        // const nftInstance = await NFT.at(nftAddress)
        // await nftInstance.approve(nftSharesAddress, 1)
        // Acccounts now exposed
        // if (typeof window.ethereum === 'undefined') throw new Error('No ethereum found')
        // // If a user is logged in to Dapper and has previously approved the dapp,
        // // `ethereum.enable` will return the result of `eth_accounts`.
        // const accounts = await window.ethereum.enable();
        // const provider = window.ethereum
        // const web3 = new Web3(provider)
        // Approve NFTShare to transfer a kitty
        // Deposit a crypto kitty
        // Deposit into a celer channel
        // Celer send to game escrow
        const message = "register"
        const accounts = await web3.eth.getAccounts()
        const signature = await web3.eth.personal.sign(
          message,
          accounts[0],
          ""
        )
        console.log(signature)
        axios
          .post("/api/register", {
            sig: signature,
            addr: accounts[0]
          })
          .then(res => this.setGameState)
      } catch (err) {
        console.log(err.message)
        alert("Sorry, couldn't register!")
      }
    }

    movePlayers = game => {
      console.log("Moving players", game)
      game.players.forEach(player => {
        cats[player.color].position.x = player.position.x
        cats[player.color].position.z = player.position.z
      })
    }

    startPolling = () => {
      this.interval = setInterval(this.getGameState, 2500)
    }

    getGameState = () => {
      try {
        axios({ method: "GET", url: "/api/game" }).then(this.setGameState)
      } catch (err) {
        console.log("Couldn't get game state!", err)
      }
    }

    setGameState = res => {
      let data = res.data
      console.log("SGS", data)
      // move the players
      this.movePlayers(data.game)

      // kill a cat if somebody lost
      if (data.game.state === "won" && this.state.game.state !== "won") {
        killCat(data.game.loser)
      }

      // set the state on react (is this useless?)
      let setObj = {
        game: data.game,
        player: data.player
      }
      this.setState(setObj)
    }

    componentDidMount() {
      this.register()
      this.startPolling()
    }

    circleClick = async e => {
      const rect = e.target.getBoundingClientRect()
      const midx = rect.width / 2
      const midy = rect.height / 2 // should be the same as midx

      const moveMultiplierX = maxMoveRadius / midx
      const moveMultiplierY = maxMoveRadius / midy

      const x = (e.clientX - rect.left - midx) * moveMultiplierX
      const y = -(e.clientY - rect.top - midy) * moveMultiplierY // y is inverted in browser as compared to 2d cartesian coords

      const result = { x, z: y } // z is the horizontal plane on the board, not y
      console.log("xy", result)

      const moveStr = JSON.stringify(result)
      const accounts = await web3.eth.getAccounts()
      const signature = await web3.eth.personal.sign(
        moveStr,
        accounts[0],
        ""
      )

      let res = await axios({
        method: "POST",
        url: "/api/move",
        data: {
          move: moveStr,
          sig: signature,
          addr: this.state.addr
        }
      })

      this.setGameState(res)
    }

    render() {
      const { player } = this.state
      return (
        <div className="headerinner">
          <div className="gametitle">
            CUJO
            <small>SATISFY YOUR CRYPTO KITTY BLOOD LUST</small>
          </div>
          {!this.state.game && <div className="gamectrl">Waiting...</div>}
          {this.state.game && (
            <div className="gamectrl">
              {this.state.game.players.length === 1 && (
                <div className="waiting">Waiting for another player...</div>
              )}
              {this.state.game.players.length === 2 && (
                <div className="activectrls">
                  <div className="clickcirc" onClick={this.circleClick} />
                  {this.state.player && (
                    <p className="youare">
                      You are the <strong>{this.state.player.color}</strong>{" "}
                      player.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  }

  ReactDOM.render(<App />, document.getElementById("root"))
}
