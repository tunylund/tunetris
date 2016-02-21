# Tunetris

An expermint on webaudio whether creating a tuner could be actually useful yet. https://tunylund.github.io/tunetris/

The tuner detects pitch from the audiosource and draws a block on screen for each individual note played.

If you get a full screen of blocks, congratulations, you've played all the notes.

### Problems

Since webaudio support is still missing from a lot of devices and browsers. This demo works mainly just on desktop chrome.

The mic input on mackbook pro is not very good. So getting enough audio data from the mic might not be possible for low frequency instruments.

* uses three.js
* uses detect-pitch.js
