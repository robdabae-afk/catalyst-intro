Catalyst investor education content draft

This is an offline content package, not an application integration or a live investment offering. Twenty fictional-example lessons expand the five existing Reg CF text cards. No application code is changed.

Each video is vertical 1080x1920 H.264/AAC with animated editorial diagrams and burned-in captions. The narrator is Microsoft Edge neural Emma Multilingual (en-US-EmmaMultilingualNeural), at -3% rate. Caption files are also provided separately. Every lesson has five narration-aligned visual scenes and a sourced companion of about 230–265 words.

Run python3 render.py to resume rendering. It hashes content and renderer code to prevent stale cached assets. Run python3 validate.py to check lesson coverage, companion length, captions, duration, dimensions, audio and file hashes. Install Python packages from requirements.txt and provide ffmpeg/ffprobe. Schibsted Grotesk is included under the SIL Open Font License.

These are editorial drafts requiring legal/compliance review before public use. Sources were checked October 13, 2026. Rules, limits and tax treatment can change. Neither the lessons nor SEC filings promise returns or endorse any issuer. The content does not substitute for a registered intermediary's required investor materials.

The source curriculum.json stores the narration, scene_narration timing passages, visual structure and source URLs. Writing is in writing/, videos in videos/, subtitles in captions/, voice tracks in audio/ and preview images in thumbnails/. The inventory explains the old-to-new topic mapping.

Polish QA October 13, 2026

No ElevenLabs or OpenAI credentials were present in the execution environment. Full-track listening compared the original Aria narration with Emma Multilingual; Emma was clearer and less clipped, but remains synthesized narration rather than a human recording. No paid voice service was used.

Captions and scene cuts are anchored to the actual synthesized WordBoundary events, treating provider-grouped currency phrases as indivisible units. Normalized boundary text must equal the narration, and cuts must land exactly at spoken-word boundaries. Missing or mismatched events fail rendering rather than estimating timing. The audio cache includes voice, rate and boundary mode.

Document visuals contain actual numbered review items instead of grey skeleton bars. Secondary labels are near-black, header tags are larger, sparse cards and diagrams use more of their visual region, and pie legends fit within that region. The progress bar is computed from the global elapsed lesson duration, not the caption or scene. Encoded-frame pixel tests check monotonicity, including around 48 seconds. Full playback reviews cover SAFE, cap/discount and diversification lessons. Animation fades still briefly introduce content before it reaches full contrast.

The SAFE encoded progress endpoint at y=1704 advanced from x=776 at 47 seconds to 791 at 48, 805 at 49, 834 at 51 and 849 at 52. This is measured in decoded video pixels, not inferred from code.

Static bounds validation covers 362 headlines and card labels, all 100 kicker tags, and pie legend extents. Five long kicker tags were shortened without altering narration so the enlarged 36px type fits safely. Python voice/render dependencies are pinned to tested versions.
