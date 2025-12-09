import React from 'react';
export type ReleaseInfo = {
  notes: React.ReactNode;
};

export const Releases: Record<string, ReleaseInfo> = {
  '0.0.10': {
    notes: (
      <>
        Adds ability to <b>stream</b> logs from the server instead of getting everything in one go. This speeds up the
        time from refresh until you see the first 500 lines.
        <br />
        <br />
        To enter <b>streaming mode</b> there is a new button in the top right corner, next to the refresh and auto
        refresh buttons.
        <br />
        By default you are still in the old batch mode. When you enter <b>streaming mode</b> another button will also
        appear. This is a stop button so you can cancel a running query.
        <br />
        <br />
        <b>NOTE:</b> The <b>streaming mode</b> is still in an early phase. Use it with some caution. If a log line that
        you expect is not appearing, check with batch mode as well.
        <br />
        <br />
        <b>THIS FEATURE ONLY WORKS WELL IF YOU ARE SORTING BY TIME. </b> If not log messages will pop up all over the
        place.
        <br />
        <br />
        🎄 Merry Chrysler 🎄
        <br />
        Scaffolders
      </>
    ),
  },
};
