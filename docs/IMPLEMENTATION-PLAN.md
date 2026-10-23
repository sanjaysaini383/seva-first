# Hearth: Innovation & Implementation Plan

**Seva First Innovation Challenge (Eastern Region)**
Themes: Disaster Management & Community Safety · Climate & Flood Resilience · Urban & Civic Innovation · Village & Panchayat Innovation

> Costs and numbers in this plan are estimates or targets, not results.

---

## 1. Problem and location

**Problem.** During monsoon flooding and waterlogging, people who need urgent, small-scale help (a boat to reach a relief camp, insulin or blood-pressure medicine, clean drinking water, a dry room for the night) often cannot reach the neighbours who could provide it. Help is usually available within a few hundred metres, but:

- **Requests get lost.** Locality WhatsApp groups have hundreds of members; an urgent message scrolls out of view in minutes.
- **Nobody can see the whole picture.** Volunteers can't tell which requests are still open, where they are, or which are most urgent.
- **Effort is duplicated or missed.** Two volunteers go to the same house while another request gets no response.
- **Language is a barrier.** Many residents are more comfortable writing in Bengali or Hindi than in English.

The same problem exists on ordinary days for elderly people living alone, patients needing a lift to hospital, or families needing groceries during illness.

**Location.** West Bengal, starting with one flood-prone pilot area:
- **Pilot area:** one flood-prone Kolkata Municipal Corporation ward with recurring monsoon waterlogging, selected with the ward councillor.
- Later: other districts of West Bengal, Bihar and Jharkhand that face recurring floods.

## 2. Proposed solution

**Hearth** is a free, browser-based app that puts neighbourhood requests and offers on a live map.

- A resident posts a **request** ("need a boat, elderly mother on the ground floor") or an **offer** ("hot meals for 20 people at the club") in Bengali, Hindi or English, pinned to their street.
- Everyone within a chosen radius sees it **instantly**. Emergency categories (Rescue / boat, Medicine, Drinking water, Shelter) are listed first, and an **Emergency mode** shows only open emergency posts, most urgent first.
- A neighbour taps **"I can help"**. The system guarantees only one person can claim a request, so effort isn't duplicated.
- Both sides coordinate in a **thread** on the post. When it's resolved, the requester marks it **done** and sends kudos. Every request has a clear status: open → in progress → completed.
- A **Heroes board** recognises the most active volunteers, encouraging participation.

Joining needs only a first name: no app install, email or password.

## 3. Technology / method

- **Web app** (React, TypeScript) that runs in any modern mobile browser. It can be opened from a link or QR code; no app store.
- **Backend:** Appwrite Cloud (open-source backend platform) for the database, sign-in, permissions and real-time updates. No custom server to maintain.
- **Maps:** Leaflet with OpenStreetMap, which is free and needs no paid API key.
- **Key technical safeguards:**
  - *Race-safe claiming:* a database transaction rejects a second, simultaneous claim (verified by an automated test).
  - *All-or-nothing completion:* status, kudos and thank-you message are saved together or not at all.
  - *Location search:* the database returns only posts within the chosen radius using a spatial index.
  - *Privacy:* only a first name is shown; no phone number or email is collected.
- **Languages:** full interface in Bengali, Hindi and English; users can post in any language.
- **Quality:** an automated check (`npm run smoke`) verifies every database feature against a live project.

## 4. Implementation plan

| Phase | Activities |
| --- | --- |
| **Partnering** | Agree the pilot area with the ward councillor / panchayat pradhan and approach the local disaster management or civil defence office. Identify 2–3 local organisations (clubs, NGOs, self-help groups) to anchor volunteers. |
| **Localisation** | Review the Bengali and Hindi text with local users. Add area-specific categories if needed (e.g. livestock, fodder). Configure the map centre for the pilot area. |
| **Onboarding** | Train 20–40 volunteers (club members, ASHA/Anganwadi workers, youth groups) in short sessions. Put up QR-code posters at ration shops, clubs, schools and relief camps. |
| **Pilot** | Run through the monsoon season. A small coordination group monitors open emergency posts daily and helps residents who cannot use a phone. |
| **Review** | Measure the indicators in section 8, gather feedback, fix problems, and decide on expansion with partners. |

Residents without smartphones are covered by **assisted posting**: a volunteer, club or panchayat office posts on their behalf.

## 5. Cost and funding

Indicative pilot budget for one area over about 6 months (**estimates**, to be refined with partners):

| Item | Estimate |
| --- | --- |
| Hosting and database (Appwrite Cloud free tier during the pilot; paid tier if usage grows, roughly ₹2,000–2,500 per month at current pricing) | ₹0 – ₹15,000 |
| Domain name | ₹1,000 |
| QR-code posters and printed guides (Bengali / Hindi) | ₹8,000 |
| Volunteer training sessions (venue, refreshments, travel) | ₹15,000 |
| Feedback survey and field visits | ₹10,000 |
| Contingency | ₹6,000 |
| **Total (indicative)** | **about ₹40,000 – ₹55,000** |

**Funding sources:** challenge support, ward/panchayat community funds, local CSR from businesses, and in-kind support (venues, printing) from clubs and NGOs. The software is open source, so there are no licence fees.

## 6. Beneficiaries

- **Primary:** residents of the pilot area who need help during floods and in daily life, especially elderly people living alone, patients, people with disabilities, pregnant women and families on ground floors in flood-prone lanes.
- **Volunteers:** neighbours, clubs and youth groups, who get a clear, organised way to help and recognition for it.
- **Local administration and responders:** a live picture of open needs in the area, which can support relief planning.

**Pilot targets:** about 300–500 registered residents and 30–50 active volunteers in one ward during the first monsoon. Counting their households (about 4 people each), roughly 1,200–2,000 people could be helped.

**How this was estimated:** a Kolkata Municipal Corporation ward has about 31,000 residents on average (Census 2011: about 4.5 million people across 144 wards). The targets assume 1–2% of residents register in the first season through volunteers and posters.

## 7. Timeline

| Month | Milestone |
| --- | --- |
| 1 | Partner agreements, pilot area fixed, localisation review |
| 2 | Volunteer training, QR poster campaign, soft launch |
| 3–5 | Live pilot through the monsoon, with weekly check-ins |
| 6 | Evaluation report, improvements, expansion decision |

Ideally the pilot starts **before the monsoon** (April–May) so volunteers are trained before flooding begins.

## 8. Expected impact

The pilot will measure (targets, not results):

- **Response time:** median time from an emergency post to someone claiming it. *Target: under 30 minutes.*
- **Resolution rate:** share of requests marked completed. *Target: over 70%.*
- **No duplicated effort:** each request claimed by exactly one helper (guaranteed by the system).
- **Reach:** number of residents, volunteers and completed requests; share of posts written in Bengali or Hindi.
- **Satisfaction:** short feedback survey of requesters and volunteers.

Beyond floods, the same tool keeps working all year for everyday neighbourly help, which keeps the network active for when the next emergency comes.

## 9. Scalability

- **Low cost to replicate:** each new area needs only map coordinates and local volunteers; no new software.
- **Serverless backend:** Appwrite Cloud scales with usage, with no servers to manage.
- **Multilingual by design:** adding another language (e.g. Santali, Odia, Nepali for hill areas) means adding one translation file.
- **Open source:** other municipalities, NGOs or state agencies can adopt and adapt it freely.
- **Possible extensions:** SMS or WhatsApp alerts for urgent nearby requests, an admin dashboard for ward offices and disaster management cells, verified volunteer badges, and offline/low-bandwidth support.

## 10. Prototype / pilot evidence

A **working prototype** exists and is publicly available:

- **Source code:** https://github.com/sanjaysaini383/seva-first
- **Features working today:** live map, radius search, requests and offers, emergency categories and emergency mode, race-safe claiming, threads, completion with kudos, Heroes board, and the full Bengali / Hindi / English interface.
- **Testing:** an automated check verifies every database feature against a live Appwrite Cloud project, including a forced simultaneous claim. A two-user browser test covers posting, live delivery, claiming, chat and completion.
- **Screenshots:** see the supporting document *prototype.pdf*.

No field pilot has been run yet; that is the purpose of the proposed implementation.

---

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Mobile network outages during severe floods | Assisted posting by volunteers with working connectivity; future SMS fallback; posts are short and load quickly. |
| Residents without smartphones | Volunteers, clubs and panchayat offices post on their behalf. |
| Misuse or false requests | Volunteers coordinate in threads before acting; ward-level moderators; reporting feature planned. |
| Privacy | First name only; pins can be placed at street level; no phone numbers stored. |
| Low adoption | Launch through trusted local organisations and QR posters at everyday places; keep the app useful year-round. |
