import axios from "axios";
import { useEffect, useState } from "react";

type Channel = {
  id: string;
  name: string;
  description: string;
};

export default function Channel() {
  const [loading, setLoading] = useState(true);
  const [channelData, setChannelData] = useState<Channel | null>(null);

  useEffect(() => {
    getChannelData();
  }, []);

  const getChannelData = () => {
    axios
      .get("/channel/data")
      .then((response) => {
        setChannelData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  
  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <h1>{channelData?.name}</h1>
          <p>{channelData?.description}</p>
          <button>Follow Channel</button>
          <button>Listen</button>
        </div>
      )}
    </>
  );
}
