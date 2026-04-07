import React from "react";

function ResearchSidebar({ setSection }) {

return(

<div className="w-60 bg-green-800 text-white p-5 min-h-screen">

<h2 className="text-xl font-bold mb-6">
Research Panel
</h2>

<ul className="space-y-4">

<li
onClick={()=>setSection("research")}
className="cursor-pointer hover:text-yellow-300"
>
📊 All Reports
</li>

<li
onClick={()=>setSection("images")}
className="cursor-pointer hover:text-yellow-300"
>
📷 Crop Images
</li>

<li
onClick={()=>setSection("analytics")}
className="cursor-pointer hover:text-yellow-300"
>
📈 Analytics
</li>

</ul>

</div>

);

}

export default ResearchSidebar;