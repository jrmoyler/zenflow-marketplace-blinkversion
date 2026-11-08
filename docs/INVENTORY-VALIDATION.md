# ZenFlow Master Inventory: validation report

Generated 2026-11-08 by `tools/inventory/build.py` from `tools/inventory/master-inventory.txt` (the PDF's text).

The PDF lists 400 assets. **399 are listed**; 1 were dropped.

| Category | Listed |
|---|---|
| agents | 100 |
| workflows | 100 |
| bots | 99 |
| databases | 100 |

| Division | Listed |
|---|---|
| ZenFlow | 74 |
| Signal Velocity | 70 |
| Nexus Labs | 50 |
| Quantum Ledger | 46 |
| Hybrid Living | 44 |
| Binary Loom | 32 |
| Terra Axis | 24 |
| The Collective | 21 |
| Vital Helix (pending activation) | 18 |
| Juris Guard | 13 |
| Obsidian Arc | 5 |
| Kinetic Edge | 2 |

Prices are provisional, set per section in `build.py` (`PRICE`, `DB_PRICE`).

## Dropped (1)

- Yandere Bot (3.5 #2): A possessive romantic-companion persona encourages emotional dependency and models controlling behaviour. Not listed.

## Reworked for safety, law or accuracy (22)

- Meeting Dossier: Scraping attendees' profiles breaks LinkedIn's terms and collects personal data; it now uses the buyer's own CRM and email.
- Champion Tracker: Checking LinkedIn job updates means scraping LinkedIn; it now uses signals from the buyer's own CRM.
- Invoice Nagger: 'Legal (14d)' sent accounts to legal automatically; a person now decides.
- Chaos Monkey: Random reboots in production need an explicit opt-in; staging by default.
- Resume Shortlist: Automatic rejection is an automated employment decision regulated in several US jurisdictions; a recruiter now decides.
- Toxic Monitor: Deleting messages automatically now hides them for a moderator to review.
- Rain Promo: Raising prices because of weather can break price-gouging laws during declared emergencies; it now promotes rain gear instead.
- Rent Nudge: Late fees now need the owner's approval and must match the lease and local law.
- Company Box: Filing an LLC is a legal act; the workflow prepares the filing and the owner signs.
- Kill Switch: Selling assets automatically is irreversible; access is locked automatically and any sale waits for the owner.
- Viral Loop: Scraping the users who engage with a post breaks platform terms and privacy law; the audience is built from the buyer's own site visitors.
- Digital Twin: Limited to the buyer's own content.
- Roast Master → Roast Master: Insulting users from their profiles without consent is harassment; roasts are now opt-in.
- Local Crime → Reported Crime by Agency (FBI Crime Data): Agency-level reporting only. It may not be used to screen or steer tenants or buyers by neighborhood (US Fair Housing Act).
- School Ratings → Schools by City (NCES via Urban Institute): Describes schools; does not rank neighborhoods for steering buyers or tenants.
- Ad Library → Meta Ad Library: Uses the official API with your token. In the US, Meta only exposes political and issue ads; in the EU it covers all ads.
- Patent Expiry → Patent Expiry Estimates (PatentsView): Expiry is an estimate (filing date + 20 years) that ignores term adjustments and disclaimers; confirm with counsel.
- Sanctions List → Sanctions List (OFAC SDN): A name match is not a determination. Every hit goes to a person for review before any decision.
- Judge Analytics → Court Opinions Search (CourtListener): Returns the opinions themselves. Predicting how a named judge will rule is left to counsel.
- Cancel Culture → Public Attention Shifts (Wikipedia pageviews): Renamed from 'Cancel Culture'. It measures attention, not sentiment, and makes no claim about the person.
- Lego ROI → LEGO Set Catalog (Rebrickable): Catalog data only. Investment-return claims from the PDF were dropped; past resale gains don't predict future ones.
- Hate Speech → Hate Speech Labels (Measuring Hate Speech): For training moderation systems only; contains offensive text by design.

## Paid datasets swapped for real public sources (50)

- Satellite Retail Traffic → Monthly Retail Sales (Census MARTS): Satellite parking-lot car counts are a paid dataset; official monthly retail sales measure the same demand signal.
- Corporate Jet Tracker → Executive Changes (SEC 8-K Item 5.02): Tracking executives' private flights is surveillance of individuals; leadership changes come from filings the company makes public itself.
- Credit Card Panel → Consumer Prices (BLS CPI): Card-spend panels are licensed from banks; CPI is the public measure of what consumers pay.
- Supply Chain BOL → US Imports by Commodity (Census Trade): Bill-of-lading logs are sold by private vendors; Census publishes import values by product and country for free.
- SaaS Technographics → Package Adoption (npm downloads): Commercial technographics come from paid crawlers; package downloads are a public adoption signal.
- Short Squeeze → Daily Short Volume (FINRA Reg SHO): The PDF paired short interest with social volume from paid feeds; FINRA's daily short volume is free and official.
- Crypto Whales → Large Ethereum Transfers (Blockscout): Wallet labels that name owners are sold by analytics firms; this lists large on-chain transfers without guessing who owns them.
- Permit Leading Indicators → Building Permits (Census): Renovation-permit feeds are aggregated by private vendors; the Census permit series is the public source.
- Airbnb Occupancy → Lodging Prices (BLS CPI): Airbnb occupancy data is sold by third parties; lodging prices are the public demand signal for short stays.
- Zoning Maps → Land Use Around a Point (OpenStreetMap): There is no national zoning API; mapped land use is the closest public picture. Check the local zoning office before relying on it.
- Flood Projections → Flood Claims History (FEMA NFIP): 2050 flood projections are a licensed model; historic paid claims are public and show where flooding has already cost money.
- Lease Comps → Median Rent by ZIP (Census ACS): Commercial lease comps come from paid brokerage databases; ACS median rent is the public benchmark.
- Signal Strength → Cell Tower Locations (OpenStreetMap): Carrier signal-quality maps are licensed; mapped towers are the public alternative and do not measure signal.
- Amazon Rank History → Brand Attention (Wikipedia pageviews): Amazon rank history is resold by paid trackers; Wikipedia attention is a free, public interest signal.
- Shopify Tech → E-Commerce Sales (Census Quarterly): Shopify app-usage data is crawled by paid vendors; Census e-commerce sales size the whole market.
- TikTok Viral → Trending Topics (Wikipedia top articles): TikTok has no public trends API; Wikipedia's daily top articles are a public read on what is trending.
- Influencer Rates → YouTube Channel Stats: Influencer rate cards are private; public channel stats are the input any rate estimate starts from.
- Supplier Verify → Company Verification (GLEIF LEI): Vetted dropship supplier lists are private; the LEI registry verifies a company exists and is in good standing.
- DTC Directory → Brand Websites (Wikidata): Scraped DTC contact lists collect personal data without consent; this returns company websites only.
- Keyword Niche → Keyword Expansion (Datamuse): Search-volume keyword tools are paid; Datamuse gives related terms and frequency for free.
- Counterfeit Log → Consumer Product Recalls (CPSC): Counterfeit seizure logs aren't published as an API; recalls are the public product-safety record.
- Hospital Pricing → Hospital Directory and Ratings (CMS): Procedure price-transparency files are huge per-hospital downloads with no unified API; CMS's hospital directory is.
- Referral Graph → Provider Directory (NPPES NPI Registry): Doctor referral graphs are built from claims data and sold; the NPI registry is the public provider directory.
- Epidemic Signals → Wastewater Virus Signals (CDC NWSS): Symptom search trends come from search engines' private data; wastewater surveillance is the public early signal.
- Mental Health Map → Mental Health Treatment Locator (SAMHSA): Provider-density gap maps are a derived product; SAMHSA's locator is the public source they are built from.
- GDPR Fines → Privacy Enforcement (FTC, Federal Register): GDPR fine trackers are compiled privately with no API; US privacy enforcement is published officially.
- H1B Salaries → Occupational Wages (BLS OEWS): H-1B disclosure files are bulk spreadsheets with no API; OEWS is the official wage benchmark.
- FOIA Log → FOIA Agency Directory (FOIA.gov): A request-by-request tracking log isn't published; FOIA.gov lists the offices and how to file.
- Police Force → Violent Crime Trend by State (FBI): The FBI's use-of-force collection has no public API; state violent-crime and clearance rates come from the same Crime Data Explorer.
- UFO Sightings → Fireball and Bolide Events (NASA CNEOS): UFO sighting reports have no official API; NASA publishes the confirmed objects people actually see in the sky.
- Wine Vintages → Vintage Weather (Open-Meteo): Vintage ratings are critics' copyrighted scores; the season's weather is public and explains them.
- Sneaker Index → Footwear Prices (BLS CPI): Sneaker resale prices are scraped from marketplaces that forbid it; the footwear CPI is the public price signal.
- Michelin History → Michelin-Starred Restaurants (Wikidata): Michelin's own guide data is proprietary; Wikidata's community records are open, and coverage is partial.
- Medical Dialogue → Medical Q&A Pairs (MedQuAD): Doctor-patient transcripts are protected health information; MedQuAD is built from public NIH pages.
- Midjourney Pairs → Image Generation Prompts (Stable Diffusion): Midjourney output pairs are restricted by Midjourney's terms; this is an openly published prompt set.
- Reddit Growth → Discussion Velocity (Hacker News): Reddit's API now requires paid commercial access; Hacker News is open.
- Twitter Crisis → Crisis Velocity (GDELT news tone): X (Twitter) data now requires a paid API tier; news tone is the open early-warning signal.
- LinkedIn Jobs → Job Openings (BLS JOLTS): LinkedIn forbids scraping and has no public jobs API; JOLTS is the official hiring-demand series.
- Podcast Sponsors → Podcast Directory (Apple Podcasts): Sponsor-mention indexes come from paid transcript mining; this finds the shows to approach.
- Substack Growth → Newsletter Feed Tracker (any public RSS): Substack has no public growth API; the feed shows what is published and how often.
- Used Car Values → Used Vehicle Prices (BLS CPI): Depreciation curves by model come from paid valuation guides; the used-vehicle CPI is the public trend.
- Flight Delays → Live Airport Delays (FAA): Historic delay statistics are bulk downloads; the FAA's live status feed is the real-time view.
- Container Rates → Ocean Freight Prices (BLS PPI): Spot container rates are licensed indices; the freight PPI is the public trend.
- Oil Rigs → Crude Oil Spot Prices (EIA): Rig counts are published by Baker Hughes without an API; EIA spot prices are the official oil signal.
- Hotel RevPAR → Hospitality Employment (BLS CES): Hotel RevPAR is licensed from STR; hospitality employment is the public read on the sector.
- Global Law → US Federal Regulations (eCFR): A pre-embedded copy of global law would go stale; this retrieves current US federal regulations at query time.
- Medical Guidelines → Health Topics (MedlinePlus): Clinical guideline libraries are licensed; MedlinePlus is the public, plain-language health reference.
- Tech Manuals → Repair Guides (iFixit): Manufacturer manuals are copyrighted PDFs; iFixit's guides are openly licensed.
- Corp Policies → Workplace Rules (eCFR Title 29): Standard HR handbooks are company documents, not a public dataset; federal labor rules are what handbooks must follow.
- Philosophy → Philosophy Texts (Open Library): Gutendex timed out repeatedly in testing; Open Library indexes the same public-domain texts.

## Renamed (38)

- Shadow CEO → CEO FAQ: Answering 'as the CEO' impersonates a real person; it now summarizes approved statements and says so.
- Fandom Switch → Character Switch: Yoda and Darth Vader are Lucasfilm characters; replaced with original archetypes.
- Sleep Police → Sleep Nudge: 'Scolds' changed to a reminder; shaming people doesn't change sleep habits.
- Diet Critic → Meal Logger: Rating food photos can feed disordered eating; it now logs without judging.
- Expense Nagger → Expense Nudge: 'Shames' changed to a neutral flag.
- Lobbying Index → Lobbying Filings (Senate LDA)
- Insider Whales → Insider Trades (SEC Form 4)
- ESG Controversy → ESG Controversy Feed (GDELT)
- Solar Index → Rooftop Solar Yield (NREL PVWatts)
- Coffee Index → Cafe Density (OpenStreetMap)
- Review Sentiment → App Store Reviews (Apple)
- Trial Outcomes → Clinical Trials (ClinicalTrials.gov)
- FDA Adverse Events → Drug Adverse Events (openFDA)
- Device Recalls → Medical Device Recalls (openFDA)
- Nutrition DB → Food Products by Barcode (Open Food Facts)
- Longevity Papers → Longevity Research (PubMed)
- Class Action Feed → Class Action Filings (CourtListener)
- ToS Changes → Terms of Service Change History (Wayback Machine)
- Bankruptcy → Bankruptcy Dockets (CourtListener)
- Esports Stats → Pro Esports Players (OpenDota)
- Deepfake Index → Deepfake Incidents in the News (GDELT)
- Space Junk → Space Debris Orbits (CelesTrak)
- Code-Instruct → Python Instruction Pairs (CodeAlpaca)
- Math CoT → Math Reasoning Steps (GSM8K)
- Support Sentiment → Customer Support Conversations (Bitext)
- Phishing Corpus → Phishing Email Corpus
- SQL-Text → Text-to-SQL Pairs
- Summarization → Summarization Pairs (BillSum)
- App Reviews → App Store Top Charts (Apple)
- Twitch Stats → Twitch Live Streams
- Github Velocity → GitHub Repo Velocity
- Construction Materials → Construction Materials Prices (BLS PPI)
- Grid Load → Grid Demand by Region (EIA)
- EV Stations → EV Charging Stations (NREL AFDC)
- Health Scores → Restaurant Inspections (NYC Open Data)
- Financial Reports → Financial Statements (SEC XBRL)
- StackOverflow → Stack Overflow Answers
- CVE Database → Security Vulnerabilities (NVD CVE)

## Moved to the division that does the work (12)

- Quote-to-Cash → Quantum Ledger
- Bio-Data Sync → Vital Helix
- Toxic Monitor → Obsidian Arc
- Company Box → Juris Guard
- Kill Switch → Obsidian Arc
- Devil’s Advocate → The Collective
- Workout Spotter → Kinetic Edge
- Fasting Coach → Vital Helix
- Anxiety Grounder → Vital Helix
- Symptom Triage → Vital Helix
- Meal Logger → Vital Helix
- Cycle Tracker → Vital Helix

## Held for Vital Helix (listed, not rentable) (18)

- Bio-Data Sync (workflow)
- Fasting Coach (bot)
- Anxiety Grounder (bot)
- Symptom Triage (bot)
- Meal Logger (bot)
- Cycle Tracker (bot)
- Clinical Trials (ClinicalTrials.gov) (database)
- Hospital Directory and Ratings (CMS) (database)
- Drug Adverse Events (openFDA) (database)
- Provider Directory (NPPES NPI Registry) (database)
- Wastewater Virus Signals (CDC NWSS) (database)
- Genomic Variants (ClinVar) (database)
- Medical Device Recalls (openFDA) (database)
- Mental Health Treatment Locator (SAMHSA) (database)
- Food Products by Barcode (Open Food Facts) (database)
- Longevity Research (PubMed) (database)
- Medical Q&A Pairs (MedQuAD) (database)
- Health Topics (MedlinePlus) (database)

## Same name in two categories (both kept, ids differ) (9)

- socratic-tutor → id socratic-tutor-bot
- language-pal → id language-pal-bot
- time-traveler → id time-traveler-bot
- math-visualizer → id math-visualizer-bot
- text-adventure → id text-adventure-bot
- habit-stacker → id habit-stacker-bot
- regex-wizard → id regex-wizard-bot
- dep-watcher → id dep-watcher-bot
- gift-reminder → id gift-reminder-bot
