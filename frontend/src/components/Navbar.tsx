import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="w-full bg-slate-900 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-semibold tracking-wide hover:text-blue-400 transition"
        >
          Broadcast
        </Link>

        <ul className="flex items-center gap-8">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `transition hover:text-blue-400 ${
                  isActive ? "text-blue-400 font-medium" : "text-gray-300"
                }`
              }
            >
              Home
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `transition hover:text-blue-400 ${
                  isActive ? "text-blue-400 font-medium" : "text-gray-300"
                }`
              }
            >
                Login
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                `transition hover:text-blue-400 ${
                  isActive ? "text-blue-400 font-medium" : "text-gray-300"
                }`  
              }
            >
              Signup
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
