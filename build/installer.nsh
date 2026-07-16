!macro preInit
  ; Keep English selected initially while still allowing Simplified Chinese.
  StrCpy $LANGUAGE 1033
!macroend

!macro customInstall
  ; Pass the installer's explicit language choice to the app's first launch.
  FileOpen $0 "$INSTDIR\resources\installer-language.txt" w
  StrCmp $LANGUAGE 2052 0 +3
  FileWrite $0 "zh-CN"
  Goto +2
  FileWrite $0 "en-US"
  FileClose $0
!macroend
