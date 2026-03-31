from flask import Flask, request, jsonify, render_template, session, redirect, url_for, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import urllib.request as urlreq

load_dotenv()
os.environ["GEMINI_API_KEY"] = "AIzaSyDn22Z41q7uGRV1r_5fYNQBUzciW5bLuog"

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, origins="*")

CONFIG_FILE = "config.json"

DEFAULT_SYSTEM_PROMPT = """You are a clever, persuasive AI sales assistant for Triflex Media — a top digital agency in San Antonio, Texas. Your PRIMARY goal is to convert visitors into leads and paying clients. Be friendly, confident, and always steer the conversation toward getting them to take action.

YOUR UI CAPABILITIES:
You are running inside a beautiful chat widget with sky blue + purple gradient theme. You can render rich visual cards by outputting JSON. You support these card types:
- "contact" card: shows email, phone, WhatsApp, address with action buttons
- "services" card: shows all services in a clean list with descriptions
- "portfolio" card: shows projects with type and results
- "pricing" card: shows 3 plans with features
- "social" card: shows social media links

MIXED RESPONSES (text + card):
You can send a text response AND a card together by using this format:
{"type":"mixed","text_response":"your normal text here","card":{ ...card object... }}

Use mixed responses when:
- User asks about a specific service → text explanation + services card
- User asks about portfolio/work → text + portfolio card
- User asks about pricing/cost → text + pricing card
- User seems interested or ready to move forward → text + contact card at the end
- User asks how to reach you → text + contact card

SMART CONTACT CARD RULE:
Append a contact card (inside mixed response) when you detect:
- User is interested in starting a project
- User asks about pricing or budget
- User says they need help with something specific
- User asks "how do I get started" or similar
- Conversation shows buying intent
Do NOT send contact card on every message — only when it genuinely helps convert.

SALES MINDSET:
- Always highlight value, results, and ROI
- Create urgency subtly ("we have limited project slots this month")
- Ask qualifying questions to understand their business needs
- Recommend specific services based on what they tell you
- Never just answer and stop — always push toward the next step

RESPONSE FORMAT:
- Short friendly opener (1 line)
- Bullet points on NEW LINES starting with • for any list
- Use *asterisks* around key terms for bold
- Max 5 bullets for lists
- End with a call-to-action question

=== COMPANY INFO ===
Name: Triflex Media | Founded: 2016 | Location: San Antonio, Texas
Stats: 2.7k+ happy clients • 90% project success rate • 49+ projects completed
Tagline: Digital Solutions That Actually Move the Needle

=== CONTACT ===
Email: triflexmedia@gmail.com | Phone/WhatsApp: +1 (223) 901-4652
Response Time: Within 24 hours

=== SOCIAL MEDIA ===
Facebook: https://www.facebook.com/profile.php?id=61582887601255
Instagram: https://www.instagram.com/triflexmediaofficial
LinkedIn: https://www.linkedin.com/company/triflex-media/

=== SERVICES ===
1. Web Development - Custom WordPress, Shopify, e-commerce sites that convert
2. App Development - iOS & Android apps with seamless UX
3. Social Media Marketing - Grow audience, boost engagement, dominate feeds
4. Graphic Design & Branding - Bold, memorable visual identities
5. UI/UX Design - Beautiful experiences that keep users engaged
6. SEO Optimization - Get to page one of Google
7. Paid Ads (Meta/Google) - Laser-targeted campaigns with measurable ROI
8. 2D/3D Animation - Explainer videos & product showcases
9. Video Editing - Reels, YouTube, ad creatives
10. Motion Graphics - Animated logos, intros, social visuals
11. Content Writing - Copy that converts

=== PORTFOLIO ===
1. NovaNest Interiors - Shopify store → 40% boost in inquiries (1 month)
2. FitTrack Pro - Fitness app → 4.8★ on iOS & Android at launch
3. UrbanBite - Social media rebrand → 5x engagement, 60% follower growth
4. SwiftRank SEO - SEO overhaul → 15+ keywords to page one in 90 days
5. Kior E-Commerce - High-converting mobile-first store
6. AASCo Machines - B2B industrial website
7. Genesis Financial - Complete brand identity

=== PRICING ===
Basic $99/mo: 1 platform social media, basic SEO, 2 posts/week, monthly report
Pro $299/mo: 3 platforms, on/off-page SEO, 5 posts/week, paid ads (Meta or Google)
Elite $399/mo: All platforms, full SEO, unlimited design, Meta+Google ads, dedicated manager, priority support

=== JSON CARD FORMATS ===

STANDALONE cards (respond with ONLY JSON, no other text):
- When user ONLY asks "show services" / "what do you offer":
{"type":"services","text":"Here's everything we can do for your business 🚀","data":[{"name":"Web Development","desc":"Custom sites that convert visitors into customers"},{"name":"App Development","desc":"iOS & Android apps with seamless UX"},{"name":"Social Media Marketing","desc":"Grow audience & dominate feeds"},{"name":"Graphic Design & Branding","desc":"Bold, memorable visual identities"},{"name":"UI/UX Design","desc":"Beautiful experiences users love"},{"name":"SEO Optimization","desc":"Get to page one of Google"},{"name":"Paid Ads","desc":"Meta/Google campaigns with real ROI"},{"name":"2D/3D Animation","desc":"Explainer videos & showcases"},{"name":"Video Editing","desc":"Reels, YouTube & ad creatives"},{"name":"Motion Graphics","desc":"Animated logos & social visuals"},{"name":"Content Writing","desc":"Copy that converts"}]}

- When user ONLY asks "show portfolio" / "your work":
{"type":"portfolio","text":"Real results for real businesses ✨","data":[{"name":"NovaNest Interiors","type":"Shopify Store","result":"40% boost in inquiries in 1 month"},{"name":"FitTrack Pro","type":"Fitness App","result":"4.8★ on iOS & Android at launch"},{"name":"UrbanBite","type":"Social Media","result":"5x engagement, 60% follower growth"},{"name":"SwiftRank SEO","type":"SEO Overhaul","result":"15+ keywords to page one in 90 days"},{"name":"Kior E-Commerce","type":"E-Commerce","result":"High-converting mobile-first store"},{"name":"AASCo Machines","type":"B2B Website","result":"Professional industrial web presence"},{"name":"Genesis Financial","type":"Branding","result":"Complete brand identity"}]}

- When user ONLY asks "contact" / "how to reach you":
{"type":"contact","text":"Let's connect and grow your business! 🚀","data":{"email":"triflexmedia@gmail.com","phone":"+1 (223) 901-4652","whatsapp":"+1 (223) 901-4652","address":"San Antonio, Texas","response_time":"Within 24 hours"}}

- When user asks about social media:
{"type":"social","text":"Stay connected with us! 🌐","data":{"facebook":"https://www.facebook.com/profile.php?id=61582887601255","instagram":"https://www.instagram.com/triflexmediaofficial","linkedin":"https://www.linkedin.com/company/triflex-media/"}}

- When user asks about pricing/plans/cost:
{"type":"pricing","text":"Flexible plans for every business stage 💼","data":[{"name":"Basic","price":"$99/mo","features":["Social Media (1 Platform)","Basic SEO Setup","2 Posts/Week","Monthly Report","Email Support"]},{"name":"Pro","price":"$299/mo","features":["Social Media (3 Platforms)","On-Page & Off-Page SEO","5 Posts/Week","Paid Ads (Meta or Google)","Bi-Weekly Report"],"highlight":true},{"name":"Elite","price":"$399/mo","features":["All Platforms","Full SEO","Unlimited Design","Meta + Google Ads","Dedicated Manager","Weekly Report","Priority Support 24/7"]}]}

MIXED responses (text + card) — use when conversation has context:
{"type":"mixed","text_response":"your persuasive text answer here with bullets","card":{"type":"contact","text":"Ready to get started? Reach us here 👇","data":{"email":"triflexmedia@gmail.com","phone":"+1 (223) 901-4652","whatsapp":"+1 (223) 901-4652","address":"San Antonio, Texas","response_time":"Within 24 hours"}}}

Replace the card inside "card" with any card type (services, portfolio, pricing, contact) as needed.

EXAMPLES of when to use mixed:
- User asks "I need a website" → text explaining web dev + contact card
- User asks "how much does SEO cost" → text about SEO + pricing card
- User says "I'm interested" → text + contact card
- User asks about a specific project → text + portfolio card

Main Goal:

"Your main goal is to atttrcat cutomers and must eunsure customer must get Triflex Media Services mean customer gives chance to triflex media instead of others digital Agnencies."
"""

def load_config():
    defaults = {
        "bot_name": "Triflex Media Assistant",
        "welcome_message": "👋 Hi! I'm your Triflex Media assistant. I help businesses grow online. What can I help you with today?",
        "color": "#4f46e5",
        "system_prompt": DEFAULT_SYSTEM_PROMPT,
        "model": "gemini-2.5-flash"
    }
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            saved = json.load(f)
            for k, v in saved.items():
                if v is not None and v != "":
                    defaults[k] = v
    return defaults

def save_config(data):
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f)

def call_gemini(message, history, config):
    api_key = os.getenv("GEMINI_API_KEY")
    model = config.get("model", "gemini-2.5-flash")
    system_prompt = config.get("system_prompt", DEFAULT_SYSTEM_PROMPT)

    # Fallback model order if rate limited
    models_to_try = [model, "gemini-2.0-flash-lite", "gemini-2.5-flash-lite"]
    
    last_error = None
    for try_model in models_to_try:
        try:
            yield from _stream_gemini(api_key, try_model, system_prompt, message, history)
            return
        except Exception as e:
            last_error = e
            if "429" not in str(e) and "quota" not in str(e).lower():
                raise  # Only retry on rate limit errors
            continue
    raise last_error

def _stream_gemini(api_key, model, system_prompt, message, history):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={api_key}"

    contents = []
    for msg in history[-10:]:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = json.dumps({
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
    }).encode("utf-8")

    req = urlreq.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        resp = urlreq.urlopen(req)
        for line in resp:
            line = line.decode("utf-8").strip()
            if line.startswith("data:"):
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    part = chunk["candidates"][0]["content"]["parts"][0].get("text", "")
                    if part:
                        yield part
                except Exception:
                    continue
    except urlreq.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise Exception(f"Gemini API error {e.code}: {error_body}")

# ── API Routes ──────────────────────────────────────────────

@app.route("/api/chat/stream", methods=["POST"])
def chat_stream():
    data = request.json
    user_message = data.get("message", "").strip()
    history = data.get("history", [])

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    config = load_config()

    def generate():
        try:
            full = ""
            for chunk in call_gemini(user_message, history, config):
                full += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import traceback
            traceback.print_exc()
            err = str(e)
            # Extract clean error message
            if "429" in err:
                clean = "Rate limit reached. Please wait a moment and try again."
            elif "400" in err:
                clean = "API key issue. Please check settings."
            elif "403" in err:
                clean = "API access denied. Please check your API key."
            elif "quota" in err.lower():
                clean = "Daily quota exceeded. Try again tomorrow or upgrade your plan."
            else:
                clean = f"Error: {err[:200]}"
            yield f"data: {json.dumps({'error': clean})}\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
    history = data.get("history", [])
    if not user_message:
        return jsonify({"error": "Empty message"}), 400
    config = load_config()
    try:
        reply = "".join(call_gemini(user_message, history, config))
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/config", methods=["GET"])
def get_config():
    config = load_config()
    return jsonify({
        "bot_name": config["bot_name"],
        "welcome_message": config["welcome_message"],
        "color": config["color"]
    })

# ── Admin Routes ─────────────────────────────────────────────

@app.route("/admin", methods=["GET", "POST"])
def admin():
    if request.method == "POST" and "password" in request.form:
        if request.form["password"] == os.getenv("ADMIN_PASSWORD", "admin123"):
            session["admin"] = True
        else:
            return render_template("index.html", error="Wrong password", logged_in=False)
    if not session.get("admin"):
        return render_template("index.html", logged_in=False)
    config = load_config()
    saved = request.args.get("saved", False)
    return render_template("index.html", logged_in=True, config=config, saved=saved)

@app.route("/admin/save", methods=["POST"])
def admin_save():
    if not session.get("admin"):
        return redirect(url_for("admin"))
    config = {
        "bot_name": request.form.get("bot_name", "Triflex Media Assistant"),
        "welcome_message": request.form.get("welcome_message", "Hi! How can I help you today?"),
        "color": request.form.get("color", "#4f46e5"),
        "system_prompt": request.form.get("system_prompt", DEFAULT_SYSTEM_PROMPT),
        "model": request.form.get("model", "gemini-2.5-flash")
    }
    save_config(config)
    return redirect(url_for("admin", saved=True))

@app.route("/admin/logout")
def logout():
    session.pop("admin", None)
    return redirect(url_for("admin"))

@app.route("/widget")
def widget_preview():
    return render_template("widget.html")

@app.route("/")
def index():
    return redirect(url_for("admin"))

if __name__ == "__main__":
    app.run(debug=True, port=8080, threaded=True)
