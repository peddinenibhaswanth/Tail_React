import React from "react";

const SellerOrders = () => {
  // Placeholder for seller/admin orders view.
  // This can later be connected to an admin-specific orders API.
  return (
    <div className="container py-4">
      <h2 className="mb-3">Seller Orders</h2>
      <p className="text-muted">
        This page will show all orders for the seller/admin with filters and
        status updates. Backend/admin APIs can be wired here similar to the
        customer order list.
      </p>
    </div>
  );
};

export default SellerOrders;
