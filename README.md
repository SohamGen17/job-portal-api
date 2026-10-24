# Job Portal API

A RESTful backend API for a job portal built using **Node.js, Express.js, MongoDB, and Mongoose**. The application allows employers to post and manage jobs, while candidates can search for jobs, apply, and track their applications.

Authentication is handled using JWT, passwords are hashed with bcrypt, and role-based access control protects restricted endpoints.

## Features

- Candidate and employer registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Create, search, filter, update, close, and delete jobs
- Job search by title or company, location, type, skills, and minimum salary
- Sorting and pagination
- Apply for jobs and track applications
- Employer access to applications for their own jobs
- Application status management
- Job application statistics
- Input validation and centralized error handling
- Ownership checks to prevent unauthorized actions

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Authentication:** JSON Web Token (JWT)
- **Password hashing:** bcryptjs
- **Validation:** express-validator
- **API testing and documentation:** Postman

## Project Structure

```text
job-portal-api/
├── config/
│   └── db.js
├── models/
│   ├── User.js
│   ├── Job.js
│   └── Application.js
├── controllers/
│   ├── authController.js
│   ├── jobController.js
│   └── applicationController.js
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   └── applicationRoutes.js
├── middleware/
│   ├── auth.js
│   ├── role.js
│   ├── validate.js
│   └── validationRules.js
├── postman/
│   └── Job Portal API.postman_collection.json
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Prerequisites

- Node.js and npm
- A MongoDB Atlas account
- Postman
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd job-portal-api
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
```

Replace the placeholder values with your own credentials.

**Security:** Never commit `.env` or database credentials to GitHub. Use `.env.example` to document the required variables without exposing secrets.

### 4. Start the server

Development mode:

```bash
npm run dev
```

Production-style local start:

```bash
npm start
```

The server runs at `http://localhost:5000` when port 5000 is configured.

## API Endpoints

All endpoints use the base URL:

```text
http://localhost:5000
```

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated user |

Registration accepts a candidate or employer role. Employers must provide a company name.

### Jobs

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/jobs` | Employer |
| GET | `/api/jobs` | Public |
| GET | `/api/jobs/:id` | Public |
| PUT | `/api/jobs/:id` | Job owner |
| PATCH | `/api/jobs/:id/close` | Job owner |
| DELETE | `/api/jobs/:id` | Job owner |
| GET | `/api/jobs/:id/stats` | Job owner |
| POST | `/api/jobs/:id/apply` | Candidate |
| GET | `/api/jobs/:id/applications` | Job owner |

### Applications

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/applications/my` | Candidate |
| PATCH | `/api/applications/:id/status` | Job owner |
| DELETE | `/api/applications/:id` | Applicant |

### Job Search, Filters, and Pagination

The `GET /api/jobs` endpoint supports the following query parameters:

| Parameter | Description |
|---|---|
| `search` | Search by job title or company |
| `location` | Filter by location |
| `type` | Filter by job type |
| `skill` | Filter by skill |
| `minSalary` | Minimum monthly salary |
| `sort` | Sort using `salary`, `-salary`, `createdAt`, or `-createdAt` |
| `page` | Page number, starting at 1 |
| `limit` | Number of results per page, up to 100 |

Example:

```text
GET /api/jobs?search=developer&location=Pune&type=full-time&page=1&limit=10
```

Paginated responses include `success`, `total`, `page`, `pages`, `count`, and `data`.

## Database Design

The API uses three MongoDB collections.

### User

Stores the user's name, unique email, hashed password, role, optional employer company name, and timestamps.

### Job

Stores the title, description, company name, location, job type, monthly salary, skills, open/closed status, employer reference, and timestamps.

### Application

Stores references to a job and a candidate, cover letter, application status, and timestamps.

### Relationships

- One employer can post multiple jobs.
- One job can have multiple applications.
- One candidate can submit applications to multiple jobs.
- A compound unique index on `job` and `candidate` prevents duplicate applications for the same job.

## Application Status Transitions

Applications follow these permitted transitions:

```text
applied ──→ shortlisted ──→ hired
    │             │
    └──→ rejected ←┘
```

Rules:

- `applied` can transition to `shortlisted` or `rejected`.
- `shortlisted` can transition to `hired` or `rejected`.
- `hired` and `rejected` are terminal statuses.
- Candidates can withdraw applications only while the status is `applied`.

## Authentication and Authorization

Protected endpoints require a JWT in the Authorization header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Candidates can apply for jobs and manage their own applications. Employers can manage only jobs they posted and applications associated with those jobs.

Passwords are hashed before storage and are never returned in API responses.

## Error Handling

The API uses consistent error responses, for example:

```json
{
  "success": false,
  "message": "You have already applied to this job"
}
```

Common HTTP status codes:

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid input or operation |
| 401 | Missing or invalid authentication |
| 403 | Insufficient permissions |
| 404 | Resource or route not found |
| 409 | Duplicate resource or conflicting operation |
| 500 | Unexpected server error |

## Postman Testing and Documentation

The Postman collection is organized into three folders:

- Auth
- Jobs
- Applications

The collection uses an environment with `baseUrl`, `employerToken`, `candidateToken`, `jobId`, and `applicationId` variables.

Testing should cover successful operations, validation errors, duplicate applications, closed jobs, invalid status transitions, authentication failures, role restrictions, and ownership violations.

**Published Postman documentation:**  
[Add your published Postman documentation URL here.]

**Exported collection:**  
The exported collection JSON is stored in the `postman/` directory.

## Future Improvements

- Automated integration testing
- Rate limiting and enhanced security controls
- Email notifications for application status changes
- Resume upload and candidate profiles
- Deployment to a cloud hosting platform

## Author

Developed as a backend assignment to demonstrate REST API development, database modeling, authentication, authorization, validation, and API testing.
