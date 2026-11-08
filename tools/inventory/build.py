"""Build the ZenFlow Master Inventory listings from the PDF text.

  python3 tools/inventory/parse.py   # PDF text -> raw.json (400 records, as written)
  python3 tools/inventory/build.py   # raw.json + rules below -> src/data/inventory.json,
                                     #   api/_lib/datasets.json, docs/INVENTORY-VALIDATION.md

Every change to an asset as the PDF wrote it is recorded in the validation report.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from datasets import DATASETS  # noqa: E402

TODAY = "2026-11-08"
VERSION = "1.0.0"
RAW = json.load(open(os.path.join(HERE, "raw.json"), encoding="utf8"))

# ── Divisions ────────────────────────────────────────────────────────────────
AGENT_SECTION = {"1.1": "The Collective", "1.2": "Nexus Labs", "1.3": "Binary Loom", "1.4": "Signal Velocity",
                 "1.5": "Hybrid Living", "1.6": "Quantum Ledger", "1.7": "Hybrid Living", "1.8": "Hybrid Living",
                 "1.9": "ZenFlow", "1.10": "ZenFlow"}
WORKFLOW_SECTION = {"2.1": "Signal Velocity", "2.2": "Signal Velocity", "2.3": "Quantum Ledger", "2.4": "Binary Loom",
                    "2.5": "ZenFlow", "2.6": "The Collective", "2.7": "Signal Velocity", "2.8": "Terra Axis",
                    "2.9": "Nexus Labs", "2.10": "ZenFlow"}
BOT_SECTION = {"3.1": "Nexus Labs", "3.2": "ZenFlow", "3.3": "Signal Velocity", "3.4": "Hybrid Living",
               "3.5": "Nexus Labs", "3.6": "Hybrid Living", "3.7": "Binary Loom", "3.8": "Quantum Ledger",
               "3.9": "Nexus Labs", "3.10": "ZenFlow"}
PENDING = {"Vital Helix"}

# ── Per-asset rules, keyed (category, section, n) ─────────────────────────────
# Keys: publisher, title, prompt, desc, scopes, refusals (added), escalations (added),
#       drop (reason), rework (reason shown in the report), price, model.
A, W, B = "agents", "workflows", "bots"
RULES = {
    (A, "1.3", 2): dict(publisher="Obsidian Arc", refusals=["Only reviews code the buyer owns or is authorized to test", "Never writes working exploits against third-party systems"]),
    (A, "1.2", 4): dict(refusals=["Only imitates writing the buyer owns or has permission to imitate", "Never impersonates a real person to deceive readers"]),
    (A, "1.4", 4): dict(prompt="Role: Skeptical Target Buyer. Task: React honestly to the user's pitch. Be blunt about price and confusion.",
                       rework="The PDF's system prompt was missing its role ('Role:.'); filled in as a skeptical target buyer."),
    (A, "1.5", 2): dict(publisher="Vital Helix", prompt="Role: Sleep Scientist. Task: Calculate caffeine, light and exercise windows based on wake time.",
                       scopes=["chat", "health"], refusals=["Never diagnoses sleep disorders", "Never advises on sleep medication"],
                       rework="Removed the 'Huberman-style' persona: it implied a real person's endorsement."),
    (A, "1.5", 3): dict(publisher="Vital Helix", scopes=["chat", "health"],
                       refusals=["Never sets calorie or weight targets for anyone under 18", "Never designs diets for medical conditions", "Never presents a meal plan as medical advice"]),
    (A, "1.5", 6): dict(publisher="Kinetic Edge", refusals=["Never programs through pain or injury", "Never pushes past the gear and fitness level the user states"]),
    (A, "1.6", 1): dict(publisher="Juris Guard"),
    (A, "1.6", 4): dict(prompt="Role: Blunt Money Coach. Task: Call out an unnecessary purchase without insults. Calculate the future value if invested in an S&P 500 index fund instead.",
                       rework="The PDF's 'Financial Domme' role was sexualized; rewritten as a blunt money coach."),
    (A, "1.6", 5): dict(publisher="Terra Axis"),
    (A, "1.6", 10): dict(publisher="Juris Guard"),
    (A, "1.8", 3): dict(refusals=["Never presents itself as therapy", "Never interprets trauma"], escalations=["User mentions self-harm or a crisis: share 988 (US) and stop the exercise"]),
    (A, "1.8", 6): dict(refusals=["Labels prophetic readings as entertainment", "Never predicts health or death"]),
    (A, "1.8", 7): dict(refusals=["Never presents itself as a counselor or therapist"], escalations=["User mentions self-harm or a crisis: share 988 (US) and encourage a person they trust"]),
    (A, "1.8", 9): dict(refusals=["Never diagnoses a child", "Never advises physical discipline"], escalations=["Signs of abuse or a child in danger: point to local child protective services"]),
    (A, "1.9", 2): dict(refusals=["Labels every reading as entertainment", "Never advises on health, money or legal decisions"]),
    (A, "1.9", 3): dict(publisher="Terra Axis", refusals=["Never walks through gas-line, panel or structural work: refers to a licensed pro"]),
    (A, "1.9", 5): dict(publisher="Nexus Labs"),
    (A, "1.9", 6): dict(refusals=["Labels every reading as entertainment"]),
    (A, "1.9", 8): dict(escalations=["Life-threatening situation described: tell the user to call emergency services first"]),
    (A, "1.10", 4): dict(refusals=["Never involves real, named people", "Labels every output as satire so it can't be passed off as fact"]),
    (A, "1.10", 6): dict(publisher="Nexus Labs"),
    (A, "1.10", 8): dict(publisher="Nexus Labs"),
    (A, "1.10", 9): dict(publisher="Juris Guard"),
    (A, "1.10", 10): dict(title="The ZenFlow Haiku", rework="Renamed from 'The ZenFlow' so it isn't mistaken for the division."),
    (A, "1.1", 6): dict(refusals=["Never issues a public statement on the buyer's behalf; drafts only"]),

    (W, "2.2", 3): dict(desc="1hr Before -> Look Up Attendees in Your CRM and Email History -> Summarize History -> Email Host",
                        rework="Scraping attendees' profiles breaks LinkedIn's terms and collects personal data; it now uses the buyer's own CRM and email."),
    (W, "2.2", 5): dict(desc="Quarterly -> Check Champion Contacts in CRM for Bounced Emails or New Company Domains -> Alert Rep if Changed",
                        rework="Checking LinkedIn job updates means scraping LinkedIn; it now uses signals from the buyer's own CRM."),
    (W, "2.2", 9): dict(publisher="Quantum Ledger"),
    (W, "2.3", 2): dict(desc="Overdue -> Calc Days -> Gentle Email (3d) -> Firm Email (7d) -> Owner Decides on Collections (14d)",
                        rework="'Legal (14d)' sent accounts to legal automatically; a person now decides."),
    (W, "2.4", 10): dict(desc="Random Schedule -> Reboot a Staging Service (Production Only With Owner Approval) -> Measure Recovery -> Log",
                         rework="Random reboots in production need an explicit opt-in; staging by default."),
    (W, "2.5", 7): dict(publisher="Vital Helix"),
    (W, "2.6", 1): dict(title="Resume Shortlist", desc="Application -> Parse PDF -> Match Skills -> Shortlist for Recruiter Review -> Recruiter Sends Decision",
                        rework="Automatic rejection is an automated employment decision regulated in several US jurisdictions; a recruiter now decides."),
    (W, "2.6", 9): dict(publisher="Obsidian Arc", desc="Public Msg -> Analyze Toxicity -> Hide and Flag for a Moderator if High",
                        rework="Deleting messages automatically now hides them for a moderator to review."),
    (W, "2.7", 8): dict(title="Rain Promo", desc="Rain Forecast -> Feature Umbrellas and Rain Gear -> Push Notification",
                        rework="Raising prices because of weather can break price-gouging laws during declared emergencies; it now promotes rain gear instead."),
    (W, "2.8", 4): dict(desc="1st of Month -> Check Balance -> SMS Reminder -> Owner Approves Any Late Fee per Lease and Local Law",
                        rework="Late fees now need the owner's approval and must match the lease and local law."),
    (W, "2.10", 1): dict(publisher="Juris Guard", desc="Payment -> Domain -> Google Workspace -> Website -> Prepare LLC Filing for Owner Signature",
                         rework="Filing an LLC is a legal act; the workflow prepares the filing and the owner signs."),
    (W, "2.10", 6): dict(publisher="Obsidian Arc", desc="Market Crash or Breach Signal -> Lock Server Access -> SMS Owner -> Owner Approves Any Asset Sale",
                         rework="Selling assets automatically is irreversible; access is locked automatically and any sale waits for the owner."),
    (W, "2.10", 7): dict(desc="Viral Post -> Reply With Tracked Link -> Count Clicks to Your Site -> Build Retargeting Audience From Your Own Site Visitors",
                         rework="Scraping the users who engage with a post breaks platform terms and privacy law; the audience is built from the buyer's own site visitors."),
    (W, "2.10", 8): dict(desc="User's Own Content (With Consent) -> Fine-tune LLM -> Update Persona",
                         rework="Limited to the buyer's own content."),

    (B, "3.2", 5): dict(title="CEO FAQ", desc="Answers from the CEO's approved public statements, labeled as an AI summary, never in the CEO's voice.",
                        rework="Answering 'as the CEO' impersonates a real person; it now summarizes approved statements and says so."),
    (B, "3.2", 7): dict(publisher="The Collective"),
    (B, "3.3", 2): dict(refusals=["Only texts people who opted in to SMS (TCPA)"]),
    (B, "3.3", 10): dict(refusals=["Cancels at once if the customer asks twice (FTC negative-option rules)"]),
    (B, "3.5", 2): dict(drop="A possessive romantic-companion persona encourages emotional dependency and models controlling behaviour. Not listed."),
    (B, "3.5", 4): dict(desc="Opt-in roast battles: roasts only people who ask, never about protected traits.",
                        rework="Insulting users from their profiles without consent is harassment; roasts are now opt-in."),
    (B, "3.5", 7): dict(title="Character Switch", desc="Roleplays original archetypes (a wise mentor, a scheming villain) instead of copyrighted characters.",
                        rework="Yoda and Darth Vader are Lucasfilm characters; replaced with original archetypes."),
    (B, "3.5", 8): dict(desc="Practice dating conversations for adults (18+), with no sexual content.", refusals=["Adults only", "No sexual content"]),
    (B, "3.6", 2): dict(publisher="Kinetic Edge"),
    (B, "3.6", 3): dict(publisher="Vital Helix", scopes=["chat", "health"],
                        refusals=["Not for anyone under 18, pregnant, or with a history of eating disorders", "Never recommends fasts longer than 24 hours"]),
    (B, "3.6", 4): dict(publisher="Vital Helix", scopes=["chat", "health"], escalations=["Panic attack or crisis: share 988 (US) and emergency services"]),
    (B, "3.6", 5): dict(title="Sleep Nudge", desc="Sends a friendly wind-down reminder when late-night messaging runs past your chosen bedtime.",
                        rework="'Scolds' changed to a reminder; shaming people doesn't change sleep habits."),
    (B, "3.6", 7): dict(publisher="Vital Helix", scopes=["chat", "health"],
                        refusals=["Never diagnoses", "Never recommends prescription medication"], escalations=["Emergency symptoms: tell the user to call emergency services now"]),
    (B, "3.6", 9): dict(publisher="Vital Helix", title="Meal Logger", desc="Logs meals from photos without rating or judging them.", scopes=["chat", "health"],
                        refusals=["Never rates or judges food", "Never sets calorie targets"],
                        rework="Rating food photos can feed disordered eating; it now logs without judging."),
    (B, "3.6", 10): dict(publisher="Vital Helix", scopes=["chat", "health"], refusals=["Never shares cycle data with anyone", "Never presents predictions as contraception"]),
    (B, "3.8", 4): dict(title="Expense Nudge", desc="Flags discretionary spending against the budget you set, without shaming.",
                        rework="'Shames' changed to a neutral flag."),
}

# ── Section templates ─────────────────────────────────────────────────────────
AUDIENCE = {
    "1.1": "Founders and executives who want a second opinion before a decision.",
    "1.2": "Writers, creators and marketing teams producing content every week.",
    "1.3": "Developers and engineering leads working in a real codebase.",
    "1.4": "Marketers and founders running their own growth.",
    "1.5": "People working on their own habits, health and routines.",
    "1.6": "Individuals and small-business owners making money and contract decisions.",
    "1.7": "Students, researchers and lifelong learners.",
    "1.8": "Anyone working on how they relate to other people and to themselves.",
    "1.9": "Hobbyists who want an expert voice on a niche subject.",
    "1.10": "Curious people who like to think sideways.",
    "2.1": "Marketing teams that publish, advertise and nurture leads.",
    "2.2": "Sales teams running a pipeline in a CRM.",
    "2.3": "Finance and operations staff at a small or mid-sized business.",
    "2.4": "Engineering teams that deploy and run their own services.",
    "2.5": "Busy professionals who want their day handled.",
    "2.6": "People teams at growing companies.",
    "2.7": "E-commerce operators on Shopify or similar.",
    "2.8": "Landlords, property managers and real-estate investors.",
    "2.9": "Creators, podcasters and small studios.",
    "2.10": "Founders who want ambitious automations with a person still in charge.",
    "3.1": "Discord community owners and moderators.",
    "3.2": "Teams that live in Slack.",
    "3.3": "Businesses that talk to customers by SMS or web chat.",
    "3.4": "Learners and the people who teach them.",
    "3.5": "Communities and friends who want games and play.",
    "3.6": "People building healthier daily routines.",
    "3.7": "Developers who want a quick answer without leaving chat.",
    "3.8": "Individual investors and anyone tracking their own spending.",
    "3.9": "Writers, musicians and designers.",
    "3.10": "Anyone who wants small daily decisions taken care of.",
    "4.1": "Analysts and investors who want public market signals in one call.",
    "4.2": "Property investors, managers and developers.",
    "4.3": "E-commerce and brand teams.",
    "4.4": "Health researchers and product teams (non-clinical use).",
    "4.5": "Compliance, legal and risk teams.",
    "4.6": "Researchers and builders who like unusual data.",
    "4.7": "ML engineers training or evaluating models.",
    "4.8": "Marketing and communications teams watching public attention.",
    "4.9": "Analysts tracking real-economy indicators.",
    "4.10": "Teams building retrieval-augmented agents that must cite sources.",
}

PRICE = {  # (model, amount) by section. Provisional, set by the owner; shown as provisional in the UI.
    "1.1": ("monthly", 39), "1.2": ("monthly", 19), "1.3": ("monthly", 29), "1.4": ("monthly", 29), "1.5": ("monthly", 9),
    "1.6": ("monthly", 29), "1.7": ("monthly", 9), "1.8": ("monthly", 9), "1.9": ("monthly", 5), "1.10": ("monthly", 5),
    "2.1": ("one-time", 49), "2.2": ("one-time", 59), "2.3": ("one-time", 59), "2.4": ("one-time", 49), "2.5": ("one-time", 29),
    "2.6": ("one-time", 49), "2.7": ("one-time", 49), "2.8": ("one-time", 49), "2.9": ("one-time", 29), "2.10": ("one-time", 79),
    "3.1": ("monthly", 12), "3.2": ("monthly", 12), "3.3": ("monthly", 19), "3.4": ("monthly", 9), "3.5": ("monthly", 9),
    "3.6": ("monthly", 9), "3.7": ("monthly", 9), "3.8": ("monthly", 9), "3.9": ("monthly", 9), "3.10": ("monthly", 5),
}
DB_PRICE = ("usage", 2)  # $ per 1k queries
FREE = {(A, "1.10", 10), (B, "3.10", 10), (B, "3.9", 9)}

AGENT_SCOPES = {"1.3": ["code", "chat"], "1.6": ["chat", "files"], "1.4": ["chat", "public-web"]}
AGENT_REFUSALS = {
    "1.1": ["Never makes the decision for the user; recommends with reasons", "Never invents numbers it wasn't given"],
    "1.2": ["Never reproduces copyrighted text at length", "Never writes deceptive or defamatory content about real people"],
    "1.3": ["Never runs code; it suggests changes for a developer to apply", "Never asks for or stores secrets"],
    "1.4": ["Never writes deceptive claims or fake reviews", "Never targets people by protected traits"],
    "1.5": ["Never gives medical advice", "Never shames the user"],
    "1.6": ["Never presents output as legal, tax or investment advice", "Never moves money or signs anything"],
    "1.7": ["Never writes graded work for submission as the student's own", "Never invents citations"],
    "1.8": ["Never presents itself as therapy", "Never manipulates the user"],
    "1.9": ["Never gives advice that could cause injury without a safety warning"],
    "1.10": ["Never presents speculation as fact"],
}
BOT_PLATFORM = {"3.1": ["Discord"], "3.2": ["Slack"], "3.3": ["Twilio SMS", "Web"], "3.4": ["Web", "Slack", "Discord"], "3.5": ["Discord", "Web"],
                "3.6": ["Web", "Twilio SMS"], "3.7": ["Slack", "Discord"], "3.8": ["Web", "Slack"], "3.9": ["Web", "Discord"], "3.10": ["Web", "Twilio SMS"]}
ADAPTER = {"Slack": "slack", "Discord": "discord", "Twilio SMS": "sms"}

# Workflow step vocabulary -> (integration, scope)
APPS = [
    (r"\bYouTube\b", "YouTube", "public-web"), (r"\bTweet|Twitter\b", "X (Twitter)", "public-web"), (r"LinkedIn", "LinkedIn", "crm"),
    (r"Clearbit", "Clearbit", "crm"), (r"\bCRM\b|Deal", "HubSpot", "crm"), (r"Slack", "Slack", "chat"), (r"Zoom", "Zoom", "calendar"),
    (r"Email|Gmail|Drip|Newsletter|Invite|Reply", "Gmail", "email"), (r"Scrape|News Search|Search News|Competitor", "HTTP Request", "public-web"),
    (r"Sentiment|LLM|Generate|Draft|Rewrite|Summar|Analy|Urgency AI|Rate Value|Extract|Identify", "ZenFlow agent", "chat"),
    (r"\bAd\b|Ads\b|Campaign|Retarget|Audience|Bid", "Meta Ads", "public-web"), (r"GitHub", "GitHub", "code"), (r"eSign|PDF|Contract", "DocuSign", "files"),
    (r"Xero", "Xero", "payments"), (r"Invoice|Charge|Payment|Stripe|Refund", "Stripe", "payments"), (r"QuickBooks", "QuickBooks", "payments"),
    (r"Printful", "Printful", "pii"), (r"Sheet", "Google Sheets", "files"), (r"Bank|Payables|Cash", "Plaid", "payments"),
    (r"OCR|Attachment|Upload|File|Drive|Folder|Dump", "Google Drive", "files"), (r"ERP", "NetSuite", "payments"), (r"Sanctions", "OFAC SDN", "public-web"),
    (r"Crypto|Basis", "Coinbase", "payments"), (r"TransferWise|FX", "Wise", "payments"), (r"Jira|Ticket|Bug", "Jira", "code"),
    (r"Deploy|Commit|PR\b|Diffs|Merge|Revert|Flag", "GitHub", "code"), (r"CVE|Dependenc", "OSV", "code"), (r"Instance|Server|Certbot|Reboot|Service", "AWS", "code"),
    (r"OpenAPI|Portal", "GitHub", "code"), (r"Calendar|Cal\b|Book", "Google Calendar", "calendar"), (r"Weather|Forecast", "Open-Meteo", "public-web"),
    (r"TTS|Speaker", "ElevenLabs", "chat"), (r"Oura|Apple Health", "Oura", "health"), (r"Kindle", "Readwise", "files"), (r"Amazon", "Amazon", "public-web"),
    (r"Asana", "Asana", "files"), (r"Notion", "Notion", "files"), (r"Trello", "Trello", "files"), (r"Obsidian", "Obsidian", "files"),
    (r"Resume|Application|Survey|HRIS|Onboard|Term Date|Skill", "BambooHR", "pii"), (r"Review", "Trustpilot", "public-web"), (r"Poll|Channel|Post Celebration|DM", "Slack", "chat"),
    (r"Shopify|Order|Stock|Cart|Return|SKU|PO\b|Wholesale|LTV", "Shopify", "payments"), (r"SMS|Text|Push Notification", "Twilio", "pii"),
    (r"Insta|Social|Hashtag|Viral|Clip", "Instagram", "public-web"), (r"Listing|Cap Rate|FSBO|Market Rate", "HTTP Request", "public-web"),
    (r"Lease|Tenant|Rent|Move-out|Inspection|Insurance", "Buildium", "pii"), (r"Code\b|Guest", "Seam (smart locks)", "pii"), (r"Utilities", "Gmail", "email"),
    (r"Typeform", "Typeform", "files"), (r"CMS|Portfolio|Case Study", "Webflow", "files"), (r"Vision AI|Tags|Metadata", "ZenFlow agent", "files"),
    (r"Domain|Website", "Namecheap", "payments"), (r"Workspace|G-Suite", "Google Workspace", "email"), (r"GPS|Photos|Spend", "Google Takeout", "pii"),
    (r"Fine-tune", "OpenAI", "files"), (r"Server|Lock", "AWS", "code"), (r"Remove BG|Overlay|Template", "Canva", "files"), (r"Label", "Shippo", "pii"),
]
TRIGGER_WORDS = [(r"^\s*(\d+\s*(AM|PM)|Daily|Weekly|Monthly|Quarterly|Random Schedule|Midnight|1st of Month|\d+PM|\d+AM)", "schedule")]
IRREVERSIBLE = re.compile(r"Charge|Pay|Sell|Publish|Post\b|Delete|Revert|Redeploy|Restart|Reboot|Stop if|Send|Email|SMS|Hike|Submit|Ship|Trigger|Transfer|Filing|Activate|Pause|Lock|Bid|Late Fee|Block|Disable|Enable", re.I)

SLUG = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower().replace("’", "").replace("'", "")).strip("-")


def sentences(prompt):
    body = re.sub(r"^Role:\s*[^.]*\.\s*", "", prompt)
    body = re.sub(r"(\d)\.\s", r"\1) ", body)  # keep numbered lists ("1. Public Statement") in one sentence
    parts = [p.strip(" .") for p in re.split(r"(?<=[.!?])\s+(?=[A-Z'\"])", body) if p.strip(" .")]
    return [re.sub(r"^(Task|Method|Goal|Focus|Output):\s*", lambda m: "" if m.group(1) == "Task" else m.group(1) + ": ", p) for p in parts]


def role(prompt):
    m = re.match(r"Role:\s*([^.]*)\.", prompt)
    return m.group(1).strip() if m else ""


def cap(s):
    return s[:1].upper() + s[1:]


def aegis(refusals, escalations, human=True, audit=True, inspect=True):
    seen, out = set(), []
    for r in refusals:
        if r not in seen:
            seen.add(r); out.append(r)
    return dict(refusals=out, escalations=list(dict.fromkeys(escalations)), auditLog=audit, humanInLoop=human, inspectable=inspect)


def price(cat, sec, n):
    if (cat, sec, n) in FREE:
        return dict(model="free", amount=0)
    if cat == "databases":
        return dict(model=DB_PRICE[0], amount=DB_PRICE[1])
    m, a = PRICE[sec]
    return dict(model=m, amount=a)


report = {"dropped": [], "reworked": [], "moved": [], "swapped": [], "renamed": [], "duplicates": [], "pending": []}
used_ids, listings, datasets_cfg = set(), [], {}


def unique_id(base, cat):
    i = base
    if i in used_ids:
        i = f"{base}-{cat[:-1]}"
    n = 2
    while i in used_ids:
        i = f"{base}-{n}"; n += 1
    if i != base:
        report["duplicates"].append(f"{base} → id {i}")
    used_ids.add(i)
    return i


def base_listing(rec, publisher, title, summary, capabilities, inputs, outputs, integrations, scopes, aeg, runtime, tags):
    cat, sec, n = rec["category"], rec["sec"], rec["n"]
    pid = unique_id(rec.get("_id") or SLUG(title), cat)
    pending = publisher in PENDING
    if pending:
        report["pending"].append(f"{title} ({cat[:-1]})")
    note = "Added from the ZenFlow Master Inventory. " + (
        "Waiting for Vital Helix to activate before it can be rented." if pending else "Runs on the ZenFlow runtime API.")
    item = dict(
        id=pid, title=title, summary=summary, audience=AUDIENCE[sec], category=cat, source="collective", publisher=publisher,
        deployedIn=("Held until Vital Helix activates" if pending else "ZenFlow runtime API"),
        capabilities=capabilities, inputs=inputs, outputs=outputs, integrations=integrations, scopes=list(dict.fromkeys(scopes)),
        pricing=price(cat, sec, n), aegis=aeg, version=VERSION, updated=TODAY,
        changelog=[dict(version=VERSION, date=TODAY, note=note)], tags=tags, runtime=runtime,
        inventory=dict(section=f"{sec} {rec['section']}", number=n),
    )
    if pending:
        item["pending"] = True
    listings.append(item)
    return item


def tagify(*words):
    return sorted({w.lower() for w in words if w})


for rec in RAW:
    cat, sec, n = rec["category"], rec["sec"], rec["n"]
    rule = RULES.get((cat, sec, n), {})
    if rule.get("drop"):
        report["dropped"].append(f"{rec['name']} ({sec} #{n}): {rule['drop']}")
        continue

    if cat == "agents":
        publisher = rule.get("publisher", AGENT_SECTION[sec])
        title = rule.get("title", rec["name"].replace('"', "").replace("’", "'"))
        prompt = rule.get("prompt", rec["prompt"])
        r = role(prompt)
        steps = sentences(prompt)
        task = next((x for x in steps if not re.match(r"(Method|Output|Focus|Goal):", x)), steps[0])
        summary = cap(rec["desc"].rstrip(".")) + ". " + cap(task) + "."
        caps = ([f"Works as a {r}"] if r else []) + [cap(x) for x in steps][:4]
        if len(caps) < 2:
            caps.append("Answers in the structure its prompt defines")
        caps += ["Runs on Claude or OpenAI; you pick per call", "Every run written to your audit log"]
        out_line = next((s.split(":", 1)[1].strip() for s in steps if s.startswith("Output:")), "Structured written answer")
        scopes = rule.get("scopes", AGENT_SCOPES.get(sec, ["chat"]))
        refusals = rule.get("refusals", []) + AGENT_REFUSALS[sec]
        escal = rule.get("escalations", []) + ["Request falls outside the role in its prompt: says so instead of improvising"]
        runtime = dict(kind="llm-agent", method="POST", endpoint=f"/api/v1/agents/{{id}}/run", prompt=prompt)
        item = base_listing(rec, publisher, title, summary, caps, ["Your request or text (input)", "Optional context (context)"],
                            [cap(out_line)], ["ZenFlow REST API", "Webhooks", "Anthropic Claude", "OpenAI"], scopes,
                            aegis(refusals, escal), runtime, tagify("agent", rec["section"].split(" ")[0], r.split(" ")[-1] if r else ""))
        if rule.get("prompt") and rule.get("rework"):
            report["reworked"].append(f"{title}: {rule['rework']}")
        elif rule.get("rework"):
            report["renamed"].append(f"{rec['name']} → {title}: {rule['rework']}")

    elif cat == "workflows":
        publisher = rule.get("publisher", WORKFLOW_SECTION[sec])
        title = rule.get("title", rec["name"])
        flow = rule.get("desc", rec["desc"]).rstrip(".")
        steps = [s.strip() for s in flow.split("->") if s.strip()]
        trigger = steps[0]
        sched = bool(re.match(TRIGGER_WORDS[0][0], trigger, re.I))
        ints, scopes = [], []
        for s in steps:
            for pat, app, scope in APPS:
                if re.search(pat, s):
                    ints.append(app); scopes.append(scope); break
        ints = list(dict.fromkeys(ints + ["n8n", "ZenFlow webhooks"]))
        if not scopes:
            scopes = ["chat"]
        if publisher == "Vital Helix":
            scopes.append("health")
        gated = [s for s in steps[1:] if IRREVERSIBLE.search(s)]
        refusals = ["Never runs a step the buyer hasn't connected and switched on", "Never stores the buyer's app credentials; they stay in the buyer's n8n"]
        if gated:
            refusals.append(f"Pauses for approval before: {gated[-1]}")
        escal = ["Any step fails twice: stops and alerts the owner", "Payload missing a required field: stops instead of guessing"]
        summary = " → ".join(steps) + "."
        runtime = dict(kind="n8n-workflow", method="POST", endpoint="/api/v1/workflows/{id}/trigger", n8n="/api/v1/workflows/{id}/n8n.json",
                       trigger=("schedule" if sched else "webhook"), steps=steps)
        caps = [cap(s) for s in steps] + ["Importable n8n workflow with real nodes", "Hosted trigger URL with signed delivery"]
        base_listing(rec, publisher, title, summary, caps, [f"Trigger: {trigger}"], [cap(steps[-1])], ints, scopes,
                     aegis(refusals, escal, human=True), runtime, tagify("workflow", "n8n", rec["section"].split(" ")[0]))
        if rule.get("rework"):
            report["reworked"].append(f"{title}: {rule['rework']}")

    elif cat == "bots":
        publisher = rule.get("publisher", BOT_SECTION[sec])
        title = rule.get("title", rec["name"])
        desc = rule.get("desc", rec["desc"]).rstrip(".")
        platforms = BOT_PLATFORM[sec]
        adapters = [ADAPTER[p] for p in platforms if p in ADAPTER]
        scopes = rule.get("scopes", ["chat"] + (["pii"] if "SMS" in " ".join(platforms) else []))
        refusals = rule.get("refusals", []) + ["Never pretends to be a human when asked", "Never collects personal data the conversation doesn't need"]
        escal = rule.get("escalations", []) + ["User asks for a person: hands off with a summary"]
        prompt = f"You are {title}, a ZenFlow bot. {desc}. Stay in this role, keep replies short enough for chat, and be kind."
        runtime = dict(kind="llm-bot", method="POST", endpoint="/api/v1/bots/{id}/chat", prompt=prompt, adapters=adapters)
        caps = [cap(desc), f"Works in {', '.join(platforms)}", "Keeps context across turns you send", "Every reply written to your audit log"]
        base_listing(rec, publisher, title, cap(desc) + ".", caps, ["Chat messages"], ["Chat replies"],
                     list(dict.fromkeys(platforms + ["ZenFlow REST API", "Anthropic Claude", "OpenAI"])), scopes,
                     aegis(refusals, escal), runtime, tagify("bot", *[p.split(" ")[0] for p in platforms]))
        if rule.get("rework"):
            (report["renamed"] if rule.get("title") else report["reworked"]).append(f"{rec['name']} → {title}: {rule['rework']}")

    else:  # databases
        d = DATASETS[(sec, n)]
        rec = dict(rec, _id=d["id"])
        publisher = d["publisher"]
        src_name, src_home, license_ = d["source"]
        params = [dict(name=p[0], required=p[1], description=p[2], example=p[3]) for p in d["params"]]
        scopes = ["public-web"] + (["health"] if publisher == "Vital Helix" else [])
        refusals = ["Never returns data the source doesn't publish; nothing is invented or interpolated",
                    "Never strips the source's license or attribution"]
        if d.get("rework"):
            refusals.append(d["rework"])
        escal = ["Source is down or rate-limited: returns the source's error, not stale or made-up rows",
                 "Request needs a key the deployment doesn't have: says which one"]
        runtime = dict(kind="dataset", method="GET", endpoint="/api/v1/databases/{id}", source=dict(name=src_name, url=src_home, license=license_),
                       params=params, key=d.get("key"), byo=bool(d.get("byo")))
        caps = [f"Live query against {src_name}", "Normalized JSON rows with the source and license on every response",
                "Grounds a ZenFlow agent with real data (pass rows as context)"]
        item = base_listing(rec, publisher, d["title"], d["summary"], caps,
                            [f"{p['name']}{'' if p['required'] else ' (optional)'}: {p['description']}" for p in params] or ["No parameters"],
                            ["JSON rows from the source"], [src_name, "ZenFlow REST API"], scopes,
                            aegis(refusals, escal), runtime, tagify("database", rec["section"].split(" ")[0], "public data"))
        datasets_cfg[item["id"]] = dict(handler=d["handler"], cfg=d["cfg"], key=d.get("key"), params=params,
                                        source=dict(name=src_name, url=src_home, license=license_))
        if d.get("swap"):
            report["swapped"].append(f"{rec['name']} → {d['title']}: {d['swap']}")
        elif d.get("rework"):
            report["reworked"].append(f"{rec['name']} → {d['title']}: {d['rework']}")
        if d["title"].split(" (")[0].lower() != rec["name"].lower() and not d.get("swap") and not d.get("rework"):
            report["renamed"].append(f"{rec['name']} → {d['title']}")

    if cat != "databases" and publisher != (AGENT_SECTION if cat == "agents" else WORKFLOW_SECTION if cat == "workflows" else BOT_SECTION)[sec]:
        report["moved"].append(f"{listings[-1]['title']} → {publisher}")

# Fill the runtime endpoints with each listing's id.
for it in listings:
    for k in ("endpoint", "n8n"):
        if it["runtime"].get(k):
            it["runtime"][k] = it["runtime"][k].replace("{id}", it["id"])

os.makedirs(os.path.join(ROOT, "api", "_lib"), exist_ok=True)
json.dump(listings, open(os.path.join(ROOT, "src", "data", "inventory.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(datasets_cfg, open(os.path.join(ROOT, "api", "_lib", "datasets.json"), "w"), ensure_ascii=False, indent=1)

counts = {}
for it in listings:
    counts[it["category"]] = counts.get(it["category"], 0) + 1
by_pub = {}
for it in listings:
    by_pub[it["publisher"]] = by_pub.get(it["publisher"], 0) + 1

lines = [
    "# ZenFlow Master Inventory: validation report", "",
    f"Generated {TODAY} by `tools/inventory/build.py` from `tools/inventory/master-inventory.txt` (the PDF's text).", "",
    f"The PDF lists 400 assets. **{len(listings)} are listed**; {len(report['dropped'])} were dropped.", "",
    "| Category | Listed |", "|---|---|", *[f"| {k} | {v} |" for k, v in counts.items()], "",
    "| Division | Listed |", "|---|---|", *[f"| {k}{' (pending activation)' if k in PENDING else ''} | {v} |" for k, v in sorted(by_pub.items(), key=lambda x: -x[1])], "",
    "Prices are provisional, set per section in `build.py` (`PRICE`, `DB_PRICE`).", "",
]
for key, head in [("dropped", "Dropped"), ("reworked", "Reworked for safety, law or accuracy"), ("swapped", "Paid datasets swapped for real public sources"),
                  ("renamed", "Renamed"), ("moved", "Moved to the division that does the work"), ("pending", "Held for Vital Helix (listed, not rentable)"),
                  ("duplicates", "Same name in two categories (both kept, ids differ)")]:
    lines += [f"## {head} ({len(report[key])})", ""] + [f"- {x}" for x in report[key]] + [""]
os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
open(os.path.join(ROOT, "docs", "INVENTORY-VALIDATION.md"), "w", encoding="utf8").write("\n".join(lines))
print(counts, "total", len(listings), {k: len(v) for k, v in report.items()})
