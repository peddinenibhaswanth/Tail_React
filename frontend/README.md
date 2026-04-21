# Tail Waggers - Frontend

Modern React frontend for the Tail Waggers pet adoption and care platform.

## Features..

- 🐾 **Pet Adoption**: Browse and apply to adopt pets
- 🛒 **E-commerce**: Shop for pet products and supplies
- 🏥 **Appointments**: Book veterinary appointments
- 👤 **User Dashboards**: Role-based dashboards for customers, sellers, vets, and admins
- 📱 **Responsive Design**: Mobile-first approach with Bootstrap
- ♿ **Accessible**: WCAG compliant with ARIA labels and keyboard navigation
- 🔒 **Secure**: Protected routes and form validation

## Tech Stack

- **React 18** - UI framework
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Bootstrap 5** - UI components and styling
- **Axios** - HTTP client
- **React Bootstrap** - Bootstrap components for React

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Backend server running on http://localhost:5000

### Installation

1. Clone the repository
2. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create `.env` file (copy from `.env.example`):

   ```bash
   cp .env.example .env
   ```

5. Update environment variables in `.env`:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

### Running the App

Development mode:

```bash
npm start
```

Production build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Project Structure

```
frontend/
├── public/             # Static files
├── src/
│   ├── api/           # API service layer
│   ├── components/    # Reusable components
│   │   └── common/    # Common UI components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   │   ├── Admin/     # Admin pages
│   │   ├── Auth/      # Authentication pages
│   │   ├── Cart/      # Shopping cart
│   │   ├── Dashboard/ # User dashboards
│   │   ├── Orders/    # Order management
│   │   ├── Pets/      # Pet adoption
│   │   └── Products/  # Product catalog
│   ├── redux/         # Redux store and slices
│   ├── routes/        # Route configuration
│   ├── styles/        # Global styles
│   ├── utils/         # Utility functions
│   ├── App.js         # Root component
│   └── index.js       # Entry point
└── package.json
```

## Key Features

### Authentication

- Login, Register, Forgot Password
- Role-based access control (Customer, Seller, Vet, Admin)
- Protected routes

### Pet Adoption

- Browse available pets
- Advanced filtering (species, age, size, gender)
- Pet detail pages
- Adoption applications

### E-commerce

- Product catalog with categories
- Shopping cart functionality
- Secure checkout process
- Order tracking

### Appointments

- Book veterinary appointments
- View appointment history
- Manage scheduled appointments

### Dashboards

- **Customer**: View orders, applications, profile
- **Seller**: Manage products and orders
- **Vet**: View appointments and schedule
- **Admin**: Complete platform management

## Accessibility

This application follows WCAG 2.1 Level AA standards:

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader compatibility

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@tailwaggers.com or visit our contact page.
