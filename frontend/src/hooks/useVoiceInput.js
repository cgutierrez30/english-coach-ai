export function useVoiceInput() {
  return { isListening: false, transcript: "", startListening: () => {}, stopListening: () => {} };
}
