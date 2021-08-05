import numpy
import requests
import json
import csv
import time
from datetime import datetime

from requests.api import get

# from python-dotenv import load_dotenv


# load_dotenv()
# py -m pip update requests 


# INIT 
network={"name":"POLYGON", "id" :137}
tokens={"DAI":{
            "symb":"DAI",
            "decimals":18,
            "adress":'0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'},
        "USDT":{
            "symb":"USDT",
            "decimals":6,
            "adress":'0xc2132d05d31c914a87c6611c10748aeb04b58e8f'},   
        "USDC":{
            "symb":"USDC",
            "decimals": 6,
            "adress": '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        },
        }


def normalise(amount, token):
    return (amount*pow(10,token["decimals"]))

def denormalise(amount, token):
    return (amount/pow(10,token["decimals"]))



def get_rate(fr,to, amount, network):
    url_api='https://apiv4.paraswap.io/v2'
    prices_url=str(url_api+'/prices/?from='+fr["adress"]+"&to="+to["adress"]+'&amount='+str(normalise(amount,fr))+'&fromDecimals='+str(fr['decimals'])+'&toDecimals='+str(to['decimals'])+'&side=SELL&network='+str(network["id"]))
    # print(prices_url)
    response=requests.get(prices_url).json()
    # print(response['priceRoute']['bestRoute'][0])
    destAmount=denormalise(int(response['priceRoute']['bestRoute'][0]['destAmountFeeDeducted']),to)
    # print(destAmount)

    now = datetime.now()
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S")

    push=[fr["symb"]+'/'+to["symb"],dt_string, amount, destAmount]
    print(push)
    return push



    
# get_rate(tokens["USDC"],tokens["USDT"],1000,network)

        
def manage_file(name,list):

    with open(name, "a") as f:
        # reader = csv.reader(f)
        # i = reader.next()
        # rest = list(reader)
        writer = csv.writer(f)
        writer.writerow(list)
        f.close()

def  main(tokens, network):
    while True:
        time.sleep(10)
        list=get_rate(tokens["USDC"],tokens["USDT"],1000,network)
        manage_file('C:/Users/Ruffie Luc/PERSO/dev/CrossChainArbitrageBot-master/get_data/data/data_usdc_usdt.csv',list)


main(tokens, network)