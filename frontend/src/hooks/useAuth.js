import { useSelector } from "react-redux";

const useAuth = () => {
  const { user, token, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "admin";
  const isCoAdmin = user?.role === "co-admin";
  const isStaff = isAdmin || isCoAdmin;

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isCoAdmin,
    isStaff,
    isLoading,
    isError,
    isSuccess,
    message,
  };
};

export default useAuth;
