import pandas as pd

import matplotlib.pyplot as plt
plt.close("all")

token1='USDC'
token2='DAI'



#### 1 ####

pair_df1 = pd.read_csv("./data/data_"+token1+"_"+token2+".csv",names=["pair", "date", "source", "dest"])


print(pair_df1.dest)

pair_df1.plot(y='dest', x='date')
pair_df1.delta=pair_df1.dest-pair_df1.source
pair_df1.plot.hist(y='dest',bins=1000,range=[1000,1010])
print(pair_df1.sort_values(by='dest'))

#### 2 ####

pair_df2 = pd.read_csv("./data/data_"+token2+"_"+token1+".csv",names=["pair", "date", "source", "dest"])


print(pair_df2.dest)

pair_df2.plot(y='dest', x='date')
pair_df2.plot.hist(y='dest',bins=1000,range=[1000,1010])

print(pair_df2.sort_values(by='dest'))
plt.show()

