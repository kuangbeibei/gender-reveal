import { execSync } from "child_process";
import { NextResponse } from "next/server";

const SONGS = { boy: "kimi Ga Sukida To Sakebitai", girl: "ZEN" };
const START_TIMES = { boy: 133, girl: 22 };
const PLAYLIST = "shower";

export async function POST(req) {
  const { gender } = await req.json();
  const song = SONGS[gender?.trim().toLowerCase()];
  if (!song) {
    return NextResponse.json({ error: "invalid_gender" }, { status: 400 });
  }

  const script = `
    tell application "Music"
      set targetPlaylist to missing value
      repeat with p in (get every playlist)
        if name of p is "${PLAYLIST}" then
          set targetPlaylist to p
          exit repeat
        end if
      end repeat
      if targetPlaylist is missing value then return "ERROR:playlist_not_found"

      set targetTrack to missing value
      repeat with t in (get every track of targetPlaylist)
        if name of t contains "${song}" then
          set targetTrack to t
          exit repeat
        end if
      end repeat
      if targetTrack is missing value then return "ERROR:track_not_found"

      set sound volume to 0
      stop
      play targetTrack
      delay 0.3
      pause
      set player position to ${START_TIMES[gender?.trim().toLowerCase()] ?? 0}
      set sound volume to 100
      play
      return "OK"
    end tell
  `;

  let result;
  try {
    result = execSync(`osascript -e '${script}'`).toString().trim();
  } catch (e) {
    return NextResponse.json({ error: "applescript_error", detail: e.message }, { status: 500 });
  }

  if (result === "OK") {
    return NextResponse.json({ ok: true, song });
  } else {
    return NextResponse.json({ error: result }, { status: 500 });
  }
}
