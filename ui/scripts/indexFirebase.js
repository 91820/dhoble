import { auth, db } from "../../utils/firebaseConfig.js";
import {
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const phoneInput = document.getElementById("indexViewEmailInput");
const phoneForm = phoneInput.closest("form");
const phoneSubmit = phoneForm.querySelector(".submit");
const phoneError = document.getElementById("indexPhoneError");
const verificationForm = document.getElementById("indexPhoneVericiationContent");
const verificationPhoneNumber = document.getElementById("indexPhoneVerificationNumber");
const verificationError = document.getElementById("indexVerificationError");
const verificationCodeValue = document.getElementById("indexVerificationCode");
const verificationInputs = Array.from(
    verificationForm.querySelectorAll(".verification-code-input")
);
const resendButton = document.getElementById("indexResendVerificationCode");

let confirmationResult = null;
let recaptchaVerifier = null;
let isSendingCode = false;
let isConfirmingCode = false;
let isRouting = false;

const setError = (element, message = "") => {
    element.textContent = message;
    element.hidden = !message;
};

const getAuthErrorMessage = (error) => {
    const messages = {
        "auth/captcha-check-failed": "We could not verify this request. Please try again.",
        "auth/code-expired": "That verification code has expired. Request a new code.",
        "auth/invalid-phone-number": "Enter a valid 10-digit phone number.",
        "auth/invalid-verification-code": "That verification code is incorrect. Please try again.",
        "auth/missing-phone-number": "Enter your phone number to continue.",
        "auth/network-request-failed": "Check your internet connection and try again.",
        "auth/quota-exceeded": "SMS verification is temporarily unavailable. Please try again later.",
        "auth/session-expired": "This verification session expired. Request a new code.",
        "auth/too-many-requests": "Too many attempts were made. Please wait and try again."
    };

    return messages[error?.code] ?? "Something went wrong. Please try again.";
};

const setPhoneBusy = (isBusy) => {
    isSendingCode = isBusy;
    phoneSubmit.disabled = isBusy || phoneInput.value.replace(/\D/g, "").length !== 10;
    phoneSubmit.setAttribute("aria-busy", String(isBusy));
};

const setVerificationBusy = (isBusy) => {
    isConfirmingCode = isBusy;
    verificationInputs.forEach((input) => {
        input.disabled = isBusy;
    });
    resendButton.disabled = isBusy || isSendingCode;
    verificationForm.setAttribute("aria-busy", String(isBusy));
};

const resetRecaptchaVerifier = () => {
    recaptchaVerifier?.clear();
    recaptchaVerifier = null;
    document.getElementById("recaptcha-container").replaceChildren();
};

const getRecaptchaVerifier = () => {
    if (recaptchaVerifier) return recaptchaVerifier;

    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        "expired-callback": () => {
            setError(phoneError, "The security check expired. Please try again.");
            resetRecaptchaVerifier();
        }
    });

    return recaptchaVerifier;
};

const routeAuthenticatedUser = async (user) => {
    if (isRouting) return;
    isRouting = true;

    try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));
        const hasCompletedOnboarding = (
            userSnapshot.exists()
            && userSnapshot.data()?.flags?.onboarding === true
        );
        const destination = hasCompletedOnboarding
            ? "/dashboard/index.html"
            : "/onboarding/index.html";

        window.location.replace(destination);
    } catch (error) {
        console.error("Unable to load the user profile.", error);
        isRouting = false;
        setVerificationBusy(false);
        setError(
            verificationForm.hidden ? phoneError : verificationError,
            "We signed you in but could not load your profile. Please try again."
        );
    }
};

const clearVerificationCode = () => {
    verificationInputs.forEach((input) => {
        input.value = "";
    });
    verificationCodeValue.value = "";
};

const showVerificationForm = (phoneDigits) => {
    verificationPhoneNumber.textContent = `(•••) ••• - ••${phoneDigits.slice(-2)}`;
    clearVerificationCode();
    setError(verificationError);
    verificationForm.hidden = false;

    requestAnimationFrame(() => {
        verificationInputs[0].focus();
    });
};

const requestVerificationCode = async (phoneDigits) => {
    if (isSendingCode) return;

    setError(phoneError);
    setError(verificationError);
    setPhoneBusy(true);
    resendButton.disabled = true;

    try {
        resetRecaptchaVerifier();
        confirmationResult = await signInWithPhoneNumber(
            auth,
            `+1${phoneDigits}`,
            getRecaptchaVerifier()
        );
        showVerificationForm(phoneDigits);
    } catch (error) {
        console.error("Unable to send the verification code.", error);
        resetRecaptchaVerifier();
        setError(
            verificationForm.hidden ? phoneError : verificationError,
            getAuthErrorMessage(error)
        );
    } finally {
        setPhoneBusy(false);
        resendButton.disabled = false;
    }
};

phoneForm.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
        phoneInput.reportValidity();
        return;
    }

    requestVerificationCode(phoneDigits);
}, { capture: true });

verificationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const code = verificationInputs.map((input) => input.value).join("");
    verificationCodeValue.value = code;

    if (!/^\d{6}$/.test(code) || !confirmationResult || isConfirmingCode) return;

    setError(verificationError);
    setVerificationBusy(true);

    try {
        const credential = await confirmationResult.confirm(code);
        await routeAuthenticatedUser(credential.user);
    } catch (error) {
        console.error("Unable to verify the SMS code.", error);
        setError(verificationError, getAuthErrorMessage(error));
        clearVerificationCode();
        setVerificationBusy(false);
        verificationInputs[0].focus();
    }
}, { capture: true });

resendButton.addEventListener("click", () => {
    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    if (phoneDigits.length === 10) requestVerificationCode(phoneDigits);
});

onAuthStateChanged(auth, (user) => {
    if (user) routeAuthenticatedUser(user);
});
