import { HtmlUtils } from "./HtmlUtils.js";
import { HelgeUtils } from "./HelgeUtils.js";
var elementWithId = HtmlUtils.elementWithId;
var TextAreas = HtmlUtils.TextAreas;
var buttonWithId = HtmlUtils.buttonWithId;
var Cookies = HtmlUtils.Cookies;
var Audio = HelgeUtils.Audio;
// ############## Config ##############
const APPEND_EDITOR_TO_PROMPT = true;
// ############## AfterInit ##############
var AfterInit;
(function (AfterInit) {
    var inputElementWithId = HtmlUtils.inputElementWithId;
    const downloadLink = document.getElementById('downloadLink');
    const recordSpinner = document.getElementById('recordSpinner');
    const apiSelector = document.getElementById('apiSelector');
    const apiKeyInput = document.getElementById('apiKeyInputField');
    const editorTextarea = document.getElementById('editorTextarea');
    const transcriptionPrompt = document.getElementById('transcriptionPrompt');
    const replaceRulesTextArea = document.getElementById('replaceRulesTextArea');
    const saveEditor = () => Cookies.set("editorText", HtmlUtils.textAreaWithId("editorTextarea").value);
    TextAreas.setAutoSave('replaceRules', 'replaceRulesTextArea');
    TextAreas.setAutoSave('editorText', 'editorTextarea');
    TextAreas.setAutoSave('prompt', 'transcriptionPrompt');
    const insertAtCursor = (text) => {
        TextAreas.insertTextAtCursor(editorTextarea, text);
    };
    function getApiSelectedInUi() {
        return apiSelector.value;
    }
    // ############## addButtonEventListeners ##############
    AfterInit.addButtonEventListeners = () => {
        { // Media buttons
            let mediaRecorder;
            let audioChunks = [];
            let audioBlob;
            let isRecording = false;
            let stream;
            let sending = false;
            const transcribeAndHandleResultAsync = async (audioBlob) => {
                sending = true;
                updateStateIndicator();
                const apiName = getApiSelectedInUi();
                if (!apiName) {
                    insertAtCursor("You must select an API below.");
                    return;
                }
                const promptForWhisper = () => transcriptionPrompt.value + APPEND_EDITOR_TO_PROMPT ? editorTextarea.value : "";
                const result = async () => await Audio.transcribe(apiName, audioBlob, getApiKey(), promptForWhisper());
                const replacedOutput = HelgeUtils.replaceByRules(await result(), replaceRulesTextArea.value);
                if (editorTextarea.value.length > 0)
                    insertAtCursor(" ");
                insertAtCursor(replacedOutput);
                navigator.clipboard.writeText(editorTextarea.value).then();
                sending = false;
                updateStateIndicator();
            };
            const mediaRecorderStoppedCallback = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                { // Download button
                    downloadLink.href = URL.createObjectURL(audioBlob);
                    downloadLink.download = 'recording.wav';
                    downloadLink.style.display = 'block';
                }
                transcribeAndHandleResultAsync(audioBlob).then(hideSpinner);
            };
            const onStreamReady = (streamParam) => {
                stream = streamParam;
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.start();
                isRecording = true;
                updateStateIndicator();
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
            };
            const updateStateIndicator = () => {
                const setRecordingIndicator = () => {
                    const message = sending ? '🔴Sending' : '🔴Stop';
                    elementWithId("recordButton").innerHTML = `<span class="blinking">${message}</span>`;
                    buttonWithId("pauseButton").textContent = '‖ Pause';
                };
                const setPausedIndicator = () => {
                    elementWithId("recordButton").innerHTML = '‖ Paused';
                    buttonWithId("pauseButton").textContent = '⬤ Record';
                };
                const setStoppedIndicator = () => {
                    elementWithId("recordButton").innerHTML = '◼ Stopped';
                    buttonWithId("pauseButton").textContent = '⬤ Record';
                };
                if (mediaRecorder?.state === 'recording') {
                    setRecordingIndicator();
                }
                else if (mediaRecorder?.state === 'paused') {
                    setPausedIndicator();
                }
                else {
                    setStoppedIndicator();
                }
            };
            const startRecording = () => {
                navigator.mediaDevices.getUserMedia({ audio: true }).then(onStreamReady);
            };
            const stopRecording = () => {
                mediaRecorder.onstop = mediaRecorderStoppedCallback;
                mediaRecorder.stop();
                updateStateIndicator();
                isRecording = false;
                HtmlUtils.Media.releaseMicrophone(stream);
            };
            // ############## recordButton ##############
            buttonWithId("recordButton").addEventListener('click', () => {
                if (isRecording) {
                    stopRecording();
                }
                else {
                    showSpinner();
                    startRecording();
                }
            });
            // ############## sendButton ##############
            buttonWithId("sendButton").addEventListener('click', () => {
                if (mediaRecorder?.state === 'recording') {
                    mediaRecorder.onstop = () => {
                        audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        audioChunks = [];
                        transcribeAndHandleResultAsync(audioBlob).then(hideSpinner);
                        startRecording();
                    };
                    mediaRecorder.stop();
                }
                else {
                    buttonWithId("recordButton").click();
                }
            });
            // ############## pauseButton ##############
            buttonWithId("pauseButton").addEventListener('click', () => {
                if (mediaRecorder?.state === 'recording') {
                    mediaRecorder.pause();
                    updateStateIndicator();
                }
                else if (mediaRecorder?.state === 'paused') {
                    mediaRecorder.resume();
                    updateStateIndicator();
                }
                else {
                    buttonWithId("recordButton").click();
                }
            });
            // ############## transcribeAgainButton ##############
            HtmlUtils.addButtonClickListener(buttonWithId("transcribeAgainButton"), () => {
                showSpinner();
                transcribeAndHandleResultAsync(audioBlob).then(hideSpinner);
            });
        } // End of media buttons
        // ############## Crop Highlights Button ##############
        HtmlUtils.addButtonClickListener(buttonWithId("cropHighlightsButton"), () => {
            editorTextarea.value = HelgeUtils.extractHighlights(editorTextarea.value).join(' ');
            saveEditor();
        });
        // ############## saveAPIKeyButton ##############
        HtmlUtils.addButtonClickListener(buttonWithId("saveAPIKeyButton"), () => {
            setApiKeyCookie(apiKeyInput.value);
            apiKeyInput.value = '';
        });
        // clearButton
        HtmlUtils.addButtonClickListener(buttonWithId("clearButton"), () => {
            editorTextarea.value = '';
            saveEditor();
        });
        // replaceAgainButton
        HtmlUtils.addButtonClickListener(buttonWithId("replaceAgainButton"), () => {
            editorTextarea.value = HelgeUtils.replaceByRules(editorTextarea.value, replaceRulesTextArea.value);
        });
        // saveEditorButton
        HtmlUtils.addButtonClickListener(buttonWithId("saveEditorButton"), () => {
            Cookies.set("editorText", editorTextarea.value);
        });
        // savePromptButton
        HtmlUtils.addButtonClickListener(buttonWithId("savePromptButton"), () => {
            Cookies.set("prompt", transcriptionPrompt.value);
        });
        // saveRulesButton
        HtmlUtils.addButtonClickListener(buttonWithId("saveRulesButton"), () => {
            Cookies.set("replaceRules", replaceRulesTextArea.value);
        });
        function addUndoButtonEventListener(undoButtonId, textArea) {
            HtmlUtils.addButtonClickListener(buttonWithId(undoButtonId), () => {
                textArea.focus();
                document.execCommand('undo'); // Yes, deprecated, but works. I will replace it when it fails. Docs: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
            });
        }
        // undoButtonOfEditor
        addUndoButtonEventListener("undoButtonOfEditor", editorTextarea);
        addUndoButtonEventListener("undoButtonOfReplaceRules", replaceRulesTextArea);
        addUndoButtonEventListener("undoButtonOfPrompt", transcriptionPrompt);
        // addReplaceRuleButton
        HtmlUtils.addButtonClickListener(buttonWithId("addReplaceRuleButton"), () => {
            // add TextArea.selectedText() to the start of the replaceRulesTextArea
            TextAreas.setCursor(replaceRulesTextArea, 0);
            const selectedText = TextAreas.selectedText(editorTextarea);
            TextAreas.insertTextAtCursor(replaceRulesTextArea, `"${selectedText}"->""\n`);
            TextAreas.setCursor(replaceRulesTextArea, 5 + selectedText.length);
            replaceRulesTextArea.focus();
        });
        // aboutButton
        HtmlUtils.addButtonClickListener(buttonWithId("abortButton"), () => {
            window.location.reload();
        });
        // copyButton
        /** Adds an event listener to a button that copies the text of an input element to the clipboard. */
        function addEventListenerForCopyButton(buttonId, inputElementId) {
            buttonWithId(buttonId).addEventListener('click', () => {
                navigator.clipboard.writeText(inputElementWithId(inputElementId).value).then(() => {
                    buttonWithId(buttonId).textContent = '⎘ Copied!';
                    setTimeout(() => {
                        buttonWithId(buttonId).textContent = '⎘ Copy';
                    }, 2000);
                });
            });
        }
        // copyButtons
        addEventListenerForCopyButton("copyButton", "editorTextarea");
        addEventListenerForCopyButton("copyReplaceRulesButton", "replaceRulesTextArea");
        addEventListenerForCopyButton("copyPromptButton", "transcriptionPrompt");
        buttonWithId("saveAPIKeyButton").addEventListener('click', function () {
            inputElementWithId('apiKey').value = ''; // Clear the input field
        });
        apiSelector.addEventListener('change', () => {
            Cookies.set('apiSelector', apiSelector.value);
        });
        const showSpinner = () => {
            // probably not needed anymore, delete later
            // recordSpinner.style.display = 'block';
        };
        // probably not needed anymore, delete later
        const hideSpinner = () => {
            recordSpinner.style.display = 'none';
        };
    };
    const getApiKey = () => Cookies.get(apiSelector.value + 'ApiKey');
    const setApiKeyCookie = (apiKey) => {
        Cookies.set(apiSelector.value + 'ApiKey', apiKey);
    };
    AfterInit.loadFormData = () => {
        editorTextarea.value = Cookies.get("editorText");
        transcriptionPrompt.value = Cookies.get("prompt");
        replaceRulesTextArea.value = Cookies.get("replaceRules");
        apiSelector.value = Cookies.get("apiSelector") ?? 'OpenAI';
    };
    AfterInit.registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        }
    };
})(AfterInit || (AfterInit = {}));
const init = () => {
    AfterInit.addButtonEventListeners();
    AfterInit.registerServiceWorker();
    AfterInit.loadFormData();
};
init();
//# sourceMappingURL=script.js.map