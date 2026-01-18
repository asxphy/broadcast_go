import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateChannel from "./Channel/CreateChannel";

const Home: React.FC = () => {
  const [channel, setChannel] = useState<string>("");
  const navigate = useNavigate();

  const joinChannel = () => {
    navigate(`/channel?room=${channel}`);
  };

  return (
    <div>
     HI 
      <input
        placeholder="Enter Channel Name"
        onChange={(e) => setChannel(e.target.value)}
      />
      <button onClick={joinChannel}>Join Channel</button>

      <CreateChannel />
    </div>
  );
};

export default Home;
