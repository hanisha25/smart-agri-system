import pickle
import sys
import os
import pandas as pd

try:
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    model = pickle.load(open(model_path, "rb"))

    # Read inputs safely
    temp = float(sys.argv[1])
    humidity = float(sys.argv[2])
    rain = float(sys.argv[3])

    data = pd.DataFrame(
        [[temp, humidity, rain]],
        columns=["temperature", "humidity", "rainfall"]
    )

    prediction = model.predict(data)

    print(prediction[0])

except Exception as e:
    print("Prediction error")