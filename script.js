// --- Video/Audio Controls ---
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const toggleCameraBtn = document.getElementById('toggleCamera');
const toggleMicBtn = document.getElementById('toggleMic');
const shareScreenBtn = document.getElementById('shareScreen');
const leaveCallBtn = document.querySelector('.leave-call');

// --- Auth Modal ---
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const toggleAuth = document.getElementById('toggleAuth');
const mainContent = document.getElementById('mainContent');
const authError = document.getElementById('authError');
const userWelcome = document.getElementById('userWelcome');
const logoutBtn = document.getElementById('logoutBtn');

// --- Meeting Controls ---
const meetingIdInput = document.getElementById('meetingIdInput');
const joinMeetingBtn = document.getElementById('joinMeeting');
const meetingLink = document.getElementById('meetingLink');
const copyLinkBtn = document.getElementById('copyLink');

// --- Chat & Participants ---
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const participantList = document.getElementById('participantList');

let cameraOn = true;
let micOn = true;
let screenStream = null;
let username = '';
let users = ['You'];
let isRegister = false;
let usersDB = {};
let meetingJoined = false;

// --- Modal Logic ---
function showAuthModal() {
  authModal.style.display = 'flex';
  mainContent.style.display = 'none';
  authTitle.textContent = isRegister ? 'Register' : 'Login';
  authForm.querySelector('button').textContent = isRegister ? 'Register' : 'Login';
  toggleAuth.innerHTML = isRegister
    ? 'Already have an account? <a href="#" id="switchToLogin">Login</a>'
    : 'Don\'t have an account? <a href="#" id="switchToRegister">Register</a>';
  authError.textContent = '';
}
function hideAuthModal() {
  authModal.style.display = 'none';
  mainContent.style.display = '';
}
showAuthModal();

authForm.onsubmit = e => {
  e.preventDefault();
  const uname = document.getElementById('username').value.trim();
  const pwd = document.getElementById('password').value;
  if (isRegister) {
    if (usersDB[uname]) {
      authError.textContent = 'Username already exists!';
      return;
    }
    if (pwd.length < 4) {
      authError.textContent = 'Password must be at least 4 characters!';
      return;
    }
    usersDB[uname] = pwd;
    authError.textContent = 'Registration successful! Please login.';
    setTimeout(() => {
      isRegister = false;
      showAuthModal();
    }, 1000);
  } else {
    if (!usersDB[uname]) {
      authError.textContent = 'User not found!';
      return;
    }
    if (usersDB[uname] !== pwd) {
      authError.textContent = 'Incorrect password!';
      return;
    }
    username = uname;
    users[0] = username;
    updateParticipants();
    hideAuthModal();
    userWelcome.textContent = `Welcome, ${username}!`;
  }
};
toggleAuth.onclick = e => {
  if (e.target.id === 'switchToRegister') {
    isRegister = true;
    showAuthModal();
  }
  if (e.target.id === 'switchToLogin') {
    isRegister = false;
    showAuthModal();
  }
};

logoutBtn.onclick = () => {
  username = '';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  userWelcome.textContent = '';
  showAuthModal();
  meetingJoined = false;
  meetingLink.textContent = '';
  chatMessages.innerHTML = '';
  users = ['You'];
  updateParticipants();
};

// --- Media Devices ---
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
  })
  .catch(err => alert('Error accessing media devices: ' + err));

toggleCameraBtn.addEventListener('click', () => {
  const stream = localVideo.srcObject;
  const videoTrack = stream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  cameraOn = videoTrack.enabled;
  toggleCameraBtn.textContent = cameraOn ? '📷 Turn Off Camera' : '📸 Turn On Camera';
  toggleCameraBtn.classList.toggle('camera-on', cameraOn);
});

toggleMicBtn.addEventListener('click', () => {
  const stream = localVideo.srcObject;
  const audioTrack = stream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  micOn = audioTrack.enabled;
  toggleMicBtn.textContent = micOn ? '🎤 Mute Mic' : '🔇 Unmute Mic';
  toggleMicBtn.classList.toggle('mic-on', micOn);
});

// --- Screen Sharing ---
shareScreenBtn.addEventListener('click', async () => {
  if (!screenStream) {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      localVideo.srcObject = screenStream;
      shareScreenBtn.textContent = '🛑 Stop Sharing';
      shareScreenBtn.classList.add('leave-call');
      screenStream.getVideoTracks()[0].onended = async () => {
        localVideo.srcObject = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        shareScreenBtn.textContent = '🖥️ Share Screen';
        shareScreenBtn.classList.remove('leave-call');
        screenStream = null;
      };
    } catch (e) {
      alert('Screen sharing cancelled.');
      screenStream = null;
    }
  } else {
    screenStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    shareScreenBtn.textContent = '🖥️ Share Screen';
    shareScreenBtn.classList.remove('leave-call');
    screenStream = null;
  }
});

// --- Meeting Link & Join ---
joinMeetingBtn.onclick = () => {
  const id = meetingIdInput.value.trim();
  if (!id) return alert('Enter a meeting ID!');
  meetingLink.textContent = `${window.location.origin}/?meeting=${encodeURIComponent(id)}`;
  users = [username, 'Participant'];
  updateParticipants();
  meetingJoined = true;
  chatMessages.innerHTML = '';
  appendChat('System', `You joined meeting <span style="color:#fbbf24">${id}</span>`);
};
copyLinkBtn.onclick = () => {
  if (!meetingLink.textContent) return;
  navigator.clipboard.writeText(meetingLink.textContent);
  copyLinkBtn.textContent = '✅ Copied!';
  setTimeout(() => (copyLinkBtn.textContent = '🔗 Copy Link'), 1200);
};

// --- Chat ---
chatForm.onsubmit = e => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;
  appendChat(username, msg);
  chatInput.value = '';
};
function appendChat(user, msg) {
  const div = document.createElement('div');
  div.innerHTML = `<strong style="color:#38bdf8">${user}:</strong> <span>${msg}</span>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Participants ---
function updateParticipants() {
  participantList.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u;
    participantList.appendChild(li);
  });
}

// --- Leave Call ---
leaveCallBtn.onclick = () => {
  if (confirm('Leave the meeting?')) {
    meetingJoined = false;
    meetingLink.textContent = '';
    chatMessages.innerHTML = '';
    users = [username];
    updateParticipants();
    appendChat('System', 'You left the meeting.');
  }
};

// --- Simulate Remote Video (for demo only) ---
if (remoteVideo) {
  remoteVideo.poster = "https://dummyimage.com/640x360/222/fff&text=Waiting+for+participant...";
}

// --- Navigation Login Button (show modal) ---
const navLoginBtn = document.getElementById('navLoginBtn');
if (navLoginBtn) {
  navLoginBtn.onclick = () => showAuthModal();
}

// --- Animate CTA Button on Scroll ---
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      ctaBtn.style.boxShadow = '0 4px 24px #3b82f655';
      ctaBtn.style.transform = 'scale(1.05)';
    } else {
      ctaBtn.style.boxShadow = '';
      ctaBtn.style.transform = '';
    }
  });
}

// --- Accessibility: Enter key for meeting join ---
meetingIdInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') joinMeetingBtn.click();
});

// --- Welcome message on login ---
if (username) {
  userWelcome.textContent = `Welcome, ${username}!`;
}