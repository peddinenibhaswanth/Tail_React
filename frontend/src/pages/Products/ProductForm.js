import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
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

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isSeller, isAdmin, isStaff } = useAuth();
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
  });

  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);

  // Determine redirect path based on role
  const getRedirectPath = () => {
    if (isAdmin || isStaff) {
      return "/admin/products";
    } else if (isSeller) {
      return "/seller/products";
    }
    return "/products";
  };

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
      });
    }
  }, [product, isEditMode]);

  useEffect(() => {
    if (isSuccess && message) {
      setTimeout(() => {
        dispatch(resetProducts());
        navigate(getRedirectPath());
      }, 1500);
    }
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
    setImages(files);
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
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="fw-bold mb-4">
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

              {isSuccess && (
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

                <Form.Group className="mb-4">
                  <Form.Label>Product Images</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Text className="text-muted">
                    Upload multiple images. First image will be the main photo.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading
                      ? "Saving..."
                      : isEditMode
                      ? "Update Product"
                      : "Add Product"}
                  </Button>
                  <Button
                    variant="outline-secondary"
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
    </Container>
  );
};

export default ProductForm;
