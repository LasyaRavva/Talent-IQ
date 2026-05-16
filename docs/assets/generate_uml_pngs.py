from PIL import Image, ImageDraw, ImageFont
from pathlib import Path


OUTPUT_DIR = Path(__file__).resolve().parent
BG = "white"
FG = "black"
ACCENT = "#1f4e79"
LIGHT = "#eaf2f8"
LINE = "#2f2f2f"


def load_font(size, bold=False):
    candidates = []
    if bold:
        candidates = ["arialbd.ttf", "seguisb.ttf", "calibrib.ttf"]
    else:
        candidates = ["arial.ttf", "segoeui.ttf", "calibri.ttf"]

    for name in candidates:
        try:
            return ImageFont.truetype(name, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


TITLE_FONT = load_font(28, bold=True)
SUBTITLE_FONT = load_font(20, bold=True)
TEXT_FONT = load_font(16)
SMALL_FONT = load_font(14)


def new_canvas(width, height, title, subtitle=None):
    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, width - 1, height - 1), outline=ACCENT, width=3)
    draw.text((30, 20), title, fill=ACCENT, font=TITLE_FONT)
    if subtitle:
      draw.text((30, 58), subtitle, fill=LINE, font=TEXT_FONT)
    return img, draw


def centered_text(draw, box, text, font, fill=FG, spacing=4):
    x1, y1, x2, y2 = box
    bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align="center")
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = x1 + (x2 - x1 - tw) / 2
    y = y1 + (y2 - y1 - th) / 2
    draw.multiline_text((x, y), text, fill=fill, font=font, spacing=spacing, align="center")


def box(draw, rect, text, fill=LIGHT, outline=ACCENT, font=TEXT_FONT, radius=16):
    draw.rounded_rectangle(rect, radius=radius, fill=fill, outline=outline, width=2)
    centered_text(draw, rect, text, font)


def actor(draw, center_x, top_y, label):
    head_r = 18
    draw.ellipse((center_x - head_r, top_y, center_x + head_r, top_y + 2 * head_r), outline=LINE, width=3)
    body_y = top_y + 2 * head_r
    draw.line((center_x, body_y, center_x, body_y + 48), fill=LINE, width=3)
    draw.line((center_x - 30, body_y + 18, center_x + 30, body_y + 18), fill=LINE, width=3)
    draw.line((center_x, body_y + 48, center_x - 24, body_y + 84), fill=LINE, width=3)
    draw.line((center_x, body_y + 48, center_x + 24, body_y + 84), fill=LINE, width=3)
    label_box = (center_x - 70, body_y + 95, center_x + 70, body_y + 125)
    centered_text(draw, label_box, label, SMALL_FONT)


def arrow(draw, start, end, fill=LINE, width=3, arrow_size=10):
    draw.line((start, end), fill=fill, width=width)
    x1, y1 = start
    x2, y2 = end
    dx = x2 - x1
    dy = y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    tip = (x2, y2)
    left = (x2 - ux * arrow_size - px * arrow_size * 0.6, y2 - uy * arrow_size - py * arrow_size * 0.6)
    right = (x2 - ux * arrow_size + px * arrow_size * 0.6, y2 - uy * arrow_size + py * arrow_size * 0.6)
    draw.polygon([tip, left, right], fill=fill)


def label(draw, pos, text, font=SMALL_FONT, fill=LINE):
    draw.text(pos, text, font=font, fill=fill)


def draw_use_case():
    img, draw = new_canvas(
        1600,
        980,
        "Talent IQ - UML Use Case Diagram",
        "Actors interact with the integrated interview preparation platform.",
    )

    system_rect = (340, 120, 1280, 900)
    draw.rounded_rectangle(system_rect, radius=24, outline=ACCENT, width=3)
    draw.text((700, 132), "Talent IQ System", fill=ACCENT, font=SUBTITLE_FONT)

    actor(draw, 150, 250, "User")
    actor(draw, 1450, 210, "Authentication\nService")
    actor(draw, 1450, 420, "AI Service")
    actor(draw, 1450, 650, "Code Execution\nService")

    use_cases = [
        ((500, 200, 760, 255), "Sign In"),
        ((860, 200, 1140, 255), "View Dashboard"),
        ((500, 310, 760, 365), "Create / Join Session"),
        ((860, 310, 1140, 365), "View Problems"),
        ((500, 420, 760, 475), "Run Code"),
        ((860, 420, 1140, 475), "Ask AI Coach"),
        ((500, 530, 760, 585), "Start Mock Interview"),
        ((860, 530, 1140, 585), "Upload Resume"),
        ((680, 650, 960, 705), "Analyze Resume"),
        ((680, 770, 960, 825), "Download Feedback"),
    ]

    for rect, text in use_cases:
        box(draw, rect, text)

    user_targets = [
        (500, 228), (860, 228), (500, 338), (860, 338), (500, 448),
        (860, 448), (500, 558), (860, 558), (680, 678), (680, 798),
    ]
    for tx, ty in user_targets:
        arrow(draw, (230, 270), (tx, ty))

    arrow(draw, (1370, 250), (1140, 228))
    arrow(draw, (1370, 460), (1140, 448))
    arrow(draw, (1370, 500), (1140, 558))
    arrow(draw, (1370, 690), (760, 448))

    img.save(OUTPUT_DIR / "uml-use-case-diagram.png")


def draw_activity():
    img, draw = new_canvas(
        1400,
        1500,
        "Talent IQ - UML Activity Diagram",
        "Main user flow across authentication, modules, and feedback loops.",
    )

    x = 480
    w = 440
    y = 120
    step_h = 70
    gap = 34

    def step(text, current_y):
        rect = (x, current_y, x + w, current_y + step_h)
        box(draw, rect, text)
        return rect

    def connect(rect1, rect2, note=None):
        p1 = ((rect1[0] + rect1[2]) // 2, rect1[3])
        p2 = ((rect2[0] + rect2[2]) // 2, rect2[1])
        arrow(draw, p1, p2)
        if note:
            label(draw, (p1[0] + 12, (p1[1] + p2[1]) // 2 - 10), note)

    draw.ellipse((660, 100, 740, 140), fill="#d9ead3", outline=ACCENT, width=2)
    centered_text(draw, (660, 100, 740, 140), "Start", SMALL_FONT)

    r1 = step("Open Application", y + 50)
    r2 = step("Check Authentication", r1[3] + gap)
    r3 = step("Open Dashboard", r2[3] + gap + 30)
    r4 = step("Select Module", r3[3] + gap)

    connect((660, 140, 740, 140), r1)
    connect(r1, r2)

    diamond = [(700, r2[3] + 25), (850, r2[3] + 95), (700, r2[3] + 165), (550, r2[3] + 95)]
    draw.polygon(diamond, fill="#fff2cc", outline=ACCENT)
    centered_text(draw, (550, r2[3] + 40, 850, r2[3] + 150), "User Logged In?", TEXT_FONT)
    arrow(draw, ((r2[0] + r2[2]) // 2, r2[3]), (700, r2[3] + 25))

    login_rect = (90, r2[3] + 60, 360, r2[3] + 130)
    box(draw, login_rect, "Redirect to Login Page")
    arrow(draw, (550, r2[3] + 95), (360, r2[3] + 95))
    label(draw, (430, r2[3] + 66), "No")

    arrow(draw, (700, r2[3] + 165), ((r3[0] + r3[2]) // 2, r3[1]))
    label(draw, (725, r2[3] + 190), "Yes")
    connect(r3, r4)

    mod_y = r4[3] + 80
    problems = (120, mod_y, 400, mod_y + 90)
    ai = (500, mod_y, 780, mod_y + 90)
    resume = (880, mod_y, 1160, mod_y + 90)
    sessions = (500, mod_y + 180, 780, mod_y + 270)
    box(draw, problems, "Problems Module")
    box(draw, ai, "AI Coach Module")
    box(draw, resume, "Resume Checker Module")
    box(draw, sessions, "Sessions Module")

    start_mod = ((r4[0] + r4[2]) // 2, r4[3])
    arrow(draw, start_mod, ((problems[0] + problems[2]) // 2, problems[1]))
    arrow(draw, start_mod, ((ai[0] + ai[2]) // 2, ai[1]))
    arrow(draw, start_mod, ((resume[0] + resume[2]) // 2, resume[1]))
    arrow(draw, start_mod, ((sessions[0] + sessions[2]) // 2, sessions[1]))

    pflow = (80, mod_y + 140, 440, mod_y + 340)
    aflow = (460, mod_y + 140, 820, mod_y + 340)
    rflow = (840, mod_y + 140, 1200, mod_y + 340)
    sflow = (460, mod_y + 320, 820, mod_y + 470)
    box(draw, pflow, "Select Problem\nChoose Language\nWrite Code\nRun Code\nGet Output")
    box(draw, aflow, "Enter Question\nSend to AI\nReceive Explanation\nShow Feedback")
    box(draw, rflow, "Upload Resume\nAdd Job Description\nAnalyze Match\nShow Score")
    box(draw, sflow, "Create / Join Session\nEnter Room\nCollaborate Live")

    arrow(draw, ((problems[0] + problems[2]) // 2, problems[3]), ((pflow[0] + pflow[2]) // 2, pflow[1]))
    arrow(draw, ((ai[0] + ai[2]) // 2, ai[3]), ((aflow[0] + aflow[2]) // 2, aflow[1]))
    arrow(draw, ((resume[0] + resume[2]) // 2, resume[3]), ((rflow[0] + rflow[2]) // 2, rflow[1]))
    arrow(draw, ((sessions[0] + sessions[2]) // 2, sessions[3]), ((sflow[0] + sflow[2]) // 2, sflow[1]))

    end_rect = (620, 1370, 780, 1420)
    draw.ellipse(end_rect, fill="#f4cccc", outline=ACCENT, width=2)
    centered_text(draw, end_rect, "End", SMALL_FONT)
    arrow(draw, ((pflow[0] + pflow[2]) // 2, pflow[3]), (700, 1370))
    arrow(draw, ((aflow[0] + aflow[2]) // 2, aflow[3]), (700, 1370))
    arrow(draw, ((rflow[0] + rflow[2]) // 2, rflow[3]), (700, 1370))
    arrow(draw, ((sflow[0] + sflow[2]) // 2, sflow[3]), (700, 1370))

    img.save(OUTPUT_DIR / "uml-activity-diagram.png")


def draw_sequence_code():
    img, draw = new_canvas(
        1700,
        1100,
        "Talent IQ - UML Sequence Diagram (Code Execution)",
        "Problem solving flow from frontend to backend and Judge0.",
    )

    participants = [
        ("User", 120),
        ("Problem Page", 420),
        ("Backend API", 760),
        ("Code Controller", 1100),
        ("Judge0", 1450),
    ]

    top_y = 120
    lifeline_top = 250
    lifeline_bottom = 980

    for name, x in participants:
        box(draw, (x - 90, top_y, x + 90, top_y + 70), name, font=SMALL_FONT)
        draw.line((x, lifeline_top, x, lifeline_bottom), fill=LINE, width=2)

    messages = [
        (120, 420, 290, "Select problem,\nlanguage, enter code"),
        (120, 420, 390, "Click Run Code"),
        (420, 760, 510, "POST /api/code/execute"),
        (760, 1100, 610, "Validate request"),
        (1100, 1450, 710, "Execute source code"),
        (1450, 1100, 810, "Return output / error"),
        (1100, 760, 900, "Build response"),
        (760, 420, 990, "Execution result"),
        (420, 420, 1060, "Normalize output\nand compare"),
        (420, 120, 1140, "Show pass/fail feedback"),
    ]

    for sx, ex, y, text in messages:
        arrow(draw, (sx, y), (ex, y))
        label(draw, ((sx + ex) // 2 - 70, y - 26), text)

    img.save(OUTPUT_DIR / "uml-sequence-code-execution.png")


def draw_sequence_resume():
    img, draw = new_canvas(
        1800,
        1200,
        "Talent IQ - UML Sequence Diagram (Resume Checker)",
        "Resume upload, extraction, AI analysis, and feedback delivery flow.",
    )

    participants = [
        ("User", 120),
        ("Resume Checker Page", 420),
        ("Backend API", 760),
        ("AI Controller", 1080),
        ("Resume Extractor", 1400),
        ("AI Service", 1680),
    ]

    top_y = 120
    lifeline_top = 250
    lifeline_bottom = 1080

    for name, x in participants:
        box(draw, (x - 100, top_y, x + 100, top_y + 70), name, font=SMALL_FONT)
        draw.line((x, lifeline_top, x, lifeline_bottom), fill=LINE, width=2)

    messages = [
        (120, 420, 300, "Upload DOCX resume\n+ enter job description"),
        (120, 420, 390, "Click Analyze"),
        (420, 760, 480, "POST /resume-check/stream"),
        (760, 1080, 570, "Validate file and input"),
        (1080, 1400, 660, "Extract text from DOCX"),
        (1400, 1080, 750, "Return resume text"),
        (1080, 1680, 840, "Send resume + job description"),
        (1680, 1080, 930, "Return streamed analysis"),
        (1080, 760, 1020, "Build response"),
        (760, 420, 1090, "Score + suggestions"),
        (420, 120, 1160, "Display analysis"),
    ]

    for sx, ex, y, text in messages:
        arrow(draw, (sx, y), (ex, y))
        label(draw, ((sx + ex) // 2 - 85, y - 26), text)

    img.save(OUTPUT_DIR / "uml-sequence-resume-checker.png")


def draw_component():
    img, draw = new_canvas(
        1600,
        1000,
        "Talent IQ - UML Component Diagram",
        "High-level architecture showing frontend, backend, database, and external services.",
    )

    frontend = (120, 250, 420, 470)
    backend = (620, 220, 980, 500)
    db = (1180, 220, 1450, 380)
    auth = (1180, 420, 1450, 530)
    judge = (1180, 570, 1450, 680)
    ai = (1180, 720, 1450, 830)
    stream = (620, 620, 980, 820)

    box(draw, frontend, "Frontend\nReact Pages\nComponents\nHooks\nCode Editor UI", font=SUBTITLE_FONT)
    box(draw, backend, "Backend\nNode.js + Express\nRoutes\nControllers\nMiddleware", font=SUBTITLE_FONT)
    box(draw, db, "MongoDB\nUser/Session Data", font=SUBTITLE_FONT)
    box(draw, auth, "Clerk Auth\nAuthentication", font=SUBTITLE_FONT)
    box(draw, judge, "Judge0\nCode Execution", font=SUBTITLE_FONT)
    box(draw, ai, "AI Service\nOllama / OpenAI", font=SUBTITLE_FONT)
    box(draw, stream, "Session / Streaming Services\nLive Rooms\nAvatar / Video Features", font=SUBTITLE_FONT)

    arrow(draw, (420, 360), (620, 360))
    label(draw, (485, 330), "API requests")
    arrow(draw, (980, 290), (1180, 290))
    label(draw, (1030, 260), "DB access")
    arrow(draw, (980, 455), (1180, 475))
    label(draw, (1015, 430), "Auth validation")
    arrow(draw, (980, 590), (1180, 625))
    label(draw, (1020, 575), "Execute code")
    arrow(draw, (980, 770), (1180, 775))
    label(draw, (1030, 740), "AI requests")
    arrow(draw, (800, 500), (800, 620))
    label(draw, (822, 545), "Live session flow")

    img.save(OUTPUT_DIR / "uml-component-diagram.png")


def main():
    draw_use_case()
    draw_activity()
    draw_sequence_code()
    draw_sequence_resume()
    draw_component()
    print("Generated UML PNG files in", OUTPUT_DIR)


if __name__ == "__main__":
    main()
