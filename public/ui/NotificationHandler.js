export function notification(userMessage, technicalDetails, isError = false, isCritical = false) {
	const notificationDiv = document.createElement('div');
	notificationDiv.classList.add(isError ? 'error-notification' : 'info-notification');
	notificationDiv.classList.add('notification');

	document.body.appendChild(notificationDiv);
	
	const icon = isCritical ? '⚠️' : (isError ? '❌' : 'ℹ️');
	
	notificationDiv.innerHTML = `
		<div class="notification-header">
			<strong>${icon} ${userMessage}</strong>
			<button class="notification-close">×</button>
		</div>
		<details class="notification-details">
			<summary>Technical details (for troubleshooting)</summary>
			<div class="notification-technical">
${technicalDetails}
Time: ${new Date().toLocaleString()}
			</div>
		</details>
	`;
	
	notificationDiv.querySelector('.notification-close').onclick = () => {
		notificationDiv.remove();
	};
}
