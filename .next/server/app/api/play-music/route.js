"use strict";(()=>{var e={};e.id=552,e.ids=[552],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},7077:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>v,patchFetch:()=>h,requestAsyncStorage:()=>m,routeModule:()=>d,serverHooks:()=>y,staticGenerationAsyncStorage:()=>g});var a={};r.r(a),r.d(a,{POST:()=>c});var s=r(9303),i=r(8716),o=r(670);let n=require("child_process");var p=r(7070);let u={boy:"kimi Ga Sukida To Sakebitai",girl:"ZEN"},l={boy:133,girl:22};async function c(e){let t;let{gender:r}=await e.json(),a=u[r?.trim().toLowerCase()];if(!a)return p.NextResponse.json({error:"invalid_gender"},{status:400});let s=`
    tell application "Music"
      set targetPlaylist to missing value
      repeat with p in (get every playlist)
        if name of p is "shower" then
          set targetPlaylist to p
          exit repeat
        end if
      end repeat
      if targetPlaylist is missing value then return "ERROR:playlist_not_found"

      set targetTrack to missing value
      repeat with t in (get every track of targetPlaylist)
        if name of t contains "${a}" then
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
      set player position to ${l[r?.trim().toLowerCase()]??0}
      set sound volume to 100
      play
      return "OK"
    end tell
  `;try{t=(0,n.execSync)(`osascript -e '${s}'`).toString().trim()}catch(e){return p.NextResponse.json({error:"applescript_error",detail:e.message},{status:500})}return"OK"===t?p.NextResponse.json({ok:!0,song:a}):p.NextResponse.json({error:t},{status:500})}let d=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/play-music/route",pathname:"/api/play-music",filename:"route",bundlePath:"app/api/play-music/route"},resolvedPagePath:"/Users/bethking/Documents/小马/nextjs 4/app/api/play-music/route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:m,staticGenerationAsyncStorage:g,serverHooks:y}=d,v="/api/play-music/route";function h(){return(0,o.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:g})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[948,972],()=>r(7077));module.exports=a})();