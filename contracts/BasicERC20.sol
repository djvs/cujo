pragma solidity 0.5.8;

import '../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import '../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';

contract BasicERC20 is ERC20, ERC20Detailed {

  uint8 public constant DECIMALS = 18;
  uint256 public constant INITIAL_SUPPLY = 100 * (10 ** uint256(DECIMALS));

  /**
    * @dev Constructor that gives _initialHolder all of existing tokens.
    */
  constructor (string memory _name, string memory _symbol, address _initialHolder) public ERC20Detailed(_name, _symbol, DECIMALS) {
      _mint(_initialHolder, INITIAL_SUPPLY);
  }
}
