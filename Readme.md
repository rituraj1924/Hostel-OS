# 🏨 Smart Hostel Management System (SHMS)

A comprehensive web application for managing hostel operations, built with the MERN stack.

![SHMS Banner](https://via.placeholder.com/800x200/1976d2/ffffff?text=Smart+Hostel+Management+System)

## ✨ Features

### 🎓 Student Features

- **User Registration & Authentication** - Multi-step registration with email verification
- **Room Management** - Browse, book, and manage room allocations
- **Payment Integration** - Secure online payments via Razorpay
- **Complaint System** - Submit and track maintenance requests
- **Visitor Management** - Register and manage visitor entries
- **Real-time Notifications** - Get instant updates via Socket.io

### 👨‍💼 Admin Features

- **Comprehensive Dashboard** - Real-time analytics and insights
- **User Management** - Manage students, wardens, and admin accounts
- **Room Administration** - Create, update, and monitor room availability
- **Payment Tracking** - Monitor all transactions and pending payments
- **Complaint Resolution** - Assign, track, and resolve maintenance issues
- **Visitor Oversight** - Approve/reject visitor requests
- **Email Notifications** - Automated welcome emails and updates

### 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin, Warden, and Student roles
- **Password Hashing** - Bcrypt encryption for passwords
- **Input Validation** - Comprehensive form validation
- **File Upload Security** - Secure image uploads via Cloudinary

## 🚀 Tech Stack

### Frontend

- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Professional UI components
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **Nodemailer** - Email sending
- **Multer** - File upload handling
- **Cloudinary** - Image storage and management

### Admin Panel

- **React Admin Panel** - Separate admin interface
- **Advanced Analytics** - Dashboard with charts and statistics
- **Hardcoded Admin Access** - Secure admin authentication

## 📁 Project Structure

```
smart-hostel-management/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic services
│   ├── config/             # Configuration files
│   └── package.json
├── admin/                  # Admin panel application
│   ├── src/
│   │   ├── components/     # Admin components
│   │   ├── pages/          # Admin pages
│   │   └── services/       # Admin API services
│   └── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/smart-hostel-management.git
cd smart-hostel-management
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Admin Panel Setup

```bash
cd admin
npm install
npm run dev
```

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shms
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@smarthostel.com
```

## 🚀 Usage

### Default Admin Credentials

- **Email:** admin@shms.com
- **Password:** ChangeMeAdmin!123

### Default Warden/Staff Credentials

- **Email:** warden@shms.com
- **Password:** ChangeMeWarden!123

### Default Student Credentials

- **Email:** rahul.kumar@student.com
- **Password:** Student@123

### Student Registration

Students can register through the frontend application with:

- Personal information
- Emergency contact details
- Address information
- Profile picture upload

## 📊 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request

### User Management

- `GET /api/users` - Get all users (Admin/Warden)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Admin)

### Room Management

- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room (Admin)
- `PUT /api/rooms/:id` - Update room
- `POST /api/rooms/:id/book` - Book room

### Payment System

- `GET /api/payments` - Get payments
- `POST /api/payments` - Create payment
- `POST /api/payments/verify` - Verify Razorpay payment

### Complaint Management

- `GET /api/complaints` - Get complaints
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/:id` - Update complaint
- `POST /api/complaints/:id/resolve` - Resolve complaint

## 🔧 Development

### Running in Development Mode

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Admin Panel
cd admin && npm run dev
```

### Building for Production

```bash
# Frontend
cd frontend && npm run build

# Admin Panel
cd admin && npm run build
```

## 🎨 Features Showcase

### Dashboard Analytics

- Real-time occupancy tracking
- Payment status monitoring
- Complaint resolution metrics
- User activity insights

### Email System

- Welcome emails for new users
- Password reset notifications
- Complaint status updates
- Payment reminders

### File Upload

- Profile picture uploads
- Document storage
- Cloudinary integration
- Secure file handling

## 📸 Screenshots

### Student Dashboard

![Student Dashboard](screenshots/student-dashboard.png)

### Admin Panel

![Admin Panel](screenshots/admin-panel.png)

### User Management

![User Management](screenshots/user-management.png)

### Common Login

![Admin Warden Login Page ](screenshots/admin-warden-login.png)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Sudhanshu Ravindra Sakhare** - _Initial work_ - [YourGitHub](https://github.com/Sudhanshu-SRS)

## 🙏 Acknowledgments

- Material-UI for the beautiful components
- MongoDB for the robust database
- Cloudinary for image management
- Razorpay for payment processing
- Socket.io for real-time features

## 📞 Support

For support, email sudhanshusakhare808@gmail.com or create an issue in this repository.

## 🔗 Links

- [Live Demo](https://your-demo-link.com)
- [API Documentation](https://your-api-docs-link.com)
- [Project Wiki](https://github.com/yourusername/smart-hostel-management/wiki)

---

⭐ If you found this project helpful, please give it a star!
