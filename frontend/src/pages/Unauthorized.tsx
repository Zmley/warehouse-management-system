import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = React.useContext(AuthContext)!;

  useEffect(() => {
    // ⏳ 2秒后自动返回用户自己的页面
    setTimeout(() => {
      if (userProfile?.role === "admin") navigate("/admin-dashboard");
      else if (userProfile?.role === "transportWork") navigate("/dashboard");
      else if (userProfile?.role === "picker") navigate("/picker");
      else navigate("/");
    }, 2000);
  }, [userProfile, navigate]);

  return <h1>❌ Unauthorized! Redirecting...</h1>;
};

export default Unauthorized;