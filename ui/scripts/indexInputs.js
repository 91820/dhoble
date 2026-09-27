const phoneInput = document.getElementById("indexViewEmailInput");
const phoneForm = phoneInput.closest("form");
const phoneSubmit = phoneForm.querySelector(".submit");
const verificationForm = document.getElementById("indexPhoneVericiationContent");
const verificationCodeValue = document.getElementById("indexVerificationCode");
const verificationInputs = Array.from(
    verificationForm.querySelectorAll(".verification-code-input")
);

const getDigits = (value, maximumLength) => (
    value.replace(/\D/g, "").slice(0, maximumLength)
);

const formatPhoneNumber = (value) => {
    const digits = getDigits(value, 10);
    if (!digits) return "";

    const areaCode = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const lineNumber = digits.slice(6, 10);

    if (digits.length < 3) return `(${areaCode}`;
    if (digits.length === 3) return `(${areaCode})`;
    if (digits.length <= 6) return `(${areaCode}) - ${prefix}`;

    return `(${areaCode}) - ${prefix} - ${lineNumber}`;
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

const syncPhoneState = () => {
    const isValid = getDigits(phoneInput.value, 11).length === 10;
    const isBusy = phoneSubmit.getAttribute("aria-busy") === "true";

    phoneInput.setAttribute(
        "aria-invalid",
        String(phoneInput.value.length > 0 && !isValid)
    );
    phoneSubmit.classList.toggle("disabled", !isValid);
    phoneSubmit.disabled = !isValid || isBusy;
    phoneSubmit.setAttribute("aria-disabled", String(!isValid || isBusy));
};

const applyPhoneFormat = () => {
    const caret = phoneInput.selectionStart ?? phoneInput.value.length;
    const wasAtEnd = caret === phoneInput.value.length;
    const digitsBeforeCaret = phoneInput.value
        .slice(0, caret)
        .replace(/\D/g, "")
        .length;

    phoneInput.value = formatPhoneNumber(phoneInput.value);
    const newCaret = wasAtEnd
        ? phoneInput.value.length
        : getCaretPositionAfterDigits(phoneInput.value, digitsBeforeCaret);
    phoneInput.setSelectionRange(newCaret, newCaret);
    syncPhoneState();
};

phoneInput.addEventListener("beforeinput", (event) => {
    const caret = phoneInput.selectionStart ?? 0;
    const hasSelection = phoneInput.selectionStart !== phoneInput.selectionEnd;

    if (
        event.inputType !== "deleteContentBackward"
        || hasSelection
        || caret === 0
        || /\d/.test(phoneInput.value[caret - 1])
    ) return;

    event.preventDefault();
    const digits = getDigits(phoneInput.value, 10).split("");
    const digitIndex = phoneInput.value
        .slice(0, caret)
        .replace(/\D/g, "")
        .length - 1;

    if (digitIndex >= 0) digits.splice(digitIndex, 1);

    phoneInput.value = formatPhoneNumber(digits.join(""));
    const newCaret = getCaretPositionAfterDigits(
        phoneInput.value,
        Math.max(0, digitIndex)
    );
    phoneInput.setSelectionRange(newCaret, newCaret);
    syncPhoneState();
});

phoneInput.addEventListener("input", applyPhoneFormat);
phoneInput.addEventListener("change", applyPhoneFormat);

phoneForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (getDigits(phoneInput.value, 11).length !== 10) {
        phoneInput.setCustomValidity("Enter a complete 10-digit phone number.");
        phoneInput.reportValidity();
        phoneInput.setCustomValidity("");
    }
});

const syncVerificationCode = () => {
    const code = verificationInputs.map((input) => input.value).join("");
    verificationCodeValue.value = code;
    return code;
};

const submitCompletedVerificationCode = () => {
    if (/^\d{6}$/.test(syncVerificationCode())) {
        verificationForm.requestSubmit();
    }
};

verificationInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
        input.value = getDigits(input.value, 1);
        syncVerificationCode();

        if (input.value && index < verificationInputs.length - 1) {
            verificationInputs[index + 1].focus();
            verificationInputs[index + 1].select();
            return;
        }

        if (index === verificationInputs.length - 1) {
            submitCompletedVerificationCode();
        }
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value && index > 0) {
            event.preventDefault();
            verificationInputs[index - 1].value = "";
            verificationInputs[index - 1].focus();
            syncVerificationCode();
        }

        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            verificationInputs[index - 1].focus();
        }

        if (event.key === "ArrowRight" && index < verificationInputs.length - 1) {
            event.preventDefault();
            verificationInputs[index + 1].focus();
        }
    });

    input.addEventListener("paste", (event) => {
        const pastedDigits = getDigits(
            event.clipboardData?.getData("text") ?? "",
            verificationInputs.length - index
        );
        if (!pastedDigits) return;

        event.preventDefault();
        pastedDigits.split("").forEach((digit, offset) => {
            verificationInputs[index + offset].value = digit;
        });

        const nextIndex = Math.min(
            index + pastedDigits.length,
            verificationInputs.length - 1
        );
        verificationInputs[nextIndex].focus();
        syncVerificationCode();
        submitCompletedVerificationCode();
    });
});

verificationForm.addEventListener("submit", (event) => {
    event.preventDefault();
});

applyPhoneFormat();
syncVerificationCode();

window.addEventListener("pageshow", () => {
    applyPhoneFormat();
});
