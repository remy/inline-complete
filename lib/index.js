/* global CodeMirror */
import Dictionary from './common/Dictionary';
import { TextUtils } from './common/TextUtils';
import Keys from './common/Keys';
import * as keywords from './common/keywords';
const CSS = 'css';

const isCSSWordChar = c => TextUtils.isWordChar(c) || c === '-';

CodeMirror.defineOption('autocomplete', false, function(cm, value) {
  if (value === false) {
    return;
  }

  if (CodeMirror.autocomplete && CodeMirror.autocomplete.core) {
    CodeMirror.autocomplete.core.disconnect();
  }

  const autoComplete = new Autocomplete(cm);
  CodeMirror.registerHelper('autocomplete', 'core', autoComplete);
});

class Autocomplete {
  constructor(cm) {
    const hint = document.createElement('span');
    hint.className = 'widget-autocomplete';
    this.hint = hint;
    this.dictionary = new Dictionary();
    this.mark = null;

    const mode = (this.mode = cm.getOption('mode'));
    console.log(mode);

    // keywords.css = cm.hintWords.css;

    this.cm = cm;
    cm.on('change', this.change);
    cm.on('keydown', this.keydown);
    cm.on('beforeChange', this.beforeChange);
    cm.on('cursorActivity', this.cursorActivity);
    cm.on('mousedown', this.clear);

    // this.watch = setInterval(() => console.log(this.currentHint), 1000);

    window.remy = this;

    this.reset();
  }

  disconnect() {
    const cm = this.cm;
    // clearInterval(this.watch);
    cm.off('change', this.change);
    cm.off('keydown', this.keydown);
    cm.off('beforeChange', this.beforeChange);
    cm.off('cursorActivity', this.cursorActivity);
    cm.off('mousedown', this.clear);
  }

  reset() {
    const cm = this.cm;
    this.clear();
    this.currentHint = '';
    this.dictionary.reset();
    const isWordChar =
      this.cm.getOption('source') === CSS
        ? isCSSWordChar
        : TextUtils.isWordChar;
    this.isWordChar = cm.getOption('isWordChar') || isWordChar;

    this.textToWords(cm.getValue(), this.isWordChar, word => {
      if (word.length && (word[0] < '0' || word[0] > '9')) {
        this.dictionary.addWord(word);
      }
    });

    this.keywords = keywords[cm.getOption('source')] || [];
    this.keywords.forEach(word => this.dictionary.addWord(word));

    this.userKeywords = cm.getOption('autocomplete-keywords') || [];
    this.userKeywords.forEach(word => this.dictionary.addWord(word));
  }

  textToWords(text, isWordChar, wordCallback) {
    let startWord = -1;
    for (let i = 0; i < text.length; ++i) {
      if (!isWordChar(text.charAt(i))) {
        if (startWord !== -1) wordCallback(text.substring(startWord, i));
        startWord = -1;
      } else if (startWord === -1) {
        startWord = i;
      }
    }
    if (startWord !== -1) wordCallback(text.substring(startWord));
  }

  getLines(from, to) {
    return this.cm.getRange({ line: from.line, ch: 0 }, { line: to.line });
  }

  keydown = (cm, event) => {
    if (!this.currentHint) {
      return;
    }

    switch (event.which) {
      case Keys.Tab.code:
      case Keys.Enter.code:
      case Keys.Right.code:
        this.select();
        event.preventDefault();
        break;
      default:
        this.dismiss();
    }
  };

  dismiss() {
    this.clear();
  }

  select() {
    if (!this.currentHint) return;

    this.cm.replaceRange(this.currentHint, this.cursor, this.cursor, '+input');
    this.clear();
  }

  beforeChange = (cm, change) => {
    // clear the lines from change.from, and change.to
    const lines = this.getLines(change.from, change.to);
    this.textToWords(lines, this.isWordChar, word => {
      if (this.userKeywords.indexOf(word) === -1) {
        if (word.length && (word[0] < '0' || word[0] > '9')) {
          if (this.keywords.indexOf(word) === -1) {
            this.dictionary.removeWord(word);
          }
        }
      }
    });
  };

  cursorActivity = () => {
    const cursor = this.cm.getCursor();
    // dismiss the current hint

    if (cursor.line !== this.cursor.line && cursor.ch !== this.cursor.ch) {
      this.clear();
    }

    this.cursor = cursor;
  };

  change = (cm, changes) => {
    const { from, to, origin } = changes;
    if (origin === 'setValue') {
      this.reset();
    }
    cm.startOperation();
    this.cursor = this.cm.getCursor();
    this.showHint(from, to);
    cm.endOperation();
  };

  clear = () => {
    if (this.mark) this.mark.clear();
    this.hint.innerText = '';
    this.currentHint = '';
  };

  showHint(from, to) {
    this.clear();
    const cm = this.cm;

    // if at end of line, and have words to the left, then search the dictionary
    // and put the match in the hint and show it

    const cursor = cm.getCursor();
    const currentLine = cm.getLine(cursor.line);

    let word = '';
    let i = currentLine.length;
    while (i--) {
      const chr = currentLine[i];
      if (!this.isWordChar(chr)) {
        break;
      }
      word = chr + word;
    }

    if (!word) {
      return;
    }

    const matches = this.dictionary.wordsWithPrefix(word);
    console.log('word: %s, %s', word, matches);

    if (matches.length === 0) {
      return;
    }

    const match = matches[0].substr(word.length);

    this.hint.innerText = match;
    this.currentHint = match;

    this.mark = cm.setBookmark(cursor, {
      widget: this.hint,
      insertLeft: false,
    });
  }
}
