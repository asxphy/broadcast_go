import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home'
import NotFound from './pages/NotFound';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoutes';
import ChannelStream from './pages/Channel/ChannelStream';

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
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/channel"
            element={
              <ProtectedRoute>
                <ChannelStream />
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