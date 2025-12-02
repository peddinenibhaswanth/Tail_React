import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Modal,
  Spinner,
  Alert,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  getProducts,
  getProductsBySeller,
  deleteProduct,
  updateStock,
  resetProducts,
} from "../../redux/slices/productSlice";
import useAuth from "../../hooks/useAuth";

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { user, isSeller, isAdmin, isStaff } = useAuth();
  const { products, sellerProducts, isLoading, isError, isSuccess, message } =
    useSelector((state) => state.products);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [newStock, setNewStock] = useState(0);

  // Determine which products to show based on user role
  const displayProducts = isSeller && !isStaff ? sellerProducts : products;

  useEffect(() => {
    // Sellers see only their products, admins see all
    if (isSeller && !isStaff && user?._id) {
      dispatch(getProductsBySeller(user._id));
    } else {
      dispatch(getProducts({}));
    }
  }, [dispatch, isSeller, isStaff, user]);

  useEffect(() => {
    if (isSuccess && message?.includes("deleted")) {
      setShowDeleteModal(false);
      dispatch(resetProducts());
    }
    if (isSuccess && message?.includes("Stock")) {
      setShowStockModal(false);
      dispatch(resetProducts());
    }
  }, [isSuccess, message, dispatch]);

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      dispatch(deleteProduct(selectedProduct._id));
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleUpdateStock = (product) => {
    setSelectedProduct(product);
    setNewStock(product.stock || 0);
    setShowStockModal(true);
  };

  const confirmUpdateStock = () => {
    if (selectedProduct) {
      dispatch(updateStock({ id: selectedProduct._id, stock: newStock }));
    }
  };

  const getStockBadge = (stock) => {
    if (stock <= 0) return <Badge bg="danger">Out of Stock</Badge>;
    if (stock <= 10) return <Badge bg="warning">Low Stock ({stock})</Badge>;
    return <Badge bg="success">In Stock ({stock})</Badge>;
  };

  const filteredProducts = (displayProducts || []).filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" && product.stock > 0) ||
      (stockFilter === "low-stock" &&
        product.stock > 0 &&
        product.stock <= 10) ||
      (stockFilter === "out-of-stock" && product.stock <= 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const uniqueCategories = [
    ...new Set((displayProducts || []).map((p) => p.category).filter(Boolean)),
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Get add product link based on role
  const getAddProductLink = () => {
    if (isSeller && !isStaff) {
      return "/seller/products/add";
    }
    return "/admin/products/new";
  };

  // Get edit product link based on role
  const getEditProductLink = (productId) => {
    if (isSeller && !isStaff) {
      return `/seller/products/edit/${productId}`;
    }
    return `/admin/products/${productId}/edit`;
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            {isSeller && !isStaff ? "My Products" : "Product Management"}
          </h2>
          <p className="text-muted mb-0">
            {isSeller && !isStaff
              ? "Manage your products"
              : "Manage all products in the store"}
          </p>
        </div>
        <Link to={getAddProductLink()} className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Add New Product
        </Link>
      </div>

      {isError && (
        <Alert variant="danger" dismissible>
          {message}
        </Alert>
      )}
      {isSuccess && message && (
        <Alert variant="success" dismissible>
          {message}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-primary bg-opacity-10">
            <Card.Body>
              <h3>{(displayProducts || []).length}</h3>
              <small className="text-muted">Total Products</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success bg-opacity-10">
            <Card.Body>
              <h3>
                {(displayProducts || []).filter((p) => p.stock > 0).length}
              </h3>
              <small className="text-muted">In Stock</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning bg-opacity-10">
            <Card.Body>
              <h3>
                {
                  (displayProducts || []).filter(
                    (p) => p.stock > 0 && p.stock <= 10
                  ).length
                }
              </h3>
              <small className="text-muted">Low Stock</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-danger bg-opacity-10">
            <Card.Body>
              <h3>
                {(displayProducts || []).filter((p) => p.stock <= 0).length}
              </h3>
              <small className="text-muted">Out of Stock</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Form.Control
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "300px" }}
            />
            <div className="d-flex gap-2">
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ maxWidth: "150px" }}
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Form.Select>
              <Form.Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                style={{ maxWidth: "150px" }}
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </Form.Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-box fs-1 d-block mb-3"></i>
              <p>No products found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Seller</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <Image
                          src={
                            product.mainImage
                              ? `http://localhost:3000${product.mainImage}`
                              : "/placeholder-product.png"
                          }
                          alt={product.name}
                          width={50}
                          height={50}
                          style={{ objectFit: "cover" }}
                          rounded
                        />
                      </td>
                      <td>
                        <strong>{product.name}</strong>
                        {product.isOnSale && (
                          <Badge bg="danger" className="ms-2">
                            Sale
                          </Badge>
                        )}
                      </td>
                      <td>{product.category}</td>
                      <td>
                        {product.salePrice ? (
                          <>
                            <span className="text-decoration-line-through text-muted me-2">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-danger">
                              {formatCurrency(product.salePrice)}
                            </span>
                          </>
                        ) : (
                          formatCurrency(product.price)
                        )}
                      </td>
                      <td>{getStockBadge(product.stock)}</td>
                      <td>{product.seller?.name || "Admin"}</td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                          onClick={() => handleViewDetails(product)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-1"
                          onClick={() => handleUpdateStock(product)}
                        >
                          Stock
                        </Button>
                        <Link
                          to={getEditProductLink(product._id)}
                          className="btn btn-outline-primary btn-sm me-1"
                        >
                          Edit
                        </Link>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Product Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Product Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <Row>
              <Col md={4}>
                <Image
                  src={
                    selectedProduct.mainImage
                      ? `http://localhost:3000${selectedProduct.mainImage}`
                      : "/placeholder-product.png"
                  }
                  alt={selectedProduct.name}
                  fluid
                  rounded
                />
              </Col>
              <Col md={8}>
                <h4>{selectedProduct.name}</h4>
                <p>
                  <strong>Category:</strong> {selectedProduct.category}
                </p>
                <p>
                  <strong>Price:</strong>{" "}
                  {formatCurrency(selectedProduct.price)}
                </p>
                {selectedProduct.salePrice && (
                  <p>
                    <strong>Sale Price:</strong>{" "}
                    {formatCurrency(selectedProduct.salePrice)}
                  </p>
                )}
                <p>
                  <strong>Stock:</strong> {getStockBadge(selectedProduct.stock)}
                </p>
                <p>
                  <strong>Seller:</strong>{" "}
                  {selectedProduct.seller?.name || "Admin"}
                </p>
                <p>
                  <strong>Description:</strong> {selectedProduct.description}
                </p>
                {selectedProduct.rating && (
                  <p>
                    <strong>Rating:</strong> {selectedProduct.rating} / 5 (
                    {selectedProduct.numReviews} reviews)
                  </p>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          <Link
            to={getEditProductLink(selectedProduct?._id)}
            className="btn btn-primary"
          >
            Edit Product
          </Link>
        </Modal.Footer>
      </Modal>

      {/* Update Stock Modal */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Update stock for <strong>{selectedProduct?.name}</strong>
          </p>
          <Form.Group>
            <Form.Label>New Stock Quantity</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmUpdateStock}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Stock"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete{" "}
            <strong>{selectedProduct?.name}</strong>?
          </p>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Product"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductManagement;
