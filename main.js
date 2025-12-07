// Global utility functions

function showLeaderboard() {
    fetch('/api/leaderboard')
        .then(response => response.json())
        .then(data => {
            let leaderboardHTML = '<h2>🏆 Leaderboard</h2><div class="leaderboard-list">';
            data.forEach((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                leaderboardHTML += `
                    <div class="leaderboard-item" style="display: flex; justify-content: space-between; padding: 1rem; background: var(--light-color); margin: 0.5rem 0; border-radius: 5px;">
                        <div>
                            <strong>${medal} ${user.username}</strong>
                        </div>
                        <div>
                            <strong>${user.points}</strong> points | ${user.badges} badges
                        </div>
                    </div>
                `;
            });
            leaderboardHTML += '</div>';
            
            showModal('leaderboardModal', leaderboardHTML);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load leaderboard');
        });
}

function showModal(modalId, content) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        // Create modal dynamically
        const newModal = document.createElement('div');
        newModal.id = modalId;
        newModal.className = 'modal';
        newModal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal('${modalId}')">&times;</span>
                ${content}
            </div>
        `;
        document.body.appendChild(newModal);
        newModal.style.display = 'block';
    } else {
        const contentDiv = modal.querySelector('.modal-content') || modal;
        if (contentDiv.querySelector('.close')) {
            contentDiv.innerHTML = `
                <span class="close" onclick="closeModal('${modalId}')">&times;</span>
                ${content}
            `;
        } else {
            contentDiv.innerHTML = content;
        }
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

function loadRecommendations() {
    fetch('/api/recommendations')
        .then(response => response.json())
        .then(data => {
            let recommendationsHTML = '<h2>📊 Personalized Recommendations</h2>';
            recommendationsHTML += `<div style="margin: 1rem 0;"><strong>Your Accuracy:</strong> ${data.accuracy.toFixed(1)}%</div>`;
            recommendationsHTML += `<div style="margin: 1rem 0;"><strong>Total Points:</strong> ${data.total_points}</div>`;
            recommendationsHTML += '<h3 style="margin-top: 1.5rem;">Recommendations:</h3><ul style="margin-top: 1rem;">';
            if (data.recommendations.length === 0) {
                recommendationsHTML += '<li>Great job! Keep up the excellent work!</li>';
            } else {
                data.recommendations.forEach(rec => {
                    recommendationsHTML += `<li style="margin: 0.5rem 0;">${rec}</li>`;
                });
            }
            recommendationsHTML += '</ul>';
            showModal('recommendationsModal', recommendationsHTML);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load recommendations');
        });
}

function showBadges() {
    fetch('/api/badges')
        .then(response => response.json())
        .then(data => {
            let badgesHTML = '<h2>🏆 Your Badges</h2><div class="badge-grid">';
            if (data.length === 0) {
                badgesHTML += '<p>No badges earned yet. Keep participating to earn badges!</p>';
            } else {
                data.forEach(badge => {
                    badgesHTML += `
                        <div class="badge-card">
                            <div class="badge-icon">${badge.icon}</div>
                            <h4>${badge.name}</h4>
                            <p>${badge.description}</p>
                        </div>
                    `;
                });
            }
            badgesHTML += '</div>';
            showModal('badgesModal', badgesHTML);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load badges');
        });
}

// Update user points on page load and periodically
function updateUserPointsNav() {
    if (document.getElementById('user-points')) {
        fetch('/api/user/points')
            .then(response => response.json())
            .then(data => {
                if (data.points !== undefined) {
                    document.getElementById('user-points').textContent = data.points;
                }
            })
            .catch(() => {});
    }
}

// Update on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUserPointsNav);
} else {
    updateUserPointsNav();
}

// Update user points periodically
setInterval(updateUserPointsNav, 30000); // Update every 30 seconds

