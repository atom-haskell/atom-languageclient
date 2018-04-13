import { Point, Range, TextBuffer, TextEditor as TextEditorCore, ScopeDescriptor, Notification } from 'atom';

declare module 'atom' {
  interface TextEditor {
    getNonWordCharacters(position: Point): string;
  }

  // Non-public Notification api
  interface NotificationExt extends Notification {
    isDismissed?: () => boolean;
    getOptions?: () => NotificationOptions | null;
  }
}

declare module 'atom/autocomplete-plus' {
  interface Suggestion<T> {
    descriptionMarkdown?: string;
  }
  interface AutocompleteProvider {
    getSuggestionDetailsOnSelect:
      (suggestion: AnySuggestion) => Promise<AnySuggestion | null> | AnySuggestion | null
  }
  type AnySuggestion = TextSuggestion | SnippetSuggestion
}
