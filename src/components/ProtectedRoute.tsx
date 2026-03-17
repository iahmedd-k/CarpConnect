import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const userStr = localStorage.getItem("carpconnect_user");
    const token = localStorage.getItem("carpconnect_token");

    if (!userStr || !token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        if (!user || typeof user !== "object") throw new Error("Invalid user data");
    } catch {
        return <Navigate to="/login" replace />;
    }

    return children;
};
