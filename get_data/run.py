import get_data_template
import tokens
import time

# print(tokens.tokens)

USDC=tokens.tokens["USDC"]
DAI=tokens.tokens["DAI"]
USDT=tokens.tokens["USDT"]
network={"name":"POLYGON", "id" :137}

while True :
    time.sleep(2)
    get_data_template.main(USDC,DAI,network)
    get_data_template.main(DAI,USDC,network)
    get_data_template.main(USDT,USDC,network)
    get_data_template.main(USDC,USDT,network)
    get_data_template.main(USDT,DAI,network)
    get_data_template.main(DAI,USDT,network)
