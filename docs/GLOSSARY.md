# Glossary

Domain terms used across requirements and design. Devotional terms are described in the app's functional sense; they are not theological definitions.

## Devotional / community terms

| Term | Meaning in the app |
| --- | --- |
| **Devotee / Participant** | An end user who follows temples, groups, or Gurus and joins their events. |
| **Temple** | A host organization representing a physical or online temple. |
| **Guru / Swamiji** | A spiritual teacher who hosts; may have disciples/sevaks as co-hosts. |
| **Disciple / Sevak** | A trusted helper of a Guru or temple who can co-host or moderate. |
| **Group** | A devotee community (e.g. a regional sangha) that hosts gatherings. |
| **Satsang** | A live gathering for devotional discussion/company; an event type. |
| **Pravachan / Discourse** | A talk or sermon delivered by a Guru; an event type. |
| **Bhajan / Kirtan** | Devotional singing session; an event type. |
| **Darshan** | "Viewing"; here, a session where devotees see/greet the host or deity. |
| **Puja / Aarti / Havan** | Ritual ceremonies offered as guided **virtual rituals**. |
| **Virtual Temple / Live Ritual Room** | A live session where a host performs a guided puja on a shared on-screen deity while devotees watch, listen, and make their own offerings to the same murti (FR-41…FR-50). |
| **Murti** | The deity image/idol; here, the shared deity the host places on the canvas as the ritual's centerpiece. |
| **Archana** | The host's act of worship — reciting names/mantras and making offerings to the deity. |
| **Abhishekam** | Ceremonial bathing of the deity (e.g. water/milk); represented as a "water" offering on the canvas. |
| **Offering / Upachara** | An item offered to the deity during puja. In-app palette: flowers (pushpa), **kumkuma**, **chandan** (sandal), saffron/**akshata**, water, agarbathi (incense), aarti (lamp). |
| **Kumkuma** | Red vermilion powder offered/applied; rendered as a dot/streak on the deity. |
| **Chandan** | Sandalwood paste offered/applied; rendered as a mark on the deity. |
| **Akshata** | Turmeric-coloured rice grains offered to the deity. |
| **Offering window** | A host-controlled interval during which devotees may make a given offering ("offer flowers now"). |
| **Sankalpa** | The intention/dedication a devotee states for a ritual (often with name, gotra, location). |
| **Seva / Dakshina** | Service or offering; maps to optional donations/offerings. |
| **Prasad / Blessing** | Post-ritual blessing or token sent to participants (digital, or physical fulfilment later). |
| **Occasion** | A recurring or one-off scheduled event (e.g. festival, weekly satsang). |

## Platform / technical terms

| Term | Meaning |
| --- | --- |
| **Host** | Any account type that can create occasions and broadcast (Temple, Group, Guru). |
| **Subscription** | Recurring paid access to a host's content/events. |
| **Pay-per-event** | One-time payment to attend a specific event or ritual. |
| **Platform commission** | The percentage Clique retains from host earnings. |
| **Payout** | Settlement of host earnings (via Razorpay Route/transfers). |
| **Room** | A live audio/video session backed by the media server (LiveKit). |
| **Stage / Audience** | In a Live Ritual Room: **stage** = the low-latency WebRTC room (host + promoted speakers); **audience** = thousands watching the stage via one-to-many HLS broadcast. |
| **HLS egress** | LiveKit transcoding of the stage to an HLS stream served over CDN for large audiences (~5–10s latency, listen/watch). |
| **Raise-hand / promote** | A devotee requests to speak; if the host approves they are promoted from audience (HLS) to stage (WebRTC publisher), then demoted afterward. |
| **Realtime broadcast (canvas sync)** | Supabase Realtime channel (one per meeting) carrying the host's deity placement, offerings, offering-window state, and the anonymous tally to all participants. |
| **Deity-local coordinates** | Offering positions stored relative to the deity's own space (not the screen) so the host's offerings align on every device regardless of screen size. |
| **Broadcast / Announcement** | A group-level message pushed to a host's followers. |
