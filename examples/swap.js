const { ethers  } = require("ethers");
require('dotenv').config()
const provider = new ethers.providers.JsonRpcProvider(process.env.rpc)

const abi_router = [ 
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  'function factory() public view returns (address)',
  'function WETH() public view returns (address)',
];


const signer = new ethers.Wallet(process.env.wallet_private_key, provider);

start()

async function start(){
  const reserve0_address = process.env.reserve0_address
  const reserve1_address = process.env.reserve1_address
  let wallet_address = process.env.wallet_address
  const result = await swap(10, 9, [reserve0_address, reserve1_address], wallet_address)
  console.log(result)
}


async function swap(amount, amount_min, path, to_address) { 

  const contract_router = new ethers.Contract(process.env.router_contract, abi_router, provider, signer)
  try{
    let result = await contract_router.connect(signer).swapExactTokensForTokens( 
      ethers.utils.parseUnits(amount.toFixed(18), "ether"), 
      ethers.utils.parseUnits(amount_min.toFixed(18), "ether"), // this is the expected minimum output 
      path, 
      to_address, 
      Math.floor(Date.now() / 1000) + 600, 
      {
        gasLimit: 166830,
      }
    )
    return result
  }catch(err){
    console.log(err)
    return false
  }    

}
  