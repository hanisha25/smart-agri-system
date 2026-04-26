import { motion } from "framer-motion";
import { useState } from "react";
import axios from "axios";
import { apiUrl } from "../api";

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
    area: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
  });

  const handleSubmit = async () => {

  try {

    const token = localStorage.getItem("token");

    await axios.post(
      apiUrl("/api/field/add"),
      field,
      {
        headers:{
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert("Field added successfully");
    onClose();

  } catch(err){
    console.log(err);
    alert("Failed to Add Field ❌");
  }

};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8" onClick={onClose}>

      <motion.div
        initial={{ scale:0.7, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        transition={{ duration:0.3 }}
        className="w-full max-w-2xl rounded-[28px] border border-white/60 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >

        <h2 className="mb-6 text-2xl font-bold text-center">🌾 Add New Field</h2>

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

        {/* Soil Test Data */}
        <h3 className="font-semibold mt-4 mb-2">🧪 Soil Test Data <span className="text-slate-400 font-normal text-sm">(optional — improves crop recommendations)</span></h3>

        <input placeholder="Nitrogen content (kg/ha)"
          type="number"
          min="0"
          className="input"
          onChange={(e)=>setField({...field,nitrogen:e.target.value})}/>

        <input placeholder="Phosphorus content (kg/ha)"
          type="number"
          min="0"
          className="input"
          onChange={(e)=>setField({...field,phosphorus:e.target.value})}/>

        <input placeholder="Potassium content (kg/ha)"
          type="number"
          min="0"
          className="input"
          onChange={(e)=>setField({...field,potassium:e.target.value})}/>

        <input placeholder="Soil pH (0–14)"
          type="number"
          min="0"
          max="14"
          step="0.1"
          className="input"
          onChange={(e)=>setField({...field,ph:e.target.value})}/>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-full bg-green-700 py-3 text-white"
          >
            Save Field
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 bg-white py-3 text-slate-700"
          >
            Cancel
          </button>
        </div>

      </motion.div>
    </div>
  );
}

export default AddField;
