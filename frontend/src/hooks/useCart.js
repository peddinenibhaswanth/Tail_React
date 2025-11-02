import { useSelector } from "react-redux";

const useCart = () => {
  const { items, total, itemCount, isLoading, isError, message } = useSelector(
    (state) => state.cart
  );

  const hasItems = items.length > 0;

  return {
    items,
    total,
    itemCount,
    hasItems,
    isLoading,
    isError,
    message,
  };
};

export default useCart;
