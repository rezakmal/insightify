import pandas as pd
from sklearn.preprocessing import StandardScaler

class Prepare:
    def __init__(self, df_activity, df_completion, df_exam):
        self.df_activity = pd.read_csv(df_activity, index_col=0)
        self.df_completion = pd.read_csv(df_completion, index_col=0)
        self.df_exam = pd.read_csv(df_exam, index_col=0)

    def clean():
        

    
