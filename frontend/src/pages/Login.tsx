import {  useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useState } from "react";

function Login() {
    const navigate = useNavigate()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = () => {
    axios
      .post(
        "/login",
        { email, password },
      )
      .then((res) => {
          console.log("Login successful", res.data);
          navigate("/", { replace: true })
      })
      .catch((err) => {
        console.error("Login failed", err);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-800 text-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Login
        </h2>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={submitLogin}
          className="w-full mt-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 transition font-medium"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
