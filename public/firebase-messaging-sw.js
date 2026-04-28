importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgTIvPPp8_eAMCFUqLl9k6-V3VK-oshi8",
  authDomain: "ezbifurcation.firebaseapp.com",
  projectId: "ezbifurcation",
  storageBucket: "ezbifurcation.firebasestorage.app",
  messagingSenderId: "339450125043",
  appId: "1:339450125043:web:89d29ffaf05e078401f586"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// This background handler is what makes the notification show up 
// even if the doctor is looking at a different tab.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Add your clinic logo here
    data: { url: payload.data.click_action } 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});