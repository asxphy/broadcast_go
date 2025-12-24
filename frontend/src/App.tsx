import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Channel from './pages/Channel';
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoutes';

function App() {
  return (
    <>
    <AuthProvider>

      <Navbar />
      <Routes>
           <Route
            path="/"
            element={
              <ProtectedRoute>
                <Channel />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
    </>
  );
}

export default App