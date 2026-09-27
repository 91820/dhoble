import { auth, db } from "../../utils/firebaseConfig.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const onboardingForm = document.getElementById("onboardingFormElement");
const firstNameInput = document.getElementById("onboardingFirstName");
const lastNameInput = document.getElementById("onboardingLastName");
const birthdayInput = document.getElementById("onboardingBirthday");
const firstNameError = document.getElementById("firstNameError");
const lastNameError = document.getElementById("lastNameError");
const birthdayError = document.getElementById("birthdayError");
const onboardingError = document.getElementById("onboardingError");
const submitButton = document.getElementById("onboardingSubmitButton");

let currentUser = null;
let existingProfile = null;
let isSaving = false;

const setError = (element, message = "") => {
    element.textContent = message;
    element.hidden = !message;
};

const validateName = (input, errorElement, label) => {
    const value = input.value.trim();
    const isValid = value.length > 0;

    input.setAttribute("aria-invalid", String(!isValid));
    setError(errorElement, isValid ? "" : `Enter your ${label}.`);

    return isValid ? value : "";
};

const formatBirthday = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const month = digits.slice(0, 2);
    const day = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    return [month, day, year].filter(Boolean).join("/");
};

const getBirthdayValidation = (value, requireComplete = true) => {
    if (!value) {
        return {
            isValid: false,
            message: requireComplete ? "Enter your birthday." : ""
        };
    }

    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
        return {
            isValid: false,
            message: requireComplete ? "Enter your complete birthday as MM/DD/YYYY." : ""
        };
    }

    const [, monthText, dayText, yearText] = match;
    const month = Number(monthText);
    const day = Number(dayText);
    const year = Number(yearText);
    const birthday = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isRealDate = (
        year >= 1900
        && month >= 1
        && month <= 12
        && day >= 1
        && birthday.getFullYear() === year
        && birthday.getMonth() === month - 1
        && birthday.getDate() === day
    );

    if (!isRealDate) {
        return {
            isValid: false,
            message: "Enter a valid birthday using month, day, and year."
        };
    }

    if (birthday > today) {
        return {
            isValid: false,
            message: "Your birthday cannot be in the future."
        };
    }

    return { isValid: true, message: "" };
};

const validateBirthday = (requireComplete = true) => {
    const validation = getBirthdayValidation(birthdayInput.value, requireComplete);
    birthdayInput.setAttribute("aria-invalid", String(!validation.isValid));
    setError(birthdayError, validation.message);

    return validation.isValid ? birthdayInput.value : "";
};

const updateSubmitState = () => {
    const namesAreComplete = (
        firstNameInput.value.trim().length > 0
        && lastNameInput.value.trim().length > 0
    );
    const birthdayIsValid = getBirthdayValidation(birthdayInput.value, false).isValid;

    submitButton.disabled = (
        !currentUser
        || isSaving
        || !namesAreComplete
        || !birthdayIsValid
    );
};

const formatStoredBirthday = (value) => {
    if (typeof value !== "string") return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return isoMatch ? `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}` : "";
};

const getCaretPositionAfterDigits = (value, digitCount) => {
    if (digitCount <= 0) return 0;

    let digitsSeen = 0;
    for (let index = 0; index < value.length; index += 1) {
        if (/\d/.test(value[index])) digitsSeen += 1;
        if (digitsSeen === digitCount) return index + 1;
    }

    return value.length;
};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("/");
        return;
    }

    try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));
        const profile = userSnapshot.exists() ? userSnapshot.data() : null;

        if (profile?.flags?.onboarding === true) {
            window.location.replace("/dashboard/index.html");
            return;
        }

        currentUser = user;
        existingProfile = profile;

        firstNameInput.value = profile?.identity?.firstName ?? "";
        lastNameInput.value = profile?.identity?.lastName ?? "";
        birthdayInput.value = formatStoredBirthday(profile?.identity?.birthday);

        updateSubmitState();
        const firstIncompleteInput = [firstNameInput, lastNameInput, birthdayInput]
            .find((input) => !input.value);
        (firstIncompleteInput ?? firstNameInput).focus();
    } catch (error) {
        console.error("Unable to check the user profile.", error);
        setError(onboardingError, "We could not load your account. Refresh the page to try again.");
    }
});

onboardingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser || isSaving) return;

    const firstName = validateName(firstNameInput, firstNameError, "first name");
    const lastName = validateName(lastNameInput, lastNameError, "last name");
    const birthday = validateBirthday();
    if (!firstName || !lastName || !birthday) {
        updateSubmitState();
        return;
    }

    isSaving = true;
    updateSubmitState();
    submitButton.setAttribute("aria-busy", "true");
    setError(onboardingError);

    try {
        const phoneNumber = (currentUser.phoneNumber ?? "")
            .replace(/\D/g, "")
            .slice(-10);

        const profileData = {
            identity: {
                ...(existingProfile?.identity ?? {}),
                firstName,
                lastName,
                birthday,
                phoneNumber
            },
            flags: {
                ...(existingProfile?.flags ?? {}),
                onboarding: true
            },
            updatedAt: serverTimestamp()
        };

        if (!existingProfile) profileData.createdAt = serverTimestamp();

        await setDoc(
            doc(db, "users", currentUser.uid),
            profileData,
            { merge: true }
        );

        window.location.replace("/dashboard/index.html");
    } catch (error) {
        console.error("Unable to save the user profile.", error);
        setError(onboardingError, "We could not save your profile. Please try again.");
        isSaving = false;
        updateSubmitState();
        submitButton.setAttribute("aria-busy", "false");
    }
});

[firstNameInput, lastNameInput].forEach((input) => {
    input.addEventListener("input", () => {
        input.setAttribute("aria-invalid", "false");
        const errorElement = input === firstNameInput ? firstNameError : lastNameError;
        setError(errorElement);
        updateSubmitState();
    });
});

birthdayInput.addEventListener("beforeinput", (event) => {
    if (
        event.inputType !== "deleteContentBackward"
        || birthdayInput.selectionStart !== birthdayInput.selectionEnd
        || birthdayInput.selectionStart === 0
    ) return;

    const caret = birthdayInput.selectionStart;
    if (birthdayInput.value[caret - 1] !== "/") return;

    event.preventDefault();
    const digits = birthdayInput.value.replace(/\D/g, "").split("");
    const digitIndex = birthdayInput.value
        .slice(0, caret - 1)
        .replace(/\D/g, "")
        .length - 1;

    if (digitIndex >= 0) digits.splice(digitIndex, 1);

    birthdayInput.value = formatBirthday(digits.join(""));
    const newCaret = getCaretPositionAfterDigits(
        birthdayInput.value,
        Math.max(0, digitIndex)
    );
    birthdayInput.setSelectionRange(newCaret, newCaret);
    validateBirthday(false);
    updateSubmitState();
});

birthdayInput.addEventListener("input", () => {
    const caret = birthdayInput.selectionStart ?? birthdayInput.value.length;
    const digitsBeforeCaret = birthdayInput.value
        .slice(0, caret)
        .replace(/\D/g, "")
        .length;

    birthdayInput.value = formatBirthday(birthdayInput.value);
    const newCaret = getCaretPositionAfterDigits(
        birthdayInput.value,
        digitsBeforeCaret
    );
    birthdayInput.setSelectionRange(newCaret, newCaret);

    validateBirthday(false);
    updateSubmitState();
});

birthdayInput.addEventListener("blur", () => {
    validateBirthday();
});
