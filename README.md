# cm-inline-complete: A CodeMirror autocomplete plugin

Inspired by Chrome's devtools (and I read their source code to solve some of this), an inline, as-you-type, autocomplete for CodeMirror.

## Usage

Include this plugin using a `script` tag, `require` or `import` statement, then pass `autocomplete: true` to the CodeMirror creation method:

```js
const el = document.querySelector('textarea');
const cm = CodeMirror.fromTextArea(el, {
  mode: 'html',
  autocomplete: true,
});
```

The plugin provides HTML, CSS and JavaScript autocompletion by default. If you select a different language mode, you will need to provide your own `keywords` - an array of terms:

```js
const el = document.querySelector('textarea');
const cm = CodeMirror.fromTextArea(el, {
  mode: 'php',
  autocomplete: true,
  keywords: CodeMirror.hintWords.php,
});
```

Tip: most language mode plugins include the full set of keywords somewhere in their code. It's not always the same place, but in the above example you can see we're able to benefit from a helper exposing the PHP keywords.

## License

- MIT / https://rem.mit-licence.org
