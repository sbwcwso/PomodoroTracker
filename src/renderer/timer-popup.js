const titleElement = document.querySelector('#task-title');
const statusElement = document.querySelector('#status');
const timeElement = document.querySelector('#time');

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

window.pomodoro.onTimerPopupUpdate((timer) => {
  titleElement.textContent = timer.title || '未选择事项';
  titleElement.title = timer.title || '';
  timeElement.textContent = formatTime(timer.remaining);
  statusElement.textContent = timer.running
    ? timer.phase === 'break'
      ? '休息中'
      : '专注中'
    : '已暂停';
});
