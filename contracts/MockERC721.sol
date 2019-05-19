pragma solidity 0.5.8;

import '../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol';

contract MockERC721 is ERC721Metadata{

    constructor (string memory _name, string memory _symbol) public
        ERC721Metadata(_name, _symbol)
    {
    }

    /**
    * Custom accessor to create a unique token
    */
    function mintUniqueTokenTo(
        address _to,
        uint256 _tokenId,
        string  memory _tokenURI
    ) public
    {
        super._mint(_to, _tokenId);
        super._setTokenURI(_tokenId, _tokenURI);
    }
}
