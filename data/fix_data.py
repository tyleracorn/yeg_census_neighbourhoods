import numpy as np
import pandas as pd

#%%

df = pd.read_csv('NCensus_Income.csv')

#%%
flat_df = pd.DataFrame(columns=['name', 'census_type', 'census_type_value',
                                'pct_category', 'pct',
                                'LI_greater_than_MC',
                                'POINT_X', 'POINT_Y', 'Assessed_Value_Sum',
                                'Avg_Assessed_Value'])

#%%

category_name = {'Pct_less_than_30k': 'Household Income: Less than $30K',
                 'Pct_30K_to_60K': 'Household Income: $30K to $60K',
                 'Pct_60K_to_100K': 'Household Income: $60K to 100K',
                 'Pct_100K_to_125K': 'Household Income: $100K to $125k',
                 'Pct_125K_150K': 'Household Income: $125K to $150K',
                 'Pct_150K_to_200K': 'Household Income: $150K to 200K',
                 'Pct_200K_to_250K': 'Household Income: $200K to $250k',
                 'Pct_250K_or_more': 'Household Income: Over $250K'}
count = 0
for idx, row in df.iterrows():
    #print(row['name'])
    for ctype, pct_type in zip(['c2016_Less_than_30K', 'c2016_30K_to_60K', 'c2016_60K_to_100K',
                                'c2016_100K_to_125K', 'c2016_125K_to_150K', 'c2016_150K_to_200K',
                                'c2016_200K_to_250K', 'c2016_250K_or_more'],
                               ['Pct_less_than_30k', 'Pct_30K_to_60K', 'Pct_60K_to_100K',
                                'Pct_100K_to_125K', 'Pct_125K_150K', 'Pct_150K_to_200K',
                                'Pct_200K_to_250K', 'Pct_250K_or_more']):
        flat_df.loc[count, 'name'] = row['name']
        flat_df.loc[count, 'census_type'] = ctype
        flat_df.loc[count, 'census_type_value'] = row[ctype]
        flat_df.loc[count, 'pct_category'] = category_name[pct_type]
        flat_df.loc[count, 'pct'] = row[pct_type]
        flat_df.loc[count, 'LI_greater_than_MC'] = row['LI_greater_than_MC']
        flat_df.loc[count, 'POINT_X'] = row['POINT_X']
        flat_df.loc[count, 'POINT_Y'] = row['POINT_Y']
        flat_df.loc[count, 'Assessed_Value_Sum'] = row['Assessed_Value_Sum']
        flat_df.loc[count, 'Avg_Assessed_Value'] = row['Avg_Assessed_Value']
        count += 1

#%%
flat_df.to_csv('NCensus_Income_flat.csv')

flat_df = pd.DataFrame(columns=['name', 'LI_greater_than_MC',
                                'incomeBracket', 'pctInBracket',
                                'POINT_X', 'POINT_Y', 'Assessed_Value_Sum',
                                'Avg_Assessed_Value'])

count = 0
for idx, row in df.iterrows():
    #print(row['name'])
    for ctype, pct in zip(['Low Income (Less than $60K)', 'Middle Class (between $60K and $150K)', 'High Income (Over $150K)'],
                          ['Pct_LowIncome_less_than_60K', 'Pct_MiddleClass_60K_to_150K', 'Pct_Over_150K']):

        flat_df.loc[count, 'name'] = row['name']
        flat_df.loc[count, 'LI_greater_than_MC'] = row['LI_greater_than_MC']

        flat_df.loc[count, 'incomeBracket'] = ctype
        flat_df.loc[count, 'pctInBracket'] = row[pct]

        flat_df.loc[count, 'POINT_X'] = row['POINT_X']
        flat_df.loc[count, 'POINT_Y'] = row['POINT_Y']
        flat_df.loc[count, 'Assessed_Value_Sum'] = row['Assessed_Value_Sum']
        flat_df.loc[count, 'Avg_Assessed_Value'] = row['Avg_Assessed_Value']
        count += 1

flat_df.to_csv('NCensus_IncomeBracket_flat.csv')
