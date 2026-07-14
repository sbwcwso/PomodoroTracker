const titleElement = document.querySelector('#task-title');
const statusElement = document.querySelector('#status');
const timeElement = document.querySelector('#time');
const closeButton = document.querySelector('#close-popup');
let currentTimer = null;
let measuredTitle = '';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function renderTimer() {
  if (!currentTimer) {
    return;
  }
  const timer = currentTimer;
  const remaining =
    timer.running && timer.endsAt
      ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000))
      : timer.remaining;
  titleElement.textContent = timer.title || '未选择事项';
  titleElement.title = timer.title || '';
  timeElement.textContent = formatTime(remaining);
  statusElement.textContent =
    timer.status || (timer.running ? (timer.phase === 'break' ? '休息中' : '专注中') : '已暂停');
  const title = timer.title || '未选择事项';
  if (title !== measuredTitle) {
    measuredTitle = title;
    window.requestAnimationFrame(() => {
      const desiredWidth = Math.min(620, Math.max(280, titleElement.scrollWidth + 104));
      window.pomodoro.resizeTimerPopup(desiredWidth);
    });
  }
}

window.pomodoro.onTimerPopupUpdate((timer) => {
  currentTimer = timer;
  renderTimer();
});

window.setInterval(renderTimer, 250);
window.addEventListener('focus', renderTimer);
document.addEventListener('visibilitychange', renderTimer);

closeButton.addEventListener('click', () => window.pomodoro.hideTimerPopup());
document.querySelector('.timer-card').addEventListener('dblclick', (event) => {
  if (!event.target.closest('button')) {
    window.pomodoro.showMainWindow();
  }
});
