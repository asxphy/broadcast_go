import { NavLink } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState<string>("");

  const submitSignup = () => {
    api
      .post("/signup", { email, password })
      .then((res) => {
        console.log("Signup successful", res.data);
      })
      .catch((err) => {
        console.error("Signup failed", err);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-800 text-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Create Account
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          onClick={submitSignup}
          className="w-full mt-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 transition font-medium"
        >
          Sign Up
        </button>

        <p className="text-sm text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <NavLink to="/login" className="text-blue-400 hover:underline cursor-pointer">
            Login
          </NavLink>
        </p>
      </div>
    </div>
  );
}

export default Signup;
