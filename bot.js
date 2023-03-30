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

const abi_token = [ 
  "function approve(address spender, uint256 amount) external returns (bool res)",
];

const provider = new ethers.providers.JsonRpcProvider(process.env.rpc)

const signer = new ethers.Wallet(process.env.wallet_private_key, provider);

var reserve0_address = process.env.reserve0_address
var reserve1_address = process.env.reserve1_address
var amount_in0 = process.env.amount0
var amount_in1 = 0

let wallet_address = process.env.wallet_address

let last_res0 = ''
let last_res1 = ''



async function start(){

  let balance = await provider.getBalance(wallet_address)
  let balance_eth = ethers.utils.formatEther(balance)
  console.log(balance_eth)
  
  let contract_router = new ethers.Contract(process.env.router_contract, abi_router, provider, signer)

  let contract_token0 = new ethers.Contract(process.env.reserve0_address, abi_token, provider, signer)
  let contract_token1 = new ethers.Contract(process.env.reserve1_address, abi_token, provider, signer)

  
  
  let factory_address = await contract_router.factory()
  let WETH = await contract_router.WETH()
  console.log('factory_address')
  console.log(factory_address)
  console.log(WETH)

  let contract_factory = new ethers.Contract(factory_address, abi_factory, provider, signer)

  let pair_address = await contract_factory.getPair(process.env.reserve0_address, process.env.reserve1_address)

  console.log('pair')
  console.log(pair_address)

  let contract_pair = new ethers.Contract(pair_address, abi_pair, provider, signer)

  let token0 = await contract_pair.token0()

  if(token0 != process.env.reserve0_address){
    let temp_t = reserve0_address
    reserve0_address = reserve1_address
    reserve1_address = temp_t
    amount_in1 = amount_in0
  }

  let app_result0 = await contract_token0.connect(signer).approve(process.env.router_contract, '9999999999999999999999999999')
  let app_result1 = await contract_token1.connect(signer).approve(process.env.router_contract, '9999999999999999999999999999')

  console.log(app_result0)
  console.log(app_result1)
  let num_null = 0
  let num_status = 0
  while(1){
    await sleep(5000)

    if(last_res0!='' && last_res1!=''){
      let receipt0 = await provider.getTransactionReceipt(last_res0.hash);  
      let receipt1 = await provider.getTransactionReceipt(last_res1.hash);  
      if(!receipt0 || !receipt1){
        console.log('get receipt error')
        console.log(receipt0)
        console.log(receipt1)

        if(num_null > 5){
          last_res0 = ''
          last_res1 = ''
        }

        num_null++

        continue
      }else{
        if(receipt0.status != 1 || receipt1.status != 1){

          console.log('status error')
          console.log(receipt0)
          console.log(receipt1)
          last_res0 = ''
          last_res1 = ''

          if(num_status > 10){
            console.log('status error too much')
            return
          }
          num_status++
          continue
        }
      }
      
    }
    let price = await get_price(contract_pair)

    let price0 = price[0]
    let price1 = price[1]

    let amount1
    let amount0
    if(amount_in1){
      amount1 = Number(amount_in1)
      amount0 = price1*amount1
    }else{
      amount0 = Number(amount_in0)
      amount1 = price0*amount0
    }

    let min_amount0 = amount1*0.98
    let min_amount1 = amount0*0.98

    console.log('amount0')
    console.log(amount0)
    console.log(min_amount0)
    
    console.log('amount1')
    console.log(amount1)
    console.log(min_amount1)


    /*
    Promise.all(
      swap(contract_router, amount0, min_amount0, [reserve0_address, reserve1_address], wallet_address),
      swap(contract_router, amount1, min_amount1, [reserve1_address, reserve0_address], wallet_address)
    )*/

    let res0 = await swap(contract_router, amount0, min_amount0, [reserve0_address, reserve1_address], wallet_address)

    if(res0 == false){
      console.log('OH NO 0')
      return
    }
    //await res1.wait()
    let res1 = await swap(contract_router, amount1, min_amount1, [reserve1_address, reserve0_address], wallet_address)

    if(res1 == false){
      console.log('OH NO 1')
      return
    }

    //await res2.wait()
    last_res0 = res0
    last_res1 = res1
    
    console.log(res0)
    console.log(res1)

    
  }

  


}

async function get_price(contract_pair){

  let reserve = await contract_pair.getReserves()

  let num0 = Number(reserve[0])
  let num1 = Number(reserve[1])

  let token0_price = num1/num0
  let token1_price = num0/num1


  return [token0_price, token1_price]
}

start()



async function swap(contract_router, amount, amount_min, path, to_address) { 
  
    try{
      let result = await contract_router.connect(signer).swapExactTokensForTokens( 
        ethers.utils.parseUnits(amount.toFixed(18), "ether"), 
        ethers.utils.parseUnits(amount_min.toFixed(18), "ether"), // this is the expected minimum output 
        path, // notice the ordering of this array, give usdc, get weth 
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
    
    
    
    
    
    
async function sleep(ms){
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }