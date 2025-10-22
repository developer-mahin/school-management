# School Management System - Backend API

A comprehensive school management system backend built with Node.js, Express, TypeScript, and MongoDB. This system provides a robust API for managing all aspects of school operations including student management, attendance tracking, assignments, exams, grading, and real-time communication.

## 🚀 Features

### Core Modules

- **User Management** - Multi-role authentication and authorization (Admin, Manager, Teacher, Student, Parent)
- **Student Management** - Complete student profile and enrollment management
- **Teacher Management** - Teacher profiles, assignments, and class management
- **Class Management** - Class creation, scheduling, and organization
- **Attendance System** - Real-time attendance tracking and reporting
- **Assignment System** - Create, assign, submit, and grade assignments
- **Exam Management** - Exam scheduling, results, and grading
- **Grade System** - Configurable grading criteria and report generation
- **Messaging & Chat** - Real-time messaging with Socket.io
- **Announcements** - School-wide and class-specific announcements
- **Notifications** - Real-time push notifications
- **Payment Integration** - Stripe integration for fee management
- **Subscription Management** - Tiered subscription plans
- **Feedback System** - Student and parent feedback collection
- **Overview & Analytics** - Dashboard statistics and insights

### Technical Features

- **RESTful API** - Well-structured REST API endpoints
- **Real-time Communication** - WebSocket support via Socket.io
- **File Upload** - AWS S3 integration for file storage
- **Image Processing** - HEIC to JPEG conversion support
- **SMS Integration** - Twilio integration for SMS notifications
- **Email Service** - Automated email notifications
- **Caching** - Redis caching for improved performance
- **Logging** - Winston logger with daily rotation
- **Validation** - Zod schema validation
- **Security** - JWT authentication, bcrypt password hashing
- **Error Handling** - Centralized error handling middleware
- **CORS** - Configurable CORS policies
- **Rate Limiting** - API rate limiting support

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **Redis** (v6 or higher)
- **npm** or **yarn**

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd school-management
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=8010
   SOCKET_PORT=8011
   IP=localhost

   # Database
   DATABASE_URL=mongodb://localhost:27017/school-management

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRES_IN=7d

   # AWS S3
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=your-aws-region
   AWS_BUCKET_NAME=your-bucket-name

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password

   # Twilio SMS
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number

   # Stripe Payment
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:8010` and Socket.io on `http://localhost:8011`

### Production Mode

```bash
npm run build
npm run start:prod
```

### Using Docker

```bash
docker build -t school-management .
docker run -p 8010:8010 -p 8011:8011 school-management
```

## 📚 API Documentation

### Base URL

```
http://localhost:8010/api/v1
```

### Main Endpoints

#### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-email` - Verify email with OTP

#### Students

- `GET /students` - Get all students
- `POST /students` - Create new student
- `GET /students/:id` - Get student by ID
- `PATCH /students/:id` - Update student
- `DELETE /students/:id` - Delete student

#### Teachers

- `GET /teachers` - Get all teachers
- `POST /teachers` - Create new teacher
- `GET /teachers/:id` - Get teacher by ID
- `PATCH /teachers/:id` - Update teacher
- `DELETE /teachers/:id` - Delete teacher

#### Classes

- `GET /classes` - Get all classes
- `POST /classes` - Create new class
- `GET /classes/:id` - Get class by ID
- `PATCH /classes/:id` - Update class
- `DELETE /classes/:id` - Delete class

#### Attendance

- `GET /attendance` - Get attendance records
- `POST /attendance` - Mark attendance
- `GET /attendance/student/:id` - Get student attendance
- `GET /attendance/class/:id` - Get class attendance

#### Assignments

- `GET /assignments` - Get all assignments
- `POST /assignments` - Create assignment
- `GET /assignments/:id` - Get assignment by ID
- `PATCH /assignments/:id` - Update assignment
- `DELETE /assignments/:id` - Delete assignment

#### Assignment Submissions

- `POST /assignment-submissions` - Submit assignment
- `GET /assignment-submissions/:assignmentId` - Get submissions
- `PATCH /assignment-submissions/:id/grade` - Grade submission

#### Exams

- `GET /exams` - Get all exams
- `POST /exams` - Create exam
- `GET /exams/:id` - Get exam by ID
- `PATCH /exams/:id` - Update exam
- `DELETE /exams/:id` - Delete exam

#### Announcements

- `GET /announcements` - Get announcements
- `POST /announcements` - Create announcement
- `GET /announcements/:id` - Get announcement by ID
- `DELETE /announcements/:id` - Delete announcement

#### Messages

- `GET /conversations` - Get all conversations
- `POST /conversations` - Create conversation
- `GET /messages/:conversationId` - Get messages
- `POST /messages` - Send message

#### Payments

- `POST /payments/create-payment-intent` - Create payment intent
- `POST /payments/webhook` - Stripe webhook
- `GET /payments/history` - Get payment history

## 🏗️ Project Structure

```
school-management/
├── src/
│   ├── app/
│   │   ├── constant/          # Application constants
│   │   ├── DB/                # Database seeds
│   │   ├── helper/            # Helper functions
│   │   ├── interface/         # TypeScript interfaces
│   │   ├── middleware/        # Express middlewares
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── teacher/
│   │   │   ├── class/
│   │   │   ├── attendance/
│   │   │   ├── assignment/
│   │   │   ├── exam/
│   │   │   └── ...
│   │   ├── QueryBuilder/      # Query building utilities
│   │   ├── router/            # Route definitions
│   │   └── utils/             # Utility functions
│   ├── config/                # Configuration files
│   ├── Errors/                # Error handlers
│   ├── shared/                # Shared resources
│   ├── socket/                # Socket.io handlers
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Server entry point
│   └── redis.ts               # Redis configuration
├── public/                    # Static files
├── logs/                      # Application logs
├── .env                       # Environment variables
├── Dockerfile                 # Docker configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

## 🧪 Scripts

```bash
npm run dev          # Start development server with auto-reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server with nodemon
npm run start:prod   # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run prettier     # Format code with Prettier
npm run prettier:fix # Fix code formatting
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Role-Based Access Control** - Different permissions for different user roles
- **Input Validation** - Zod schema validation for all inputs
- **CORS Protection** - Configurable CORS policies
- **Rate Limiting** - Prevent API abuse
- **Error Sanitization** - Prevent sensitive data leakage

## 🌐 WebSocket Events

### Real-time Features

- **Notifications** - Real-time notification delivery
- **Messages** - Live chat messaging
- **Announcements** - Instant announcement broadcasting
- **Attendance Updates** - Real-time attendance status

### Socket Events

```javascript
// Client -> Server
socket.emit('join-room', { userId, role });
socket.emit('send-message', { conversationId, message });

// Server -> Client
socket.on('notification', (data) => {});
socket.on('new-message', (data) => {});
socket.on('announcement', (data) => {});
```

## 📊 Database Schema

The application uses MongoDB with Mongoose ODM. Key collections include:

- Users
- Students
- Teachers
- Classes
- Subjects
- Attendance
- Assignments
- AssignmentSubmissions
- Exams
- Results
- Conversations
- Messages
- Announcements
- Notifications
- Payments
- Subscriptions

## 🔧 Technologies Used

### Core

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

### Real-time & Caching

- **Socket.io** - WebSocket communication
- **Redis** - Caching and session management
- **IORedis** - Redis client

### Authentication & Security

- **JWT** - JSON Web Tokens
- **bcrypt** - Password hashing
- **Zod** - Schema validation

### External Services

- **AWS S3** - File storage
- **Stripe** - Payment processing
- **Twilio** - SMS notifications
- **Nodemailer** - Email service

### Developer Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Winston** - Logging
- **Morgan** - HTTP request logger
- **ts-node-dev** - TypeScript development

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Code Style

This project follows:

- **ESLint** rules for TypeScript
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

Run linting before commits:

```bash
npm run lint:fix
npm run prettier:fix
```

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support, please contact the development team or create an issue in the repository.

## 🔄 Version

Current Version: **1.0.0**

## 📅 Updates

- Initial release with core features
- Real-time messaging and notifications
- Payment integration
- Assignment and exam management
- Attendance tracking system

---

Built with ❤️ for modern school management
