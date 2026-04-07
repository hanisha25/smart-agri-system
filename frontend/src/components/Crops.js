import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import AddField from "./AddField";
import axios from "axios";

function Crops() {

  const [showAdd, setShowAdd] = useState(false);
  const [fields, setFields] = useState([]);

  const fetchFields = async () => {
    try {

      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://127.0.0.1:5400/api/field/my-fields",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setFields(res.data);

    } catch(err) {
      console.log("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-6">

      <h2 className="text-2xl font-bold mb-4">🌾 My Fields</h2>

      <button
        onClick={()=>setShowAdd(true)}
        className="bg-green-700 text-white px-4 py-2 rounded-lg mb-6"
      >
        ➕ Add New Field
      </button>

      {/* Field List */}
      <div className="grid grid-cols-2 gap-6">

        {fields.map((field, index)=>(
          <motion.div
            key={index}
            whileHover={{scale:1.03}}
            className="bg-white/20 backdrop-blur-lg p-4 rounded-xl shadow"
          >
            <h3 className="text-lg font-semibold">
              🌱 {field.cropName}
            </h3>
            <p>📍 {field.village}, {field.district}</p>
            <p>🧪 Soil: {field.soilType}</p>
            <p>💧 Irrigation: {field.irrigation}</p>
            <p>📏 Area: {field.area} Acres</p>
          </motion.div>
        ))}

      </div>

      {showAdd && (
        <AddField
          onClose={()=>{
            setShowAdd(false);
            fetchFields(); // 🔥 Refresh after adding
          }}
        />
      )}

    </motion.div>
  );
}

export default Crops;