const { ethers  } = require("ethers");
require('dotenv').config()



const abi_router = [ 
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  'function factory() public view returns (address)',
  'function WETH() public view returns (address)',
];

const abi_factory = [ 
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

const abi_pair = [ 
  "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)",
  "function token0() public view returns (address)",
  "function token1() public view returns (address)",
];

const provider = new ethers.providers.JsonRpcProvider(process.env.rpc)

async function start(){
  
  let contract_router = new ethers.Contract(process.env.router_contract, abi_router, provider)
  
  
  let factory_address = await contract_router.factory() //get factory address

  let contract_factory = new ethers.Contract(factory_address, abi_factory, provider)

  let pair_address = await contract_factory.getPair(process.env.reserve0_address, process.env.reserve1_address) //get pair address

  let contract_pair = new ethers.Contract(pair_address, abi_pair, provider)

  let token0 = await contract_pair.token0()
  let token1 = await contract_pair.token1()

  const price = await get_price(contract_pair)
  

  console.log('token0')
  console.log(token0)
  console.log('token1')
  console.log(token1)
  console.log('price')
  console.log(price)
  


}

async function get_price(contract_pair){

  let reserve = await contract_pair.getReserves()

  let num0 = Number(reserve[0])
  let num1 = Number(reserve[1])

  let token0_price = num1/num0
  let token1_price = num0/num1


  return {token0_price, token1_price}
}

start()


