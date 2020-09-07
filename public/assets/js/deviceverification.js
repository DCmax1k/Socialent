// Device Verification
window.addEventListener('load', async () => {
  const userID = window.location.href.split('=')[1];
  const response = await fetch('/deviceverification?k=' + userID, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device: window.navigator.userAgent,
    }),
  });
  const resJSON = await response.json();
  if (!resJSON.verified) {
    window.location.href = '/login';
  }
});
