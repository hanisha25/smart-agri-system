import pandas as pd
import sys
import os

try:
    temp = float(sys.argv[1])
    humidity = float(sys.argv[2])
    rain = float(sys.argv[3])
    label = sys.argv[4]

    file_path = os.path.join(os.path.dirname(__file__), "dataset.csv")

    df = pd.DataFrame(
        [[temp, humidity, rain, label]],
        columns=["temperature", "humidity", "rainfall", "label"]
    )

    # ✅ Append real data
    df.to_csv(file_path, mode="a", header=not os.path.exists(file_path), index=False)

    print("Data appended")

except Exception as e:
    print("Error appending data")