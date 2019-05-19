pragma solidity 0.5.8;

import '../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';
import '../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Holder.sol';
import './BasicERC20.sol';

contract NFTShares is ERC721Holder {
  struct custody{
    bool inCustody;
    address erc20;
  }
  // Associate an ERC721 with an ERC20
  mapping (address => mapping( uint256 => custody)) shareMap;

  function getShareToken(address _nftAddress, uint256 _tokenId) public view returns (address) {
    require(shareMap[_nftAddress][_tokenId].inCustody);
    return shareMap[_nftAddress][_tokenId].erc20;
}

  function splitNFT(
    address _nftAddress,
    uint256 _tokenId,
    string memory _tokenName,
    string memory _tokenSymbol
    ) public returns (address) {
    
    // Transfer custody of the ERC721 to this contract
    ERC721 _nft = ERC721(_nftAddress);
    _nft.safeTransferFrom(msg.sender, address(this), _tokenId);

    // Mint a new ERC20 representing shares in this ERC721
    BasicERC20 _newShares = new BasicERC20(_tokenName, _tokenSymbol, msg.sender);
    shareMap[address(_nft)][_tokenId].erc20 = address(_newShares);
    shareMap[address(_nft)][_tokenId].inCustody = true;

    return address(_newShares);
  }

  function reclaimNFT(
    address _nftAddress,
    uint256 _tokenId
  ) public {
    require(shareMap[_nftAddress][_tokenId].inCustody);
    BasicERC20 _shares = BasicERC20(shareMap[_nftAddress][_tokenId].erc20);
    ERC721 _nft = ERC721(_nftAddress);
    shareMap[address(_nft)][_tokenId].inCustody = false;
    if (_shares.balanceOf(msg.sender) == _shares.totalSupply()) {
      _nft.safeTransferFrom(address(this), msg.sender, _tokenId);
    }
  }

}
