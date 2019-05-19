const NFTShares = artifacts.require('NFTShares')
const NFT = artifacts.require('./MockERC721.sol')

module.exports = function(deployer) {
  deployer.deploy(NFTShares)
  deployer.deploy(NFT, 'MyERC721', 'MyERC721')
}
