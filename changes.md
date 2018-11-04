Changelog 0.3.0 -> 0.4.0-a

Features Added:
 - History navigation with arrow up/down
 - Floater now indicates floating status


Bugs Fixed:
 - Editor no longer clears after failure to load/save a file
 - Editor is now in focus after path prompt is closed
 - Editor now retains contents when floating mode is toggled
 - History no longer has extra blank entries added to it when restored
 - Editor no longer creates a newline when pressing enter to save or load

Other Changes:
 - description in package.json now reads "A floating notepad"
 - Template for about.html now exists
 - Scrollbar is now hidden by default
 - Capitalized input messages
 - Escape will now close the path input
