import { auth, db } from "../../utils/firebaseConfig.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("/");
        return;
    }

    try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));
        const hasCompletedOnboarding = (
            userSnapshot.exists()
            && userSnapshot.data()?.flags?.onboarding === true
        );

        if (!hasCompletedOnboarding) {
            window.location.replace("/onboarding/index.html");
        }
    } catch (error) {
        console.error("Unable to load the dashboard profile.", error);
        window.location.replace("/");
    }
});
