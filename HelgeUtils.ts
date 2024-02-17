// noinspection JSUnusedGlobalSymbols

/**
 * HelgeUtils.ts
 * @description A collection of general utility functions not connected to a
 * specific project.
 *
 * Copyright by Helge Tobias Kosuch 2024 */
export namespace HelgeUtils {

  export namespace Exceptions {
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
    export const unhandledExceptionAlert = (e: Error | string) => {
      let str = "Unhandled EXCEPTION! :" + e
      if (e instanceof Error) {
        str += ", Stack trace:\n"
        str += e.stack
      }
      /* Do NOT call console.trace() here because the stack trace
         of this place here is not helpful, but instead very
         confusing. */
      console.log(str)
      alert(str)
      return str
    }

    /**
     * Wraps the given void function in a try-catch block and swallows any exceptions.
     *
     * Example use:
     *     const produceError = () => {throw "error"}
     *     const noError = swallowAll(produceError);
     *     noError(); // Does NOT throw an exception.
     *
     * @param func
     */
    export const swallowAll =
        <T, R>(func: (...args: T[]) => void): (...args: T[]) => void => {
          return (...args: T[]): void => {
            try {
              func(...args)
            } catch (e) {
            }
          }
        }
    ;

    /** Alias for swallowAll
     * @deprecated */
    export const catchAll = swallowAll;

    /** Alias for swallowAll
     * @deprecated */
    export const unthrow = swallowAll;

    /**
     * Calls the function and swallows any exceptions. */
    export const callSwallowingExceptions = (f: () => void) => {
      try {
        f()
      } catch (err) {
        console.log("Ignored: ")
        console.log(err)
      }
    }

    /**
     * Displays an alert with the given message and throws the message as an exception.
     *
     * @param msg {String} */
    export const alertAndThrow = (...msg: any) => {
      console.trace()
      alert(msg)
      throw new Error(...msg)
    }

  }

  export const suppressUnusedWarning = (...args: any[]) => {
    const flag = false
    if (flag) {
      console.log(args)
    }
  }

  export namespace Tests {
    /** Inline this function! */
    export const runTestsOnlyToday = () => {
      const RUN_TESTS = new Date().toISOString().slice(0, 10) === "2024-01-24"
      suppressUnusedWarning(RUN_TESTS)
    }

    export const assert = (condition: boolean, ...output: any[]) => {
      if (condition)
          // Everything is fine, just return:
        return
      // It is NOT fine! Throw an error:
      console.log(...output)
      HelgeUtils.Exceptions.alertAndThrow(...output)
    }

    export const assertEquals = (actual: any, expected: any, message: string | null = null) => {
      if (actual !== expected) {
        if (actual instanceof Date && expected instanceof Date
            && actual.getTime()===expected.getTime())
          return
        console.log("*************** expected:\n" + expected)
        console.log("*************** actual  :\n" + actual)
        if (typeof expected === 'string' && typeof actual === 'string') {
          const expectedShortened = expected.substring(0, 20).replace(/\n/g, '')
          const actualShortened = actual.substring(0, 20).replace(/\n/g, '')
          HelgeUtils.Exceptions.alertAndThrow(message
              || `Assertion failed: Expected ${expectedShortened}, but got ${actualShortened}`)
        }
        HelgeUtils.Exceptions.alertAndThrow(message
            || `Assertion failed: Expected ${expected}, but got ${actual}`)
      }
    }
  }

  export namespace Strings {
    import assertEquals = HelgeUtils.Tests.assertEquals
    /**
     * Trim whitespace but leave a single newline at the end if there is
     * any whitespace that includes a newline.
     */
    export const trimExceptASingleNewlineAtTheEnd = (input: string): string => {
      // Check for whitespace including a newline at the end
      if (/\s*\n\s*$/.test(input)) {
        // Trim and leave a single newline at the end
        return input.replace(/\s+$/, '\n')
      } else {
        // Just trim normally
        return input.trim()
      }
    }

    export const toUppercaseFirstChar = (input: string): string => {
      if (input.length === 0) return input

      const specialChars: { [key: string]: string } = {
        'ü': 'Ü',
        'ö': 'Ö',
        'ä': 'Ä'
      }

      const firstChar = input.charAt(0)
      return (specialChars[firstChar] || firstChar.toLocaleUpperCase()) + input.slice(1)
    }

    export const escapeRegExp = (str: string): string => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    /**
     * text.substring(leftIndex, rightIndex) is the string between the delimiters. */
    export class DelimiterSearch {
      constructor(public delimiter: string) {
      }
      public leftIndex(text: string, startIndex: number) {
        return DelimiterSearch.index(this.delimiter, text, startIndex, false)
      }
      public rightIndex(text: string, startIndex: number) {
        return DelimiterSearch.index(this.delimiter, text, startIndex, true)
      }
      /** If search backwards the position after the delimiter is */
      private static index(delimiter: string, text: string, startIndex: number, searchForward: boolean) {
        const searchBackward = !searchForward
        if (searchBackward) {
          if (startIndex === 0) return 0
          // If the starIndex is at the start of a delimiter we want to return the index of the start of the string before this delimiter:
          startIndex--
        }
        const step = searchForward ? 1 : -1
        for (let i = startIndex; searchForward ? i < text.length : i >= 0; i += step) {
          if (text.substring(i, i + delimiter.length) === delimiter) {
            return i
                + (searchForward ? 0 : delimiter.length)
          }
        }
        return searchForward ? text.length : 0
      }
      public static runTests = () => {
        this.testDelimiterSearch()
        this.testDeleteBetweenDelimiters()
      }
      private static testDelimiterSearch = () => {
        const delimiter = '---\n'
        const instance = new DelimiterSearch(delimiter)

        const runTest = (input: string, index: number, expected: string) =>
            assertEquals(input.substring(
                    instance.leftIndex(input, index),
                    instance.rightIndex(input, index)),
                expected)
        {
          const inputStr = "abc" + delimiter
          runTest(inputStr, 0, "abc")
          runTest(inputStr, 3, "abc")
          runTest(inputStr, 4, "")
          runTest(inputStr, 3+delimiter.length, "")
          runTest(inputStr, 3+delimiter.length+1, "")
        }
        {
          const inputStr =  delimiter + "abc"
          runTest(inputStr, 0, "")
          runTest(inputStr, delimiter.length, "abc")
          runTest(inputStr, delimiter.length+3, "abc")
        }
      }
      /** Deletes a note from the given text.
       * @param input - The text to delete from.
       * @param left - The index of the left delimiter.
       * @param right - The index of the right delimiter.
       * @param delimiter - The delimiter.
       * */
      public static deleteNote = (input: string, left: number, right: number, delimiter: string) => {
        const str1 = (input.substring(0, left) + input.substring(right)).replaceAll(delimiter+delimiter, delimiter)
        if (str1===delimiter+delimiter) return ""
        if (str1.startsWith(delimiter)) return str1.substring(delimiter.length)
        if (str1.endsWith(delimiter)) return str1.substring(0, str1.length - delimiter.length)
        return str1
      }
      private static testDeleteBetweenDelimiters = () => {
        const delimiter = ')))---(((\n'
        const runTest = (cursorPosition: number, input: string, expected: string) => {
          const delimiterSearch = new Strings.DelimiterSearch(delimiter)
          const left = delimiterSearch.leftIndex(input, cursorPosition)
          const right = delimiterSearch.rightIndex(input, cursorPosition)
          assertEquals(DelimiterSearch.deleteNote(input, left, right, delimiter), expected)
        }
        runTest(0, "abc" + delimiter, "")
        runTest(delimiter.length, delimiter + "abc", "")
        runTest(delimiter.length, delimiter + "abc" + delimiter, "")
        runTest(1+delimiter.length, "0" + delimiter + "abc" + delimiter + "1",  "0"+delimiter+"1")
      }
    } //end of class DelimiterSearch
    export function runTests() {
      DelimiterSearch.runTests()
    }
  } //end of namespace Strings

  export const runTests = () => {
    Strings.runTests()
  }

  export namespace Transcription {

    export class TranscriptionError extends Error {
      public payload: {}
      constructor(payload: {}) {
        super("TranscriptionError")
        this.name = "TranscriptionError"
        this.payload = payload
      }
    }

    export type ApiName = "OpenAI" | "Gladia"

    const withOpenAi = async (audioBlob: Blob, apiKey: string, prompt: string,
                              language: string = "", translateToEnglish = false) => {
      const formData = new FormData()
      formData.append('file', audioBlob)
      formData.append('model', 'whisper-1'); // Using the largest model
      formData.append('prompt', prompt)
      /* Language. Anything in a different language will be translated to the target language. */
      formData.append('language', language) // e.g. "en"

      /* Docs: https://platform.openai.com/docs/api-reference/audio/createTranscription */
      const response = await fetch(
          "https://api.openai.com/v1/audio/"
          +(translateToEnglish?'translations':'transcriptions')
          , {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      })
      const result = await response.json()
      if (typeof result.text === "string") return result.text
      return result
    }

    const withGladia = async (audioBlob: Blob, apiKey: string, prompt: string = '',
                              language: string | null = null) => {
      suppressUnusedWarning(prompt)
      // Docs: https://docs.gladia.io/reference/pre-recorded
      const formData = new FormData()
      formData.append('audio', audioBlob)
      /*Value	Description
manual	manually define the language of the transcription using the language parameter
automatic single language	default value and recommended choice for most cases - the model will auto-detect the prominent language in the audio, then transcribe the full audio to that language. Segments in other languages will automatically be translated to the prominent language. The mode is also recommended for scenarios where the audio starts in one language for a short while and then switches to another for the majority of the duration
automatic multiple languages	For specific scenarios where language is changed multiple times throughout the audio (e.g. a conversation between 2 people, each speaking a different language.).
The model will continuously detect the spoken language and switch the transcription language accordingly.
Please note that certain strong accents can possibly cause this mode to transcribe to the wrong language.
*/
      if (language)
        formData.append('language_behaviour', 'automatic multiple languages')

      formData.append('toggle_diarization', 'false')
      // formData.append('transcription_hint', prompt)
      formData.append('output_format', 'txt')

      interface GladiaResult {
        prediction: string
      }
      const result: GladiaResult = await (await fetch('https://api.gladia.io/audio/text/audio-transcription/', {
        method: 'POST',
        headers: {
          'x-gladia-key': apiKey
        },
        body: formData
      })).json()
      const resultText = result?.prediction
      return resultText
    }

    export const transcribe = async (api: ApiName, audioBlob: Blob, apiKey: string,
                                     prompt: string = '', language: string = "",
                                     translateToEnglish = false) =>
    {
      if (!audioBlob || audioBlob.size===0) return ""
      const output =
          api === "OpenAI" ?
              await withOpenAi(audioBlob, apiKey, prompt, language, translateToEnglish)
              : await withGladia(audioBlob, apiKey, prompt)
      if (typeof output === "string") return output
      throw new TranscriptionError(output)
    }
  }

  export namespace ReplaceByRules {
    export class ReplaceRules {
      public constructor(private rules: string) {
      }

      public applyTo = (subject: string) => {
        return replaceByRules(subject, this.rules, false, false).resultingText
      }
      public applyToWithLog = (subject: string) => {
        return replaceByRules(subject, this.rules, false, true)
      }
    }

    export class WholeWordReplaceRules {
      public constructor(private rules: string) {
      }

      public applyTo = (subject: string) => {
        return replaceByRules(subject, this.rules, true, false).resultingText
      }
      public applyToWithLog = (subject: string) => {
        return replaceByRules(subject, this.rules, true, true)
      }
    }

    export class WholeWordPreserveCaseReplaceRules {
      public constructor(private rules: string) {
      }

      public applyTo = (subject: string) => {
        return replaceByRules(subject, this.rules, true, false, true).resultingText
      }
      public applyToWithLog = (subject: string) => {
        return replaceByRules(subject, this.rules, true, true, true)
      }
    }

    /**
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
    export const replaceByRules = (subject: string, allRules: string, wholeWords = false
        , logReplacements = false, preserveCase = false) => {
      const possiblyWordBoundaryMarker = wholeWords ? '\\b' : ''
      let count = 0
      const ruleParser = /^"(.+?)"([a-z]*?)(?:\r\n|\r|\n)?->(?:\r\n|\r|\n)?"(.*?)"([a-z]*?)(?:\r\n|\r|\n)?$/gmus
      let log = ''

      function applyRule(rawTarget: string, regexFlags: string, replacementString: string, replacementFlags: string) {
        const target = possiblyWordBoundaryMarker + rawTarget + possiblyWordBoundaryMarker
        // console.log("\n" + target + "\n↓↓↓↓↓\n"+ replacement)
        let regex = regexFlags.length == 0 ?
            new RegExp(target, 'gm') // Noted that gm flags are basically necessary for this plugin to be useful, you seldom want to replace only 1 occurrence or operate on a note only contains 1 line.
            : new RegExp(target, regexFlags)
        if (logReplacements && subject.search(regex) !== -1) {
          log += `${count} ${rule}\n`
        }
        if (replacementFlags == 'x')
          subject = subject.replace(regex, '')
        else
          subject = subject.replace(regex, replacementString)
        count++
      }

      let rule: RegExpExecArray | null
      while (rule = ruleParser.exec(allRules)) {
        const [
          , target
          , regexFlags
          , replacementString
          , replacementFlags
        ] = rule
        applyRule(target, regexFlags, replacementString, replacementFlags)
        if (preserveCase) {
          applyRule(
              Strings.toUppercaseFirstChar(target), regexFlags,
              Strings.toUppercaseFirstChar(replacementString), replacementFlags)
        }
      }
      return {
        resultingText: subject,
        log: log
      }
    }

  /**
   * Deprecated! Use ReplaceRules or WholeWordReplaceRules instead.
   */
    export const replaceByRulesAsString = (subject: string, allRules: string) => {
      return replaceByRules(subject, allRules, false, false).resultingText
    }
  }

  export const memoize = <T, R>(func: (...args: T[]) => R): (...args: T[]) => R => {
    const cache = new Map<string, R>()

    return (...args: T[]): R => {
      const key = JSON.stringify(args)
      if (cache.has(key)) {
        return cache.get(key)!
      } else {
        const result = func(...args)
        cache.set(key, result)
        return result
      }
    }
  }

  export const extractHighlights = (input: string): string[] => {
    const regex = /={2,3}([^=]+)={2,3}/g
    let matches: string[] = []
    let match: string[] | null

    while ((match = regex.exec(input)) !== null) {
      matches.push(match[1].trim())
    }

    return matches
  }

  export namespace Misc {
    /**
     * Throws an exception if the input is null.
     *
     * I use "strictNullChecks": true to avoid bugs. Therefore, I need this
     * where that is too strict.
     *
     * Use example:
     * const elementWithId = (id: string) =>
     *   nullFilter<HTMLElement>(HtmlUtils.elementWithId, id)
     */
    export const nullFilter = <T>(f: Function, ...parameters: any ): T => {
      const untypedNullFilter = (input: any) => {
        if (input === null)
          Exceptions.alertAndThrow(`Unexpected null value.`)
        return input
      }
      return untypedNullFilter(f(...parameters)) as T
    }

    // noinspection SpellCheckingInspection
    /**
     * Converts "Du" to "Ich" and "Dein" to "Mein" and so on.
     */
    export const du2ich = (input: string,
         replaceFunction = (rules: string,input: string) =>
         new ReplaceByRules.WholeWordPreserveCaseReplaceRules(rules).applyTo(input)
    ) => {
/**
 * Only WHOLE words are replaced. Gotchas: Do NOT only search for a word
 * boundary at the end, because e. g. "du" and "hast" might be endings of
 * unrelated words!
 */
const rules1 = `
"akzentuierst"->"akzentuiere"
"allegorisierst"->"allegorisiere"
"analysierst"->"analysiere"
"antwortest"->"antworte"
"arbeitest"->"arbeite"
"assoziierst"->"assoziiere"
"authentifizierst"->"authentifiziere"
"autorisierst"->"autorisiere"
"bedankst"->"bedanke"
"bedeckst"->"bedecke"
"bedienst"->"bediene"
"begeisterst"->"begeistere"
"beginnst"->"beginne"
"beobachtest"->"beobachte"
"beschwerst"->"beschwere"
"beschützt"->"beschütze"
"bestehst"->"bestehe"
"betrachtest"->"betrachte"
"beurteilst"->"beurteile"
"bezahlst"->"bezahle"
"bist"->"bin"
"bist"->"bin"
"bleibst"->"bleibe"
"brauchst"->"brauche"
"bringst"->"bringe"
"dein"->"mein"
"deine"->"meine"
"deiner"->"meiner"
"demokratisierst"->"demokratisiere"
"demonstrierst"->"demonstriere"
"denkst"->"denke"
"diagnostizierst"->"diagnostiziere"
"dich"->"mich"
"differenzierst"->"differenziere"
"digitalisierst"->"digitalisiere"
"dir"->"mir"
"diskutierst"->"diskutiere"
"diversifizierst"->"diversifiziere"
"dramatisierst"->"dramatisiere"
"du"->"ich"
"empfiehlst"->"empfehle"
"entdeckst"->"entdecke"
"entscheidest"->"entscheide"
"entspannst"->"entspanne"
"erholst"->"erhole"
"erinnerst"->"erinnere"
"erkennst"->"erkenne"
"erklärst"->"erkläre"
"erlaubst"->"erlaube"
"ermunterst"->"ermuntere"
"erreichst"->"erreiche"
"erschreckst"->"erschrecke"
"erweiterst"->"erweitere"
"erwärmst"->"erwärme"
"findest"->"finde"
"findest"->"finde"
"fühlst"->"fühle"
"folgst"->"folge"
"fährst"->"fahre"
"fühlst"->"fühle"
"gehst"->"gehe"
"gibst"->"gebe"
"glaubst"->"glaube"
"harmonisierst"->"harmonisiere"
"hast"->"habe"
"hast"->"habe"
"hilfst"->"helfe"
"hältst"->"halte"
"hörst"->"höre"
"identifizierst"->"identifiziere"
"ideologisierst"->"ideologisiere"
"illustrierst"->"illustriere"
"individualisierst"->"individualisiere"
"inspirierst"->"inspiriere"
"intensivierst"->"intensiviere"
"interessierst"->"interessiere"
"interpretierst"->"interpretiere"
"ironisierst"->"ironisiere"
"isst"->"esse"
"kannst"->"kann"
"kannst"->"kann"
"karikierst"->"karikiere"
"kategorisierst"->"kategorisiere"
"kaufst"->"kaufe"
"klassifizierst"->"klassifiziere"
"kochst"->"koche"
"kommentierst"->"kommentiere"
"kommst"->"komme"
"kritisierst"->"kritisiere"
"lebst"->"lebe"
"legitimierst"->"legitimiere"
"leihst"->"leihe"
"lernst"->"lerne"
"liest"->"lese"
"liest"->"lese"
"lächelst"->"lächle"
"läufst"->"laufe"
"machst"->"mache"
"machst"->"mache"
"manifestierst"->"manifestiere"
"mathematisierst"->"mathematisiere"
"maximierst"->"maximiere"
"minimierst"->"minimiere"
"moralisierst"->"moralisiere"
"musst"->"muss"
"nennst"->"nenne"
"nimmst"->"nehme"
"optimierst"->"optimiere"
"parodierst"->"parodiere"
"philosophierst"->"philosophiere"
"poetisierst"->"poetisiere"
"politisierst"->"politisiere"
"priorisierst"->"priorisiere"
"prognostizierst"->"prognostiziere"
"präsentierst"->"präsentiere"
"qualifizierst"->"qualifiziere"
"quantifizierst"->"quantifiziere"
"rationalisierst"->"rationalisiere"
"rationalisierst"->"rationalisiere"
"redest"->"rede"
"reduzierst"->"reduziere"
"reinigst"->"reinige"
"repräsentierst"->"repräsentiere"
"resümierst"->"resümiere"
"rettest"->"rette"
"romantisierst"->"romantisiere"
"rufst"->"rufe"
"sagst"->"sage"
"sammelst"->"sammle"
"schickst"->"schicke"
"schläfst"->"schlafe"
"schreibst"->"schreibe"
"setzt"->"setze"
"siehst"->"sehe"
"sortierst"->"sortiere"
"sozialisierst"->"sozialisiere"
"spezialisierst"->"spezialisiere"
"spielst"->"spiele"
"stabilisierst"->"stabilisiere"
"standardisierst"->"standardisiere"
"stilisierst"->"stilisiere"
"studierst"->"studiere"
"symbolisierst"->"symbolisiere"
"synchronisierst"->"synchronisiere"
"synthetisierst"->"synthetisiere"
"theologisierst"->"theologisiere"
"triffst"->"treffe"
"trinkst"->"trinke"
"trägst"->"trage"
"validierst"->"validiere"
"verbesserst"->"verbessere"
"verbindest"->"verbinde"
"vereinfachst"->"vereinfache"
"verfolgst"->"verfolge"
"vergisst"->"vergesse"
"vergrößerst"->"vergrößere"
"verifizierst"->"verifiziere"
"verlierst"->"verliere"
"verlässt"->"verlasse"
"vermeidest"->"vermeide"
"versteckst"->"verstecke"
"verstehst"->"verstehe"
"versuchst"->"versuche"
"verteidigst"->"verteidige"
"vervielfältigst"->"vervielfältige"
"vervollständigst"->"vervollständige"
"verwendest"->"verwende"
"veränderst"->"verändere"
"wartest"->"warte"
"weißt"->"weiß"
"wiederholst"->"wiederhole"
"willst"->"will"
"willst"->"will"
"wirst"->"werde"
"wunderst"->"wundere"
"zeigst"->"zeige"
"zertifizierst"->"zertifiziere"
"zivilisierst"->"zivilisiere"
"änderst"->"ändere"
"ästhetisierst"->"ästhetisiere"
"öffnest"->"öffne"
"überlegst"->"überlege"
"übernimmst"->"übernehme"
"überprüfst"->"überprüfe"
"übertriffst"->"übertriff"
"überzeugst"->"überzeuge"
"klärst"->"kläre"
"wirst"->"werde"
"darfst"->"darf"
"stellst"->"stelle"
"anstellst"->"anstelle"
"abstellst"->"abstelle"
"vorstellst"->"vorstelle"
"könnest"->"könnte"
`
      /**
       * Here also partial words are replaced.*/
// const rules2 = `
//     "I"->"Ist"
//     "i"->"ist"
// "\\berst\\b"->"x(ersxt)x"
// :: Bug: The following does not work for all occurrences: //TODOh
// "st\\b"->""
// `
// noinspection SpellCheckingInspection
      /**
       * Here also partial words are replaced.*/
// const rules3 = `
// "\\bx\\(ersxt\\)x\\b"->"erst"
// `
      const applyRules1 = (input: string) => replaceFunction(rules1, input)
// const applyRules2 = (input: string) => ReplaceByRules.withUiLog(rules2, input)
// const applyRules3 = (input: string) => ReplaceByRules.withUiLog(rules3, input)
      return (
// applyRules3
          (
// applyRules2
          (
              applyRules1(input))))
    } //end of namespace du2ich
  } //end of namespace Misc
}