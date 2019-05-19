const NFTShares = artifacts.require('NFTShares')
const NFT = artifacts.require('MockERC721')
const ERC20 = artifacts.require('ERC20')
const BN = require('bn.js')

let nft
let nftShares

contract('NFTShares', async accounts => {
  beforeEach(async () => {
    nft = await NFT.new('MockNFT', 'MockNFT')
    nft.mintUniqueTokenTo(accounts[0], 1, 'MockNFT1')
    nftShares = await NFTShares.deployed()
    await nft.approve(nftShares.address, 1)
  })
  it('Gives an NFT to account 0', async () => {
    let owner = await nft.ownerOf(1)
    assert.equal(owner, accounts[0])
  })
  it('Approves nftshares to transfer token', async () => {
    let approved = await nft.getApproved(1)
    assert.equal(approved, nftShares.address)
  })
  it('Allows NFT to be transferred to nftshares', async () => {
    await nftShares.splitNFT(nft.address, 1, 'mock', 'mock')
    let owner = await nft.ownerOf(1)
    assert.equal(owner, nftShares.address)
  })
  it('Gives all nftshares to sender', async () => {
    await nftShares.splitNFT(nft.address, 1, 'mock', 'mock')
    let newSharesAddress = await nftShares.getShareToken.call(nft.address, 1)
    let newShares = await ERC20.at(newSharesAddress)
    let totalSupply = await newShares.totalSupply.call()
    let balance = await newShares.balanceOf(accounts[0])
    assert.deepEqual(totalSupply, balance)
  })
  it('Allows sender to reclaim nft if they have all tokens', async () => {
    await nftShares.splitNFT(nft.address, 1, 'mock', 'mock')
    await nftShares.reclaimNFT(nft.address, 1)
    let owner = await nft.ownerOf(1)
    assert.equal(owner, accounts[0])
  })
  it('Allows another account to reclaim nft if they have all tokens', async () => {
    await nftShares.splitNFT(nft.address, 1, 'mock', 'mock')
    let newSharesAddress = await nftShares.getShareToken.call(nft.address, 1)
    let newShares = await ERC20.at(newSharesAddress)
    let totalSupply = await newShares.totalSupply.call()
    await newShares.transfer(accounts[1], totalSupply)
    await nftShares.reclaimNFT(nft.address, 1, { from: accounts[1] })
    let owner = await nft.ownerOf(1)
    assert.equal(owner, accounts[1])
  })
  it('Does not allows anyone else to reclaim NFT', async () => {
    await nftShares.splitNFT(nft.address, 1, 'mock', 'mock')
    let newSharesAddress = await nftShares.getShareToken.call(nft.address, 1)
    let newShares = await ERC20.at(newSharesAddress)
    let totalSupply = await newShares.totalSupply.call()
    await newShares.transfer(
      accounts[1],
      new BN(web3.utils.toWei('99', 'ether'))
    )
    await nftShares.reclaimNFT(nft.address, 1, { from: accounts[1] })
    let owner = await nft.ownerOf(1)
    assert.equal(owner, nftShares.address)
  })
})
