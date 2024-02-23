/*
 * Copyright (c) 2024 by Helge Tobias Kosuch
 */

import textAreaWithId = HtmlUtils.NeverNull.textAreaWithId;
import TextAreas = HtmlUtils.TextAreas;
import blinkFast = HtmlUtils.blinkFast;
import blinkSlow = HtmlUtils.blinkSlow;
import escapeForRegExp = HelgeUtils.Strings.escapeRegExp;
import elementWithId = HtmlUtils.NeverNull.elementWithId;
import TextAreaWrapper = HtmlUtils.TextAreas.TextAreaWrapper;
import Cookies = HtmlUtils.BrowserStorage.Cookies;
import {ctrlYRedo, ctrlZUndo} from "./DontInspect.js"
import {HelgeUtils} from "./HelgeUtils.js"
import {
  INSERT_EDITOR_INTO_PROMPT, NEW_NOTE_DELIMITER, VERIFY_LARGE_STORAGE, VERSION, WHERE_TO_INSERT_AT, WHISPER_TEMPERATURE
} from "./Config.js"
import {createCutFunction} from "./CutButton.js"
import {HtmlUtils} from "./HtmlUtils.js"
import {CurrentNote} from "./CurrentNote.js";

// @ts-ignore
import {download, generateCsv, mkConfig} from "../node_modules/export-to-csv/output/index.js";

const LARGE_STORAGE_PROVIDER =
    VERIFY_LARGE_STORAGE
        ? HtmlUtils.BrowserStorage.LocalStorageVerified
        : HtmlUtils.BrowserStorage.LocalStorage;

/** Inlined from HelgeUtils.Test.runTestsOnlyToday */
const RUN_TESTS = HtmlUtils.isMsWindows() && new Date().toISOString()
    .slice(0, 10) === "2024-02-23"
if (RUN_TESTS) console.log("RUN_TESTS is true. This is only for " +
    "testing. Set it to false in production.")

HtmlUtils.ErrorHandling.ExceptionHandlers.installGlobalDefault()

export namespace mainEditor {

  export namespace Undo {
    let undoBuffer = ""

    export const undo = () => {
      const swapBuffer = mainEditorTextarea.value
      mainEditorTextarea.value = undoBuffer
      undoBuffer = swapBuffer
      mainEditor.save();
    }

    export const saveState = () => {
      undoBuffer = mainEditorTextarea.value
    };
  }

  export const append = (insertedString: string) => {
    TextAreas.appendTextAndPutCursorAfter(mainEditorTextarea, insertedString)
    mainEditor.save();
    TextAreas.scrollToEnd(mainEditorTextarea);
  }

  export const appendDelimiter = () => {
    mainEditorTextareaWrapper.trim()
    append('\n' + NEW_NOTE_DELIMITER)
    mainEditorTextarea.focus()
  };

  export const save = () => {
    try {
      LARGE_STORAGE_PROVIDER.set("editorText", textAreaWithId("mainEditorTextarea").value);
    } catch (e) {
      prompt("Error saving editor text: " + e)
    }
    // Delete old cookie
    // Cookies.set("editorText", ""); // This used to be stored in a cookie.
  };
}

namespace Misc {

  export const applyReplaceRulesToMainEditor = () => {
    mainEditor.Undo.saveState();
    const selectionStart = mainEditorTextarea.selectionStart
    const selectionEnd = mainEditorTextarea.selectionEnd

    mainEditorTextarea.value = ReplaceByRules.withUiLog(replaceRulesTextArea.value, mainEditorTextarea.value)

    mainEditorTextarea.selectionStart = selectionStart
    mainEditorTextarea.selectionEnd = selectionEnd
  }

  export const addKeyboardShortcuts = () => {
    const cutFromMainEditor = createCutFunction(mainEditorTextarea, "{{c1::", "}}")

    document.addEventListener('keyup', (event) => {
      // console.log(event.key,event.shiftKey,event.ctrlKey,event.altKey)
      if (event.key === 'X' && event.shiftKey && event.ctrlKey) {
        // Prevent default action to avoid any browser shortcut conflicts
        event.preventDefault()
        cutFromMainEditor()
      }
    })
  }
}

export namespace Menu {
  import WcMenu = HtmlUtils.Menus.WcMenu;

  export const wireMenuItem = WcMenu.addItem("editorMenuHeading")
  export const close = () => WcMenu.close("editorMenuHeading")
}

export namespace UiFunctions {
  import buttonWithId = HtmlUtils.NeverNull.buttonWithId;

  export const runTests = () => {
    Buttons.runTests()
  }

  export namespace Buttons {
    import buttonWithId = HtmlUtils.NeverNull.buttonWithId;
    import inputElementWithId = HtmlUtils.NeverNull.inputElementWithId;
    import textAreaWithId = HtmlUtils.NeverNull.textAreaWithId;
    import Cookies = HtmlUtils.BrowserStorage.Cookies;
    import addKeyboardShortcuts = Misc.addKeyboardShortcuts;
    import suppressUnusedWarning = HelgeUtils.suppressUnusedWarning;

    export const runTests = () => {
      PunctuationNearCursor.runTests()
    }

    /** From the current cursor position go back to the last word beginning.
     * Then got to the next comma, semicolon, period, colon, or newline and
     * remove it. Put the cursor at the end of the word. */
    export namespace PunctuationNearCursor {
      import assertEquals = HelgeUtils.Tests.assertEquals;
      const doit = (text: string, cursorPosition: number) => {
        const wordStart = text.slice(0, cursorPosition).search(/\S+$/)
        const endOfWord = text.slice(cursorPosition).search(/\s/)
        const nextWord = text.slice(cursorPosition).search(/\s/)
        // const punctuationEnd = text.slice(cursorPosition).search(/[^\w]/g)
        const newText = text.slice(0, cursorPosition + nextWord) + text.slice(cursorPosition + nextWord + 1)
        return {wordStart, newText};
      };

      export const runTests = () => {
        const text = "This is a test  .   Bra."
        const cursorPosition = 13
        const {wordStart, newText} = doit(text, cursorPosition)
        assertEquals(newText, "This is a test Bra.")
        assertEquals(wordStart, 10)
      }

      export const kill = () => {
        const text = mainEditorTextarea.value
        const cursorPosition = mainEditorTextarea.selectionStart
        const {wordStart, newText} = doit(text, cursorPosition);

        mainEditorTextarea.value = newText
        mainEditorTextarea.selectionStart = wordStart
        mainEditorTextarea.selectionEnd = wordStart
        mainEditor.save()
      }

      export const addButtonEventListener = () => {
        buttonWithId("removePunctuationButton").addEventListener('click', kill)
      }
    }

    PunctuationNearCursor.addButtonEventListener()

    export namespace Media {

      import DelimiterSearch = HelgeUtils.Strings.DelimiterSearch;
      import applyReplaceRulesToMainEditor = Misc.applyReplaceRulesToMainEditor;
      import buttonWithId = HtmlUtils.NeverNull.buttonWithId;
      import suppressUnusedWarning = HelgeUtils.suppressUnusedWarning;
      let mediaRecorder: MediaRecorder
      let audioChunks: Blob[] = []
      let audioBlob: Blob
      let isRecording = false; suppressUnusedWarning(isRecording)
      let stream: MediaStream
      let sending = false

      export const transcribeAudioBlob = () => {
        transcribeAndHandleResult(audioBlob, WHERE_TO_INSERT_AT)
            .then().catch(Log.error)
      }

      export namespace StateIndicator {

        import buttonWithId = HtmlUtils.NeverNull.buttonWithId;
        /** Updates the recorder state display. That consists of the text
         * and color of the stop button and the pause record button. */
        export const update = () => {
          if (mediaRecorder?.state === 'recording') {
            setRecording()
          } else if (mediaRecorder?.state === 'paused') {
            setPaused()
          } else {
            setStopped()
          }
        }
        const setRecording = () => {
          setHtmlOfButtonStop('◼<br>Stop')
          setHtmlOfButtonPauseRecord(blinkFast('🔴 Recording') + '<br>|| Pause')
        }
        export const setPaused = () => {
          setHtmlOfButtonStop('◼<br>Stop')
          setHtmlOfButtonPauseRecord(blinkSlow('|| Paused') +'<br>⬤▶ Cont. Rec')
        }
        export const setStopped = () => {
          setHtmlOfButtonStop('◼<br>Stop')
          setHtmlOfButtonPauseRecord(sending
              ? blinkFast('✎ Scribing') + '<br>⬤ Record'
              : '<br>⬤ Record')
        }
        const setHtmlOfButtonStop = (html: string) => {
          buttonWithId("stopButton").innerHTML = html
        }
        const setHtmlOfButtonPauseRecord = (html: string) => {
          buttonWithId("pauseRecordButton").innerHTML = html
        }
      }

      export type WhereToPutTranscription = "appendAtEnd" | "insertAtCursor"

      const transcribeAndHandleResult = async (audioBlob: Blob,
          whereToPutTranscription: WhereToPutTranscription ) => {
        try {
          const calcMaxEditorPrompt = (textArea: HTMLTextAreaElement) => {
            const text = textArea.value
            /* maxLeftIndex.
             * Searching for the Delimiter. It is ")))---(((" at this time.
             * "max" because this might be shortened later on. */
            const maxLeftIndex = (() => {
              return WHERE_TO_INSERT_AT === "appendAtEnd"
                  ? text.length
                  : textArea.selectionStart/* Only the start is relevant
                  b/c the selection will be overwritten by the new text. */
            })()
            const indexAfterPreviousDelimiter = (() => {
              return new DelimiterSearch(NEW_NOTE_DELIMITER).leftIndex(text, maxLeftIndex)
            })()
            return text.substring(indexAfterPreviousDelimiter, maxLeftIndex)
          }
          const removeLastDot = (text: string): string => {
            if (text.endsWith('.')) {
              return text.slice(0, -1)+" "
            }
            return text
          }
          const aSpaceIfNeeded = () => {
            return mainEditorTextarea.selectionStart > 0
            && !mainEditorTextarea.value.charAt(
                mainEditorTextarea.selectionStart - 1).match(/\s/)
                ? " " : ""
          }
          const finalPrompt = () => {
            if (inputElementWithId("ignorePromptCheckbox").checked) {
              Log.error("Prompt ignored.")
              return ""
            }
            const MAX_TOTAL_CHARS = 500; /* Taking the last 500
             CHARS is for sure less than the max 250 TOKENS whisper is
             considering. This is important because the last words of
             the last transcription should always be included to avoid
             hallucinations if it otherwise would be an incomplete
             sentence. */
            const maxCharsFromEditor = MAX_TOTAL_CHARS
                - transcriptionPromptEditor.value.length
            const maxEditorPrompt = calcMaxEditorPrompt(mainEditorTextarea)
            return transcriptionPromptEditor.value +
                (INSERT_EDITOR_INTO_PROMPT
                ? maxEditorPrompt.slice(- maxCharsFromEditor)
                : "")
          }
          const getTranscriptionText = async () => await
              HelgeUtils.Transcription.transcribe(
                  apiName, audioBlob, getApiKey() as string, finalPrompt(),
                  getLanguageSelectedInUi(),
                  inputElementWithId("translateCheckbox").checked)
          const removeLastDotIfNotAtEnd = (input: string): string => {
            if (mainEditorTextarea.selectionStart < mainEditorTextarea.value.length) {
              return removeLastDot(input)
            }
            return input
          }

          sending = true
          StateIndicator.update()
          const apiName = getApiSelectedInUi()
          if (!apiName) {
            TextAreas.insertTextAndPutCursorAfter(mainEditorTextarea,
                "You must select an API below.")
            return
          }
          const transcriptionText = await getTranscriptionText()

          if (whereToPutTranscription=="insertAtCursor") {
            TextAreas.insertTextAndPutCursorAfter(mainEditorTextarea,
                aSpaceIfNeeded() + removeLastDotIfNotAtEnd(transcriptionText))
          } else {
            mainEditorTextareaWrapper.trim().appendTextAndPutCursorAfter(transcriptionText.trim())
          }
          if (inputElementWithId("autoReplaceCheckbox").checked) {
            applyReplaceRulesToMainEditor()
          }
          mainEditorTextareaWrapper.trim().focus()
          mainEditor.save();
          sending = false
          StateIndicator.update()
        } catch (error) {
          if (error instanceof HelgeUtils.Transcription.TranscriptionError) {
            Log.error(JSON.stringify(error.payload, null, 2))
          } else throw error
        }
      }

      export namespace StopCallbackCreator {
        export const createCancelingCallback = () => createInternal(true)
        export const transcribingCallback = () => createInternal(false)
        const createInternal = (cancel: boolean) => {
          return () => {
            HtmlUtils.Media.releaseMicrophone(stream)
            isRecording = false
            StateIndicator.update()
            audioBlob = new Blob(audioChunks, {type: 'audio/wav'})
            if (cancel) {
              StateIndicator.setStopped()
              return
            }
            audioChunks = []
            { // Download button
              downloadLink.href = URL.createObjectURL(audioBlob)
              downloadLink.download = 'recording.wav'
              downloadLink.style.display = 'block'
            }
            transcribeAndHandleResult(audioBlob, WHERE_TO_INSERT_AT)
                .then().catch(Log.error)
          }
        }
      }

      const getOnStreamReady = (beginPaused: boolean) => {
        return (streamParam: MediaStream) => {
          stream = streamParam
          mediaRecorder = new MediaRecorder(stream)
          audioChunks = []
          mediaRecorder.start()
          isRecording = true
          StateIndicator.update()
          mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data)
          }
          if (beginPaused) mediaRecorder.pause()
          StateIndicator.update()
        }
      }

      const startRecording = (beginPaused: boolean = false) => {
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(getOnStreamReady(beginPaused)).catch(Log.error)
      }

      const wireUploadButton = () => {

        const transcribeSelectedFile = () => {
          const fileInput = inputElementWithId('fileToUploadSelector')
          if (!fileInput?.files?.[0])
            return
          const file = fileInput.files[0];
          const reader = new FileReader();
          reader.onload = event => {
            if (event.target===null || event.target.result===null)
              return
            audioBlob = new Blob([event.target.result], {type: file.type});
            mainEditor.appendDelimiter()
            transcribeAudioBlob()
          };
          reader.readAsArrayBuffer(file);
          Menu.close()
        };

        elementWithId('fileToUploadSelector').addEventListener('change', transcribeSelectedFile)
      };

// ############## stopButton ##############
      const stopRecording = () => {
        mediaRecorder.onstop = StopCallbackCreator.transcribingCallback()
        mediaRecorder.stop()
      }

      const stopButton = () => {
        stopRecording()
        /** delete, previous behavior
        if (isRecording) {
          stopRecording()
        } else {
          NotVisibleAtThisTime.showSpinner()
          startRecording()
        }
        */
      }
      buttonWithId("stopButton").addEventListener('click', stopButton)

// ############## cancelRecording ##############
      export const cancelRecording = () => {
        if (!mediaRecorder) return
        mediaRecorder.onstop = StopCallbackCreator.createCancelingCallback()
        mediaRecorder.stop()
      }

// ############## stop_transcribe_startNewRecording_and_pause ##############
      const stop_transcribe_startNewRecording_and_pause = () => {
        mediaRecorder.onstop = () => {
          audioBlob = new Blob(audioChunks, {type: 'audio/wav'})
          audioChunks = []
          sending = true
          transcribeAndHandleResult(audioBlob, WHERE_TO_INSERT_AT)
              .then().catch(Log.error)
          startRecording(true)
        }
        mediaRecorder.stop()
      }

      // ############## pauseRecordButton ##############
      const pauseRecordButton = () => {
        if (mediaRecorder?.state === 'recording') {
          mediaRecorder.pause()
          StateIndicator.update()
        } else if (mediaRecorder?.state === 'paused') {
          mediaRecorder.resume()
          StateIndicator.update()
        } else {
          startRecording()
        }
      }

      const transcribeButton = () => {
        if (mediaRecorder?.state === 'recording'
            || (mediaRecorder?.state === 'paused'
                && audioChunks.length > 0)) {
          stop_transcribe_startNewRecording_and_pause()
          return
        }
        pauseRecordButton()
      }

// ############## transcribeButton ##############
      buttonWithId("transcribeButton").addEventListener('click', transcribeButton)
      buttonWithId("pauseRecordButton").addEventListener('click', pauseRecordButton)

// ############## transcribeAudioBlob ##############
      Menu.wireMenuItem("transcribeAgainButton", transcribeAudioBlob)

// ############## Misc ##############
      wireUploadButton();

      StateIndicator.update()

    } // End of media buttons

    const clipboard = navigator.clipboard;
    export const addEventListeners = () => {

      addKeyboardShortcuts()

      Menu.wireMenuItem("undoActionButton", mainEditor.Undo.undo)

// ############## Toggle Log Button ##############
      Menu.wireMenuItem("toggleLogButton", Log.toggleLog(textAreaWithId))

// ############## Crop Highlights Menu Item ##############
      const cropHighlights = () => {
        mainEditor.Undo.saveState()
        mainEditorTextarea.value = HelgeUtils.extractHighlights(mainEditorTextarea.value).join(' ')
        mainEditor.save();
      }
      Menu.wireMenuItem("cropHighlightsMenuItem", cropHighlights)

// ############## Copy Backup to clipboard Menu Item ##############
      const copyBackupToClipboard = () => {
        clipboard.writeText(
            "## Replace Rules\n" + replaceRulesTextArea.value + "\n"
            + "## Prompt\n" + transcriptionPromptEditor.value
        ).then().catch(Log.error)
      }

      Menu.wireMenuItem("copyBackupMenuItem", copyBackupToClipboard)

// ############## Focus the main editor textarea Menu Item ##############
      Menu.wireMenuItem("focusMainEditorMenuItem", mainEditorTextarea.focus)

// ############## du2Ich Menu Item ##############
      const du2ichMenuItem = () => {
        mainEditor.Undo.saveState();

        const currentNote = new CurrentNote(mainEditorTextarea)
        const changedText = HelgeUtils.Misc.du2ich(currentNote.text());
        currentNote.delete()

        { // Insert the changed text
          const cursorIsAtTheEndOfTheTextarea =
              mainEditorTextarea.value.length == mainEditorTextarea.selectionStart;

          if (cursorIsAtTheEndOfTheTextarea) {
            mainEditorTextareaWrapper.insertTextAndPutCursorAfter(
                NEW_NOTE_DELIMITER + changedText)
          } else {
            mainEditorTextareaWrapper.insertTextAndPutCursorAfter(
                changedText + NEW_NOTE_DELIMITER)
          }
        }
        mainEditor.save();
      }
      Menu.wireMenuItem("du2ichMenuItem", du2ichMenuItem)

// ############## saveAPIKeyButton ##############
      const saveAPIKeyButton = () => {
        setApiKeyCookie(apiKeyInput.value)
        apiKeyInput.value = ''
      };
      HtmlUtils.addClickListener(("saveAPIKeyButton"), () => {
        saveAPIKeyButton()
      })

      const replaceButton = () => {
        Misc.applyReplaceRulesToMainEditor()
        mainEditorTextarea.focus()
        // window.scrollBy(0,-100000)
      }

// replaceButtons
      HtmlUtils.addClickListener(("replaceButton1"), () => {
        replaceButton()
      })
      HtmlUtils.addClickListener(("replaceButton2"), () => {
        replaceButton()
      })

// ############## backslashButton ##############
      HtmlUtils.addClickListener(("backslashButton"), () => {
        TextAreas.insertTextAndPutCursorAfter(replaceRulesTextArea,"\\b")
      })

// ############## Undo #############
    const addUndoClickListener = (ctrlZButtonId: string, textArea: HTMLTextAreaElement) => {
      HtmlUtils.addClickListener(ctrlZButtonId, () => {
        textArea.focus()
        ctrlZUndo()
      })
    }
    addUndoClickListener("ctrlZButtonOfReplaceRules", replaceRulesTextArea)
    addUndoClickListener("ctrlZButtonOfPrompt", transcriptionPromptEditor)

    HtmlUtils.addClickListener("ctrlYButton", ctrlYRedo)
    HtmlUtils.addClickListener("addReplaceRuleButton", addReplaceRule)
    HtmlUtils.addClickListener("addWordReplaceRuleButton", addWordReplaceRule)
    HtmlUtils.addClickListener("insertNewNoteDelimiterButton",
        mainEditor.appendDelimiter)

// cancelRecording
    Menu.wireMenuItem("cancelRecording", Buttons.Media.cancelRecording)

// cutAllButton
    Menu.wireMenuItem(("cutAllButton"), () =>
        clipboard.writeText(mainEditorTextarea.value).then(
          () => {
            mainEditorTextarea.value = ''
            mainEditor.save();
          }).catch(Log.error)
        )

// aboutButton
      HtmlUtils.addClickListener(("pasteButton"), () => {
        clipboard.readText().then(text => {
          TextAreas.insertTextAndPutCursorAfter(mainEditorTextarea, text)
        }).catch(Log.error)
      })

// cutNoteButton
      buttonWithId("cutNoteButton").addEventListener('click',
          createCutFunction(mainEditorTextarea))
// cutAnkiButton
      buttonWithId("cutAnkiButton").addEventListener('click',
          createCutFunction(mainEditorTextarea, "{{c1::", "}}"))

// copyButtons
      /** Adds an event listener to a button that copies the text of an input element to the clipboard. */
      const addEventListenerForCopyButton = (buttonId: string, inputElementId: string) => {
        buttonWithId(buttonId).addEventListener('click', () => {
          clipboard.writeText(inputElementWithId(inputElementId).value).then(() => {
            buttonWithId(buttonId).innerHTML = '⎘<br>Copied!'
            setTimeout(() => {
              buttonWithId(buttonId).innerHTML = '⎘<br>Copy'
            }, 500)
          }).catch(Log.error)
        })
      }

      // copyButtons
      addEventListenerForCopyButton("copyReplaceRulesButton", "replaceRulesTextArea")
      addEventListenerForCopyButton("copyPromptButton", "transcriptionPromptEditor")

// ############## Misc ##############
      buttonWithId("saveAPIKeyButton").addEventListener('click', function () {
        inputElementWithId('apiKeyInputField').value = ''; // Clear the input field
      })

      apiSelector.addEventListener('change', () => {
        Cookies.set('apiSelector', apiSelector.value)
      })

      languageSelector.addEventListener('change', () => {
        Cookies.set('languageSelector', languageSelector.value)
      })

// ############## downloadCsvs ##############
      const downloadCsv = (prefix = "", postfix = "") => {
        // Uses https://github.com/alexcaza/export-to-csv
        const csvConfig = mkConfig({
          columnHeaders: ["t1"], showColumnHeaders: false, useTextFile: true
        });
        const textArray = mainEditorTextareaWrapper.value().split(NEW_NOTE_DELIMITER)
        // Build a new array with elements like this: { text: textArray[i] }
        const csvData = textArray.map((text: string) => ({
          t1: prefix + text + postfix
        }))
        const csv = generateCsv(csvConfig)(csvData);
        return download(csvConfig)(csv);
      };

      const ankiClozeCsv = () => {
        return downloadCsv("{{c1::", "}}");
      };
      Menu.wireMenuItem("ankiClozeCsv", ankiClozeCsv);
      Menu.wireMenuItem("downloadCsv", downloadCsv);

    }

    const insertTextIntoMainEditor = (insertedString: string) => {
      TextAreas.insertTextAndPutCursorAfter(mainEditorTextarea, insertedString)
      mainEditor.save();
    }
    suppressUnusedWarning(insertTextIntoMainEditor)

    // addReplaceRuleButton
    const addReplaceRule = (requireWordBoundaryAtStart = false) => {
      const inputStr = TextAreas.selectedText(mainEditorTextarea)
      /* The following builds a rule like this:
       * "REGEX"gm->"REPLACEMENT" */
      const quote = `"`;
      const maybeWordBoundary = requireWordBoundaryAtStart ? "\\b" : "";
      const regEx = escapeForRegExp(inputStr);
      const optionsAndArrow = 'gm->';
      /** This is the part before the text selection in the UI */
      const ruleStrPart1 =
            quote
          + maybeWordBoundary
          + regEx
          + quote
          + optionsAndArrow
          + quote;
      const ruleStrPart2 = inputStr + quote;
      const ruleString = ruleStrPart1 + ruleStrPart2
      const lengthBefore = replaceRulesTextArea.value.length
      const APPEND = true
      if (APPEND) {
        const ruleBeforeSelection = "\n" + ruleStrPart1;
        TextAreas.appendTextAndPutCursorAfter(replaceRulesTextArea,
            ruleBeforeSelection + ruleStrPart2)
        const SELECT_REPLACEMENT = true;
        if (SELECT_REPLACEMENT) {
          replaceRulesTextArea.selectionStart = lengthBefore + ruleBeforeSelection.length
          replaceRulesTextArea.selectionEnd = replaceRulesTextArea.value.length - 1;
        } else { // delete this if branch later
          replaceRulesTextArea.selectionStart = lengthBefore
          replaceRulesTextArea.selectionEnd = replaceRulesTextArea.value.length
        }
        TextAreas.scrollToEnd(replaceRulesTextArea)
      } else {
        TextAreas.insertTextAndPutCursorAfter(replaceRulesTextArea, ruleString+"\n")
        replaceRulesTextArea.selectionStart = 0
        replaceRulesTextArea.selectionEnd = ruleString.length
      }
      replaceRulesTextArea.focus();
      saveReplaceRules()
    }
    export const addWordReplaceRule = () => addReplaceRule(true)
  } // End of Buttons namespace

  const replaceRulesTest = () => {
    // noinspection SpellCheckingInspection
    const magicText = (numberToMakeItUnique: number) => {
      return `Das hier ist ein ziemlich langer ganz normaler Text, an dem die Rules nichts verändern sollten! Dadurch fail'en auch Rules. und das ist auch gut so.`
          + numberToMakeItUnique
    }

    const createTestRule = (numberToMakeItUnique: number) => `\n\n"${escapeForRegExp(magicText(numberToMakeItUnique))}"gm->""\n\n`
    const testRules =
        createTestRule(1)
        + replaceRulesTextArea.value
        + createTestRule(2)
    const replaceResult = ReplaceByRules.withUiLog(testRules, magicText(1) + magicText(2))
    buttonWithId("testFailIndicatorOfReplaceRules").style.display =
        replaceResult===''
            ? "none" : "block"
  }

  export const replaceRulesTextAreaOnInput = () => replaceRulesTest
}


const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement
const apiSelector = document.getElementById('apiSelector') as HTMLSelectElement
const languageSelector = document.getElementById('languageSelector') as HTMLSelectElement

const apiKeyInput = document.getElementById('apiKeyInputField') as HTMLTextAreaElement
const mainEditorTextarea = document.getElementById('mainEditorTextarea') as HTMLTextAreaElement
const mainEditorTextareaWrapper = new TextAreaWrapper(mainEditorTextarea)
const transcriptionPromptEditor = document.getElementById('transcriptionPromptEditor') as HTMLTextAreaElement
const replaceRulesTextArea = document.getElementById('replaceRulesTextArea') as HTMLTextAreaElement

const saveReplaceRules = () => {
  LARGE_STORAGE_PROVIDER.set("replaceRules",
      textAreaWithId("replaceRulesTextArea").value)
  Cookies.set("replaceRules", ""); // This used to be stored in a cookie.
  // Delete old cookie
}

textAreaWithId('replaceRulesTextArea').addEventListener('input', UiFunctions
    .replaceRulesTextAreaOnInput)

// Autosaves
{
  const handleAutoSaveError = (msg: string) => {
    Log.error(msg)
  }
  TextAreas.setAutoSave('replaceRules', 'replaceRulesTextArea', handleAutoSaveError, LARGE_STORAGE_PROVIDER)
  TextAreas.setAutoSave('editorText', 'mainEditorTextarea', handleAutoSaveError, LARGE_STORAGE_PROVIDER)
  TextAreas.setAutoSave('prompt', 'transcriptionPromptEditor', handleAutoSaveError, LARGE_STORAGE_PROVIDER)
}

const getApiSelectedInUi = () => (apiSelector.value as HelgeUtils.Transcription.ApiName)
const getLanguageSelectedInUi = () => (languageSelector.value)

export namespace Log {
  import inputElementWithId = HtmlUtils.NeverNull.inputElementWithId;
  const MAX_LOG_LEN = 1000

  // noinspection JSUnusedGlobalSymbols
  export const turnOnLogging = () => {
    inputElementWithId("logReplaceRulesCheckbox").checked = true
  }

  function logEvenIfNotEnabled(message: string) {
    const logTextArea = textAreaWithId("logTextArea")
    const oldLog = logTextArea.value
    logTextArea.value = (oldLog + "\n" + message).slice(-MAX_LOG_LEN).trim()
    TextAreas.scrollToEnd(logTextArea)
  }

  export const writeIfLoggingEnabled = (message: string) => {
    if (!inputElementWithId("logReplaceRulesCheckbox").checked) return
    logEvenIfNotEnabled(message)
  }

  export const error = (message: string) => {
    logEvenIfNotEnabled(message)
    showLog()
  }

  /** This only shows the log. It does NOT turn logging on! */
  export const showLog = () => {
    textAreaWithId("logTextArea").style.display = "block"
  }

  export const toggleLog = (textAreaWithId: (id: string) => HTMLTextAreaElement) => () => {

    const log = textAreaWithId("logTextArea")
    if (log.style.display === "none") {
      log.style.display = "block"
      inputElementWithId("logReplaceRulesCheckbox").checked = true
    } else {
      log.style.display = "none"
      inputElementWithId("logReplaceRulesCheckbox").checked = false
    }
  }

}

namespace ReplaceByRules {
  // Overload signatures
  import inputElementWithId = HtmlUtils.NeverNull.inputElementWithId;

  export function withUiLog(rules: string, subject: string): string
  export function withUiLog(rules: string, subject: string, wholeWords: boolean): string
  export function withUiLog(rules: string, subject: string, wholeWords: boolean,
                            preserveCase: boolean): string

  export function withUiLog(rules: string, subject: string, wholeWords = false, preserveCase = false): string {
    const logFlag = inputElementWithId("logReplaceRulesCheckbox").checked
    const retVal = HelgeUtils.ReplaceByRules.replaceByRules(subject, rules, wholeWords, logFlag, preserveCase)
    Log.writeIfLoggingEnabled(retVal.log)
    return retVal.resultingText
  }

  // noinspection JSUnusedGlobalSymbols
  export function onlyWholeWordsWithUiLog(rules: string, subject: string) {
    return withUiLog(rules, subject, true)
  }
  // noinspection JSUnusedGlobalSymbols
  export function onlyWholeWordsPreserveCaseWithUiLog(rules: string, subject: string) {
    return withUiLog(rules, subject, true, true)
  }
}

const getApiKey = () => Cookies.get(apiSelector.value + 'ApiKey')

const setApiKeyCookie = (apiKey: string) => {
  Cookies.set(apiSelector.value + 'ApiKey', apiKey)
}

export const loadFormData = () => {
  const getLocalStorageOrCookie = (key: string) => {
    return LARGE_STORAGE_PROVIDER.get(key) ?? Cookies.get(key)
  }

  mainEditorTextarea.value = getLocalStorageOrCookie("editorText")??""
  transcriptionPromptEditor.value = getLocalStorageOrCookie("prompt")??""
  replaceRulesTextArea.value = getLocalStorageOrCookie("replaceRules")
      ??`""->""\n` // Default replace rule

  apiSelector.value = Cookies.get("apiSelector")??'OpenAI'
  languageSelector.value = Cookies.get("languageSelector")??''
}

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope)
        }, err => {
          console.log('ServiceWorker registration failed: ', err)
        }).catch(Log.error)
  }
}

const runTests = () => {
  if (!RUN_TESTS) return
  HelgeUtils.runTests()
  UiFunctions.runTests()
}

const init = () => {
  runTests()
  UiFunctions.Buttons.addEventListeners()
  registerServiceWorker()
  loadFormData()
  elementWithId("versionSpan").innerHTML = `${VERSION}, temperature: ${WHISPER_TEMPERATURE}`
  mainEditorTextareaWrapper.setCursorAtEnd().focus()
}

init()

