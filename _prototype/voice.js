// Voice input module using Web Speech API
const VoiceInput = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition;

    function init() {
        return supported;
    }

    function listen() {
        return new Promise((resolve, reject) => {
            if (!supported) return reject(new Error('Speech not supported'));

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                resolve(event.results[0][0].transcript);
            };

            recognition.onerror = (event) => {
                reject(new Error(event.error));
            };

            recognition.onend = () => {
                // If no result was returned, resolve empty
            };

            recognition.start();

            // Auto-stop after 5 seconds of silence
            setTimeout(() => {
                try { recognition.stop(); } catch (e) {}
            }, 7000);
        });
    }

    return { init, listen, supported };
})();
