; fork: renamed to WayPoint so the shell verbs and binary do not clash with an installed Terax.
; "Open in WayPoint" shell verbs for folders, folder backgrounds, and drives.
; HKCU matches installer currentUser scope. %V = clicked path.
; NoWorkingDirectory keeps Explorer from overriding %V (System32 on Drive).

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInWayPoint" "" "Open in WayPoint"
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInWayPoint" "Icon" '"$INSTDIR\waypoint.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInWayPoint" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInWayPoint\command" "" '"$INSTDIR\waypoint.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInWayPoint" "" "Open in WayPoint"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInWayPoint" "Icon" '"$INSTDIR\waypoint.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInWayPoint" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInWayPoint\command" "" '"$INSTDIR\waypoint.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInWayPoint" "" "Open in WayPoint"
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInWayPoint" "Icon" '"$INSTDIR\waypoint.exe",0'
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInWayPoint" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInWayPoint\command" "" '"$INSTDIR\waypoint.exe" "%V"'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Directory\shell\OpenInWayPoint"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\OpenInWayPoint"
  DeleteRegKey HKCU "Software\Classes\Drive\shell\OpenInWayPoint"
!macroend
