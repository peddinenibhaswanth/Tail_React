import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Tab,
  Tabs,
  Image,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import useAuth from "../../hooks/useAuth";
import {
  updateProfile,
  changePassword,
  reset,
} from "../../redux/slices/authSlice";
import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
} from "../../utils/validation";
import Loading from "../../components/common/Loading";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);


  const validateProfileForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!isValidPassword(passwordData.newPassword)) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setProfileStatus({ type: "", message: "" });
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setProfileStatus({ type: "success", message: "Profile updated successfully!" });
      setEditMode(false);
      dispatch(reset());
    } catch (err) {
      setProfileStatus({ type: "danger", message: err || "Failed to update profile" });
      dispatch(reset());
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setPasswordStatus({ type: "", message: "" });
    setPwdLoading(true);
    try {
      await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        })
      ).unwrap();
      setPasswordStatus({ type: "success", message: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      dispatch(reset());
    } catch (err) {
      setPasswordStatus({ type: "danger", message: err || "Failed to change password" });
      dispatch(reset());
    } finally {
      setPwdLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setEditMode(false);
    setErrors({});
  };

  if (isLoading && !user) {
    return <Loading />;
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="mb-3">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar}
                      roundedCircle
                      width={120}
                      height={120}
                      alt="Profile"
                      className="border border-3 border-primary"
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center"
                      style={{
                        width: "120px",
                        height: "120px",
                        fontSize: "48px",
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="fw-bold mb-1">{user?.name}</h3>
                <p className="text-muted mb-0">
                  <span className="badge bg-secondary">{user?.role}</span>
                </p>
              </div>

              <Tabs defaultActiveKey="profile" className="mb-3">
                <Tab eventKey="profile" title="Profile Information">
                  <Form onSubmit={onProfileSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        isInvalid={!!errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        isInvalid={!!errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleProfileChange}
                        disabled={!editMode}
                        isInvalid={!!errors.phone}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Member Since</Form.Label>
                      <Form.Control
                        type="text"
                        value={new Date(user?.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                        disabled
                      />
                    </Form.Group>

                    <div className="d-flex gap-2">
                      {profileStatus.message && (
                        <div
                          className={`alert alert-${profileStatus.type} w-100 mb-3 py-2`}
                          role="alert"
                        >
                          {profileStatus.message}
                        </div>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      {!editMode ? (
                        <Button
                          variant="primary"
                          onClick={() => setEditMode(true)}
                        >
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                          >
                            {isLoading ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </Form>
                </Tab>

                <Tab eventKey="password" title="Change Password">
                  <Form onSubmit={onPasswordSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        isInvalid={!!errors.currentPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.currentPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        isInvalid={!!errors.newPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.newPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        isInvalid={!!errors.confirmPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {passwordStatus.message && (
                      <div
                        className={`alert alert-${passwordStatus.type} mb-3 py-2`}
                        role="alert"
                      >
                        {passwordStatus.message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading || pwdLoading}
                    >
                      {pwdLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
