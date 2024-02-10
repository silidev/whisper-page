/*
 * Copyright (c) 2024 by Helge Tobias Kosuch
 */
var textAreaWithId = HtmlUtils.NeverNull.textAreaWithId;
var TextAreas = HtmlUtils.TextAreas;
var blinkFast = HtmlUtils.blinkFast;
var blinkSlow = HtmlUtils.blinkSlow;
var escapeRegExp = HelgeUtils.Strings.escapeRegExp;
var elementWithId = HtmlUtils.NeverNull.elementWithId;
var TextAreaWrapper = HtmlUtils.TextAreas.TextAreaWrapper;
import { sendCtrlZ } from "./DontInspect.js";
import { HelgeUtils } from "./HelgeUtils.js";
import { INSERT_EDITOR_INTO_PROMPT, NEW_NOTE_DELIMITER, VERSION, WHERE_TO_INSERT_AT } from "./config.js";
import { createCutFunction } from "./CutButton.js";
import { HtmlUtils } from "./HtmlUtils.js";
var LocalStorage = HtmlUtils.BrowserStorage.LocalStorage;
var Cookies = HtmlUtils.BrowserStorage.Cookies;
var BrowserStorage = HtmlUtils.BrowserStorage;
/** Inlined from HelgeUtils.Test.runTestsOnlyToday */
const RUN_TESTS = HtmlUtils.isMsWindows() && new Date().toISOString().slice(0, 10) === "2024-01-27";
if (RUN_TESTS)
    console.log("RUN_TESTS is true. This is only for " +
        "testing. Set it to false in production.");
HtmlUtils.ErrorHandling.ExceptionHandlers.installGlobalDefault();
var OnlyDefinitions;
(function (OnlyDefinitions) {
    OnlyDefinitions.applyReplaceRulesToMainEditor = () => {
        const selectionStart = mainEditorTextarea.selectionStart;
        const selectionEnd = mainEditorTextarea.selectionEnd;
        mainEditorTextarea.value = ReplaceByRules.withUiLog(replaceRulesTextArea.value, mainEditorTextarea.value);
        mainEditorTextarea.selectionStart = selectionStart;
        mainEditorTextarea.selectionEnd = selectionEnd;
    };
    OnlyDefinitions.addMenuItem = HtmlUtils.Menus.WcMenu.addMenuItem("editorMenuHeading");
    OnlyDefinitions.addKeyboardShortcuts = () => {
        const cutFromMainEditor = createCutFunction(mainEditorTextarea, "{{c1::", "}}");
        document.addEventListener('keyup', (event) => {
            // console.log(event.key,event.shiftKey,event.ctrlKey,event.altKey);
            if (event.key === 'X' && event.shiftKey && event.ctrlKey) {
                // Prevent default action to avoid any browser shortcut conflicts
                event.preventDefault();
                cutFromMainEditor();
            }
        });
    };
})(OnlyDefinitions || (OnlyDefinitions = {}));
const trimMainEditor = () => mainEditor.trim().append(" ");
export var UiFunctions;
(function (UiFunctions) {
    var buttonWithId = HtmlUtils.NeverNull.buttonWithId;
    let Buttons;
    (function (Buttons) {
        var insertTextAtCursor = HtmlUtils.TextAreas.insertTextAndPutCursorAfter;
        var copyToClipboard = HtmlUtils.copyToClipboard;
        var textAreaWithId = HtmlUtils.NeverNull.textAreaWithId;
        var buttonWithId = HtmlUtils.NeverNull.buttonWithId;
        var inputElementWithId = HtmlUtils.NeverNull.inputElementWithId;
        var addMenuItem = OnlyDefinitions.addMenuItem;
        var Cookies = HtmlUtils.BrowserStorage.Cookies;
        var addKeyboardShortcuts = OnlyDefinitions.addKeyboardShortcuts;
        let Media;
        (function (Media) {
            var buttonWithId = HtmlUtils.NeverNull.buttonWithId;
            var DelimiterSearch = HelgeUtils.Strings.DelimiterSearch;
            var applyReplaceRulesToMainEditor = OnlyDefinitions.applyReplaceRulesToMainEditor;
            var addMenuItem = OnlyDefinitions.addMenuItem;
            var suppressUnusedWarning = HelgeUtils.suppressUnusedWarning;
            let mediaRecorder;
            let audioChunks = [];
            let audioBlob;
            let isRecording = false;
            suppressUnusedWarning(isRecording);
            let stream;
            let sending = false;
            let StateIndicator;
            (function (StateIndicator) {
                var buttonWithId = HtmlUtils.NeverNull.buttonWithId;
                /** Updates the recorder state display. That consists of the text
                 * and color of the stop button and the pause record button. */
                StateIndicator.update = () => {
                    if (mediaRecorder?.state === 'recording') {
                        setRecording();
                    }
                    else if (mediaRecorder?.state === 'paused') {
                        StateIndicator.setPaused();
                    }
                    else {
                        StateIndicator.setStopped();
                    }
                };
                const setRecording = () => {
                    setHtmlOfButtonStop('◼<br>Stop');
                    setHtmlOfButtonPauseRecord(blinkFast('🔴 Recording') + '<br>|| Pause');
                };
                StateIndicator.setPaused = () => {
                    setHtmlOfButtonStop('◼<br>Stop');
                    setHtmlOfButtonPauseRecord(blinkSlow('|| Paused') + '<br>⬤▶ Cont. Rec');
                };
                StateIndicator.setStopped = () => {
                    setHtmlOfButtonStop('◼<br>Stop');
                    setHtmlOfButtonPauseRecord(sending
                        ? blinkFast('✎ Scribing') + '<br>⬤ Record'
                        : '<br>⬤ Record');
                };
                const setHtmlOfButtonStop = (html) => {
                    buttonWithId("stopButton").innerHTML = html;
                };
                const setHtmlOfButtonPauseRecord = (html) => {
                    buttonWithId("pauseRecordButton").innerHTML = html;
                };
            })(StateIndicator = Media.StateIndicator || (Media.StateIndicator = {}));
            const transcribeAndHandleResult = async (audioBlob, whereToPutTranscription) => {
                try {
                    const calcMaxEditorPrompt = (textArea) => {
                        const text = textArea.value;
                        /* maxLeftIndex.
                         * Searching for the Delimiter. It is ")))---(((" at this time.
                         * "max" because this might be shortened later on. */
                        const maxLeftIndex = (() => {
                            return WHERE_TO_INSERT_AT === "appendAtEnd"
                                ? text.length
                                : textArea.selectionStart; /* Only the start is relevant
                            b/c the selection will be overwritten by the new text. */
                        })();
                        const indexAfterPreviousDelimiter = (() => {
                            return new DelimiterSearch(NEW_NOTE_DELIMITER).leftIndex(text, maxLeftIndex);
                        })();
                        return text.substring(indexAfterPreviousDelimiter, maxLeftIndex);
                    };
                    const removeLastDot = (text) => {
                        if (text.endsWith('.')) {
                            return text.slice(0, -1) + " ";
                        }
                        return text;
                    };
                    const aSpaceIfNeeded = () => {
                        return mainEditorTextarea.selectionStart > 0
                            && !mainEditorTextarea.value.charAt(mainEditorTextarea.selectionStart - 1).match(/\s/)
                            ? " " : "";
                    };
                    const promptForWhisper = () => {
                        const MAX_TOTAL_CHARS = 500; /* Taking the last 500
                         CHARS is for sure less than the max 250 TOKENS whisper is
                         considering. This is important because the last words of
                         the last transcription should always be included to avoid
                         hallucinations if it otherwise would be an incomplete
                         sentence. */
                        const maxCharsFromEditor = MAX_TOTAL_CHARS
                            - transcriptionPromptEditor.value.length;
                        const maxEditorPrompt = calcMaxEditorPrompt(mainEditorTextarea);
                        return transcriptionPromptEditor.value +
                            (INSERT_EDITOR_INTO_PROMPT
                                ? maxEditorPrompt.slice(-maxCharsFromEditor)
                                : "");
                    };
                    const getTranscriptionText = async () => await HelgeUtils.Transcription.transcribe(apiName, audioBlob, getApiKey(), promptForWhisper());
                    const removeLastDotIfNotAtEnd = (input) => {
                        if (mainEditorTextarea.selectionStart < mainEditorTextarea.value.length) {
                            return removeLastDot(input);
                        }
                        return input;
                    };
                    sending = true;
                    StateIndicator.update();
                    const apiName = getApiSelectedInUi();
                    if (!apiName) {
                        insertTextAndPutCursorAfter("You must select an API below.");
                        return;
                    }
                    const transcriptionText = await getTranscriptionText();
                    if (whereToPutTranscription == "insertAtCursor") {
                        insertTextAndPutCursorAfter(aSpaceIfNeeded()
                            + removeLastDotIfNotAtEnd(transcriptionText));
                    }
                    else {
                        trimMainEditor().appendTextAndPutCursorAfter(transcriptionText);
                    }
                    applyReplaceRulesToMainEditor();
                    trimMainEditor().focus();
                    saveMainEditor();
                    navigator.clipboard.writeText(mainEditorTextarea.value).then();
                    sending = false;
                    StateIndicator.update();
                }
                catch (error) {
                    if (error instanceof HelgeUtils.Transcription.TranscriptionError) {
                        Log.error(JSON.stringify(error.payload, null, 2));
                    }
                    else
                        throw error;
                }
            };
            let StopCallbackCreator;
            (function (StopCallbackCreator) {
                StopCallbackCreator.createCancelingCallback = () => createInternal(true);
                StopCallbackCreator.transcribingCallback = () => createInternal(false);
                const createInternal = (cancel) => {
                    return () => {
                        HtmlUtils.Media.releaseMicrophone(stream);
                        isRecording = false;
                        StateIndicator.update();
                        audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        if (cancel) {
                            StateIndicator.setStopped();
                            return;
                        }
                        audioChunks = [];
                        { // Download button
                            downloadLink.href = URL.createObjectURL(audioBlob);
                            downloadLink.download = 'recording.wav';
                            downloadLink.style.display = 'block';
                        }
                        transcribeAndHandleResult(audioBlob, WHERE_TO_INSERT_AT)
                            .then(NotVisibleAtThisTime.hideSpinner);
                    };
                };
            })(StopCallbackCreator = Media.StopCallbackCreator || (Media.StopCallbackCreator = {}));
            const getOnStreamReady = (beginPaused) => {
                return (streamParam) => {
                    stream = streamParam;
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    mediaRecorder.start();
                    isRecording = true;
                    StateIndicator.update();
                    mediaRecorder.ondataavailable = event => {
                        audioChunks.push(event.data);
                    };
                    if (beginPaused)
                        mediaRecorder.pause();
                    StateIndicator.update();
                };
            };
            const startRecording = (beginPaused = false) => {
                navigator.mediaDevices.getUserMedia({ audio: true }).then(getOnStreamReady(beginPaused));
            };
            // ############## stopButton ##############
            const stopRecording = () => {
                mediaRecorder.onstop = StopCallbackCreator.transcribingCallback();
                mediaRecorder.stop();
            };
            const stopButton = () => {
                stopRecording();
                /** delete, previous behavior
                if (isRecording) {
                  stopRecording();
                } else {
                  NotVisibleAtThisTime.showSpinner();
                  startRecording();
                }
                */
            };
            buttonWithId("stopButton").addEventListener('click', stopButton);
            // ############## cancelRecording ##############
            Media.cancelRecording = () => {
                if (!mediaRecorder)
                    return;
                mediaRecorder.onstop = StopCallbackCreator.createCancelingCallback();
                mediaRecorder.stop();
            };
            // ############## stop_transcribe_startNewRecording_and_pause ##############
            const stop_transcribe_startNewRecording_and_pause = () => {
                mediaRecorder.onstop = () => {
                    audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioChunks = [];
                    sending = true;
                    transcribeAndHandleResult(audioBlob, WHERE_TO_INSERT_AT).then(NotVisibleAtThisTime.hideSpinner);
                    startRecording(true);
                };
                mediaRecorder.stop();
            };
            // ############## pauseRecordButton ##############
            const pauseRecordButton = () => {
                if (mediaRecorder?.state === 'recording') {
                    mediaRecorder.pause();
                    StateIndicator.update();
                }
                else if (mediaRecorder?.state === 'paused') {
                    mediaRecorder.resume();
                    StateIndicator.update();
                }
                else {
                    NotVisibleAtThisTime.showSpinner();
                    startRecording();
                }
            };
            const transcribeButton = () => {
                if (mediaRecorder?.state === 'recording'
                    || (mediaRecorder?.state === 'paused'
                        && audioChunks.length > 0)) {
                    stop_transcribe_startNewRecording_and_pause();
                    return;
                }
                pauseRecordButton();
            };
            // ############## transcribeButton ##############
            buttonWithId("transcribeButton").addEventListener('click', transcribeButton);
            buttonWithId("pauseRecordButton").addEventListener('click', pauseRecordButton);
            // ############## transcribeAgainButton ##############
            const transcribeAgainButton = () => {
                NotVisibleAtThisTime.showSpinner();
                transcribeAndHandleResult(audioBlob, WHERE_TO_INSERT_AT).then(NotVisibleAtThisTime.hideSpinner);
            };
            addMenuItem("transcribeAgainButton", transcribeAgainButton);
            StateIndicator.update();
        })(Media = Buttons.Media || (Buttons.Media = {})); // End of media buttons
        Buttons.addEventListeners = () => {
            addKeyboardShortcuts();
            // ############## Toggle Log Button ##############
            addMenuItem("toggleLogButton", Log.toggleLog(textAreaWithId));
            // ############## Crop Highlights Menu Item ##############
            const cropHighlights = () => {
                mainEditorTextarea.value = HelgeUtils.extractHighlights(mainEditorTextarea.value).join(' ');
                saveMainEditor();
            };
            addMenuItem("cropHighlightsMenuItem", cropHighlights);
            // ############## Copy Backup to clipboard Menu Item ##############
            const copyBackupToClipboard = () => {
                navigator.clipboard.writeText("## Replace Rules\n" + replaceRulesTextArea.value + "\n"
                    + "## Prompt\n" + transcriptionPromptEditor.value).then();
            };
            addMenuItem("copyBackupMenuItem", copyBackupToClipboard);
            // ############## Focus the main editor textarea Menu Item ##############
            addMenuItem("focusMainEditorMenuItem", mainEditorTextarea.focus);
            // ############## Du2Ich Menu Item ##############
            const du2ichMenuItem = () => {
                copyToClipboard(mainEditorTextarea.value).then(() => {
                    mainEditorTextarea.value = HelgeUtils.Misc.du2ich(mainEditorTextarea.value, ReplaceByRules.onlyWholeWordsPreserveCaseWithUiLog);
                    saveMainEditor();
                });
            };
            addMenuItem("du2ichMenuItem", du2ichMenuItem);
            // ############## saveAPIKeyButton ##############
            function saveAPIKeyButton() {
                setApiKeyCookie(apiKeyInput.value);
                apiKeyInput.value = '';
            }
            HtmlUtils.addClickListener(buttonWithId("saveAPIKeyButton"), () => {
                saveAPIKeyButton();
            });
            function clearButton() {
                mainEditorTextarea.value = '';
                saveMainEditor();
            }
            // clearButton
            HtmlUtils.addClickListener(buttonWithId("clearButton"), () => {
                clearButton();
            });
            const replaceAgainButton = () => {
                OnlyDefinitions.applyReplaceRulesToMainEditor();
                mainEditorTextarea.focus();
                // window.scrollBy(0,-100000);
            };
            // replaceAgainButton
            HtmlUtils.addClickListener(buttonWithId("replaceAgainButton"), () => {
                replaceAgainButton();
            });
            // ############## backslashButton ##############
            HtmlUtils.addClickListener(buttonWithId("backslashButton"), () => {
                insertTextAtCursor(replaceRulesTextArea, "\\");
            });
            // ############## ctrlZButtons ##############
            const addCtrlZButtonEventListener = (ctrlZButtonId, textArea) => {
                HtmlUtils.addClickListener(buttonWithId(ctrlZButtonId), () => {
                    textArea.focus();
                    sendCtrlZ();
                });
            };
            addCtrlZButtonEventListener("ctrlZButtonOfReplaceRules", replaceRulesTextArea);
            addCtrlZButtonEventListener("ctrlZButtonOfPrompt", transcriptionPromptEditor);
            HtmlUtils.addClickListener(buttonWithId("addReplaceRuleButton"), addReplaceRule);
            HtmlUtils.addClickListener(buttonWithId("addWordReplaceRuleButton"), Buttons.addWordReplaceRule);
            HtmlUtils.addClickListener(buttonWithId("insertNewNoteDelimiterButton"), () => insertTextIntoMainEditor('\n' + NEW_NOTE_DELIMITER));
            // cancelRecording
            addMenuItem("cancelRecording", Buttons.Media.cancelRecording);
            // cutAllButton
            {
                const cutAllButton = buttonWithId("cutAllButton");
                HtmlUtils.addClickListener(cutAllButton, () => {
                    navigator.clipboard.writeText(mainEditorTextarea.value).then(() => {
                        mainEditorTextarea.value = '';
                        saveMainEditor();
                    });
                });
            }
            // aboutButton
            HtmlUtils.addClickListener(buttonWithId("pasteButton"), () => {
                navigator.clipboard.readText().then(text => {
                    insertTextAndPutCursorAfter(text);
                });
            });
            // cutButton
            buttonWithId("cutButton").addEventListener('click', createCutFunction(mainEditorTextarea));
            // cutAnkiButton
            buttonWithId("cutAnkiButton").addEventListener('click', createCutFunction(mainEditorTextarea, "{{c1::", "}}"));
            // copyButtons
            /** Adds an event listener to a button that copies the text of an input element to the clipboard. */
            const addEventListenerForCopyButton = (buttonId, inputElementId) => {
                buttonWithId(buttonId).addEventListener('click', () => {
                    navigator.clipboard.writeText(inputElementWithId(inputElementId).value).then(() => {
                        buttonWithId(buttonId).innerHTML = '⎘<br>Copied!';
                        setTimeout(() => {
                            buttonWithId(buttonId).innerHTML = '⎘<br>Copy';
                        }, 500);
                    });
                });
            };
            // copyButtons
            addEventListenerForCopyButton("copyReplaceRulesButton", "replaceRulesTextArea");
            addEventListenerForCopyButton("copyPromptButton", "transcriptionPromptEditor");
            buttonWithId("saveAPIKeyButton").addEventListener('click', function () {
                inputElementWithId('apiKeyInputField').value = ''; // Clear the input field
            });
            apiSelector.addEventListener('change', () => {
                Cookies.set('apiSelector', apiSelector.value);
            });
        };
        const insertTextIntoMainEditor = (insertedString) => {
            TextAreas.insertTextAndPutCursorAfter(mainEditorTextarea, insertedString);
            saveMainEditor();
        };
        // addReplaceRuleButton
        const addReplaceRule = (wordsOnly = false) => {
            // add TextArea.selectedText() to the start of the replaceRulesTextArea
            TextAreas.setCursor(replaceRulesTextArea, 0);
            const selectedText = TextAreas.selectedText(mainEditorTextarea);
            const maybeWordBoundary = wordsOnly ? "\\b" : "";
            const insertedString = `"${maybeWordBoundary + escapeRegExp(selectedText)
                + maybeWordBoundary}"gm->"${selectedText}"\n`;
            const lengthBefore = replaceRulesTextArea.value.length;
            const APPEND = true;
            if (APPEND) {
                TextAreas.appendTextAndPutCursorAfter(replaceRulesTextArea, insertedString);
                replaceRulesTextArea.selectionStart = lengthBefore;
                replaceRulesTextArea.selectionEnd = replaceRulesTextArea.value.length;
                TextAreas.scrollToEnd(replaceRulesTextArea);
            }
            else {
                TextAreas.insertTextAndPutCursorAfter(replaceRulesTextArea, insertedString);
                replaceRulesTextArea.selectionStart = 0;
                replaceRulesTextArea.selectionEnd = insertedString.length;
            }
            replaceRulesTextArea.focus(); // delete: Taken out b/c this jumps way too
            // much down on mobile.
            saveReplaceRules();
        };
        Buttons.addWordReplaceRule = () => {
            addReplaceRule(true);
        };
    })(Buttons = UiFunctions.Buttons || (UiFunctions.Buttons = {})); // End of Buttons namespace
    const replaceRulesTest = () => {
        // noinspection SpellCheckingInspection
        const magicText = (numberToMakeItUnique) => {
            return `Das hier ist ein ziemlich langer ganz normaler Text, an dem die Rules nichts verändern sollten! Dadurch fail'en auch Rules. und das ist auch gut so.`
                + numberToMakeItUnique;
        };
        const createTestRule = (numberToMakeItUnique) => `\n\n"${escapeRegExp(magicText(numberToMakeItUnique))}"gm->""\n\n`;
        const testRules = createTestRule(1)
            + replaceRulesTextArea.value
            + createTestRule(2);
        const replaceResult = ReplaceByRules.withUiLog(testRules, magicText(1) + magicText(2));
        buttonWithId("testFailIndicatorOfReplaceRules").style.display =
            replaceResult === ''
                ? "none" : "block";
    };
    UiFunctions.replaceRulesTextAreaOnInput = () => replaceRulesTest;
})(UiFunctions || (UiFunctions = {}));
const downloadLink = document.getElementById('downloadLink');
const spinner1 = document.getElementById('spinner1');
const apiSelector = document.getElementById('apiSelector');
const apiKeyInput = document.getElementById('apiKeyInputField');
const mainEditorTextarea = document.getElementById('mainEditorTextarea');
const mainEditor = new TextAreaWrapper(mainEditorTextarea);
const transcriptionPromptEditor = document.getElementById('transcriptionPromptEditor');
const replaceRulesTextArea = document.getElementById('replaceRulesTextArea');
export const saveMainEditor = () => LocalStorage.set("editorText", textAreaWithId("mainEditorTextarea").value);
const saveReplaceRules = () => {
    LocalStorage.set("replaceRules", textAreaWithId("replaceRulesTextArea").value);
};
textAreaWithId('replaceRulesTextArea').addEventListener('input', UiFunctions
    .replaceRulesTextAreaOnInput);
{ // Autosaves
    const handleAutoSaveError = (msg) => {
        Log.error(msg);
    };
    TextAreas.setAutoSave('replaceRules', 'replaceRulesTextArea', handleAutoSaveError, BrowserStorage.LocalStorage);
    TextAreas.setAutoSave('editorText', 'mainEditorTextarea', handleAutoSaveError, BrowserStorage.LocalStorage);
    TextAreas.setAutoSave('prompt', 'transcriptionPromptEditor', handleAutoSaveError, BrowserStorage.LocalStorage);
}
const insertTextAndPutCursorAfter = (text) => {
    TextAreas.insertTextAndPutCursorAfter(mainEditorTextarea, text);
};
const getApiSelectedInUi = () => apiSelector.value;
var NotVisibleAtThisTime;
(function (NotVisibleAtThisTime) {
    NotVisibleAtThisTime.showSpinner = () => {
        // probably not needed anymore, delete later
        // spinner1.style.display = 'block';
    };
    // probably not needed anymore, delete later
    NotVisibleAtThisTime.hideSpinner = () => {
        spinner1.style.display = 'none';
    };
})(NotVisibleAtThisTime || (NotVisibleAtThisTime = {}));
var Log;
(function (Log) {
    var inputElementWithId = HtmlUtils.NeverNull.inputElementWithId;
    const MAX_LOG_LEN = 1000;
    // noinspection JSUnusedGlobalSymbols
    Log.turnOnLogging = () => {
        inputElementWithId("logReplaceRulesCheckbox").checked = true;
    };
    function logEvenIfNotEnabled(message) {
        const logTextArea = textAreaWithId("logTextArea");
        const oldLog = logTextArea.value;
        logTextArea.value = (oldLog + "\n" + message).slice(-MAX_LOG_LEN).trim();
        TextAreas.scrollToEnd(logTextArea);
    }
    Log.writeIfLoggingEnabled = (message) => {
        if (!inputElementWithId("logReplaceRulesCheckbox").checked)
            return;
        logEvenIfNotEnabled(message);
    };
    Log.error = (message) => {
        logEvenIfNotEnabled(message);
        Log.showLog();
    };
    /** This only shows the log. It does NOT turn logging on! */
    Log.showLog = () => {
        textAreaWithId("logTextArea").style.display = "block";
    };
    Log.toggleLog = (textAreaWithId) => () => {
        const log = textAreaWithId("logTextArea");
        if (log.style.display === "none") {
            log.style.display = "block";
            inputElementWithId("logReplaceRulesCheckbox").checked = true;
        }
        else {
            log.style.display = "none";
            inputElementWithId("logReplaceRulesCheckbox").checked = false;
        }
    };
})(Log || (Log = {}));
var ReplaceByRules;
(function (ReplaceByRules) {
    // Overload signatures
    var inputElementWithId = HtmlUtils.NeverNull.inputElementWithId;
    function withUiLog(rules, subject, wholeWords = false, preserveCase = false) {
        const logFlag = inputElementWithId("logReplaceRulesCheckbox").checked;
        const retVal = HelgeUtils.ReplaceByRules.replaceByRules(subject, rules, wholeWords, logFlag, preserveCase);
        Log.writeIfLoggingEnabled(retVal.log);
        return retVal.resultingText;
    }
    ReplaceByRules.withUiLog = withUiLog;
    // noinspection JSUnusedGlobalSymbols
    function onlyWholeWordsWithUiLog(rules, subject) {
        return withUiLog(rules, subject, true);
    }
    ReplaceByRules.onlyWholeWordsWithUiLog = onlyWholeWordsWithUiLog;
    function onlyWholeWordsPreserveCaseWithUiLog(rules, subject) {
        return withUiLog(rules, subject, true, true);
    }
    ReplaceByRules.onlyWholeWordsPreserveCaseWithUiLog = onlyWholeWordsPreserveCaseWithUiLog;
})(ReplaceByRules || (ReplaceByRules = {}));
const getApiKey = () => Cookies.get(apiSelector.value + 'ApiKey');
const setApiKeyCookie = (apiKey) => {
    Cookies.set(apiSelector.value + 'ApiKey', apiKey);
};
export const loadFormData = () => {
    const getLocalStorageOrCookie = (key) => {
        return LocalStorage.get(key) ?? Cookies.get(key);
    };
    mainEditorTextarea.value = getLocalStorageOrCookie("editorText") ?? "";
    transcriptionPromptEditor.value = getLocalStorageOrCookie("prompt") ?? "";
    replaceRulesTextArea.value = getLocalStorageOrCookie("replaceRules")
        ?? `""->""\n`; // Default replace rule;
    apiSelector.value = Cookies.get("apiSelector") ?? 'OpenAI';
};
export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    }
};
const runTests = () => {
    if (!RUN_TESTS)
        return;
    HelgeUtils.runTests();
};
const init = () => {
    runTests();
    UiFunctions.Buttons.addEventListeners();
    registerServiceWorker();
    loadFormData();
    elementWithId("versionSpan").innerHTML = VERSION;
    mainEditor.setCursorAtEnd().focus();
};
init();
//# sourceMappingURL=script.js.map