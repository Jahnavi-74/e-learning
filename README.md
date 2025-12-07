# Interactive E-Learning & Engagement Platform

A comprehensive web/mobile application designed to boost student focus and participation during online classes. The platform incorporates gamification elements, real-time quizzes, polls, challenges, and more.

## Features

### 🎮 Gamification
- **Points System**: Students earn points for participating in activities
- **Badges**: Unlock badges as you reach milestones
- **Leaderboards**: Compete with other students on the global leaderboard

### 📚 Online Classes
- **Teachers**: Create online classes with unique class codes
- **Students**: Join classes using class codes
- **Class Management**: Organize quizzes, polls, and challenges per class

### ❓ Interactive Activities
- **Quizzes**: Multiple-choice questions with instant feedback
- **Polls**: Real-time voting and opinion gathering
- **Challenges**: Mini-challenges with different difficulty levels

### 📊 Analytics & Tracking
- **Attendance Tracking**: Mark and track class attendance
- **Progress Analytics**: View detailed performance metrics (teachers)
- **Personalized Recommendations**: Get learning suggestions based on performance

### 💬 Discussion Boards
- **Class Discussions**: Participate in class-wide discussions
- **Threaded Replies**: Reply to posts and engage with peers

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python (Flask)
- **Database**: SQLite

## Installation

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

## Sample Accounts

The application comes with pre-seeded sample data:

### Teacher Account
- **Username**: `teacher1`
- **Password**: `teacher123`

### Student Accounts
- **Username**: `student1` / **Password**: `student123`
- **Username**: `student2` / **Password**: `student123`

### Sample Class
- **Class Code**: `WEB101`
- **Title**: Introduction to Web Development

The sample class includes:
- 3 pre-created quizzes
- 3 pre-created polls
- 3 pre-created challenges
- Sample responses and points

## Usage Guide

### For Teachers

1. **Login** with your teacher account
2. **Create a Class**: Click "Create New Class" and fill in the details
3. **Share Class Code**: Share the generated class code with students
4. **Create Activities**:
   - Create quizzes with multiple-choice questions
   - Create polls to gather student opinions
   - Create challenges for students to complete
5. **View Analytics**: Click "Analytics" on any class to see performance metrics
6. **Monitor Discussions**: Engage with students in class discussions

### For Students

1. **Login** with your student account
2. **Join a Class**: Click "Join Class" and enter the class code
3. **Participate**:
   - Take quizzes to test your knowledge
   - Vote in polls to share your opinion
   - Complete challenges to earn points
4. **Track Progress**: View your points, badges, and leaderboard position
5. **Get Recommendations**: Click "View Recommendations" for personalized learning tips
6. **Engage**: Participate in class discussions

## Database Schema

The application uses SQLite with the following main tables:
- `User`: User accounts (teachers and students)
- `OnlineClass`: Class information
- `ClassEnrollment`: Student enrollments
- `Quiz`, `Poll`, `Challenge`: Activity types
- `QuizResponse`, `PollResponse`, `ChallengeResponse`: Student responses
- `Badge`, `UserBadge`: Badge system
- `DiscussionPost`: Discussion board posts

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /logout` - Logout user

### Classes
- `POST /api/create_class` - Create new class (teacher only)
- `POST /api/join_class` - Join class with code
- `GET /api/classes/<id>` - Get class details

### Activities
- `POST /api/create_quiz` - Create quiz (teacher only)
- `POST /api/submit_quiz` - Submit quiz answer
- `POST /api/create_poll` - Create poll (teacher only)
- `POST /api/submit_poll` - Submit poll vote
- `POST /api/create_challenge` - Create challenge (teacher only)
- `POST /api/submit_challenge` - Submit challenge completion

### Analytics & Features
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/analytics/<class_id>` - Get class analytics (teacher only)
- `GET /api/recommendations` - Get personalized recommendations
- `POST /api/attendance` - Mark attendance
- `GET /api/badges` - Get user badges
- `GET /api/user/points` - Get user points

### Discussions
- `POST /api/discussion` - Create discussion post
- `GET /api/discussion/<class_id>` - Get class discussions

## Development

The application is built with Flask and uses SQLAlchemy for database management. The frontend uses vanilla JavaScript for interactivity and modern CSS for styling.

### Project Structure
```
.
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/            # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── teacher_dashboard.html
│   └── student_dashboard.html
├── static/
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   └── js/
│       ├── main.js       # Common JavaScript
│       ├── teacher.js    # Teacher-specific functions
│       └── student.js    # Student-specific functions
└── elearning.db          # SQLite database (created on first run)
```

## Notes

- The application runs in debug mode by default. Change this for production.
- The secret key should be changed in production.
- The database is automatically initialized with sample data on first run.
- All passwords are hashed using Werkzeug's password hashing.

## License

This project is open source and available for educational purposes.

