import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllMessages,
  markMessageAsRead,
  replyToMessage,
  deleteMessage,
  resetAdmin,
} from "../../redux/slices/adminSlice";
import useAuth from "../../hooks/useAuth";

const MessageManagement = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { messages, isLoading, isError, isSuccess, errorMessage } = useSelector(
    (state) => state.admin
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  useEffect(() => {
    dispatch(getAllMessages());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      setShowDeleteModal(false);
      dispatch(resetAdmin());
    }
  }, [isSuccess, dispatch]);

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setShowDetailModal(true);
    setReplyText("");
    setReplySuccess(false);
    // Mark as read if unread
    if (message.status === "unread") {
      dispatch(markMessageAsRead(message._id));
    }
  };

  const handleDeleteMessage = (message) => {
    setSelectedMessage(message);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedMessage) {
      dispatch(deleteMessage(selectedMessage._id));
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setReplySending(true);
    try {
      await dispatch(
        replyToMessage({ id: selectedMessage._id, reply: { reply: replyText } })
      ).unwrap();
      setReplySuccess(true);
      setReplyText("");
      // Refresh messages to get updated status
      dispatch(getAllMessages());
    } catch (err) {
      console.error("Reply failed:", err);
    } finally {
      setReplySending(false);
    }
  };

  const handleMarkAllRead = () => {
    messages
      .filter((m) => m.status === "unread")
      .forEach((message) => {
        dispatch(markMessageAsRead(message._id));
      });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      unread: "primary",
      read: "secondary",
      replied: "success",
      resolved: "info",
      archived: "dark",
    };
    return <Badge bg={statusColors[status] || "secondary"}>{status}</Badge>;
  };

  // Helper to get sender info from message
  const getSenderName = (msg) => {
    return msg.sender?.name || msg.contactInfo?.name || "Unknown";
  };

  const getSenderEmail = (msg) => {
    return msg.sender?.email || msg.contactInfo?.email || "";
  };

  const getSenderPhone = (msg) => {
    return msg.sender?.phone || msg.contactInfo?.phone || "";
  };

  const filteredMessages = messages.filter((msg) => {
    const senderName = getSenderName(msg).toLowerCase();
    const senderEmail = getSenderEmail(msg).toLowerCase();
    const subject = (msg.subject || "").toLowerCase();
    const body = (msg.body || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      senderName.includes(search) ||
      senderEmail.includes(search) ||
      subject.includes(search) ||
      body.includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && msg.status === "unread") ||
      (statusFilter === "read" && msg.status !== "unread") ||
      (statusFilter === "replied" && msg.status === "replied");

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = messages.filter((m) => m.status === "unread").length;
  const repliedCount = messages.filter((m) => m.status === "replied").length;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Contact Messages</h2>
          <p className="text-muted mb-0">
            View and respond to customer inquiries
          </p>
        </div>
        <div>
          {unreadCount > 0 && (
            <Badge bg="danger" className="fs-6 me-2">
              {unreadCount} Unread
            </Badge>
          )}
          <Badge bg="primary" className="fs-6">
            Total: {messages.length}
          </Badge>
        </div>
      </div>

      {isError && (
        <Alert variant="danger" dismissible>
          {errorMessage}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-primary bg-opacity-10">
            <Card.Body>
              <h3>{messages.length}</h3>
              <small className="text-muted">Total Messages</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-danger bg-opacity-10">
            <Card.Body>
              <h3>{unreadCount}</h3>
              <small className="text-muted">Unread</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success bg-opacity-10">
            <Card.Body>
              <h3>{repliedCount}</h3>
              <small className="text-muted">Replied</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-secondary bg-opacity-10">
            <Card.Body>
              <h3>{messages.length - unreadCount - repliedCount}</h3>
              <small className="text-muted">Read (No Reply)</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Form.Control
              type="text"
              placeholder="Search by sender name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
            <div className="d-flex gap-2">
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ maxWidth: "150px" }}
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </Form.Select>
              {unreadCount > 0 && (
                <Button variant="outline-success" onClick={handleMarkAllRead}>
                  Mark All Read
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-envelope fs-1 d-block mb-3"></i>
              <p>No messages found</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => (
                  <tr
                    key={message._id}
                    className={message.status === "unread" ? "table-info" : ""}
                  >
                    <td>
                      <strong>{getSenderName(message)}</strong>
                      <br />
                      <small className="text-muted">
                        {getSenderEmail(message)}
                      </small>
                    </td>
                    <td>
                      {message.subject || "No Subject"}
                      <br />
                      <small className="text-muted">
                        {message.body?.substring(0, 50)}...
                      </small>
                    </td>
                    <td>{getStatusBadge(message.status)}</td>
                    <td>{formatDate(message.createdAt)}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1"
                        onClick={() => handleViewMessage(message)}
                      >
                        {message.status === "replied" ? "View" : "View & Reply"}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteMessage(message)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Message Detail Modal with Reply */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Message Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMessage && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <p>
                    <strong>From:</strong> {getSenderName(selectedMessage)}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href={`mailto:${getSenderEmail(selectedMessage)}`}>
                      {getSenderEmail(selectedMessage)}
                    </a>
                  </p>
                </Col>
                <Col md={6}>
                  {getSenderPhone(selectedMessage) && (
                    <p>
                      <strong>Phone:</strong> {getSenderPhone(selectedMessage)}
                    </p>
                  )}
                  <p>
                    <strong>Date:</strong>{" "}
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {getStatusBadge(selectedMessage.status)}
                  </p>
                </Col>
              </Row>
              <hr />
              <p>
                <strong>Subject:</strong>{" "}
                {selectedMessage.subject || "No Subject"}
              </p>
              <Card className="mt-3 bg-light">
                <Card.Body>
                  <small className="text-muted d-block mb-2">
                    Customer Message:
                  </small>
                  <p style={{ whiteSpace: "pre-wrap" }} className="mb-0">
                    {selectedMessage.body}
                  </p>
                </Card.Body>
              </Card>

              {/* Show existing reply if any */}
              {selectedMessage.response?.text && (
                <Card className="mt-3 border-success">
                  <Card.Body>
                    <small className="text-success d-block mb-2">
                      <i className="bi bi-check-circle me-1"></i>
                      Admin Reply (
                      {formatDate(selectedMessage.response.respondedAt)}):
                    </small>
                    <p style={{ whiteSpace: "pre-wrap" }} className="mb-0">
                      {selectedMessage.response.text}
                    </p>
                  </Card.Body>
                </Card>
              )}

              {/* Quick Reply Section */}
              {selectedMessage.status !== "replied" && (
                <div className="mt-4">
                  <hr />
                  <h6>
                    <i className="bi bi-reply me-2"></i>
                    Quick Reply
                  </h6>

                  {replySuccess && (
                    <Alert variant="success" className="mt-2">
                      Reply sent successfully! The user will see it in their
                      dashboard.
                    </Alert>
                  )}

                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="mt-2"
                    disabled={replySending || replySuccess}
                  />
                  <Button
                    variant="success"
                    className="mt-2"
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || replySending || replySuccess}
                  >
                    {replySending ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
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
            Are you sure you want to delete this message from{" "}
            <strong>{selectedMessage?.name}</strong>?
          </p>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Message"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MessageManagement;
