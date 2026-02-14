import React from "react";

const SkeletonCard = ({ type = "product" }) => {
  return (
    <div className="skeleton-card shadow-sm h-100">
      <div className="skeleton-img" />
      <div className="p-3">
        <div className="skeleton-badge mb-2" />
        <div className="skeleton-line h-lg w-75 mb-2" />
        {type === "product" && (
          <>
            <div className="d-flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="skeleton-circle"
                  style={{ width: 14, height: 14 }}
                />
              ))}
              <div className="skeleton-line w-25 ms-1" style={{ marginBottom: 0 }} />
            </div>
            <div className="skeleton-line h-lg w-40 mb-3" />
          </>
        )}
        {type === "pet" && (
          <>
            <div className="skeleton-line w-50 mb-2" />
            <div className="skeleton-line w-75 mb-1" />
            <div className="skeleton-line w-75 mb-1" />
            <div className="skeleton-line w-75 mb-3" />
          </>
        )}
        <div className="skeleton-line h-btn" />
        {type === "product" && <div className="skeleton-line h-btn mt-2" />}
      </div>
    </div>
  );
};

export default SkeletonCard;
