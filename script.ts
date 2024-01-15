import {HtmlUtils} from "./HtmlUtils.js";
import {HelgeUtils} from "./HelgeUtils.js";

import TextAreas = HtmlUtils.TextAreas;
import buttonWithId = HtmlUtils.buttonWithId;
import blinkFast = HtmlUtils.blinkFast;
import blinkSlow = HtmlUtils.blinkSlow;
import inputElementWithId = HtmlUtils.inputElementWithId;

// ############## Config ##############
const INSERT_EDITOR_INTO_PROMPT = true;

namespace Pures {
  // noinspection SpellCheckingInspection
  export const du2ich = (input: string) => HelgeUtils.replaceByRules(HelgeUtils.replaceByRules(input
          , `
"st\\b"->""
`) as string
      , `
"Du"->"Ich"
"du"->"ich"
"dich"->"mich"
"Dich"->"Mich"
"dir"->"mir"
"Dir"->"Mir"
"dein"->"mein"
"Dein"->"Mein"
"bist"->"bin"
"hast"->"habe"
"I"->"Ist"
"i"->"ist"
`, true) as string;
}

namespace Functions {
  export const applyReplaceRulesToMainEditor = () => {
    const selectionStart = mainEditorTextarea.selectionStart;
    const selectionEnd = mainEditorTextarea.selectionEnd;

    mainEditorTextarea.value = replaceWithNormalParameters(mainEditorTextarea.value) as string;

    mainEditorTextarea.selectionStart = selectionStart;
    mainEditorTextarea.selectionEnd = selectionEnd;
  };
}

namespace UiFunctions {
  // noinspection SpellCheckingInspection
  export namespace Buttons {
    import textAreaWithId = HtmlUtils.textAreaWithId;
    export namespace Media {
      let mediaRecorder: MediaRecorder;
      let audioChunks = [];
      let audioBlob: Blob;
      let isRecording = false;
      let stream: MediaStream;
      let sending = false;

      export namespace StateIndicator {

        /** Updates the recorder state display. That consists of the text
         * and color of the stop button and the pause record button. */
        export const update = () => {
          if (mediaRecorder?.state === 'recording') {
            setRecording(sending);
          } else if (mediaRecorder?.state === 'paused') {
            setPaused(sending);
          } else {
            setStopped();
          }
        }
        const setRecording = (sendingParam: boolean) => {
          setHtmlOfButtonStop(blinkFast('🔴') + (sendingParam
              ? '<br>Sending'
              : '<br>◼ Stop'));
          setHtmlOfButtonPauseRecord(blinkFast('🔴') + '<br>|| Pause');
        };
        export const setPaused = (sendingParam: boolean = sending) => {
          setHtmlOfButtonStop(blinkSlow('⬤ Paused') + (sendingParam
              ? '<br>✎Scribing'
              : '<br>◼ Stop'));
          setHtmlOfButtonPauseRecord(blinkSlow('⬤ Paused') +'<br>▶ Cont.');
        };
        const setStopped = () => {
          setHtmlOfButtonStop(sending
              ? blinkFast('◼') + '<br>Sending'
              : '◼<br>Stopped');
          setHtmlOfButtonPauseRecord('⬤<br>Record');
        };
        const setHtmlOfButtonStop = (html: string) => {
          buttonWithId("stopButton").innerHTML = html;
        };
        const setHtmlOfButtonPauseRecord = (html: string) => {
          buttonWithId("pauseRecordButton").innerHTML = html;
        };

      }
      /**
       * @param audioBlob
       * @param insertAtCursorFlag
       * - If true, the transcription is inserted at the cursor position
       * in the main editor, but often it is inserted at the beginning of the text instead.
       * - If false, it will be appended.
       */

      const transcribeAndHandleResult = async (audioBlob: Blob, insertAtCursorFlag: boolean ) => {
        sending = true;
        StateIndicator.update();
        const apiName = getApiSelectedInUi();
        if (!apiName) {
          insertAtCursor("You must select an API below.");
          return;
        }
        const promptForWhisper = () => transcriptionPromptEditor.value
        + INSERT_EDITOR_INTO_PROMPT ? mainEditorTextarea.value.substring(0
            , mainEditorTextarea.selectionStart /*The start is relevant b/c the selection will be overwritten by the
                                            new text. */
        ).slice(-(
            750 /* Taking the last 750 CHARS is for sure less than the max 250 TOKENS whisper is considering. This is
          important because the last words of the last transcription should always be included to avoid hallucinations
          if it otherwise would be an incomplete sentence. */
            - transcriptionPromptEditor.value.length)) : "";
        const removeLastDot = (text: string): string => {
          if (text.endsWith('.')) {
            return text.slice(0, -1)+" ";
          }
          return text;
        };

        function aSpaceIfNeeded() {
          return mainEditorTextarea.selectionStart > 0
              && !mainEditorTextarea.value.charAt(mainEditorTextarea.selectionStart - 1).match(/\s/)
              ? " " : "";
        }

        try {
          const removeLastDotIfNotAtEnd = (input: string): string => {
            if (mainEditorTextarea.selectionStart < mainEditorTextarea.value.length) {
              return removeLastDot(input);
            }
            return input;
          }
          const transcriptionText = await HelgeUtils.Transcription.transcribe(
              apiName, audioBlob, getApiKey(), promptForWhisper());
          if (insertAtCursorFlag)
            insertAtCursor(aSpaceIfNeeded() + removeLastDotIfNotAtEnd(transcriptionText));
          else
            TextAreas.appendText(mainEditorTextarea, transcriptionText);
          Functions.applyReplaceRulesToMainEditor();
          saveEditor();
          navigator.clipboard.writeText(mainEditorTextarea.value).then();
        } catch (error) {
          if (error instanceof HelgeUtils.Transcription.TranscriptionError) {
            Log.log(JSON.stringify(error.payload, null, 2));
            Log.showLog();
          } else {
            // Handle other types of errors or rethrow
            throw error;
          }
        }

        sending = false;
        StateIndicator.update();
      };

      const stopCallback = () => {
        HtmlUtils.Media.releaseMicrophone(stream);
        isRecording = false;
        StateIndicator.update();
        audioBlob = new Blob(audioChunks, {type: 'audio/wav'});
        audioChunks = [];
        { // Download button
          downloadLink.href = URL.createObjectURL(audioBlob);
          downloadLink.download = 'recording.wav';
          downloadLink.style.display = 'block';
        }
        transcribeAndHandleResult(audioBlob, true).then(NotVisibleAtThisTime.hideSpinner);
      };

      const getOnStreamReady = (beginPaused: boolean) => {
        return (streamParam: MediaStream) => {
          stream = streamParam;
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          mediaRecorder.start();
          isRecording = true;
          StateIndicator.update();
          mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
          };
          if (beginPaused) mediaRecorder.pause();
          StateIndicator.update();
        };
      }

      const startRecording = (beginPaused: boolean = false) => {
        navigator.mediaDevices.getUserMedia({audio: true}).then(getOnStreamReady(beginPaused));
      };

      const stopRecording = () => {
        mediaRecorder.onstop = stopCallback;
        mediaRecorder.stop();
      };

      // ############## stopButton ##############
      const stopButton = () => {
        if (isRecording) {
          stopRecording();
        } else {
          NotVisibleAtThisTime.showSpinner();
          startRecording();
        }
      }
      buttonWithId("stopButton").addEventListener('click', stopButton);

      const stop_transcribe_startNewRecording_and_pause = () => {
        mediaRecorder.onstop = () => {
          audioBlob = new Blob(audioChunks, {type: 'audio/wav'});
          audioChunks = [];
          sending = true;
          transcribeAndHandleResult(audioBlob, false).then(NotVisibleAtThisTime.hideSpinner);
          startRecording(true);
        };
        mediaRecorder.stop();
      };

      // ############## pauseRecordButton ##############
      const pauseRecordButton = () => {
        if (mediaRecorder?.state === 'recording') {
          mediaRecorder.pause();
          StateIndicator.update();
        } else if (mediaRecorder?.state === 'paused') {
          mediaRecorder.resume();
          StateIndicator.update();
        } else {
          buttonWithId("stopButton").click();
        }
      }

      const transcribeButton = () => {
        if (mediaRecorder?.state === 'recording'
            || (mediaRecorder?.state === 'paused'
                && audioChunks.length > 0)) {
          stop_transcribe_startNewRecording_and_pause();
          return;
        }
        pauseRecordButton();
      }

// ############## transcribeButton ##############
      buttonWithId("transcribeButton").addEventListener('click', transcribeButton);
      buttonWithId("pauseRecordButton").addEventListener('click', pauseRecordButton);

// ############## transcribeAgainButton ##############
      const transcribeAgainButton = () => {
        UiFunctions.closeEditorMenu();
        NotVisibleAtThisTime.showSpinner();
        transcribeAndHandleResult(audioBlob, true).then(NotVisibleAtThisTime.hideSpinner);
      };
      HtmlUtils.addButtonClickListener(buttonWithId("transcribeAgainButton"), transcribeAgainButton);

      StateIndicator.update();
    } // End of media buttons

    export const addButtonEventListeners = () => {

// ############## Toggle Log Button ##############
      Log.addToggleLogButtonClickListener(textAreaWithId);

// ############## Crop Highlights Menu Item ##############
      const cropHighlights = () => {
        mainEditorTextarea.value = HelgeUtils.extractHighlights(mainEditorTextarea.value).join(' ');
        saveEditor();
      };
      HtmlUtils.addButtonClickListener(buttonWithId("cropHighlightsMenuItem"), () => {
        cropHighlights();
        UiFunctions.closeEditorMenu();
      });

// ############## Copy Backup to clipboard Menu Item ##############
      const copyBackupToClipboard = () => {
        navigator.clipboard.writeText(
            "## Replace Rules\n" + replaceRulesTextArea.value + "\n"
            + "## Prompt\n" + transcriptionPromptEditor.value
        ).then();
      };
      HtmlUtils.addButtonClickListener(buttonWithId("copyBackupMenuItem"), () => { //TODOhStu: If I enjoy it, I could make a method "addMenuItem".
        copyBackupToClipboard();
        UiFunctions.closeEditorMenu();
      });

// ############## Focus the main editor textarea Menu Item ##############
      HtmlUtils.addButtonClickListener(buttonWithId("focusMainEditorMenuItem"), () => {
        mainEditorTextarea.focus();
        UiFunctions.closeEditorMenu();
      });

// ############## Du2Ich Menu Item ##############
      function du2ichMenuItem() {
        const value = Pures.du2ich(mainEditorTextarea.value);
        console.log(value);
        mainEditorTextarea.value = value;
        saveEditor();
        UiFunctions.closeEditorMenu();
      }
      HtmlUtils.addButtonClickListener(buttonWithId("du2ichMenuItem"), () => {
        du2ichMenuItem();
      });


// ############## saveAPIKeyButton ##############
      function saveAPIKeyButton() {
        setApiKeyCookie(apiKeyInput.value);
        apiKeyInput.value = '';
      }
      HtmlUtils.addButtonClickListener(buttonWithId("saveAPIKeyButton"), () => {
        saveAPIKeyButton();
      });

      function clearButton() {
        mainEditorTextarea.value = '';
        saveEditor();
      }

// clearButton
      HtmlUtils.addButtonClickListener(buttonWithId("clearButton"), () => {
        clearButton();
      });

      const replaceAgainButton = () => {
        Functions.applyReplaceRulesToMainEditor();
        mainEditorTextarea.focus();
        // window.scrollBy(0,-100000);
      };

// replaceAgainButton
      HtmlUtils.addButtonClickListener(buttonWithId("replaceAgainButton"), () => {
        replaceAgainButton();
      });

// ############## ctrlZButtons ##############
      const addCtrlZButtonEventListener = (ctrlZButtonId: string, textArea: HTMLTextAreaElement) => {
        HtmlUtils.addButtonClickListener(buttonWithId(ctrlZButtonId), () => {
          textArea.focus();
          //@ts-ignore
          document.execCommand('undo'); // Yes, deprecated, but works. I will replace it when it fails. Docs: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
        });
      };

      addCtrlZButtonEventListener("ctrlZButtonOfReplaceRules", replaceRulesTextArea);
      addCtrlZButtonEventListener("ctrlZButtonOfPrompt", transcriptionPromptEditor);

      // addReplaceRuleButton
      const addReplaceRule = () => {
        // add TextArea.selectedText() to the start of the replaceRulesTextArea
        TextAreas.setCursor(replaceRulesTextArea, 0);
        const selectedText = TextAreas.selectedText(mainEditorTextarea);
        TextAreas.insertTextAtCursor(replaceRulesTextArea, `"\\b${selectedText}\\b"gm->"${selectedText}"\n`);
        TextAreas.setCursor(replaceRulesTextArea, 12 + selectedText.length);
        replaceRulesTextArea.focus();
      };
      HtmlUtils.addButtonClickListener(buttonWithId("addReplaceRuleButton"), addReplaceRule);

      function cancelButton() {
        saveEditor()
        window.location.reload();
      }

// aboutButton
      HtmlUtils.addButtonClickListener(buttonWithId("cancelButton"), () => {
        cancelButton();
      });

// aboutButton
      HtmlUtils.addButtonClickListener(buttonWithId("pasteButton"), () => {
        navigator.clipboard.readText().then(text => {
          insertAtCursor(text);
        });
      });

// cutButton
      /** Adds an event listener to a button that copies the text of an input element to the clipboard. */
      const addEventListenerForCutButton = (buttonId: string, inputElementId: string) => {
        buttonWithId(buttonId).addEventListener('click', () => {
          navigator.clipboard.writeText(inputElementWithId(inputElementId).value).then(() => {
            buttonWithId(buttonId).innerHTML = '✂<br>Done';
            setTimeout(() => {
              buttonWithId(buttonId).innerHTML = '✂<br>Cut';
            }, 2000);
            mainEditorTextarea.value = '';
            saveEditor();
            mainEditorTextarea.focus();
          });
        });
      };
      addEventListenerForCutButton("cutButton", "mainEditorTextarea");

// copyButtons
      /** Adds an event listener to a button that copies the text of an input element to the clipboard. */
      const addEventListenerForCopyButton = (buttonId: string, inputElementId: string) => {
        buttonWithId(buttonId).addEventListener('click', () => {
          navigator.clipboard.writeText(inputElementWithId(inputElementId).value).then(() => {
            buttonWithId(buttonId).innerHTML = '⎘<br>Copied!';
            setTimeout(() => {
              buttonWithId(buttonId).innerHTML = '⎘<br>Copy';
            }, 2000);
          });
        });
      };

      // copyButtons
      addEventListenerForCopyButton("copyReplaceRulesButton", "replaceRulesTextArea");
      addEventListenerForCopyButton("copyPromptButton", "transcriptionPromptEditor");

      buttonWithId("saveAPIKeyButton").addEventListener('click', function () {
        inputElementWithId('apiKey').value = ''; // Clear the input field
      });

      apiSelector.addEventListener('change', () => {
        HtmlUtils.Cookies.set('apiSelector', apiSelector.value);
      });
    }
  }


  import elementWithId = HtmlUtils.elementWithId;

  export const closeEditorMenu = () => {
    elementWithId("editorMenuHeading").dispatchEvent(new CustomEvent('rootMenuClose'));
  };

  export const replaceRulesTextAreaOnInput = () => {
    /**
     * Do correct regex escaping with the following and modify the rule accordingly:
     *`Das hier ist ein ziemlich langer ganz normaler Text, an dem die "Rules" nichts verändern sollten. Dadurch fail'en auch Rules wie zB "e"->"a" und das ist auch gut so.`
     */
    // noinspection SpellCheckingInspection
    const magicText = (numberToMakeItUnique: number) => {
      return `Das hier ist ein ziemlich langer ganz normaler Text an dem die Rules nichts verändern sollten Dadurch failen auch Rules wie zB und das ist auch gut so`
      + numberToMakeItUnique;
    }
    const createTestRule = (numberToMakeItUnique: number) => `\n\n"${magicText(numberToMakeItUnique)}"gmu->""\n\n`;
    const testRules =
        createTestRule(1)
        + replaceRulesTextArea.value
        + createTestRule(2);
    const replaceResult = HelgeUtils.replaceByRulesAsString(magicText(1)+magicText(2), testRules);
    buttonWithId("testFailIndicatorOfReplaceRules").style.display =
        replaceResult===''
            ? "none" : "block";
  };
}


const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement;
const spinner1 = document.getElementById('spinner1') as HTMLElement;
const apiSelector = document.getElementById('apiSelector') as HTMLSelectElement;

const apiKeyInput = document.getElementById('apiKeyInputField') as HTMLTextAreaElement;
const mainEditorTextarea = document.getElementById('mainEditorTextarea') as HTMLTextAreaElement;
const transcriptionPromptEditor = document.getElementById('transcriptionPromptEditor') as HTMLTextAreaElement;
const replaceRulesTextArea = document.getElementById('replaceRulesTextArea') as HTMLTextAreaElement;

const saveEditor = () => HtmlUtils.Cookies.set("editorText", HtmlUtils.textAreaWithId("mainEditorTextarea").value);

TextAreas.setAutoSave('replaceRules', 'replaceRulesTextArea');
HtmlUtils.textAreaWithId('replaceRulesTextArea').addEventListener('input', UiFunctions.replaceRulesTextAreaOnInput);
TextAreas.setAutoSave('editorText', 'mainEditorTextarea');
TextAreas.setAutoSave('prompt', 'transcriptionPromptEditor');

const insertAtCursor = (text: string) => {
  TextAreas.insertTextAtCursor(mainEditorTextarea, text);
};

const getApiSelectedInUi = () => (apiSelector.value as HelgeUtils.Transcription.ApiName);

namespace NotVisibleAtThisTime {
  export const showSpinner = () => {
    // probably not needed anymore, delete later
    // spinner1.style.display = 'block';
  };

  // probably not needed anymore, delete later
  export const hideSpinner = () => {
    spinner1.style.display = 'none';
  };
}

namespace Log {
  import textAreaWithId = HtmlUtils.textAreaWithId;
  const MAX_LOG_LEN = 1000;

  export const log = (message: string) => {
    const logTextArea = textAreaWithId("logTextArea");
    const oldLog = logTextArea.value;
    logTextArea.value = (oldLog + "\n" + message).slice(- MAX_LOG_LEN);
    logTextArea.scrollTop = logTextArea.scrollHeight;
  }

  export const showLog = () => {
    textAreaWithId("logTextArea").style.display = "block";
  }

  export const addToggleLogButtonClickListener =
      (textAreaWithId: (id: string) => (HTMLTextAreaElement | null)) => {
    HtmlUtils.addButtonClickListener(buttonWithId("toggleLogButton"), () => {
      const log = textAreaWithId("logTextArea");
      if (log.style.display === "none") {
        log.style.display = "block";
      } else {
        log.style.display = "none";
      }
    });
  };
}

const replaceWithNormalParameters = (subject: string) => {
  return HelgeUtils.replaceByRules(subject, replaceRulesTextArea.value,false
      ,inputElementWithId("logReplaceRulesCheckbox").checked);
};

const getApiKey = () => HtmlUtils.Cookies.get(apiSelector.value + 'ApiKey');

const setApiKeyCookie = (apiKey: string) => {
  HtmlUtils.Cookies.set(apiSelector.value + 'ApiKey', apiKey);
};

export const loadFormData = () => {
  const Cookies = HtmlUtils.Cookies;
  mainEditorTextarea.value = Cookies.get("editorText");
  transcriptionPromptEditor.value = Cookies.get("prompt");
  replaceRulesTextArea.value = Cookies.get("replaceRules")??`""->""\n`;
  apiSelector.value = Cookies.get("apiSelector")??'OpenAI';
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

const init = () => {
  UiFunctions.Buttons.addButtonEventListeners();
  registerServiceWorker();
  loadFormData();
}

init();
