/**
 * HelgeUtils.ts V1.0
 * @description A collection of general utility functions not connected to a
 * specific project.
 *
 * Copyright by Helge Tobias Kosuch 2024 */
// import {Deepgram} from "../node_modules/@deepgram/sdk/dist/module/index.js";
export var HelgeUtils;
(function (HelgeUtils) {
    let Exceptions;
    (function (Exceptions) {
        /**
         * Reporting of exceptions in callbacks is sometimes very bad.
         * Therefore, exceptions should always be caught and then passed
         * to this function, which alerts in a useful way.
         *
         * This also used to re-throw, but sometimes that is not good,
         * thus think about if you want to do this after calling this.
         *
         * Use this to throw an exception with a stack trace:
         *    throw new Error("Some useful error message")
         *
         * @return void
         *
         * @param e {Error} The exception, preferably of type Error,
         *        because then a stack trace will be displayed.
         <pre>
         IntelliJ Live Template
         <template name="try-catch-unhandled-exception" value="try {&#10;    $SELECTION$&#10;} catch(e) {&#10;    unhandledExceptionAlert(e);&#10;}" description="" toReformat="true" toShortenFQNames="true">
         <context>
         <option name="JAVA_SCRIPT" value="true" />
         <option name="JSX_HTML" value="false" />
         <option name="JS_CLASS" value="false" />
         <option name="JS_DOT_PROPERTY_ACCESS" value="false" />
         <option name="JS_EXPRESSION" value="false" />
         </context>
         </template>
         </pre>*/
        Exceptions.unhandledExceptionAlert = (e) => {
            let str = "Unhandled EXCEPTION! :" + e;
            if (e instanceof Error) {
                str += ", Stack trace:\n";
                str += e.stack;
            }
            /* Do NOT call console.trace() here because the stack trace
               of this place here is not helpful, but instead very
               confusing. */
            console.log(str);
            alert(str);
            return str;
        };
        // noinspection JSArrowFunctionBracesCanBeRemoved
        /** swallowAll
         * Wraps the given void function in a try-catch block and swallows any exceptions.
         *
         * Example use:
         const produceError = () => {throw "error"}
         const noError = swallowAll(produceError);
         noError(); // Does NOT throw an exception.
         *
         * @param func
         */
        Exceptions.swallowAll = (func) => {
            return (...args) => {
                try {
                    func(...args);
                }
                catch (e) {
                    // empty on purpose
                }
            };
        };
        /** Alias for swallowAll
         * @deprecated */
        Exceptions.catchAll = Exceptions.swallowAll;
        /** Alias for swallowAll
         * @deprecated */
        Exceptions.unthrow = Exceptions.swallowAll;
        /** callAndAlertAboutException(...)
         *
         * Used to wrap around UI function which would otherwise just fail silently.
         *
         * Often it is good to copy this function to your code
         * and bake an even better reporting mechanism in.
         *
         Use this template to use this:
         <pre>
         buttonWhatever: () => callAndAlertAboutException(() => {
         // your code here
         })
         </pre>
         */
        Exceptions.callAndAlertAboutException = function (f) {
            try {
                f();
            }
            catch (error) {
                Exceptions.unhandledExceptionAlert(error);
                throw error;
            }
        };
        /**
         * Calls the function and swallows any exceptions. */
        Exceptions.callSwallowingExceptions = (f) => {
            try {
                f();
            }
            catch (err) {
                console.log("Ignored: ");
                console.log(err);
            }
        };
        /**
         * Displays an alert with the given message and throws the message as an exception.
         *
         * @param msg {String} */
        Exceptions.alertAndThrow = (...msg) => {
            console.trace();
            // alert(msg)
            throw new Error(...msg);
        };
        /**
         *
         * Example:
         * <pre>
         try {
         } catch (error) {
         catchSpecificError(RangeError, 'Invalid time value', (error) => {}
         }
         </pre>
         *
         * @param errorType
         * @param callback
         * @param wantedErrorMsg
         */
        Exceptions.catchSpecificError = (errorType
        // eslint-disable-next-line @typescript-eslint/ban-types
        , callback, wantedErrorMsg = null) => (error) => {
            if (error instanceof errorType
                && (wantedErrorMsg === null && error.message === wantedErrorMsg)) {
                callback(error);
            }
            else {
                throw error;
            }
        };
        /**
         * Like "eval(...)" but a little safer and with better performance.
         *
         * The codeStr must be known to be from a secure source, because
         * injection of code through this is easy. This is intentional to
         * allow important features.
         * */
        Exceptions.evalBetter = function (codeStr, args) {
            if (Strings.isBlank(codeStr)) {
                Exceptions.alertAndThrow("evalBetter(): codeStr must not be empty");
            }
            return HelgeUtils.executeFunctionBody(" return (" + codeStr + ")", args);
        };
        // end of Exceptions
    })(Exceptions = HelgeUtils.Exceptions || (HelgeUtils.Exceptions = {}));
    /**
     * Somewhat like eval(...) but a little safer and with better performance.
     *
     * In contrast to {@link evalBetter} here you can and must use a return
     * statement if you want to return a value.
     *
     * Docs about the method: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
     *
     * @param functionBodyStr
     * @param args {object} An object with entities, which you want to give the code
     *        in the string access to.
     * */
    HelgeUtils.executeFunctionBody = (functionBodyStr, args) => Function(`
          "use strict"
          return function(args) {
              ` + functionBodyStr + `
          }
        `)()(args);
    /** Returns true if the parameter is not undefined. */
    HelgeUtils.isDefined = (x) => {
        let u;
        // noinspection JSUnusedAssignment
        return x !== u;
    };
    /**
     * createImmutableStrictObject({}).doesNotExist will
     * throw an error, in contrast to {}.whatEver, which
     * will not.
     */
    HelgeUtils.createImmutableStrictObject = (input) => {
        const handler = {
            get: function (target, prop) {
                if (prop in target) {
                    return target[prop];
                }
                else {
                    throw new Error("Property ${prop} does not" +
                        " exist on target object.");
                }
            },
            set: function (target, prop, value) {
                HelgeUtils.suppressUnusedWarning(target, prop, value);
                throw new Error("This object is immutable." +
                    " You cannot change ${prop}.");
            }
        };
        return new Proxy(input, handler);
    };
    /**
     * A function that does nothing. I use it to avoid "unused variable" warnings.
     *
     * Old name: nop
     *
     * @param args
     */
    HelgeUtils.suppressUnusedWarning = (...args) => {
        const flag = false;
        if (flag) {
            console.log(args);
        }
    };
    let Tests;
    (function (Tests) {
        /** Inline this function! */
        Tests.runTestsOnlyToday = () => {
            const RUN_TESTS = new Date().toISOString().slice(0, 10) === "2024-01-24";
            HelgeUtils.suppressUnusedWarning(RUN_TESTS);
        };
        Tests.assert = (condition, ...output) => {
            if (condition)
                // Everything is fine, just return:
                return;
            // It is NOT fine! Throw an error:
            console.log(...output);
            HelgeUtils.Exceptions.alertAndThrow(...output);
        };
        /**
         * V2 27.04.2024
         */
        Tests.assertEquals = (actual, expected, message = null) => {
            const expectedJson = JSON.stringify(expected);
            const actualJson = JSON.stringify(actual);
            if (actualJson !== expectedJson) {
                if (actual instanceof Date && expected instanceof Date
                    && actual.getTime() === expected.getTime())
                    return;
                console.log("*************** expected:\n" + expectedJson);
                console.log("*************** actual  :\n" + actualJson);
                if (typeof expected === 'string' && typeof actual === 'string') {
                    const expectedShortened = expected.substring(0, 20).replace(/\n/g, '');
                    const actualShortened = actual.substring(0, 20).replace(/\n/g, '');
                    HelgeUtils.Exceptions.alertAndThrow(message
                        || `Assertion failed: Expected ${expectedShortened}, but got ${actualShortened}`);
                }
                HelgeUtils.Exceptions.alertAndThrow(message
                    || `Assertion failed: Expected ${expectedJson}, but got ${actualJson}`);
            }
        };
    })(Tests = HelgeUtils.Tests || (HelgeUtils.Tests = {}));
    HelgeUtils.assert = Tests.assert;
    HelgeUtils.assertEquals = Tests.assertEquals;
    HelgeUtils.consoleLogTmp = (...args) => {
        args.forEach(arg => console.log(arg));
    };
    HelgeUtils.consoleLogTheDifference = (actual, expected) => {
        console.log("*************** actual  :\n" + actual);
        // @ts-ignore
        if (1 === 0) {
            console.log("*************** expected:\n" + expected);
        }
        let diffCount = 0;
        // @ts-ignore
        if (1 === 0) {
            for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
                if (expected[i] !== actual[i]) {
                    if (diffCount === 0) {
                        console.log("Difference at index " + i);
                        console.log(expected.substring(i, i + 80));
                        console.log(actual.substring(i, i + 80));
                    }
                    console.log(expected[i] + "," + actual[i]);
                    diffCount++;
                    if (diffCount > 8) {
                        break;
                    }
                }
            }
        }
    };
    HelgeUtils.testRemoveElements = () => {
        const tagsToRemove = ['tag1', 'tag2', 'tag3'];
        // Deep copy of tagsToRemove
        const testTagsArray = JSON.parse(JSON.stringify(tagsToRemove));
        //print('testTagsArray: '+testTagsArray.join(' ')+'<br>')
        testTagsArray.push('NotToBeRemoved');
        //print('removeElements test: '
        //  +removeElements(testTagsArray,tagsToRemove)+'<br>')
        HelgeUtils.assert(HelgeUtils.removeElements(testTagsArray, tagsToRemove).length === 1, "removeElements failed");
    };
    /**
     * removeElements
     *
     * @param input is an array of elements
     * @param toBeRemoved a list of elements which should be removed.
     *
     * @return *[] list with the elements removed
     */
    HelgeUtils.removeElements = (input, toBeRemoved) => {
        let output = [];
        for (let i = 0; i < input.length; i++) {
            let element = input[i];
            if (!toBeRemoved.includes(element)) {
                output.push(element);
            }
        }
        return output;
    };
    let Strings;
    (function (Strings) {
        /** Returns the index of the first occurrence of the given regex in the string.
         *
         * @param input
         * @param regex
         * @param startpos
         */
        Strings.regexIndexOf = (input, regex, startpos) => {
            const indexOf = input.substring(startpos || 0).search(regex);
            return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
        };
        /**
         * @deprecated Use regexIndexOf instead.
         * @see regexIndexOf
         */
        Strings.indexOfWithRegex = Strings.regexIndexOf;
        Strings.regexLastIndexOf = (input, regex, startpos) => {
            regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiline ? "m" : ""));
            if (typeof (startpos) == "undefined") {
                startpos = input.length;
            }
            else if (startpos < 0) {
                startpos = 0;
            }
            const stringToWorkWith = input.substring(0, startpos + 1);
            let lastIndexOf = -1;
            let nextStop = 0;
            let result;
            while ((result = regex.exec(stringToWorkWith)) != null) {
                lastIndexOf = result.index;
                regex.lastIndex = ++nextStop;
            }
            return lastIndexOf;
        };
        /**
         * @deprecated Use regexLastIndexOf instead.
         */
        Strings.lastIndexOfWithRegex = Strings.regexLastIndexOf;
        /**
         * Trim whitespace but leave a single newline at the end if there is
         * any whitespace that includes a newline.
         */
        Strings.trimExceptASingleNewlineAtTheEnd = (input) => {
            // Check for whitespace including a newline at the end
            if (/\s*\n\s*$/.test(input)) {
                // Trim and leave a single newline at the end
                return input.replace(/\s+$/, '\n');
            }
            else {
                // Just trim normally
                return input.trim();
            }
        };
        Strings.toUppercaseFirstChar = (input) => {
            if (input.length === 0)
                return input;
            const specialChars = {
                'ü': 'Ü',
                'ö': 'Ö',
                'ä': 'Ä'
            };
            const firstChar = input.charAt(0);
            return (specialChars[firstChar] || firstChar.toLocaleUpperCase()) + input.slice(1);
        };
        Strings.escapeRegExp = (str) => {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        };
        /**
         * text.substring(leftIndex, rightIndex) is the string between the delimiters. */
        class DelimiterSearch {
            delimiter;
            constructor(delimiter) {
                this.delimiter = delimiter;
            }
            leftIndex(text, startIndex) {
                return DelimiterSearch.index(this.delimiter, text, startIndex, false);
            }
            rightIndex(text, startIndex) {
                return DelimiterSearch.index(this.delimiter, text, startIndex, true);
            }
            /** If search backwards the position after the delimiter is */
            static index(delimiter, text, startIndex, searchForward) {
                const searchBackward = !searchForward;
                if (searchBackward) {
                    if (startIndex === 0)
                        return 0;
                    // If the starIndex is at the start of a delimiter we want to return the index of the start of the string before this delimiter:
                    startIndex--;
                }
                const step = searchForward ? 1 : -1;
                for (let i = startIndex; searchForward ? i < text.length : i >= 0; i += step) {
                    if (text.substring(i, i + delimiter.length) === delimiter) {
                        return i
                            + (searchForward ? 0 : delimiter.length);
                    }
                }
                return searchForward ? text.length : 0;
            }
            static runTests = () => {
                this.testDelimiterSearch();
                this.testDeleteBetweenDelimiters();
            };
            static testDelimiterSearch = () => {
                const delimiter = '---\n';
                const instance = new DelimiterSearch(delimiter);
                const runTest = (input, index, expected) => HelgeUtils.assertEquals(input.substring(instance.leftIndex(input, index), instance.rightIndex(input, index)), expected);
                {
                    const inputStr = "abc" + delimiter;
                    runTest(inputStr, 0, "abc");
                    runTest(inputStr, 3, "abc");
                    runTest(inputStr, 4, "");
                    runTest(inputStr, 3 + delimiter.length, "");
                    runTest(inputStr, 3 + delimiter.length + 1, "");
                }
                {
                    const inputStr = delimiter + "abc";
                    runTest(inputStr, 0, "");
                    runTest(inputStr, delimiter.length, "abc");
                    runTest(inputStr, delimiter.length + 3, "abc");
                }
            };
            /** Deletes a note from the given text.
             * @param input - The text to delete from.
             * @param left - The index of the left delimiter.
             * @param right - The index of the right delimiter.
             * @param delimiter - The delimiter.
             * */
            static deleteNote = (input, left, right, delimiter) => {
                const str1 = (input.substring(0, left) + input.substring(right)).replaceAll(delimiter + delimiter, delimiter);
                if (str1 === delimiter + delimiter)
                    return "";
                if (str1.startsWith(delimiter))
                    return str1.substring(delimiter.length);
                if (str1.endsWith(delimiter))
                    return str1.substring(0, str1.length - delimiter.length);
                return str1;
            };
            static testDeleteBetweenDelimiters = () => {
                const delimiter = ')))---(((\n';
                const runTest = (cursorPosition, input, expected) => {
                    const delimiterSearch = new Strings.DelimiterSearch(delimiter);
                    const left = delimiterSearch.leftIndex(input, cursorPosition);
                    const right = delimiterSearch.rightIndex(input, cursorPosition);
                    HelgeUtils.assertEquals(DelimiterSearch.deleteNote(input, left, right, delimiter), expected);
                };
                runTest(0, "abc" + delimiter, "");
                runTest(delimiter.length, delimiter + "abc", "");
                runTest(delimiter.length, delimiter + "abc" + delimiter, "");
                runTest(1 + delimiter.length, "0" + delimiter + "abc" + delimiter + "1", "0" + delimiter + "1");
            };
        } //end of class DelimiterSearch
        Strings.DelimiterSearch = DelimiterSearch;
        Strings.runTests = function () {
            Strings.testRemoveEmojis();
            Strings.Whitespace.runTests();
            DelimiterSearch.runTests();
        };
        Strings.removeEmojis = (str) => str.replace(/[^a-zA-Z0-9 _\-üöäÜÖÄß]/g, "");
        Strings.testRemoveEmojis = () => {
            const runTest = (input, expected) => {
                HelgeUtils.assertEquals(Strings.removeEmojis(input), expected, "testRemoveEmojis failed");
            };
            runTest("a👨‍👩‍👧‍👦b", "ab");
            runTest("Td🏗️", "Td");
        };
        /** Return a string representation of a number, with the leading zero removed.
         * Example: numToStr(0.5) returns ".5". */
        Strings.numToStr = (num) => num.toString().replace("0.", ".");
        Strings.tagsStringToArray = (input) => Strings.Whitespace.replaceWhitespaceStretchesWithASingleSpace(input).trim().split(" ");
        Strings.Whitespace = class WhitespaceClass {
            static runTests() {
                this.testRemoveLeadingWhitespace();
                this.testReplaceWhitespaceStretchesWithASingleSpace();
            }
            /*************
             * Replace each stretch of whitespace in a string with a single underscore.
             * Gotchas: This also removes leading and trailing whitespace.
             * For easier comparing in unit tests. */
            static replaceWhitespaceStretchesWithASingleUnderscore(inputString) {
                return inputString.replace(/[ \t]+/gm, '_');
            }
            static replaceTabAndSpaceStretchesWithASingleSpace(inputString) {
                return inputString.replace(/[ \t]+/gm, ' ');
            }
            /************* replaceWhitespaceStretchesWithASingleSpace
             * replace each stretch of whitespace in a string with a single space
             */
            static replaceWhitespaceStretchesWithASingleSpace(str) {
                return str.replace(/\s+/g, " ");
            }
            static testReplaceWhitespaceStretchesWithASingleSpace() {
                let str = "This   is \t\t\n\n\r  a  \t  string   with   multiple   spaces";
                let replaced = this.replaceWhitespaceStretchesWithASingleSpace(str);
                if (replaced === "This is a string with multiple spaces") {
                    // blank on purpose
                }
                else {
                    throw "testReplaceWhitespaceStretchesWithASingleSpace failed.";
                }
            }
            static standardizeLeadingWhitespace(inputString) {
                return WhitespaceClass.replaceLeadingWhitespace((" " + inputString).replace(/^/gm, " "), '      ');
            }
            static replaceLeadingWhitespace(inputString, replacement) {
                return inputString.replace(/^\s+/gm, replacement);
            }
            static removeLeadingWhitespace(inputString) {
                return WhitespaceClass.replaceLeadingWhitespace(inputString, '');
            }
            static testRemoveLeadingWhitespace() {
                const input = `
    This is a test.`;
                const expected = `This is a test.`;
                const result = this.removeLeadingWhitespace(input);
                if (result !== expected) {
                    console.log('testRemoveLeadingWhitespace failed');
                    HelgeUtils.consoleLogTheDifference(result, expected);
                    throw "testRemoveLeadingWhitespace failed";
                }
            }
            static removeAllSpaces(inputString) {
                return inputString.replace(/\s/g, '');
            }
        };
        /**
         * In the given template input string, replace all occurrences of ${key}
         * with the value of the key in the replacements object.
         * Example:
         * const input = "Hello ${name}, you are ${age} years old."
         * const replacements = { name: "John", age: 25 }
         * const result = formatString(input, replacements)
         * // result is now "Hello John, you are 25 years old." */
        Strings.formatString = (input, replacements) => input.replace(/\${(.*?)}/g, (_, key) => {
            // @ts-ignore
            return replacements[key];
        });
        Strings.isBlank = (input) => {
            if (!input) {
                return true;
            }
            return input.trim() === "";
        };
        /* As of 2023 this is not built into JS or TS. */
        Strings.isNotBlank = (input) => input.trim().length !== 0;
        Strings.removeLineBreaks = (input) => {
            if (!input) {
                return input;
            }
            return input.replace(/(\r\n|\n|\r)/gm, "");
        };
    })(Strings = HelgeUtils.Strings || (HelgeUtils.Strings = {}));
    /* Returns a random element of the given array */
    HelgeUtils.randomElementOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
    HelgeUtils.runTests = function () {
        HelgeUtils.testRemoveElements();
        HelgeUtils.DatesAndTimes.runTests();
        Strings.runTests();
    };
    let TTS;
    (function (TTS) {
        /**
         * Always fails with error code 400 :(
         *
         * https://platform.openai.com/docs/api-reference/audio/createSpeech
         */
        TTS.withOpenAi = async (input, apiKey) => {
            const formData = new FormData();
            formData.append("model", "tts-1"); // One of the available TTS models: tts-1 or tts-1-hd
            formData.append('input', input);
            formData.append('voice', "alloy"); //  Supported voices are alloy, echo, fable, onyx, nova, and shimmer. Previews of the voices are available in the Text to speech guide: https://platform.openai.com/docs/guides/text-to-speech/voice-options
            // formData.append('speed', ".5") // from 0.25 to 4.0
            console.log("apiKey==" + apiKey);
            const response = await fetch(
            // "https://corsproxy.io/?" + encodeURIComponent
            ("https://api.openai.com/v1/audio/speech"), {
                method: 'GET', // GET only for testing, must be POST later!
                // headers: {
                //   'Authorization': `Bearer ${apiKey}`,
                //   "Content-Type": "application/json"
                // },
                // body: formData
            });
            if (!response.ok) {
                const message = `Failed to fetch audio file: ${response.status} ${JSON.stringify(response.body)}`;
                console.log(message);
                throw new Error(message);
            }
            const audioBlob = await response.blob();
            const audioContext = new AudioContext();
            const audioSource = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
            const playSound = audioContext.createBufferSource();
            playSound.buffer = audioSource;
            playSound.connect(audioContext.destination);
            playSound.start();
        };
    })(TTS = HelgeUtils.TTS || (HelgeUtils.TTS = {}));
    let Transcription;
    (function (Transcription) {
        class TranscriptionError extends Error {
            payload;
            constructor(payload) {
                super("TranscriptionError");
                this.name = "TranscriptionError";
                this.payload = payload;
            }
        }
        Transcription.TranscriptionError = TranscriptionError;
        /**
         *
         * Docs: https://docs.speechmatics.com/features
         *
         * @param audioBlob
         * @param apiKey
         **/
        const withSpeechmatics = async (audioBlob, apiKey) => {
            const formData = new FormData();
            formData.append('data_file', audioBlob);
            formData.append('config', JSON.stringify({
                // docs: https://docs.speechmatics.com/jobsapi#tag/JobConfig
                type: 'transcription',
                transcription_config: {
                    operating_point: 'enhanced',
                    language: 'de' //TODO
                }
            }));
            const response = await fetch(
            /* Docs: https://docs.speechmatics.com/introduction/batch-guide */
            "https://asr.api.speechmatics.com/v2/jobs/?", {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: formData
            });
            const result = await response.json();
            return result;
        };
        /**
         *
         * Docs: https://developers.deepgram.com/reference/listen-file
         *
         * @param audioBlob
         * @param apiKey
         * @param useWhisper If false, nova-2 is used currently.
         **/
        const withDeepgram = async (audioBlob, apiKey, useWhisper = false) => {
            const response = await fetch(
            /* Docs: https://developers.deepgram.com/reference/listen-file */
            "https://api.deepgram.com/v1/listen?" +
                (useWhisper ?
                    "model=whisper-large" +
                        "&language=de"
                    :
                        "&detect_language=de" +
                            "&detect_language=en" +
                            // "&dictation=true" + // Will convert comma to , etc
                            "&model=nova-2" +
                            "&numerals=true" +
                            "&punctuate=true"), {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    Authorization: `Token ${apiKey}`,
                    "Content-Type": "audio/wav",
                },
                body: audioBlob
            });
            const result = await response.json();
            // noinspection JSUnresolvedReference
            const maybeTranscription = result?.results?.channels[0]?.alternatives[0]?.transcript;
            if (typeof maybeTranscription === "string")
                return maybeTranscription;
            return result;
        };
        /** Transcribes the given audio blob using the given API key and prompt.
         *
         * @param audioBlob
         * @param apiKey
         * @param prompt Ignored if translateToEnglish==true
         * @param language
         * @param translateToEnglish
         */
        const withOpenAi = async (audioBlob, apiKey, prompt, language = "", translateToEnglish = false) => {
            const formData = new FormData();
            formData.append('file', audioBlob);
            formData.append('model', 'whisper-1'); // Using the largest model
            if (!translateToEnglish)
                formData.append('prompt', prompt);
            /* Language. Anything in a different language will be translated to the target language. */
            formData.append('language', language);
            /*  */
            formData.append('language', language); // e.g. "en". The language of the input audio. Supplying the input language in ISO-639-1 format will improve accuracy and latency.
            // formData.append('temperature', WHISPER_TEMPERATURE) // temperature number Optional
            // Defaults to 0 The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit. https://platform.openai.com/docs/api-reference/audio/createTranscription#audio-createtranscription-temperature
            /* Docs: https://platform.openai.com/docs/api-reference/audio/createTranscription */
            const response = await fetch("https://api.openai.com/v1/audio/"
                + (translateToEnglish ? 'translations' : 'transcriptions'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });
            const result = await response.json();
            if (typeof result.text === "string")
                return result.text;
            return result;
        };
        const withGladia = async (audioBlob, apiKey, prompt = '', language = null) => {
            HelgeUtils.suppressUnusedWarning(prompt);
            // Docs: https://docs.gladia.io/reference/pre-recorded
            const formData = new FormData();
            formData.append('audio', audioBlob);
            /*Value	Description
      manual	manually define the language of the transcription using the language parameter
      automatic single language	default value and recommended choice for most cases - the model will auto-detect the prominent language in the audio, then transcribe the full audio to that language. Segments in other languages will automatically be translated to the prominent language. The mode is also recommended for scenarios where the audio starts in one language for a short while and then switches to another for the majority of the duration
      automatic multiple languages	For specific scenarios where language is changed multiple times throughout the audio (e.g. a conversation between 2 people, each speaking a different language.).
      The model will continuously detect the spoken language and switch the transcription language accordingly.
      Please note that certain strong accents can possibly cause this mode to transcribe to the wrong language.
      */
            if (language)
                formData.append('language_behaviour', 'automatic multiple languages');
            formData.append('toggle_diarization', 'false');
            // formData.append('transcription_hint', prompt)
            formData.append('output_format', 'txt');
            const result = await (await fetch('https://api.gladia.io/audio/text/audio-transcription/', {
                method: 'POST',
                headers: {
                    'x-gladia-key': apiKey
                },
                body: formData
            })).json();
            const resultText = result?.prediction;
            return resultText;
        };
        Transcription.transcribe = async (api, audioBlob, apiKey, prompt = '', language = "", translateToEnglish = false) => {
            if (!audioBlob || audioBlob.size === 0)
                return "";
            const output = api === "OpenAI" ?
                await withOpenAi(audioBlob, apiKey, prompt, language, translateToEnglish)
                : api === "Deepgram-whisper" ?
                    await withDeepgram(audioBlob, apiKey, true)
                    : api === "Deepgram-nova-2" ?
                        await withDeepgram(audioBlob, apiKey)
                        // @ts-ignore
                        : api === "Speechmatics" ?
                            await withSpeechmatics(audioBlob, apiKey)
                            : await withGladia(audioBlob, apiKey);
            if (typeof output === "string")
                return output;
            throw new TranscriptionError(output);
        };
    })(Transcription = HelgeUtils.Transcription || (HelgeUtils.Transcription = {}));
    /* NOT reliable in Anki and AnkiDroid. */
    let ReplaceByRules;
    (function (ReplaceByRules) {
        class ReplaceRules {
            rules;
            constructor(rules) {
                this.rules = rules;
            }
            applyTo = (subject) => {
                return ReplaceByRules.replaceByRules(subject, this.rules, false, false).resultingText;
            };
            applyToWithLog = (subject) => {
                return ReplaceByRules.replaceByRules(subject, this.rules, false, true);
            };
        }
        ReplaceByRules.ReplaceRules = ReplaceRules;
        class WholeWordReplaceRules {
            rules;
            constructor(rules) {
                this.rules = rules;
            }
            applyTo = (subject) => {
                return ReplaceByRules.replaceByRules(subject, this.rules, true, false).resultingText;
            };
            applyToWithLog = (subject) => {
                return ReplaceByRules.replaceByRules(subject, this.rules, true, true);
            };
        }
        ReplaceByRules.WholeWordReplaceRules = WholeWordReplaceRules;
        class WholeWordPreserveCaseReplaceRules {
            rules;
            constructor(rules) {
                this.rules = rules;
            }
            applyTo = (subject) => {
                return ReplaceByRules.replaceByRules(subject, this.rules, true, false, true).resultingText;
            };
            applyToWithLog = (subject) => {
                return ReplaceByRules.replaceByRules(subject, this.rules, true, true, true);
            };
        }
        ReplaceByRules.WholeWordPreserveCaseReplaceRules = WholeWordPreserveCaseReplaceRules;
        /**
         * NOT reliable in Anki and AnkiDroid.
         *
         * Deprecated! Use ReplaceRules or WholeWordReplaceRules instead.
         *
         * Do NOT change the syntax of the rules, because they must be kept compatible with
         * https://github.com/No3371/obsidian-regex-pipeline#readme
         *
         * @param subject - The text to replace in.
         * @param allRules - The rules to apply.
         * @param wholeWords - If true, only whole words are replaced.
         * @param logReplacements - If true, a log of the replacements is returned.
         * @param preserveCase - If true, the case of the replaced word is preserved.
         */
        ReplaceByRules.replaceByRules = (subject, allRules, wholeWords = false, logReplacements = false, preserveCase = false) => {
            const possiblyWordBoundaryMarker = wholeWords ? '\\b' : '';
            let appliedRuleNumber = 0;
            let log = 'input string before replacements == \n' + subject + "\n)))---(((\n";
            function applyRule(rawTarget, regexFlags, replacementString, replacementFlags) {
                const target = possiblyWordBoundaryMarker + rawTarget + possiblyWordBoundaryMarker;
                // console.log("\n" + target + "\n↓↓↓↓↓\n"+ replacement)
                let regex = regexFlags.length == 0 ?
                    new RegExp(target, 'gm') // Noted that gm flags are basically
                    // necessary for this plugin to be useful, you seldom want to
                    // replace only 1 occurrence or operate on a note only contains 1 line.
                    : new RegExp(target, regexFlags);
                if (logReplacements && subject.search(regex) !== -1) {
                    const countRegexMatches = (input, pattern) => {
                        const matches = input.match(pattern);
                        return matches ? matches.length : 0;
                    };
                    const n = countRegexMatches(subject, regex);
                    const ruleStr = `"${rawTarget}"${regexFlags}`
                        + `->"${replacementString}"${replacementFlags}`;
                    log += `(${appliedRuleNumber}) n=${n}: ${ruleStr};\n`;
                    appliedRuleNumber++;
                }
                if (replacementFlags == 'x')
                    subject = subject.replace(regex, '');
                else
                    subject = subject.replace(regex, replacementString);
            }
            let rule;
            const ruleParser = /^"(.+?)"([a-z]*?)(?:\r\n|\r|\n)?->(?:\r\n|\r|\n)?"(.*?)"([a-z]*?)(?:\r\n|\r|\n)?$/gmus;
            while ((rule = ruleParser.exec(allRules)) /* This works fine in a Chrome
             but at least sometimes returns falsely null inside Anki and
              AnkiDroid. */) {
                const [, target, regexFlags, replacementString, replacementFlags] = rule;
                applyRule(target, regexFlags, replacementString, replacementFlags);
                if (preserveCase) {
                    applyRule(Strings.toUppercaseFirstChar(target), regexFlags, Strings.toUppercaseFirstChar(replacementString), replacementFlags);
                }
            }
            return {
                resultingText: subject,
                log: log
            };
        };
        /**
         * Deprecated! Use ReplaceRules or WholeWordReplaceRules instead.
         */
        ReplaceByRules.replaceByRulesAsString = (subject, allRules) => {
            return ReplaceByRules.replaceByRules(subject, allRules, false, false).resultingText;
        };
    })(ReplaceByRules = HelgeUtils.ReplaceByRules || (HelgeUtils.ReplaceByRules = {}));
    HelgeUtils.memoize = (func) => {
        const cache = new Map();
        return (...args) => {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            else {
                const result = func(...args);
                cache.set(key, result);
                return result;
            }
        };
    };
    HelgeUtils.extractHighlights = (input) => {
        const regex = /={2,3}([^=]+)={2,3}/g;
        let matches = [];
        let match;
        while ((match = regex.exec(input)) !== null) {
            matches.push(match[1].trim());
        }
        return matches;
    };
    let Misc;
    (function (Misc) {
        /** nullFilter
         *
         * Throws an exception if the input is null.
         *
         * I use "strictNullChecks": true to avoid bugs. Therefore, I need this
         * where that is too strict.
         *
         * Use example:
         * const elementWithId = (id: string) =>
         *   nullFilter<HTMLElement>(HtmlUtils.elementWithId, id)
         */
        // eslint-disable-next-line @typescript-eslint/ban-types
        Misc.nullFilter = (f, ...parameters) => {
            const untypedNullFilter = (input) => {
                if (input === null)
                    Exceptions.alertAndThrow(`Unexpected null value.`);
                return input;
            };
            return untypedNullFilter(f(...parameters));
        };
        // noinspection SpellCheckingInspection
        /**
         * Converts "Du" to "Ich" and "Dein" to "Mein" and so on.
         */
        Misc.du2ich = (input) => {
            const wordEndReplacements = [
                ["abstellst", "abstelle"],
                ["aktivierst", "aktiviere"],
                ["aktualisierst", "aktualisiere"],
                ["akzentuierst", "akzentuiere"],
                ["akzeptierst", "akzeptiere"],
                ["allegorisierst", "allegorisiere"],
                ["analysierst", "analysiere"],
                ["anstellst", "anstelle"],
                ["antwortest", "antworte"],
                ["arbeitest", "arbeite"],
                ["assoziierst", "assoziiere"],
                ["authentifizierst", "authentifiziere"],
                ["autorisierst", "autorisiere"],
                ["basiert", "basiere"],
                ["baust", "baue"],
                ["beachtest", "beachte"],
                ["bearbeitest", "bearbeite"],
                ["bedankst", "bedanke"],
                ["bedeckst", "bedecke"],
                ["bedenkst", "bedenke"],
                ["bedeutest", "bedeute"],
                ["bedienst", "bediene"],
                ["beeinflusst", "beeinflusse"],
                ["beeinträchtigst", "beeinträchtige"],
                ["beendest", "beende"],
                ["befasst", "befasse"],
                ["befindest", "befinde"],
                ["begeisterst", "begeistere"],
                ["beginnst", "beginne"],
                ["begrüßt", "begrüße"],
                ["behandelst", "behandle"],
                ["behauptest", "behaupte"],
                ["behältst", "behalte"],
                ["bekommst", "bekomme"],
                ["bekämpfst", "bekämpfe"],
                ["bemühst", "bemühe"],
                ["benutzt", "benutze"],
                ["benötigst", "benötige"],
                ["beobachtest", "beobachte"],
                ["berechnest", "berechne"],
                ["bereitest", "bereite"],
                ["berichtest", "berichte"],
                ["beruhst", "beruhe"],
                ["berücksichtigst", "berücksichtige"],
                ["beschleunigst", "beschleunige"],
                ["beschränkst", "beschränke"],
                ["beschwerst", "beschwere"],
                ["beschäftigst", "beschäftige"],
                ["beschützt", "beschütze"],
                ["besitzt", "besitze"],
                ["bestehst", "bestehe"],
                ["bestimmst", "bestimme"],
                ["bestätigst", "bestätige"],
                ["besuchst", "besuche"],
                ["betonst", "betone"],
                ["betrachtest", "betrachte"],
                ["betreibst", "betreibe"],
                ["betrifft", "betrifft"],
                ["beurteilst", "beurteile"],
                ["bewegst", "bewege"],
                ["beweist", "beweise"],
                ["bewertest", "bewerte"],
                ["bewirkst", "bewirke"],
                ["bezahlst", "bezahle"],
                ["beziehst", "beziehe"],
                ["bietest", "biete"],
                ["bildest", "bilde"],
                ["bist", "bin"],
                ["bittest", "bitte"],
                ["bleibst", "bleibe"],
                ["brauchst", "brauche"],
                ["breitest", "breite"],
                ["brichst", "breche"],
                ["bringst", "bringe"],
                ["dankst", "danke"],
                ["darfst", "darf"],
                ["deaktivierst", "deaktiviere"],
                ["deckst", "decke"],
                ["definierst", "definiere"],
                ["demokratisierst", "demokratisiere"],
                ["demonstrierst", "demonstriere"],
                ["denkst", "denke"],
                ["diagnostizierst", "diagnostiziere"],
                ["dienst", "diene"],
                ["differenzierst", "differenziere"],
                ["digitalisierst", "digitalisiere"],
                ["diskutierst", "diskutiere"],
                ["diversifizierst", "diversifiziere"],
                ["doppelst", "dopple"],
                ["dramatisierst", "dramatisiere"],
                ["drehst", "drehe"],
                ["drittelst", "drittele"],
                ["druckst", "drucke"],
                ["drückst", "drücke"],
                ["empfiehlst", "empfehle"],
                ["empfängst", "empfange"],
                ["endest", "ende"],
                ["entdeckst", "entdecke"],
                ["entfernst", "entferne"],
                ["enthältst", "enthalte"],
                ["entscheidest", "entscheide"],
                ["entschuldigst", "entschuldige"],
                ["entspannst", "entspanne"],
                ["entsprichst", "entspreche"],
                ["entstehst", "entstehe"],
                ["entwickelst", "entwickle"],
                ["erfasst", "erfasse"],
                ["erfolgst", "erfolge"],
                ["erforderst", "erfordere"],
                ["erfährst", "erfahre"],
                ["erfüllst", "erfülle"],
                ["ergibst", "ergebe"],
                ["ergreifst", "ergreife"],
                ["erhebst", "erhebe"],
                ["erholst", "erhole"],
                ["erhältst", "erhalte"],
                ["erhöhst", "erhöhe"],
                ["erinnerst", "erinnere"],
                ["erkennst", "erkenne"],
                ["erklärst", "erkläre"],
                ["erlaubst", "erlaube"],
                ["erlebst", "erlebe"],
                ["erleichterst", "erleichtere"],
                ["erlässt", "erlasse"],
                ["ermittelst", "ermittle"],
                ["ermunterst", "ermuntere"],
                ["ermöglichst", "ermögliche"],
                ["erreichst", "erreiche"],
                ["erscheinst", "erscheine"],
                ["erschreckst", "erschrecke"],
                ["ersetzt", "ersetze"],
                ["erstellst", "erstelle"],
                ["erstreckst", "erstrecke"],
                ["ersuchst", "ersuche"],
                ["erteilst", "erteile"],
                ["erwartest", "erwarte"],
                ["erweiterst", "erweitere"],
                ["erwärmst", "erwärme"],
                ["erzeugst", "erzeuge"],
                ["erzielst", "erziele"],
                ["erzählst", "erzähle"],
                ["exportierst", "exportiere"],
                ["faselst", "fasele"],
                ["feierst", "feiere"],
                ["findest", "finde"],
                ["fliegst", "fliege"],
                ["folgst", "folge"],
                ["forderst", "fordere"],
                ["formst", "forme"],
                ["fragst", "frage"],
                ["freist", "freie"],
                ["funktionierst", "funktioniere"],
                ["fährst", "fahre"],
                ["fällst", "falle"],
                ["fängst", "fange"],
                ["förderst", "fördere"],
                ["fügst", "füge"],
                ["fühlst", "fühle"],
                ["führst", "führe"],
                ["garantierst", "garantiere"],
                ["gebietest", "gebiete"],
                ["gefällst", "gefalle"],
                ["gehst", "gehe"],
                ["gehörst", "gehöre"],
                ["gelangst", "gelange"],
                ["genießt", "genieße"],
                ["gerätst", "gerate"],
                ["geschieht", "geschehe"],
                ["gestaltest", "gestalte"],
                ["gestattest", "gestatte"],
                ["gewinnst", "gewinne"],
                ["gewährleistest", "gewährleiste"],
                ["gewährst", "gewähre"],
                ["gibst", "gebe"],
                ["giltst", "gelte"],
                ["glaubst", "glaube"],
                ["gleichst", "gleiche"],
                ["globalisierst", "globalisiere"],
                ["greifst", "greife"],
                ["grenzt", "grenze"],
                ["gründest", "gründe"],
                ["hast", "habe"],
                ["hakst", "hake"],
                ["handelst", "handle"],
                ["harmonisierst", "harmonisiere"],
                ["hast", "habe"],
                ["heiratest", "heirate"],
                ["heißt", "heiße"],
                ["hilfst", "helfe"],
                ["hoffst", "hoffe"],
                ["holst", "hole"],
                ["hältst", "halte"],
                ["hängst", "hänge"],
                ["hörst", "höre"],
                ["identifizierst", "identifiziere"],
                ["ideologisierst", "ideologisiere"],
                ["illustrierst", "illustriere"],
                ["importierst", "importiere"],
                ["informierst", "informiere"],
                ["inspirierst", "inspiriere"],
                ["installierst", "installiere"],
                ["intensivierst", "intensiviere"],
                ["interessierst", "interessiere"],
                ["interpretierst", "interpretiere"],
                ["investierst", "investiere"],
                ["ironisierst", "ironisiere"],
                ["jungst", "junge"],
                ["kannst", "kann"],
                ["kantest", "kante"],
                ["karikierst", "karikiere"],
                ["kategorisierst", "kategorisiere"],
                ["kaufst", "kaufe"],
                ["kennst", "kenne"],
                ["klassifizierst", "klassifiziere"],
                ["klickst", "klicke"],
                ["klärst", "kläre"],
                ["knotest", "knote"],
                ["kochst", "koche"],
                ["kommentierst", "kommentiere"],
                ["kommst", "komme"],
                ["komplizierst", "kompliziere"],
                ["konfigurierst", "konfiguriere"],
                ["kontrollierst", "kontrolliere"],
                ["konzentrierst", "konzentriere"],
                ["kopierst", "kopiere"],
                ["korrigierst", "korrigiere"],
                ["kostest", "koste"],
                ["kriegst", "kriege"],
                ["kritisierst", "kritisiere"],
                ["krümelst", "krümele"],
                ["kämpfst", "kämpfe"],
                ["könnest", "könnte"],
                ["kümmerst", "kümmere"],
                ["lachst", "lache"],
                ["langst", "lange"],
                ["lastest", "laste"],
                ["lebst", "lebe"],
                ["legitimierst", "legitimiere"],
                ["legst", "lege"],
                ["leidest", "leide"],
                ["leihst", "leihe"],
                ["leistest", "leiste"],
                ["leitest", "leite"],
                ["lernst", "lerne"],
                ["liebst", "liebe"],
                ["lieferst", "liefere"],
                ["liegst", "liege"],
                ["liest", "lese"],
                ["linkst", "linke"],
                ["listest", "liste"],
                ["loderst", "lodere"],
                ["lächelst", "lächle"],
                ["lädst", "lade"],
                ["ländest", "lande"],
                ["lässt", "lasse"],
                ["läufst", "laufe"],
                ["löschst", "lösche"],
                ["löst", "löse"],
                ["machst", "mache"],
                ["magst", "mag"],
                ["manifestierst", "manifestiere"],
                ["markierst", "markiere"],
                ["mathematisierst", "mathematisiere"],
                ["maximierst", "maximiere"],
                ["meinst", "meine"],
                ["meisterst", "meistere"],
                ["meldest", "melde"],
                ["mengst", "menge"],
                ["minimierst", "minimiere"],
                ["misst", "messe"],
                ["moralisierst", "moralisiere"],
                ["moserst", "mosere"],
                ["musst", "muss"],
                ["navigierst", "navigiere"],
                ["nennst", "nenne"],
                ["nimmst", "nehme"],
                ["nutzt", "nutze"],
                ["optimierst", "optimiere"],
                ["ordnest", "ordne"],
                ["parodierst", "parodiere"],
                ["passierst", "passiere"],
                ["passt", "passe"],
                ["pflanzt", "pflanze"],
                ["philosophierst", "philosophiere"],
                ["planst", "plane"],
                ["poetisierst", "poetisiere"],
                ["politisierst", "politisiere"],
                ["positionierst", "positioniere"],
                ["postest", "poste"],
                ["preist", "preise"],
                ["priorisierst", "priorisiere"],
                ["probst", "probe"],
                ["profitierst", "profitiere"],
                ["prognostizierst", "prognostiziere"],
                ["präsentierst", "präsentiere"],
                ["prüfst", "prüfe"],
                ["punktest", "punkte"],
                ["qualifizierst", "qualifiziere"],
                ["quantifizierst", "quantifiziere"],
                ["ragst", "rage"],
                ["rahmst", "rahme"],
                ["rationalisierst", "rationalisiere"],
                ["reagierst", "reagiere"],
                ["rechnest", "rechne"],
                ["redest", "rede"],
                ["reduzierst", "reduziere"],
                ["regelst", "regele"],
                ["reichst", "reiche"],
                ["reifst", "reife"],
                ["reinigst", "reinige"],
                ["reist", "reise"],
                ["rennst", "renne"],
                ["repräsentierst", "repräsentiere"],
                ["resümierst", "resümiere"],
                ["rettest", "rette"],
                ["rettest", "rette"],
                ["richtest", "richte"],
                ["riechst", "rieche"],
                ["rinnst", "rinne"],
                ["rollst", "rolle"],
                ["romantisierst", "romantisiere"],
                ["rufst", "rufe"],
                ["rückst", "rücke"],
                ["sagst", "sage"],
                ["sammelst", "sammle"],
                ["schadest", "schade"],
                ["schaffst", "schaffe"],
                ["schaltest", "schalte"],
                ["schaust", "schaue"],
                ["scheidest", "scheide"],
                ["scheinst", "scheine"],
                ["scherst", "scherze"],
                ["schichtest", "schichte"],
                ["schickst", "schicke"],
                ["schiebst", "schiebe"],
                ["schließt", "schließe"],
                ["schläfst", "schlafe"],
                ["schlägst", "schlage"],
                ["schmerzt", "schmerze"],
                ["schmilzt", "schmelze"],
                ["schneidest", "schneide"],
                ["schnellst", "schnelle"],
                ["schreibst", "schreibe"],
                ["schreitest", "schreite"],
                ["schuldest", "schulde"],
                ["schätzt", "schätze"],
                ["schönst", "schöne"],
                ["schützt", "schütze"],
                ["sendest", "sende"],
                ["senkst", "senke"],
                ["setzt", "setze"],
                ["sicherst", "sichere"],
                ["siebst", "siebe"],
                ["siehst", "sehe"],
                ["sitzt", "sitze"],
                ["sollst", "soll"],
                ["sonderst", "sondere"],
                ["sorgst", "sorge"],
                ["sortierst", "sortiere"],
                ["sozialisierst", "sozialisiere"],
                ["spaltest", "spalte"],
                ["sparst", "spare"],
                ["speicherst", "speichere"],
                ["spezialisierst", "spezialisiere"],
                ["spielst", "spiele"],
                ["sprichst", "spreche"],
                ["spürst", "spüre"],
                ["stabilisierst", "stabilisiere"],
                ["stammst", "stamme"],
                ["standardisierst", "standardisiere"],
                ["startest", "starte"],
                ["stehst", "stehe"],
                ["steigerst", "steigere"],
                ["stellst", "stelle"],
                ["steuerst", "steuere"],
                ["stilisierst", "stilisiere"],
                ["stimmst", "stimme"],
                ["stirbst", "sterbe"],
                ["stopfst", "stopfe"],
                ["stoßt", "stoße"],
                ["studierst", "studiere"],
                ["stundest", "stunde"],
                ["stärkst", "stärke"],
                ["stürzt", "stürze"],
                ["stützt", "stütze"],
                ["suchst", "suche"],
                ["symbolisierst", "symbolisiere"],
                ["synchronisierst", "synchronisiere"],
                ["synthetisierst", "synthetisiere"],
                ["säufst", "säufe"],
                ["tanzt", "tanze"],
                ["teilst", "teile"],
                ["testest", "teste"],
                ["tickst", "ticke"],
                ["treibst", "treibe"],
                ["trennst", "trenne"],
                ["triffst", "treffe"],
                ["trinkst", "trinke"],
                ["trittst", "trete"],
                ["trägst", "trage"],
                ["tötest", "töte"],
                ["umfasst", "umfasse"],
                ["umgibst", "umgebe"],
                ["unterliegst", "unterliege"],
                ["unternimmst", "unternehme"],
                ["unterscheidest", "unterscheide"],
                ["unterstützt", "unterstütze"],
                ["untersuchst", "untersuche"],
                ["validierst", "validiere"],
                ["verbesserst", "verbessere"],
                ["verbindest", "verbinde"],
                ["verbrichst", "verbreche"],
                ["verbringst", "verbringe"],
                ["verdienst", "verdiene"],
                ["vereinfachst", "vereinfache"],
                ["verfolgst", "verfolge"],
                ["verfährst", "verfahre"],
                ["verfügst", "verfüge"],
                ["vergisst", "vergesse"],
                ["vergleichst", "vergleiche"],
                ["vergrößerst", "vergrößere"],
                ["verhinderst", "verhindere"],
                ["verhältst", "verhalte"],
                ["verifizierst", "verifiziere"],
                ["verkaufst", "verkaufe"],
                ["verlangst", "verlange"],
                ["verleihst", "verleihe"],
                ["verlierst", "verliere"],
                ["verlässt", "verlasse"],
                ["vermeidest", "vermeide"],
                ["verringerst", "verringere"],
                ["verrätst", "verrate"],
                ["verscheidest", "verscheide"],
                ["verschiebst", "verschiebe"],
                ["verschwindest", "verschwinde"],
                ["versprichst", "verspreche"],
                ["versteckst", "verstecke"],
                ["verstehst", "verstehe"],
                ["verstärkst", "verstärke"],
                ["versuchst", "versuche"],
                ["verteidigst", "verteidige"],
                ["vertraust", "vertraue"],
                ["vertrittst", "vertrete"],
                ["vervielfältigst", "vervielfältige"],
                ["vervollständigst", "vervollständige"],
                ["verwaltest", "verwalte"],
                ["verwehst", "verwehe"],
                ["verwendest", "verwende"],
                ["verzichtest", "verzichte"],
                ["veränderst", "verändere"],
                ["veröffentlichst", "veröffentliche"],
                ["vorstellst", "vorstelle"],
                ["wagst", "wage"],
                ["wartest", "warte"],
                ["webst", "webe"],
                ["wechselst", "wechsle"],
                ["weist", "weise"],
                ["weißt", "weiß"],
                ["wendest", "wende"],
                ["wertest", "werte"],
                ["west", "weste"],
                ["wettest", "wette"],
                ["wiederholst", "wiederhole"],
                ["willst", "will"],
                ["winkst", "winke"],
                ["wirfst", "werfe"],
                ["wirkst", "wirke"],
                ["wirst", "werde"],
                ["wohnst", "wohne"],
                ["wunderst", "wundere"],
                ["wählst", "wähle"],
                ["wünschst", "wünsche"],
                ["zahlst", "zahle"],
                ["zeichnest", "zeichne"],
                ["zeigst", "zeige"],
                ["zerstörst", "zerstöre"],
                ["zertifizierst", "zertifiziere"],
                ["ziehst", "ziehe"],
                ["zielst", "ziele"],
                ["zivilisierst", "zivilisiere"],
                ["zählst", "zähle"],
                ["änderst", "ändere"],
                ["äußerst", "äußere"],
                ["öffnest", "öffne"],
                ["überlebst", "überlebe"],
                ["überlegst", "überlege"],
                ["übermittelst", "übermittele"],
                ["übernimmst", "übernehme"],
                ["überprüfst", "überprüfe"],
                ["übertriffst", "übertriff"],
                ["überträgst", "übertrage"],
                ["überwachst", "überwache"],
                ["überzeugst", "überzeuge"],
                ["überziehst", "überziehe"],
                ["programmierst", "programmiere"],
                ["kommst", "komme"],
                ["ärgerst", "ärgere"],
                ["gewöhnst", "gewöhne"],
                // ["raufgehst"    ,""                          ],
                // ["anpackst"     ,""                          ],
                // ["einpackst"    ,""                          ],
                // ["abhakst"      ,""                          ],
                // ["",""                          ],
            ];
            const wholeWordReplacements = [
                ["tust", "tue"],
                ["isst", "esse"],
                ["hättest", "hätte"],
                ["übst", "übe"],
                ["du", "ich"],
                ["dein", "mein"],
                ["deinem", "meinem"],
                ["deine", "meine"],
                ["deiner", "meiner"],
                ["dich", "mich"],
                ["dir", "mir"],
            ];
            let output = input;
            const replace = (replacements1, wordBoundaryAtStart) => {
                /* If you remove the \\b word boundary at the beginning in the following, it
                 would mess up many words, e. g. all words which end with "du" or "dein". */
                const regex = (target) => {
                    let maybeStartWordBoundary = "";
                    if (wordBoundaryAtStart)
                        maybeStartWordBoundary = "\\b";
                    return new RegExp(`${maybeStartWordBoundary}${target}\\b`, 'g');
                };
                for (const [duWort, ichWort] of replacements1) {
                    output = output
                        .replaceAll(regex(duWort), ichWort)
                        .replaceAll(regex(Strings.toUppercaseFirstChar(duWort)), Strings.toUppercaseFirstChar(ichWort));
                }
            };
            replace(wholeWordReplacements, true);
            replace(wordEndReplacements, false);
            return output;
        };
        //end of namespace Misc:
    })(Misc = HelgeUtils.Misc || (HelgeUtils.Misc = {}));
    /**
     * Source: https://stackoverflow.com/questions/17528749/semaphore-like-queue-in-javascript
     */
    let Semaphore;
    (function (Semaphore) {
        class Queue {
            running;
            autorun;
            queue;
            constructor(autorun = true, queue = []) {
                this.running = false;
                this.autorun = autorun;
                this.queue = queue;
            }
            //ts-ignore
            add(cb) {
                this.queue.push((value) => {
                    const finished = new Promise((resolve, reject) => {
                        const callbackResponse = cb(value);
                        if (callbackResponse !== false) {
                            resolve(callbackResponse);
                        }
                        else {
                            reject(callbackResponse);
                        }
                    });
                    finished.then(this.dequeue.bind(this), (() => {
                    }));
                });
                if (this.autorun && !this.running) {
                    // @ts-ignore
                    this.dequeue();
                }
                return this;
            }
            dequeue(value) {
                this.running = this.queue.shift();
                if (this.running) {
                    this.running(value);
                }
                return this.running;
            }
            get next() {
                return this.dequeue;
            }
        }
        Semaphore.Queue = Queue;
        // noinspection JSUnusedLocalSymbols
        const test = () => {
            // passing false into the constructor makes it so
            // the queue does not start till we tell it to
            const q = new Queue(false).add(function () {
                //start running something
            }).add(function () {
                //start running something 2
            }).add(function () {
                //start running something 3
            });
            setTimeout(function () {
                // start the queue
                // @ts-ignore
                q.next();
            }, 2000);
        };
        HelgeUtils.suppressUnusedWarning(test);
    })(Semaphore = HelgeUtils.Semaphore || (HelgeUtils.Semaphore = {}));
    let Net;
    (function (Net) {
        let OpenAi;
        (function (OpenAi) {
            let Test;
            (function (Test) {
                Test.testApiUp = async () => {
                    const url = "https://api.openai.com/v1/audio/speech";
                    HelgeUtils.assertEquals((await fetch(url))["type"], "invalid_request_error");
                };
            })(Test = OpenAi.Test || (OpenAi.Test = {}));
        })(OpenAi = Net.OpenAi || (Net.OpenAi = {}));
        //end of namespace Net:
    })(Net = HelgeUtils.Net || (HelgeUtils.Net = {}));
    let Debugging;
    (function (Debugging) {
        let DevConsoles;
        (function (DevConsoles) {
            let Eruda;
            (function (Eruda) {
                /**
                 * Often you should inline this function and load it before other scripts.
                 * */
                Eruda.load = () => {
                    // Import from here instead: HelgeLoadFirst.Debug.DevConsole.Eruda.load()
                };
            })(Eruda = DevConsoles.Eruda || (DevConsoles.Eruda = {}));
        })(DevConsoles = Debugging.DevConsoles || (Debugging.DevConsoles = {}));
    })(Debugging = HelgeUtils.Debugging || (HelgeUtils.Debugging = {}));
    class DatesAndTimesInternal {
        static Weekdays = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6
        };
        static pad = (n) => n < 10 ? '0' + n : n;
        static nextWeekdayLocalIsoDate(weekday, now = new Date()) {
            const currentDay = now.getDay();
            const daysUntilDesiredDay = (weekday - currentDay + 7) % 7 || 7;
            const desiredDayDate = new Date(now);
            desiredDayDate.setDate(now.getDate() + daysUntilDesiredDay);
            return desiredDayDate;
        }
        static isValidISODate(str) {
            const date = new Date(str);
            return this.isValidDate(date) && date.toISOString() === str;
        }
        static isValidDate(date) {
            return !isNaN(date.getTime());
        }
        static cutAfterMinutesFromISODate(isoDate) {
            return isoDate.slice(0, 16);
        }
        static cutAfterHourFromISODate(isoDate) {
            return isoDate.slice(0, 13);
        }
        static parseRelaxedIsoDate(input) {
            const isoTime = input.replace(',', 'T');
            const date = new Date(isoTime);
            return isNaN(date.getTime()) ? null : date;
        }
        static testParseRelaxedIsoDate() {
            const parse = this.parseRelaxedIsoDate;
            const expected = new Date('2022-01-01T00:00:00.000Z').toISOString();
            HelgeUtils.assertEquals(parse('2022-01-01').toISOString(), expected);
            HelgeUtils.assertEquals(parse('2022-01-01').toISOString(), expected);
            HelgeUtils.assert(parse('not a date') === null);
        }
        static year(date, twoDigitYear) {
            return (twoDigitYear ? date.getFullYear().toString().slice(-2) : date.getFullYear());
        }
        static date2yyyymmddDashedYearDigits(date, twoDigitYear) {
            return this.year(date, twoDigitYear)
                + '-'
                + this.twoDigitMonth(date)
                + '-'
                + this.twoDigitDay(date);
        }
        static day(date) {
            return date.getDate();
        }
        static month(date) {
            return date.getMonth() + 1;
        }
        static twoDigitDay(date) {
            return this.pad(this.day(date));
        }
        static twoDigitMonth(date) {
            return this.pad(this.month(date));
        }
        static date2ddmmyyPointed(date, twoDigitYear) {
            return ""
                + this.twoDigitDay(date)
                + '.'
                + this.twoDigitMonth(date)
                + '.'
                + this.year(date, twoDigitYear);
        }
        static date2dmyyPointed(date, twoDigitYear) {
            return ""
                + this.day(date)
                + '.'
                + this.month(date)
                + '.'
                + this.year(date, twoDigitYear);
        }
        /** Return a string representation of a date in the format YYYY-MM-DD.
         * Example: date2yyyymmddDashed(new Date(2022, 0, 1)) returns "2022-01-01". */
        static date2yyyymmddDashed(date) {
            return HelgeUtils.DatesAndTimes.date2yyyymmddDashedYearDigits(date, false);
        }
        static date2yymmddDashed(date) {
            return HelgeUtils.DatesAndTimes.date2yyyymmddDashedYearDigits(date, true);
        }
        static Timestamps = class {
            static yymmddDashed() {
                return HelgeUtils.DatesAndTimes.date2yymmddDashed(new Date());
            }
            static ddmmyyPointed() {
                return HelgeUtils.DatesAndTimes.date2dmyyPointed(new Date(), true);
            }
        };
        /**
         * Converts a Date object to an ISO 8601 formatted string using the local time zone.
         *
         * @param {Date} date - The Date object to be converted.
         * @returns {string} An ISO 8601 formatted date string in the local time zone.
         */
        static dateToLocalIsoDate(date) {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - offset * 60 * 1000);
            return localDate.toISOString().slice(0, -1);
        }
        static runTests() {
            this.testParseRelaxedIsoDate();
        }
    }
    HelgeUtils.DatesAndTimes = DatesAndTimesInternal;
})(HelgeUtils || (HelgeUtils = {}));
//# sourceMappingURL=HelgeUtils.js.map