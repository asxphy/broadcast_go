import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "../context/AuthContext"

type Props = {
  children: ReactNode
}

const ProtectedRoute = ({ children }: Props) => {
    const { user, loading } = useAuth()
    if (loading) return <div>Loading...</div>

    if (!user) return <Navigate to="/login" replace />

    return <>{children}</>
}

export default ProtectedRoute
