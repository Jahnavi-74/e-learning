// Student-specific JavaScript

// Load user data on page load
document.addEventListener('DOMContentLoaded', function() {
    updateUserPoints();
    updateBadgeCount();
});

function updateUserPoints() {
    fetch('/api/user/points')
        .then(response => response.json())
        .then(data => {
            if (data.points !== undefined) {
                if (document.getElementById('user-points')) {
                    document.getElementById('user-points').textContent = data.points;
                }
                // Update points in dashboard stats
                const pointsElement = document.querySelector('.dashboard-stats .stat-card h3');
                if (pointsElement && pointsElement.textContent !== data.points.toString()) {
                    pointsElement.textContent = data.points;
                }
            }
        })
        .catch(() => {});
}

function updateBadgeCount() {
    fetch('/api/badges')
        .then(response => response.json())
        .then(data => {
            if (document.getElementById('badge-count')) {
                document.getElementById('badge-count').textContent = data.length;
            }
        })
        .catch(() => {});
}

function showJoinClassModal() {
    document.getElementById('joinClassModal').style.display = 'block';
}

document.getElementById('joinClassForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        class_code: document.getElementById('classCode').value.toUpperCase()
    };
    
    try {
        const response = await fetch('/api/join_class', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (response.ok) {
            document.getElementById('joinClassMessage').textContent = 'Successfully joined class!';
            document.getElementById('joinClassMessage').className = 'message success';
            setTimeout(() => {
                closeModal('joinClassModal');
                window.location.reload();
            }, 1500);
        } else {
            document.getElementById('joinClassMessage').textContent = data.error || 'Failed to join class';
            document.getElementById('joinClassMessage').className = 'message error';
        }
    } catch (error) {
        document.getElementById('joinClassMessage').textContent = 'An error occurred';
        document.getElementById('joinClassMessage').className = 'message error';
    }
});

function openClass(classId) {
    fetch(`/api/classes/${classId}`)
        .then(response => response.json())
        .then(data => {
            let content = `
                <h2>${data.title}</h2>
                <p>${data.description}</p>
                <div style="margin: 1rem 0; padding: 1rem; background: var(--light-color); border-radius: 5px;">
                    <strong>Teacher:</strong> ${data.teacher} | <strong>Class Code:</strong> ${data.class_code}
                </div>
                <button class="btn btn-primary btn-small" onclick="markAttendance(${classId})" style="margin: 1rem 0;">Mark Attendance</button>
            `;
            
            // Quizzes Section
            content += '<div class="activity-section"><h3>📝 Quizzes</h3><div class="activity-grid">';
            if (data.quizzes.length === 0) {
                content += '<p>No quizzes available yet.</p>';
            } else {
                data.quizzes.forEach(quiz => {
                    content += `
                        <div class="activity-card">
                            <h4>${quiz.title}</h4>
                            <p>${quiz.question}</p>
                            <p><strong>Points:</strong> ${quiz.points}</p>
                            <button class="btn btn-primary btn-small" onclick="takeQuiz(${quiz.id})">Take Quiz</button>
                        </div>
                    `;
                });
            }
            content += '</div></div>';
            
            // Polls Section
            content += '<div class="activity-section"><h3>📊 Polls</h3><div class="activity-grid">';
            if (data.polls.length === 0) {
                content += '<p>No polls available yet.</p>';
            } else {
                data.polls.forEach(poll => {
                    content += `
                        <div class="activity-card">
                            <h4>${poll.question}</h4>
                            <p><strong>Points:</strong> ${poll.points}</p>
                            <button class="btn btn-secondary btn-small" onclick="takePoll(${poll.id})">Vote</button>
                        </div>
                    `;
                });
            }
            content += '</div></div>';
            
            // Challenges Section
            content += '<div class="activity-section"><h3>🎯 Challenges</h3><div class="activity-grid">';
            if (data.challenges.length === 0) {
                content += '<p>No challenges available yet.</p>';
            } else {
                data.challenges.forEach(challenge => {
                    content += `
                        <div class="activity-card">
                            <h4>${challenge.title}</h4>
                            <p>${challenge.description}</p>
                            <p><strong>Points:</strong> ${challenge.points}</p>
                            <button class="btn btn-primary btn-small" onclick="takeChallenge(${challenge.id})">Complete Challenge</button>
                        </div>
                    `;
                });
            }
            content += '</div></div>';
            
            // Discussion Section
            content += '<div class="discussion-section"><h3>💬 Discussion</h3>';
            content += '<button class="btn btn-primary btn-small" onclick="loadDiscussions(${classId})">Load Discussions</button>';
            content += '<div id="discussionsContainer"></div></div>';
            
            document.getElementById('classDetailContent').innerHTML = content;
            document.getElementById('classDetailModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load class details');
        });
}

function takeQuiz(quizId) {
    fetch(`/api/quiz/${quizId}`)
        .then(response => response.json())
        .then(data => {
            let quizHTML = `
                <h2>${data.title}</h2>
                <p><strong>${data.question}</strong></p>
                <div class="quiz-options">
                    <div class="quiz-option" onclick="selectQuizOption(this, 'a')">
                        <strong>A:</strong> ${data.option_a}
                    </div>
                    <div class="quiz-option" onclick="selectQuizOption(this, 'b')">
                        <strong>B:</strong> ${data.option_b}
                    </div>
                    <div class="quiz-option" onclick="selectQuizOption(this, 'c')">
                        <strong>C:</strong> ${data.option_c}
                    </div>
                    <div class="quiz-option" onclick="selectQuizOption(this, 'd')">
                        <strong>D:</strong> ${data.option_d}
                    </div>
                </div>
                <button class="btn btn-primary" onclick="submitQuiz(${quizId})" id="submitQuizBtn" disabled>Submit Answer</button>
            `;
            showModal('quizModal', quizHTML);
            window.currentQuizAnswer = null;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load quiz');
        });
}

function selectQuizOption(element, answer) {
    document.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    window.currentQuizAnswer = answer;
    document.getElementById('submitQuizBtn').disabled = false;
}

function submitQuiz(quizId) {
    if (!window.currentQuizAnswer) {
        alert('Please select an answer');
        return;
    }
    
    fetch('/api/submit_quiz', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            quiz_id: quizId,
            answer: window.currentQuizAnswer
        })
    })
    .then(response => response.json())
    .then(data => {
        let resultHTML = `
            <h2>Quiz Result</h2>
            <p style="font-size: 1.2rem; margin: 1rem 0;">
                ${data.is_correct ? '✅ Correct!' : '❌ Incorrect'}
            </p>
            <p><strong>Points Earned:</strong> ${data.points_earned}</p>
            <p><strong>Correct Answer:</strong> ${data.correct_answer.toUpperCase()}</p>
            <button class="btn btn-primary" onclick="closeModal('quizModal'); location.reload();">Close</button>
        `;
        showModal('quizResultModal', resultHTML);
        closeModal('quizModal');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit quiz');
    });
}

function takePoll(pollId) {
    fetch(`/api/poll/${pollId}`)
        .then(response => response.json())
        .then(data => {
            let pollHTML = `
                <h2>Poll</h2>
                <p><strong>${data.question}</strong></p>
                <div class="poll-options">
                    <div class="poll-option" onclick="selectPollOption(this, 1)">
                        ${data.option_1}
                    </div>
                    <div class="poll-option" onclick="selectPollOption(this, 2)">
                        ${data.option_2}
                    </div>
                    ${data.option_3 ? `<div class="poll-option" onclick="selectPollOption(this, 3)">${data.option_3}</div>` : ''}
                    ${data.option_4 ? `<div class="poll-option" onclick="selectPollOption(this, 4)">${data.option_4}</div>` : ''}
                </div>
                <button class="btn btn-secondary" onclick="submitPoll(${pollId})" id="submitPollBtn" disabled>Submit Vote</button>
            `;
            showModal('pollModal', pollHTML);
            window.currentPollOption = null;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load poll');
        });
}

function selectPollOption(element, option) {
    document.querySelectorAll('.poll-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    window.currentPollOption = option;
    document.getElementById('submitPollBtn').disabled = false;
}

function submitPoll(pollId) {
    if (!window.currentPollOption) {
        alert('Please select an option');
        return;
    }
    
    fetch('/api/submit_poll', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            poll_id: pollId,
            selected_option: window.currentPollOption
        })
    })
    .then(async response => {
        const data = await response.json();
        if (response.ok) {
            alert(`Vote submitted! You earned ${data.points_earned} points.`);
            closeModal('pollModal');
            location.reload();
        } else {
            alert(data.error || 'Failed to submit poll');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit poll');
    });
}

function takeChallenge(challengeId) {
    fetch(`/api/challenge/${challengeId}`)
        .then(response => response.json())
        .then(data => {
            let challengeHTML = `
                <h2>${data.title}</h2>
                <p>${data.description}</p>
                <p><strong>Points:</strong> ${data.points}</p>
                <div class="form-group">
                    <label for="challengeSubmission">Your Submission</label>
                    <textarea id="challengeSubmission" rows="5" placeholder="Describe how you completed the challenge..."></textarea>
                </div>
                <button class="btn btn-primary" onclick="submitChallenge(${challengeId})">Submit Challenge</button>
            `;
            showModal('challengeModal', challengeHTML);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load challenge');
        });
}

function submitChallenge(challengeId) {
    const submission = document.getElementById('challengeSubmission').value;
    if (!submission.trim()) {
        alert('Please provide a submission');
        return;
    }
    
    fetch('/api/submit_challenge', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            challenge_id: challengeId,
            submission: submission
        })
    })
    .then(response => response.json())
    .then(data => {
        if (response.ok) {
            alert(`Challenge submitted! You earned ${data.points_earned} points.`);
            closeModal('challengeModal');
            location.reload();
        } else {
            alert(data.error || 'Failed to submit challenge');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit challenge');
    });
}

function markAttendance(classId) {
    fetch('/api/attendance', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({class_id: classId})
    })
    .then(response => response.json())
    .then(data => {
        if (response.ok) {
            alert(`Attendance marked! Total attendance: ${data.attendance_count}`);
        } else {
            alert(data.error || 'Failed to mark attendance');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to mark attendance');
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

