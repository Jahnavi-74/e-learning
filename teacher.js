// Teacher-specific JavaScript

// Load dashboard stats on page load
document.addEventListener('DOMContentLoaded', function() {
    updateDashboardStats();
    updateUserPoints();
});

function updateDashboardStats() {
    // Calculate total students and activities
    let totalStudents = 0;
    let totalActivities = 0;
    
    // This would ideally come from an API, but for now we'll calculate from classes
    const classCards = document.querySelectorAll('.class-card');
    if (classCards.length > 0) {
        // For demo purposes, we'll set some default values
        // In a real app, this would come from an API call
        document.getElementById('total-students').textContent = '2'; // Sample
        document.getElementById('total-activities').textContent = '9'; // Sample (3 quizzes + 3 polls + 3 challenges)
    }
}

function updateUserPoints() {
    fetch('/api/user/points')
        .then(response => response.json())
        .then(data => {
            if (data.points !== undefined && document.getElementById('user-points')) {
                document.getElementById('user-points').textContent = data.points;
            }
        })
        .catch(() => {});
}

function showCreateClassModal() {
    document.getElementById('createClassModal').style.display = 'block';
}

document.getElementById('createClassForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('createClassMessage');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    messageDiv.textContent = '';
    messageDiv.className = 'message';
    
    const formData = {
        title: document.getElementById('classTitle').value,
        description: document.getElementById('classDescription').value
    };
    
    try {
        const response = await fetch('/api/create_class', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (response.ok) {
            messageDiv.textContent = `✅ Class created successfully! Class Code: ${data.class_code}`;
            messageDiv.className = 'message success';
            document.getElementById('createClassForm').reset();
            setTimeout(() => {
                closeModal('createClassModal');
                window.location.reload();
            }, 2000);
        } else {
            messageDiv.textContent = data.error || 'Failed to create class';
            messageDiv.className = 'message error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Class';
        }
    } catch (error) {
        messageDiv.textContent = 'An error occurred. Please try again.';
        messageDiv.className = 'message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Class';
    }
});

function copyClassCode(classCode) {
    navigator.clipboard.writeText(classCode).then(() => {
        alert(`Class code "${classCode}" copied to clipboard!`);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = classCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Class code "${classCode}" copied to clipboard!`);
    });
}

function openClass(classId) {
    fetch(`/api/classes/${classId}`)
        .then(response => response.json())
        .then(data => {
            let content = `
                <h2>${data.title}</h2>
                <p>${data.description}</p>
                <div style="margin: 1rem 0; padding: 1rem; background: var(--light-color); border-radius: 5px;">
                    <strong>Class Code:</strong> ${data.class_code} | <strong>Students:</strong> ${data.enrollments}
                </div>
            `;
            
            // Quizzes Section
            content += '<div class="activity-section"><h3>📝 Quizzes</h3>';
            content += '<button class="btn btn-primary btn-small" onclick="showCreateQuizModal(' + classId + ')">Create Quiz</button>';
            content += '<div class="activity-grid">';
            data.quizzes.forEach(quiz => {
                content += `
                    <div class="activity-card">
                        <h4>${quiz.title}</h4>
                        <p>${quiz.question}</p>
                        <p><strong>Points:</strong> ${quiz.points}</p>
                    </div>
                `;
            });
            content += '</div></div>';
            
            // Polls Section
            content += '<div class="activity-section"><h3>📊 Polls</h3>';
            content += '<button class="btn btn-primary btn-small" onclick="showCreatePollModal(' + classId + ')">Create Poll</button>';
            content += '<div class="activity-grid">';
            data.polls.forEach(poll => {
                content += `
                    <div class="activity-card">
                        <h4>${poll.question}</h4>
                        <p><strong>Points:</strong> ${poll.points}</p>
                    </div>
                `;
            });
            content += '</div></div>';
            
            // Challenges Section
            content += '<div class="activity-section"><h3>🎯 Challenges</h3>';
            content += '<button class="btn btn-primary btn-small" onclick="showCreateChallengeModal(' + classId + ')">Create Challenge</button>';
            content += '<div class="activity-grid">';
            data.challenges.forEach(challenge => {
                content += `
                    <div class="activity-card">
                        <h4>${challenge.title}</h4>
                        <p>${challenge.description}</p>
                        <p><strong>Points:</strong> ${challenge.points}</p>
                    </div>
                `;
            });
            content += '</div></div>';
            
            // Discussion Section
            content += '<div class="discussion-section"><h3>💬 Discussion</h3>';
            content += '<button class="btn btn-primary btn-small" onclick="loadDiscussions(' + classId + ')">Load Discussions</button>';
            content += '<div id="discussionsContainer"></div></div>';
            
            document.getElementById('classDetailContent').innerHTML = content;
            document.getElementById('classDetailModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load class details');
        });
}

function showCreateQuizModal(classId) {
    const modalContent = `
        <h2>Create Quiz</h2>
        <form id="createQuizForm">
            <input type="hidden" id="quizClassId" value="${classId}">
            <div class="form-group">
                <label for="quizTitle">Title</label>
                <input type="text" id="quizTitle" required>
            </div>
            <div class="form-group">
                <label for="quizQuestion">Question</label>
                <textarea id="quizQuestion" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label for="quizOptionA">Option A</label>
                <input type="text" id="quizOptionA" required>
            </div>
            <div class="form-group">
                <label for="quizOptionB">Option B</label>
                <input type="text" id="quizOptionB" required>
            </div>
            <div class="form-group">
                <label for="quizOptionC">Option C</label>
                <input type="text" id="quizOptionC" required>
            </div>
            <div class="form-group">
                <label for="quizOptionD">Option D</label>
                <input type="text" id="quizOptionD" required>
            </div>
            <div class="form-group">
                <label for="quizCorrectAnswer">Correct Answer (a, b, c, or d)</label>
                <input type="text" id="quizCorrectAnswer" maxlength="1" required>
            </div>
            <div class="form-group">
                <label for="quizPoints">Points</label>
                <input type="number" id="quizPoints" value="10" required>
            </div>
            <button type="submit" class="btn btn-primary">Create Quiz</button>
        </form>
    `;
    showModal('createQuizModal', modalContent);
    
    document.getElementById('createQuizForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            class_id: parseInt(document.getElementById('quizClassId').value),
            title: document.getElementById('quizTitle').value,
            question: document.getElementById('quizQuestion').value,
            option_a: document.getElementById('quizOptionA').value,
            option_b: document.getElementById('quizOptionB').value,
            option_c: document.getElementById('quizOptionC').value,
            option_d: document.getElementById('quizOptionD').value,
            correct_answer: document.getElementById('quizCorrectAnswer').value.toLowerCase(),
            points: parseInt(document.getElementById('quizPoints').value)
        };
        
        try {
            const response = await fetch('/api/create_quiz', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (response.ok) {
                alert('Quiz created successfully!');
                closeModal('createQuizModal');
                openClass(formData.class_id);
            } else {
                alert(data.error || 'Failed to create quiz');
            }
        } catch (error) {
            alert('An error occurred');
        }
    });
}

function showCreatePollModal(classId) {
    const modalContent = `
        <h2>Create Poll</h2>
        <form id="createPollForm">
            <input type="hidden" id="pollClassId" value="${classId}">
            <div class="form-group">
                <label for="pollQuestion">Question</label>
                <textarea id="pollQuestion" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label for="pollOption1">Option 1</label>
                <input type="text" id="pollOption1" required>
            </div>
            <div class="form-group">
                <label for="pollOption2">Option 2</label>
                <input type="text" id="pollOption2" required>
            </div>
            <div class="form-group">
                <label for="pollOption3">Option 3 (Optional)</label>
                <input type="text" id="pollOption3">
            </div>
            <div class="form-group">
                <label for="pollOption4">Option 4 (Optional)</label>
                <input type="text" id="pollOption4">
            </div>
            <div class="form-group">
                <label for="pollPoints">Points</label>
                <input type="number" id="pollPoints" value="5" required>
            </div>
            <button type="submit" class="btn btn-primary">Create Poll</button>
        </form>
    `;
    showModal('createPollModal', modalContent);
    
    document.getElementById('createPollForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            class_id: parseInt(document.getElementById('pollClassId').value),
            question: document.getElementById('pollQuestion').value,
            option_1: document.getElementById('pollOption1').value,
            option_2: document.getElementById('pollOption2').value,
            option_3: document.getElementById('pollOption3').value || null,
            option_4: document.getElementById('pollOption4').value || null,
            points: parseInt(document.getElementById('pollPoints').value)
        };
        
        try {
            const response = await fetch('/api/create_poll', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (response.ok) {
                alert('Poll created successfully!');
                closeModal('createPollModal');
                openClass(formData.class_id);
            } else {
                alert(data.error || 'Failed to create poll');
            }
        } catch (error) {
            alert('An error occurred');
        }
    });
}

function showCreateChallengeModal(classId) {
    const modalContent = `
        <h2>Create Challenge</h2>
        <form id="createChallengeForm">
            <input type="hidden" id="challengeClassId" value="${classId}">
            <div class="form-group">
                <label for="challengeTitle">Title</label>
                <input type="text" id="challengeTitle" required>
            </div>
            <div class="form-group">
                <label for="challengeDescription">Description</label>
                <textarea id="challengeDescription" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="challengeType">Type</label>
                <select id="challengeType" required>
                    <option value="quick">Quick Challenge</option>
                    <option value="daily">Daily Challenge</option>
                    <option value="weekly">Weekly Challenge</option>
                </select>
            </div>
            <div class="form-group">
                <label for="challengePoints">Points</label>
                <input type="number" id="challengePoints" value="20" required>
            </div>
            <button type="submit" class="btn btn-primary">Create Challenge</button>
        </form>
    `;
    showModal('createChallengeModal', modalContent);
    
    document.getElementById('createChallengeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            class_id: parseInt(document.getElementById('challengeClassId').value),
            title: document.getElementById('challengeTitle').value,
            description: document.getElementById('challengeDescription').value,
            challenge_type: document.getElementById('challengeType').value,
            points: parseInt(document.getElementById('challengePoints').value)
        };
        
        try {
            const response = await fetch('/api/create_challenge', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (response.ok) {
                alert('Challenge created successfully!');
                closeModal('createChallengeModal');
                openClass(formData.class_id);
            } else {
                alert(data.error || 'Failed to create challenge');
            }
        } catch (error) {
            alert('An error occurred');
        }
    });
}

function viewAnalytics(classId) {
    fetch(`/api/analytics/${classId}`)
        .then(response => response.json())
        .then(data => {
            let analyticsHTML = '<h2>📊 Class Analytics</h2>';
            analyticsHTML += `<div style="margin: 1rem 0;"><strong>Total Students:</strong> ${data.total_students}</div>`;
            analyticsHTML += `<div style="margin: 1rem 0;"><strong>Total Quizzes:</strong> ${data.total_quizzes}</div>`;
            analyticsHTML += `<div style="margin: 1rem 0;"><strong>Total Polls:</strong> ${data.total_polls}</div>`;
            analyticsHTML += `<div style="margin: 1rem 0;"><strong>Total Challenges:</strong> ${data.total_challenges}</div>`;
            analyticsHTML += `<div style="margin: 1rem 0;"><strong>Average Attendance:</strong> ${data.average_attendance.toFixed(1)}</div>`;
            
            if (Object.keys(data.quiz_participation).length > 0) {
                analyticsHTML += '<h3 style="margin-top: 1.5rem;">Quiz Participation:</h3>';
                for (const [quizId, stats] of Object.entries(data.quiz_participation)) {
                    analyticsHTML += `
                        <div style="margin: 1rem 0; padding: 1rem; background: var(--light-color); border-radius: 5px;">
                            <strong>Quiz ${quizId}:</strong> ${stats.total_responses} responses, ${stats.correct_responses} correct (${stats.accuracy.toFixed(1)}% accuracy)
                        </div>
                    `;
                }
            }
            
            showModal('analyticsModal', analyticsHTML);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load analytics');
        });
}

function loadDiscussions(classId) {
    fetch(`/api/discussion/${classId}`)
        .then(response => response.json())
        .then(data => {
            let discussionsHTML = '<h3>Discussion Board</h3>';
            discussionsHTML += '<button class="btn btn-primary btn-small" onclick="showCreateDiscussionModal(' + classId + ')">New Post</button>';
            discussionsHTML += '<div style="margin-top: 1rem;">';
            
            if (data.length === 0) {
                discussionsHTML += '<p>No discussions yet. Start one!</p>';
            } else {
                data.forEach(post => {
                    discussionsHTML += `
                        <div class="discussion-post">
                            <div class="discussion-post-header">
                                <span><strong>${post.username}</strong></span>
                                <span>${new Date(post.created_at).toLocaleString()}</span>
                            </div>
                            <p>${post.content}</p>
                            ${post.replies.length > 0 ? '<div class="discussion-replies">' + post.replies.map(r => `
                                <div class="discussion-post" style="margin-top: 0.5rem;">
                                    <div class="discussion-post-header">
                                        <span><strong>${r.username}</strong></span>
                                        <span>${new Date(r.created_at).toLocaleString()}</span>
                                    </div>
                                    <p>${r.content}</p>
                                </div>
                            `).join('') + '</div>' : ''}
                        </div>
                    `;
                });
            }
            discussionsHTML += '</div>';
            document.getElementById('discussionsContainer').innerHTML = discussionsHTML;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load discussions');
        });
}

function showCreateDiscussionModal(classId) {
    const modalContent = `
        <h2>New Discussion Post</h2>
        <form id="createDiscussionForm">
            <input type="hidden" id="discussionClassId" value="${classId}">
            <div class="form-group">
                <label for="discussionContent">Content</label>
                <textarea id="discussionContent" rows="5" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Post</button>
        </form>
    `;
    showModal('createDiscussionModal', modalContent);
    
    document.getElementById('createDiscussionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            class_id: parseInt(document.getElementById('discussionClassId').value),
            content: document.getElementById('discussionContent').value
        };
        
        try {
            const response = await fetch('/api/discussion', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (response.ok) {
                alert('Post created successfully!');
                closeModal('createDiscussionModal');
                loadDiscussions(formData.class_id);
            } else {
                alert(data.error || 'Failed to create post');
            }
        } catch (error) {
            alert('An error occurred');
        }
    });
}

