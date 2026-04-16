import { useSelector } from "react-redux";

const useAuth = () => {
  const { user, isAuthenticated, isLoading, isError, isSuccess, message } =
    useSelector((state) => state.auth);

  const isAdmin = user?.role === "admin";
  const isCoAdmin = user?.role === "co-admin";
  const isSeller = user?.role === "seller";
  const isVeterinary = user?.role === "veterinary";
  const isStaff = isAdmin || isCoAdmin;

  return {
    user,
    isAuthenticated: isAuthenticated || !!user,
    isAdmin,
    isCoAdmin,
    isSeller,
    isVeterinary,
    isStaff,
    isLoading,
    isError,
    isSuccess,
    message,
  };
};

export default useAuth;
