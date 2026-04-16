import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getProduct,
  createProduct,
  updateProduct,
  resetProducts,
} from "../../redux/slices/productSlice";
import { PRODUCT_CATEGORIES, PET_TYPES } from "../../utils/constants";
import Loading from "../../components/common/Loading";
import useAuth from "../../hooks/useAuth";
import * as productService from "../../api/productService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const MAX_IMAGES = 6;

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isSeller, isAdmin, isStaff } = useAuth();
  const { product, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.products
  );

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    petType: "all",
    brand: "",
    stock: "",
    specifications: "",
    discountPercent: "",
  });

  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [deleteImageIndex, setDeleteImageIndex] = useState(null);

  // Determine redirect path based on role
  const getRedirectPath = () => {
    if (isAdmin || isStaff) {
      return "/admin/products";
    } else if (isSeller) {
      return "/seller/products";
    }
    return "/products";
  };

  // Reset stale success/error state on mount to prevent premature redirect
  useEffect(() => {
    dispatch(resetProducts());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(getProduct(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        category: product.category || "",
        petType: product.petType || "all",
        brand: product.brand || product.specifications?.brand || "",
        stock: product.stock || "",
        specifications: product.specifications?.material || "",
        discountPercent: product.discountPercent || "",
      });
      setExistingImages(product.images || []);
    }
  }, [product, isEditMode]);

  useEffect(() => {
    if (isSuccess && message) {
      const redirectPath = getRedirectPath();
      setTimeout(() => {
        dispatch(resetProducts());
        navigate(redirectPath);
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, message, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalAllowed = MAX_IMAGES - existingImages.length;
    const selected = files.slice(0, totalAllowed);
    setImages(selected);

    // Generate previews
    const previews = selected.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);

    if (files.length > totalAllowed) {
      setErrors((prev) => ({
        ...prev,
        images: `Only ${totalAllowed} more image(s) allowed (max ${MAX_IMAGES}).`,
      }));
    } else {
      setErrors((prev) => {
        const { images: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const removeNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteExistingImage = (imageIndex) => {
    setDeleteImageIndex(imageIndex);
    setShowDeleteImageModal(true);
  };

  const confirmDeleteImage = async () => {
    setShowDeleteImageModal(false);
    if (deleteImageIndex === null) return;
    setImageLoading(true);
    try {
      const res = await productService.deleteProductImage(id, deleteImageIndex);
      setExistingImages(res.data.images || []);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        images: err.response?.data?.message || "Error deleting image",
      }));
    } finally {
      setImageLoading(false);
      setDeleteImageIndex(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Product name must be at least 3 characters";
    }

    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.petType) {
      newErrors.petType = "Pet type is required";
    }

    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const productData = new FormData();

    Object.keys(formData).forEach((key) => {
      productData.append(key, formData[key]);
    });

    images.forEach((image) => {
      productData.append("images", image);
    });

    if (isEditMode) {
      dispatch(updateProduct({ id, productData }));
    } else {
      dispatch(createProduct(productData));
    }
  };

  if (isLoading && isEditMode) {
    return <Loading />;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h3 className="fw-bold mb-4">
                <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-primary`}></i>
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h3>

              {isError && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => dispatch(resetProducts())}
                >
                  {message}
                </Alert>
              )}

              {isSuccess && message && (
                <Alert variant="success">
                  Product {isEditMode ? "updated" : "created"} successfully!
                  Redirecting...
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Product Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed product description..."
                    isInvalid={!!errors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Price <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        isInvalid={!!errors.price}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.price}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Stock Quantity <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        isInvalid={!!errors.stock}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.stock}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Category <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        isInvalid={!!errors.category}
                      >
                        <option value="">Select category...</option>
                        {PRODUCT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.category}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Pet Type <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="petType"
                        value={formData.petType}
                        onChange={handleChange}
                        isInvalid={!!errors.petType}
                      >
                        {PET_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.petType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Brand</Form.Label>
                      <Form.Control
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        placeholder="Enter brand name"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Specifications</Form.Label>
                      <Form.Control
                        type="text"
                        name="specifications"
                        value={formData.specifications}
                        onChange={handleChange}
                        placeholder="Material, dimensions, etc."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Platform Discount Tag{" "}
                    <span className="text-muted small">(optional — shown as a badge, e.g. "15% OFF")</span>
                  </Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="number"
                      name="discountPercent"
                      value={formData.discountPercent}
                      onChange={handleChange}
                      placeholder="e.g. 10"
                      min="0"
                      max="100"
                      style={{ maxWidth: "120px" }}
                    />
                    <span className="text-muted">%</span>
                    {formData.discountPercent > 0 && (
                      <span
                        style={{
                          background: "linear-gradient(135deg, #e53e3e, #dd6b20)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {formData.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <Form.Text className="text-muted">
                    This is a marketing label only — it doesn't change the listed price.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Product Images{" "}
                    <span className="text-muted small">
                      ({existingImages.length + images.length} / {MAX_IMAGES})
                    </span>
                  </Form.Label>

                  {/* Existing images (edit mode) */}
                  {isEditMode && existingImages.length > 0 && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-2">Current images:</small>
                      <div className="d-flex gap-2 flex-wrap">
                        {existingImages.map((img, idx) => (
                          <div key={idx} className="position-relative" style={{ width: "90px", height: "90px" }}>
                            <img
                              src={img.startsWith("http") ? img : `${API_URL}/uploads/products/${img}`}
                              alt={`Product ${idx + 1}`}
                              className="rounded"
                              style={{ width: "90px", height: "90px", objectFit: "cover", border: idx === 0 ? "2px solid var(--bs-primary)" : "1px solid #dee2e6" }}
                            />
                            {idx === 0 && (
                              <span
                                style={{
                                  position: "absolute", bottom: "2px", left: "2px",
                                  background: "var(--bs-primary)", color: "#fff",
                                  fontSize: "0.6rem", padding: "1px 5px", borderRadius: "4px",
                                }}
                              >
                                Main
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingImage(idx)}
                              disabled={imageLoading}
                              style={{
                                position: "absolute", top: "-6px", right: "-6px",
                                background: "#dc3545", color: "#fff", border: "none",
                                borderRadius: "50%", width: "22px", height: "22px",
                                fontSize: "0.7rem", display: "flex", alignItems: "center",
                                justifyContent: "center", cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }}
                              aria-label="Delete image"
                            >
                              {imageLoading ? <Spinner size="sm" animation="border" style={{ width: "10px", height: "10px" }} /> : <i className="bi bi-x"></i>}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New image previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-2">New images to upload:</small>
                      <div className="d-flex gap-2 flex-wrap">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="position-relative" style={{ width: "90px", height: "90px" }}>
                            <img
                              src={preview}
                              alt={`New ${idx + 1}`}
                              className="rounded"
                              style={{ width: "90px", height: "90px", objectFit: "cover", border: "2px dashed #0d6efd" }}
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(idx)}
                              style={{
                                position: "absolute", top: "-6px", right: "-6px",
                                background: "#dc3545", color: "#fff", border: "none",
                                borderRadius: "50%", width: "22px", height: "22px",
                                fontSize: "0.7rem", display: "flex", alignItems: "center",
                                justifyContent: "center", cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }}
                              aria-label="Remove image"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingImages.length + images.length < MAX_IMAGES && (
                    <Form.Control
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  )}
                  {errors.images && (
                    <div className="text-danger small mt-1">{errors.images}</div>
                  )}
                  <Form.Text className="text-muted">
                    Upload up to {MAX_IMAGES} images. First image will be the main photo.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={isLoading} className="rounded-pill px-4">
                    {isLoading
                      ? "Saving..."
                      : isEditMode
                      ? "Update Product"
                      : "Add Product"}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className="rounded-pill px-4"
                    onClick={() => navigate(getRedirectPath())}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Image Confirmation Modal */}
      <Modal show={showDeleteImageModal} onHide={() => setShowDeleteImageModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5">
            <i className="bi bi-trash text-danger me-2"></i>Delete Image
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this image? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" size="sm" className="rounded-pill px-3" onClick={() => setShowDeleteImageModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" className="rounded-pill px-3" onClick={confirmDeleteImage}>
            <i className="bi bi-trash me-1"></i>Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductForm;

