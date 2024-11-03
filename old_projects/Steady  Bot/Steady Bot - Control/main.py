import uvicorn
from fastapi import FastAPI, Request, HTTPException, Form
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from backend import DiscordAuth, db

CLIENT_ID = "1278426286561427486"
CLIENT_SECRET = "-dSSl8LZ6JHiGggq2c7Cxb6AFiq5tcCg"
REDIRECT_URI = "http://localhost:5500/callback"
LOGIN_URL = f"https://discord.com/oauth2/authorize?client_id={CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}&scope=identify+guilds"

app = FastAPI()
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/panel")

api = DiscordAuth(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

@app.on_event("startup")
async def on_startup():
    await api.setup()
    await db.setup()

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "login_url": LOGIN_URL})

@app.get("/callback")
async def callback(code: str):
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    result = await api.get_token_response(data)
    if result is None:
        raise HTTPException(status_code=401, detail="Invalid Auth Code")

    token, refresh_token, expires_in = result
    user = await api.get_user(token)
    user_id = user.get("id")

    session_id = await db.add_session(token, refresh_token, expires_in, user_id)

    response = RedirectResponse(url="/guilds")
    response.set_cookie(key="session_id", value=session_id, httponly=True)
    return response

@app.get("/guilds")
async def guilds(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="no auth")
    
    session = await db.get_session(session_id)
    token, refresh_token, token_expires_at, user_id = session

    user = await api.get_user(token)
    user_guilds = await api.get_guilds(token)

    admin_guilds = [
        {
            "id": guild["id"],
            "name": guild["name"],
            "icon": f"https://cdn.discordapp.com/icons/{guild['id']}/{guild['icon']}.png" if guild["icon"] else "/static/default_icon.png"
        }
        for guild in user_guilds if (guild["permissions"] & 0x8) == 0x8
    ]

    return templates.TemplateResponse(
        "guild.html",
        {
            "request": request,
            "global_name": user["global_name"],
            "guilds": admin_guilds
        }
    )

@app.get("/guilds/{guild_id}/dashboard")
async def dashboard(request: Request, guild_id: str):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="no auth")
    
    command_settings = {
        "ban": await db.get_command_settings(guild_id, "ban"),
        "kick": await db.get_command_settings(guild_id, "kick"),
        "timeout": await db.get_command_settings(guild_id, "timeout"),
        "ping": await db.get_command_settings(guild_id, "ping"),
        "say": await db.get_command_settings(guild_id, "say")
    }

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "guild_id": guild_id,
            "command_settings": command_settings
        }
    )

@app.post("/guilds/{guild_id}/dashboard/save_commands")
async def save_command_settings(request: Request, guild_id: str):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="no auth")
    
    form = await request.form()
    for command_name in ["ban", "kick", "timeout", "ping", "say"]:
        enabled = 1 if form.get(command_name) else 0
        await db.set_command_settings(guild_id, command_name, enabled)

    return RedirectResponse(url=f"/guilds/{guild_id}/dashboard", status_code=303)

if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=5500, reload=True)
