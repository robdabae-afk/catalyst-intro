Investor education inventory, reviewed October 13, 2026

The existing Learn series is five text cards with multiple-choice checks, not five videos. The authoritative array is src/features/data.ts. src/features/screens/Learn.tsx renders the cards with still photographs and quiz answers. A matching historical array exists in src/demo/orig/featureData.ts. The feature router exposes its Learn screen; the current minimal /demo contains startup disclosures and a follow-up question flow rather than a separate video curriculum.

Existing topic l1 is What is Reg CF? This is preserved in new lesson 02.
Existing topic l2 is There are limits. This is preserved and expanded with both income/net-worth tiers in lesson 03.
Existing topic l3 is You can lose it all. This is preserved without an unsupported failure-rate statistic in lesson 04.
Existing topic l4 is It's illiquid. This is preserved in lesson 05.
Existing topic l5 is Read the Form C. This is preserved in lesson 06.

No educational video file or external educational video link was found in the repository-wide scan. Four six-second MP4 files do exist, public/live/pitch-lumen.mp4, public/live/pitch-tally.mp4, public/x/pitch-lumen.mp4 and public/x/pitch-tally.mp4. These are fictional company pitch assets, not investor education. Founder profile video_url fields store founder uploads and likewise are not lessons.

Coverage expands to twenty lessons. New content is not imported into application code. No website change, merge, publish, live offering, investment solicitation or payment is authorized by this content task.

The existing limits card omits the second income/net-worth tier. It also needs a publication-time rules review. The new lesson includes both tiers, the rolling twelve-month aggregate, and primary-residence exclusions. The existing assertion 'Most startups fail' is replaced with a non-statistical warning that the full investment may be lost.
