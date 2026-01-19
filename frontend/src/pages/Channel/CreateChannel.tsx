import { useState } from "react";
import axios from "../../api/axios";

interface CreateChannelProps {
  onClose?: () => void;
}

export default function CreateChannel({ onClose }: CreateChannelProps) {
  const [channel, setChannel] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateChannel = async () => {
    if (!channel.trim()) {
      setError("Channel name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.post("/channel/create", {
        name: channel,
        description,
        is_private: isPrivate,
      });

      // reset
      setChannel("");
      setDescription("");
      setIsPrivate(false);

      onClose?.();
    } catch (err) {
      setError("Failed to create channel");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Channel Name
        </label>
        <input
          type="text"
          placeholder="Enter channel name"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 focus:ring-black"
        />
        Private channel
      </label>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-gray-600 transition hover:text-black"
        >
          Cancel
        </button>

        <button
          onClick={handleCreateChannel}
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Channel"}
        </button>
      </div>
    </div>
  );
}
