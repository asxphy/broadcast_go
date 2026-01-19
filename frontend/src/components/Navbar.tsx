import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="w-full border-b border-gray-200 bg-white text-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-semibold tracking-wide transition hover:opacity-70"
        >
          Broadcast
        </Link>

        {/* Nav Links */}
        <ul className="flex items-center gap-8 text-sm">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `transition ${
                  isActive
                    ? "font-semibold text-black"
                    : "text-gray-500 hover:text-black"
                }`
              }
            >
              Home
            </NavLink>
          </li>

          {user ? (
            <>
              {/* User */}
              <li className="text-gray-600">
                {user.name}
              </li>

              {/* Logout */}
              <li>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 transition hover:text-black"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `transition ${
                      isActive
                        ? "font-semibold text-black"
                        : "text-gray-500 hover:text-black"
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
                    `transition ${
                      isActive
                        ? "font-semibold text-black"
                        : "text-gray-500 hover:text-black"
                    }`
                  }
                >
                  Signup
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
