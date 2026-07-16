# Internationalization

Pomodoro Tracker supports English (`en-US`) and Simplified Chinese (`zh-CN`). English is the
default for new installations.

When adding or changing user-facing text:

1. Add the Chinese source text and its English translation to
   `src/renderer/i18n.js`.
2. Use semantic, complete phrases. For text containing task names or values, add a matching
   interpolation rule in `translateDynamic` instead of translating user content.
3. Add native dialog and notification text to the `text(english, chinese)` calls in
   `src/main/main.js`.
4. Verify both languages in the main window and the mini timer. Do not translate task names,
   group names, or session notes entered by the user.
5. Keep the Windows installer languages in `package.json` synchronized with the app locales.

The selected interface language is stored in `config.json` and broadcast to every application
window. The Windows installer writes its selected locale to `installer-language.txt`, which is
used only on the first app launch. English remains the default; existing users keep their saved
language.
