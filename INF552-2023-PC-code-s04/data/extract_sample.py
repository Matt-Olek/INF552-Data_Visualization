#!/opt/homebrew/bin/python3

# original data from https://www.kaggle.com/datasets/realkiller69/gaia-data-set-for-stellar-classificationdr3

import pandas as pd

SAMPLE_FRAC = 0.01
INPUT_DATA = "gaia_DR3.csv"
OUTPUT_DATA = "sample_gaia_DR3.csv"

HEADER_MAP = {"BP-RP":"BR_RP",
              "BP-G":"BP_G",
              "G-RP":"G_RP",
              "Lum-Flame":"Lum_Flame",
              "Mass-Flame":"Mass_Flame",
              "Age-Flame":"Age_Flame",
              "z-Flame":"z_Flame",
              "SpType-ELS":"SpType_ELS"}

print("Pandas %s" % pd.__version__)

print("Loading %s" % INPUT_DATA)

df = pd.read_csv(INPUT_DATA)

df = df.rename(columns=HEADER_MAP, errors="raise")

print("Sampling %.1f%% of %d rows" % ((SAMPLE_FRAC*100), len(df)))

sample_rows = df.sample(frac=SAMPLE_FRAC)
print("--------------------------")
print(sample_rows)
print("--------------------------")

print("Writing %d rows to %s" % (len(sample_rows), OUTPUT_DATA))
sample_rows.to_csv(OUTPUT_DATA)
