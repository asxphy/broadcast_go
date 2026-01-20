import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { useEffect, useState } from "react";

type Channel = {
  id: string;
  name: string;
  description: string;
  is_following: boolean;
  is_private: boolean;
};

export default function Channel() {
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [channelData, setChannelData] = useState<Channel | null>(null);
  const [room, setRoom] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomID = params.get("room");
    setRoom(roomID);
    if (!roomID) return;

    getChannelData(roomID);
  }, []);

  const getChannelData = (roomID: string) => {
    axios
      .post("/channel/get", { channel_id: roomID })
      .then((response) => {
        setChannelData(response.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const toggleFollow = () => {
    axios.post("/channel/toggle-follow", { channel_id: room }).then((res) => {
      setChannelData((prev) =>
        prev ? { ...prev, is_following: res.data.is_following } : prev
      );

    }).catch(() => {
      alert("Failed to follow the channel.");
    });
  };
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading channel...</p>
      </div>
    );
  }

  if (!channelData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Channel not found.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            {channelData.name}
          </h1>

          <p className="mt-3 text-gray-600">
            {channelData.description || "No description available."}
          </p>
        </div>

        {}
        <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-6 shadow-sm">
          {channelData.is_following ? (
            <button
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
           onClick={toggleFollow} >
              UnFollow Channel
            </button>
          ) : <button
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
            onClick={toggleFollow}>
              Follow Channel
            </button>}
          <button
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          onClick={()=> navigate('/channel/stream?room=' + room )}>
            Listen
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Channel Details
          </h3>

          <div className="text-sm text-gray-500">
            <p>
              <span className="font-medium text-gray-700">
                Channel ID:
              </span>{" "}
              <span className="font-mono">{channelData.id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
