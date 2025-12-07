from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///elearning.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'teacher' or 'student'
    points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    badges = db.relationship('UserBadge', backref='user', lazy=True)
    quiz_responses = db.relationship('QuizResponse', backref='user', lazy=True)
    poll_responses = db.relationship('PollResponse', backref='user', lazy=True)
    challenge_responses = db.relationship('ChallengeResponse', backref='user', lazy=True)
    class_enrollments = db.relationship('ClassEnrollment', backref='user', lazy=True)
    posts = db.relationship('DiscussionPost', backref='user', lazy=True)

class OnlineClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_code = db.Column(db.String(20), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    teacher = db.relationship('User', backref='classes')
    enrollments = db.relationship('ClassEnrollment', backref='online_class', lazy=True, cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', backref='online_class', lazy=True, cascade='all, delete-orphan')
    polls = db.relationship('Poll', backref='online_class', lazy=True, cascade='all, delete-orphan')
    challenges = db.relationship('Challenge', backref='online_class', lazy=True, cascade='all, delete-orphan')
    discussions = db.relationship('DiscussionPost', backref='online_class', lazy=True, cascade='all, delete-orphan')

class ClassEnrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('online_class.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    attendance_count = db.Column(db.Integer, default=0)
    last_attended = db.Column(db.DateTime)

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('online_class.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    question = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(200), nullable=False)
    option_b = db.Column(db.String(200), nullable=False)
    option_c = db.Column(db.String(200), nullable=False)
    option_d = db.Column(db.String(200), nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False)  # 'a', 'b', 'c', or 'd'
    points = db.Column(db.Integer, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    responses = db.relationship('QuizResponse', backref='quiz', lazy=True, cascade='all, delete-orphan')

class QuizResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    answer = db.Column(db.String(1), nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    points_earned = db.Column(db.Integer, default=0)
    responded_at = db.Column(db.DateTime, default=datetime.utcnow)

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('online_class.id'), nullable=False)
    question = db.Column(db.Text, nullable=False)
    option_1 = db.Column(db.String(200), nullable=False)
    option_2 = db.Column(db.String(200), nullable=False)
    option_3 = db.Column(db.String(200), nullable=True)
    option_4 = db.Column(db.String(200), nullable=True)
    points = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    responses = db.relationship('PollResponse', backref='poll', lazy=True, cascade='all, delete-orphan')

class PollResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    selected_option = db.Column(db.Integer, nullable=False)  # 1, 2, 3, or 4
    points_earned = db.Column(db.Integer, default=0)
    responded_at = db.Column(db.DateTime, default=datetime.utcnow)

class Challenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('online_class.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    challenge_type = db.Column(db.String(50), nullable=False)  # 'quick', 'daily', 'weekly'
    points = db.Column(db.Integer, default=20)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    
    responses = db.relationship('ChallengeResponse', backref='challenge', lazy=True, cascade='all, delete-orphan')

class ChallengeResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenge.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    submission = db.Column(db.Text)
    points_earned = db.Column(db.Integer, default=0)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_completed = db.Column(db.Boolean, default=False)

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50), default='🏆')
    points_required = db.Column(db.Integer, default=0)

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    badge = db.relationship('Badge', backref='user_badges')

class DiscussionPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('online_class.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    parent_id = db.Column(db.Integer, db.ForeignKey('discussion_post.id'), nullable=True)
    
    replies = db.relationship('DiscussionPost', backref=db.backref('parent', remote_side=[id]), lazy=True)

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'student')
        
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role=role
        )
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'Registration successful', 'user_id': user.id}), 201
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            return jsonify({'message': 'Login successful', 'role': user.role}), 200
        return jsonify({'error': 'Invalid credentials'}), 401
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    
    if user.role == 'teacher':
        classes = OnlineClass.query.filter_by(teacher_id=user.id).all()
        return render_template('teacher_dashboard.html', user=user, classes=classes)
    else:
        enrollments = ClassEnrollment.query.filter_by(user_id=user.id).all()
        class_ids = [e.class_id for e in enrollments]
        classes = OnlineClass.query.filter(OnlineClass.id.in_(class_ids)).all() if class_ids else []
        return render_template('student_dashboard.html', user=user, classes=classes)

@app.route('/api/create_class', methods=['POST'])
def create_class():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can create classes'}), 403
    
    data = request.get_json()
    import random
    import string
    class_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    online_class = OnlineClass(
        title=data.get('title'),
        description=data.get('description', ''),
        teacher_id=user.id,
        class_code=class_code
    )
    db.session.add(online_class)
    db.session.commit()
    
    return jsonify({'message': 'Class created', 'class_id': online_class.id, 'class_code': class_code}), 201

@app.route('/api/join_class', methods=['POST'])
def join_class():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    class_code = data.get('class_code')
    
    online_class = OnlineClass.query.filter_by(class_code=class_code, is_active=True).first()
    if not online_class:
        return jsonify({'error': 'Invalid class code'}), 404
    
    # Check if already enrolled
    existing = ClassEnrollment.query.filter_by(user_id=session['user_id'], class_id=online_class.id).first()
    if existing:
        return jsonify({'error': 'Already enrolled in this class'}), 400
    
    enrollment = ClassEnrollment(
        user_id=session['user_id'],
        class_id=online_class.id
    )
    db.session.add(enrollment)
    db.session.commit()
    
    return jsonify({'message': 'Successfully joined class', 'class_id': online_class.id}), 201

@app.route('/api/classes/<int:class_id>')
def get_class(class_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    online_class = OnlineClass.query.get_or_404(class_id)
    user = User.query.get(session['user_id'])
    
    # Check access
    if user.role == 'teacher':
        if online_class.teacher_id != user.id:
            return jsonify({'error': 'Unauthorized'}), 403
    else:
        enrollment = ClassEnrollment.query.filter_by(user_id=user.id, class_id=class_id).first()
        if not enrollment:
            return jsonify({'error': 'Not enrolled in this class'}), 403
    
    quizzes = Quiz.query.filter_by(class_id=class_id).all()
    polls = Poll.query.filter_by(class_id=class_id).all()
    challenges = Challenge.query.filter_by(class_id=class_id).all()
    discussions = DiscussionPost.query.filter_by(class_id=class_id, parent_id=None).order_by(DiscussionPost.created_at.desc()).all()
    enrollments = ClassEnrollment.query.filter_by(class_id=class_id).all()
    
    class_data = {
        'id': online_class.id,
        'title': online_class.title,
        'description': online_class.description,
        'class_code': online_class.class_code,
        'teacher': online_class.teacher.username,
        'quizzes': [{'id': q.id, 'title': q.title, 'question': q.question, 'points': q.points} for q in quizzes],
        'polls': [{'id': p.id, 'question': p.question, 'points': p.points} for p in polls],
        'challenges': [{'id': c.id, 'title': c.title, 'description': c.description, 'points': c.points} for c in challenges],
        'enrollments': len(enrollments),
        'is_teacher': user.role == 'teacher'
    }
    
    return jsonify(class_data), 200

@app.route('/api/create_quiz', methods=['POST'])
def create_quiz():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can create quizzes'}), 403
    
    data = request.get_json()
    quiz = Quiz(
        class_id=data.get('class_id'),
        title=data.get('title'),
        question=data.get('question'),
        option_a=data.get('option_a'),
        option_b=data.get('option_b'),
        option_c=data.get('option_c'),
        option_d=data.get('option_d'),
        correct_answer=data.get('correct_answer'),
        points=data.get('points', 10)
    )
    db.session.add(quiz)
    db.session.commit()
    
    return jsonify({'message': 'Quiz created', 'quiz_id': quiz.id}), 201

@app.route('/api/submit_quiz', methods=['POST'])
def submit_quiz():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    quiz = Quiz.query.get_or_404(data.get('quiz_id'))
    answer = data.get('answer')
    
    is_correct = (answer.lower() == quiz.correct_answer.lower())
    points_earned = quiz.points if is_correct else 0
    
    response = QuizResponse(
        quiz_id=quiz.id,
        user_id=session['user_id'],
        answer=answer,
        is_correct=is_correct,
        points_earned=points_earned
    )
    db.session.add(response)
    
    if is_correct:
        user = User.query.get(session['user_id'])
        user.points += points_earned
        check_and_award_badges(user)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Quiz submitted',
        'is_correct': is_correct,
        'points_earned': points_earned,
        'correct_answer': quiz.correct_answer
    }), 200

@app.route('/api/create_poll', methods=['POST'])
def create_poll():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can create polls'}), 403
    
    data = request.get_json()
    poll = Poll(
        class_id=data.get('class_id'),
        question=data.get('question'),
        option_1=data.get('option_1'),
        option_2=data.get('option_2'),
        option_3=data.get('option_3'),
        option_4=data.get('option_4'),
        points=data.get('points', 5)
    )
    db.session.add(poll)
    db.session.commit()
    
    return jsonify({'message': 'Poll created', 'poll_id': poll.id}), 201

@app.route('/api/submit_poll', methods=['POST'])
def submit_poll():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    poll = Poll.query.get_or_404(data.get('poll_id'))
    selected_option = data.get('selected_option')
    
    # Check if already responded
    existing = PollResponse.query.filter_by(poll_id=poll.id, user_id=session['user_id']).first()
    if existing:
        return jsonify({'error': 'Already responded to this poll'}), 400
    
    response = PollResponse(
        poll_id=poll.id,
        user_id=session['user_id'],
        selected_option=selected_option,
        points_earned=poll.points
    )
    db.session.add(response)
    
    user = User.query.get(session['user_id'])
    user.points += poll.points
    check_and_award_badges(user)
    
    db.session.commit()
    
    return jsonify({'message': 'Poll submitted', 'points_earned': poll.points}), 200

@app.route('/api/create_challenge', methods=['POST'])
def create_challenge():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can create challenges'}), 403
    
    data = request.get_json()
    due_date = None
    if data.get('due_date'):
        due_date = datetime.fromisoformat(data.get('due_date'))
    
    challenge = Challenge(
        class_id=data.get('class_id'),
        title=data.get('title'),
        description=data.get('description'),
        challenge_type=data.get('challenge_type', 'quick'),
        points=data.get('points', 20),
        due_date=due_date
    )
    db.session.add(challenge)
    db.session.commit()
    
    return jsonify({'message': 'Challenge created', 'challenge_id': challenge.id}), 201

@app.route('/api/submit_challenge', methods=['POST'])
def submit_challenge():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    challenge = Challenge.query.get_or_404(data.get('challenge_id'))
    
    response = ChallengeResponse(
        challenge_id=challenge.id,
        user_id=session['user_id'],
        submission=data.get('submission', ''),
        points_earned=challenge.points,
        is_completed=True
    )
    db.session.add(response)
    
    user = User.query.get(session['user_id'])
    user.points += challenge.points
    check_and_award_badges(user)
    
    db.session.commit()
    
    return jsonify({'message': 'Challenge submitted', 'points_earned': challenge.points}), 200

@app.route('/api/leaderboard')
def leaderboard():
    users = User.query.filter_by(role='student').order_by(User.points.desc()).limit(20).all()
    leaderboard_data = [{'username': u.username, 'points': u.points, 'badges': len(u.badges)} for u in users]
    return jsonify(leaderboard_data), 200

@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    class_id = data.get('class_id')
    
    enrollment = ClassEnrollment.query.filter_by(user_id=session['user_id'], class_id=class_id).first()
    if enrollment:
        enrollment.attendance_count += 1
        enrollment.last_attended = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Attendance marked', 'attendance_count': enrollment.attendance_count}), 200
    
    return jsonify({'error': 'Not enrolled in this class'}), 404

@app.route('/api/discussion', methods=['POST'])
def create_discussion():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    post = DiscussionPost(
        class_id=data.get('class_id'),
        user_id=session['user_id'],
        content=data.get('content'),
        parent_id=data.get('parent_id')
    )
    db.session.add(post)
    db.session.commit()
    
    return jsonify({'message': 'Post created', 'post_id': post.id}), 201

@app.route('/api/discussion/<int:class_id>')
def get_discussions(class_id):
    posts = DiscussionPost.query.filter_by(class_id=class_id, parent_id=None).order_by(DiscussionPost.created_at.desc()).all()
    discussions = []
    for post in posts:
        replies = DiscussionPost.query.filter_by(parent_id=post.id).all()
        discussions.append({
            'id': post.id,
            'username': post.user.username,
            'content': post.content,
            'created_at': post.created_at.isoformat(),
            'replies': [{'id': r.id, 'username': r.user.username, 'content': r.content, 'created_at': r.created_at.isoformat()} for r in replies]
        })
    return jsonify(discussions), 200

@app.route('/api/analytics/<int:class_id>')
def get_analytics(class_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can view analytics'}), 403
    
    enrollments = ClassEnrollment.query.filter_by(class_id=class_id).all()
    quizzes = Quiz.query.filter_by(class_id=class_id).all()
    polls = Poll.query.filter_by(class_id=class_id).all()
    challenges = Challenge.query.filter_by(class_id=class_id).all()
    
    analytics = {
        'total_students': len(enrollments),
        'total_quizzes': len(quizzes),
        'total_polls': len(polls),
        'total_challenges': len(challenges),
        'average_attendance': sum(e.attendance_count for e in enrollments) / len(enrollments) if enrollments else 0,
        'quiz_participation': {}
    }
    
    for quiz in quizzes:
        responses = QuizResponse.query.filter_by(quiz_id=quiz.id).all()
        correct = sum(1 for r in responses if r.is_correct)
        analytics['quiz_participation'][quiz.id] = {
            'total_responses': len(responses),
            'correct_responses': correct,
            'accuracy': (correct / len(responses) * 100) if responses else 0
        }
    
    return jsonify(analytics), 200

@app.route('/api/recommendations')
def get_recommendations():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    
    recommendations = []
    
    if user.role == 'student':
        # Get user's performance
        quiz_responses = QuizResponse.query.filter_by(user_id=user.id).all()
        correct_count = sum(1 for r in quiz_responses if r.is_correct)
        total_quizzes = len(quiz_responses)
        accuracy = (correct_count / total_quizzes * 100) if total_quizzes > 0 else 0
        
        if accuracy < 70:
            recommendations.append('Focus on reviewing quiz questions to improve your accuracy')
        if user.points < 100:
            recommendations.append('Participate in more activities to earn points and badges')
        
        enrollments = ClassEnrollment.query.filter_by(user_id=user.id).all()
        for enrollment in enrollments:
            if enrollment.attendance_count < 5:
                recommendations.append(f'Attend more classes to improve your attendance in {enrollment.online_class.title}')
        
        return jsonify({'recommendations': recommendations, 'accuracy': accuracy, 'total_points': user.points}), 200
    else:
        # Teacher recommendations
        classes = OnlineClass.query.filter_by(teacher_id=user.id).all()
        if len(classes) == 0:
            recommendations.append('Create your first class to get started')
        else:
            for cls in classes:
                enrollments = ClassEnrollment.query.filter_by(class_id=cls.id).all()
                if len(enrollments) < 2:
                    recommendations.append(f'Invite more students to join {cls.title}')
                quizzes = Quiz.query.filter_by(class_id=cls.id).all()
                if len(quizzes) < 3:
                    recommendations.append(f'Add more quizzes to {cls.title} to engage students')
        
        return jsonify({'recommendations': recommendations, 'total_points': user.points}), 200

@app.route('/api/quiz/<int:quiz_id>')
def get_quiz(quiz_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify({
        'id': quiz.id,
        'title': quiz.title,
        'question': quiz.question,
        'option_a': quiz.option_a,
        'option_b': quiz.option_b,
        'option_c': quiz.option_c,
        'option_d': quiz.option_d,
        'points': quiz.points
    }), 200

@app.route('/api/poll/<int:poll_id>')
def get_poll(poll_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    poll = Poll.query.get_or_404(poll_id)
    return jsonify({
        'id': poll.id,
        'question': poll.question,
        'option_1': poll.option_1,
        'option_2': poll.option_2,
        'option_3': poll.option_3,
        'option_4': poll.option_4,
        'points': poll.points
    }), 200

@app.route('/api/challenge/<int:challenge_id>')
def get_challenge(challenge_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    challenge = Challenge.query.get_or_404(challenge_id)
    return jsonify({
        'id': challenge.id,
        'title': challenge.title,
        'description': challenge.description,
        'challenge_type': challenge.challenge_type,
        'points': challenge.points,
        'due_date': challenge.due_date.isoformat() if challenge.due_date else None
    }), 200

@app.route('/api/user/points')
def get_user_points():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    return jsonify({'points': user.points}), 200

@app.route('/api/badges')
def get_user_badges():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    badges = []
    for user_badge in user.badges:
        badges.append({
            'id': user_badge.badge.id,
            'name': user_badge.badge.name,
            'description': user_badge.badge.description,
            'icon': user_badge.badge.icon,
            'earned_at': user_badge.earned_at.isoformat()
        })
    return jsonify(badges), 200

def check_and_award_badges(user):
    badges = Badge.query.all()
    user_badge_ids = [ub.badge_id for ub in user.badges]
    
    for badge in badges:
        if badge.id not in user_badge_ids and user.points >= badge.points_required:
            user_badge = UserBadge(user_id=user.id, badge_id=badge.id)
            db.session.add(user_badge)

# Initialize database and seed data
def init_db():
    with app.app_context():
        db.create_all()
        
        # Create default badges
        if Badge.query.count() == 0:
            badges = [
                Badge(name='First Steps', description='Earn your first 10 points', icon='🌱', points_required=10),
                Badge(name='Rising Star', description='Earn 50 points', icon='⭐', points_required=50),
                Badge(name='Quiz Master', description='Earn 100 points', icon='🎯', points_required=100),
                Badge(name='Champion', description='Earn 250 points', icon='🏆', points_required=250),
                Badge(name='Legend', description='Earn 500 points', icon='👑', points_required=500)
            ]
            for badge in badges:
                db.session.add(badge)
            db.session.commit()
        
        # Create sample users if they don't exist
        if User.query.count() == 0:
            teacher = User(
                username='teacher1',
                email='teacher1@example.com',
                password_hash=generate_password_hash('teacher123'),
                role='teacher'
            )
            student1 = User(
                username='student1',
                email='student1@example.com',
                password_hash=generate_password_hash('student123'),
                role='student'
            )
            student2 = User(
                username='student2',
                email='student2@example.com',
                password_hash=generate_password_hash('student123'),
                role='student'
            )
            db.session.add_all([teacher, student1, student2])
            db.session.commit()
            
            # Create sample class
            sample_class = OnlineClass(
                title='Introduction to Web Development',
                description='Learn the fundamentals of HTML, CSS, and JavaScript',
                teacher_id=teacher.id,
                class_code='WEB101'
            )
            db.session.add(sample_class)
            db.session.commit()
            
            # Enroll students
            enrollment1 = ClassEnrollment(user_id=student1.id, class_id=sample_class.id)
            enrollment2 = ClassEnrollment(user_id=student2.id, class_id=sample_class.id)
            db.session.add_all([enrollment1, enrollment2])
            db.session.commit()
            
            # Create 3 quizzes
            quizzes = [
                Quiz(class_id=sample_class.id, title='HTML Basics', question='What does HTML stand for?',
                     option_a='HyperText Markup Language', option_b='High Tech Modern Language',
                     option_c='Home Tool Markup Language', option_d='Hyperlink and Text Markup Language',
                     correct_answer='a', points=10),
                Quiz(class_id=sample_class.id, title='CSS Selectors', question='Which CSS property is used to change text color?',
                     option_a='font-color', option_b='text-color', option_c='color', option_d='text-style',
                     correct_answer='c', points=10),
                Quiz(class_id=sample_class.id, title='JavaScript Functions', question='How do you declare a function in JavaScript?',
                     option_a='function myFunction()', option_b='func myFunction()',
                     option_c='def myFunction()', option_d='function: myFunction()',
                     correct_answer='a', points=10)
            ]
            db.session.add_all(quizzes)
            db.session.commit()
            
            # Create 3 polls
            polls = [
                Poll(class_id=sample_class.id, question='Which topic do you find most interesting?',
                     option_1='Frontend Development', option_2='Backend Development',
                     option_3='Full Stack Development', option_4='Mobile Development', points=5),
                Poll(class_id=sample_class.id, question='How many hours per week do you study?',
                     option_1='Less than 5 hours', option_2='5-10 hours',
                     option_3='10-20 hours', option_4='More than 20 hours', points=5),
                Poll(class_id=sample_class.id, question='What is your preferred learning method?',
                     option_1='Video Tutorials', option_2='Reading Documentation',
                     option_3='Hands-on Practice', option_4='Group Study', points=5)
            ]
            db.session.add_all(polls)
            db.session.commit()
            
            # Create 3 challenges
            challenges = [
                Challenge(class_id=sample_class.id, title='Build a Simple HTML Page',
                         description='Create a basic HTML page with header, body, and footer sections',
                         challenge_type='quick', points=20),
                Challenge(class_id=sample_class.id, title='Style with CSS',
                         description='Add CSS styling to make your HTML page visually appealing',
                         challenge_type='daily', points=25),
                Challenge(class_id=sample_class.id, title='Add JavaScript Interactivity',
                         description='Implement a simple JavaScript function to add interactivity',
                         challenge_type='weekly', points=30)
            ]
            db.session.add_all(challenges)
            db.session.commit()
            
            # Create some sample responses
            quiz_responses = [
                QuizResponse(quiz_id=quizzes[0].id, user_id=student1.id, answer='a', is_correct=True, points_earned=10),
                QuizResponse(quiz_id=quizzes[1].id, user_id=student1.id, answer='c', is_correct=True, points_earned=10),
                QuizResponse(quiz_id=quizzes[0].id, user_id=student2.id, answer='a', is_correct=True, points_earned=10),
            ]
            db.session.add_all(quiz_responses)
            
            poll_responses = [
                PollResponse(poll_id=polls[0].id, user_id=student1.id, selected_option=1, points_earned=5),
                PollResponse(poll_id=polls[1].id, user_id=student1.id, selected_option=2, points_earned=5),
                PollResponse(poll_id=polls[0].id, user_id=student2.id, selected_option=2, points_earned=5),
            ]
            db.session.add_all(poll_responses)
            
            challenge_responses = [
                ChallengeResponse(challenge_id=challenges[0].id, user_id=student1.id, submission='Completed', points_earned=20, is_completed=True),
                ChallengeResponse(challenge_id=challenges[1].id, user_id=student1.id, submission='Completed', points_earned=25, is_completed=True),
            ]
            db.session.add_all(challenge_responses)
            
            # Update student points
            student1.points = 75
            student2.points = 15
            db.session.commit()
            
            # Award badges
            check_and_award_badges(student1)
            check_and_award_badges(student2)
            db.session.commit()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)

