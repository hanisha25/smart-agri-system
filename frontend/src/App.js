import { useState } from "react";
import { predictCrop } from "./api";

function App() {
  const [prediction, setPrediction] = useState("");

  const handlePredict = async () => {
    console.log("Button clicked");
    const data = {
      N: 90,
      P: 40,
      K: 40,
      temperature: 25,
      humidity: 80,
      ph: 6.5,
      rainfall: 200,
      soil_type: "loamy",
      previous_crop: "none",
    };

    const res = await predictCrop(data);
    console.log("Response:", res);
    setPrediction(res?.recommended_crop || "No result");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Crop Recommendation</h1>

      <button onClick={handlePredict}>
        Predict Crop
      </button>

      {prediction && (
        <h2>Result: {prediction}</h2>
      )}
    </div>
  );
}

export default App;