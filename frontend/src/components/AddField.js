import { motion } from "framer-motion";
import { useState } from "react";
import axios from "axios";

function AddField({ onClose }) {

  const [field, setField] = useState({
    fieldName: "",
    cropName: "",
    variety: "",
    season: "",
    sowingDate: "",
    state: "",
    district: "",
    mandal: "",
    latitude: "",
longitude: "",
    village: "",
    soilType: "",
    irrigation: "",
    area: ""
  });

  const handleSubmit = async () => {

  try {

    const token = localStorage.getItem("token");

    await axios.post(
      "http://127.0.0.1:5400/api/field/add",
      field,
      {
        headers:{
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert("Field Added Successfully 🌾");
    onClose();

  } catch(err){
    console.log(err);
    alert("Failed to Add Field ❌");
  }

};

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">

      <motion.div
        initial={{ scale:0.7, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        transition={{ duration:0.3 }}
        className="bg-white/30 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-[500px]"
      >

        <h2 className="text-2xl font-bold text-center mb-6">🌾 Add New Field</h2>

        {/* Crop Section */}
        <h3 className="font-semibold mb-2">🌱 Crop Details</h3>

        <input placeholder="Field Name"
          className="input"
          onChange={(e)=>setField({...field,fieldName:e.target.value})}/>

        <input placeholder="Crop Name"
          className="input"
          onChange={(e)=>setField({...field,cropName:e.target.value})}/>

        <input placeholder="Variety"
          className="input"
          onChange={(e)=>setField({...field,variety:e.target.value})}/>

        <input placeholder="Season"
          className="input"
          onChange={(e)=>setField({...field,season:e.target.value})}/>

        <input type="date"
          className="input"
          onChange={(e)=>setField({...field,sowingDate:e.target.value})}/>

        {/* Location */}
        <h3 className="font-semibold mt-4 mb-2">📍 Location</h3>

        <input placeholder="State"
          className="input"
          onChange={(e)=>setField({...field,state:e.target.value})}/>

        <input placeholder="District"
          className="input"
          onChange={(e)=>setField({...field,district:e.target.value})}/>

        <input placeholder="Mandal"
          className="input"
          onChange={(e)=>setField({...field,mandal:e.target.value})}/>

        <input placeholder="Village"
          className="input"
          onChange={(e)=>setField({...field,village:e.target.value})}/>

        {/* Soil */}
        <h3 className="font-semibold mt-4 mb-2">💧 Field Details</h3>

        <input placeholder="Soil Type"
          className="input"
          onChange={(e)=>setField({...field,soilType:e.target.value})}/>

        <input placeholder="Irrigation Type"
          className="input"
          onChange={(e)=>setField({...field,irrigation:e.target.value})}/>

        <input placeholder="Area (Acres)"
          className="input"
          onChange={(e)=>setField({...field,area:e.target.value})}/>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-green-700 text-white py-2 rounded-lg"
          >
            Save Field
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>

      </motion.div>
    </div>
  );
}

export default AddField;