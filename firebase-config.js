import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYJC4kr2e2Z0Y8PBp674mo_EI3D5NAkB4",
  authDomain: "wonderhub-a3b61.firebaseapp.com",
  projectId: "wonderhub-a3b61",
  storageBucket: "wonderhub-a3b61.firebasestorage.app",
  messagingSenderId: "790465606077",
  appId: "1:790465606077:web:61e5246604d63fc8a422d4",
  measurementId: "G-WZ0RZRV629"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Global background listener
if (typeof document !== 'undefined') {
    onSnapshot(doc(db, 'config', 'website'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.backgroundImage) {
                const iframe = document.querySelector('.video-background');
                if (iframe) iframe.style.display = 'none';
                document.body.style.backgroundImage = `url(${data.backgroundImage})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
            } else {
                const iframe = document.querySelector('.video-background');
                if (iframe) iframe.style.display = 'block';
                document.body.style.backgroundImage = 'none';
            }
        }
    }, (error) => {
        console.warn('Background config listener error (dit is normaal als rules strict zijn of je nog niet bent ingelogd):', error.message);
    });
}
