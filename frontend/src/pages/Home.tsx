import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateChannel from "./Channel/CreateChannel";
import axios from "../api/axios";

const Home: React.FC = () => {
  const [channel, setChannel] = useState<string>("");
  const [channels, setChannels] = useState<
    Array<{ id: string; name: string; description: string }>
  >([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navigate = useNavigate();


  useEffect(() => {
    axios
      .get("/homefeed")
      .then((response) => {
        setChannels(response.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const searchChannel = ()=>{
    axios.post("/channel/search",{query:channel}).then((response)=>{
      console.log(response.data)
      setChannels(response.data);
    }).catch((err)=>{
      console.error(err);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">
          Home
        </h1>

        <div className="mb-10 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row">
          <input
            type="text"
            placeholder="Enter channel name"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={searchChannel}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
          >
            Search Channel
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">
            Feed
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {channels && channels.length > 0 ? (
            channels.map((ch) => (
              <div
                key={ch.id}
                className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                onClick={() => navigate("/channel?room=" + ch.id)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
                    {ch.name}
                  </h3>

                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                    Live
                  </span>
                </div>

                <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                  {ch.description ||
                    "No description available for this channel."}
                </p>

                <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                  <span>Channel ID</span>
                  <span className="font-mono">{ch.id}</span>
                </div>

                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-blue-200" />
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No channels available.
            </p>
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            + Create Channel
          </button>
        </div>

        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsCreateOpen(false)}
            />

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Create Channel
                </h2>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <CreateChannel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
