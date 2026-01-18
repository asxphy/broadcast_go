import { useState } from "react";
import axios from "../../api/axios";

export default function CreateChannel() {
  const [channel, setChannel] = useState("");
  const [description, setDescription] = useState("");
  const [is_private, setIsPrivate] = useState(false);
  
  function CreateChannel() {
    axios.post('/channel/create',{name:channel, description, is_private}).then((response) => {
        console.log(response.data);
    }).catch((err)=>{
        console.log(err)
    })
  }
  
  return (
    <div>
      <input
        type="text"
        placeholder="Channel Name"
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        className="w-full px-4 py-3 rounded-md bg-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-4 py-3 rounded-md bg-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={is_private}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-gray-300">Private Channel</span>
      </label>

      <button onClick={CreateChannel}>Create Channel</button>
    </div>
  );
}
