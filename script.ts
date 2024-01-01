namespace HelgeUtils {
  export namespace Audio {

    export type Api = "OpenAI"|"Gladia";

    export const transcribe = async (api: Api, audioBlob: Blob, apiKey: string
                                     , prompt: string = '') => {
      const withGladia = async (audioBlob: Blob, apiKey: string, prompt: string = '') => {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('language_behaviour', 'automatic multiple languages');
        formData.append('toggle_diarization', 'false');
        formData.append('transcription_hint', prompt);

        const response = await fetch('https://api.gladia.io/audio/text/audio-transcription/', {
          method: 'POST',
          headers: {
            'x-gladia-key': apiKey
          },
          body: formData
        });
        return await response.json();
      };

      const withOpenAi = async (audioBlob: Blob, apiKey: string, prompt: string) => {
        const formData = new FormData();
        formData.append('file', audioBlob);
        formData.append('model', 'whisper-1'); // Using the largest model
        formData.append('prompt', prompt);

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });
        return await response.json();
      };
      const result =
          api=== "OpenAI" ?
          await withOpenAi(audioBlob, apiKey, prompt)
        : await withGladia(audioBlob, apiKey, prompt);
      const outputString = result["transcription"];
      if (outputString || outputString === '') return outputString;
      else return JSON.stringify(result, null, 2)
          + 'You need an API key. You can get one at https://platform.openai.com/api-keys">. If you want to try it out beforehand, you can try it in the ChatGPT Android and iOS apps for free without API key.\n\n';
    }
  }

  export const replaceByRules = (subject: string, ruleText: string) => {
    let count = 0;
    let ruleMatches: any[];
    const ruleParser = /^"(.+?)"([a-z]*?)(?:\r\n|\r|\n)?->(?:\r\n|\r|\n)?"(.*?)"([a-z]*?)(?:\r\n|\r|\n)?$/gmus;
    while (ruleMatches = ruleParser.exec(ruleText)) {
      // console.log("\n" + ruleMatches[1] + "\n↓↓↓↓↓\n"+ ruleMatches[3]);
      let matchRule = ruleMatches[2].length == 0 ?
          new RegExp(ruleMatches[1], 'gm')
          : new RegExp(ruleMatches[1], ruleMatches[2]);
      if (ruleMatches[4] == 'x')
        subject = subject.replace(matchRule, '');
      else
        subject = subject.replace(matchRule, ruleMatches[3]);
      count++;
    }
    return subject;
  }

  export const memoize = <T, R>(func: (...args: T[]) => R): (...args: T[]) => R => {
    const cache = new Map<string, R>();

    return (...args: T[]): R => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key)!;
      } else {
        const result = func(...args);
        cache.set(key, result);
        return result;
      }
    };
  }
}

namespace HtmlUtils {

  const memoize = HelgeUtils.memoize;

  export const elementWithId = memoize((id: string): HTMLElement | null => {
    return document.getElementById(id) as HTMLElement;
  });

  export const buttonWithId = elementWithId as (id: string) => HTMLButtonElement | null;
  export const textAreaWithId = elementWithId as (id: string) => HTMLTextAreaElement | null;

  export  namespace TextAreas {
    export const insertTextAtCursor = (
        textarea: HTMLTextAreaElement,
        addedText: string) => {

      if (!addedText)
        return;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const textAfterCursor = textarea.value.substring(cursorPosition);

      textarea.value = textBeforeCursor + addedText + textAfterCursor;
      const newCursorPosition = cursorPosition + addedText.length;
      textarea.selectionStart = newCursorPosition;
      textarea.selectionEnd = newCursorPosition;
    };
  }

  export namespace Media {
    export const releaseMicrophone = (stream: MediaStream) => {
      if (!stream) return;
      stream.getTracks().forEach(track => track.stop());
    };
  }

  export namespace Cookies {
    export const set = (cookieName: string, cookieValue: string) => {
      const expirationTime = new Date(Date.now() + 2147483647000).toUTCString();
      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)};expires=${expirationTime};path=/`;
    };

    export const get = (name: string) => {
      let cookieArr = document.cookie.split(";");
      for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if (name === cookiePair[0].trim()) {
          return decodeURIComponent(cookiePair[1]);
        }
      }
      return null;
    };
  }

  /**
   * Adds a click listener to a button that appends a checkmark to the button
   * text when clicked. */
  export const addButtonClickListener = (button: HTMLButtonElement, callback: () => void) => {
    const initialHTML = button.innerHTML; // Read initial HTML from the button
    const checkmark = ' ✔️'; // Unicode checkmark

    button.addEventListener('click', () => {
      callback();
      button.innerHTML += checkmark; // Append checkmark to the button HTML
      setTimeout(() => {
        button.innerHTML = initialHTML; // Reset the button HTML after 2 seconds
      }, 2000);
    });
  };
}

namespace AppSpecific {

  const Audio = HelgeUtils.Audio;

  namespace AfterInit {

    const Cookies = HtmlUtils.Cookies;

    const saveAPIKeyButton = document.getElementById('saveAPIKeyButton') as HTMLButtonElement;
    const recordButton = document.getElementById('recordButton') as HTMLButtonElement;
    const spinner = document.getElementById('spinner') as HTMLDivElement;
    const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
    const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
    const downloadButton = document.getElementById('downloadButton') as HTMLAnchorElement;
    const savePromptButton = document.getElementById('savePromptButton') as HTMLButtonElement;
    const saveRulesButton = document.getElementById('saveRulesButton') as HTMLButtonElement;
    const saveEditorButton = document.getElementById('saveEditorButton') as HTMLButtonElement;
    const copyButton = document.getElementById('copyButton') as HTMLButtonElement;
    const transcribeAgainButton = document.getElementById('transcribeAgainButton') as HTMLButtonElement;
    const replaceAgainButton = document.getElementById('replaceAgainButton') as HTMLButtonElement;

    const overwriteEditorCheckbox = document.getElementById('overwriteEditorCheckbox') as HTMLInputElement;
    const apiSelector: HTMLSelectElement = document.getElementById('apiSelector') as HTMLSelectElement;

    const apiKeyInput = document.getElementById('apiKeyInputField') as HTMLTextAreaElement;
    const editorTextarea = document.getElementById('editorTextarea') as HTMLTextAreaElement;
    const transcriptionPrompt = document.getElementById('transcriptionPrompt') as HTMLTextAreaElement;
    const replaceRulesTextArea = document.getElementById('replaceRulesTextArea') as HTMLTextAreaElement;

    // ############## addButtonEventListeners ##############
    export const addButtonEventListeners = () => {
      { // Media buttons
        let mediaRecorder: MediaRecorder;
        let audioChunks = [];
        let audioBlob: Blob;
        let isRecording = false;
        let stream: MediaStream;

        const mediaRecorderStoppedCallback = () => {
          audioBlob = new Blob(audioChunks, {type: 'audio/wav'});
          audioChunks = [];
          { // Download button
            downloadButton.href = URL.createObjectURL(audioBlob);
            downloadButton.download = 'recording.wav';
            downloadButton.style.display = 'block';
          }
          transcribeAndHandleResult(audioBlob).then(hideSpinner);
        };

        const onStreamReady = (streamParam: MediaStream) => {
          stream = streamParam;
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          mediaRecorder.start();
          isRecording = true;
          mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
          };
        };

        function startRecording() {
          showSpinner();
          recordButton.textContent = '◼ Stop';
          navigator.mediaDevices.getUserMedia({audio: true}).then(onStreamReady);
        }

        function stopRecording() {
          mediaRecorder.onstop = mediaRecorderStoppedCallback;
          mediaRecorder.stop();
          isRecording = false;
          recordButton.textContent = '⬤ Record';
          HtmlUtils.Media.releaseMicrophone(stream);
        }

        recordButton.addEventListener('click', () => {
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        });

        pauseButton.addEventListener('click', () => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            pauseButton.textContent = '‖ Resume';
          } else if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            pauseButton.textContent = '‖ Pause';
          }
        });

        //transcribeAgainButton
        HtmlUtils.addButtonClickListener(transcribeAgainButton, () => {
          showSpinner();
          transcribeAndHandleResult(audioBlob).then(hideSpinner);
        });
      }

      // saveAPIKeyButton
      HtmlUtils.addButtonClickListener(saveAPIKeyButton, () => {
        setApiKeyCookie(apiKeyInput.value);
      });

      // clearButton
      HtmlUtils.addButtonClickListener(clearButton, () => {
        editorTextarea.value = '';
      });

      // replaceAgainButton
      HtmlUtils.addButtonClickListener(replaceAgainButton, () => {
        editorTextarea.value = HelgeUtils.replaceByRules(editorTextarea.value, replaceRulesTextArea.value);
      });

      // saveEditorButton
      HtmlUtils.addButtonClickListener(saveEditorButton, () => {
        Cookies.set("editorText", editorTextarea.value);
      });

      // savePromptButton
      HtmlUtils.addButtonClickListener(savePromptButton, () => {
        Cookies.set("prompt", transcriptionPrompt.value);
      });

      // saveRulesButton
      HtmlUtils.addButtonClickListener(saveRulesButton, () => {
        Cookies.set("replaceRules", replaceRulesTextArea.value);
      });

      // copyButton
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(editorTextarea.value).then(() => {
          copyButton.textContent = '⎘ Copied!';
          setTimeout(() => {
            copyButton.textContent = '⎘ Copy';
          }, 2000);
        });
      });

      document.getElementById('saveAPIKeyButton').addEventListener('click', function () {
        (document.getElementById('apiKey') as HTMLInputElement).value = ''; // Clear the input field
      });

      apiSelector.addEventListener('change', () => {
        Cookies.set('apiSelector', apiSelector.value);
      });

      const showSpinner = () => {
        spinner.style.display = 'block';
      };

      const hideSpinner = () => {
        spinner.style.display = 'none';
      };
    }

    function getApiKey() {
      return Cookies.get(apiSelector.value + 'ApiKey');
    }

    function setApiKeyCookie(apiKey: string) {
      Cookies.set(apiSelector.value + 'ApiKey', apiKey);
    }

    const transcribeAndHandleResult = async (audioBlob: Blob) => {
      const api = apiSelector.value as HelgeUtils.Audio.Api;
      const result = await Audio.transcribe(api,audioBlob, getApiKey(), transcriptionPrompt.value);
      const replacedOutput = HelgeUtils.replaceByRules(result, replaceRulesTextArea.value);
      if (overwriteEditorCheckbox.checked)
        editorTextarea.value = replacedOutput;
      else
        HtmlUtils.TextAreas.insertTextAtCursor(editorTextarea, replacedOutput);
      navigator.clipboard.writeText(editorTextarea.value).then();
    };

    export const loadFormData = () => {
      editorTextarea.value = Cookies.get("editorText");
      transcriptionPrompt.value = Cookies.get("prompt");
      replaceRulesTextArea.value = Cookies.get("replaceRules");
      apiSelector.value = Cookies.get("apiSelector");
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
  }

  const init = () => {
    AfterInit.addButtonEventListeners();
    AfterInit.registerServiceWorker();
    AfterInit.loadFormData();
  }

  init();
}